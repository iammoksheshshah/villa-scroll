import type { ReactNode } from "react";

export type HeroProps = {
  className?: string;
  id?: string;
  /** Optional background layer (image, video, canvas) kept behind the chrome. */
  children?: ReactNode;
};

export default function Hero({ className = "", id = "top", children }: HeroProps) {
  return (
    <section
      id={id}
      className={`relative h-svh w-full bg-neutral-950 ${className}`}
    >
      {children && <div className="absolute inset-0">{children}</div>}

      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-10">
        <a
          href="#sequence"
          aria-label="Scroll to the collection"
          className="group flex flex-col items-center gap-4"
        >
          <span className="text-[9px] font-light uppercase tracking-[0.35em] text-white/40 transition-colors duration-300 group-hover:text-white/70">
            Scroll
          </span>
          <span className="relative h-12 w-px bg-white/20">
            <span className="scroll-indicator-dot absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-white" />
          </span>
        </a>
      </div>
    </section>
  );
}
