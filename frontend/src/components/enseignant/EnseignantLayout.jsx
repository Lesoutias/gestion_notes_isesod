import { Outlet } from 'react-router-dom'
import { EnseignantSidebar } from './EnseignantSidebar'

export default function EnseignantLayout() {
  return (
    <div className="flex min-h-screen bg-warm-50">
      <EnseignantSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}
