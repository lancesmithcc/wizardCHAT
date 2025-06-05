const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Define all the icon sizes we need for a comprehensive PWA
const iconSizes = [
  // Favicon sizes
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  
  // Apple touch icons
  { size: 57, name: 'apple-touch-icon-57x57.png' },
  { size: 60, name: 'apple-touch-icon-60x60.png' },
  { size: 72, name: 'apple-touch-icon-72x72.png' },
  { size: 76, name: 'apple-touch-icon-76x76.png' },
  { size: 114, name: 'apple-touch-icon-114x114.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 144, name: 'apple-touch-icon-144x144.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  
  // Android/Chrome icons
  { size: 36, name: 'android-chrome-36x36.png' },
  { size: 48, name: 'android-chrome-48x48.png' },
  { size: 72, name: 'android-chrome-72x72.png' },
  { size: 96, name: 'android-chrome-96x96.png' },
  { size: 144, name: 'android-chrome-144x144.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 256, name: 'android-chrome-256x256.png' },
  { size: 384, name: 'android-chrome-384x384.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
  
  // Windows tiles
  { size: 70, name: 'mstile-70x70.png' },
  { size: 144, name: 'mstile-144x144.png' },
  { size: 150, name: 'mstile-150x150.png' },
  { size: 310, name: 'mstile-310x310.png' },
  
  // Additional standard sizes
  { size: 128, name: 'icon-128x128.png' },
  { size: 256, name: 'icon-256x256.png' }
];

// Rectangular tiles for Windows
const rectangularTiles = [
  { width: 310, height: 150, name: 'mstile-310x150.png' }
];

async function generateIcons() {
  const svgPath = path.join(__dirname, 'icons', 'wizchatlogo.svg');
  const iconsDir = path.join(__dirname, 'icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  console.log('🎭 Generating wizard icons for PWA...');
  
  // Generate square icons
  for (const icon of iconSizes) {
    try {
      await sharp(svgPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(path.join(iconsDir, icon.name));
      
      console.log(`✨ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Error generating ${icon.name}:`, error.message);
    }
  }
  
  // Generate rectangular tiles
  for (const tile of rectangularTiles) {
    try {
      await sharp(svgPath)
        .resize(tile.width, tile.height)
        .png()
        .toFile(path.join(iconsDir, tile.name));
      
      console.log(`✨ Generated ${tile.name} (${tile.width}x${tile.height})`);
    } catch (error) {
      console.error(`❌ Error generating ${tile.name}:`, error.message);
    }
  }
  
  // Generate ICO file for traditional favicon
  try {
    await sharp(svgPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, 'favicon.png'));
    
    console.log('✨ Generated favicon.png (32x32)');
  } catch (error) {
    console.error('❌ Error generating favicon.png:', error.message);
  }
  
  console.log('🎉 All wizard icons generated successfully!');
  console.log('📁 Icons saved to:', iconsDir);
}

generateIcons().catch(console.error); 