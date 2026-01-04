"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { AlertCircle, Mail, Lock, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import AgeVerification from "./AgeVerification"

export default function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [needsAgeVerification, setNeedsAgeVerification] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Check if user has completed age verification
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profile && (!profile.age_verified || !profile.region_compliance)) {
          setUserProfile(profile)
          setNeedsAgeVerification(true)
          return
        }

        // Redirect to dashboard
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAgeVerified = async (data: { dateOfBirth: string; country: string; isCompliant: boolean }) => {
    try {
      // Redirect to dashboard after successful verification
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Verification Complete",
        description: "Age verification completed. Redirecting to dashboard...",
      })
      setTimeout(() => router.push("/dashboard"), 1000)
    }
  }

  if (needsAgeVerification) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Age Verification Required</h2>
          </div>
          <p className="text-gray-600">
            Please complete age verification to access your account
          </p>
        </div>
        
        <AgeVerification 
          onVerified={handleAgeVerified}
          initialCountry={userProfile?.country_code || "US"}
        />
      </div>
    )
  }

  return (
    <Card className="p-6 w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-gray-600 mt-2">
            Sign in to your Prompt & Pause account
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-3 w-3 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="space-y-3 text-center">
          <div>
            <button 
              onClick={() => router.push("/auth/forgot-password")}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Forgot your password?
            </button>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button 
                onClick={() => router.push("/auth/signup")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
