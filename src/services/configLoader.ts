/**
 * Configuration Loader Service
 * 
 * Loads application configuration from Supabase database instead of .env file.
 * Supports city-based configuration with town/township distinction.
 * Falls back to .env if Supabase is unavailable or on first load.
 * 
 * Configuration is cached for performance and automatically refreshed.
 */

import { supabaseService } from './supabaseService';
import { debugLogger } from './debugLogger';
import { AppConfig } from '../config';

interface City {
  id: string;
  code: string;
  name: string;
  has_town_township: boolean;
  is_active: boolean;
  display_order: number;
}

interface DepartmentGroup {
  id: string;
  city_id: string;
  location_type: 'town' | 'township' | null;
  department_code: 'water' | 'electricity' | 'roads' | 'waste';
  department_name: string;
  bitrix24_group_id: string;
  bitrix24_drive_folder_id?: string;
  default_user_id?: string;
  is_active: boolean;
}

interface AppConfigValue {
  key: string;
  value: string;
  category: string;
  is_secret?: boolean;
}

interface SupabaseConfig {
  cities: City[];
  departmentGroups: DepartmentGroup[];
  appConfig: AppConfigValue[];
}

class ConfigLoader {
  private configCache: SupabaseConfig | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private isInitialized = false;

  /**
   * Initialize config loader and load configuration
   */
  async initialize(): Promise<SupabaseConfig | null> {
    if (this.isInitialized && this.configCache) {
      return this.configCache;
    }

    try {
      await debugLogger.log('INFO', 'Initializing configuration loader from Supabase...');
      
      // Load from Supabase
      const supabaseConfig = await this.loadFromSupabase();
      
      if (supabaseConfig) {
        this.configCache = supabaseConfig;
        this.lastFetchTime = Date.now();
        this.isInitialized = true;
        await debugLogger.log('INFO', '✅ Configuration loaded from Supabase');
        return this.configCache;
      }

      // Fallback to .env
      await debugLogger.log('WARN', '⚠️ Supabase config not available, falling back to .env');
      this.isInitialized = true;
      return null;

    } catch (error) {
      await debugLogger.logError('Config Loader Initialization', error);
      // Fallback to .env on error
      this.isInitialized = true;
      return null;
    }
  }

  /**
   * Get current configuration (cached)
   */
  getConfig(): SupabaseConfig | null {
    return this.configCache;
  }

  /**
   * Refresh configuration from Supabase
   */
  async refresh(): Promise<SupabaseConfig | null> {
    this.configCache = null;
    this.isInitialized = false;
    return this.initialize();
  }

  /**
   * Get configuration (with cache check)
   */
  async getConfigAsync(): Promise<SupabaseConfig | null> {
    const now = Date.now();
    
    // Return cached config if still valid
    if (this.configCache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.configCache;
    }

    // Refresh if cache expired
    return this.initialize();
  }

  /**
   * Get all cities
   */
  async getCities(): Promise<City[]> {
    const config = await this.getConfigAsync();
    return config?.cities || [];
  }

  /**
   * Get department group ID for a specific city, location type, and department
   */
  async getDepartmentGroupId(
    cityCode: string,
    locationType: 'town' | 'township' | null,
    departmentCode: 'water' | 'electricity' | 'roads' | 'waste'
  ): Promise<string | null> {
    const config = await this.getConfigAsync();
    if (!config) return null;

    // Find the city
    const city = config.cities.find(c => c.code === cityCode && c.is_active);
    if (!city) {
      await debugLogger.log('WARN', `City not found: ${cityCode}`);
      return null;
    }

    // Find the department group
    const deptGroup = config.departmentGroups.find(
      dg =>
        dg.city_id === city.id &&
        dg.location_type === locationType &&
        dg.department_code === departmentCode &&
        dg.is_active
    );

    if (!deptGroup) {
      await debugLogger.log(
        'WARN',
        `Department group not found: ${cityCode}/${locationType || 'null'}/${departmentCode}`
      );
      return null;
    }

    return deptGroup.bitrix24_group_id;
  }

  /**
   * Get drive folder ID for a specific city, location type, and department
   */
  async getDriveFolderId(
    cityCode: string,
    locationType: 'town' | 'township' | null,
    departmentCode: 'water' | 'electricity' | 'roads' | 'waste'
  ): Promise<string | null> {
    const config = await this.getConfigAsync();
    if (!config) return null;

    const city = config.cities.find(c => c.code === cityCode && c.is_active);
    if (!city) return null;

    const deptGroup = config.departmentGroups.find(
      dg =>
        dg.city_id === city.id &&
        dg.location_type === locationType &&
        dg.department_code === departmentCode &&
        dg.is_active
    );

    return deptGroup?.bitrix24_drive_folder_id || null;
  }

  /**
   * Get app config value by key
   */
  async getAppConfigValue(key: string): Promise<string | null> {
    const config = await this.getConfigAsync();
    if (!config) return null;

    const configItem = config.appConfig.find(c => c.key === key && !c.is_secret);
    return configItem?.value || null;
  }

  /**
   * Load configuration from Supabase database
   */
  private async loadFromSupabase(): Promise<SupabaseConfig | null> {
    try {
      if (!supabaseService.isReady()) {
        await debugLogger.log('WARN', 'Supabase service not ready');
        return null;
      }

      // Load cities
      const { data: cities, error: citiesError } = await supabaseService.select<City>(
        'cities',
        '*',
        { is_active: true }
      );

      if (citiesError || !cities || cities.length === 0) {
        await debugLogger.logError('Config Loader - Cities', citiesError || 'No cities found');
        return null;
      }

      // Sort cities by display_order
      cities.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

      // Load department groups
      const { data: deptGroups, error: deptError } = await supabaseService.select<DepartmentGroup>(
        'department_groups',
        '*',
        { is_active: true }
      );

      if (deptError || !deptGroups) {
        await debugLogger.logError('Config Loader - Department Groups', deptError || 'Failed to load');
        // Continue even if no department groups - might be initial setup
      }

      // Load app config
      const { data: appConfigs } = await supabaseService.select<AppConfigValue>(
        'app_config',
        '*',
        { is_secret: false }
      );

      await debugLogger.log('INFO', 'Configuration loaded from Supabase', {
        cities: cities.length,
        departmentGroups: deptGroups?.length || 0,
        appConfigs: appConfigs?.length || 0,
      });

      return {
        cities,
        departmentGroups: deptGroups || [],
        appConfig: appConfigs || [],
      };

    } catch (error) {
      await debugLogger.logError('Config Loader - Supabase Load', error);
      return null;
    }
  }

  /**
   * Get legacy config format for backward compatibility
   * This converts Supabase config to the old AppConfig format
   */
  async getLegacyConfig(): Promise<AppConfig | null> {
    const config = await this.getConfigAsync();
    if (!config) return null;

    // For backward compatibility, use first city and null location type
    // This maintains compatibility with existing code
    const firstCity = config.cities[0];
    if (!firstCity) return null;

    // Get default values from first city
    const defaultUserId = await this.getAppConfigValue('default_user_id') || '1';
    
    // Build groups object from first city's departments (location_type = null)
    const groups: Record<string, string> = {};
    const driveFolders: Record<string, string> = {};

    const firstCityDepts = config.departmentGroups.filter(
      dg => dg.city_id === firstCity.id && dg.location_type === null && dg.is_active
    );

    for (const dept of firstCityDepts) {
      groups[dept.department_code] = dept.bitrix24_group_id;
      if (dept.bitrix24_drive_folder_id) {
        driveFolders[dept.department_code] = dept.bitrix24_drive_folder_id;
      }
    }

    // Fill defaults if missing
    const departmentCodes: Array<'water' | 'electricity' | 'roads' | 'waste'> = [
      'water',
      'electricity',
      'roads',
      'waste',
    ];

    for (const code of departmentCodes) {
      if (!groups[code]) {
        groups[code] = code === 'water' ? '5' : code === 'electricity' ? '6' : code === 'roads' ? '7' : '8';
      }
    }

    const appName = await this.getAppConfigValue('app_name') || 'SDINMOTION';
    const supportEmail = await this.getAppConfigValue('support_email') || 'support@municipality.gov.za';
    const supportPhone = await this.getAppConfigValue('support_phone') || '+27 18 297 5111';

    return {
      bitrix24: {
        webhookUrl: import.meta.env.VITE_BITRIX24_WEBHOOK_URL || '',
        defaultUserId: defaultUserId,
        groups: {
          water: groups.water || '5',
          electricity: groups.electricity || '6',
          roads: groups.roads || '7',
          waste: groups.waste || '8',
        },
        driveFolders: Object.keys(driveFolders).length > 0 ? {
          water: driveFolders.water,
          electricity: driveFolders.electricity,
          roads: driveFolders.roads,
          waste: driveFolders.waste,
        } : undefined,
      },
      app: {
        name: appName,
        supportEmail: supportEmail,
        supportPhone: supportPhone,
      },
    };
  }
}

// Export singleton instance
export const configLoader = new ConfigLoader();

// Export types for use in components
export type { City, DepartmentGroup };
