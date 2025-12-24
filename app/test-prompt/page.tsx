"use client"

import { useState } from "react"

const moods = ["😔", "😐", "😊", "😄", "🤔", "😌", "🙏", "💪"]
const tags = ["Gratitude", "Relationships", "Career", "Self-care"]

export default function TestPromptPage() {
  const [selectedMood, setSelectedMood] = useState("😊")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [clickCount, setClickCount] = useState(0)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-white text-2xl font-bold">Today's Prompt Test Page</h1>
        
        {/* Test Counter */}
        <div className="bg-white/10 p-4 rounded-lg">
          <p className="text-white mb-2">Click Test Counter: {clickCount}</p>
          <button
            type="button"
            onClick={() => setClickCount(c => c + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Click Me
          </button>
        </div>

        {/* Mood Selector Test */}
        <div className="bg-white/10 p-4 rounded-lg">
          <p className="text-white mb-4">Selected Mood: {selectedMood}</p>
          <div className="flex gap-2 flex-wrap">
            {moods.map(mood => (
              <button
                key={mood}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  console.log('Mood clicked:', mood)
                  setSelectedMood(mood)
                }}
                className={`text-2xl p-2 rounded-lg transition-all ${
                  selectedMood === mood
                    ? "bg-orange-500/30 ring-2 ring-orange-400"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Selector Test */}
        <div className="bg-white/10 p-4 rounded-lg">
          <p className="text-white mb-4">Selected Tags: {selectedTags.join(", ") || "None"}</p>
          <div className="flex gap-2 flex-wrap">
            {tags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  console.log('Tag clicked:', tag)
                  toggleTag(tag)
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-orange-500/40 text-white border-orange-400"
                    : "bg-white/10 text-white/80 border-white/20"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="text-white font-bold mb-2">Current State:</h3>
          <pre className="text-white/80 text-sm">
            {JSON.stringify({
              mood: selectedMood,
              tags: selectedTags,
              clickCount
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
