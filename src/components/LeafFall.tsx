import { useEffect, useRef } from 'react'

/**
 * Falling leaves for the photography section, drawn as a vintage colour print.
 *
 * The look is the point: leaves are not painted as flat silhouettes but screened
 * like ink on paper. Each colour gets its own halftone tile — a dot on a small
 * grid — and every leaf is filled twice, once with a faint flat wash for body
 * and once through that tile for texture. The tiles are pinned to the page
 * rather than to the leaf (`pattern.setTransform`), because a printing screen
 * belongs to the sheet: dots do not tumble with the thing they describe. Each
 * colour's screen also sits at its own angle, the way real plates are rotated
 * off each other to avoid moiré.
 *
 * The nearest leaves print a second time in a lighter green, offset a pixel or
 * so, as a deliberately misregistered plate. It keeps the vintage-print feel
 * without taking the leaves out of their green palette.
 *
 * Motion is continuous rather than stepped. A leaf falls at its own rate, sways
 * on a sine, and flutters: `flip` scales it horizontally through zero so it
 * reads as turning edge-on and back, which is most of what sells a real leaf
 * from a rotating shape. Three depth layers differ in size, speed and ink
 * weight, so the field has front and back instead of one flat plane.
 *
 * Standing in the scene is a pixel tree, in the flat-pad silhouette of a garden
 * pine. It is grown once on a coarse cell grid and drawn as whole cells only,
 * and it does not move: a pixel sprite that slides by fractions of a cell stops
 * reading as pixel art, and stepping it whole cells reads as a glitch, so the
 * tree stays put and the air around it does the moving. Some of the field's
 * leaves let go from the undersides of its pads (`Tree.spawns`) rather than
 * drifting in from above, which is what ties the fall to the tree.
 *
 * It is rooted on the `anchor` element's bottom edge rather than on the section's
 * — at the foot of the section the photo grid simply covers it. Given the
 * heading's rule to stand on, the tree grows up into the clear band beside the
 * title, and its leaves then have the whole section to fall through. Its height
 * is whatever that band affords. Without an anchor it falls back to standing at
 * the bottom left.
 *
 * A small pixel bird shares the air with the leaves. It cruises the section on
 * a swooping wander — steering toward a drifting target rather than following a
 * path, so no two circuits repeat — and every so often it banks down to a twig
 * nest built into the crook of one of the tree's branches, folds its wings, and
 * sits a while before taking off again. The nest is part of the tree's own
 * cells, so it is always there; only the bird comes and goes. While perched the
 * bird snaps to the tree's pixel grid, for the same reason the tree itself
 * never moves by fractions of a cell.
 *
 * Faint ink-like wind curls surface here and there behind the leaves. Each is
 * one stroke that draws itself on along its own spine — a long undulating
 * approach ending in a loop that spirals inward — with only a stretch of the
 * spine visible at a time. The travel of that stretch is the swirl; the mark
 * itself barely moves.
 *
 * Everything is aria-hidden decoration behind the photo grid. It animates only
 * while the section is on screen and the tab is visible, and reduced motion
 * gets a single still frame of a settled field rather than a blank canvas.
 */

const MAX_DPR = 2

// ---- print -----------------------------------------------------------------

const TILE = 4 // CSS px per halftone cell
const DOT = 1.45 // dot radius within the cell
/** One screen angle per ink, as plates are rotated off each other in print. */
const SCREEN_ANGLES = [15, 45, 75, 0] as const

/** Four natural greens, kept muted enough to retain the aged-print look. */
const INKS = [
  [40, 92, 58], // deep leaf
  [58, 124, 76], // forest green
  [91, 148, 91], // mid green
  [142, 178, 126], // sunlit green
] as const

/** Flat wash and vein colour per ink, built once rather than per leaf per frame. */
const INK_STYLES = INKS.map(([r, g, b]) => `rgb(${r},${g},${b})`)
const DETAIL_STYLES = INKS.map(
  ([r, g, b]) => `rgb(${Math.max(0, r - 30)},${Math.max(0, g - 35)},${Math.max(0, b - 28)})`,
)

/** The misregistered second plate. */
const REGISTER_INK = 3 // index into INKS, light green behind the nearest leaves
const REGISTER_OFFSET = 1.3 // px the plate is out by

// ---- field -----------------------------------------------------------------

const AREA_PER_LEAF = 26000 // CSS px² of section per leaf
const MIN_LEAVES = 12
const MAX_LEAVES = 44
const FROM_TREE_CHANCE = 0.45 // share of leaves that let go from the tree itself

const FALL_SPEED = 15 // px/s at depth 1, before per-leaf variation
const SWAY_AMPLITUDE = 26 // px of horizontal drift either side
const SPIN_SPEED = 0.22 // rad/s of in-plane rotation
const FLUTTER_SPEED = 0.8 // rad/s of edge-on flutter

// ---- occasional wind marks -------------------------------------------------

const SWIRL_GAP_MIN = 5400 // ms between gusts
const SWIRL_GAP_MAX = 11000
const SWIRL_DURATION_MIN = 4200 // ms one gust remains visible
const SWIRL_DURATION_MAX = 6400
const SWIRL_DRIFT = 36 // px the whole mark is carried downwind over its life
const SWIRL_POINTS = 96 // samples along one gust's spine
const SWIRL_WINDOW = 0.55 // share of the spine visible at once
const SWIRL_INK = [104, 132, 103] as const // pale sage, like a lightly printed plate

// ---- pixel tree -------------------------------------------------------------

const PIXEL = 4 // CSS px per tree cell, matching the halftone grid
const TREE_HEIGHT = 0.44 // of section height, when there is no anchor to sit on
const TREE_MIN_ROWS = 22
const TREE_MAX_ROWS = 48
const TREE_TOP_GAP = 8 // px of clearance kept above the crown
const TREE_ALPHA = 0.85 // overall weight, so the tree sits behind the photos
const PAD_SPAWNS = 6 // detach points sampled under each foliage pad

/**
 * Trunk browns and foliage greens, as [r,g,b,alpha]. Two tones carry the trunk
 * (lit side, shadow side) and three the foliage (top light, body, underside),
 * which is the minimum that reads as a solid form in flat pixels.
 */
const TREE_TONES = [
  [92, 74, 53, 0.9], // 0 bark shadow
  [139, 108, 82, 0.82], // 1 bark lit
  [38, 84, 62, 0.72], // 2 foliage underside
  [61, 138, 99, 0.66], // 3 foliage body
  [140, 176, 132, 0.6], // 4 foliage top light
] as const

/** Foliage pads, as [height up the trunk, side, arm length]. */
const TREE_BRANCHES = [
  { at: 0.4, dir: -1, len: 0.36 },
  { at: 0.58, dir: 1, len: 0.31 },
  { at: 0.76, dir: -1, len: 0.22 },
] as const

type TreeCell = { x: number; y: number }

type Tree = {
  ox: number // page px of the cell grid's origin, snapped to the grid
  oy: number
  cells: TreeCell[][] // grouped by tone, so a pass is one fillStyle
  spawns: { x: number; y: number }[] // page px under the pads, where leaves let go
  perch: { x: number; y: number } // page px of the nest, where the bird sits
  home: { x: number; y: number; r: number } // airspace around the crown the bird keeps to
}

// ---- bird -------------------------------------------------------------------

const BIRD_SPEED = 58 // px/s cruise
const BIRD_ACCEL = 55 // px/s² of steering toward the wander target
const BIRD_FLY_MIN = 9000 // ms aloft between visits to the nest
const BIRD_FLY_MAX = 19000
const BIRD_NEST_MIN = 7000 // ms spent sitting in the nest
const BIRD_NEST_MAX = 15000
const BIRD_RETARGET_MIN = 1600 // ms between wander targets
const BIRD_RETARGET_MAX = 3400
const BIRD_ALPHA = 0.9

/**
 * Sprite frames on the tree's own cell grid, facing right; the draw mirrors
 * them to face left. Two flap frames carry the flight and one plumper folded
 * frame is the bird sat in the nest. Keys index into BIRD_TONES.
 */
const BIRD_FRAMES = {
  up: [
    '...W...',
    '..WW...',
    'TBBBBEK',
    '.LLLL..',
    '.......',
  ],
  down: [
    '.......',
    '.......',
    'TBBBBEK',
    '.LWWL..',
    '..WW...',
  ],
  sit: [
    '.......',
    '...BBEK',
    'TBBBBB.',
    '.LLLB..',
    '.......',
  ],
} as const

/** Muted rust and cream, so the bird reads against the greens without glowing. */
const BIRD_TONES: Record<string, string> = {
  T: 'rgb(92,74,53)', // tail, borrowing the bark shadow
  B: 'rgb(150,92,64)', // rust body
  W: 'rgb(104,68,48)', // dark wing
  L: 'rgb(214,196,160)', // cream belly
  E: 'rgb(40,30,24)', // eye
  K: 'rgb(196,148,58)', // beak
}

type Bird = {
  state: 'fly' | 'approach' | 'nest'
  x: number
  y: number
  vx: number
  vy: number
  tx: number // wander target
  ty: number
  facing: -1 | 1
  flapPhase: number
  until: number // when the current state gives way
  retargetAt: number
  flipAt: number // occasional glance the other way while nesting
}

/** Depth layers: [scale, speed, ink weight]. Far leaves are small, slow, pale. */
const LAYERS = [
  { scale: 0.62, speed: 0.55, weight: 0.5 },
  { scale: 0.85, speed: 0.8, weight: 0.75 },
  { scale: 1.15, speed: 1.15, weight: 1 },
] as const

type WindSwirl = {
  born: number
  duration: number
  x: number
  y: number
  direction: -1 | 1
  scale: number
  alpha: number
  spine: [number, number][] // local px along the stroke, tail first, ending in the curl
  arc: number[] // cumulative length at each spine point, normalised to 0..1
}

type Leaf = {
  x: number
  y: number
  size: number
  width: number
  bend: number
  angle: number
  spin: number
  flip: number // flutter phase; the leaf turns edge-on as this crosses ±π/2
  flutter: number
  swayPhase: number
  swayRate: number
  fall: number // px/s
  ink: number // index into INKS
  layer: number
  alpha: number
}

export default function LeafFall({
  className = '',
  anchor,
}: {
  className?: string
  /** Selector for the element the tree stands on, e.g. the section heading. */
  anchor?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dprScale = 1
    let leaves: Leaf[] = []
    let swirls: WindSwirl[] = []
    let screens: (CanvasPattern | null)[] = []

    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    let nextSwirlAt = performance.now() + rand(SWIRL_GAP_MIN, SWIRL_GAP_MAX)

    // ---- halftone screens --------------------------------------------------

    /**
     * One tiled dot per ink, built at device resolution so the dots stay crisp,
     * then scaled back to CSS px and rotated to that ink's screen angle. The
     * pattern transform is absolute, which is exactly what pins the screen to
     * the page instead of to whatever leaf is being filled.
     */
    const buildScreens = () => {
      screens = INKS.map((ink, i) => {
        const tile = document.createElement('canvas')
        const px = Math.max(2, Math.round(TILE * dprScale))
        tile.width = px
        tile.height = px
        const tctx = tile.getContext('2d')
        if (!tctx) return null
        tctx.fillStyle = `rgb(${ink[0]},${ink[1]},${ink[2]})`
        tctx.beginPath()
        tctx.arc(px / 2, px / 2, DOT * dprScale, 0, Math.PI * 2)
        tctx.fill()

        const pattern = ctx.createPattern(tile, 'repeat')
        if (!pattern) return null
        // `setTransform` needs a matrix; every browser that ships
        // createPattern also ships DOMMatrix, but an untransformed screen is a
        // survivable fallback (dots land at device scale, unrotated).
        if (typeof DOMMatrix === 'function') {
          pattern.setTransform(
            new DOMMatrix().scaleSelf(1 / dprScale).rotateSelf(SCREEN_ANGLES[i]),
          )
        }
        return pattern
      })
    }

    // ---- leaves ------------------------------------------------------------

    const leafCount = () =>
      Math.max(MIN_LEAVES, Math.min(MAX_LEAVES, Math.round((width * height) / AREA_PER_LEAF)))

    const makeLeaf = (x: number, y: number): Leaf => {
      const layer = (Math.random() * LAYERS.length) | 0
      const { scale, speed, weight } = LAYERS[layer]
      return {
        x,
        y,
        size: rand(14, 22) * scale,
        width: rand(0.28, 0.39),
        bend: rand(-0.1, 0.1),
        angle: Math.random() * Math.PI * 2,
        spin: rand(-SPIN_SPEED, SPIN_SPEED),
        flip: Math.random() * Math.PI * 2,
        flutter: rand(0.6, 1.4) * FLUTTER_SPEED,
        swayPhase: Math.random() * Math.PI * 2,
        swayRate: rand(0.25, 0.55),
        fall: FALL_SPEED * speed * rand(0.8, 1.25),
        ink: (Math.random() * INKS.length) | 0,
        layer,
        alpha: weight * rand(0.8, 1),
      }
    }

    /**
     * Where a leaf enters the field. Most of the time it lets go from under one
     * of the tree's pads; otherwise it drifts in above the top edge, which keeps
     * the whole width populated rather than leaving one busy column over the
     * tree. `settled` starts the leaf part-way down its fall instead of at the
     * moment it detaches, for filling a section that should never look empty.
     */
    const spawnPoint = (settled: boolean) => {
      const spawns = tree?.spawns
      if (spawns?.length && Math.random() < FROM_TREE_CHANCE) {
        const p = spawns[(Math.random() * spawns.length) | 0]
        return {
          x: p.x + rand(-PIXEL, PIXEL),
          y: p.y + rand(-PIXEL, PIXEL) + (settled ? rand(0, (height - p.y) * 0.85) : 0),
        }
      }
      return {
        x: rand(-40, width + 40),
        y: settled ? rand(-height * 0.2, height) : rand(-height * 0.25, -30),
      }
    }

    /** Fill the section with leaves already mid-fall, so it is never empty. */
    const populate = () => {
      const count = leafCount()
      leaves = []
      for (let i = 0; i < count; i++) {
        const p = spawnPoint(true)
        leaves.push(makeLeaf(p.x, p.y))
      }
    }

    /** Send a leaf that has cleared the bottom back to the tree or the top edge. */
    const recycle = (leaf: Leaf) => {
      const p = spawnPoint(false)
      Object.assign(leaf, makeLeaf(p.x, p.y))
    }

    // ---- pixel tree --------------------------------------------------------

    let tree: Tree | null = null
    const TONE_STYLES = TREE_TONES.map(
      ([r, g, b, a]) => `rgba(${r},${g},${b},${(a * TREE_ALPHA).toFixed(3)})`,
    )

    /**
     * Seeded, so the tree is the same tree on every load and across a resize.
     * A remembered silhouette is the point — it is scenery, not weather.
     */
    const seeded = (seed: number) => () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }

    /**
     * Where the trunk meets the ground, and how tall the tree may be there.
     * Anchored, the ground is the anchor's bottom edge and the tree is sized to
     * the clear band above it; the foot is set in from the anchor's right end by
     * half the crown's spread, so the foliage lands beside the title rather than
     * over it and still stays within the anchor's own width.
     */
    const treeFooting = () => {
      const clamp = (px: number) =>
        Math.max(TREE_MIN_ROWS, Math.min(TREE_MAX_ROWS, Math.round(px / PIXEL)))

      const el = anchor ? document.querySelector<HTMLElement>(anchor) : null
      if (el) {
        const base = canvas.getBoundingClientRect()
        const r = el.getBoundingClientRect()
        if (r.height >= 1) {
          const y = r.bottom - base.top
          const rows = clamp(y - TREE_TOP_GAP)
          return { x: r.right - base.left - rows * PIXEL * 0.5, y, rows }
        }
      }
      return {
        x: Math.min(width * 0.09 + 26, width - 40),
        y: height,
        rows: clamp(height * TREE_HEIGHT),
      }
    }

    /**
     * Grow the tree into cells once per layout. Coordinates are cell units with
     * the origin at the foot of the trunk and y counting upward, which keeps the
     * generation readable; the draw flips it back.
     */
    const buildTree = () => {
      const footing = treeFooting()
      const rows = footing.rows
      const rnd = seeded(0x5eed7)
      const cells: TreeCell[][] = TREE_TONES.map(() => [])
      const add = (x: number, y: number, tone: number) => cells[tone].push({ x, y })

      // A single gentle S through the trunk. Japanese garden pines are trained
      // off the vertical, and the lean is most of what stops this reading as a
      // lollipop on a stick.
      const lean = (y: number) => Math.sin((y / rows) * 1.9) * rows * 0.13

      const trunkTop = Math.round(rows * 0.84)
      for (let y = 0; y <= trunkTop; y++) {
        const t = y / rows
        const half = t < 0.12 ? 1.7 : t < 0.5 ? 1.1 : 0.6 // taper
        const cx = lean(y)
        const from = Math.round(cx - half)
        const to = Math.round(cx + half)
        // Light falls from the left, so the right column is the shadow side.
        for (let x = from; x <= to; x++) add(x, y, x === to && to > from ? 0 : 1)
      }
      // Roots: a couple of cells flaring either side, so the trunk meets the
      // bottom edge instead of being cut off by it.
      const foot = Math.round(lean(0))
      for (let x = foot - 3; x <= foot + 3; x++) add(x, 0, 0)

      const pads: { x: number; y: number; span: number }[] = []
      for (const b of TREE_BRANCHES) {
        const y0 = Math.round(rows * b.at)
        const len = Math.max(3, Math.round(rows * b.len))
        let x = Math.round(lean(y0))
        let y = y0
        for (let i = 0; i < len; i++) {
          x += b.dir
          if (i % 2 === 1) y += 1 // arms rise as they reach out
          add(x, y, 0)
          if (i < len / 2) add(x, y - 1, 0) // thicker where it leaves the trunk
        }
        pads.push({ x, y, span: 1 - b.at * 0.45 })
      }
      pads.push({ x: Math.round(lean(trunkTop)), y: trunkTop + 2, span: 0.8 })

      const ox = Math.round(footing.x / PIXEL) * PIXEL
      const oy = Math.round(footing.y / PIXEL) * PIXEL
      const spawns: { x: number; y: number }[] = []

      pads.forEach((p) => {
        // Wide and flat: the horizontal cloud of a trained pine, not a ball.
        const rx = rows * 0.3 * p.span
        const ry = rx * 0.42
        const rxi = Math.ceil(rx)
        const ryi = Math.ceil(ry)
        for (let uy = -ryi; uy <= ryi; uy++) {
          for (let dx = -rxi; dx <= rxi; dx++) {
            const r = (dx * dx) / (rx * rx) + (uy * uy) / (ry * ry)
            if (r > 1) continue
            // Chew the rim, so the pad has needles rather than an outline.
            if (r > 0.6 && rnd() < 0.45) continue
            const up = uy / ry
            let tone = up > 0.3 ? 4 : up < -0.3 ? 2 : 3
            // A little dither between neighbouring tones, which at this cell
            // size reads as foliage depth instead of as noise.
            if (rnd() < 0.16) tone = tone === 3 ? (rnd() < 0.5 ? 2 : 4) : 3
            add(p.x + dx, p.y + uy, tone)
          }
        }

        // Detach points along the underside of the pad, spread across its width.
        // Leaves let go from here rather than from the silhouette's edge, so a
        // new one appears out of the foliage instead of beside it.
        for (let k = 0; k < PAD_SPAWNS; k++) {
          const dx = ((k + rnd()) / PAD_SPAWNS) * 2 * rx - rx
          const uy = -ry * (0.35 + rnd() * 0.55)
          spawns.push({ x: ox + (p.x + dx) * PIXEL, y: oy - (p.y + uy + 1) * PIXEL })
        }
      })

      // A twig nest on the second pad's upper surface: a cup of bark-coloured
      // cells that draws with the tree, so it is simply always there. The bird
      // visits it; it never has to appear.
      const nestPad = pads[1]
      const nestRy = rows * 0.3 * nestPad.span * 0.42
      const nx = Math.round(nestPad.x)
      const ny = Math.round(nestPad.y + nestRy)
      for (let dx = -2; dx <= 2; dx++) add(nx + dx, ny, 0)
      add(nx - 2, ny + 1, 1)
      add(nx + 2, ny + 1, 1)
      add(nx - 1, ny, 1) // a lit twig, so the cup is not one flat band

      tree = {
        ox,
        oy,
        cells,
        spawns,
        // Sprite-centre page px that seats the bird's belly on the nest rim.
        perch: { x: ox + (nx + 0.5) * PIXEL, y: oy - (ny + 2.5) * PIXEL },
        // Centred on the crown, generous enough for a couple of circuits but
        // tight enough that the bird stays in the clear band by the heading
        // instead of wandering off behind the photo grid.
        home: {
          x: ox,
          y: oy - rows * PIXEL * 0.62,
          r: rows * PIXEL * 0.85,
        },
      }
      bakeTree()
    }

    /**
     * The tree never moves, so its cells are painted once per layout into a
     * sprite at device resolution and blitted each frame, instead of costing
     * one fillRect per cell per frame. The sprite's origin is rounded to a
     * whole device pixel so the blit never resamples.
     */
    let treeSprite: { canvas: HTMLCanvasElement; x: number; y: number } | null = null

    const bakeTree = () => {
      treeSprite = null
      if (!tree) return
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      for (const tone of tree.cells) {
        for (const cell of tone) {
          if (cell.x < minX) minX = cell.x
          if (cell.x > maxX) maxX = cell.x
          if (cell.y < minY) minY = cell.y
          if (cell.y > maxY) maxY = cell.y
        }
      }
      if (minX > maxX) return

      const { ox, oy } = tree
      const x = Math.round((ox + minX * PIXEL) * dprScale)
      const y = Math.round((oy - (maxY + 1) * PIXEL) * dprScale)
      const sprite = document.createElement('canvas')
      sprite.width = Math.ceil((maxX - minX + 1) * PIXEL * dprScale) + 1
      sprite.height = Math.ceil((maxY - minY + 1) * PIXEL * dprScale) + 1
      const sctx = sprite.getContext('2d')
      if (!sctx) return
      sctx.setTransform(dprScale, 0, 0, dprScale, -x, -y)
      for (let tone = 0; tone < tree.cells.length; tone++) {
        sctx.fillStyle = TONE_STYLES[tone]
        for (const cell of tree.cells[tone]) {
          sctx.fillRect(ox + cell.x * PIXEL, oy - (cell.y + 1) * PIXEL, PIXEL, PIXEL)
        }
      }
      treeSprite = { canvas: sprite, x, y }
    }

    const drawTree = () => {
      if (!treeSprite) return
      ctx.globalAlpha = 1
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(treeSprite.canvas, treeSprite.x, treeSprite.y)
      ctx.setTransform(dprScale, 0, 0, dprScale, 0, 0)
    }

    // ---- bird --------------------------------------------------------------

    /**
     * Starts in the nest, which is also what the reduced-motion still frame
     * shows: a bird at rest is a better single frame than one stopped mid-air.
     */
    const bird: Bird = {
      state: 'nest',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      tx: 0,
      ty: 0,
      facing: -1,
      flapPhase: 0,
      until: performance.now() + rand(2500, 6000),
      retargetAt: 0,
      flipAt: performance.now() + rand(2000, 5000),
    }

    /**
     * Somewhere in the air around the crown. The bird keeps to the tree's own
     * corner of the section — further afield it would only pass behind the
     * photo grid and read as missing rather than as flying.
     */
    const pickWanderTarget = (now: number) => {
      const home = tree?.home
      if (home) {
        const a = Math.random() * Math.PI * 2
        const r = home.r * (0.3 + Math.random() * 0.7)
        bird.tx = Math.max(24, Math.min(width - 24, home.x + Math.cos(a) * r))
        bird.ty = Math.max(20, Math.min(height - 30, home.y + Math.sin(a) * r * 0.7))
      } else {
        bird.tx = rand(width * 0.12, width * 0.88)
        bird.ty = rand(height * 0.1, height * 0.62)
      }
      bird.retargetAt = now + rand(BIRD_RETARGET_MIN, BIRD_RETARGET_MAX)
    }

    const stepBird = (now: number, dt: number) => {
      if (!tree) return

      if (bird.state === 'nest') {
        // Sat still on the grid; only the head turns now and then.
        bird.x = tree.perch.x
        bird.y = tree.perch.y
        if (now >= bird.flipAt) {
          bird.facing = bird.facing === 1 ? -1 : 1
          bird.flipAt = now + rand(2000, 6000)
        }
        if (now >= bird.until) {
          bird.state = 'fly'
          bird.until = now + rand(BIRD_FLY_MIN, BIRD_FLY_MAX)
          // Take off away from the trunk, with a hop of lift.
          bird.vx = (bird.x > width / 2 ? -1 : 1) * BIRD_SPEED * 0.6
          bird.vy = -BIRD_SPEED * 0.8
          pickWanderTarget(now)
        }
        return
      }

      if (bird.state === 'fly' && now >= bird.until) {
        bird.state = 'approach'
      }

      const toNest = bird.state === 'approach'
      const tx = toNest ? tree.perch.x : bird.tx
      // Aim a little above the nest, so the last stretch is a settle, not a dive.
      const ty = toNest ? tree.perch.y - PIXEL * 2 : bird.ty
      const dx = tx - bird.x
      const dy = ty - bird.y
      const d = Math.hypot(dx, dy) || 1

      if (toNest && d < 4) {
        // Touch down: snap to the grid-aligned perch and fold the wings.
        bird.state = 'nest'
        bird.vx = 0
        bird.vy = 0
        bird.until = now + rand(BIRD_NEST_MIN, BIRD_NEST_MAX)
        bird.flipAt = now + rand(1500, 4000)
        return
      }

      if (!toNest && (now >= bird.retargetAt || d < 24)) pickWanderTarget(now)

      // Steer toward the target; near the nest the arrival slows to a flutter.
      const accel = toNest ? BIRD_ACCEL * 1.6 : BIRD_ACCEL
      bird.vx += (dx / d) * accel * dt
      bird.vy += (dy / d) * accel * dt
      // A slow vertical wave under the steering, so cruising reads as riding
      // the air rather than as gliding down a wire.
      if (!toNest) bird.vy += Math.sin(now * 0.0021) * 14 * dt

      const speed = Math.hypot(bird.vx, bird.vy) || 1
      const limit = toNest ? Math.max(22, Math.min(BIRD_SPEED, d * 2.2)) : BIRD_SPEED
      if (speed > limit) {
        bird.vx = (bird.vx / speed) * limit
        bird.vy = (bird.vy / speed) * limit
      }

      bird.x += bird.vx * dt
      bird.y += bird.vy * dt

      // Soft walls, so a wide swing curls back instead of leaving the section.
      if (bird.x < 30) bird.vx += BIRD_ACCEL * 2 * dt
      if (bird.x > width - 30) bird.vx -= BIRD_ACCEL * 2 * dt
      if (bird.y < 24) bird.vy += BIRD_ACCEL * 2 * dt
      if (bird.y > height - 30) bird.vy -= BIRD_ACCEL * 2 * dt

      // And a leash: momentum that carries the bird past its airspace meets a
      // pull back toward the crown that stiffens with the overshoot.
      const home = tree.home
      const hx = home.x - bird.x
      const hy = home.y - bird.y
      const hd = Math.hypot(hx, hy)
      if (hd > home.r) {
        const over = Math.min(2, (hd - home.r) / (home.r * 0.4))
        bird.vx += (hx / hd) * BIRD_ACCEL * over * dt
        bird.vy += (hy / hd) * BIRD_ACCEL * over * dt
      }

      if (Math.abs(bird.vx) > 6) bird.facing = bird.vx > 0 ? 1 : -1
      // Wings beat hard on the climb and ease off on the descent.
      bird.flapPhase += (bird.vy < 0 ? 15 : 7) * dt
    }

    /** One fillRect per sprite cell, mirrored by `facing`, on the tree's grid. */
    const drawBird = () => {
      if (!tree) return
      const frame =
        bird.state === 'nest'
          ? BIRD_FRAMES.sit
          : Math.sin(bird.flapPhase) > 0
            ? BIRD_FRAMES.up
            : BIRD_FRAMES.down
      const cols = frame[0].length
      const rows = frame.length
      // Perched, the sprite sits on the grid-aligned perch itself — which also
      // covers the reduced-motion still frame, where stepBird never runs. In
      // flight it moves freely, and only its cells stay square.
      const cx = bird.state === 'nest' ? tree.perch.x : bird.x
      const cy = bird.state === 'nest' ? tree.perch.y : bird.y
      const left = cx - (cols / 2) * PIXEL
      const top = cy - (rows / 2) * PIXEL

      ctx.globalAlpha = BIRD_ALPHA
      for (let r = 0; r < rows; r++) {
        const row = frame[r]
        for (let c = 0; c < cols; c++) {
          const key = row[c]
          if (key === '.') continue
          const col = bird.facing === 1 ? c : cols - 1 - c
          ctx.fillStyle = BIRD_TONES[key]
          ctx.fillRect(left + col * PIXEL, top + r * PIXEL, PIXEL, PIXEL)
        }
      }
    }

    // ---- occasional wind swirls -------------------------------------------

    /**
     * The spine of one gust: a long undulating approach that ends in a loop
     * spiralling inward, built fresh per gust so no two marks are the same
     * stroke. The loop is a fixed centre with a shrinking radius, entered at
     * the tail's own heading, so the curl grows out of the line instead of
     * sitting pinned to its end.
     */
    const buildSwirlSpine = (): [number, number][] => {
      const length = rand(150, 220)
      const lift = rand(9, 16)
      const curl = rand(19, 27)
      const wobble = rand(0, Math.PI * 2)
      const turns = rand(1.15, 1.45)
      const spine: [number, number][] = []
      const nTail = Math.round(SWIRL_POINTS * 0.58)
      for (let i = 0; i <= nTail; i++) {
        const u = i / nTail
        spine.push([
          length * (u - 1),
          Math.sin(u * Math.PI * 1.3 + wobble) * lift * (1 - u) ** 1.2,
        ])
      }
      const nCurl = SWIRL_POINTS - nTail
      for (let i = 1; i <= nCurl; i++) {
        const u = i / nCurl
        const th = u * Math.PI * 2 * turns
        const r = curl * (1 - 0.58 * u)
        spine.push([r * Math.sin(th), r * Math.cos(th) - curl])
      }
      return spine
    }

    /** Add one sparse gust where it will be seen, and book the next. */
    const spawnWindSwirl = (now: number) => {
      const spine = buildSwirlSpine()
      const arc: number[] = [0]
      for (let i = 1; i < spine.length; i++) {
        arc.push(
          arc[i - 1] + Math.hypot(spine[i][0] - spine[i - 1][0], spine[i][1] - spine[i - 1][1]),
        )
      }
      const total = arc[arc.length - 1]
      for (let i = 0; i < arc.length; i++) arc[i] /= total

      swirls.push({
        born: now,
        duration: rand(SWIRL_DURATION_MIN, SWIRL_DURATION_MAX),
        x: rand(width * 0.2, width * 0.8),
        y: rand(height * 0.16, height * 0.72),
        direction: Math.random() < 0.7 ? 1 : -1,
        scale: rand(0.55, 0.85),
        alpha: rand(0.34, 0.5),
        spine,
        arc,
      })
      nextSwirlAt = now + rand(SWIRL_GAP_MIN, SWIRL_GAP_MAX)
    }

    /** Position and unit tangent at a fraction of the spine's arc length. */
    const spinePoint = (
      swirl: WindSwirl,
      f: number,
    ): [number, number, number, number] => {
      const { spine, arc } = swirl
      let i = 1
      while (i < arc.length - 1 && arc[i] < f) i++
      const span = arc[i] - arc[i - 1] || 1
      const t = Math.min(1, Math.max(0, (f - arc[i - 1]) / span))
      const [ax, ay] = spine[i - 1]
      const dx = spine[i][0] - ax
      const dy = spine[i][1] - ay
      const d = Math.hypot(dx, dy) || 1
      return [ax + dx * t, ay + dy * t, dx / d, dy / d]
    }

    /**
     * One strand of a gust: the stretch of spine between two arc fractions,
     * filled as a ribbon that tapers to a point at both ends. The taper lives
     * in the geometry rather than in lineWidth, so the strand is a single fill
     * with no per-segment stroking to bead up at the joints.
     */
    const traceWindStrand = (swirl: WindSwirl, tail: number, head: number, width: number) => {
      const from = Math.max(0, tail)
      const to = Math.min(1, head)
      if (to - from < 0.01) return
      const steps = 26
      const left: [number, number][] = []
      const right: [number, number][] = []
      for (let i = 0; i <= steps; i++) {
        const f = from + ((to - from) * i) / steps
        // 0 at the fading tail of the window, 1 at the stroke's moving tip.
        const local = (f - tail) / (head - tail)
        const w = (width * Math.sin(Math.PI * local) ** 0.8) / 2
        const [px, py, tx, ty] = spinePoint(swirl, f)
        left.push([px - ty * w, py + tx * w])
        right.push([px + ty * w, py - tx * w])
      }
      ctx.beginPath()
      ctx.moveTo(left[0][0], left[0][1])
      for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1])
      for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1])
      ctx.closePath()
      ctx.fill()
    }

    const drawWindSwirls = (now: number) => {
      if (!swirls.length) return

      const [r, g, b] = SWIRL_INK
      ctx.fillStyle = `rgb(${r},${g},${b})`
      for (const swirl of swirls) {
        const progress = (now - swirl.born) / swirl.duration
        if (progress <= 0 || progress >= 1) continue

        // Smooth entry and exit: the gust exists only in the middle of its life.
        const visibility = Math.sin(progress * Math.PI)
        // The visible stretch travels the spine tail-to-curl over the gust's
        // life: the stroke draws itself on, turns over in the loop, and is
        // swallowed by its own tip. That travel is the swirl — the mark itself
        // is only carried a short way downwind.
        const head = progress * (1 + SWIRL_WINDOW)
        const tail = head - SWIRL_WINDOW

        ctx.save()
        ctx.translate(swirl.x + swirl.direction * progress * SWIRL_DRIFT, swirl.y)
        ctx.scale(swirl.direction * swirl.scale, swirl.scale)

        // A slightly misregistered echo keeps the printed feel without the
        // stroke reading as one polished vector.
        ctx.globalAlpha = swirl.alpha * visibility
        traceWindStrand(swirl, tail, head, 2.4)
        ctx.translate(-8, 6)
        ctx.globalAlpha = swirl.alpha * visibility * 0.45
        traceWindStrand(swirl, tail - 0.04, head - 0.04, 1.5)
        ctx.restore()
      }
    }

    // ---- drawing -----------------------------------------------------------

    /**
     * Convert one point on the leaf from local coordinates into page coordinates.
     * The width bends slightly along the midrib, while `flip` still supplies the
     * edge-on flutter used by the original animation.
     */
    const leafPoint = (
      leaf: Leaf,
      lx: number,
      ly: number,
      dx = 0,
      dy = 0,
    ): [number, number] => {
      const cos = Math.cos(leaf.angle)
      const sin = Math.sin(leaf.angle)
      const squash = Math.cos(leaf.flip)
      const s = leaf.size
      const curve = Math.sin((Math.max(0, Math.min(s, lx)) / s) * Math.PI) * s * leaf.bend
      const px = (lx - s / 2) * squash
      const py = ly + curve
      return [leaf.x + dx + px * cos - py * sin, leaf.y + dy + px * sin + py * cos]
    }

    /** A fuller pointed leaf with an asymmetric hand-drawn profile. */
    const tracePath = (leaf: Leaf, dx: number, dy: number) => {
      const s = leaf.size
      const w = s * leaf.width
      const base = leafPoint(leaf, 0, 0, dx, dy)
      const tip = leafPoint(leaf, s, 0, dx, dy)
      const upper1 = leafPoint(leaf, s * 0.2, -w * 0.72, dx, dy)
      const upper2 = leafPoint(leaf, s * 0.67, -w, dx, dy)
      const lower2 = leafPoint(leaf, s * 0.7, w * 0.92, dx, dy)
      const lower1 = leafPoint(leaf, s * 0.24, w * 0.64, dx, dy)

      ctx.beginPath()
      ctx.moveTo(base[0], base[1])
      ctx.bezierCurveTo(upper1[0], upper1[1], upper2[0], upper2[1], tip[0], tip[1])
      ctx.bezierCurveTo(lower2[0], lower2[1], lower1[0], lower1[1], base[0], base[1])
      ctx.closePath()
    }

    const drawLeafDetails = (leaf: Leaf) => {
      const s = leaf.size
      const squash = Math.abs(Math.cos(leaf.flip))

      ctx.strokeStyle = DETAIL_STYLES[leaf.ink]
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = Math.max(0.55, s * 0.025 * squash)
      ctx.globalAlpha = leaf.alpha * 0.58

      // Stem and central vein.
      const stem = leafPoint(leaf, -s * 0.13, 0)
      const veinEnd = leafPoint(leaf, s * 0.88, 0)
      ctx.beginPath()
      ctx.moveTo(stem[0], stem[1])
      ctx.lineTo(veinEnd[0], veinEnd[1])
      ctx.stroke()

      // Four vein pairs tapering toward the tip.
      ctx.lineWidth = Math.max(0.45, s * 0.016 * squash)
      ctx.globalAlpha = leaf.alpha * 0.42
      for (const t of [0.25, 0.42, 0.59, 0.74]) {
        const centre = leafPoint(leaf, s * t, 0)
        const reach = Math.sin(Math.PI * t) * s * leaf.width * 0.72
        const ahead = s * (t + 0.1)
        const upper = leafPoint(leaf, ahead, -reach)
        const lower = leafPoint(leaf, ahead, reach)
        ctx.beginPath()
        ctx.moveTo(centre[0], centre[1])
        ctx.lineTo(upper[0], upper[1])
        ctx.moveTo(centre[0], centre[1])
        ctx.lineTo(lower[0], lower[1])
        ctx.stroke()
      }

      // A fine outline keeps the larger leaves crisp over photographs.
      tracePath(leaf, 0, 0)
      ctx.lineWidth = Math.max(0.55, s * 0.02 * squash)
      ctx.globalAlpha = leaf.alpha * 0.48
      ctx.stroke()
    }

    const drawLeaf = (leaf: Leaf) => {
      const screen = screens[leaf.ink]
      // Edge-on: nothing to print this frame, and a hairline would only alias.
      if (Math.abs(Math.cos(leaf.flip)) < 0.06) return

      // Near leaves print a misregistered second plate first, so the intended
      // ink lands on top of the slip rather than under it.
      if (leaf.layer === LAYERS.length - 1 && screens[REGISTER_INK]) {
        tracePath(leaf, REGISTER_OFFSET, REGISTER_OFFSET * 0.7)
        ctx.globalAlpha = leaf.alpha * 0.24
        ctx.fillStyle = screens[REGISTER_INK] as CanvasPattern
        ctx.fill()
      }

      tracePath(leaf, 0, 0)
      ctx.globalAlpha = leaf.alpha * 0.2
      ctx.fillStyle = INK_STYLES[leaf.ink]
      ctx.fill()

      if (screen) {
        ctx.globalAlpha = leaf.alpha * 0.58
        ctx.fillStyle = screen
        ctx.fill()
      }

      drawLeafDetails(leaf)
    }

    const render = (now: number) => {
      ctx.setTransform(dprScale, 0, 0, dprScale, 0, 0)
      ctx.clearRect(0, 0, width, height)
      // Scenery first: the pine is still, and everything else passes in front.
      drawTree()
      // Wind marks pass behind the leaves, so they remain a background accent.
      drawWindSwirls(now)
      // The bird flies among the leaves but behind the nearest of them, which
      // keeps it an inhabitant of the scene rather than a layer on top of it.
      drawBird()
      // Back to front, so near leaves overprint far ones.
      for (const leaf of leaves) drawLeaf(leaf)
      ctx.globalAlpha = 1
    }

    // ---- setup -------------------------------------------------------------

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      if (w === width && h === height) {
        // Same canvas, but the anchor may have reflowed under it, and the tree
        // stands on the anchor rather than on the section.
        buildTree()
        render(performance.now())
        return
      }
      const hadField = width > 0 && height > 0
      const sx = hadField ? w / width : 1
      const sy = hadField ? h / height : 1
      width = w
      height = h
      dprScale = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.max(1, Math.round(width * dprScale))
      canvas.height = Math.max(1, Math.round(height * dprScale))
      ctx.setTransform(dprScale, 0, 0, dprScale, 0, 0)
      // Patterns are bound to the context's resolution, so they are rebuilt
      // whenever the backing store changes.
      buildScreens()
      buildTree()

      // Carry the existing field across a resize rather than restarting the
      // fall — a window drag should not visibly reshuffle the section.
      if (hadField) {
        for (const leaf of leaves) {
          leaf.x *= sx
          leaf.y *= sy
        }
        const target = leafCount()
        while (leaves.length > target) leaves.pop()
        while (leaves.length < target) {
          const p = spawnPoint(true)
          leaves.push(makeLeaf(p.x, p.y))
        }
      } else {
        populate()
      }
      // A still frame in calm air, which is also what reduced motion keeps.
      render(performance.now())
    }

    // ---- animation ---------------------------------------------------------

    let raf = 0
    let running = false
    let last = performance.now()

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      // Clamped, so a backgrounded tab or a long stall does not teleport the
      // whole field down the page on the frame it resumes.
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      // Two periods, so the leaf drift never repeats on an obvious beat. Slow,
      // and worth only a few px/s of push: the leaves should wander down the
      // section, not be driven across it.
      const wt = now * 0.00022
      const wind = Math.sin(wt) * 0.7 + Math.sin(wt * 2.3 + 1.1) * 0.3

      if (now >= nextSwirlAt) spawnWindSwirl(now)
      swirls = swirls.filter((swirl) => now - swirl.born <= swirl.duration)

      stepBird(now, dt)

      for (const leaf of leaves) {
        leaf.y += leaf.fall * dt
        leaf.swayPhase += leaf.swayRate * dt
        leaf.x +=
          (Math.cos(leaf.swayPhase) * SWAY_AMPLITUDE * leaf.swayRate + wind * 5) * dt
        leaf.angle += leaf.spin * dt
        leaf.flip += leaf.flutter * dt

        if (leaf.y - leaf.size > height) recycle(leaf)
        // Wrap sideways rather than recycling, so a leaf blown off one edge
        // does not leave a gap it could have drifted through.
        else if (leaf.x < -leaf.size - 40) leaf.x = width + leaf.size + 40
        else if (leaf.x > width + leaf.size + 40) leaf.x = -leaf.size - 40
      }

      render(now)
    }

    const start = () => {
      if (running || reduceMotion) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }

    const stop = () => {
      if (!running) return
      running = false
      cancelAnimationFrame(raf)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) start()
        else stop()
      },
      { threshold: 0 },
    )
    observer.observe(canvas)

    const onVisibility = () => {
      if (document.hidden) stop()
      else {
        const rect = canvas.getBoundingClientRect()
        if (rect.bottom > 0 && rect.top < window.innerHeight) start()
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    resize()
    document.addEventListener('visibilitychange', onVisibility)

    // The serif display face lands after first paint and moves the heading the
    // tree stands on. That reflow need not change the section's own height, in
    // which case the ResizeObserver never fires, so the footing is re-measured
    // directly.
    let stale = false
    document.fonts?.ready.then(() => {
      if (stale) return
      buildTree()
      render(performance.now())
    })

    return () => {
      stale = true
      stop()
      observer.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [anchor])

  return (
    <div aria-hidden="true" className={className}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Print vignette. Warm sepia into the corners, so the field reads as an
          aged sheet rather than an evenly lit rectangle, and the leaves nearest
          the edges sink instead of stopping dead at the section boundary. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(105%_80%_at_50%_45%,transparent_45%,rgba(139,108,82,0.16)_100%)]" />
    </div>
  )
}
