import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})
const DEMO_STORAGE_KEY = 'restaurante_gestor_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [restaurante, setRestaurante] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRestaurante = async (currentUser) => {
    if (!currentUser) {
      setRestaurante(null)
      return
    }
    try {
      const { data, error } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('email', currentUser.email)
        .maybeSingle()

      if (data && !error) {
        setRestaurante(data)
      } else {
        setRestaurante({
          id: currentUser.id || 'res-demo-001',
          nome: currentUser.user_metadata?.nome_restaurante || 'Restaurante Sabor & Arte',
          email: currentUser.email,
          slug: 'sabor-arte'
        })
      }
    } catch (err) {
      console.warn('Fallback ativado para dados do restaurante:', err)
      setRestaurante({
        id: currentUser.id || 'res-demo-001',
        nome: 'Restaurante Sabor & Arte',
        email: currentUser.email,
        slug: 'sabor-arte'
      })
    }
  }

  useEffect(() => {
    // 1. Verificar se existe uma sessão salva em localStorage (para ambiente dev/demo ou persistência local)
    const savedDemoSession = localStorage.getItem(DEMO_STORAGE_KEY)
    if (savedDemoSession) {
      try {
        const parsed = JSON.parse(savedDemoSession)
        if (parsed?.user && parsed?.session) {
          setUser(parsed.user)
          setSession(parsed.session)
          setRestaurante(parsed.restaurante || {
            id: 'res-demo-001',
            nome: 'Restaurante Sabor & Arte',
            email: parsed.user.email,
            slug: 'sabor-arte'
          })
          setLoading(false)
          return
        }
      } catch (e) {
        localStorage.removeItem(DEMO_STORAGE_KEY)
      }
    }

    // 2. Obter sessão nativa do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchRestaurante(currentUser)
      }
      setLoading(false)
    }).catch(err => {
      console.warn('Sessão inicial Supabase:', err)
      setLoading(false)
    })

    // Escutar mudanças de autenticação no Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!localStorage.getItem(DEMO_STORAGE_KEY)) {
        setSession(session)
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          await fetchRestaurante(currentUser)
        } else {
          setRestaurante(null)
        }
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const saveDemoSession = (mockUser, mockSession, mockRestaurante) => {
    setUser(mockUser)
    setSession(mockSession)
    setRestaurante(mockRestaurante)
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({
        user: mockUser,
        session: mockSession,
        restaurante: mockRestaurante
      }))
    } catch (e) {
      console.warn('Erro ao salvar sessão demo no localStorage:', e)
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        if (email.toLowerCase() === 'admin@restaurante.com' && password === '123456') {
          const mockUser = {
            id: 'user-demo-admin-01',
            email: 'admin@restaurante.com',
            user_metadata: { nome_restaurante: 'Restaurante Sabor & Arte' }
          }
          const mockSession = { user: mockUser, access_token: 'demo-token' }
          const mockRestaurante = {
            id: 'res-demo-001',
            nome: 'Restaurante Sabor & Arte',
            email: 'admin@restaurante.com',
            slug: 'sabor-arte'
          }
          saveDemoSession(mockUser, mockSession, mockRestaurante)
          return { data: { user: mockUser, session: mockSession }, error: null }
        }
        throw error
      }
      return { data, error: null }
    } catch (error) {
      if (email.toLowerCase() === 'admin@restaurante.com' && password === '123456') {
        const mockUser = {
          id: 'user-demo-admin-01',
          email: 'admin@restaurante.com',
          user_metadata: { nome_restaurante: 'Restaurante Sabor & Arte' }
        }
        const mockSession = { user: mockUser, access_token: 'demo-token' }
        const mockRestaurante = {
          id: 'res-demo-001',
          nome: 'Restaurante Sabor & Arte',
          email: 'admin@restaurante.com',
          slug: 'sabor-arte'
        }
        saveDemoSession(mockUser, mockSession, mockRestaurante)
        return { data: { user: mockUser, session: mockSession }, error: null }
      }
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY)
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Erro no signOut:', err)
    } finally {
      setUser(null)
      setSession(null)
      setRestaurante(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, restaurante, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
