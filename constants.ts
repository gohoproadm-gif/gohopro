
import { View, WorkoutRecord, DailyPlan, MacroData, WeightData, StrengthData, NutritionLog, UserProfile, Tutorial } from './types';

export const APP_NAME = "Gohopro";

const todayStr = new Date().toISOString().split('T')[0];

export const HK_HOLIDAYS: Record<string, string> = {
  // 2024 Holidays
  '2024-01-01': '元旦',
  '2024-02-10': '農曆年初一',
  '2024-02-12': '農曆年初三',
  '2024-02-13': '農曆年初四',
  '2024-03-29': '耶穌受難節',
  '2024-03-30': '受難節翌日',
  '2024-04-01': '復活節星期一',
  '2024-04-04': '清明節',
  '2024-05-01': '勞動節',
  '2024-05-15': '佛誕',
  '2024-06-10': '端午節',
  '2024-07-01': '特區成立日',
  '2024-09-18': '中秋節翌日',
  '2024-10-01': '國慶日',
  '2024-10-11': '重陽節',
  '2024-12-25': '聖誕節',
  '2024-12-26': '聖誕節後周日',
  
  // 2025 Holidays
  '2025-01-01': '元旦',
  '2025-01-29': '農曆年初一',
  '2025-01-30': '農曆年初二',
  '2025-01-31': '農曆年初三',
  '2025-04-04': '清明節',
  '2025-04-18': '耶穌受難節',
  '2025-04-19': '受難節翌日',
  '2025-04-21': '復活節星期一',
  '2025-05-01': '勞動節',
  '2025-05-05': '佛誕',
  '2025-05-31': '端午節',
  '2025-07-01': '特區成立日',
  '2025-10-01': '國慶日',
  '2025-10-07': '中秋節翌日',
  '2025-10-29': '重陽節',
  '2025-12-25': '聖誕節',
  '2025-12-26': '聖誕節後周日',
};

export const MOCK_HISTORY: WorkoutRecord[] = [
  { id: '1', date: '2023-10-26', type: '胸部與三頭肌', duration: 45, calories: 320, completed: true },
  { id: '2', date: '2023-10-25', type: '有氧跑步', duration: 30, calories: 280, completed: true },
  { id: '3', date: '2023-10-24', type: '背部與二頭肌', duration: 50, calories: 350, completed: true },
  { id: '4', date: '2023-10-22', type: '腿部訓練', duration: 60, calories: 450, completed: true },
  { id: '5', date: '2023-10-21', type: '瑜伽伸展', duration: 20, calories: 120, completed: true },
];

export const DEFAULT_PLANS: DailyPlan[] = [
  {
    id: 'p1',
    title: "強力胸肌轟炸",
    focus: "胸部 / 三頭肌",
    duration: 45,
    exercises: [
      { id: 'w1', name: '彈力帶擴胸', sets: 2, reps: '20', completed: false, section: 'warmup' },
      { id: 'e1', name: '槓鈴臥推', sets: 4, reps: '8-10', completed: false, section: 'main' },
      { id: 'e2', name: '上斜啞鈴推舉', sets: 3, reps: '10-12', completed: false, section: 'main' },
      { id: 'e3', name: '繩索夾胸', sets: 3, reps: '12-15', completed: false, section: 'main' },
      { id: 'e4', name: '三頭肌下壓', sets: 3, reps: '12-15', completed: false, section: 'main' },
      { id: 'c1', name: '捲腹', sets: 3, reps: '20', completed: false, section: 'core' },
    ]
  },
  {
    id: 'p2',
    title: "背部增肌日",
    focus: "背部 / 二頭肌",
    duration: 50,
    exercises: [
      { id: 'w1', name: '貓牛式伸展', sets: 2, reps: '60秒', completed: false, section: 'warmup' },
      { id: 'b1', name: '引體向上', sets: 4, reps: '力竭', completed: false, section: 'main' },
      { id: 'b2', name: '槓鈴划船', sets: 4, reps: '8-10', completed: false, section: 'main' },
      { id: 'b3', name: '高位下拉', sets: 3, reps: '10-12', completed: false, section: 'main' },
      { id: 'b4', name: '二頭肌彎舉', sets: 3, reps: '12-15', completed: false, section: 'main' },
      { id: 'c1', name: '平板支撐', sets: 3, reps: '60秒', completed: false, section: 'core' },
    ]
  },
  {
    id: 'p3',
    title: "核心燃燒",
    focus: "腹肌 / 核心",
    duration: 20,
    exercises: [
      { id: 'w1', name: '開合跳', sets: 2, reps: '30秒', completed: false, section: 'warmup' },
      { id: 'c1', name: '平板支撐', sets: 3, reps: '60秒', completed: false, section: 'main' },
      { id: 'c2', name: '捲腹', sets: 3, reps: '20', completed: false, section: 'main' },
      { id: 'c3', name: '俄羅斯轉體', sets: 3, reps: '20', completed: false, section: 'main' },
    ]
  }
];

export const TODAY_PLAN = DEFAULT_PLANS[0]; 

export const WEIGHT_DATA: WeightData[] = [
  { date: '10/01', weight: 75.0 },
  { date: '10/08', weight: 74.5 },
  { date: '10/15', weight: 74.2 },
  { date: '10/22', weight: 73.8 },
  { date: '10/29', weight: 73.5 },
];

export const STRENGTH_DATA: StrengthData[] = [
  { exercise: '深蹲', weight: 100 },
  { exercise: '硬舉', weight: 120 },
  { exercise: '臥推', weight: 85 },
  { exercise: '肩推', weight: 60 },
];

export const MACRO_DATA: MacroData[] = [
  { name: '蛋白質', value: 150, fill: '#a3e635' }, // neon-green
  { name: '碳水化合物', value: 200, fill: '#22d3ee' }, // neon-blue
  { name: '脂肪', value: 65, fill: '#c084fc' }, // neon-purple
];

export const NUTRITION_LOGS: NutritionLog[] = [
  { id: 'n1', date: todayStr, time: '08:00', item: '燕麥粥 + 蛋白粉', calories: 450, macros: { p: 30, c: 50, f: 10 } },
  { id: 'n2', date: todayStr, time: '12:30', item: '雞胸肉沙拉', calories: 550, macros: { p: 45, c: 20, f: 25 } },
  { id: 'n3', date: todayStr, time: '16:00', item: '希臘優格', calories: 150, macros: { p: 15, c: 10, f: 5 } },
];

export const USER_PROFILE: UserProfile = {
  name: 'Alex',
  height: 178,
  weight: 75,
  age: 28,
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'gain_muscle'
};

export const MOTIVATIONAL_QUOTES = [
  "痛苦是暫時的，榮耀是永恆的。",
  "不要等待機會，要創造機會。",
  "唯一的極限是你自己。",
  "今天的汗水是明天的微笑。"
];

// --- HELPER: Generate IMPROVED SVG Data URIs with ANIMATIONS ---
type PoseVariant = 'press_side' | 'press_front' | 'fly_front' | 'pull_back' | 'pull_side' | 'squat_side' | 'curl_side' | 'row_side' | 'hinge_side' | 'plank_side' | 'raise_front' | 'raise_side' | 'press_back';

const getTutorialImage = (
    type: 'MACHINE_UPPER' | 'MACHINE_LOWER' | 'DUMBBELL' | 'BODYWEIGHT' | 'BARBELL', 
    highlight: string,
    variant: PoseVariant = 'press_side'
) => {
    const colors: Record<string, string> = {
        '胸部': '#f97316', '背部': '#c084fc', '腿部': '#a3e635', 
        '肩膀': '#22d3ee', '手臂': '#facc15', '核心': '#f87171', '有氧': '#2dd4bf',
        'DEFAULT': '#9ca3af'
    };
    const accent = colors[highlight] || colors['DEFAULT'];
    
    const bg = `<rect width="100%" height="100%" fill="#f8fafc"/>
                <path d="M0 0 L400 300 M400 0 L0 300" stroke="#e2e8f0" stroke-width="0.5" />
                <rect x="0" y="0" width="400" height="300" fill="url(#grid)" />`;
    
    const defs = `<defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="1"/>
                    </pattern>
                    <marker id="arrowHead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                    </marker>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>`;

    const bodyColor = "#334155";
    const propColor = "#94a3b8"; 
    const weightColor = "#1e293b"; 

    // Smooth animation attributes
    const anim = (dur = "2s") => `dur="${dur}" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"`;

    // Static Parts
    const headFront = `<circle cx="200" cy="70" r="18" fill="${bodyColor}" />`;
    const torsoFront = `<path d="M180 90 L220 90 L210 180 L190 180 Z" stroke="${bodyColor}" stroke-width="32" stroke-linejoin="round" />`;
    const torsoBack = `<path d="M170 90 L230 90 L210 180 L190 180 Z" stroke="${bodyColor}" stroke-width="32" stroke-linejoin="round" />`;
    const headSide = `<circle cx="160" cy="80" r="18" fill="${bodyColor}" />`;
    const torsoSideVertical = `<path d="M160 95 L160 180" stroke="${bodyColor}" stroke-width="32" stroke-linecap="round" />`;
    const legsFrontSitting = `<path d="M190 180 L170 240" stroke="${bodyColor}" stroke-width="18" stroke-linecap="round" /><path d="M210 180 L230 240" stroke="${bodyColor}" stroke-width="18" stroke-linecap="round" />`;
    const legsFrontStanding = `<path d="M190 180 L185 260" stroke="${bodyColor}" stroke-width="18" stroke-linecap="round" /><path d="M210 180 L215 260" stroke="${bodyColor}" stroke-width="18" stroke-linecap="round" />`;
    const legsSideSitting = `<path d="M160 180 L220 185" stroke="${bodyColor}" stroke-width="24" stroke-linecap="round" /><path d="M220 185 L225 250" stroke="${bodyColor}" stroke-width="18" stroke-linecap="round" />`;
    const legsSideStanding = `<path d="M160 180 L160 260" stroke="${bodyColor}" stroke-width="22" stroke-linecap="round" />`;
    const torsoLying = `<path d="M150 210 L250 210" stroke="${bodyColor}" stroke-width="35" stroke-linecap="round" />`;
    const legsLying = `<path d="M250 210 L280 230" stroke="${bodyColor}" stroke-width="25" stroke-linecap="round" /><path d="M280 230 L280 280" stroke="${bodyColor}" stroke-width="18" stroke-linecap="round" />`;

    let content = '';

    switch (variant) {
        case 'press_front': // Shoulder Press
            content = `
                ${headFront} ${torsoFront} ${type.includes('MACHINE') ? `<rect x="150" y="200" width="100" height="10" fill="${propColor}" />` : legsFrontSitting}
                <g>
                    <!-- Moving Arms Group -->
                    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-40; 0,0" ${anim('2s')} />
                    <path d="M180 100 L150 100 L150 50" stroke="${bodyColor}" stroke-width="15" fill="none" stroke-linecap="round" />
                    <path d="M220 100 L250 100 L250 50" stroke="${bodyColor}" stroke-width="15" fill="none" stroke-linecap="round" />
                    ${type === 'DUMBBELL' ? `
                        <rect x="130" y="40" width="40" height="10" rx="2" fill="${weightColor}" />
                        <rect x="230" y="40" width="40" height="10" rx="2" fill="${weightColor}" />
                    ` : `<line x1="100" y1="50" x2="300" y2="50" stroke="${propColor}" stroke-width="8" />`}
                </g>
                <circle cx="170" cy="95" r="10" fill="${accent}" filter="url(#glow)" opacity="0.7"><animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" /></circle>
                <circle cx="230" cy="95" r="10" fill="${accent}" filter="url(#glow)" opacity="0.7"><animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" /></circle>
                <path d="M150 80 L150 30" stroke="#ef4444" stroke-width="4" marker-end="url(#arrowHead)" opacity="0.5" />
            `;
            break;

        case 'fly_front': // Lateral Raise
            content = `
                ${headFront} ${torsoFront} ${legsFrontStanding}
                <!-- Left Arm -->
                <g transform="rotate(0 180 100)">
                    <animateTransform attributeName="transform" type="rotate" values="0 180 100; -80 180 100; 0 180 100" ${anim('2.5s')} />
                    <path d="M180 100 L120 110" stroke="${bodyColor}" stroke-width="14" stroke-linecap="round" />
                    <circle cx="115" cy="115" r="8" fill="${weightColor}" />
                </g>
                <!-- Right Arm -->
                <g transform="rotate(0 220 100)">
                    <animateTransform attributeName="transform" type="rotate" values="0 220 100; 80 220 100; 0 220 100" ${anim('2.5s')} />
                    <path d="M220 100 L280 110" stroke="${bodyColor}" stroke-width="14" stroke-linecap="round" />
                    <circle cx="285" cy="115" r="8" fill="${weightColor}" />
                </g>
                <circle cx="170" cy="100" r="10" fill="${accent}" filter="url(#glow)" opacity="0.7"/>
                <circle cx="230" cy="100" r="10" fill="${accent}" filter="url(#glow)" opacity="0.7"/>
            `;
            break;

        case 'pull_back': // Lat Pulldown / Pull Up
            content = `
                ${headFront} ${torsoBack} ${type.includes('MACHINE') ? `<rect x="160" y="200" width="80" height="10" fill="${propColor}" />` : legsFrontStanding}
                <g>
                    <!-- Pulling Motion -->
                    <animateTransform attributeName="transform" type="translate" values="0,0; 0,50; 0,0" ${anim('2.5s')} />
                    <path d="M170 100 L130 50" stroke="${bodyColor}" stroke-width="18" stroke-linecap="round" />
                    <path d="M230 100 L270 50" stroke="${bodyColor}" stroke-width="18" stroke-linecap="round" />
                    <line x1="100" y1="50" x2="300" y2="50" stroke="${propColor}" stroke-width="8" stroke-linecap="round" />
                    ${type.includes('MACHINE') ? `<line x1="200" y1="50" x2="200" y2="0" stroke="#1e293b" stroke-width="4" />` : ''}
                </g>
                <path d="M180 120 L200 160 L220 120 Z" fill="${accent}" filter="url(#glow)" opacity="0.6"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" /></path>
                <path d="M130 40 L130 100" stroke="#ef4444" stroke-width="4" marker-end="url(#arrowHead)" opacity="0.5" />
            `;
            break;

        case 'press_side': // Bench / Machine Press
            if (type === 'DUMBBELL' || type === 'BARBELL' || type === 'BODYWEIGHT') {
                if (type === 'BODYWEIGHT') { // Push Up
                     content = `
                        <rect x="50" y="260" width="300" height="4" rx="2" fill="${propColor}" />
                        <g>
                             <!-- Pivot at feet (100, 240 approx) -->
                             <animateTransform attributeName="transform" type="rotate" values="0 90 260; -15 90 260; 0 90 260" ${anim('2s')} />
                             <path d="M100 240 L250 200" stroke="${bodyColor}" stroke-width="35" stroke-linecap="round" />
                             <circle cx="260" cy="190" r="18" fill="${bodyColor}" />
                             <path d="M240 205 L240 260" stroke="${bodyColor}" stroke-width="15" stroke-linecap="round" /> <!-- Arm -->
                             <path d="M100 240 L90 260" stroke="${bodyColor}" stroke-width="15" stroke-linecap="round" />
                             <rect x="150" y="210" width="80" height="20" fill="${accent}" opacity="0.6" transform="rotate(-15 190 220)" filter="url(#glow)" />
                        </g>
                     `;
                } else { // Bench Press
                    content = `
                        <rect x="100" y="220" width="200" height="15" rx="5" fill="${propColor}" />
                        <rect x="120" y="235" width="10" height="30" fill="${propColor}" />
                        <rect x="270" y="235" width="10" height="30" fill="${propColor}" />
                        <circle cx="130" cy="200" r="18" fill="${bodyColor}" />
                        ${torsoLying} ${legsLying}
                        <g>
                            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-50; 0,0" ${anim('2s')} />
                            <path d="M170 200 L170 130" stroke="${bodyColor}" stroke-width="18" stroke-linecap="round" />
                            ${type === 'DUMBBELL' ? 
                                `<rect x="150" y="120" width="40" height="10" rx="2" fill="${weightColor}" />` : 
                                `<line x1="140" y1="130" x2="200" y2="130" stroke="${weightColor}" stroke-width="6" />`
                            }
                        </g>
                        <ellipse cx="170" cy="200" rx="15" ry="10" fill="${accent}" filter="url(#glow)" opacity="0.7" />
                    `;
                }
            } else { // Machine Press
                content = `
                    <path d="M130 80 L120 200 L110 260" stroke="${propColor}" stroke-width="12" stroke-linecap="round" fill="none" />
                    <rect x="125" y="180" width="100" height="10" rx="2" fill="${propColor}" />
                    ${legsSideSitting} 
                    <path d="M160 95 L150 180" stroke="${bodyColor}" stroke-width="32" stroke-linecap="round" />
                    ${headSide}
                    <g>
                        <animateTransform attributeName="transform" type="translate" values="0,0; 40,0; 0,0" ${anim('2s')} />
                        <path d="M160 100 L220 100" stroke="${bodyColor}" stroke-width="18" stroke-linecap="round" />
                        <rect x="210" y="90" width="10" height="20" rx="3" fill="#64748b" />
                        <line x1="215" y1="100" x2="280" y2="150" stroke="${propColor}" stroke-width="6" />
                    </g>
                    <circle cx="170" cy="105" r="12" fill="${accent}" filter="url(#glow)" opacity="0.7"/>
                `;
            }
            break;

        case 'row_side': // Row
            content = `
                ${type === 'MACHINE_UPPER' ? 
                    `<rect x="80" y="180" width="80" height="10" fill="${propColor}" /> ${legsSideSitting} ${torsoSideVertical} ${headSide} 
                     <g>
                        <animateTransform attributeName="transform" type="translate" values="0,0; -30,0; 0,0" ${anim('2s')} />
                        <path d="M160 110 L220 110" stroke="${bodyColor}" stroke-width="16" stroke-linecap="round" /> 
                        <line x1="220" y1="110" x2="350" y2="110" stroke="${propColor}" stroke-width="4" />
                     </g>` 
                    : 
                    // DB Bent Over Row
                    `${legsSideStanding} 
                     <path d="M160 170 L210 120" stroke="${bodyColor}" stroke-width="32" stroke-linecap="round" />
                     <circle cx="160" cy="160" r="18" fill="${bodyColor}" />
                     <g>
                        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-30; 0,0" ${anim('2s')} />
                        <path d="M180 140 L180 200" stroke="${bodyColor}" stroke-width="16" stroke-linecap="round" />
                        <rect x="160" y="200" width="40" height="10" rx="2" fill="${weightColor}" />
                     </g>`
                }
                <ellipse cx="150" cy="${type === 'MACHINE_UPPER' ? 120 : 150}" rx="15" ry="20" fill="${accent}" filter="url(#glow)" opacity="0.6" />
            `;
            break;

        case 'squat_side': // Squat / Leg Press
            if (type === 'MACHINE_LOWER') {
                content = `
                    <path d="M80 180 L140 220" stroke="${propColor}" stroke-width="15" stroke-linecap="round" />
                    <path d="M80 180 L60 100" stroke="${propColor}" stroke-width="15" stroke-linecap="round" />
                    <circle cx="80" cy="90" r="18" fill="${bodyColor}" />
                    <path d="M80 110 L120 200" stroke="${bodyColor}" stroke-width="35" stroke-linecap="round" />
                    <g>
                        <!-- Leg Push Animation -->
                        <animate attributeName="d" values="M120 200 L180 150 L240 150; M120 200 L190 180 L260 180; M120 200 L180 150 L240 150" ${anim('3s')} />
                        <path d="M120 200 L180 150 L240 150" stroke="${bodyColor}" stroke-width="22" stroke-linecap="round" fill="none" />
                    </g>
                    <g>
                         <animateTransform attributeName="transform" type="translate" values="0,0; 20,30; 0,0" ${anim('3s')} />
                         <rect x="245" y="100" width="10" height="100" rx="2" fill="#64748b" />
                    </g>
                    <ellipse cx="150" cy="175" rx="20" ry="10" fill="${accent}" opacity="0.6" filter="url(#glow)" transform="rotate(-30 150 175)" />
                `;
            } else { // Squat
                content = `
                    <g>
                        <!-- Squat Motion: Head & Torso move Down -->
                        <animateTransform attributeName="transform" type="translate" values="0,0; 0,40; 0,0" ${anim('3s')} />
                        ${headSide} ${torsoSideVertical}
                        ${type === 'BARBELL' ? `<circle cx="155" cy="95" r="8" fill="${weightColor}" />` : ''}
                    </g>
                    <!-- Legs Morph -->
                    <path stroke="${bodyColor}" stroke-width="24" stroke-linejoin="round" fill="none">
                        <animate attributeName="d" values="M160 180 L160 220 L160 260; M160 180 L200 220 L160 260; M160 180 L160 220 L160 260" ${anim('3s')} />
                    </path>
                    <ellipse cx="180" cy="200" rx="15" ry="25" fill="${accent}" opacity="0.6" filter="url(#glow)" />
                `;
            }
            break;

        case 'curl_side': // Curl
            content = `
                ${legsSideStanding} ${torsoSideVertical} ${headSide}
                <g transform="translate(160,140)"> <!-- Pivot at Elbow -->
                     <animateTransform attributeName="transform" type="rotate" values="0; -100; 0" additive="sum" ${anim('2.5s')} />
                     <path d="M0 0 L40 -20" stroke="${bodyColor}" stroke-width="16" stroke-linecap="round" />
                     <rect x="30" y="-30" width="10" height="20" rx="2" fill="${weightColor}" transform="rotate(-30 40 -20)" />
                </g>
                <path d="M160 100 L160 140" stroke="${bodyColor}" stroke-width="16" stroke-linecap="round" /> <!-- Upper Arm Fixed -->
                <circle cx="160" cy="120" r="12" fill="${accent}" filter="url(#glow)" opacity="0.7" />
            `;
            break;

        default: 
            content = `
                ${legsSideStanding} ${torsoSideVertical} ${headSide}
                <text x="380" y="280" text-anchor="end" fill="#94a3b8" font-size="12" font-weight="bold">GENERIC</text>
            `;
            break;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        ${bg}
        ${defs}
        ${content}
    </svg>`;
    
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const TUTORIALS_DATA: Tutorial[] = [
  // --- 固定器械 (Machines) ---
  {
    id: 'm1',
    name: '胸推機 (Chest Press)',
    bodyPart: '胸部',
    subCategory: '中胸/整體',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '主要訓練胸大肌、前三角肌、三頭肌。軌跡固定，適合新手學習發力。',
    tips: ['座椅調整讓把手在胸線高度', '推到手臂微彎勿鎖死', '肩胛骨後收貼緊椅背', '離心下放要慢'],
    animationType: 'push',
    image: getTutorialImage('MACHINE_UPPER', '胸部', 'press_side')
  },
  {
    id: 'm2',
    name: '坐姿肩推機 (Shoulder Press)',
    bodyPart: '肩膀',
    subCategory: '前束',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '訓練三角肌（前中束）、三頭肌。提供穩定的過頭推舉動作。',
    tips: ['背部貼緊，勿聳肩', '推到頂端手臂微彎', '手肘略微向前，不要完全打開', '核心收緊避免腰椎過度反折'],
    animationType: 'push',
    image: getTutorialImage('MACHINE_UPPER', '肩膀', 'press_front')
  },
  {
    id: 'm3',
    name: '蝴蝶機 (Pec Deck / Fly)',
    bodyPart: '胸部',
    subCategory: '中胸/整體',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '針對胸大肌（特別是內側）的孤立訓練動作。',
    tips: ['手臂微彎，像抱大樹', '勿過度拉開肩關節以免受傷', '合攏時擠壓胸肌停頓一秒', '身體保持穩定不晃動'],
    animationType: 'push',
    image: getTutorialImage('MACHINE_UPPER', '胸部', 'fly_front')
  },
  {
    id: 'm4',
    name: '坐姿划船機 (Seated Cable Row)',
    bodyPart: '背部',
    subCategory: '背闊肌',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '訓練背闊肌、菱形肌、斜方中下、二頭肌。增加背部厚度。',
    tips: ['胸挺、肩下沉', '拉到肚臍附近', '勿用手臂猛拉，用手肘帶動', '回放時感受背肌拉伸'],
    animationType: 'pull',
    image: getTutorialImage('MACHINE_UPPER', '背部', 'row_side')
  },
  {
    id: 'm5',
    name: '高位下拉機 (Lat Pulldown)',
    bodyPart: '背部',
    subCategory: '背闊肌',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '訓練背闊肌、二頭肌。增加背部寬度的首選動作。',
    tips: ['寬握或窄握皆可，保持肩下沉', '拉到上胸位置', '身體勿過度後仰', '頂端稍微停頓擠壓'],
    animationType: 'pull',
    image: getTutorialImage('MACHINE_UPPER', '背部', 'pull_back')
  },
  {
    id: 'm6',
    name: '腿推機 (Leg Press)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '訓練股四頭肌、臀大肌。比深蹲對腰椎壓力小，可安全上大重量。',
    tips: ['腳放高位偏臀，放低位偏股四', '膝蓋推直時勿鎖死', '背部與臀部緊貼椅背', '膝蓋對齊腳尖方向'],
    animationType: 'leg',
    image: getTutorialImage('MACHINE_LOWER', '腿部', 'squat_side')
  },
  {
    id: 'm7',
    name: '腿伸機 (Leg Extension)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '孤立訓練股四頭肌。',
    tips: ['慢放控制離心', '頂端擠壓1秒', '勿用慣性甩動', '椅背調整至膝蓋對準軸心'],
    animationType: 'leg',
    image: getTutorialImage('MACHINE_LOWER', '腿部', 'curl_side')
  },
  {
    id: 'm8',
    name: '腿彎機 (Leg Curl)',
    bodyPart: '腿部',
    subCategory: '腿後肌群',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '訓練腿後肌群（膕繩肌）。',
    tips: ['腳踝墊緊靠', '慢控制放下', '頂端盡量靠近臀部', '保持骨盆穩定不抬起'],
    animationType: 'leg',
    image: getTutorialImage('MACHINE_LOWER', '腿部', 'curl_side')
  },
  {
    id: 'm9',
    name: '大腿外展/內收機 (Abduction/Adduction)',
    bodyPart: '腿部',
    subCategory: '臀部',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '外展練臀中肌/小肌；內收練大腿內側肌群。',
    tips: ['核心收緊', '慢慢推開/夾緊', '控制回程速度', '背部貼緊椅背'],
    animationType: 'leg',
    image: getTutorialImage('MACHINE_LOWER', '腿部', 'fly_front')
  },
  {
    id: 'm10',
    name: '史密斯機 (Smith Machine)',
    bodyPart: '腿部',
    subCategory: '綜合/股四頭',
    equipment: '固定器械',
    difficulty: '中級',
    description: '軌道固定的槓鈴，適合深蹲、臥推、肩推等多種動作。',
    tips: ['適合新手熟悉軌跡', '注意腳的位置與身體重心', '安全扣環要會使用', '勿過度依賴軌道'],
    animationType: 'leg',
    image: getTutorialImage('MACHINE_UPPER', '腿部', 'squat_side')
  },
  // --- 啞鈴 (Dumbbells) ---
  {
    id: 'd1',
    name: '啞鈴臥推 (Dumbbell Bench Press)',
    bodyPart: '胸部',
    subCategory: '中胸/整體',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '胸大肌、三頭、前三角。比槓鈴活動範圍更大，可改善左右不平衡。',
    tips: ['肩胛收緊下沉', '啞鈴路線呈微弧形', '下放到胸側拉伸', '推起時勿鎖死肘關節'],
    animationType: 'push',
    image: getTutorialImage('DUMBBELL', '胸部', 'press_side')
  },
  {
    id: 'd2',
    name: '上斜啞鈴臥推 (Incline Press)',
    bodyPart: '胸部',
    subCategory: '上胸',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '針對上胸、三角肌前束。',
    tips: ['斜板調整約30-45度', '下放時感覺上胸拉伸', '手肘與身體呈45度夾角', '核心收緊'],
    animationType: 'push',
    image: getTutorialImage('DUMBBELL', '胸部', 'press_side')
  },
  {
    id: 'd3',
    name: '啞鈴飛鳥 (Dumbbell Flyes)',
    bodyPart: '胸部',
    subCategory: '中胸/整體',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '胸大肌孤立動作，強調拉伸感。',
    tips: ['手臂微彎固定角度', '像抱大樹一樣開合', '勿下放過低以免傷肩', '專注胸肌收縮'],
    animationType: 'push',
    image: getTutorialImage('DUMBBELL', '胸部', 'fly_front')
  },
  {
    id: 'd4',
    name: '單臂啞鈴划船 (One-Arm Row)',
    bodyPart: '背部',
    subCategory: '背闊肌',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '背闊肌、菱形肌、二頭。單邊訓練效果好。',
    tips: ['一手膝蓋撐椅，背保持平行地面', '拉到髖側（口袋位置）', '肩胛先啟動擠壓', '勿過度扭轉軀幹'],
    animationType: 'pull',
    image: getTutorialImage('DUMBBELL', '背部', 'row_side')
  },
  {
    id: 'd5',
    name: '反向飛鳥 (Reverse Fly)',
    bodyPart: '肩膀',
    subCategory: '後束',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '後三角肌、菱形肌。改善圓肩。',
    tips: ['身體前傾接近平行', '微彎肘，像張開翅膀', '專注後肩發力', '不要聳肩'],
    animationType: 'pull',
    image: getTutorialImage('DUMBBELL', '肩膀', 'fly_front')
  },
  {
    id: 'd6',
    name: '坐姿啞鈴推舉 (Seated DB Press)',
    bodyPart: '肩膀',
    subCategory: '前束',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '三角肌前中束、三頭。建立寬肩。',
    tips: ['核心收緊，背貼椅背', '勿過度後仰', '推到頂端啞鈴可輕碰', '手肘不要完全外展90度'],
    animationType: 'push',
    image: getTutorialImage('DUMBBELL', '肩膀', 'press_front')
  },
  {
    id: 'd7',
    name: '啞鈴側平舉 (Lateral Raise)',
    bodyPart: '肩膀',
    subCategory: '中束',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '三角肌中束。增加肩膀視覺寬度。',
    tips: ['微彎肘', '像倒水一樣抬起手肘', '勿用衝力甩動', '頂端停留1秒'],
    animationType: 'pull',
    image: getTutorialImage('DUMBBELL', '肩膀', 'fly_front')
  },
  {
    id: 'd8',
    name: '啞鈴前平舉 (Front Raise)',
    bodyPart: '肩膀',
    subCategory: '前束',
    equipment: '啞鈴',
    difficulty: '初學者',
    description: '三角肌前束。',
    tips: ['可交替或同時舉起', '勿舉過高超過肩膀太多', '保持身體穩定不晃動', '大拇指朝上或手掌朝下皆可'],
    animationType: 'pull',
    image: getTutorialImage('DUMBBELL', '肩膀', 'curl_side')
  },
  {
    id: 'd9',
    name: '啞鈴彎舉 (Bicep Curl)',
    bodyPart: '手臂',
    subCategory: '二頭肌',
    equipment: '啞鈴',
    difficulty: '初學者',
    description: '二頭肌基礎動作。',
    tips: ['大臂夾緊身體', '勿前後晃動借力', '頂端旋轉手腕擠壓二頭', '離心下放要慢'],
    animationType: 'pull',
    image: getTutorialImage('DUMBBELL', '手臂', 'curl_side')
  },
  {
    id: 'd10',
    name: '錘式彎舉 (Hammer Curl)',
    bodyPart: '手臂',
    subCategory: '二頭肌',
    equipment: '啞鈴',
    difficulty: '初學者',
    description: '二頭肌、肱肌、前臂。',
    tips: ['掌心相對像拿錘子', '大臂固定不動', '對前臂線條很有幫助', '避免聳肩'],
    animationType: 'pull',
    image: getTutorialImage('DUMBBELL', '手臂', 'curl_side')
  },
  {
    id: 'd11',
    name: '啞鈴三頭伸展 (Overhead Extension)',
    bodyPart: '手臂',
    subCategory: '三頭肌',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '三頭肌（長頭）。',
    tips: ['雙手或單手持鈴', '大臂盡量貼近頭部', '核心收緊勿腰椎反折', '手肘指向天花板'],
    animationType: 'push',
    image: getTutorialImage('DUMBBELL', '手臂', 'press_front')
  },
  {
    id: 'd12',
    name: '法式推/碎顱者 (Skull Crusher)',
    bodyPart: '手臂',
    subCategory: '三頭肌',
    equipment: '啞鈴',
    difficulty: '進階',
    description: '三頭肌強力動作。',
    tips: ['平躺，啞鈴下放至耳旁或額頭', '大臂保持垂直或微向後', '手肘固定位置', '推起時擠壓三頭'],
    animationType: 'push',
    image: getTutorialImage('DUMBBELL', '手臂', 'press_side')
  },
  {
    id: 'd13',
    name: '哥布林深蹲 (Goblet Squat)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '啞鈴',
    difficulty: '初學者',
    description: '股四頭、臀大肌、核心。適合學習深蹲姿勢。',
    tips: ['啞鈴垂直抱在胸前', '肘部向下', '蹲到大腿平行或更低', '膝蓋對齊腳尖'],
    animationType: 'leg',
    image: getTutorialImage('DUMBBELL', '腿部', 'squat_side')
  },
  {
    id: 'd14',
    name: '羅馬尼亞硬舉 (RDL)',
    bodyPart: '腿部',
    subCategory: '腿後肌群',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '腿後肌、臀大肌、下背。',
    tips: ['微彎膝固定角度', '臀部向後推', '啞鈴貼著腿部移動', '背部始終保持平直'],
    animationType: 'leg',
    image: getTutorialImage('DUMBBELL', '腿部', 'row_side')
  },
  {
    id: 'd15',
    name: '保加利亞分腿蹲 (Bulgarian Split Squat)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '啞鈴',
    difficulty: '進階',
    description: '單腿蹲之王。股四頭、臀大肌。',
    tips: ['後腳放椅上', '前腳蹲到大腿平行', '上身直立偏股四', '前傾偏臀', '保持平衡'],
    animationType: 'leg',
    image: getTutorialImage('DUMBBELL', '腿部', 'squat_side')
  },
  {
    id: 'd16',
    name: '弓箭步 (Lunges)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '股四頭、臀大肌、腿後。功能性強。',
    tips: ['跨步距離適中', '後膝接近地面但不碰地', '前膝勿內扣', '軀幹保持正直'],
    animationType: 'leg',
    image: getTutorialImage('DUMBBELL', '腿部', 'squat_side')
  },
  {
    id: 'd17',
    name: '俄羅斯轉體 (Russian Twist)',
    bodyPart: '核心',
    subCategory: '側腹',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '腹斜肌、核心穩定。',
    tips: ['坐姿，軀幹後傾45度', '雙腳離地或著地', '轉動肩膀而非只是手臂', '保持呼吸'],
    animationType: 'core',
    image: getTutorialImage('DUMBBELL', '核心', 'press_front')
  },
  {
    id: 'd18',
    name: '啞鈴側彎 (Side Bend)',
    bodyPart: '核心',
    subCategory: '側腹',
    equipment: '啞鈴',
    difficulty: '初學者',
    description: '腹斜肌。',
    tips: ['單手持鈴', '另一手放頭後或插腰', '側彎時勿前傾或後仰', '感受側腹拉伸與收縮'],
    animationType: 'core',
    image: getTutorialImage('DUMBBELL', '核心', 'fly_front')
  },
  // --- 徒手訓練 (Bodyweight) ---
  {
    id: 'c1',
    name: '標準伏地挺身 (Push Up)',
    bodyPart: '胸部',
    subCategory: '中胸/整體',
    equipment: '徒手',
    difficulty: '初學者',
    description: '最經典的徒手推力動作，訓練胸大肌、三角肌前束與三頭肌。',
    tips: ['核心收緊，身體呈一直線', '手肘與身體呈45度夾角', '下放直到胸口接近地面', '推起時肩胛骨前引'],
    animationType: 'push',
    image: getTutorialImage('BODYWEIGHT', '胸部', 'press_side')
  },
  {
    id: 'c2',
    name: '鑽石伏地挺身 (Diamond Push Up)',
    bodyPart: '手臂',
    subCategory: '三頭肌',
    equipment: '徒手',
    difficulty: '中級',
    description: '雙手食指與拇指靠攏成鑽石狀，重點刺激三頭肌。',
    tips: ['手掌置於胸口正下方', '手肘貼近身體', '核心保持穩定', '感受三頭肌發力'],
    animationType: 'push',
    image: getTutorialImage('BODYWEIGHT', '手臂', 'press_side')
  },
  {
    id: 'c3',
    name: '雙槓撐體 (Dips)',
    bodyPart: '胸部',
    subCategory: '下胸',
    equipment: '徒手',
    difficulty: '中級',
    description: '被稱為「上半身的深蹲」，強烈刺激胸肌下緣與三頭肌。',
    tips: ['身體前傾側重胸肌，直立側重三頭', '下放至手肘90度', '肩膀下沉勿聳肩', '雙腳可交叉後勾'],
    animationType: 'push',
    image: getTutorialImage('BODYWEIGHT', '胸部', 'press_side')
  },
  {
    id: 'c4',
    name: '派克伏地挺身 (Pike Push Up)',
    bodyPart: '肩膀',
    subCategory: '前束',
    equipment: '徒手',
    difficulty: '中級',
    description: '模擬肩推的徒手動作，身體呈倒V字型。',
    tips: ['臀部抬高，身體呈倒V', '頭部頂端朝地面落下', '手肘向後收而非向外開', '推起時讓頭部穿過手臂'],
    animationType: 'push',
    image: getTutorialImage('BODYWEIGHT', '肩膀', 'press_side')
  },
  {
    id: 'c5',
    name: '板凳撐體 (Bench Dips)',
    bodyPart: '手臂',
    subCategory: '三頭肌',
    equipment: '徒手',
    difficulty: '初學者',
    description: '居家三頭肌訓練好動作。',
    tips: ['雙手撐在椅緣，背部貼近椅子下放', '手肘向後夾', '腳伸直難度較高，屈膝較易', '勿聳肩'],
    animationType: 'push',
    image: getTutorialImage('BODYWEIGHT', '手臂', 'press_side')
  },
  {
    id: 'c6',
    name: '引體向上 (Pull Up)',
    bodyPart: '背部',
    subCategory: '背闊肌',
    equipment: '徒手',
    difficulty: '中級',
    description: '背部訓練王牌動作，發展背闊肌寬度。',
    tips: ['手掌朝前正握', '啟動時先下沉肩胛骨', '拉到下巴過槓', '下放要完全伸直手臂'],
    animationType: 'pull',
    image: getTutorialImage('BODYWEIGHT', '背部', 'pull_back')
  },
  {
    id: 'c7',
    name: '反手引體向上 (Chin Up)',
    bodyPart: '手臂',
    subCategory: '二頭肌',
    equipment: '徒手',
    difficulty: '中級',
    description: '手掌朝向自己，更多二頭肌參與。',
    tips: ['握距與肩同寬', '專注二頭肌收縮', '核心收緊避免過度擺盪', '控制離心下放'],
    animationType: 'pull',
    image: getTutorialImage('BODYWEIGHT', '手臂', 'pull_back')
  },
  {
    id: 'c8',
    name: '澳洲式引體向上 (Australian Pull Up)',
    bodyPart: '背部',
    subCategory: '上背/斜方',
    equipment: '徒手',
    difficulty: '初學者',
    description: '水平拉動作，適合無法完成標準引體向上的新手，或作為划船訓練。',
    tips: ['身體呈一直線', '將胸口拉向橫槓', '肩胛骨後收夾緊', '調整腳的位置改變難度'],
    animationType: 'pull',
    image: getTutorialImage('BODYWEIGHT', '背部', 'row_side')
  },
  {
    id: 'c9',
    name: '暴力上槓 (Muscle Up)',
    bodyPart: '背部',
    subCategory: '綜合',
    equipment: '徒手',
    difficulty: '進階',
    description: '引體向上與撐體的結合，街頭健身招牌動作。',
    tips: ['強大的爆發力引體', '轉換時手腕翻轉', '身體前傾進行撐體', '多練習擺盪技巧'],
    animationType: 'pull',
    image: getTutorialImage('BODYWEIGHT', '背部', 'pull_back')
  },
  {
    id: 'c10',
    name: '徒手深蹲 (Air Squat)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '徒手',
    difficulty: '初學者',
    description: '下肢訓練基礎。',
    tips: ['雙腳與肩同寬', '膝蓋對齊腳尖', '背部挺直', '蹲至大腿平行地面'],
    animationType: 'leg',
    image: getTutorialImage('BODYWEIGHT', '腿部', 'squat_side')
  },
  {
    id: 'c11',
    name: '單腿深蹲 (Pistol Squat)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '徒手',
    difficulty: '進階',
    description: '極具挑戰性的單腿動作，考驗肌力與平衡。',
    tips: ['非支撐腿向前伸直', '保持腳跟著地', '手臂前伸輔助平衡', '下蹲要慢且控制'],
    animationType: 'leg',
    image: getTutorialImage('BODYWEIGHT', '腿部', 'squat_side')
  },
  {
    id: 'c12',
    name: '徒手弓箭步 (Walking Lunges)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '徒手',
    difficulty: '初學者',
    description: '動態的單邊腿部訓練。',
    tips: ['跨步距離適中', '後膝接近地面', '軀幹保持正直', '保持核心穩定'],
    animationType: 'leg',
    image: getTutorialImage('BODYWEIGHT', '腿部', 'squat_side')
  },
  {
    id: 'c13',
    name: '小腿上提 (Calf Raises)',
    bodyPart: '腿部',
    subCategory: '小腿',
    equipment: '徒手',
    difficulty: '初學者',
    description: '隨時隨地可做的小腿訓練。',
    tips: ['腳尖墊高可增加行程', '頂端用力踮起停留1秒', '慢下感受拉伸', '可單腳進行增加強度'],
    animationType: 'leg',
    image: getTutorialImage('BODYWEIGHT', '腿部', 'squat_side')
  },
  {
    id: 'c14',
    name: '平板支撐 (Plank)',
    bodyPart: '核心',
    subCategory: '核心穩定',
    equipment: '徒手',
    difficulty: '初學者',
    description: '靜態核心訓練，強化腹橫肌。',
    tips: ['手肘在肩膀正下方', '頭、背、臀、腳呈一直線', '臀部夾緊', '勿塌腰或聳肩'],
    animationType: 'core',
    image: getTutorialImage('BODYWEIGHT', '核心', 'press_side')
  },
  {
    id: 'c15',
    name: '側面平板支撐 (Side Plank)',
    bodyPart: '核心',
    subCategory: '側腹',
    equipment: '徒手',
    difficulty: '初學者',
    description: '強化側腹肌與核心穩定。',
    tips: ['手肘支撐', '身體呈一直線', '臀部抬高勿下垂', '保持呼吸'],
    animationType: 'core',
    image: getTutorialImage('BODYWEIGHT', '核心', 'press_side')
  },
  {
    id: 'c16',
    name: '懸垂舉腿 (Hanging Leg Raise)',
    bodyPart: '核心',
    subCategory: '下腹',
    equipment: '徒手',
    difficulty: '中級',
    description: '強烈刺激下腹部。',
    tips: ['雙手懸掛於單槓', '利用腹部力量捲起骨盆', '腿部抬高至水平或更高', '避免利用慣性甩動'],
    animationType: 'core',
    image: getTutorialImage('BODYWEIGHT', '核心', 'pull_back')
  },
  {
    id: 'c17',
    name: 'L型支撐 (L-Sit)',
    bodyPart: '核心',
    subCategory: '核心穩定',
    equipment: '徒手',
    difficulty: '中級',
    description: '靜態支撐動作，考驗核心與髖屈肌。',
    tips: ['雙手撐地或握把', '雙腿併攏伸直抬起呈L型', '肩膀下沉', '保持呼吸'],
    animationType: 'core',
    image: getTutorialImage('BODYWEIGHT', '核心', 'press_side')
  },
  {
    id: 'c18',
    name: '死蟲式 (Dead Bug)',
    bodyPart: '核心',
    subCategory: '核心穩定',
    equipment: '徒手',
    difficulty: '初學者',
    description: '安全且有效的核心訓練，強調腰椎貼地。',
    tips: ['平躺，腰部緊貼地面', '對側手腳同時延伸', '動作緩慢控制', '核心持續用力'],
    animationType: 'core',
    image: getTutorialImage('BODYWEIGHT', '核心', 'press_side')
  },
  {
    id: 'c19',
    name: '靠牆倒立 (Wall Handstand)',
    bodyPart: '肩膀',
    subCategory: '核心穩定',
    equipment: '徒手',
    difficulty: '中級',
    description: '倒立入門動作，建立肩膀穩定性。',
    tips: ['雙手撐地與肩同寬', '腹部貼牆(進階)或背部貼牆(初學)', '推地聳肩', '核心收緊'],
    animationType: 'push',
    image: getTutorialImage('BODYWEIGHT', '肩膀', 'press_back')
  },
  {
    id: 'c20',
    name: '前水平 (Front Lever)',
    bodyPart: '背部',
    subCategory: '背闊肌',
    equipment: '徒手',
    difficulty: '進階',
    description: '高難度靜態神技，身體水平懸掛於槓下。',
    tips: ['手臂伸直', '背闊肌強力下壓', '核心收緊保持水平', '從團身(Tuck)開始練習'],
    animationType: 'pull',
    image: getTutorialImage('BODYWEIGHT', '背部', 'pull_back')
  },
  {
    id: 'c21',
    name: '槓鈴臥推 (Barbell Bench Press)',
    bodyPart: '胸部',
    subCategory: '中胸/整體',
    equipment: '固定器械',
    difficulty: '中級',
    description: '上肢訓練王牌動作，全面刺激胸大肌。',
    tips: ['仰臥，雙眼位於槓鈴下方', '握距略寬於肩', '下放至胸口乳頭連線', '推起時吐氣'],
    animationType: 'push',
    image: getTutorialImage('BARBELL', '胸部', 'press_side')
  }
];
