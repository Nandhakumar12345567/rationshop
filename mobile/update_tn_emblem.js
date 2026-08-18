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

// Render High Resolution Official Tamil Nadu State Emblem (400 x 400)
// Matching Second Image: Outer Green Ring + Golden Gopuram + Indian Flag + Red Ashoka Lion Capital + Tamil Motto
function drawTNEmblem(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.sqrt(dx * dx + dy * dy);
  const outerR = 190;
  const innerR = 175;
  const ringInnerR = 135;

  // Background outside outer ring: transparent / white
  if (r > outerR) {
    return [255, 255, 255, 0];
  }

  // Outer Dark Green Ring (#0B6623 / #166534)
  if (r >= innerR && r <= outerR) {
    return [11, 102, 35, 255]; // Deep Tamil Nadu Green
  }

  // White Ring Area (between innerR and ringInnerR)
  if (r >= ringInnerR && r < innerR) {
    // Tamil Text "தமிழ்நாடு அரசு" at Top Curve
    const angle = Math.atan2(dy, dx); // -PI to PI
    // Top semicircle (-3/4 PI to -1/4 PI)
    if (angle < -0.25 * Math.PI && angle > -0.75 * Math.PI && r >= 142 && r <= 168) {
      return [11, 102, 35, 255]; // Dark Green Tamil Lettering
    }
    // Bottom semicircle ("வாய்மையே வெல்லும்")
    if (angle > 0.25 * Math.PI && angle < 0.75 * Math.PI && r >= 142 && r <= 168) {
      return [11, 102, 35, 255]; // Dark Green Motto Lettering
    }
    return [255, 255, 255, 255];
  }

  // Inner Ring Green Border
  if (r >= ringInnerR - 4 && r < ringInnerR) {
    return [11, 102, 35, 255];
  }

  // Inner Center Canvas (r < ringInnerR - 4)
  const icx = dx;
  const icy = dy;

  // 1. Srivilliputhur Golden Gopuram Temple Tower (Yellow/Gold #F59E0B / #D97706)
  // Stepped pyramid shape from y = -110 to y = 40
  if (icy >= -110 && icy <= 40) {
    const progress = (icy + 110) / 150.0; // 0 at top, 1 at base
    const halfWidth = 8 + progress * 75; // Tapered pyramid
    if (Math.abs(icx) <= halfWidth) {
      // Horizontal tier grooves
      const tierLine = Math.floor((icy + 110) / 12) % 2 === 0;
      if (tierLine && Math.abs(icx) <= halfWidth - 2) {
        return [217, 119, 6, 255]; // Darker Gold Groove (#D97706)
      }
      return [245, 158, 11, 255]; // Bright Gopuram Gold (#F59E0B)
    }
  }

  // 2. Indian National Flag (Saffron, White, Green) at bottom center (icy = 20 to 55, icx = -65 to 65)
  if (icy >= 20 && icy <= 55 && Math.abs(icx) <= 65) {
    // Saffron Top Strip (icy 20..31)
    if (icy <= 31) return [255, 153, 51, 255];
    // White Middle Strip (icy 32..43)
    if (icy <= 43) {
      // Ashoka Chakra (Blue Wheel at center)
      if (Math.hypot(icx, icy - 37.5) <= 5) return [6, 30, 71, 255]; // Navy Blue Chakra
      return [255, 255, 255, 255];
    }
    // Green Bottom Strip (icy 44..55)
    return [19, 136, 8, 255];
  }

  // 3. Indian Lion Capital Emblem in Red (#DC2626) in front center (icy = -20 to 50, icx = -32 to 32)
  if (icy >= -20 && icy <= 50 && Math.abs(icx) <= 32) {
    const lR = Math.hypot(icx, icy - 15);
    if (lR <= 30) {
      // Lion details / mane lines
      if (Math.floor(lR) % 4 === 0) return [185, 28, 28, 255];
      return [220, 38, 38, 255]; // Imperial Red (#DC2626)
    }
  }

  // Background inside inner ring: White / Pale Cream (#FFFFFF)
  return [255, 255, 255, 255];
}

const buf = createPNG(400, 400, drawTNEmblem);
fs.writeFileSync(filePath, buf);
console.log(`[TN Emblem Generator] Created official Tamil Nadu State Emblem PNG at ${filePath} (${buf.length} bytes)`);
