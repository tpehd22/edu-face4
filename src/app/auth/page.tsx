'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import FaceDetector from '@/components/FaceDetector'
import { loadFaceUsers, type StoredUser } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [users, setUsers]       = useState<StoredUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')
  const [authResult, setAuthResult] = useState<{
    matched: boolean
    name: string
    similarity: number
  } | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await loadFaceUsers()
      setUsers(data)
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : '로드 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleAuthResult = (result: { matched: boolean; name: string; similarity: number }) => {
    setAuthResult(result)
    if (result.matched && result.similarity >= 90) {
      setShowSuccess(true)
    }
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#0F1117]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-[#1A1F30] flex items-center justify-center active:bg-[#232840]"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-white">인증 시작</h1>
          <p className="text-[12px] text-slate-500">
            {loading ? '데이터 로딩 중...' : `등록 사용자 ${users.length}명`}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="ml-auto w-9 h-9 rounded-full bg-[#1A1F30] flex items-center justify-center active:bg-[#232840]"
        >
          <RefreshCw size={16} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 px-5 pb-8">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 size={32} className="text-[#4F8EF7] animate-spin" />
            <p className="text-[13px] text-slate-400">Supabase에서 등록 데이터 로딩 중...</p>
          </div>
        )}

        {/* Load error */}
        {!loading && loadError && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <span className="text-4xl">⚠️</span>
            <div>
              <p className="text-[15px] font-bold text-white">데이터 로드 실패</p>
              <p className="text-[12px] text-red-400 mt-1">{loadError}</p>
            </div>
            <button
              onClick={fetchUsers}
              className="px-6 py-3 rounded-xl bg-[#4F8EF7] text-white text-[14px] font-medium"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* No users */}
        {!loading && !loadError && users.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center text-4xl">
              👤
            </div>
            <div>
              <p className="text-[17px] font-bold text-white">등록된 사용자 없음</p>
              <p className="text-[13px] text-slate-400 mt-1.5 leading-relaxed">
                먼저 얼굴 등록을 완료해주세요
              </p>
            </div>
            <button
              onClick={() => router.push('/register')}
              className="w-full max-w-xs py-[18px] rounded-2xl bg-[#4F8EF7] text-white font-semibold text-[15px] shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
            >
              얼굴 등록하러 가기
            </button>
          </div>
        )}

        {/* Camera + detection */}
        {!loading && !loadError && users.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Registered users row */}
            <div className="w-full max-w-sm mb-4">
              <p className="text-[11px] text-slate-500 mb-2 font-medium">등록된 사용자</p>
              <div className="flex flex-wrap gap-2">
                {users.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1F30] border border-[#2A3050]"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#4F8EF7]/30 flex items-center justify-center text-[8px] text-[#4F8EF7] font-bold">
                      {u.name[0]}
                    </div>
                    <span className="text-[12px] text-slate-300">{u.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Similarity threshold legend */}
            <div className="flex gap-2 mb-4 w-full max-w-sm">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141820] border border-emerald-500/20">
                <div className="w-2 h-2 rounded-sm bg-emerald-400" />
                <span className="text-[11px] text-slate-400">유사도 ≥ 90% → 인증 성공</span>
              </div>
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141820] border border-red-500/20">
                <div className="w-2 h-2 rounded-sm bg-red-400" />
                <span className="text-[11px] text-slate-400">유사도 &lt; 90% → 불일치</span>
              </div>
            </div>

            <FaceDetector
              mode="auth"
              storedUsers={users}
              onAuthResult={handleAuthResult}
            />

            {/* Live result bar */}
            {authResult && (
              <div className={`mt-4 w-full max-w-sm px-5 py-4 rounded-2xl border flex items-center gap-4 transition-all ${
                authResult.matched && authResult.similarity >= 90
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-[#1A1F30] border-[#2A3050]'
              }`}>
                <div className={`text-3xl font-black w-16 text-center ${
                  authResult.matched && authResult.similarity >= 90 ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  {authResult.similarity}%
                </div>
                <div className="flex-1">
                  <p className={`text-[14px] font-semibold ${
                    authResult.matched && authResult.similarity >= 90 ? 'text-emerald-300' : 'text-slate-400'
                  }`}>
                    {authResult.matched && authResult.similarity >= 90
                      ? `${authResult.name}님 인식됨`
                      : authResult.name ? `${authResult.name}과 불일치` : '일치 없음'}
                  </p>
                  {/* Similarity bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-[#2A3050] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        authResult.similarity >= 90 ? 'bg-emerald-400' :
                        authResult.similarity >= 70 ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${authResult.similarity}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push('/register')}
              className="mt-4 w-full max-w-sm py-3.5 rounded-2xl bg-[#1A1F30] border border-[#2A3050] text-slate-400 font-medium text-[14px] active:bg-[#232840] transition-all"
            >
              + 새 사용자 등록
            </button>
          </div>
        )}
      </div>

      {/* ── 인증 완료 Full-screen overlay ── */}
      {showSuccess && authResult && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F1117]/95 backdrop-blur-md px-8">
          {/* Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />
          </div>

          {/* Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none">
                  <circle cx="32" cy="32" r="30" stroke="#10B981" strokeWidth="2" />
                  <path d="M18 32 L28 42 L46 24" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/10" style={{ animationDuration: '1.5s' }} />
          </div>

          {/* Text */}
          <h2 className="text-[32px] font-black text-white tracking-tight">인증 완료</h2>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[20px] font-bold text-emerald-400">{authResult.name}</span>
            <span className="text-[16px] text-slate-400">님 환영합니다</span>
          </div>
          <div className="mt-3 px-5 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/25">
            <span className="text-[14px] text-emerald-400 font-semibold">
              유사도 {authResult.similarity}% 인증 성공
            </span>
          </div>

          {/* Buttons */}
          <div className="mt-12 w-full space-y-3">
            <button
              onClick={() => { setShowSuccess(false); setAuthResult(null) }}
              className="w-full py-[18px] rounded-2xl bg-emerald-500 text-white font-bold text-[16px] shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
            >
              확인
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 text-slate-500 font-medium text-[14px]"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
