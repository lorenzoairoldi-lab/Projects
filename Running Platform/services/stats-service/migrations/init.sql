CREATE TABLE IF NOT EXISTS weekly_stats (
    user_id INTEGER NOT NULL,
    week_start DATE NOT NULL,
    total_distance_km DECIMAL(8,2) DEFAULT 0,
    total_duration_min INTEGER DEFAULT 0,
    workout_count INTEGER DEFAULT 0,
    UNIQUE(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS monthly_stats (
    user_id INTEGER NOT NULL,
    month_start DATE NOT NULL,
    total_distance_km DECIMAL(8,2) DEFAULT 0,
    total_duration_min INTEGER DEFAULT 0,
    workout_count INTEGER DEFAULT 0,
    UNIQUE(user_id, month_start)
);

CREATE TABLE IF NOT EXISTS personal_bests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    metric VARCHAR(50) NOT NULL,
    value DECIMAL(8,2) NOT NULL,
    achieved_date DATE NOT NULL,
    UNIQUE(user_id, metric)
);
