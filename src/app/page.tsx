'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, UserPlus, ChevronRight, Lock } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [ripple, setRipple] = useState<{ id: number; x: number; y: number; btn: string } | null>(null)

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>, btn: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipple({ id, x, y, btn })
    setTimeout(() => {
      setRipple(null)
      if (btn === 'register') router.push('/register')
      if (btn === 'auth') router.push('/auth')
    }, 200)
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#0F1117] select-none overflow-hidden">
      {/* Status bar padding */}
      <div className="h-12" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#4F8EF7] flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Shield size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">FaceAuth</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[12px] text-slate-400 font-medium">보안 연결됨</span>
        </div>
      </header>

      {/* Hero section */}
      <section className="flex-1 flex flex-col px-6 pt-10 pb-6">
        {/* Illustration */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            {/* Glow rings */}
            <div className="absolute inset-0 rounded-full bg-blue-500/10 scale-150 blur-2xl" />
            <div className="absolute inset-0 rounded-full bg-blue-500/5 scale-[2.2] blur-3xl" />

            {/* Outer ring */}
            <div className="w-52 h-52 rounded-full border border-[#2A2F45] flex items-center justify-center relative">
              {/* Corner dots */}
              {[0, 90, 180, 270].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-2 h-2 rounded-full bg-[#4F8EF7]"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${deg}deg) translateX(102px) translateY(-50%)`,
                    boxShadow: '0 0 8px 2px rgba(79,142,247,0.6)',
                  }}
                />
              ))}

              {/* Middle ring */}
              <div className="w-40 h-40 rounded-full border border-[#2A2F45]/60 flex items-center justify-center">
                {/* Face scan area */}
                <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#1E2235] to-[#161929] border border-[#3A4060] flex items-center justify-center relative overflow-hidden">
                  {/* Scan line animation */}
                  <div
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4F8EF7]/70 to-transparent"
                    style={{ animation: 'scanline 2.4s ease-in-out infinite' }}
                  />
                  {/* Face icon */}
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="relative z-10">
                    <circle cx="24" cy="20" r="14" stroke="#4F8EF7" strokeWidth="1.5" />
                    <circle cx="19" cy="18" r="2.5" fill="#4F8EF7" opacity="0.8" />
                    <circle cx="29" cy="18" r="2.5" fill="#4F8EF7" opacity="0.8" />
                    <path d="M18 25 Q24 30 30 25" stroke="#4F8EF7" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M12 38 Q24 44 36 38" stroke="#4F8EF7" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                    {/* Corner brackets */}
                    <path d="M11 13 L11 9 L15 9" stroke="#7FB3FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                    <path d="M37 13 L37 9 L33 9" stroke="#7FB3FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                    <path d="M11 35 L11 39 L15 39" stroke="#7FB3FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                    <path d="M37 35 L37 39 L33 39" stroke="#7FB3FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-3">
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-snug">
            얼굴 인증 보안
          </h1>
          <p className="mt-2 text-[14px] text-slate-400 leading-relaxed">
            AI 기반 얼굴 인식으로<br />
            더 안전하고 빠른 인증을 경험하세요
          </p>
        </div>

        {/* Security badge */}
        <div className="flex justify-center mt-4 mb-10">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1F30] border border-[#2A3050]">
            <Lock size={12} className="text-emerald-400" strokeWidth={2.5} />
            <span className="text-[12px] text-slate-400 font-medium">AES-256 암호화 · 로컬 저장</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          {/* 얼굴 등록 button */}
          <button
            onClick={(e) => handleRipple(e, 'register')}
            className="relative w-full overflow-hidden rounded-2xl bg-[#4F8EF7] active:bg-[#3a7be0] transition-all duration-150 shadow-lg shadow-blue-500/25"
          >
            {ripple?.btn === 'register' && (
              <span
                className="absolute rounded-full bg-white/20 animate-ping"
                style={{
                  width: 120,
                  height: 120,
                  left: ripple.x - 60,
                  top: ripple.y - 60,
                }}
              />
            )}
            <div className="flex items-center px-6 py-[18px]">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mr-4">
                <UserPlus size={20} className="text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[16px] font-semibold text-white">얼굴 등록</p>
                <p className="text-[12px] text-blue-100/70 mt-0.5">처음 사용 시 얼굴 데이터를 등록합니다</p>
              </div>
              <ChevronRight size={18} className="text-white/60" />
            </div>
          </button>

          {/* 인증 시작 button */}
          <button
            onClick={(e) => handleRipple(e, 'auth')}
            className="relative w-full overflow-hidden rounded-2xl bg-[#191E2E] border border-[#2A3350] active:bg-[#1e2438] transition-all duration-150"
          >
            {ripple?.btn === 'auth' && (
              <span
                className="absolute rounded-full bg-white/10 animate-ping"
                style={{
                  width: 120,
                  height: 120,
                  left: ripple.x - 60,
                  top: ripple.y - 60,
                }}
              />
            )}
            <div className="flex items-center px-6 py-[18px]">
              <div className="w-10 h-10 rounded-xl bg-[#4F8EF7]/15 border border-[#4F8EF7]/20 flex items-center justify-center mr-4">
                <Shield size={20} className="text-[#4F8EF7]" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[16px] font-semibold text-white">인증 시작</p>
                <p className="text-[12px] text-slate-500 mt-0.5">등록된 얼굴로 본인 인증을 진행합니다</p>
              </div>
              <ChevronRight size={18} className="text-slate-600" />
            </div>
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { label: '인식 정확도', value: '99.7%', color: 'text-emerald-400' },
            { label: '처리 속도', value: '0.3초', color: 'text-[#4F8EF7]' },
            { label: '보안 등급', value: 'AAA', color: 'text-amber-400' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-[#141820] border border-[#232840] p-4 text-center"
            >
              <p className={`text-[18px] font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom nav */}
      <nav className="flex items-center justify-around px-6 py-4 bg-[#0F1117] border-t border-[#1E2235]">
        {[
          { icon: '🏠', label: '홈', active: true },
          { icon: '📋', label: '내역', active: false },
          { icon: '⚙️', label: '설정', active: false },
        ].map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors ${
              item.active ? 'text-[#4F8EF7]' : 'text-slate-600'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[11px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Home indicator */}
      <div className="flex justify-center pb-2">
        <div className="w-32 h-1 rounded-full bg-[#2A2F45]" />
      </div>

      <style jsx>{`
        @keyframes scanline {
          0% { top: 20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 80%; opacity: 0; }
        }
      `}</style>
    </main>
  )
}
