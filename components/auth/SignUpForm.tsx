"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { AlertCircle, Check, User, Mail, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import AgeVerification from "./AgeVerification"

export default function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: account info, 2: age verification, 3: success
  const [country, setCountry] = useState("US")
  const [ageVerified, setAgeVerified] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  // Auto-detect country on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/")
        const data = await response.json()
        
        if (data.country_code) {
          const mappedCountry = data.country_code === "GB" ? "UK" : data.country_code
          if (mappedCountry === "US" || mappedCountry === "UK") {
            setCountry(mappedCountry)
          }
        }
      } catch (error) {
        console.error("Failed to detect country:", error)
      }
    }
    
    detectCountry()
  }, [])

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Create account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            country_code: country,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Update profile with country
        await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            country_code: country,
          })
          .eq("id", data.user.id)

        setStep(2) // Move to age verification
      }
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAgeVerified = (data: { dateOfBirth: string; country: string; isCompliant: boolean }) => {
    setAgeVerified(true)
    setStep(3) // Move to success
  }

  if (step === 2) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold">Age Verification</h2>
          <p className="text-gray-600 mt-2">
            One last step to complete your registration
          </p>
        </div>
        
        <AgeVerification 
          onVerified={handleAgeVerified}
          initialCountry={country}
        />
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <Card className="p-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
          <p className="text-gray-600 mb-6">
            Your account has been created successfully. Please check your email to verify your address.
          </p>
          
          <Button onClick={() => router.push("/auth/signin")} className="w-full">
            Go to Sign In
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <Card className="p-6 w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-gray-600 mt-2">
            Join Prompt & Pause for daily reflection
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
            <span>🌍</span>
            <span>Detected: {country === "UK" ? "United Kingdom" : "United States"}</span>
          </div>
        </div>

        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

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
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Age Requirements</p>
                <p className="text-xs mt-1">
                  {country === "UK" ? "16+ years required in the UK" : "13+ years required in the US"}
                </p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button 
              onClick={() => router.push("/auth/signin")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </Card>
  )
}
