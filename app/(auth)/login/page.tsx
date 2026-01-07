"use client"

import { LoginForm } from "../_components/login-form";
import { AuthLottie } from "../_components/auth-lottie";

export default function LoginPage() {
  return (
    <main className="w-screen h-screen flex">
      <div className="relative w-full lg:w-1/2 h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#07121a] via-[#081820] to-[#143521]">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 w-full max-w-sm px-4">
          <div className="mb-6 flex flex-col items-center text-center">
            <a href="https://www.promptandpause.com" className="inline-flex hover:opacity-90 transition-opacity">
              <img
                src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
                alt="Prompt & Pause"
                className="h-10 w-auto invert"
              />
            </a>
            <p className="mt-2 text-xs font-medium tracking-wide text-white/70">Pause. Reflect. Grow.</p>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-2xl sm:p-8">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 h-full items-center justify-center bg-black">
        <AuthLottie
          src="/lottie/Work and life balance.json"
          className="w-full max-w-xl px-10"
        />
      </div>
    </main>
  );
}
