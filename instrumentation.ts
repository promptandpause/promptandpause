/**
 * Instrumentation file for Next.js 15.5+
 * 
 * This file is required by Next.js 15.5+ to register instrumentation hooks.
 * It runs once when the server starts.
 * 
 * Learn more: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // This function is called when the Next.js server starts
  // You can use it to register instrumentation hooks, monitoring, etc.
  
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    // Add any server-side monitoring or initialization here
    
    // Example: Initialize monitoring services
    // await initMonitoring();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    // Add any edge runtime specific initialization here
  }
}

// Optional: This function is called when an error occurs during server startup
export async function onRequestError(
  err: Error,
  request: {
    path: string;
    method: string;
    headers: Headers;
  }
) {
  // Log errors or send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // await errorTracker.captureException(err, { request });
  } else {
  }
}
