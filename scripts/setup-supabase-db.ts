#!/usr/bin/env tsx
/**
 * Supabase Database Setup Script
 * 
 * This script:
 * 1. Creates the necessary tables (department_groups, app_config)
 * 2. Seeds initial data
 * 3. Verifies the setup
 * 
 * Usage:
 *   npm run setup:supabase
 *   or
 *   npx tsx scripts/setup-supabase-db.ts
 * 
 * Requires:
 * - VITE_SUPABASE_URL in .env
 * - VITE_SUPABASE_ANON_KEY in .env (or use service role key for admin operations)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Default data for seeding
const defaultDepartmentGroups = [
  {
    code: 'water',
    name: 'Water & Sanitation Department',
    bitrix24_group_id: '5',
    default_user_id: '1',
    is_active: true,
  },
  {
    code: 'electricity',
    name: 'Electricity Department',
    bitrix24_group_id: '6',
    default_user_id: '1',
    is_active: true,
  },
  {
    code: 'roads',
    name: 'Roads & Infrastructure Department',
    bitrix24_group_id: '7',
    default_user_id: '1',
    is_active: true,
  },
  {
    code: 'waste',
    name: 'Waste Management Department',
    bitrix24_group_id: '8',
    default_user_id: '1',
    is_active: true,
  },
];

const defaultAppConfig = [
  {
    key: 'app_name',
    value: 'SDINMOTION',
    description: 'Application display name',
    category: 'app',
    is_secret: false,
  },
  {
    key: 'support_email',
    value: 'support@municipality.gov.za',
    description: 'Support email address',
    category: 'app',
    is_secret: false,
  },
  {
    key: 'support_phone',
    value: '+27 18 297 5111',
    description: 'Support phone number',
    category: 'app',
    is_secret: false,
  },
  {
    key: 'default_user_id',
    value: '1',
    description: 'Default Bitrix24 user ID for task assignment',
    category: 'bitrix24',
    is_secret: false,
  },
];

/**
 * Run SQL migration from file
 */
async function runSQLMigration(): Promise<boolean> {
  try {
    console.log('📄 Reading SQL migration file...');
    const sqlPath = path.join(__dirname, 'supabase-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Split SQL into individual statements (split by semicolon and filter empty)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        // If rpc doesn't exist, try direct query (requires service role key)
        if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
          // Try direct execution via PostgREST (won't work for DDL, but we'll handle via SQL editor)
          console.warn('⚠️  Cannot execute DDL statements via REST API.');
          console.warn('⚠️  Please run the SQL migration manually in Supabase SQL Editor:');
          console.warn(`   ${supabaseUrl.replace('.supabase.co', '')}/sql`);
          return false;
        }

        if (error) {
          // Some errors are expected (e.g., "already exists"), so log but continue
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.warn(`⚠️  SQL Warning: ${error.message}`);
          }
        }
      } catch (err: any) {
        // Skip errors for statements that may already exist
        if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
          console.warn(`⚠️  Statement warning: ${err.message}`);
        }
      }
    }

    console.log('✅ SQL migration completed (some statements may need manual execution)');
    return true;
  } catch (error: any) {
    console.error('❌ SQL migration error:', error.message);
    return false;
  }
}

/**
 * Seed department groups
 */
async function seedDepartmentGroups(): Promise<boolean> {
  try {
    console.log('🌱 Seeding department groups...');

    for (const dept of defaultDepartmentGroups) {
      const { data, error } = await supabase
        .from('department_groups')
        .upsert(dept, { onConflict: 'code' })
        .select();

      if (error) {
        console.error(`❌ Error seeding ${dept.code}:`, error.message);
        return false;
      }
      console.log(`  ✅ ${dept.code}: ${dept.name}`);
    }

    console.log('✅ Department groups seeded successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Error seeding department groups:', error.message);
    return false;
  }
}

/**
 * Seed app configuration
 */
async function seedAppConfig(): Promise<boolean> {
  try {
    console.log('🌱 Seeding app configuration...');

    for (const config of defaultAppConfig) {
      const { data, error } = await supabase
        .from('app_config')
        .upsert(config, { onConflict: 'key' })
        .select();

      if (error) {
        console.error(`❌ Error seeding config ${config.key}:`, error.message);
        return false;
      }
      console.log(`  ✅ ${config.key}: ${config.value}`);
    }

    console.log('✅ App configuration seeded successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Error seeding app config:', error.message);
    return false;
  }
}

/**
 * Verify setup
 */
async function verifySetup(): Promise<boolean> {
  try {
    console.log('🔍 Verifying setup...');

    // Check department_groups
    const { data: depts, error: deptError } = await supabase
      .from('department_groups')
      .select('code, name, bitrix24_group_id, is_active')
      .order('code');

    if (deptError) {
      console.error('❌ Error reading department_groups:', deptError.message);
      return false;
    }

    console.log(`  ✅ Found ${depts?.length || 0} department groups:`);
    depts?.forEach(dept => {
      console.log(`     - ${dept.code}: ${dept.name} (Group ID: ${dept.bitrix24_group_id})`);
    });

    // Check app_config
    const { data: configs, error: configError } = await supabase
      .from('app_config')
      .select('key, value, category')
      .eq('is_secret', false)
      .order('category, key');

    if (configError) {
      console.error('❌ Error reading app_config:', configError.message);
      return false;
    }

    console.log(`  ✅ Found ${configs?.length || 0} app config entries:`);
    configs?.forEach(config => {
      console.log(`     - ${config.key}: ${config.value} [${config.category}]`);
    });

    console.log('✅ Setup verification completed');
    return true;
  } catch (error: any) {
    console.error('❌ Verification error:', error.message);
    return false;
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 Starting Supabase Database Setup...');
  console.log('═'.repeat(60));
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  console.log('═'.repeat(60));
  console.log('');

  // Step 1: Run SQL migration (or instruct manual execution)
  console.log('STEP 1: SQL Migration');
  console.log('─'.repeat(60));
  const migrationSuccess = await runSQLMigration();
  
  if (!migrationSuccess) {
    console.log('');
    console.log('⚠️  IMPORTANT: Please run the SQL migration manually:');
    console.log('   1. Go to: https://app.supabase.com/project/khfbhksommoijhekquzl/sql');
    console.log('   2. Copy the contents of scripts/supabase-migration.sql');
    console.log('   3. Paste and run in the SQL Editor');
    console.log('   4. Then re-run this script: npm run setup:supabase');
    console.log('');
    process.exit(1);
  }

  console.log('');
  
  // Step 2: Seed department groups
  console.log('STEP 2: Seed Department Groups');
  console.log('─'.repeat(60));
  const deptSuccess = await seedDepartmentGroups();
  if (!deptSuccess) {
    console.error('❌ Failed to seed department groups');
    process.exit(1);
  }

  console.log('');

  // Step 3: Seed app config
  console.log('STEP 3: Seed App Configuration');
  console.log('─'.repeat(60));
  const configSuccess = await seedAppConfig();
  if (!configSuccess) {
    console.error('❌ Failed to seed app configuration');
    process.exit(1);
  }

  console.log('');

  // Step 4: Verify setup
  console.log('STEP 4: Verify Setup');
  console.log('─'.repeat(60));
  const verifySuccess = await verifySetup();
  if (!verifySuccess) {
    console.error('❌ Setup verification failed');
    process.exit(1);
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('✅ Supabase Database Setup Complete!');
  console.log('═'.repeat(60));
  console.log('');
  console.log('📝 Next Steps:');
  console.log('   1. Update department_groups with your actual Bitrix24 IDs');
  console.log('   2. Update app_config values as needed');
  console.log('   3. Add drive folder IDs if available');
  console.log('   4. Update your app config loader to read from Supabase');
  console.log('');
}

// Run main function
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

