import { contact, portrait, site } from '../content'
import { SectionHeading } from './SectionHeading'

export function Contact() {
  const links = [
    { name: 'LinkedIn', ...contact.linkedin },
    { name: 'GitHub', ...contact.github },
  ]
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="flex min-h-[85svh] flex-col px-5 pb-10 pt-28 md:px-10 md:pb-16 md:pt-40"
    >
      <div className="mx-auto flex w-full max-w-[88rem] flex-1 flex-col">
        <SectionHeading index="05" id="contact-title" title="Contact" />

        <div className="md:ml-[calc(8rem+1.5rem)]">
          <div className="reveal flex items-center gap-4">
            <img
              src={portrait.src}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className="h-14 w-14 shrink-0 rounded-full object-cover object-[50%_30%] ring-1 ring-line-strong"
            />
            <p className="max-w-xl text-lg leading-relaxed text-muted">
              Open to conversations about software, data, and AI/ML engineering roles.
            </p>
          </div>
          <a
            href={`mailto:${contact.email}`}
            className="reveal mt-8 inline-block break-all text-[clamp(1.6rem,5.2vw,4.5rem)] font-medium leading-none tracking-[-0.04em] text-fg decoration-accent decoration-2 underline-offset-[0.18em] transition-colors hover:text-accent hover:underline focus-visible:underline"
          >
            {contact.email}
          </a>

          <div className="reveal mt-14 flex flex-col gap-8 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <ul className="flex flex-col gap-3 sm:flex-row sm:gap-10">
              {links.map((l) => (
                <li key={l.name}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-baseline gap-3 text-sm"
                    aria-label={`${l.name}: ${l.label} (opens in a new tab)`}
                  >
                    <span className="label">{l.name}</span>
                    <span className="link-underline text-fg">{l.label} ↗</span>
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={contact.resume.href}
              download={contact.resume.filename}
              className="inline-flex items-center justify-center gap-3 self-start bg-accent px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-fg sm:self-auto"
            >
              {contact.resume.label}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <footer className="mt-auto flex md:pr-0 md:pb-6 flex-col gap-2 pt-24 font-mono text-[0.7rem] text-faint sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <a href="#top" className="link-underline self-start hover:text-fg">
            Back to top ↑
          </a>
        </footer>
      </div>
    </section>
  )
}
