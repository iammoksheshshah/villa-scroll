'use client';

type Theme = 'dark' | 'light';

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
};

/**
 * Stateless on purpose: the sun/moon swap is done in CSS from `data-theme` on
 * <html>, so the server and client markup always match and no effect is needed
 * to sync React with the pre-paint theme script.
 */
export default function ThemeToggle() {
  const toggle = () => {
    const current = document.documentElement.dataset.theme;
    const next: Theme = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Private browsing can block storage; the choice just won't persist.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light or dark theme"
      title="Toggle light or dark theme"
      className="theme-toggle flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 hover:opacity-80"
    >
      <svg viewBox="0 0 24 24" className="theme-icon-dark h-4 w-4" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <svg viewBox="0 0 24 24" className="theme-icon-light h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.6 6.6 0 0 0 10.5 10.5Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
