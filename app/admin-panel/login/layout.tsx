import { ReactNode } from 'react'

/**
 * Admin Login Layout
 * Minimal layout for admin login page - no sidebar, no auth check
 * This layout completely bypasses the parent admin-panel layout
 */
export default function AdminLoginLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
