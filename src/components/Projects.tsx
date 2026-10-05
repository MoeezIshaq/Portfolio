import { projects, type Link } from '../content'
import { SectionHeading } from './SectionHeading'
import { TiltCard } from './TiltCard'

function ProjectLink({ link, project }: { link: Link; project: string }) {
  if (link.todo) {
    // Placeholder links are only visible in dev so they never ship as dead links.
    if (!import.meta.env.DEV) return null
    return (
      <span className="font-mono text-xs text-faint" title="TODO: add URL in content.ts">
        {link.label} <span className="text-accent">[TODO]</span>
      </span>
    )
  }
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className="link-underline font-mono text-xs text-fg"
      aria-label={`${link.label} for ${project} (opens in a new tab)`}
    >
      {link.label} ↗
    </a>
  )
}

export function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-title" className="px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[88rem]">
        <SectionHeading index="02" id="projects-title" title="Projects" aside="Selected" />

        <ul className="grid gap-5 md:ml-[calc(8rem+1.5rem)] lg:grid-cols-3">
          {projects.map((p, i) => (
            <li key={p.title} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
              <TiltCard className="flex h-full flex-col border border-line bg-ink-2/95 p-6 hover:border-line-strong md:p-7">
                <p className="font-mono text-xs tabular-nums text-faint">
                  {String(i + 1).padStart(2, '0')}
                  {p.context && <span className="ml-3 text-muted">{p.context}</span>}
                </p>
                <h3 className="mt-8 text-xl font-medium leading-tight tracking-[-0.02em] text-fg md:text-2xl">
                  {p.title}
                </h3>
                <p className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-fg/75">{p.description}</p>
                <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Tech stack">
                  {p.stack.map((s) => (
                    <li key={s} className="border border-line px-2 py-0.5 font-mono text-[0.68rem] text-muted">
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex gap-5 border-t border-line pt-4">
                  {p.links.map((l) => (
                    <ProjectLink key={l.label} link={l} project={p.title} />
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
