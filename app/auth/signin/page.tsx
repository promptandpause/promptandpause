"use client"

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { LoginForm } from "../login-form";

export default function SignInPage() {
  return (
    <main className="w-screen h-screen flex" style={{ background: 'linear-gradient(135deg, #FDFAF5 0%, #F5F5DC 50%, #EAE8E0 100%)' }}>
      <div className="w-full lg:w-1/2 h-full" style={{ background: 'linear-gradient(180deg, #FDFAF5 0%, #F5F5DC 100%)' }}>
        <LoginForm />
      </div>
      <div className="hidden lg:flex lg:w-1/2 h-full items-center justify-center" style={{ background: 'linear-gradient(135deg, #FDFAF5 0%, #EAE8E0 100%)' }}>
        <DotLottieReact
          src="https://lottie.host/2dcd8b98-5feb-4f95-baca-5552a6eb4b1f/s3mk2bKMoJ.lottie"
          loop
          autoplay
          style={{ width: '80%', height: '80%' }}
        />
      </div>
    </main>
  );
}
