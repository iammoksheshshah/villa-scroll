'use client';

import gsap from 'gsap';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useSmoothScroll } from './smooth-scroll-provider';
import ThemeToggle from './theme-toggle';

const navItems = [
  { label: 'Collection', id: 'collection' },
  { label: 'Architecture', id: 'architecture' },
  { label: 'Experience', id: 'experience' },
  { label: 'Details', id: 'details' },
  { label: 'Contact', id: 'contact' },
];

const scrollEasing = (t: number) => 1 - Math.pow(1 - t, 4);

export default function SiteHeader() {
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollTo, stop, start } = useSmoothScroll();

  const goTo = (id: string) => {
    const target = id === 'top' ? 0 : `#${id}`;
    scrollTo(target, { duration: 1.4, easing: scrollEasing, lock: true });
  };

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    goTo(id);
  };

  const handleMenuSelect = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    setMenuOpen(false);
    start();
    goTo(id);
  };

  useEffect(() => {
    const backdrop = backdropRef.current;

    const onScroll = () => {
      const next = window.scrollY > 24;
      if (next === scrolledRef.current) return;
      scrolledRef.current = next;
      setScrolled(next);

      if (backdrop) {
        gsap.to(backdrop, {
          opacity: next ? 1 : 0,
          duration: 0.6,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (backdrop) gsap.killTweensOf(backdrop);
    };
  }, []);

  // The menu covers the page, so freeze Lenis while it is open.
  useEffect(() => {
    if (!menuOpen) return;

    stop();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        start();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      start();
    };
  }, [menuOpen, stop, start]);

  return (
    <header
      className="site-header fixed inset-x-0 top-0 z-50"
      data-scrolled={scrolled}
      data-menu-open={menuOpen}
    >
      <div
        aria-hidden="true"
        className={`fixed inset-0 -z-10 bg-base transition-opacity duration-300 sm:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          aria-hidden={!menuOpen}
          className="flex h-full flex-col justify-center gap-1 px-8 pt-16"
        >
          {navItems.map((item, index) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(event) => handleMenuSelect(event, item.id)}
              tabIndex={menuOpen ? undefined : -1}
              className="group flex items-baseline justify-between border-b border-line py-6"
            >
              <span className="text-2xl font-light uppercase tracking-[0.16em] text-ink/80 transition-colors group-hover:text-ink">
                {item.label}
              </span>
              <span className="font-mono text-[10px] text-ink/35">
                {String(index + 1).padStart(2, '0')}
              </span>
            </a>
          ))}
        </nav>
      </div>

      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-transparent transition-opacity duration-500 ${
          scrolled || menuOpen ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <div
        ref={backdropRef}
        className="header-backdrop absolute inset-0 border-b opacity-0 backdrop-blur-xl"
      />
      <div className="relative flex items-center justify-between gap-4 px-5 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10">
        <a
          href="#top"
          aria-label="Villa — home"
          onClick={(event) => {
            if (menuOpen) {
              setMenuOpen(false);
              start();
            }
            handleNavClick(event, 'top');
          }}
          className="header-brand flex shrink-0 items-center gap-3 transition-colors duration-300"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M3 20V4h18v16" stroke="currentColor" strokeWidth="1" />
            <path d="M8 20V9h8v11" stroke="currentColor" strokeWidth="1" />
            <path d="M3 12h18" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
          </svg>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.42em] sm:inline">
            Villa
          </span>
        </a>

        <div className="flex items-center gap-3 sm:gap-6">
          <nav aria-label="Main navigation" className="hidden sm:block">
            <ul className="flex items-center gap-4 sm:gap-6 md:gap-10">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(event) => handleNavClick(event, item.id)}
                    className="header-link text-[9px] font-light uppercase tracking-[0.18em] transition-colors duration-300 sm:text-[10px] sm:tracking-[0.24em]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="theme-toggle flex h-8 w-8 flex-col items-center justify-center gap-1.5 rounded-full border transition-colors duration-300 sm:hidden"
          >
            <span
              className={`h-px w-3.5 bg-current transition-transform duration-300 ${
                menuOpen ? 'translate-y-[3.5px] rotate-45' : ''
              }`}
            />
            <span
              className={`h-px w-3.5 bg-current transition-transform duration-300 ${
                menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
