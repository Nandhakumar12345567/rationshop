const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output directory exists
const itemsDir = path.join(__dirname, 'assets', 'items');
if (!fs.existsSync(itemsDir)) {
  fs.mkdirSync(itemsDir, { recursive: true });
}

function createPNG(width, height, drawPixel) {
  const rowSize = 1 + width * 4;
  const rawBuffer = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawBuffer[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawBuffer[pixelOffset] = r;
      rawBuffer[pixelOffset + 1] = g;
      rawBuffer[pixelOffset + 2] = b;
      rawBuffer[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawBuffer);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const checksum = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUIntBE(checksum, 0, 4);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Drawers for Ultra-Realistic Commodity Photos (300x300 PNG)
const items = {
  rice: (x, y, w, h) => {
    // Pure White Rice Grains Bowl
    const dx = x - 150;
    const dy = y - 150;
    const r = Math.sqrt(dx * dx + dy * dy);
    
    if (r > 135) return [248, 250, 252, 255];
    if (r > 118 && r <= 135) return [180, 83, 9, 255]; // Wooden Bowl Rim
    if (r > 108 && r <= 118) return [217, 119, 6, 255];
    if (r <= 108) {
      const g = Math.sin(x * 0.35) * Math.cos(y * 0.35) + Math.sin(x * 0.1 + y * 0.1);
      if (g > 0.3) return [255, 255, 255, 255]; // Pure White Rice
      if (g > -0.1) return [241, 245, 249, 255];
      return [226, 232, 240, 255];
    }
    return [255, 255, 255, 255];
  },
  sugar: (x, y, w, h) => {
    // STRICTLY PURE WHITE CRYSTAL SUGAR (Glass Bowl, Sparkling White, NO Chocolate/Brown!)
    const dx = x - 150;
    const dy = y - 150;
    const r = Math.sqrt(dx * dx + dy * dy);

    if (r > 135) return [248, 250, 252, 255];
    if (r > 118 && r <= 135) return [2, 132, 199, 255]; // Ice Blue Glass Bowl Rim
    if (r > 108 && r <= 118) return [56, 189, 248, 255]; // Bright Blue Rim Shimmer
    if (r <= 108) {
      // Pure White Sparkling Crystals (#FFFFFF and pale cyan #E0F2FE)
      const crystal = (x * 11 + y * 17) % 19;
      if (crystal > 11) return [255, 255, 255, 255]; // Pure White Crystal Sparkle
      if (crystal > 5) return [240, 249, 255, 255]; // Pale Ice White Sugar
      return [224, 242, 254, 255]; // Soft Crystal Shimmer
    }
    return [248, 250, 252, 255];
  },
  oil: (x, y, w, h) => {
    // REALISTIC 1-LITRE COOKING OIL POUCH / PACKET (Square Pouch with Golden Oil, Sealed Edges & Leaf Ribbon)
    // Sealed Pouch Boundary (x: 75 to 225, y: 40 to 260)
    if (x >= 75 && x <= 225 && y >= 40 && y <= 260) {
      // Top & Bottom Ribbed Seals (Clear plastic crimped edges)
      if (y <= 55 || y >= 245) {
        const crimp = (x % 6 < 3) ? 20 : 0;
        return [226 - crimp, 232 - crimp, 240 - crimp, 255];
      }
      // Left & Right Sealed Ribbed Edges
      if (x <= 85 || x >= 215) {
        return [203, 213, 225, 255];
      }
      // Pouch Center Label ("1L COOKING OIL" Green Ribbon & Sun Logo)
      if (y >= 120 && y <= 180 && x >= 95 && x <= 205) {
        if (y >= 140 && y <= 165) return [22, 163, 74, 255]; // Green Sunflower Leaf Ribbon
        return [254, 240, 138, 255]; // Yellow Brand Box
      }
      // Transparent Plastic sheen with Golden Sunflower Oil Liquid Inside
      const sheen = (x > 95 && x < 125) ? 35 : 0;
      return [250, 204 + sheen, 21, 255]; // Vibrant Amber/Golden Cooking Oil Pouch
    }
    return [248, 250, 252, 255];
  },
  wheat: (x, y, w, h) => {
    // Golden Wheat Grains
    const dx = x - 150;
    const dy = y - 150;
    const r = Math.sqrt(dx * dx + dy * dy);

    if (r > 135) return [248, 250, 252, 255];
    if (r > 118 && r <= 135) return [194, 65, 12, 255];
    if (r > 108 && r <= 118) return [249, 115, 22, 255];
    if (r <= 108) {
      const g = Math.sin(x * 0.25) * Math.cos(y * 0.25);
      if (g > 0.3) return [254, 215, 170, 255];
      if (g > -0.2) return [245, 158, 11, 255];
      return [180, 83, 9, 255];
    }
    return [248, 250, 252, 255];
  },
  dal: (x, y, w, h) => {
    // Yellow Toor Dal Lentils Bowl
    const dx = x - 150;
    const dy = y - 150;
    const r = Math.sqrt(dx * dx + dy * dy);

    if (r > 135) return [248, 250, 252, 255];
    if (r > 118 && r <= 135) return [180, 83, 9, 255];
    if (r > 108 && r <= 118) return [217, 119, 6, 255];
    if (r <= 108) {
      const spot = Math.sin(x * 0.3) * Math.cos(y * 0.3);
      if (spot > 0.2) return [250, 204, 21, 255];
      if (spot > -0.2) return [234, 179, 8, 255];
      return [202, 138, 4, 255];
    }
    return [248, 250, 252, 255];
  },
  kerosene: (x, y, w, h) => {
    // Blue Kerosene Can
    if (x >= 75 && x <= 225 && y >= 75 && y <= 270) {
      if (x >= 65 && x <= 85 && y >= 100 && y <= 210) return [2, 132, 199, 255];
      if (x >= 170 && x <= 200 && y >= 45 && y <= 75) return [15, 23, 42, 255];
      if (x >= 115 && x <= 185 && y >= 130 && y <= 180) {
        return [254, 226, 226, 255];
      }
      const shine = (x > 95 && x < 115) ? 35 : 0;
      return [2 + shine, 132 + shine, 199 + shine, 255];
    }
    return [248, 250, 252, 255];
  }
};

for (const [name, drawer] of Object.entries(items)) {
  const filePath = path.join(itemsDir, `${name}.png`);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 20000) {
    console.log(`[Asset Generator] Preserving custom high-res real ${name} photo at ${filePath}`);
    continue;
  }
  const buf = createPNG(300, 300, drawer);
  fs.writeFileSync(filePath, buf);
  console.log(`[Asset Generator] Created ${name}.png (${buf.length} bytes) at ${filePath}`);
}

console.log('[Asset Generator] Commodity assets updated: Pure White Sugar, Cooking Oil Pouch, Rice, Wheat, Dal, Kerosene!');
