import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { supabase } from '../src/lib/supabase.js'
import {
  fetchCategorias,
  saveCategoria,
  toggleCategoriaStatus,
  deleteCategoria,
  fetchProdutos,
  saveProduto,
  toggleProdutoDisponibilidade,
  deleteProduto
} from '../src/services/menuService.js'

const VALID_REST_ID = '11111111-1111-4111-8111-111111111111'
const VALID_CAT_ID = '33333333-3333-4333-8333-333333333333'
const VALID_PROD_ID = '44444444-4444-4444-8444-444444444444'

describe('menuService Unit Tests (Production)', () => {
  describe('Categorias CRUD', () => {
    test('fetchCategorias retorna lista de categorias ordenadas', async () => {
      const mockCats = [
        { id: VALID_CAT_ID, restaurante_id: VALID_REST_ID, nome: 'Pratos Principais', ordem: 1, ativo: true }
      ]
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockCats, error: null })
          })
        })
      })

      const cats = await fetchCategorias(VALID_REST_ID)
      assert.ok(Array.isArray(cats))
      assert.equal(cats.length, 1)
      assert.equal(cats[0].nome, 'Pratos Principais')
    })

    test('saveCategoria cadastra nova categoria via Supabase', async () => {
      const nova = { nome: 'Pizzas Especiais', ordem: 5, ativo: true }
      supabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: { ...nova, id: VALID_CAT_ID, restaurante_id: VALID_REST_ID }, error: null })
          })
        })
      })

      const res = await saveCategoria(nova, VALID_REST_ID)
      assert.equal(res.nome, 'Pizzas Especiais')
      assert.equal(res.id, VALID_CAT_ID)
    })

    test('saveCategoria rejeita categoria com ID não-UUID', async () => {
      await assert.rejects(
        () => saveCategoria({ id: 'id-invalido', nome: 'Categoria' }, VALID_REST_ID),
        /ID de categoria inválido/
      )
    })

    test('toggleCategoriaStatus altera status ativo/inativo', async () => {
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        })
      })

      const res = await toggleCategoriaStatus(VALID_CAT_ID, false, VALID_REST_ID)
      assert.equal(res, true)
    })

    test('deleteCategoria remove categoria do cardápio', async () => {
      supabase.from = () => ({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        })
      })

      const res = await deleteCategoria(VALID_CAT_ID, VALID_REST_ID)
      assert.equal(res, true)
    })
  })

  describe('Produtos CRUD', () => {
    test('fetchProdutos retorna lista de produtos do Supabase', async () => {
      const mockProds = [
        { id: VALID_PROD_ID, restaurante_id: VALID_REST_ID, nome: 'Hambúrguer Gourmet', preco: 38.90, disponivel: true }
      ]
      supabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockProds, error: null })
          })
        })
      })

      const prods = await fetchProdutos(VALID_REST_ID)
      assert.ok(Array.isArray(prods))
      assert.equal(prods.length, 1)
      assert.equal(prods[0].nome, 'Hambúrguer Gourmet')
    })

    test('saveProduto cadastra novo produto via Supabase', async () => {
      const novoProduto = {
        categoria_id: VALID_CAT_ID,
        nome: 'Picanha na Chapa 500g',
        descricao: 'Acompanha farofa de ovos e vinagrete especial.',
        preco: '89.90',
        disponivel: true
      }
      supabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: { ...novoProduto, id: VALID_PROD_ID, preco: 89.90, restaurante_id: VALID_REST_ID }, error: null })
          })
        })
      })

      const res = await saveProduto(novoProduto, VALID_REST_ID)
      assert.equal(res.nome, 'Picanha na Chapa 500g')
      assert.equal(res.preco, 89.90)
    })

    test('saveProduto rejeita produto com ID não-UUID', async () => {
      await assert.rejects(
        () => saveProduto({ id: 'id-invalido', nome: 'Produto', preco: 10 }, VALID_REST_ID),
        /ID de produto inválido/
      )
    })

    test('toggleProdutoDisponibilidade altera flag disponivel', async () => {
      supabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        })
      })

      const res = await toggleProdutoDisponibilidade(VALID_PROD_ID, false, VALID_REST_ID)
      assert.equal(res, true)
    })

    test('deleteProduto remove produto do cardápio', async () => {
      supabase.from = () => ({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        })
      })

      const res = await deleteProduto(VALID_PROD_ID, VALID_REST_ID)
      assert.equal(res, true)
    })
  })
})

