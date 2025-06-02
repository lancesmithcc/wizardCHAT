# 🗄️ Production Database Setup for Ritual Status Tracking

## Current Implementation (Demo/Development)

The current ritual system uses **simulated status tracking** in the `check-ritual.js` function. This works for testing but won't persist data between function calls in production.

## Production Database Options

For a production deployment, you'll need a database to store ritual status. Here are the best options for Netlify:

### **🏆 Recommended: Netlify Blobs (Simplest)**
```javascript
// In background-deepseek.js
import { getStore } from '@netlify/blobs';

const ritualStore = getStore('rituals');

// Store ritual status
await ritualStore.set(ritualId, {
    status: 'processing',
    startTime: new Date().toISOString(),
    message, responseMode, maxTokens
});

// In check-ritual.js  
const ritualData = await ritualStore.get(ritualId);
```

**Pros**: Native Netlify integration, no setup needed, generous free tier  
**Cons**: Newer service, less mature than alternatives

### **🥈 Supabase (Most Features)**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Store ritual status
await supabase.from('rituals').insert({
    id: ritualId,
    status: 'processing',
    start_time: new Date().toISOString(),
    message, response_mode, max_tokens
});

// Check ritual status
const { data } = await supabase
    .from('rituals')
    .select('*')
    .eq('id', ritualId)
    .single();
```

**Pros**: Full PostgreSQL, real-time subscriptions, auth, generous free tier  
**Cons**: Slight overhead for simple use case

### **🥉 PlanetScale (MySQL)**
```javascript
import { connect } from '@planetscale/database';

const db = connect({
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD
});

// Store ritual status
await db.execute(
    'INSERT INTO rituals (id, status, start_time, message) VALUES (?, ?, ?, ?)',
    [ritualId, 'processing', new Date(), message]
);

// Check ritual status
const results = await db.execute(
    'SELECT * FROM rituals WHERE id = ?',
    [ritualId]
);
```

**Pros**: Serverless MySQL, excellent performance, familiar SQL  
**Cons**: Requires SQL knowledge, more setup

### **⚡ Redis (Fastest)**
```javascript
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Store ritual status (with TTL)
await redis.setex(ritualId, 3600, JSON.stringify({
    status: 'processing',
    startTime: new Date().toISOString(),
    message, responseMode, maxTokens
}));

// Check ritual status
const ritualData = await redis.get(ritualId);
```

**Pros**: Extremely fast, automatic cleanup with TTL, simple key-value  
**Cons**: Data is temporary (perfect for rituals though!)

## **Database Schema**

Regardless of which database you choose, you'll need this data structure:

```sql
CREATE TABLE rituals (
    id VARCHAR(255) PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    response_mode VARCHAR(50) NOT NULL,
    max_tokens INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    completed_time TIMESTAMP,
    result JSON,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX idx_rituals_status ON rituals(status);
CREATE INDEX idx_rituals_start_time ON rituals(start_time);
```

## **Implementation Steps**

### **1. Choose Your Database** 
- **For simplicity**: Netlify Blobs
- **For features**: Supabase  
- **For speed**: Redis/Upstash

### **2. Update Environment Variables**
```bash
# .env
DATABASE_URL=your_database_connection_string
# or specific to your chosen service
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### **3. Replace Simulation Code**
In `background-deepseek.js` and `check-ritual.js`, replace the `storeRitualStatus()` and `getRitualStatus()` functions with real database calls.

### **4. Add Error Handling**
```javascript
try {
    await storeRitualStatus(ritualId, statusData);
} catch (dbError) {
    console.error('Database error:', dbError);
    // Fallback to in-memory simulation for demo
}
```

## **My Recommendation: Start with Netlify Blobs**

For your wizard chat, I'd recommend **Netlify Blobs** because:

1. **Zero setup** - works immediately with your Netlify account
2. **Perfect fit** - designed exactly for this use case  
3. **Cost effective** - generous free tier
4. **Simple API** - just key-value storage
5. **Auto cleanup** - can set TTL for old rituals

You can always migrate to a more powerful database later if needed, but Netlify Blobs will handle thousands of concurrent rituals without any issues.

## **Migration Path**

1. **Phase 1**: Deploy current simulation version to test the ritual experience
2. **Phase 2**: Add Netlify Blobs for persistent ritual tracking
3. **Phase 3**: Scale to Supabase/PlanetScale if you need advanced features

The ritual experience works perfectly with the current simulation - the database is just for persistence and handling multiple concurrent users! 🔮✨
