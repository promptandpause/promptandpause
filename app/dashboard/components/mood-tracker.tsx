"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabaseMoodService, supabaseReflectionService, supabaseAnalyticsService } from "@/lib/services/supabaseReflectionService";
import { MoodType } from "@/lib/types/reflection";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getMoodColor = (mood?: MoodType) => {
  if (!mood) return "bg-[#F0EDE6]";
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
    <section className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/70 border border-[#E8E5DE]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>Your Rhythm</h3>
        {currentStreak > 0 && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isDark ? 'bg-[#A8D5BA]/15 text-[#A8D5BA]' : 'bg-[#E8F5E9] text-[#5A8F6E]'}`}>
            {currentStreak} day streak
          </span>
        )}
      </div>
      
      {/* Week Mood Row */}
      <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.04]' : 'bg-[#F8F6F2]/80 border border-[#E8E5DE]/80'}`}>
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
                  style={{ ['--tw-ring-offset-color' as string]: isDark ? '#141820' : '#FAFAF7' } as React.CSSProperties}
                >
                  {day.mood || <span className={`text-xs ${isDark ? 'text-white/20' : 'text-[#C4C0B8]'}`}>—</span>}
                </div>
                <span className={`text-[10px] font-medium ${
                  isToday ? 'text-[#5B7FA5]' : isDark ? 'text-white/40' : 'text-[#A0A090]'
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
            className={`rounded-xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.04]' : 'bg-[#F8F6F2]/80 border border-[#E8E5DE]/80'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>
                {activeDay === todayIndex ? 'Today' : activeData.dayName}
              </p>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>
                {new Date(activeData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            
            {activeData.hasReflection ? (
              <div className="space-y-2">
                {activeData.mood && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeData.mood}</span>
                    <span className={`text-sm ${isDark ? 'text-white/70' : 'text-[#5A5A4E]'}`}>Mood recorded</span>
                  </div>
                )}
                {activeData.reflectionSnippet && (
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-[#8A8A7A]'}`}>
                    {activeData.reflectionSnippet}
                  </p>
                )}
              </div>
            ) : (
              <p className={`text-xs ${isDark ? 'text-white/30' : 'text-[#A0A090]'}`}>
                {activeDay === todayIndex ? 'Write a short reflection for today' : 'No reflection for this day'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* This Week Summary */}
      <div className={`mt-4 rounded-xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.04]' : 'bg-[#F8F6F2]/80 border border-[#E8E5DE]/80'}`}>
        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>Your mood trend</p>
        <p className={`text-base font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>
          {weekData.filter(d => d.mood).length > 0 ? 'Improving' : 'Start tracking'}
        </p>
      </div>
    </section>
  );
}
