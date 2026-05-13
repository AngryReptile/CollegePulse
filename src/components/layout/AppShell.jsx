import Sidebar from './Sidebar'
import FloatingDock from './FloatingDock'
import { Toaster } from 'react-hot-toast'

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="page-shell">
        {children}
      </main>
      <FloatingDock />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(13,13,31,0.95)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
        }}
      />
    </div>
  )
}
