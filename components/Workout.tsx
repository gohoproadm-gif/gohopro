
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Play, Clock, Flame, ChevronRight, Calendar as CalendarIcon, 
  Plus, MoreHorizontal, Trash2, X, CheckCircle2, Dumbbell, 
  Sparkles, Loader2, StopCircle, Pause, SkipForward, Info, 
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Calendar, Save, Utensils, Camera, Image as ImageIcon
} from 'lucide-react';
import { 
  DailyPlan, WorkoutRecord, UserProfile, NutritionLog, 
  Language, ScheduledWorkout, CalendarEvent, Exercise 
} from '../types';
import { DEFAULT_PLANS, HK_HOLIDAYS } from '../constants';
import { 
  apiGetSchedule, apiSaveSchedule, apiGetEvents, 
  apiSaveEvent, apiDeleteEvent 
} from '../lib/db';
import { getPhotosFromDB, BodyPhoto } from '../lib/localDb';

interface WorkoutProps {
  autoStart: boolean;
  onAutoStartConsumed: () => void;
  onFinishWorkout: (record: WorkoutRecord) => void;
  historyLogs: WorkoutRecord[];
  userProfile: UserProfile;
  onGoToSettings: () => void;
  nutritionLogs: NutritionLog[];
  onDeleteNutrition: (id: string) => void;
  language: Language;
  externalPlanToStart?: DailyPlan | null;
}

const Workout: React.FC<WorkoutProps> = ({ 
  autoStart, onAutoStartConsumed, onFinishWorkout, 
  historyLogs, userProfile, onGoToSettings, 
  nutritionLogs, onDeleteNutrition, language, externalPlanToStart 
}) => {

  const t = {
    zh: {
      schedule: '訓練日程',
      plans: '訓練課表',
      aiGen: 'AI 生成課表',
      myPlans: '我的課表',
      recommended: '推薦課表',
      start: '開始訓練',
      generating: 'AI 正在規劃中...',
      duration: '分鐘',
      addToSchedule: '加入日程',
      workout: '訓練',
      activity: '活動',
      confirmDelete: '確認刪除',
      deletePlanDesc: '您確定要刪除此課表嗎？',
      cancel: '取消',
      delete: '刪除',
      save: '儲存',
      events: '今日事項',
      completed: '已完成',
      nutrition: '飲食記錄',
      photos: '體態照片',
      noContent: '本日無安排事項'
    },
    en: {
      schedule: 'Schedule',
      plans: 'Workout Plans',
      aiGen: 'AI Plan Gen',
      myPlans: 'My Plans',
      recommended: 'Recommended',
      start: 'Start Workout',
      generating: 'AI is thinking...',
      duration: 'mins',
      addToSchedule: 'Add to Schedule',
      workout: 'Workout',
      activity: 'Activity',
      confirmDelete: 'Confirm Delete',
      deletePlanDesc: 'Are you sure you want to delete this plan?',
      cancel: 'Cancel',
      delete: 'Delete',
      save: 'Save',
      events: 'Events',
      completed: 'Completed',
      nutrition: 'Nutrition',
      photos: 'Photos',
      noContent: 'No activities today'
    }
  }[language];

  // --- State: Data & Schedule ---
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [customPlans, setCustomPlans] = useState<DailyPlan[]>([]);
  const [photos, setPhotos] = useState<BodyPhoto[]>([]); // Photos state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- State: Modals ---
  const [showAiModal, setShowAiModal] = useState(false);
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  
  // --- State: Forms & Interactions ---
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [planToDeleteId, setPlanToDeleteId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<'WORKOUT' | 'ACTIVITY'>('WORKOUT');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [newEventData, setNewEventData] = useState({ title: '', time: '09:00', description: '' });

  // --- State: Active Workout ---
  const [activePlan, setActivePlan] = useState<DailyPlan | null>(null);
  const [workoutState, setWorkoutState] = useState<'PREVIEW' | 'ACTIVE' | 'SUMMARY'>('PREVIEW');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]); // Copy of plan exercises to track completion
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Computed ---
  const allPlans = useMemo(() => [...customPlans, ...DEFAULT_PLANS], [customPlans]);

  // --- Initialization ---
  useEffect(() => {
    const loadData = async () => {
      // Load Schedule & Events
      const s = await apiGetSchedule();
      setSchedule(s);
      const e = await apiGetEvents();
      setEvents(e);
      
      // Load Photos
      try {
        const p = await getPhotosFromDB();
        setPhotos(p);
      } catch (err) {
        console.error("Failed to load photos in workout view", err);
      }
      
      // Load Custom Plans from LocalStorage
      const storedPlans = localStorage.getItem('fitlife_custom_plans');
      if (storedPlans) {
        setCustomPlans(JSON.parse(storedPlans));
      }
    };
    loadData();
  }, []);

  // --- Auto Start Logic ---
  useEffect(() => {
    if (autoStart && externalPlanToStart) {
      startWorkoutSession(externalPlanToStart);
      onAutoStartConsumed();
    }
  }, [autoStart, externalPlanToStart]);

  // --- API Helpers ---
  const getDeepSeekConfig = () => {
      let apiKey = localStorage.getItem('GO_SYSTEM_OPENAI_API_KEY');
      let baseUrl = localStorage.getItem('GO_SYSTEM_OPENAI_BASE_URL');
      let model = localStorage.getItem('GO_SYSTEM_OPENAI_MODEL');

      if (!apiKey) apiKey = userProfile.openaiApiKey || null;
      if (!baseUrl) baseUrl = userProfile.openaiBaseUrl || null;
      if (!model) model = userProfile.openaiModel || null;

      if (!apiKey && typeof process !== 'undefined' && process.env) {
          apiKey = process.env.VITE_OPENAI_API_KEY;
          baseUrl = baseUrl || process.env.VITE_OPENAI_BASE_URL;
          model = model || process.env.VITE_OPENAI_MODEL;
      }

      return {
          apiKey,
          baseUrl: baseUrl || "https://api.deepseek.com",
          model: model || "deepseek-chat"
      };
  };

  const callOpenAIPlan = async (prompt: string) => {
      const { apiKey, baseUrl, model } = getDeepSeekConfig();
      if (!apiKey) throw new Error("API Key 缺失");

      const systemPrompt = `You are an expert fitness coach. Create a workout plan based on the user's request.
                            Return ONLY valid JSON. Structure:
                            {
                              "title": "Plan Title",
                              "focus": "Target Muscle Groups",
                              "duration": 45,
                              "exercises": [
                                { "id": "e1", "name": "Exercise Name", "sets": 3, "reps": "12", "section": "warmup" | "main" | "core" }
                              ]
                            }`;
      
      const body: any = {
          model: model,
          messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
          ],
          stream: false
      };
       
      if (!model.includes('reasoner')) {
          body.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error("AI API Error");
      const data = await response.json();
      let content = data.choices[0].message.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(content);
  };

  const callGeminiPlan = async (prompt: string) => {
      let apiKey = localStorage.getItem('GO_SYSTEM_GOOGLE_API_KEY');
      
      if (!apiKey && typeof process !== 'undefined' && process.env) {
        apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
      }
      
      if (!apiKey) {
          // @ts-ignore
          if (typeof import.meta !== 'undefined' && import.meta.env) {
              // @ts-ignore
              apiKey = import.meta.env.VITE_API_KEY;
          }
      }

      if (!apiKey) throw new Error("Google API Key missing");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a fitness workout plan for: "${prompt}". Return JSON only.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    focus: { type: Type.STRING },
                    duration: { type: Type.INTEGER },
                    exercises: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                sets: { type: Type.INTEGER },
                                reps: { type: Type.STRING },
                                section: { type: Type.STRING, enum: ["warmup", "main", "core"] }
                            },
                            required: ["name", "sets", "reps", "section"]
                        }
                    }
                },
                required: ["title", "focus", "duration", "exercises"]
            }
        }
      });
      return JSON.parse(response.text);
  };

  const handleGeneratePlan = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiError(null);

    try {
        let planData;
        if (userProfile.aiProvider === 'openai') {
            try {
                planData = await callOpenAIPlan(aiPrompt);
            } catch (e) {
                console.warn("OpenAI failed, fallback to Gemini", e);
                planData = await callGeminiPlan(aiPrompt);
            }
        } else {
            planData = await callGeminiPlan(aiPrompt);
        }

        const newPlan: DailyPlan = {
            id: `custom_${Date.now()}`,
            title: planData.title,
            focus: planData.focus,
            duration: planData.duration,
            exercises: planData.exercises.map((e: any, i: number) => ({
                id: `ex_${Date.now()}_${i}`,
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                completed: false,
                section: e.section,
                weight: 0
            }))
        };

        const updatedCustomPlans = [newPlan, ...customPlans];
        setCustomPlans(updatedCustomPlans);
        localStorage.setItem('fitlife_custom_plans', JSON.stringify(updatedCustomPlans));
        
        setAiPrompt('');
        setShowAiModal(false);
    } catch (e: any) {
        setAiError("生成失敗: " + (e.message || "未知錯誤"));
    } finally {
        setIsGenerating(false);
    }
  };

  const confirmDeletePlan = () => {
      if (!planToDeleteId) return;
      const updated = customPlans.filter(p => p.id !== planToDeleteId);
      setCustomPlans(updated);
      localStorage.setItem('fitlife_custom_plans', JSON.stringify(updated));
      setPlanToDeleteId(null);
  };

  // --- Active Workout Logic ---
  const startWorkoutSession = (plan: DailyPlan) => {
    setActivePlan(plan);
    setActiveExercises(JSON.parse(JSON.stringify(plan.exercises))); // Deep copy
    setWorkoutState('ACTIVE');
    setElapsedTime(0);
    setCurrentExerciseIdx(0);
    
    // Start Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const endWorkoutSession = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (!activePlan) return;

      const record: WorkoutRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          type: activePlan.title,
          duration: Math.floor(elapsedTime / 60),
          calories: Math.floor((elapsedTime / 60) * 8), // Rough estimate
          completed: true,
          details: activeExercises.map(ex => ({
              exerciseName: ex.name,
              sets: Array(ex.sets).fill(0).map((_, i) => ({
                  setNumber: i + 1,
                  weight: ex.weight || 0, 
                  reps: parseInt(ex.reps) || 0,
                  completed: true
              }))
          }))
      };

      onFinishWorkout(record);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const scheduledItem = schedule.find(s => s.date === todayStr && s.planId === activePlan.id);
      if (scheduledItem) {
          const newSchedule = schedule.map(s => s === scheduledItem ? { ...s, completed: true } : s);
          setSchedule(newSchedule);
          apiSaveSchedule(newSchedule);
      }

      setWorkoutState('PREVIEW');
      setActivePlan(null);
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  const calendarDays = Array.from({ length: days }, (_, i) => {
      const d = i + 1;
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return {
          day: d,
          dateStr,
          hasWorkout: schedule.some(s => s.date === dateStr),
          hasEvent: events.some(e => e.date === dateStr),
          hasNutrition: nutritionLogs.some(n => n.date === dateStr),
          hasPhoto: photos.some(p => p.date === dateStr),
          isHoliday: !!HK_HOLIDAYS[dateStr],
          isToday: dateStr === new Date().toISOString().split('T')[0]
      };
  });

  // --- Render Active Workout Mode ---
  if (workoutState === 'ACTIVE' && activePlan) {
      return (
          <div className="fixed inset-0 z-50 bg-white dark:bg-charcoal-950 flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-charcoal-800 flex justify-between items-center bg-white dark:bg-charcoal-900" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                  <div>
                      <h2 className="font-bold text-lg">{activePlan.title}</h2>
                      <div className="flex items-center gap-2 text-neon-blue font-mono text-xl font-bold">
                          <Clock size={20} /> {formatTime(elapsedTime)}
                      </div>
                  </div>
                  <button 
                    onClick={endWorkoutSession}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg"
                  >
                      <StopCircle size={20} className="inline mr-1" /> 結束
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                  {activeExercises.map((ex, idx) => (
                      <div key={ex.id} className={`p-4 rounded-2xl border-2 transition-all ${idx === currentExerciseIdx ? 'border-neon-blue bg-neon-blue/5' : 'border-gray-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900'}`}>
                          <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg">{ex.name}</h3>
                              <span className="text-xs font-bold px-2 py-1 rounded bg-gray-200 dark:bg-charcoal-700 text-gray-500">{ex.section}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                              <span>{ex.sets} Sets × {ex.reps} Reps</span>
                              <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    placeholder="kg"
                                    className="w-16 p-1 text-center border rounded bg-transparent"
                                    value={ex.weight || ''}
                                    onChange={(e) => {
                                        const newEx = [...activeExercises];
                                        newEx[idx].weight = Number(e.target.value);
                                        setActiveExercises(newEx);
                                    }}
                                  />
                                  <span>kg</span>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              {Array.from({length: ex.sets}).map((_, sIdx) => (
                                  <div key={sIdx} className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-charcoal-700 overflow-hidden">
                                      <div className={`h-full ${idx < currentExerciseIdx ? 'bg-neon-green' : 'bg-transparent'}`}></div>
                                  </div>
                              ))}
                          </div>
                          {idx === currentExerciseIdx && (
                              <button 
                                onClick={() => setCurrentExerciseIdx(prev => Math.min(prev + 1, activeExercises.length - 1))}
                                className="w-full mt-4 py-3 bg-neon-blue text-charcoal-900 font-bold rounded-xl flex items-center justify-center gap-2"
                              >
                                  下一項 <SkipForward size={18} />
                              </button>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  // --- Render Dashboard Mode ---
  return (
    <div className="space-y-8 pb-24">
        {/* Calendar Section */}
        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-charcoal-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <CalendarIcon className="text-cta-orange" /> {t.schedule}
                </h2>
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}><ChevronLeft size={20}/></button>
                    <span className="font-bold text-lg">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}><ChevronRightIcon size={20}/></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="text-xs font-bold text-gray-400">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                {calendarDays.map((d) => (
                    <div 
                        key={d.dateStr}
                        onClick={() => { setSelectedDate(d.dateStr); setShowDayDetailModal(true); }}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center relative cursor-pointer border transition-all ${
                            d.isToday ? 'border-neon-blue bg-neon-blue/10 text-neon-blue font-bold' : 
                            d.dateStr === selectedDate ? 'border-gray-300 dark:border-charcoal-500 bg-gray-50 dark:bg-charcoal-700' : 
                            'border-transparent hover:bg-gray-50 dark:hover:bg-charcoal-900'
                        }`}
                    >
                        <span className={`text-sm ${d.isHoliday ? 'text-red-500' : ''}`}>{d.day}</span>
                        <div className="flex gap-1 mt-1 justify-center flex-wrap max-w-[80%]">
                            {d.hasWorkout && <div className="w-1.5 h-1.5 rounded-full bg-cta-orange"></div>}
                            {d.hasEvent && <div className="w-1.5 h-1.5 rounded-full bg-neon-purple"></div>}
                            {d.hasNutrition && <div className="w-1.5 h-1.5 rounded-full bg-neon-green"></div>}
                            {d.hasPhoto && <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* AI Plan Gen Banner */}
        <div 
            onClick={() => setShowAiModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-lg cursor-pointer relative overflow-hidden group"
        >
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-yellow-300"/> {t.aiGen}</h3>
                    <p className="text-indigo-100 text-sm mt-1">輸入目標，立即生成專屬課表</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                    <Plus size={24} />
                </div>
            </div>
        </div>

        {/* All Plans List */}
        <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Dumbbell className="text-neon-green"/> {t.plans}</h3>
            <div className="space-y-4">
                {allPlans.map(plan => (
                    <div key={plan.id} className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-charcoal-700 hover:border-neon-blue transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-lg text-gray-800 dark:text-white group-hover:text-neon-blue transition-colors">{plan.title}</h4>
                                <p className="text-sm text-gray-500">{plan.focus} • {plan.duration} {t.duration}</p>
                            </div>
                            {plan.id.startsWith('custom_') && (
                                <button onClick={(e) => { e.stopPropagation(); setPlanToDeleteId(plan.id); }} className="text-gray-400 hover:text-red-500 p-2">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {plan.exercises.slice(0, 3).map((ex, i) => (
                                <span key={i} className="text-xs bg-gray-100 dark:bg-charcoal-900 px-2 py-1 rounded text-gray-600 dark:text-gray-400">{ex.name}</span>
                            ))}
                            {plan.exercises.length > 3 && <span className="text-xs text-gray-400 px-1 py-1">+{plan.exercises.length - 3}</span>}
                        </div>
                        <button 
                            onClick={() => startWorkoutSession(plan)}
                            className="w-full py-3 bg-gray-50 dark:bg-charcoal-900 hover:bg-cta-orange hover:text-white text-gray-700 dark:text-gray-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <Play size={16} fill="currentColor" /> {t.start}
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* AI Modal (Bottom Sheet on Mobile) */}
        {showAiModal && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center bg-black/70 backdrop-blur-sm sm:p-4 animate-fade-in">
                <div 
                    className="bg-white dark:bg-charcoal-800 w-full md:w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl p-6 flex flex-col"
                    style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl flex items-center gap-2"><Sparkles className="text-neon-purple"/> {t.aiGen}</h3>
                        <button onClick={() => setShowAiModal(false)}><X size={24} className="text-gray-400"/></button>
                    </div>
                    
                    <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="例如：我要練胸肌，時間30分鐘，只有啞鈴..."
                        className="w-full h-32 p-4 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-purple resize-none mb-4"
                    />

                    {aiError && <p className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/20 p-2 rounded">{aiError}</p>}

                    <button 
                        onClick={handleGeneratePlan}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? <><Loader2 className="animate-spin" size={18}/> {t.generating}</> : <><Sparkles size={18}/> 生成課表</>}
                    </button>
                </div>
            </div>
        )}

        {/* Day Detail Modal (Bottom Sheet on Mobile) */}
        {showDayDetailModal && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center bg-black/70 backdrop-blur-sm sm:p-4 animate-fade-in">
                <div 
                    className="bg-white dark:bg-charcoal-800 w-full md:w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl p-6 max-h-[90vh] md:max-h-[80vh] min-h-[50vh] flex flex-col"
                    style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
                >
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <div>
                            <h3 className="font-bold text-xl">{selectedDate}</h3>
                            <p className="text-xs text-gray-500">{HK_HOLIDAYS[selectedDate] || '無特殊節日'}</p>
                        </div>
                        <button onClick={() => setShowDayDetailModal(false)}><X size={24} className="text-gray-400"/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6 pr-1 min-h-[150px]">
                        
                        {/* Nutrition Section */}
                        {nutritionLogs.filter(n => n.date === selectedDate).length > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                                <h4 className="font-bold text-sm text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                                    <Utensils size={14}/> {t.nutrition}
                                </h4>
                                <div className="space-y-2">
                                    {nutritionLogs.filter(n => n.date === selectedDate).map((log) => (
                                        <div key={log.id} className="flex justify-between items-center text-xs border-b border-green-200 dark:border-green-800/50 last:border-0 pb-1 last:pb-0">
                                            <span className="text-gray-700 dark:text-gray-300">{log.item}</span>
                                            <span className="font-bold text-green-600">{log.calories} kcal</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Scheduled Workouts */}
                        {schedule.filter(s => s.date === selectedDate).map((item, idx) => {
                            const plan = allPlans.find(p => p.id === item.planId);
                            return plan ? (
                                <div key={idx} className="bg-gray-50 dark:bg-charcoal-900 p-4 rounded-xl border-l-4 border-cta-orange">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-white">{plan.title}</h4>
                                            <p className="text-xs text-gray-500">{plan.duration} {t.duration}</p>
                                        </div>
                                        {item.completed ? <CheckCircle2 className="text-green-500" size={20} /> : (
                                            <button onClick={() => { setShowDayDetailModal(false); startWorkoutSession(plan); }} className="text-cta-orange font-bold text-xs px-3 py-1 bg-orange-100 dark:bg-orange-900/20 rounded-full">開始</button>
                                        )}
                                    </div>
                                </div>
                            ) : null;
                        })}

                        {/* Events */}
                        {events.filter(e => e.date === selectedDate).map((event) => (
                            <div key={event.id} className="bg-gray-50 dark:bg-charcoal-900 p-4 rounded-xl border-l-4 border-neon-purple flex justify-between items-center group">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono bg-gray-200 dark:bg-charcoal-700 px-1 rounded">{event.time}</span>
                                        <h4 className="font-bold text-gray-800 dark:text-white">{event.title}</h4>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{t.activity}</p>
                                </div>
                                <button 
                                    onClick={async () => {
                                        const newEvents = events.filter(e => e.id !== event.id);
                                        setEvents(newEvents);
                                        await apiDeleteEvent(event.id);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}

                        {/* Photos Section */}
                        {photos.filter(p => p.date === selectedDate).length > 0 && (
                            <div>
                                <h4 className="font-bold text-sm text-gray-500 mb-3 flex items-center gap-2">
                                    <Camera size={14}/> {t.photos}
                                </h4>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {photos.filter(p => p.date === selectedDate).map((photo) => (
                                        <div key={photo.id} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-charcoal-700 flex-shrink-0">
                                            <img src={photo.imageData} alt="Body check" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!schedule.some(s => s.date === selectedDate) && 
                         !events.some(e => e.date === selectedDate) && 
                         !nutritionLogs.some(n => n.date === selectedDate) &&
                         !photos.some(p => p.date === selectedDate) && (
                            <div className="text-center py-8 text-gray-400">
                                <Info size={32} className="mx-auto mb-2 opacity-30"/>
                                <p className="text-sm">{t.noContent}</p>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => { setShowDayDetailModal(false); setShowAddEventModal(true); }}
                        className="mt-6 w-full py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold rounded-xl flex items-center justify-center gap-2 shrink-0"
                    >
                        <Plus size={18}/> {t.addToSchedule}
                    </button>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal (Keep as Center Modal) */}
        {planToDeleteId && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-charcoal-800 w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 dark:border-charcoal-700 p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3 text-red-500">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.confirmDelete}</h3>
                        <p className="text-sm text-gray-500 mt-1">{t.deletePlanDesc}</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setPlanToDeleteId(null)}
                            className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 dark:bg-charcoal-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-600 transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button 
                            onClick={confirmDeletePlan}
                            className="flex-1 py-2.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                        >
                            {t.delete}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Add Event/Workout Modal (Bottom Sheet on Mobile) */}
        {showAddEventModal && (
            <div className="fixed inset-0 z-[110] flex flex-col justify-end md:justify-center md:items-center bg-black/70 backdrop-blur-sm sm:p-4 animate-fade-in">
                <div 
                    className="bg-white dark:bg-charcoal-800 w-full md:w-full md:max-w-sm rounded-t-3xl md:rounded-2xl shadow-xl border border-gray-200 dark:border-charcoal-700 p-6 flex flex-col"
                    style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">{t.addToSchedule}</h3>
                        <button onClick={() => setShowAddEventModal(false)}><X size={20} className="text-gray-400"/></button>
                    </div>

                    <div className="flex bg-gray-100 dark:bg-charcoal-900 p-1 rounded-xl mb-6 shrink-0">
                        <button 
                            onClick={() => setEventType('WORKOUT')} 
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${eventType === 'WORKOUT' ? 'bg-white dark:bg-charcoal-800 shadow text-charcoal-900 dark:text-white' : 'text-gray-500'}`}
                        >
                            {t.workout}
                        </button>
                        <button 
                            onClick={() => setEventType('ACTIVITY')} 
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${eventType === 'ACTIVITY' ? 'bg-white dark:bg-charcoal-800 shadow text-charcoal-900 dark:text-white' : 'text-gray-500'}`}
                        >
                            {t.activity}
                        </button>
                    </div>

                    {eventType === 'WORKOUT' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">選擇課表</label>
                                <select 
                                    value={selectedPlanId}
                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none text-sm"
                                >
                                    <option value="">請選擇...</option>
                                    {allPlans.map(p => (
                                        <option key={p.id} value={p.id}>{p.title} ({p.duration} {t.duration})</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={async () => {
                                    if (!selectedPlanId) return;
                                    const newSchedule = schedule.filter(s => s.date !== selectedDate);
                                    newSchedule.push({
                                        date: selectedDate,
                                        planId: selectedPlanId,
                                        completed: false
                                    });
                                    setSchedule(newSchedule);
                                    await apiSaveSchedule(newSchedule);
                                    setShowAddEventModal(false);
                                    setShowDayDetailModal(true);
                                }}
                                className="w-full bg-cta-orange text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
                            >
                                {t.save}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="活動標題" 
                                value={newEventData.title} 
                                onChange={(e) => setNewEventData({...newEventData, title: e.target.value})}
                                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none text-sm font-bold"
                            />
                            <input 
                                type="time" 
                                value={newEventData.time} 
                                onChange={(e) => setNewEventData({...newEventData, time: e.target.value})}
                                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none text-sm"
                            />
                            <button 
                                onClick={async () => {
                                    if (!newEventData.title) return;
                                    const newEvent: CalendarEvent = {
                                        id: Date.now().toString(),
                                        date: selectedDate,
                                        time: newEventData.time,
                                        title: newEventData.title,
                                        type: 'ACTIVITY'
                                    };
                                    const updatedEvents = [...events, newEvent];
                                    setEvents(updatedEvents);
                                    await apiSaveEvent(newEvent);
                                    setShowAddEventModal(false);
                                    setNewEventData({title: '', time: '09:00', description: ''});
                                    setShowDayDetailModal(true);
                                }}
                                className="w-full bg-neon-blue text-charcoal-900 font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
                            >
                                {t.save}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default Workout;
