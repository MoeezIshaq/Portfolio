import { experience } from '../content'
import { setHighlight } from '../store'
import { SectionHeading } from './SectionHeading'
import { TiltCard } from './TiltCard'

export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[88rem]">
        <SectionHeading index="01" id="experience-title" title="Experience" aside={`${experience.length} roles`} />

        <ol className="space-y-5 md:ml-[calc(8rem+1.5rem)] md:max-w-[42rem]">
          {experience.map((role, i) => (
            <li key={`${role.company}-${role.start}`} className="reveal">
              <TiltCard
                className="group border border-line bg-ink-2/95 p-6 hover:border-line-strong md:p-8"
                onActive={(on) => setHighlight('activeRole', on ? i : -1)}
              >
                <header className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between md:gap-6">
                  <h3 className="text-lg font-medium leading-snug tracking-[-0.015em] text-fg md:text-xl">
                    {role.title}
                  </h3>
                  <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    <time>{role.start}</time> — <time>{role.end}</time>
                  </p>
                </header>
                <p className="mt-1.5 text-sm text-muted">
                  <span className="text-fg/90">{role.company}</span>
                  <span className="mx-2 text-faint">/</span>
                  {role.location}
                </p>

                <ul className="mt-6 space-y-3">
                  {role.highlights.map((h) => (
                    <li key={h} className="grid grid-cols-[1rem_1fr] text-[0.95rem] leading-relaxed text-fg/80">
                      <span aria-hidden="true" className="mt-[0.72em] h-[2px] w-2 bg-accent" />
                      {h}
                    </li>
                  ))}
                </ul>

                <p className="mt-6 border-t border-line pt-4 font-mono text-[0.7rem] leading-relaxed text-faint">
                  <span className="sr-only">Stack: </span>
                  {role.stack.join('  ·  ')}
                </p>
              </TiltCard>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
