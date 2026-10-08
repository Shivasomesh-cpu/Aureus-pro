import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLenis } from '../hooks/useLenis';
import { GreekPillarIcon } from './icons';

interface LandingPageProps {
  onLaunchApp: () => void;
  onOpenPlan: () => void;
  onOpenStatementUpload: () => void;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
  gold: boolean;
}

const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.parentElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !section || !context) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let lastTime = 0;
    let isInView = true;
    let particles: Particle[] = [];

    const render = (time: number) => {
      frame = 0;
      const elapsed = lastTime ? Math.min((time - lastTime) / 16.67, 2) : 1;
      lastTime = time;
      context.clearRect(0, 0, width, height);

      for (let particleIndex = 0; particleIndex < particles.length; particleIndex += 1) {
        const particle = particles[particleIndex];
        if (!reduceMotion) {
          particle.x += particle.speedX * elapsed;
          particle.y += particle.speedY * elapsed;
          if (particle.x > width + 8) particle.x = -8;
          if (particle.y > height + 8) particle.y = -8;
          if (particle.y < -8) particle.y = height + 8;
        }

        for (let otherIndex = particleIndex + 1; otherIndex < particles.length; otherIndex += 1) {
          const other = particles[otherIndex];
          const distanceX = particle.x - other.x;
          const distanceY = particle.y - other.y;
          const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
          if (distance < 118) {
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(other.x, other.y);
            context.strokeStyle = 'rgba(202, 167, 99, ' + ((1 - distance / 118) * 0.055) + ')';
            context.lineWidth = 0.7;
            context.stroke();
          }
        }

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = particle.gold
          ? 'rgba(247, 208, 130, ' + particle.opacity + ')'
          : 'rgba(174, 198, 222, ' + (particle.opacity * 0.7) + ')';
        context.fill();
      }

      if (!reduceMotion && !document.hidden && isInView) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const resize = () => {
      width = section.clientWidth;
      height = section.clientHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const count = width < 640 ? 18 : 34;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.7 + Math.random() * 1.2,
        speedX: 0.08 + Math.random() * 0.18,
        speedY: (Math.random() - 0.5) * 0.12,
        opacity: 0.12 + Math.random() * 0.3,
        gold: Math.random() > 0.38,
      }));
      if (reduceMotion) render(0);
      else if (!frame && !document.hidden && isInView) frame = window.requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      } else if (!reduceMotion && isInView && !frame) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const intersectionObserver = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(entries => {
        isInView = entries.some(entry => entry.isIntersecting);
        if (isInView && !reduceMotion && !document.hidden && !frame) {
          frame = window.requestAnimationFrame(render);
        } else if (!isInView) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
      });

    resize();
    intersectionObserver?.observe(section);
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.cancelAnimationFrame(frame);
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="landing-particle-canvas" aria-hidden="true" />;
};

interface CursorEffectProps {
  rootRef: React.RefObject<HTMLDivElement | null>;
}

const CursorEffect: React.FC<CursorEffectProps> = ({ rootRef }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const cursor = cursorRef.current;
    if (!root || !cursor) return;

    const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!supportsFinePointer || prefersReducedMotion) return;

    let pointerX = 0;
    let pointerY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let hasPosition = false;
    let frame = 0;
    let activeTarget: HTMLElement | null = null;
    let cursorEnabled = false;

    const enableCursor = () => {
      if (cursorEnabled) return;
      document.documentElement.classList.add('aureus-cursor-ready');
      cursorEnabled = true;
    };

    const findTarget = (eventTarget: EventTarget | null) => {
      if (!(eventTarget instanceof Element)) return null;
      const target = eventTarget.closest('button, a, [role="button"]');
      return target instanceof HTMLElement && root.contains(target) ? target : null;
    };

    const updateActiveTarget = (target: HTMLElement | null) => {
      if (target === activeTarget) return;
      activeTarget?.style.removeProperty('--cursor-magnet-x');
      activeTarget?.style.removeProperty('--cursor-magnet-y');
      activeTarget = target;
      cursor.dataset.active = target ? 'true' : 'false';
      if (labelRef.current) {
        labelRef.current.textContent = target ? target.dataset.cursorLabel || 'OPEN' : '';
      }
    };

    const animatePosition = () => {
      cursorX += (pointerX - cursorX) * 0.22;
      cursorY += (pointerY - cursorY) * 0.22;
      cursor.style.transform = 'translate3d(' + cursorX + 'px, ' + cursorY + 'px, 0)';

      if (Math.abs(pointerX - cursorX) > 0.35 || Math.abs(pointerY - cursorY) > 0.35) {
        frame = window.requestAnimationFrame(animatePosition);
      } else {
        cursorX = pointerX;
        cursorY = pointerY;
        cursor.style.transform = 'translate3d(' + cursorX + 'px, ' + cursorY + 'px, 0)';
        frame = 0;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!hasPosition) {
        cursorX = pointerX;
        cursorY = pointerY;
        hasPosition = true;
      }

      const target = findTarget(event.target);
      updateActiveTarget(target);
      enableCursor();
      cursor.dataset.visible = 'true';

      if (target?.hasAttribute('data-cursor-magnetic')) {
        const bounds = target.getBoundingClientRect();
        const offsetX = (event.clientX - (bounds.left + bounds.width / 2)) * 0.12;
        const offsetY = (event.clientY - (bounds.top + bounds.height / 2)) * 0.12;
        target.style.setProperty('--cursor-magnet-x', Math.max(-7, Math.min(7, offsetX)) + 'px');
        target.style.setProperty('--cursor-magnet-y', Math.max(-7, Math.min(7, offsetY)) + 'px');
      }

      if (!frame) frame = window.requestAnimationFrame(animatePosition);
    };

    const handlePointerLeave = () => {
      cursor.dataset.visible = 'false';
      cursor.dataset.active = 'false';
      cursor.dataset.pressed = 'false';
      updateActiveTarget(null);
    };

    const handlePointerDown = () => {
      cursor.dataset.pressed = 'true';
    };

    const handlePointerUp = () => {
      cursor.dataset.pressed = 'false';
    };

    root.addEventListener('pointermove', handlePointerMove, { passive: true });
    root.addEventListener('pointerleave', handlePointerLeave);
    root.addEventListener('pointerdown', handlePointerDown);
    root.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.cancelAnimationFrame(frame);
      document.documentElement.classList.remove('aureus-cursor-ready');
      root.removeEventListener('pointermove', handlePointerMove);
      root.removeEventListener('pointerleave', handlePointerLeave);
      root.removeEventListener('pointerdown', handlePointerDown);
      root.removeEventListener('pointerup', handlePointerUp);
      activeTarget?.style.removeProperty('--cursor-magnet-x');
      activeTarget?.style.removeProperty('--cursor-magnet-y');
    };
  }, [rootRef]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div ref={cursorRef} className="aureus-cursor" aria-hidden="true" data-visible="false">
      <span className="aureus-cursor-ring"><span ref={labelRef} className="aureus-cursor-label" /></span>
      <span className="aureus-cursor-dot" />
    </div>,
    document.body,
  );
};

const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onOpenPlan,
  onOpenStatementUpload,
}) => {
  const { scrollTo } = useLenis();
  const landingRootRef = useRef<HTMLDivElement>(null);

  const visitSection = (sectionId: string) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo('#' + sectionId, { offset: -88, immediate: prefersReducedMotion });
  };

  return (
    <div ref={landingRootRef} className="aureus-landing min-h-screen bg-[#f7f6f2] text-slate-900">
      <section id="top" className="landing-hero relative isolate overflow-hidden bg-[#08111f] text-white">
        <ParticleField />
        <div className="landing-hero-glow landing-hero-glow-one" aria-hidden="true" />
        <div className="landing-hero-glow landing-hero-glow-two" aria-hidden="true" />

        <header className="relative z-10">
          <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
            <button
              type="button"
              onClick={() => visitSection('top')}
              data-cursor-label="HOME"
              data-cursor-magnetic
              className="group flex items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              aria-label="Aureus home"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-amber-200/25 bg-gradient-to-br from-amber-300 to-amber-600 shadow-lg shadow-amber-950/30 transition-transform group-hover:-rotate-3">
                <GreekPillarIcon className="h-5 w-5 text-slate-950" />
              </span>
              <span>
                <span className="block font-serif text-lg font-black tracking-[0.12em]">AUREUS</span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-amber-200/70">Your money, in perspective</span>
              </span>
            </button>

            <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex" aria-label="Main navigation">
              <button type="button" onClick={() => visitSection('product')} className="transition-colors hover:text-white">What you can plan</button>
              <button type="button" onClick={() => visitSection('how-it-works')} className="transition-colors hover:text-white">How it works</button>
            </nav>

            <button
              type="button"
              onClick={onLaunchApp}
              data-cursor-label="OPEN"
              data-cursor-magnetic
              className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-xs font-bold text-white transition hover:border-amber-200/50 hover:bg-white/10 sm:px-5 sm:text-sm"
            >
              Open workspace <span aria-hidden="true" className="ml-1 text-amber-300">↗</span>
            </button>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[1.03fr_.97fr] lg:gap-10 lg:px-10 lg:pb-32 lg:pt-24">
          <div className="landing-rise max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-100/15 bg-white/[0.055] px-3.5 py-2 text-[11px] font-semibold tracking-wide text-amber-100/90 shadow-inner shadow-white/[0.03] sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" />
              A thoughtful workspace for your financial life
            </div>

            <h1 className="max-w-2xl font-serif text-[clamp(3rem,5.5vw,5.25rem)] font-medium leading-[0.98] tracking-[-0.05em] text-white">
              A clearer plan for <span className="landing-gold-text italic">the life you want.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Bring your goals, retirement timeline, monthly SIPs, and day-to-day spending into one calm, practical view—built around your numbers, not someone else’s assumptions.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onOpenPlan}
                data-cursor-label="PLAN"
                data-cursor-magnetic
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#e8c68d] px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_8px_28px_rgba(217,160,66,.16)] transition duration-300 hover:bg-[#f0d6a9] hover:shadow-[0_12px_34px_rgba(217,160,66,.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08111f]"
              >
                Start with your goals <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenStatementUpload()}
                data-cursor-label="IMPORT"
                data-cursor-magnetic
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              >
                Import a statement <span aria-hidden="true" className="text-slate-400">↓</span>
              </button>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-medium text-slate-400 sm:text-xs">
              <span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> No bank login required</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> Review imports before saving</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> Your plan, your assumptions</span>
            </div>
          </div>

          <div className="landing-float relative mx-auto w-full max-w-[520px] lg:ml-auto">
            <div className="absolute -inset-8 rounded-[42px] bg-gradient-to-br from-amber-300/[0.12] via-sky-300/[0.05] to-transparent blur-3xl" aria-hidden="true" />
            <div className="relative rounded-[28px] border border-white/10 bg-[#111d2d]/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,.42)] backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/70">Your financial plan</p>
                  <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-white sm:text-[28px]">Built around what matters.</h2>
                </div>
                <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-200">Your workspace</span>
              </div>

              <div className="mt-7 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1523] px-4 pb-2 pt-4 sm:px-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">A timeline you can shape</span>
                  <span className="text-[10px] font-medium text-slate-500">Illustrative preview</span>
                </div>
                <div className="relative mt-4 h-28 overflow-hidden">
                  <div className="absolute inset-x-0 top-4 border-t border-dashed border-white/[0.08]" />
                  <div className="absolute inset-x-0 top-14 border-t border-dashed border-white/[0.08]" />
                  <div className="absolute inset-x-0 bottom-4 border-t border-dashed border-white/[0.08]" />
                  <svg viewBox="0 0 440 112" className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="plan-area" x1="220" y1="20" x2="220" y2="112" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#E9BC70" stopOpacity=".24" />
                        <stop offset="1" stopColor="#E9BC70" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 92C42 90 51 76 88 80C120 83 137 62 170 68C205 74 219 42 254 51C292 61 301 35 334 40C373 46 391 19 440 22V112H0V92Z" fill="url(#plan-area)" />
                    <path d="M0 92C42 90 51 76 88 80C120 83 137 62 170 68C205 74 219 42 254 51C292 61 301 35 334 40C373 46 391 19 440 22" stroke="#E9BC70" strokeWidth="2.25" strokeLinecap="round" />
                    <circle cx="334" cy="40" r="4" fill="#F5D69D" />
                    <circle cx="334" cy="40" r="8" fill="#F5D69D" fillOpacity=".18" />
                  </svg>
                </div>
                <div className="flex justify-between pb-2 text-[9px] font-medium uppercase tracking-wider text-slate-600">
                  <span>Today</span><span>Milestones</span><span>Your horizon</span>
                </div>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5">
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-300/10 text-sm text-violet-200">◎</span>
                  <p className="text-[11px] font-bold text-white">Retirement</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">Choose a date and target</p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5">
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-300/10 text-sm text-emerald-200">↗</span>
                  <p className="text-[11px] font-bold text-white">Monthly SIPs</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">Record contributions</p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5">
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-300/10 text-sm text-amber-200">◇</span>
                  <p className="text-[11px] font-bold text-white">Life goals</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">Keep milestones in view</p>
                </div>
              </div>

              <p className="mt-4 flex items-center gap-2 text-[10px] leading-4 text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" />
                No stock recommendations or live market prices.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-100/20 to-transparent" aria-hidden="true" />
      </section>

      <main id="main-content">
      <section id="product" className="relative scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-6 md:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-amber-700">A more useful money view</p>
              <h2 className="mt-4 max-w-xl font-serif text-4xl font-medium leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">Less financial noise.<br /><span className="text-amber-700">More intentional choices.</span></h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 md:justify-self-end md:text-base">
              Aureus brings everyday cash flow and long-term plans together, without pretending that a chart can predict the market or make decisions for you.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <article className="landing-card group rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,.08)] sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl text-amber-800">◇</span>
              <h3 className="mt-6 font-serif text-2xl font-medium text-slate-950">Plan for your life</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Set a retirement horizon, add meaningful goals, and write down the monthly investments you want to track.</p>
              <button type="button" onClick={onOpenPlan} className="mt-6 text-xs font-bold text-amber-800 transition-colors hover:text-amber-600">Build your plan <span aria-hidden="true">→</span></button>
            </article>

            <article className="landing-card group rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,.08)] sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-700">↗</span>
              <h3 className="mt-6 font-serif text-2xl font-medium text-slate-950">See your cash flow</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Import a statement or add transactions yourself. Review the parsed entries before anything is saved.</p>
              <button type="button" onClick={onOpenStatementUpload} className="mt-6 text-xs font-bold text-amber-800 transition-colors hover:text-amber-600">Import a statement <span aria-hidden="true">→</span></button>
            </article>

            <article className="landing-card group rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,.08)] sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-700">⌁</span>
              <h3 className="mt-6 font-serif text-2xl font-medium text-slate-950">Adjust as life changes</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Keep budgets, recurring costs, and your savings targets together, then revisit the plan when your priorities shift.</p>
              <button type="button" onClick={onLaunchApp} className="mt-6 text-xs font-bold text-amber-800 transition-colors hover:text-amber-600">Explore the workspace <span aria-hidden="true">→</span></button>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-y border-slate-200/70 bg-[#efeee9] px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-amber-700">Start where you are</p>
            <h2 className="mt-4 font-serif text-4xl font-medium leading-tight tracking-tight text-slate-950 sm:text-5xl">A small first step is still a plan.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">No perfect spreadsheet required. Add what you know now; leave the rest open until you’re ready.</p>
            <button type="button" onClick={onOpenPlan} data-cursor-label="PLAN" data-cursor-magnetic className="mt-8 inline-flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              Set up my financial plan <span aria-hidden="true" className="text-amber-300">→</span>
            </button>
          </div>

          <ol className="divide-y divide-slate-300/80">
            <li className="flex gap-5 py-5 first:pt-0">
              <span className="font-serif text-2xl text-amber-700">01</span>
              <div><h3 className="text-sm font-bold text-slate-950">Write down the future you’re working toward</h3><p className="mt-1.5 text-sm leading-6 text-slate-600">Add a retirement target, a goal, or a monthly SIP contribution—one at a time.</p></div>
            </li>
            <li className="flex gap-5 py-5">
              <span className="font-serif text-2xl text-amber-700">02</span>
              <div><h3 className="text-sm font-bold text-slate-950">Bring in the details you already have</h3><p className="mt-1.5 text-sm leading-6 text-slate-600">Use a CSV statement, enter transactions manually, or start with your plan alone.</p></div>
            </li>
            <li className="flex gap-5 py-5 last:pb-0">
              <span className="font-serif text-2xl text-amber-700">03</span>
              <div><h3 className="text-sm font-bold text-slate-950">Revisit it on your terms</h3><p className="mt-1.5 text-sm leading-6 text-slate-600">Update your assumptions as your income, priorities, and plans evolve.</p></div>
            </li>
          </ol>
        </div>
      </section>
      </main>

      <footer className="bg-[#08111f] px-5 py-10 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-300 text-slate-950"><GreekPillarIcon className="h-4 w-4" /></span>
              <span className="font-serif text-sm font-black tracking-[0.14em]">AUREUS</span>
            </div>
            <p className="mt-3 text-xs text-slate-400">A clearer view of your money and the goals behind it.</p>
          </div>
          <p className="max-w-xl text-[10px] leading-5 text-slate-500 sm:text-right">
            Aureus is a personal planning and tracking workspace, not financial or investment advice. It does not provide live stock prices, select securities, or execute trades. Illustrations are not forecasts.
          </p>
        </div>
      </footer>
      <CursorEffect rootRef={landingRootRef} />
    </div>
  );
};

export default LandingPage;
