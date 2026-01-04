"use client"

import dynamic from 'next/dynamic';
import { SignupForm } from "./signup-form";

const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((mod) => mod.DotLottieReact),
  { ssr: false }
);

export default function SignUpPage() {
  return (
    <main className="w-screen h-screen flex">
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center" style={{backgroundColor: '#F2F0EF'}}>
        <SignupForm />
      </div>
      <div className="hidden lg:flex lg:w-1/2 h-full items-center justify-center bg-white">
        <DotLottieReact
          src="https://lottie.host/93f4b525-0660-4084-9412-b0d796d5e120/wo48rd1Ro4.lottie"
          loop
          autoplay
          style={{ width: '80%', height: '80%' }}
        />
      </div>
    </main>
  );
}
