type Props = { index: string; title: string; id: string; aside?: string }

export function SectionHeading({ index, title, id, aside }: Props) {
  return (
    <div className="reveal mb-12 grid grid-cols-[auto_1fr] items-baseline gap-x-6 border-t border-line pt-5 md:mb-16 md:grid-cols-[8rem_1fr_auto]">
      <span className="label text-accent!" aria-hidden="true">
        {index}
      </span>
      <h2 id={id} className="text-3xl font-medium tracking-[-0.03em] text-fg md:text-5xl">
        {title}
      </h2>
      {aside && <p className="label col-span-2 mt-3 md:col-span-1 md:mt-0">{aside}</p>}
    </div>
  )
}
