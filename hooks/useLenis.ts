import { useEffect, useState } from 'react';
import { getLenis, Lenis, LenisScrollData } from '../utils/lenis';

/**
 * React hook to access Lenis smooth scroll instance and real-time scroll progress/velocity
 */
export function useLenis(enabled: boolean = true) {
  const [scrollData, setScrollData] = useState<LenisScrollData>({
    scroll: 0,
    limit: 0,
    velocity: 0,
    direction: 0,
    progress: 0,
  });

  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const lenis = getLenis({ lerp: 0.1 });
    setLenisInstance(lenis);

    const unsubscribe = lenis.on((data) => {
      setScrollData(data);
    });

    return () => {
      unsubscribe();
    };
  }, [enabled]);

  const scrollTo = (target: number | string | HTMLElement, options?: { offset?: number; immediate?: boolean }) => {
    if (lenisInstance) {
      lenisInstance.scrollTo(target, options);
    } else if (typeof window !== 'undefined') {
      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: options?.immediate ? 'auto' : 'smooth' });
      } else if (typeof target === 'string') {
        document.querySelector(target)?.scrollIntoView({ behavior: options?.immediate ? 'auto' : 'smooth' });
      } else if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: options?.immediate ? 'auto' : 'smooth' });
      }
    }
  };

  return {
    lenis: lenisInstance,
    scroll: scrollData.scroll,
    progress: scrollData.progress,
    velocity: scrollData.velocity,
    direction: scrollData.direction,
    scrollTo,
  };
}
