
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { X, Zap, Search, Filter, Dumbbell, Sparkles, Loader2, RotateCcw, ChevronRight, BarChart2, Info, ArrowLeft, LayoutGrid, Activity, PlayCircle, Image as ImageIcon, PenTool, WifiOff } from 'lucide-react';
import { Tutorial, BodyPart, EquipmentType } from '../types';
import { TUTORIALS_DATA } from '../constants';

// --- Interactive Muscle Map Component ---
interface BodyMapProps {
  selectedPart: BodyPart | '全部' | '其他';
  onSelect: (part: BodyPart | '全部' | '其他') => void;
  view: 'FRONT' | 'BACK';
  toggleView: () => void;
}

const BodyMap: React.FC<BodyMapProps> = ({ selectedPart, onSelect, view, toggleView }) => {
  
  // Helper to determine fill color
  const getFill = (part: BodyPart) => {
      if (selectedPart === part) return "#22d3ee"; // neon-blue selected
      // Handle 'Other' group
      if (selectedPart === '其他' && (part === '核心' || part === '有氧')) return "#22d3ee";
      
      if (selectedPart === '全部') return "#4b5563"; // gray-600 default
      return "#374151"; // gray-700 unselected
  };

  const getAnimationClass = (part: BodyPart) => {
      if (selectedPart === part) return "animate-pulse";
      if (selectedPart === '其他' && (part === '核心' || part === '有氧')) return "animate-pulse";
      return "";
  };

  const hoverClass = "hover:opacity-80 cursor-pointer transition-colors duration-300";

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-transparent overflow-hidden">
        {/* Grid Background */}
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
                    {/* Head */}
                    <circle cx="100" cy="30" r="12" fill={getFill('核心')} className={`${hoverClass} ${getAnimationClass('核心')}`} opacity="0.3" /> 
                    
                    {/* Shoulders (Delts) */}
                    <path 
                        d="M75 50 Q70 60 72 75 L88 65 Q90 50 82 48 Z" 
                        fill={getFill('肩膀')} 
                        className={`${hoverClass} ${getAnimationClass('肩膀')}`}
                        onClick={() => onSelect('肩膀')}
                    />
                    <path 
                        d="M125 50 Q130 60 128 75 L112 65 Q110 50 118 48 Z" 
                        fill={getFill('肩膀')} 
                        className={`${hoverClass} ${getAnimationClass('肩膀')}`}
                        onClick={() => onSelect('肩膀')}
                    />

                    {/* Chest (Pecs) */}
                    <path 
                        d="M82 48 Q100 55 118 48 L112 65 Q100 75 88 65 Z" 
                        fill={getFill('胸部')} 
                        className={`${hoverClass} ${getAnimationClass('胸部')}`}
                        onClick={() => onSelect('胸部')}
                    />

                    {/* Arms (Biceps/Forearms) */}
                    <path 
                        d="M72 75 L65 100 Q62 110 65 120 L75 115 L80 90 L88 65 Z" 
                        fill={getFill('手臂')} 
                        className={`${hoverClass} ${getAnimationClass('手臂')}`}
                        onClick={() => onSelect('手臂')}
                    />
                    <path 
                        d="M128 75 L135 100 Q138 110 135 120 L125 115 L120 90 L112 65 Z" 
                        fill={getFill('手臂')} 
                        className={`${hoverClass} ${getAnimationClass('手臂')}`}
                        onClick={() => onSelect('手臂')}
                    />

                    {/* Core (Abs) */}
                    <path 
                        d="M88 65 Q100 75 112 65 L110 100 Q100 105 90 100 Z" 
                        fill={getFill('核心')} 
                        className={`${hoverClass} ${getAnimationClass('核心')}`}
                        onClick={() => onSelect('其他')}
                    />

                    {/* Legs (Quads) */}
                    <path 
                        d="M90 100 L85 150 Q88 170 95 165 L98 110 Z" 
                        fill={getFill('腿部')} 
                        className={`${hoverClass} ${getAnimationClass('腿部')}`}
                        onClick={() => onSelect('腿部')}
                    />
                    <path 
                        d="M110 100 L115 150 Q112 170 105 165 L102 110 Z" 
                        fill={getFill('腿部')} 
                        className={`${hoverClass} ${getAnimationClass('腿部')}`}
                        onClick={() => onSelect('腿部')}
                    />
                    {/* Legs (Calves) */}
                    <path 
                        d="M85 170 L90 220 L95 175 Z" 
                        fill={getFill('腿部')} 
                        className={`${hoverClass} ${getAnimationClass('腿部')}`}
                        onClick={() => onSelect('腿部')}
                    />
                     <path 
                        d="M115 170 L110 220 L105 175 Z" 
                        fill={getFill('腿部')} 
                        className={`${hoverClass} ${getAnimationClass('腿部')}`}
                        onClick={() => onSelect('腿部')}
                    />
                </g>
            ) : (
                <g>
                    {/* Head Back */}
                    <circle cx="100" cy="30" r="12" fill={getFill('核心')} className={`${hoverClass} ${getAnimationClass('核心')}`} opacity="0.3" />

                    {/* Back (Traps/Lats) */}
                    <path 
                        d="M80 45 L120 45 L115 80 L100 95 L85 80 Z" 
                        fill={getFill('背部')} 
                        className={`${hoverClass} ${getAnimationClass('背部')}`}
                        onClick={() => onSelect('背部')}
                    />

                    {/* Shoulders Back (Rear Delts) */}
                    <path 
                        d="M75 50 Q70 60 72 75 L85 80 L80 45 Z" 
                        fill={getFill('肩膀')} 
                        className={`${hoverClass} ${getAnimationClass('肩膀')}`}
                        onClick={() => onSelect('肩膀')}
                    />
                    <path 
                        d="M125 50 Q130 60 128 75 L115 80 L120 45 Z" 
                        fill={getFill('肩膀')} 
                        className={`${hoverClass} ${getAnimationClass('肩膀')}`}
                        onClick={() => onSelect('肩膀')}
                    />

                    {/* Arms Back (Triceps) */}
                    <path 
                        d="M72 75 L65 100 L75 105 L85 80 Z" 
                        fill={getFill('手臂')} 
                        className={`${hoverClass} ${getAnimationClass('手臂')}`}
                        onClick={() => onSelect('手臂')}
                    />
                    <path 
                        d="M128 75 L135 100 L125 105 L115 80 Z" 
                        fill={getFill('手臂')} 
                        className={`${hoverClass} ${getAnimationClass('手臂')}`}
                        onClick={() => onSelect('手臂')}
                    />

                    {/* Lower Back / Glutes */}
                    <path 
                        d="M85 80 L115 80 L115 110 L85 110 Z" 
                        fill={getFill('核心')} 
                        className={`${hoverClass} ${getAnimationClass('核心')}`}
                        onClick={() => onSelect('其他')}
                    />

                    {/* Legs Back (Hamstrings) */}
                    <path 
                        d="M85 110 L82 160 L95 160 L98 110 Z" 
                        fill={getFill('腿部')} 
                        className={`${hoverClass} ${getAnimationClass('腿部')}`}
                        onClick={() => onSelect('腿部')}
                    />
                    <path 
                        d="M115 110 L118 160 L105 160 L102 110 Z" 
                        fill={getFill('腿部')} 
                        className={`${hoverClass} ${getAnimationClass('腿部')}`}
                        onClick={() => onSelect('腿部')}
                    />
                </g>
            )}
        </svg>

        {/* Selected Label Overlay */}
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
            <span className="text-3xl font-black text-gray-200 dark:text-gray-700 uppercase tracking-widest opacity-50">
                {selectedPart === '其他' ? '核心/其他' : (selectedPart === '全部' ? '' : selectedPart)}
            </span>
        </div>
    </div>
  );
};


const Tutorials: React.FC = () => {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | '全部'>('全部');
  // '其他' maps to Core, Cardio, and others not in the main 5
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | '全部' | '其他'>('全部');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('全部');
  const [bodyMapView, setBodyMapView] = useState<'FRONT' | 'BACK'>('FRONT');
  
  // Image Generation State
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

  // Sync Body Map view based on selected part (optional Auto-flip)
  const handleBodyPartSelect = (part: BodyPart | '全部' | '其他') => {
      setSelectedBodyPart(part);
      if (part === '背部') setBodyMapView('BACK');
      if (part === '胸部' || part === '其他') setBodyMapView('FRONT');
  };

  // Reset sub-category when body part changes
  useEffect(() => {
    setSelectedSubCategory('全部');
  }, [selectedBodyPart]);

  // Set initial offline placeholder when tutorial is selected
  useEffect(() => {
      if (selectedTutorial) {
          if (generatedImages[selectedTutorial.id]) {
              setDisplayImage(generatedImages[selectedTutorial.id]);
          } else {
              const placeholder = generateOfflinePlaceholder(selectedTutorial);
              setDisplayImage(placeholder);
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
          // '其他' covers Core, Cardio, and potentially others if we add them
          matchesBodyPart = t.bodyPart === '核心' || t.bodyPart === '有氧';
      } else {
          matchesBodyPart = t.bodyPart === selectedBodyPart;
      }

      const matchesSubCategory = selectedSubCategory === '全部' || t.subCategory === selectedSubCategory;
      return matchesSearch && matchesEquipment && matchesBodyPart && matchesSubCategory;
    });
  }, [searchTerm, selectedEquipment, selectedBodyPart, selectedSubCategory]);

  const availableSubCategories = useMemo(() => {
      if (selectedBodyPart === '全部') return [];
      
      const subs = new Set<string>();
      TUTORIALS_DATA.filter(t => {
          if (selectedBodyPart === '其他') return t.bodyPart === '核心' || t.bodyPart === '有氧';
          return t.bodyPart === selectedBodyPart;
      }).forEach(t => {
          if(t.subCategory) subs.add(t.subCategory);
      });
      return Array.from(subs);
  }, [selectedBodyPart]);

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

  // --- Expert Fitness Coach SVG Generator (Highly Optimized) ---
  const generateOfflinePlaceholder = (tutorial: Tutorial): string => {
    
    // Updated colors to match App Theme (Neon/Dark Mode compatible)
    const colors: Record<string, string> = {
        '胸部': '#ea580c', // Orange (CTA)
        '背部': '#c084fc', // Purple
        '腿部': '#a3e635', // Green
        '肩膀': '#22d3ee', // Blue
        '手臂': '#facc15', // Yellow
        '核心': '#f87171', // Red/Pink
        '有氧': '#2dd4bf', // Teal
    };
    
    const accentColor = colors[tutorial.bodyPart] || '#9ca3af';
    const skinColor = "#374151"; 
    const machineColor = "#e5e7eb";
    const machineDark = "#9ca3af";
    
    let svgContent = '';
    let cssStyles = ''; 
    const name = tutorial.name.toLowerCase();

    // Helpers
    const drawHead = (cx: number, cy: number) => `<circle cx="${cx}" cy="${cy}" r="12" fill="${skinColor}" />`;
    const drawTorso = (x: number, y: number, angle: number = 0, height: number = 60, rx: number = 10) => 
        `<rect x="${x}" y="${y}" width="24" height="${height}" rx="${rx}" fill="${skinColor}" transform="rotate(${angle}, ${x+12}, ${y+height/2})" />`;
    const drawLimb = (x1: number, y1: number, x2: number, y2: number, color: string = skinColor, width: number = 14) => 
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" />`;

    // =========================================================================
    // 1. CHEST (胸部)
    // =========================================================================
    
    // Fly / Pec Deck (Butterfly)
    if (name.includes('fly') || name.includes('pec deck') || name.includes('蝴蝶') || name.includes('夾胸')) {
        const isReverse = name.includes('reverse');
        if (!isReverse) {
            cssStyles = `
                @keyframes pecFly { 
                    0%, 100% { transform: rotate(0deg); } 
                    50% { transform: rotate(45deg); } 
                }
                @keyframes pecFlyRight {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(-45deg); }
                }
                .anim-fly-l { animation: pecFly 3s infinite ease-in-out; transform-origin: 90px 110px; }
                .anim-fly-r { animation: pecFlyRight 3s infinite ease-in-out; transform-origin: 110px 110px; }
            `;
            
            svgContent = `
                <!-- Seat Back -->
                <rect x="85" y="80" width="30" height="90" rx="4" fill="${machineColor}" />
                
                ${drawHead(100, 85)}
                ${drawTorso(88, 100)}
                ${drawLimb(95, 150, 95, 200, skinColor)}
                ${drawLimb(105, 150, 105, 200, skinColor)}

                <!-- Arms (Pec Deck style) -->
                <g class="anim-fly-l">
                    ${drawLimb(90, 110, 60, 110, skinColor)} <!-- Upper -->
                    ${drawLimb(60, 110, 60, 80, skinColor)}   <!-- Forearm vertical or machine arm -->
                    <circle cx="60" cy="90" r="6" fill="#555" /> <!-- Handle -->
                </g>
                <g class="anim-fly-r">
                    ${drawLimb(110, 110, 140, 110, skinColor)}
                    ${drawLimb(140, 110, 140, 80, skinColor)}
                    <circle cx="140" cy="90" r="6" fill="#555" />
                </g>
                <circle cx="100" cy="115" r="8" fill="${accentColor}" opacity="0.6" filter="blur(2px)" />
            `;
        }
    }
    // Dips (Lower Chest)
    else if (name.includes('dip') || name.includes('撐體')) {
        cssStyles = `
            @keyframes dip { 
                0%, 100% { transform: translateY(0) rotate(0deg); } 
                50% { transform: translateY(20px) rotate(5deg); } 
            }
            .anim-dip { animation: dip 2.5s infinite ease-in-out; }
        `;
        svgContent = `
            <rect x="50" y="160" width="40" height="6" fill="${machineDark}" /> <!-- Bar L -->
            <rect x="110" y="160" width="40" height="6" fill="${machineDark}" /> <!-- Bar R -->
            <rect x="60" y="166" width="6" height="60" fill="${machineColor}" />
            <rect x="135" y="166" width="6" height="60" fill="${machineColor}" />

            <g class="anim-dip" style="transform-origin: 100px 120px;">
                ${drawHead(100, 100)}
                <!-- Torso leaning forward -->
                <rect x="88" y="110" width="24" height="60" rx="10" fill="${skinColor}" transform="rotate(15, 100, 140)" />
                
                ${drawLimb(95, 125, 75, 160, skinColor, 10)} <!-- Arm L -->
                ${drawLimb(105, 125, 125, 160, skinColor, 10)} <!-- Arm R -->
                <!-- Legs tucked back -->
                <path d="M90 170 Q 70 190 100 195" stroke="${skinColor}" stroke-width="12" fill="none" stroke-linecap="round" />
            </g>
            <circle cx="100" cy="130" r="10" fill="${accentColor}" opacity="0.5" />
        `;
    }
    // Bench Press / Incline Press (Horizontal Push)
    else if (name.includes('press') && (name.includes('chest') || name.includes('bench') || name.includes('incline') || name.includes('胸推') || name.includes('臥推'))) {
        const isIncline = name.includes('incline') || name.includes('上斜');
        const angle = isIncline ? -25 : 0;
        const isDumbbell = name.includes('dumbbell') || name.includes('啞鈴');
        
        cssStyles = `
            @keyframes pressPush { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-25px); } }
            .anim-press { animation: pressPush 2.5s infinite ease-in-out; }
        `;
        
        svgContent = `
            <!-- Bench -->
            <rect x="60" y="160" width="80" height="10" fill="${machineDark}" transform="rotate(${angle}, 100, 160)" />
            <rect x="70" y="170" width="10" height="40" fill="${machineColor}" />
            <rect x="120" y="170" width="10" height="40" fill="${machineColor}" />

            <!-- Person Body -->
            <g transform="rotate(${angle}, 100, 150)">
                ${drawHead(70, 150)}
                <rect x="80" y="140" width="70" height="24" rx="8" fill="${skinColor}" />
                ${drawLimb(140, 150, 160, 130, skinColor)} <!-- Leg upper -->
                ${drawLimb(160, 130, 160, 170, skinColor)} <!-- Leg lower -->
            </g>

            <!-- Arms Pushing -->
            <g class="anim-press">
                <!-- Forearms -->
                <line x1="140" y1="145" x2="140" y2="110" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" />
                <!-- Upper Arms (Shoulder to Elbow) -->
                <line x1="110" y1="145" x2="140" y2="145" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" />
                
                ${isDumbbell ? 
                    // Dumbbells
                    `<rect x="130" y="105" width="20" height="10" fill="#555" rx="2" />` : 
                    // Barbell
                    `<line x1="100" y1="110" x2="180" y2="110" stroke="#333" stroke-width="6" stroke-linecap="round" />`
                }
            </g>
            <circle cx="115" cy="145" r="10" fill="${accentColor}" opacity="0.6" filter="blur(2px)" />
        `;
    }

    // =========================================================================
    // 2. SHOULDER (肩膀)
    // =========================================================================
    
    // Lateral Raise (Side)
    else if (name.includes('lateral') || name.includes('side') || name.includes('側平舉')) {
        cssStyles = `
            @keyframes latRaiseL { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(80deg); } }
            @keyframes latRaiseR { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-80deg); } }
            .anim-raise-l { animation: latRaiseL 3s infinite ease-in-out; transform-origin: 90px 105px; }
            .anim-raise-r { animation: latRaiseR 3s infinite ease-in-out; transform-origin: 110px 105px; }
        `;
        svgContent = `
            ${drawHead(100, 70)}
            ${drawTorso(88, 90)}
            ${drawLimb(95, 150, 95, 220, skinColor)}
            ${drawLimb(105, 150, 105, 220, skinColor)}

            <!-- Arms -->
            <g class="anim-raise-l">
                <line x1="90" y1="105" x2="90" y2="160" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" />
                <rect x="85" y="160" width="10" height="15" fill="#555" /> <!-- DB -->
            </g>
            <g class="anim-raise-r">
                <line x1="110" y1="105" x2="110" y2="160" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" />
                <rect x="105" y="160" width="10" height="15" fill="#555" /> <!-- DB -->
            </g>
            
            <circle cx="85" cy="100" r="6" fill="${accentColor}" opacity="0.6" />
            <circle cx="115" cy="100" r="6" fill="${accentColor}" opacity="0.6" />
        `;
    }
    // Front Raise
    else if (name.includes('front') || name.includes('前平舉')) {
        cssStyles = `
            @keyframes frontRaise { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-90deg); } }
            .anim-front { animation: frontRaise 3s infinite ease-in-out; transform-origin: 100px 105px; }
        `;
        svgContent = `
            <!-- Side View Body -->
            ${drawHead(100, 70)}
            ${drawTorso(90, 90)}
            ${drawLimb(95, 150, 95, 220, skinColor)}

            <g class="anim-front">
                <line x1="100" y1="105" x2="100" y2="165" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" />
                <rect x="95" y="165" width="10" height="15" fill="#555" />
            </g>
            <circle cx="100" cy="105" r="8" fill="${accentColor}" opacity="0.6" />
        `;
    }
    // Overhead / Shoulder Press
    else if (name.includes('shoulder') || name.includes('overhead') || name.includes('military') || name.includes('肩推') || name.includes('推舉')) {
        cssStyles = `
            @keyframes ohp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-35px); } }
            .anim-ohp { animation: ohp 3s infinite ease-in-out; }
        `;
        svgContent = `
            <!-- Bench (if seated) -->
            <rect x="85" y="130" width="30" height="10" fill="${machineDark}" /> 
            <rect x="90" y="90" width="20" height="40" fill="${machineColor}" opacity="0.5" />

            ${drawHead(100, 80)}
            ${drawTorso(88, 100)}
            ${drawLimb(95, 150, 95, 190, skinColor)} <!-- Legs -->
            ${drawLimb(105, 150, 105, 190, skinColor)}

            <g class="anim-ohp">
                <!-- Arm L -->
                <path d="M90 110 L 75 110 L 75 75" stroke="${skinColor}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                <!-- Arm R -->
                <path d="M110 110 L 125 110 L 125 75" stroke="${skinColor}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                
                <rect x="65" y="70" width="20" height="10" fill="#555" /> <!-- DB L -->
                <rect x="115" y="70" width="20" height="10" fill="#555" /> <!-- DB R -->
            </g>
            <circle cx="90" cy="105" r="6" fill="${accentColor}" opacity="0.6" />
            <circle cx="110" cy="105" r="6" fill="${accentColor}" opacity="0.6" />
        `;
    }
    // Pike Pushup
    else if (name.includes('pike') || name.includes('派克')) {
        cssStyles = `
            @keyframes pike { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(15px) rotate(5deg); } }
            .anim-pike { animation: pike 2.5s infinite ease-in-out; transform-origin: 160px 200px; }
        `;
        svgContent = `
            <g class="anim-pike">
                <!-- Body V Shape -->
                <line x1="80" y1="180" x2="110" y2="120" stroke="${skinColor}" stroke-width="16" stroke-linecap="round" /> <!-- Torso -->
                <line x1="110" y1="120" x2="160" y2="180" stroke="${skinColor}" stroke-width="14" stroke-linecap="round" /> <!-- Legs -->
                
                ${drawHead(80, 190)} <!-- Head down -->
                
                <!-- Arms -->
                <line x1="85" y1="170" x2="70" y2="210" stroke="${skinColor}" stroke-width="10" stroke-linecap="round" />
            </g>
            <line x1="40" y1="210" x2="180" y2="210" stroke="#e5e7eb" stroke-width="2" />
            <circle cx="90" cy="140" r="8" fill="${accentColor}" opacity="0.6" />
        `;
    }

    // =========================================================================
    // 3. BACK (背部)
    // =========================================================================
    
    // Lat Pulldown / High Pull
    else if (name.includes('lat') || name.includes('high') || name.includes('高位') || name.includes('pull down')) {
        cssStyles = `
            @keyframes pullDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(45px); } }
            .anim-bar { animation: pullDown 3s infinite ease-in-out; }
        `;
        svgContent = `
            <!-- Machine -->
            <rect x="80" y="170" width="40" height="10" fill="${machineDark}" /> <!-- Seat -->
            <rect x="90" y="180" width="20" height="50" fill="${machineColor}" />
            <rect x="70" y="150" width="60" height="8" rx="4" fill="${machineDark}" /> <!-- Knee Pad -->

            <!-- Person -->
            ${drawHead(100, 110)}
            ${drawTorso(88, 130)}
            <!-- Thighs under pad -->
            <line x1="95" y1="180" x2="95" y2="155" stroke="${skinColor}" stroke-width="14" />
            <line x1="105" y1="180" x2="105" y2="155" stroke="${skinColor}" stroke-width="14" />

            <!-- Arms & Bar -->
            <g class="anim-bar">
                <line x1="40" y1="50" x2="160" y2="50" stroke="#333" stroke-width="6" stroke-linecap="round" /> <!-- Bar -->
                <line x1="100" y1="50" x2="100" y2="10" stroke="#333" stroke-width="2" stroke-dasharray="4" /> <!-- Cable -->
                
                <!-- Arms reaching up -->
                <path d="M90 130 L 70 80 L 60 50" stroke="${skinColor}" stroke-width="10" fill="none" stroke-linecap="round" />
                <path d="M110 130 L 130 80 L 140 50" stroke="${skinColor}" stroke-width="10" fill="none" stroke-linecap="round" />
            </g>
            <path d="M90 130 L 110 130 L 100 160 Z" fill="${accentColor}" opacity="0.6" />
        `;
    }
    // Pull Up / Chin Up
    else if (name.includes('pull up') || name.includes('chin up') || name.includes('引體')) {
        cssStyles = `
            @keyframes bodyUp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-40px); } }
            .anim-body { animation: bodyUp 3s infinite ease-in-out; }
        `;
        svgContent = `
            <!-- Bar -->
            <line x1="40" y1="40" x2="160" y2="40" stroke="#333" stroke-width="6" />
            
            <g class="anim-body">
                <!-- Arms holding bar -->
                <line x1="70" y1="40" x2="85" y2="90" stroke="${skinColor}" stroke-width="10" stroke-linecap="round" />
                <line x1="130" y1="40" x2="115" y2="90" stroke="${skinColor}" stroke-width="10" stroke-linecap="round" />
                
                ${drawHead(100, 80)}
                ${drawTorso(88, 100)}
                
                <!-- Legs -->
                <path d="M95 160 L 95 200" stroke="${skinColor}" stroke-width="14" stroke-linecap="round" />
                <path d="M105 160 L 105 200" stroke="${skinColor}" stroke-width="14" stroke-linecap="round" />
            </g>
            <path d="M90 100 L 110 100 L 100 140 Z" fill="${accentColor}" opacity="0.6" />
        `;
    }
    // Seated Row (Cable)
    else if ((name.includes('row') && name.includes('cable')) || name.includes('seated') || name.includes('坐姿')) {
        cssStyles = `
            @keyframes rowPull { 
                0%, 100% { transform: translate(0, 0); } 
                50% { transform: translate(-20px, 0); } 
            }
            .anim-arms { animation: rowPull 3s infinite ease-in-out; }
        `;
        svgContent = `
            <!-- Seat -->
            <rect x="90" y="190" width="40" height="10" fill="${machineDark}" />
            <!-- Foot Pad -->
            <rect x="160" y="170" width="10" height="40" fill="${machineColor}" transform="rotate(-10, 165, 190)" />

            <!-- Person -->
            ${drawHead(100, 100)}
            ${drawTorso(88, 120)}
            <!-- Legs -->
            <path d="M100 180 L 140 180 L 165 190" stroke="${skinColor}" stroke-width="14" fill="none" stroke-linecap="round" />

            <g class="anim-arms">
                <line x1="20" y1="140" x2="90" y2="140" stroke="#333" stroke-width="2" stroke-dasharray="4" /> <!-- Cable -->
                <path d="M100 130 L 115 140 L 90 140" stroke="${skinColor}" stroke-width="10" fill="none" stroke-linecap="round" />
                <circle cx="90" cy="140" r="5" fill="#555" />
            </g>
            <circle cx="105" cy="135" r="8" fill="${accentColor}" opacity="0.6" />
        `;
    }
    // Dumbbell Row / Bent Over Row
    else if (name.includes('row') || name.includes('划船')) {
        cssStyles = `
            @keyframes dbRow { 
                0%, 100% { transform: translateY(0); } 
                50% { transform: translateY(-30px); } 
            }
            .anim-db-arm { animation: dbRow 2.5s infinite ease-in-out; }
        `;
        svgContent = `
            <!-- Bench if needed, or bent over standing -->
            <rect x="120" y="160" width="50" height="10" fill="${machineDark}" />
            
            <!-- Person Bent Over -->
            ${drawHead(150, 105)}
            <line x1="140" y1="115" x2="90" y2="135" stroke="${skinColor}" stroke-width="24" stroke-linecap="round" /> <!-- Torso -->
            
            <!-- Support Arm/Leg -->
            <line x1="140" y1="120" x2="140" y2="160" stroke="${skinColor}" stroke-width="10" /> <!-- Arm on bench -->
            <line x1="100" y1="135" x2="80" y2="200" stroke="${skinColor}" stroke-width="14" /> <!-- Leg standing -->

            <g class="anim-db-arm">
                <line x1="110" y1="125" x2="110" y2="180" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" />
                <rect x="100" y="180" width="20" height="15" fill="#555" rx="2" /> <!-- DB -->
            </g>
            <ellipse cx="110" cy="130" rx="10" ry="6" fill="${accentColor}" opacity="0.6" />
        `;
    }
    // Reverse Fly
    else if (name.includes('reverse fly') || name.includes('反向')) {
        cssStyles = `
            @keyframes revFly { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-40deg); } }
            .anim-fly-back { animation: revFly 3s infinite ease-in-out; transform-origin: 100px 120px; }
        `;
        svgContent = `
            ${drawHead(130, 95)}
            <!-- Torso Bent Forward -->
            <line x1="120" y1="105" x2="80" y2="125" stroke="${skinColor}" stroke-width="22" stroke-linecap="round" /> 
            <!-- Legs -->
            <path d="M80 125 L 75 160 L 75 210" stroke="${skinColor}" stroke-width="14" fill="none" stroke-linecap="round" />

            <g class="anim-fly-back">
                <line x1="100" y1="115" x2="100" y2="170" stroke="${skinColor}" stroke-width="10" stroke-linecap="round" />
                <circle cx="100" cy="170" r="6" fill="#555" />
            </g>
            <circle cx="105" cy="115" r="6" fill="${accentColor}" opacity="0.6" />
        `;
    }

    // =========================================================================
    // 4. LEG MACHINES (Previously Added)
    // =========================================================================
    
    // Leg Press (45 Degree Sled)
    else if (name.includes('leg press') || name.includes('腿推')) {
        cssStyles = `
            @keyframes legPress { 
                0%, 100% { transform: translate(0, 0); } 
                50% { transform: translate(15px, -15px); } 
            }
            .anim-sled { animation: legPress 2.5s infinite ease-in-out; }
        `;
        svgContent = `
            <!-- Seat (Backrest angled) -->
            <rect x="30" y="130" width="10" height="70" rx="2" fill="${machineColor}" transform="rotate(-20, 35, 165)" />
            <rect x="40" y="180" width="40" height="10" rx="2" fill="${machineColor}" />
            
            <!-- Person -->
            <g transform="rotate(-20, 55, 155)">
                 ${drawHead(55, 115)}
                 ${drawTorso(43, 130)}
            </g>

            <!-- Dynamic Legs & Sled -->
            <g class="anim-sled">
                <!-- Sled Plate -->
                <rect x="130" y="90" width="8" height="80" rx="2" fill="${machineDark}" transform="rotate(-20, 134, 130)" />
                <rect x="140" y="100" width="25" height="50" rx="2" fill="#555" transform="rotate(-20, 152, 125)" />
                
                <!-- Legs (Thigh + Shin) -->
                <!-- Origin roughly at hip (65, 175), Target at Sled (125, 125) -->
                <line x1="70" y1="175" x2="105" y2="135" stroke="${skinColor}" stroke-width="14" stroke-linecap="round" />
                <line x1="105" y1="135" x2="135" y2="130" stroke="${skinColor}" stroke-width="14" stroke-linecap="round" />
            </g>
            <circle cx="105" cy="135" r="8" fill="${accentColor}" opacity="0.6" />
        `;
    }
    // Leg Extension (Seated Kick)
    else if (name.includes('extension') || name.includes('腿伸')) {
        cssStyles = `
            @keyframes kick { 
                0%, 100% { transform: rotate(0deg); } 
                50% { transform: rotate(-60deg); } 
            }
            .anim-shin { animation: kick 2.5s infinite ease-in-out; transform-origin: 135px 175px; }
        `;
        svgContent = `
            <!-- Chair -->
            <rect x="90" y="120" width="10" height="70" fill="${machineColor}" />
            <rect x="100" y="180" width="40" height="10" fill="${machineColor}" />
            <rect x="110" y="190" width="5" height="40" fill="${machineDark}" /> <!-- Leg post -->

            <!-- Person -->
            ${drawHead(105, 105)}
            ${drawTorso(93, 120)}
            
            <!-- Thigh (Fixed) -->
            ${drawLimb(105, 175, 135, 175, skinColor)}
            
            <!-- Shin (Moving) -->
            <g class="anim-shin">
                ${drawLimb(135, 175, 135, 215, skinColor)}
                <circle cx="140" cy="210" r="10" fill="${machineDark}" /> <!-- Pad -->
                <path d="M135 175 L160 175" stroke="none" fill="none" /> <!-- Ref for angle -->
            </g>
            <circle cx="115" cy="170" r="8" fill="${accentColor}" opacity="0.6" />
        `;
    }
    // Leg Curl (Lying or Seated - Visualizing Lying)
    else if (name.includes('curl') && name.includes('leg') || name.includes('腿彎')) {
        cssStyles = `
            @keyframes legCurl { 
                0%, 100% { transform: rotate(0deg); } 
                50% { transform: rotate(-80deg); } 
            }
            .anim-curl-leg { animation: legCurl 2.5s infinite ease-in-out; transform-origin: 120px 160px; }
        `;
        svgContent = `
            <!-- Bench -->
            <rect x="50" y="170" width="100" height="10" fill="${machineColor}" />
            <rect x="140" y="180" width="10" height="40" fill="${machineDark}" />

            <!-- Person (Lying face down) -->
            ${drawHead(60, 160)}
            <rect x="70" y="155" width="60" height="20" rx="5" fill="${skinColor}" />
            
            <!-- Leg -->
            <g class="anim-curl-leg">
                <!-- Thigh -->
                ${drawLimb(120, 160, 150, 160, skinColor)} 
                <!-- Shin -->
                <line x1="150" y1="160" x2="180" y2="160" stroke="${skinColor}" stroke-width="14" stroke-linecap="round" />
                <circle cx="170" cy="150" r="10" fill="${machineDark}" /> <!-- Pad -->
            </g>
            <circle cx="140" cy="165" r="8" fill="${accentColor}" opacity="0.6" />
        `;
    }
    // Calf Raises (Standing)
    else if (name.includes('calf') || name.includes('小腿')) {
        cssStyles = `
            @keyframes calf { 
                0%, 100% { transform: translateY(0); } 
                50% { transform: translateY(-10px); } 
            }
            .anim-calf { animation: calf 2s infinite ease-in-out; }
        `;
        svgContent = `
            <rect x="90" y="220" width="40" height="10" fill="${machineDark}" /> <!-- Step -->
            
            <g class="anim-calf">
                ${drawHead(110, 70)}
                ${drawTorso(98, 90)}
                ${drawLimb(105, 150, 105, 220, skinColor)}
                ${drawLimb(115, 150, 115, 220, skinColor)}
            </g>
            <circle cx="110" cy="200" r="6" fill="${accentColor}" opacity="0.6" />
        `;
    }
    
    // --- 5. SQUAT / LUNGE ---
    
    else if (name.includes('squat') || name.includes('lunge') || name.includes('深蹲') || name.includes('弓箭步')) {
        const isSplit = name.includes('split') || name.includes('lunge') || name.includes('弓箭');
        cssStyles = `
            @keyframes squat { 
                0%, 100% { transform: translateY(0); } 
                50% { transform: translateY(30px); } 
            }
            .anim-squat { animation: squat 2.5s infinite ease-in-out; }
        `;
        
        if (isSplit) {
             svgContent = `
                <g class="anim-squat">
                    ${drawHead(100, 70)}
                    ${drawTorso(88, 90)}
                    <!-- Front Leg -->
                    <path d="M95 140 L 120 170 L 120 220" stroke="${skinColor}" stroke-width="14" fill="none" stroke-linecap="round" />
                    <!-- Back Leg -->
                    <path d="M105 140 L 70 180 L 50 220" stroke="${skinColor}" stroke-width="14" fill="none" stroke-linecap="round" />
                </g>
                <circle cx="95" cy="140" r="8" fill="${accentColor}" opacity="0.6" />
             `;
        } else {
             svgContent = `
                <g class="anim-squat">
                    ${drawHead(100, 70)}
                    ${drawTorso(88, 90)}
                    <!-- Legs -->
                    <path d="M95 145 L 80 180 L 80 230" stroke="${skinColor}" stroke-width="14" fill="none" stroke-linecap="round" />
                    <path d="M105 145 L 120 180 L 120 230" stroke="${skinColor}" stroke-width="14" fill="none" stroke-linecap="round" />
                    <!-- Goblet or Air hands -->
                    <circle cx="100" cy="110" r="8" fill="#555" />
                </g>
                <circle cx="100" cy="150" r="8" fill="${accentColor}" opacity="0.6" />
             `;
        }
    }

    // --- 6. CORE / FLOOR ---
    
    else if (name.includes('plank') || name.includes('dead bug') || name.includes('平板')) {
        const isDeadBug = name.includes('dead') || name.includes('死蟲');
        if (isDeadBug) {
             cssStyles = `
                @keyframes deadbug { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(10deg); } }
                .anim-limbs { animation: deadbug 2s infinite ease-in-out; transform-origin: 100px 150px; }
             `;
             svgContent = `
                ${drawHead(60, 150)}
                <rect x="70" y="140" width="70" height="20" rx="5" fill="${skinColor}" />
                <g class="anim-limbs">
                    <line x1="120" y1="140" x2="150" y2="100" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" /> <!-- Leg -->
                    <line x1="90" y1="140" x2="90" y2="100" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" /> <!-- Arm -->
                </g>
                <circle cx="100" cy="150" r="8" fill="${accentColor}" opacity="0.6" />
             `;
        } else {
             // Plank
             svgContent = `
                <line x1="20" y1="180" x2="180" y2="180" stroke="#e5e7eb" stroke-width="2" />
                <line x1="50" y1="160" x2="150" y2="150" stroke="${skinColor}" stroke-width="20" stroke-linecap="round" />
                <circle cx="150" cy="150" r="12" fill="${skinColor}" />
                <line x1="60" y1="160" x2="60" y2="180" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" /> <!-- Elbow -->
                <line x1="140" y1="150" x2="140" y2="180" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" /> <!-- Toe -->
                <circle cx="100" cy="155" r="8" fill="${accentColor}" opacity="0.6" />
             `;
        }
    }

    // --- 7. ARMS (Isolation) ---
    
    else if (name.includes('curl') || name.includes('extension') || name.includes('tricep') || name.includes('bicep') || name.includes('彎舉')) {
        const isTri = name.includes('extension') || name.includes('skull') || name.includes('三頭');
        cssStyles = `
            @keyframes armiso { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(${isTri ? '90deg' : '-90deg'}); } }
            .anim-arm { animation: armiso 2.5s infinite ease-in-out; transform-origin: 100px 110px; }
        `;
        svgContent = `
            ${drawHead(100, 70)}
            ${drawTorso(88, 90)}
            ${drawLimb(95, 150, 95, 200, skinColor)}
            ${drawLimb(105, 150, 105, 200, skinColor)}
            
            ${drawLimb(100, 90, 100, 130, skinColor)} <!-- Upper Arm fixed -->
            
            <g class="anim-arm">
                <line x1="100" y1="130" x2="100" y2="170" stroke="${skinColor}" stroke-width="12" stroke-linecap="round" />
                <circle cx="100" cy="170" r="8" fill="#555" />
            </g>
            <circle cx="100" cy="110" r="6" fill="${accentColor}" opacity="0.6" />
        `;
    }

    // --- 8. DEFAULT / GENERIC ---
    else {
        cssStyles = `
            @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.02); } }
            .anim-pulse { animation: pulse 3s infinite ease-in-out; transform-origin: center; }
        `;
        svgContent = `
            <g class="anim-pulse">
                ${drawHead(100, 70)}
                ${drawTorso(88, 90)}
                ${drawLimb(90, 100, 70, 150, skinColor)}
                ${drawLimb(110, 100, 130, 150, skinColor)}
                ${drawLimb(95, 145, 90, 220, skinColor)}
                ${drawLimb(105, 145, 110, 220, skinColor)}
            </g>
        `;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250" style="background-color: #f8fafc;">
        <style>${cssStyles}</style>
        <rect width="100%" height="100%" fill="white" />
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="1"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <line x1="0" y1="230" x2="200" y2="230" stroke="#e2e8f0" stroke-width="2" />
        
        <g transform="translate(0, 0)">
            ${svgContent}
        </g>
        
        <text x="100" y="245" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="middle" letter-spacing="1">GOHOPRO TECH: ${tutorial.bodyPart}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  const handleGenerateImage = async (tutorial: Tutorial) => {
    setIsGenerating(true);
    
    // Check if API key is available
    const hasKey = !!process.env.API_KEY || (window as any).aistudio;

    if (!hasKey) {
        // Fallback to offline placeholder logic (already displayed, just stop spinner)
        setTimeout(() => {
            setIsGenerating(false);
            // Optionally alert user or just stay on placeholder
        }, 800); 
        return;
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // PROMPT OPTIMIZED FOR SIMPLE, CLEAR LINE ART with Visual Cues
        const prompt = `Create a professional, minimalist technical illustration of the fitness exercise: "${tutorial.name}".
                    Style: High-quality vector line art on a white background.
                    Details: Show the character performing the movement with perfect form.
                    Highlights: subtle cyan highlight on the ${tutorial.bodyPart}.
                    Additions: Use simple arrows to indicate the direction of movement.
                    Aesthetic: Clean, modern, medical/fitness app style. No text, no background elements.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                    imageSize: "1K"
                }
            }
        });

        // Find image part
        let imageUrl = '';
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    break;
                }
            }
        }

        if (imageUrl) {
            setGeneratedImages(prev => ({ ...prev, [tutorial.id]: imageUrl }));
            setDisplayImage(imageUrl);
        } 

    } catch (error: any) {
        console.error("Failed to generate image:", error);
        
        // Error handling: ensure spinner stops, fallback remains
        const errorMessage = error.message || error.error?.message || JSON.stringify(error);
        if (errorMessage.includes('Rpc failed') || errorMessage.includes('xhr error')) {
             // connection error
        } else if ((error.status === 403 || errorMessage.includes('PERMISSION_DENIED')) && (window as any).aistudio) {
             console.warn("Permission denied, using offline image.");
        }
    } finally {
        setIsGenerating(false);
    }
  };

  // --- Category Grid Component ---
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-neon-blue to-neon-green bg-clip-text text-transparent">動作實驗室</h2>
            <p className="text-sm text-gray-500 mt-1">互動式肌群導航與技能樹</p>
          </div>
          
          {selectedBodyPart !== '全部' && (
              <button 
                onClick={() => handleBodyPartSelect('全部')}
                className="self-start md:hidden mb-2 text-sm font-bold text-gray-500 flex items-center gap-1"
              >
                  <ArrowLeft size={16} /> 返回分類
              </button>
          )}

          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="搜尋技能..." 
               className="w-full pl-10 pr-4 py-2 bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 rounded-full outline-none focus:border-neon-blue transition-colors"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Interactive Map (Hidden on mobile when selecting categories to save space, but visible on desktop) */}
          <div className="hidden lg:block w-full lg:w-1/3 flex-shrink-0">
             <div className="lg:sticky lg:top-24 space-y-4">
                 <div className="bg-white dark:bg-charcoal-800 rounded-3xl shadow-inner border border-gray-100 dark:border-charcoal-700 h-[360px]">
                    <BodyMap 
                        selectedPart={selectedBodyPart} 
                        onSelect={handleBodyPartSelect} 
                        view={bodyMapView}
                        toggleView={() => setBodyMapView(v => v === 'FRONT' ? 'BACK' : 'FRONT')}
                    />
                 </div>
                 
                 {/* Equipment Filter Chips */}
                 <div className="flex flex-wrap gap-2 justify-center">
                    {equipments.map(eq => (
                        <button 
                            key={eq}
                            onClick={() => setSelectedEquipment(eq)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                selectedEquipment === eq 
                                ? 'border-neon-blue bg-neon-blue/10 text-neon-blue' 
                                : 'border-transparent bg-white dark:bg-charcoal-800 text-gray-500 hover:border-gray-300 dark:hover:border-charcoal-600'
                            }`}
                        >
                            {eq}
                        </button>
                    ))}
                 </div>
             </div>
          </div>

          {/* Right Column: Content Area */}
          <div className="flex-1">
             
             {/* If no body part selected (or '全部'), show Category Grid */}
             {selectedBodyPart === '全部' && !searchTerm ? (
                 <CategoryGrid />
             ) : (
                 // If body part selected OR searching, show List
                 <div className="animate-fade-in">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => handleBodyPartSelect('全部')}
                                className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-charcoal-800 hover:bg-gray-200 dark:hover:bg-charcoal-700 transition-colors"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {selectedBodyPart === '其他' ? '核心與其他' : (selectedBodyPart === '全部' ? '搜尋結果' : `${selectedBodyPart}訓練`)}
                                <span className="bg-gray-200 dark:bg-charcoal-700 text-xs px-2 py-0.5 rounded-full text-gray-500">{filteredData.length}</span>
                            </h3>
                        </div>
                     </div>

                     {/* Sub-category Filter (Visible when a BodyPart is selected) */}
                     {selectedBodyPart !== '全部' && availableSubCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
                            <button 
                                onClick={() => setSelectedSubCategory('全部')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedSubCategory === '全部'
                                    ? 'bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-700'
                                }`}
                            >
                                全部部位
                            </button>
                            {availableSubCategories.map(sub => (
                                <button 
                                    key={sub}
                                    onClick={() => setSelectedSubCategory(sub)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        selectedSubCategory === sub
                                        ? 'bg-neon-green text-charcoal-900 shadow-sm' 
                                        : 'bg-gray-100 dark:bg-charcoal-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-charcoal-700'
                                    }`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredData.length > 0 ? (
                            filteredData.map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedTutorial(item)}
                                className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-charcoal-700 hover:border-neon-blue hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                            >
                                {/* Difficulty Stripe */}
                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gray-100 dark:bg-charcoal-900">
                                    <div className={`h-full ${getDifficultyColor(item.difficulty)}`} style={{ height: item.difficulty === '初學者' ? '33%' : item.difficulty === '中級' ? '66%' : '100%' }}></div>
                                </div>

                                <div className="pl-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-base text-gray-800 dark:text-gray-100 group-hover:text-neon-blue transition-colors">{item.name}</h4>
                                        <ChevronRight size={16} className="text-gray-300 dark:text-charcoal-600 group-hover:text-neon-blue transition-colors" />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.equipment === '徒手' ? 'border-neon-green text-neon-green' : item.equipment === '啞鈴' ? 'border-neon-purple text-neon-purple' : 'border-neon-blue text-neon-blue'}`}>
                                            {item.equipment}
                                        </span>
                                        {item.subCategory && (
                                            <span className="text-[10px] bg-gray-100 dark:bg-charcoal-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                                {item.subCategory}
                                            </span>
                                        )}
                                    </div>

                                    {/* Muscles Targeted Text */}
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-charcoal-800/50 rounded-3xl border-dashed border-2 border-gray-200 dark:border-charcoal-700">
                                <Dumbbell className="mb-3 opacity-20" size={48} />
                                <p>此篩選條件下無動作</p>
                                <button 
                                onClick={() => {setSearchTerm(''); setSelectedEquipment('全部'); setSelectedBodyPart('全部'); setSelectedSubCategory('全部');}}
                                className="mt-2 text-neon-blue hover:underline text-sm font-bold"
                                >
                                    重置篩選
                                </button>
                            </div>
                        )}
                     </div>
                 </div>
             )}
          </div>
      </div>

      {/* Detail Modal */}
      {selectedTutorial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-charcoal-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto flex flex-col">
             
             {/* Modal Header Image Area */}
             <div className="relative h-64 md:h-80 bg-gray-100 dark:bg-black border-b border-gray-200 dark:border-charcoal-700 shrink-0 group">
                <button 
                  onClick={() => setSelectedTutorial(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-20"
                >
                    <X size={20} />
                </button>

                <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
                     {/* Background Grid */}
                     {!displayImage && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none" 
                            style={{ backgroundImage: 'radial-gradient(circle, #555 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                        </div>
                     )}

                     {displayImage ? (
                         <img src={displayImage} alt={selectedTutorial.name} className="w-full h-full object-contain p-4 animate-fade-in bg-white" />
                     ) : (
                         <div className="flex flex-col items-center justify-center h-full text-gray-400">
                             <Loader2 className="animate-spin mb-2" />
                             <span className="text-xs">載入圖解中...</span>
                         </div>
                     )}
                </div>

                {/* Generate AI Button - Show if using fallback or no image */}
                {(!generatedImages[selectedTutorial.id] || displayImage !== generatedImages[selectedTutorial.id]) && (
                    <div className="absolute inset-x-0 bottom-6 flex items-center justify-center z-20 pointer-events-none">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateImage(selectedTutorial);
                            }}
                            disabled={isGenerating}
                            className="pointer-events-auto bg-neon-blue hover:bg-cyan-400 text-charcoal-900 px-6 py-3 rounded-full font-bold shadow-xl shadow-neon-blue/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="animate-spin text-charcoal-900" size={20} />
                                    <span>AI 繪製中...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="text-charcoal-900 group-hover/btn:animate-pulse" size={20} />
                                    <span>AI 高清圖解</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
             </div>
             
             <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                {/* Content */}
                <div className="flex-1 space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-black tracking-wider uppercase bg-neon-blue text-charcoal-900 px-2 py-1 rounded">{selectedTutorial.bodyPart}</span>
                            {selectedTutorial.subCategory && (
                                <span className="text-xs font-bold bg-charcoal-100 dark:bg-charcoal-700 text-gray-500 dark:text-gray-300 px-2 py-1 rounded">
                                    {selectedTutorial.subCategory}
                                </span>
                            )}
                            <span className="text-xs font-bold border border-gray-300 dark:border-charcoal-600 px-2 py-1 rounded text-gray-500">{selectedTutorial.equipment}</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-3">{selectedTutorial.name}</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{selectedTutorial.description}</p>
                    </div>

                    <div className="bg-neon-green/5 p-5 rounded-2xl border border-neon-green/20">
                        <h4 className="font-bold text-neon-green flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                            <Zap size={16} /> 關鍵技巧
                        </h4>
                        <ul className="space-y-3">
                            {selectedTutorial.tips.map((tip, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300 items-start">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-green shrink-0"></div>
                                    <span className="leading-relaxed">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="w-full md:w-48 shrink-0 space-y-4">
                    <div className="bg-gray-50 dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-100 dark:border-charcoal-700">
                         <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><BarChart2 size={12}/> 難度等級</h5>
                         <div className="w-full h-2 bg-gray-200 dark:bg-charcoal-700 rounded-full overflow-hidden mb-1">
                             <div className={`h-full ${getDifficultyColor(selectedTutorial.difficulty)}`} style={{ width: getDifficultyWidth(selectedTutorial.difficulty) }}></div>
                         </div>
                         <div className="text-right text-xs font-bold text-gray-600 dark:text-gray-300">{selectedTutorial.difficulty}</div>
                    </div>

                    <div className="bg-gray-50 dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-100 dark:border-charcoal-700 flex flex-col items-center text-center">
                        <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Info size={12}/> 目標肌群</h5>
                        {/* Mini Map Highlight - FIXED: Added aspect ratio container and overflow-hidden */}
                        <div className="w-full aspect-[2/3] relative flex items-center justify-center p-2 bg-gray-100 dark:bg-black rounded-lg overflow-hidden border border-gray-200 dark:border-charcoal-800">
                             <div className="w-full h-full scale-[1.2] origin-center">
                                 <BodyMap 
                                    selectedPart={selectedTutorial.bodyPart} 
                                    onSelect={() => {}} 
                                    view={selectedTutorial.bodyPart === '背部' ? 'BACK' : 'FRONT'}
                                    toggleView={() => {}}
                                 />
                             </div>
                             {/* Overlay to disable clicking in mini-map */}
                             <div className="absolute inset-0 z-20"></div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setSelectedTutorial(null)}
                        className="w-full py-3 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-bold rounded-xl active:scale-95 transition-transform shadow-lg"
                        >
                        關閉
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tutorials;
