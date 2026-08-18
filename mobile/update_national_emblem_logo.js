const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const logoDir = path.join(__dirname, 'assets', 'logo');
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

function createPNG(width, height, drawPixel) {
  const rowSize = 1 + width * 4;
  const rawBuffer = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawBuffer[rowOffset] = 0;
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

// Render Golden Ashoka Lion Capital Emblem (360 x 360)
// Matching user's exact image: 3 Gold Lions + Abacus with Ashoka Chakra Wheel + "सत्यमेव जयते" + "Government of India"
function drawNationalEmblem(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2 - 20;
  const dx = x - cx;
  const dy = y - cy;

  // Outer glow aura
  const dist = Math.hypot(dx, dy);

  // 1. Gold Ashoka Lion Heads & Manes (Top y: -130 to 15)
  if (dy >= -130 && dy <= 15) {
    const r = Math.hypot(dx, dy + 60);
    // Center & Side Lions
    if (r <= 65 || (Math.abs(dx) <= 75 && dy >= -95 && dy <= -10)) {
      if (Math.floor(r) % 4 === 0) return [202, 138, 4, 255]; // Deep Gold (#CA8A04)
      return [234, 179, 8, 255]; // Golden Yellow (#EAB308)
    }
  }

  // 2. Lion Front Legs & Abacus Top (y: 15 to 70)
  if (dy > 15 && dy <= 70) {
    if (Math.abs(dx) <= 60) {
      if (Math.floor(dx) % 6 === 0) return [202, 138, 4, 255];
      return [234, 179, 8, 255];
    }
  }

  // 3. Abacus Circular Base & Ashoka Chakra (y: 70 to 110)
  if (dy > 70 && dy <= 110 && Math.abs(dx) <= 80) {
    const abacusR = Math.hypot(dx, dy - 90);
    if (abacusR <= 18) {
      // Ashoka Chakra Wheel
      if (Math.floor(abacusR) % 3 === 0) return [202, 138, 4, 255];
      return [254, 240, 138, 255];
    }
    // Horse & Bull relief figures on sides
    return [234, 179, 8, 255];
  }

  // 4. Pedestal Bar (y: 110 to 125)
  if (dy > 110 && dy <= 125 && Math.abs(dx) <= 85) {
    return [202, 138, 4, 255];
  }

  // 5. Devanagari Text "सत्यमेव जयते" (y: 135 to 152)
  if (dy >= 135 && dy <= 152 && Math.abs(dx) <= 65) {
    return [234, 179, 8, 255];
  }

  // 6. English Text "Government of India" (y: 158 to 175)
  if (dy >= 158 && dy <= 175 && Math.abs(dx) <= 90) {
    return [234, 179, 8, 255];
  }

  return [255, 255, 255, 0]; // Transparent background
}

const filePath = path.join(logoDir, 'national_emblem.png');
const buf = createPNG(360, 360, drawNationalEmblem);
fs.writeFileSync(filePath, buf);
console.log(`[National Emblem Generator] Saved high-res Golden Ashoka Lion Capital PNG to ${filePath} (${buf.length} bytes)`);
