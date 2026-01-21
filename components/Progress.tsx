
import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WorkoutRecord } from '../types';
import { TrendingUp, BicepsFlexed, Inbox } from 'lucide-react';

interface ProgressProps {
    historyLogs: WorkoutRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-charcoal-900 text-white p-2 rounded text-xs shadow-lg border border-gray-700">
        <p className="label font-bold mb-1 opacity-70">{label}</p>
        <p className="text-neon-green font-bold text-sm">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const Progress: React.FC<ProgressProps> = ({ historyLogs }) => {

  // 1. Calculate Training Volume per Day (Date vs Volume)
  // Volume = Sets * Reps * Weight
  const volumeData = useMemo(() => {
      const data: Record<string, number> = {};
      
      // Process logs in reverse to chronological order roughly, or sort them
      const sortedLogs = [...historyLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedLogs.forEach(log => {
          let dailyVolume = 0;
          if (log.details) {
              log.details.forEach(ex => {
                  ex.sets.forEach(s => {
                      if (s.completed && s.weight > 0 && s.reps > 0) {
                          dailyVolume += (s.weight * s.reps);
                      }
                  });
              });
          }
          // Format date to MM/DD
          const date = new Date(log.date);
          const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
          
          if (data[dateKey]) {
              data[dateKey] += dailyVolume;
          } else {
              data[dateKey] = dailyVolume;
          }
      });

      // Convert to array and take last 7-10 entries to avoid overcrowding
      return Object.entries(data).map(([date, vol]) => ({ date, volume: vol })).slice(-7);
  }, [historyLogs]);

  // 2. Calculate Max Weight per Exercise (Top 5 popular exercises)
  const strengthData = useMemo(() => {
      const maxWeights: Record<string, number> = {};
      
      historyLogs.forEach(log => {
          if (log.details) {
              log.details.forEach(ex => {
                  // Normalize name (remove variant details if in brackets for cleaner grouping, optional)
                  const name = ex.exerciseName.split('(')[0].trim(); 
                  
                  ex.sets.forEach(s => {
                      if (s.completed && s.weight > 0) {
                          if (!maxWeights[name] || s.weight > maxWeights[name]) {
                              maxWeights[name] = s.weight;
                          }
                      }
                  });
              });
          }
      });

      // Sort by weight desc and take top 5
      return Object.entries(maxWeights)
          .map(([name, weight]) => ({ exercise: name, weight }))
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 5);
  }, [historyLogs]);

  if (historyLogs.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 text-gray-400">
              <Inbox size={48} className="opacity-20" />
              <p>尚未有足夠的訓練數據來分析進度。</p>
              <p className="text-xs">請先完成幾次訓練吧！</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 pb-10">
      <h2 className="text-2xl font-bold">進度分析</h2>

      {/* Volume Chart (Replaced Weight Chart) */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp size={20} className="text-neon-green" />
                近期訓練容量 (Volume)
            </h3>
            <span className="text-xs text-gray-500 font-mono">Total kg</span>
        </div>
        <div className="h-64 w-full">
          {volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    tick={{fill: '#9ca3af', fontSize: 10}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a3e635', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    name="容量"
                    stroke="#a3e635" 
                    fillOpacity={1} 
                    fill="url(#colorVol)" 
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
          ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">資料不足</div>
          )}
        </div>
      </div>

      {/* Strength Chart */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <BicepsFlexed size={20} className="text-neon-blue" />
                最大重量紀錄 (Best PR)
            </h3>
        </div>
        <div className="h-64 w-full">
          {strengthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strengthData} layout="vertical" margin={{ left: 0, right: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="exercise" 
                    type="category" 
                    width={80} 
                    tick={{fill: '#9ca3af', fontSize: 11, fontWeight: 500}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                  <Bar dataKey="weight" name="最大重量 (kg)" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
          ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">資料不足</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Progress;
