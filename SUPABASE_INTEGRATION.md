# Supabase Integration Guide

## Overview

This document provides comprehensive information about the Supabase integration in the SDINMOTION mobile app.

**Date Added:** November 25, 2025  
**Version:** 1.0  
**Supabase Client Version:** @supabase/supabase-js (latest)

---

## Table of Contents

1. [What is Supabase?](#what-is-supabase)
2. [Setup & Configuration](#setup--configuration)
3. [Service Architecture](#service-architecture)
4. [Usage Examples](#usage-examples)
5. [Testing](#testing)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## What is Supabase?

Supabase is an open-source Firebase alternative providing:
- **PostgreSQL Database** - Scalable relational database
- **Real-time subscriptions** - Live data updates
- **Authentication** - Built-in user management
- **Storage** - File upload and management
- **Edge Functions** - Serverless functions

**Project URL:** https://khfbhksommoijhekquzl.supabase.co

---

## Setup & Configuration

### 1. Environment Variables

The app requires two environment variables to connect to Supabase:

**`.env` file:**
```env
VITE_SUPABASE_URL=https://khfbhksommoijhekquzl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZmJoa3NvbW1vaWpoZWtxdXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTcxODcsImV4cCI6MjA3OTU5MzE4N30.A5rEzv84jmfONAKUQnJfiJUQnlT18Y7ZHU1Cl51VIFA
```

### 2. Installation

The Supabase client is already installed. If you need to reinstall:

```bash
npm install @supabase/supabase-js
```

### 3. Mobile Build Configuration

For mobile builds (Android/iOS), ensure environment variables are available:

**Android:**
- Variables are bundled during build via Vite
- Run `npm run mobile:sync` after changing `.env`

**iOS:**
- Same as Android
- Rebuild with `npm run mobile:sync` after `.env` changes

---

## Service Architecture

### `src/services/supabaseService.ts`

The `SupabaseService` class provides:

#### **Singleton Pattern**
- Single shared instance across the app
- Automatic initialization on import
- Built-in connection testing

#### **Core Methods**

| Method | Description | Returns |
|--------|-------------|---------|
| `getClient()` | Get raw Supabase client | `SupabaseClient \| null` |
| `isReady()` | Check if service is initialized | `boolean` |
| `testConnection()` | Test database connectivity | `Promise<{success, error?}>` |
| `from(table)` | Query builder for custom queries | `QueryBuilder` |
| `insert(table, data)` | Insert records | `Promise<{success, data?, error?}>` |
| `select(table, columns?, filters?)` | Select records | `Promise<{success, data?, error?}>` |
| `update(table, updates, filters)` | Update records | `Promise<{success, data?, error?}>` |
| `delete(table, filters)` | Delete records | `Promise<{success, error?}>` |
| `rpc(functionName, params?)` | Call stored procedure | `Promise<{success, data?, error?}>` |

#### **Integrated Logging**
All operations automatically log to:
- Browser console (development)
- `debugLogger` (mobile debugging)

---

## Usage Examples

### 1. Import the Service

```typescript
import { supabaseService } from './services/supabaseService';
```

### 2. Insert Data

```typescript
const result = await supabaseService.insert('faults', {
  title: 'Pothole on Main Street',
  description: 'Large pothole causing traffic issues',
  location: 'Main Street, City Center',
  status: 'open',
  created_at: new Date().toISOString()
});

if (result.success) {
  console.log('Fault created:', result.data);
} else {
  console.error('Failed to create fault:', result.error);
}
```

### 3. Select Data

```typescript
// Get all faults
const allFaults = await supabaseService.select('faults');

// Get faults with filters
const openFaults = await supabaseService.select(
  'faults',
  '*',
  { status: 'open' }
);

if (openFaults.success) {
  console.log('Open faults:', openFaults.data);
}
```

### 4. Update Data

```typescript
const result = await supabaseService.update(
  'faults',
  { status: 'resolved', resolved_at: new Date().toISOString() },
  { id: '123' }
);

if (result.success) {
  console.log('Fault updated:', result.data);
}
```

### 5. Delete Data

```typescript
const result = await supabaseService.delete('faults', { id: '123' });

if (result.success) {
  console.log('Fault deleted');
}
```

### 6. Advanced Queries (Raw Client)

```typescript
import { getSupabaseClient } from './services/supabaseService';

const client = getSupabaseClient();

if (client) {
  const { data, error } = await client
    .from('faults')
    .select('*, user:users(name, email)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(10);
}
```

### 7. Real-time Subscriptions

```typescript
import { getSupabaseClient } from './services/supabaseService';

const client = getSupabaseClient();

if (client) {
  const channel = client
    .channel('faults_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'faults' },
      (payload) => {
        console.log('Change received:', payload);
      }
    )
    .subscribe();

  // Cleanup when done
  // channel.unsubscribe();
}
```

### 8. Call RPC Functions

```typescript
const result = await supabaseService.rpc('get_nearby_faults', {
  lat: -25.7479,
  lng: 28.2293,
  radius_km: 5
});

if (result.success) {
  console.log('Nearby faults:', result.data);
}
```

---

## Testing

### 1. Browser Console Test

Open the app in a browser and run:

```javascript
await testSupabase();
```

This function is automatically available in the browser console.

### 2. Programmatic Test

```typescript
import { testSupabaseConnection } from './utils/testSupabase';

// In your component or startup logic
await testSupabaseConnection();
```

### 3. Manual Connection Check

```typescript
import { supabaseService } from './services/supabaseService';

if (supabaseService.isReady()) {
  console.log('✅ Supabase is ready');
  
  const result = await supabaseService.testConnection();
  if (result.success) {
    console.log('✅ Connection successful');
  } else {
    console.error('❌ Connection failed:', result.error);
  }
} else {
  console.error('❌ Supabase not initialized');
}
```

---

## Security Best Practices

### 1. Row Level Security (RLS)

Always enable RLS on your Supabase tables:

```sql
-- Enable RLS on faults table
ALTER TABLE faults ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read
CREATE POLICY "Allow public read access"
ON faults FOR SELECT
USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated insert"
ON faults FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

### 2. API Keys

- ✅ **ANON KEY** - Safe to use in client-side code (already configured)
- ❌ **SERVICE ROLE KEY** - NEVER expose in client code
  - Only use on server-side/backend
  - Has full database access

### 3. Environment Variables

- Never commit `.env` file to git (already in `.gitignore`)
- Use `.env.example` as a template
- Rotate keys if accidentally exposed

### 4. Data Validation

Always validate data before inserting:

```typescript
function validateFault(data: any): boolean {
  return (
    typeof data.title === 'string' &&
    data.title.length > 0 &&
    typeof data.description === 'string' &&
    data.description.length > 0
  );
}

if (validateFault(faultData)) {
  await supabaseService.insert('faults', faultData);
}
```

---

## Troubleshooting

### Issue: "Supabase client not initialized"

**Cause:** Environment variables not loaded

**Solution:**
1. Verify `.env` file exists in project root
2. Check variables are prefixed with `VITE_`
3. Restart dev server: `npm run dev`
4. Rebuild mobile: `npm run mobile:sync`

### Issue: "Failed to fetch" / Network Error

**Cause:** Network connectivity or CORS issues

**Solution:**
1. Check internet connection
2. Verify Supabase project is not paused (free tier pauses after 7 days inactivity)
3. Check Supabase dashboard: https://app.supabase.com/project/khfbhksommoijhekquzl
4. Restart Supabase project if paused

### Issue: "Permission denied" / "Row level security"

**Cause:** RLS policies blocking access

**Solution:**
1. Check RLS policies in Supabase dashboard
2. Create appropriate policies for your use case
3. For testing, temporarily disable RLS (not recommended for production)

### Issue: Real-time not working

**Cause:** Real-time not enabled or table not configured

**Solution:**
1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for your table
3. Verify real-time is enabled in project settings

---

## Debug Logging

All Supabase operations are automatically logged via `debugLogger`:

**View logs on device:**
```bash
# Android
.\get-phone-logs.ps1

# iOS
./get-phone-logs.sh
```

**Log file location:**
- Android: `/sdcard/Documents/sdinmotion_debug.log`
- iOS: `Documents/sdinmotion_debug.log`

---

## Database Schema Example

Here's a suggested schema for storing fault reports:

```sql
-- Create faults table
CREATE TABLE faults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  image_url TEXT,
  bitrix24_task_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE faults ENABLE ROW LEVEL SECURITY;

-- Create policy for public read
CREATE POLICY "Allow public read access"
ON faults FOR SELECT
USING (true);

-- Create policy for public insert (adjust as needed)
CREATE POLICY "Allow public insert"
ON faults FOR INSERT
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_faults_status ON faults(status);
CREATE INDEX idx_faults_created_at ON faults(created_at DESC);
CREATE INDEX idx_faults_location ON faults(latitude, longitude);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON faults
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

---

## Next Steps

1. ✅ Supabase is installed and configured
2. ✅ Service layer created with full CRUD operations
3. ✅ Debug logging integrated
4. ⏳ Create database tables in Supabase dashboard
5. ⏳ Set up Row Level Security policies
6. ⏳ Integrate with existing fault reporting workflow
7. ⏳ Add real-time updates for fault status changes

---

## Support & Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Supabase Dashboard:** https://app.supabase.com/project/khfbhksommoijhekquzl
- **JavaScript Client Docs:** https://supabase.com/docs/reference/javascript
- **Community Support:** https://github.com/supabase/supabase/discussions

---

**Last Updated:** November 25, 2025  
**Author:** AI Assistant  
**Project:** SDINMOTION Mobile App

