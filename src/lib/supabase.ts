import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(url, key)

/* ── DB types ─────────────────────────────────────────────── */
export interface FaceUserRow {
  id: string
  name: string
  descriptor: number[]   // float8[] from PostgreSQL
  created_at: string
}

export interface StoredUser {
  id: string
  name: string
  descriptor: Float32Array
}

/* ── Operations ───────────────────────────────────────────── */

/** 얼굴 등록: 이름 + 128차원 descriptor 저장 */
export async function saveFaceUser(name: string, descriptor: Float32Array) {
  const { data, error } = await supabase
    .from('face_users')
    .insert({ name, descriptor: Array.from(descriptor) })
    .select('id, name, created_at')
    .single()

  if (error) throw error
  return data
}

/** 전체 등록 사용자 로드 */
export async function loadFaceUsers(): Promise<StoredUser[]> {
  const { data, error } = await supabase
    .from('face_users')
    .select('id, name, descriptor')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as FaceUserRow[]).map(row => ({
    id: row.id,
    name: row.name,
    descriptor: new Float32Array(row.descriptor),
  }))
}

/** 특정 사용자 삭제 */
export async function deleteFaceUser(id: string) {
  const { error } = await supabase.from('face_users').delete().eq('id', id)
  if (error) throw error
}
