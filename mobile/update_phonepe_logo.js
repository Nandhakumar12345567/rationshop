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

// Render Official PhonePe Logo (Purple Circle with Devanagari Pe + Purple Text)
function drawPhonePeLogo(x, y, w, h) {
  if (x < 2 || x > w - 3 || y < 2 || y > h - 3) return [255, 255, 255, 255];

  // Circle center & radius (5F259F)
  const circleX = 45;
  const circleY = 60;
  const radius = 36;

  const dx = x - circleX;
  const dy = y - circleY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= radius) {
    // Inside Purple Circle (#5F259F)
    // Draw white 'पे' symbol inside circle
    // Horizontal top bar of Pe
    if (dy >= -20 && dy <= -13 && dx >= -18 && dx <= 18) {
      return [255, 255, 255, 255];
    }
    // Slanted top stroke (e matra)
    const lineEq = dy + (1.2 * dx) + 12;
    if (dx >= -12 && dx <= 8 && dy >= -28 && dy <= -13 && Math.abs(lineEq) < 4) {
      return [255, 255, 255, 255];
    }
    // Vertical stem of Pe
    if (dx >= -3 && dx <= 5 && dy >= -15 && dy <= 22) {
      return [255, 255, 255, 255];
    }
    // Loop of Pa
    const ldx = dx - 2;
    const ldy = dy + 2;
    if (ldx >= -16 && ldx <= 4 && ldy >= -14 && ldy <= 6 && (ldx <= -10 || ldy >= 0)) {
      return [255, 255, 255, 255];
    }

    return [95, 37, 159, 255]; // PhonePe Purple (#5F259F)
  }

  // Draw "PhonePe" text in Purple right side of logo
  if (x >= 95 && x <= 220 && y >= 40 && y <= 80) {
    return [95, 37, 159, 255];
  }

  return [255, 255, 255, 255];
}

const filePath = path.join(paymentsDir, 'phonepe.png');
const buf = createPNG(240, 120, drawPhonePeLogo);
fs.writeFileSync(filePath, buf);
console.log(`[PhonePe Logo Generator] Saved PhonePe logo to ${filePath} (${buf.length} bytes)`);
