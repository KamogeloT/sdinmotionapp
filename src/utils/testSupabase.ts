/**
 * Supabase Connection Test Utility
 * 
 * This utility can be called from the browser console or integrated into the app
 * to verify that Supabase is properly configured and connected.
 */

import { supabaseService } from '../services/supabaseService';
import { debugLogger } from '../services/debugLogger';

export async function testSupabaseConnection(): Promise<void> {
  console.log('🧪 Testing Supabase Connection...');
  console.log('═'.repeat(50));

  // Check if service is ready
  const isReady = supabaseService.isReady();
  console.log(`📊 Supabase Service Ready: ${isReady ? '✅ Yes' : '❌ No'}`);

  if (!isReady) {
    console.error('❌ Supabase service is not initialized. Check your environment variables.');
    await debugLogger.logError('Supabase Test', 'Service not ready');
    return;
  }

  // Test connection
  const result = await supabaseService.testConnection();
  
  if (result.success) {
    console.log('✅ Supabase Connection: SUCCESS');
    await debugLogger.log('INFO', '✅ Supabase connection test passed');
  } else {
    console.error('❌ Supabase Connection: FAILED');
    console.error('Error:', result.error);
    await debugLogger.logError('Supabase Test', result.error || 'Connection test failed');
  }

  console.log('═'.repeat(50));
}

// Make it available globally for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection;
}

