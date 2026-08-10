import React, { useState, useRef } from 'react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import {
  X,
  Copy,
  Check,
  Download,
  Printer,
  QrCode,
  Sparkles,
  ExternalLink
} from 'lucide-react'

export default function QRCodeModal({ comanda, restauranteName = 'Restaurante', onClose }) {
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef(null)

  if (!comanda) return null

  // URL para a comanda do cliente
  const qrUrl = `${window.location.origin}/comanda/${comanda.qr_code_token}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPNG = () => {
    try {
      const canvas = canvasRef.current?.querySelector('canvas')
      if (!canvas) return

      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `comanda-${comanda.numero}-qrcode.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    } catch (e) {
      console.error('Erro ao baixar QR Code PNG:', e)
    }
  }

  const handlePrintIndividual = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      {/* Container do Modal */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho do Modal (no-print) */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">QR Code da Comanda #{comanda.numero}</h3>
              <p className="text-xs text-slate-400">Visualização e impressão do cartão de mesa</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Imprimível (Card Físico da Comanda) */}
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-950/30">
          
          {/* Card com Estilo de Cartão de Mesa Físico */}
          <div className="print-area w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border-2 border-slate-200 text-slate-900 flex flex-col items-center text-center space-y-4 relative overflow-hidden">
            
            {/* Faixa Superior Decorativa */}
            <div className="w-full bg-orange-500 h-2 absolute top-0 left-0 right-0" />

            {/* Nome do Restaurante */}
            <div className="pt-2">
              <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">
                {restauranteName}
              </span>
              <h4 className="text-2xl font-black font-mono text-orange-600 tracking-tight mt-0.5">
                Comanda #{comanda.numero}
              </h4>
            </div>

            {/* Renderização do QR Code SVG */}
            <div className="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-inner flex items-center justify-center">
              <QRCodeSVG
                value={qrUrl}
                size={200}
                level="H"
                includeMargin={true}
                fgColor="#0F172A"
                bgColor="#FFFFFF"
              />
            </div>

            {/* Instruções ao Cliente */}
            <div className="space-y-1 px-2">
              <p className="text-xs font-bold text-slate-800">
                Aponte a câmera do seu celular
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Acesse o cardápio digital e faça seu pedido direto da mesa.
              </p>
            </div>

            {/* Token do QR Code embutido */}
            <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Token: {comanda.qr_code_token}</span>
              <span className="font-semibold text-orange-500">Mesa Livre</span>
            </div>
          </div>

          {/* Canvas oculto para exportação em PNG */}
          <div ref={canvasRef} className="absolute opacity-0 pointer-events-none -z-50">
            <QRCodeCanvas
              value={qrUrl}
              size={512}
              level="H"
              includeMargin={true}
              fgColor="#0F172A"
              bgColor="#FFFFFF"
            />
          </div>

          {/* Exibição da URL gerada (no-print) */}
          <div className="w-full mt-6 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between no-print">
            <span className="truncate pr-2 text-slate-400">{qrUrl}</span>
            <a
              href={qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-sans font-medium whitespace-nowrap cursor-pointer"
            >
              Testar <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Rodapé de Ações do Modal (no-print) */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Baixar PNG</span>
            </button>
          </div>

          <button
            onClick={handlePrintIndividual}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Comanda</span>
          </button>
        </div>

      </div>
    </div>
  )
}
