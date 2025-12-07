-- Create player_progression table
CREATE TABLE IF NOT EXISTS player_progression (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0,
    xp_to_next INTEGER DEFAULT 100,
    total_xp INTEGER DEFAULT 0,
    skill_points INTEGER DEFAULT 0,
    unlocked_abilities JSONB DEFAULT '[]'::jsonb,
    unlocked_skins JSONB DEFAULT '["default"]'::jsonb,
    unlocked_backgrounds JSONB DEFAULT '["ocean"]'::jsonb,
    unlocked_trails JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id)
);

-- Create player_skills table
CREATE TABLE IF NOT EXISTS player_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, skill_id)
);

-- Create player_achievements table (extend existing)
CREATE TABLE IF NOT EXISTS player_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT,
    achievement_type TEXT, -- for backward compatibility
    achievement_data JSONB DEFAULT '{}'::jsonb,
    progress INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, achievement_id),
    UNIQUE(player_id, achievement_type) -- for backward compatibility
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_progression_player_id ON player_progression(player_id);
CREATE INDEX IF NOT EXISTS idx_player_skills_player_id ON player_skills(player_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_player_id ON player_achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_achievement_id ON player_achievements(achievement_id);

-- Create RLS policies
ALTER TABLE player_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;

-- Policy for player_progression
CREATE POLICY "Users can view their own progression" ON player_progression
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can update their own progression" ON player_progression
    FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own progression" ON player_progression
    FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Policy for player_skills
CREATE POLICY "Users can view their own skills" ON player_skills
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can update their own skills" ON player_skills
    FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own skills" ON player_skills
    FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Policy for player_achievements
CREATE POLICY "Users can view their own achievements" ON player_achievements
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can update their own achievements" ON player_achievements
    FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own achievements" ON player_achievements
    FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for player_progression
CREATE TRIGGER update_player_progression_updated_at 
    BEFORE UPDATE ON player_progression 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial progression data for existing users
INSERT INTO player_progression (player_id, level, current_xp, xp_to_next, total_xp, skill_points)
SELECT 
    id as player_id,
    1 as level,
    0 as current_xp,
    100 as xp_to_next,
    0 as total_xp,
    0 as skill_points
FROM auth.users
WHERE id NOT IN (SELECT player_id FROM player_progression)
ON CONFLICT (player_id) DO NOTHING;