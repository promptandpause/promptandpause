"use client"

import { useEffect } from 'react'

export default function ErrorHandler() {
  useEffect(() => {
    // Override JSON.parse to catch all calls with empty strings
    const originalParse = JSON.parse
    JSON.parse = function(text: string, reviver?: any) {
      if (text === '' || text === null || text === undefined) {
        console.error('🚨 JSON.parse called with empty/null value!')
        console.error('Stack trace:', new Error().stack)
        throw new SyntaxError('Unexpected token \'\', "" is not valid JSON')
      }
      if (typeof text === 'string' && text.trim() === '') {
        console.error('🚨 JSON.parse called with whitespace-only string!')
        console.error('Stack trace:', new Error().stack)
        throw new SyntaxError('Unexpected token \'\', "" is not valid JSON')
      }
      return originalParse.call(this, text, reviver)
    }

    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🔴 Unhandled Promise Rejection:', event.reason)
      console.error('Stack trace:', event.reason?.stack)
      // Prevent the default browser behavior
      event.preventDefault()
    }

    // Catch global errors
    const handleError = (event: ErrorEvent) => {
      console.error('🔴 Global Error:', event.error)
      console.error('Message:', event.message)
      console.error('Stack:', event.error?.stack)
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
