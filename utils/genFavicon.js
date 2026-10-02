/**
 * 生成 favicon（favicon.png / favicon.ico / apple-touch-icon.png）
 *
 * 设计：电路风格徽标 —— 主题色圆角方块 + 白色线条电路节点
 * 与 docs/.vuepress/public/img/favicon.svg 的设计保持一致。
 *
 * 实现说明：仅使用 Node 内置模块（zlib），不依赖任何第三方包。
 * 图形用有符号距离场（SDF）绘制，并以 4x 超采样做抗锯齿，
 * 再按 PNG 规范手工编码、按 ICO 规范打包。
 *
 * 用法：node utils/genFavicon.js
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// ---------- 配置 ----------
const ACCENT = [0x11, 0xa8, 0xcd] // 主题色 #11A8CD
const WHITE = [0xff, 0xff, 0xff]
const SS = 4 // 超采样倍数（抗锯齿）
const UNIT = 64 // 设计坐标系边长

// ---------- 几何：有符号距离场 ----------
const len = (x, y) => Math.sqrt(x * x + y * y)

function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r)
  const qy = Math.abs(py - cy) - (hh - r)
  return Math.min(Math.max(qx, qy), 0) + len(Math.max(qx, 0), Math.max(qy, 0)) - r
}

function sdCircle(px, py, cx, cy, r) {
  return len(px - cx, py - cy) - r
}

function sdSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
  t = t < 0 ? 0 : t > 1 ? 1 : t
  return len(px - (x1 + t * dx), py - (y1 + t * dy))
}

// ---------- 绘制：返回 RGBA 像素缓冲 ----------
function render(size) {
  const scale = UNIT / size
  const out = Buffer.alloc(size * size * 4)
  const samples = SS * SS

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sr = 0, sg = 0, sb = 0, covered = 0

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = (x + (sx + 0.5) / SS) * scale
          const py = (y + (sy + 0.5) / SS) * scale

          // 徽标底：圆角方块
          if (sdRoundRect(px, py, 32, 32, 32, 32, 15) >= 0) continue

          // 白色电路线条：中心节点 + 四条引线
          const isLine =
            sdCircle(px, py, 32, 32, 8) < 0 ||
            sdSegment(px, py, 24, 32, 13, 32) < 3 ||
            sdSegment(px, py, 40, 32, 51, 32) < 3 ||
            sdSegment(px, py, 32, 24, 32, 13) < 3 ||
            sdSegment(px, py, 32, 40, 32, 51) < 3

          const c = isLine ? WHITE : ACCENT
          sr += c[0]; sg += c[1]; sb += c[2]; covered++
        }
      }

      const i = (y * size + x) * 4
      if (covered > 0) {
        out[i] = Math.round(sr / covered)
        out[i + 1] = Math.round(sg / covered)
        out[i + 2] = Math.round(sb / covered)
      }
      out[i + 3] = Math.round((covered / samples) * 255)
    }
  }
  return out
}

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePNG(rgba, size) {
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0 // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- ICO 打包（内嵌 PNG） ----------
function encodeICO(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(entries.length, 4)

  const dir = Buffer.alloc(16 * entries.length)
  let offset = 6 + 16 * entries.length

  entries.forEach((e, i) => {
    const o = i * 16
    dir[o] = e.size >= 256 ? 0 : e.size // width
    dir[o + 1] = e.size >= 256 ? 0 : e.size // height
    dir[o + 2] = 0 // palette
    dir[o + 3] = 0 // reserved
    dir.writeUInt16LE(1, o + 4) // color planes
    dir.writeUInt16LE(32, o + 6) // bits per pixel
    dir.writeUInt32LE(e.buf.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += e.buf.length
  })

  return Buffer.concat([header, dir, ...entries.map((e) => e.buf)])
}

// ---------- 主流程 ----------
const outDir = path.join(__dirname, '..', 'docs', '.vuepress', 'public', 'img')

const icoSizes = [16, 32, 48, 64]
const icoEntries = icoSizes.map((size) => ({ size, buf: encodePNG(render(size), size) }))

fs.writeFileSync(path.join(outDir, 'favicon.ico'), encodeICO(icoEntries))
fs.writeFileSync(
  path.join(outDir, 'favicon.png'),
  icoEntries.find((e) => e.size === 64).buf
)
fs.writeFileSync(
  path.join(outDir, 'apple-touch-icon.png'),
  encodePNG(render(180), 180)
)

console.log('✅ 已生成 favicon.ico (16/32/48/64)')
console.log('✅ 已生成 favicon.png (64x64)')
console.log('✅ 已生成 apple-touch-icon.png (180x180)')
