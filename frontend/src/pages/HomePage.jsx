import { useAppSelector } from '../store/hooks'

export default function HomePage() {
  const title = useAppSelector((state) => state.app.title)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      <p className="mt-3 text-slate-600">
        Application de gestion des notes universitaires. Le frontend React est prêt
        avec Vite, Tailwind CSS, Redux Toolkit et React Router.
      </p>
    </section>
  )
}
