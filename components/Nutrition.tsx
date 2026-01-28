
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plus, Sparkles, Loader2, X, Check, Utensils, Flame, ChevronLeft, ChevronRight, Calendar, Pencil, Trash2, Save, RefreshCw, AlertTriangle, Settings, HeartPulse, Lightbulb, Clock } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { NutritionLog, UserProfile } from '../types';
import { apiSaveNutritionLog, apiDeleteNutritionLog } from '../lib/db';

interface NutritionProps {
  logs: NutritionLog[];
  setLogs: React.Dispatch<React.SetStateAction<NutritionLog[]>>;
  userProfile: UserProfile;
  onGoToSettings: () => void;
}

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

const Nutrition: React.FC<NutritionProps> = ({ logs, setLogs, userProfile, onGoToSettings }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Delete Confirmation State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null, item: string}>({
      isOpen: false,
      id: null,
      item: ''
  });

  // Form State
  const [formStep, setFormStep] = useState<'INPUT' | 'RESULT'>('INPUT');
  const [editId, setEditId] = useState<string | null>(null);
  
  const [foodInput, setFoodInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string>('');
  
  // Data for the form
  const [formData, setFormData] = useState({
      item: '',
      calories: 0,
      p: 0,
      c: 0,
      f: 0,
      healthTip: ''
  });

  const resultRef = useRef<HTMLDivElement>(null);

  const displayedLogs = useMemo(() => {
    return logs.filter(log => log.date === selectedDate);
  }, [logs, selectedDate]);

  // Extract recent items for Quick Add
  const recentItems = useMemo(() => {
      const items = logs.map(l => l.item);
      return [...new Set(items)].slice(0, 6); // Top 6 unique recent items
  }, [logs]);

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
    { name: '蛋白質', value: totals.p, fill: '#a3e635' }, 
    { name: '碳水化合物', value: totals.c, fill: '#22d3ee' },
    { name: '脂肪', value: totals.f, fill: '#c084fc' }, 
  ];

  useEffect(() => {
    if (formStep === 'RESULT' && resultRef.current) {
        setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    }
  }, [formStep]);

  // Robust API Key Retrieval (Updated for System Keys)
  const getApiKey = () => {
    // 1. Check process.env.API_KEY (Highest Priority)
    if (process.env.API_KEY) return process.env.API_KEY;

    // 2. Check System Key (Admin set)
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

  // Robust DeepSeek/OpenAI Key Retrieval (Updated for System Keys)
  const getDeepSeekConfig = () => {
      // 1. Check System Keys
      let apiKey = localStorage.getItem('GO_SYSTEM_OPENAI_API_KEY');
      let baseUrl = localStorage.getItem('GO_SYSTEM_OPENAI_BASE_URL');
      let model = localStorage.getItem('GO_SYSTEM_OPENAI_MODEL');

      // 2. Fallback to User Profile if System Keys are missing (Backward compatibility)
      if (!apiKey) apiKey = userProfile.openaiApiKey || null;
      if (!baseUrl) baseUrl = userProfile.openaiBaseUrl || null;
      if (!model) model = userProfile.openaiModel || null;

      // 3. Fallback to Env Vars
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

  const callOpenAI = async (input: string) => {
      const { apiKey, baseUrl, model } = getDeepSeekConfig();

      if (!apiKey) throw new Error("API Key 缺失");

      const prompt = `Estimate the nutritional values for: "${input}". 
                       If the input is vague, make a reasonable standard estimation.
                       Return strictly valid JSON with this structure:
                       {
                          "item_name": "A short, clean name for the food (Traditional Chinese)",
                          "calories": 500,
                          "protein": 20,
                          "carbs": 50,
                          "fat": 15,
                          "health_tip": "A very short, one-sentence health tip about this meal (Traditional Chinese)."
                       }`;

      const body: any = {
          model: model,
          messages: [{ role: 'user', content: prompt }]
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
          throw new Error(err.error?.message || "OpenAI/DeepSeek API 請求失敗");
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(cleanJson(content));
  };

  const callGemini = async (input: string) => {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("系統未偵測到 Google API Key。");

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Estimate the nutritional values for: "${input}". 
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
                        fat: { type: Type.INTEGER, description: "Fat in grams" },
                        health_tip: { type: Type.STRING, description: "A very short, one-sentence health tip about this meal (Traditional Chinese)." }
                    },
                    required: ["item_name", "calories", "protein", "carbs", "fat", "health_tip"]
                }
            }
        });
      return JSON.parse(cleanJson(response.text || "{}"));
  };

  const handleAnalyzeFood = async (val?: string) => {
    const inputToUse = val || foodInput;
    if (!inputToUse.trim()) return;
    
    // If val was passed directly (quick add), update state too
    if (val) setFoodInput(val);

    setAiError(null);
    setIsAnalyzing(true);
    setUsedModel('');

    try {
        let result;
        const { apiKey } = getDeepSeekConfig();
        
        // Strategy: Try DeepSeek/OpenAI first if available/selected, then fallback to Gemini
        let used = '';
        if (userProfile.aiProvider === 'openai') {
            try {
                result = await callOpenAI(inputToUse);
                used = 'DeepSeek';
            } catch (openAiErr: any) {
                console.warn("DeepSeek/OpenAI failed, falling back to Gemini:", openAiErr);
                const msg = openAiErr.message || "";
                if (msg.includes("Insufficient Balance")) {
                    setAiError("DeepSeek 餘額不足 (需充值)。正嘗試切換至 Google Gemini...");
                } else {
                    setAiError(`DeepSeek 錯誤: ${msg}。正在嘗試使用 Gemini 備援...`);
                }
                
                // Fallback to Gemini
                result = await callGemini(inputToUse);
                used = 'Gemini (備援)';
            }
        } else {
            result = await callGemini(inputToUse);
            used = 'Gemini';
        }

        if (result) {
            setUsedModel(used);
            setFormData({
                item: result.item_name,
                calories: result.calories,
                p: result.protein,
                c: result.carbs,
                f: result.fat,
                healthTip: result.health_tip || ''
            });
            setFormStep('RESULT');
            setAiError(null); // Clear error if success
        }
    } catch (error: any) {
        console.error("Analysis failed", error);
        
        let msg = error.message || "未知錯誤";
        
        if (msg.includes("400") && msg.includes("User location")) {
             setAiError("AI 分析失敗: Google Gemini 目前不支援此地區。請檢查 VPN 或切換至 DeepSeek。");
        } else if (msg.includes("API Key")) {
             setAiError("AI 分析失敗: 所有 API Key 皆無效，請聯繫管理員。");
        } else {
             setAiError("AI 分析失敗: " + msg);
        }
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      handleAnalyzeFood();
    }
  };

  // ... (Other handlers like handleEditClick, handleDeleteClick, handleSave etc. remain same) ...
  const handleEditClick = (log: NutritionLog) => {
      setEditId(log.id);
      setFormData({
          item: log.item,
          calories: log.calories,
          p: log.macros.p,
          c: log.macros.c,
          f: log.macros.f,
          healthTip: ''
      });
      setFormStep('RESULT'); 
      setShowAddModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, log: NutritionLog) => {
      e.stopPropagation();
      e.preventDefault();
      setDeleteModal({
          isOpen: true,
          id: log.id,
          item: log.item
      });
  };

  const confirmDelete = async () => {
      if (deleteModal.id) {
          setLogs(prev => prev.filter(l => l.id !== deleteModal.id));
          await apiDeleteNutritionLog(deleteModal.id);
      }
      setDeleteModal({ isOpen: false, id: null, item: '' });
  };

  const handleSave = async () => {
    if (!formData.item) return;

    if (editId) {
        // Edit existing
        const updatedLog = {
            id: editId,
            date: selectedDate, 
            time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }),
            item: formData.item,
            calories: Number(formData.calories),
            macros: {
                p: Number(formData.p),
                c: Number(formData.c),
                f: Number(formData.f)
            }
        };
        
        // Optimistic Update
        setLogs(prev => prev.map(l => l.id === editId ? updatedLog : l));
        // Cloud Save
        await apiSaveNutritionLog(updatedLog);

    } else {
        // Create new
        const newLog: NutritionLog = {
            id: Date.now().toString(),
            date: selectedDate, 
            time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }),
            item: formData.item,
            calories: Number(formData.calories),
            macros: {
                p: Number(formData.p),
                c: Number(formData.c),
                f: Number(formData.f)
            }
        };
        
        // Optimistic Update
        setLogs([newLog, ...logs]);
        // Cloud Save
        await apiSaveNutritionLog(newLog);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
      setShowAddModal(false);
      setFoodInput('');
      setEditId(null);
      setFormStep('INPUT');
      setAiError(null);
      setUsedModel('');
      setFormData({ item: '', calories: 0, p: 0, c: 0, f: 0, healthTip: '' });
  };

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
      {/* ... (Header and Summary Card code remains same) ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold">營養追蹤</h2>
            <p className="text-sm text-gray-500">
                目標: {totals.calories} / {targetCalories} kcal 
                <span className="ml-2 text-neon-blue">({targetCalories - totals.calories} 剩餘)</span>
            </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-charcoal-800 p-1 rounded-full shadow-sm border border-gray-200 dark:border-charcoal-700 self-start md:self-auto">
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
                setFormData({ item: '', calories: 0, p: 0, c: 0, f: 0, healthTip: '' });
                setShowAddModal(true);
            }}
            className="bg-cta-orange hover:bg-cta-hover text-white p-3 rounded-full shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center gap-2 pr-5 self-end md:self-auto"
        >
            <Plus size={24} />
            <span className="font-bold">新增飲食</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-charcoal-700 flex flex-col md:flex-row items-center gap-8 animate-fade-in">
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
                            <div className="flex gap-1 ml-2 pl-2 border-l border-gray-100 dark:border-gray-700">
                                <button 
                                    onClick={() => handleEditClick(log)}
                                    className="p-2 text-gray-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-colors cursor-pointer"
                                    type="button"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={(e) => handleDeleteClick(e, log)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                    type="button"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
              ) : (
                  <div className="text-center py-10 text-gray-400 bg-gray-50 dark:bg-charcoal-800/50 rounded-xl border-dashed border border-gray-200 dark:border-charcoal-700">
                      <p>本日無記錄，按「新增飲食」開始！</p>
                  </div>
              )}
          </div>
      </div>

      {/* Delete Confirmation Modal - kept same */}
      {deleteModal.isOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-charcoal-800 w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 dark:border-charcoal-700 p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3 text-red-500">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">刪除飲食記錄？</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            您確定要刪除「<span className="font-bold text-gray-800 dark:text-gray-200">{deleteModal.item}</span>」嗎？
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setDeleteModal({ isOpen: false, id: null, item: '' })}
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

      {/* Add/Edit Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-charcoal-800 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-700 overflow-hidden flex flex-col max-h-[90dvh]">
                  <div className="p-4 border-b border-gray-200 dark:border-charcoal-700 flex justify-between items-center bg-gray-50 dark:bg-charcoal-900 shrink-0">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                          {editId ? <Pencil className="text-neon-blue" size={20} /> : <Sparkles className="text-cta-orange" size={20} />}
                          {editId ? '編輯記錄' : (formStep === 'RESULT' ? '確認內容' : `AI 飲食分析`)}
                      </h3>
                      <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-800 dark:hover:text-white p-1">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="p-4 md:p-6 overflow-y-auto overscroll-contain flex-1">
                      
                      {!editId && formStep === 'INPUT' && (
                          <div className="space-y-3 mb-6 animate-fade-in">
                              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                                 <label className="font-medium">你吃了什麼？</label>
                                 <span className="text-xs bg-neon-blue/10 text-neon-blue px-2 py-0.5 rounded">將加入至: {selectedDate}</span>
                              </div>
                              <div className="relative">
                                  <textarea 
                                      value={foodInput}
                                      onChange={(e) => {
                                        setFoodInput(e.target.value);
                                        if(aiError) setAiError(null);
                                      }}
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

                              {/* Recent Items Quick Add */}
                              {recentItems.length > 0 && (
                                  <div className="flex flex-wrap gap-2 animate-fade-in">
                                      <span className="text-xs font-bold text-gray-400 flex items-center gap-1 w-full mb-1"><Clock size={12}/> 快速加入常用</span>
                                      {recentItems.map((item, idx) => (
                                          <button 
                                            key={idx}
                                            onClick={() => handleAnalyzeFood(item)}
                                            className="text-xs bg-gray-100 dark:bg-charcoal-700 hover:bg-neon-blue/20 hover:text-neon-blue hover:border-neon-blue/50 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full transition-all border border-transparent"
                                          >
                                              {item}
                                          </button>
                                      ))}
                                  </div>
                              )}

                              {aiError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex flex-col items-start gap-2 text-red-500 text-xs animate-fade-in w-full">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={16} className="shrink-0" />
                                        <span className="break-words leading-relaxed font-bold">{aiError}</span>
                                    </div>
                                    {aiError.includes("餘額") && (
                                        <button onClick={onGoToSettings} className="underline ml-6">前往設定切換 AI</button>
                                    )}
                                </div>
                              )}
                              
                              <button 
                                  onClick={() => handleAnalyzeFood()}
                                  disabled={isAnalyzing || !foodInput.trim()}
                                  className="w-full bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                              >
                                    <Sparkles size={18} />
                                    開始分析 (Enter)
                              </button>
                          </div>
                      )}

                      {/* ... (Result Step remains same) ... */}
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

                              {formData.healthTip && (
                                  <div className="p-3 bg-neon-green/10 border border-neon-green/30 rounded-xl flex gap-3 items-start">
                                      <Lightbulb size={20} className="text-neon-green shrink-0 mt-0.5" />
                                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                          {formData.healthTip}
                                      </p>
                                  </div>
                              )}

                              <div>
                                  <div className="flex justify-between items-baseline mb-1">
                                      <label className="block text-xs font-bold text-gray-500">食物名稱</label>
                                      {usedModel && <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-charcoal-900 px-2 py-0.5 rounded">by {usedModel}</span>}
                                  </div>
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
