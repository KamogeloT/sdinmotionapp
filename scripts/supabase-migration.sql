-- ============================================================
-- Supabase Database Migration Script
-- SDINMOTION Mobile App Configuration Tables
-- ============================================================
-- 
-- This script creates the necessary tables for storing:
-- 1. Department Groups (Bitrix24 group IDs per department)
-- 2. Drive Folder IDs (Bitrix24 drive folder IDs per department)
-- 3. App Configuration (other config values)
--
-- Run this script in your Supabase SQL Editor:
-- https://app.supabase.com/project/khfbhksommoijhekquzl/sql
--
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: department_groups
-- Stores Bitrix24 group IDs and drive folder IDs for each department
-- ============================================================

CREATE TABLE IF NOT EXISTS department_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- 'water', 'electricity', 'roads', 'waste'
  name TEXT NOT NULL, -- 'Water & Sanitation', 'Electricity', etc.
  bitrix24_group_id TEXT NOT NULL, -- Bitrix24 workgroup ID
  bitrix24_drive_folder_id TEXT, -- Optional: Direct drive folder ID
  default_user_id TEXT, -- Default user ID for task assignment
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_code CHECK (code IN ('water', 'electricity', 'roads', 'waste'))
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

CREATE INDEX IF NOT EXISTS idx_department_groups_code ON department_groups(code);
CREATE INDEX IF NOT EXISTS idx_department_groups_active ON department_groups(is_active);
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

-- Enable RLS on both tables
ALTER TABLE department_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon key can read)
-- Adjust these policies based on your security requirements

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
CREATE POLICY "Allow public insert to department_groups"
ON department_groups FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public insert to app_config"
ON app_config FOR INSERT
WITH CHECK (true);

-- Allow public update (for configuration updates)
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
-- Insert default department groups
-- Update these values with your actual Bitrix24 IDs

INSERT INTO department_groups (code, name, bitrix24_group_id, default_user_id, is_active)
VALUES 
  ('water', 'Water & Sanitation Department', '5', '1', true),
  ('electricity', 'Electricity Department', '6', '1', true),
  ('roads', 'Roads & Infrastructure Department', '7', '1', true),
  ('waste', 'Waste Management Department', '8', '1', true)
ON CONFLICT (code) DO UPDATE
SET 
  bitrix24_group_id = EXCLUDED.bitrix24_group_id,
  default_user_id = EXCLUDED.default_user_id,
  updated_at = NOW();

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
-- Uncomment and update with your actual folder IDs
-- ============================================================

-- UPDATE department_groups SET bitrix24_drive_folder_id = '61' WHERE code = 'water';
-- UPDATE department_groups SET bitrix24_drive_folder_id = '63' WHERE code = 'electricity';
-- UPDATE department_groups SET bitrix24_drive_folder_id = '65' WHERE code = 'roads';
-- UPDATE department_groups SET bitrix24_drive_folder_id = '67' WHERE code = 'waste';

-- ============================================================
-- Verification Queries
-- ============================================================

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('department_groups', 'app_config');

-- Check department groups data
SELECT code, name, bitrix24_group_id, bitrix24_drive_folder_id, is_active 
FROM department_groups 
ORDER BY code;

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
-- 1. Update department_groups with your actual Bitrix24 IDs
-- 2. Update app_config with your actual values
-- 3. Update drive folder IDs if available
-- 4. Run the TypeScript setup script: npm run setup:supabase
-- 5. Update your app to use Supabase config loader
--
-- ============================================================

