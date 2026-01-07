"use client"

import { LoginForm } from "../login-form";

export default function SignInPage() {
  return (
    <main className="w-screen h-screen flex">
      <div className="relative w-full lg:w-1/2 h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#07121a] via-[#081820] to-[#143521]">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 w-full max-w-sm px-4">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-2xl sm:p-8">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 h-full items-center justify-center bg-black">
        <div className="w-4/5 h-4/5 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent" />
      </div>
    </main>
  );
}
