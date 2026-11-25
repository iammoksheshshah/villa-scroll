import Image from "next/image";
import ContactSection from "./components/contact-section";
import DetailImmersive from "./components/detail-immersive";
import ExperienceGallery from "./components/experience-gallery";
import ScrollAnimator from "./components/scroll-animator";
import ScrollExperience from "./components/scroll-experience";
import TiltCard from "./components/tilt-card";

const residences = [
  {
    no: "01",
    name: "The Courtyard House",
    detail: "Four bedrooms · 620 m²",
    image: "/images/villa-courtyard.jpg",
    note: "Arranged around a single olive tree and a still basin of water.",
  },
  {
    no: "02",
    name: "The Garden Pavilion",
    detail: "Three bedrooms · 480 m²",
    image: "/images/villa-garden.jpg",
    note: "Terraces dissolving into a long reflecting pool and cypress grove.",
  },
  {
    no: "03",
    name: "The Hillside Villa",
    detail: "Five bedrooms · 810 m²",
    image: "/images/villa-hillside.jpg",
    note: "An infinity edge that gives the house back to the valley below.",
  },
];

const principles = [
  {
    no: "01",
    title: "Material",
    image: "/images/detail-material.jpg",
    body: "Honed stone, warm oak, and bronze chosen for the way they age, not the way they photograph.",
  },
  {
    no: "02",
    title: "Light",
    image: "/images/detail-light.jpg",
    body: "Deep overhangs and narrow reveals draw the sun slowly through the house across the day.",
  },
  {
    no: "03",
    title: "Threshold",
    image: "/images/detail-threshold.jpg",
    body: "Rooms unfold one into the next, each opening a longer view toward the landscape.",
  },
];

const marqueeWords = ["Light", "Stone", "Silence", "Landscape", "Time"];

function SectionEyebrow({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[10px] tracking-[0.24em] text-ink/35">{index}</span>
      <span className="h-px w-8 bg-ink/25" />
      <span className="text-[10px] font-light uppercase tracking-[0.34em] text-ink/45">
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <ScrollExperience />

      <section
        id="collection"
        className="ambient-glow relative border-t border-line bg-base px-5 py-24 sm:px-8 md:px-16 md:py-40"
      >
        <div className="mx-auto max-w-6xl">
          <div
            className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between"
            data-animate="rise"
          >
            <div>
              <SectionEyebrow index="01" label="Collection" />
              <h2 className="mt-8 max-w-3xl font-display text-[clamp(2.5rem,6vw,5.25rem)] font-light leading-[0.95] tracking-[-0.015em] text-ink">
                A small collection of{" "}
                <span className="italic text-ink/55">considered</span> residences.
              </h2>
            </div>
            <div className="flex max-w-xs shrink-0 flex-col gap-6 md:items-end md:text-right">
              <p className="text-xs font-light leading-relaxed text-ink/50">
                Three houses, each drawn for a particular site, a particular light, and a
                particular way of living.
              </p>
              <div className="flex items-center gap-3">
                <span className="font-display text-5xl leading-none text-ink/20">03</span>
                <span className="text-[9px] uppercase tracking-[0.28em] text-ink/35">
                  Residences
                </span>
              </div>
            </div>
          </div>

          <div className="depth-stage mt-14 grid gap-6 sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
            {residences.map((residence, index) => (
              <div
                key={residence.no}
                data-animate="card"
                data-delay={index * 0.09}
                className="h-full"
              >
                <TiltCard className="h-full">
                  <article className="group relative h-full overflow-hidden rounded-2xl border border-line bg-ink/[0.03] transition-colors duration-500 hover:border-ink/25">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <div data-parallax className="absolute inset-0">
                        <Image
                          src={residence.image}
                          alt={residence.name}
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
                      <div className="tilt-glare pointer-events-none absolute inset-0" />

                      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
                        <span className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 font-mono text-[9px] tracking-[0.2em] text-white/85 backdrop-blur-md">
                          {residence.no}
                        </span>
                        <span className="text-[9px] uppercase tracking-[0.28em] text-white/45">
                          Residence
                        </span>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                        <h3 className="font-display text-[1.7rem] font-normal leading-none text-white md:text-[1.9rem]">
                          {residence.name}
                        </h3>
                        <p className="mt-3 text-[11px] font-light leading-relaxed text-white/60">
                          {residence.note}
                        </p>
                        <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/15 pt-3">
                          <span className="text-[9px] uppercase tracking-[0.24em] text-white/50">
                            {residence.detail}
                          </span>
                          <span
                            aria-hidden="true"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70 transition-all duration-500 group-hover:border-white/40 group-hover:bg-white/10 group-hover:text-white"
                          >
                            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                              <path
                                d="M3 13 13 3M5 3h8v8"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </TiltCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="architecture"
        className="ambient-glow relative border-t border-line bg-base px-5 py-24 sm:px-8 md:px-16 md:py-40"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-14 md:grid-cols-[0.85fr_1.15fr] md:gap-20">
            <div className="md:sticky md:top-32 md:self-start">
              <SectionEyebrow index="02" label="Architecture" />
              <h2
                data-animate="rise"
                className="mt-8 font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-light leading-[0.95] tracking-[-0.015em] text-ink"
              >
                Nothing added.
                <br />
                <span className="italic text-ink/55">Nothing taken away.</span>
              </h2>
              <p
                data-animate="fade"
                data-delay={0.1}
                className="mt-8 max-w-sm text-xs font-light leading-relaxed text-ink/50"
              >
                Three principles govern every house we draw. They are simple to state and
                slow to get right.
              </p>

              <div className="mt-12 grid max-w-sm grid-cols-3 gap-4 border-t border-line pt-6">
                {["Survey", "Draw", "Build"].map((step, index) => (
                  <div key={step}>
                    <span className="font-mono text-[9px] tracking-[0.2em] text-ink/30">
                      0{index + 1}
                    </span>
                    <p className="mt-2 text-[9px] uppercase tracking-[0.24em] text-ink/55">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="depth-stage space-y-5 md:space-y-6">
              {principles.map((principle, index) => (
                <article
                  key={principle.no}
                  data-animate="depth"
                  data-delay={index * 0.05}
                  className="group grid overflow-hidden rounded-2xl border border-line bg-ink/[0.025] transition-colors duration-500 hover:border-ink/25 sm:grid-cols-[0.9fr_1.1fr]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden sm:aspect-auto sm:min-h-[15rem]">
                    <div data-parallax="5" className="absolute inset-0">
                      <Image
                        src={principle.image}
                        alt={principle.title}
                        fill
                        sizes="(min-width: 768px) 26vw, 92vw"
                        className="object-cover grayscale transition-[filter] duration-700 ease-out group-hover:grayscale-0"
                      />
                    </div>
                    <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-white/80 backdrop-blur-md">
                      {principle.no}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center p-6 md:p-9">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-ink/35">
                      Principle
                    </span>
                    <h3 className="mt-4 font-display text-3xl font-normal leading-none text-ink/90">
                      {principle.title}
                    </h3>
                    <p className="mt-4 max-w-xs text-xs font-light leading-relaxed text-ink/50">
                      {principle.body}
                    </p>
                    <span
                      aria-hidden="true"
                      className="mt-7 h-px w-10 bg-ink/25 transition-all duration-500 group-hover:w-20 group-hover:bg-ink/50"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ExperienceGallery />

      <DetailImmersive />

      <div
        aria-hidden="true"
        className="marquee-mask relative overflow-hidden border-t border-line bg-base py-10 md:py-14"
      >
        <div className="marquee-track flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {marqueeWords.map((word) => (
                <span key={`${copy}-${word}`} className="flex items-center gap-8 pr-8 md:gap-12 md:pr-12">
                  <span className="font-display text-4xl font-light tracking-[-0.01em] text-ink/15 md:text-6xl">
                    {word}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-ink/20" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <ContactSection />
      <ScrollAnimator />
    </main>
  );
}
