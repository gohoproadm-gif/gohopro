
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Play, Clock, Flame, ChevronRight, Calendar as CalendarIcon, 
  Plus, MoreHorizontal, Trash2, X, CheckCircle2, Dumbbell, 
  Sparkles, Loader2, StopCircle, Pause, SkipForward, Info, 
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Calendar, Save, Edit3, FileText, ClipboardPen, ListPlus, Trash,
  Timer, RotateCcw
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
      customPlan: '自訂計畫',
      importPlan: '匯入/分析',
      createPlan: '建立新課表',
      planTitle: '課表名稱',
      planFocus: '訓練重點',
      addExercise: '新增動作',
      exerciseName: '動作名稱',
      sets: '組數',
      reps: '次數',
      section: '階段',
      analyze: '分析並建立',
      pasteText: '貼上訓練內容或是對話記錄...',
      analyzing: '正在分析內容...',
      manual: '手動建立',
      restTimer: '休息計時',
      resume: '繼續訓練'
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
      customPlan: 'Custom Plan',
      importPlan: 'Import/Analyze',
      createPlan: 'Create Plan',
      planTitle: 'Plan Title',
      planFocus: 'Focus Area',
      addExercise: 'Add Exercise',
      exerciseName: 'Exercise Name',
      sets: 'Sets',
      reps: 'Reps',
      section: 'Section',
      analyze: 'Analyze & Create',
      pasteText: 'Paste workout text or chat...',
      analyzing: 'Analyzing content...',
      manual: 'Manual',
      restTimer: 'Rest Timer',
      resume: 'Resume'
    }
  }[language];

  // --- State: Data & Schedule ---
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [customPlans, setCustomPlans] = useState<DailyPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- State: Modals ---
  const [showAiModal, setShowAiModal] = useState(false);
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // --- State: Forms & Interactions ---
  const [aiPrompt, setAiPrompt] = useState('');
  const [importText, setImportText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [planToDeleteId, setPlanToDeleteId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<'WORKOUT' | 'ACTIVITY'>('WORKOUT');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [newEventData, setNewEventData] = useState({ title: '', time: '09:00', description: '' });

  // --- State: Manual Plan Form ---
  const [manualTitle, setManualTitle] = useState('');
  const [manualFocus, setManualFocus] = useState('');
  const [manualDuration, setManualDuration] = useState(45);
  const [manualExercises, setManualExercises] = useState<Exercise[]>([]);
  const [tempExName, setTempExName] = useState('');
  const [tempExSets, setTempExSets] = useState(3);
  const [tempExReps, setTempExReps] = useState('10');
  const [tempExSection, setTempExSection] = useState<'warmup'|'main'|'core'>('main');

  // --- State: Active Workout ---
  const [activePlan, setActivePlan] = useState<DailyPlan | null>(null);
  const [workoutState, setWorkoutState] = useState<'PREVIEW' | 'ACTIVE' | 'SUMMARY'>('PREVIEW');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]); // Copy of plan exercises to track completion
  const timerRef = useRef<number | null>(null);

  // --- State: Rest Timer ---
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const restTimerRef = useRef<number | null>(null);

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
      
      // Load Custom Plans from LocalStorage
      const storedPlans = localStorage.getItem('fitlife_custom_plans');
      if (storedPlans) {
        setCustomPlans(JSON.parse(storedPlans));
      }

      // Check for active session recovery
      const savedSession = localStorage.getItem('fitlife_active_session');
      if (savedSession) {
          try {
              const session = JSON.parse(savedSession);
              // Only recover if it's from today (optional rule)
              // const sessionDate = session.timestamp; // check date logic if needed
              
              setActivePlan(session.plan);
              setActiveExercises(session.exercises);
              setElapsedTime(session.elapsedTime);
              setCurrentExerciseIdx(session.currentExerciseIdx);
              setWorkoutState('ACTIVE');
              
              // Restart timer
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = window.setInterval(() => {
                  setElapsedTime(prev => prev + 1);
              }, 1000);
          } catch (e) {
              console.error("Failed to recover session", e);
              localStorage.removeItem('fitlife_active_session');
          }
      }
    };
    loadData();

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, []);

  // --- Auto Start Logic ---
  useEffect(() => {
    if (autoStart && externalPlanToStart) {
      startWorkoutSession(externalPlanToStart);
      onAutoStartConsumed();
    }
  }, [autoStart, externalPlanToStart]);

  // --- Session Persistence Effect ---
  useEffect(() => {
      if (workoutState === 'ACTIVE' && activePlan) {
          const sessionData = {
              plan: activePlan,
              exercises: activeExercises,
              elapsedTime: elapsedTime,
              currentExerciseIdx: currentExerciseIdx,
              timestamp: Date.now()
          };
          localStorage.setItem('fitlife_active_session', JSON.stringify(sessionData));
      } else if (workoutState !== 'ACTIVE') {
          // Clear session if finished or exited
          // Note: We check if we are truly out of active state to avoid flickering
          if (!activePlan) {
             localStorage.removeItem('fitlife_active_session');
          }
      }
  }, [workoutState, activePlan, activeExercises, elapsedTime, currentExerciseIdx]);

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

  const callOpenAIPlan = async (prompt: string, isAnalysis: boolean = false) => {
      const { apiKey, baseUrl, model } = getDeepSeekConfig();
      if (!apiKey) throw new Error("API Key 缺失");

      const systemPrompt = isAnalysis 
        ? `You are an expert fitness coach. Analyze the user's input text (which might be a unstructured workout routine or chat log) and extract/structure it into a valid workout plan JSON. Do not invent exercises if not implied, but categorize them correctly. Structure: { "title": "Derived Title", "focus": "Target Area", "duration": 45, "exercises": [ { "id": "e1", "name": "Exercise Name", "sets": 3, "reps": "12", "section": "warmup" | "main" | "core" } ] }`
        : `You are an expert fitness coach. Create a workout plan based on the user's request. Return ONLY valid JSON. Structure: { "title": "Plan Title", "focus": "Target Muscle Groups", "duration": 45, "exercises": [ { "id": "e1", "name": "Exercise Name", "sets": 3, "reps": "12", "section": "warmup" | "main" | "core" } ] }`;
      
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
      
      // Extract JSON if mixed content
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
          content = content.substring(firstBrace, lastBrace + 1);
      }

      return JSON.parse(content);
  };

  const callGeminiPlan = async (prompt: string, isAnalysis: boolean = false) => {
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

      const taskDescription = isAnalysis 
        ? `Analyze and parse the following text into a structured fitness workout plan JSON. Text: "${prompt}". Return JSON only.`
        : `Create a fitness workout plan for: "${prompt}". Return JSON only.`;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: taskDescription,
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

  const handleGeneratePlan = async (isImport: boolean = false) => {
    const promptToUse = isImport ? importText : aiPrompt;
    if (!promptToUse.trim()) return;
    
    setIsGenerating(true);
    setAiError(null);

    try {
        let planData;
        if (userProfile.aiProvider === 'openai') {
            try {
                planData = await callOpenAIPlan(promptToUse, isImport);
            } catch (e) {
                console.warn("OpenAI failed, fallback to Gemini", e);
                planData = await callGeminiPlan(promptToUse, isImport);
            }
        } else {
            planData = await callGeminiPlan(promptToUse, isImport);
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
        
        if (isImport) {
            setImportText('');
            setShowImportModal(false);
        } else {
            setAiPrompt('');
            setShowAiModal(false);
        }
    } catch (e: any) {
        setAiError("生成失敗: " + (e.message || "未知錯誤"));
    } finally {
        setIsGenerating(false);
    }
  };

  // --- Manual Plan Handlers ---
  const handleAddManualExercise = () => {
      if(!tempExName.trim()) return;
      const newEx: Exercise = {
          id: `ex_m_${Date.now()}`,
          name: tempExName,
          sets: tempExSets,
          reps: tempExReps,
          completed: false,
          section: tempExSection,
          weight: 0
      };
      setManualExercises([...manualExercises, newEx]);
      setTempExName('');
      // Keep other defaults for convenience
  };

  const handleRemoveManualExercise = (id: string) => {
      setManualExercises(manualExercises.filter(ex => ex.id !== id));
  };

  const handleSaveManualPlan = () => {
      if(!manualTitle.trim() || manualExercises.length === 0) return;
      
      const newPlan: DailyPlan = {
          id: `custom_m_${Date.now()}`,
          title: manualTitle,
          focus: manualFocus || '自訂訓練',
          duration: manualDuration,
          exercises: manualExercises
      };
      
      const updated = [newPlan, ...customPlans];
      setCustomPlans(updated);
      localStorage.setItem('fitlife_custom_plans', JSON.stringify(updated));
      
      // Reset and Close
      setManualTitle('');
      setManualFocus('');
      setManualExercises([]);
      setShowManualModal(false);
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
    timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const endWorkoutSession = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      localStorage.removeItem('fitlife_active_session'); // Clear persisted session

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
                  weight: ex.weight || 0, // Using the weight field from exercise for simplicity
                  reps: parseInt(ex.reps) || 0,
                  completed: true
              }))
          }))
      };

      onFinishWorkout(record);
      
      // Update schedule if applicable
      const todayStr = new Date().toISOString().split('T')[0];
      const scheduledItem = schedule.find(s => s.date === todayStr && s.planId === activePlan.id);
      if (scheduledItem) {
          const newSchedule = schedule.map(s => s === scheduledItem ? { ...s, completed: true } : s);
          setSchedule(newSchedule);
          apiSaveSchedule(newSchedule);
      }

      setWorkoutState('PREVIEW');
      setActivePlan(null);
      setIsResting(false);
  };

  const startRestTimer = (seconds: number) => {
      setRestTimeLeft(seconds);
      setIsResting(true);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      restTimerRef.current = window.setInterval(() => {
          setRestTimeLeft(prev => {
              if (prev <= 1) {
                  clearInterval(restTimerRef.current!);
                  // Could add sound here
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
  };

  const cancelRestTimer = () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      setIsResting(false);
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
          isHoliday: !!HK_HOLIDAYS[dateStr],
          isToday: dateStr === new Date().toISOString().split('T')[0]
      };
  });

  // --- Render Active Workout Mode ---
  if (workoutState === 'ACTIVE' && activePlan) {
      return (
          <div className="fixed inset-0 z-50 bg-white dark:bg-charcoal-950 flex flex-col">
              {/* Active Header */}
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

              {/* Rest Timer Overlay */}
              {isResting && (
                  <div className="bg-charcoal-900/95 absolute inset-0 z-10 flex flex-col items-center justify-center text-white backdrop-blur-sm animate-fade-in">
                      <div className="text-sm font-bold text-gray-400 mb-2">{t.restTimer}</div>
                      <div className="text-8xl font-black font-mono mb-8 text-neon-green">
                          {Math.floor(restTimeLeft / 60)}:{String(restTimeLeft % 60).padStart(2, '0')}
                      </div>
                      <div className="flex gap-4">
                           <button onClick={() => startRestTimer(restTimeLeft + 30)} className="px-6 py-3 rounded-xl bg-gray-800 font-bold text-sm">+30s</button>
                           <button onClick={cancelRestTimer} className="px-8 py-3 rounded-xl bg-cta-orange font-bold shadow-lg shadow-orange-500/20">{t.resume}</button>
                      </div>
                  </div>
              )}

              {/* Active Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
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

              {/* Bottom Rest Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-md border-t border-gray-200 dark:border-charcoal-700" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                  <div className="flex gap-2 justify-center">
                      <button onClick={() => startRestTimer(30)} className="flex-1 py-3 bg-gray-100 dark:bg-charcoal-800 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300">30s 休息</button>
                      <button onClick={() => startRestTimer(60)} className="flex-1 py-3 bg-gray-100 dark:bg-charcoal-800 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300">60s 休息</button>
                      <button onClick={() => startRestTimer(90)} className="flex-1 py-3 bg-gray-100 dark:bg-charcoal-800 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300">90s 休息</button>
                  </div>
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
                        <div className="flex gap-1 mt-1">
                            {d.hasWorkout && <div className="w-1.5 h-1.5 rounded-full bg-cta-orange"></div>}
                            {d.hasEvent && <div className="w-1.5 h-1.5 rounded-full bg-neon-purple"></div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AI Plan Gen Banner */}
            <div 
                onClick={() => setShowAiModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-lg cursor-pointer relative overflow-hidden group col-span-1 md:col-span-1"
            >
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-yellow-300"/> {t.aiGen}</h3>
                        <p className="text-indigo-100 text-xs mt-1">AI 自動規劃</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                        <Plus size={20} />
                    </div>
                </div>
            </div>

            {/* Manual Create */}
            <div 
                onClick={() => setShowManualModal(true)}
                className="bg-white dark:bg-charcoal-800 border border-gray-100 dark:border-charcoal-700 rounded-3xl p-6 shadow-sm cursor-pointer hover:border-neon-blue transition-all group flex justify-between items-center"
            >
                <div>
                     <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white"><Edit3 className="text-neon-blue" size={20}/> {t.customPlan}</h3>
                     <p className="text-xs text-gray-500 mt-1">{t.manual}</p>
                </div>
                <div className="bg-gray-50 dark:bg-charcoal-900 p-2 rounded-full group-hover:bg-neon-blue/10 group-hover:text-neon-blue transition-colors">
                     <ClipboardPen size={20} />
                </div>
            </div>

            {/* Import Text */}
            <div 
                onClick={() => setShowImportModal(true)}
                className="bg-white dark:bg-charcoal-800 border border-gray-100 dark:border-charcoal-700 rounded-3xl p-6 shadow-sm cursor-pointer hover:border-cta-orange transition-all group flex justify-between items-center"
            >
                <div>
                     <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white"><FileText className="text-cta-orange" size={20}/> {t.importPlan}</h3>
                     <p className="text-xs text-gray-500 mt-1">文字解析</p>
                </div>
                <div className="bg-gray-50 dark:bg-charcoal-900 p-2 rounded-full group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20 group-hover:text-cta-orange transition-colors">
                     <ListPlus size={20} />
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

        {/* AI Modal */}
        {showAiModal && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-black/70 backdrop-blur-sm sm:p-4 animate-fade-in">
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
                        onClick={() => handleGeneratePlan(false)}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? <><Loader2 className="animate-spin" size={18}/> {t.generating}</> : <><Sparkles size={18}/> 生成課表</>}
                    </button>
                </div>
            </div>
        )}

        {/* Manual Plan Modal */}
        {showManualModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-charcoal-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                     <div className="p-4 border-b border-gray-100 dark:border-charcoal-700 flex justify-between items-center bg-gray-50 dark:bg-charcoal-900 rounded-t-2xl">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Edit3 size={18} /> {t.createPlan}</h3>
                        <button onClick={() => setShowManualModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                     </div>

                     <div className="p-6 overflow-y-auto flex-1 space-y-4">
                        {/* Plan Meta */}
                        <div className="space-y-3">
                             <input 
                                type="text" 
                                placeholder={t.planTitle} 
                                value={manualTitle}
                                onChange={e => setManualTitle(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 font-bold"
                             />
                             <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    placeholder={t.planFocus} 
                                    value={manualFocus}
                                    onChange={e => setManualFocus(e.target.value)}
                                    className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 text-sm"
                                />
                                <div className="relative w-1/3">
                                    <input 
                                        type="number" 
                                        value={manualDuration}
                                        onChange={e => setManualDuration(Number(e.target.value))}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 text-sm"
                                    />
                                    <span className="absolute right-3 top-3 text-xs text-gray-400">min</span>
                                </div>
                             </div>
                        </div>

                        <hr className="border-gray-100 dark:border-charcoal-700" />

                        {/* Exercise List */}
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                             {manualExercises.length === 0 && <p className="text-center text-sm text-gray-400 py-4">尚未新增動作</p>}
                             {manualExercises.map((ex, idx) => (
                                 <div key={ex.id} className="flex justify-between items-center bg-gray-50 dark:bg-charcoal-900 p-3 rounded-lg border border-gray-100 dark:border-charcoal-700">
                                     <div>
                                         <div className="font-bold text-sm">{ex.name}</div>
                                         <div className="text-xs text-gray-500">{ex.sets} x {ex.reps} • {ex.section}</div>
                                     </div>
                                     <button onClick={() => handleRemoveManualExercise(ex.id)} className="text-gray-400 hover:text-red-500"><Trash size={16}/></button>
                                 </div>
                             ))}
                        </div>

                        {/* Add Exercise Form */}
                        <div className="bg-gray-50 dark:bg-charcoal-900 p-3 rounded-xl border border-dashed border-gray-300 dark:border-charcoal-600">
                             <div className="flex gap-2 mb-2">
                                <input type="text" placeholder={t.exerciseName} value={tempExName} onChange={e => setTempExName(e.target.value)} className="flex-1 p-2 rounded-lg text-sm bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700"/>
                                <select value={tempExSection} onChange={e => setTempExSection(e.target.value as any)} className="p-2 rounded-lg text-sm bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700">
                                    <option value="warmup">熱身</option>
                                    <option value="main">主訓</option>
                                    <option value="core">核心</option>
                                </select>
                             </div>
                             <div className="flex gap-2 items-center">
                                 <input type="number" value={tempExSets} onChange={e => setTempExSets(Number(e.target.value))} className="w-16 p-2 rounded-lg text-sm bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 text-center"/>
                                 <span className="text-xs text-gray-500">組</span>
                                 <input type="text" value={tempExReps} onChange={e => setTempExReps(e.target.value)} className="w-20 p-2 rounded-lg text-sm bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 text-center"/>
                                 <span className="text-xs text-gray-500">次</span>
                                 <button onClick={handleAddManualExercise} disabled={!tempExName} className="flex-1 ml-2 bg-neon-blue text-charcoal-900 font-bold p-2 rounded-lg text-sm disabled:opacity-50 hover:bg-cyan-400">{t.addExercise}</button>
                             </div>
                        </div>
                     </div>

                     <div className="p-4 border-t border-gray-100 dark:border-charcoal-700 flex justify-end gap-3 bg-gray-50 dark:bg-charcoal-900 rounded-b-2xl">
                         <button onClick={() => setShowManualModal(false)} className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-charcoal-700 font-bold text-sm">{t.cancel}</button>
                         <button onClick={handleSaveManualPlan} disabled={!manualTitle || manualExercises.length === 0} className="px-6 py-2 bg-cta-orange text-white rounded-lg font-bold text-sm shadow-lg disabled:opacity-50">{t.save}</button>
                     </div>
                </div>
            </div>
        )}

        {/* Import Text Modal */}
        {showImportModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                 <div className="bg-white dark:bg-charcoal-800 w-full max-w-md rounded-2xl shadow-2xl p-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2"><FileText size={18} /> {t.importPlan}</h3>
                        <button onClick={() => setShowImportModal(false)}><X size={20} className="text-gray-400"/></button>
                     </div>
                     <p className="text-sm text-gray-500 mb-3">AI 將自動解析您的文字內容並轉換為結構化課表。</p>
                     
                     <textarea 
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        placeholder={t.pasteText}
                        className="w-full h-40 p-4 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange resize-none mb-4 text-sm"
                     />
                     
                     {aiError && <p className="text-red-500 text-xs mb-3">{aiError}</p>}

                     <button 
                        onClick={() => handleGeneratePlan(true)}
                        disabled={isGenerating || !importText.trim()}
                        className="w-full py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        {isGenerating ? <><Loader2 className="animate-spin" size={16}/> {t.analyzing}</> : <><Sparkles size={16}/> {t.analyze}</>}
                     </button>
                 </div>
             </div>
        )}

        {/* Day Detail Modal (Bottom Sheet) */}
        {showDayDetailModal && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-black/70 backdrop-blur-sm sm:p-4 animate-fade-in">
                <div 
                    className="bg-white dark:bg-charcoal-800 w-full md:w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl p-6 max-h-[90vh] md:max-h-[80vh] flex flex-col"
                    style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
                >
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <div>
                            <h3 className="font-bold text-xl">{selectedDate}</h3>
                            <p className="text-xs text-gray-500">{HK_HOLIDAYS[selectedDate] || '無特殊節日'}</p>
                        </div>
                        <button onClick={() => setShowDayDetailModal(false)}><X size={24} className="text-gray-400"/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[150px]">
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
                                        <span className="text-xs font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">{event.time}</span>
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

                        {/* Empty State */}
                        {!schedule.some(s => s.date === selectedDate) && !events.some(e => e.date === selectedDate) && (
                            <div className="text-center py-8 text-gray-400">
                                <Info size={32} className="mx-auto mb-2 opacity-30"/>
                                <p className="text-sm">本日無安排事項</p>
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
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
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
            <div className="fixed inset-0 z-[60] flex flex-col justify-end md:justify-center md:items-center bg-black/70 backdrop-blur-sm sm:p-4 animate-fade-in">
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
