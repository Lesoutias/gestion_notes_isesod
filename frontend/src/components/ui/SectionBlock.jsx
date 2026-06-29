export function SectionBlock({ title, children }) {
  return (
    <section className="space-y-4">
      {title && (
        <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      )}
      <div className="space-y-3 text-ink-500 leading-relaxed">{children}</div>
    </section>
  )
}

export function BulletList({ items }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-brand-400">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}
