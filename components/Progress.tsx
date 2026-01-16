import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WEIGHT_DATA, STRENGTH_DATA } from '../constants';
import { TrendingUp, BicepsFlexed } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-charcoal-900 text-white p-2 rounded text-xs shadow-lg border border-gray-700">
        <p className="label">{`${label} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const Progress: React.FC = () => {
  return (
    <div className="space-y-8 pb-10">
      <h2 className="text-2xl font-bold">進度分析</h2>

      {/* Weight Chart */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp size={20} className="text-neon-green" />
                體重變化 (kg)
            </h3>
            <span className="text-xs text-green-500 font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">-1.5kg 本月</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={WEIGHT_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 12}} 
                dy={10}
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']} 
                hide 
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#a3e635" 
                strokeWidth={3} 
                dot={{r: 4, fill: '#1f2937', stroke: '#a3e635', strokeWidth: 2}}
                activeDot={{r: 6}}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strength Chart */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <BicepsFlexed size={20} className="text-neon-blue" />
                力量數據 (1RM Max)
            </h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={STRENGTH_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" opacity={0.3} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="exercise" 
                type="category" 
                width={60} 
                tick={{fill: '#9ca3af', fontSize: 12}} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
              <Bar dataKey="weight" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Progress;