
import React, { useState, useMemo } from 'react';
import { WorkoutRecord } from '../types';
import { Calendar, CheckCircle, Clock, Flame, Filter, Inbox, ChevronDown, ChevronUp, Dumbbell, Trash2, Repeat } from 'lucide-react';

interface HistoryProps {
    logs: WorkoutRecord[];
    onDeleteRecord?: (id: string) => void;
    onRepeatWorkout?: (record: WorkoutRecord) => void; // New Prop
}

const History: React.FC<HistoryProps> = ({ logs, onDeleteRecord, onRepeatWorkout }) => {
  const [filterDate, setFilterDate] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    if (!filterDate) return logs;
    return logs.filter(record => record.date === filterDate);
  }, [filterDate, logs]);

  const toggleExpand = (id: string) => {
      setExpandedId(prev => prev === id ? null : id);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteId(id);
  };

  const handleRepeatClick = (e: React.MouseEvent, record: WorkoutRecord) => {
      e.stopPropagation();
      if (onRepeatWorkout) {
          onRepeatWorkout(record);
      }
  };

  const confirmDelete = () => {
      if (deleteId && onDeleteRecord) {
          onDeleteRecord(deleteId);
          setDeleteId(null);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="text-neon-blue" />
            近期活動
          </h2>
          
          <div className="flex items-center gap-2 bg-white dark:bg-charcoal-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <Filter size={16} className="text-gray-500" />
              <input 
                  type="date" 
                  className="bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
              />
              {filterDate && (
                  <button 
                    onClick={() => setFilterDate('')}
                    className="text-xs text-red-400 hover:text-red-500 font-medium px-2"
                  >
                      清除
                  </button>
              )}
          </div>
      </div>

      <div className="space-y-4 pb-20">
        {filteredHistory.length > 0 ? (
            filteredHistory.map((record) => (
            <div key={record.id} className="bg-white dark:bg-charcoal-800 rounded-xl border-l-4 border-neon-green shadow-sm overflow-hidden hover:bg-gray-50 dark:hover:bg-charcoal-750 transition-colors">
                
                {/* Header Card */}
                <div 
                    onClick={() => toggleExpand(record.id)}
                    className="p-4 flex items-center justify-between cursor-pointer"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-gray-800 dark:text-white line-clamp-1">{record.type}</span>
                            {record.completed && <CheckCircle size={16} className="text-neon-green shrink-0" />}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{record.date}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-right shrink-0">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300 text-sm">
                                <Clock size={14} />
                                <span>{record.duration} 分</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300 text-sm">
                                <Flame size={14} />
                                <span>{record.calories} 卡</span>
                            </div>
                        </div>
                        {expandedId === record.id ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                    </div>
                </div>

                {/* Expanded Details */}
                {expandedId === record.id && (
                    <div className="bg-gray-50 dark:bg-charcoal-900 border-t border-gray-100 dark:border-charcoal-700 p-4 animate-fade-in relative">
                        {record.details && record.details.length > 0 ? (
                            <div className="space-y-4">
                                {record.details.map((exercise, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Dumbbell size={14} className="text-neon-blue" />
                                            {exercise.exerciseName}
                                        </h4>
                                        <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 font-mono pl-6">
                                            {exercise.sets.map((set, sIdx) => (
                                                <div key={sIdx} className="bg-white dark:bg-charcoal-800 p-2 rounded border border-gray-200 dark:border-charcoal-700 text-center">
                                                    <div className="text-gray-400 text-[10px]">SET {set.setNumber}</div>
                                                    <div className="font-bold text-gray-800 dark:text-white">
                                                        {set.weight}kg <span className="text-gray-400">x</span> {set.reps}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-2">無詳細訓練數據</p>
                        )}
                        
                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-charcoal-700">
                            {onDeleteRecord && (
                                <button 
                                    onClick={(e) => handleDeleteClick(e, record.id)}
                                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Trash2 size={14} /> 刪除
                                </button>
                            )}
                            
                            {onRepeatWorkout && (
                                <button 
                                    onClick={(e) => handleRepeatClick(e, record)}
                                    className="flex items-center gap-1 text-xs font-bold text-white bg-cta-orange hover:bg-cta-hover px-4 py-2 rounded-lg transition-colors shadow-md shadow-orange-500/20 active:scale-95"
                                >
                                    <Repeat size={14} /> 再次進行此訓練
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            ))
        ) : (
            <div className="text-center py-16 text-gray-500 bg-gray-50 dark:bg-charcoal-800/50 rounded-xl border-dashed border border-gray-200 dark:border-charcoal-700 flex flex-col items-center justify-center">
                <Inbox size={48} className="mb-4 opacity-20" />
                <p>找不到符合的記錄</p>
                {filterDate ? (
                    <button 
                        onClick={() => setFilterDate('')}
                        className="mt-2 text-neon-blue underline text-sm"
                    >
                        顯示所有記錄
                    </button>
                ) : (
                    <p className="text-sm text-gray-400 mt-2">快去開始第一次訓練吧！</p>
                )}
            </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-charcoal-800 w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 dark:border-charcoal-700 p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3 text-red-500">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">確認刪除？</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            您確定要刪除這筆訓練記錄嗎？<br/>此動作無法復原。
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setDeleteId(null)}
                            className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 dark:bg-charcoal-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-600 transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={confirmDelete}
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

export default History;
