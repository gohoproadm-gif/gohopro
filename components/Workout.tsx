
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_PLANS, TUTORIALS_DATA } from '../constants';
import { DailyPlan, ScheduledWorkout, Tutorial, WorkoutRecord, ExerciseLog, ExerciseSetLog, Exercise } from '../types';
import { Play, Plus, Calendar as CalendarIcon, List, Clock, ChevronRight, ChevronLeft, Check, Trash2, Dumbbell, Save, Search, Sparkles, Loader2, X, SkipForward, Timer, Pencil, AlertCircle, Minus, Volume2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { apiGetSchedule, apiSaveSchedule } from '../lib/db';

type Mode = 'CALENDAR' | 'PLANS' | 'CREATE' | 'ACTIVE_SESSION';

interface WorkoutProps {
  autoStart?: boolean;
  onAutoStartConsumed?: () => void;
  onFinishWorkout?: (record: WorkoutRecord) => void;
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

const Workout: React.FC<WorkoutProps> = ({ autoStart, onAutoStartConsumed, onFinishWorkout }) => {
  const [mode, setMode] = useState<Mode>('CALENDAR');
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activePlan, setActivePlan] = useState<DailyPlan | null>(null);

  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [sessionLogs, setSessionLogs] = useState<Record<string, ExerciseSetLog[]>>({});
  const [restTimer, setRestTimer] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
        const s = await apiGetSchedule();
        setSchedule(s);
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

  const handleStartSession = (plan: DailyPlan) => {
      setActivePlan(plan);
      setSessionStartTime(Date.now());
      setCompletedExercises(new Set());
      
      const initialLogs: Record<string, ExerciseSetLog[]> = {};
      plan.exercises.forEach(ex => {
          initialLogs[ex.id] = Array(ex.sets).fill({ setNumber: 0, weight: 0, reps: 0, completed: false }).map((_, i) => ({
              setNumber: i + 1,
              weight: ex.weight || 0,
              reps: parseInt(ex.reps) || 10,
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
      setMode('CALENDAR');
  };

  // Robust API Key Retrieval
  const getApiKey = () => {
    try {
        if (typeof process !== 'undefined' && process.env) {
            if (process.env.API_KEY) return process.env.API_KEY;
            if (process.env.NEXT_PUBLIC_API_KEY) return process.env.NEXT_PUBLIC_API_KEY;
            if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
            if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
        }
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
            // @ts-ignore
            if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
        }
    } catch (e) {
        console.warn("Error reading env vars", e);
    }
    return null;
  };

  const handleGeneratePlan = async () => {
      if (!aiPrompt.trim()) return;
      setAiError(null);

      const apiKey = getApiKey();

      if (!apiKey) {
          setAiError("系統未偵測到 API Key。請在 Vercel 環境變數中設定 'VITE_API_KEY' 並重新部署。");
          return;
      }

      setIsGenerating(true);
      try {
          const ai = new GoogleGenAI({ apiKey: apiKey });
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Create a workout plan based on this request: "${aiPrompt}".
                         Return strictly JSON format.
                         Structure: {
                            "title": "Plan Name",
                            "focus": "Target Area",
                            "duration": 45,
                            "exercises": [
                                { "name": "Exercise Name", "sets": 3, "reps": "12" }
                            ]
                         }`,
              config: {
                responseMimeType: "application/json"
              }
          });
          
          const result = JSON.parse(response.text || "{}");
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
              setMode('CALENDAR');
          }

      } catch (e: any) {
          console.error("AI Plan Error", e);
          setAiError("生成失敗: " + (e.message || "未知錯誤"));
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
                  <button 
                    onClick={handleFinishSession}
                    className="bg-neon-green text-charcoal-900 font-bold px-4 py-2 rounded-lg text-sm shadow-lg shadow-neon-green/20"
                  >
                      結束訓練
                  </button>
              </div>

              <div className="space-y-6">
                  {activePlan.exercises.map((exercise) => (
                      <div key={exercise.id} className="bg-white dark:bg-charcoal-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-charcoal-700">
                          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                              <Dumbbell size={18} className="text-neon-blue"/>
                              {exercise.name}
                          </h3>
                          
                          <div className="space-y-2">
                              <div className="grid grid-cols-10 gap-2 text-xs font-bold text-gray-400 mb-1 px-1">
                                  <div className="col-span-1 text-center">SET</div>
                                  <div className="col-span-3 text-center">KG</div>
                                  <div className="col-span-3 text-center">REPS</div>
                                  <div className="col-span-3 text-center">DONE</div>
                              </div>
                              {sessionLogs[exercise.id]?.map((set, idx) => (
                                  <div key={idx} className={`grid grid-cols-10 gap-2 items-center p-2 rounded-lg transition-colors ${set.completed ? 'bg-neon-green/10 border border-neon-green/30' : 'bg-gray-50 dark:bg-charcoal-900 border border-transparent'}`}>
                                      <div className="col-span-1 text-center font-bold text-gray-500">{idx + 1}</div>
                                      <div className="col-span-3">
                                          <input 
                                            type="number" 
                                            value={set.weight} 
                                            onChange={(e) => updateSetLog(exercise.id, idx, 'weight', Number(e.target.value))}
                                            className="w-full bg-transparent text-center font-bold border-b border-gray-300 dark:border-gray-600 focus:border-neon-blue outline-none py-1"
                                          />
                                      </div>
                                      <div className="col-span-3">
                                           <input 
                                            type="number" 
                                            value={set.reps} 
                                            onChange={(e) => updateSetLog(exercise.id, idx, 'reps', Number(e.target.value))}
                                            className="w-full bg-transparent text-center font-bold border-b border-gray-300 dark:border-gray-600 focus:border-neon-blue outline-none py-1"
                                          />
                                      </div>
                                      <div className="col-span-3 flex justify-center">
                                          <button 
                                            onClick={() => toggleSetComplete(exercise.id, idx)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${set.completed ? 'bg-neon-green text-charcoal-900' : 'bg-gray-200 dark:bg-charcoal-700 text-gray-400'}`}
                                          >
                                              <Check size={16} strokeWidth={3} />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>

              {isResting && (
                  <div className="fixed bottom-20 left-4 right-4 bg-charcoal-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between z-40 animate-fade-in border border-charcoal-700">
                      <div>
                          <div className="text-xs text-gray-400 font-bold uppercase">Resting</div>
                          <div className="text-2xl font-mono font-bold text-cta-orange">{restTimer}s</div>
                      </div>
                      <div className="flex gap-2">
                           <button onClick={() => setRestTimer(t => t + 10)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700">+10s</button>
                           <button onClick={() => setIsResting(false)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-red-400">Skip</button>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="space-y-6 pb-20">
        <div className="bg-gray-100 dark:bg-charcoal-800 p-1 rounded-xl flex">
            <button 
                onClick={() => setMode('CALENDAR')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'CALENDAR' ? 'bg-white dark:bg-charcoal-900 shadow text-charcoal-900 dark:text-white' : 'text-gray-500'}`}
            >
                <CalendarIcon size={16} /> 日曆
            </button>
            <button 
                onClick={() => setMode('PLANS')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'PLANS' ? 'bg-white dark:bg-charcoal-900 shadow text-charcoal-900 dark:text-white' : 'text-gray-500'}`}
            >
                <List size={16} /> 課表庫
            </button>
        </div>

        {mode === 'CALENDAR' && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                     <button onClick={() => {
                         const d = new Date(selectedDate);
                         d.setDate(d.getDate() - 1);
                         setSelectedDate(d.toISOString().split('T')[0]);
                     }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-charcoal-800"><ChevronLeft/></button>
                     
                     <div className="text-center">
                         <h3 className="font-bold text-lg">{selectedDate}</h3>
                         <span className="text-xs text-gray-500">{new Date(selectedDate).toLocaleDateString('zh-TW', { weekday: 'long' })}</span>
                     </div>

                     <button onClick={() => {
                         const d = new Date(selectedDate);
                         d.setDate(d.getDate() + 1);
                         setSelectedDate(d.toISOString().split('T')[0]);
                     }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-charcoal-800"><ChevronRight/></button>
                </div>

                <div className="space-y-3">
                    {schedule.filter(s => s.date === selectedDate).map((s, idx) => {
                        const plan = DEFAULT_PLANS.find(p => p.id === s.planId) || { title: '自定義訓練', duration: 45, focus: 'General', exercises: [] };
                        return (
                            <div key={idx} className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-charcoal-700 flex justify-between items-center group hover:border-neon-blue transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-lg">{plan.title}</h4>
                                        {s.completed && <CheckCircle size={16} className="text-neon-green" />}
                                    </div>
                                    <p className="text-sm text-gray-500">{plan.focus} • {plan.duration} min</p>
                                </div>
                                <button 
                                    onClick={() => handleStartSession(plan as DailyPlan)}
                                    disabled={s.completed}
                                    className={`px-4 py-2 rounded-full font-bold text-sm ${s.completed ? 'bg-gray-100 dark:bg-charcoal-900 text-gray-400' : 'bg-neon-blue text-charcoal-900 hover:bg-cyan-400 shadow-lg shadow-neon-blue/20'}`}
                                >
                                    {s.completed ? '已完成' : '開始'}
                                </button>
                            </div>
                        );
                    })}

                    {schedule.filter(s => s.date === selectedDate).length === 0 && (
                        <div className="text-center py-10 bg-gray-50 dark:bg-charcoal-800/50 rounded-2xl border-dashed border-2 border-gray-200 dark:border-charcoal-700">
                             <p className="text-gray-500 mb-4">今天還沒有安排訓練</p>
                             <div className="flex gap-2 justify-center">
                                 <button onClick={() => setMode('PLANS')} className="text-neon-blue font-bold text-sm hover:underline">選擇課表</button>
                                 <span className="text-gray-300">|</span>
                                 <button onClick={() => setMode('CREATE')} className="text-cta-orange font-bold text-sm hover:underline">AI 安排</button>
                             </div>
                        </div>
                    )}
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
                                setMode('CALENDAR');
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
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Sparkles className="text-cta-orange" /> AI 智慧排課
                    </h3>
                    <button onClick={() => setMode('CALENDAR')}><X size={20} className="text-gray-400"/></button>
                </div>

                <div className="space-y-4">
                    <textarea 
                        value={aiPrompt}
                        onChange={(e) => {
                            setAiPrompt(e.target.value);
                            setAiError(null);
                        }}
                        placeholder="例如：我只有30分鐘，想練胸肌和三頭肌，家裡只有啞鈴..."
                        className="w-full h-32 p-4 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange resize-none"
                    />
                    
                    {aiError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 text-xs rounded-lg flex items-center gap-2">
                            <AlertTriangle size={14} /> {aiError}
                        </div>
                    )}

                    <button 
                        onClick={handleGeneratePlan}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="w-full bg-cta-orange text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                        {isGenerating ? 'AI 思考中...' : '生成課表'}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

function CheckCircle({ size, className }: { size: number, className?: string }) {
    return <Check size={size} className={className} />;
}

export default Workout;
