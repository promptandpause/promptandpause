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
        // First try timezone-based detection
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (timezone.includes('Europe/London') || timezone.includes('Europe/Dublin')) {
          setCountry("UK")
          return
        }
        
        // Then try IP geolocation as fallback
        const response = await fetch("https://ipapi.co/json/", { 
          signal: AbortSignal.timeout(3000) // 3 second timeout
        })
        const data = await response.json()
        
        if (data.country_code) {
          // Map country codes to our supported regions
          const mappedCountry = data.country_code === "GB" ? "UK" : data.country_code
          if (mappedCountry === "US" || mappedCountry === "UK") {
            setCountry(mappedCountry)
          } else {
            // Default to UK for European countries, US for others
            setCountry(data.continent_code === "EU" ? "UK" : "US")
          }
        }
      } catch (error) {
        console.error("Failed to detect country:", error)
        // Use timezone as final fallback
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        setCountry(timezone.includes('Europe') ? "UK" : "US")
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

      // Update user preferences — upsert on user_id (not the default PK),
      // otherwise a pre-existing row triggers
      // "duplicate key value violates unique constraint user_preferences_user_id_key".
      const { error: prefError } = await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            age_consent_version: "2026.01",
            age_consent_accepted: true,
            age_consent_accepted_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )

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
      // Never leak raw DB / provider errors into the UI — keep the copy
      // human (Linear/Stripe tone) and funnel the details to server logs.
      console.error('age_verification_error', {
        message: error?.message,
      })
      toast({
        title: 'Verification didn\'t go through',
        description: "Give it another try in a moment — your details are still here.",
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#6FA984]" />
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
          className="text-[#6FA984] hover:text-[#5A8F6E]"
        >
          <Info className="h-4 w-4 mr-1" />
          Why we need this
        </Button>

        {showInfo && (
          <div className="p-3 bg-[#DCE6D9]/30 border border-[#DCE6D9] rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-[#6FA984] mt-0.5" />
              <div className="text-sm text-[#2F3B34]">
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
            <Label htmlFor="country">Country/Region</Label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-[#DCE6D9] bg-white focus:ring-2 focus:ring-[#6FA984]/30 focus:border-[#6FA984]"
              required
            >
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {country === "UK" ? "Age 16+ required" : "Age 13+ required"}
            </p>
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
