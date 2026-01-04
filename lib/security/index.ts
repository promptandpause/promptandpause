/**
 * Security Module Index
 * 
 * Central export point for all security utilities.
 */

export { applySecurityHeaders, getSecurityHeadersObject } from './securityHeaders'
export type { SecurityHeadersConfig } from './securityHeaders'

export { 
  generateCSRFToken, 
  verifyCSRFToken, 
  validateCSRFRequest, 
  addCSRFTokenToResponse,
  getCSRFToken,
  withCSRFProtection,
  getCSRFTokenFromCookie,
  getCSRFHeaders,
} from './csrf'

export { SecurityLogger } from './securityLogger'
export type { SecurityEvent, SecurityEventType, SecurityEventSeverity } from './securityLogger'

export { InputSanitizer } from './sanitizer'

export { AccountLockout } from './accountLockout'
export type { LockoutConfig } from './accountLockout'

export { IPProtection } from './ipProtection'
export type { IPInfo, IPCheckResult } from './ipProtection'

export { 
  secureFetch, 
  securePost, 
  securePut, 
  secureDelete, 
  securePatch,
  getCSRFToken as getClientCSRFToken,
} from './secureFetch'
