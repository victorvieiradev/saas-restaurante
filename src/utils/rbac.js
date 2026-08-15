/**
 * Utilitários de Controle de Acesso Baseado em Papéis (RBAC)
 */

export const ROLES = {
  GESTOR: 'GESTOR',
  COZINHA: 'COZINHA',
  CAIXA: 'CAIXA'
}

/**
 * Normaliza o papel do usuário para maiúsculas e sem espaços extras
 * @param {string} role 
 * @returns {string|null}
 */
export function normalizeRole(role) {
  if (!role) return null
  return String(role).trim().toUpperCase()
}

/**
 * Retorna o caminho de rota padrão para cada papel/perfil autorizado.
 * Para papéis não mapeados ou inválidos, retorna a rota pública '/' para prevenir loops de redirecionamento.
 * @param {string} role - 'GESTOR' | 'COZINHA' | 'CAIXA'
 * @returns {string} Rota de destino seguro
 */
export function getDefaultPathForRole(role) {
  const norm = normalizeRole(role)
  switch (norm) {
    case ROLES.COZINHA:
      return '/cozinha'
    case ROLES.CAIXA:
      return '/caixa'
    case ROLES.GESTOR:
      return '/admin'
    default:
      return '/'
  }
}

/**
 * Verifica se um determinado papel tem permissão para acessar a rota
 * @param {string} role - Papel do usuário logado
 * @param {string[]} allowedRoles - Lista de papéis autorizados
 * @returns {boolean}
 */
export function isRoleAllowed(role, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true
  const norm = normalizeRole(role)
  if (!norm) return false
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r))
  return normalizedAllowed.includes(norm)
}

/**
 * Retorna metadados visuais do perfil (nome amigável, ícone, cor, badge)
 * @param {string} role 
 */
export function getRoleBadgeInfo(role) {
  const norm = normalizeRole(role)
  switch (norm) {
    case ROLES.GESTOR:
      return {
        label: 'Gestor',
        tag: '👑 Gestor',
        badgeClass: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
        color: 'blue'
      }
    case ROLES.COZINHA:
      return {
        label: 'Cozinha',
        tag: '👨‍🍳 Cozinha',
        badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        color: 'amber'
      }
    case ROLES.CAIXA:
      return {
        label: 'Caixa',
        tag: '💰 Caixa',
        badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        color: 'emerald'
      }
    default:
      return {
        label: norm || 'Operador',
        tag: norm || 'Operador',
        badgeClass: 'bg-slate-800 border-slate-700 text-slate-300',
        color: 'slate'
      }
  }
}
