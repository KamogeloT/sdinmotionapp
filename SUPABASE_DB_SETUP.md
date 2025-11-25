# Supabase Database Setup Guide

## Overview

This guide explains how to set up the Supabase database for the SDINMOTION mobile app. Configuration has been moved from `.env` file to the Supabase database for better management and flexibility.

**What's in Supabase:**
- ✅ Department Groups (Bitrix24 group IDs)
- ✅ Drive Folder IDs (Bitrix24 drive folder IDs)
- ✅ App Configuration (support email, phone, etc.)
- ✅ Default User IDs

**What stays in `.env`:**
- 🔒 Bitrix24 Webhook URL (sensitive, required for API access)
- 🔒 Supabase API Key & URL (required for database connection)

---

## Quick Start

### Step 1: Run SQL Migration

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to your Supabase SQL Editor:
   ```
   https://app.supabase.com/project/khfbhksommoijhekquzl/sql
   ```

2. Open the migration file: `scripts/supabase-migration.sql`

3. Copy the entire contents and paste into the SQL Editor

4. Click **Run** to execute the migration

**Option B: Via Setup Script**

```bash
npm run setup:supabase
```

> **Note:** The script will seed initial data, but you may need to run the SQL manually if your Supabase project doesn't support DDL via REST API.

---

### Step 2: Update Configuration Values

After running the migration, update the values in Supabase:

#### Update Department Groups

Go to **Table Editor** → `department_groups`:

| Code | Name | Bitrix24 Group ID | Drive Folder ID | Default User ID |
|------|------|-------------------|-----------------|-----------------|
| water | Water & Sanitation Department | `5` | (optional) | `1` |
| electricity | Electricity Department | `6` | (optional) | `1` |
| roads | Roads & Infrastructure Department | `7` | (optional) | `1` |
| waste | Waste Management Department | `8` | (optional) | `1` |

#### Update App Config

Go to **Table Editor** → `app_config`:

| Key | Value | Description |
|-----|-------|-------------|
| app_name | SDINMOTION | Application display name |
| support_email | support@municipality.gov.za | Support email |
| support_phone | +27 18 297 5111 | Support phone |
| default_user_id | 1 | Default Bitrix24 user ID |

---

### Step 3: Verify Setup

Run the verification script:

```bash
npm run setup:supabase
```

Or check manually in Supabase:

```sql
-- Check department groups
SELECT code, name, bitrix24_group_id, bitrix24_drive_folder_id 
FROM department_groups 
WHERE is_active = true;

-- Check app config
SELECT key, value, category 
FROM app_config 
WHERE is_secret = false;
```

---

## Database Schema

### Table: `department_groups`

Stores Bitrix24 group IDs and drive folder IDs for each department.

```sql
CREATE TABLE department_groups (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,           -- 'water', 'electricity', 'roads', 'waste'
  name TEXT NOT NULL,                  -- Display name
  bitrix24_group_id TEXT NOT NULL,     -- Bitrix24 workgroup ID
  bitrix24_drive_folder_id TEXT,       -- Optional: Direct drive folder ID
  default_user_id TEXT,                -- Default user ID for tasks
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Table: `app_config`

Stores general app configuration key-value pairs.

```sql
CREATE TABLE app_config (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,            -- Config key
  value TEXT NOT NULL,                 -- Config value
  description TEXT,                    -- Description
  category TEXT DEFAULT 'general',     -- 'general', 'bitrix24', 'app'
  is_secret BOOLEAN DEFAULT false,     -- Flag for sensitive values
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Configuration Loading

The app now loads configuration from Supabase instead of `.env`:

1. **On App Start:** Config loader attempts to fetch from Supabase
2. **Fallback:** If Supabase is unavailable, falls back to `.env` values
3. **Caching:** Configuration is cached for 5 minutes for performance
4. **Refresh:** Call `refreshConfig()` to reload from Supabase

**Code Example:**

```typescript
import { config, refreshConfig } from './config';

// Use config (automatically loads from Supabase or falls back to .env)
const groupId = config.bitrix24.groups.water;

// Refresh config if needed
await refreshConfig();
```

---

## Updating Configuration

### Via Supabase Dashboard

1. Go to **Table Editor** → Select table (`department_groups` or `app_config`)
2. Click on a row to edit
3. Update values
4. Save changes
5. Changes take effect immediately (app will refresh on next config load)

### Via SQL

```sql
-- Update department group
UPDATE department_groups 
SET bitrix24_group_id = '10', bitrix24_drive_folder_id = '100'
WHERE code = 'water';

-- Update app config
UPDATE app_config 
SET value = 'new-support@municipality.gov.za'
WHERE key = 'support_email';
```

### Via TypeScript (Admin Panel)

```typescript
import { supabaseService } from './services/supabaseService';

// Update department group
await supabaseService.update(
  'department_groups',
  { bitrix24_group_id: '10', bitrix24_drive_folder_id: '100' },
  { code: 'water' }
);

// Update app config
await supabaseService.update(
  'app_config',
  { value: 'new-support@municipality.gov.za' },
  { key: 'support_email' }
);
```

---

## Security

### Row Level Security (RLS)

The tables have RLS enabled with the following policies:

- ✅ **Public Read Access:** Anyone with anon key can read (for app usage)
- ⚠️ **Public Write Access:** Currently enabled for setup, **restrict for production**

**For Production:**

Update RLS policies to restrict writes:

```sql
-- Remove public write access
DROP POLICY "Allow public insert to department_groups" ON department_groups;
DROP POLICY "Allow public update to department_groups" ON department_groups;
DROP POLICY "Allow public insert to app_config" ON app_config;
DROP POLICY "Allow public update to app_config" ON app_config;

-- Allow only authenticated users or service role to modify
CREATE POLICY "Allow authenticated users to modify department_groups"
ON department_groups FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
```

---

## Environment Variables (.env)

After migration, your `.env` file should only contain:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://khfbhksommoijhekquzl.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Bitrix24 Webhook URL (Required - Sensitive)
VITE_BITRIX24_WEBHOOK_URL=https://www.sdinmotion.co.za/rest/1/YOUR_WEBHOOK_CODE/

# Removed - Now in Supabase:
# VITE_BITRIX24_USER_ID
# VITE_BITRIX24_GROUP_WATER
# VITE_BITRIX24_GROUP_ELECTRICITY
# VITE_BITRIX24_GROUP_ROADS
# VITE_BITRIX24_GROUP_WASTE
# VITE_BITRIX24_DRIVE_FOLDER_*
```

---

## Troubleshooting

### Issue: "Configuration not loading from Supabase"

**Check:**
1. Supabase credentials in `.env` are correct
2. Tables exist in Supabase (run migration)
3. Data is seeded (check Table Editor)
4. RLS policies allow read access

**Fallback:**
- App will automatically use `.env` values if Supabase fails
- Check console for error messages

### Issue: "Changes not reflecting in app"

**Solution:**
1. Wait 5 minutes (cache expires)
2. Or refresh config: `await refreshConfig()`
3. Or restart the app

### Issue: "Cannot run SQL migration"

**Solution:**
1. Run SQL manually in Supabase SQL Editor
2. Copy contents of `scripts/supabase-migration.sql`
3. Paste and execute in SQL Editor

---

## Migration Checklist

- [ ] SQL migration executed successfully
- [ ] Tables created (`department_groups`, `app_config`)
- [ ] Initial data seeded
- [ ] Department groups updated with actual Bitrix24 IDs
- [ ] Drive folder IDs added (if available)
- [ ] App config values updated
- [ ] RLS policies reviewed/updated for production
- [ ] `.env` file updated (removed migrated variables)
- [ ] App tested with Supabase config
- [ ] Fallback to `.env` tested (disable Supabase to verify)

---

## Next Steps

1. ✅ Database setup complete
2. ✅ Configuration migrated to Supabase
3. ⏳ Update app to use Supabase config loader
4. ⏳ Test configuration changes in Supabase
5. ⏳ Restrict RLS policies for production

---

**Last Updated:** November 25, 2025  
**Version:** 1.0  
**Project:** SDINMOTION Mobile App

