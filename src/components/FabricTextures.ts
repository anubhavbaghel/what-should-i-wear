import * as THREE from "three";

/**
 * Procedural Atelier Fabric & Material Micro-Texture Normal Maps
 * Generates lightweight, high-fidelity canvas normal maps in-memory for tactile 3D realism.
 * Zero external network downloads, instant GPU upload, seamless tiling.
 */

let cottonTextureCache: THREE.CanvasTexture | null = null;
let oxfordTextureCache: THREE.CanvasTexture | null = null;
let twillTextureCache: THREE.CanvasTexture | null = null;
let leatherTextureCache: THREE.CanvasTexture | null = null;
let skinTextureCache: THREE.CanvasTexture | null = null;

function isBrowser(): boolean {
  return typeof document !== "undefined" && typeof document.createElement === "function";
}

/**
 * Helper to encode normalized tangent-space normal vector into RGB [0..255]
 */
function packNormal(nx: number, ny: number, nz: number): [number, number, number] {
  const invLen = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
  return [
    Math.round(((nx * invLen) * 0.5 + 0.5) * 255),
    Math.round(((ny * invLen) * 0.5 + 0.5) * 255),
    Math.round(((nz * invLen) * 0.5 + 0.5) * 255),
  ];
}

/**
 * Cotton Jersey Weave Normal Map
 * Microscopic interlock knit pattern for casual crewneck T-shirts.
 */
export function getCachedCottonNormalMap(): THREE.CanvasTexture | null {
  if (cottonTextureCache) return cottonTextureCache;
  if (!isBrowser()) return null;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Interlocking knit loop simulation
      const fx = (x % 8) / 8;
      const fy = (y % 12) / 12;
      const waveX = Math.sin(fx * Math.PI * 2);
      const waveY = Math.cos(fy * Math.PI * 2);

      const nx = waveX * 0.35;
      const ny = waveY * 0.45;
      const nz = 1.0;

      const [r, g, b] = packNormal(nx, ny, nz);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 24);
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  cottonTextureCache = texture;
  return texture;
}

/**
 * Oxford Basketweave Normal Map
 * Distinct 2x2 perpendicular yarn pattern for dress shirts.
 */
export function getCachedOxfordNormalMap(): THREE.CanvasTexture | null {
  if (oxfordTextureCache) return oxfordTextureCache;
  if (!isBrowser()) return null;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const bx = Math.floor((x % 16) / 8);
      const by = Math.floor((y % 16) / 8);
      const isHorizontal = (bx + by) % 2 === 0;

      const localX = (x % 8) / 8 - 0.5;
      const localY = (y % 8) / 8 - 0.5;

      const nx = isHorizontal ? localX * 0.8 : localX * 0.2;
      const ny = isHorizontal ? localY * 0.2 : localY * 0.8;
      const nz = 1.0;

      const [r, g, b] = packNormal(nx, ny, nz);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(30, 30);
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  oxfordTextureCache = texture;
  return texture;
}

/**
 * Suiting Twill / Worsted Wool Normal Map
 * 45-degree diagonal ribbing for Tailored Blazers, Jackets, and Trousers.
 */
export function getCachedTwillNormalMap(): THREE.CanvasTexture | null {
  if (twillTextureCache) return twillTextureCache;
  if (!isBrowser()) return null;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // 45-degree diagonal ridge wave
      const diag = ((x + y) % 10) / 10;
      const ridge = Math.sin(diag * Math.PI * 2);

      const nx = ridge * 0.45;
      const ny = ridge * 0.45;
      const nz = 1.0;

      const [r, g, b] = packNormal(nx, ny, nz);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(26, 26);
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  twillTextureCache = texture;
  return texture;
}

/**
 * Pebble Full-Grain Leather Normal Map
 * Natural micro-pore and pebble grain for Loafers and Minimalist Sneakers.
 */
export function getCachedLeatherNormalMap(): THREE.CanvasTexture | null {
  if (leatherTextureCache) return leatherTextureCache;
  if (!isBrowser()) return null;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Simple cellular Voronoi-like leather cell simulation
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const cellX = (x % 16) - 8;
      const cellY = (y % 16) - 8;
      const dist = Math.sqrt(cellX * cellX + cellY * cellY);
      const dome = Math.max(0, 1 - dist / 7.5);

      const nx = (cellX / 8) * dome * 0.6;
      const ny = (cellY / 8) * dome * 0.6;
      const nz = 1.0;

      const [r, g, b] = packNormal(nx, ny, nz);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 14);
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  leatherTextureCache = texture;
  return texture;
}

/**
 * Organic Skin Micro-Pore Normal Map
 * Subtle micro-scattering relief for lifelike skin sheen and light dispersion.
 */
export function getCachedSkinNormalMap(): THREE.CanvasTexture | null {
  if (skinTextureCache) return skinTextureCache;
  if (!isBrowser()) return null;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // High-frequency organic micro-porosity
      const p1 = Math.sin((x * 1.7 + y * 2.3) * 0.5);
      const p2 = Math.cos((x * 2.9 - y * 1.5) * 0.5);
      const nx = (p1 * 0.12);
      const ny = (p2 * 0.12);
      const nz = 1.0;

      const [r, g, b] = packNormal(nx, ny, nz);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  skinTextureCache = texture;
  return texture;
}
