import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

const roundCurrency = (val) => Math.round((Number(val) || 0) * 100) / 100

export function CartProvider({ children, comandaId }) {
  const storageKey = comandaId ? `cardapio_carrinho_${comandaId}` : 'cardapio_carrinho_demo'

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Erro ao ler carrinho do localStorage:', e)
      return []
    }
  })

  const [observacaoGeral, setObservacaoGeral] = useState('')
  const [isRevisionOpen, setIsRevisionOpen] = useState(false)

  // Sincronizar o carrinho quando a chave da comanda (storageKey) muda
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setCartItems(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Erro ao recarregar carrinho ao mudar comanda:', e)
    }
  }, [storageKey])

  // Salvar no localStorage sempre que cartItems mudar
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cartItems))
    } catch (e) {
      console.error('Erro ao salvar carrinho no localStorage:', e)
    }
  }, [cartItems, storageKey])

  // Adicionar item ao carrinho
  const addToCart = (produto, quantidade = 1, observacao = '') => {
    const obsTrimmed = observacao.trim()
    const unitPrice = Number(produto.preco) || 0

    setCartItems((prevItems) => {
      // Verificar se já existe exatamente o mesmo produto com a mesma observação
      const existingIndex = prevItems.findIndex(
        (item) => item.produto_id === produto.id && item.observacao === obsTrimmed
      )

      if (existingIndex > -1) {
        const updated = [...prevItems]
        const currentItem = updated[existingIndex]
        const newQty = currentItem.quantidade + quantidade
        updated[existingIndex] = {
          ...currentItem,
          quantidade: newQty,
          subtotal: roundCurrency(unitPrice * newQty)
        }
        return updated
      } else {
        const newItem = {
          id: `${produto.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          produto_id: produto.id,
          nome: produto.nome,
          preco: unitPrice,
          imagem_url: produto.imagem_url,
          quantidade,
          observacao: obsTrimmed,
          subtotal: roundCurrency(unitPrice * quantidade)
        }
        return [...prevItems, newItem]
      }
    })
  }

  // Remover item do carrinho por ID do item no carrinho
  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== cartItemId))
  }

  // Atualizar quantidade de um item
  const updateQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId)
      return
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === cartItemId) {
          return {
            ...item,
            quantidade: newQty,
            subtotal: roundCurrency(item.preco * newQty)
          }
        }
        return item
      })
    )
  }

  // Limpar carrinho
  const clearCart = () => {
    setCartItems([])
    setObservacaoGeral('')
    localStorage.removeItem(storageKey)
  }

  // Cálculos derivados
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantidade, 0)
  const totalAmount = roundCurrency(cartItems.reduce((acc, item) => acc + item.subtotal, 0))

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems,
        totalAmount,
        observacaoGeral,
        setObservacaoGeral,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isRevisionOpen,
        setIsRevisionOpen
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider')
  }
  return context
}
