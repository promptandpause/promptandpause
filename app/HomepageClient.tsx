"use client"

import dynamic from "next/dynamic"

const Homepage = dynamic(() => import("./(homepage)/page"), { ssr: false })

export default function HomepageClient() {
  return <Homepage />
}
