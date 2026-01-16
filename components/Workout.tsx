
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_PLANS, TUTORIALS_DATA } from '../constants';
import { DailyPlan, ScheduledWorkout, Tutorial, WorkoutRecord, ExerciseLog, ExerciseSetLog } from '../types';
import { Play, Plus, Calendar as CalendarIcon, List, Clock, ChevronRight, ChevronLeft, Check, Trash2, Dumbbell, Save, Search, Sparkles, Loader2, X, SkipForward, Timer, Pencil, AlertCircle, Minus, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

type Mode = 'CALENDAR' | 'PLANS' | 'CREATE' | 'ACTIVE_SESSION';

interface WorkoutProps {
  autoStart?: boolean;
  onAutoStartConsumed?: () => void;
  onFinishWorkout?: (record: WorkoutRecord) => void;
}

// Helper for Sound and Haptics
const playBeep = (count: number = 1) => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    const playTone = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, time); // A5
        osc.frequency.exponentialRampToValueAtTime(440, time + 0.1);
        
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        
        osc.start(time);
        osc.stop(time + 0.1);
    };

    for(let i=0; i<count; i++) {
        playTone(ctx.currentTime + i * 0.2);
    }
};

const triggerHaptic = () => {
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
};

const Workout: React.FC<WorkoutProps> = ({ autoStart, onAutoStartConsumed, onFinishWorkout }) => {
  const [mode, setMode] = useState<Mode>('CALENDAR');
  const [plans, setPlans] = useState<DailyPlan[]>(DEFAULT_PLANS);
  // Initial state loads from local storage or defaults
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>(() => {
      const saved = localStorage.getItem('fitlife_schedule');
      if (saved) return JSON.parse(saved);
      return [{ date: new Date().toISOString().split('T')[0], planId: 'p1', completed: false }];
  });
  
  // Persist schedule changes
  useEffect(() => {
      localStorage.setItem('fitlife_schedule', JSON.stringify(scheduledWorkouts));
  }, [scheduledWorkouts]);
  
  // Active Session State
  const [activePlan, setActivePlan] = useState<DailyPlan | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // --- Data Logging State ---
  const [sessionLogs, setSessionLogs] = useState<ExerciseLog[]>([]);

  // --- Rest Timer State ---
  const [isResting, setIsResting] = useState(false);
  const [isRestMinimized, setIsRestMinimized] = useState(false); // New: Minimize rest timer
  const [restTimer, setRestTimer] = useState(60); 
  const [defaultRestTime, setDefaultRestTime] = useState(60);
  
  // --- Input Logging State ---
  const [inputWeight, setInputWeight] = useState<number>(0);
  const [inputReps, setInputReps] = useState<number>(0);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  // Create Plan Form State
  const [newPlan, setNewPlan] = useState<Partial<DailyPlan>>({ title: '', focus: '', exercises: [] });
  const [newExercise, setNewExercise] = useState({ name: '', sets: 3, reps: '10', weight: 0 });
  
  // Create Plan - Exercise Autocomplete State
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [showExerciseSuggestions, setShowExerciseSuggestions] = useState(false);
  
  // Create Plan - AI Generator State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
    const savedSession = localStorage.getItem('fitlife_active_session');
    if (savedSession) {
        try {
            const parsed = JSON.parse(savedSession);
            if (parsed && parsed.activePlan) {
                setActivePlan(parsed.activePlan);
                setActiveExerciseIndex(parsed.activeExerciseIndex || 0);
                setCurrentSet(parsed.currentSet || 1);
                setSessionTimer(parsed.sessionTimer || 0);
                setSessionLogs(parsed.sessionLogs || []);
                setMode('ACTIVE_SESSION');
            }
        } catch (e) {
            console.error("Failed to restore session", e);
            localStorage.removeItem('fitlife_active_session');
        }
    }
  }, []);

  const timerRef = useRef(sessionTimer);
  useEffect(() => { timerRef.current = sessionTimer; }, [sessionTimer]);

  const saveActiveSession = () => {
      if (mode === 'ACTIVE_SESSION' && activePlan) {
          const stateToSave = {
              activePlan,
              activeExerciseIndex,
              currentSet,
              sessionLogs,
              sessionTimer: timerRef.current
          };
          localStorage.setItem('fitlife_active_session', JSON.stringify(stateToSave));
      }
  };

  useEffect(() => {
      if (mode === 'ACTIVE_SESSION') {
          saveActiveSession();
      }
  }, [mode, activePlan, activeExerciseIndex, currentSet, sessionLogs]);

  useEffect(() => {
      const handleBeforeUnload = () => {
          if (mode === 'ACTIVE_SESSION') {
             saveActiveSession();
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mode, activePlan, activeExerciseIndex, currentSet, sessionLogs]);


  // Handle Auto Start
  useEffect(() => {
    if (autoStart && onAutoStartConsumed) {
      const todayStr = new Date().toISOString().split('T')[0];
      const scheduled = scheduledWorkouts.find(s => s.date === todayStr);
      let planToStart = plans[0]; 
      
      if (scheduled) {
        const found = plans.find(p => p.id === scheduled.planId);
        if (found) planToStart = found;
      }

      startWorkout(planToStart);
      onAutoStartConsumed();
    }
  }, [autoStart]);

  // Rest Timer Tick
  useEffect(() => {
    let interval: any;
    if (isResting && restTimer > 0) {
        interval = setInterval(() => {
            setRestTimer(prev => prev - 1);
        }, 1000);
    } else if (isResting && restTimer === 0) {
        setIsResting(false); 
        setIsRestMinimized(false); // Reset minimize state
        playBeep(2); // Play sound when rest ends
        triggerHaptic();
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  // Initialize Input for new exercise
  useEffect(() => {
      if (activePlan) {
          const currentEx = activePlan.exercises[activeExerciseIndex];
          const targetReps = parseInt(currentEx.reps) || 10;
          setInputReps(targetReps);
          setInputWeight(currentEx.weight || 0);
      }
  }, [activeExerciseIndex, activePlan]);


  // --- LOGIC: Calendar ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleDateClick = (day: number) => {
    const month = currentDate.getMonth() + 1;
    const dateStr = `${currentDate.getFullYear()}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
  };

  const assignPlanToDate = (planId: string) => {
    const existing = scheduledWorkouts.find(s => s.date === selectedDateStr);
    if (existing) {
        setScheduledWorkouts(prev => prev.map(s => s.date === selectedDateStr ? { ...s, planId } : s));
    } else {
        setScheduledWorkouts(prev => [...prev, { date: selectedDateStr, planId, completed: false }]);
    }
  };

  // --- LOGIC: Active Session ---
  const startWorkout = (plan: DailyPlan) => {
    setActivePlan(plan);
    setActiveExerciseIndex(0);
    setCurrentSet(1);
    setSessionTimer(0);
    setIsResting(false);
    setSessionLogs([]); 
    setMode('ACTIVE_SESSION');
    setShowExitConfirm(false);
    
    localStorage.removeItem('fitlife_active_session');
    
    const interval = setInterval(() => {
        setSessionTimer(t => t + 1);
    }, 1000);
    (window as any).workoutTimer = interval;
  };

  const handleExitSession = () => {
      if ((window as any).workoutTimer) clearInterval((window as any).workoutTimer);
      localStorage.removeItem('fitlife_active_session');
      setShowExitConfirm(false);
      setActivePlan(null);
      setMode('CALENDAR');
  };

  const handleCompleteSet = () => {
    if (!activePlan) return;
    
    triggerHaptic(); // Vibrate on complete
    
    const currentEx = activePlan.exercises[activeExerciseIndex];
    
    // Log Data
    const setLog: ExerciseSetLog = {
        setNumber: currentSet,
        weight: inputWeight,
        reps: inputReps,
        completed: true
    };

    setSessionLogs(prevLogs => {
        const existingLogIndex = prevLogs.findIndex(l => l.exerciseName === currentEx.name);
        if (existingLogIndex >= 0) {
            const updatedLogs = [...prevLogs];
            updatedLogs[existingLogIndex] = {
                ...updatedLogs[existingLogIndex],
                sets: [...updatedLogs[existingLogIndex].sets, setLog]
            };
            return updatedLogs;
        } else {
            return [...prevLogs, {
                exerciseName: currentEx.name,
                sets: [setLog]
            }];
        }
    });

    const isLastExercise = activeExerciseIndex === activePlan.exercises.length - 1;
    const isLastSet = currentSet >= currentEx.sets;

    if (isLastSet) {
        if (isLastExercise) {
            finishWorkout();
        } else {
            triggerRest(() => {
                setActiveExerciseIndex(i => i + 1);
                setCurrentSet(1);
            });
        }
    } else {
        triggerRest(() => {
            setCurrentSet(c => c + 1);
        });
    }
  };

  const triggerRest = (callback: () => void) => {
      setIsResting(true);
      setIsRestMinimized(false); // Always start full screen
      setRestTimer(defaultRestTime);
      callback();
  };

  const skipRest = () => {
      setIsResting(false);
      setRestTimer(0);
  };
  
  const addRestTime = (seconds: number) => {
      setRestTimer(prev => prev + seconds);
  };

  // Helper for Stepper Controls
  const adjustWeight = (amount: number) => {
      setInputWeight(prev => {
          const newVal = prev + amount;
          return newVal < 0 ? 0 : newVal;
      });
      triggerHaptic();
  };

  const adjustReps = (amount: number) => {
      setInputReps(prev => {
          const newVal = prev + amount;
          return newVal < 0 ? 0 : newVal;
      });
      triggerHaptic();
  };

  const finishWorkout = () => {
    playBeep(3); // Success sound
    if ((window as any).workoutTimer) clearInterval((window as any).workoutTimer);
    
    localStorage.removeItem('fitlife_active_session');
    
    const todayStr = new Date().toISOString().split('T')[0];
    setScheduledWorkouts(prev => prev.map(s => 
        (s.date === todayStr && s.planId === activePlan?.id) 
        ? { ...s, completed: true } 
        : s
    ));
    
    if (activePlan && onFinishWorkout) {
        const record: WorkoutRecord = {
            id: Date.now().toString(),
            date: todayStr,
            type: activePlan.title,
            duration: Math.round(sessionTimer / 60),
            calories: Math.round(sessionTimer / 60 * 6),
            completed: true,
            details: sessionLogs
        };
        onFinishWorkout(record);
    }

    setMode('CALENDAR');
    setActivePlan(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- LOGIC: Create/Edit Plan ---
  const filteredTutorials = TUTORIALS_DATA.filter(t => 
    t.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase())
  );

  const selectExercise = (tutorial: Tutorial) => {
      setNewExercise({ 
          name: tutorial.name, 
          sets: 3, 
          reps: '8-12',
          weight: 0
      });
      setExerciseSearchTerm(tutorial.name);
      setShowExerciseSuggestions(false);
  };

  const addExerciseToNewPlan = () => {
    const nameToAdd = exerciseSearchTerm || newExercise.name;
    if (!nameToAdd) return;

    setNewPlan(prev => ({
      ...prev,
      exercises: [...(prev.exercises || []), { 
          id: Date.now().toString(), 
          name: nameToAdd, 
          sets: newExercise.sets, 
          reps: newExercise.reps,
          weight: newExercise.weight,
          completed: false 
      }]
    }));
    setNewExercise({ name: '', sets: 3, reps: '10', weight: 0 });
    setExerciseSearchTerm('');
  };

  const resetCreateForm = () => {
      setNewPlan({ title: '', focus: '', exercises: [] });
      setNewExercise({ name: '', sets: 3, reps: '10', weight: 0 });
  };

  const saveNewPlan = () => {
    if (!newPlan.title || !newPlan.exercises?.length) return;
    
    if (newPlan.id) {
        setPlans(prev => prev.map(p => p.id === newPlan.id ? newPlan as DailyPlan : p));
    } else {
        const plan: DailyPlan = {
            id: Date.now().toString(),
            title: newPlan.title,
            focus: newPlan.focus || '綜合',
            duration: 45,
            exercises: newPlan.exercises
        };
        setPlans([...plans, plan]);
    }
    resetCreateForm();
    setMode('PLANS');
  };
  
  const handleEditPlan = (e: React.MouseEvent, plan: DailyPlan) => {
      e.stopPropagation();
      setNewPlan(JSON.parse(JSON.stringify(plan)));
      setMode('CREATE');
  };

  const handleDeletePlan = (e: React.MouseEvent, planId: string) => {
      e.stopPropagation();
      if (window.confirm('確定要刪除此訓練計畫嗎？此操作無法復原。')) {
          setPlans(prev => prev.filter(p => p.id !== planId));
      }
  };

  // --- LOGIC: AI Generator ---
  const handleAiGeneratePlan = async () => {
      if (!aiPrompt.trim()) return;
      if (!process.env.API_KEY) {
        if ((window as any).aistudio) {
            try {
               await (window as any).aistudio.openSelectKey();
            } catch (e) {
               alert("API Key selection is required.");
               return;
            }
       } else {
            alert("API Key is missing!");
            return;
       }
      }
      
      setIsAiGenerating(true);
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `You are an expert fitness coach. Create a complete workout plan based on this request: "${aiPrompt}".
                       CRITICAL: You MUST return a JSON object with a non-empty "exercises" array.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        focus: { type: Type.STRING },
                        exercises: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    sets: { type: Type.INTEGER },
                                    reps: { type: Type.STRING },
                                    weight: { type: Type.NUMBER }
                                },
                                required: ["name", "sets", "reps"]
                            }
                        }
                    },
                    required: ["title", "focus", "exercises"]
                }
            }
        });

        let jsonString = response.text || "{}";
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonString);
        
        if (result && result.title) {
            const safeExercises = Array.isArray(result.exercises) ? result.exercises : [];
            setNewPlan({
                title: result.title,
                focus: result.focus,
                exercises: safeExercises.map((ex: any, idx: number) => ({
                    id: `ai-${Date.now()}-${idx}`,
                    name: ex.name,
                    sets: ex.sets || 3,
                    reps: String(ex.reps) || '10',
                    weight: ex.weight || 0,
                    completed: false
                }))
            });
            setShowAiModal(false);
            setAiPrompt('');
        }
      } catch (error) {
          console.error("AI Generation failed", error);
          alert("AI 生成失敗，請稍後再試。");
      } finally {
          setIsAiGenerating(false);
      }
  };

  // --- RENDERERS ---

  const renderActiveSession = () => {
    if (!activePlan) return null;
    const currentEx = activePlan.exercises[activeExerciseIndex];
    const isLastExercise = activeExerciseIndex === activePlan.exercises.length - 1;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-charcoal-900 flex flex-col p-6 animate-fade-in text-white overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowExitConfirm(true);
                    }} 
                    className="text-gray-400 text-sm p-4 -ml-4 hover:text-white flex items-center gap-1 active:scale-95 transition-transform"
                >
                    <X size={20} /> 取消
                </button>
                <div className="flex items-center gap-2 text-neon-green font-mono text-xl bg-charcoal-800 px-3 py-1 rounded-full border border-charcoal-700">
                    <Clock size={18} />
                    {formatTime(sessionTimer)}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-start mt-4 space-y-6 overflow-y-auto pb-48 no-scrollbar">
                {/* Progress Bar */}
                <div className="w-full flex gap-1 h-1.5 mb-2">
                    {activePlan.exercises.map((_, idx) => (
                        <div key={idx} className={`flex-1 rounded-full ${idx < activeExerciseIndex ? 'bg-neon-green' : idx === activeExerciseIndex ? 'bg-white' : 'bg-charcoal-700'}`} />
                    ))}
                </div>

                <div className="text-center w-full">
                    <span className="text-neon-blue uppercase tracking-widest text-xs font-bold mb-1 block">動作 {activeExerciseIndex + 1} / {activePlan.exercises.length}</span>
                    <h2 className="text-3xl font-black text-white leading-tight mb-2">{currentEx.name}</h2>
                    <p className="text-gray-400 text-sm">目標: {currentEx.sets} 組 x {currentEx.reps} 下</p>
                </div>

                {/* Active Set Card with UAT Optimized Steppers */}
                <div className="w-full max-w-sm bg-charcoal-800 rounded-3xl p-6 border border-charcoal-700 shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-neon-purple" />
                     
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-bold flex items-center gap-2">
                             <Dumbbell className="text-cta-orange" size={20} /> 第 {currentSet} 組
                         </h3>
                         <span className="text-xs text-gray-500 font-mono">SET {currentSet}/{currentEx.sets}</span>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         {/* Weight Control */}
                         <div className="bg-charcoal-900 p-2 rounded-2xl flex flex-col items-center border border-charcoal-700">
                             <span className="text-xs text-gray-400 uppercase font-bold mb-2">重量 (kg)</span>
                             <div className="flex items-center justify-between w-full">
                                <button onClick={() => adjustWeight(-2.5)} className="p-3 text-neon-blue bg-charcoal-800 rounded-xl active:bg-charcoal-700"><Minus size={20}/></button>
                                <input 
                                  type="number" 
                                  value={inputWeight}
                                  onChange={(e) => setInputWeight(parseFloat(e.target.value) || 0)}
                                  className="w-16 bg-transparent text-center text-3xl font-bold text-white outline-none"
                                />
                                <button onClick={() => adjustWeight(2.5)} className="p-3 text-neon-blue bg-charcoal-800 rounded-xl active:bg-charcoal-700"><Plus size={20}/></button>
                             </div>
                         </div>
                         
                         {/* Reps Control */}
                         <div className="bg-charcoal-900 p-2 rounded-2xl flex flex-col items-center border border-charcoal-700">
                             <span className="text-xs text-gray-400 uppercase font-bold mb-2">次數</span>
                             <div className="flex items-center justify-between w-full">
                                <button onClick={() => adjustReps(-1)} className="p-3 text-neon-green bg-charcoal-800 rounded-xl active:bg-charcoal-700"><Minus size={20}/></button>
                                <input 
                                  type="number" 
                                  value={inputReps}
                                  onChange={(e) => setInputReps(parseFloat(e.target.value) || 0)}
                                  className="w-16 bg-transparent text-center text-3xl font-bold text-white outline-none"
                                />
                                <button onClick={() => adjustReps(1)} className="p-3 text-neon-green bg-charcoal-800 rounded-xl active:bg-charcoal-700"><Plus size={20}/></button>
                             </div>
                         </div>
                     </div>
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="fixed bottom-8 left-0 right-0 px-6 max-w-md mx-auto z-[9999]">
                <button 
                  onClick={handleCompleteSet}
                  className="w-full bg-gradient-to-r from-cta-orange to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white text-xl font-bold py-5 rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <Check strokeWidth={3} />
                    {currentSet < currentEx.sets ? '完成此組' : '完成訓練/下一動作'}
                </button>
            </div>

            {/* Minimized Rest Timer Bar */}
            {isResting && isRestMinimized && (
                <div className="fixed bottom-28 left-6 right-6 z-[10000] bg-charcoal-800 border border-charcoal-600 rounded-xl p-3 flex justify-between items-center shadow-2xl animate-fade-in" onClick={() => setIsRestMinimized(false)}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-neon-blue flex items-center justify-center text-neon-blue font-mono font-bold">
                            {restTimer}
                        </div>
                        <span className="text-sm font-bold text-gray-300">休息中...</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); skipRest(); }} className="bg-neon-green text-charcoal-900 px-3 py-1 rounded-lg text-xs font-bold">跳過</button>
                    <ChevronUp className="text-gray-500 ml-2" />
                </div>
            )}

            {/* Full Screen Rest Timer Overlay */}
            {isResting && !isRestMinimized && (
                <div className="absolute inset-0 z-[10000] bg-charcoal-900/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-fade-in">
                    <div className="absolute top-6 right-6">
                        <button onClick={() => setIsRestMinimized(true)} className="text-gray-400 hover:text-white flex items-center gap-1 p-2">
                             <span className="text-xs">最小化</span> <ChevronDown size={20} />
                        </button>
                    </div>

                    <h3 className="text-gray-400 uppercase tracking-widest font-bold mb-8 flex items-center gap-2">
                        <Volume2 size={16} /> 休息一下
                    </h3>
                    
                    <div className="relative w-72 h-72 flex items-center justify-center mb-10">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
                            <circle cx="128" cy="128" r="110" stroke="#1f2937" strokeWidth="12" fill="none" />
                            <circle 
                                cx="128" cy="128" r="110" 
                                stroke="#22d3ee" strokeWidth="12" fill="none" 
                                strokeDasharray={2 * Math.PI * 110}
                                strokeDashoffset={2 * Math.PI * 110 * (1 - restTimer / defaultRestTime)}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-linear"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-8xl font-mono font-bold text-white tabular-nums tracking-tighter">{restTimer}</span>
                            <span className="text-lg text-gray-500 mt-2 font-bold">秒</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                        <button 
                            onClick={() => addRestTime(30)}
                            className="py-3 bg-charcoal-800 rounded-xl font-bold text-sm text-gray-300 hover:bg-charcoal-700 border border-charcoal-600"
                        >
                            +30 秒
                        </button>
                        <button 
                            onClick={() => addRestTime(60)}
                            className="py-3 bg-charcoal-800 rounded-xl font-bold text-sm text-gray-300 hover:bg-charcoal-700 border border-charcoal-600"
                        >
                            +1 分
                        </button>
                        <button 
                            onClick={skipRest}
                            className="py-3 bg-neon-green text-charcoal-900 rounded-xl font-bold text-sm hover:bg-lime-400 flex items-center justify-center gap-1"
                        >
                            跳過 <SkipForward size={16} />
                        </button>
                    </div>

                    {/* Next Exercise Preview */}
                    {activePlan && activeExerciseIndex < activePlan.exercises.length - 1 && (
                        <div className="mt-8 text-center opacity-60">
                            <p className="text-xs text-gray-500 uppercase">下一個動作</p>
                            <p className="text-sm font-bold text-white">{activePlan.exercises[activeExerciseIndex + 1].name}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Custom Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="absolute inset-0 z-[10001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-charcoal-800 p-6 rounded-2xl border border-charcoal-600 w-full max-w-xs text-center shadow-2xl">
                        <div className="mx-auto bg-red-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="text-red-500" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">結束訓練？</h3>
                        <p className="text-gray-400 text-sm mb-6">您確定要現在結束嗎？目前的進度將不會儲存。</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowExitConfirm(false)}
                                className="flex-1 py-3 bg-charcoal-700 hover:bg-charcoal-600 text-white rounded-xl font-bold text-sm transition-colors"
                            >
                                繼續訓練
                            </button>
                            <button 
                                onClick={handleExitSession}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-red-500/20"
                            >
                                確定結束
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    
    // Find workout for selected date
    const workoutForSelectedDate = scheduledWorkouts.find(s => s.date === selectedDateStr);
    const planForSelectedDate = workoutForSelectedDate ? plans.find(p => p.id === workoutForSelectedDate.planId) : null;

    return (
        <div className="space-y-6">
            {/* Month Nav */}
            <div className="flex items-center justify-between bg-white dark:bg-charcoal-800 p-4 rounded-xl shadow-sm">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded-full"><ChevronLeft /></button>
                <h3 className="font-bold text-lg">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded-full"><ChevronRight /></button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="text-gray-400 py-2">{d}</div>)}
                {blanks.map(b => <div key={`blank-${b}`} />)}
                {days.map(d => {
                    const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                    const hasWorkout = scheduledWorkouts.find(s => s.date === dateStr);
                    const isSelected = selectedDateStr === dateStr;
                    
                    return (
                        <div 
                            key={d} 
                            onClick={() => handleDateClick(d)}
                            className={`
                                aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all border
                                ${isSelected ? 'border-neon-blue bg-neon-blue/10 text-neon-blue font-bold' : 'border-transparent hover:bg-gray-50 dark:hover:bg-charcoal-700'}
                                ${hasWorkout ? (hasWorkout.completed ? 'bg-green-900/20' : 'bg-charcoal-800') : ''}
                            `}
                        >
                            <span>{d}</span>
                            {hasWorkout && (
                                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${hasWorkout.completed ? 'bg-neon-green' : 'bg-cta-orange'}`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Selected Date Details */}
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 animate-fade-in">
                <h4 className="text-gray-500 dark:text-gray-400 text-sm mb-4 uppercase font-bold tracking-wide">
                    {selectedDateStr} 的行程
                </h4>

                {planForSelectedDate ? (
                    <div>
                         <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold">{planForSelectedDate.title}</h3>
                                <span className="text-neon-blue text-sm">{planForSelectedDate.focus}</span>
                            </div>
                            {workoutForSelectedDate?.completed && <span className="bg-neon-green text-charcoal-900 text-xs font-bold px-2 py-1 rounded">已完成</span>}
                         </div>
                         <div className="space-y-2 mb-6">
                            {planForSelectedDate.exercises.slice(0, 3).map(ex => (
                                <div key={ex.id} className="text-sm text-gray-500 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                    {ex.name}
                                </div>
                            ))}
                            {planForSelectedDate.exercises.length > 3 && <div className="text-xs text-gray-400 pl-4">...還有 {planForSelectedDate.exercises.length - 3} 個動作</div>}
                         </div>
                         {!workoutForSelectedDate?.completed && (
                             <button 
                                onClick={() => startWorkout(planForSelectedDate)}
                                className="w-full bg-cta-orange hover:bg-cta-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                            >
                                <Play fill="currentColor" size={18} />
                                開始訓練
                             </button>
                         )}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-gray-500 mb-4">這一天還沒有安排訓練。</p>
                        <h5 className="font-bold text-sm mb-2 text-left w-full text-gray-400">選擇一個計畫加入：</h5>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                            {plans.map(p => (
                                <button 
                                    key={p.id} 
                                    onClick={() => assignPlanToDate(p.id)}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-charcoal-900 hover:bg-gray-100 dark:hover:bg-charcoal-700 text-left transition-colors"
                                >
                                    <span className="font-medium text-sm">{p.title}</span>
                                    <Plus size={16} className="text-neon-blue" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };
  
  const renderCreatePlan = () => (
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 animate-fade-in relative">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-bold">{newPlan.id ? '編輯訓練計畫' : '建立新訓練計畫'}</h3>
             <button 
                onClick={() => setShowAiModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform"
             >
                 <Sparkles size={14} /> AI 幫我排
             </button>
          </div>
          
          <div className="space-y-4">
              <input 
                type="text" 
                placeholder="計畫名稱 (例如：週一腿部日)" 
                className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-lg p-3 outline-none focus:border-neon-blue transition-colors"
                value={newPlan.title}
                onChange={e => setNewPlan({...newPlan, title: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="訓練部位 / 重點" 
                className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-lg p-3 outline-none focus:border-neon-blue transition-colors"
                value={newPlan.focus}
                onChange={e => setNewPlan({...newPlan, focus: e.target.value})}
              />
          </div>

          <div className="border-t border-gray-200 dark:border-charcoal-700 pt-4 mt-4">
              <h4 className="font-bold text-sm mb-3">新增動作</h4>
              
              <div className="flex gap-2 mb-2 relative">
                  <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="搜尋動作..." 
                        className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-lg p-2 text-sm pl-8 focus:ring-1 focus:ring-neon-blue outline-none"
                        value={exerciseSearchTerm}
                        onChange={e => {
                            setExerciseSearchTerm(e.target.value);
                            setShowExerciseSuggestions(true);
                        }}
                        onFocus={() => setShowExerciseSuggestions(true)}
                    />
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    
                    {showExerciseSuggestions && exerciseSearchTerm && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-20">
                            {filteredTutorials.length > 0 ? (
                                filteredTutorials.map(tut => (
                                    <div 
                                        key={tut.id}
                                        onClick={() => selectExercise(tut)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-charcoal-800 cursor-pointer text-sm flex justify-between items-center"
                                    >
                                        <span>{tut.name}</span>
                                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-charcoal-800 px-1 rounded">{tut.bodyPart}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-2 text-xs text-gray-400">無符合動作，將使用自訂名稱</div>
                            )}
                        </div>
                    )}
                  </div>
              </div>
              
              <div className="flex gap-2 mb-3">
                   <div className="w-20 shrink-0">
                     <input 
                        type="number" 
                        placeholder="組數" 
                        className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-lg p-2 text-sm text-center"
                        value={newExercise.sets}
                        onChange={e => setNewExercise({...newExercise, sets: parseInt(e.target.value) || 0})}
                     />
                   </div>
                   <div className="w-28 shrink-0">
                     <input 
                        type="number" 
                        placeholder="重量(kg)" 
                        className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-lg p-2 text-sm text-center"
                        value={newExercise.weight || ''}
                        onChange={e => setNewExercise({...newExercise, weight: parseFloat(e.target.value)})}
                     />
                   </div>
                   <input 
                    type="text" 
                    placeholder="次數 (例如 8-12)" 
                    className="flex-1 min-w-0 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-lg p-2 text-sm"
                    value={newExercise.reps}
                    onChange={e => setNewExercise({...newExercise, reps: e.target.value})}
                  />
                  <button onClick={addExerciseToNewPlan} className="bg-charcoal-700 hover:bg-charcoal-600 text-white p-2 rounded-lg">
                      <Plus size={20} />
                  </button>
              </div>

              <div className="space-y-2 mb-6">
                  {newPlan.exercises?.map((ex, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-charcoal-900 p-3 rounded-lg text-sm group">
                          <div className="flex flex-col">
                            <span className="font-bold">{ex.name}</span>
                            <span className="text-gray-500 text-xs mt-0.5">{ex.sets} 組 x {ex.reps} {ex.weight ? `x ${ex.weight}kg` : ''}</span>
                          </div>
                          <Trash2 size={16} className="text-red-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                              setNewPlan(prev => ({...prev, exercises: prev.exercises?.filter((_, i) => i !== idx)}))
                          }} />
                      </div>
                  ))}
                  {(!newPlan.exercises || newPlan.exercises.length === 0) && <p className="text-center text-gray-400 text-sm py-2 border-dashed border border-gray-200 dark:border-charcoal-700 rounded-lg">尚未新增動作</p>}
              </div>

              <button 
                onClick={saveNewPlan}
                disabled={!newPlan.title || !newPlan.exercises?.length}
                className="w-full bg-neon-blue hover:bg-cyan-300 text-charcoal-900 font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                  <Save size={18} />
                  {newPlan.id ? '更新計畫' : '儲存計畫'}
              </button>
          </div>

          {showAiModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-white dark:bg-charcoal-800 w-full max-w-sm rounded-2xl shadow-2xl border border-purple-500/30 p-6 relative">
                      <button 
                        onClick={() => setShowAiModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                      >
                          <X size={20} />
                      </button>
                      
                      <div className="flex flex-col items-center mb-6">
                          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-3 shadow-lg shadow-purple-500/30">
                              <Sparkles className="text-white" size={24} />
                          </div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI 智能排課</h3>
                          <p className="text-xs text-gray-400 mt-1">告訴我你想練什麼，我幫你安排！</p>
                      </div>

                      <div className="space-y-4">
                          <textarea 
                             className="w-full h-24 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-xl p-3 text-sm focus:border-purple-500 outline-none resize-none"
                             placeholder="例如：我想練胸部和三頭肌，時間大約45分鐘..."
                             value={aiPrompt}
                             onChange={e => setAiPrompt(e.target.value)}
                          />
                          
                          <button 
                            onClick={handleAiGeneratePlan}
                            disabled={isAiGenerating || !aiPrompt.trim()}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                          >
                              {isAiGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                              開始生成
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  const renderPlansList = () => (
      <div className="space-y-4 animate-fade-in">
          {plans.map(plan => (
              <div key={plan.id} className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-neon-blue/50 transition-colors cursor-pointer group" onClick={() => {
                  setSelectedDateStr(new Date().toISOString().split('T')[0]); // Default to today for context
                  startWorkout(plan);
              }}>
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg group-hover:text-neon-blue transition-colors">{plan.title}</h3>
                      
                      {/* Edit/Delete Actions */}
                      <div className="flex gap-1">
                          <span className="text-xs font-bold bg-charcoal-100 dark:bg-charcoal-900 px-2 py-1 rounded text-gray-500 mr-2 self-center">{plan.duration} mins</span>
                          <button 
                            onClick={(e) => handleEditPlan(e, plan)}
                            className="p-1.5 text-gray-400 hover:text-neon-blue hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors"
                          >
                              <Pencil size={16} />
                          </button>
                          <button 
                            onClick={(e) => handleDeletePlan(e, plan.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors"
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{plan.focus}</p>
                  <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">{plan.exercises.length} 個動作</span>
                      <button className="text-cta-orange font-bold text-sm flex items-center gap-1">
                          開始 <ChevronRight size={16} />
                      </button>
                  </div>
              </div>
          ))}
      </div>
  );

  if (mode === 'ACTIVE_SESSION') {
      return renderActiveSession();
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between mb-2">
           <h2 className="text-2xl font-bold">訓練管理</h2>
       </div>

       <div className="flex p-1 bg-gray-200 dark:bg-charcoal-800 rounded-xl mb-6">
           <button 
             onClick={() => setMode('CALENDAR')}
             className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'CALENDAR' ? 'bg-white dark:bg-charcoal-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
           >
               <CalendarIcon size={16} /> 行事曆
           </button>
           <button 
             onClick={() => setMode('PLANS')}
             className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'PLANS' ? 'bg-white dark:bg-charcoal-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
           >
               <List size={16} /> 我的計畫
           </button>
           <button 
             onClick={() => {
                 resetCreateForm();
                 setMode('CREATE');
             }}
             className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'CREATE' ? 'bg-white dark:bg-charcoal-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
           >
               <Plus size={16} /> 建立
           </button>
       </div>

       {mode === 'CALENDAR' && renderCalendar()}
       {mode === 'PLANS' && renderPlansList()}
       {mode === 'CREATE' && renderCreatePlan()}
    </div>
  );
};

export default Workout;
