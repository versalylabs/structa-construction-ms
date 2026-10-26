import fs from "fs";
import path from "path";

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#c2410c" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#f59e0b" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Container rounded badge -->
  <rect width="64" height="64" rx="14" fill="url(#bgGrad)" stroke="#f59e0b" stroke-width="2" stroke-opacity="0.7"/>

  <!-- Structural foundation line -->
  <path d="M12 48L52 48" stroke="#334155" stroke-width="1.5" stroke-dasharray="2 2"/>

  <!-- Construction Hard Hat Silhouette -->
  <g filter="url(#glow)">
    <!-- Helmet Dome -->
    <path d="M18 36C18 24.9543 24.268 18 32 18C39.732 18 46 24.9543 46 36H18Z" fill="url(#amberGrad)"/>
    
    <!-- Helmet Top Structural Rib -->
    <path d="M30 17H34V35H30V17Z" fill="#fef3c7" opacity="0.95"/>
    
    <!-- Lateral reinforce ridges -->
    <path d="M24 23C25 21 27 20 27 20L27 34H24V23Z" fill="#fbbf24" opacity="0.7"/>
    <path d="M40 23C39 21 37 20 37 20L37 34H40V23Z" fill="#d97706" opacity="0.7"/>

    <!-- Helmet Brim / Visor -->
    <path d="M13 36C13 35.4477 13.4477 35 14 35H50C50.5523 35 51 35.4477 51 36C51 38.5 48.5 40 45 40H19C15.5 40 13 38.5 13 36Z" fill="url(#flameGrad)"/>
    <path d="M14 36H50" stroke="#fef3c7" stroke-width="1" opacity="0.45"/>
  </g>

  <!-- Structural Steel Base Beam with Gold Rivets -->
  <rect x="16" y="44" width="32" height="6" rx="1.5" fill="#1e293b" stroke="#f59e0b" stroke-width="1"/>
  <circle cx="21" cy="47" r="1.2" fill="#fbbf24"/>
  <circle cx="32" cy="47" r="1.2" fill="#fbbf24"/>
  <circle cx="43" cy="47" r="1.2" fill="#fbbf24"/>
</svg>`;

// Write SVGs to public/ and src/app/
const targets = [
  path.join(process.cwd(), "public", "icon.svg"),
  path.join(process.cwd(), "public", "favicon.svg"),
  path.join(process.cwd(), "src", "app", "icon.svg"),
];

for (const target of targets) {
  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(target, svgContent.trim(), "utf8");
  console.log(`Created: ${target}`);
}

// Generate a valid 32x32 BMP-based ICO file pure in Node.js
function generateSimpleIco() {
  const width = 32;
  const height = 32;
  const bpp = 32; // 32-bit BGRA
  const imageSize = width * height * 4;
  const maskSize = (width * height) / 8; // 1-bit transparency mask
  const biSizeImage = imageSize + maskSize;
  const dibHeaderSize = 40;
  const dibTotalSize = dibHeaderSize + biSizeImage;

  // ICO header: 6 bytes
  // Entry: 16 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(1, 4); // Count 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(width, 0);
  entry.writeUInt8(height, 1);
  entry.writeUInt8(0, 2); // Colors in palette
  entry.writeUInt8(0, 3); // Reserved
  entry.writeUInt16LE(1, 4); // Color planes
  entry.writeUInt16LE(bpp, 6); // Bits per pixel
  entry.writeUInt32LE(dibTotalSize, 8); // Size of image data
  entry.writeUInt32LE(22, 12); // Offset (6 + 16 = 22)

  // BITMAPINFOHEADER
  const bih = Buffer.alloc(dibHeaderSize);
  bih.writeUInt32LE(40, 0); // biSize
  bih.writeInt32LE(width, 4); // biWidth
  bih.writeInt32LE(height * 2, 8); // biHeight (doubled for mask in ICO)
  bih.writeUInt16LE(1, 12); // biPlanes
  bih.writeUInt16LE(bpp, 14); // biBitCount
  bih.writeUInt32LE(0, 16); // biCompression = BI_RGB
  bih.writeUInt32LE(biSizeImage, 20); // biSizeImage
  bih.writeInt32LE(0, 24); // biXPelsPerMeter
  bih.writeInt32LE(0, 28); // biYPelsPerMeter
  bih.writeUInt32LE(0, 32); // biClrUsed
  bih.writeUInt32LE(0, 36); // biClrImportant

  // Generate pixels (bottom-up in BMP). We draw a sharp amber construction hardhat & dark background
  const pixelData = Buffer.alloc(imageSize);
  const maskData = Buffer.alloc(maskSize); // 0 = opaque, 1 = transparent

  for (let y = 0; y < height; y++) {
    // BMP is bottom-up, so row 0 is the bottom
    const visualY = height - 1 - y;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - 15.5;
      const dy = visualY - 15.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded badge outer boundary
      if (Math.abs(dx) <= 14 && Math.abs(dy) <= 14 && dist <= 17) {
        // Hardhat shape
        const isHelmetDome = (visualY >= 9 && visualY <= 18 && Math.abs(x - 15.5) <= (visualY - 8) * 1.1 && Math.abs(x - 15.5) <= 9);
        const isCenterRib = (Math.abs(x - 15.5) <= 1 && visualY >= 8 && visualY <= 17);
        const isBrim = (visualY >= 18 && visualY <= 20 && Math.abs(x - 15.5) <= 12);
        const isBaseBeam = (visualY >= 23 && visualY <= 25 && Math.abs(x - 15.5) <= 10);
        const isRivet = (visualY === 24 && (x === 8 || x === 15 || x === 16 || x === 23));

        if (isCenterRib) {
          // Off-white / light cream highlight
          pixelData[idx] = 200; // B
          pixelData[idx + 1] = 245; // G
          pixelData[idx + 2] = 255; // R
          pixelData[idx + 3] = 255; // A
        } else if (isRivet) {
          // Bright gold
          pixelData[idx] = 40;
          pixelData[idx + 1] = 220;
          pixelData[idx + 2] = 255;
          pixelData[idx + 3] = 255;
        } else if (isBrim) {
          // Flame orange
          pixelData[idx] = 20;
          pixelData[idx + 1] = 115;
          pixelData[idx + 2] = 249;
          pixelData[idx + 3] = 255;
        } else if (isHelmetDome) {
          // Amber
          pixelData[idx] = 20;
          pixelData[idx + 1] = 158;
          pixelData[idx + 2] = 245;
          pixelData[idx + 3] = 255;
        } else if (isBaseBeam) {
          // Slate beam
          pixelData[idx] = 59;
          pixelData[idx + 1] = 41;
          pixelData[idx + 2] = 30;
          pixelData[idx + 3] = 255;
        } else if (Math.abs(dx) >= 13 || Math.abs(dy) >= 13) {
          // Amber border
          pixelData[idx] = 11;
          pixelData[idx + 1] = 158;
          pixelData[idx + 2] = 245;
          pixelData[idx + 3] = 255;
        } else {
          // Dark background #090d16
          pixelData[idx] = 22; // B
          pixelData[idx + 1] = 13; // G
          pixelData[idx + 2] = 9;  // R
          pixelData[idx + 3] = 255; // A
        }
      } else {
        // Transparent outside
        pixelData[idx + 3] = 0;
        const maskByte = Math.floor((y * width + x) / 8);
        const maskBit = 7 - ((y * width + x) % 8);
        maskData[maskByte] |= (1 << maskBit);
      }
    }
  }

  const icoBuffer = Buffer.concat([header, entry, bih, pixelData, maskData]);
  fs.writeFileSync(path.join(process.cwd(), "public", "favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(process.cwd(), "src", "app", "favicon.ico"), icoBuffer);
  console.log("Created: public/favicon.ico and src/app/favicon.ico");
}

generateSimpleIco();
console.log("All favicon assets generated successfully!");
