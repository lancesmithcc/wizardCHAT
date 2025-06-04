#!/bin/bash

# Wizard Chat App Optimization Implementation Script
# This script backs up your current files and applies the optimizations

echo "🧙‍♂️ Wizard Chat Optimization Script"
echo "===================================="
echo ""

# Create backup directory
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backups in $BACKUP_DIR..."

# Backup current files
cp script.js "$BACKUP_DIR/script.js" 2>/dev/null && echo "✓ Backed up script.js" || echo "⚠️  script.js not found"
cp netlify/functions/deepseek-chat.js "$BACKUP_DIR/deepseek-chat.js" 2>/dev/null && echo "✓ Backed up deepseek-chat.js" || echo "⚠️  deepseek-chat.js not found"

echo ""
echo "🚀 Applying optimizations..."

# Apply optimizations
if [ -f "script_optimized.js" ]; then
    cp script_optimized.js script.js
    echo "✓ Applied optimized script.js"
else
    echo "❌ script_optimized.js not found!"
fi

if [ -f "netlify/functions/deepseek-chat-optimized.js" ]; then
    cp netlify/functions/deepseek-chat-optimized.js netlify/functions/deepseek-chat.js
    echo "✓ Applied optimized deepseek-chat.js"
else
    echo "❌ deepseek-chat-optimized.js not found!"
fi

echo ""
echo "📊 Optimization Summary:"
echo "- Reduced maximum symbols from 25 to 10"
echo "- Implemented symbol pooling for reuse"
echo "- Added request debouncing (1s minimum)"
echo "- Enhanced caching (50 entries, 15 min)"
echo "- Reduced token counts for reliability"
echo "- Optimized timeouts for Netlify limits"
echo "- Added connection status monitoring"
echo ""

echo "🎯 Next Steps:"
echo "1. Test locally with 'npm start' if available"
echo "2. Commit changes: git add . && git commit -m 'Apply performance optimizations'"
echo "3. Deploy to Netlify: git push origin main"
echo "4. Test levels 1-3 for best reliability"
echo ""

echo "💡 Tips:"
echo "- Level 1-3 (Brief to Balanced) are most reliable"
echo "- Level 4-6 may still timeout on busy servers"
echo "- Cache persists for 15 minutes"
echo "- Check browser console for debug info"
echo ""

echo "✨ Optimization complete! May your wizardly wisdom flow swiftly!"