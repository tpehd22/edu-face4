'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { StoredUser } from '@/lib/supabase'

type Status = 'idle' | 'loading' | 'detecting' | 'error'

interface FaceData {
  score: number
  landmarks: { x: number; y: number }[]
}

interface AuthResult {
  matched: boolean
  name: string
  similarity: number   // 0–100
}

interface Props {
  mode: 'register' | 'auth'
  onFaceCapture?: (descriptor: Float32Array) => void
  /** auth 모드: Supabase에서 로드한 등록 사용자 목록 */
  storedUsers?: StoredUser[]
  /** auth 결과 콜백 (매 프레임) */
  onAuthResult?: (result: AuthResult) => void
}

// euclidean distance → similarity %
// 같은 사람: distance ≈ 0.15–0.35 → similarity ≈ 65–85%
// 임계: similarity >= 90 (distance < 0.1)
function toSimilarity(distance: number): number {
  return Math.max(0, Math.min(100, Math.round((1 - distance) * 100)))
}

const GROUPS: [number, number, boolean][] = [
  [0, 16, false],
  [17, 21, false],
  [22, 26, false],
  [27, 35, false],
  [36, 41, true],
  [42, 47, true],
  [48, 59, true],
  [60, 67, true],
]

export default function FaceDetector({ mode, onFaceCapture, storedUsers, onAuthResult }: Props) {
  const videoRef      = useRef<HTMLVideoElement>(null)
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const rafRef        = useRef<number>(0)
  const faceApiRef    = useRef<typeof import('@vladmandic/face-api') | null>(null)
  const descriptorRef = useRef<Float32Array | null>(null)

  const [status, setStatus]             = useState<Status>('idle')
  const [faceData, setFaceData]         = useState<FaceData | null>(null)
  const [authResult, setAuthResult]     = useState<AuthResult | null>(null)
  const [captureReady, setCaptureReady] = useState(false)
  const [countdown, setCountdown]       = useState<number | null>(null)

  /* ── Init: models + camera (single effect) ─────────────── */
  useEffect(() => {
    let dead = false
    setStatus('loading')
    ;(async () => {
      try {
        const fa = await import('@vladmandic/face-api')
        if (dead) return
        faceApiRef.current = fa
        await fa.nets.tinyFaceDetector.loadFromUri('/models')
        await fa.nets.faceLandmark68TinyNet.loadFromUri('/models')
        await fa.nets.faceRecognitionNet.loadFromUri('/models')
        if (dead) return

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (dead) { stream.getTracks().forEach(t => t.stop()); return }

        const video  = videoRef.current!
        const canvas = canvasRef.current!
        video.srcObject = stream

        await new Promise<void>((resolve, reject) => {
          if (video.readyState >= 1) { resolve(); return }
          video.addEventListener('loadedmetadata', () => resolve(), { once: true })
          video.addEventListener('error', reject, { once: true })
        })

        canvas.width  = video.videoWidth  || 640
        canvas.height = video.videoHeight || 480
        await video.play()
        if (!dead) setStatus('detecting')
      } catch (e) {
        console.error('FaceDetector init error', e)
        if (!dead) setStatus('error')
      }
    })()
    return () => {
      dead = true
      const v = videoRef.current
      v?.pause()
      ;(v?.srcObject as MediaStream | null)?.getTracks().forEach(t => t.stop())
    }
  }, [])

  /* ── Detection loop ─────────────────────────────────────── */
  const detect = useCallback(async () => {
    const fa     = faceApiRef.current
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!fa || !video || !canvas || video.readyState < 2 || video.paused) {
      rafRef.current = requestAnimationFrame(detect)
      return
    }

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    try {
      const result = await fa
        .detectSingleFace(video, new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor()

      if (result) {
        const { x, y, width, height } = result.detection.box
        const score = result.detection.score
        const W  = canvas.width
        const mx = W - x - width  // mirror x

        const pts = result.landmarks.positions.map(p => ({ x: W - p.x, y: p.y }))

        // ── Auth comparison ────────────────────────────────
        let boxColor = '#4F8EF7'
        let curAuthResult: AuthResult | null = null

        if (mode === 'auth' && storedUsers && storedUsers.length > 0) {
          // Find best match across all registered users
          let bestDist = Infinity
          let bestUser = storedUsers[0]
          for (const u of storedUsers) {
            const d = fa.euclideanDistance(Array.from(result.descriptor), Array.from(u.descriptor))
            if (d < bestDist) { bestDist = d; bestUser = u }
          }

          const similarity = toSimilarity(bestDist)
          const matched    = similarity >= 90
          boxColor = matched ? '#10B981' : bestDist < 0.5 ? '#F59E0B' : '#EF4444'

          curAuthResult = { matched, name: bestUser.name, similarity }
          setAuthResult(curAuthResult)
          onAuthResult?.(curAuthResult)

          // Auth result badge below box
          const lbl    = matched
            ? `✓ ${bestUser.name}  ${similarity}%`
            : `✗ ${similarity}%`
          ctx.font     = 'bold 13px Inter,sans-serif'
          const tw     = ctx.measureText(lbl).width
          ctx.fillStyle = matched ? '#10B98199' : bestDist < 0.5 ? '#F59E0B99' : '#EF444499'
          ctx.fillRect(mx, y + height + 4, tw + 18, 24)
          ctx.fillStyle = '#fff'
          ctx.fillText(lbl, mx + 9, y + height + 20)
        }

        // ── Bounding box ───────────────────────────────────
        ctx.strokeStyle = boxColor
        ctx.lineWidth   = 2
        ctx.globalAlpha = 0.9
        ctx.strokeRect(mx, y, width, height)
        ctx.globalAlpha = 0.07
        ctx.fillStyle   = boxColor
        ctx.fillRect(mx, y, width, height)
        ctx.globalAlpha = 1

        // Corner brackets
        const cLen = Math.min(width, height) * 0.15
        ctx.lineWidth  = 3
        ctx.shadowBlur = 10
        ctx.shadowColor = boxColor
        ctx.strokeStyle = boxColor
        ;([[mx, y, 1, 1], [mx + width, y, -1, 1], [mx, y + height, 1, -1], [mx + width, y + height, -1, -1]] as [number,number,number,number][])
          .forEach(([cx, cy, dx, dy]) => {
            ctx.beginPath()
            ctx.moveTo(cx + dx * cLen, cy)
            ctx.lineTo(cx, cy)
            ctx.lineTo(cx, cy + dy * cLen)
            ctx.stroke()
          })
        ctx.shadowBlur = 0

        // ── Landmarks ──────────────────────────────────────
        ctx.strokeStyle = 'rgba(79,142,247,0.45)'
        ctx.lineWidth   = 1.2
        GROUPS.forEach(([s, e, closed]) => {
          const seg = pts.slice(s, e + 1)
          ctx.beginPath()
          ctx.moveTo(seg[0].x, seg[0].y)
          seg.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
          if (closed) ctx.closePath()
          ctx.stroke()
        })
        ctx.fillStyle = 'rgba(127,179,255,0.85)'
        pts.forEach(p => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2)
          ctx.fill()
        })

        // ── Score badge ────────────────────────────────────
        const badge = `얼굴 감지 ${(score * 100).toFixed(0)}%`
        ctx.font = 'bold 13px Inter,sans-serif'
        const bw = ctx.measureText(badge).width
        ctx.fillStyle = `${boxColor}CC`
        ctx.fillRect(mx, y - 26, bw + 16, 22)
        ctx.fillStyle = '#fff'
        ctx.fillText(badge, mx + 8, y - 10)

        descriptorRef.current = result.descriptor
        setFaceData({ score, landmarks: pts })
        setCaptureReady(true)
      } else {
        descriptorRef.current = null
        setFaceData(null)
        setCaptureReady(false)
        if (mode === 'auth') { setAuthResult(null) }
      }
    } catch (_) { /* skip frame */ }

    rafRef.current = requestAnimationFrame(detect)
  }, [mode, storedUsers, onAuthResult])

  useEffect(() => {
    if (status === 'detecting') {
      rafRef.current = requestAnimationFrame(detect)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [status, detect])

  /* ── Countdown capture ──────────────────────────────────── */
  const startCountdown = useCallback(() => {
    let n = 3
    setCountdown(n)
    const t = setInterval(() => {
      n -= 1
      if (n === 0) {
        clearInterval(t)
        setCountdown(null)
        if (descriptorRef.current && onFaceCapture) onFaceCapture(descriptorRef.current)
      } else {
        setCountdown(n)
      }
    }, 1000)
  }, [onFaceCapture])

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center w-full">

      <div className="relative w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden bg-[#0A0D14] border border-[#2A3050]">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Loading */}
        {(status === 'idle' || status === 'loading') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0D14]/95 z-10">
            <div className="w-12 h-12 rounded-full border-2 border-[#4F8EF7]/30 border-t-[#4F8EF7] animate-spin mb-4" />
            <p className="text-sm text-slate-400">AI 모델 로딩 중...</p>
            <p className="text-xs text-slate-600 mt-1">최초 실행 시 잠시 소요됩니다</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0D14]/95 z-10">
            <span className="text-4xl mb-3">⚠️</span>
            <p className="text-sm text-red-400 font-medium">카메라 접근 실패</p>
            <p className="text-xs text-slate-500 mt-1">브라우저 카메라 권한을 확인해주세요</p>
          </div>
        )}

        {/* Countdown */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="w-24 h-24 rounded-full bg-[#4F8EF7]/20 border-2 border-[#4F8EF7] flex items-center justify-center backdrop-blur-sm">
              <span className="text-5xl font-bold text-white">{countdown}</span>
            </div>
          </div>
        )}

        {/* Top HUD */}
        {status === 'detecting' && (
          <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
              <div className={`w-1.5 h-1.5 rounded-full ${faceData ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[11px] text-white/80 font-medium">
                {faceData ? '얼굴 감지됨' : '얼굴을 프레임 안에'}
              </span>
            </div>
            {faceData && (
              <div className="px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
                <span className="text-[11px] text-[#7FB3FF] font-medium">
                  신뢰도 {(faceData.score * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bottom HUD */}
        {status === 'detecting' && faceData && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
            <div className="px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
              <span className="text-[11px] text-[#7FB3FF] font-medium">
                특징점 {faceData.landmarks.length}개
              </span>
            </div>
            {mode === 'auth' && authResult && (
              <div className={`px-2.5 py-1.5 rounded-lg backdrop-blur-sm ${
                authResult.matched ? 'bg-emerald-500/30' :
                authResult.similarity >= 70 ? 'bg-amber-500/30' : 'bg-red-500/30'
              }`}>
                <span className={`text-[11px] font-bold ${
                  authResult.matched ? 'text-emerald-400' :
                  authResult.similarity >= 70 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {authResult.matched ? `✓ ${authResult.similarity}%` : `✗ ${authResult.similarity}%`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Landmark strip */}
      {faceData && (
        <div className="grid grid-cols-4 gap-2 w-full max-w-sm mt-4">
          {[
            { label: '눈', value: '12pt', icon: '👁' },
            { label: '눈썹', value: '10pt', icon: '〜' },
            { label: '코', value: '9pt', icon: '👃' },
            { label: '입', value: '20pt', icon: '👄' },
          ].map(item => (
            <div key={item.label} className="rounded-xl bg-[#141820] border border-[#232840] p-2.5 text-center">
              <p className="text-base">{item.icon}</p>
              <p className="text-[10px] text-[#4F8EF7] font-semibold mt-0.5">{item.value}</p>
              <p className="text-[9px] text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Register CTA */}
      {mode === 'register' && (
        <button
          onClick={startCountdown}
          disabled={!captureReady || countdown !== null}
          className={`w-full max-w-sm mt-4 py-4 rounded-2xl font-semibold text-[15px] transition-all duration-200 ${
            captureReady && countdown === null
              ? 'bg-[#4F8EF7] text-white shadow-lg shadow-blue-500/30 active:scale-95'
              : 'bg-[#1A1F30] text-slate-600 cursor-not-allowed'
          }`}
        >
          {countdown !== null ? `촬영까지 ${countdown}초...` : captureReady ? '📸 얼굴 등록하기' : '얼굴을 화면에 맞춰주세요'}
        </button>
      )}

      {/* No users warning */}
      {mode === 'auth' && (!storedUsers || storedUsers.length === 0) && (
        <div className="w-full max-w-sm mt-4 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-sm text-amber-400 font-medium">먼저 얼굴을 등록해주세요</p>
        </div>
      )}
    </div>
  )
}
