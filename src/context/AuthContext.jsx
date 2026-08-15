import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchUserProfile, DEMO_USERS } from '../services/userService'

const AuthContext = createContext({})
const DEMO_STORAGE_KEY = 'restaurante_gestor_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [restaurante, setRestaurante] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRestauranteAndProfile = async (currentUser) => {
    if (!currentUser) {
      setRestaurante(null)
      setUserProfile(null)
      return
    }

    try {
      // 1. Carregar dados do restaurante
      let currentRest = null
      const { data: restData, error: restErr } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('email', currentUser.email)
        .maybeSingle()

      if (restData && !restErr) {
        currentRest = restData
      } else {
        currentRest = {
          id: currentUser.id || 'res-demo-001',
          nome: currentUser.user_metadata?.nome_restaurante || 'Restaurante Sabor & Arte',
          email: currentUser.email,
          slug: 'sabor-arte'
        }
      }
      setRestaurante(currentRest)

      // 2. Carregar perfil RBAC do usuário
      const profile = await fetchUserProfile(currentUser.email, currentRest.id)
      if (profile) {
        setUserProfile(profile)
      } else {
        // Fallback default caso o usuário seja gestor nativo
        const defaultProfile = {
          id: currentUser.id || 'usr-default',
          restaurante_id: currentRest.id,
          email: currentUser.email,
          nome: currentUser.user_metadata?.nome || currentUser.email.split('@')[0],
          role: 'GESTOR',
          ativo: true,
          criado_em: new Date().toISOString()
        }
        setUserProfile(defaultProfile)
      }
    } catch (err) {
      console.warn('Fallback ativado para dados do restaurante e perfil:', err)
      const fallbackRest = {
        id: currentUser.id || 'res-demo-001',
        nome: 'Restaurante Sabor & Arte',
        email: currentUser.email,
        slug: 'sabor-arte'
      }
      setRestaurante(fallbackRest)
      setUserProfile({
        id: currentUser.id || 'usr-demo-01',
        restaurante_id: fallbackRest.id,
        email: currentUser.email,
        nome: 'Gestor',
        role: 'GESTOR',
        ativo: true,
        criado_em: new Date().toISOString()
      })
    }
  }

  useEffect(() => {
    // 1. Verificar se existe uma sessão salva em localStorage (dev/demo/persistência local)
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
          setUserProfile(parsed.userProfile || {
            id: parsed.user.id || 'usr-demo-01',
            restaurante_id: parsed.restaurante?.id || 'res-demo-001',
            email: parsed.user.email,
            nome: parsed.user.email.split('@')[0],
            role: 'GESTOR',
            ativo: true
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
        fetchRestauranteAndProfile(currentUser)
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
          await fetchRestauranteAndProfile(currentUser)
        } else {
          setRestaurante(null)
          setUserProfile(null)
        }
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const saveDemoSession = (mockUser, mockSession, mockRestaurante, mockProfile) => {
    setUser(mockUser)
    setSession(mockSession)
    setRestaurante(mockRestaurante)
    setUserProfile(mockProfile)
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({
        user: mockUser,
        session: mockSession,
        restaurante: mockRestaurante,
        userProfile: mockProfile
      }))
    } catch (e) {
      console.warn('Erro ao salvar sessão demo no localStorage:', e)
    }
  }

  const authenticateMockUser = async (email, password) => {
    const normalizedEmail = email.toLowerCase().trim()
    const userFound = await fetchUserProfile(normalizedEmail)

    if (userFound) {
      if (!userFound.ativo) {
        throw new Error('Acesso desativado. Entre em contato com o gestor do restaurante.')
      }

      const expectedPassword = userFound.senha || '123456'
      if (password !== expectedPassword) {
        throw new Error('Senha incorreta. Verifique os dados digitados.')
      }

      const mockUser = {
        id: userFound.id,
        email: userFound.email,
        user_metadata: {
          nome: userFound.nome,
          role: userFound.role,
          nome_restaurante: 'Restaurante Sabor & Arte'
        }
      }
      const mockSession = { user: mockUser, access_token: `token-${userFound.role.toLowerCase()}-${userFound.id}` }
      const mockRestaurante = {
        id: userFound.restaurante_id || 'res-demo-001',
        nome: 'Restaurante Sabor & Arte',
        email: 'admin@restaurante.com',
        slug: 'sabor-arte'
      }

      saveDemoSession(mockUser, mockSession, mockRestaurante, userFound)
      return { data: { user: mockUser, session: mockSession, userProfile: userFound }, error: null }
    }
    return null
  }

  const signIn = async (email, password) => {
    const normalizedEmail = email.toLowerCase().trim()

    // 1. Tenta autenticação nativa do Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (!error && data?.user) {
        // Validar se o usuário está ativo no perfil
        const profile = await fetchUserProfile(normalizedEmail)
        if (profile && profile.ativo === false) {
          await supabase.auth.signOut()
          throw new Error('Acesso desativado. Entre em contato com o gestor do restaurante.')
        }
        await fetchRestauranteAndProfile(data.user)
        return { data, error: null }
      }
    } catch (authErr) {
      if (authErr.message?.includes('Acesso desativado')) {
        return { data: null, error: authErr }
      }
    }

    // 2. Fallback / Mock para colaboradores cadastrados na equipe e perfis de demonstração
    try {
      const mockAuth = await authenticateMockUser(normalizedEmail, password)
      if (mockAuth) return mockAuth
      return { data: null, error: new Error('Credenciais inválidas ou e-mail/senha incorretos.') }
    } catch (mockErr) {
      return { data: null, error: mockErr }
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
      setUserProfile(null)
    }
  }

  // Helpers de Autorização RBAC
  const role = userProfile?.role || (user?.user_metadata?.role) || (user ? 'GESTOR' : null)
  const isAdmin = role === 'GESTOR'
  const isCozinha = role === 'COZINHA'
  const isCaixa = role === 'CAIXA'

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        restaurante,
        userProfile,
        role,
        isAdmin,
        isCozinha,
        isCaixa,
        loading,
        signIn,
        signOut
      }}
    >
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

