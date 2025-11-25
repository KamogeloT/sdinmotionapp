-- ============================================================
-- Supabase Database Migration Script
-- SDINMOTION Mobile App Configuration Tables
-- ============================================================
-- 
-- This script creates the necessary tables for storing:
-- 1. Cities (Municipal areas)
-- 2. Department Groups (Bitrix24 group IDs per city/location/department)
-- 3. Drive Folder IDs (Bitrix24 drive folder IDs)
-- 4. App Configuration (other config values)
--
-- Structure:
-- City -> Location Type (town/township/null) -> Department -> Workgroup
-- Not all departments require town/township distinction
--
-- Run this script in your Supabase SQL Editor:
-- https://app.supabase.com/project/khfbhksommoijhekquzl/sql
--
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: cities
-- Stores municipalities/cities
-- ============================================================

CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- 'city1', 'city2', etc.
  name TEXT NOT NULL, -- 'City Name'
  has_town_township BOOLEAN DEFAULT false, -- Whether this city has town/township distinction
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- For ordering in dropdowns
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Table: department_groups
-- Stores Bitrix24 group IDs and drive folder IDs for each department
-- Now supports city and location type (town/township/null)
-- ============================================================

CREATE TABLE IF NOT EXISTS department_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  location_type TEXT, -- 'town', 'township', or NULL if not applicable
  department_code TEXT NOT NULL, -- 'water', 'electricity', 'roads', 'waste'
  department_name TEXT NOT NULL, -- 'Water & Sanitation', 'Electricity', etc.
  bitrix24_group_id TEXT NOT NULL, -- Bitrix24 workgroup ID
  bitrix24_drive_folder_id TEXT, -- Optional: Direct drive folder ID
  default_user_id TEXT, -- Default user ID for task assignment
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_department_code CHECK (department_code IN ('water', 'electricity', 'roads', 'waste')),
  CONSTRAINT valid_location_type CHECK (location_type IS NULL OR location_type IN ('town', 'township')),
  -- Unique constraint: one workgroup per city/location_type/department combination
  CONSTRAINT unique_city_location_department UNIQUE (city_id, location_type, department_code)
);

-- ============================================================
-- Table: app_config
-- Stores general app configuration key-value pairs
-- ============================================================

CREATE TABLE IF NOT EXISTS app_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general', -- 'general', 'bitrix24', 'app'
  is_secret BOOLEAN DEFAULT false, -- Flag for sensitive values
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Indexes for better query performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cities_code ON cities(code);
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(is_active);
CREATE INDEX IF NOT EXISTS idx_department_groups_city_id ON department_groups(city_id);
CREATE INDEX IF NOT EXISTS idx_department_groups_location_type ON department_groups(location_type);
CREATE INDEX IF NOT EXISTS idx_department_groups_department_code ON department_groups(department_code);
CREATE INDEX IF NOT EXISTS idx_department_groups_active ON department_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_department_groups_city_location_dept ON department_groups(city_id, location_type, department_code);
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);
CREATE INDEX IF NOT EXISTS idx_app_config_category ON app_config(category);

-- ============================================================
-- Function: Update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Triggers: Auto-update updated_at timestamp
-- ============================================================

DROP TRIGGER IF EXISTS update_cities_updated_at ON cities;
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_department_groups_updated_at ON department_groups;
CREATE TRIGGER update_department_groups_updated_at
  BEFORE UPDATE ON department_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_config_updated_at ON app_config;
CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon key can read)
-- Adjust these policies based on your security requirements

-- Cities: Public read access
CREATE POLICY "Allow public read access to cities"
ON cities FOR SELECT
USING (true);

-- Department Groups: Public read access
CREATE POLICY "Allow public read access to department_groups"
ON department_groups FOR SELECT
USING (true);

-- App Config: Public read access (excluding secrets)
CREATE POLICY "Allow public read access to non-secret app_config"
ON app_config FOR SELECT
USING (is_secret = false);

-- Note: For production, you may want to restrict write access
-- Only authenticated users or service role should be able to modify data
-- For now, allowing public inserts/updates (you can change this later)

-- Allow public insert (for initial setup, restrict later if needed)
CREATE POLICY "Allow public insert to cities"
ON cities FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public insert to department_groups"
ON department_groups FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public insert to app_config"
ON app_config FOR INSERT
WITH CHECK (true);

-- Allow public update (for configuration updates)
CREATE POLICY "Allow public update to cities"
ON cities FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public update to department_groups"
ON department_groups FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public update to app_config"
ON app_config FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================================
-- Initial Data Seeding
-- ============================================================
-- Insert example cities (update with your actual cities)
-- Update these values with your actual data

INSERT INTO cities (code, name, has_town_township, is_active, display_order)
VALUES 
  ('city1', 'City 1', true, true, 1),
  ('city2', 'City 2', false, true, 2)
ON CONFLICT (code) DO UPDATE
SET 
  name = EXCLUDED.name,
  has_town_township = EXCLUDED.has_town_township,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Insert default department groups
-- Example: City 1 has town/township, City 2 does not
-- Update with your actual Bitrix24 group IDs

-- Get city IDs for reference
DO $$
DECLARE
  city1_id UUID;
  city2_id UUID;
BEGIN
  SELECT id INTO city1_id FROM cities WHERE code = 'city1';
  SELECT id INTO city2_id FROM cities WHERE code = 'city2';

  -- City 1: Water department with town/township distinction
  INSERT INTO department_groups (city_id, location_type, department_code, department_name, bitrix24_group_id, default_user_id, is_active)
  VALUES 
    (city1_id, 'town', 'water', 'Water & Sanitation Department', '5', '1', true),
    (city1_id, 'township', 'water', 'Water & Sanitation Department', '15', '1', true),
    (city1_id, NULL, 'electricity', 'Electricity Department', '6', '1', true), -- No town/township distinction
    (city1_id, 'town', 'roads', 'Roads & Infrastructure Department', '7', '1', true),
    (city1_id, 'township', 'roads', 'Roads & Infrastructure Department', '17', '1', true),
    (city1_id, NULL, 'waste', 'Waste Management Department', '8', '1', true)
  ON CONFLICT (city_id, location_type, department_code) DO UPDATE
  SET 
    bitrix24_group_id = EXCLUDED.bitrix24_group_id,
    default_user_id = EXCLUDED.default_user_id,
    updated_at = NOW();

  -- City 2: No town/township distinction for any department
  INSERT INTO department_groups (city_id, location_type, department_code, department_name, bitrix24_group_id, default_user_id, is_active)
  VALUES 
    (city2_id, NULL, 'water', 'Water & Sanitation Department', '25', '1', true),
    (city2_id, NULL, 'electricity', 'Electricity Department', '26', '1', true),
    (city2_id, NULL, 'roads', 'Roads & Infrastructure Department', '27', '1', true),
    (city2_id, NULL, 'waste', 'Waste Management Department', '28', '1', true)
  ON CONFLICT (city_id, location_type, department_code) DO UPDATE
  SET 
    bitrix24_group_id = EXCLUDED.bitrix24_group_id,
    default_user_id = EXCLUDED.default_user_id,
    updated_at = NOW();
END $$;

-- Insert default app configuration
-- Note: Sensitive values should be updated via script or admin panel

INSERT INTO app_config (key, value, description, category, is_secret)
VALUES 
  ('app_name', 'SDINMOTION', 'Application display name', 'app', false),
  ('support_email', 'support@municipality.gov.za', 'Support email address', 'app', false),
  ('support_phone', '+27 18 297 5111', 'Support phone number', 'app', false),
  ('default_user_id', '1', 'Default Bitrix24 user ID for task assignment', 'bitrix24', false)
ON CONFLICT (key) DO UPDATE
SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================
-- Optional: Insert drive folder IDs if you have them
-- Update department_groups with drive folder IDs
-- ============================================================

-- UPDATE department_groups SET bitrix24_drive_folder_id = '61' 
-- WHERE city_id = (SELECT id FROM cities WHERE code = 'city1') 
--   AND location_type = 'town' 
--   AND department_code = 'water';

-- ============================================================
-- Verification Queries
-- ============================================================

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cities', 'department_groups', 'app_config');

-- Check cities data
SELECT id, code, name, has_town_township, is_active, display_order
FROM cities 
WHERE is_active = true
ORDER BY display_order, name;

-- Check department groups data with city names
SELECT 
  c.name as city_name,
  dg.location_type,
  dg.department_code,
  dg.department_name,
  dg.bitrix24_group_id,
  dg.bitrix24_drive_folder_id,
  dg.is_active
FROM department_groups dg
JOIN cities c ON dg.city_id = c.id
WHERE dg.is_active = true
ORDER BY c.display_order, c.name, dg.department_code, dg.location_type;

-- Check app config data (excluding secrets)
SELECT key, value, description, category 
FROM app_config 
WHERE is_secret = false 
ORDER BY category, key;

-- ============================================================
-- Migration Complete!
-- ============================================================
-- 
-- Next Steps:
-- 1. Update cities table with your actual cities
-- 2. Update department_groups with your actual Bitrix24 IDs
-- 3. Update app_config with your actual values
-- 4. Update drive folder IDs if available
-- 5. Run the TypeScript setup script: npm run setup:supabase
-- 6. Update your app to use Supabase config loader
--
-- ============================================================
