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

// Render Paytm ❤ UPI Logo (pay tm + Red Heart + UPI)
function drawPaytmLogo(x, y, w, h) {
  if (x < 2 || x > w - 3 || y < 2 || y > h - 3) return [255, 255, 255, 255];

  // Top Section: pay (dark blue #002E6E) & tm (cyan #00BAF2)
  if (y >= 20 && y <= 50) {
    if (x >= 40 && x <= 110) return [0, 46, 110, 255]; // 'pay' Dark Navy Blue
    if (x >= 115 && x <= 190) return [0, 186, 242, 255]; // 'tm' Bright Cyan
  }

  // Middle Section: Left Blue Bar - Red Heart ❤ - Right Cyan Bar
  if (y >= 58 && y <= 66) {
    if (x >= 45 && x <= 95) return [0, 46, 110, 255]; // Left Dark Blue Bar
    if (x >= 145 && x <= 195) return [0, 186, 242, 255]; // Right Cyan Bar
  }

  // Red Heart ❤ Center (x: 105 to 135, y: 52 to 72)
  const hx = x - 120;
  const hy = y - 62;
  if (hx * hx + hy * hy <= 100) {
    return [239, 68, 68, 255]; // Bright Red Heart (#EF4444)
  }

  // Bottom Section: "UPI" Logo (x: 50 to 190, y: 76 to 105)
  if (y >= 76 && y <= 105) {
    if (x >= 50 && x <= 150) return [71, 85, 105, 255]; // Slate Dark Text
    if (x >= 155 && x <= 170) return [249, 115, 22, 255]; // Orange Arrow
    if (x >= 172 && x <= 187) return [34, 197, 94, 255]; // Green Arrow
  }

  return [255, 255, 255, 255];
}

const filePath = path.join(paymentsDir, 'paytm.png');
const buf = createPNG(240, 120, drawPaytmLogo);
fs.writeFileSync(filePath, buf);
console.log(`[Paytm Logo Generator] Saved Paytm logo to ${filePath} (${buf.length} bytes)`);
