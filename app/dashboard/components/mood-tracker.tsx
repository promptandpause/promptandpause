"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabaseMoodService, supabaseReflectionService, supabaseAnalyticsService } from "@/lib/services/supabaseReflectionService";
import { MoodType } from "@/lib/types/reflection";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { IconOrb } from "@/components/ui/accent-card";
import { Sparkle, Flame } from "phosphor-react";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getMoodColor = (mood?: MoodType) => {
  if (!mood) return "bg-[#EFF3F4]";
  const happyMoods: MoodType[] = ["😊", "😄", "🙏"];
  const neutralMoods: MoodType[] = ["😐", "🤔"];
  const sadMoods: MoodType[] = ["😔"];
  const calmMoods: MoodType[] = ["😌"];
  const strongMoods: MoodType[] = ["💪"];
  
  if (happyMoods.includes(mood)) return "bg-[#D1FAE5]";
  if (calmMoods.includes(mood)) return "bg-[#C4B5FD]";
  if (strongMoods.includes(mood)) return "bg-[#DDD6FE]";
  if (neutralMoods.includes(mood)) return "bg-[#FDE68A]";
  if (sadMoods.includes(mood)) return "bg-[#FCA5A5]";
  return "bg-[#FCE7F3]";
};

interface WeekDay {
  date: string;
  dayName: string;
  mood?: MoodType;
  hasReflection: boolean;
  reflectionSnippet?: string;
}

export default function MoodTracker() {
  const { theme } = useTheme();
  const [weekData, setWeekData] = useState<WeekDay[]>([]);
  const [activeDay, setActiveDay] = useState<number>(6);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [previousStreak, setPreviousStreak] = useState(0);
  const [todayIndex, setTodayIndex] = useState<number>(0);
  
  useEffect(() => {
    loadWeekData();
    (async () => {
      const streak = await supabaseAnalyticsService.getCurrentStreak();
      setPreviousStreak(() => currentStreak);
      setCurrentStreak(streak);
    })();
  }, [currentStreak]);

  const loadWeekData = async () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Days since Monday
    
    const week: WeekDay[] = [];
    
    // Build fixed Mon-Sun week with moods for available days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - mondayOffset + i); // Start from Monday
      const dateStr = date.toISOString().split("T")[0];
      
      const moodEntry = await supabaseMoodService.getMoodForDate(dateStr);
      const reflections = await supabaseReflectionService.getReflectionsByDateRange(dateStr, dateStr);
      const reflection = reflections[0];
      
      week.push({
        date: dateStr,
        dayName: daysOfWeek[i],
        mood: moodEntry?.mood,
        hasReflection: !!reflection,
        reflectionSnippet: reflection ? reflection.reflection_text.slice(0, 80) + "..." : undefined,
      });
    }
    
    setWeekData(week);
    setActiveDay(mondayOffset); // Set active to current day
    setTodayIndex(mondayOffset); // Store today's index
  };

  const activeData = weekData[activeDay];

  const isDark = theme === 'dark';

  return (
    <section className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/70 border border-[#EFF3F4]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <IconOrb accent="violet" size="sm">
            <Sparkle size={16} weight="bold" className="text-white" />
          </IconOrb>
          <div>
            <h3 className={`font-semibold text-base tracking-tight ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>Your Rhythm</h3>
            <p className={`text-[11px] ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>This week at a glance</p>
          </div>
        </div>
        {currentStreak > 0 && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${isDark ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' : 'bg-amber-50 text-amber-700 border border-amber-200/60'}`}>
            <Flame size={12} weight="bold" />
            {currentStreak} day{currentStreak === 1 ? '' : 's'}
          </span>
        )}
      </div>
      
      {/* Week Mood Row */}
      <div className={`rounded-xl p-4 px-5 mb-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.04]' : 'bg-[#F8F6F2]/80 border border-[#EFF3F4]/80'}`}>
        <div className="flex justify-between">
          {weekData.map((day, i) => {
            const isToday = i === todayIndex;
            const isActive = activeDay === i;
            
            return (
              <button
                key={i}
                className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? 'scale-110' : ''}`}
                onClick={() => setActiveDay(i)}
              >
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                    getMoodColor(day.mood)
                  } ${
                    isActive ? 'ring-2 ring-[#B8C9E0] ring-offset-2' : ''
                  } ${
                    !day.mood ? `${isDark ? 'border border-white/10' : ''}` : ''
                  }`}
                  style={{ ['--tw-ring-offset-color' as string]: isDark ? '#141820' : '#F7F9FA' } as React.CSSProperties}
                >
                  {day.mood || <span className={`text-xs ${isDark ? 'text-white/20' : 'text-[#C4C0B8]'}`}>—</span>}
                </div>
                <span className={`text-[10px] font-medium ${
                  isToday ? 'text-[#5B7FA5]' : isDark ? 'text-white/40' : 'text-[#8B98A5]'
                }`}>
                  {isToday ? 'Today' : day.dayName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Active Day Details */}
      <AnimatePresence mode="wait">
        {activeData && (
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`rounded-xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.04]' : 'bg-[#F8F6F2]/80 border border-[#EFF3F4]/80'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                {activeDay === todayIndex ? 'Today' : activeData.dayName}
              </p>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                {new Date(activeData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            
            {activeData.hasReflection ? (
              <div className="space-y-2">
                {activeData.mood && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeData.mood}</span>
                    <span className={`text-sm ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>Mood recorded</span>
                  </div>
                )}
                {activeData.reflectionSnippet && (
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-[#8B98A5]'}`}>
                    {activeData.reflectionSnippet}
                  </p>
                )}
              </div>
            ) : (
              <p className={`text-xs ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                {activeDay === todayIndex ? 'Write a short reflection for today' : 'No reflection for this day'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Feelings This Week */}
      {(() => {
        const moodLabels: Record<string, string> = {
          "😔": "Sad", "😐": "Neutral", "😊": "Happy", "😄": "Joyful",
          "🤔": "Thoughtful", "😌": "Calm", "🙏": "Grateful", "💪": "Strong",
        };
        const moodsThisWeek = weekData.filter(d => d.mood).map(d => d.mood!);
        if (moodsThisWeek.length === 0) {
          return (
            <div className={`mt-4 rounded-xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.04]' : 'bg-[#F8F6F2]/80 border border-[#EFF3F4]/80'}`}>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>Top feelings</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>
                Start tracking to see your top feelings
              </p>
            </div>
          );
        }
        const counts: Record<string, number> = {};
        moodsThisWeek.forEach(m => { counts[m] = (counts[m] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
        return (
          <div className={`mt-4 rounded-xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.04]' : 'bg-[#F8F6F2]/80 border border-[#EFF3F4]/80'}`}>
            <p className={`text-xs mb-2.5 ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>Top feelings this week</p>
            <div className="flex gap-2 flex-wrap">
              {sorted.map(([emoji, count]) => (
                <span
                  key={emoji}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    isDark ? 'bg-white/[0.06] text-white/70' : 'bg-white text-[#536471] border border-[#EFF3F4]'
                  }`}
                >
                  <span className="text-sm">{emoji}</span>
                  {moodLabels[emoji] || emoji}
                  {count > 1 && <span className={`${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>×{count}</span>}
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </section>
  );
}
