'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, User, Loader2 } from 'lucide-react'
import FaceDetector from '@/components/FaceDetector'
import { saveFaceUser } from '@/lib/supabase'

type Step = 'name' | 'scan' | 'saving' | 'done'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep]       = useState<Step>('name')
  const [name, setName]       = useState('')
  const [nameError, setNameError] = useState('')
  const [savedName, setSavedName] = useState('')
  const [saveError, setSaveError] = useState('')

  const handleNameNext = () => {
    const trimmed = name.trim()
    if (!trimmed) { setNameError('이름을 입력해주세요'); return }
    if (trimmed.length < 2) { setNameError('2자 이상 입력해주세요'); return }
    setNameError('')
    setStep('scan')
  }

  const handleCapture = useCallback(async (descriptor: Float32Array) => {
    setStep('saving')
    setSaveError('')
    try {
      await saveFaceUser(name.trim(), descriptor)
      setSavedName(name.trim())
      setStep('done')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '저장 실패'
      setSaveError(msg)
      setStep('scan')
    }
  }, [name])

  return (
    <main className="flex flex-col min-h-screen bg-[#0F1117]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => step === 'scan' ? setStep('name') : router.back()}
          className="w-9 h-9 rounded-full bg-[#1A1F30] flex items-center justify-center active:bg-[#232840]"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-white">얼굴 등록</h1>
          <p className="text-[12px] text-slate-500">
            {{ name: '이름 입력', scan: '얼굴 스캔', saving: '저장 중', done: '등록 완료' }[step]}
          </p>
        </div>
        {/* Step dots */}
        <div className="ml-auto flex items-center gap-1.5">
          {(['name', 'scan', 'done'] as const).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step || (step === 'saving' && s === 'scan')
                  ? 'w-6 bg-[#4F8EF7]'
                  : i < ['name','scan','done'].indexOf(step === 'saving' ? 'done' : step)
                  ? 'w-2 bg-[#4F8EF7]/50'
                  : 'w-2 bg-[#2A3050]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pb-8">

        {/* ── STEP 1: 이름 입력 ── */}
        {step === 'name' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col justify-center gap-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-[#4F8EF7]/15 border border-[#4F8EF7]/20 flex items-center justify-center">
                  <User size={36} className="text-[#4F8EF7]" strokeWidth={1.5} />
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-[20px] font-bold text-white">이름을 입력해주세요</h2>
                <p className="text-[13px] text-slate-400 mt-1.5">등록된 이름은 인증 시 표시됩니다</p>
              </div>

              {/* Name input */}
              <div className="space-y-2">
                <div className={`flex items-center gap-3 px-4 py-4 rounded-2xl bg-[#141820] border transition-colors ${
                  nameError ? 'border-red-500/50' : 'border-[#2A3050] focus-within:border-[#4F8EF7]'
                }`}>
                  <User size={18} className="text-slate-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setNameError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleNameNext()}
                    placeholder="홍길동"
                    maxLength={20}
                    className="flex-1 bg-transparent text-white text-[15px] placeholder-slate-600 outline-none"
                    autoFocus
                  />
                  {name && (
                    <span className="text-[11px] text-slate-500">{name.length}/20</span>
                  )}
                </div>
                {nameError && (
                  <p className="text-[12px] text-red-400 px-1">{nameError}</p>
                )}
              </div>

              {saveError && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-[12px] text-red-400">⚠️ {saveError}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleNameNext}
              disabled={!name.trim()}
              className={`w-full mt-6 py-[18px] rounded-2xl font-semibold text-[15px] transition-all duration-150 ${
                name.trim()
                  ? 'bg-[#4F8EF7] text-white shadow-lg shadow-blue-500/30 active:scale-95'
                  : 'bg-[#1A1F30] text-slate-600 cursor-not-allowed'
              }`}
            >
              다음 →
            </button>
          </div>
        )}

        {/* ── STEP 2: 얼굴 스캔 ── */}
        {(step === 'scan' || step === 'saving') && (
          <div className="flex flex-col items-center">
            {/* Name badge */}
            <div className="flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-[#1A1F30] border border-[#2A3050]">
              <div className="w-6 h-6 rounded-full bg-[#4F8EF7]/20 flex items-center justify-center">
                <User size={12} className="text-[#4F8EF7]" />
              </div>
              <span className="text-[13px] text-white font-medium">{name.trim()}</span>
              <span className="text-[11px] text-slate-500">으로 등록</span>
            </div>

            <FaceDetector mode="register" onFaceCapture={handleCapture} />

            {/* Saving overlay message */}
            {step === 'saving' && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 w-full max-w-sm justify-center">
                <Loader2 size={16} className="text-[#4F8EF7] animate-spin" />
                <span className="text-[13px] text-[#7FB3FF] font-medium">Supabase에 저장 중...</span>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: 완료 ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="relative mb-8">
              <div className="w-28 h-28 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle size={48} className="text-emerald-400" strokeWidth={1.5} />
                </div>
              </div>
              <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/10" />
            </div>

            <h2 className="text-[24px] font-bold text-white">등록 완료!</h2>
            <div className="mt-2 flex items-center gap-2 justify-center">
              <div className="w-6 h-6 rounded-full bg-[#4F8EF7]/20 flex items-center justify-center">
                <User size={12} className="text-[#4F8EF7]" />
              </div>
              <span className="text-[15px] text-[#7FB3FF] font-semibold">{savedName}</span>
              <span className="text-[14px] text-slate-400">님 등록 완료</span>
            </div>
            <p className="text-[13px] text-slate-500 mt-3">
              얼굴 데이터가 Supabase에 저장되었습니다
            </p>

            <div className="mt-10 w-full space-y-3">
              <button
                onClick={() => router.push('/auth')}
                className="w-full py-[18px] rounded-2xl bg-[#4F8EF7] text-white font-semibold text-[15px] shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
              >
                인증 시작하기
              </button>
              <button
                onClick={() => { setName(''); setStep('name') }}
                className="w-full py-[18px] rounded-2xl bg-[#1A1F30] text-slate-400 font-semibold text-[15px] active:bg-[#232840] transition-all"
              >
                다른 사람 등록하기
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 text-slate-600 font-medium text-[14px]"
              >
                홈으로
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
