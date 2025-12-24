import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Onboarding - Get Started',
  description: 'Complete your Prompt & Pause profile to personalize your daily reflection experience.',
  robots: { index: false, follow: false },
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children
}
