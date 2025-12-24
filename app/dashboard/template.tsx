"use client"

import PageTransition from "@/components/PageTransition"
import LoadingBar from "@/components/LoadingBar"

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <LoadingBar />
      <PageTransition>{children}</PageTransition>
    </>
  )
}
