/**
 * Safe JSON parsing utilities to prevent "Unexpected token" errors
 */

/**
 * Safely parse JSON string, returning null if parsing fails or input is empty
 */
export function safeJsonParse<T = any>(jsonString: string | null | undefined): T | null {
  if (!jsonString || jsonString.trim() === '') {
    return null
  }

  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    return null
  }
}

/**
 * Safely parse JSON from a fetch Response
 * Returns null if response body is empty or parsing fails
 */
export async function safeResponseJson<T = any>(response: Response): Promise<T | null> {
  try {
    const text = await response.text()
    
    if (!text || text.trim() === '') {
      return null
    }

    return JSON.parse(text) as T
  } catch (error) {
    return null
  }
}

/**
 * Safely get and parse JSON from localStorage
 */
export function safeLocalStorageGet<T = any>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const item = localStorage.getItem(key)
    return safeJsonParse<T>(item)
  } catch (error) {
    return null
  }
}

/**
 * Safely set JSON to localStorage
 */
export function safeLocalStorageSet(key: string, value: any): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    return false
  }
}
