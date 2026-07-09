"use client"

import { PencilLine } from "phosphor-react"
import { ModuleErrorBoundary } from "./ModuleShell"
import dynamic from "next/dynamic"

const TodaysPrompt = dynamic(() => import("../components/todays-prompt"), { ssr: false })

export function PromptModule() {
  return (
    <ModuleErrorBoundary>
      <TodaysPrompt />
    </ModuleErrorBoundary>
  )
}
