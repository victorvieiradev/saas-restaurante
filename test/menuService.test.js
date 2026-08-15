import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const mockStorage = new Map()
const mockLocalStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true
})

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

describe('menuService Unit Tests', () => {
  beforeEach(() => {
    mockStorage.clear()
  })

  describe('Categorias CRUD', () => {
    test('fetchCategorias retorna lista inicial de categorias ordenadas', async () => {
      const cats = await fetchCategorias('demo-restaurante-id')
      assert.ok(Array.isArray(cats))
      assert.ok(cats.length >= 4)
      for (let i = 0; i < cats.length - 1; i++) {
        assert.ok(cats[i].ordem <= cats[i + 1].ordem, 'Categorias devem estar ordenadas por ordem asc')
      }
    })

    test('saveCategoria cadastra nova categoria com ID gerado', async () => {
      const nova = { nome: 'Pizzas Especiais', ordem: 5, ativo: true }
      const res = await saveCategoria(nova, 'demo-restaurante-id')
      assert.equal(res.nome, 'Pizzas Especiais')

      const cats = await fetchCategorias('demo-restaurante-id')
      const encontrada = cats.find(c => c.nome === 'Pizzas Especiais')
      assert.ok(encontrada)
      assert.ok(encontrada.id)
    })

    test('saveCategoria atualiza categoria existente preservando id', async () => {
      const cats = await fetchCategorias('demo-restaurante-id')
      const target = cats[0]

      const res = await saveCategoria({ id: target.id, nome: 'Pratos Principais Premium', ordem: 1 }, 'demo-restaurante-id')
      assert.equal(res.nome, 'Pratos Principais Premium')

      const updatedList = await fetchCategorias('demo-restaurante-id')
      const item = updatedList.find(c => c.id === target.id)
      assert.equal(item.nome, 'Pratos Principais Premium')
    })

    test('toggleCategoriaStatus altera status ativo/inativo', async () => {
      const cats = await fetchCategorias('demo-restaurante-id')
      const target = cats[0]

      const res = await toggleCategoriaStatus(target.id, false, 'demo-restaurante-id')
      assert.equal(res, true)

      const updatedList = await fetchCategorias('demo-restaurante-id')
      const item = updatedList.find(c => c.id === target.id)
      assert.equal(item.ativo, false)

      await toggleCategoriaStatus(target.id, true, 'demo-restaurante-id')
      const reativado = (await fetchCategorias('demo-restaurante-id')).find(c => c.id === target.id)
      assert.equal(reativado.ativo, true)
    })

    test('deleteCategoria remove categoria do cardápio', async () => {
      const cats = await fetchCategorias('demo-restaurante-id')
      const target = cats[0]
      const totalAntes = cats.length

      const res = await deleteCategoria(target.id, 'demo-restaurante-id')
      assert.equal(res, true)

      const remaining = await fetchCategorias('demo-restaurante-id')
      assert.equal(remaining.length, totalAntes - 1)
      assert.ok(!remaining.some(c => c.id === target.id))
    })
  })

  describe('Produtos CRUD', () => {
    test('fetchProdutos retorna lista inicial de produtos', async () => {
      const prods = await fetchProdutos('demo-restaurante-id')
      assert.ok(Array.isArray(prods))
      assert.ok(prods.length >= 5)
      for (const p of prods) {
        assert.ok(p.nome)
        assert.ok(typeof p.preco === 'number')
      }
    })

    test('saveProduto cadastra novo produto com ID gerado', async () => {
      const novoProduto = {
        categoria_id: 'cat-1',
        nome: 'Picanha na Chapa 500g',
        descricao: 'Acompanha farofa de ovos e vinagrete especial.',
        preco: '89.90',
        disponivel: true
      }

      const res = await saveProduto(novoProduto, 'demo-restaurante-id')
      assert.equal(res.nome, 'Picanha na Chapa 500g')
      assert.equal(res.preco, 89.90)

      const prods = await fetchProdutos('demo-restaurante-id')
      const target = prods.find(p => p.nome === 'Picanha na Chapa 500g')
      assert.ok(target)
      assert.ok(target.id)
    })

    test('saveProduto atualiza produto existente preservando ID', async () => {
      const prods = await fetchProdutos('demo-restaurante-id')
      const target = prods[0]

      const res = await saveProduto({ id: target.id, preco: 42.50, nome: 'Hambúrguer Artesanal Supremo' }, 'demo-restaurante-id')
      assert.equal(res.preco, 42.50)

      const updatedList = await fetchProdutos('demo-restaurante-id')
      const item = updatedList.find(p => p.id === target.id)
      assert.equal(item.nome, 'Hambúrguer Artesanal Supremo')
      assert.equal(item.preco, 42.50)
    })

    test('toggleProdutoDisponibilidade altera flag disponivel', async () => {
      const prods = await fetchProdutos('demo-restaurante-id')
      const target = prods[0]

      const res = await toggleProdutoDisponibilidade(target.id, false, 'demo-restaurante-id')
      assert.equal(res, true)

      const updatedList = await fetchProdutos('demo-restaurante-id')
      const item = updatedList.find(p => p.id === target.id)
      assert.equal(item.disponivel, false)

      await toggleProdutoDisponibilidade(target.id, true, 'demo-restaurante-id')
      const reativado = (await fetchProdutos('demo-restaurante-id')).find(p => p.id === target.id)
      assert.equal(reativado.disponivel, true)
    })

    test('deleteProduto remove produto do cardápio', async () => {
      const prods = await fetchProdutos('demo-restaurante-id')
      const target = prods[0]
      const totalAntes = prods.length

      const res = await deleteProduto(target.id, 'demo-restaurante-id')
      assert.equal(res, true)

      const remaining = await fetchProdutos('demo-restaurante-id')
      assert.equal(remaining.length, totalAntes - 1)
      assert.ok(!remaining.some(p => p.id === target.id))
    })
  })
})
