import { Outlet } from 'react-router-dom'
import { EtudiantSidebar } from './EtudiantSidebar'

export default function EtudiantLayout() {
  return (
    <div className="min-h-screen bg-warm-50 pl-64">
      <EtudiantSidebar />
      <div className="flex min-w-0 flex-col">
        <Outlet />
      </div>
    </div>
  )
}
