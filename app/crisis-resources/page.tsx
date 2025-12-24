"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Globe, MessageCircle, Heart, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useTheme } from "@/contexts/ThemeContext"
import { BubbleBackground } from "@/components/ui/bubble-background"

export default function CrisisResourcesPage() {
  const { theme } = useTheme()
  
  return (
    <div className="min-h-screen relative" style={theme === 'light' ? { backgroundColor: '#F5F5DC' } : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' }}>
      {/* Animated Bubble Background */}
      <BubbleBackground 
        interactive
        className="fixed inset-0 -z-10"
      />
      {/* Themed background overlay */}
      <div className={`fixed inset-0 -z-10 ${
        theme === 'light' ? 'bg-[#F5F5DC]/60' : 'bg-black/20'
      }`} />

      <div className="relative z-10 p-3 sm:p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className={`mb-3 md:mb-4 text-sm md:text-base ${
                theme === 'dark'
                  ? 'text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/20'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-2 border-gray-300'
              }`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-white/80 border-2 border-gray-300'
          }`}>
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <div className={`p-2.5 sm:p-3 md:p-4 rounded-xl md:rounded-2xl flex-shrink-0 ${
                theme === 'dark'
                  ? 'bg-red-500/10 border border-red-400/30'
                  : 'bg-red-100 border-2 border-red-300'
              }`}>
                <Heart className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ${
                  theme === 'dark' ? 'text-red-400' : 'text-red-600'
                }`} />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold leading-tight ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Crisis Resources</h1>
                <p className={`text-sm sm:text-base md:text-lg mt-1 md:mt-2 ${
                  theme === 'dark' ? 'text-white/80' : 'text-gray-700'
                }`}>You are not alone. Help is available 24/7.</p>
              </div>
            </div>
            
            <div className={`rounded-xl md:rounded-2xl p-3 sm:p-4 mt-4 md:mt-6 ${
              theme === 'dark'
                ? 'bg-red-500/10 border border-red-400/30'
                : 'bg-red-50 border-2 border-red-400'
            }`}>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <AlertCircle className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 mt-0.5 ${
                  theme === 'dark' ? 'text-red-400' : 'text-red-600'
                }`} />
                <div className={theme === 'dark' ? 'text-red-200' : 'text-gray-900'}>
                  <p className="font-semibold mb-1 text-sm sm:text-base">If you are in immediate danger:</p>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    <strong>UK:</strong> Call 999 (Emergency Services) or go to your nearest A&E<br />
                    <strong>US:</strong> Call 911 (Emergency Services) or go to your nearest ER
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* UK Resources */}
        <div className="mb-6 md:mb-8">
          <h2 className={`text-xl sm:text-2xl font-bold mb-3 md:mb-4 px-1 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            United Kingdom Resources
          </h2>
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Samaritans */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all shadow-md ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0 ${
                  theme === 'dark'
                    ? 'bg-blue-500/10 border border-blue-400/30'
                    : 'bg-blue-100 border-2 border-blue-300'
                }`}>
                  <Phone className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg sm:text-xl font-semibold mb-1.5 md:mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Samaritans</h3>
                  <p className={`text-xs sm:text-sm mb-2.5 md:mb-3 ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}>24/7 emotional support for anyone in distress</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    <a href="tel:116123" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base active:text-blue-900">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">116 123 (Free)</span>
                    </a>
                    <a href="mailto:jo@samaritans.org" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-xs sm:text-sm active:text-blue-900">
                      <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">jo@samaritans.org</span>
                    </a>
                    <a href="https://www.samaritans.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-xs sm:text-sm active:text-blue-900">
                      <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">samaritans.org</span>
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Shout */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all shadow-md ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0 ${
                  theme === 'dark'
                    ? 'bg-purple-500/10 border border-purple-400/30'
                    : 'bg-purple-100 border-2 border-purple-300'
                }`}>
                  <MessageCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg sm:text-xl font-semibold mb-1.5 md:mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Shout</h3>
                  <p className={`text-xs sm:text-sm mb-2.5 md:mb-3 ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}>24/7 text support for mental health crises</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="text-purple-600 font-medium text-sm sm:text-base flex items-center gap-2">
                      <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="break-words">Text "SHOUT" to 85258 (Free)</span>
                    </div>
                    <a href="https://giveusashout.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-xs sm:text-sm active:text-purple-900">
                      <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">giveusashout.org</span>
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Mind */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all shadow-md ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0 ${
                  theme === 'dark'
                    ? 'bg-green-500/10 border border-green-400/30'
                    : 'bg-green-100 border-2 border-green-300'
                }`}>
                  <Heart className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg sm:text-xl font-semibold mb-1.5 md:mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Mind Infoline</h3>
                  <p className={`text-xs sm:text-sm mb-2.5 md:mb-3 ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}>Mental health information & support</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    <a href="tel:03001233393" className="flex items-center gap-2 text-green-600 hover:text-green-800 font-medium text-sm sm:text-base active:text-green-900">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">0300 123 3393</span>
                    </a>
                    <p className={`text-xs pl-5 sm:pl-6 ${
                      theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                    }`}>Mon-Fri: 9am-6pm</p>
                    <a href="https://www.mind.org.uk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 hover:text-green-800 text-xs sm:text-sm active:text-green-900">
                      <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">mind.org.uk</span>
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* NHS 111 */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all shadow-md ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0 ${
                  theme === 'dark'
                    ? 'bg-red-500/10 border border-red-400/30'
                    : 'bg-red-100 border-2 border-red-300'
                }`}>
                  <Phone className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    theme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg sm:text-xl font-semibold mb-1.5 md:mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>NHS 111</h3>
                  <p className={`text-xs sm:text-sm mb-2.5 md:mb-3 ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}>Non-emergency medical help & mental health support</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    <a href="tel:111" className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium text-sm sm:text-base active:text-red-900">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">111 (Free)</span>
                    </a>
                    <p className={`text-xs pl-5 sm:pl-6 ${
                      theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                    }`}>24/7 Service</p>
                    <a href="https://111.nhs.uk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-red-600 hover:text-red-800 text-xs sm:text-sm active:text-red-900">
                      <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">111.nhs.uk</span>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* US Resources */}
        <div className="mb-6 md:mb-8">
          <h2 className={`text-xl sm:text-2xl font-bold mb-3 md:mb-4 px-1 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            United States Resources
          </h2>
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* 988 Suicide & Crisis Lifeline */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all shadow-md ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0 ${
                  theme === 'dark'
                    ? 'bg-blue-500/10 border border-blue-400/30'
                    : 'bg-blue-100 border-2 border-blue-300'
                }`}>
                  <Phone className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg sm:text-xl font-semibold mb-1.5 md:mb-2 leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>988 Suicide & Crisis Lifeline</h3>
                  <p className={`text-xs sm:text-sm mb-2.5 md:mb-3 ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}>24/7 suicide prevention and crisis support</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    <a href="tel:988" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-base sm:text-lg active:text-blue-900">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="truncate">988 (Call or Text)</span>
                    </a>
                    <a href="https://988lifeline.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-xs sm:text-sm active:text-blue-900">
                      <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">988lifeline.org</span>
                    </a>
                    <p className={`text-xs pl-5 sm:pl-6 ${
                      theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                    }`}>Available in English & Spanish</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Crisis Text Line */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all shadow-md ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0 ${
                  theme === 'dark'
                    ? 'bg-purple-500/10 border border-purple-400/30'
                    : 'bg-purple-100 border-2 border-purple-300'
                }`}>
                  <MessageCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg sm:text-xl font-semibold mb-1.5 md:mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Crisis Text Line</h3>
                  <p className={`text-xs sm:text-sm mb-2.5 md:mb-3 ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}>24/7 text support for people in crisis</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="text-purple-600 font-medium text-sm sm:text-base flex items-center gap-2">
                      <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="break-words">Text "HELLO" to 741741 (Free)</span>
                    </div>
                    <a href="https://www.crisistextline.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-xs sm:text-sm active:text-purple-900">
                      <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">crisistextline.org</span>
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* NAMI Helpline */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all shadow-md ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0 ${
                  theme === 'dark'
                    ? 'bg-green-500/10 border border-green-400/30'
                    : 'bg-green-100 border-2 border-green-300'
                }`}>
                  <Heart className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg sm:text-xl font-semibold mb-1.5 md:mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>NAMI HelpLine</h3>
                  <p className={`text-xs sm:text-sm mb-2.5 md:mb-3 ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}>Mental health information, referrals & support</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    <a href="tel:1-800-950-6264" className="flex items-center gap-2 text-green-600 hover:text-green-800 font-medium text-sm sm:text-base active:text-green-900">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">1-800-950-NAMI (6264)</span>
                    </a>
                    <p className={`text-xs pl-5 sm:pl-6 ${
                      theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                    }`}>Mon-Fri: 10am-10pm ET</p>
                    <a href="https://www.nami.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 hover:text-green-800 text-xs sm:text-sm active:text-green-900">
                      <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">nami.org</span>
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Veterans Crisis Line */}
            <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all shadow-md ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/80 border-2 border-gray-300'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0 ${
                  theme === 'dark'
                    ? 'bg-red-500/10 border border-red-400/30'
                    : 'bg-red-100 border-2 border-red-300'
                }`}>
                  <Phone className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    theme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg sm:text-xl font-semibold mb-1.5 md:mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Veterans Crisis Line</h3>
                  <p className={`text-xs sm:text-sm mb-2.5 md:mb-3 ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}>24/7 support for veterans & their families</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    <a href="tel:988" className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium text-sm sm:text-base active:text-red-900">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">988 then Press 1</span>
                    </a>
                    <div className="text-red-600 text-xs sm:text-sm flex items-center gap-2">
                      <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Text 838255</span>
                    </div>
                    <a href="https://www.veteranscrisisline.net" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-red-600 hover:text-red-800 text-xs sm:text-sm active:text-red-900">
                      <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">veteranscrisisline.net</span>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Additional Support */}
        <Card className={`backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg ${
          theme === 'dark'
            ? 'bg-white/5 border border-white/10'
            : 'bg-white/80 border-2 border-gray-300'
        }`}>
          <h2 className={`text-xl sm:text-2xl font-bold mb-3 md:mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Remember</h2>
          <div className={`space-y-3 sm:space-y-4 text-sm sm:text-base ${
            theme === 'dark' ? 'text-white/80' : 'text-gray-700'
          }`}>
            <p className="flex items-start gap-2.5 sm:gap-3">
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 ${
                theme === 'dark' ? 'text-pink-400' : 'text-pink-600'
              }`} />
              <span>You are not alone. Millions of people experience mental health challenges, and help is available.</span>
            </p>
            <p className="flex items-start gap-2.5 sm:gap-3">
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 ${
                theme === 'dark' ? 'text-pink-400' : 'text-pink-600'
              }`} />
              <span>Reaching out for help is a sign of strength, not weakness.</span>
            </p>
            <p className="flex items-start gap-2.5 sm:gap-3">
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 ${
                theme === 'dark' ? 'text-pink-400' : 'text-pink-600'
              }`} />
              <span>These feelings are temporary. With the right support, things can and will get better.</span>
            </p>
            <p className="flex items-start gap-2.5 sm:gap-3">
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 ${
                theme === 'dark' ? 'text-pink-400' : 'text-pink-600'
              }`} />
              <span>All of these services are confidential and free to use.</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
