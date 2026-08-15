import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const mockStorage = new Map()
const mockLocalStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size },
  key: (i) => Array.from(mockStorage.keys())[i] || null
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true
})

import { supabase } from '../src/lib/supabase.js'
import {
  fetchUserProfile,
  fetchUsuariosEquipe,
  saveUsuarioEquipe,
  toggleUsuarioStatus,
  deleteUsuario,
  DEMO_USERS
} from '../src/services/userService.js'

describe('userService Unit Tests', () => {
  beforeEach(() => {
    mockStorage.clear()
  })

  describe('fetchUserProfile', () => {
    test('retorna null se email for vazio ou nulo', async () => {
      assert.equal(await fetchUserProfile(null), null)
      assert.equal(await fetchUserProfile(''), null)
    })

    test('recupera perfil com Supabase online', async () => {
      const mockProfile = { id: 'usr-1', email: 'online@restaurante.com', role: 'GESTOR' }
      supabase.from = () => ({
        select: () => ({
          ilike: () => ({
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: mockProfile, error: null }) }),
            maybeSingle: () => Promise.resolve({ data: mockProfile, error: null })
          })
        })
      })

      const res = await fetchUserProfile('online@restaurante.com', 'res-123')
      assert.equal(res.email, 'online@restaurante.com')
    })

    test('recupera perfil via fallback local quando Supabase falhar', async () => {
      supabase.from = () => ({
        select: () => ({
          ilike: () => ({
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: new Error('offline') }) }),
            maybeSingle: () => Promise.resolve({ data: null, error: new Error('offline') })
          })
        })
      })

      const res = await fetchUserProfile('cozinha@restaurante.com')
      assert.ok(res)
      assert.equal(res.role, 'COZINHA')
    })

    test('varre chaves do localStorage para encontrar perfil sem restauranteId explícito', async () => {
      supabase.from = () => ({
        select: () => ({
          ilike: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: new Error('offline') })
          })
        })
      })

      mockStorage.set('restaurante_usuarios_equipe_outro_rest', JSON.stringify([
        { id: 'usr-outro', email: 'outro@restaurante.com', role: 'CAIXA' }
      ]))

      const res = await fetchUserProfile('outro@restaurante.com')
      assert.ok(res)
      assert.equal(res.email, 'outro@restaurante.com')
    })

    test('retorna usuário demo admin se for admin@restaurante.com e mock estiver vazio', async () => {
      supabase.from = () => ({
        select: () => ({
          ilike: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: new Error('offline') })
          })
        })
      })

      mockStorage.set('restaurante_usuarios_equipe_res-demo-001', JSON.stringify([]))
      const res = await fetchUserProfile('admin@restaurante.com')
      assert.ok(res)
      assert.equal(res.email, 'admin@restaurante.com')
    })

    test('retorna null quando usuário não existe nem no mock nem no banco', async () => {
      supabase.from = () => ({
        select: () => ({
          ilike: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: new Error('offline') })
          })
        })
      })

      const res = await fetchUserProfile('inexistente@restaurante.com')
      assert.equal(res, null)
    })
  })

  describe('fetchUsuariosEquipe', () => {
    test('retorna lista do Supabase quando online', async () => {
      const mockList = [{ id: 'u1', email: 'u1@test.com' }]
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockList, error: null })
          })
        })
      })

      const res = await fetchUsuariosEquipe('res-demo-001')
      assert.equal(res.data.length, 1)
      assert.equal(res.data[0].email, 'u1@test.com')
    })

    test('retorna lista local quando Supabase falhar', async () => {
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: new Error('offline') })
          })
        })
      })

      const res = await fetchUsuariosEquipe('res-demo-001')
      assert.ok(Array.isArray(res.data))
      assert.ok(res.data.length >= 3)
    })
  })

  describe('saveUsuarioEquipe', () => {
    test('cadastra novo usuário via Supabase online', async () => {
      const novo = { nome: 'Novo', email: 'novo@teste.com', role: 'CAIXA' }
      supabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: { ...novo, id: 'usr-novo' }, error: null })
          })
        })
      })

      const res = await saveUsuarioEquipe(novo, 'res-demo-001')
      assert.equal(res.data.id, 'usr-novo')
    })

    test('atualiza usuário existente via Supabase online', async () => {
      const edit = { id: 'usr-1', nome: 'Editado', email: 'edit@teste.com', role: 'COZINHA' }
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: edit, error: null })
              })
            })
          })
        })
      })

      const res = await saveUsuarioEquipe(edit, 'res-demo-001')
      assert.equal(res.data.nome, 'Editado')
    })

    test('salva e edita usuário via fallback local quando offline', async () => {
      supabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('offline') })
          })
        }),
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: null, error: new Error('offline') })
              })
            })
          })
        })
      })

      // Inserção local
      const novo = { nome: 'Local User', email: 'local@teste.com', role: 'CAIXA' }
      const resInsert = await saveUsuarioEquipe(novo, 'res-demo-001')
      assert.ok(resInsert.data.id)
      assert.equal(resInsert.data.email, 'local@teste.com')

      // Edição local preservando senha existente
      const resUpdate = await saveUsuarioEquipe({ id: resInsert.data.id, nome: 'Local User Atualizado', email: 'local@teste.com' }, 'res-demo-001')
      assert.equal(resUpdate.data.nome, 'Local User Atualizado')
      assert.equal(resUpdate.data.senha, '123456')
    })
  })

  describe('toggleUsuarioStatus & deleteUsuario', () => {
    test('toggleUsuarioStatus altera status no Supabase online e fallback local', async () => {
      // Online
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: 'u1', ativo: false }, error: null })
              })
            })
          })
        })
      })
      const resOnline = await toggleUsuarioStatus('u1', false, 'res-demo-001')
      assert.equal(resOnline.data.ativo, false)

      // Offline
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: null, error: new Error('offline') })
              })
            })
          })
        })
      })
      const resOffline = await toggleUsuarioStatus('u1', true, 'res-demo-001')
      assert.equal(resOffline.data.ativo, true)
    })

    test('deleteUsuario remove usuário no Supabase online e fallback local', async () => {
      // Online
      supabase.from = () => ({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        })
      })
      const resOnline = await deleteUsuario('u1', 'res-demo-001')
      assert.equal(resOnline.error, null)

      // Offline
      supabase.from = () => ({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: new Error('offline') })
          })
        })
      })
      const resOffline = await deleteUsuario('u1', 'res-demo-001')
      assert.equal(resOffline.error, null)
    })
  })
})
