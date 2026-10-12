import { getPool, row, rows } from '../../../../shared/postgres.js';
import { pagination } from '../../../../shared/config.js';

export const initFocus = async () => {
  await getPool().query(`CREATE TABLE IF NOT EXISTS focus_sessions(
    id UUID PRIMARY KEY,user_id UUID NOT NULL,mode VARCHAR(20) NOT NULL,
    planned_minutes INT NOT NULL CHECK(planned_minutes BETWEEN 1 AND 240),
    actual_minutes INT NOT NULL DEFAULT 0,label VARCHAR(120),completed BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),ended_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,paused_seconds INT NOT NULL DEFAULT 0
  );
  ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
  ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS paused_seconds INT NOT NULL DEFAULT 0;
  CREATE INDEX IF NOT EXISTS focus_user_idx ON focus_sessions(user_id,started_at DESC);`);
};

export const focusModel = {
  list: async (userId, args) => {
    const { limit, offset } = pagination(args);
    const items = await rows('SELECT * FROM focus_sessions WHERE user_id=$1 ORDER BY started_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset]);
    const count = await row('SELECT count(*)::int total FROM focus_sessions WHERE user_id=$1', [userId]);
    return { items, total: count.total, hasMore: offset + items.length < count.total };
  },
  stats: (userId, timezone = 'UTC') => row(`SELECT
    COALESCE(sum(actual_minutes) FILTER(WHERE completed),0)::int total_minutes,
    count(*) FILTER(WHERE completed)::int completed_sessions,
    COALESCE(avg(actual_minutes) FILTER(WHERE completed),0)::float average_minutes,
    COALESCE(sum(actual_minutes) FILTER(WHERE completed AND started_at>=date_trunc('day',now() AT TIME ZONE $2) AT TIME ZONE $2),0)::int today_minutes,
    COALESCE(sum(actual_minutes) FILTER(WHERE completed AND started_at>=date_trunc('week',now() AT TIME ZONE $2) AT TIME ZONE $2),0)::int week_minutes
    FROM focus_sessions WHERE user_id=$1`, [userId, timezone]),
  start: (id, userId, mode, minutes, label) => row(
    'INSERT INTO focus_sessions(id,user_id,mode,planned_minutes,label)VALUES($1,$2,$3,$4,$5)RETURNING *',
    [id, userId, mode, minutes, label]
  ),
  pause: (id, userId) => row(
    'UPDATE focus_sessions SET paused_at=now() WHERE id=$1 AND user_id=$2 AND ended_at IS NULL AND paused_at IS NULL RETURNING *',
    [id, userId]
  ),
  resume: (id, userId) => row(
    'UPDATE focus_sessions SET paused_seconds=paused_seconds+GREATEST(0,extract(epoch from(now()-paused_at))::int),paused_at=NULL WHERE id=$1 AND user_id=$2 AND ended_at IS NULL AND paused_at IS NOT NULL RETURNING *',
    [id, userId]
  ),
  complete: (id, userId) => row(`UPDATE focus_sessions SET
    completed=true,ended_at=now(),
    actual_minutes=GREATEST(1,LEAST(planned_minutes,round((extract(epoch from(now()-started_at))-paused_seconds-CASE WHEN paused_at IS NULL THEN 0 ELSE extract(epoch from(now()-paused_at)) END)/60)::int)),
    paused_at=NULL
    WHERE id=$1 AND user_id=$2 AND ended_at IS NULL RETURNING *`, [id, userId]),
  cancel: async (id, userId) => (await rows(
    'DELETE FROM focus_sessions WHERE id=$1 AND user_id=$2 AND completed=false RETURNING id',
    [id, userId]
  )).length > 0
};
