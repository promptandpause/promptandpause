"use client"

import { useEffect, useRef } from "react"

export function GradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl")
    if (!gl) {
      return
    }

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    gl.viewport(0, 0, canvas.width, canvas.height)

    // Full vertex/fragment shader code and GL setup here (as from prototype)
    // ... (omitted for brevity, but to be pasted from your prototype directly)
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

export default GradientCanvas;
