<template>
  <canvas ref="canvasRef" class="utv-bg-canvas" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
import { useData } from "vitepress";
import { onMounted, onUnmounted, ref, watch } from "vue";

/* ─── 全屏 Canvas 背景动效："节点林" ────────────────────────
   漂移的节点之间以 ├─ 式直角导线相连——tree view 的节点与导线
   本身就是这个库的主角；底层三团品牌绿/青的极光缓慢游走。
   亮色主题是"晨雾苗圃"（细导线 + 实心节点），
   暗色主题是"林间萤火"（辉光节点 + 明暗闪烁），
   同一引擎、两套风格参数。指针移入时会作为临时"根节点"就近拉线。 */

interface ThemePreset {
  /** 三团极光的峰值透明度，顺序对应 AURORAS */
  aurora: [number, number, number];
  /** 连线颜色的 "r, g, b" 片段 */
  link: string;
  linkAlpha: number;
  node: string;
  nodeAlpha: number;
  /** 节点辉光（暗色萤火感） */
  glow: boolean;
  /** 明暗闪烁幅度 0~1 */
  twinkle: number;
}

interface Particle {
  x: number;
  y: number;
  /** 运动方向（弧度），随时间缓慢随机游走 */
  angle: number;
  /** 速度 px/s */
  speed: number;
  r: number;
  /** 分支节点画圆角方块、叶子画圆点，呼应示例里"组/叶"两种图标 */
  branch: boolean;
  /** 闪烁相位与角速度 */
  phase: number;
  flicker: number;
}

const LIGHT: ThemePreset = {
  aurora: [0.13, 0.1, 0.09],
  link: "41, 151, 100",
  linkAlpha: 0.22,
  node: "31, 117, 79",
  nodeAlpha: 0.55,
  glow: false,
  twinkle: 0.25
};

const DARK: ThemePreset = {
  aurora: [0.07, 0.06, 0.055],
  link: "126, 224, 174",
  linkAlpha: 0.16,
  node: "140, 235, 185",
  nodeAlpha: 0.85,
  glow: true,
  twinkle: 0.6
};

/* 三团极光的轨道：位置/半径为视口比例，w 为角速度（rad/s），
   x/y 频率错开形成利萨如轨迹，避免看出循环 */
const AURORAS = [
  { rgb: "50, 218, 98", cx: 0.16, cy: 0.12, r: 0.52, ax: 0.1, ay: 0.08, wx: 0.16, wy: 0.12, p: 0 },
  { rgb: "8, 201, 212", cx: 0.85, cy: 0.16, r: 0.46, ax: 0.09, ay: 0.07, wx: 0.12, wy: 0.17, p: 2.1 },
  { rgb: "41, 151, 100", cx: 0.55, cy: 0.92, r: 0.5, ax: 0.11, ay: 0.06, wx: 0.1, wy: 0.14, p: 4.2 }
];

const { isDark } = useData();

const MAX_CANVAS_PIXELS = 4_000_000;
const FRAME_INTERVAL = 1000 / 30;
const canvasRef = ref<HTMLCanvasElement>();

let applyThemeRef: ((dark: boolean) => void) | null = null;
let teardown: (() => void) | undefined;

watch(isDark, (dark) => applyThemeRef?.(dark));

onMounted(() => {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) {
    return;
  }

  let w = 0;
  let h = 0;
  let linkDist = 150;
  let preset = isDark.value ? DARK : LIGHT;
  let glowSprite: HTMLCanvasElement | null = null;
  const particles: Particle[] = [];
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, active: false };

  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let rafId = 0;
  let lastT = 0;
  /* 起始相位随机，避免每次进站极光都从同一画面开始 */
  let elapsed = Math.random() * 100;

  function makeParticle(): Particle {
    const branch = Math.random() < 0.16;
    return {
      x: Math.random() * (w + linkDist * 2) - linkDist,
      y: Math.random() * (h + linkDist * 2) - linkDist,
      angle: Math.random() * Math.PI * 2,
      speed: 10 + Math.random() * 14,
      r: branch ? 2.4 + Math.random() * 0.9 : 1.3 + Math.random(),
      branch,
      phase: Math.random() * Math.PI * 2,
      flicker: 0.6 + Math.random() * 1.2
    };
  }

  /* 辉光贴图预渲染成离屏画布，逐粒子 drawImage 比 shadowBlur 便宜得多 */
  function buildGlowSprite() {
    const sprite = document.createElement("canvas");
    sprite.width = 64;
    sprite.height = 64;
    const sctx = sprite.getContext("2d");
    if (!sctx) {
      return null;
    }
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${preset.node}, 0.5)`);
    grad.addColorStop(0.35, `rgba(${preset.node}, 0.16)`);
    grad.addColorStop(1, `rgba(${preset.node}, 0)`);
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);
    return sprite;
  }

  function applyTheme(dark: boolean) {
    preset = dark ? DARK : LIGHT;
    glowSprite = preset.glow ? buildGlowSprite() : null;
    renderFrame(0);
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    /* 背景动效无需按超高 DPR 全分辨率绘制。限制像素总量，避免大屏/Retina
       下每帧重复填充上千万像素，与滚动和路由切换争抢合成资源。 */
    const pixelBudgetDpr = Math.sqrt(MAX_CANVAS_PIXELS / Math.max(w * h, 1));
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.max(pixelBudgetDpr, 0.75));
    canvas!.width = Math.round(w * dpr);
    canvas!.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    linkDist = Math.min(Math.max(Math.min(w, h) * 0.17, 96), 156);
    /* 密度按面积走，小屏少、大屏多，封顶防止 O(n²) 连线过重 */
    const target = Math.round(Math.min(Math.max((w * h) / 20000, 22), 88));
    while (particles.length < target) {
      particles.push(makeParticle());
    }
    particles.length = target;
    /* 修改 canvas 宽高会立即清空位图。同步补画，避免 resize、滚动条变化
       或移动端地址栏收放时出现一帧空白。 */
    renderFrame(0);
  }

  function renderFrame(dt: number) {
    elapsed += dt;
    const t = elapsed;
    ctx!.clearRect(0, 0, w, h);

    /* 极光层 */
    for (let i = 0; i < AURORAS.length; i++) {
      const a = AURORAS[i];
      const cx = (a.cx + a.ax * Math.sin(t * a.wx + a.p)) * w;
      const cy = (a.cy + a.ay * Math.cos(t * a.wy + a.p)) * h;
      const radius = a.r * Math.min(w, h) * (1 + 0.1 * Math.sin(t * 0.08 + i * 2));
      const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(${a.rgb}, ${preset.aurora[i]})`);
      grad.addColorStop(1, `rgba(${a.rgb}, 0)`);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);
    }

    /* 粒子运动：方向缓慢随机游走，越界从对侧（带外边距）回卷 */
    const margin = linkDist;
    for (const p of particles) {
      p.angle += (Math.random() - 0.5) * 0.6 * dt;
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      if (p.x < -margin) {
        p.x = w + margin;
      } else if (p.x > w + margin) {
        p.x = -margin;
      }
      if (p.y < -margin) {
        p.y = h + margin;
      } else if (p.y > h + margin) {
        p.y = -margin;
      }
    }

    /* ├─ 式直角导线：先竖后横（a 竖直落到 b 的高度，再横向接入 b），
       路径随粒子位置连续变化，不存在方向翻转的跳变 */
    ctx!.lineWidth = 1;
    ctx!.lineJoin = "round";
    ctx!.lineCap = "round";
    const maxD2 = linkDist * linkDist;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= maxD2) {
          continue;
        }
        const alpha = preset.linkAlpha * (1 - Math.sqrt(d2) / linkDist);
        ctx!.strokeStyle = `rgba(${preset.link}, ${alpha})`;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(a.x, b.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }
    }

    /* 指针作为临时"根节点"就近拉线，位置与强度都做插值，出入场柔和 */
    pointer.x += (pointer.tx - pointer.x) * Math.min(dt * 8, 1);
    pointer.y += (pointer.ty - pointer.y) * Math.min(dt * 8, 1);
    pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * Math.min(dt * 4, 1);
    if (pointer.strength > 0.02) {
      const reach = linkDist * 1.25;
      const reach2 = reach * reach;
      for (const p of particles) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= reach2) {
          continue;
        }
        const alpha = preset.linkAlpha * 1.4 * pointer.strength * (1 - Math.sqrt(d2) / reach);
        ctx!.strokeStyle = `rgba(${preset.link}, ${alpha})`;
        ctx!.beginPath();
        ctx!.moveTo(pointer.x, pointer.y);
        ctx!.lineTo(pointer.x, p.y);
        ctx!.lineTo(p.x, p.y);
        ctx!.stroke();
      }
    }

    /* 节点层 */
    for (const p of particles) {
      const tw = 1 - preset.twinkle * (0.5 + 0.5 * Math.sin(p.phase + t * p.flicker));
      if (glowSprite) {
        const gs = p.r * 9;
        ctx!.globalAlpha = tw;
        ctx!.drawImage(glowSprite, p.x - gs / 2, p.y - gs / 2, gs, gs);
        ctx!.globalAlpha = 1;
      }
      ctx!.fillStyle = `rgba(${preset.node}, ${preset.nodeAlpha * tw})`;
      ctx!.beginPath();
      if (p.branch && typeof ctx!.roundRect === "function") {
        ctx!.roundRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2, p.r * 0.45);
      } else {
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      ctx!.fill();
    }
  }

  function loop(now: number) {
    rafId = requestAnimationFrame(loop);
    const frameElapsed = now - lastT;
    if (frameElapsed < FRAME_INTERVAL) {
      return;
    }
    /* 30fps 足以承载慢速背景运动；dt 封顶，标签页挂起恢复后不会瞬移。 */
    const dt = Math.min(frameElapsed / 1000, 0.05);
    lastT = now;
    renderFrame(dt);
  }

  function start() {
    if (rafId || reducedQuery.matches) {
      return;
    }
    lastT = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function onMotionPrefChange() {
    if (reducedQuery.matches) {
      stopLoop();
      renderFrame(0);
    } else {
      start();
    }
  }

  function onVisibility() {
    if (document.hidden) {
      stopLoop();
    } else {
      start();
    }
  }

  function onPointerMove(event: MouseEvent) {
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    if (!pointer.active) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }
    pointer.active = true;
  }

  function onPointerLeave() {
    pointer.active = false;
  }

  applyThemeRef = applyTheme;
  resize();
  applyTheme(isDark.value);
  if (reducedQuery.matches) {
    renderFrame(0);
  } else {
    start();
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("mouseleave", onPointerLeave);
  document.addEventListener("visibilitychange", onVisibility);
  reducedQuery.addEventListener("change", onMotionPrefChange);

  teardown = () => {
    stopLoop();
    window.removeEventListener("resize", resize);
    window.removeEventListener("mousemove", onPointerMove);
    document.documentElement.removeEventListener("mouseleave", onPointerLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    reducedQuery.removeEventListener("change", onMotionPrefChange);
    applyThemeRef = null;
  };
});

onUnmounted(() => teardown?.());
</script>

<style scoped>
/* 画布固定视口并留在 Layout 自己的隔离层内，避免负 z-index 穿到 body
   背后后，在滚动或路由切换的合成层重建期间短暂消失。 */
.utv-bg-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  display: block;
  contain: strict;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>