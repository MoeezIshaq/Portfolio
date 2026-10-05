import { contact, site } from '../content'

function SplitWord({ word, offset }: { word: string; offset: number }) {
  return (
    <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em]" aria-hidden="true">
      {Array.from(word).map((ch, i) => (
        <span key={i} className="char" style={{ '--i': offset + i } as React.CSSProperties}>
          {ch}
        </span>
      ))}
    </span>
  )
}

export function Hero() {
  const [first, ...rest] = site.name.split(' ')
  const last = rest.join(' ')
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col justify-end px-5 pb-12 pt-28 md:px-10 md:pb-24"
    >
      <div className="mx-auto w-full max-w-[88rem]">
        <p className="intro-fade mb-6 flex items-center gap-2.5 font-mono text-xs text-muted md:mb-8" style={{ '--d': '700ms' } as React.CSSProperties}>
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          Currently — {site.status}
        </p>

        <h1
          id="hero-title"
          aria-label={site.name}
          className="text-[clamp(4.25rem,14.5vw,15rem)] font-medium leading-[0.8] tracking-[-0.065em] text-fg"
        >
          <SplitWord word={first} offset={0} />
          <span className="block md:pl-[0.9em]">
            <SplitWord word={last} offset={first.length} />
          </span>
        </h1>

        <div className="mt-10 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-6">
          <p
            className="intro-fade text-xl leading-snug tracking-[-0.015em] text-fg md:col-span-5 md:text-2xl"
            style={{ '--d': '900ms' } as React.CSSProperties}
          >
            {site.tagline}
          </p>
          <div
            className="intro-fade space-y-4 text-[0.98rem] leading-relaxed text-muted md:col-span-4 md:col-start-7"
            style={{ '--d': '1000ms' } as React.CSSProperties}
          >
            {site.bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <ul
            className="intro-fade flex flex-row flex-wrap gap-x-6 gap-y-2 text-sm md:col-span-2 md:col-start-11 md:flex-col md:items-end"
            style={{ '--d': '1100ms' } as React.CSSProperties}
          >
            <li>
              <a href="#experience" className="link-underline text-fg">
                Selected work ↓
              </a>
            </li>
            <li>
              <a href={contact.resume.href} download className="link-underline text-muted hover:text-fg">
                Résumé (PDF)
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="link-underline text-muted hover:text-fg">
                Email
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-14 flex items-center justify-between border-t border-line pt-4 md:hidden" aria-hidden="true">
          <span className="label">{site.location}</span>
          <span className="label">Scroll</span>
        </div>
      </div>
    </section>
  )
}
