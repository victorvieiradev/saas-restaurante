import React from 'react'
import KanbanKDS from '../components/cozinha/KanbanKDS'
import { useAuth } from '../context/AuthContext'

export default function CozinhaKDSPage() {
  const { restaurante } = useAuth()
  const restauranteId = restaurante?.id

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {restaurante && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Estabelecimento: <strong className="text-slate-200">{restaurante.nome}</strong></span>
          <span className="font-mono text-[11px] text-slate-500">ID: {restaurante.id}</span>
        </div>
      )}
      <KanbanKDS restauranteId={restauranteId} />
    </div>
  )
}
