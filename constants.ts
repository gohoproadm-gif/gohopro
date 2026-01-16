import { View, WorkoutRecord, DailyPlan, MacroData, WeightData, StrengthData, NutritionLog, UserProfile, Tutorial } from './types';

export const APP_NAME = "Gohopro";

const todayStr = new Date().toISOString().split('T')[0];

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
      { id: 'e1', name: '槓鈴臥推', sets: 4, reps: '8-10', completed: false },
      { id: 'e2', name: '上斜啞鈴推舉', sets: 3, reps: '10-12', completed: false },
      { id: 'e3', name: '繩索夾胸', sets: 3, reps: '12-15', completed: false },
      { id: 'e4', name: '三頭肌下壓', sets: 3, reps: '12-15', completed: false },
    ]
  },
  {
    id: 'p2',
    title: "背部增肌日",
    focus: "背部 / 二頭肌",
    duration: 50,
    exercises: [
      { id: 'b1', name: '引體向上', sets: 4, reps: '力竭', completed: false },
      { id: 'b2', name: '槓鈴划船', sets: 4, reps: '8-10', completed: false },
      { id: 'b3', name: '高位下拉', sets: 3, reps: '10-12', completed: false },
      { id: 'b4', name: '二頭肌彎舉', sets: 3, reps: '12-15', completed: false },
    ]
  },
  {
    id: 'p3',
    title: "核心燃燒",
    focus: "腹肌 / 核心",
    duration: 20,
    exercises: [
      { id: 'c1', name: '平板支撐', sets: 3, reps: '60秒', completed: false },
      { id: 'c2', name: '捲腹', sets: 3, reps: '20', completed: false },
      { id: 'c3', name: '俄羅斯轉體', sets: 3, reps: '20', completed: false },
    ]
  }
];

export const TODAY_PLAN = DEFAULT_PLANS[0]; // For backward compatibility if needed

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

export const TUTORIALS_DATA: Tutorial[] = [
  // --- 固定器械 (Machines) ---
  // 推類
  {
    id: 'm1',
    name: '胸推機 (Chest Press)',
    bodyPart: '胸部',
    subCategory: '中胸/整體',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '主要訓練胸大肌、前三角肌、三頭肌。軌跡固定，適合新手學習發力。',
    tips: ['座椅調整讓把手在胸線高度', '推到手臂微彎勿鎖死', '肩胛骨後收貼緊椅背', '離心下放要慢'],
    animationType: 'push'
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
    animationType: 'push'
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
    animationType: 'push'
  },
  // 拉類
  {
    id: 'm4',
    name: '坐姿划船機 (Seated Cable Row)',
    bodyPart: '背部',
    subCategory: '背闊肌',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '訓練背闊肌、菱形肌、斜方中下、二頭肌。增加背部厚度。',
    tips: ['胸挺、肩下沉', '拉到肚臍附近', '勿用手臂猛拉，用手肘帶動', '回放時感受背肌拉伸'],
    animationType: 'pull'
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
    animationType: 'pull'
  },
  // 腿部
  {
    id: 'm6',
    name: '腿推機 (Leg Press)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '固定器械',
    difficulty: '初學者',
    description: '訓練股四頭肌、臀大肌。比深蹲對腰椎壓力小，可安全上大重量。',
    tips: ['腳放高位偏臀，放低位偏股四', '膝蓋推直時勿鎖死', '背部與臀部緊貼椅背', '膝蓋對齊腳尖方向'],
    animationType: 'leg'
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
    animationType: 'leg'
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
    animationType: 'leg'
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
    animationType: 'leg'
  },
  {
    id: 'm10',
    name: '史密斯機 (Smith Machine)',
    bodyPart: '腿部', // General categorization
    subCategory: '綜合/股四頭',
    equipment: '固定器械',
    difficulty: '中級',
    description: '軌道固定的槓鈴，適合深蹲、臥推、肩推等多種動作。',
    tips: ['適合新手熟悉軌跡', '注意腳的位置與身體重心', '安全扣環要會使用', '勿過度依賴軌道'],
    animationType: 'leg'
  },
  // --- 啞鈴 (Dumbbells) ---
  // 胸部
  {
    id: 'd1',
    name: '啞鈴臥推 (Dumbbell Bench Press)',
    bodyPart: '胸部',
    subCategory: '中胸/整體',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '胸大肌、三頭、前三角。比槓鈴活動範圍更大，可改善左右不平衡。',
    tips: ['肩胛收緊下沉', '啞鈴路線呈微弧形', '下放到胸側拉伸', '推起時勿鎖死肘關節'],
    animationType: 'push'
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
    animationType: 'push'
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
    animationType: 'push'
  },
  // 背部
  {
    id: 'd4',
    name: '單臂啞鈴划船 (One-Arm Row)',
    bodyPart: '背部',
    subCategory: '背闊肌',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '背闊肌、菱形肌、二頭。單邊訓練效果好。',
    tips: ['一手膝蓋撐椅，背保持平行地面', '拉到髖側（口袋位置）', '肩胛先啟動擠壓', '勿過度扭轉軀幹'],
    animationType: 'pull'
  },
  {
    id: 'd5',
    name: '反向飛鳥 (Reverse Fly)',
    bodyPart: '肩膀', // Also Back
    subCategory: '後束',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '後三角肌、菱形肌。改善圓肩。',
    tips: ['身體前傾接近平行', '微彎肘，像張開翅膀', '專注後肩發力', '不要聳肩'],
    animationType: 'pull'
  },
  // 肩膀
  {
    id: 'd6',
    name: '坐姿啞鈴推舉 (Seated DB Press)',
    bodyPart: '肩膀',
    subCategory: '前束',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '三角肌前中束、三頭。建立寬肩。',
    tips: ['核心收緊，背貼椅背', '勿過度後仰', '推到頂端啞鈴可輕碰', '手肘不要完全外展90度'],
    animationType: 'push'
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
    animationType: 'pull' // Generic mapping
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
    animationType: 'pull' // Generic mapping
  },
  // 手臂
  {
    id: 'd9',
    name: '啞鈴彎舉 (Bicep Curl)',
    bodyPart: '手臂',
    subCategory: '二頭肌',
    equipment: '啞鈴',
    difficulty: '初學者',
    description: '二頭肌基礎動作。',
    tips: ['大臂夾緊身體', '勿前後晃動借力', '頂端旋轉手腕擠壓二頭', '離心下放要慢'],
    animationType: 'pull'
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
    animationType: 'pull'
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
    animationType: 'push'
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
    animationType: 'push'
  },
  // 腿部
  {
    id: 'd13',
    name: '哥布林深蹲 (Goblet Squat)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '啞鈴',
    difficulty: '初學者',
    description: '股四頭、臀大肌、核心。適合學習深蹲姿勢。',
    tips: ['啞鈴垂直抱在胸前', '肘部向下', '蹲到大腿平行或更低', '膝蓋對齊腳尖'],
    animationType: 'leg'
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
    animationType: 'leg'
  },
  {
    id: 'd15',
    name: '保加利亞分腿蹲 (Bulgarian Split Squat)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '啞鈴',
    difficulty: '進階',
    description: '單腿蹲之王。股四頭、臀大肌。',
    tips: ['後腳放椅上', '前腳蹲到大腿平行', '上身直立偏股四，前傾偏臀', '保持平衡'],
    animationType: 'leg'
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
    animationType: 'leg'
  },
  // 核心
  {
    id: 'd17',
    name: '俄羅斯轉體 (Russian Twist)',
    bodyPart: '核心',
    subCategory: '側腹',
    equipment: '啞鈴',
    difficulty: '中級',
    description: '腹斜肌、核心穩定。',
    tips: ['坐姿，軀幹後傾45度', '雙腳離地或著地', '轉動肩膀而非只是手臂', '保持呼吸'],
    animationType: 'core'
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
    animationType: 'core'
  },
  // --- 徒手訓練 (Calisthenics / Bodyweight) ---
  // 推類 (Push)
  {
    id: 'c1',
    name: '標準伏地挺身 (Push Up)',
    bodyPart: '胸部',
    subCategory: '中胸/整體',
    equipment: '徒手',
    difficulty: '初學者',
    description: '最經典的徒手推力動作，訓練胸大肌、三角肌前束與三頭肌。',
    tips: ['核心收緊，身體呈一直線', '手肘與身體呈45度夾角', '下放直到胸口接近地面', '推起時肩胛骨前引'],
    animationType: 'push'
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
    animationType: 'push'
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
    animationType: 'push'
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
    animationType: 'push'
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
    animationType: 'push'
  },
  // 拉類 (Pull)
  {
    id: 'c6',
    name: '引體向上 (Pull Up)',
    bodyPart: '背部',
    subCategory: '背闊肌',
    equipment: '徒手',
    difficulty: '中級',
    description: '背部訓練王牌動作，發展背闊肌寬度。',
    tips: ['手掌朝前正握', '啟動時先下沉肩胛骨', '拉到下巴過槓', '下放要完全伸直手臂'],
    animationType: 'pull'
  },
  {
    id: 'c7',
    name: '反手引體向上 (Chin Up)',
    bodyPart: '手臂', // Also back, but biases biceps
    subCategory: '二頭肌',
    equipment: '徒手',
    difficulty: '中級',
    description: '手掌朝向自己，更多二頭肌參與。',
    tips: ['握距與肩同寬', '專注二頭肌收縮', '核心收緊避免過度擺盪', '控制離心下放'],
    animationType: 'pull'
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
    animationType: 'pull'
  },
  {
    id: 'c9',
    name: '暴力上槓 (Muscle Up)',
    bodyPart: '背部', // And chest/triceps
    subCategory: '綜合',
    equipment: '徒手',
    difficulty: '進階',
    description: '引體向上與撐體的結合，街頭健身招牌動作。',
    tips: ['強大的爆發力引體', '轉換時手腕翻轉', '身體前傾進行撐體', '多練習擺盪技巧'],
    animationType: 'pull'
  },
  // 腿部 (Legs)
  {
    id: 'c10',
    name: '徒手深蹲 (Air Squat)',
    bodyPart: '腿部',
    subCategory: '股四頭肌',
    equipment: '徒手',
    difficulty: '初學者',
    description: '下肢訓練基礎。',
    tips: ['雙腳與肩同寬', '膝蓋對齊腳尖', '背部挺直', '蹲至大腿平行地面'],
    animationType: 'leg'
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
    animationType: 'leg'
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
    animationType: 'leg'
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
    animationType: 'leg'
  },
  // 核心 (Core)
  {
    id: 'c14',
    name: '平板支撐 (Plank)',
    bodyPart: '核心',
    subCategory: '核心穩定',
    equipment: '徒手',
    difficulty: '初學者',
    description: '靜態核心訓練，強化腹橫肌。',
    tips: ['手肘在肩膀正下方', '頭、背、臀、腳呈一直線', '臀部夾緊', '勿塌腰或聳肩'],
    animationType: 'core'
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
    animationType: 'core'
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
    animationType: 'core'
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
    animationType: 'core'
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
    animationType: 'core'
  },
  // 技巧 (Skills)
  {
    id: 'c19',
    name: '靠牆倒立 (Wall Handstand)',
    bodyPart: '肩膀',
    subCategory: '核心穩定', // Or shoulders
    equipment: '徒手',
    difficulty: '中級',
    description: '倒立入門動作，建立肩膀穩定性。',
    tips: ['雙手撐地與肩同寬', '腹部貼牆(進階)或背部貼牆(初學)', '推地聳肩', '核心收緊'],
    animationType: 'push'
  },
  {
    id: 'c20',
    name: '前水平 (Front Lever)',
    bodyPart: '背部', // Core/Lats
    subCategory: '背闊肌',
    equipment: '徒手',
    difficulty: '進階',
    description: '高難度靜態神技，身體水平懸掛於槓下。',
    tips: ['手臂伸直', '背闊肌強力下壓', '核心收緊保持水平', '從團身(Tuck)開始練習'],
    animationType: 'pull'
  }
];