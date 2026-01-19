
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { X, Zap, Search, Filter, Dumbbell, Sparkles, Loader2, RotateCcw, ChevronRight, BarChart2, Info, ArrowLeft, LayoutGrid, Activity, PlayCircle, Image as ImageIcon, PenTool, WifiOff, AlertTriangle, Video, Film, Youtube } from 'lucide-react';
import { Tutorial, BodyPart, EquipmentType, UserProfile } from '../types';
import { TUTORIALS_DATA } from '../constants';

interface BodyMapProps {
  selectedPart: BodyPart | '全部' | '其他';
  onSelect: (part: BodyPart | '全部' | '其他') => void;
  view: 'FRONT' | 'BACK';
  toggleView: () => void;
}

const BodyMap: React.FC<BodyMapProps> = ({ selectedPart, onSelect, view, toggleView }) => {
  const getFill = (part: BodyPart) => {
      if (selectedPart === part) return "#22d3ee"; 
      if (selectedPart === '其他' && (part === '核心' || part === '有氧')) return "#22d3ee";
      if (selectedPart === '全部') return "#4b5563"; 
      return "#374151"; 
  };

  const getAnimationClass = (part: BodyPart) => {
      if (selectedPart === part) return "animate-pulse";
      if (selectedPart === '其他' && (part === '核心' || part === '有氧')) return "animate-pulse";
      return "";
  };

  const hoverClass = "hover:opacity-80 cursor-pointer transition-colors duration-300";

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-transparent overflow-hidden">
        <div className="absolute inset-0 opacity-5" 
             style={{ backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <button 
            onClick={toggleView}
            className="absolute top-4 right-4 bg-gray-100 dark:bg-charcoal-700 p-2 rounded-full text-gray-600 dark:text-gray-300 shadow-md hover:bg-neon-blue hover:text-charcoal-900 transition-colors z-10 flex items-center gap-1 text-xs font-bold"
        >
            <RotateCcw size={16} />
            {view === 'FRONT' ? '轉至背面' : '轉至正面'}
        </button>

        {selectedPart !== '全部' && selectedPart !== '其他' && (
           <button 
             onClick={() => onSelect('全部')}
             className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-colors z-10 bg-gray-100 dark:bg-charcoal-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-charcoal-600"
           >
               顯示全部
           </button>
        )}

        <svg viewBox="0 0 200 300" className="h-full drop-shadow-xl animate-fade-in w-full">
            {view === 'FRONT' ? (
                <g>
                    <circle cx="100" cy="30" r="12" fill={getFill('核心')} className={`${hoverClass} ${getAnimationClass('核心')}`} opacity="0.3" /> 
                    <path d="M75 50 Q70 60 72 75 L88 65 Q90 50 82 48 Z" fill={getFill('肩膀')} className={`${hoverClass} ${getAnimationClass('肩膀')}`} onClick={() => onSelect('肩膀')} />
                    <path d="M125 50 Q130 60 128 75 L112 65 Q110 50 118 48 Z" fill={getFill('肩膀')} className={`${hoverClass} ${getAnimationClass('肩膀')}`} onClick={() => onSelect('肩膀')} />
                    <path d="M82 48 Q100 55 118 48 L112 65 Q100 75 88 65 Z" fill={getFill('胸部')} className={`${hoverClass} ${getAnimationClass('胸部')}`} onClick={() => onSelect('胸部')} />
                    <path d="M72 75 L65 100 Q62 110 65 120 L75 115 L80 90 L88 65 Z" fill={getFill('手臂')} className={`${hoverClass} ${getAnimationClass('手臂')}`} onClick={() => onSelect('手臂')} />
                    <path d="M128 75 L135 100 Q138 110 135 120 L125 115 L120 90 L112 65 Z" fill={getFill('手臂')} className={`${hoverClass} ${getAnimationClass('手臂')}`} onClick={() => onSelect('手臂')} />
                    <path d="M88 65 Q100 75 112 65 L110 100 Q100 105 90 100 Z" fill={getFill('核心')} className={`${hoverClass} ${getAnimationClass('核心')}`} onClick={() => onSelect('其他')} />
                    <path d="M90 100 L85 150 Q88 170 95 165 L98 110 Z" fill={getFill('腿部')} className={`${hoverClass} ${getAnimationClass('腿部')}`} onClick={() => onSelect('腿部')} />
                    <path d="M110 100 L115 150 Q112 170 105 165 L102 110 Z" fill={getFill('腿部')} className={`${hoverClass} ${getAnimationClass('腿部')}`} onClick={() => onSelect('腿部')} />
                    <path d="M85 170 L90 220 L95 175 Z" fill={getFill('腿部')} className={`${hoverClass} ${getAnimationClass('腿部')}`} onClick={() => onSelect('腿部')} />
                    <path d="M115 170 L110 220 L105 175 Z" fill={getFill('腿部')} className={`${hoverClass} ${getAnimationClass('腿部')}`} onClick={() => onSelect('腿部')} />
                </g>
            ) : (
                <g>
                    <circle cx="100" cy="30" r="12" fill={getFill('核心')} className={`${hoverClass} ${getAnimationClass('核心')}`} opacity="0.3" />
                    <path d="M80 45 L120 45 L115 80 L100 95 L85 80 Z" fill={getFill('背部')} className={`${hoverClass} ${getAnimationClass('背部')}`} onClick={() => onSelect('背部')} />
                    <path d="M75 50 Q70 60 72 75 L85 80 L80 45 Z" fill={getFill('肩膀')} className={`${hoverClass} ${getAnimationClass('肩膀')}`} onClick={() => onSelect('肩膀')} />
                    <path d="M125 50 Q130 60 128 75 L115 80 L120 45 Z" fill={getFill('肩膀')} className={`${hoverClass} ${getAnimationClass('肩膀')}`} onClick={() => onSelect('肩膀')} />
                    <path d="M72 75 L65 100 L75 105 L85 80 Z" fill={getFill('手臂')} className={`${hoverClass} ${getAnimationClass('手臂')}`} onClick={() => onSelect('手臂')} />
                    <path d="M128 75 L135 100 L125 105 L115 80 Z" fill={getFill('手臂')} className={`${hoverClass} ${getAnimationClass('手臂')}`} onClick={() => onSelect('手臂')} />
                    <path d="M85 80 L115 80 L115 110 L85 110 Z" fill={getFill('核心')} className={`${hoverClass} ${getAnimationClass('核心')}`} onClick={() => onSelect('其他')} />
                    <path d="M85 110 L82 160 L95 160 L98 110 Z" fill={getFill('腿部')} className={`${hoverClass} ${getAnimationClass('腿部')}`} onClick={() => onSelect('腿部')} />
                    <path d="M115 110 L118 160 L105 160 L102 110 Z" fill={getFill('腿部')} className={`${hoverClass} ${getAnimationClass('腿部')}`} onClick={() => onSelect('腿部')} />
                </g>
            )}
        </svg>
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
            <span className="text-3xl font-black text-gray-200 dark:text-gray-700 uppercase tracking-widest opacity-50">
                {selectedPart === '其他' ? '核心/其他' : (selectedPart === '全部' ? '' : selectedPart)}
            </span>
        </div>
    </div>
  );
};

interface TutorialsProps {
    userProfile: UserProfile;
}

const Tutorials: React.FC<TutorialsProps> = ({ userProfile }) => {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | '全部'>('全部');
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | '全部' | '其他'>('全部');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('全部');
  const [bodyMapView, setBodyMapView] = useState<'FRONT' | 'BACK'>('FRONT');
  
  // Media State
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [displayVideo, setDisplayVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'IMAGE' | 'VIDEO'>('IMAGE');

  // AI Generation State
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  
  // Caching
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [generatedVideos, setGeneratedVideos] = useState<Record<string, string>>({});
  
  const [aiError, setAiError] = useState<string | null>(null);
  
  const handleBodyPartSelect = (part: BodyPart | '全部' | '其他') => {
      setSelectedBodyPart(part);
      if (part === '背部') setBodyMapView('BACK');
      if (part === '胸部' || part === '其他') setBodyMapView('FRONT');
  };

  useEffect(() => {
    setSelectedSubCategory('全部');
  }, [selectedBodyPart]);

  useEffect(() => {
      setAiError(null);
      setDisplayVideo(null);
      setActiveTab('IMAGE');

      if (selectedTutorial) {
          // Check Image Cache
          if (generatedImages[selectedTutorial.id]) {
              setDisplayImage(generatedImages[selectedTutorial.id]);
          } else {
              const placeholder = generateOfflinePlaceholder(selectedTutorial);
              setDisplayImage(placeholder);
          }

          // Check Video Cache
          if (generatedVideos[selectedTutorial.id]) {
              setDisplayVideo(generatedVideos[selectedTutorial.id]);
              setActiveTab('VIDEO');
          }
      } else {
          setDisplayImage(null);
      }
  }, [selectedTutorial]);

  const filteredData = useMemo(() => {
    return TUTORIALS_DATA.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEquipment = selectedEquipment === '全部' || t.equipment === selectedEquipment;
      
      let matchesBodyPart = true;
      if (selectedBodyPart === '全部') {
          matchesBodyPart = true;
      } else if (selectedBodyPart === '其他') {
          matchesBodyPart = t.bodyPart === '核心' || t.bodyPart === '有氧';
      } else {
          matchesBodyPart = t.bodyPart === selectedBodyPart;
      }

      const matchesSubCategory = selectedSubCategory === '全部' || t.subCategory === selectedSubCategory;
      return matchesSearch && matchesEquipment && matchesBodyPart && matchesSubCategory;
    });
  }, [searchTerm, selectedEquipment, selectedBodyPart, selectedSubCategory]);

  const equipments: (EquipmentType | '全部')[] = ['全部', '徒手', '固定器械', '啞鈴'];

  const getDifficultyColor = (diff: string) => {
      switch(diff) {
          case '初學者': return 'bg-green-500';
          case '中級': return 'bg-orange-500';
          case '進階': return 'bg-red-500';
          default: return 'bg-gray-500';
      }
  };

  const getDifficultyWidth = (diff: string) => {
      switch(diff) {
          case '初學者': return 'w-1/3';
          case '中級': return 'w-2/3';
          case '進階': return 'w-full';
          default: return 'w-0';
      }
  };

  const generateOfflinePlaceholder = (tutorial: Tutorial): string => {
    const colors: Record<string, string> = {
        '胸部': '#ea580c', '背部': '#c084fc', '腿部': '#a3e635', 
        '肩膀': '#22d3ee', '手臂': '#facc15', '核心': '#f87171', '有氧': '#2dd4bf',
    };
    
    const accentColor = colors[tutorial.bodyPart] || '#9ca3af';
    
    // Updated placeholder text to direct user to actions
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" style="background-color: #f8fafc;">
        <rect width="100%" height="100%" fill="white" />
        <text x="200" y="140" font-family="sans-serif" font-weight="bold" font-size="24" fill="${accentColor}" text-anchor="middle">${tutorial.name}</text>
        <text x="200" y="180" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">請選擇下方功能獲取示範</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
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

  const handleYoutubeSearch = (tutorial: Tutorial) => {
    const query = encodeURIComponent(`${tutorial.name} 訓練教學 correct form`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  // --- AI Image Generation (High Quality 3D) ---
  const handleGenerateImage = async (tutorial: Tutorial) => {
    setIsGeneratingImage(true);
    setAiError(null);
    setActiveTab('IMAGE');

    const prompt = `Hyper-realistic 3D anatomical fitness illustration of "${tutorial.name}". 
                    Show a fit character performing the exercise with perfect form. 
                    Highlight the ${tutorial.bodyPart} muscles glowing slightly to show engagement.
                    Clean, professional studio lighting, 8k resolution, cinematic composition, white background. 
                    Style: Medical anatomy meets high-end fitness magazine.`;

    try {
        let imageUrl = '';

        if (userProfile.aiProvider === 'openai') {
            const apiKey = userProfile.openaiApiKey;
            if (!apiKey) throw new Error("請至「設定」輸入 OpenAI API Key");
            
            // Note: DeepSeek does not support DALL-E endpoints usually. This assumes standard OpenAI base URL.
            // If user uses DeepSeek Base URL, this call will fail naturally, and we catch it.
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "dall-e-3",
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024"
                })
            });

            if(!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || "OpenAI 繪圖請求失敗");
            }
            
            const data = await response.json();
            imageUrl = data.data[0].url;

        } else {
            // Default Google Gemini
            const apiKey = getApiKey();
            if (!apiKey) {
                setAiError("系統未偵測到 API Key。");
                setIsGeneratingImage(false);
                return;
            }
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { imageConfig: { aspectRatio: "1:1" } }
            });

            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        break;
                    }
                }
            }
        }

        if (imageUrl) {
            setGeneratedImages(prev => ({ ...prev, [tutorial.id]: imageUrl }));
            setDisplayImage(imageUrl);
        } else {
            throw new Error("No image generated");
        }

    } catch (error: any) {
        console.error("Failed to generate image:", error);
        setAiError("圖片生成失敗 (" + (userProfile.aiProvider === 'openai' ? 'OpenAI' : 'Gemini') + ")，請試試 YouTube 搜尋。");
    } finally {
        setIsGeneratingImage(false);
    }
  };

  // --- AI Video Generation (Veo) ---
  const handleGenerateVideo = async (tutorial: Tutorial) => {
      // Force restriction: Video is only supported by Gemini Veo
      if (userProfile.aiProvider === 'openai') {
          setAiError("AI 影片生成目前僅支援 Google Gemini 模型。請至設定切換或使用 YouTube。");
          return;
      }

      setIsGeneratingVideo(true);
      setAiError(null);
      setActiveTab('VIDEO');

      const apiKey = getApiKey();

      if (!apiKey) {
          setAiError("系統未偵測到 API Key。");
          setIsGeneratingVideo(false);
          return;
      }

      try {
          const ai = new GoogleGenAI({ apiKey: apiKey });
          const prompt = `Cinematic video of a fitness trainer demonstrating the ${tutorial.name} exercise with perfect form. 
                          Medium shot, professional gym studio background with soft lighting. 
                          High resolution, realistic movement, 4k.`;

          let operation = await ai.models.generateVideos({
              model: 'veo-3.1-fast-generate-preview',
              prompt: prompt,
              config: {
                  numberOfVideos: 1,
                  resolution: '720p',
                  aspectRatio: '16:9'
              }
          });

          // Polling Loop
          let retryCount = 0;
          const maxRetries = 60; // Wait up to ~5 minutes
          while (!operation.done && retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5s
              operation = await ai.operations.getVideosOperation({operation: operation});
              retryCount++;
          }

          if (!operation.done) throw new Error("Video generation timed out.");

          const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
          
          if (downloadLink) {
              // Fetch the actual video bytes using the key
              const videoRes = await fetch(`${downloadLink}&key=${apiKey}`);
              const videoBlob = await videoRes.blob();
              const videoUrl = URL.createObjectURL(videoBlob);
              
              setGeneratedVideos(prev => ({ ...prev, [tutorial.id]: videoUrl }));
              setDisplayVideo(videoUrl);
          } else {
              throw new Error("Video URI not found.");
          }

      } catch (error: any) {
          console.error("Failed to generate video:", error);
          if (error.message?.includes("403") || error.message?.includes("billing")) {
               setAiError("影片生成需要付費專案。請改用 YouTube 搜尋。");
          } else {
               setAiError("影片生成失敗。請改用 YouTube 搜尋。");
          }
          setActiveTab('IMAGE');
      } finally {
          setIsGeneratingVideo(false);
      }
  };

  const CategoryGrid = () => {
      const categories = [
          { id: '胸部', label: '胸部', desc: 'Chest', color: 'from-orange-400 to-red-500' },
          { id: '肩膀', label: '肩膀', desc: 'Shoulder', color: 'from-blue-400 to-indigo-500' },
          { id: '腿部', label: '腿部', desc: 'Legs', color: 'from-green-400 to-teal-500' },
          { id: '背部', label: '背部', desc: 'Back', color: 'from-purple-400 to-pink-500' },
          { id: '手臂', label: '手臂', desc: 'Arms', color: 'from-yellow-400 to-orange-500' },
          { id: '其他', label: '其他', desc: 'Core / Cardio', color: 'from-gray-400 to-gray-600' },
      ];

      return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
              {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleBodyPartSelect(cat.id as any)}
                    className={`relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-charcoal-800 border border-gray-100 dark:border-charcoal-700 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group text-left h-32 md:h-40 flex flex-col justify-end`}
                  >
                      <div className={`absolute top-0 right-0 p-16 bg-gradient-to-br ${cat.color} opacity-10 rounded-bl-full transition-transform group-hover:scale-125`}></div>
                      <div className={`w-2 h-12 bg-gradient-to-b ${cat.color} absolute top-6 left-6 rounded-full`}></div>
                      <div className="z-10 relative">
                          <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-1">{cat.label}</h3>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{cat.desc}</p>
                      </div>
                      <div className="absolute top-4 right-4 bg-white dark:bg-charcoal-900 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                          <ChevronRight size={16} className="text-gray-500" />
                      </div>
                  </button>
              ))}
          </div>
      );
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-neon-blue to-neon-green bg-clip-text text-transparent">動作實驗室</h2>
            <p className="text-sm text-gray-500 mt-1">互動式肌群導航與技能樹</p>
          </div>
          {selectedBodyPart !== '全部' && (
              <button onClick={() => handleBodyPartSelect('全部')} className="self-start md:hidden mb-2 text-sm font-bold text-gray-500 flex items-center gap-1">
                  <ArrowLeft size={16} /> 返回分類
              </button>
          )}
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input type="text" placeholder="搜尋技能..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 rounded-full outline-none focus:border-neon-blue transition-colors" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block w-full lg:w-1/3 flex-shrink-0">
             <div className="lg:sticky lg:top-24 space-y-4">
                 <div className="bg-white dark:bg-charcoal-800 rounded-3xl shadow-inner border border-gray-100 dark:border-charcoal-700 h-[360px]">
                    <BodyMap selectedPart={selectedBodyPart} onSelect={handleBodyPartSelect} view={bodyMapView} toggleView={() => setBodyMapView(v => v === 'FRONT' ? 'BACK' : 'FRONT')} />
                 </div>
                 <div className="flex flex-wrap gap-2 justify-center">
                    {equipments.map(eq => (
                        <button key={eq} onClick={() => setSelectedEquipment(eq)} className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${selectedEquipment === eq ? 'border-neon-blue bg-neon-blue/10 text-neon-blue' : 'border-transparent bg-white dark:bg-charcoal-800 text-gray-500 hover:border-gray-300 dark:hover:border-charcoal-600'}`}>{eq}</button>
                    ))}
                 </div>
             </div>
          </div>

          <div className="flex-1">
             {selectedBodyPart === '全部' && !searchTerm ? (
                 <CategoryGrid />
             ) : (
                 <div className="animate-fade-in">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleBodyPartSelect('全部')} className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-charcoal-800 hover:bg-gray-200 dark:hover:bg-charcoal-700 transition-colors"><ArrowLeft size={16} /></button>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {selectedBodyPart === '其他' ? '核心與其他' : (selectedBodyPart === '全部' ? '搜尋結果' : `${selectedBodyPart}訓練`)}
                                <span className="bg-gray-200 dark:bg-charcoal-700 text-xs px-2 py-0.5 rounded-full text-gray-500">{filteredData.length}</span>
                            </h3>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredData.length > 0 ? (
                            filteredData.map((item) => (
                            <div key={item.id} onClick={() => setSelectedTutorial(item)} className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-charcoal-700 hover:border-neon-blue hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gray-100 dark:bg-charcoal-900">
                                    <div className={`h-full ${getDifficultyColor(item.difficulty)}`} style={{ height: item.difficulty === '初學者' ? '33%' : item.difficulty === '中級' ? '66%' : '100%' }}></div>
                                </div>
                                <div className="pl-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-base text-gray-800 dark:text-gray-100 group-hover:text-neon-blue transition-colors">{item.name}</h4>
                                        <ChevronRight size={16} className="text-gray-300 dark:text-charcoal-600 group-hover:text-neon-blue transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.equipment === '徒手' ? 'border-neon-green text-neon-green' : item.equipment === '啞鈴' ? 'border-neon-purple text-neon-purple' : 'border-neon-blue text-neon-blue'}`}>{item.equipment}</span>
                                        {item.subCategory && <span className="text-[10px] bg-gray-100 dark:bg-charcoal-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{item.subCategory}</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                                </div>
                            </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-charcoal-800/50 rounded-3xl border-dashed border-2 border-gray-200 dark:border-charcoal-700">
                                <Dumbbell className="mb-3 opacity-20" size={48} />
                                <p>此篩選條件下無動作</p>
                                <button onClick={() => {setSearchTerm(''); setSelectedEquipment('全部'); setSelectedBodyPart('全部'); setSelectedSubCategory('全部');}} className="mt-2 text-neon-blue hover:underline text-sm font-bold">重置篩選</button>
                            </div>
                        )}
                     </div>
                 </div>
             )}
          </div>
      </div>

      {selectedTutorial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-charcoal-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto flex flex-col">
             
             {/* Media Area */}
             <div className="relative h-64 md:h-80 bg-gray-100 dark:bg-black border-b border-gray-200 dark:border-charcoal-700 shrink-0 group">
                <button onClick={() => setSelectedTutorial(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-20"><X size={20} /></button>
                
                <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
                     {activeTab === 'IMAGE' && (
                         <>
                            {!displayImage && <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #555 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>}
                            {displayImage ? <img src={displayImage} alt={selectedTutorial.name} className="w-full h-full object-contain p-4 animate-fade-in bg-white" /> : <div className="flex flex-col items-center justify-center h-full text-gray-400"><Loader2 className="animate-spin mb-2" /><span className="text-xs">載入圖解中...</span></div>}
                         </>
                     )}
                     
                     {activeTab === 'VIDEO' && (
                         <div className="w-full h-full bg-black flex items-center justify-center">
                             {displayVideo ? (
                                 <video src={displayVideo} controls autoPlay loop className="w-full h-full object-cover" />
                             ) : (
                                 <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                                     {isGeneratingVideo ? (
                                         <>
                                            <Loader2 className="animate-spin text-neon-blue" size={32} />
                                            <div className="text-center">
                                                <span className="text-sm font-bold text-white block">AI 影片生成中...</span>
                                                <span className="text-xs text-gray-500">這可能需要 1-2 分鐘，請耐心等候</span>
                                            </div>
                                         </>
                                     ) : (
                                        <Film size={32} />
                                     )}
                                 </div>
                             )}
                         </div>
                     )}
                </div>

                {/* AI Controls Overlay */}
                <div className="absolute inset-x-0 bottom-4 flex flex-col items-center justify-center z-20 pointer-events-none gap-2">
                    {aiError && (
                            <div className="bg-red-500/90 text-white text-xs px-3 py-1 rounded-full mb-1 flex flex-col items-center gap-1 shadow-lg pointer-events-auto max-w-[90%] text-center">
                            <div className="flex items-center gap-1"><AlertTriangle size={12}/> {aiError}</div>
                            </div>
                    )}
                    
                    <div className="flex flex-wrap justify-center items-center gap-2 pointer-events-auto px-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleGenerateImage(selectedTutorial); }}
                            disabled={isGeneratingImage || isGeneratingVideo}
                            className={`bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-white px-3 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 text-xs border border-gray-200 dark:border-charcoal-600 ${activeTab === 'IMAGE' ? 'ring-2 ring-neon-blue' : 'opacity-80 hover:opacity-100'}`}
                        >
                            {isGeneratingImage ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                            3D 圖解
                        </button>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleGenerateVideo(selectedTutorial); }}
                            disabled={isGeneratingImage || isGeneratingVideo}
                            className={`bg-charcoal-900 dark:bg-charcoal-700 text-white px-3 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 text-xs ${activeTab === 'VIDEO' ? 'ring-2 ring-white' : 'opacity-80 hover:opacity-100'}`}
                        >
                             {isGeneratingVideo ? <Loader2 className="animate-spin" size={14} /> : <Video size={14} />}
                             AI 影片
                        </button>

                         <button 
                            onClick={(e) => { e.stopPropagation(); handleYoutubeSearch(selectedTutorial); }}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 text-xs"
                        >
                             <Youtube size={16} />
                             YouTube 示範
                        </button>
                    </div>
                </div>
             </div>
             
             <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-black tracking-wider uppercase bg-neon-blue text-charcoal-900 px-2 py-1 rounded">{selectedTutorial.bodyPart}</span>
                            {selectedTutorial.subCategory && <span className="text-xs font-bold bg-charcoal-100 dark:bg-charcoal-700 text-gray-500 dark:text-gray-300 px-2 py-1 rounded">{selectedTutorial.subCategory}</span>}
                            <span className="text-xs font-bold border border-gray-300 dark:border-charcoal-600 px-2 py-1 rounded text-gray-500">{selectedTutorial.equipment}</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-3">{selectedTutorial.name}</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{selectedTutorial.description}</p>
                    </div>
                    <div className="bg-neon-green/5 p-5 rounded-2xl border border-neon-green/20">
                        <h4 className="font-bold text-neon-green flex items-center gap-2 mb-4 text-sm uppercase tracking-wider"><Zap size={16} /> 關鍵技巧</h4>
                        <ul className="space-y-3">{selectedTutorial.tips.map((tip, idx) => <li key={idx} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300 items-start"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-green shrink-0"></div><span className="leading-relaxed">{tip}</span></li>)}</ul>
                    </div>
                </div>
                <div className="w-full md:w-48 shrink-0 space-y-4">
                    <div className="bg-gray-50 dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-100 dark:border-charcoal-700">
                         <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><BarChart2 size={12}/> 難度等級</h5>
                         <div className="w-full h-2 bg-gray-200 dark:bg-charcoal-700 rounded-full overflow-hidden mb-1"><div className={`h-full ${getDifficultyColor(selectedTutorial.difficulty)}`} style={{ width: getDifficultyWidth(selectedTutorial.difficulty) }}></div></div>
                         <div className="text-right text-xs font-bold text-gray-600 dark:text-gray-300">{selectedTutorial.difficulty}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-100 dark:border-charcoal-700 flex flex-col items-center text-center">
                        <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Info size={12}/> 目標肌群</h5>
                        <div className="w-full aspect-[2/3] relative flex items-center justify-center p-2 bg-gray-100 dark:bg-black rounded-lg overflow-hidden border border-gray-200 dark:border-charcoal-800">
                             <div className="w-full h-full scale-[1.2] origin-center"><BodyMap selectedPart={selectedTutorial.bodyPart} onSelect={() => {}} view={selectedTutorial.bodyPart === '背部' ? 'BACK' : 'FRONT'} toggleView={() => {}} /></div>
                             <div className="absolute inset-0 z-20"></div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedTutorial(null)} className="w-full py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold rounded-xl active:scale-95 transition-transform shadow-lg">關閉</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tutorials;
