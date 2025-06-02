# 🛠️ Build/Deploy Debugging Guide

## ✅ Issues Fixed

I've identified and fixed several build-breaking issues:

### **1. Node.js Import Errors**
- **Problem**: Unused `fs` and `path` imports in background function
- **Fix**: Removed unused imports, simplified code

### **2. Variable Scope Issues** 
- **Problem**: `ritualId` variable referenced outside of scope in error handling
- **Fix**: Proper variable scoping and error handling

### **3. Missing CORS Headers**
- **Problem**: New functions missing proper CORS configuration  
- **Fix**: Added comprehensive CORS headers to all functions

### **4. Netlify Timeout Configuration**
- **Problem**: 900-second timeout not supported on all tiers
- **Fix**: Simplified all timeouts to 26 seconds maximum

## 🚀 Quick Test to Verify Fix

To test if the ritual experience is working:

### **Test 1: Check Build Status**
1. Go to your Netlify dashboard
2. Check if the latest deploy succeeded
3. If still failing, check the deploy logs for specific errors

### **Test 2: Manual Function Test**
Open your browser's developer console and run:

```javascript
// Test the background function
fetch('/.netlify/functions/background-deepseek', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        ritualId: 'test_' + Date.now() + '_abc123',
        message: 'test message',
        responseMode: 'moderate', 
        maxTokens: 200
    })
}).then(r => r.json()).then(console.log);

// Test the check function  
fetch('/.netlify/functions/check-ritual?id=test_1234567890_abc123')
.then(r => r.json()).then(console.log);
```

### **Test 3: UI Ritual Experience**
1. Set response slider to **Level 4** (Profound Mysteries)
2. Ask any question
3. You should see the ritual interface with:
   - "Initiating mystical ritual..." message
   - Progress bar
   - Phase updates every 30 seconds
   - Cancel button

## 📋 Common Build Errors & Solutions

### **Error: "Cannot resolve module"**
**Solution**: Check all imports in function files are valid

### **Error: "Syntax error in netlify.toml"**
**Solution**: Verify netlify.toml format (no tabs, proper TOML syntax)

### **Error: "Function timeout exceeded"** 
**Solution**: Already fixed - all timeouts now ≤26 seconds

### **Error: "CORS policy"**
**Solution**: Already fixed - proper CORS headers added

## 🔧 Fallback: Disable Ritual Experience

If you want to get the site working immediately while debugging, you can temporarily disable the ritual experience:

```javascript
// In script.js, change this line:
if (tokenCount > 350) {
    // Use ritual experience for longer responses
    startWizardRitual(messageText, responseMode, tokenCount);
} else {
    // Use immediate response for shorter responses
    sendImmediateMessage(messageText, responseMode, tokenCount);
}

// To this:
// Always use immediate response (disable ritual)
sendImmediateMessage(messageText, responseMode, tokenCount);
```

## 🎯 Next Steps

1. **Push the fixed files** to trigger a new deploy
2. **Check the deploy logs** in Netlify dashboard
3. **Test the ritual experience** with Level 4+ responses
4. **Report any remaining errors** for further debugging

The ritual experience should now work properly! Level 1-3 will give immediate responses, Level 4-6 will show the mystical ritual interface.
