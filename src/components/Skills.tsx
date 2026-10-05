import { skills } from '../content'
import { setHighlight } from '../store'
import { SectionHeading } from './SectionHeading'

export function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title" className="px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[88rem]">
        <SectionHeading index="03" id="skills-title" title="Skills" aside={`${skills.length} groups`} />

        <dl className="md:ml-[calc(8rem+1.5rem)] md:max-w-2xl">
          {skills.map((g, i) => (
            <div
              key={g.name}
              className="reveal group grid gap-2 border-b border-line py-6 first:border-t md:grid-cols-[13rem_1fr] md:gap-6"
              onPointerEnter={() => setHighlight('activeSkill', i)}
              onPointerLeave={() => setHighlight('activeSkill', -1)}
            >
              <dt className="flex items-baseline gap-3">
                <span className="font-mono text-xs tabular-nums text-faint transition-colors group-hover:text-accent">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-medium text-fg">{g.name}</span>
              </dt>
              <dd className="text-[0.95rem] leading-relaxed text-muted">
                <ul className="flex flex-wrap gap-x-1">
                  {g.items.map((item, k) => (
                    <li key={item}>
                      <span className="transition-colors group-hover:text-fg">{item}</span>
                      {k < g.items.length - 1 && (
                        <span aria-hidden="true" className="text-faint">
                          ,
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
