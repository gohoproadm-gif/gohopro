import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plus, Sparkles, Loader2, X, Check, Utensils, Flame, ChevronLeft, ChevronRight, Calendar, Pencil, Trash2, Save, RefreshCw } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { NutritionLog } from '../types';

interface NutritionProps {
  logs: NutritionLog[];
  setLogs: React.Dispatch<React.SetStateAction<NutritionLog[]>>;
}

const Nutrition: React.FC<NutritionProps> = ({ logs, setLogs }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Form State
  const [formStep, setFormStep] = useState<'INPUT' | 'RESULT'>('INPUT');
  const [editId, setEditId] = useState<string | null>(null);
  
  const [foodInput, setFoodInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Data for the form (used for both AI result review and Editing)
  const [formData, setFormData] = useState({
      item: '',
      calories: 0,
      p: 0,
      c: 0,
      f: 0
  });

  // Ref for auto-scrolling
  const resultRef = useRef<HTMLDivElement>(null);

  // Filter logs by selected date
  const displayedLogs = useMemo(() => {
    return logs.filter(log => log.date === selectedDate);
  }, [logs, selectedDate]);

  // Dynamic Calculation
  const totals = useMemo(() => {
    return displayedLogs.reduce((acc, curr) => ({
        calories: acc.calories + curr.calories,
        p: acc.p + curr.macros.p,
        c: acc.c + curr.macros.c,
        f: acc.f + curr.macros.f
    }), { calories: 0, p: 0, c: 0, f: 0 });
  }, [displayedLogs]);

  const targetCalories = 2500;
  
  const macroData = [
    { name: '蛋白質', value: totals.p, fill: '#a3e635' }, // neon-green
    { name: '碳水化合物', value: totals.c, fill: '#22d3ee' }, // neon-blue
    { name: '脂肪', value: totals.f, fill: '#c084fc' }, // neon-purple
  ];

  // Auto-scroll to result when it appears
  useEffect(() => {
    if (formStep === 'RESULT' && resultRef.current) {
        setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    }
  }, [formStep]);

  // AI Analysis Function
  const handleAnalyzeFood = async () => {
    if (!foodInput.trim()) return;
    if (!process.env.API_KEY) {
        alert("API Key is missing!");
        return;
    }

    setIsAnalyzing(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Estimate the nutritional values for: "${foodInput}". 
                       If the input is vague, make a reasonable standard estimation.
                       Return strictly JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        item_name: { type: Type.STRING, description: "A short, clean name for the food (in Traditional Chinese if input is Chinese)" },
                        calories: { type: Type.INTEGER, description: "Total calories (Energy)" },
                        protein: { type: Type.INTEGER, description: "Protein in grams" },
                        carbs: { type: Type.INTEGER, description: "Carbohydrates in grams" },
                        fat: { type: Type.INTEGER, description: "Fat in grams" }
                    },
                    required: ["item_name", "calories", "protein", "carbs", "fat"]
                }
            }
        });

        const result = JSON.parse(response.text || "{}");
        
        if (result) {
            setFormData({
                item: result.item_name,
                calories: result.calories,
                p: result.protein,
                c: result.carbs,
                f: result.fat
            });
            setFormStep('RESULT');
        }
    } catch (error) {
        console.error("Analysis failed", error);
        alert("AI 分析失敗，請稍後再試或手動輸入。");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleAnalyzeFood();
    }
  };

  const handleEditClick = (log: NutritionLog) => {
      setEditId(log.id);
      setFormData({
          item: log.item,
          calories: log.calories,
          p: log.macros.p,
          c: log.macros.c,
          f: log.macros.f
      });
      setFormStep('RESULT'); // Skip input, go straight to form
      setShowAddModal(true);
  };

  const handleDeleteClick = (id: string) => {
      if (window.confirm('確定要刪除這筆記錄嗎？')) {
          setLogs(prev => prev.filter(l => l.id !== id));
      }
  };

  const handleSave = () => {
    if (!formData.item) return;

    if (editId) {
        // Edit existing
        setLogs(prev => prev.map(l => l.id === editId ? {
            ...l,
            item: formData.item,
            calories: Number(formData.calories),
            macros: {
                p: Number(formData.p),
                c: Number(formData.c),
                f: Number(formData.f)
            }
        } : l));
    } else {
        // Create new
        const newLog: NutritionLog = {
            id: Date.now().toString(),
            date: selectedDate, // Use currently selected date
            time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }),
            item: formData.item,
            calories: Number(formData.calories),
            macros: {
                p: Number(formData.p),
                c: Number(formData.c),
                f: Number(formData.f)
            }
        };
        setLogs([newLog, ...logs]);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
      setShowAddModal(false);
      setFoodInput('');
      setEditId(null);
      setFormStep('INPUT');
      setFormData({ item: '', calories: 0, p: 0, c: 0, f: 0 });
  };

  // Date Navigation Helpers
  const handlePrevDay = () => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 pb-24 relative">
      {/* Header and Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold">營養追蹤</h2>
            <p className="text-sm text-gray-500">
                目標: {totals.calories} / {targetCalories} kcal 
                <span className="ml-2 text-neon-blue">({targetCalories - totals.calories} 剩餘)</span>
            </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-charcoal-800 p-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 self-start md:self-auto">
            <button onClick={handlePrevDay} className="p-2 hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded-full text-gray-500"><ChevronLeft size={20} /></button>
            <div className="relative">
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-sm font-bold outline-none text-center w-32 cursor-pointer"
                />
            </div>
            <button onClick={handleNextDay} className="p-2 hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded-full text-gray-500"><ChevronRight size={20} /></button>
        </div>

        <button 
            onClick={() => {
                setEditId(null);
                setFormStep('INPUT');
                setFormData({ item: '', calories: 0, p: 0, c: 0, f: 0 });
                setShowAddModal(true);
            }}
            className="bg-cta-orange hover:bg-cta-hover text-white p-3 rounded-full shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center gap-2 pr-5 self-end md:self-auto"
        >
            <Plus size={24} />
            <span className="font-bold">新增飲食</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center gap-8 animate-fade-in">
         <div className="relative w-40 h-40 flex-shrink-0">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={macroData}
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {macroData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-2xl font-bold text-gray-800 dark:text-white">{totals.calories}</span>
                 <span className="text-xs text-gray-500">kcal</span>
             </div>
         </div>

         <div className="flex-1 w-full grid grid-cols-3 gap-3">
             {macroData.map((macro) => (
                 <div key={macro.name} className="flex flex-col items-center p-3 bg-gray-50 dark:bg-charcoal-900 rounded-xl border border-gray-100 dark:border-charcoal-700">
                     <span className="text-xs text-gray-500 mb-1">{macro.name}</span>
                     <span className="font-bold text-lg" style={{ color: macro.fill }}>{macro.value}g</span>
                 </div>
             ))}
         </div>
      </div>

      {/* Food Log List */}
      <div className="animate-fade-in delay-100">
          <h3 className="font-bold text-gray-500 dark:text-gray-400 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
              <Utensils size={14} /> {selectedDate} 飲食記錄
          </h3>
          <div className="space-y-3">
              {displayedLogs.length > 0 ? (
                  displayedLogs.map((log) => (
                    <div key={log.id} className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center hover:border-neon-blue transition-colors group">
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-charcoal-900 px-1.5 py-0.5 rounded shrink-0">{log.time}</span>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 truncate">{log.item}</h4>
                            </div>
                            <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-neon-green"></div> P: {log.macros.p}</span>
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-neon-blue"></div> C: {log.macros.c}</span>
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-neon-purple"></div> F: {log.macros.f}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className="text-lg font-bold text-gray-800 dark:text-white">{log.calories}</span>
                                <span className="text-xs text-gray-500 block">kcal</span>
                            </div>
                            {/* Actions */}
                            <div className="flex gap-1 ml-2 pl-2 border-l border-gray-100 dark:border-gray-700">
                                <button 
                                    onClick={() => handleEditClick(log)}
                                    className="p-2 text-gray-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-colors"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(log.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
              ) : (
                  <div className="text-center py-10 text-gray-400 bg-gray-50 dark:bg-charcoal-800/50 rounded-xl border-dashed border border-gray-200 dark:border-gray-700">
                      <p>本日無記錄，按「新增飲食」開始！</p>
                  </div>
              )}
          </div>
      </div>

      {/* Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-charcoal-800 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90dvh]">
                  <div className="p-4 border-b border-gray-200 dark:border-charcoal-700 flex justify-between items-center bg-gray-50 dark:bg-charcoal-900 shrink-0">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                          {editId ? <Pencil className="text-neon-blue" size={20} /> : <Sparkles className="text-cta-orange" size={20} />}
                          {editId ? '編輯記錄' : (formStep === 'RESULT' ? '確認內容' : 'AI 飲食分析')}
                      </h3>
                      <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-800 dark:hover:text-white p-1">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="p-4 md:p-6 overflow-y-auto overscroll-contain flex-1">
                      
                      {/* Step 1: AI Input (Only if not editing existing and not in result view) */}
                      {!editId && formStep === 'INPUT' && (
                          <div className="space-y-3 mb-6 animate-fade-in">
                              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                                 <label className="font-medium">你吃了什麼？</label>
                                 <span className="text-xs bg-neon-blue/10 text-neon-blue px-2 py-0.5 rounded">將加入至: {selectedDate}</span>
                              </div>
                              <div className="relative">
                                  <textarea 
                                      value={foodInput}
                                      onChange={(e) => setFoodInput(e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      placeholder="例如：一碗牛肉麵、兩顆水煮蛋... (按 Enter 開始分析)"
                                      className="w-full h-32 p-4 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue resize-none text-base"
                                      autoFocus
                                  />
                                  {isAnalyzing && (
                                      <div className="absolute inset-0 bg-white/50 dark:bg-charcoal-900/50 flex items-center justify-center rounded-xl backdrop-blur-sm z-10">
                                          <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin text-neon-blue" size={32} />
                                            <span className="text-xs font-bold text-charcoal-900 dark:text-white">AI 分析中...</span>
                                          </div>
                                      </div>
                                  )}
                              </div>
                              
                              <button 
                                  onClick={handleAnalyzeFood}
                                  disabled={isAnalyzing || !foodInput.trim()}
                                  className="w-full bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                              >
                                    <Sparkles size={18} />
                                    開始分析 (Enter)
                              </button>
                          </div>
                      )}

                      {/* Step 2: Edit Form (For Result Review OR Direct Edit) */}
                      {formStep === 'RESULT' && (
                          <div ref={resultRef} className="animate-fade-in space-y-5">
                              {!editId && (
                                <button 
                                  onClick={() => setFormStep('INPUT')}
                                  className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center gap-1 mb-2"
                                >
                                    <ChevronLeft size={14} /> 返回輸入
                                </button>
                              )}

                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">食物名稱</label>
                                  <input 
                                      type="text" 
                                      value={formData.item}
                                      onChange={(e) => setFormData({...formData, item: e.target.value})}
                                      className="w-full p-3 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue font-bold text-lg"
                                  />
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">熱量 (kcal)</label>
                                  <div className="relative">
                                      <Flame className="absolute left-3 top-1/2 -translate-y-1/2 text-cta-orange" size={20} />
                                      <input 
                                          type="number" 
                                          value={formData.calories}
                                          onChange={(e) => setFormData({...formData, calories: parseInt(e.target.value) || 0})}
                                          className="w-full p-3 pl-10 rounded-xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-cta-orange font-bold text-xl text-cta-orange"
                                      />
                                  </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                      <label className="block text-[10px] text-center font-bold text-gray-500">蛋白質 (g)</label>
                                      <input 
                                          type="number" 
                                          value={formData.p}
                                          onChange={(e) => setFormData({...formData, p: parseInt(e.target.value) || 0})}
                                          className="w-full p-2 text-center rounded-lg bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-green font-bold text-neon-green"
                                      />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="block text-[10px] text-center font-bold text-gray-500">碳水 (g)</label>
                                      <input 
                                          type="number" 
                                          value={formData.c}
                                          onChange={(e) => setFormData({...formData, c: parseInt(e.target.value) || 0})}
                                          className="w-full p-2 text-center rounded-lg bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-blue font-bold text-neon-blue"
                                      />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="block text-[10px] text-center font-bold text-gray-500">脂肪 (g)</label>
                                      <input 
                                          type="number" 
                                          value={formData.f}
                                          onChange={(e) => setFormData({...formData, f: parseInt(e.target.value) || 0})}
                                          className="w-full p-2 text-center rounded-lg bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 outline-none focus:border-neon-purple font-bold text-neon-purple"
                                      />
                                  </div>
                              </div>

                              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-charcoal-700 mt-4">
                                  <button 
                                      onClick={handleSave}
                                      className="bg-cta-orange hover:bg-cta-hover text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                                  >
                                      <Save size={18} />
                                      {editId ? '儲存變更' : '加入記錄'}
                                  </button>
                              </div>
                              {/* Bottom spacing for scroll */}
                              <div className="h-10"></div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Nutrition;