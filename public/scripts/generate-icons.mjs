// PWA icons generator — no external dependencies, pure Node.js SVG → PNG via data URL
// Based on the candy-book project's approach
import { writeFileSync } from 'fs'

const SIZES = [192, 512]
const OUT_DIR = 'public'

function svgIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5"/>
      <stop offset="100%" style="stop-color:#6366F1"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <!-- Calendar body -->
  <rect x="96" y="140" width="320" height="280" rx="24" fill="white" opacity="0.95"/>
  <rect x="96" y="140" width="320" height="70" rx="24" fill="white"/>
  <rect x="96" y="180" width="320" height="30" fill="white"/>
  <!-- Calendar top bar -->
  <rect x="96" y="140" width="320" height="50" rx="24" fill="white"/>
  <rect x="116" y="155" width="280" height="20" rx="4" fill="#4F46E5" opacity="0.8"/>
  <!-- Calendar grid lines -->
  <line x1="176" y1="230" x2="176" y2="400" stroke="#E2E8F0" stroke-width="2"/>
  <line x1="256" y1="230" x2="256" y2="400" stroke="#E2E8F0" stroke-width="2"/>
  <line x1="336" y1="230" x2="336" y2="400" stroke="#E2E8F0" stroke-width="2"/>
  <line x1="116" y1="290" x2="396" y2="290" stroke="#E2E8F0" stroke-width="2"/>
  <line x1="116" y1="350" x2="396" y2="350" stroke="#E2E8F0" stroke-width="2"/>
  <!-- Shift blocks (colored) -->
  <rect x="130" y="245" width="36" height="30" rx="6" fill="#F59E0B"/>
  <rect x="210" y="245" width="36" height="30" rx="6" fill="#3B82F6"/>
  <rect x="290" y="245" width="36" height="30" rx="6" fill="#6366F1"/>
  <rect x="130" y="305" width="36" height="30" rx="6" fill="#10B981"/>
  <rect x="210" y="305" width="36" height="30" rx="6" fill="#F59E0B"/>
  <rect x="290" y="305" width="36" height="30" rx="6" fill="#EF4444"/>
  <rect x="130" y="365" width="36" height="30" rx="6" fill="#F59E0B"/>
  <rect x="210" y="365" width="36" height="30" rx="6" fill="#6366F1"/>
  <rect x="290" y="365" width="36" height="30" rx="6" fill="#3B82F6"/>
  <!-- Bell icon -->
  <circle cx="400" cy="110" r="40" fill="#F59E0B"/>
  <path d="M385 100 Q400 92 415 100 L418 110 Q400 120 382 110 Z" fill="white"/>
  <circle cx="400" cy="122" r="6" fill="white"/>
</svg>`
}

for (const size of SIZES) {
  const svg = svgIcon(size)
  const base64 = Buffer.from(svg).toString('base64')
  const dataUrl = `data:image/svg+xml;base64,${base64}`
  // Write SVG as reference — PWA manifest can use SVG
  writeFileSync(`${OUT_DIR}/icon-${size}.svg`, svg)
  console.log(`Generated icon-${size}.svg`)
}

// Also generate a favicon
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#4F46E5"/>
  <rect x="120" y="160" width="272" height="240" rx="16" fill="white" opacity="0.95"/>
  <rect x="120" y="160" width="272" height="40" rx="16" fill="white"/>
  <rect x="136" y="168" width="240" height="16" rx="4" fill="#4F46E5" opacity="0.7"/>
  <rect x="150" y="250" width="50" height="35" rx="8" fill="#F59E0B"/>
  <rect x="220" y="250" width="50" height="35" rx="8" fill="#3B82F6"/>
  <rect x="290" y="250" width="50" height="35" rx="8" fill="#6366F1"/>
  <circle cx="400" cy="120" r="36" fill="#F59E0B"/>
  <path d="M385 105 Q400 96 415 105 L418 118 Q400 128 382 118 Z" fill="white"/>
  <circle cx="400" cy="132" r="5" fill="white"/>
</svg>`
writeFileSync('public/vite.svg', favicon)
console.log('Generated favicon (vite.svg)')
console.log('Done! Icons generated as SVG files.')
console.log('For production PNG icons, convert the SVGs using a tool or replace with actual PNGs.')
