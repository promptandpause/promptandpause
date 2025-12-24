"use client"

import { useEffect } from 'react'

export default function ErrorHandler() {
  useEffect(() => {
    // Override JSON.parse to catch all calls with empty strings
    const originalParse = JSON.parse
    JSON.parse = function(text: string, reviver?: any) {
      if (text === '' || text === null || text === undefined) {
        throw new SyntaxError('Unexpected token \'\', "" is not valid JSON')
      }
      if (typeof text === 'string' && text.trim() === '') {
        throw new SyntaxError('Unexpected token \'\', "" is not valid JSON')
      }
      return originalParse.call(this, text, reviver)
    }

    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent the default browser behavior
      event.preventDefault()
    }

    // Catch global errors
    const handleError = (event: ErrorEvent) => {
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      JSON.parse = originalParse
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null
}
