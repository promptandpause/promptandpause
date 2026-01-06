"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button";
import { generateWeeklyDigest } from "@/lib/services/analyticsService"
import { WeeklyDigest as WeeklyDigestType } from "@/lib/types/reflection"
import { getSupabaseClient } from "@/lib/supabase/client"
import DigestModal from "./digest-modal"

export default function WeeklyDigest() {
  const [digest, setDigest] = useState<WeeklyDigestType | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const supabase = getSupabaseClient()
  
  useEffect(() => {
    let isMounted = true

    // Load weekly digest data
    async function loadDigest() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        const weeklyData = await generateWeeklyDigest(user.id)
        if (isMounted) {
          setDigest(weeklyData)
        }
      } catch (error) {
      }
    }

    loadDigest()
    return () => { isMounted = false }
  }, [supabase])
  
  if (!digest) return null
  
  return (
    <>
      <section className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-7 flex flex-col gap-3 transition-all duration-700 ease-out hover:scale-[1.01] hover:bg-white/15">
        <h4 className="font-semibold text-white text-base mb-1">Weekly Digest Preview</h4>
        <div className="mb-3 text-white/80 text-sm flex flex-col gap-2">
          {digest.totalReflections > 0 ? (
            <>
              <div>Your week in reflection...</div>
              {digest.topTags.length > 0 && (
                <div>
                  You focused most on:{" "}
                  {digest.topTags.slice(0, 2).map((tag, index) => (
                    <span key={tag.tag}>
                      <span className={index === 0 ? "font-bold text-orange-400" : "font-bold text-blue-400"}>
                        {tag.tag} ({tag.count}x)
                      </span>
                      {index < Math.min(digest.topTags.length, 2) - 1 && ", "}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-white/60">
                {digest.totalReflections} reflections • {digest.averageWordCount} avg words
              </div>
            </>
          ) : (
            <div className="text-white/60">No reflections this week yet. Start your journey today! 🌟</div>
          )}
        </div>
        <Button 
          variant="outline" 
          className="self-end border-white/20 text-white bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
          onClick={() => setModalOpen(true)}
        >
          View Full Digest
        </Button>
      </section>
      
      <DigestModal 
        open={modalOpen}
        onOpenChange={setModalOpen}
        digest={digest}
      />
    </>
  )
}
