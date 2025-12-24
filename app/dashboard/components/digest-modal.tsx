"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { WeeklyDigest } from "@/lib/types/reflection"
import { Calendar, TrendingUp, Tag, FileText, Award } from "lucide-react"

interface DigestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  digest: WeeklyDigest
}

export default function DigestModal({ open, onOpenChange, digest }: DigestModalProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto backdrop-blur-xl bg-white/10 border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-orange-400" />
            Weekly Digest
          </DialogTitle>
          <p className="text-white/60 text-sm">
            {formatDate(digest.weekStart)} - {formatDate(digest.weekEnd)}
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-white/60 text-xs">Reflections</p>
                  <p className="text-2xl font-bold text-white">{digest.totalReflections}</p>
                </div>
              </div>
            </Card>
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-white/60 text-xs">Avg Words</p>
                  <p className="text-2xl font-bold text-white">{digest.averageWordCount}</p>
                </div>
              </div>
            </Card>
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-white/60 text-xs">Streak</p>
                  <p className="text-2xl font-bold text-white">{digest.currentStreak} 🔥</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Mood Distribution */}
          {digest.moodDistribution.length > 0 && (
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                😊 Mood Distribution
              </h3>
              <div className="space-y-3">
                {digest.moodDistribution.map(({ mood, count }) => {
                  const percentage = (count / digest.totalReflections) * 100
                  return (
                    <div key={mood} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{mood}</span>
                        <span className="text-white/60 text-sm">
                          {count} times ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Top Tags */}
          {digest.topTags.length > 0 && (
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-400" />
                Most Focused Areas
              </h3>
              <div className="flex gap-2 flex-wrap">
                {digest.topTags.map(({ tag, count }) => (
                  <Badge
                    key={tag}
                    className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-400/30 text-sm py-1 px-3"
                  >
                    {tag} <span className="ml-1 text-purple-300">×{count}</span>
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Reflection Summaries */}
          {digest.reflectionSummaries.length > 0 && (
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">
                This Week's Reflections
              </h3>
              <div className="space-y-3">
                {digest.reflectionSummaries.map((summary, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-white/60 text-xs">{formatDate(summary.date)}</p>
                    </div>
                    <p className="text-white font-medium italic text-sm mb-2">
                      "{summary.prompt}"
                    </p>
                    <p className="text-white/70 text-sm">{summary.snippet}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Empty State */}
          {digest.totalReflections === 0 && (
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-white/60 text-lg">
                No reflections this week yet. Start your journey today! 🌟
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
