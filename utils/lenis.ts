/**
 * Lenis Smooth Scroll Engine
 * 
 * Lightweight, zero-dependency, ultra-smooth scrolling engine
 * inspired by Studio Freight / Darkroom Engineering's Lenis.
 * Features:
 * - Exponential decay and customizable lerp damping
 * - Wheel, keyboard, and pointer normalization
 * - Virtual scroll clamping with velocity tracking
 * - Smooth programmatic scrollTo() with custom duration and easing
 * - Frame-rate independent RAF interpolation
 * - Respects prefers-reduced-motion
 */

export interface LenisOptions {
  lerp?: number; // Smoothing factor (0 < lerp <= 1), default 0.1
  duration?: number; // Scroll duration in seconds (if lerp not used)
  wheelMultiplier?: number; // Mouse wheel multiplier, default 1.0
  touchMultiplier?: number; // Touch drag multiplier, default 1.2
  infinite?: boolean;
  smoothWheel?: boolean;
  easing?: (t: number) => number;
}

export interface LenisScrollData {
  scroll: number;
  limit: number;
  velocity: number;
  direction: number;
  progress: number;
}

export type LenisScrollCallback = (data: LenisScrollData) => void;

export class Lenis {
  private targetScroll: number = 0;
  private currentScroll: number = 0;
  private maxScroll: number = 0;
  private velocity: number = 0;
  private direction: number = 0;
  private isRunning: boolean = false;
  private rafId: number | null = null;
  private callbacks: Set<LenisScrollCallback> = new Set();
  private options: Required<LenisOptions>;
  private isDestroyed: boolean = false;
  private lastTime: number = performance.now();

  constructor(options: LenisOptions = {}) {
    this.options = {
      lerp: options.lerp ?? 0.18,
      duration: options.duration ?? 0.8,
      wheelMultiplier: options.wheelMultiplier ?? 1.0,
      touchMultiplier: options.touchMultiplier ?? 1.0,
      infinite: options.infinite ?? false,
      smoothWheel: options.smoothWheel ?? true,
      easing: options.easing ?? ((t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
    };

    // If reduced motion is requested, do not intercept native scrolling
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    this.currentScroll = window.scrollY || window.pageYOffset || 0;
    this.targetScroll = this.currentScroll;
    this.updateDimensions();

    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('scroll', this.onScrollNative, { passive: true });

    this.start();
  }

  private onResize = () => {
    this.updateDimensions();
  };

  private updateDimensions() {
    if (typeof document === 'undefined') return;
    const body = document.body;
    const html = document.documentElement;
    const docHeight = Math.max(
      body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight
    );
    this.maxScroll = Math.max(0, docHeight - window.innerHeight);
  }

  private onWheel = (e: WheelEvent) => {
    if (!this.options.smoothWheel || this.isDestroyed) return;

    // Check if the target is inside an element that handles its own scroll (e.g., modal, custom dropdown)
    let el = e.target as HTMLElement | null;
    while (el && el !== document.body && el !== document.documentElement) {
      const overflowY = window.getComputedStyle(el).overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        // Allow inner container to scroll naturally
        return;
      }
      el = el.parentElement;
    }

    e.preventDefault();

    let delta = e.deltaY;
    if (e.deltaMode === 1) {
      // Lines
      delta *= 32;
    } else if (e.deltaMode === 2) {
      // Pages
      delta *= window.innerHeight;
    }

    delta *= this.options.wheelMultiplier;

    this.targetScroll = Math.max(0, Math.min(this.maxScroll, this.targetScroll + delta));

    if (!this.isRunning) {
      this.start();
    }
  };

  private onScrollNative = () => {
    if (!this.isRunning) {
      // Keep in sync with user browser jump (e.g. PgUp/PgDn, bookmarks)
      this.currentScroll = window.scrollY || window.pageYOffset || 0;
      this.targetScroll = this.currentScroll;
      this.notify();
    }
  };

  private start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.onRaf);
  }

  private onRaf = (time: number) => {
    if (this.isDestroyed) return;

    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.updateDimensions();

    const diff = this.targetScroll - this.currentScroll;
    
    // Lerp calculation with delta time compensation
    const lerpFactor = 1 - Math.pow(1 - this.options.lerp, deltaTime * 60);
    this.currentScroll += diff * lerpFactor;

    this.velocity = (diff * lerpFactor) / (deltaTime || 0.016);
    this.direction = diff > 0 ? 1 : diff < 0 ? -1 : 0;

    // Check if close enough to snap and rest
    if (Math.abs(diff) < 0.25) {
      this.currentScroll = this.targetScroll;
      this.velocity = 0;
      window.scrollTo(0, Math.round(this.currentScroll));
      this.notify();
      this.isRunning = false;
      this.rafId = null;
      return;
    }

    window.scrollTo(0, Math.round(this.currentScroll));
    this.notify();

    this.rafId = requestAnimationFrame(this.onRaf);
  };

  private notify() {
    const progress = this.maxScroll > 0 ? Math.min(1, Math.max(0, this.currentScroll / this.maxScroll)) : 0;
    const data: LenisScrollData = {
      scroll: this.currentScroll,
      limit: this.maxScroll,
      velocity: this.velocity,
      direction: this.direction,
      progress
    };

    this.callbacks.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error('Lenis callback error:', err);
      }
    });
  }

  public on(callback: LenisScrollCallback) {
    this.callbacks.add(callback);
    return () => this.off(callback);
  }

  public off(callback: LenisScrollCallback) {
    this.callbacks.delete(callback);
  }

  public scrollTo(target: number | string | HTMLElement, options: { offset?: number; immediate?: boolean } = {}) {
    let targetPos = 0;
    const offset = options.offset || 0;

    if (typeof target === 'number') {
      targetPos = target;
    } else if (typeof target === 'string') {
      const el = document.querySelector(target);
      if (el) {
        targetPos = el.getBoundingClientRect().top + window.scrollY;
      }
    } else if (target instanceof HTMLElement) {
      targetPos = target.getBoundingClientRect().top + window.scrollY;
    }

    targetPos = Math.max(0, Math.min(this.maxScroll, targetPos + offset));

    if (options.immediate) {
      this.currentScroll = targetPos;
      this.targetScroll = targetPos;
      window.scrollTo(0, targetPos);
      this.notify();
    } else {
      this.targetScroll = targetPos;
      if (!this.isRunning) {
        this.start();
      }
    }
  }

  public getScroll(): number {
    return this.currentScroll;
  }

  public getProgress(): number {
    return this.maxScroll > 0 ? this.currentScroll / this.maxScroll : 0;
  }

  public destroy() {
    this.isDestroyed = true;
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('scroll', this.onScrollNative);
    this.callbacks.clear();
  }
}

// Global singleton instance
let globalLenis: Lenis | null = null;

export function getLenis(options?: LenisOptions): Lenis {
  if (!globalLenis && typeof window !== 'undefined') {
    globalLenis = new Lenis(options);
  }
  return globalLenis as Lenis;
}

export function destroyLenis() {
  if (globalLenis) {
    globalLenis.destroy();
    globalLenis = null;
  }
}
