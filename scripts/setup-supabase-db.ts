#!/usr/bin/env tsx
/**
 * Supabase Database Setup Script
 * 
 * This script:
 * 1. Seeds cities
 * 2. Seeds department groups linked to cities with location types
 * 3. Seeds app configuration
 * 4. Verifies the setup
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
// Update these with your actual cities and Bitrix24 group IDs

interface City {
  code: string;
  name: string;
  has_town_township: boolean;
  is_active: boolean;
  display_order: number;
}

interface DepartmentGroup {
  city_code: string;
  location_type: 'town' | 'township' | null;
  department_code: 'water' | 'electricity' | 'roads' | 'waste';
  department_name: string;
  bitrix24_group_id: string;
  bitrix24_drive_folder_id?: string;
  default_user_id: string;
  is_active: boolean;
}

const defaultCities: City[] = [
  {
    code: 'city1',
    name: 'City 1',
    has_town_township: true,
    is_active: true,
    display_order: 1,
  },
  {
    code: 'city2',
    name: 'City 2',
    has_town_township: false,
    is_active: true,
    display_order: 2,
  },
];

const defaultDepartmentGroups: DepartmentGroup[] = [
  // City 1 (has town/township)
  { city_code: 'city1', location_type: 'town', department_code: 'water', department_name: 'Water & Sanitation Department', bitrix24_group_id: '5', default_user_id: '1', is_active: true },
  { city_code: 'city1', location_type: 'township', department_code: 'water', department_name: 'Water & Sanitation Department', bitrix24_group_id: '15', default_user_id: '1', is_active: true },
  { city_code: 'city1', location_type: null, department_code: 'electricity', department_name: 'Electricity Department', bitrix24_group_id: '6', default_user_id: '1', is_active: true },
  { city_code: 'city1', location_type: 'town', department_code: 'roads', department_name: 'Roads & Infrastructure Department', bitrix24_group_id: '7', default_user_id: '1', is_active: true },
  { city_code: 'city1', location_type: 'township', department_code: 'roads', department_name: 'Roads & Infrastructure Department', bitrix24_group_id: '17', default_user_id: '1', is_active: true },
  { city_code: 'city1', location_type: null, department_code: 'waste', department_name: 'Waste Management Department', bitrix24_group_id: '8', default_user_id: '1', is_active: true },
  
  // City 2 (no town/township)
  { city_code: 'city2', location_type: null, department_code: 'water', department_name: 'Water & Sanitation Department', bitrix24_group_id: '25', default_user_id: '1', is_active: true },
  { city_code: 'city2', location_type: null, department_code: 'electricity', department_name: 'Electricity Department', bitrix24_group_id: '26', default_user_id: '1', is_active: true },
  { city_code: 'city2', location_type: null, department_code: 'roads', department_name: 'Roads & Infrastructure Department', bitrix24_group_id: '27', default_user_id: '1', is_active: true },
  { city_code: 'city2', location_type: null, department_code: 'waste', department_name: 'Waste Management Department', bitrix24_group_id: '28', default_user_id: '1', is_active: true },
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

    console.log('⚠️  Note: SQL migration contains DDL statements that may need manual execution.');
    console.log('⚠️  Please run the SQL migration manually in Supabase SQL Editor:');
    console.log(`   ${supabaseUrl.replace('.supabase.co', '').replace('https://', 'https://app.')}/sql`);
    console.log('');
    
    return false; // Return false so user runs SQL manually
  } catch (error: any) {
    console.error('❌ SQL migration error:', error.message);
    return false;
  }
}

/**
 * Seed cities
 */
async function seedCities(): Promise<Record<string, string>> {
  try {
    console.log('🌱 Seeding cities...');
    const cityIdMap: Record<string, string> = {};

    for (const city of defaultCities) {
      const { data, error } = await supabase
        .from('cities')
        .upsert(city, { onConflict: 'code' })
        .select('id, code');

      if (error) {
        console.error(`❌ Error seeding city ${city.code}:`, error.message);
        throw error;
      }

      if (data && data.length > 0) {
        cityIdMap[city.code] = data[0].id;
        console.log(`  ✅ ${city.code}: ${city.name} (Town/Township: ${city.has_town_township ? 'Yes' : 'No'})`);
      }
    }

    console.log('✅ Cities seeded successfully');
    return cityIdMap;
  } catch (error: any) {
    console.error('❌ Error seeding cities:', error.message);
    throw error;
  }
}

/**
 * Seed department groups
 */
async function seedDepartmentGroups(cityIdMap: Record<string, string>): Promise<boolean> {
  try {
    console.log('🌱 Seeding department groups...');

    for (const dept of defaultDepartmentGroups) {
      const cityId = cityIdMap[dept.city_code];
      if (!cityId) {
        console.error(`❌ City ${dept.city_code} not found, skipping department group`);
        continue;
      }

      const departmentGroup = {
        city_id: cityId,
        location_type: dept.location_type,
        department_code: dept.department_code,
        department_name: dept.department_name,
        bitrix24_group_id: dept.bitrix24_group_id,
        bitrix24_drive_folder_id: dept.bitrix24_drive_folder_id,
        default_user_id: dept.default_user_id,
        is_active: dept.is_active,
      };

      const { data, error } = await supabase
        .from('department_groups')
        .upsert(departmentGroup, {
          onConflict: 'city_id,location_type,department_code',
        })
        .select();

      if (error) {
        console.error(`❌ Error seeding ${dept.city_code}/${dept.location_type || 'none'}/${dept.department_code}:`, error.message);
        return false;
      }

      const locationStr = dept.location_type ? ` [${dept.location_type}]` : ' [no location]';
      console.log(`  ✅ ${dept.city_code}${locationStr} - ${dept.department_code}: ${dept.bitrix24_group_id}`);
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

    // Check cities
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('code, name, has_town_township, is_active, display_order')
      .eq('is_active', true)
      .order('display_order');

    if (citiesError) {
      console.error('❌ Error reading cities:', citiesError.message);
      return false;
    }

    console.log(`  ✅ Found ${cities?.length || 0} cities:`);
    cities?.forEach(city => {
      console.log(`     - ${city.code}: ${city.name} (Town/Township: ${city.has_town_township ? 'Yes' : 'No'})`);
    });

    // Check department groups with city names
    const { data: depts, error: deptError } = await supabase
      .from('department_groups')
      .select(`
        city_id,
        location_type,
        department_code,
        department_name,
        bitrix24_group_id,
        bitrix24_drive_folder_id,
        cities:city_id(code, name)
      `)
      .eq('is_active', true)
      .order('city_id, department_code, location_type');

    if (deptError) {
      console.error('❌ Error reading department_groups:', deptError.message);
      return false;
    }

    console.log(`  ✅ Found ${depts?.length || 0} department groups:`);
    depts?.forEach((dept: any) => {
      const city = dept.cities;
      const locationStr = dept.location_type ? ` [${dept.location_type}]` : '';
      console.log(`     - ${city?.code || 'unknown'}${locationStr} - ${dept.department_code}: Group ${dept.bitrix24_group_id}`);
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

  // Step 2: Seed cities
  console.log('STEP 2: Seed Cities');
  console.log('─'.repeat(60));
  let cityIdMap: Record<string, string>;
  try {
    cityIdMap = await seedCities();
  } catch (error) {
    console.error('❌ Failed to seed cities');
    process.exit(1);
  }

  console.log('');

  // Step 3: Seed department groups
  console.log('STEP 3: Seed Department Groups');
  console.log('─'.repeat(60));
  const deptSuccess = await seedDepartmentGroups(cityIdMap);
  if (!deptSuccess) {
    console.error('❌ Failed to seed department groups');
    process.exit(1);
  }

  console.log('');

  // Step 4: Seed app config
  console.log('STEP 4: Seed App Configuration');
  console.log('─'.repeat(60));
  const configSuccess = await seedAppConfig();
  if (!configSuccess) {
    console.error('❌ Failed to seed app configuration');
    process.exit(1);
  }

  console.log('');

  // Step 5: Verify setup
  console.log('STEP 5: Verify Setup');
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
  console.log('   1. Update cities with your actual city names and codes');
  console.log('   2. Update department_groups with your actual Bitrix24 group IDs');
  console.log('   3. Add drive folder IDs if available');
  console.log('   4. Update app_config values as needed');
  console.log('   5. Test the app configuration loading');
  console.log('');
}

// Run main function
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
