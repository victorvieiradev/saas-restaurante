import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { ROLES, getDefaultPathForRole, isRoleAllowed, getRoleBadgeInfo, normalizeRole } from '../src/utils/rbac.js'

describe('RBAC & Intelligent Routing Unit Tests', () => {
  describe('normalizeRole & Case Insensitivity', () => {
    test('Normaliza papéis para maiúsculas', () => {
      assert.equal(normalizeRole('gestor'), 'GESTOR')
      assert.equal(normalizeRole(' Cozinha '), 'COZINHA')
      assert.equal(normalizeRole('CAIXA'), 'CAIXA')
      assert.equal(normalizeRole(null), null)
      assert.equal(normalizeRole(undefined), null)
      assert.equal(normalizeRole(''), null)
    })
  })

  describe('getDefaultPathForRole', () => {
    test('GESTOR deve ser redirecionado para /admin', () => {
      assert.equal(getDefaultPathForRole(ROLES.GESTOR), '/admin')
      assert.equal(getDefaultPathForRole('gestor'), '/admin')
    })

    test('COZINHA deve ser redirecionada para /cozinha', () => {
      assert.equal(getDefaultPathForRole(ROLES.COZINHA), '/cozinha')
      assert.equal(getDefaultPathForRole('cozinha'), '/cozinha')
    })

    test('CAIXA deve ser redirecionado para /caixa', () => {
      assert.equal(getDefaultPathForRole(ROLES.CAIXA), '/caixa')
      assert.equal(getDefaultPathForRole('caixa'), '/caixa')
    })

    test('Papel desconhecido ou nulo deve cair em fallback seguro para / evitando loop', () => {
      assert.equal(getDefaultPathForRole(null), '/')
      assert.equal(getDefaultPathForRole(undefined), '/')
      assert.equal(getDefaultPathForRole('OUTRO'), '/')
      assert.equal(getDefaultPathForRole('DESCONHECIDO'), '/')
    })
  })

  describe('isRoleAllowed - Regras de Acesso e Bloqueio', () => {
    const gestorOnly = [ROLES.GESTOR]
    const cozinhaRoute = [ROLES.GESTOR, ROLES.COZINHA]
    const caixaRoute = [ROLES.GESTOR, ROLES.CAIXA]

    test('Rota exclusiva de Gestor (/admin): apenas GESTOR tem acesso', () => {
      assert.equal(isRoleAllowed(ROLES.GESTOR, gestorOnly), true, 'Gestor deve acessar /admin')
      assert.equal(isRoleAllowed('gestor', gestorOnly), true, 'gestor minúsculo deve acessar /admin')
      assert.equal(isRoleAllowed(ROLES.COZINHA, gestorOnly), false, 'Cozinha NÃO deve acessar /admin')
      assert.equal(isRoleAllowed(ROLES.CAIXA, gestorOnly), false, 'Caixa NÃO deve acessar /admin')
      assert.equal(isRoleAllowed(null, gestorOnly), false, 'Não autenticado NÃO deve acessar')
    })

    test('Rota da Cozinha KDS (/cozinha): GESTOR e COZINHA têm acesso, CAIXA bloqueado', () => {
      assert.equal(isRoleAllowed(ROLES.GESTOR, cozinhaRoute), true, 'Gestor deve acessar /cozinha')
      assert.equal(isRoleAllowed(ROLES.COZINHA, cozinhaRoute), true, 'Cozinha deve acessar /cozinha')
      assert.equal(isRoleAllowed(ROLES.CAIXA, cozinhaRoute), false, 'Caixa NÃO deve acessar /cozinha')
    })

    test('Rota do Caixa POS (/caixa): GESTOR e CAIXA têm acesso, COZINHA bloqueada', () => {
      assert.equal(isRoleAllowed(ROLES.GESTOR, caixaRoute), true, 'Gestor deve acessar /caixa')
      assert.equal(isRoleAllowed(ROLES.CAIXA, caixaRoute), true, 'Caixa deve acessar /caixa')
      assert.equal(isRoleAllowed(ROLES.COZINHA, caixaRoute), false, 'Cozinha NÃO deve acessar /caixa')
    })

    test('Rota sem restrição explícita (array vazio ou nulo) deve permitir qualquer papel autenticado', () => {
      assert.equal(isRoleAllowed(ROLES.GESTOR, []), true)
      assert.equal(isRoleAllowed(ROLES.COZINHA, null), true)
      assert.equal(isRoleAllowed(ROLES.CAIXA, undefined), true)
    })
  })

  describe('Matriz Completa de Navegação e Permissões por Papel', () => {
    const routesConfig = [
      { path: '/admin', allowedRoles: [ROLES.GESTOR] },
      { path: '/admin/comandas/impressao', allowedRoles: [ROLES.GESTOR] },
      { path: '/cozinha', allowedRoles: [ROLES.GESTOR, ROLES.COZINHA] },
      { path: '/caixa', allowedRoles: [ROLES.GESTOR, ROLES.CAIXA] }
    ]

    function simulateNavigation(userRole, targetPath) {
      const route = routesConfig.find(r => r.path === targetPath)
      if (!route) return { allowed: true, destination: targetPath }
      const allowed = isRoleAllowed(userRole, route.allowedRoles)
      const defaultDest = getDefaultPathForRole(userRole)
      const safePath = (defaultDest === targetPath || !defaultDest) ? '/' : defaultDest

      return {
        allowed,
        destination: allowed ? targetPath : safePath,
        unauthorizedAlert: !allowed
      }
    }

    test('Operador GESTOR pode navegar em todas as rotas operacionais e administrativas', () => {
      for (const route of routesConfig) {
        const result = simulateNavigation(ROLES.GESTOR, route.path)
        assert.equal(result.allowed, true, `Gestor deve ter permissão em ${route.path}`)
        assert.equal(result.destination, route.path)
      }
    })

    test('Operador COZINHA pode acessar /cozinha mas é bloqueado em /admin e /caixa', () => {
      // Permitido
      const kds = simulateNavigation(ROLES.COZINHA, '/cozinha')
      assert.equal(kds.allowed, true)
      assert.equal(kds.destination, '/cozinha')

      // Bloqueado em Admin
      const admin = simulateNavigation(ROLES.COZINHA, '/admin')
      assert.equal(admin.allowed, false)
      assert.equal(admin.destination, '/cozinha', 'Deve redirecionar para seu painel (/cozinha)')
      assert.equal(admin.unauthorizedAlert, true)

      // Bloqueado em Caixa
      const caixa = simulateNavigation(ROLES.COZINHA, '/caixa')
      assert.equal(caixa.allowed, false)
      assert.equal(caixa.destination, '/cozinha', 'Deve redirecionar para seu painel (/cozinha)')
      assert.equal(caixa.unauthorizedAlert, true)
    })

    test('Operador CAIXA pode acessar /caixa mas é bloqueado em /admin e /cozinha', () => {
      // Permitido
      const pos = simulateNavigation(ROLES.CAIXA, '/caixa')
      assert.equal(pos.allowed, true)
      assert.equal(pos.destination, '/caixa')

      // Bloqueado em Admin
      const admin = simulateNavigation(ROLES.CAIXA, '/admin')
      assert.equal(admin.allowed, false)
      assert.equal(admin.destination, '/caixa', 'Deve redirecionar para seu painel (/caixa)')
      assert.equal(admin.unauthorizedAlert, true)

      // Bloqueado em Cozinha
      const cozinha = simulateNavigation(ROLES.CAIXA, '/cozinha')
      assert.equal(cozinha.allowed, false)
      assert.equal(cozinha.destination, '/caixa', 'Deve redirecionar para seu painel (/caixa)')
      assert.equal(cozinha.unauthorizedAlert, true)
    })

    test('Papel desconhecido bloqueado em rota restrita vai para / sem loop', () => {
      const unknown = simulateNavigation('DESCONHECIDO', '/admin')
      assert.equal(unknown.allowed, false)
      assert.equal(unknown.destination, '/', 'Destino seguro é a home')
    })
  })

  describe('Badges Visuais por Papel RBAC', () => {
    test('Badges visuais são gerados corretamente por papel', () => {
      const gestorBadge = getRoleBadgeInfo(ROLES.GESTOR)
      assert.equal(gestorBadge.color, 'blue')
      assert.ok(gestorBadge.badgeClass.includes('blue'))

      const cozinhaBadge = getRoleBadgeInfo(ROLES.COZINHA)
      assert.equal(cozinhaBadge.color, 'amber')
      assert.ok(cozinhaBadge.badgeClass.includes('amber'))

      const caixaBadge = getRoleBadgeInfo(ROLES.CAIXA)
      assert.equal(caixaBadge.color, 'emerald')
      assert.ok(caixaBadge.badgeClass.includes('emerald'))

      const unknownBadge = getRoleBadgeInfo('OUTRO_PAPEL')
      assert.equal(unknownBadge.color, 'slate')
      assert.equal(unknownBadge.label, 'OUTRO_PAPEL')

      const nullBadge = getRoleBadgeInfo(null)
      assert.equal(nullBadge.color, 'slate')
      assert.equal(nullBadge.label, 'Operador')
    })
  })
})

