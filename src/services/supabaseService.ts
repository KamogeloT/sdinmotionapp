import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { debugLogger } from './debugLogger';

/**
 * Supabase Service
 * 
 * Provides centralized access to Supabase client and common database operations.
 * 
 * Features:
 * - Singleton Supabase client instance
 * - Integrated debug logging
 * - Type-safe database operations
 * - Error handling
 */

class SupabaseService {
  private client: SupabaseClient | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize Supabase client with environment variables
   */
  private initializeClient() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Supabase credentials not found in environment variables');
        debugLogger.logError('Supabase Initialization', 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
        return;
      }

      this.client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });

      this.isInitialized = true;
      console.log('✅ Supabase client initialized successfully');
      debugLogger.log('INFO', 'Supabase client initialized', { url: supabaseUrl });
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      debugLogger.logError('Supabase Initialization', error);
    }
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient | null {
    if (!this.isInitialized || !this.client) {
      console.warn('⚠️ Supabase client not initialized');
      return null;
    }
    return this.client;
  }

  /**
   * Check if Supabase is initialized and ready
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.client) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      await debugLogger.log('INFO', 'Testing Supabase connection...');

      // Simple query to test connection
      const { error } = await this.client.from('_test_').select('*').limit(1);

      // If we get a "relation does not exist" error, it means connection works
      // (just that the table doesn't exist, which is fine for a connection test)
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        await debugLogger.logError('Supabase Connection Test', error);
        return { success: false, error: error.message };
      }

      await debugLogger.log('INFO', '✅ Supabase connection successful');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await debugLogger.logError('Supabase Connection Test', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Generic query builder - for custom queries
   * @param table - Table name
   */
  from(table: string) {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }
    return this.client.from(table);
  }

  /**
   * Insert data into a table
   * @param table - Table name
   * @param data - Data to insert
   */
  async insert<T>(table: string, data: T | T[]): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.client) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      await debugLogger.log('INFO', `Inserting data into ${table}`, { data });

      const { data: insertedData, error } = await this.client
        .from(table)
        .insert(data)
        .select();

      if (error) {
        await debugLogger.logError(`Supabase Insert - ${table}`, error);
        return { success: false, error: error.message };
      }

      await debugLogger.log('INFO', `✅ Data inserted into ${table}`, { insertedData });
      return { success: true, data: insertedData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await debugLogger.logError(`Supabase Insert - ${table}`, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Select data from a table
   * @param table - Table name
   * @param columns - Columns to select (default: *)
   * @param filters - Optional filters
   */
  async select<T>(
    table: string,
    columns = '*',
    filters?: Record<string, any>
  ): Promise<{ success: boolean; data?: T[]; error?: string }> {
    try {
      if (!this.client) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      await debugLogger.log('INFO', `Selecting from ${table}`, { columns, filters });

      let query = this.client.from(table).select(columns);

      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;

      if (error) {
        await debugLogger.logError(`Supabase Select - ${table}`, error);
        return { success: false, error: error.message };
      }

      await debugLogger.log('INFO', `✅ Data selected from ${table}`, { count: data?.length });
      return { success: true, data: data as T[] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await debugLogger.logError(`Supabase Select - ${table}`, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update data in a table
   * @param table - Table name
   * @param updates - Data to update
   * @param filters - Filters to match rows
   */
  async update<T>(
    table: string,
    updates: Partial<T>,
    filters: Record<string, any>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.client) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      await debugLogger.log('INFO', `Updating ${table}`, { updates, filters });

      let query = this.client.from(table).update(updates);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.select();

      if (error) {
        await debugLogger.logError(`Supabase Update - ${table}`, error);
        return { success: false, error: error.message };
      }

      await debugLogger.log('INFO', `✅ Data updated in ${table}`, { data });
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await debugLogger.logError(`Supabase Update - ${table}`, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete data from a table
   * @param table - Table name
   * @param filters - Filters to match rows
   */
  async delete(
    table: string,
    filters: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.client) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      await debugLogger.log('INFO', `Deleting from ${table}`, { filters });

      let query = this.client.from(table).delete();

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { error } = await query;

      if (error) {
        await debugLogger.logError(`Supabase Delete - ${table}`, error);
        return { success: false, error: error.message };
      }

      await debugLogger.log('INFO', `✅ Data deleted from ${table}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await debugLogger.logError(`Supabase Delete - ${table}`, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Execute a stored procedure/function
   * @param functionName - Name of the function
   * @param params - Parameters to pass to the function
   */
  async rpc<T>(
    functionName: string,
    params?: Record<string, any>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      if (!this.client) {
        return { success: false, error: 'Supabase client not initialized' };
      }

      await debugLogger.log('INFO', `Calling RPC function: ${functionName}`, { params });

      const { data, error } = await this.client.rpc(functionName, params);

      if (error) {
        await debugLogger.logError(`Supabase RPC - ${functionName}`, error);
        return { success: false, error: error.message };
      }

      await debugLogger.log('INFO', `✅ RPC function ${functionName} executed`, { data });
      return { success: true, data: data as T };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await debugLogger.logError(`Supabase RPC - ${functionName}`, error);
      return { success: false, error: errorMessage };
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();

// Export the client directly for advanced usage
export const getSupabaseClient = () => supabaseService.getClient();

