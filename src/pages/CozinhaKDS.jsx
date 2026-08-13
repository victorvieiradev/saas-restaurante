import React from 'react'
import KanbanKDS from '../components/cozinha/KanbanKDS'

export default function CozinhaKDSPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 max-w-7xl mx-auto">
      <KanbanKDS restauranteId="demo-restaurante-id" />
    </div>
  )
}
