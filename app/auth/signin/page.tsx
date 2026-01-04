"use client"

import dynamic from 'next/dynamic';
import { LoginForm } from "../login-form";

const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((mod) => mod.DotLottieReact),
  { ssr: false }
);

export default function SignInPage() {
  return (
    <main className="w-screen h-screen flex">
      <div className="w-full lg:w-1/2 h-full" style={{backgroundColor: '#F2F0EF'}}>
        <LoginForm />
      </div>
      <div className="hidden lg:flex lg:w-1/2 h-full items-center justify-center bg-white">
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
