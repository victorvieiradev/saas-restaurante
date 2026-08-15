import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminLogin from '../pages/AdminLogin'
import { getDefaultPathForRole, isRoleAllowed, normalizeRole } from '../utils/rbac'
import { Loader2 } from 'lucide-react'

/**
 * Componente de Guarda de Rota com Suporte a RBAC (Role-Based Access Control)
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo da rota protegida
 * @param {string[]} [props.allowedRoles] - Lista opcional de papéis autorizados (ex: ['GESTOR'], ['GESTOR', 'COZINHA'])
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-sm font-medium">Verificando permissões de acesso...</span>
      </div>
    )
  }

  // Se não estiver autenticado, exibe tela de login unificada
  if (!user) {
    return <AdminLogin />
  }

  // Validação Estrita de Permissão RBAC (AC1 & AC3)
  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = normalizeRole(role)
    const hasPermission = isRoleAllowed(currentRole, allowedRoles)

    if (!hasPermission) {
      const defaultDest = getDefaultPathForRole(currentRole)
      // Previne loop de redirecionamento caso o destino seja idêntico à rota atual
      const safePath = (defaultDest === location.pathname || !defaultDest) ? '/' : defaultDest

      console.warn(`[RBAC Block] Acesso negado à rota ${location.pathname} para o papel '${currentRole || 'N/A'}'. Redirecionando para ${safePath}.`)

      return (
        <Navigate
          to={safePath}
          replace
          state={{
            unauthorizedAlert: true,
            attemptedPath: location.pathname,
            userRole: currentRole || 'Não Definido',
            allowedRoles: allowedRoles
          }}
        />
      )
    }
  }

  return children
}
