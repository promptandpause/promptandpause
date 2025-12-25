import ErrorHandler from '../error-handler'

export default function HomepageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ErrorHandler />
      {children}
    </>
  )
}

