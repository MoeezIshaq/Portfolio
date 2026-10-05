import { education } from '../content'
import { SectionHeading } from './SectionHeading'

export function Education() {
  return (
    <section id="education" aria-labelledby="education-title" className="px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[88rem]">
        <SectionHeading index="04" id="education-title" title="Education" />

        <div className="md:ml-[calc(8rem+1.5rem)] md:max-w-2xl">
          <div className="reveal">
            <p className="font-mono text-xs tabular-nums text-muted">
              <time>{education.start}</time> — <time>{education.end}</time>
            </p>
            <h3 className="mt-4 text-2xl font-medium leading-tight tracking-[-0.025em] text-fg md:text-4xl">
              {education.degree}
            </h3>
            <p className="mt-2 text-muted">
              {education.program}
              <span className="mx-2 text-faint">/</span>
              {education.school}, {education.location}
            </p>
          </div>

          <dl className="reveal mt-12 grid grid-cols-2 border-t border-line">
            {education.highlights.map((h) => {
              const [value, ...rest] = h.split(' ')
              const isGpa = value === 'GPA'
              return (
                <div key={h} className="border-b border-line py-5 pr-4 odd:border-r odd:pr-6 even:pl-6">
                  <dt className="label">{isGpa ? 'GPA' : 'Recognition'}</dt>
                  <dd className="mt-2 text-xl tracking-tight text-fg tabular-nums">{isGpa ? rest.join(' ') : h}</dd>
                </div>
              )
            })}
          </dl>

          <div className="reveal mt-12">
            <h4 className="label">Certifications</h4>
            <ul className="mt-4 space-y-2.5">
              {education.certifications.map((c) => (
                <li key={c} className="grid grid-cols-[1rem_1fr] text-[0.95rem] text-fg/80">
                  <span aria-hidden="true" className="mt-[0.72em] h-[2px] w-2 bg-accent" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
