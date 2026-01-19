
import React, { useMemo, useState, useEffect } from 'react';
import { Activity, Flame, Clock, Trophy, User, ArrowRight, Target, Droplets, Plus, Minus } from 'lucide-react';
import { MOTIVATIONAL_QUOTES, DEFAULT_PLANS } from '../constants';
import { NutritionLog, UserProfile, ScheduledWorkout, DailyPlan } from '../types';

interface DashboardProps {
  onStartWorkout: () => void;
  nutritionLogs: NutritionLog[];
  userProfile: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartWorkout, nutritionLogs, userProfile }) => {
  const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

  // Calculate Nutrition Totals for TODAY
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLogs = nutritionLogs.filter(log => log.date === todayStr);
  
  // Logic to find Next Workout
  const [nextWorkout, setNextWorkout] = useState<{title: string, duration: number} | null>(null);

  // Water Tracker State (Local Persistence)
  const [waterIntake, setWaterIntake] = useState(0);
  const dailyWaterGoal = 2500; // ml

  useEffect(() => {
      const savedWater = localStorage.getItem(`water_${todayStr}`);
      if (savedWater) {
          setWaterIntake(parseInt(savedWater));
      } else {
          setWaterIntake(0);
      }
  }, [todayStr]);

  const updateWater = (amount: number) => {
      const newVal = Math.max(0, waterIntake + amount);
      setWaterIntake(newVal);
      localStorage.setItem(`water_${todayStr}`, newVal.toString());
  };

  useEffect(() => {
    const savedSchedule = localStorage.getItem('fitlife_schedule');
    if (savedSchedule) {
        const schedule: ScheduledWorkout[] = JSON.parse(savedSchedule);
        const todaysWorkout = schedule.find(s => s.date === todayStr && !s.completed);
        
        if (todaysWorkout) {
             const plan = DEFAULT_PLANS.find(p => p.id === todaysWorkout.planId);
             if (plan) {
                 setNextWorkout({ title: plan.title, duration: plan.duration });
             }
        }
    }
  }, [todayStr]);

  const totalNutrition = useMemo(() => {
    return todaysLogs.reduce((acc, curr) => ({
        calories: acc.calories + curr.calories,
        p: acc.p + curr.macros.p,
        c: acc.c + curr.macros.c,
        f: acc.f + curr.macros.f
    }), { calories: 0, p: 0, c: 0, f: 0 });
  }, [todaysLogs]);

  // Calculate Targets based on Profile
  const calculateTargets = () => {
    if (!userProfile) return { calories: 2000, p: 150, c: 200, f: 60 };

    let bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age;
    bmr += userProfile.gender === 'male' ? 5 : -161;
    
    let multiplier = 1.2; // Sedentary
    if (userProfile.activityLevel === 'light') multiplier = 1.375;
    if (userProfile.activityLevel === 'moderate') multiplier = 1.55;
    if (userProfile.activityLevel === 'active') multiplier = 1.725;
    if (userProfile.activityLevel === 'very_active') multiplier = 1.9;

    let tdee = Math.round(bmr * multiplier);

    if (userProfile.goal === 'lose_weight') tdee -= 500;
    if (userProfile.goal === 'gain_muscle') tdee += 300;

    return {
        calories: tdee,
        p: Math.round((tdee * 0.3) / 4), // 30% Protein
        c: Math.round((tdee * 0.45) / 4), // 45% Carbs
        f: Math.round((tdee * 0.25) / 9)  // 25% Fat
    };
  };

  const targets = calculateTargets();
  const remaining = {
      calories: targets.calories - totalNutrition.calories,
      p: targets.p - totalNutrition.p,
      c: targets.c - totalNutrition.c,
      f: targets.f - totalNutrition.f
  };

  const bmi = userProfile 
    ? (userProfile.weight / ((userProfile.height / 100) * (userProfile.height / 100))).toFixed(1) 
    : '0';

  const ProgressRing = ({ radius, stroke, progress, color }: { radius: number, stroke: number, progress: number, color: string }) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-gray-200 dark:text-gray-700 opacity-20"
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
             <span className="text-3xl font-bold text-gray-800 dark:text-white">{Math.round(progress)}%</span>
             <span className="text-xs text-gray-500 dark:text-gray-400">今日進度</span>
        </div>
      </div>
    );
  };

  const percentage = Math.min((totalNutrition.calories / targets.calories) * 100, 100);
  
  if (!userProfile) return null;

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-3xl font-bold mb-1">早安，{userProfile.name}！</h2>
        <p className="text-gray-500 dark:text-gray-400 italic">"{quote}"</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Main Activity Card */}
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-6">
            <ProgressRing radius={90} stroke={12} progress={percentage} color="#a3e635" />
            
            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="bg-gray-50 dark:bg-charcoal-900 p-3 rounded-xl flex flex-col items-center">
                <Flame className="text-cta-orange mb-1" size={20} />
                <span className="text-lg font-bold">{totalNutrition.calories}</span>
                <span className="text-[10px] text-gray-500">攝取卡路里</span>
              </div>
              <div className="bg-gray-50 dark:bg-charcoal-900 p-3 rounded-xl flex flex-col items-center">
                <Activity className="text-neon-blue mb-1" size={20} />
                <span className="text-lg font-bold">5,432</span>
                <span className="text-[10px] text-gray-500">今日步數</span>
              </div>
               <div className="bg-gray-50 dark:bg-charcoal-900 p-3 rounded-xl flex flex-col items-center">
                 <Trophy className="text-yellow-400 mb-1" size={20} />
                 <span className="text-lg font-bold">7</span>
                 <span className="text-[10px] text-gray-500">連續天數</span>
              </div>
            </div>
          </div>

          {/* Right Column Stack */}
          <div className="flex flex-col gap-6">
              
              {/* Body Info */}
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                          <User className="text-neon-blue" size={20} /> 身體數據
                      </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                          <span className="block text-xl font-bold">{userProfile.height}</span>
                          <span className="text-xs text-gray-500">cm</span>
                      </div>
                      <div className="text-center border-x border-gray-200 dark:border-gray-700">
                          <span className="block text-xl font-bold">{userProfile.weight}</span>
                          <span className="text-xs text-gray-500">kg</span>
                      </div>
                      <div className="text-center">
                          <span className={`block text-xl font-bold ${Number(bmi) > 24 ? 'text-orange-400' : 'text-neon-green'}`}>{bmi}</span>
                          <span className="text-xs text-gray-500">BMI</span>
                      </div>
                  </div>
              </div>

              {/* Water Tracker Widget */}
              <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                   <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Droplets size={20}/> 飲水追蹤</h3>
                            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">{Math.round((waterIntake/dailyWaterGoal)*100)}%</span>
                        </div>
                        
                        <div className="flex items-end gap-1 mb-4">
                            <span className="text-4xl font-bold">{waterIntake}</span>
                            <span className="text-sm opacity-80 mb-1">/ {dailyWaterGoal} ml</span>
                        </div>

                        <div className="flex gap-3">
                             <button onClick={() => updateWater(250)} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg backdrop-blur-sm transition-colors flex items-center gap-1 text-sm font-bold">
                                 <Plus size={14} /> 250ml
                             </button>
                             <button onClick={() => updateWater(-250)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg backdrop-blur-sm transition-colors">
                                 <Minus size={14} />
                             </button>
                        </div>
                   </div>
                   {/* Decorative Wave */}
                   <div className="absolute bottom-0 left-0 right-0 h-24 bg-white/10" style={{ clipPath: 'polygon(0% 100%, 100% 100%, 100% 60%, 75% 75%, 50% 60%, 25% 75%, 0% 60%)' }}></div>
              </div>
          </div>
      </div>

      {/* Quick Actions / Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-charcoal-800 to-charcoal-900 dark:from-charcoal-800 dark:to-charcoal-900 bg-white border border-gray-200 dark:border-gray-700 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <h3 className="text-xl font-bold mb-2 z-10 relative">下一個訓練</h3>
            {nextWorkout ? (
                <>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 z-10 relative">{nextWorkout.title} • {nextWorkout.duration} 分鐘</p>
                    <button 
                    onClick={onStartWorkout}
                    className="bg-cta-orange hover:bg-cta-hover text-white px-6 py-2 rounded-full font-semibold transition-all shadow-lg shadow-orange-500/30 z-10 relative active:scale-95"
                    >
                        開始訓練
                    </button>
                </>
            ) : (
                <>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 z-10 relative">今日暫無計畫</p>
                    <button 
                    onClick={onStartWorkout}
                    className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-6 py-2 rounded-full font-semibold transition-all z-10 relative"
                    >
                        安排訓練
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
