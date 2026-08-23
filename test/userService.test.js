import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { supabase } from '../src/lib/supabase.js'
import {
  fetchUserProfile,
  fetchUsuariosEquipe,
  saveUsuarioEquipe,
  toggleUsuarioStatus,
  deleteUsuario
} from '../src/services/userService.js'

const VALID_REST_ID = '11111111-1111-4111-8111-111111111111'
const VALID_USER_ID = '22222222-2222-4222-8222-222222222222'

describe('userService Unit Tests (Production)', () => {
  describe('fetchUserProfile', () => {
    test('retorna null se email for vazio ou nulo', async () => {
      assert.equal(await fetchUserProfile(null), null)
      assert.equal(await fetchUserProfile(''), null)
    })

    test('recupera perfil com Supabase online', async () => {
      const mockProfile = { id: VALID_USER_ID, email: 'online@restaurante.com', role: 'GESTOR', restaurante_id: VALID_REST_ID }
      supabase.from = () => ({
        select: () => ({
          ilike: () => ({
            maybeSingle: () => Promise.resolve({ data: mockProfile, error: null }),
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: mockProfile, error: null }) })
          })
        })
      })

      const res = await fetchUserProfile('online@restaurante.com', VALID_REST_ID)
      assert.equal(res.email, 'online@restaurante.com')
      assert.equal(res.role, 'GESTOR')
    })

    test('retorna null quando usuário não existe', async () => {
      supabase.from = () => ({
        select: () => ({
          ilike: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null })
          })
        })
      })

      const res = await fetchUserProfile('inexistente@restaurante.com')
      assert.equal(res, null)
    })
  })

  describe('fetchUsuariosEquipe', () => {
    test('retorna lista do Supabase quando online', async () => {
      const mockList = [{ id: VALID_USER_ID, email: 'u1@test.com', restaurante_id: VALID_REST_ID }]
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockList, error: null })
          })
        })
      })

      const res = await fetchUsuariosEquipe(VALID_REST_ID)
      assert.equal(res.data.length, 1)
      assert.equal(res.data[0].email, 'u1@test.com')
    })

    test('retorna lista vazia se restauranteId for inválido', async () => {
      const res = await fetchUsuariosEquipe('id-invalido')
      assert.deepEqual(res.data, [])
    })
  })

  describe('saveUsuarioEquipe', () => {
    test('cadastra novo usuário via Supabase online', async () => {
      const novo = { nome: 'Novo', email: 'novo@teste.com', role: 'CAIXA' }
      supabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: { ...novo, id: VALID_USER_ID, restaurante_id: VALID_REST_ID }, error: null })
          })
        })
      })

      const res = await saveUsuarioEquipe(novo, VALID_REST_ID)
      assert.equal(res.data.id, VALID_USER_ID)
    })

    test('atualiza usuário existente via Supabase online', async () => {
      const edit = { id: VALID_USER_ID, nome: 'Editado', email: 'edit@teste.com', role: 'COZINHA' }
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

      const res = await saveUsuarioEquipe(edit, VALID_REST_ID)
      assert.equal(res.data.nome, 'Editado')
    })
  })

  describe('toggleUsuarioStatus & deleteUsuario', () => {
    test('toggleUsuarioStatus altera status no Supabase', async () => {
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: VALID_USER_ID, ativo: false }, error: null })
              })
            })
          })
        })
      })
      const resOnline = await toggleUsuarioStatus(VALID_USER_ID, false, VALID_REST_ID)
      assert.equal(resOnline.data.ativo, false)
    })

    test('deleteUsuario remove usuário no Supabase', async () => {
      supabase.from = () => ({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        })
      })
      const resOnline = await deleteUsuario(VALID_USER_ID, VALID_REST_ID)
      assert.equal(resOnline.error, null)
    })
  })
})

