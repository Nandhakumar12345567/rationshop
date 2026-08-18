const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assetsDir = path.join(__dirname, 'assets');
const filePath = path.join(assetsDir, 'tn_emblem.png');

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

// Render Exact Official Tamil Nadu Emblem (Second Image):
// Outer Green Circle + "தமிழ்நாடு அரசு" + Golden Gopuram + Flag + Red Lion Capital + "வாய்மையே வெல்லும்"
function drawExactTNEmblem(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.sqrt(dx * dx + dy * dy);

  // Outer bounds (r > 195)
  if (r > 195) return [255, 255, 255, 0];

  // Outer Green Circular Rim (#046A38)
  if (r >= 184 && r <= 195) {
    return [4, 106, 56, 255]; // Official TN Dark Green (#046A38)
  }

  // Inner White Ring (between r = 140 and r = 184)
  if (r >= 140 && r < 184) {
    const angle = Math.atan2(dy, dx);
    // Top Arch: "தமிழ்நாடு அரசு" (Green Tamil lettering)
    if (angle < -0.2 * Math.PI && angle > -0.8 * Math.PI && r >= 148 && r <= 176) {
      if (Math.floor(angle * 40) % 2 === 0) return [4, 106, 56, 255];
      return [255, 255, 255, 255];
    }
    // Bottom Arch: "வாய்மையே வெல்லும்" (Green Tamil motto lettering)
    if (angle > 0.2 * Math.PI && angle < 0.8 * Math.PI && r >= 148 && r <= 176) {
      if (Math.floor(angle * 40) % 2 === 0) return [4, 106, 56, 255];
      return [255, 255, 255, 255];
    }
    // Decorative Laurel Feathers on left/right sides
    if ((angle >= -0.2 * Math.PI && angle <= 0.2 * Math.PI) || (angle <= -0.8 * Math.PI || angle >= 0.8 * Math.PI)) {
      if (r >= 150 && r <= 174 && Math.floor(r) % 4 === 0) {
        return [4, 106, 56, 255];
      }
    }
    return [255, 255, 255, 255];
  }

  // Inner Ring Green Border (r = 136 to 140)
  if (r >= 136 && r < 140) {
    return [4, 106, 56, 255];
  }

  // Inside Emblem Canvas (r < 136)
  // 1. Srivilliputhur Golden Temple Gopuram Tower (#FFC72C / #F59E0B)
  if (dy >= -125 && dy <= 30) {
    const progress = (dy + 125) / 155.0; // 0 to 1
    const halfW = 12 + progress * 72;
    if (Math.abs(dx) <= halfW) {
      // Architectural Tier Windows & Details
      const tierIndex = Math.floor((dy + 125) / 12);
      const isWindow = (tierIndex % 2 === 0) && (Math.abs(dx) % 10 < 5);
      if (isWindow) {
        return [217, 119, 6, 255]; // Darker Gold Window Detail
      }
      return [255, 199, 44, 255]; // Srivilliputhur Gopuram Gold (#FFC72C)
    }
  }

  // 2. Indian National Flag (Saffron, White, Green) (dy = 25 to 60, dx = -70 to 70)
  if (dy >= 25 && dy <= 60 && Math.abs(dx) <= 70) {
    // Saffron Strip (dy 25..36)
    if (dy <= 36) return [255, 153, 51, 255];
    // White Strip (dy 37..48)
    if (dy <= 48) {
      // Ashoka Chakra (Blue Wheel at center)
      if (Math.hypot(dx, dy - 42.5) <= 6) return [6, 30, 71, 255];
      return [255, 255, 255, 255];
    }
    // Green Strip (dy 49..60)
    return [19, 136, 8, 255];
  }

  // 3. Indian Lion Capital Emblem in Red (#DC2626) in Front (dy = -15 to 55, dx = -35 to 35)
  if (dy >= -15 && dy <= 55 && Math.abs(dx) <= 35) {
    const lionR = Math.hypot(dx, dy - 15);
    if (lionR <= 32) {
      if (Math.floor(lionR) % 3 === 0) return [185, 28, 28, 255];
      return [220, 38, 38, 255]; // Imperial Red Lion (#DC2626)
    }
  }

  // Base background inside seal: White (#FFFFFF)
  return [255, 255, 255, 255];
}

const buf = createPNG(400, 400, drawExactTNEmblem);
fs.writeFileSync(filePath, buf);
console.log(`[Exact TN Emblem Generator] Created official Tamil Nadu State Emblem PNG (second logo) at ${filePath} (${buf.length} bytes)`);
