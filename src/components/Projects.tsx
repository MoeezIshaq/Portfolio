import { projects } from '../content'
import { SectionHeading } from './SectionHeading'
import { TiltCard } from './TiltCard'

export function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-title" className="px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[88rem]">
        <SectionHeading index="02" id="projects-title" title="Projects" aside={`${projects.length} selected`} />

        <ul className="grid gap-5 md:ml-[calc(8rem+1.5rem)] md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => (
            <li key={p.title} className="reveal" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
              <TiltCard className="flex h-full flex-col border border-line bg-ink-2/95 p-6 hover:border-line-strong md:p-7">
                <h3 className="text-xl font-medium leading-tight tracking-[-0.02em] text-fg md:text-2xl">{p.title}</h3>

                {p.event && (
                  <p className="mt-4 inline-flex items-start gap-2.5 self-start border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[0.68rem] text-fg">
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 h-3 w-3 shrink-0 text-accent" fill="currentColor">
                      <path d="M4 1h8v2h3v2.5A3.5 3.5 0 0 1 11.7 9 4 4 0 0 1 9 11.9V13h2.5v2h-7v-2H7v-1.1A4 4 0 0 1 4.3 9 3.5 3.5 0 0 1 1 5.5V3h3V1Zm0 4H3v.5c0 .7.4 1.3 1 1.6V5Zm8 0v2.1c.6-.3 1-.9 1-1.6V5h-1Z" />
                    </svg>
                    <span className="leading-snug">
                      Built at {p.event.name}
                      <span className="block text-muted">{p.event.host}</span>
                    </span>
                  </p>
                )}

                <p className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-fg/75">{p.description}</p>
                <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Tech stack">
                  {p.stack.map((s) => (
                    <li key={s} className="border border-line px-2 py-0.5 font-mono text-[0.68rem] text-muted">
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-line pt-4">
                  {p.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-2 font-mono text-xs text-fg"
                      aria-label={`${p.title} on ${l.label} (opens in a new tab)`}
                    >
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                      </svg>
                      <span className="link-underline">View on {l.label}</span>
                      <span aria-hidden="true" className="text-muted transition-transform group-hover:translate-x-0.5">↗</span>
                    </a>
                  ))}
                </div>
              </TiltCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
