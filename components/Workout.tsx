
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DEFAULT_PLANS, HK_HOLIDAYS } from '../constants';
import { DailyPlan, ScheduledWorkout, WorkoutRecord, ExerciseSetLog, CalendarEvent, NutritionLog, UserProfile, Exercise, Language } from '../types';
import { Calendar as CalendarIcon, List, ChevronRight, ChevronLeft, Check, Dumbbell, Sparkles, Loader2, X, Timer, AlertTriangle, Plus, Trash2, Utensils, Clock, History as HistoryIcon, ArrowUpRight, Settings, Minus, RefreshCw, RotateCcw, PenTool, Flame, Pencil, Save, Trophy, Share2, ClipboardPaste, BrainCircuit, Box, Bell, Copy, MoreHorizontal, Footprints, Camera } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { apiGetSchedule, apiSaveSchedule, apiGetEvents, apiSaveEvent, apiDeleteEvent } from '../lib/db';
import { getPhotosFromDB, BodyPhoto } from '../lib/localDb';

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
  externalPlanToStart?: DailyPlan | null;
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
    
    // Enhanced Vibration Pattern
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
    }
};

// Utility to clean JSON string
const cleanJson = (text: string) => {
    if (!text) return "{}";
    let clean = text.replace(/<think>[\s\S]*?<\/think>/g, '');
    clean = clean.replace(/```json/g, '').replace(/```/g, '').trim();
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
  const [bodyPhotos, setBodyPhotos] = useState<BodyPhoto[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Modal for Day Details
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [viewPhoto, setViewPhoto] = useState<BodyPhoto | null>(null);

  const [activePlan, setActivePlan] = useState<DailyPlan | null>(null);

  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionLogs, setSessionLogs] = useState<Record<string, ExerciseSetLog[]>>({});
  const [restTimer, setRestTimer] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);

  // Plans Management
  const [allPlans, setAllPlans] = useState<DailyPlan[]>(() => {
      try {
          const savedPlans = localStorage.getItem('fitlife_plans');
          return savedPlans ? JSON.parse(savedPlans) : DEFAULT_PLANS;
      } catch (e) {
          return DEFAULT_PLANS;
      }
  });
  const [planToDeleteId, setPlanToDeleteId] = useState<string | null>(null);

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
  const [manualFocus, setManualFocus] = useState('');
  const [manualDuration, setManualDuration] = useState(60);
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
        core: '核心 / 拉伸',
        start: '開始',
        resting: '休息中',
        workoutProgress: '訓練進行中',
        finish: '結束訓練',
        skip: '跳過',
        done: '完成！',
        save: '儲存紀錄',
        manual: '手動建立',
        ai: 'AI 智慧排課',
        import: '文字匯入',
        createPlan: '生成課表',
        generating: 'AI 思考中...',
        analyzing: '分析並轉換',
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
        copyLast: '複製上組',
        mon: '一', tue: '二', wed: '三', thu: '四', fri: '五', sat: '六', sun: '日'
    },
    en: {
        timetable: 'Timetable',
        library: 'Library',
        warmup: 'Warmup',
        main: 'Main Workout',
        core: 'Core / Stretch',
        start: 'Start',
        resting: 'Resting',
        workoutProgress: 'In Progress',
        finish: 'Finish',
        skip: 'Skip',
        done: 'Completed!',
        save: 'Save Record',
        manual: 'Manual',
        ai: 'AI Generator',
        import: 'Import Text',
        createPlan: 'Generate Plan',
        generating: 'Thinking...',
        analyzing: 'Analyze & Convert',
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
        copyLast: 'Copy Prev',
        mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun'
    }
  }[language];

  // Initial Data Load & Permission Request
  useEffect(() => {
    const loadData = async () => {
        let s = await apiGetSchedule();
        if (s.length === 0) {
            const today = new Date();
            const starterSchedule: ScheduledWorkout[] = [];
            const plans = [DEFAULT_PLANS[0], DEFAULT_PLANS[1], null, DEFAULT_PLANS[2]];
            plans.forEach((plan, i) => {
                if (plan) {
                    const d = new Date(today);
                    d.setDate(d.getDate() + i);
                    starterSchedule.push({
                        date: d.toISOString().split('T')[0],
                        planId: plan.id,
                        completed: false
                    });
                }
            });
            s = starterSchedule;
            setSchedule(s);
            apiSaveSchedule(s); 
        } else {
            setSchedule(s);
        }
        const e = await apiGetEvents();
        setEvents(e);
        
        // Load Photos
        getPhotosFromDB().then(setBodyPhotos);
    };
    loadData();
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
  }, [mode]); // Re-fetch on mode change (e.g. back from dashboard)

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

  // SESSION PERSISTENCE
  useEffect(() => {
      const savedSession = localStorage.getItem('fitlife_active_session');
      if (savedSession) {
          try {
              const data = JSON.parse(savedSession);
              if (data.mode === 'ACTIVE_SESSION' && data.activePlan && data.sessionLogs) {
                  setActivePlan(data.activePlan);
                  setSessionLogs(data.sessionLogs);
                  setSessionStartTime(data.sessionStartTime || Date.now());
                  setMode('ACTIVE_SESSION');
                  if (data.isResting && data.restTimer > 0) {
                      setIsResting(true);
                      setRestTimer(data.restTimer);
                  }
              }
          } catch (e) {
              console.error("Failed to restore session", e);
              localStorage.removeItem('fitlife_active_session');
          }
      }
  }, []);

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
          localStorage.removeItem('fitlife_active_session');
      }
  }, [mode, activePlan, sessionLogs, sessionStartTime, isResting, restTimer]);

  useEffect(() => {
      if (allPlans.length > 0 && !selectedPlanId) {
          setSelectedPlanId(allPlans[0].id);
      }
  }, [allPlans, selectedPlanId]);

  useEffect(() => {
      if (autoStart && onAutoStartConsumed) {
          if (externalPlanToStart) {
              handleStartSession(externalPlanToStart);
          } else {
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
                      playBeep(3);
                      if ("Notification" in window && Notification.permission === "granted") {
                          try {
                              new Notification(t.restFinished, {
                                  body: t.goNextSet,
                                  icon: '/icon.png',
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

  // Calendar Logic
  const generateCalendarDays = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

      const days = [];
      for (let i = 0; i < firstDayOfWeek; i++) {
          days.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          
          // Check for data on this day
          const dayWorkouts = schedule.filter(s => s.date === dateStr);
          const dayNutrition = nutritionLogs.filter(n => n.date === dateStr);
          const dayEvents = events.filter(e => e.date === dateStr);
          const hasBodyPhoto = bodyPhotos.some(p => p.date === dateStr);

          const hasWorkout = dayWorkouts.length > 0;
          const isCompleted = dayWorkouts.length > 0 && dayWorkouts.every(s => s.completed);
          const hasNutrition = dayNutrition.length > 0;
          const hasEvent = dayEvents.length > 0;

          days.push({
              day: i,
              dateStr: dateStr,
              isToday: dateStr === new Date().toISOString().split('T')[0],
              isSelected: dateStr === selectedDate,
              holiday: HK_HOLIDAYS[dateStr],
              hasWorkout,
              isCompleted,
              hasNutrition,
              hasEvent,
              hasBodyPhoto
          });
      }
      return days;
  };

  const changeMonth = (offset: number) => {
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() + offset);
      setCurrentMonth(newDate);
  };

  const updateAndSavePlans = (newPlans: DailyPlan[]) => {
      setAllPlans(newPlans);
      localStorage.setItem('fitlife_plans', JSON.stringify(newPlans));
  };

  const findLastSessionStats = (exerciseName: string) => {
      for (const record of historyLogs) {
          if (!record.details) continue;
          const match = record.details.find(d => d.exerciseName === exerciseName);
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
      setShowDayDetailModal(false); // Close modal when starting
  };

  const handleFinishSession = async () => {
      setMode('SUMMARY');
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
      localStorage.removeItem('fitlife_active_session');
      setActivePlan(null);
      setMode('TIMETABLE');
  };

  // --- Quick Log Controls ---
  const adjustValue = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', delta: number) => {
      setSessionLogs(prev => {
          const logs = [...(prev[exerciseId] || [])];
          const currentVal = logs[setIndex][field];
          const newVal = Math.max(0, currentVal + delta);
          logs[setIndex] = { ...logs[setIndex], [field]: newVal };
          return { ...prev, [exerciseId]: logs };
      });
  };

  const copyPreviousSet = (exerciseId: string, setIndex: number) => {
      if (setIndex === 0) return;
      setSessionLogs(prev => {
          const logs = [...(prev[exerciseId] || [])];
          const prevSet = logs[setIndex - 1];
          logs[setIndex] = { ...logs[setIndex], weight: prevSet.weight, reps: prevSet.reps };
          return { ...prev, [exerciseId]: logs };
      });
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

  const renderExerciseGroup = (sectionName: string, exercises: Exercise[], color: string, icon: any) => {
      if (exercises.length === 0) return null;
      return (
          <div className="space-y-4 mb-8">
              <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${color} bg-gray-50 dark:bg-charcoal-900/50 p-2 rounded-lg`}>
                  {icon} {sectionName}
              </h3>
              {exercises.map((exercise) => {
                  const prevStats = findLastSessionStats(exercise.name);
                  return (
                  <div key={exercise.id} className="bg-white dark:bg-charcoal-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-charcoal-700">
                      <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
                              <Dumbbell size={18} className="text-neon-blue"/>
                              {exercise.name}
                          </h4>
                          {prevStats ? (
                              <div className="text-xs bg-gray-100 dark:bg-charcoal-900 text-gray-500 px-2 py-1 rounded flex items-center gap-1">
                                  <HistoryIcon size={12} />
                                  <span className="font-mono">{prevStats.weight}kg x {prevStats.reps}</span>
                              </div>
                          ) : (
                              <span className="text-[10px] bg-neon-green/10 text-neon-green px-2 py-1 rounded">新動作</span>
                          )}
                      </div>
                      
                      <div className="space-y-3">
                          <div className="grid grid-cols-10 gap-2 text-[10px] font-bold text-gray-400 mb-1 px-1 text-center uppercase tracking-wider">
                              <div className="col-span-1">Set</div>
                              <div className="col-span-4">KG</div>
                              <div className="col-span-4">Reps</div>
                              <div className="col-span-1"></div>
                          </div>
                          {sessionLogs[exercise.id]?.map((set, idx) => (
                              <div key={idx} className={`relative grid grid-cols-10 gap-2 items-center p-2 rounded-xl transition-all ${set.completed ? 'bg-neon-green/10 border border-neon-green/30' : 'bg-gray-50 dark:bg-charcoal-900 border border-transparent'}`}>
                                  <div className="col-span-1 text-center font-bold text-gray-500 text-sm">{idx + 1}</div>
                                  <div className="col-span-4 flex items-center justify-center bg-white dark:bg-charcoal-800 rounded-lg border border-gray-200 dark:border-charcoal-700 overflow-hidden h-10">
                                      <button onClick={() => adjustValue(exercise.id, idx, 'weight', -2.5)} className="w-8 h-full flex items-center justify-center bg-gray-100 dark:bg-charcoal-700 hover:bg-gray-200 active:bg-gray-300 text-gray-500 font-bold">-</button>
                                      <input 
                                        type="number" 
                                        inputMode="decimal"
                                        value={set.weight} 
                                        onChange={(e) => updateSetLog(exercise.id, idx, 'weight', Number(e.target.value))} 
                                        className="w-full h-full bg-transparent text-center font-bold outline-none text-gray-800 dark:text-white"
                                      />
                                      <button onClick={() => adjustValue(exercise.id, idx, 'weight', 2.5)} className="w-8 h-full flex items-center justify-center bg-gray-100 dark:bg-charcoal-700 hover:bg-gray-200 active:bg-gray-300 text-gray-500 font-bold">+</button>
                                  </div>
                                  <div className="col-span-4 flex items-center justify-center bg-white dark:bg-charcoal-800 rounded-lg border border-gray-200 dark:border-charcoal-700 overflow-hidden h-10">
                                      <button onClick={() => adjustValue(exercise.id, idx, 'reps', -1)} className="w-8 h-full flex items-center justify-center bg-gray-100 dark:bg-charcoal-700 hover:bg-gray-200 active:bg-gray-300 text-gray-500 font-bold">-</button>
                                      <input 
                                        type="number" 
                                        inputMode="numeric"
                                        value={set.reps} 
                                        onChange={(e) => updateSetLog(exercise.id, idx, 'reps', Number(e.target.value))} 
                                        className="w-full h-full bg-transparent text-center font-bold outline-none text-gray-800 dark:text-white"
                                      />
                                      <button onClick={() => adjustValue(exercise.id, idx, 'reps', 1)} className="w-8 h-full flex items-center justify-center bg-gray-100 dark:bg-charcoal-700 hover:bg-gray-200 active:bg-gray-300 text-gray-500 font-bold">+</button>
                                  </div>
                                  <div className="col-span-1 flex justify-center">
                                      <button 
                                        onClick={() => toggleSetComplete(exercise.id, idx)} 
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90 ${set.completed ? 'bg-neon-green text-charcoal-900 shadow-neon-green/20' : 'bg-gray-200 dark:bg-charcoal-700 text-gray-400'}`}
                                      >
                                          <Check size={16} strokeWidth={3} />
                                      </button>
                                  </div>
                                  {idx > 0 && !set.completed && !set.weight && (
                                      <button 
                                        onClick={() => copyPreviousSet(exercise.id, idx)}
                                        className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full p-2 text-gray-300 hover:text-neon-blue transition-colors"
                                        title={t.copyLast}
                                      >
                                          <Copy size={14} />
                                      </button>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              )})}
          </div>
      );
  };

  const getApiKey = () => {
    const systemKey = localStorage.getItem('GO_SYSTEM_GOOGLE_API_KEY');
    if (systemKey) return systemKey;
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
        if (typeof process !== 'undefined' && process.env) {
            if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
            if (process.env.API_KEY) return process.env.API_KEY;
        }
    } catch (e) {}
    return null;
  };

  const getDeepSeekConfig = () => {
      let apiKey = localStorage.getItem('GO_SYSTEM_OPENAI_API_KEY');
      let baseUrl = localStorage.getItem('GO_SYSTEM_OPENAI_BASE_URL');
      let model = localStorage.getItem('GO_SYSTEM_OPENAI_MODEL');
      if (!apiKey) apiKey = userProfile.openaiApiKey || null;
      if (!baseUrl) baseUrl = userProfile.openaiBaseUrl || null;
      if (!model) model = userProfile.openaiModel || null;
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
          apiKey = process.env.VITE_OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
          baseUrl = baseUrl || process.env.VITE_OPENAI_BASE_URL || process.env.NEXT_PUBLIC_OPENAI_BASE_URL;
          model = model || process.env.VITE_OPENAI_MODEL || process.env.NEXT_PUBLIC_OPENAI_MODEL;
      }
      return { apiKey, baseUrl: baseUrl || "https://api.deepseek.com", model: model || "deepseek-chat" };
  };

  const callOpenAI = async (prompt: string, systemPrompt: string = "") => {
        const { apiKey, baseUrl, model } = getDeepSeekConfig();
        if (!apiKey) throw new Error("API Key 缺失");
        const body: any = {
            model: model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]
        };
        if (!model.includes('reasoner')) body.response_format = { type: 'json_object' };
        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
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

  // --- Plan Management Helpers ---
  const resetManualForm = () => {
      setManualPlanTitle('');
      setManualFocus('');
      setManualDuration(60);
      setManualExercises([]);
      setEditingPlanId(null);
  };

  const handleSaveManualPlan = async () => {
      if (!manualPlanTitle.trim()) return;
      
      const newPlan: DailyPlan = {
          id: editingPlanId || 'custom_' + Date.now(),
          title: manualPlanTitle,
          focus: manualFocus || 'General',
          duration: manualDuration,
          exercises: manualExercises.map((ex, i) => ({
              id: editingPlanId ? (allPlans.find(p => p.id === editingPlanId)?.exercises[i]?.id || `ex_${Date.now()}_${i}`) : `ex_${Date.now()}_${i}`,
              name: ex.name || 'Exercise',
              sets: ex.sets || 3,
              reps: ex.reps || '10',
              weight: ex.weight || 0,
              section: ex.section,
              completed: false
          }))
      };

      let updatedPlans;
      if (editingPlanId) {
          updatedPlans = allPlans.map(p => p.id === editingPlanId ? newPlan : p);
      } else {
          updatedPlans = [...allPlans, newPlan];
      }
      
      updateAndSavePlans(updatedPlans);
      resetManualForm();
      setMode('PLANS');
  };

  const handleAddManualExercise = (section: 'warmup' | 'main' | 'core' = 'main') => {
      setManualExercises([...manualExercises, { name: '', sets: 3, reps: '10', weight: 0, section }]);
  };

  const updateManualExercise = (index: number, field: string, value: any) => {
      const updated = [...manualExercises];
      (updated[index] as any)[field] = value;
      setManualExercises(updated);
  };

  const removeManualExercise = (index: number) => {
      const updated = [...manualExercises];
      updated.splice(index, 1);
      setManualExercises(updated);
  };

  const confirmDeletePlan = () => {
      if (planToDeleteId) {
          const updatedPlans = allPlans.filter(p => p.id !== planToDeleteId);
          updateAndSavePlans(updatedPlans);
          setPlanToDeleteId(null);
      }
  };

  // --- AI Logic ---
  const handleGeneratePlan = async () => {
      if (!aiPrompt.trim()) return;
      setAiError(null);
      setIsGenerating(true);
      const targetLang = language === 'zh' ? 'Traditional Chinese (繁體中文)' : 'English';
      let equipContext = "";
      if (selectedEquipment === 'GYM') equipContext = "Equipment available: Full commercial gym.";
      if (selectedEquipment === 'DUMBBELL') equipContext = "Equipment available: Dumbbells only.";
      if (selectedEquipment === 'BODYWEIGHT') equipContext = "Equipment available: Bodyweight only.";

      const systemPrompt = `Create a workout plan.
      **Context**: ${equipContext}
      **Goal**: Based on user request.
      **Output Language**: Strictly output all text in ${targetLang}.
      **Format**: Return strictly valid JSON: { "title": "Plan Name", "focus": "Target Area", "duration": 45, "exercises": [ { "name": "Exercise Name", "sets": 3, "reps": "12", "section": "warmup" | "main" | "core" } ] }`;
      
      const userPromptMsg = aiPrompt;
      const { apiKey } = getDeepSeekConfig();
      let shouldUseOpenAI = false;
      if (userProfile.aiProvider === 'openai') shouldUseOpenAI = true;
      else if (userProfile.aiProvider === 'google') shouldUseOpenAI = false;
      else {
          const googleKey = getApiKey();
          if (googleKey) shouldUseOpenAI = false;
          else shouldUseOpenAI = !!apiKey;
      }
      setCurrentProvider(shouldUseOpenAI ? 'DeepSeek/OpenAI' : 'Google Gemini');

      try {
          let result;
          if (shouldUseOpenAI && apiKey) {
               try { result = await callOpenAI(userPromptMsg, systemPrompt); } 
               catch (openAiError: any) {
                   const msg = openAiError.message || "";
                   if (msg.includes("Insufficient Balance") || msg.includes("Quota")) {
                       setAiError("DeepSeek 餘額不足，已自動切換至 Google Gemini...");
                       setCurrentProvider('Gemini (Fallback)');
                       result = await callGemini(`Create a workout plan: "${userPromptMsg}". Context: ${equipContext}. Lang: ${targetLang}. Return strictly JSON: { "title": "Plan Name", "focus": "Target Area", "duration": 45, "exercises": [ { "name": "Exercise Name", "sets": 3, "reps": "12", "section": "warmup" | "main" | "core" } ] }`);
                   } else throw openAiError;
               }
          } else {
               result = await callGemini(`Create a workout plan: "${userPromptMsg}". Context: ${equipContext}. Lang: ${targetLang}. Return strictly JSON: { "title": "Plan Name", "focus": "Target Area", "duration": 45, "exercises": [ { "name": "Exercise Name", "sets": 3, "reps": "12", "section": "warmup" | "main" | "core" } ] }`);
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
              updateAndSavePlans([...allPlans, newPlan]);
              setAiPrompt('');
              setMode('PLANS');
          }
      } catch (e: any) {
          setAiError("生成失敗: " + (e.message || "未知錯誤"));
      } finally {
          setIsGenerating(false);
      }
  };

  const handleAnalyzeImport = async () => {
      if (!importText.trim()) return;
      setIsGenerating(true);
      setAiError(null);
      
      const systemPrompt = `Parse the user's workout text into a structured JSON plan.
      Output JSON format: { "title": "Plan Name", "focus": "Target Body Part", "duration": 60, "exercises": [ { "name": "Exercise Name", "sets": 3, "reps": "10", "section": "warmup" | "main" | "core" } ] }
      If language is mixed, prefer Traditional Chinese for output.`;

      const userPromptMsg = importText;
      const { apiKey } = getDeepSeekConfig();
      let shouldUseOpenAI = userProfile.aiProvider === 'openai';

      try {
          let result;
          if (shouldUseOpenAI && apiKey) {
               try { result = await callOpenAI(userPromptMsg, systemPrompt); } 
               catch (e) { result = await callGemini(`System: ${systemPrompt}. User: ${importText}`); }
          } else {
               result = await callGemini(`System: ${systemPrompt}. User: ${importText}`);
          }

          if (result) {
               const newPlan: DailyPlan = {
                  id: 'import_' + Date.now(),
                  title: result.title || 'Imported Plan',
                  focus: result.focus || 'Custom',
                  duration: result.duration || 60,
                  exercises: result.exercises?.map((e: any, i: number) => ({
                      id: `ex_${i}`,
                      name: e.name,
                      sets: e.sets,
                      reps: e.reps,
                      section: e.section || 'main',
                      completed: false
                  })) || []
              };
              updateAndSavePlans([...allPlans, newPlan]);
              setImportText('');
              setMode('PLANS');
          }
      } catch(e: any) {
          setAiError("解析失敗: " + e.message);
      } finally {
          setIsGenerating(false);
      }
  };

  // --- Views ---

  if (mode === 'ACTIVE_SESSION' && activePlan) {
      const warmupEx = activePlan.exercises.filter(e => e.section === 'warmup');
      const mainEx = activePlan.exercises.filter(e => !e.section || e.section === 'main');
      const coreEx = activePlan.exercises.filter(e => e.section === 'core');

      return (
          <div className="pb-20 relative min-h-[80vh]">
              <div className="sticky top-0 z-30 bg-white dark:bg-charcoal-900 border-b border-gray-200 dark:border-charcoal-700 p-4 -mx-4 md:-mx-8 mb-6 shadow-sm flex justify-between items-center">
                  <div>
                      <h2 className="text-xl font-bold line-clamp-1">{activePlan.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Timer size={14} className={isResting ? "text-cta-orange animate-pulse" : ""} />
                          {isResting ? (
                              <span className="font-bold text-cta-orange">{t.resting} {restTimer}s</span>
                          ) : (
                              <span>{t.workoutProgress}</span>
                          )}
                      </div>
                  </div>
                  <button onClick={handleFinishSession} className="bg-neon-green text-charcoal-900 font-bold px-4 py-2 rounded-lg text-sm shadow-lg shadow-neon-green/20 hover:bg-lime-400 transition-colors">{t.finish}</button>
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
                          <button onClick={() => setRestTimer(t => Math.max(0, t - 10))} className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 active:scale-95 transition-transform"><Minus size={20}/></button>
                          <button onClick={() => setRestTimer(t => t + 30)} className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 active:scale-95 transition-transform"><Plus size={20}/></button>
                          <button onClick={() => setIsResting(false)} className="px-4 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 text-red-400 font-bold text-sm ml-2">{t.skip}</button>
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

  // --- Main Render (Standard View) ---
  return (
    <div className="space-y-6 pb-20">
        <div className="bg-gray-100 dark:bg-charcoal-800 p-1 rounded-xl flex">
            <button onClick={() => setMode('TIMETABLE')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'TIMETABLE' ? 'bg-white dark:bg-charcoal-900 shadow text-charcoal-900 dark:text-white' : 'text-gray-500'}`}><CalendarIcon size={16} /> {t.timetable}</button>
            <button onClick={() => setMode('PLANS')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'PLANS' || mode === 'CREATE' || mode === 'MANUAL_CREATE' || mode === 'IMPORT_TEXT' ? 'bg-white dark:bg-charcoal-900 shadow text-charcoal-900 dark:text-white' : 'text-gray-500'}`}><List size={16} /> {t.library}</button>
        </div>

        {mode === 'TIMETABLE' && (
            <div className="space-y-6 animate-fade-in">
                {/* Calendar Grid View */}
                <div className="bg-white dark:bg-charcoal-800 rounded-3xl shadow-sm border border-gray-200 dark:border-charcoal-700 p-3 md:p-5">
                    {/* Calendar Header */}
                    <div className="flex justify-between items-center mb-6 px-2">
                        <h3 className="text-xl font-bold">
                            {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded-full transition-colors"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    {/* Weekday Header */}
                    <div className="grid grid-cols-7 text-center mb-2">
                        {[t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat].map((day, idx) => (
                            <div key={idx} className={`text-xs font-bold ${idx === 0 || idx === 6 ? 'text-red-400' : 'text-gray-400'}`}>{day}</div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {generateCalendarDays().map((dateObj, index) => {
                            if (!dateObj) return <div key={`empty-${index}`} />;
                            
                            return (
                                <div 
                                    key={index} 
                                    onClick={() => {
                                        setSelectedDate(dateObj.dateStr);
                                        setShowDayDetailModal(true);
                                    }}
                                    className={`relative flex flex-col items-center justify-start py-2 h-16 md:h-20 rounded-xl cursor-pointer transition-all border
                                        ${dateObj.isSelected 
                                            ? 'bg-cta-orange/10 border-cta-orange dark:bg-cta-orange/20' 
                                            : dateObj.isToday 
                                                ? 'bg-gray-50 dark:bg-charcoal-750 border-gray-200 dark:border-charcoal-600'
                                                : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-charcoal-750'}
                                    `}
                                >
                                    <span className={`text-sm font-bold ${dateObj.holiday ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {dateObj.day}
                                    </span>
                                    
                                    {/* Holiday Name */}
                                    {dateObj.holiday && (
                                        <span className="text-[9px] md:text-[10px] text-red-500 leading-none text-center px-1 mt-0.5 line-clamp-1 w-full overflow-hidden text-ellipsis">
                                            {dateObj.holiday}
                                        </span>
                                    )}

                                    {/* Indicators */}
                                    <div className="flex gap-1 mt-auto mb-1">
                                        {dateObj.hasWorkout && (
                                            <div className={`w-1.5 h-1.5 rounded-full ${dateObj.isCompleted ? 'bg-cta-orange' : 'bg-orange-300 ring-1 ring-orange-200'}`}></div>
                                        )}
                                        {dateObj.hasNutrition && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-neon-green"></div>
                                        )}
                                        {dateObj.hasEvent && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-neon-blue"></div>
                                        )}
                                        {dateObj.hasBodyPhoto && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Day Details Modal */}
                {showDayDetailModal && (
                    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDayDetailModal(false)}>
                        <div 
                            className="bg-white dark:bg-charcoal-800 w-full md:max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-gray-100 dark:border-charcoal-700 flex justify-between items-center bg-white dark:bg-charcoal-800 sticky top-0 z-10">
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center gap-2">
                                        {new Date(selectedDate).getDate()}日 
                                        <span className="text-base text-gray-500 font-normal">
                                            ({new Date(selectedDate).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US', { weekday: 'short' })})
                                        </span>
                                    </h3>
                                    {HK_HOLIDAYS[selectedDate] && <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded font-bold">{HK_HOLIDAYS[selectedDate]}</span>}
                                </div>
                                <button onClick={() => setShowDayDetailModal(false)} className="bg-gray-100 dark:bg-charcoal-700 p-2 rounded-full text-gray-500"><X size={20}/></button>
                            </div>

                            <div className="p-5 overflow-y-auto space-y-6">
                                {/* Body Records Section (Photos) */}
                                {bodyPhotos.some(p => p.date === selectedDate) && (
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Camera size={16}/> 體態記錄</h4>
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {bodyPhotos.filter(p => p.date === selectedDate).map(photo => (
                                                <div 
                                                    key={photo.id} 
                                                    onClick={() => setViewPhoto(photo)}
                                                    className="w-20 h-28 bg-gray-100 dark:bg-charcoal-900 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-charcoal-700 cursor-pointer"
                                                >
                                                    <img src={photo.imageData} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Workout Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Dumbbell size={16}/> 訓練計畫</h4>
                                        <button onClick={() => { setShowDayDetailModal(false); setMode('PLANS'); }} className="text-xs text-neon-blue font-bold">+ 安排</button>
                                    </div>
                                    <div className="space-y-3">
                                        {schedule.filter(s => s.date === selectedDate).length === 0 ? (
                                            <div className="text-center py-6 bg-gray-50 dark:bg-charcoal-900/50 rounded-xl border border-dashed border-gray-200 dark:border-charcoal-700">
                                                <p className="text-xs text-gray-400">今日無安排訓練</p>
                                            </div>
                                        ) : (
                                            schedule.filter(s => s.date === selectedDate).map((s, idx) => {
                                                const plan = allPlans.find(p => p.id === s.planId);
                                                return (
                                                    <div key={idx} className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-700 shadow-sm flex justify-between items-center">
                                                        <div>
                                                            <h5 className="font-bold text-lg text-gray-800 dark:text-white">{plan?.title || '未知課表'}</h5>
                                                            <p className="text-xs text-gray-500">{plan?.focus} • {plan?.duration} min</p>
                                                        </div>
                                                        {s.completed ? (
                                                            <span className="text-xs font-bold bg-green-100 text-green-600 px-3 py-1 rounded-full flex items-center gap-1"><Check size={12}/> 完成</span>
                                                        ) : (
                                                            <button 
                                                                onClick={() => plan && handleStartSession(plan)} 
                                                                className="bg-cta-orange text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
                                                            >
                                                                開始
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Nutrition Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Utensils size={16}/> 飲食攝取</h4>
                                    </div>
                                    {nutritionLogs.filter(n => n.date === selectedDate).length > 0 ? (
                                        <div className="bg-neon-green/10 border border-neon-green/20 p-4 rounded-2xl">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs text-gray-600 dark:text-gray-300 font-bold">總熱量</span>
                                                <span className="text-xl font-black text-gray-800 dark:text-white">
                                                    {nutritionLogs.filter(n => n.date === selectedDate).reduce((sum, n) => sum + n.calories, 0)} <span className="text-xs font-normal text-gray-500">kcal</span>
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                {nutritionLogs.filter(n => n.date === selectedDate).slice(0, 3).map((n, i) => (
                                                    <span key={i} className="text-[10px] bg-white dark:bg-charcoal-800 px-2 py-1 rounded border border-gray-100 dark:border-charcoal-700 truncate max-w-[80px]">{n.item}</span>
                                                ))}
                                                {nutritionLogs.filter(n => n.date === selectedDate).length > 3 && <span className="text-[10px] text-gray-400 self-center">...</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-gray-50 dark:bg-charcoal-900/50 rounded-xl border border-dashed border-gray-200 dark:border-charcoal-700">
                                            <p className="text-xs text-gray-400">今日無飲食記錄</p>
                                        </div>
                                    )}
                                </div>

                                {/* Events Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Clock size={16}/> 行程活動</h4>
                                        <button onClick={() => setShowAddEventModal(true)} className="text-xs text-neon-blue font-bold">+ 新增</button>
                                    </div>
                                    <div className="space-y-2">
                                        {events.filter(e => e.date === selectedDate).length > 0 ? (
                                            events.filter(e => e.date === selectedDate).map((event) => (
                                                <div key={event.id} className="flex gap-3 items-center bg-gray-50 dark:bg-charcoal-900 p-3 rounded-xl border border-gray-100 dark:border-charcoal-700">
                                                    <div className="w-1 h-8 bg-neon-blue rounded-full"></div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-800 dark:text-white">{event.title}</p>
                                                        <p className="text-xs text-gray-500">{event.time}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 bg-gray-50 dark:bg-charcoal-900/50 rounded-xl border border-dashed border-gray-200 dark:border-charcoal-700">
                                                <p className="text-xs text-gray-400">今日無其他行程</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo Viewer Modal */}
                {viewPhoto && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setViewPhoto(null)}>
                        <div className="relative max-w-full max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                            <img src={viewPhoto.imageData} className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" />
                            <div className="flex items-center gap-4 mt-4">
                                <div className="bg-charcoal-800 text-white px-4 py-2 rounded-full font-mono text-sm shadow-lg border border-charcoal-700">
                                    {viewPhoto.date}
                                </div>
                            </div>
                            <button onClick={() => setViewPhoto(null)} className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300">
                                <X size={32} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
        
        {mode === 'PLANS' && (
            <div className="space-y-6 animate-fade-in">
                 <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setMode('CREATE')} className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg active:scale-95 transition-all"><Sparkles size={24} className="mb-2" /><span className="text-xs font-bold">{t.ai}</span></button>
                    <button onClick={() => { resetManualForm(); setMode('MANUAL_CREATE'); }} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 rounded-xl text-gray-600 dark:text-gray-300 shadow-sm active:scale-95 transition-all"><PenTool size={24} className="mb-2 text-neon-blue" /><span className="text-xs font-bold">{t.manual}</span></button>
                    <button onClick={() => setMode('IMPORT_TEXT')} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 rounded-xl text-gray-600 dark:text-gray-300 shadow-sm active:scale-95 transition-all"><ClipboardPaste size={24} className="mb-2 text-neon-green" /><span className="text-xs font-bold">{t.import}</span></button>
                </div>
                <div className="space-y-4">
                    {allPlans.map((plan) => (
                        <div key={plan.id} className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-charcoal-700 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div><h3 className="text-lg font-bold">{plan.title}</h3><p className="text-xs text-gray-500 bg-gray-100 dark:bg-charcoal-900 px-2 py-1 rounded inline-block mt-1">{plan.focus} • {plan.duration} min</p></div>
                                <div className="flex gap-1">
                                    <button onClick={(e) => { e.preventDefault(); setEditingPlanId(plan.id); setManualPlanTitle(plan.title); setManualFocus(plan.focus); setManualDuration(plan.duration); setManualExercises(plan.exercises.map(ex => ({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight || 0, section: ex.section || 'main' }))); setMode('MANUAL_CREATE'); }} className="p-2 text-gray-400 hover:text-neon-blue"><Pencil size={16}/></button>
                                    <button onClick={() => setPlanToDeleteId(plan.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <button onClick={() => handleStartSession(plan)} className="py-2.5 rounded-xl text-xs font-bold bg-cta-orange text-white hover:bg-cta-hover shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"><Dumbbell size={14} /> {t.start}</button>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {mode === 'CREATE' && (
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-gray-200 dark:border-charcoal-700 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="text-cta-orange" /> {t.ai}</h3>
                    <button onClick={() => setMode('PLANS')}><X size={20} className="text-gray-400"/></button>
                </div>
                <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder={language === 'zh' ? "例如：我只有30分鐘，想練胸肌..." : "e.g., I have 30 mins, want to train chest..."} className="w-full h-32 p-4 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange resize-none" />
                <button onClick={handleGeneratePlan} disabled={isGenerating || !aiPrompt.trim()} className="w-full bg-cta-orange text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-4">{isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}{isGenerating ? (loadingTip || t.generating) : t.createPlan}</button>
            </div>
        )}

        {mode === 'IMPORT_TEXT' && (
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-gray-200 dark:border-charcoal-700 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><ClipboardPaste className="text-neon-green" /> {t.import}</h3>
                    <button onClick={() => setMode('PLANS')}><X size={20} className="text-gray-400"/></button>
                </div>
                <p className="text-xs text-gray-500 mb-3">直接貼上來自 Line 或備忘錄的文字課表，AI 將自動分析並建立。</p>
                <textarea 
                    value={importText} 
                    onChange={(e) => setImportText(e.target.value)} 
                    placeholder="例如：
胸肌訓練
1. 臥推 4組 8-10下
2. 夾胸 3組 12下..." 
                    className="w-full h-48 p-4 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-green resize-none font-mono text-sm" 
                />
                {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
                <button 
                    onClick={handleAnalyzeImport} 
                    disabled={isGenerating || !importText.trim()} 
                    className="w-full bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                    {isGenerating ? t.generating : t.analyzing}
                </button>
            </div>
        )}

        {mode === 'MANUAL_CREATE' && (
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-gray-200 dark:border-charcoal-700 animate-fade-in space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-charcoal-700 pb-2">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Pencil className="text-neon-blue" /> {editingPlanId ? t.updatePlan : t.manual}</h3>
                    <button onClick={() => setMode('PLANS')}><X size={20} className="text-gray-400"/></button>
                </div>
                
                <div className="space-y-3">
                    <input type="text" value={manualPlanTitle} onChange={(e) => setManualPlanTitle(e.target.value)} placeholder="課表名稱 (例如: 週一胸肌日)" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 font-bold" />
                    <div className="flex gap-2">
                        <input type="text" value={manualFocus} onChange={(e) => setManualFocus(e.target.value)} placeholder="專注部位" className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 text-sm" />
                        <div className="relative w-24">
                            <input type="number" value={manualDuration} onChange={(e) => setManualDuration(Number(e.target.value))} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 text-center font-mono" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 pt-2">
                    {/* Warmup Section */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2 border-b border-orange-400/20 pb-1 mb-2">
                            <Flame size={14}/> {t.warmup}
                        </h4>
                        {manualExercises.map((ex, idx) => {
                            if (ex.section !== 'warmup') return null;
                            return (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-charcoal-900 rounded-lg">
                                    <input type="text" value={ex.name} onChange={(e) => updateManualExercise(idx, 'name', e.target.value)} placeholder="動作名稱" className="flex-1 bg-transparent outline-none text-sm font-bold" />
                                    <input type="number" value={ex.sets} onChange={(e) => updateManualExercise(idx, 'sets', Number(e.target.value))} className="w-10 text-center bg-transparent border-b border-gray-300 dark:border-charcoal-600 outline-none text-sm" placeholder="組" />
                                    <input type="text" value={ex.reps} onChange={(e) => updateManualExercise(idx, 'reps', e.target.value)} className="w-12 text-center bg-transparent border-b border-gray-300 dark:border-charcoal-600 outline-none text-sm" placeholder="次" />
                                    <button onClick={() => removeManualExercise(idx)} className="text-red-400 hover:text-red-500"><X size={16}/></button>
                                </div>
                            );
                        })}
                        <button onClick={() => handleAddManualExercise('warmup')} className="w-full py-2 border border-dashed border-orange-200 dark:border-orange-900 rounded-xl text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-xs font-bold flex items-center justify-center gap-2">
                            <Plus size={14} /> 新增{t.warmup}
                        </button>
                    </div>

                    {/* Main Workout Section */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-2 border-b border-neon-blue/20 pb-1 mb-2">
                            <Dumbbell size={14}/> {t.main}
                        </h4>
                        {manualExercises.map((ex, idx) => {
                            if (ex.section !== 'main' && ex.section) return null; // Default to main if undefined
                            return (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-charcoal-900 rounded-lg">
                                    <input type="text" value={ex.name} onChange={(e) => updateManualExercise(idx, 'name', e.target.value)} placeholder="動作名稱" className="flex-1 bg-transparent outline-none text-sm font-bold" />
                                    <input type="number" value={ex.sets} onChange={(e) => updateManualExercise(idx, 'sets', Number(e.target.value))} className="w-10 text-center bg-transparent border-b border-gray-300 dark:border-charcoal-600 outline-none text-sm" placeholder="組" />
                                    <input type="text" value={ex.reps} onChange={(e) => updateManualExercise(idx, 'reps', e.target.value)} className="w-12 text-center bg-transparent border-b border-gray-300 dark:border-charcoal-600 outline-none text-sm" placeholder="次" />
                                    <button onClick={() => removeManualExercise(idx)} className="text-red-400 hover:text-red-500"><X size={16}/></button>
                                </div>
                            );
                        })}
                        <button onClick={() => handleAddManualExercise('main')} className="w-full py-2 border border-dashed border-neon-blue/30 rounded-xl text-neon-blue hover:bg-neon-blue/10 transition-colors text-xs font-bold flex items-center justify-center gap-2">
                            <Plus size={14} /> 新增{t.main}
                        </button>
                    </div>

                    {/* Core/Cooldown Section */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2 border-b border-purple-400/20 pb-1 mb-2">
                            <RotateCcw size={14}/> {t.core}
                        </h4>
                        {manualExercises.map((ex, idx) => {
                            if (ex.section !== 'core') return null;
                            return (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-charcoal-900 rounded-lg">
                                    <input type="text" value={ex.name} onChange={(e) => updateManualExercise(idx, 'name', e.target.value)} placeholder="動作名稱" className="flex-1 bg-transparent outline-none text-sm font-bold" />
                                    <input type="number" value={ex.sets} onChange={(e) => updateManualExercise(idx, 'sets', Number(e.target.value))} className="w-10 text-center bg-transparent border-b border-gray-300 dark:border-charcoal-600 outline-none text-sm" placeholder="組" />
                                    <input type="text" value={ex.reps} onChange={(e) => updateManualExercise(idx, 'reps', e.target.value)} className="w-12 text-center bg-transparent border-b border-gray-300 dark:border-charcoal-600 outline-none text-sm" placeholder="次" />
                                    <button onClick={() => removeManualExercise(idx)} className="text-red-400 hover:text-red-500"><X size={16}/></button>
                                </div>
                            );
                        })}
                        <button onClick={() => handleAddManualExercise('core')} className="w-full py-2 border border-dashed border-purple-200 dark:border-purple-900 rounded-xl text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-xs font-bold flex items-center justify-center gap-2">
                            <Plus size={14} /> 新增{t.core}
                        </button>
                    </div>
                </div>

                <button onClick={handleSaveManualPlan} className="w-full bg-cta-orange text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4">
                    <Save size={18} /> {t.savePlan}
                </button>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {planToDeleteId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-charcoal-800 w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 dark:border-charcoal-700 p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3 text-red-500">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">刪除此課表？</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            您確定要刪除「{allPlans.find(p => p.id === planToDeleteId)?.title}」嗎？<br/>此動作無法復原。
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setPlanToDeleteId(null)}
                            className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 dark:bg-charcoal-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-600 transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={confirmDeletePlan}
                            className="flex-1 py-2.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                        >
                            確認刪除
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Workout;
