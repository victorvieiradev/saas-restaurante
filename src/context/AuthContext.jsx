import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { fetchUserProfile } from '../services/userService.js'
import { isValidUUID } from '../utils/uuid.js'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [restaurante, setRestaurante] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRestauranteAndProfile = async (currentUser) => {
    if (!currentUser?.email) {
      setRestaurante(null)
      setUserProfile(null)
      return null
    }

    const normalizedEmail = currentUser.email.trim().toLowerCase()

    try {
      // 1. Busca perfil de colaborador na tabela usuarios_restaurante
      const profile = await fetchUserProfile(normalizedEmail)

      if (profile && profile.restaurante_id && isValidUUID(profile.restaurante_id)) {
        const { data: restData } = await supabase
          .from('restaurantes')
          .select('*')
          .eq('id', profile.restaurante_id)
          .maybeSingle()

        if (restData) {
          setUserProfile(profile)
          setRestaurante(restData)
          return { profile, restaurante: restData }
        }
      }

      // 2. Busca na tabela restaurantes se o usuário autenticado for o proprietário
      const { data: ownerRest } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (ownerRest) {
        const defaultProfile = {
          id: currentUser.id,
          restaurante_id: ownerRest.id,
          email: normalizedEmail,
          nome: currentUser.user_metadata?.nome || ownerRest.nome || 'Gestor',
          role: 'GESTOR',
          ativo: true,
          criado_em: new Date().toISOString()
        }
        setUserProfile(defaultProfile)
        setRestaurante(ownerRest)
        return { profile: defaultProfile, restaurante: ownerRest }
      }

      // Se nenhum restaurante real for localizado
      setUserProfile(null)
      setRestaurante(null)
      return null
    } catch (err) {
      console.warn('Erro ao carregar restaurante e perfil no Supabase:', err)
      setUserProfile(null)
      setRestaurante(null)
      return null
    }
  }

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        setSession(session)
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const result = await fetchRestauranteAndProfile(currentUser)
          if (!result && isMounted) {
            // Se o usuário estiver autenticado no auth mas sem restaurante no banco
            setUser(null)
            setSession(null)
          }
        } else {
          // Restaura sessão persistida de membros da equipe (COZINHA/CAIXA)
          try {
            const rawTeamSession = typeof localStorage !== 'undefined' ? localStorage.getItem('restaurante_team_session') : null
            if (rawTeamSession) {
              const parsed = JSON.parse(rawTeamSession)
              if (parsed?.userProfile?.email) {
                const refreshedProfile = await fetchUserProfile(parsed.userProfile.email, parsed.userProfile.restaurante_id)
                if (refreshedProfile && refreshedProfile.ativo) {
                  const { data: restData } = await supabase
                    .from('restaurantes')
                    .select('*')
                    .eq('id', refreshedProfile.restaurante_id)
                    .maybeSingle()

                  if (restData && isMounted) {
                    setUser(parsed.user)
                    setSession(parsed.session)
                    setRestaurante(restData)
                    setUserProfile(refreshedProfile)
                  } else if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem('restaurante_team_session')
                  }
                } else if (typeof localStorage !== 'undefined') {
                  localStorage.removeItem('restaurante_team_session')
                }
              }
            }
          } catch (teamErr) {
            console.warn('Erro ao restaurar sessão de equipe:', teamErr)
          }
        }
      } catch (err) {
        console.warn('Erro na inicialização da sessão Supabase:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return
      setSession(newSession)
      const currentUser = newSession?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('restaurante_team_session')
        }
        await fetchRestauranteAndProfile(currentUser)
      } else {
        const hasTeamSession = typeof localStorage !== 'undefined' && localStorage.getItem('restaurante_team_session')
        if (!hasTeamSession) {
          setRestaurante(null)
          setUserProfile(null)
        }
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const authenticateTeamMember = async (email, password) => {
    const normalizedEmail = email.toLowerCase().trim()
    const userFound = await fetchUserProfile(normalizedEmail)

    if (userFound) {
      if (!userFound.ativo) {
        throw new Error('Acesso desativado. Entre em contato com o gestor do restaurante.')
      }

      const expectedPassword = userFound.senha || '123456'
      if (password !== expectedPassword) {
        throw new Error('E-mail ou senha inválidos.')
      }

      if (!userFound.restaurante_id || !isValidUUID(userFound.restaurante_id)) {
        throw new Error('E-mail ou senha inválidos.')
      }

      const { data: restData } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('id', userFound.restaurante_id)
        .maybeSingle()

      if (!restData) {
        throw new Error('E-mail ou senha inválidos.')
      }

      const roleFound = userFound.role || 'COZINHA'
      const mockUser = {
        id: userFound.id,
        email: userFound.email,
        user_metadata: {
          nome: userFound.nome,
          role: roleFound,
          nome_restaurante: restData.nome
        }
      }
      const mockSession = { user: mockUser, access_token: `session-${userFound.id}` }

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('restaurante_team_session', JSON.stringify({
            user: mockUser,
            session: mockSession,
            userProfile: userFound
          }))
        } catch (storageErr) {
          console.warn('Falha ao persistir sessão da equipe:', storageErr)
        }
      }

      setUser(mockUser)
      setSession(mockSession)
      setRestaurante(restData)
      setUserProfile(userFound)

      return { data: { user: mockUser, session: mockSession, userProfile: userFound, role: roleFound, restaurante: restData }, error: null }
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
        const loaded = await fetchRestauranteAndProfile(data.user)
        if (!loaded) {
          await supabase.auth.signOut()
          throw new Error('E-mail ou senha inválidos.')
        }

        if (loaded.profile && loaded.profile.ativo === false) {
          await supabase.auth.signOut()
          throw new Error('Acesso desativado. Entre em contato com o gestor do restaurante.')
        }

        const resolvedRole = loaded.profile?.role || data.user.user_metadata?.role || 'GESTOR'
        return { data: { ...data, userProfile: loaded.profile, restaurante: loaded.restaurante, role: resolvedRole }, error: null }
      }
    } catch (authErr) {
      if (authErr.message?.includes('Acesso desativado') || authErr.message?.includes('E-mail ou senha inválidos')) {
        return { data: null, error: authErr }
      }
    }

    // 2. Tenta autenticação de colaborador na tabela usuarios_restaurante
    try {
      const teamAuth = await authenticateTeamMember(normalizedEmail, password)
      if (teamAuth) return teamAuth
      return { data: null, error: new Error('E-mail ou senha inválidos.') }
    } catch (teamErr) {
      return { data: null, error: teamErr }
    }
  }

  const signOut = async () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('restaurante_team_session')
      }
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
  const role = userProfile?.role || user?.user_metadata?.role || (user ? (userProfile ? userProfile.role : null) : null)
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

