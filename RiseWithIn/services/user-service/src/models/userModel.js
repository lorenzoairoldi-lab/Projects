import { getPool, row } from '../../../../shared/postgres.js';
export const initUser = () => getPool().query(`CREATE TABLE IF NOT EXISTS profiles(
 user_id UUID PRIMARY KEY, display_name VARCHAR(80) NOT NULL DEFAULT 'Explorer', bio VARCHAR(500), timezone VARCHAR(64) NOT NULL DEFAULT 'Europe/Rome',
 locale VARCHAR(10) NOT NULL DEFAULT 'it', avatar_url TEXT, onboarding_complete BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
export const userModel = {
  get: (id) => row('SELECT * FROM profiles WHERE user_id=$1', [id]),
  ensure: (id) => row("INSERT INTO profiles(user_id) VALUES($1) ON CONFLICT(user_id) DO UPDATE SET user_id=EXCLUDED.user_id RETURNING *", [id]),
  update: (id, input) => row(`INSERT INTO profiles(user_id,display_name,bio,timezone,locale,avatar_url,onboarding_complete) VALUES($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name,bio=EXCLUDED.bio,timezone=EXCLUDED.timezone,locale=EXCLUDED.locale,avatar_url=EXCLUDED.avatar_url,onboarding_complete=EXCLUDED.onboarding_complete,updated_at=now() RETURNING *`,
    [id,input.displayName,input.bio,input.timezone,input.locale,input.avatarUrl,input.onboardingComplete])
};
