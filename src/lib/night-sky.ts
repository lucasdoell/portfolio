import { draw, effect, frameLoop, geometry, init, surface, target } from "vgpu";
import type { FrameLoopHandle, Gpu } from "vgpu";

/**
 * Pixel-art night sky for the portfolio hero (dark mode).
 *
 * The galaxy band is baked into a one-texel-per-cell texture whenever the canvas resizes. Each
 * frame is then one render pass with three draws:
 *   1. `sky`    fullscreen effect: optional night ground, the baked galaxy, dithered Polaris halo.
 *   2. `stars`  instanced quads: Polaris mark cells (first) + field stars, all snapped to the grid.
 *   3. `meteor` instanced quads: one shooting star (head + dithered trail), only drawn while alive.
 *
 * Everything that is not the Polaris mark lives on a square cell grid (`cell` CSS px, default 2).
 */

export type NightSkyOptions = {
  /** Grid cell size in CSS px. Every star, dither dot and meteor pixel snaps to it. Default 2. */
  cell?: number;
  /** Number of field stars. Default scales with canvas area: 200 at 1440×900. */
  stars?: number;
  /** Polaris centre as a fraction of the canvas. Default [0.41, 0.675]. */
  polaris?: [number, number];
  /** Draw the Polaris mark itself (the halo is separate). Default true. */
  showPolaris?: boolean;
  /** Draw the dithered halo around Polaris. Default true. */
  halo?: boolean;
  /** Halo radius in CSS px. Default 150. */
  haloRadius?: number;
  /** Draw the galaxy band. Default true. */
  galaxy?: boolean;
  /** Shooting stars. Default true (forced off under reduced motion). */
  meteors?: boolean;
  /** "transparent" lets the page ground (#111318) show through; "night" paints it. Default "transparent". */
  background?: "transparent" | "night";
  /** Pointer parallax in CSS px at full deflection (0 disables). Default 6. */
  parallax?: number;
  /** Override prefers-reduced-motion. */
  reducedMotion?: boolean;
  /** Fire a shooting star immediately (debug, e.g. `?shoot=1`). */
  shootOnStart?: boolean;
  /** Debug: hold the meteor at this life fraction (0..1) so it can be screenshotted. */
  freezeMeteorAt?: number;
  /** Seed for the star layout. Default 7. */
  seed?: number;
  /** Called when WebGPU is unavailable; swap in the static fallback here. */
  onFallback?: (reason: unknown) => void;
};

export type NightSkyHandle = {
  setPolaris(x: number, y: number): void;
  setPaused(paused: boolean): void;
  /** Fire a shooting star now (no-op under reduced motion). */
  shoot(nearPolaris?: boolean): void;
  dispose(): void;
  /** False when the fallback path was taken. */
  readonly gpu: boolean;
};

const NIGHT: [number, number, number] = [0x11 / 255, 0x13 / 255, 0x18 / 255];

// The brand mark, 16x16, `a` = filled.
const POLARIS_ROWS = [
  ".......aa.......",
  ".......aa.......",
  ".......aa.......",
  "...a..aaaa..a...",
  "....a.aaaa.a....",
  ".....aaaaaa.....",
  "...aaaaaaaaaa...",
  "aaaaaaaaaaaaaaaa",
  "aaaaaaaaaaaaaaaa",
  "...aaaaaaaaaa...",
  ".....aaaaaa.....",
  "....a.aaaa.a....",
  "...a..aaaa..a...",
  ".......aa.......",
  ".......aa.......",
  ".......aa.......",
];

const COMMON = /* wgsl */ `
fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}
// 2x2 Bayer [[0,2],[3,1]] built up to 8x8; finest bit is most significant.
fn b2(c: vec2u) -> u32 { return (((c.x ^ c.y) & 1u) << 1u) | (c.y & 1u); }
fn bayer4(c: vec2u) -> f32 { return (f32(4u * b2(c) + b2(c >> vec2u(1u))) + 0.5) / 16.0; }
fn bayer8(c: vec2u) -> f32 {
  return (f32(16u * b2(c) + 4u * b2(c >> vec2u(1u)) + b2(c >> vec2u(2u))) + 0.5) / 64.0;
}
`;

// Baked once per resize into a texture with one texel per sky cell; the per-frame sky pass only
// does a texture load where the galaxy is, so the fbm stack never runs per frame.
const GALAXY_SHADER = /* wgsl */ `
struct G {
  res: vec2f,       // physical px of the canvas
  cell: f32,        // physical px per cell
  dpr: f32,
}
@group(0) @binding(0) var<uniform> g: G;
${COMMON}

fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
fn fbm(p0: vec2f) -> f32 {
  var p = p0;
  var s = 0.0;
  var a = 0.5;
  for (var i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec2f(17.1, 9.7);
    a *= 0.5;
  }
  return s;
}

const FROST = vec3f(0.914, 0.906, 0.882);
const STARLIGHT = vec3f(0.737, 0.827, 1.0);
const MIDBLUE = vec3f(0.486, 0.624, 0.910);
// Galaxy hues, all pulled from the Polaris palette and lifted toward pastel so they stay quiet.
const VIOLET = vec3f(0.557, 0.447, 0.941);  // #8E72F0
const ROSE = vec3f(0.898, 0.439, 0.604);    // #E5709A, the OpenCode identity hue, deepened
const TEAL = vec3f(0.310, 0.761, 0.753);    // #4FC2C0, codex green cooled toward the sky
const EMBER = vec3f(0.961, 0.780, 0.588);   // #F5C796, lamplight seen through haze

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  // One fragment per sky cell.
  let grid = ceil(g.res / g.cell);
  let cellId = floor(uv * grid);
  let cu = vec2u(cellId);
  // Cell centre in CSS px: all fields are evaluated once per cell, so dots are crisp squares.
  let cssPerCell = g.cell / g.dpr;
  let p = (cellId + 0.5) * cssPerCell;
  let resCss = g.res / g.dpr;

  var col = vec3f(0.0);
  var alpha = 0.0;

  // ---- Galaxy band: a diagonal Milky Way, dithered, very low contrast.
  {
    let dir = normalize(vec2f(1.0, -0.42));            // rises to the right
    let nrm = vec2f(-dir.y, dir.x);
    let origin = resCss * vec2f(0.55, 0.42);
    let rel = p - origin;
    let along = dot(rel, dir);
    let warp = (fbm(vec2f(along * 0.0025, 3.7)) - 0.5) * 220.0;
    let across = dot(rel, nrm) + warp;
    let width = max(resCss.y * 0.17, 90.0);
    var dens = exp(-pow(across / width, 2.0));
    // Clumpy structure: low-frequency clouds times a finer grain.
    let clouds = fbm(p * 0.006 + vec2f(4.0, 1.0));
    let grain = fbm(p * 0.03 + vec2f(9.0, 2.0));
    dens *= smoothstep(0.28, 0.75, clouds) * (0.55 + 0.9 * grain);
    // Dark rift running down the band.
    let rift = exp(-pow((across - width * 0.18) / (width * 0.16), 2.0)) * smoothstep(0.4, 0.7, fbm(p * 0.01 + 7.0));
    dens *= 1.0 - 0.75 * rift;
    // A few denser knots along the band.
    var core = 0.0;
    for (var k = 0; k < 4; k++) {
      let fk = f32(k);
      let kp = origin + dir * (resCss.x * (-0.42 + fk * 0.29)) + nrm * (sin(fk * 2.3) * width * 0.35);
      let kr = 26.0 + 14.0 * fract(fk * 0.618);
      let kd = length(p - kp);
      let knot = exp(-pow(kd / kr, 2.0));
      core = max(core, knot);
      dens += knot * 0.55 * (0.6 + 0.8 * grain);
    }
    // Ordered dither with a little hash so it reads as texture, not a screen. The dense core gets
    // more hash, otherwise the Bayer matrix settles into a visible checkerboard there.
    let th = mix(bayer8(cu), hash21(cellId + 31.0), 0.3 + 0.4 * smoothstep(0.3, 0.7, dens * 0.5));
    if (dens * 0.5 > th) {
      // Colour drifts slowly along the band: starlight blue into violet, rose nebulae where the
      // clouds are thick, a teal fringe at the cool end, and lamplight amber in the knots.
      let hueN = fbm(p * 0.0065 + vec2f(12.0, 5.0));
      var tint = mix(STARLIGHT, VIOLET, smoothstep(0.32, 0.6, hueN));
      tint = mix(tint, ROSE, smoothstep(0.5, 0.7, hueN) * smoothstep(0.42, 0.8, clouds));
      tint = mix(tint, TEAL, smoothstep(0.34, 0.16, hueN) * 0.75);
      tint = mix(tint, mix(EMBER, FROST, 0.4), smoothstep(0.35, 0.9, core) * 0.6);
      // Star dust: the finest grain lifts a few cells back toward white.
      tint = mix(tint, FROST, 0.3 * smoothstep(0.6, 0.9, grain));
      let a = 0.11 + 0.19 * pow(hash21(cellId * 1.7), 2.0) + 0.1 * clamp(dens - 0.6, 0.0, 1.0);
      col = tint;
      alpha = a;
    }
    // Nebulae: a sparse second scatter of brighter coloured cells where the band is rosy or
    // warm, so the colour reads as points of light instead of a tinted haze.
    let nebHue = fbm(p * 0.0065 + vec2f(12.0, 5.0));
    let roseZone = smoothstep(0.5, 0.7, nebHue) * smoothstep(0.42, 0.8, clouds);
    let violetZone = smoothstep(0.4, 0.6, nebHue) * (1.0 - roseZone) * 0.6;
    let neb = exp(-pow(across / (width * 1.15), 2.0)) * max(roseZone, violetZone) * smoothstep(0.15, 0.55, dens);
    if (neb * 0.42 > hash21(cellId * 3.3 + 17.0) + 0.18) {
      col = mix(VIOLET, ROSE, roseZone);
      alpha = max(alpha, 0.26 + 0.22 * neb);
    }
  }

  return vec4f(col * alpha, alpha);
}
`;

const SKY_SHADER = /* wgsl */ `
struct Sky {
  res: vec2f,       // physical px
  polaris: vec2f,   // physical px
  cell: f32,        // physical px per cell
  dpr: f32,
  time: f32,
  haloRadius: f32,  // CSS px
  haloOn: f32,
  galaxyOn: f32,
  breathe: f32,     // 0 = still
  bgOn: f32,
  bg: vec4f,
}
@group(0) @binding(0) var<uniform> sky: Sky;
@group(0) @binding(1) var galaxy: texture_2d<f32>;
${COMMON}

const STARLIGHT = vec3f(0.737, 0.827, 1.0);

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let px = uv * sky.res;
  let cellId = floor(px / sky.cell);
  let cu = vec2u(cellId);
  let p = (cellId + 0.5) * (sky.cell / sky.dpr);

  // Premultiplied colour from the baked galaxy.
  var col = vec3f(0.0);
  var alpha = 0.0;
  if (sky.galaxyOn > 0.5) {
    let gx = textureLoad(galaxy, vec2i(cellId), 0);
    col = gx.rgb;
    alpha = gx.a;
  }

  // ---- Polaris halo: Bayer-dithered starlight dots, density falling off radially, breathing.
  if (sky.haloOn > 0.5) {
    let pc = sky.polaris / sky.dpr;
    let r = length(p - pc) / sky.haloRadius;
    // Dots live on every other cell so they read as separate points, like the brand halo.
    let lattice = (cu.x & 1u) == 0u && (cu.y & 1u) == 0u;
    if (lattice && r < 1.0 && r > 0.1) {
      let breath = 1.0 + 0.14 * sin(sky.time * 0.9) * sky.breathe;
      let fall = pow(1.0 - r, 1.7) * breath;
      let th = bayer8(cu >> vec2u(1u));
      if (fall * 0.95 > th) {
        let a = 0.18 + 0.45 * pow(1.0 - r, 2.0);
        // Halo dot replaces whatever galaxy pixel was under it.
        col = STARLIGHT * a;
        alpha = a;
      }
    }
  }

  // Premultiplied out; optionally composited over the night ground.
  if (sky.bgOn > 0.5) {
    return vec4f(sky.bg.rgb * (1.0 - alpha) + col, 1.0);
  }
  return vec4f(col, alpha);
}
`;

const STAR_SHADER = /* wgsl */ `
struct P {
  res: vec2f,
  parallax: vec2f,   // physical px at full depth
  polaris: vec2f,    // physical px, centre of the mark
  cell: f32,         // physical px
  dpr: f32,
  time: f32,
  motion: f32,       // 0 under reduced motion
  markPx: f32,       // physical px per mark pixel
  _pad: f32,
}
@group(0) @binding(0) var<uniform> params: P;
${COMMON}

struct Out {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

const FROST = vec3f(0.914, 0.906, 0.882);
const STARLIGHT = vec3f(0.737, 0.827, 1.0);
const MIDBLUE = vec3f(0.486, 0.624, 0.910);

fn toClip(px: vec2f) -> vec4f {
  return vec4f(px.x / params.res.x * 2.0 - 1.0, 1.0 - px.y / params.res.y * 2.0, 0.0, 1.0);
}

@vertex fn vs_main(
  @location(0) corner: vec2f,
  @location(1) a: vec4f,  // star: x, y (0..1), size (cells), mag | mark: col, row, 0, 0
  @location(2) b: vec4f,  // star: phase, speed, depth, kind(0) | mark: 0, 0, 0, kind(1 blue, 2 white)
) -> Out {
  var out: Out;
  let kind = b.w;
  if (kind > 0.5) {
    // Polaris mark cell, snapped to whole device pixels.
    let origin = round(params.polaris - vec2f(8.0) * params.markPx);
    let px = origin + (a.xy + corner) * params.markPx;
    out.position = toClip(px);
    let c = select(STARLIGHT, vec3f(1.0), kind > 1.5);
    out.color = vec4f(c, 1.0);
    return out;
  }
  let mag = a.w;
  let base = a.xy * params.res + params.parallax * b.z;
  let snapped = floor(base / params.cell) * params.cell;
  let px = snapped + corner * a.z * params.cell;
  out.position = toClip(px);

  // Slow, stepped twinkle: a handful of brightness levels, like a palette-cycled sprite.
  let tw = 0.5 + 0.5 * sin(params.time * b.y + b.x);
  let depthOfTwinkle = 0.18 + 0.3 * fract(b.x * 7.31);
  let level = floor((1.0 - depthOfTwinkle * tw * params.motion) * 6.0 + 0.5) / 6.0;

  // Stay out of the mark's own footprint so Polaris reads clean.
  let dp = length(snapped - params.polaris) / params.dpr;
  let clearZone = smoothstep(30.0, 60.0, dp);

  let tintSel = fract(b.x * 3.17);
  var c = FROST;
  if (tintSel > 0.72) { c = STARLIGHT; }
  if (tintSel > 0.93) { c = MIDBLUE; }
  let alpha = (0.16 + 0.62 * mag) * level * clearZone;
  out.color = vec4f(c * alpha, alpha);
  return out;
}

@fragment fn fs_main(@location(0) color: vec4f) -> @location(0) vec4f {
  return color;
}
`;

const METEOR_SHADER = /* wgsl */ `
struct M {
  res: vec2f,
  head: vec2f,     // physical px
  step: vec2f,     // physical px per trail cell (major axis = one cell)
  cell: f32,
  life: f32,       // 0..1
  trail: f32,      // trail length in cells
  _pad: f32,
}
@group(0) @binding(0) var<uniform> m: M;
${COMMON}

struct Out {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(flat) fade: f32,
  @location(1) @interpolate(flat) idx: f32,
}

const STARLIGHT = vec3f(0.737, 0.827, 1.0);

@vertex fn vs_main(@location(0) corner: vec2f, @builtin(instance_index) ii: u32) -> Out {
  var out: Out;
  let i = f32(ii);
  // The tail grows from the head over the first 30% of life.
  let grow = clamp(m.life / 0.3, 0.0, 1.0);
  let len = max(1.0, m.trail * grow);
  let pos = m.head - m.step * i;
  let snapped = floor(pos / m.cell) * m.cell;
  // The head is a 2x2-cell pixel; the trail is single cells.
  let size = select(1.0, 2.0, ii == 0u);
  let px = snapped - select(vec2f(0.0), vec2f(m.cell * 0.5), ii == 0u) + corner * size * m.cell;
  out.position = vec4f(px.x / m.res.x * 2.0 - 1.0, 1.0 - px.y / m.res.y * 2.0, 0.0, 1.0);
  let env = smoothstep(0.0, 0.12, m.life) * (1.0 - smoothstep(0.6, 1.0, m.life));
  var f = pow(max(0.0, 1.0 - i / len), 1.4) * env;
  if (i >= len) { f = 0.0; }
  out.fade = f;
  out.idx = i;
  return out;
}

@fragment fn fs_main(@builtin(position) pos: vec4f, @location(0) @interpolate(flat) fade: f32, @location(1) @interpolate(flat) idx: f32) -> @location(0) vec4f {
  // Dithered falloff: the trail breaks up into pixels as it fades.
  let cu = vec2u(floor(pos.xy / m.cell));
  if (fade <= 0.0 || (idx > 0.5 && fade < bayer4(cu) * 0.85)) { discard; }
  let headMix = select(0.0, 1.0, idx < 0.5);
  let c = mix(STARLIGHT, vec3f(1.0), max(headMix, smoothstep(0.7, 1.0, fade)));
  let a = select(0.35 + 0.5 * fade, 0.95 * fade + 0.05, idx < 0.5);
  return vec4f(c * a, a);
}
`;

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildInstances(starCount: number, seed: number) {
  const marks: number[] = [];
  POLARIS_ROWS.forEach((row, r) => {
    for (let c = 0; c < 16; c++) {
      if (row[c] !== "a") continue;
      const core = (c >= 7 && c <= 8 && r >= 6 && r <= 9) || (c >= 6 && c <= 9 && r >= 7 && r <= 8);
      marks.push(c, r, 0, 0, 0, 0, 0, core ? 2 : 1);
    }
  });
  const markCount = marks.length / 8;
  const rand = mulberry32(seed);
  const data = new Float32Array((markCount + starCount) * 8);
  data.set(marks, 0);
  for (let i = 0; i < starCount; i++) {
    const o = (markCount + i) * 8;
    const mag = Math.pow(rand(), 3.2); // power law: few bright
    data[o] = rand();
    data[o + 1] = rand();
    data[o + 2] = mag > 0.72 ? 2 : 1;
    data[o + 3] = mag;
    data[o + 4] = rand() * Math.PI * 2;
    data[o + 5] = 0.25 + rand() * 0.6; // rad/s: very slow
    data[o + 6] = 0.25 + rand() * 0.75; // parallax depth
    data[o + 7] = 0;
  }
  return { data, markCount };
}

/** 200 stars at 1440×900, fewer on small screens so phones don't read as noisier than desktops. */
function starsForArea(area: number) {
  return Math.round(200 * Math.min(1.4, Math.max(0.3, area / (1440 * 900))));
}

type Meteor = { x: number; y: number; dx: number; dy: number; speed: number; t: number; life: number; trail: number };

export async function startNightSky(canvas: HTMLCanvasElement, options: NightSkyOptions = {}): Promise<NightSkyHandle> {
  const opts = {
    cell: 2,
    stars: starsForArea(canvas.clientWidth * canvas.clientHeight),
    polaris: [0.41, 0.675] as [number, number],
    showPolaris: true,
    halo: true,
    haloRadius: 150,
    galaxy: true,
    meteors: true,
    background: "transparent" as const,
    parallax: 6,
    seed: 7,
    // Undefined keys must not clobber defaults.
    ...(Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined)) as NightSkyOptions),
  };
  const reduced = opts.reducedMotion ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let gpu: Gpu;
  try {
    if (!("gpu" in navigator)) throw new Error("WebGPU unavailable");
    gpu = await init();
  } catch (err) {
    // Fallback hook: the caller shows a static image (e.g. canvas.replaceWith(img) or a CSS class).
    opts.onFallback?.(err);
    canvas.dataset.sky = "fallback";
    return { setPolaris() {}, setPaused() {}, shoot() {}, dispose() {}, gpu: false };
  }

  const bgOn = opts.background === "night";
  const canvasTarget = surface(gpu, canvas, {
    dpr: [1, 2],
    clearColor: bgOn ? [...NIGHT, 1] : [0, 0, 0, 0],
  });

  const { data, markCount } = buildInstances(opts.stars, opts.seed);
  const quad = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
  const starGeo = geometry(gpu, {
    topology: "triangle-strip",
    buffers: [
      { data: quad, attributes: { corner: "float32x2" } },
      {
        stepMode: "instance",
        data,
        attributes: { a: { format: "float32x4", location: 1 }, b: { format: "float32x4", location: 2 } },
      },
    ],
  });
  const quadGeo = geometry(gpu, {
    topology: "triangle-strip",
    buffers: [{ data: quad, attributes: { corner: "float32x2" } }],
  });

  const state = {
    polaris: [...opts.polaris] as [number, number],
    pointer: [0, 0] as [number, number],
    smooth: [0, 0] as [number, number],
    paused: false,
    visible: true,
    tabVisible: document.visibilityState === "visible",
    disposed: false,
  };

  const metrics = () => {
    const [w, h] = canvasTarget.size;
    const dpr = canvasTarget.dpr;
    const cell = Math.max(1, Math.round(opts.cell * dpr));
    return { w, h, dpr, cell };
  };
  const polarisPx = () => {
    const { w, h } = metrics();
    return [state.polaris[0] * w, state.polaris[1] * h] as [number, number];
  };

  const galaxyTex = target(gpu, { size: [1, 1], label: "night-galaxy" });
  let galaxyDirty = opts.galaxy;
  const bake = effect(gpu, GALAXY_SHADER, {
    label: "night-galaxy-bake",
    set: { g: { res: [1, 1], cell: 2, dpr: 1 } },
  });

  const sky = effect(gpu, SKY_SHADER, {
    label: "night-sky",
    blend: "premultiplied",
    set: {
      sky: {
        res: [1, 1],
        polaris: [0, 0],
        cell: 2,
        dpr: 1,
        time: 0,
        haloRadius: opts.haloRadius,
        haloOn: opts.halo ? 1 : 0,
        galaxyOn: opts.galaxy ? 1 : 0,
        breathe: reduced ? 0 : 1,
        bgOn: bgOn ? 1 : 0,
        bg: [...NIGHT, 1],
      },
      galaxy: galaxyTex,
    },
  });
  const stars = draw(gpu, {
    shader: STAR_SHADER,
    geometry: starGeo,
    blend: "premultiplied",
    label: "night-stars",
    set: {
      params: { res: [1, 1], parallax: [0, 0], polaris: [0, 0], cell: 2, dpr: 1, time: 0, motion: reduced ? 0 : 1, markPx: 3, _pad: 0 },
    },
  });
  const TRAIL_MAX = 64;
  const meteorDraw = draw(gpu, {
    shader: METEOR_SHADER,
    geometry: quadGeo,
    instances: TRAIL_MAX,
    blend: "premultiplied",
    label: "night-meteor",
    set: { m: { res: [1, 1], head: [0, 0], step: [1, 0], cell: 2, life: 0, trail: 0, _pad: 0 } },
  });

  const applySize = () => {
    const { w, h, dpr, cell } = metrics();
    const pol = polarisPx();
    const markPx = Math.max(1, Math.round(3 * dpr));
    sky.set({ sky: { res: [w, h], polaris: pol, cell, dpr } });
    if (opts.galaxy) {
      galaxyTex.resize([Math.ceil(w / cell), Math.ceil(h / cell)]);
      bake.set({ g: { res: [w, h], cell, dpr } });
      sky.set({ galaxy: galaxyTex });
      galaxyDirty = true;
    }
    stars.set({ params: { res: [w, h], polaris: pol, cell, dpr, markPx } });
    meteorDraw.set({ m: { res: [w, h], cell } });
  };

  // ---- Shooting stars (JS-side timing; positions in CSS px).
  const rand = Math.random;
  let meteor: Meteor | null = null;
  let nextMeteorAt = 4 + rand() * 6;
  let meteorCount = 0;
  const spawnMeteor = (nearPolaris: boolean) => {
    const { w, h, dpr } = metrics();
    const W = w / dpr;
    const H = h / dpr;
    const leftward = rand() < 0.5;
    const ang = ((18 + rand() * 18) * Math.PI) / 180; // below horizontal
    const dx = Math.cos(ang) * (leftward ? -1 : 1);
    const dy = Math.sin(ang);
    const life = 0.6 + rand() * 0.4;
    const speed = 420 + rand() * 260; // CSS px / s
    const travel = speed * life;
    let x: number, y: number;
    if (nearPolaris) {
      // Closest approach 40–110 px from Polaris, around the middle of the flight.
      // Pass on the open (right / upper-right) side of the mark, away from the name.
      const [px, py] = [state.polaris[0] * W, state.polaris[1] * H];
      const theta = ((-70 + rand() * 80) * Math.PI) / 180;
      const dist = 50 + rand() * 60;
      const cx = px + Math.cos(theta) * dist;
      const cy = py + Math.sin(theta) * dist;
      x = cx - dx * travel * 0.55;
      y = cy - dy * travel * 0.55;
    } else {
      x = W * (0.15 + rand() * 0.7);
      y = H * (0.05 + rand() * 0.45);
    }
    meteor = { x, y, dx, dy, speed, t: 0, life, trail: 40 + Math.floor(rand() * 20) };
    meteorCount++;
  };

  let loop: FrameLoopHandle | undefined;
  let last = performance.now();
  let simTime = 0;

  const render = (frame: Parameters<Parameters<typeof frameLoop>[1]>[0], dt: number) => {
    simTime += dt;
    const { dpr, cell } = metrics();
    // Ease pointer parallax.
    const k = 1 - Math.exp(-dt * 3);
    state.smooth[0] += (state.pointer[0] - state.smooth[0]) * k;
    state.smooth[1] += (state.pointer[1] - state.smooth[1]) * k;
    const par: [number, number] = reduced ? [0, 0] : [state.smooth[0] * opts.parallax * dpr, state.smooth[1] * opts.parallax * dpr];

    sky.set({ sky: { time: simTime } });
    stars.set({ params: { time: simTime, parallax: par } });

    let drawMeteor = false;
    if (!reduced && opts.meteors) {
      if (!meteor && simTime >= nextMeteorAt) {
        // Roughly every third one threads past Polaris.
        spawnMeteor(meteorCount % 3 === 2);
        nextMeteorAt = simTime + 6 + rand() * 6;
      }
      if (meteor) {
        if (opts.freezeMeteorAt !== undefined) meteor.t = meteor.life * opts.freezeMeteorAt;
        else meteor.t += dt;
        const life = meteor.t / meteor.life;
        if (life >= 1) {
          meteor = null;
        } else {
          const d = meteor.speed * meteor.t;
          const head: [number, number] = [(meteor.x + meteor.dx * d) * dpr, (meteor.y + meteor.dy * d) * dpr];
          // One cell per trail step along the major axis: a clean pixel staircase.
          const major = Math.max(Math.abs(meteor.dx), Math.abs(meteor.dy));
          const step: [number, number] = [(meteor.dx / major) * cell, (meteor.dy / major) * cell];
          meteorDraw.set({ m: { head, step, life, trail: Math.min(TRAIL_MAX - 1, meteor.trail) } });
          drawMeteor = true;
        }
      }
    }

    if (galaxyDirty) {
      frame.pass({ target: galaxyTex, clear: [0, 0, 0, 0] }, (pass) => pass.draw(bake));
      galaxyDirty = false;
    }
    frame.pass(canvasTarget, (pass) => {
      pass.draw(sky);
      if (opts.showPolaris) pass.draw(stars);
      else pass.draw(stars, { instances: opts.stars, firstInstance: markCount });
      if (drawMeteor) pass.draw(meteorDraw);
    });
  };

  const stillFrame = () => {
    loop?.stop();
    loop = frameLoop(gpu, (frame) => {
      render(frame, 0);
      loop?.stop();
      loop = undefined;
    });
  };

  const running = () => !state.paused && state.visible && state.tabVisible && !state.disposed;
  const sync = () => {
    if (reduced) return;
    if (running() && !loop) {
      last = performance.now();
      loop = frameLoop(gpu, (frame) => {
        const now = performance.now();
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        render(frame, dt);
      });
    } else if (!running() && loop) {
      loop.stop();
      loop = undefined;
    }
  };

  canvasTarget.onResize(() => {
    applySize();
    if (reduced && !state.disposed) queueMicrotask(stillFrame);
  });

  // Pointer parallax (window-level so it works behind text).
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    state.pointer[0] = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    state.pointer[1] = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
  };
  if (!reduced && opts.parallax > 0) window.addEventListener("pointermove", onPointer, { passive: true });

  const io = new IntersectionObserver((entries) => {
    state.visible = entries.some((e) => e.isIntersecting);
    sync();
  });
  io.observe(canvas);
  const onVis = () => {
    state.tabVisible = document.visibilityState === "visible";
    sync();
  };
  document.addEventListener("visibilitychange", onVis);

  if (opts.shootOnStart && !reduced) spawnMeteor(true);

  if (reduced) stillFrame();
  else sync();

  return {
    gpu: true,
    setPolaris(x, y) {
      state.polaris = [x, y];
      applySize();
      if (reduced) stillFrame();
    },
    setPaused(p) {
      state.paused = p;
      sync();
    },
    shoot(nearPolaris = false) {
      if (!reduced) spawnMeteor(nearPolaris);
    },
    dispose() {
      state.disposed = true;
      loop?.stop();
      loop = undefined;
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointer);
      starGeo.destroy();
      quadGeo.destroy();
      canvasTarget.dispose();
      gpu.dispose();
    },
  };
}
