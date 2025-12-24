// Simple crypto helpers for optional app-layer encryption (server-only)
// AES-256-GCM with base64 payload format: enc:v1:{ivBase64}:{ciphertextBase64}:{tagBase64}
// Only decrypts when ENCRYPTION_KEY is set and the payload has the enc:v1 prefix.

import crypto from 'crypto'

function getKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY
  if (!key) return null
  // Accept 32-byte hex or base64; fallback to utf-8 padded
  try {
    if (/^[0-9a-fA-F]{64}$/.test(key)) return Buffer.from(key, 'hex')
    const b64 = Buffer.from(key, 'base64')
    if (b64.length === 32) return b64
  } catch {}
  const buf = Buffer.alloc(32)
  Buffer.from(key).copy(buf)
  return buf
}

export function isEncrypted(value?: string | null): boolean {
  return !!value && value.startsWith('enc:v1:')
}

export function encryptIfPossible(plaintext: string): string {
  const key = getKey()
  if (!key) return plaintext
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `enc:v1:${iv.toString('base64')}:${enc.toString('base64')}:${tag.toString('base64')}`
}

export function decryptIfEncrypted(value?: string | null): string | null {
  if (!isEncrypted(value)) return value ?? null
  const key = getKey()
  if (!key) return value ?? null
  try {
    const parts = (value as string).split(':')
    const iv = Buffer.from(parts[2], 'base64')
    const data = Buffer.from(parts[3], 'base64')
    const tag = Buffer.from(parts[4], 'base64')
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    const dec = Buffer.concat([decipher.update(data), decipher.final()])
    return dec.toString('utf8')
  } catch {
    return value ?? null
  }
}
