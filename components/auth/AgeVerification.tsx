"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { AlertCircle, Info, Calendar, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

interface AgeVerificationProps {
  onVerified: (data: { dateOfBirth: string; country: string; isCompliant: boolean }) => void
  initialCountry?: string
}

export default function AgeVerification({ onVerified, initialCountry = "US" }: AgeVerificationProps) {
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [country, setCountry] = useState(initialCountry)
  const [showInfo, setShowInfo] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  // Auto-detect country on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Use a simple IP geolocation service
        const response = await fetch("https://ipapi.co/json/")
        const data = await response.json()
        
        if (data.country_code) {
          // Map country codes to our supported regions
          const mappedCountry = data.country_code === "GB" ? "UK" : data.country_code
          if (mappedCountry === "US" || mappedCountry === "UK") {
            setCountry(mappedCountry)
          }
        }
      } catch (error) {
        console.error("Failed to detect country:", error)
        // Keep default country
      }
    }
    
    detectCountry()
  }, [])

  const getMinimumAge = () => {
    return country === "UK" ? 16 : 13
  }

  const getAgeText = () => {
    const minAge = getMinimumAge()
    if (country === "UK") {
      return `You must be at least ${minAge} years old to use Prompt & Pause in the United Kingdom.`
    }
    return `You must be at least ${minAge} years old to use Prompt & Pause in the United States.`
  }

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dateOfBirth || !consentAccepted) {
      toast({
        title: "Missing Information",
        description: "Please provide your date of birth and accept the age verification.",
        variant: "destructive"
      })
      return
    }

    const age = calculateAge(dateOfBirth)
    const minAge = getMinimumAge()

    if (age < minAge) {
      toast({
        title: "Age Requirement Not Met",
        description: `You must be at least ${minAge} years old to use this service.`,
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Update profile with age verification
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          date_of_birth: dateOfBirth,
          country_code: country,
          age_verified: true,
          region_compliance: true,
          age_consent_accepted: true,
          age_consent_accepted_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Update user preferences
      const { error: prefError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          age_consent_version: "2026.01",
          age_consent_accepted: true,
          age_consent_accepted_at: new Date().toISOString(),
        })

      if (prefError) throw prefError

      toast({
        title: "Age Verified",
        description: "Your age has been verified successfully.",
      })

      onVerified({
        dateOfBirth,
        country,
        isCompliant: true
      })

    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify age. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Age Verification</h3>
        </div>

        <div className="text-sm text-gray-600">
          {getAgeText()}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowInfo(!showInfo)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Info className="h-4 w-4 mr-1" />
          Why we need this
        </Button>

        {showInfo && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Age Verification Requirements</p>
                <p className="mb-2">
                  We comply with privacy laws that require age verification:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>UK/EU:</strong> 16+ years (Data Protection Act 2018)</li>
                  <li><strong>US:</strong> 13+ years (COPPA compliance)</li>
                  <li>Your date of birth is stored securely and used only for age verification</li>
                  <li>This helps us provide appropriate privacy protections</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="country">Detected Country</Label>
            <Input
              id="country"
              value={country === "UK" ? "United Kingdom" : "United States"}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="consent"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-1"
              required
            />
            <Label htmlFor="consent" className="text-sm">
              I confirm that I have provided my correct date of birth and understand that this information 
              will be used to verify my age in accordance with applicable privacy laws.
            </Label>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !dateOfBirth || !consentAccepted}
            className="w-full"
          >
            {isSubmitting ? "Verifying..." : "Verify Age"}
          </Button>
        </form>
      </div>
    </Card>
  )
}
