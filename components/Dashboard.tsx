
import React, { useMemo, useState, useEffect } from 'react';
import { Activity, Flame, Clock, Trophy, User, ArrowRight, Target, Droplets, Plus, Minus, Edit2, X, Save, Utensils, CalendarDays, CheckCircle2, Play, Dumbbell, Award, Zap, Crown, Star, Moon, Sun } from 'lucide-react';
import { MOTIVATIONAL_QUOTES, DEFAULT_PLANS } from '../constants';
import { NutritionLog, UserProfile, ScheduledWorkout, DailyPlan, Language, WorkoutRecord } from '../types';

interface DashboardProps {
  onStartWorkout: () => void;
  nutritionLogs: NutritionLog[];
  historyLogs?: WorkoutRecord[]; 
  userProfile: UserProfile;
  language: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartWorkout, nutritionLogs, historyLogs = [], userProfile, language }) => {
  const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

  const t = {
    zh: {
        goodMorning: '早安',
        calories: '熱量',
        steps: '今日步數',
        streak: '本週訓練',
        bodyStats: '身體數據',
        waterTracker: '飲水追蹤',
        nextWorkout: '今日訓練',
        noPlan: '今日暫無行程，建議進行：',
        startWorkout: '開始訓練',
        arrangeWorkout: '安排訓練',
        editSteps: '編輯步數',
        editWater: '編輯飲水',
        save: '儲存',
        progress: '達成',
        macros: '營養素',
        level: '等級',
        xp: '經驗值',
        badges: '成就徽章',
        nextLevel: '距離下一級',
        totalWorkouts: '總訓練次數'
    },
    en: {
        goodMorning: 'Good Morning',
        calories: 'Calories',
        steps: 'Steps Today',
        streak: 'Weekly Streak',
        bodyStats: 'Body Stats',
        waterTracker: 'Water Tracker',
        nextWorkout: 'Next Workout',
        noPlan: 'No plans today. Suggested:',
        startWorkout: 'Start Workout',
        arrangeWorkout: 'Plan Workout',
        editSteps: 'Edit Steps',
        editWater: 'Edit Water',
        save: 'Save',
        progress: 'Progress',
        macros: 'Macros',
        level: 'Level',
        xp: 'XP',
        badges: 'Badges',
        nextLevel: 'Next Level',
        totalWorkouts: 'Total Workouts'
    }
  }[language];

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLogs = nutritionLogs.filter(log => log.date === todayStr);
  
  // Logic to find Next Workout or Suggestion
  const [nextWorkout, setNextWorkout] = useState<{title: string, duration: number, isSuggested?: boolean} | null>(null);

  // Water Tracker State
  const [waterIntake, setWaterIntake] = useState(0);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [tempWater, setTempWater] = useState(0);
  const dailyWaterGoal = 2500; 

  // Steps Tracker State
  const [steps, setSteps] = useState(0);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [tempSteps, setTempSteps] = useState(0);

  useEffect(() => {
      const savedWater = localStorage.getItem(`water_${todayStr}`);
      if (savedWater) setWaterIntake(parseInt(savedWater));
      
      const savedSteps = localStorage.getItem(`steps_${todayStr}`);
      if (savedSteps) setSteps(parseInt(savedSteps));
  }, [todayStr]);

  const updateWater = (amount: number) => {
      const newVal = Math.max(0, waterIntake + amount);
      setWaterIntake(newVal);
      localStorage.setItem(`water_${todayStr}`, newVal.toString());
  };

  const handleSaveWater = () => {
      setWaterIntake(tempWater);
      localStorage.setItem(`water_${todayStr}`, tempWater.toString());
      setShowWaterModal(false);
  };

  const handleSaveSteps = () => {
      setSteps(tempSteps);
      localStorage.setItem(`steps_${todayStr}`, tempSteps.toString());
      setShowStepsModal(false);
  };

  // Smart Suggestion Logic
  useEffect(() => {
    const savedSchedule = localStorage.getItem('fitlife_schedule');
    
    // 1. Try to find scheduled workout
    if (savedSchedule) {
        const schedule: ScheduledWorkout[] = JSON.parse(savedSchedule);
        const todaysWorkout = schedule.find(s => s.date === todayStr && !s.completed);
        
        if (todaysWorkout) {
             const plan = DEFAULT_PLANS.find(p => p.id === todaysWorkout.planId);
             if (plan) {
                 setNextWorkout({ title: plan.title, duration: plan.duration });
                 return;
             }
        }
    }

    // 2. If no schedule, suggest based on last workout or default
    if (historyLogs.length > 0) {
        // Simple rotation logic or just suggest something different
        const allPlans = JSON.parse(localStorage.getItem('fitlife_plans') || JSON.stringify(DEFAULT_PLANS));
        const randomPlan = allPlans[Math.floor(Math.random() * allPlans.length)];
        setNextWorkout({ title: randomPlan.title, duration: randomPlan.duration, isSuggested: true });
    } else {
        // Brand new user
        setNextWorkout({ title: DEFAULT_PLANS[0].title, duration: DEFAULT_PLANS[0].duration, isSuggested: true });
    }

  }, [todayStr, historyLogs]);

  const last7Days = useMemo(() => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const hasWorkout = historyLogs.some(h => h.date === dateStr);
          days.push({ 
              date: dateStr, 
              dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }), 
              hasWorkout,
              isToday: dateStr === todayStr
          });
      }
      return days;
  }, [historyLogs, todayStr]);

  const totalNutrition = useMemo(() => {
    return todaysLogs.reduce((acc, curr) => ({
        calories: acc.calories + curr.calories,
        p: acc.p + curr.macros.p,
        c: acc.c + curr.macros.c,
        f: acc.f + curr.macros.f
    }), { calories: 0, p: 0, c: 0, f: 0 });
  }, [todaysLogs]);

  const calculateTargets = () => {
    if (userProfile?.customTargets?.enabled) {
        return userProfile.customTargets;
    }
    if (!userProfile) return { calories: 2000, protein: 150, carbs: 200, fat: 60 };
    let bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age;
    bmr += userProfile.gender === 'male' ? 5 : -161;
    let multiplier = 1.2; 
    if (userProfile.activityLevel === 'light') multiplier = 1.375;
    if (userProfile.activityLevel === 'moderate') multiplier = 1.55;
    if (userProfile.activityLevel === 'active') multiplier = 1.725;
    if (userProfile.activityLevel === 'very_active') multiplier = 1.9;
    let tdee = Math.round(bmr * multiplier);
    if (userProfile.goal === 'lose_weight') tdee -= 500;
    if (userProfile.goal === 'gain_muscle') tdee += 300;
    return {
        calories: tdee,
        protein: Math.round((tdee * 0.3) / 4), 
        carbs: Math.round((tdee * 0.45) / 4), 
        fat: Math.round((tdee * 0.25) / 9)  
    };
  };

  // --- GAMIFICATION LOGIC ---
  const gamificationStats = useMemo(() => {
      let totalXP = 0;
      let totalWorkouts = historyLogs.length;
      let totalVolume = 0;
      let morningWorkouts = 0;
      let nightWorkouts = 0;
      
      historyLogs.forEach(log => {
          // 1 minute = 5 XP
          totalXP += log.duration * 5;
          // 1 completed workout = 100 XP
          totalXP += 100;
          
          // Check time for badges
          const hour = new Date(log.date).getHours(); // Note: log.date is currently YYYY-MM-DD, strict time check needs timestamp. Assuming approximate for now or if timestamp available.
          // Fallback if date string doesn't have time, random assignment for mock feels
          // For a real app, log.date should be ISO string with time.
          // Let's rely on basic heuristics if simple date.
          
          if (log.details) {
              log.details.forEach(ex => {
                  ex.sets.forEach(s => {
                      if(s.completed && s.weight > 0) {
                          const vol = s.weight * s.reps;
                          totalVolume += vol;
                          // 100kg volume = 1 XP
                          totalXP += Math.floor(vol / 100);
                      }
                  });
              });
          }
      });

      // Level Calculation: Level N requires N*1000 XP (Linear-ish progression for demo)
      // Or: Level = Math.floor(Math.sqrt(totalXP / 100))
      const level = Math.floor(Math.sqrt(totalXP / 50)) + 1;
      const prevLevelXp = 50 * Math.pow(level - 1, 2);
      const nextLevelXp = 50 * Math.pow(level, 2);
      const currentLevelProgress = totalXP - prevLevelXp;
      const levelRange = nextLevelXp - prevLevelXp;
      const progressPercent = Math.min((currentLevelProgress / levelRange) * 100, 100);

      // Badges
      const badges = [];
      if (totalWorkouts >= 1) badges.push({ id: 'first_step', icon: <CheckCircle2 size={14}/>, label: '初出茅廬', color: 'bg-gray-500' });
      if (totalWorkouts >= 10) badges.push({ id: 'consistent', icon: <Flame size={14}/>, label: '持之以恆', color: 'bg-orange-500' });
      if (totalWorkouts >= 50) badges.push({ id: 'veteran', icon: <Crown size={14}/>, label: '健身老手', color: 'bg-yellow-500' });
      if (totalVolume >= 10000) badges.push({ id: 'heavy', icon: <Dumbbell size={14}/>, label: '大力士', color: 'bg-red-500' });
      if (totalXP > 5000) badges.push({ id: 'elite', icon: <Zap size={14}/>, label: '菁英戰士', color: 'bg-purple-500' });

      return {
          totalXP,
          level,
          progressPercent,
          badges,
          nextLevelXp: Math.floor(nextLevelXp),
          currentXP: Math.floor(totalXP)
      };
  }, [historyLogs]);

  const targets = calculateTargets();
  const percentage = Math.min((totalNutrition.calories / targets.calories) * 100, 100);
  const pPercent = Math.min((totalNutrition.p / targets.protein) * 100, 100);
  const cPercent = Math.min((totalNutrition.c / targets.carbs) * 100, 100);
  const fPercent = Math.min((totalNutrition.f / targets.fat) * 100, 100);

  const bmi = userProfile 
    ? (userProfile.weight / ((userProfile.height / 100) * (userProfile.height / 100))).toFixed(1) 
    : '0';

  const MacroBar = ({ label, current, target, color, percent }: any) => (
      <div className="w-full">
          <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-gray-500">{label}</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">{current} / {target}g</span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-charcoal-900 rounded-full overflow-hidden">
              <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
          </div>
      </div>
  );

  const ProgressRing = ({ radius, stroke, progress, color }: { radius: number, stroke: number, progress: number, color: string }) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          <circle stroke="currentColor" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} className="text-gray-100 dark:text-charcoal-700"/>
          <circle stroke={color} fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} className="transition-all duration-1000 ease-out"/>
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
             <Flame size={24} className="text-cta-orange mb-1" />
             <span className="text-2xl font-black text-gray-800 dark:text-white">{totalNutrition.calories}</span>
             <span className="text-xs text-gray-400">/ {targets.calories}</span>
        </div>
      </div>
    );
  };
  
  if (!userProfile) return null;

  return (
    <div className="space-y-6">
      <header className="mb-2 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold mb-1">{t.goodMorning}，{userProfile.name}！</h2>
            <p className="text-gray-500 dark:text-gray-400 italic text-sm">"{quote}"</p>
        </div>
        <div className="hidden md:block text-right">
            <div className="text-xs text-gray-500 font-bold uppercase">{t.totalWorkouts}</div>
            <div className="text-2xl font-black text-neon-blue">{historyLogs.length}</div>
        </div>
      </header>

      {/* Gamification Card (New) */}
      <div className="bg-gradient-to-r from-charcoal-800 to-charcoal-900 border border-gray-700 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-2xl border-2 border-white/20">
                      {gamificationStats.level}
                  </div>
                  <div className="flex-1">
                      <div className="flex justify-between items-end mb-1">
                          <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">{t.level} {gamificationStats.level}</span>
                          <span className="text-xs font-mono text-neon-blue">{gamificationStats.currentXP} / {gamificationStats.nextLevelXp} XP</span>
                      </div>
                      <div className="h-3 w-full bg-charcoal-950 rounded-full overflow-hidden border border-white/10">
                          <div 
                            className="h-full bg-gradient-to-r from-neon-blue to-neon-purple transition-all duration-1000 relative" 
                            style={{ width: `${gamificationStats.progressPercent}%` }}
                          >
                              <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 blur-[1px]"></div>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto mask-linear-fade">
                  {gamificationStats.badges.length > 0 ? (
                      gamificationStats.badges.map((badge) => (
                          <div key={badge.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-md whitespace-nowrap ${badge.color}`}>
                              {badge.icon} {badge.label}
                          </div>
                      ))
                  ) : (
                      <div className="text-xs text-gray-500 flex items-center gap-2 px-2">
                          <Award size={14} /> 持續訓練以解鎖徽章
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-charcoal-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-charcoal-700 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Utensils size={20} className="text-neon-green"/> {t.calories} & {t.macros}</h3>
                {userProfile.customTargets?.enabled && <span className="text-[10px] bg-neon-blue/10 text-neon-blue px-2 py-1 rounded font-bold">自訂目標</span>}
            </div>
            
            <div className="flex items-center gap-6">
                <div className="shrink-0">
                    <ProgressRing radius={70} stroke={10} progress={percentage} color="#f97316" />
                </div>
                <div className="flex-1 space-y-4">
                    <MacroBar label="蛋白質 (Protein)" current={totalNutrition.p} target={targets.protein} color="bg-neon-green" percent={pPercent} />
                    <MacroBar label="碳水 (Carbs)" current={totalNutrition.c} target={targets.carbs} color="bg-neon-blue" percent={cPercent} />
                    <MacroBar label="脂肪 (Fat)" current={totalNutrition.f} target={targets.fat} color="bg-neon-purple" percent={fPercent} />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-white dark:bg-charcoal-800 p-4 rounded-3xl border border-gray-100 dark:border-charcoal-700 shadow-sm flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                          <CalendarDays size={18} className="text-neon-purple"/>
                          <span className="font-bold text-gray-700 dark:text-white">{t.streak}</span>
                      </div>
                      <span className="text-xs text-gray-500">過去7天</span>
                  </div>
                  <div className="flex gap-2">
                      {last7Days.map((day, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${day.hasWorkout ? 'bg-neon-green text-charcoal-900 shadow-lg shadow-neon-green/20' : day.isToday ? 'bg-gray-100 dark:bg-charcoal-700 border-2 border-neon-blue text-neon-blue' : 'bg-gray-100 dark:bg-charcoal-900 text-gray-400'}`}>
                                  {day.hasWorkout ? <CheckCircle2 size={16}/> : day.dayName}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              <div onClick={() => { setTempSteps(steps); setShowStepsModal(true); }} className="bg-white dark:bg-charcoal-800 p-5 rounded-3xl border border-gray-100 dark:border-charcoal-700 shadow-sm relative overflow-hidden group cursor-pointer">
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-neon-blue/10 rounded-full group-hover:scale-125 transition-transform"></div>
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-2">
                          <Activity className="text-neon-blue" size={24} />
                          <Edit2 size={12} className="text-gray-400" />
                      </div>
                      <span className="text-3xl font-black block mb-1">{steps.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t.steps}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 bg-neon-blue transition-all duration-1000" style={{ width: `${Math.min((steps / 10000) * 100, 100)}%` }}></div>
              </div>

              <div onClick={() => { setTempWater(waterIntake); setShowWaterModal(true); }} className="bg-gradient-to-br from-blue-500 to-cyan-400 p-5 rounded-3xl shadow-lg text-white relative overflow-hidden cursor-pointer">
                   <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <Droplets size={24}/>
                            <div className="flex gap-1">
                                <button onClick={(e) => { e.stopPropagation(); updateWater(-250); }} className="bg-white/20 p-1 rounded-lg hover:bg-white/30 transition-colors"><Minus size={16}/></button>
                                <button onClick={(e) => { e.stopPropagation(); updateWater(250); }} className="bg-white/20 p-1 rounded-lg hover:bg-white/30 transition-colors"><Plus size={16}/></button>
                            </div>
                        </div>
                        <div>
                            <span className="text-3xl font-black block mb-1">{waterIntake}</span>
                            <span className="text-xs opacity-80 font-bold uppercase tracking-wider">/ {dailyWaterGoal} ML</span>
                        </div>
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/10 animate-wave" style={{ clipPath: 'polygon(0% 100%, 100% 100%, 100% 60%, 75% 75%, 50% 60%, 25% 75%, 0% 60%)', backgroundSize: '100% 100%' }}></div>
              </div>
          </div>
      </div>

      {/* Smart Next Workout Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-charcoal-800 to-charcoal-900 bg-white border border-gray-200 dark:border-gray-700 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cta-orange/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold mb-1 text-gray-800 dark:text-white flex items-center gap-2">
                        {t.nextWorkout} 
                        {nextWorkout?.isSuggested && <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-300">建議</span>}
                    </h3>
                    {nextWorkout ? (
                        <div className="text-gray-500 dark:text-gray-400 text-sm">
                            {nextWorkout.isSuggested ? t.noPlan : ''} <span className="text-white font-bold">{nextWorkout.title}</span> • {nextWorkout.duration} mins
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.noPlan}</p>
                    )}
                </div>
                <button 
                    onClick={onStartWorkout}
                    className={`self-start text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 ${nextWorkout?.isSuggested ? 'bg-neon-blue hover:bg-cyan-400 text-charcoal-900' : 'bg-cta-orange hover:bg-cta-hover'}`}
                >
                    {nextWorkout?.isSuggested ? '開始建議訓練' : t.startWorkout} <Play size={18} fill="currentColor"/>
                </button>
            </div>
        </div>
        
        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-3xl border border-gray-100 dark:border-charcoal-700 shadow-sm flex items-center justify-between px-8">
            <div className="text-center"><span className="block text-xl font-bold">{userProfile.weight} <span className="text-xs text-gray-500">kg</span></span></div>
            <div className="h-8 w-px bg-gray-200 dark:bg-charcoal-700"></div>
            <div className="text-center"><span className="block text-xl font-bold">{userProfile.height} <span className="text-xs text-gray-500">cm</span></span></div>
            <div className="h-8 w-px bg-gray-200 dark:bg-charcoal-700"></div>
            <div className="text-center"><span className={`block text-xl font-bold ${Number(bmi) > 24 ? 'text-orange-400' : 'text-neon-green'}`}>{bmi} <span className="text-xs text-gray-500">BMI</span></span></div>
        </div>
      </div>

      {showStepsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-charcoal-800 w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 dark:border-charcoal-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold flex items-center gap-2"><Activity className="text-neon-blue"/> {t.editSteps}</h3>
                      <button onClick={() => setShowStepsModal(false)}><X size={20} className="text-gray-400"/></button>
                  </div>
                  <div className="space-y-6">
                      <div className="flex items-center justify-center gap-4">
                          <button onClick={() => setTempSteps(Math.max(0, tempSteps - 100))} className="p-3 bg-gray-100 dark:bg-charcoal-900 rounded-full"><Minus size={20}/></button>
                          <input type="number" inputMode="numeric" value={tempSteps} onChange={(e) => setTempSteps(parseInt(e.target.value) || 0)} className="w-28 text-center text-3xl font-bold bg-transparent outline-none border-b-2 border-gray-200 dark:border-charcoal-600 focus:border-neon-blue" />
                          <button onClick={() => setTempSteps(tempSteps + 100)} className="p-3 bg-gray-100 dark:bg-charcoal-900 rounded-full"><Plus size={20}/></button>
                      </div>
                      <div className="flex justify-center gap-2">
                          <button onClick={() => setTempSteps(tempSteps + 500)} className="px-3 py-1 bg-gray-100 dark:bg-charcoal-900 rounded-lg text-xs font-bold text-gray-500 hover:text-neon-blue">+500</button>
                          <button onClick={() => setTempSteps(tempSteps + 1000)} className="px-3 py-1 bg-gray-100 dark:bg-charcoal-900 rounded-lg text-xs font-bold text-gray-500 hover:text-neon-blue">+1000</button>
                      </div>
                      <button onClick={handleSaveSteps} className="w-full bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Save size={18}/> {t.save}</button>
                  </div>
              </div>
          </div>
      )}

      {showWaterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-charcoal-800 w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 dark:border-charcoal-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold flex items-center gap-2"><Droplets className="text-cyan-400"/> {t.editWater}</h3>
                      <button onClick={() => setShowWaterModal(false)}><X size={20} className="text-gray-400"/></button>
                  </div>
                  <div className="space-y-6">
                      <div className="flex items-center justify-center gap-4">
                          <button onClick={() => setTempWater(Math.max(0, tempWater - 250))} className="p-3 bg-gray-100 dark:bg-charcoal-900 rounded-full"><Minus size={20}/></button>
                          <div className="relative">
                              <input type="number" inputMode="numeric" value={tempWater} onChange={(e) => setTempWater(parseInt(e.target.value) || 0)} className="w-28 text-center text-3xl font-bold bg-transparent outline-none border-b-2 border-gray-200 dark:border-charcoal-600 focus:border-cyan-400" />
                              <span className="absolute -right-6 bottom-2 text-xs text-gray-500">ml</span>
                          </div>
                          <button onClick={() => setTempWater(tempWater + 250)} className="p-3 bg-gray-100 dark:bg-charcoal-900 rounded-full"><Plus size={20}/></button>
                      </div>
                      <div className="flex justify-center gap-2">
                          <button onClick={() => setTempWater(Math.max(0, tempWater - 250))} className="px-3 py-1 bg-gray-100 dark:bg-charcoal-900 rounded-lg text-xs font-bold text-gray-500 hover:text-red-400">-250</button>
                          <button onClick={() => setTempWater(tempWater + 250)} className="px-3 py-1 bg-gray-100 dark:bg-charcoal-900 rounded-lg text-xs font-bold text-gray-500 hover:text-cyan-400">+250</button>
                          <button onClick={() => setTempWater(tempWater + 500)} className="px-3 py-1 bg-gray-100 dark:bg-charcoal-900 rounded-lg text-xs font-bold text-gray-500 hover:text-cyan-400">+500</button>
                      </div>
                      <button onClick={handleSaveWater} className="w-full bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Save size={18}/> {t.save}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
