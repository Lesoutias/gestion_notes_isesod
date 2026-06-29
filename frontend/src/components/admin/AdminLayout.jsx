import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-warm-50">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}
