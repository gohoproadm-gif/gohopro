
import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_PLANS, HK_HOLIDAYS } from '../constants';
import { DailyPlan, ScheduledWorkout, WorkoutRecord, ExerciseSetLog, CalendarEvent, NutritionLog, UserProfile, Exercise, Language } from '../types';
import { Calendar as CalendarIcon, List, ChevronRight, ChevronLeft, Check, Dumbbell, Sparkles, Loader2, X, Timer, AlertTriangle, Plus, Trash2, Utensils, Clock, History as HistoryIcon, ArrowUpRight, Settings, Minus, RefreshCw, RotateCcw, PenTool, Flame, Pencil, Save, Trophy, Share2, ClipboardPaste, BrainCircuit, Box, Bell } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { apiGetSchedule, apiSaveSchedule, apiGetEvents, apiSaveEvent, apiDeleteEvent } from '../lib/db';

type Mode = 'TIMETABLE' | 'PLANS' | 'CREATE' | 'MANUAL_CREATE' | 'IMPORT_TEXT' | 'ACTIVE_SESSION' | 'SUMMARY';

interface WorkoutProps {
  autoStart?: boolean;
  onAutoStartConsumed?: () => void;
  onFinishWorkout?: (record: WorkoutRecord) => void;
  historyLogs?: WorkoutRecord[]; 
  userProfile: UserProfile;
  onGoToSettings: () => void;
  nutritionLogs: NutritionLog[];
  onDeleteNutrition: (id: string) => Promise<void>;
  language: Language;
  externalPlanToStart?: DailyPlan | null; // New Prop
}

// Singleton AudioContext to prevent browser limits
let audioCtx: AudioContext | null = null;

const playBeep = (count: number = 1) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    try {
        if (!audioCtx || audioCtx.state === 'closed') {
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const playTone = (time: number) => {
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, time);
            osc.frequency.exponentialRampToValueAtTime(440, time + 0.1);
            
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            
            osc.start(time);
            osc.stop(time + 0.2);
        };

        const now = audioCtx.currentTime;
        for (let i = 0; i < count; i++) {
            playTone(now + i * 0.3);
        }
    } catch (e) {
        console.error("Audio error", e);
    }
    
    // Enhanced Vibration Pattern: Long, Pause, Long (more noticeable in pocket)
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
    }
};

// Utility to clean JSON string from Markdown blocks AND DeepSeek <think> tags
const cleanJson = (text: string) => {
    if (!text) return "{}";
    
    // 1. Remove DeepSeek R1 <think> tags content
    let clean = text.replace(/<think>[\s\S]*?<\/think>/g, '');
    
    // 2. Remove Markdown code blocks
    clean = clean.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 3. Extract JSON object
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
};

const LOADING_TIPS = [
    "正在分析肌群結構...",
    "正在計算最佳組數與次數...",
    "DeepSeek 正在思考最佳訓練路徑...",
    "AI 正在評估您的恢復能力...",
    "正在為您客製化熱身流程...",
    "肌肉是在休息時生長的，記得睡飽喔！",
    "正在搜尋最有效的訓練動作..."
];

const Workout: React.FC<WorkoutProps> = ({ 
    autoStart, 
    onAutoStartConsumed, 
    onFinishWorkout, 
    historyLogs = [], 
    userProfile, 
    onGoToSettings,
    nutritionLogs,
    onDeleteNutrition,
    language,
    externalPlanToStart
}) => {
  const [mode, setMode] = useState<Mode>('TIMETABLE');
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const [activePlan, setActivePlan] = useState<DailyPlan | null>(null);

  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionLogs, setSessionLogs] = useState<Record<string, ExerciseSetLog[]>>({});
  const [restTimer, setRestTimer] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);

  // Plans Management - Lazy Initialization for Robustness
  const [allPlans, setAllPlans] = useState<DailyPlan[]>(() => {
      try {
          const savedPlans = localStorage.getItem('fitlife_plans');
          return savedPlans ? JSON.parse(savedPlans) : DEFAULT_PLANS;
      } catch (e) {
          return DEFAULT_PLANS;
      }
  });

  // Delete Confirmation State (Unified)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
      isOpen: boolean, 
      type: 'PLAN' | 'MEAL' | 'EVENT' | 'WORKOUT',
      id: string | null, 
      title: string
  }>({
      isOpen: false,
      type: 'PLAN',
      id: null,
      title: ''
  });

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [loadingTip, setLoadingTip] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<'GYM' | 'DUMBBELL' | 'BODYWEIGHT'>('GYM');

  // Import Text State
  const [importText, setImportText] = useState('');

  // Manual Create / Edit State
  const [manualPlanTitle, setManualPlanTitle] = useState('');
  const [manualExercises, setManualExercises] = useState<{name: string, sets: number, reps: string, weight: number, section: 'warmup' | 'main' | 'core'}[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Add Event/Workout Modal
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventType, setEventType] = useState<'ACTIVITY' | 'WORKOUT'>('WORKOUT');
  const [newEventData, setNewEventData] = useState<{title: string, time: string, description: string}>({title: '', time: '09:00', description: ''});
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  // Translations Map
  const t = {
    zh: {
        timetable: '時間表',
        library: '課表庫',
        warmup: '熱身',
        main: '主訓練',
        core: '核心 / 收操',
        start: '開始',
        resting: '休息中',
        workoutProgress: '訓練進行中',
        finish: '結束訓練',
        skip: '跳過',
        done: '完成！',
        save: '儲存紀錄',
        manual: '手動建立課表',
        ai: 'AI 智慧排課',
        import: '貼上文字匯入課表',
        createPlan: '生成課表',
        generating: 'AI 思考中...',
        analyzing: '自動轉換為課表',
        planName: '課表名稱',
        addExercise: '新增動作',
        savePlan: '儲存課表',
        updatePlan: '更新課表',
        noEvents: '暫無行程，點擊右上角 "+" 新增活動或選擇課表。',
        confirmDelete: '確認刪除？',
        delete: '刪除',
        cancel: '取消',
        addToSchedule: '加入行程',
        edit: '編輯',
        overview: '當日行程概覽',
        addActivity: '新增至時間表',
        workout: '安排訓練',
        activity: '一般活動',
        restFinished: '休息結束！',
        goNextSet: '是時候開始下一組了 💪',
        enableNotify: '開啟通知',
    },
    en: {
        timetable: 'Timetable',
        library: 'Library',
        warmup: 'Warmup',
        main: 'Main Workout',
        core: 'Core / Cooldown',
        start: 'Start',
        resting: 'Resting',
        workoutProgress: 'In Progress',
        finish: 'Finish',
        skip: 'Skip',
        done: 'Completed!',
        save: 'Save Record',
        manual: 'Manual Create',
        ai: 'AI Generator',
        import: 'Import from Text',
        createPlan: 'Generate Plan',
        generating: 'Thinking...',
        analyzing: 'Convert to Plan',
        planName: 'Plan Name',
        addExercise: 'Add Exercise',
        savePlan: 'Save Plan',
        updatePlan: 'Update Plan',
        noEvents: 'No events. Click "+" to add activity or workout.',
        confirmDelete: 'Confirm Delete?',
        delete: 'Delete',
        cancel: 'Cancel',
        addToSchedule: 'Add to Schedule',
        edit: 'Edit',
        overview: 'Daily Overview',
        addActivity: 'Add to Schedule',
        workout: 'Workout',
        activity: 'Activity',
        restFinished: 'Rest Finished!',
        goNextSet: 'Time for the next set 💪',
        enableNotify: 'Enable Alerts',
    }
  }[language];

  // Initial Data Load & Permission Request
  useEffect(() => {
    const loadData = async () => {
        const s = await apiGetSchedule();
        setSchedule(s);
        const e = await apiGetEvents();
        setEvents(e);
    };
    loadData();

    // Request Notification Permission on mount
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
  }, []);

  // Cycle loading tips
  useEffect(() => {
      let interval: any;
      if (isGenerating) {
          setLoadingTip(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);
          interval = setInterval(() => {
              setLoadingTip(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);
          }, 2500);
      }
      return () => clearInterval(interval);
  }, [isGenerating]);

  // SESSION PERSISTENCE: Restore session on mount
  useEffect(() => {
      const savedSession = localStorage.getItem('fitlife_active_session');
      if (savedSession) {
          try {
              const data = JSON.parse(savedSession);
              // Only restore if data looks valid and implies an active session
              if (data.mode === 'ACTIVE_SESSION' && data.activePlan && data.sessionLogs) {
                  setActivePlan(data.activePlan);
                  setSessionLogs(data.sessionLogs);
                  setSessionStartTime(data.sessionStartTime || Date.now());
                  setMode('ACTIVE_SESSION');
                  if (data.isResting && data.restTimer > 0) {
                      setIsResting(true);
                      setRestTimer(data.restTimer); // Note: timer might be off by the time elapsed while closed, simple restore for now
                  }
              }
          } catch (e) {
              console.error("Failed to restore session", e);
              localStorage.removeItem('fitlife_active_session');
          }
      }
  }, []);

  // SESSION PERSISTENCE: Save session on change
  useEffect(() => {
      if (mode === 'ACTIVE_SESSION' && activePlan) {
          const sessionData = {
              mode,
              activePlan,
              sessionLogs,
              sessionStartTime,
              isResting,
              restTimer
          };
          localStorage.setItem('fitlife_active_session', JSON.stringify(sessionData));
      } else if (mode === 'TIMETABLE') {
          // Clear only when explicitly back to timetable (finished or cancelled)
          localStorage.removeItem('fitlife_active_session');
      }
  }, [mode, activePlan, sessionLogs, sessionStartTime, isResting, restTimer]);

  // Ensure selectedPlanId has a value once plans are loaded
  useEffect(() => {
      if (allPlans.length > 0 && !selectedPlanId) {
          setSelectedPlanId(allPlans[0].id);
      }
  }, [allPlans, selectedPlanId]);

  useEffect(() => {
      if (autoStart && onAutoStartConsumed) {
          if (externalPlanToStart) {
              // Priority: Start the specific plan passed (e.g. from History repeat)
              handleStartSession(externalPlanToStart);
          } else {
              // Default: Check today's schedule
              const todayPlanId = schedule.find(s => s.date === selectedDate)?.planId;
              const planToStart = allPlans.find(p => p.id === todayPlanId) || allPlans[0];
              handleStartSession(planToStart);
          }
          onAutoStartConsumed();
      }
  }, [autoStart, externalPlanToStart]);

  useEffect(() => {
      let interval: any;
      if (isResting && restTimer > 0) {
          interval = setInterval(() => {
              setRestTimer(prev => {
                  if (prev <= 1) {
                      // Timer Finished
                      playBeep(3);
                      
                      // Trigger System Notification
                      if ("Notification" in window && Notification.permission === "granted") {
                          try {
                              new Notification(t.restFinished, {
                                  body: t.goNextSet,
                                  icon: '/icon.png', // Fallback icon path
                                  vibrate: [200, 100, 200]
                              } as any);
                          } catch (e) {
                              console.warn("Notification failed", e);
                          }
                      }

                      setIsResting(false);
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isResting, restTimer, language]);

  const updateAndSavePlans = (newPlans: DailyPlan[]) => {
      setAllPlans(newPlans);
      localStorage.setItem('fitlife_plans', JSON.stringify(newPlans));
  };

  const requestNotificationPermission = () => {
      if ("Notification" in window) {
          Notification.requestPermission();
      }
  };

  // --- Smart Pre-fill Logic ---
  const findLastSessionStats = (exerciseName: string) => {
      for (const record of historyLogs) {
          if (!record.details) continue;
          const match = record.details.find(d => d.exerciseName === exerciseName);
          // Find the best set (highest weight) or just the last working set
          if (match && match.sets.length > 0) {
              const completedSets = match.sets.filter(s => s.completed && s.weight > 0);
              if (completedSets.length > 0) {
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
          // If exercise has explicit weight (e.g. from repeat), use it. otherwise check history.
          let defaultWeight = ex.weight || 0;
          let defaultReps = parseInt(ex.reps) || 10;

          if (defaultWeight === 0) {
              const lastStats = findLastSessionStats(ex.name);
              if (lastStats) {
                  defaultWeight = lastStats.weight;
                  defaultReps = lastStats.reps;
              }
          }

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

  // Transition to Summary View
  const handleFinishSession = async () => {
      setMode('SUMMARY');
      // Pause rest timer if active
      setIsResting(false);
  };

  const calculateSessionStats = () => {
      if (!activePlan) return { duration: 0, volume: 0, completedSets: 0, totalSets: 0 };
      const duration = Math.round((Date.now() - sessionStartTime) / 60000);
      let volume = 0;
      let completedSets = 0;
      let totalSets = 0;

      Object.values(sessionLogs).forEach((logs: ExerciseSetLog[]) => {
          totalSets += logs.length;
          logs.forEach(l => {
              if (l.completed) {
                  completedSets++;
                  if (l.weight > 0 && l.reps > 0) volume += l.weight * l.reps;
              }
          });
      });

      return { duration, volume, completedSets, totalSets };
  };

  const handleConfirmFinish = async () => {
      if (!activePlan) return;
      const { duration } = calculateSessionStats();
      
      const record: WorkoutRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          type: activePlan.title,
          duration: duration,
          calories: duration * 6, // Rough estimate
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

      // Cleanup
      localStorage.removeItem('fitlife_active_session');
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

  // --- Deletion Handlers ---
  
  const initiateDelete = (e: React.MouseEvent, type: 'PLAN' | 'MEAL' | 'EVENT' | 'WORKOUT', id: string, title: string) => {
      e.stopPropagation();
      e.preventDefault();
      setDeleteConfirmation({ isOpen: true, type, id, title });
  };

  const executeDelete = async () => {
      const { type, id } = deleteConfirmation;
      if (!id) return;

      if (type === 'PLAN') {
          setAllPlans(prev => {
              const updatedPlans = prev.filter(p => p.id !== id);
              localStorage.setItem('fitlife_plans', JSON.stringify(updatedPlans));
              return updatedPlans;
          });
      } else if (type === 'MEAL') {
          // Sync deletion by calling prop method
          await onDeleteNutrition(id);
      } else if (type === 'EVENT') {
          setEvents(prev => prev.filter(e => e.id !== id));
          await apiDeleteEvent(id);
      } else if (type === 'WORKOUT') {
          const newSchedule = schedule.filter(s => !(s.planId === id && s.date === selectedDate));
          setSchedule(newSchedule);
          await apiSaveSchedule(newSchedule);
      }

      setDeleteConfirmation({ isOpen: false, type: 'PLAN', id: null, title: '' });
  };

  // ... (API Configuration Helpers) ...
  const getApiKey = () => {
    // 1. Check System Key (Admin set)
    const systemKey = localStorage.getItem('GO_SYSTEM_GOOGLE_API_KEY');
    if (systemKey) return systemKey;

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

  const getDeepSeekConfig = () => {
      // 1. Check System Keys
      let apiKey = localStorage.getItem('GO_SYSTEM_OPENAI_API_KEY');
      let baseUrl = localStorage.getItem('GO_SYSTEM_OPENAI_BASE_URL');
      let model = localStorage.getItem('GO_SYSTEM_OPENAI_MODEL');

      // 2. Fallback to User Profile
      if (!apiKey) apiKey = userProfile.openaiApiKey || null;
      if (!baseUrl) baseUrl = userProfile.openaiBaseUrl || null;
      if (!model) model = userProfile.openaiModel || null;

      // 3. Fallback to Env
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

  const callOpenAI = async (prompt: string, systemPrompt: string = "") => {
        const { apiKey, baseUrl, model } = getDeepSeekConfig();

        if (!apiKey) throw new Error("API Key 缺失。請至設定頁面配置 API Key。");

        const body: any = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]
        };

        // DeepSeek R1 (reasoner) does NOT support response_format: json_object. 
        // Only add it if model is NOT reasoner.
        if (!model.includes('reasoner')) {
            body.response_format = { type: 'json_object' };
        }

        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "AI API 請求失敗");
        }

        const data = await response.json();
        return JSON.parse(cleanJson(data.choices[0].message.content));
  };

  const callGemini = async (prompt: string) => {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("系統未偵測到 Google API Key。");
      
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
      });
      return JSON.parse(cleanJson(response.text || "{}"));
  };

  // --- MAIN AI GENERATOR LOGIC ---
  const handleGeneratePlan = async () => {
      if (!aiPrompt.trim()) return;
      setAiError(null);
      setIsGenerating(true);
      
      const targetLang = language === 'zh' ? 'Traditional Chinese (繁體中文)' : 'English';
      
      // Contextual Equipment Info
      let equipContext = "";
      if (selectedEquipment === 'GYM') equipContext = "Equipment available: Full commercial gym (machines, barbells, cables, dumbbells).";
      if (selectedEquipment === 'DUMBBELL') equipContext = "Equipment available: Dumbbells only and a bench. No machines.";
      if (selectedEquipment === 'BODYWEIGHT') equipContext = "Equipment available: Bodyweight only (Calisthenics), maybe a pull-up bar.";

      const systemPrompt = `Create a workout plan.
      **Context**: ${equipContext}
      **Goal**: Based on user request. If user asks for DeepSeek logic, use <think> tags to explain the reasoning briefly before the JSON.
      **Output Language**: Strictly output all text (titles, exercise names, focus) in ${targetLang}.
      **Format**: Return strictly valid JSON (outside of <think> tags) with structure: { "title": "Plan Name", "focus": "Target Area", "duration": 45, "exercises": [ { "name": "Exercise Name", "sets": 3, "reps": "12", "section": "warmup" | "main" | "core" } ] }`;
      
      const userPromptMsg = aiPrompt;
      const { apiKey } = getDeepSeekConfig();

      // Fixed Logic: Default to Google unless explicitly OpenAI/DeepSeek
      let shouldUseOpenAI = false;
      if (userProfile.aiProvider === 'openai') {
          shouldUseOpenAI = true;
      } else if (userProfile.aiProvider === 'google') {
          shouldUseOpenAI = false;
      } else {
          // Default to Google if available, else try OpenAI
          const googleKey = getApiKey();
          if (googleKey) shouldUseOpenAI = false;
          else shouldUseOpenAI = !!apiKey;
      }

      setCurrentProvider(shouldUseOpenAI ? 'DeepSeek/OpenAI' : 'Google Gemini');

      try {
          let result;
          if (shouldUseOpenAI && apiKey) {
               try {
                   result = await callOpenAI(userPromptMsg, systemPrompt);
               } catch (openAiError: any) {
                   console.warn("DeepSeek failed, attempting fallback to Gemini...", openAiError);
                   const msg = openAiError.message || "";
                   // Fallback logic
                   if (msg.includes("Insufficient Balance") || msg.includes("Quota")) {
                       setAiError("DeepSeek 餘額不足，已自動切換至 Google Gemini...");
                       setCurrentProvider('Gemini (Fallback)');
                       // Fallback to Gemini
                       result = await callGemini(`Create a workout plan based on this request: "${userPromptMsg}". Context: ${equipContext}.
                        **Output Language**: Strictly output all text (titles, exercise names, focus) in ${targetLang}.
                        Return strictly JSON. Structure: { "title": "Plan Name", "focus": "Target Area", "duration": 45, "exercises": [ { "name": "Exercise Name", "sets": 3, "reps": "12", "section": "warmup" | "main" | "core" } ] }`);
                   } else {
                       throw openAiError; // Re-throw if it's another error
                   }
               }
          } else {
               // Google Gemini Call
               result = await callGemini(`Create a workout plan based on this request: "${userPromptMsg}". Context: ${equipContext}.
               **Output Language**: Strictly output all text (titles, exercise names, focus) in ${targetLang}.
               Return strictly JSON. Structure: { "title": "Plan Name", "focus": "Target Area", "duration": 45, "exercises": [ { "name": "Exercise Name", "sets": 3, "reps": "12", "section": "warmup" | "main" | "core" } ] }`);
          }
          
          if (result && result.title) {
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
                      section: e.section || 'main',
                      completed: false
                  }))
              };
              
              const newSchedule = [...schedule, { date: selectedDate, planId: newPlan.id, completed: false }];
              setSchedule(newSchedule);
              await apiSaveSchedule(newSchedule);
              updateAndSavePlans([...allPlans, newPlan]);
              
              setAiPrompt('');
              setMode('TIMETABLE');
          }
      } catch (e: any) {
          let msg = e.message || "未知錯誤";
          if (msg.includes("Insufficient Balance")) {
              setAiError("生成失敗: DeepSeek 帳戶餘額為 0 (需充值)。請切換至 Google Gemini 免費版。");
          } else if (msg.includes("API Key")) {
               setAiError("生成失敗: API Key 缺失 (請檢查設定)");
          } else {
               setAiError("生成失敗: " + msg);
          }
      } finally {
          setIsGenerating(false);
      }
  };

  // ... (Other functions remains unchanged) ...
  // --- Import Text Plan ---
  const handleImportTextPlan = async () => {
      if (!importText.trim()) return;
      setAiError(null);
      setIsGenerating(true);
      
      const targetLang = language === 'zh' ? 'Traditional Chinese (繁體中文)' : 'English';
      const systemPrompt = `Analyze the unstructured workout text provided by the user. 
      Goal: Convert it into a structured JSON workout plan.
      
      Rules for Analysis:
      1. Extract a suitable Title (e.g., "Imported Chest Day").
      2. Identify Target Focus (e.g., "Chest/Back").
      3. Extract Exercises with Sets and Reps. If "reps" is a range (e.g., "8-12"), keep it as a string.
      4. **CRITICAL**: Classify each exercise into one of three sections:
         - "warmup": Exercises explicitly labeled as warmup, mobility, activation, or dynamic stretching.
         - "core": Exercises labeled as core, abs, plank, OR **Cooldown/Stretching** exercises at the end of the list.
         - "main": All other resistance training exercises.
      5. **Output Language**: Strictly output all text (titles, exercise names, focus) in ${targetLang}. Translate if necessary.
      
      JSON Structure:
      { 
        "title": "String", 
        "focus": "String", 
        "duration": 60, 
        "exercises": [ 
          { "name": "String", "sets": Number, "reps": "String", "section": "warmup" | "main" | "core" } 
        ] 
      }`;

      const prompt = `Convert this text to workout JSON: \n\n${importText}`;
      const { apiKey } = getDeepSeekConfig();

      // Fixed Logic: Default to Google unless explicitly OpenAI/DeepSeek
      let shouldUseOpenAI = false;
      if (userProfile.aiProvider === 'openai') {
          shouldUseOpenAI = true;
      } else if (userProfile.aiProvider === 'google') {
          shouldUseOpenAI = false;
      } else {
          // Default to Google if available
          const googleKey = getApiKey();
          if (googleKey) shouldUseOpenAI = false;
          else shouldUseOpenAI = !!apiKey;
      }

      setCurrentProvider(shouldUseOpenAI ? 'DeepSeek/OpenAI' : 'Google Gemini');

      try {
          let result;
          if (shouldUseOpenAI && apiKey) {
              try {
                  result = await callOpenAI(prompt, systemPrompt);
              } catch (openAiError: any) {
                   console.warn("DeepSeek failed, attempting fallback to Gemini...", openAiError);
                   const msg = openAiError.message || "";
                   // Fallback logic
                   if (msg.includes("Insufficient Balance") || msg.includes("Quota")) {
                       setAiError("DeepSeek 餘額不足，已自動切換至 Google Gemini...");
                       setCurrentProvider('Gemini (Fallback)');
                       // Fallback to Gemini
                       result = await callGemini(systemPrompt + "\n\n" + prompt);
                   } else {
                       throw openAiError; // Re-throw if it's another error
                   }
              }
          } else {
              result = await callGemini(systemPrompt + "\n\n" + prompt);
          }

          if (result && result.title) {
               const newPlan: DailyPlan = {
                  id: 'imp_' + Date.now(),
                  title: result.title,
                  focus: result.focus || 'Imported',
                  duration: result.duration || 60,
                  exercises: result.exercises.map((e: any, i: number) => ({
                      id: `iex_${i}`,
                      name: e.name,
                      sets: e.sets || 3,
                      reps: e.reps || "10",
                      section: e.section || 'main',
                      completed: false
                  }))
              };
              
              updateAndSavePlans([...allPlans, newPlan]);
              setImportText('');
              setMode('PLANS');
          }

      } catch (e: any) {
          console.error("Import failed", e);
          let msg = e.message || "無法解析文字";
          if (msg.includes("Insufficient Balance")) {
              setAiError("匯入失敗: DeepSeek 帳戶餘額為 0 (需充值)。請切換至 Google Gemini 免費版。");
          } else {
              setAiError("匯入失敗: " + msg);
          }
      } finally {
          setIsGenerating(false);
      }
  };

  // --- Manual Create / Edit Functions ---
  const addManualExercise = (section: 'warmup' | 'main' | 'core') => {
      setManualExercises([...manualExercises, { name: '', sets: 3, reps: '10', weight: 0, section }]);
  };

  const updateManualExercise = (index: number, field: string, value: any) => {
      const newEx = [...manualExercises];
      newEx[index] = { ...newEx[index], [field]: value };
      setManualExercises(newEx);
  };

  const removeManualExercise = (index: number) => {
      setManualExercises(manualExercises.filter((_, i) => i !== index));
  };

  const handleEditPlan = (e: React.MouseEvent, plan: DailyPlan) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingPlanId(plan.id);
      setManualPlanTitle(plan.title);
      // Map existing exercises to the manual form format
      const formattedExercises = plan.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight || 0,
          section: ex.section || 'main'
      }));
      setManualExercises(formattedExercises);
      setMode('MANUAL_CREATE');
  };

  const handleSaveManualPlan = async () => {
      if (!manualPlanTitle.trim()) {
          alert("請輸入課表名稱");
          return;
      }
      if (manualExercises.length === 0) {
          alert("請至少新增一個動作");
          return;
      }

      if (editingPlanId) {
          // Update existing
          const updatedPlans = allPlans.map(p => {
              if (p.id === editingPlanId) {
                  return {
                      ...p,
                      title: manualPlanTitle,
                      focus: language === 'zh' ? "自訂訓練" : "Custom Workout",
                      exercises: manualExercises.map((e, i) => ({
                          id: `mex_${editingPlanId}_${i}`, // keep somewhat stable or reset
                          name: e.name || '未命名動作',
                          sets: e.sets,
                          reps: e.reps,
                          weight: e.weight,
                          section: e.section,
                          completed: false
                      }))
                  };
              }
              return p;
          });
          updateAndSavePlans(updatedPlans);
      } else {
          // Create new
          const newPlan: DailyPlan = {
              id: 'man_' + Date.now(),
              title: manualPlanTitle,
              focus: language === 'zh' ? "自訂訓練" : "Custom Workout",
              duration: 60,
              exercises: manualExercises.map((e, i) => ({
                  id: `mex_${i}`,
                  name: e.name || '未命名動作',
                  sets: e.sets,
                  reps: e.reps,
                  weight: e.weight,
                  section: e.section,
                  completed: false
              }))
          };
          updateAndSavePlans([...allPlans, newPlan]);
      }
      
      // Reset
      setEditingPlanId(null);
      setManualPlanTitle('');
      setManualExercises([]);
      setMode('PLANS'); // Go back to library list
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
              
              // Ensure audio context is ready on user gesture
              if (!audioCtx) {
                  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                  if (AudioContextClass) audioCtx = new AudioContextClass();
              }
              if (audioCtx && audioCtx.state === 'suspended') {
                  audioCtx.resume();
              }
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

  // ... (Keep Timeline and Calendar Rendering) ...
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
      
      const dailyWorkouts = schedule.filter(s => s.date === selectedDate);
      dailyWorkouts.forEach(s => {
          const plan = allPlans.find(p => p.id === s.planId);
          items.push({
              time: '--:--', 
              type: 'WORKOUT',
              title: plan?.title || '訓練',
              detail: s.completed ? '已完成' : '待完成',
              id: s.planId,
              originalObj: s
          });
      });

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

  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

  // --- Render Active Session Grouped ---
  const renderExerciseGroup = (sectionName: string, exercises: Exercise[], color: string, icon: any) => {
      if (exercises.length === 0) return null;
      return (
          <div className="space-y-4 mb-8">
              <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${color}`}>
                  {icon} {sectionName}
              </h3>
              {exercises.map((exercise) => {
                  const prevStats = getPreviousPerformance(exercise.name);
                  return (
                  <div key={exercise.id} className="bg-white dark:bg-charcoal-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-charcoal-700">
                      <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-lg flex items-center gap-2">
                              <Dumbbell size={18} className="text-neon-blue"/>
                              {exercise.name}
                          </h4>
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
      );
  };

  // --- Active Session View ---
  if (mode === 'ACTIVE_SESSION' && activePlan) {
      // Group exercises
      const warmupEx = activePlan.exercises.filter(e => e.section === 'warmup');
      const mainEx = activePlan.exercises.filter(e => !e.section || e.section === 'main');
      const coreEx = activePlan.exercises.filter(e => e.section === 'core');

      return (
          <div className="pb-20 relative min-h-[80vh]">
              <div className="sticky top-0 z-30 bg-white dark:bg-charcoal-900 border-b border-gray-200 dark:border-charcoal-700 p-4 -mx-4 md:-mx-8 mb-6 shadow-sm flex justify-between items-center">
                  <div>
                      <h2 className="text-xl font-bold">{activePlan.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Timer size={14} className={isResting ? "text-cta-orange animate-pulse" : ""} />
                          {isResting ? (
                              <span className="font-bold text-cta-orange">{t.resting} {restTimer}s</span>
                          ) : (
                              <span>{t.workoutProgress}</span>
                          )}
                      </div>
                  </div>
                  <button onClick={handleFinishSession} className="bg-neon-green text-charcoal-900 font-bold px-4 py-2 rounded-lg text-sm shadow-lg shadow-neon-green/20">{t.finish}</button>
              </div>

              <div className="space-y-2">
                  {renderExerciseGroup(t.warmup, warmupEx, "text-orange-400", <Flame size={16}/>)}
                  {renderExerciseGroup(t.main, mainEx, "text-neon-blue", <Dumbbell size={16}/>)}
                  {renderExerciseGroup(t.core, coreEx, "text-purple-400", <RotateCcw size={16}/>)}
              </div>

              {isResting && (
                  <div className="fixed bottom-20 left-4 right-4 bg-charcoal-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between z-40 animate-fade-in border border-charcoal-700">
                      <div>
                          <div className="text-xs text-gray-400 font-bold uppercase">Resting</div>
                          <div className="text-2xl font-mono font-bold text-cta-orange">{restTimer}s</div>
                      </div>
                      <div className="flex items-center gap-2">
                          {/* Notification Hint */}
                          {("Notification" in window && Notification.permission !== "granted") && (
                              <button onClick={requestNotificationPermission} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-yellow-400" title={t.enableNotify}>
                                  <Bell size={16} />
                              </button>
                          )}
                          <button onClick={() => setRestTimer(t => Math.max(0, t - 10))} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center justify-center w-10">
                              <Minus size={16} />
                          </button>
                          <button onClick={() => setRestTimer(t => t + 30)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center justify-center w-10">
                              <Plus size={16} />
                          </button>
                          <button onClick={() => setIsResting(false)} className="px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-red-400 font-bold text-sm">
                              {t.skip}
                          </button>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- Summary View ---
  if (mode === 'SUMMARY' && activePlan) {
      const stats = calculateSessionStats();
      return (
          <div className="flex flex-col items-center justify-center py-10 animate-fade-in text-center space-y-8">
              <div className="relative">
                  <div className="absolute inset-0 bg-neon-green/20 blur-xl rounded-full"></div>
                  <Trophy size={80} className="text-neon-green relative z-10" />
              </div>
              
              <div className="space-y-2">
                  <h2 className="text-3xl font-black text-gray-800 dark:text-white">{t.done}</h2>
                  <p className="text-gray-500">{activePlan.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <div className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-700 flex flex-col items-center">
                      <Clock size={24} className="text-neon-blue mb-2" />
                      <span className="text-2xl font-bold">{stats.duration}</span>
                      <span className="text-xs text-gray-500">分鐘</span>
                  </div>
                  <div className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-700 flex flex-col items-center">
                      <Dumbbell size={24} className="text-cta-orange mb-2" />
                      <span className="text-2xl font-bold">{stats.volume.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">總容量 (kg)</span>
                  </div>
                  <div className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-700 flex flex-col items-center">
                      <Check size={24} className="text-neon-green mb-2" />
                      <span className="text-2xl font-bold">{stats.completedSets} / {stats.totalSets}</span>
                      <span className="text-xs text-gray-500">完成組數</span>
                  </div>
                  <div className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-700 flex flex-col items-center">
                      <Flame size={24} className="text-red-500 mb-2" />
                      <span className="text-2xl font-bold">~{stats.duration * 6}</span>
                      <span className="text-xs text-gray-500">消耗卡路里</span>
                  </div>
              </div>

              <button 
                  onClick={handleConfirmFinish}
                  className="w-full max-w-sm bg-neon-green hover:bg-lime-400 text-charcoal-900 font-bold py-4 rounded-xl shadow-lg shadow-neon-green/20 transition-all active:scale-95"
              >
                  {t.save}
              </button>
          </div>
      );
  }

  // --- Standard View ---
  return (
    <div className="space-y-6 pb-20">
        {/* Toggle Mode */}
        <div className="bg-gray-100 dark:bg-charcoal-800 p-1 rounded-xl flex">
            <button 
                onClick={() => setMode('TIMETABLE')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'TIMETABLE' ? 'bg-white dark:bg-charcoal-900 shadow text-charcoal-900 dark:text-white' : 'text-gray-500'}`}
            >
                <CalendarIcon size={16} /> {t.timetable}
            </button>
            <button 
                onClick={() => setMode('PLANS')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'PLANS' || mode === 'CREATE' || mode === 'MANUAL_CREATE' || mode === 'IMPORT_TEXT' ? 'bg-white dark:bg-charcoal-900 shadow text-charcoal-900 dark:text-white' : 'text-gray-500'}`}
            >
                <List size={16} /> {t.library}
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
                            <p className="text-sm text-gray-500">{t.overview}</p>
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
                                                    const plan = allPlans.find(p => p.id === item.id);
                                                    if(plan) handleStartSession(plan);
                                                }}
                                                className="text-xs bg-cta-orange text-white px-3 py-1.5 rounded-full font-bold shadow-lg shadow-orange-500/20"
                                            >
                                                {t.start}
                                            </button>
                                        )}
                                        {item.type === 'ACTIVITY' ? (
                                            <button 
                                                onClick={(e) => initiateDelete(e, 'EVENT', item.id, item.title)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        ) : item.type === 'WORKOUT' && !item.originalObj.completed ? (
                                            <button 
                                                onClick={(e) => initiateDelete(e, 'WORKOUT', item.id, item.title)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        ) : item.type === 'MEAL' ? (
                                            <button 
                                                onClick={(e) => initiateDelete(e, 'MEAL', item.id, item.title)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"
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
                                {t.noEvents}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* AI Creator */}
        {mode === 'CREATE' && (
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-gray-200 dark:border-charcoal-700 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="text-cta-orange" /> {t.ai}</h3>
                    <div className="flex items-center gap-2">
                        {currentProvider && <span className="text-[10px] bg-gray-100 dark:bg-charcoal-900 px-2 py-1 rounded text-gray-500 font-bold">Using: {currentProvider}</span>}
                        <button onClick={() => setMode('PLANS')}><X size={20} className="text-gray-400"/></button>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="text-xs text-gray-500 bg-gray-100 dark:bg-charcoal-900 p-2 rounded flex items-center gap-2">
                        <span className="shrink-0">Model:</span>
                        <span className={`font-bold px-2 py-0.5 rounded ${userProfile.aiProvider === 'openai' ? 'bg-neon-purple/10 text-neon-purple' : 'bg-neon-blue/10 text-neon-blue'}`}>
                            {userProfile.aiProvider === 'openai' ? 'OpenAI / DeepSeek' : 'Google Gemini'}
                        </span>
                        {userProfile.aiProvider === 'openai' && !userProfile.openaiApiKey && !getDeepSeekConfig().apiKey && (
                            <span className="text-red-500 text-[10px] ml-auto flex items-center gap-1"><AlertTriangle size={10}/> No API Key</span>
                        )}
                        {userProfile.aiProvider === 'openai' && userProfile.openaiModel && userProfile.openaiModel.includes('reasoner') && (
                            <span className="text-xs font-bold text-neon-green flex items-center gap-1"><BrainCircuit size={10}/> R1 Ready</span>
                        )}
                    </div>

                    <div className="bg-gray-50 dark:bg-charcoal-900/50 p-2 rounded-xl border border-gray-200 dark:border-charcoal-700">
                        <label className="text-xs font-bold text-gray-500 mb-2 block ml-1">選擇可用器材 (Equipment)</label>
                        <div className="flex gap-2">
                            <button onClick={() => setSelectedEquipment('GYM')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border ${selectedEquipment === 'GYM' ? 'bg-white dark:bg-charcoal-800 text-neon-blue border-neon-blue' : 'text-gray-500 border-transparent hover:bg-gray-200 dark:hover:bg-charcoal-800'}`}>
                                健身房 (Full Gym)
                            </button>
                            <button onClick={() => setSelectedEquipment('DUMBBELL')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border ${selectedEquipment === 'DUMBBELL' ? 'bg-white dark:bg-charcoal-800 text-cta-orange border-cta-orange' : 'text-gray-500 border-transparent hover:bg-gray-200 dark:hover:bg-charcoal-800'}`}>
                                居家啞鈴
                            </button>
                            <button onClick={() => setSelectedEquipment('BODYWEIGHT')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border ${selectedEquipment === 'BODYWEIGHT' ? 'bg-white dark:bg-charcoal-800 text-neon-green border-neon-green' : 'text-gray-500 border-transparent hover:bg-gray-200 dark:hover:bg-charcoal-800'}`}>
                                徒手訓練
                            </button>
                        </div>
                    </div>

                    <textarea 
                        value={aiPrompt} 
                        onChange={(e) => { setAiPrompt(e.target.value); setAiError(null); }} 
                        placeholder={language === 'zh' ? "例如：我只有30分鐘，想練胸肌和三頭肌..." : "e.g., I have 30 mins, want to train chest and triceps..."} 
                        className="w-full h-32 p-4 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange resize-none" 
                    />
                    {aiError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 text-xs rounded-lg flex flex-col items-start gap-2 w-full">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={14} className="shrink-0" />
                                <span>{aiError}</span>
                            </div>
                            {aiError.includes("設定") && (
                                <button onClick={onGoToSettings} className="underline font-bold text-red-600 dark:text-red-400">Settings</button>
                            )}
                        </div>
                    )}
                    <button onClick={handleGeneratePlan} disabled={isGenerating || !aiPrompt.trim()} className="w-full bg-cta-orange text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                        {isGenerating ? (loadingTip || t.generating) : t.createPlan}
                    </button>
                </div>
            </div>
        )}

        {/* ... (Other Modals) ... */}
        {/* ... (Delete Confirmation Modal) ... */}
        {deleteConfirmation.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-charcoal-800 w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 dark:border-charcoal-700 p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3 text-red-500">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.confirmDelete}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {deleteConfirmation.type === 'PLAN' ? 'Plan' : deleteConfirmation.type === 'MEAL' ? 'Log' : 'Item'} <span className="font-bold text-gray-800 dark:text-gray-200">"{deleteConfirmation.title}"</span>?
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setDeleteConfirmation({ isOpen: false, type: 'PLAN', id: null, title: '' })}
                            className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 dark:bg-charcoal-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-600 transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button 
                            onClick={executeDelete}
                            className="flex-1 py-2.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                        >
                            {t.delete}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ... (Manual Plan Creator) ... */}
        {mode === 'MANUAL_CREATE' && (
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-gray-200 dark:border-charcoal-700 animate-fade-in space-y-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <PenTool className="text-neon-blue" /> {editingPlanId ? t.edit : t.manual}
                    </h3>
                    <button onClick={() => setMode('PLANS')}><X size={20} className="text-gray-400"/></button>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">{t.planName}</label>
                    <input 
                        type="text" 
                        value={manualPlanTitle} 
                        onChange={e => setManualPlanTitle(e.target.value)}
                        placeholder="e.g. Leg Day"
                        className="w-full p-3 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue"
                    />
                </div>

                {['warmup', 'main', 'core'].map((section) => (
                    <div key={section} className="space-y-2">
                        <div className="flex justify-between items-center bg-gray-100 dark:bg-charcoal-900 p-2 rounded-lg">
                            <h4 className="text-sm font-bold uppercase text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                {section === 'warmup' ? <><Flame size={14} className="text-orange-400"/> {t.warmup}</> : section === 'main' ? <><Dumbbell size={14} className="text-neon-blue"/> {t.main}</> : <><RotateCcw size={14} className="text-purple-400"/> {t.core}</>}
                            </h4>
                            <button onClick={() => addManualExercise(section as any)} className="text-xs bg-white dark:bg-charcoal-800 px-2 py-1 rounded shadow-sm hover:text-neon-blue border border-gray-200 dark:border-charcoal-700"><Plus size={12} /></button>
                        </div>
                        
                        {manualExercises.filter(e => e.section === section).map((ex, idx) => {
                            // Find actual index in main array
                            const actualIdx = manualExercises.indexOf(ex);
                            return (
                                <div key={actualIdx} className="grid grid-cols-12 gap-2 items-center">
                                    <input type="text" placeholder="Name" value={ex.name} onChange={e => updateManualExercise(actualIdx, 'name', e.target.value)} className="col-span-5 p-2 rounded bg-gray-50 dark:bg-charcoal-900/50 border border-gray-200 dark:border-charcoal-700 text-xs outline-none focus:border-neon-blue"/>
                                    <input type="number" placeholder="kg" value={ex.weight} onChange={e => updateManualExercise(actualIdx, 'weight', parseFloat(e.target.value))} className="col-span-2 p-2 rounded bg-gray-50 dark:bg-charcoal-900/50 border border-gray-200 dark:border-charcoal-700 text-xs text-center outline-none focus:border-neon-blue"/>
                                    <input type="number" placeholder="sets" value={ex.sets} onChange={e => updateManualExercise(actualIdx, 'sets', parseInt(e.target.value))} className="col-span-2 p-2 rounded bg-gray-50 dark:bg-charcoal-900/50 border border-gray-200 dark:border-charcoal-700 text-xs text-center outline-none focus:border-neon-blue"/>
                                    <input type="text" placeholder="reps" value={ex.reps} onChange={e => updateManualExercise(actualIdx, 'reps', e.target.value)} className="col-span-2 p-2 rounded bg-gray-50 dark:bg-charcoal-900/50 border border-gray-200 dark:border-charcoal-700 text-xs text-center outline-none focus:border-neon-blue"/>
                                    <button onClick={() => removeManualExercise(actualIdx)} className="col-span-1 flex justify-center text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            );
                        })}
                        {manualExercises.filter(e => e.section === section).length === 0 && <div className="text-xs text-gray-400 text-center py-2">--</div>}
                    </div>
                ))}

                <button onClick={handleSaveManualPlan} className="w-full bg-cta-orange text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-transform mt-4 flex items-center justify-center gap-2">
                    <Save size={18} />
                    {editingPlanId ? t.updatePlan : t.savePlan}
                </button>
            </div>
        )}

        {/* ... (Keep existing Text Import Mode, Add Event Modal, etc.) ... */}
        {mode === 'IMPORT_TEXT' && (
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-gray-200 dark:border-charcoal-700 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><ClipboardPaste className="text-neon-purple" /> {t.import}</h3>
                    <div className="flex items-center gap-2">
                        {currentProvider && <span className="text-[10px] bg-gray-100 dark:bg-charcoal-900 px-2 py-1 rounded text-gray-500 font-bold">Using: {currentProvider}</span>}
                        <button onClick={() => setMode('PLANS')}><X size={20} className="text-gray-400"/></button>
                    </div>
                </div>
                <div className="space-y-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {language === 'zh' 
                            ? "直接貼上您的訓練計畫（例如從教練的訊息或網路文章）。AI 會自動分析動作、組數與次數，並將熱身與收操動作分類。"
                            : "Paste your workout plan here (e.g., from messages or articles). AI will analyze exercises, sets, and reps, and categorize warmup/cooldown sections."}
                    </p>
                    <textarea 
                        value={importText} 
                        onChange={(e) => { setImportText(e.target.value); setAiError(null); }} 
                        placeholder={language === 'zh' ? `例如：\n熱身：肩袖內外旋 2組15下\n槓鈴划船 4組12下\n...\n結束：上斜方拉伸 30秒` : `e.g.:\nWarmup: Rotator cuff 2x15\nBarbell Row 4x12\n...\nEnd: Upper trap stretch 30s`} 
                        className="w-full h-48 p-4 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-purple resize-none font-mono text-sm" 
                    />
                    
                    {aiError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 text-xs rounded-lg flex flex-col items-start gap-2 w-full">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={14} className="shrink-0" />
                                <span>{aiError}</span>
                            </div>
                            {aiError.includes("餘額") && (
                                <button onClick={onGoToSettings} className="underline font-bold text-red-600 dark:text-red-400 ml-6">前往設定切換 AI</button>
                            )}
                        </div>
                    )}

                    <button 
                        onClick={handleImportTextPlan} 
                        disabled={isGenerating || !importText.trim()} 
                        className="w-full bg-neon-purple text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-purple-600 transition-colors"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                        {isGenerating ? (loadingTip || t.generating) : t.analyzing}
                    </button>
                </div>
            </div>
        )}

        {showAddEventModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-charcoal-800 w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 dark:border-charcoal-700 p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">{t.addActivity}</h3>
                        <button onClick={() => setShowAddEventModal(false)}><X size={20} className="text-gray-400"/></button>
                    </div>

                    {/* Toggle Type */}
                    <div className="flex bg-gray-100 dark:bg-charcoal-900 p-1 rounded-lg mb-4">
                        <button 
                            onClick={() => setEventType('WORKOUT')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${eventType === 'WORKOUT' ? 'bg-white dark:bg-charcoal-700 shadow text-cta-orange' : 'text-gray-500'}`}
                        >
                            {t.workout}
                        </button>
                        <button 
                            onClick={() => setEventType('ACTIVITY')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${eventType === 'ACTIVITY' ? 'bg-white dark:bg-charcoal-700 shadow text-neon-blue' : 'text-gray-500'}`}
                        >
                            {t.activity}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {eventType === 'WORKOUT' ? (
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">{t.library}</label>
                                <select 
                                    className="w-full p-2 rounded-lg bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange"
                                    value={selectedPlanId}
                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                >
                                    {allPlans.map(plan => (
                                        <option key={plan.id} value={plan.id}>{plan.title} ({plan.focus})</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-2">Date: {selectedDate}</p>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Name</label>
                                    <input type="text" className="w-full p-2 rounded-lg bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue" placeholder="e.g. Meeting" value={newEventData.title} onChange={e => setNewEventData({...newEventData, title: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Time</label>
                                    <input type="time" className="w-full p-2 rounded-lg bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue" value={newEventData.time} onChange={e => setNewEventData({...newEventData, time: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Description</label>
                                    <input type="text" className="w-full p-2 rounded-lg bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue" placeholder="..." value={newEventData.description} onChange={e => setNewEventData({...newEventData, description: e.target.value})} />
                                </div>
                            </>
                        )}
                        <button onClick={handleAddScheduleItem} className="w-full bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold py-3 rounded-xl mt-2">
                            Add
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Workout;
