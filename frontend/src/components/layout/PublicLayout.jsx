import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { PortalBackground } from '../ui/PortalBackground'
import { PublicHeaderWithDrawer } from './PublicHeader'
import { PublicFooter } from './PublicFooter'

export default function PublicLayout() {
  const location = useLocation()

  return (
    <div className="relative flex min-h-dvh flex-col">
      <PortalBackground />
      <PublicHeaderWithDrawer />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pt-24 pb-12 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <PublicFooter />
    </div>
  )
}
