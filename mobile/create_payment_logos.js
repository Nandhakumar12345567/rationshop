const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output directory exists
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

// Drawers for Payment Logos (Width 200, Height 100)
const logos = {
  gpay: (x, y, w, h) => {
    // White background card with GPay colors (Blue, Red, Yellow, Green)
    if (x < 4 || x > w - 4 || y < 4 || y > h - 4) return [203, 213, 225, 255];
    // G logo shape
    const dx = x - 60;
    const dy = y - 50;
    const r = Math.sqrt(dx * dx + dy * dy);

    if (r > 20 && r <= 32) {
      if (x > 60 && y >= 40 && y <= 60) return [66, 133, 244, 255]; // Blue
      if (y < 50 && x <= 60) return [234, 67, 53, 255]; // Red
      if (x <= 60 && y >= 50) return [251, 188, 5, 255]; // Yellow
      return [52, 168, 83, 255]; // Green
    }
    // "Pay" text bar
    if (x >= 100 && x <= 160 && y >= 40 && y <= 60) {
      return [95, 99, 104, 255];
    }
    return [255, 255, 255, 255];
  },
  phonepe: (x, y, w, h) => {
    // PhonePe Purple (#5F259F)
    if (x < 4 || x > w - 4 || y < 4 || y > h - 4) return [95, 37, 159, 255];
    // PhonePe Logo Pe Symbol
    const dx = x - 50;
    const dy = y - 50;
    if (dx * dx + dy * dy <= 700) return [255, 255, 255, 255];
    if (x >= 90 && x <= 160 && y >= 35 && y <= 65) return [255, 255, 255, 255];
    return [95, 37, 159, 255];
  },
  paytm: (x, y, w, h) => {
    // Paytm Dark Blue (#002E6E) & Cyan (#00BAF2)
    if (x < 4 || x > w - 4 || y < 4 || y > h - 4) return [0, 46, 110, 255];
    if (x >= 30 && x <= 100 && y >= 30 && y <= 70) return [255, 255, 255, 255];
    if (x >= 105 && x <= 170 && y >= 30 && y <= 70) return [0, 186, 242, 255];
    return [0, 46, 110, 255];
  },
  upi: (x, y, w, h) => {
    // BHIM UPI Saffron & Green Gradient Card
    if (x < 4 || x > w - 4 || y < 4 || y > h - 4) return [255, 153, 51, 255];
    if (y < 50) return [255, 153, 51, 255]; // Saffron
    return [19, 136, 8, 255]; // Green
  },
  netbanking: (x, y, w, h) => {
    // Bank Building Icon & Slate Theme
    if (x < 4 || x > w - 4 || y < 4 || y > h - 4) return [15, 23, 42, 255];
    if (y >= 25 && y <= 35 && x >= 40 && x <= 160) return [56, 189, 248, 255];
    if (y >= 40 && y <= 75 && ((x >= 50 && x <= 65) || (x >= 90 && x <= 105) || (x >= 130 && x <= 145))) {
      return [255, 255, 255, 255];
    }
    return [15, 23, 42, 255];
  },
  card: (x, y, w, h) => {
    // Credit Card Gold Chip & Blue/Orange Circles (Mastercard/Visa)
    if (x < 4 || x > w - 4 || y < 4 || y > h - 4) return [30, 58, 138, 255];
    // Gold Chip
    if (x >= 30 && x <= 60 && y >= 35 && y <= 65) return [234, 179, 8, 255];
    // Mastercard Circles
    const r1 = Math.sqrt((x - 120) * (x - 120) + (y - 50) * (y - 50));
    const r2 = Math.sqrt((x - 145) * (x - 145) + (y - 50) * (y - 50));
    if (r1 <= 22) return [239, 68, 68, 255]; // Red
    if (r2 <= 22) return [245, 158, 11, 255]; // Amber
    return [30, 58, 138, 255];
  }
};

for (const [name, drawer] of Object.entries(logos)) {
  const filePath = path.join(paymentsDir, `${name}.png`);
  const buf = createPNG(200, 100, drawer);
  fs.writeFileSync(filePath, buf);
  console.log(`[Payment Logo Generator] Created ${name}.png (${buf.length} bytes) at ${filePath}`);
}

console.log('[Payment Logo Generator] All online transaction logos created successfully!');
