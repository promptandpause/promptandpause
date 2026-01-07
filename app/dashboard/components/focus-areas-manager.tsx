"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"
import { 
  Plus, 
  X, 
  Target, 
  TrendingUp,
  Heart,
  Briefcase,
  Users,
  Sparkles,
  Edit2,
  Trash2,
  Save,
  Loader2,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface FocusArea {
  id: string
  name: string
  description: string
  icon: string
  color: string
  reflectionCount?: number
  createdAt: string
}

const PRESET_ICONS = ['💼', '❤️', '🏋️', '🎨', '👥', '🌱', '💰', '🧠', '🏠', '✈️']
const PRESET_COLORS = [
  'from-red-500/20 to-pink-500/20 border-red-400/30',
  'from-blue-500/20 to-cyan-500/20 border-blue-400/30',
  'from-green-500/20 to-emerald-500/20 border-green-400/30',
  'from-purple-500/20 to-pink-500/20 border-purple-400/30',
  'from-orange-500/20 to-yellow-500/20 border-orange-400/30',
  'from-indigo-500/20 to-blue-500/20 border-indigo-400/30',
]

// Generate example prompts based on focus area name
function getExamplePrompt(focusAreaName: string): string {
  const name = focusAreaName.toLowerCase()
  
  // Career/Work related
  if (name.includes('work') || name.includes('responsibility') || name.includes('job') || name.includes('professional')) {
    return 'Where did you spend more energy than you expected this week?'
  }
  
  // Relationships
  if (name.includes('relationship') || name.includes('love') || name.includes('family') || name.includes('friend')) {
    return 'Which relationship has been taking up the most space in your mind lately?'
  }
  
  // Health/Fitness
  if (name.includes('ground') || name.includes('steady') || name.includes('present')) {
    return 'Right now, what’s one small thing you can notice that tells you you’re here?'
  }
  
  // Mental health/anxiety
  if (name.includes('emotion') || name.includes('balance') || name.includes('regulat') || name.includes('calm')) {
    return 'What feeling has been most present lately, without trying to explain it away?'
  }
  
  // Self-care/wellbeing
  if (name.includes('clarity') || name.includes('clear') || name.includes('decision') || name.includes('overload')) {
    return 'What feels most unclear right now — and what feels certain enough to stand on?'
  }

  // Creativity/hobbies
  if (name.includes('change') || name.includes('uncertain') || name.includes('transition') || name.includes('unknown')) {
    return 'What feels unsettled right now — and what would count as “enough clarity for today”?'
  }
  
  // Default for other topics
  return `What feels most worth naming in your ${focusAreaName} right now?`
}

export default function FocusAreasManager() {
  const { theme } = useTheme()
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<FocusArea | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0])
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])

  useEffect(() => {
    fetchFocusAreas()
  }, [])

  const fetchFocusAreas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/premium/focus-areas')
      const result = await response.json()

      if (result.success) {
        setFocusAreas(result.data)
      } else if (result.requiresPremium) {
        return // User not premium
      }
    } catch (error) {
      toast.error('Failed to load focus areas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for your focus area')
      return
    }

    try {
      const response = await fetch('/api/premium/focus-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          icon: selectedIcon,
          color: selectedColor,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setFocusAreas([...focusAreas, result.data])
        resetForm()
        setIsDialogOpen(false)
        toast.success('Focus area created!')
      } else {
        toast.error(result.error || 'Failed to create focus area')
      }
    } catch (error) {
      toast.error('Failed to create focus area')
    }
  }

  const handleUpdate = async () => {
    if (!editingArea || !name.trim()) return

    try {
      const response = await fetch(`/api/premium/focus-areas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingArea.id,
          name: name.trim(),
          description: description.trim(),
          icon: selectedIcon,
          color: selectedColor,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setFocusAreas(focusAreas.map(area => 
          area.id === editingArea.id ? result.data : area
        ))
        resetForm()
        setIsDialogOpen(false)
        toast.success('Focus area updated!')
      } else {
        toast.error(result.error || 'Failed to update focus area')
      }
    } catch (error) {
      toast.error('Failed to update focus area')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this focus area?')) return

    try {
      const response = await fetch(`/api/premium/focus-areas`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()

      if (result.success) {
        setFocusAreas(focusAreas.filter(area => area.id !== id))
        toast.success('Focus area deleted')
      } else {
        toast.error(result.error || 'Failed to delete focus area')
      }
    } catch (error) {
      toast.error('Failed to delete focus area')
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setEditingArea(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (area: FocusArea) => {
    setEditingArea(area)
    setName(area.name)
    setDescription(area.description)
    setSelectedIcon(area.icon)
    setSelectedColor(area.color)
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setSelectedIcon(PRESET_ICONS[0])
    setSelectedColor(PRESET_COLORS[0])
    setEditingArea(null)
  }

  if (loading) {
    return (
      <section className={`rounded-2xl md:rounded-3xl p-6 flex items-center justify-center min-h-[300px] transition-all duration-200 ${
        theme === 'dark'
          ? 'glass-light shadow-soft-lg'
          : 'glass-medium shadow-soft-md'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          <p className={theme === 'dark' ? 'text-white/60 text-sm' : 'text-gray-500 text-sm'}>Loading focus areas...</p>
        </div>
      </section>
    )
  }

  return (
    <section className={`rounded-2xl md:rounded-3xl p-5 md:p-6 transition-all duration-200 ${
      theme === 'dark'
        ? 'glass-light shadow-soft-lg bg-gradient-to-br from-[#C8B8D8]/10 to-[#B8C8E8]/10 border border-[#C8B8D8]/20'
        : 'glass-medium shadow-soft-md bg-gradient-to-br from-[#C8B8D8]/15 to-[#B8C8E8]/15 border border-[#C8B8D8]/25'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <h4 className={`font-bold text-base truncate mb-0.5 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Focus Areas
            </h4>
            <p className={`text-[11px] ${
              theme === 'dark' ? 'text-white/60' : 'text-gray-400'
            }`}>
              {focusAreas.length} {focusAreas.length === 1 ? 'area' : 'areas'} active
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              size="sm"
              className={`shadow-md hover:shadow-lg transition-all flex-shrink-0 h-9 px-3 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 border border-purple-400/30'
                  : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-700 border border-purple-400/40'
              }`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white backdrop-blur-xl border-3 border-gray-400 text-gray-900 max-h-[90vh] sm:max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl">
            {/* Header with gradient */}
            <div className="relative p-6 pb-5 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-transparent border-b-2 border-gray-300 flex-shrink-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/15 rounded-full blur-3xl" />
              <div className="relative">
                <DialogTitle className="text-gray-900 text-2xl md:text-3xl font-extrabold mb-2">
                  {editingArea ? 'Edit Focus Area' : 'Create Focus Area'}
                </DialogTitle>
                <DialogDescription className="text-gray-700 text-sm font-medium">
                  {editingArea 
                    ? 'Update your focus area details below'
                    : 'Define a personal area to track in your reflections'}
                </DialogDescription>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {/* Name Input */}
              <div className="space-y-2">
                <Label className="text-gray-900 text-sm font-semibold flex items-center gap-2">
                  <span className="text-purple-400">●</span>
                  Focus Area Name *
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Clarity, Grounding, Work & Responsibility"
                  className="bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 h-12 text-base rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                  maxLength={50}
                />
                <p className="text-xs text-gray-400">{name.length}/50 characters</p>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <Label className="text-gray-900 text-sm font-semibold flex items-center gap-2">
                  <span className="text-blue-400">●</span>
                  Description
                  <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a brief description of this focus area"
                  className="bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 h-12 text-base rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                  maxLength={100}
                />
                <p className="text-xs text-gray-400">{description.length}/100 characters</p>
              </div>

              {/* Icon Selection */}
              <div className="space-y-3">
                <Label className="text-gray-900 text-sm font-semibold flex items-center gap-2">
                  <span className="text-yellow-400">●</span>
                  Choose an Icon
                </Label>
                <div className="grid grid-cols-5 gap-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 shadow-inner">
                  {PRESET_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`aspect-square flex items-center justify-center text-3xl rounded-xl transition-all duration-200 ${
                        selectedIcon === icon
                          ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-3 border-purple-500 scale-110 shadow-xl shadow-purple-500/40 ring-2 ring-purple-300'
                          : 'bg-white border-2 border-gray-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-white hover:border-gray-400 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme Selection */}
              <div className="space-y-3">
                <Label className="text-gray-900 text-sm font-semibold flex items-center gap-2">
                  <span className="text-pink-400">●</span>
                  Pick a Color Theme
                </Label>
                <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 shadow-inner">
                  {PRESET_COLORS.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`aspect-square rounded-xl bg-gradient-to-br ${color} transition-all duration-200 relative border-2 ${
                        selectedColor === color
                          ? 'ring-4 ring-purple-400 scale-110 shadow-2xl border-white'
                          : 'ring-2 ring-gray-200 hover:ring-gray-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg border-gray-200'
                      }`}
                    >
                      {selectedColor === color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-gray-200">
                            <Check className="w-5 h-5 text-gray-900 stroke-[3]" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Card */}
              <div className="space-y-2 pb-2">
                <Label className="text-gray-900 text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Preview
                </Label>
                <div className={`p-4 rounded-xl bg-gradient-to-br ${selectedColor} border backdrop-blur-sm`}>
                  <div className="text-3xl mb-2">{selectedIcon}</div>
                  <h5 className="text-gray-900 font-semibold text-base mb-1">
                    {name || 'Your Focus Area'}
                  </h5>
                  {description && (
                    <p className="text-gray-600 text-xs line-clamp-2">
                      {description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                    <TrendingUp className="h-3 w-3" />
                    <span>0 reflections</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer Buttons */}
            <div className="flex-shrink-0 p-6 pt-5 border-t-2 border-gray-300 bg-gradient-to-t from-gray-50 to-white">
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  variant="outline"
                  className="flex-1 sm:flex-none sm:w-36 bg-white border-2 border-gray-400 text-gray-900 hover:bg-gray-50 hover:border-gray-500 font-semibold h-12 text-base rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingArea ? handleUpdate : handleCreate}
                  disabled={!name.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold h-12 text-base rounded-xl shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all hover:scale-[1.02]"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {editingArea ? 'Update Focus Area' : 'Create Focus Area'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Focus Areas List */}
      {focusAreas.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 flex items-center justify-center">
            <Target className="h-8 w-8 text-purple-300/60" />
          </div>
          <p className={`text-sm mb-1 font-medium ${
            theme === 'dark' ? 'text-white/60' : 'text-gray-400'
          }`}>
            No focus areas yet
          </p>
          <p className={`text-xs mb-4 ${
            theme === 'dark' ? 'text-white/30' : 'text-gray-400'
          }`}>
            Create your first one to get started
          </p>
          <Button
            onClick={openCreateDialog}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-gray-900 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Focus Area
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {focusAreas.map((area, index) => (
              <motion.div
                key={area.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                className={`backdrop-blur-xl bg-gradient-to-br ${area.color} rounded-xl p-4 relative group hover:shadow-lg transition-all duration-300 cursor-pointer border`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0">{area.icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h5 className={`font-semibold text-sm mb-0.5 truncate pr-16 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {area.name}
                    </h5>
                    {area.description && (
                      <p className={`text-[11px] mb-2 line-clamp-1 ${
                        theme === 'dark' ? 'text-white/60' : 'text-gray-500'
                      }`}>
                        {area.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className={`flex items-center gap-1.5 text-[10px] ${
                      theme === 'dark' ? 'text-white/50' : 'text-gray-400'
                    }`}>
                      <TrendingUp className="h-3 w-3" />
                      <span>{area.reflectionCount || 0} reflection{area.reflectionCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditDialog(area)
                      }}
                      size="sm"
                      variant="ghost"
                      className={`h-7 w-7 p-0 rounded-lg ${
                        theme === 'dark'
                          ? 'hover:bg-white/20 text-white'
                          : 'hover:bg-white/40 text-gray-900'
                      }`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(area.id)
                      }}
                      size="sm"
                      variant="ghost"
                      className={`h-7 w-7 p-0 rounded-lg ${
                        theme === 'dark'
                          ? 'hover:bg-red-500/30 text-red-300'
                          : 'hover:bg-red-500/20 text-red-600'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Helpful Tips */}
      <div className="space-y-2.5 mt-4">
        {/* How it works */}
        <div className={`p-3.5 rounded-xl backdrop-blur-sm ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-400/20'
            : 'bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200'
        }`}>
          <div className="flex items-start gap-2.5">
            <div className="text-lg flex-shrink-0 mt-0.5">✨</div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold mb-1 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                How Focus Areas Work
              </p>
              <p className={`text-[11px] leading-relaxed ${
                theme === 'dark' ? 'text-white/70' : 'text-gray-600'
              }`}>
                Your focus areas <strong>personalize your daily AI prompts</strong>. The AI learns what matters to you and creates prompts specifically about these topics.
              </p>
            </div>
          </div>
        </div>

        {/* Example */}
        {focusAreas.length > 0 && (
          <div className={`p-3.5 rounded-xl backdrop-blur-sm ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20'
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
          }`}>
            <div className="flex items-start gap-2.5">
              <div className="text-lg flex-shrink-0 mt-0.5">💡</div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Your Prompts Are Personalized
                </p>
                <p className={`text-[11px] leading-relaxed mb-2 ${
                  theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  With focus area "<span className="font-semibold text-purple-400">{focusAreas[0].name}</span>", you might get prompts like:
                </p>
                <div className={`text-[11px] italic pl-2.5 border-l-2 ${
                  theme === 'dark' ? 'border-purple-400/40 text-white/60' : 'border-purple-300 text-gray-500'
                }`}>
                  "{getExamplePrompt(focusAreas[0].name)}"
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
