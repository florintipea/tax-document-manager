#!/usr/bin/env node
/**
 * Generate PWA / mobile PNG icons from public/logo.svg
 *
 * Custom branding: replace public/logo.svg with your own square SVG (or PNG via
 * LOGO_SOURCE env), then run: npm run mobile:icons
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconsDir = join(root, 'public', 'icons');
const defaultLogo = join(root, 'public', 'logo.svg');
const logoSource = process.env.LOGO_SOURCE || defaultLogo;

mkdirSync(iconsDir, { recursive: true });

async function rasterizeWithSharp(source, size) {
  const sharp = (await import('sharp')).default;
  const input = extname(source).toLowerCase() === '.svg'
    ? readFileSync(source)
    : source;
  return sharp(input, { density: Math.max(144, size) })
    .resize(size, size, { fit: 'contain', background: { r: 37, g: 99, b: 235, alpha: 1 } })
    .png()
    .toBuffer();
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function setPixel(raw, size, x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const rowSize = 1 + size * 3;
  const offset = y * rowSize + 1 + x * 3;
  raw[offset] = r;
  raw[offset + 1] = g;
  raw[offset + 2] = b;
}

function fillRoundedRect(raw, size, x0, y0, w, h, radius, r, g, b) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const dx = Math.min(x - x0, x0 + w - 1 - x);
      const dy = Math.min(y - y0, y0 + h - 1 - y);
      const corner = radius - Math.min(dx, dy);
      if (corner < 0 || (dx >= radius && dy >= radius)) {
        setPixel(raw, size, x, y, r, g, b);
      } else if (corner <= radius) {
        const cx = dx < radius ? (dx < x - x0 ? x0 + radius : x0 + w - 1 - radius) : x;
        const cy = dy < radius ? (dy < y - y0 ? y0 + radius : y0 + h - 1 - radius) : y;
        const dist = Math.hypot(x - cx, y - cy);
        if (dist <= radius) setPixel(raw, size, x, y, r, g, b);
      }
    }
  }
}

function createFallbackPng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(rowSize * size, 255);
  for (let y = 0; y < size; y++) raw[y * rowSize] = 0;

  const pad = Math.round(size * 0.08);
  fillRoundedRect(raw, size, pad, pad, size - pad * 2, size - pad * 2, Math.round(size * 0.18), 37, 99, 235);

  const docPad = Math.round(size * 0.22);
  const docW = Math.round(size * 0.42);
  const docH = Math.round(size * 0.5);
  fillRoundedRect(raw, size, docPad, docPad, docW, docH, Math.round(size * 0.04), 255, 255, 255);

  const checkR = Math.round(size * 0.14);
  const cx = size - pad - checkR;
  const cy = size - pad - checkR;
  for (let y = cy - checkR; y <= cy + checkR; y++) {
    for (let x = cx - checkR; x <= cx + checkR; x++) {
      if (Math.hypot(x - cx, y - cy) <= checkR) setPixel(raw, size, x, y, 34, 197, 94);
    }
  }

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function createIcon(size) {
  if (existsSync(logoSource)) {
    try {
      return await rasterizeWithSharp(logoSource, size);
    } catch (error) {
      console.warn(`sharp rasterize failed for ${size}px (${error.message}); using fallback`);
    }
  } else {
    console.warn(`Logo source not found (${logoSource}); using fallback icon`);
  }
  return createFallbackPng(size);
}

const sizes = [192, 512];
for (const size of sizes) {
  const png = await createIcon(size);
  writeFileSync(join(iconsDir, `icon-${size}.png`), png);
}

console.log(`Generated PWA icons in public/icons/ from ${logoSource}`);
