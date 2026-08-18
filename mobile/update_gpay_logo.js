const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const paymentsDir = path.join(__dirname, 'assets', 'payments');
if (!fs.existsSync(paymentsDir)) {
  fs.mkdirSync(paymentsDir, { recursive: true });
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

// Render Google Pay Ribbon Emblem Logo (Width 240, Height 120)
function drawGPayLogo(x, y, w, h) {
  // Border padding
  if (x < 2 || x > w - 3 || y < 2 || y > h - 3) return [255, 255, 255, 255];

  // Center coordinates
  const cx = w / 2;
  const cy = h / 2;

  // Normalized coords relative to center (-1 to 1)
  const nx = (x - cx) / 45.0;
  const ny = (y - cy) / 35.0;

  // Distance from ribbon segments
  // Blue segment (bottom-left)
  const dBlue = Math.hypot(nx + 0.45, ny - 0.1);
  // Green segment (top)
  const dGreen = Math.hypot(nx - 0.05, ny + 0.55);
  // Yellow segment (bottom)
  const dYellow = Math.hypot(nx - 0.1, ny - 0.5);
  // Red segment (top-right)
  const dRed = Math.hypot(nx - 0.55, ny + 0.05);

  // Check GPay Ribbon 4 color segments
  // 1. Blue Ribbon: Left capsule shape
  if (nx >= -0.85 && nx <= -0.05 && ny >= -0.55 && ny <= 0.65) {
    const rx = nx + 0.45;
    const ry = ny - 0.05;
    if (rx * rx + ry * ry <= 0.28) {
      return [26, 115, 232, 255]; // Google Blue (#1A73E8)
    }
  }

  // 2. Green Ribbon: Top-right capsule shape
  if (nx >= -0.35 && nx <= 0.55 && ny >= -0.85 && ny <= 0.05) {
    const rx = nx - 0.1;
    const ry = ny + 0.4;
    if (rx * rx + ry * ry <= 0.26) {
      return [52, 168, 83, 255]; // Google Green (#34A853)
    }
  }

  // 3. Yellow Ribbon: Center-bottom loop
  if (nx >= -0.45 && nx <= 0.35 && ny >= -0.15 && ny <= 0.85) {
    const rx = nx + 0.05;
    const ry = ny - 0.35;
    if (rx * rx + ry * ry <= 0.26) {
      return [251, 188, 4, 255]; // Google Yellow (#FBBC04)
    }
  }

  // 4. Red Ribbon: Right capsule shape
  if (nx >= 0.05 && nx <= 0.85 && ny >= -0.55 && ny <= 0.55) {
    const rx = nx - 0.45;
    const ry = ny;
    if (rx * rx + ry * ry <= 0.26) {
      return [234, 67, 53, 255]; // Google Red (#EA4335)
    }
  }

  return [255, 255, 255, 255];
}

const filePath = path.join(paymentsDir, 'gpay.png');
const buf = createPNG(240, 120, drawGPayLogo);
fs.writeFileSync(filePath, buf);
console.log(`[GPay Logo Generator] Saved GPay ribbon emblem logo to ${filePath} (${buf.length} bytes)`);
