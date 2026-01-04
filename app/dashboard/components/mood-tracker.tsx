"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabaseMoodService, supabaseReflectionService, supabaseAnalyticsService } from "@/lib/services/supabaseReflectionService";
import { MoodType } from "@/lib/types/reflection";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getMoodColor = (mood?: MoodType) => {
  if (!mood) return "bg-gray-100/50";
  const happyMoods: MoodType[] = ["😊", "😄", "🙏"];
  const neutralMoods: MoodType[] = ["😐", "🤔"];
  const sadMoods: MoodType[] = ["😔"];
  const calmMoods: MoodType[] = ["😌"];
  const strongMoods: MoodType[] = ["💪"];
  
  if (happyMoods.includes(mood)) return "bg-[#B8D8B8]";
  if (calmMoods.includes(mood)) return "bg-[#B8C8E8]";
  if (strongMoods.includes(mood)) return "bg-[#C8B8D8]";
  if (neutralMoods.includes(mood)) return "bg-[#E8D8B8]";
  if (sadMoods.includes(mood)) return "bg-[#D8B8B8]";
  return "bg-[#F4C6B8]";
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
      setPreviousStreak(currentStreak);
      setCurrentStreak(streak);
    })();
  }, []);

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

  return (
    <section className={`rounded-2xl md:rounded-3xl px-4 md:px-7 pt-5 md:pt-6 pb-5 md:pb-6 flex flex-col transition-all duration-200 ${theme === 'dark' ? 'glass-light shadow-soft-lg' : 'glass-medium shadow-soft-md'}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className={`font-semibold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mood Tracker</h4>
        {currentStreak > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className={`
              relative px-3 py-1.5 rounded-full font-semibold text-xs
              ${theme === 'dark' 
                ? 'text-orange-300 bg-orange-500/30 border border-orange-500/40' 
                : 'text-gray-900 bg-orange-500/20 border border-orange-400/30'
              }
              ${currentStreak % 7 === 0 || currentStreak === 30 || currentStreak === 100
                ? 'animate-pulse shadow-lg shadow-orange-500/50'
                : ''
              }
            `}
          >
            <motion.span
              key={currentStreak}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="inline-block"
            >
              {currentStreak}
            </motion.span>
            {' '}day streak 🔥
          </motion.div>
        )}
      </div>
      
      {/* Week Mood Grid */}
      <div className="flex gap-1 md:gap-2 justify-between mb-4">
        {weekData.map((day, i) => {
          const isToday = i === todayIndex;
          const isActive = activeDay === i;
          
          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-1 md:gap-1.5 group relative transition-all duration-300 ${
                isActive ? "scale-105 md:scale-110" : ""
              } flex-1 min-w-0`}
              onClick={() => setActiveDay(i)}
            >
              {/* Mood Circle */}
              <div
                className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center text-lg md:text-2xl shadow-lg transition-all duration-300 ${
                  getMoodColor(day.mood)
                } ${
                  isActive ? "ring-2 ring-orange-400 ring-offset-1 md:ring-offset-2 ring-offset-transparent" : ""
                } ${
                  !day.mood ? "border-2 border-dashed border-white/30" : ""
                }`}
              >
                {day.mood || "•"}
              </div>
              
              {/* Day Label */}
              <span
                className={`text-[10px] md:text-xs font-medium transition-all duration-300 truncate w-full text-center ${
                  isToday ? "text-orange-400" : theme === 'dark' ? "text-white/70" : "text-gray-700"
                }`}
              >
                {isToday ? "Today" : day.dayName}
              </span>
              
              {/* Reflection Indicator */}
              {day.hasReflection && (
                <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 md:-bottom-2 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full border ${theme === 'dark' ? 'border-white/20' : 'border-gray-300'}`} />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Active Day Details */}
      <AnimatePresence mode="wait">
        {activeData && (
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`p-3 rounded-lg border min-h-[60px] ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                {activeDay === 6 ? "Today" : activeData.dayName}
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
                {new Date(activeData.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
            
            {activeData.hasReflection ? (
              <div className="space-y-2">
                {activeData.mood && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeData.mood}</span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>Mood recorded</span>
                  </div>
                )}
                {activeData.reflectionSnippet && (
                  <p className={`text-xs italic leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
                    {activeData.reflectionSnippet}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-2">
                <p className={`text-xs italic ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                  {activeDay === 6
                    ? "Complete today's reflection to track your mood"
                    : "No reflection for this day"}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
