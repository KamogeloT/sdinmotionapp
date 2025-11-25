/**
 * Configuration Loader Service
 * 
 * Loads application configuration from Supabase database instead of .env file.
 * Falls back to .env if Supabase is unavailable or on first load.
 * 
 * Configuration is cached for performance and automatically refreshed.
 */

import { supabaseService } from './supabaseService';
import { debugLogger } from './debugLogger';
import { AppConfig } from '../config';

interface DepartmentGroup {
  code: 'water' | 'electricity' | 'roads' | 'waste';
  name: string;
  bitrix24_group_id: string;
  bitrix24_drive_folder_id?: string;
  default_user_id?: string;
  is_active: boolean;
}

interface AppConfigValue {
  key: string;
  value: string;
  category: string;
}

class ConfigLoader {
  private configCache: AppConfig | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private isInitialized = false;

  /**
   * Initialize config loader and load configuration
   */
  async initialize(): Promise<AppConfig> {
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
      const envConfig = this.loadFromEnv();
      this.configCache = envConfig;
      this.isInitialized = true;
      return this.configCache;

    } catch (error) {
      await debugLogger.logError('Config Loader Initialization', error);
      // Fallback to .env on error
      const envConfig = this.loadFromEnv();
      this.configCache = envConfig;
      this.isInitialized = true;
      return this.configCache;
    }
  }

  /**
   * Get current configuration (cached)
   */
  getConfig(): AppConfig | null {
    return this.configCache;
  }

  /**
   * Refresh configuration from Supabase
   */
  async refresh(): Promise<AppConfig> {
    this.configCache = null;
    this.isInitialized = false;
    return this.initialize();
  }

  /**
   * Get configuration (with cache check)
   */
  async getConfigAsync(): Promise<AppConfig> {
    const now = Date.now();
    
    // Return cached config if still valid
    if (this.configCache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.configCache;
    }

    // Refresh if cache expired
    return this.initialize();
  }

  /**
   * Load configuration from Supabase database
   */
  private async loadFromSupabase(): Promise<AppConfig | null> {
    try {
      if (!supabaseService.isReady()) {
        await debugLogger.log('WARN', 'Supabase service not ready');
        return null;
      }

      // Load department groups
      const { data: depts, error: deptError } = await supabaseService.select<DepartmentGroup>(
        'department_groups',
        '*',
        { is_active: true }
      );

      if (deptError || !depts || depts.length === 0) {
        await debugLogger.logError('Config Loader - Department Groups', deptError || 'No departments found');
        return null;
      }

      // Convert department groups to config format
      const groups: Record<string, string> = {};
      const driveFolders: Record<string, string> = {};
      let defaultUserId = '1';

      for (const dept of depts) {
        groups[dept.code] = dept.bitrix24_group_id;
        if (dept.bitrix24_drive_folder_id) {
          driveFolders[dept.code] = dept.bitrix24_drive_folder_id;
        }
        if (dept.default_user_id) {
          defaultUserId = dept.default_user_id;
        }
      }

      // Load app config
      const { data: configs } = await supabaseService.select<AppConfigValue>(
        'app_config',
        '*',
        { is_secret: false }
      );

      // Extract config values
      const appName = configs?.find(c => c.key === 'app_name')?.value || 'SDINMOTION';
      const supportEmail = configs?.find(c => c.key === 'support_email')?.value || 'support@municipality.gov.za';
      const supportPhone = configs?.find(c => c.key === 'support_phone')?.value || '+27 18 297 5111';
      const defaultUser = configs?.find(c => c.key === 'default_user_id')?.value || defaultUserId;

      // Build config object
      const config: AppConfig = {
        bitrix24: {
          webhookUrl: import.meta.env.VITE_BITRIX24_WEBHOOK_URL || '',
          defaultUserId: defaultUser,
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

      await debugLogger.log('INFO', 'Configuration loaded from Supabase', {
        departments: depts.length,
        configs: configs?.length || 0,
      });

      return config;

    } catch (error) {
      await debugLogger.logError('Config Loader - Supabase Load', error);
      return null;
    }
  }

  /**
   * Load configuration from environment variables (fallback)
   */
  private loadFromEnv(): AppConfig {
    return {
      bitrix24: {
        webhookUrl: import.meta.env.VITE_BITRIX24_WEBHOOK_URL || '',
        defaultUserId: import.meta.env.VITE_BITRIX24_USER_ID || '1',
        groups: {
          water: import.meta.env.VITE_BITRIX24_GROUP_WATER || '5',
          electricity: import.meta.env.VITE_BITRIX24_GROUP_ELECTRICITY || '6',
          roads: import.meta.env.VITE_BITRIX24_GROUP_ROADS || '7',
          waste: import.meta.env.VITE_BITRIX24_GROUP_WASTE || '8',
        },
        driveFolders: {
          water: import.meta.env.VITE_BITRIX24_DRIVE_FOLDER_WATER,
          electricity: import.meta.env.VITE_BITRIX24_DRIVE_FOLDER_ELECTRICITY,
          roads: import.meta.env.VITE_BITRIX24_DRIVE_FOLDER_ROADS,
          waste: import.meta.env.VITE_BITRIX24_DRIVE_FOLDER_WASTE,
        },
      },
      app: {
        name: 'SDINMOTION',
        supportEmail: 'support@municipality.gov.za',
        supportPhone: '+27 18 297 5111',
      },
    };
  }
}

// Export singleton instance
export const configLoader = new ConfigLoader();

