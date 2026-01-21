
import React, { useState, useEffect } from 'react';
import { DEFAULT_PLANS, HK_HOLIDAYS } from '../constants';
import { DailyPlan, ScheduledWorkout, WorkoutRecord, ExerciseSetLog, CalendarEvent, NutritionLog, UserProfile } from '../types';
import { Calendar as CalendarIcon, List, ChevronRight, ChevronLeft, Check, Dumbbell, Sparkles, Loader2, X, Timer, AlertTriangle, Plus, Trash2, Utensils, Clock, History as HistoryIcon, ArrowUpRight, Settings, Minus, RefreshCw, RotateCcw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { apiGetSchedule, apiSaveSchedule, apiGetEvents, apiSaveEvent, apiDeleteEvent, apiGetNutritionLogs } from '../lib/db';

type Mode = 'TIMETABLE' | 'PLANS' | 'CREATE' | 'ACTIVE_SESSION';

interface WorkoutProps {
  autoStart?: boolean;
  onAutoStartConsumed?: () => void;
  onFinishWorkout?: (record: WorkoutRecord) => void;
  historyLogs?: WorkoutRecord[]; 
  userProfile: UserProfile;
  onGoToSettings: () => void;
}

const playBeep = (count: number = 1) => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    try {
        const ctx = new AudioContext();
        const playTone = (time: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, time);
            osc.frequency.exponentialRampToValueAtTime(440, time + 0.1);
            
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            
            osc.start(time);
            osc.stop(time + 0.2);
        };

        for (let i = 0; i < count; i++) {
            playTone(ctx.currentTime + i * 0.3);
        }
    } catch (e) {
        console.error("Audio error", e);
    }
    
    if (navigator.vibrate) {
        navigator.vibrate(Array(count).fill(100));
    }
};

// Utility to clean JSON string from Markdown blocks
const cleanJson = (text: string) => {
    if (!text) return "{}";
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
};

const Workout: React.FC<WorkoutProps> = ({ autoStart, onAutoStartConsumed, onFinishWorkout, historyLogs = [], userProfile, onGoToSettings }) => {
  const [mode, setMode] = useState<Mode>('TIMETABLE');
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const [activePlan, setActivePlan] = useState<DailyPlan | null>(null);

  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionLogs, setSessionLogs] = useState<Record<string, ExerciseSetLog[]>>({});
  const [restTimer, setRestTimer] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Add Event/Workout Modal
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventType, setEventType] = useState<'ACTIVITY' | 'WORKOUT'>('WORKOUT');
  const [newEventData, setNewEventData] = useState<{title: string, time: string, description: string}>({title: '', time: '09:00', description: ''});
  const [selectedPlanId, setSelectedPlanId] = useState<string>(DEFAULT_PLANS[0].id);

  useEffect(() => {
    const loadData = async () => {
        const s = await apiGetSchedule();
        setSchedule(s);
        const e = await apiGetEvents();
        setEvents(e);
        const n = await apiGetNutritionLogs();
        setNutritionLogs(n);
    };
    loadData();
  }, []);

  useEffect(() => {
      if (autoStart && onAutoStartConsumed) {
          const todayPlanId = schedule.find(s => s.date === selectedDate)?.planId;
          const planToStart = DEFAULT_PLANS.find(p => p.id === todayPlanId) || DEFAULT_PLANS[0];
          handleStartSession(planToStart);
          onAutoStartConsumed();
      }
  }, [autoStart]);

  useEffect(() => {
      let interval: any;
      if (isResting && restTimer > 0) {
          interval = setInterval(() => {
              setRestTimer(prev => {
                  if (prev <= 1) {
                      playBeep(3);
                      setIsResting(false);
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isResting, restTimer]);

  // --- Smart Pre-fill Logic ---
  const findLastSessionStats = (exerciseName: string) => {
      for (const record of historyLogs) {
          if (!record.details) continue;
          const match = record.details.find(d => d.exerciseName === exerciseName);
          // Find the best set (highest weight) or just the last working set
          if (match && match.sets.length > 0) {
              const completedSets = match.sets.filter(s => s.completed && s.weight > 0);
              if (completedSets.length > 0) {
                  // Return the heavyest set to encourage progressive overload, or just the last set
                  // Let's return the last completed set to be safe
                  return completedSets[completedSets.length - 1];
              }
          }
      }
      return null;
  };

  const handleStartSession = (plan: DailyPlan) => {
      setActivePlan(plan);
      setSessionStartTime(Date.now());
      
      const initialLogs: Record<string, ExerciseSetLog[]> = {};
      
      plan.exercises.forEach(ex => {
          // Check history for pre-fill
          const lastStats = findLastSessionStats(ex.name);
          const defaultWeight = lastStats ? lastStats.weight : (ex.weight || 0);
          const defaultReps = lastStats ? lastStats.reps : (parseInt(ex.reps) || 10);

          initialLogs[ex.id] = Array(ex.sets).fill(null).map((_, i) => ({
              setNumber: i + 1,
              weight: defaultWeight,
              reps: defaultReps,
              completed: false
          }));
      });
      setSessionLogs(initialLogs);
      
      setMode('ACTIVE_SESSION');
  };

  const handleFinishSession = async () => {
      if (!activePlan) return;
      const duration = Math.round((Date.now() - sessionStartTime) / 60000);
      
      const record: WorkoutRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          type: activePlan.title,
          duration: duration,
          calories: duration * 6,
          completed: true,
          details: activePlan.exercises.map(ex => ({
              exerciseName: ex.name,
              sets: sessionLogs[ex.id] || []
          }))
      };

      if (onFinishWorkout) {
          onFinishWorkout(record);
      }
      
      const newSchedule = schedule.map(s => {
          if (s.date === selectedDate && s.planId === activePlan.id) {
              return { ...s, completed: true };
          }
          return s;
      });
      setSchedule(newSchedule);
      await apiSaveSchedule(newSchedule);

      setActivePlan(null);
      setMode('TIMETABLE');
  };

  const handleAddScheduleItem = async () => {
      if (eventType === 'ACTIVITY') {
          if(!newEventData.title) return;
          const newEvent: CalendarEvent = {
              id: Date.now().toString(),
              date: selectedDate,
              time: newEventData.time,
              title: newEventData.title,
              description: newEventData.description,
              type: 'ACTIVITY'
          };
          setEvents([...events, newEvent]);
          await apiSaveEvent(newEvent);
      } else {
          // Add Workout Plan
          const newSchedule = [...schedule, { date: selectedDate, planId: selectedPlanId, completed: false }];
          setSchedule(newSchedule);
          await apiSaveSchedule(newSchedule);
      }
      
      setShowAddEventModal(false);
      setNewEventData({title: '', time: '09:00', description: ''});
  };

  const handleDeleteEvent = async (id: string) => {
      setEvents(events.filter(e => e.id !== id));
      await apiDeleteEvent(id);
  };

  const handleDeleteWorkout = async (planId: string, date: string) => {
      const newSchedule = schedule.filter(s => !(s.planId === planId && s.date === date));
      setSchedule(newSchedule);
      await apiSaveSchedule(newSchedule);
  };

  const getApiKey = () => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
            // @ts-ignore
            return import.meta.env.VITE_API_KEY;
        }
        if (typeof process !== 'undefined' && process.env) {
            if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
            if (process.env.API_KEY) return process.env.API_KEY;
        }
    } catch (e) {
        console.warn("Error reading env vars", e);
    }
    return null;
  };

  // Robust DeepSeek/OpenAI Key Retrieval
  const getDeepSeekConfig = () => {
      let apiKey = userProfile.openaiApiKey;
      let baseUrl = userProfile.openaiBaseUrl;
      let model = userProfile.openaiModel;

      // Try VITE_ env vars (most likely for this project)
      try {
          // @ts-ignore
          if (typeof import.meta !== 'undefined' && import.meta.env) {
             // @ts-ignore
             if (!apiKey) apiKey = import.meta.env.VITE_OPENAI_API_KEY;
             // @ts-ignore
             if (!baseUrl) baseUrl = import.meta.env.VITE_OPENAI_BASE_URL;
             // @ts-ignore
             if (!model) model = import.meta.env.VITE_OPENAI_MODEL;
          }
      } catch(e) {}

      // Try process.env as fallback
      if (!apiKey && typeof process !== 'undefined' && process.env) {
          apiKey = process.env.VITE_OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;
          baseUrl = baseUrl || process.env.VITE_OPENAI_BASE_URL || process.env.NEXT_PUBLIC_OPENAI_BASE_URL;
          model = model || process.env.VITE_OPENAI_MODEL || process.env.NEXT_PUBLIC_OPENAI_MODEL;
      }

      return {
          apiKey,
          baseUrl: baseUrl || "https://api.deepseek.com",
          model: model || "deepseek-chat"
      };
  };

  const callOpenAI = async () => {
        const { apiKey, baseUrl, model } = getDeepSeekConfig();

        if (!apiKey) throw new Error("API Key 缺失。請至設定頁面配置 API Key。");

        const systemPrompt = `Create a workout plan based on the request. Return strictly valid JSON with structure: { "title": "Plan Name", "focus": "Target Area", "duration": 45, "exercises": [ { "name": "Exercise Name", "sets": 3, "reps": "12" } ] }`;

        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: aiPrompt }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "AI API 請求失敗");
        }

        const data = await response.json();
        return JSON.parse(cleanJson(data.choices[0].message.content));
  };

  const callGemini = async () => {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("系統未偵測到 Google API Key。");
      
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a workout plan based on this request: "${aiPrompt}". Return strictly JSON. Structure: { "title": "Plan Name", "focus": "Target Area", "duration": 45, "exercises": [ { "name": "Exercise Name", "sets": 3, "reps": "12" } ] }`,
            config: { responseMimeType: "application/json" }
      });
      return JSON.parse(cleanJson(response.text || "{}"));
  };

  const handleGeneratePlan = async () => {
      if (!aiPrompt.trim()) return;
      setAiError(null);
      setIsGenerating(true);
      try {
          let result;
          const { apiKey } = getDeepSeekConfig();

          // If DeepSeek/OpenAI key is present, use it. Otherwise fall back to Gemini.
          if (userProfile.aiProvider === 'openai' || apiKey) {
               result = await callOpenAI();
          } else {
               result = await callGemini();
          }
          
          if (result.title) {
              const newPlan: DailyPlan = {
                  id: 'ai_' + Date.now(),
                  title: result.title,
                  focus: result.focus || 'General',
                  duration: result.duration || 45,
                  exercises: result.exercises.map((e: any, i: number) => ({
                      id: `ex_${i}`,
                      name: e.name,
                      sets: e.sets,
                      reps: e.reps,
                      completed: false
                  }))
              };
              
              const newSchedule = [...schedule, { date: selectedDate, planId: newPlan.id, completed: false }];
              setSchedule(newSchedule);
              await apiSaveSchedule(newSchedule);
              DEFAULT_PLANS.push(newPlan);
              setAiPrompt('');
              setMode('TIMETABLE');
          }
      } catch (e: any) {
          if (e.message?.includes("API Key")) {
               setAiError("生成失敗: API Key 缺失 (請檢查設定)");
          } else {
               setAiError("生成失敗: " + (e.message || "未知錯誤"));
          }
      } finally {
          setIsGenerating(false);
      }
  };

  const updateSetLog = (exerciseId: string, setIndex: number, field: keyof ExerciseSetLog, value: any) => {
      setSessionLogs(prev => {
          const logs = [...(prev[exerciseId] || [])];
          logs[setIndex] = { ...logs[setIndex], [field]: value };
          return { ...prev, [exerciseId]: logs };
      });
  };

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
      setSessionLogs(prev => {
          const logs = [...(prev[exerciseId] || [])];
          const isComplete = !logs[setIndex].completed;
          logs[setIndex] = { ...logs[setIndex], completed: isComplete };
          if (isComplete) {
              setRestTimer(60); 
              setIsResting(true);
          }
          return { ...prev, [exerciseId]: logs };
      });
  };

  // Helper to find last performance of an exercise
  const getPreviousPerformance = (exerciseName: string) => {
      const stats = findLastSessionStats(exerciseName);
      if (stats) {
          return `${stats.weight}kg x ${stats.reps}`;
      }
      return null;
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const days = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentMonth);
  const daysArray = Array.from({ length: days }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
      setCurrentMonth(new Date());
      setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const renderCalendarCell = (day: number) => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const dateObj = new Date(year, month, day);
      
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSelected = dateStr === selectedDate;
      const isHoliday = !!HK_HOLIDAYS[dateStr];
      const isSunday = dateObj.getDay() === 0;
      const holidayName = HK_HOLIDAYS[dateStr];
      
      const hasWorkout = schedule.some(s => s.date === dateStr);
      const hasNutrition = nutritionLogs.some(n => n.date === dateStr);
      const hasEvent = events.some(e => e.date === dateStr);

      let dayNumberClass = "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ";
      if (isToday) {
          dayNumberClass += "bg-neon-blue text-charcoal-900";
      } else if (isHoliday || isSunday) {
          dayNumberClass += "text-red-500";
      } else {
          dayNumberClass += "text-gray-700 dark:text-gray-300";
      }

      return (
          <div 
              key={day} 
              onClick={() => setSelectedDate(dateStr)}
              className={`
                  relative h-14 md:h-24 border border-gray-100 dark:border-charcoal-700 flex flex-col justify-between items-start p-1 transition-all cursor-pointer
                  ${isSelected ? 'ring-2 ring-neon-blue z-10' : ''}
                  ${isHoliday || isSunday ? 'bg-red-50 dark:bg-red-900/10' : 'bg-white dark:bg-charcoal-800'}
                  hover:bg-gray-50 dark:hover:bg-charcoal-700
              `}
          >
              <div className="w-full flex justify-between items-start">
                  <span className={dayNumberClass}>
                      {day}
                  </span>
                  {/* Indicators moved to top right to save bottom space for holiday name */}
                  <div className="flex gap-0.5 mt-1">
                      {hasWorkout && <div className="w-1.5 h-1.5 rounded-full bg-cta-orange" title="Workout"></div>}
                      {hasNutrition && <div className="w-1.5 h-1.5 rounded-full bg-neon-green" title="Nutrition"></div>}
                      {hasEvent && <div className="w-1.5 h-1.5 rounded-full bg-neon-blue" title="Activity"></div>}
                  </div>
              </div>
              
              {/* Holiday Name - Centered & Visible */}
              {isHoliday && (
                  <div className="w-full text-center mt-auto mb-0.5">
                      <span className="block text-[9px] md:text-xs text-red-500 font-bold leading-none truncate px-0.5">
                          {holidayName}
                      </span>
                  </div>
              )}
          </div>
      );
  };

  // --- Timeline Rendering ---
  const getTimelineItems = () => {
      const items: {time: string, type: string, title: string, detail?: string, id: string, originalObj: any}[] = [];
      
      // Workouts
      const dailyWorkouts = schedule.filter(s => s.date === selectedDate);
      dailyWorkouts.forEach(s => {
          const plan = DEFAULT_PLANS.find(p => p.id === s.planId);
          items.push({
              time: '--:--', // Workouts usually don't have strict time in this app unless recorded, we put them at top or generic
              type: 'WORKOUT',
              title: plan?.title || '訓練',
              detail: s.completed ? '已完成' : '待完成',
              id: s.planId,
              originalObj: s
          });
      });

      // Events
      const dailyEvents = events.filter(e => e.date === selectedDate);
      dailyEvents.forEach(e => {
          items.push({
              time: e.time,
              type: 'ACTIVITY',
              title: e.title,
              detail: e.description,
              id: e.id,
              originalObj: e
          });
      });

      // Nutrition
      const dailyNutrition = nutritionLogs.filter(n => n.date === selectedDate);
      dailyNutrition.forEach(n => {
          items.push({
              time: n.time,
              type: 'MEAL',
              title: n.item,
              detail: `${n.calories} kcal`,
              id: n.id,
              originalObj: n
          });
      });

      return items.sort((a, b) => a.time.localeCompare(b.time));
  };


  if (mode === 'ACTIVE_SESSION' && activePlan) {
      return (
          <div className="pb-20 relative min-h-[80vh]">
              <div className="sticky top-0 z-30 bg-white dark:bg-charcoal-900 border-b border-gray-200 dark:border-charcoal-700 p-4 -mx-4 md:-mx-8 mb-6 shadow-sm flex justify-between items-center">
                  <div>
                      <h2 className="text-xl font-bold">{activePlan.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Timer size={14} className={isResting ? "text-cta-orange animate-pulse" : ""} />
                          {isResting ? (
                              <span className="font-bold text-cta-orange">休息中 {restTimer}s</span>
                          ) : (
                              <span>訓練進行中</span>
                          )}
                      </div>
                  </div>
                  <button onClick={handleFinishSession} className="bg-neon-green text-charcoal-900 font-bold px-4 py-2 rounded-lg text-sm shadow-lg shadow-neon-green/20">結束訓練</button>
              </div>

              <div className="space-y-6">
                  {activePlan.exercises.map((exercise) => {
                      const prevStats = getPreviousPerformance(exercise.name);
                      return (
                      <div key={exercise.id} className="bg-white dark:bg-charcoal-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-charcoal-700">
                          <div className="flex justify-between items-start mb-4">
                              <h3 className="font-bold text-lg flex items-center gap-2">
                                  <Dumbbell size={18} className="text-neon-blue"/>
                                  {exercise.name}
                              </h3>
                              {prevStats ? (
                                  <div className="text-xs bg-gray-100 dark:bg-charcoal-900 text-gray-500 px-2 py-1 rounded flex items-center gap-1">
                                      <HistoryIcon size={12} />
                                      <span className="font-mono">上次: {prevStats}</span>
                                  </div>
                              ) : (
                                  <span className="text-[10px] bg-neon-green/10 text-neon-green px-2 py-1 rounded">新動作</span>
                              )}
                          </div>
                          
                          <div className="space-y-2">
                              <div className="grid grid-cols-10 gap-2 text-xs font-bold text-gray-400 mb-1 px-1">
                                  <div className="col-span-1 text-center">SET</div><div className="col-span-3 text-center">KG</div><div className="col-span-3 text-center">REPS</div><div className="col-span-3 text-center">DONE</div>
                              </div>
                              {sessionLogs[exercise.id]?.map((set, idx) => (
                                  <div key={idx} className={`grid grid-cols-10 gap-2 items-center p-2 rounded-lg transition-colors ${set.completed ? 'bg-neon-green/10 border border-neon-green/30' : 'bg-gray-50 dark:bg-charcoal-900 border border-transparent'}`}>
                                      <div className="col-span-1 text-center font-bold text-gray-500">{idx + 1}</div>
                                      <div className="col-span-3"><input type="number" value={set.weight} onChange={(e) => updateSetLog(exercise.id, idx, 'weight', Number(e.target.value))} className="w-full bg-transparent text-center font-bold border-b border-gray-300 dark:border-gray-600 focus:border-neon-blue outline-none py-1"/></div>
                                      <div className="col-span-3"><input type="number" value={set.reps} onChange={(e) => updateSetLog(exercise.id, idx, 'reps', Number(e.target.value))} className="w-full bg-transparent text-center font-bold border-b border-gray-300 dark:border-gray-600 focus:border-neon-blue outline-none py-1"/></div>
                                      <div className="col-span-3 flex justify-center"><button onClick={() => toggleSetComplete(exercise.id, idx)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${set.completed ? 'bg-neon-green text-charcoal-900' : 'bg-gray-200 dark:bg-charcoal-700 text-gray-400'}`}><Check size={16} strokeWidth={3} /></button></div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )})}
              </div>
              {isResting && (
                  <div className="fixed bottom-20 left-4 right-4 bg-charcoal-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between z-40 animate-fade-in border border-charcoal-700">
                      <div>
                          <div className="text-xs text-gray-400 font-bold uppercase">Resting</div>
                          <div className="text-2xl font-mono font-bold text-cta-orange">{restTimer}s</div>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setRestTimer(t => Math.max(0, t - 10))} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center justify-center w-10">
                              <Minus size={16} />
                          </button>
                          <button onClick={() => setRestTimer(t => t + 30)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center justify-center w-10">
                              <Plus size={16} />
                          </button>
                          <button onClick={() => setIsResting(false)} className="px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-red-400 font-bold text-sm">
                              Skip
                          </button>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

  return (
    <div className="space-y-6 pb-20">
        {/* Toggle Mode */}
        <div className="bg-gray-100 dark:bg-charcoal-800 p-1 rounded-xl flex">
            <button 
                onClick={() => setMode('TIMETABLE')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'TIMETABLE' ? 'bg-white dark:bg-charcoal-900 shadow text-charcoal-900 dark:text-white' : 'text-gray-500'}`}
            >
                <CalendarIcon size={16} /> 時間表
            </button>
            <button 
                onClick={() => setMode('PLANS')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'PLANS' ? 'bg-white dark:bg-charcoal-900 shadow text-charcoal-900 dark:text-white' : 'text-gray-500'}`}
            >
                <List size={16} /> 課表庫
            </button>
        </div>

        {mode === 'TIMETABLE' && (
            <div className="space-y-6 animate-fade-in">
                {/* Large Calendar View */}
                <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-gray-200 dark:border-charcoal-700 overflow-hidden">
                    <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-charcoal-700 bg-gray-50 dark:bg-charcoal-900">
                         <button onClick={prevMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-charcoal-700 rounded-full"><ChevronLeft/></button>
                         <div className="flex flex-col items-center">
                             <h3 className="font-bold text-lg leading-none">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</h3>
                             {!isCurrentMonth && (
                                 <button onClick={goToToday} className="text-[10px] text-neon-blue font-bold flex items-center gap-1 mt-1 hover:underline">
                                     <RotateCcw size={10} /> 返回今日
                                 </button>
                             )}
                         </div>
                         <button onClick={nextMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-charcoal-700 rounded-full"><ChevronRight/></button>
                    </div>
                    <div className="grid grid-cols-7 text-center text-xs text-gray-400 font-bold py-2 bg-gray-50 dark:bg-charcoal-900">
                        <div className="text-red-500">日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
                    </div>
                    <div className="grid grid-cols-7 bg-gray-200 dark:bg-charcoal-700 gap-px border-b border-gray-200 dark:border-charcoal-700">
                        {paddingArray.map(i => <div key={`pad-${i}`} className="bg-gray-50 dark:bg-gray-800/50 h-14 md:h-24"></div>)}
                        {daysArray.map(day => renderCalendarCell(day))}
                    </div>
                </div>

                {/* Day Timetable / Schedule Details */}
                <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-gray-200 dark:border-charcoal-700 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                {selectedDate}
                                {HK_HOLIDAYS[selectedDate] && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">{HK_HOLIDAYS[selectedDate]}</span>}
                            </h3>
                            <p className="text-sm text-gray-500">當日行程概覽</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowAddEventModal(true)} className="p-2 bg-gray-100 dark:bg-charcoal-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-neon-blue hover:text-charcoal-900 transition-colors" title="Add Activity">
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-gray-200 dark:before:bg-charcoal-700">
                        {getTimelineItems().map((item, idx) => (
                            <div key={idx} className="relative pl-10 flex flex-col group">
                                <div className={`absolute left-[11px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-charcoal-800 ${item.type === 'WORKOUT' ? 'bg-cta-orange' : item.type === 'MEAL' ? 'bg-neon-green' : 'bg-neon-blue'} z-10`}></div>
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-charcoal-900 p-3 rounded-xl border border-gray-100 dark:border-charcoal-700 hover:border-neon-blue transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="text-xs font-mono text-gray-400 w-10 text-center">{item.time}</div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                {item.type === 'WORKOUT' && <Dumbbell size={14} className="text-cta-orange"/>}
                                                {item.type === 'MEAL' && <Utensils size={14} className="text-neon-green"/>}
                                                {item.type === 'ACTIVITY' && <Clock size={14} className="text-neon-blue"/>}
                                                {item.title}
                                            </h4>
                                            {item.detail && <p className="text-xs text-gray-500">{item.detail}</p>}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {item.type === 'WORKOUT' && !item.originalObj.completed && (
                                            <button 
                                                onClick={() => {
                                                    const plan = DEFAULT_PLANS.find(p => p.id === item.id);
                                                    if(plan) handleStartSession(plan);
                                                }}
                                                className="text-xs bg-cta-orange text-white px-3 py-1.5 rounded-full font-bold shadow-lg shadow-orange-500/20"
                                            >
                                                開始
                                            </button>
                                        )}
                                        {item.type === 'ACTIVITY' ? (
                                            <button 
                                                onClick={() => handleDeleteEvent(item.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        ) : item.type === 'WORKOUT' && !item.originalObj.completed ? (
                                            <button 
                                                onClick={() => handleDeleteWorkout(item.id, selectedDate)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {getTimelineItems().length === 0 && (
                            <div className="pl-10 text-gray-400 text-sm py-4">
                                暫無行程，點擊右上角 "+" 新增活動或選擇課表。
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {mode === 'PLANS' && (
            <div className="space-y-4 animate-fade-in">
                 {DEFAULT_PLANS.map(plan => (
                     <div key={plan.id} className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-gray-200 dark:border-charcoal-700 flex justify-between items-center">
                         <div>
                             <h4 className="font-bold">{plan.title}</h4>
                             <p className="text-xs text-gray-500">{plan.focus}</p>
                         </div>
                         <button 
                            onClick={async () => {
                                const newSchedule = [...schedule, { date: selectedDate, planId: plan.id, completed: false }];
                                setSchedule(newSchedule);
                                await apiSaveSchedule(newSchedule);
                                setMode('TIMETABLE');
                            }}
                            className="bg-gray-100 dark:bg-charcoal-700 p-2 rounded-lg hover:bg-neon-green hover:text-charcoal-900 transition-colors"
                         >
                             <Plus size={20} />
                         </button>
                     </div>
                 ))}
                 
                 <button 
                    onClick={() => setMode('CREATE')}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-charcoal-600 text-gray-500 font-bold flex items-center justify-center gap-2 hover:border-cta-orange hover:text-cta-orange transition-colors"
                 >
                     <Sparkles size={20} /> AI 建立新課表
                 </button>
            </div>
        )}

        {mode === 'CREATE' && (
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-gray-200 dark:border-charcoal-700 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="text-cta-orange" /> AI 智慧排課</h3>
                    <button onClick={() => setMode('TIMETABLE')}><X size={20} className="text-gray-400"/></button>
                </div>
                <div className="space-y-4">
                    <div className="text-xs text-gray-500 bg-gray-100 dark:bg-charcoal-900 p-2 rounded flex items-center gap-2">
                        <span className="shrink-0">使用模型:</span>
                        <span className={`font-bold px-2 py-0.5 rounded ${userProfile.aiProvider === 'openai' ? 'bg-neon-purple/10 text-neon-purple' : 'bg-neon-blue/10 text-neon-blue'}`}>
                            {userProfile.aiProvider === 'openai' ? 'OpenAI / DeepSeek' : 'Google Gemini'}
                        </span>
                        {userProfile.aiProvider === 'openai' && !userProfile.openaiApiKey && (
                            <span className="text-red-500 text-[10px] ml-auto flex items-center gap-1"><AlertTriangle size={10}/> 未設定 API Key</span>
                        )}
                    </div>
                    <textarea value={aiPrompt} onChange={(e) => { setAiPrompt(e.target.value); setAiError(null); }} placeholder="例如：我只有30分鐘，想練胸肌和三頭肌..." className="w-full h-32 p-4 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange resize-none" />
                    {aiError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 text-xs rounded-lg flex flex-col items-start gap-2 w-full">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={14} className="shrink-0" />
                                <span>{aiError}</span>
                            </div>
                            {aiError.includes("設定") && (
                                <button onClick={onGoToSettings} className="underline font-bold text-red-600 dark:text-red-400">前往設定</button>
                            )}
                        </div>
                    )}
                    <button onClick={handleGeneratePlan} disabled={isGenerating || !aiPrompt.trim()} className="w-full bg-cta-orange text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">{isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}{isGenerating ? 'AI 思考中...' : '生成課表'}</button>
                </div>
            </div>
        )}

        {/* Add Event Modal */}
        {showAddEventModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-charcoal-800 w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 dark:border-charcoal-700 p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">新增至時間表</h3>
                        <button onClick={() => setShowAddEventModal(false)}><X size={20} className="text-gray-400"/></button>
                    </div>

                    {/* Toggle Type */}
                    <div className="flex bg-gray-100 dark:bg-charcoal-900 p-1 rounded-lg mb-4">
                        <button 
                            onClick={() => setEventType('WORKOUT')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${eventType === 'WORKOUT' ? 'bg-white dark:bg-charcoal-700 shadow text-cta-orange' : 'text-gray-500'}`}
                        >
                            安排訓練
                        </button>
                        <button 
                            onClick={() => setEventType('ACTIVITY')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${eventType === 'ACTIVITY' ? 'bg-white dark:bg-charcoal-700 shadow text-neon-blue' : 'text-gray-500'}`}
                        >
                            一般活動
                        </button>
                    </div>

                    <div className="space-y-4">
                        {eventType === 'WORKOUT' ? (
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">選擇課表</label>
                                <select 
                                    className="w-full p-2 rounded-lg bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange"
                                    value={selectedPlanId}
                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                >
                                    {DEFAULT_PLANS.map(plan => (
                                        <option key={plan.id} value={plan.id}>{plan.title} ({plan.focus})</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-2">將加入至: {selectedDate}</p>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">活動名稱</label>
                                    <input type="text" className="w-full p-2 rounded-lg bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue" placeholder="例如: 會議, 休息日..." value={newEventData.title} onChange={e => setNewEventData({...newEventData, title: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">時間</label>
                                    <input type="time" className="w-full p-2 rounded-lg bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue" value={newEventData.time} onChange={e => setNewEventData({...newEventData, time: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">備註 (選填)</label>
                                    <input type="text" className="w-full p-2 rounded-lg bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue" placeholder="詳細內容..." value={newEventData.description} onChange={e => setNewEventData({...newEventData, description: e.target.value})} />
                                </div>
                            </>
                        )}
                        <button onClick={handleAddScheduleItem} className="w-full bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold py-3 rounded-xl mt-2">
                            確認新增
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Workout;
