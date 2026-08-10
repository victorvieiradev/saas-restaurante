import React from 'react'
import { useAuth } from '../context/AuthContext'
import AdminLogin from '../pages/AdminLogin'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-sm font-medium">Verificando autenticação...</span>
      </div>
    )
  }

  if (!user) {
    return <AdminLogin />
  }

  return children
}
