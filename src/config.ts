// Configuration file for the Fault Reporting Mobile App
// Now loads from Supabase database instead of .env file (except webhook URL)

import { configLoader } from './services/configLoader';

export interface AppConfig {
  bitrix24: {
    webhookUrl: string;
    defaultUserId: string;
    groups: {
      water: string;
      electricity: string;
      roads: string;
      waste: string;
    };
    // Optional: Override with specific folder IDs for direct upload
    driveFolders?: {
      water?: string;
      electricity?: string;
      roads?: string;
      waste?: string;
    };
  };
  app: {
    name: string;
    supportEmail: string;
    supportPhone: string;
  };
}

// Fallback configuration (from .env, used during initialization)
// NOTE: Only webhook URL and Supabase credentials remain in .env
const fallbackConfig: AppConfig = {
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

// Initialize config loader (async, will load from Supabase)
configLoader.initialize().then(() => {
  console.log('✅ Configuration loaded from Supabase');
}).catch((error) => {
  console.warn('⚠️ Failed to load config from Supabase, using fallback:', error);
});

// Get configuration (synchronous access)
// Returns Supabase config if loaded, otherwise falls back to env/fallback
export function getConfig(): AppConfig {
  // Check if Supabase config is available
  const supabaseConfig = configLoader.getConfig();
  if (supabaseConfig) {
    // Always use webhook URL from env (security)
    return {
      ...supabaseConfig,
      bitrix24: {
        ...supabaseConfig.bitrix24,
        webhookUrl: import.meta.env.VITE_BITRIX24_WEBHOOK_URL || supabaseConfig.bitrix24.webhookUrl,
      },
    };
  }
  
  // Fallback: use window config if available, otherwise fallback
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
    const windowConfig = { ...fallbackConfig, ...(window as any).APP_CONFIG };
    return {
      ...windowConfig,
      bitrix24: {
        ...windowConfig.bitrix24,
        webhookUrl: import.meta.env.VITE_BITRIX24_WEBHOOK_URL || windowConfig.bitrix24.webhookUrl,
      },
    };
  }
  
  return fallbackConfig;
}

// Export config object for backward compatibility
// This will use Supabase config once loaded, fallback to env otherwise
export const config: AppConfig = getConfig();

// Refresh config from Supabase (call this when config changes)
export async function refreshConfig(): Promise<AppConfig> {
  return await configLoader.refresh();
}

// Legacy export for compatibility
export const defaultConfig: AppConfig = fallbackConfig;

