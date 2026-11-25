/**
 * 屯垦智答 2.0 (Engine 2.5) — 混合 RAG 检索引擎 + 真实流式 AI 助手核心控制器
 * 支持：
 * 1. Okapi BM25 + 概念同义词语义向量融合检索 + 多轮指代消解 + 相关性阈值截断
 * 2. 真实 Token 级 SSE 流式对话（SiliconFlow / DeepSeek / 通义千问 / Gemini / 自定义接口）+ 停止/重新生成
 * 3. 多会话历史持久化管理、长文档自动语义分块导入、知识库实时检索测试
 * 4. 本地 FastAPI 后端与 GitHub Pages / Android APK 纯前端独立模式无缝切换
 */

const STORAGE_KEYS = {
  PROVIDER: "tunken_provider_v2",
  BASE_URL: "tunken_base_url_v2",
  API_KEY: "tunken_api_key",
  MODEL: "tunken_model_v2",
  RAG_MODE: "tunken_rag_mode_v2",
  CUSTOM_SLICES: "tunken_custom_slices_v2",
  SESSIONS: "tunken_chat_sessions_v2",
  ACTIVE_SESSION: "tunken_active_session_v2"
};

const PROVIDER_PRESETS = {
  siliconflow: {
    label: "硅基流动 SiliconFlow",
    baseUrl: "https://api.siliconflow.cn/v1",
    defaultModel: "Qwen/Qwen2.5-7B-Instruct"
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat"
  },
  dashscope: {
    label: "阿里云百炼",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus"
  },
  gemini: {
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-2.5-flash"
  },
  custom: {
    label: "自定义接口",
    baseUrl: "",
    defaultModel: ""
  }
};

const DEFAULT_SLICES = [
  {
    id: "AUTH-359-01",
    type: "official",
    type_label: "权威史料文献",
    title: "进驻阿克苏与第一把军垦坎土曼的淬火诞生",
    source: "《三五九旅屯垦戍边实录》卷一",
    author: "原三五九旅七一九团老军垦口述史研究小组",
    content: "1949年冬至1950年初，三五九旅进驻新疆阿克苏及塔里木盆地北缘。面对茫茫戈壁荒原与盐碱白滩，指战员们放下枪杆、拿起农具准备大生产。当时全军极度缺乏铁质工具，市面上根本买不到足够的开荒农具。三五九旅指战员发动全军寻找废弃铁轨、破旧炮弹壳、废弃车辆钢板和缴获武器残件，在荒原上支起土高炉和简易铁匠炉。1950年2月，在阿克苏市郊的大生产锻造营地里，老铁匠李文海与战士们在叮当打铁声中，用废炮弹壳打制出第一把军垦坎土曼。这把坎土曼宽刃、重约4斤半、刃口经过反复淬火，锋利沉实，既能刨开坚硬如石的盐碱红胶泥，又能当铁锨铲沙筑埂。第一把坎土曼的诞生，标志着三五九旅完成了由‘一手拿枪’到‘一手拿镐’的历史性战转耕转变，成为军垦战士开天辟地的第一图腾。",
    tags: ["第一把坎土曼", "阿克苏开荒", "打铁铸农具", "由战转耕", "军垦图腾"]
  },
  {
    id: "FIELD-359-01",
    type: "custom",
    type_label: "一手调研访谈",
    title: "【一手调研】93岁老战士张文生口述：打铁与血泡木柄",
    source: "2024阿拉尔军垦新村访谈实录",
    author: "高校大学生‘踏寻三五九旅足迹’调研团队",
    content: "口述人：原七一九团老战士张文生（现年93岁，访谈地点：阿拉尔）。‘我们1950年春打坎土曼的时候，铁料不够，连敌人丢弃的迫击炮弹筒都拾来砸。老班长李铁匠说，炮弹壳的钢韧性好，淬火时听声音要脆。那会儿木柄全是戈壁上的野胡杨，握起来粗糙，两天下来全班战士手心都是血泡，血水浸进木把里，时间一久柄子都变成红褐色。现在年轻人看着一把普通铁镐，当年这就是我们打江山、保饭碗的命根子！’",
    tags: ["口述史", "老铁匠", "血泡木柄", "炮弹壳", "实地调研"]
  },
  {
    id: "AUTH-359-02",
    type: "official",
    type_label: "权威史料文献",
    title: "从南泥湾精神到兵团精神：自力更生与塞外老纺车",
    source: "《三五九旅后勤保障与自给自足史》",
    author: "三五九旅屯垦纪念馆馆藏文献",
    content: "从陕北南泥湾到天山南北，三五九旅始终坚持‘自己动手、丰衣足食’的自力更生优良传统。进疆初期，后方物资运输线绵延数千里，入冬时官兵军服奇缺，面临‘衣破无布补、天寒无棉御’的艰苦绝境。三五九旅党委决定将南泥湾老纺车经验移植至塔河之畔。战士们拆解废弃车轱辘与戈壁胡杨木，手作简易木制纺车，剪集当地散落的粗羊毛，清洗搓捻，开展‘班班赛纺纱、人人争能手’劳动竞赛。自制粗呢军服不仅解决了御寒问题，更将南泥湾精神升华为‘热爱祖国、无私奉献、艰苦创业、开拓进取’的兵团精神。",
    tags: ["南泥湾精神", "兵团精神", "老纺车", "自力更生", "纺毛线"]
  },
  {
    id: "AUTH-359-03",
    type: "official",
    type_label: "权威史料文献",
    title: "胜利渠战役：踏破寒冰引天山雪水浇灌戈壁江南",
    source: "《农一师水利开荒志》·多浪河引水工程档案",
    author: "第一师阿拉尔市史志办",
    content: "水是戈壁农业的生命线。1950年春，为解决阿克苏至阿拉尔荒地的灌溉，三五九旅官兵在多浪河上打响修建百里胜利渠战役。早春时节河水冰冷刺骨，战士们脱下棉衣跳进零下20度的刺骨冰水中排险打桩，用血肉之躯在激流中筑起拦水大坝。王震将军同战士们同吃窝窝头、同抡坎土曼挖土方。全渠无一台大型挖掘机，硬凭十万双长满老茧的手与简易扁担箩筐，在百天之内凿通百余里干渠，引天山雪水浸润荒芜瀚海，为当年万亩麦浪与棉田打下不朽奠基。",
    tags: ["胜利渠", "多浪河", "冰水打桩", "水利工程", "王震"]
  },
  {
    id: "AUTH-359-04",
    type: "official",
    type_label: "权威史料文献",
    title: "红柳地窝子：地下两米的青春岁月与生活史",
    source: "《戈壁长歌：三五九旅老战士口述实录》第4章",
    author: "塔里木大学西域文化与红色军垦研究所",
    content: "初到荒原无砖无瓦，风沙漫天，战士们挖掘地下1.8至2米的土坑，以红柳枝和沙枣木为梁，盖以芦苇与泥浆，制成‘地窝子’。地窝子冬暖夏凉，但沙尘常透缝而入。老军垦口述：‘清晨起床被面上常积一层黄沙，抖抖被褥便又扛起坎土曼上工。’在幽暗的柴油墨水瓶小灯下，官兵们读夜校、编快板、教文化，写下‘生在井冈山，长在南泥湾，转战数万里，屯垦在天山’的崇高诗篇。",
    tags: ["地窝子", "红柳芦苇", "军垦生活史", "革命浪漫主义"]
  },
  {
    id: "AUTH-359-05",
    type: "official",
    type_label: "权威史料文献",
    title: "民族共建与石榴籽情深：三五九旅与各族农牧民同心开荒",
    source: "《天山筑梦：兵地各族群众共同开荒历史档案》",
    author: "阿克苏地区文史研究资料选辑",
    content: "三五九旅各部初驻阿克苏及阿拉尔各乡镇时，严守三大纪律八项注意，宁宿旷野古庙也不占民房一间。针对当地少数民族群众缺少铁质农具与水利技术的情况，官兵们将铁匠炉打制的新坎土曼赠予贫苦维吾尔族农民，并派出医疗卫生员免费走村串户义诊，协助修筑灌渠。维吾尔族群众自发赶着毛驴车送来滚烫的烤馕和甜瓜，亲切地称军垦官兵为‘亲人金珠玛米’，形成了各民族‘像石榴籽一样紧紧抱在一起’的和谐局面。",
    tags: ["民族共建", "鱼水情深", "赠送坎土曼", "石榴籽", "兵地融合"]
  }
];

const DEFAULT_CARRIERS = [
  {
    id: "fan",
    name: "便携手持小风扇",
    subtitle: "戈壁清风 · 手持复古折叠小风扇",
    features: "扇叶防卷发设计、手柄立体坎土曼浮雕握感、低噪微风吹拂戈壁清凉、Type-C 应急快充",
    color_scheme: "军垦冷轧绿 / 戈壁麦浪金 / 铸铁哑光黑",
    swatches: [
      { label: "军垦冷轧绿", hex: "#3D4F3B" },
      { label: "戈壁麦浪金", hex: "#C89B3C" },
      { label: "铸铁哑光黑", hex: "#262523" }
    ],
    materials: "ABS 环保哑光喷砂工程塑料、锌合金做旧金属吊坠扣、硅胶防滑条",
    prompt_en: "Professional product studio photography of a portable handheld red-cultural mini fan, vintage military olive green and matte brushed brass accents, ergonomic handle engraved with 359th brigade pioneer pickaxe Kantuman relief pattern, bladeless anti-tangle safety airflow grill, minimalist industrial design, crisp white studio background, soft shadows, sharp focus, 8k resolution, product showcase.",
    mock_img: "https://image.pollinations.ai/prompt/Professional%20product%20photography%20handheld%20mini%20fan%20military%20olive%20green%20and%20brass%20relief%20texture%20minimalist%20industrial%20design%20clean%20white%20background%20studio%20lighting?width=800&height=800&nologo=true&seed=3591"
  },
  {
    id: "cap",
    name: "军垦拓荒刺绣帽子",
    subtitle: "天山印记 · 水洗做旧帆布工装鸭舌帽",
    features: "重磅水洗做旧帆布耐磨透气、后侧刺绣三五九旅经纬度坐标（81°17′E, 40°32′N）、前檐立体红星铜扣",
    color_scheme: "沙漠卡其 / 军绿水洗灰 / 晚霞铁锈红",
    swatches: [
      { label: "沙漠卡其", hex: "#B9A589" },
      { label: "军绿水洗灰", hex: "#5F6B5A" },
      { label: "晚霞铁锈红", hex: "#9E3B2B" }
    ],
    materials: "16 安加厚重磅水洗纯棉帆布、铜质做旧日字调节扣、高密立体棉线刺绣",
    prompt_en: "Product commercial photography of a stylish washed canvas vintage baseball cap, earthy military khaki and distressed sage green color, front high-density 3D embroidery of vintage pioneer hoe Kantuman and subtle red star badge, side stamped with geographic coordinates of Alar Xinjiang, placed neatly on clean white studio backdrop, dramatic natural lighting, textile texture details, 8k.",
    mock_img: "https://image.pollinations.ai/prompt/Commercial%20product%20photography%20washed%20canvas%20vintage%20baseball%20cap%20military%20khaki%20embroidered%20red%20star%20badge%20clean%20white%20studio%20background%208k?width=800&height=800&nologo=true&seed=3592"
  },
  {
    id: "cup",
    name: "戈壁拓荒多功能保温杯",
    subtitle: "多浪清泉 · 智能数显双层真空保温杯",
    features: "LED 轻触温度数显杯盖、杯身激光微雕阿克苏百里胜利渠水文线、隐藏式折叠战术把手",
    color_scheme: "哑光战壕绿 / 麦穗磨砂金 / 极简冷灰",
    swatches: [
      { label: "哑光战壕绿", hex: "#2F3E30" },
      { label: "麦穗磨砂金", hex: "#C59B43" },
      { label: "极简冷灰", hex: "#9CA3AF" }
    ],
    materials: "食品级 316L 医用不锈钢内胆、外层仿粗粝岩石触感喷塑涂层、竹木杯盖嵌铜扣",
    prompt_en: "Studio product photography of a premium tactical vacuum insulated thermos water bottle, matte army green finish with laser-engraved topographical river wave lines of Shengli Canal, brushed gold stainless steel cap with touch digital temperature display, ultra-clean solid white studio backdrop, soft elegant reflections, high-end industrial product design, 8k resolution.",
    mock_img: "https://image.pollinations.ai/prompt/Studio%20product%20photography%20tactical%20vacuum%20thermos%20matte%20army%20green%20brushed%20gold%20details%20clean%20white%20studio%20backdrop%20soft%20reflections%208k?width=800&height=800&nologo=true&seed=3593"
  },
  {
    id: "bag",
    name: "军垦拓荒工装帆布袋",
    subtitle: "由战转耕 · 重磅复古托特工装包",
    features: "双层加固大容量仓底、外侧多功能坎土曼工具挂环插袋、丝网手工套印 1950 阿克苏开荒纪念章",
    color_scheme: "原生态棉麻胚白 / 军绿拼接 / 赭石红丝印",
    swatches: [
      { label: "棉麻胚白", hex: "#EAE4D6" },
      { label: "军绿拼接", hex: "#4D5B47" },
      { label: "赭石红丝印", hex: "#A13526" }
    ],
    materials: "20 安超厚原生未漂白棉麻帆布、真牛皮提手把加固、实心黄铜铆钉",
    prompt_en: "Flat lay product catalog photography of a rugged heavy-duty canvas tote messenger bag, natural ecru off-white canvas with vintage olive green reinforced webbing straps, front vintage silkscreen print of 1950 pioneer tools and cotton branch typography, solid brass rivets, isolated on pristine white studio background, studio lighting, hyper-realistic fabric texture, 8k.",
    mock_img: "https://image.pollinations.ai/prompt/Product%20catalog%20photography%20heavy-duty%20canvas%20tote%20bag%20natural%20ecru%20olive%20green%20straps%20brass%20rivets%20isolated%20white%20background%208k?width=800&height=800&nologo=true&seed=3594"
  },
  {
    id: "magnet",
    name: "金属复古浮雕冰箱贴",
    subtitle: "红柳记忆 · 双层立体合金文创贴",
    features: "双层错位镂空立体浮雕、红柳枝地窝子造型结合老铁匠打铁剪影、暗夜微夜光涂层设计",
    color_scheme: "复古红古铜 / 珐琅中国红 / 哑光黑铁",
    swatches: [
      { label: "复古红古铜", hex: "#8F4F32" },
      { label: "珐琅中国红", hex: "#B42318" },
      { label: "哑光黑铁", hex: "#282725" }
    ],
    materials: "锌合金高压压铸做旧电镀、手工填色软珐琅、环保高强钕铁硼磁石",
    prompt_en: "Macro product shot of an exquisite commemorative zinc alloy 3D relief fridge magnet, antique copper plating with rich red enamel accents, depicting soldiers forging pickaxe hoe near subterranean diwozi shelter under starry sky, layered architectural metal relief, studio lighting on pure white background, sharp metallic textures, 8k resolution.",
    mock_img: "https://image.pollinations.ai/prompt/Macro%20product%20shot%203D%20metal%20relief%20fridge%20magnet%20antique%20copper%20and%20red%20enamel%20details%20pure%20white%20background%208k?width=800&height=800&nologo=true&seed=3595"
  }
];

const DEFAULT_CAMPAIGN = {
  topic: "让三五九旅第一把坎土曼走进青年",
  xiaohongshu: {
    title: "家人们破防了！70年前这届军垦青年，竟用废炮弹壳‘手搓’出开荒神器",
    tags: ["#三五九旅", "#军垦青年", "#第一把坎土曼", "#红色文旅", "#拒绝精神内耗", "#多民族青年"],
    body: "如果在20岁那年，把你扔进零下20度的塔里木荒原，面前只有戈壁盐碱滩和漫天风沙，手里甚至连一把开荒的铁锹都没有，你会怎么办？\n\n在阿克苏三五九旅纪念馆里，这把锈迹斑斑却刃口极锋利的坎土曼真的狠狠戳中了我！\n\n真实历史比电影更硬核：\n1. 【废炮弹壳手敲农具】：1950年刚进疆，根本买不到铁工具。三五九旅的前辈们在戈壁滩支起土高炉，捡战场上的破铁轨、废炮弹壳，烈火淬火，硬是一锤一锤敲出了军垦第一把坎土曼。\n2. 【血泡磨出的绿洲奇迹】：4斤半纯手工锻造，为了引雪水修百里胜利渠，战士们在刺骨冰水里打桩，手掌磨破渗血，血水染红了胡杨木手柄。\n3. 【兵民一家的信物】：打出的第一批好农具，官兵二话不说先送给周边维吾尔族贫苦乡亲，手把手教开荒技术，乡亲们赶着驴车送来热腾腾的烤馕……\n\n面对考研、求职、生活的坚硬硬土，愿我们都能握紧属于自己的这把‘精神坎土曼’——没有路，就用双手砸出一条路。\n\n打卡坐标：新疆阿克苏 / 阿拉尔三五九旅屯垦纪念馆\n文创周边：手持复古清风扇 & 拓荒坐标刺绣帆布帽"
  },
  douyin_script: {
    title: "《回响在冻土下的打铁声》（60秒短视频/分镜头脚本）",
    bpm: "低沉心跳 -> 激昂打铁重音 -> 壮阔冬不拉交响",
    scenes: [
      {
        num: 1, time: "00:00 - 00:10", shot: "特写 / 微距",
        visual: "漫天戈壁黄沙呼啸掠过枯黄芦苇。镜头缓缓推进至一柄插在冻土上的深褐色旧坎土曼，刃口闪烁斑驳微光。",
        audio: "风暴呼啸声与钟表滴答混音", dialogue: "（低沉画外音）‘面对坚硬如铁的现实与一望无际的荒原，你是否也曾想过退缩？’"
      },
      {
        num: 2, time: "00:10 - 00:25", shot: "快速快剪",
        visual: "熊熊燃烧的土高炉火星四溅，老铁匠与战士赤膊抡锤砸在通红废炮弹钢坯上，穿插战士跳进零下20度冰水筑坝的历史定格照。",
        audio: "清脆震耳的锻打铁器声", dialogue: "‘没有枪炮，我们能打胜仗；没有农具，我们就把炮弹壳熔成开荒破土的刀！’"
      },
      {
        num: 3, time: "00:25 - 00:45", shot: "全景推进",
        visual: "淬火白气腾空而起，晨光破云而出。各族青年官兵与老乡并肩将坎土曼铲入盐碱地，转场为万亩金色麦浪与雪白棉田。",
        audio: "欢快的维吾尔族冬不拉与交响乐交织", dialogue: "‘一铲下去是戈壁荒滩，一万铲下去是塞外江南！’"
      },
      {
        num: 4, time: "00:45 - 00:60", shot: "虚实转场",
        visual: "镜头拉回现代阿拉尔创客空间，青年手持带有坎土曼浮雕的复古小风扇与工装包，目光坚定望向远方。",
        audio: "清脆金属余音与温暖氛围音乐", dialogue: "‘致敬每一个在坚硬生活里，亲手锻打出勇气、把荒原变绿洲的青年！’"
      }
    ]
  },
  survey_markdown: `# 《三五九旅红色文化青年群体传播效果与文创接受度调查问卷》

> 尊敬的受访者：您好！本问卷旨在深入调研三五九旅屯垦历史、兵团精神在当代多民族青年及高校大学生群体中的传播效果与文化认同，并评估实用文创产品的研发方向。所有数据均严格匿名，感谢您的支持！

---

### 一、受访者基础人口学画像
**1. 您的年龄区间是：**
- [ ] A. 18岁以下
- [ ] B. 18 - 25岁（高校在读/初入职场）
- [ ] C. 26 - 35岁（青年工作者/青年骨干）
- [ ] D. 36岁及以上

**2. 您的民族属性：**
- [ ] A. 汉族
- [ ] B. 维吾尔族
- [ ] C. 哈萨克族
- [ ] D. 回族 / 蒙古族 / 柯尔克孜族等其他少数民族

**3. 您的职业或身份：**
- [ ] A. 在校大学生 / 研究生
- [ ] B. 文化传媒 / 新媒体创作者
- [ ] C. 企事业单位青年职工
- [ ] D. 青年创业者 / 自由职业者

---

### 二、三五九旅红色历史认知与触达渠道
**4. 在参与本次调研前，您对三五九旅进驻新疆屯垦戍边历史的了解程度是：**
- [ ] A. 非常深入（熟知阿克苏开荒、第一把坎土曼、胜利渠等具体事件）
- [ ] B. 较为熟悉（听过南泥湾、地窝子、兵团建设等主要精神）
- [ ] C. 仅知晓名字（知道是著名战斗部队，不清楚具体屯垦细节）
- [ ] D. 完全不了解

**5. 您最倾向于通过哪些新媒体形式接触三五九旅红色文化？（可多选）**
- [ ] A. 小红书视觉图文笔记（故事化、年轻化排版）
- [ ] B. 抖音 / 视频号 / B站 剧情短剧与微电影分镜
- [ ] C. 沉浸式情景打铁工坊 / 红色剧本杀体验
- [ ] D. 具有实用价值的生活文创周边（手持风扇、水杯、帆布袋）
- [ ] E. 严肃文博纪录片与权威书籍

---

### 三、红色文化情感认同度评估（5级李克特量表）
> 请根据您的真实感受评分（1=完全不认同，2=不太认同，3=一般，4=比较认同，5=完全认同）

| 评价指标 | 1分 | 2分 | 3分 | 4分 | 5分 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| 6. 三五九旅“废炮弹壳打制第一把坎土曼”的奋斗故事对当代青年攻克精神内耗具有强烈的激励共鸣 | ○ | ○ | ○ | ○ | ○ |
| 7. 兵地共建、各族群众“像石榴籽紧抱”共同拓荒的历史细节增进了我的中华民族共同体认同 | ○ | ○ | ○ | ○ | ○ |
| 8. 相比于传统口号宣讲，结合当代青年生活痛点的“生活史视角”更容易引发我的情感共鸣 | ○ | ○ | ○ | ○ | ○ |
| 9. 我愿意向身边同学或朋友主动分享具有工业美感的军垦红色新媒体内容 | ○ | ○ | ○ | ○ | ○ |

---

### 四、实体文创周边设计与购买意愿评估
**10. 下列结合三五九旅硬核元素的实体文创中，您最感兴趣且愿意日常携带使用的是？（最多选2项）**
- [ ] A. 便携手持小风扇（戈壁清风概念、坎土曼浮雕手柄、防卷发扇叶）
- [ ] B. 军垦拓荒工装刺绣帽子（水洗做旧帆布、阿克苏经纬度微标）
- [ ] C. 戈壁拓荒多功能保温杯（哑光战壕绿、激光雕刻胜利渠水文线、智能数显）
- [ ] D. 军垦工装帆布托特包（20安超厚棉麻、手工铁扣件、开荒图章）
- [ ] E. 金属复古立体浮雕冰箱贴（双层红铜合金、红星软珐琅、暗夜微光）

**11. 您认为红色文创要真正“打动年轻人”，最关键的核心要素是什么？**
- [ ] A. 极高的日常实用性（必须是生活中天天能用得上的物件）
- [ ] B. 工业级现代设计审美（拒绝廉价红黄塑料感，注重哑光金属与帆布质感）
- [ ] C. 深厚且真挚的历史细节支撑（每件产品背后有真实的文物故事铭牌）
- [ ] D. 合理亲民的定价（50元以内的青年文创首选区间）

---

### 五、开放式宝贵意见与建议
**12. 请用一两句话写下：您认为如何能让三五九旅的“开荒精神”以更酷、更有力量的方式走进当下的多民族青年圈层？**
答：_________________________________________________________________

（问卷结束，再次感谢您对三五九旅红色文化创新赋能研究的大力支持！）`
};

// =========================================================================
// 浏览器端混合 RAG 引擎 2.5 (Okapi BM25 + 概念同义词向量 + 多轮指代消解 + 阈值过滤)
// =========================================================================
const ClientRAGEngine = {
  slices: [],
  docTokens: [],
  docTf: [],
  docLengths: [],
  avgDocLen: 1,
  bm25Idf: {},
  semanticIdf: {},
  docVectors: [],

  STOPWORDS: new Set([
    "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一", "一个", "上", "也", "很",
    "到", "说", "要", "去", "你", "您", "会", "着", "没有", "看", "好", "自己", "这", "那", "这个",
    "那个", "什么", "怎么", "怎样", "如何", "为什么", "请问", "能否", "可以", "帮我", "告诉", "介绍",
    "一下", "关于", "哪些", "多少", "吗", "呢", "吧", "啊", "呀", "哦", "嗯", "哈", "嘛", "么",
    "今天", "明天", "昨天", "现在", "时候", "事情", "问题", "内容", "方面", "情况", "知道", "觉得",
    "写一段", "写一个", "代码", "天气", "吃饭"
  ]),

  CHITCHAT_RES: [
    /^(你好|您好|嗨|哈喽|早上好|中午好|下午好|晚上好|hey|hi|hello)[\s!！。，,？?]*$/i,
    /^(在吗|在不在|有人吗|忙吗)[\s!！。，,？?]*$/i,
    /^(你是谁|您是谁|你叫什么|介绍一下你自己|你能做什么|你会干什么|有什么功能|怎么用)[\s!！。，,？?]*$/i,
    /^(谢谢|多谢|感谢|辛苦了|太棒了|好的|明白了|知道了|再见|拜拜|ok|thanks)[\s!！。，,？?]*$/i
  ],

  COREFERENCE_MARKERS: [
    "他", "她", "它", "他们", "她们", "它们", "这把", "那把", "这条", "那条", "这种", "那种",
    "这件", "那件", "当时", "后来", "那里", "这儿", "那儿", "这位", "那位", "老人", "上面", "刚才"
  ],

  DOMAIN_ENTITIES: [
    "三五九旅", "359旅", "七一九团", "坎土曼", "胜利渠", "地窝子", "阿克苏", "阿拉尔",
    "塔里木", "王震", "多浪河", "老纺车", "纺车", "南泥湾", "兵团精神", "由战转耕",
    "红柳", "沙枣木", "废炮弹壳", "炮弹壳", "土高炉", "石榴籽", "民族团结", "民族共建",
    "维吾尔族", "金珠玛米", "李文海", "李铁匠", "张文生", "血泡", "胡杨木", "夜校"
  ],

  SYNONYM_GROUPS: [
    ["坎土曼", "农具", "铁镐", "锄头", "铁锹", "铁锨", "工具", "打铁", "锻造", "淬火", "炮弹壳", "李文海"],
    ["张文生", "老战士", "老军垦", "老兵", "口述", "访谈", "采访", "血泡", "木柄", "胡杨", "手心"],
    ["老纺车", "纺车", "纺纱", "织布", "御寒", "军服", "军装", "衣服", "棉衣", "粗呢", "羊毛", "南泥湾", "丰衣足食", "自力更生"],
    ["胜利渠", "多浪河", "修渠", "挖渠", "水渠", "水利", "灌溉", "引水", "修坝", "筑坝", "冰水", "打桩", "雪水", "王震"],
    ["地窝子", "住房", "住处", "住所", "房子", "宿舍", "地下", "土坑", "窑洞", "红柳", "芦苇", "风沙", "夜校", "生活"],
    ["民族共建", "民族团结", "石榴籽", "维吾尔族", "少数民族", "老乡", "村民", "农牧民", "金珠玛米", "义诊", "烤馕", "兵地"],
    ["三五九旅", "359旅", "屯垦", "戍边", "开荒", "垦荒", "大生产", "新疆", "阿克苏", "阿拉尔", "塔里木", "戈壁"]
  ],

  expandSynonyms(tokens, rawText) {
    const expanded = [...tokens];
    const lowerRaw = String(rawText || "").toLowerCase();
    for (const group of this.SYNONYM_GROUPS) {
      if (group.some(term => lowerRaw.includes(term) || tokens.includes(term))) {
        for (const syn of group.slice(0, 5)) expanded.push(syn);
      }
    }
    return expanded;
  },

  tokenize(text) {
    const lower = String(text || "").toLowerCase().trim();
    if (!lower) return [];
    const tokens = [];

    for (const ent of this.DOMAIN_ENTITIES) {
      const entLow = ent.toLowerCase();
      let pos = 0;
      while ((pos = lower.indexOf(entLow, pos)) !== -1) {
        tokens.push(entLow, entLow);
        pos += entLow.length;
      }
    }

    const cleaned = lower.replace(/[^\w\u4e00-\u9fa5]+/g, " ").trim();
    const segs = cleaned ? cleaned.split(/\s+/) : [];
    for (const seg of segs) {
      if (this.STOPWORDS.has(seg)) continue;
      const asciiMatches = seg.match(/[a-z0-9]{2,}/g) || [];
      for (const ap of asciiMatches) {
        if (!this.STOPWORDS.has(ap)) tokens.push(ap);
      }

      const cSeq = Array.from(seg).filter(ch => ch >= "\u4e00" && ch <= "\u9fa5").join("");
      if (!cSeq) continue;
      if (cSeq.length <= 4 && !this.STOPWORDS.has(cSeq)) tokens.push(cSeq);
      for (let i = 0; i < cSeq.length - 1; i++) {
        const bg = cSeq.slice(i, i + 2);
        if (!this.STOPWORDS.has(bg)) tokens.push(bg);
      }
      for (let i = 0; i < cSeq.length - 2; i++) {
        const tg = cSeq.slice(i, i + 3);
        if (!this.STOPWORDS.has(tg)) tokens.push(tg);
      }
    }
    return tokens;
  },

  chunkText(text, chunkSize = 340, overlap = 60) {
    const cleaned = String(text || "").replace(/\n{3,}/g, "\n\n").trim();
    if (!cleaned) return [];
    if (cleaned.length <= chunkSize + 60) return [cleaned];

    const sentences = cleaned.split(/(?<=[。！？!?；;\n])/).map(s => s.trim()).filter(Boolean);
    const chunks = [];
    let current = "";
    for (const sent of sentences) {
      if (current.length + sent.length <= chunkSize) {
        current += sent;
      } else {
        if (current) {
          chunks.push(current.trim());
          const tail = overlap > 0 && current.length > overlap ? current.slice(-overlap) : "";
          current = tail + sent;
        } else {
          for (let i = 0; i < sent.length; i += (chunkSize - overlap)) {
            chunks.push(sent.slice(i, i + chunkSize).trim());
          }
          current = "";
        }
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  },

  loadDocuments(slices) {
    this.slices = (slices || []).map(s => ({ ...s }));
    this.docTokens = [];
    this.docTf = [];
    this.docLengths = [];
    const semTokenLists = [];

    for (const doc of this.slices) {
      const title = doc.title || "";
      const tags = (doc.tags || []).join(" ");
      const weighted = `${title} ${title} ${tags} ${tags} ${doc.source || ""} ${doc.content || ""}`;
      const baseTokens = this.tokenize(weighted);
      const semTokens = this.expandSynonyms(baseTokens, weighted);

      this.docTokens.push(baseTokens);
      semTokenLists.push(semTokens);
      this.docLengths.push(Math.max(1, baseTokens.length));

      const tf = {};
      for (const t of baseTokens) tf[t] = (tf[t] || 0) + 1;
      this.docTf.push(tf);
    }

    const nDocs = this.slices.length;
    this.avgDocLen = nDocs > 0 ? this.docLengths.reduce((a, b) => a + b, 0) / nDocs : 1;

    const dfBm25 = {};
    for (const tf of this.docTf) {
      for (const term of Object.keys(tf)) dfBm25[term] = (dfBm25[term] || 0) + 1;
    }
    this.bm25Idf = {};
    for (const [term, df] of Object.entries(dfBm25)) {
      this.bm25Idf[term] = Math.log(1 + (nDocs - df + 0.5) / (df + 0.5));
    }

    const dfSem = {};
    for (const st of semTokenLists) {
      for (const term of new Set(st)) dfSem[term] = (dfSem[term] || 0) + 1;
    }
    this.semanticIdf = {};
    for (const [term, df] of Object.entries(dfSem)) {
      this.semanticIdf[term] = Math.log((nDocs + 1) / (df + 1)) + 1.0;
    }

    this.docVectors = semTokenLists.map(semTokens => {
      const tf = {};
      for (const t of semTokens) tf[t] = (tf[t] || 0) + 1;
      const len = Math.max(1, semTokens.length);
      const vec = {};
      let normSq = 0;
      for (const [t, cnt] of Object.entries(tf)) {
        const val = ((1 + Math.log(cnt)) / len) * (this.semanticIdf[t] || 1.0);
        vec[t] = val;
        normSq += val * val;
      }
      const norm = normSq > 0 ? Math.sqrt(normSq) : 1.0;
      for (const t of Object.keys(vec)) vec[t] /= norm;
      return vec;
    });
  },

  analyzeQuery(query, history = []) {
    const q = String(query || "").trim();
    if (!q || this.CHITCHAT_RES.some(re => re.test(q))) {
      return { intent: "chitchat", original_query: q, rewritten_query: q, is_rewritten: false };
    }

    const hasPronoun = this.COREFERENCE_MARKERS.some(m => q.includes(m));
    let hasEntity = this.DOMAIN_ENTITIES.some(e => q.toLowerCase().includes(e.toLowerCase()));
    for (const doc of this.slices) {
      if (String(doc.id || "").startsWith("FIELD-USR-")) {
        const cleanTitle = String(doc.title || "").replace(/[【】（）()\s0-9片段/]+/g, "");
        if (cleanTitle.length >= 2 && q.includes(cleanTitle.slice(0, 4))) hasEntity = true;
      }
    }

    if (history && history.length > 0 && (hasPronoun || (q.length <= 12 && !hasEntity))) {
      const recentText = history.slice(-4).map(t => (t.content || "").slice(0, 220)).join(" ");
      const carry = [];
      for (const ent of this.DOMAIN_ENTITIES) {
        if (recentText.includes(ent) && !q.includes(ent) && !carry.includes(ent)) carry.push(ent);
      }
      for (const doc of this.slices) {
        if (String(doc.id || "").startsWith("FIELD-USR-")) {
          const tTokens = this.tokenize(doc.title || "").filter(x => x.length >= 2);
          for (const tt of tTokens.slice(0, 2)) {
            if (recentText.toLowerCase().includes(tt) && !q.toLowerCase().includes(tt) && !carry.includes(tt)) {
              carry.push(tt);
            }
          }
        }
      }
      if (carry.length > 0) {
        const chosen = carry.slice(0, 3);
        return {
          intent: "rag_query",
          original_query: q,
          rewritten_query: `${chosen.join(" ")} ${q}`,
          expanded_entities: chosen,
          is_rewritten: true
        };
      }
    }
    return { intent: "rag_query", original_query: q, rewritten_query: q, is_rewritten: false };
  },

  search(query, topK = 4, history = [], minScore = 0.20) {
    if (!this.slices.length) return [];
    const analysis = this.analyzeQuery(query, history);
    if (analysis.intent === "chitchat") return [];

    const effectiveQ = analysis.rewritten_query;
    const qBaseTokens = this.tokenize(effectiveQ);
    if (!qBaseTokens.length) return [];

    const qSemTokens = this.expandSynonyms(qBaseTokens, effectiveQ);
    const qTf = {};
    for (const t of qSemTokens) qTf[t] = (qTf[t] || 0) + 1;
    const qLen = Math.max(1, qSemTokens.length);
    const qVec = {};
    let qNormSq = 0;
    for (const [t, cnt] of Object.entries(qTf)) {
      const idfW = this.semanticIdf[t] !== undefined ? this.semanticIdf[t] : 0.25;
      const val = ((1 + Math.log(cnt)) / qLen) * idfW;
      qVec[t] = val;
      qNormSq += val * val;
    }
    const qNorm = qNormSq > 0 ? Math.sqrt(qNormSq) : 1.0;
    for (const t of Object.keys(qVec)) qVec[t] /= qNorm;

    const k1 = 1.5;
    const b = 0.75;
    const uniqueQBase = Array.from(new Set(qBaseTokens));
    const bm25Raw = [];
    const semCos = [];
    const matchedList = [];
    const boosts = [];

    for (let idx = 0; idx < this.slices.length; idx++) {
      const tfMap = this.docTf[idx];
      const dl = this.docLengths[idx];
      const matched = [];
      let bm25 = 0;
      for (const qt of uniqueQBase) {
        const f = tfMap[qt] || 0;
        if (f > 0) {
          const idf = this.bm25Idf[qt] || 0;
          bm25 += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * (dl / this.avgDocLen))));
          if (qt.length >= 2 && !matched.includes(qt)) matched.push(qt);
        }
      }

      const docVec = this.docVectors[idx];
      let cos = 0;
      for (const [t, qv] of Object.entries(qVec)) {
        if (docVec[t] !== undefined) {
          cos += qv * docVec[t];
          if (t.length >= 2 && !matched.includes(t)) matched.push(t);
        }
      }

      const doc = this.slices[idx];
      const titleLow = String(doc.title || "").toLowerCase();
      const tagsLow = (doc.tags || []).join(" ").toLowerCase();
      let boost = 0;
      for (const qt of uniqueQBase) {
        if (qt.length >= 2 && (titleLow.includes(qt) || tagsLow.includes(qt))) boost += 0.12;
      }

      bm25Raw.push(bm25);
      semCos.push(cos);
      matchedList.push(matched.slice(0, 6));
      boosts.push(Math.min(0.30, boost));
    }

    const maxBm25 = Math.max(0, ...bm25Raw);
    const scored = [];
    for (let idx = 0; idx < this.slices.length; idx++) {
      const bm25Norm = maxBm25 > 0 ? bm25Raw[idx] / (maxBm25 + 1.2) : 0;
      const sem = semCos[idx];
      if (bm25Raw[idx] <= 0 && sem < 0.12) continue;
      const hybrid = 0.52 * bm25Norm + 0.48 * sem + boosts[idx];
      if (hybrid >= minScore) {
        scored.push({ idx, hybrid, matched: matchedList[idx] });
      }
    }

    scored.sort((a, b) => b.hybrid - a.hybrid);
    return scored.slice(0, topK).map((entry, rank) => ({
      index: rank + 1,
      slice: this.slices[entry.idx],
      similarity: Number(Math.min(0.985, 0.56 + entry.hybrid * 0.46).toFixed(3)),
      matched_terms: entry.matched
    }));
  },

  extractRelevantSentences(query, results, maxPerSlice = 2) {
    const qSet = new Set(this.expandSynonyms(this.tokenize(query), query));
    return results.map(item => {
      const doc = item.slice;
      const sents = String(doc.content || "").split(/(?<=[。！？!?])/).map(s => s.trim()).filter(s => s.length > 6);
      const scored = sents.map((s, pos) => {
        const sLow = s.toLowerCase();
        let hit = 0;
        for (const t of qSet) {
          if (t.length >= 2 && sLow.includes(t)) hit += (t.length >= 3 ? 2.0 : 1.0);
        }
        return { score: hit + (pos === 0 ? 0.25 : 0), pos, s };
      });
      scored.sort((a, b) => b.score - a.score);
      const chosen = scored.slice(0, maxPerSlice).sort((a, b) => a.pos - b.pos).map(c => c.s);
      return { index: item.index, doc, similarity: item.similarity, sentences: chosen };
    });
  },

  buildContext(results) {
    if (!results || !results.length) {
      return "【当前检索结果：双轨知识库中未检索到与该问题直接相关的史料切片】";
    }
    const lines = ["【以下为混合检索引擎命中的三五九旅双轨知识库资料】：\n"];
    for (const item of results) {
      const doc = item.slice;
      const track = doc.type === "official" ? "权威文献" : "一手调研访谈";
      lines.push(`--- 证据切片 [${item.index}] 【${track} | 相关性 ${(item.similarity * 100).toFixed(1)}%】---`);
      lines.push(`切片编号: ${doc.id || "N/A"}`);
      lines.push(`切片标题: ${doc.title || "未知"}`);
      lines.push(`文献出处: ${doc.source || "调研档案"}`);
      lines.push(`核心内容: ${doc.content || ""}\n`);
    }
    return lines.join("\n");
  }
};

// =========================================================================
// 纯前端真实 Token 级流式大模型客户端
// =========================================================================
function resolveClientEndpoint(provider, baseUrl, model) {
  let prov = (provider || "").trim().toLowerCase();
  const mdl = (model || "").trim();
  const bUrl = (baseUrl || "").trim();

  if (!prov) {
    if (bUrl && !bUrl.includes("googleapis.com")) prov = "custom";
    else if (mdl.toLowerCase().includes("deepseek") && !mdl.includes("/")) prov = "deepseek";
    else if (mdl.toLowerCase().startsWith("gemini")) prov = "gemini";
    else prov = "siliconflow";
  }

  if (prov === "gemini") {
    const aliasMap = { "gemini-3.8-flash": "gemini-2.5-flash", "gemini-3.5-flash-lite": "gemini-2.5-flash-lite" };
    return {
      protocol: "gemini",
      baseUrl: PROVIDER_PRESETS.gemini.baseUrl,
      model: aliasMap[mdl] || mdl || "gemini-2.5-flash"
    };
  }

  const preset = PROVIDER_PRESETS[prov] || PROVIDER_PRESETS.siliconflow;
  return {
    protocol: "openai",
    baseUrl: (bUrl || preset.baseUrl || PROVIDER_PRESETS.siliconflow.baseUrl).replace(/\/+$/, ""),
    model: mdl || preset.defaultModel || "Qwen/Qwen2.5-7B-Instruct"
  };
}

async function streamClientLLM({ provider, baseUrl, apiKey, model, systemPrompt, userPrompt, history, signal, onToken }) {
  const key = (apiKey || "").trim();
  if (!key) return false;

  const resolved = resolveClientEndpoint(provider, baseUrl, model);
  if (resolved.protocol === "gemini") {
    const url = `${resolved.baseUrl}/models/${encodeURIComponent(resolved.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.35, maxOutputTokens: 3500 }
      })
    });
    if (!resp.ok) throw new Error(`Gemini HTTP ${resp.status}`);
    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buf = "";
    let gotAny = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const obj = JSON.parse(payload);
          const parts = obj?.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p.text) {
              gotAny = true;
              onToken(p.text);
            }
          }
        } catch (e) {}
      }
    }
    return gotAny;
  }

  const messages = [{ role: "system", content: systemPrompt }];
  if (Array.isArray(history)) {
    for (const t of history.slice(-6)) {
      if ((t.role === "user" || t.role === "assistant") && t.content) {
        messages.push({ role: t.role, content: String(t.content).slice(0, 600) });
      }
    }
  }
  messages.push({ role: "user", content: userPrompt });

  const resp = await fetch(`${resolved.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    signal,
    body: JSON.stringify({
      model: resolved.model,
      messages,
      temperature: 0.35,
      max_tokens: 3500,
      stream: true
    })
  });
  if (!resp.ok) {
    const errTxt = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status}: ${errTxt.slice(0, 120)}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buf = "";
  let gotAny = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") break;
      try {
        const obj = JSON.parse(payload);
        const piece = obj?.choices?.[0]?.delta?.content || "";
        if (piece) {
          gotAny = true;
          onToken(piece);
        }
      } catch (e) {}
    }
  }
  return gotAny;
}

async function callClientLLMComplete({ provider, baseUrl, apiKey, model, systemPrompt, userPrompt, maxTokens = 3200 }) {
  const key = (apiKey || "").trim();
  if (!key) return { text: null, error: "未提供 API Key" };
  const resolved = resolveClientEndpoint(provider, baseUrl, model);

  try {
    if (resolved.protocol === "gemini") {
      const url = `${resolved.baseUrl}/models/${encodeURIComponent(resolved.model)}:generateContent?key=${encodeURIComponent(key)}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.35, maxOutputTokens: maxTokens }
        })
      });
      if (!resp.ok) return { text: null, error: `Gemini HTTP ${resp.status}`, model: resolved.model };
      const data = await resp.json();
      return { text: data?.candidates?.[0]?.content?.parts?.[0]?.text || null, error: null, model: resolved.model };
    }

    const resp = await fetch(`${resolved.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: resolved.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.35,
        max_tokens: maxTokens
      })
    });
    if (!resp.ok) {
      const errTxt = await resp.text().catch(() => "");
      return { text: null, error: `HTTP ${resp.status}: ${errTxt.slice(0, 120)}`, model: resolved.model };
    }
    const data = await resp.json();
    return { text: data?.choices?.[0]?.message?.content || null, error: null, model: resolved.model };
  } catch (e) {
    return { text: null, error: e.message || String(e), model: resolved.model };
  }
}

function extractJsonObject(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  const fence = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fence) cleaned = fence[1];
  else {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);
  }
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    return null;
  }
}

function crc32Hash(str) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i);
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
  }
  return (crc ^ (-1)) >>> 0;
}

// =========================================================================
// 会话管理与全局应用状态
// =========================================================================
const INITIAL_WELCOME_MESSAGE = {
  role: "assistant",
  content: "您好！我是“屯垦智答”三五九旅红色文化学术导师与智能 AI 助手。我搭载 **Okapi BM25 + 语义向量混合检索引擎**，融合【权威文献知识库】与【老军垦一手访谈知识库】为您提供可溯源解答[1][2]：\n\n- **智能检索与多轮追问**：自动消解上下文代词，相关性不足的问题绝不强塞虚假引用；\n- **文档分块导入**：支持在左侧导入本地 `.txt` / `.md` 研究资料并自动切分建索引；\n- **真实流式生成**：在左下角「模型与 API 配置」填入硅基流动免费模型或 DeepSeek 密钥即可开启全领域自由对话。",
  traceText: "双轨知识库已就绪 · 预置 5 篇权威史料 + 1 篇实地访谈",
  citations: [
    {
      index: 1,
      doc_id: "AUTH-359-01",
      title: "进驻阿克苏与第一把军垦坎土曼的淬火诞生",
      type_label: "权威史料文献",
      is_official: true,
      source: "《三五九旅屯垦戍边实录》卷一",
      similarity: "95.2%",
      quote: "1950年2月，用废炮弹壳打制出第一把军垦坎土曼……标志着由‘一手拿枪’到‘一手拿镐’的历史性转变。"
    },
    {
      index: 2,
      doc_id: "FIELD-359-01",
      title: "【一手调研】93岁老战士张文生口述：打铁与血泡木柄",
      type_label: "一手调研访谈",
      is_official: false,
      source: "2024阿拉尔军垦新村访谈实录",
      similarity: "91.5%",
      quote: "木柄全是野胡杨，握起来粗糙，战士们手心全是血泡，血水浸进木把变成红褐色……这是打江山、保饭碗的命根子！"
    }
  ],
  showSources: true
};

function createFreshSession(title = "新考据对话") {
  return {
    id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    updatedAt: Date.now(),
    messages: [JSON.parse(JSON.stringify(INITIAL_WELCOME_MESSAGE))]
  };
}

function loadSavedSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return null;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length > 0 ? list : null;
  } catch (e) {
    return null;
  }
}

function loadSavedCustomSlices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_SLICES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveCustomSlices(allSlices) {
  try {
    const customUserOnly = allSlices.filter(s => String(s.id || "").startsWith("FIELD-USR-"));
    localStorage.setItem(STORAGE_KEYS.CUSTOM_SLICES, JSON.stringify(customUserOnly));
  } catch (e) {}
}

const privateCfg = (typeof window !== "undefined" && window.TUNKEN_PRIVATE_CONFIG) || {};
const initialSlices = [...DEFAULT_SLICES, ...loadSavedCustomSlices()];
ClientRAGEngine.loadDocuments(initialSlices);

const savedSessions = loadSavedSessions() || [createFreshSession("三五九旅史料探讨")];
const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
const initialActiveSession = savedSessions.find(s => s.id === savedActiveId) || savedSessions[0];

const AppState = {
  backendAvailable: false,
  activeTab: "chat",
  activeSubTab: "xhs",
  ragMode: localStorage.getItem(STORAGE_KEYS.RAG_MODE) || "hybrid",
  slices: initialSlices,
  carriers: [...DEFAULT_CARRIERS],
  selectedCarrierId: "fan",
  currentProductDesign: null,
  isChatSending: false,
  activeAbortController: null,
  activeOfflineTimer: null,
  provider: localStorage.getItem(STORAGE_KEYS.PROVIDER) || privateCfg.provider || "siliconflow",
  baseUrl: localStorage.getItem(STORAGE_KEYS.BASE_URL) || privateCfg.baseUrl || PROVIDER_PRESETS.siliconflow.baseUrl,
  apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || privateCfg.apiKey || "",
  selectedModel: localStorage.getItem(STORAGE_KEYS.MODEL) || privateCfg.model || PROVIDER_PRESETS.siliconflow.defaultModel,
  sessions: savedSessions,
  currentSessionId: initialActiveSession.id,
  campaignResult: JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN))
};

function getCurrentSession() {
  return AppState.sessions.find(s => s.id === AppState.currentSessionId) || AppState.sessions[0];
}

function persistSessions() {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(AppState.sessions.slice(0, 20)));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, AppState.currentSessionId);
  } catch (e) {}
}

// =========================================================================
// 初始化入口
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  renderHeaderCounts();
  renderSidebarModelStatus();
  bindNavTabs();
  bindMobileSidebar();
  renderSessionList();
  renderChatMessages();
  bindChatEvents();
  bindCampaignEvents();
  renderCampaignSection();
  renderCarriers();
  bindProductEvents();
  renderSelectedProduct(AppState.selectedCarrierId);
  bindModalAndDrawerEvents();
  detectBackend();
}

function renderHeaderCounts() {
  const official = AppState.slices.filter(s => s.type === "official").length;
  const custom = AppState.slices.filter(s => s.type === "custom").length;
  const offEl = document.getElementById("stat-official-count");
  const cusEl = document.getElementById("stat-custom-count");
  if (offEl) offEl.innerText = String(official);
  if (cusEl) cusEl.innerText = String(custom);
}

function renderSidebarModelStatus() {
  const labelEl = document.getElementById("sidebar-model-label");
  if (!labelEl) return;
  if (AppState.apiKey) {
    const shortMdl = (AppState.selectedModel || "在线模型").split("/").pop();
    labelEl.innerText = `已连接: ${shortMdl.slice(0, 16)}`;
  } else {
    labelEl.innerText = "模型与 API 配置 (未填Key)";
  }
}

function updateRuntimeBadge(isLocalBackend) {
  const badge = document.getElementById("runtime-mode-badge");
  const textEl = document.getElementById("runtime-mode-text");
  if (!badge || !textEl) return;
  if (isLocalBackend) {
    badge.classList.add("local");
    textEl.innerText = "本地后端混合 RAG 已连接";
  } else {
    badge.classList.remove("local");
    textEl.innerText = "独立混合 RAG 已就绪";
  }
}

async function detectBackend() {
  const host = window.location.hostname || "";
  if (window.location.protocol === "file:" || host.endsWith("github.io")) {
    AppState.backendAvailable = false;
    updateRuntimeBadge(false);
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1400);
    const healthResp = await fetch("/api/health", { signal: controller.signal });
    clearTimeout(timer);
    if (!healthResp.ok) throw new Error("not ok");

    AppState.backendAvailable = true;
    updateRuntimeBadge(true);

    // 将本地浏览器缓存的自定义切片同步给后端
    const localCustom = loadSavedCustomSlices();
    const sResp = await fetch("/api/presets/slices");
    if (sResp.ok) {
      const data = await sResp.json();
      if (Array.isArray(data.slices) && data.slices.length > 0) {
        const backendIds = new Set(data.slices.map(s => s.id));
        const merged = [...data.slices];
        for (const lc of localCustom) {
          if (!backendIds.has(lc.id)) merged.push(lc);
        }
        AppState.slices = merged;
        ClientRAGEngine.loadDocuments(AppState.slices);
        renderHeaderCounts();
      }
    }

    const cResp = await fetch("/api/product/carriers");
    if (cResp.ok) {
      const cData = await cResp.json();
      if (Array.isArray(cData.carriers) && cData.carriers.length > 0) {
        AppState.carriers = cData.carriers.map(c => {
          const localMatch = DEFAULT_CARRIERS.find(d => d.id === c.id);
          return { ...(localMatch || {}), ...c };
        });
        renderCarriers();
      }
    }
  } catch (e) {
    AppState.backendAvailable = false;
    updateRuntimeBadge(false);
  }
}

// =========================================================================
// 导航、移动端侧栏与多会话列表
// =========================================================================
function bindNavTabs() {
  const navBtns = document.querySelectorAll(".nav-item");
  const switchTab = (target) => {
    navBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === target));
    AppState.activeTab = target;
    document.getElementById("tab-chat").style.display = target === "chat" ? "flex" : "none";
    document.getElementById("tab-campaign").style.display = target === "campaign" ? "flex" : "none";
    document.getElementById("tab-product").style.display = target === "product" ? "flex" : "none";
    closeMobileSidebar();
  };

  navBtns.forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
  const brandHome = document.getElementById("brand-home-btn");
  if (brandHome) brandHome.addEventListener("click", () => switchTab("chat"));
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (sidebar) sidebar.classList.remove("open");
  if (backdrop) backdrop.style.display = "none";
}

function bindMobileSidebar() {
  const menuBtn = document.getElementById("btn-mobile-menu");
  const mobileDrawerBtn = document.getElementById("btn-mobile-drawer");
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");

  if (menuBtn && sidebar && backdrop) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.add("open");
      backdrop.style.display = "block";
    });
    backdrop.addEventListener("click", closeMobileSidebar);
  }
  if (mobileDrawerBtn) {
    mobileDrawerBtn.addEventListener("click", () => document.getElementById("btn-open-drawer")?.click());
  }
}

function renderSessionList() {
  const listEl = document.getElementById("session-list");
  if (!listEl) return;

  listEl.innerHTML = AppState.sessions.map(sess => `
    <div class="session-item ${sess.id === AppState.currentSessionId ? 'active' : ''}" onclick="selectSession('${escapeHtml(sess.id)}')">
      <span class="session-item-title">${escapeHtml(sess.title)}</span>
      <button class="session-del-btn" type="button" title="删除会话" onclick="event.stopPropagation(); deleteSession('${escapeHtml(sess.id)}')">×</button>
    </div>
  `).join("");
}

window.selectSession = function(sessionId) {
  if (AppState.isChatSending) return;
  AppState.currentSessionId = sessionId;
  persistSessions();
  renderSessionList();
  renderChatMessages();
  if (AppState.activeTab !== "chat") {
    document.querySelector('.nav-item[data-tab="chat"]')?.click();
  } else {
    closeMobileSidebar();
  }
};

window.deleteSession = function(sessionId) {
  if (AppState.isChatSending) return;
  AppState.sessions = AppState.sessions.filter(s => s.id !== sessionId);
  if (AppState.sessions.length === 0) {
    AppState.sessions.push(createFreshSession("新考据对话"));
  }
  if (!AppState.sessions.some(s => s.id === AppState.currentSessionId)) {
    AppState.currentSessionId = AppState.sessions[0].id;
  }
  persistSessions();
  renderSessionList();
  renderChatMessages();
};

// =========================================================================
// 模块一：混合 RAG + 真实流式 AI 助手对话渲染与控制
// =========================================================================
function formatSimilarity(sim) {
  if (typeof sim === "number" && !Number.isNaN(sim)) {
    const pct = sim <= 1 ? sim * 100 : sim;
    return `${pct.toFixed(1)}%`;
  }
  return escapeHtml(String(sim || "--"));
}

function buildTraceSummary(analysis, citations) {
  if (!analysis) return "";
  if (analysis.intent === "chitchat") {
    return "日常对话 · 未调用史料库";
  }
  const count = (citations || []).length;
  const rewritePart = analysis.is_rewritten && analysis.rewritten_query
    ? `多轮指代改写「${analysis.rewritten_query.slice(0, 22)}」 · `
    : "";
  if (count === 0) {
    return `${rewritePart}混合检索完成 · 无达标切片（已过滤无关噪声）`;
  }
  return `${rewritePart}BM25 + 语义向量混合检索 · 命中 ${count} 篇高相关史料`;
}

function renderChatMarkdown(text, msgIdx = 0) {
  if (!text) return "";
  const codeBlocks = [];
  let safe = escapeHtml(text);

  // 保护多行代码块
  safe = safe.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return `@@CODEBLOCK_${idx}@@`;
  });

  // 行内代码
  safe = safe.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  // 标题
  safe = safe.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
  safe = safe.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  safe = safe.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  safe = safe.replace(/^# (.*$)/gm, "<h1>$1</h1>");
  // 引用块
  safe = safe.replace(/^&gt; (.*$)/gm, "<blockquote>$1</blockquote>");
  // 加粗
  safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // 引用角标 [1]
  safe = safe.replace(
    /\[(\d+)\]/g,
    `<span class="citation-badge" title="定位考据切片 [$1]" onclick="focusCitation(${msgIdx}, $1)">[$1]</span>`
  );

  // 处理无序/有序列表与段落
  const lines = safe.split("\n");
  const out = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);

    if (ulMatch) {
      if (inOl) { out.push("</ol>"); inOl = false; }
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (!inOl) { out.push("<ol>"); inOl = true; }
      out.push(`<li>${olMatch[1]}</li>`);
    } else if (!trimmed) {
      closeLists();
      out.push("");
    } else {
      closeLists();
      if (/^<(h[1-4]|blockquote|pre)/.test(trimmed) || /^@@CODEBLOCK_\d+@@$/.test(trimmed)) {
        out.push(trimmed);
      } else {
        out.push(`<p>${trimmed}</p>`);
      }
    }
  }
  closeLists();

  let html = out.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
  html = html.replace(/@@CODEBLOCK_(\d+)@@/g, (_, idx) => codeBlocks[Number(idx)] || "");
  return html;
}

function renderChatMessages() {
  const container = document.getElementById("chat-message-list");
  if (!container) return;
  const sess = getCurrentSession();
  const messages = sess ? sess.messages : [];

  container.innerHTML = messages.map((msg, idx) => {
    if (msg.role === "user") {
      return `
        <div class="chat-row user">
          <div class="avatar-user">访</div>
          <div class="bubble-user">${escapeHtml(msg.content)}</div>
        </div>
      `;
    }

    const hasHits = msg.citations && msg.citations.length > 0;
    const traceHtml = msg.traceText
      ? `<div class="rag-trace-bar"><span class="rag-trace-dot ${hasHits ? '' : 'empty'}"></span><span>${escapeHtml(msg.traceText)}</span></div>`
      : "";

    const contentHtml = msg.content
      ? `<div class="chat-md-body">${renderChatMarkdown(msg.content, idx)}</div>`
      : `<div class="typing-dots">正在分析问题并执行混合检索 <span></span><span></span><span></span></div>`;

    let sourcesHtml = "";
    if (hasHits) {
      const cardsHtml = msg.citations.map(c => {
        const isOfficial = c.is_official !== undefined ? c.is_official : c.type === "official";
        const simText = formatSimilarity(c.similarity);
        const docTag = c.doc_id ? `<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">${escapeHtml(c.doc_id)}</span>` : "";
        return `
          <div id="source-card-${idx}-${c.index}" class="source-card">
            <div class="source-header">
              <div class="source-title-wrap">
                <span class="${isOfficial ? 'tag-official' : 'tag-custom'}">${escapeHtml(c.type_label || (isOfficial ? '权威史料文献' : '一手调研访谈'))}</span>
                ${docTag}
                <strong>[${escapeHtml(String(c.index || ""))}] ${escapeHtml(c.title)}</strong>
              </div>
              <span class="source-sim">相关性 ${simText}</span>
            </div>
            <div class="source-meta">来源：${escapeHtml(c.source)}</div>
            <div class="source-quote">“${escapeHtml(c.quote)}”</div>
          </div>
        `;
      }).join("");

      sourcesHtml = `
        <div class="sources-panel">
          <button class="sources-toggle-btn" onclick="toggleSources(${idx})" type="button">
            <span>${msg.showSources ? '▾' : '▸'} 参考来源与考据溯源切片 (${msg.citations.length} 篇依据)</span>
          </button>
          <div id="sources-list-${idx}" class="sources-cards" style="display: ${msg.showSources ? 'flex' : 'none'};">
            ${cardsHtml}
          </div>
        </div>
      `;
    }

    const actionsHtml = (msg.content && idx > 0) ? `
      <div class="msg-action-bar">
        <button class="msg-action-btn" type="button" onclick="copyMsgContent(${idx})">复制回答</button>
        <button class="msg-action-btn" type="button" onclick="regenerateMsg(${idx})">重新生成</button>
      </div>
    ` : "";

    return `
      <div class="chat-row assistant">
        <div class="avatar-ai">垦</div>
        <div class="bubble-ai">
          ${traceHtml}
          ${contentHtml}
          ${sourcesHtml}
          ${actionsHtml}
        </div>
      </div>
    `;
  }).join("");

  const scrollBox = container.parentElement;
  if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;
}

window.copyMsgContent = function(idx) {
  const sess = getCurrentSession();
  const msg = sess?.messages?.[idx];
  if (msg && msg.content) copyText(msg.content, "AI 回答");
};

window.regenerateMsg = function(idx) {
  if (AppState.isChatSending) return;
  const sess = getCurrentSession();
  if (!sess || !sess.messages[idx]) return;
  let prevUserQuery = "";
  for (let i = idx - 1; i >= 0; i--) {
    if (sess.messages[i].role === "user") {
      prevUserQuery = sess.messages[i].content;
      sess.messages = sess.messages.slice(0, i);
      break;
    }
  }
  if (prevUserQuery && window.__triggerSendChat) {
    renderChatMessages();
    window.__triggerSendChat(prevUserQuery);
  }
};

window.toggleSources = function(idx) {
  const sess = getCurrentSession();
  const el = document.getElementById(`sources-list-${idx}`);
  if (el && sess?.messages?.[idx]) {
    const isShown = el.style.display === "flex";
    el.style.display = isShown ? "none" : "flex";
    sess.messages[idx].showSources = !isShown;
    const btn = el.previousElementSibling;
    if (btn) {
      const count = (sess.messages[idx].citations || []).length;
      btn.innerHTML = `<span>${!isShown ? '▾' : '▸'} 参考来源与考据溯源切片 (${count} 篇依据)</span>`;
    }
    persistSessions();
  }
};

window.focusCitation = function(msgIdx, citeIdx) {
  const listEl = document.getElementById(`sources-list-${msgIdx}`);
  if (listEl && listEl.style.display !== "flex") window.toggleSources(msgIdx);
  const card = document.getElementById(`source-card-${msgIdx}-${citeIdx}`);
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    card.classList.add("highlight");
    setTimeout(() => card.classList.remove("highlight"), 1600);
  }
};

function setChatSendingState(sending) {
  AppState.isChatSending = sending;
  const sendBtn = document.getElementById("btn-send-chat");
  const stopBtn = document.getElementById("btn-stop-chat");
  if (sendBtn) sendBtn.disabled = sending;
  if (stopBtn) stopBtn.style.display = sending ? "inline-flex" : "none";
}

function stopActiveGeneration() {
  if (AppState.activeAbortController) {
    AppState.activeAbortController.abort();
    AppState.activeAbortController = null;
  }
  if (AppState.activeOfflineTimer) {
    clearInterval(AppState.activeOfflineTimer);
    AppState.activeOfflineTimer = null;
  }
  setChatSendingState(false);
  persistSessions();
  renderChatMessages();
  showToast("已停止生成", "info");
}

function buildClientExtractiveAnswer(query, retrieved, analysis, ragMode) {
  if (analysis.intent === "chitchat") {
    return (
      "您好！我是 **屯垦智答 AI 助手**。\n\n" +
      "- **混合知识库检索（本地已就绪）**：内置 Okapi BM25 + 语义同义词向量引擎，支持询问三五九旅开荒、第一把坎土曼、百里胜利渠、红柳地窝子、老纺车或老战士访谈细节，也支持在左侧导入 `.txt`/`.md` 研究资料。\n" +
      "- **全领域自由流式对话**：点击左下角 **「模型与 API 配置」** 填入硅基流动免费模型（`Qwen/Qwen2.5-7B-Instruct`）或 DeepSeek 密钥，即可开启完整生成式 AI 对话。"
    );
  }

  if (!retrieved.length) {
    if (ragMode === "strict") {
      return "根据当前已收录的【权威史料文献】与【一手调研访谈】双轨知识库检索结果，暂无与该问题直接相关的档案记载。";
    }
    return (
      `当前本地双轨知识库未命中与 **“${query}”** 直接相关的三五九旅史料（已自动过滤低相关性切片，避免乱标引用）。\n\n` +
      "您可以：\n" +
      "1. 点击左下角 **「模型与 API 配置」** 填入大模型 API Key（支持硅基流动免费模型、DeepSeek、通义千问、Gemini），解锁全领域智能对话；\n" +
      "2. 点击侧栏 **「导入文档 / 录入访谈」** 补充相关文献或 `.txt`/`.md` 笔记。"
    );
  }

  const effectiveQ = analysis.rewritten_query || query;
  const extracted = ClientRAGEngine.extractRelevantSentences(effectiveQ, retrieved, 2);
  const lines = ["基于双轨知识库混合检索（BM25 + 语义向量）命中的相关档案，为您梳理考据要点如下：\n"];
  for (const item of extracted.slice(0, 3)) {
    const track = item.doc.type === "official" ? "权威史料" : "一手访谈";
    lines.push(`- **《${item.doc.title}》**（${track} · ${item.doc.source}）：${item.sentences.join("")}[${item.index}]`);
  }
  lines.push("\n> 提示：当前为本地精准检索摘录模式；在左下角「模型与 API 配置」填入在线大模型密钥后，可开启深度跨文档归纳与自由追问。");
  return lines.join("\n");
}

function bindChatEvents() {
  const sendBtn = document.getElementById("btn-send-chat");
  const stopBtn = document.getElementById("btn-stop-chat");
  const input = document.getElementById("chat-input");
  const clearBtn = document.getElementById("btn-clear-chat");
  const newSessionBtn = document.getElementById("btn-new-session");

  // 问答模式切换
  const segBtns = document.querySelectorAll(".mode-seg-btn");
  segBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.ragMode === AppState.ragMode);
    btn.addEventListener("click", () => {
      AppState.ragMode = btn.dataset.ragMode;
      localStorage.setItem(STORAGE_KEYS.RAG_MODE, AppState.ragMode);
      segBtns.forEach(b => b.classList.toggle("active", b.dataset.ragMode === AppState.ragMode));
      showToast(AppState.ragMode === "strict" ? "已切换至：严格史料考据模式" : "已切换至：智能助手模式（知识库优先）", "info");
    });
  });

  if (input) {
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(132, input.scrollHeight)}px`;
    });
  }

  const doSend = async (queryText) => {
    if (AppState.isChatSending) return;
    const q = (queryText !== undefined ? queryText : input.value).trim();
    if (!q) return;

    if (input && queryText === undefined) {
      input.value = "";
      input.style.height = "auto";
    }

    const sess = getCurrentSession();
    const historyBefore = sess.messages.slice(1).map(m => ({ role: m.role, content: m.content }));

    // 首条用户提问自动更新会话标题
    if (sess.messages.filter(m => m.role === "user").length === 0) {
      sess.title = q.slice(0, 16) + (q.length > 16 ? "…" : "");
      renderSessionList();
    }
    sess.updatedAt = Date.now();
    sess.messages.push({ role: "user", content: q });
    setChatSendingState(true);
    renderChatMessages();

    const abortCtrl = new AbortController();
    AppState.activeAbortController = abortCtrl;

    if (AppState.backendAvailable) {
      try {
        const resp = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortCtrl.signal,
          body: JSON.stringify({
            query: q,
            history: historyBefore,
            api_key: AppState.apiKey,
            model: AppState.selectedModel,
            provider: AppState.provider,
            base_url: AppState.baseUrl,
            rag_mode: AppState.ragMode
          })
        });

        if (resp.ok && resp.body) {
          const reader = resp.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";
          const aiMsg = { role: "assistant", content: "", traceText: "", citations: [], showSources: true };
          sess.messages.push(aiMsg);
          renderChatMessages();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop();
            for (const p of parts) {
              const trimmed = p.trim();
              if (!trimmed.startsWith("data:")) continue;
              try {
                const event = JSON.parse(trimmed.replace(/^data:\s*/, ""));
                if (event.type === "retrieval_ready") {
                  aiMsg.citations = event.citations || [];
                  aiMsg.traceText = buildTraceSummary(event.analysis, aiMsg.citations);
                  renderChatMessages();
                } else if (event.type === "content_chunk") {
                  aiMsg.content = event.accumulated;
                  renderChatMessages();
                } else if (event.type === "chat_finished") {
                  aiMsg.content = event.full_answer;
                  aiMsg.citations = event.citations || [];
                  aiMsg.traceText = buildTraceSummary(event.analysis, aiMsg.citations);
                  renderChatMessages();
                }
              } catch (e) {}
            }
          }
          AppState.activeAbortController = null;
          setChatSendingState(false);
          persistSessions();
          return;
        }
      } catch (e) {
        if (e.name === "AbortError") return;
        AppState.backendAvailable = false;
        updateRuntimeBadge(false);
      }
    }

    await runStandaloneHybridChat(q, historyBefore, sess, abortCtrl);
  };

  window.__triggerSendChat = doSend;

  if (sendBtn && input) {
    sendBtn.addEventListener("click", () => doSend());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    });
  }

  if (stopBtn) stopBtn.addEventListener("click", stopActiveGeneration);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (AppState.isChatSending) return;
      const sess = getCurrentSession();
      sess.messages = [JSON.parse(JSON.stringify(INITIAL_WELCOME_MESSAGE))];
      persistSessions();
      renderChatMessages();
      showToast("当前对话已重置", "info");
    });
  }

  if (newSessionBtn) {
    newSessionBtn.addEventListener("click", () => {
      if (AppState.isChatSending) return;
      const fresh = createFreshSession("新考据对话");
      AppState.sessions.unshift(fresh);
      AppState.currentSessionId = fresh.id;
      persistSessions();
      renderSessionList();
      renderChatMessages();
      if (AppState.activeTab !== "chat") {
        document.querySelector('.nav-item[data-tab="chat"]')?.click();
      } else {
        closeMobileSidebar();
      }
      showToast("已创建新对话", "success");
    });
  }

  document.querySelectorAll(".quick-pill").forEach(pill => {
    pill.addEventListener("click", () => doSend(pill.innerText.trim()));
  });
}

async function runStandaloneHybridChat(query, historyBefore, sess, abortCtrl) {
  ClientRAGEngine.loadDocuments(AppState.slices);
  const analysis = ClientRAGEngine.analyzeQuery(query, historyBefore);
  const retrieved = ClientRAGEngine.search(query, 4, historyBefore);
  const citations = retrieved.map(item => ({
    index: item.index,
    doc_id: item.slice.id,
    type: item.slice.type || "official",
    is_official: item.slice.type === "official",
    type_label: item.slice.type_label || "权威史料文献",
    title: item.slice.title,
    source: item.slice.source,
    similarity: item.similarity,
    quote: (item.slice.content || "").slice(0, 140) + ((item.slice.content || "").length > 140 ? "..." : "")
  }));

  const aiMsg = {
    role: "assistant",
    content: "",
    traceText: buildTraceSummary(analysis, citations),
    citations,
    showSources: true
  };
  sess.messages.push(aiMsg);
  renderChatMessages();

  if (AppState.apiKey) {
    const context = ClientRAGEngine.buildContext(retrieved);
    const sysPrompt = AppState.ragMode === "strict"
      ? "你是专注三五九旅军垦历史与口述史的严格考据专家。仅基于提供的双轨知识库回答，句末标 [n] 角标；若未提及请如实告知暂无相关记载。"
      : "你是“屯垦智答”智能 AI 助手。当检索证据包含相关切片时，优先依据史料回答并在句末标注对应 [n] 角标（切勿编造不存在的编号）；当检索证据为空时，自然清晰地回答用户问题，不要添加任何 [1] 引用角标。";
    const userPrompt = `${context}\n\n【用户当前提问】：${query}`;

    try {
      const ok = await streamClientLLM({
        provider: AppState.provider,
        baseUrl: AppState.baseUrl,
        apiKey: AppState.apiKey,
        model: AppState.selectedModel,
        systemPrompt: sysPrompt,
        userPrompt,
        history: historyBefore,
        signal: abortCtrl.signal,
        onToken: (tok) => {
          aiMsg.content += tok;
          renderChatMessages();
        }
      });
      if (ok && aiMsg.content.trim()) {
        AppState.activeAbortController = null;
        setChatSendingState(false);
        persistSessions();
        return;
      }
    } catch (e) {
      if (e.name === "AbortError") return;
      aiMsg.content = `> 在线模型连接异常（${e.message || "请求失败"}），已自动切换本地混合检索结果：\n\n`;
    }
  }

  const fallback = (aiMsg.content || "") + buildClientExtractiveAnswer(query, retrieved, analysis, AppState.ragMode);
  let i = aiMsg.content.length;
  AppState.activeOfflineTimer = setInterval(() => {
    i += 24;
    aiMsg.content = fallback.slice(0, i);
    renderChatMessages();
    if (i >= fallback.length) {
      clearInterval(AppState.activeOfflineTimer);
      AppState.activeOfflineTimer = null;
      aiMsg.content = fallback;
      AppState.activeAbortController = null;
      setChatSendingState(false);
      persistSessions();
      renderChatMessages();
    }
  }, 24);
}

// =========================================================================
// 模块二：新媒体全案传播与调查问卷
// =========================================================================
function normalizeDouyinScript(raw) {
  if (Array.isArray(raw)) {
    return {
      title: "《回响在冻土下的打铁声》（60秒短视频/分镜头脚本）",
      bpm: "低沉心跳 -> 激昂打铁重音 -> 壮阔冬不拉交响",
      scenes: raw
    };
  }
  if (raw && typeof raw === "object" && Array.isArray(raw.scenes)) {
    return {
      title: raw.title || "《回响在冻土下的打铁声》",
      bpm: raw.bpm || "低沉心跳 -> 激昂打铁重音 -> 壮阔冬不拉交响",
      scenes: raw.scenes
    };
  }
  return { title: "短视频分镜脚本", bpm: "情感递进配乐", scenes: [] };
}

function renderCampaignSection() {
  const result = AppState.campaignResult;
  const xhs = result.xiaohongshu || { title: "", tags: [], body: "" };

  const xhsTitleEl = document.getElementById("xhs-title");
  const xhsBodyEl = document.getElementById("xhs-body");
  const xhsTagsEl = document.getElementById("xhs-tags");
  if (xhsTitleEl) xhsTitleEl.innerText = xhs.title || "";
  if (xhsBodyEl) xhsBodyEl.innerText = xhs.body || "";
  if (xhsTagsEl) {
    xhsTagsEl.innerHTML = (xhs.tags || []).map(t => `<span class="xhs-tag-item">${escapeHtml(t)}</span>`).join("");
  }

  const douyinData = normalizeDouyinScript(result.douyin_script);
  const douyinTitleEl = document.getElementById("douyin-script-title");
  const douyinBpmEl = document.getElementById("douyin-script-bpm");
  const douyinBtnEl = document.getElementById("subtab-douyin-btn");
  if (douyinTitleEl) douyinTitleEl.innerText = douyinData.title;
  if (douyinBpmEl) douyinBpmEl.innerText = `BGM 指导：${douyinData.bpm}`;
  if (douyinBtnEl) douyinBtnEl.innerText = `抖音短视频分镜 (${douyinData.scenes.length}个镜头)`;

  const douyinTbody = document.getElementById("douyin-tbody");
  if (douyinTbody) {
    douyinTbody.innerHTML = douyinData.scenes.map((s, idx) => {
      const sceneNum = s.scene_num ?? s.num ?? (idx + 1);
      return `
        <tr>
          <td>
            <div class="scene-num">镜头 ${escapeHtml(String(sceneNum))}</div>
            <div class="scene-time">${escapeHtml(s.time || "")}</div>
            <div class="scene-shot">${escapeHtml(s.shot || "")}</div>
          </td>
          <td>${escapeHtml(s.visual || "")}</td>
          <td style="color: var(--brass);">${escapeHtml(s.audio || "")}</td>
          <td style="font-weight: 500;">${escapeHtml(s.dialogue || "")}</td>
        </tr>
      `;
    }).join("");
  }

  const surveyBox = document.getElementById("survey-rendered-box");
  if (surveyBox) {
    surveyBox.innerHTML = renderMarkdownToHtml(result.survey_markdown || "");
  }
}

async function generateCampaignStandalone(topic) {
  const cleanTopic = topic.trim() || DEFAULT_CAMPAIGN.topic;
  if (AppState.apiKey) {
    ClientRAGEngine.loadDocuments(AppState.slices);
    const retrieved = ClientRAGEngine.search(cleanTopic, 2);
    const context = ClientRAGEngine.buildContext(retrieved);
    const { text: raw } = await callClientLLMComplete({
      provider: AppState.provider,
      baseUrl: AppState.baseUrl,
      apiKey: AppState.apiKey,
      model: AppState.selectedModel,
      systemPrompt: "你是新媒体传播战略策划总监与社会调查学者，只输出合法 JSON。",
      userPrompt: `围绕“${cleanTopic}”及以下三五九旅史料生成方案：\n${context}\n\n请只输出合法 JSON：{"xiaohongshu":{"title":"...","tags":["#..."],"body":"..."},"douyin_script":{"title":"...","bpm":"...","scenes":[{"num":1,"time":"00:00-00:15","shot":"特写","visual":"...","audio":"...","dialogue":"..."}]},"survey_markdown":"# 《...》\\n..."}`
    });
    const parsed = extractJsonObject(raw);
    if (parsed && parsed.xiaohongshu && parsed.survey_markdown) {
      return {
        topic: cleanTopic,
        xiaohongshu: parsed.xiaohongshu,
        douyin_script: parsed.douyin_script || JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN.douyin_script)),
        survey_markdown: parsed.survey_markdown,
        is_mock: false
      };
    }
  }

  const res = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN));
  res.topic = cleanTopic;
  if (cleanTopic !== DEFAULT_CAMPAIGN.topic) {
    res.xiaohongshu.title = `【${cleanTopic}】70年前这届三五九旅军垦青年，到底有多硬核？`;
    res.xiaohongshu.body = `本期专题：${cleanTopic}\n\n` + res.xiaohongshu.body;
    res.douyin_script.title = `《${cleanTopic} · 冻土下的回响》（60秒短视频分镜头脚本）`;
    res.survey_markdown = res.survey_markdown.replace(
      "# 《三五九旅红色文化青年群体传播效果与文创接受度调查问卷》",
      `# 《${cleanTopic}——三五九旅红色文化青年传播效果调查问卷》`
    );
  }
  res.is_mock = true;
  return res;
}

function bindCampaignEvents() {
  const subBtns = document.querySelectorAll(".sub-tab-btn");
  subBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      subBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.sub;
      AppState.activeSubTab = target;
      document.getElementById("subtab-xhs").style.display = target === "xhs" ? "grid" : "none";
      document.getElementById("subtab-douyin").style.display = target === "douyin" ? "block" : "none";
      document.getElementById("subtab-survey").style.display = target === "survey" ? "block" : "none";
    });
  });

  const genBtn = document.getElementById("btn-generate-campaign");
  const topicInput = document.getElementById("campaign-topic-input");

  const triggerCampaignGenerate = async () => {
    const topic = (topicInput?.value || "").trim();
    if (!topic) return showToast("请输入传播核心命题", "error");
    if (genBtn) {
      genBtn.disabled = true;
      genBtn.innerText = "方案构思中...";
    }

    try {
      if (AppState.backendAvailable) {
        const resp = await fetch("/api/campaign/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            api_key: AppState.apiKey,
            model: AppState.selectedModel,
            provider: AppState.provider,
            base_url: AppState.baseUrl
          })
        });
        if (resp.ok) {
          AppState.campaignResult = await resp.json();
          renderCampaignSection();
          showToast(AppState.campaignResult.is_mock ? "已生成传播全案与调查问卷" : "已通过大模型生成定制全案与问卷", "success");
          return;
        }
      }
      AppState.campaignResult = await generateCampaignStandalone(topic);
      renderCampaignSection();
      showToast(AppState.campaignResult.is_mock ? "已生成传播全案与调查问卷" : "已通过大模型生成定制全案", "success");
    } catch (e) {
      AppState.campaignResult = await generateCampaignStandalone(topic);
      renderCampaignSection();
      showToast("已生成传播全案与调查问卷", "info");
    } finally {
      if (genBtn) {
        genBtn.disabled = false;
        genBtn.innerText = "一键生成全案与问卷";
      }
    }
  };

  if (genBtn && topicInput) genBtn.addEventListener("click", triggerCampaignGenerate);
  document.querySelectorAll(".preset-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      if (topicInput) topicInput.value = chip.dataset.topic || chip.innerText;
      triggerCampaignGenerate();
    });
  });

  const copyXhsBtn = document.getElementById("btn-copy-xhs");
  if (copyXhsBtn) copyXhsBtn.onclick = () => copyText((AppState.campaignResult.xiaohongshu || {}).body || "", "小红书正文文案");

  const copySurveyBtn = document.getElementById("btn-copy-survey");
  if (copySurveyBtn) copySurveyBtn.onclick = () => copyText(AppState.campaignResult.survey_markdown || "", "调查问卷 Markdown");

  const downloadSurveyBtn = document.getElementById("btn-download-survey");
  if (downloadSurveyBtn) {
    downloadSurveyBtn.onclick = () => {
      const blob = new Blob([AppState.campaignResult.survey_markdown || ""], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "三五九旅红色文化青年传播效果调查问卷.md";
      a.click();
      URL.revokeObjectURL(url);
      showToast("已导出调查问卷 Markdown 文件", "success");
    };
  }
}

// =========================================================================
// 模块三：实用实体文创设计与工业蓝图兜底
// =========================================================================
function buildProductFallbackSvg(item) {
  const safeName = (item.name || "三五九旅文创").replace(/[<>&"]/g, "");
  const safeSub = (item.subtitle || "").replace(/[<>&"]/g, "");
  const safeColor = (item.color_scheme || "").replace(/[<>&"]/g, "");
  const swatches = (item.swatches || []).slice(0, 3);
  const swatchRects = swatches.map((s, idx) =>
    `<rect x="${260 + idx * 100}" y="585" width="78" height="22" rx="4" fill="${s.hex}" stroke="#1C1917" stroke-opacity="0.2"/>`
  ).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="#F5F2EB"/>
    <rect x="44" y="44" width="712" height="712" rx="16" fill="#FCFBF8" stroke="#1C1917" stroke-opacity="0.16" stroke-width="1.5"/>
    <rect x="64" y="64" width="672" height="672" rx="10" fill="none" stroke="#B42318" stroke-opacity="0.22" stroke-dasharray="6 6"/>
    <text x="92" y="106" font-size="15" font-family="monospace" fill="#78716C">ARCHIVE SPEC · 359TH BRIGADE INDUSTRIAL DESIGN</text>
    <circle cx="400" cy="300" r="108" fill="#FDF2F2" stroke="#B42318" stroke-width="2.5"/>
    <rect x="356" y="256" width="88" height="88" rx="12" fill="#B42318"/>
    <text x="400" y="317" text-anchor="middle" font-size="52" font-weight="600" fill="#FCFBF8" font-family="serif">垦</text>
    <text x="400" y="472" text-anchor="middle" font-size="30" font-weight="600" fill="#1C1917" font-family="serif">${safeName}</text>
    <text x="400" y="514" text-anchor="middle" font-size="19" fill="#57534E" font-family="sans-serif">${safeSub}</text>
    <text x="400" y="562" text-anchor="middle" font-size="16" fill="#78716C" font-family="sans-serif">${safeColor}</text>
    ${swatchRects}
    <text x="400" y="675" text-anchor="middle" font-size="14" fill="#78716C" font-family="sans-serif">工业打样蓝图预览（若外部生图服务网络受限则自动展示本地矢量图纸）</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function renderCarriers() {
  const container = document.getElementById("carriers-grid");
  if (!container) return;

  container.innerHTML = AppState.carriers.map((c, idx) => `
    <div class="carrier-card ${AppState.selectedCarrierId === c.id ? 'selected' : ''}" onclick="selectCarrier('${escapeHtml(c.id)}')">
      <div class="carrier-code-row">
        <span>0${idx + 1}</span>
        <span>${AppState.selectedCarrierId === c.id ? '已选定' : '实体载体'}</span>
      </div>
      <div>
        <div class="carrier-title">${escapeHtml(c.name)}</div>
        <div class="carrier-sub">${escapeHtml(c.subtitle)}</div>
      </div>
    </div>
  `).join("");
}

window.selectCarrier = function(carrierId) {
  AppState.selectedCarrierId = carrierId;
  renderCarriers();
  const topicInput = document.getElementById("product-topic-input");
  const customTopic = topicInput ? topicInput.value.trim() : "";
  if (customTopic) generateProductDesignUnified(carrierId, customTopic);
  else renderSelectedProduct(carrierId);
};

async function generateProductDesignStandalone(carrierId, customTopic) {
  const base = AppState.carriers.find(c => c.id === carrierId) || AppState.carriers[0];
  const cleanTopic = (customTopic || "").trim();
  let subtitle = base.subtitle;
  let features = base.features;
  let colorScheme = base.color_scheme;
  let materials = base.materials;
  let promptEn = base.prompt_en;
  let actualIsMock = true;

  if (AppState.apiKey && cleanTopic) {
    const { text: raw } = await callClientLLMComplete({
      provider: AppState.provider,
      baseUrl: AppState.baseUrl,
      apiKey: AppState.apiKey,
      model: AppState.selectedModel,
      systemPrompt: "你是红色文创主理人与工业设计师，只返回合法 JSON。",
      userPrompt: `为载体「${base.name}」结合主题「${cleanTopic}」输出设计规格 JSON：{"subtitle":"...","features":"...","color_scheme":"...","materials":"...","prompt_en":"..."}`
    });
    const parsed = extractJsonObject(raw);
    if (parsed && parsed.prompt_en) {
      subtitle = parsed.subtitle || subtitle;
      features = parsed.features || features;
      colorScheme = parsed.color_scheme || colorScheme;
      materials = parsed.materials || materials;
      promptEn = parsed.prompt_en || promptEn;
      actualIsMock = false;
    }
  }

  if (actualIsMock && cleanTopic) {
    subtitle = `${base.subtitle} · 「${cleanTopic.slice(0, 16)}」定制款`;
    features = `融入「${cleanTopic}」精神纹样定制铭牌；${base.features}`;
    promptEn = `${base.prompt_en}, themed around ${cleanTopic}`;
  }

  const seed = 3590 + (crc32Hash(`${carrierId}:${cleanTopic}`) % 1000);
  const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptEn)}?width=800&height=800&nologo=true&seed=${seed}&model=flux`;

  return {
    carrier_id: base.id,
    name: base.name,
    subtitle,
    features,
    color_scheme: colorScheme,
    swatches: base.swatches || [],
    materials,
    prompts: { en: promptEn },
    image_url: imgUrl,
    fallback_image_url: base.mock_img,
    is_mock: actualIsMock
  };
}

async function generateProductDesignUnified(carrierId, customTopic) {
  const genBtn = document.getElementById("btn-generate-product");
  const loadingEl = document.getElementById("prod-img-loading");
  if (genBtn) {
    genBtn.disabled = true;
    genBtn.innerText = "方案生成中...";
  }
  if (loadingEl) loadingEl.style.display = "flex";

  try {
    let design;
    if (AppState.backendAvailable) {
      const resp = await fetch("/api/product/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier_id: carrierId,
          topic: customTopic,
          api_key: AppState.apiKey,
          model: AppState.selectedModel,
          provider: AppState.provider,
          base_url: AppState.baseUrl
        })
      });
      if (resp.ok) design = await resp.json();
    }
    if (!design) design = await generateProductDesignStandalone(carrierId, customTopic);

    const base = AppState.carriers.find(c => c.id === carrierId) || AppState.carriers[0];
    AppState.currentProductDesign = design;
    applyProductToView({
      id: design.carrier_id,
      name: design.name,
      subtitle: design.subtitle,
      features: design.features,
      color_scheme: design.color_scheme,
      swatches: design.swatches || base.swatches || [],
      materials: design.materials,
      prompt_en: (design.prompts || {}).en || "",
      mock_img: design.image_url,
      fallback_image_url: design.fallback_image_url
    });
    showToast(`已生成【${design.name}】设计方案与商业摄影概念图`, "success");
  } catch (e) {
    renderSelectedProduct(carrierId);
    showToast("已切换本地默认文创方案", "info");
  } finally {
    if (genBtn) {
      genBtn.disabled = false;
      genBtn.innerText = "生成定制方案与概念图";
    }
  }
}

function applyProductToView(item) {
  const titleEl = document.getElementById("prod-title");
  const colorEl = document.getElementById("prod-color");
  const swatchesEl = document.getElementById("prod-swatches");
  const materialEl = document.getElementById("prod-material");
  const featuresEl = document.getElementById("prod-features");
  const promptEl = document.getElementById("prod-prompt");
  const imgEl = document.getElementById("prod-image");
  const loadingEl = document.getElementById("prod-img-loading");

  if (titleEl) titleEl.innerText = `${item.name} · ${item.subtitle}`;
  if (colorEl) colorEl.innerText = item.color_scheme;
  if (swatchesEl) {
    swatchesEl.innerHTML = (item.swatches || []).map(sw => `
      <span class="swatch-chip">
        <span class="swatch-dot" style="background:${escapeHtml(sw.hex)};"></span>
        <span>${escapeHtml(sw.label)}</span>
      </span>
    `).join("");
  }
  if (materialEl) materialEl.innerText = item.materials;
  if (featuresEl) featuresEl.innerText = item.features;
  if (promptEl) promptEl.innerText = item.prompt_en;

  if (imgEl) {
    let triedFallback = false;
    if (loadingEl) loadingEl.style.display = "flex";
    imgEl.onload = () => { if (loadingEl) loadingEl.style.display = "none"; };
    imgEl.onerror = () => {
      if (!triedFallback && item.fallback_image_url && imgEl.src !== item.fallback_image_url) {
        triedFallback = true;
        imgEl.src = item.fallback_image_url;
        return;
      }
      if (loadingEl) loadingEl.style.display = "none";
      imgEl.onerror = null;
      imgEl.src = buildProductFallbackSvg(item);
    };
    imgEl.src = item.mock_img;
    imgEl.alt = item.name;
  }

  const copyPromptBtn = document.getElementById("btn-copy-prompt");
  if (copyPromptBtn) copyPromptBtn.onclick = () => copyText(item.prompt_en, "商业摄影生图 Prompt");

  const downloadImgBtn = document.getElementById("btn-download-img");
  if (downloadImgBtn) {
    downloadImgBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = (imgEl && imgEl.src) ? imgEl.src : item.mock_img;
      a.download = `${item.name}-设计概念图.png`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
  }
}

function renderSelectedProduct(carrierId) {
  const item = AppState.carriers.find(c => c.id === carrierId) || AppState.carriers[0];
  if (!item) return;
  AppState.currentProductDesign = item;
  applyProductToView(item);
}

function bindProductEvents() {
  const genBtn = document.getElementById("btn-generate-product");
  const topicInput = document.getElementById("product-topic-input");
  const reloadBtn = document.getElementById("btn-reload-img");
  const imgBox = document.getElementById("prod-image-box");
  const imgEl = document.getElementById("prod-image");

  if (genBtn) genBtn.addEventListener("click", () => generateProductDesignUnified(AppState.selectedCarrierId, topicInput ? topicInput.value.trim() : ""));
  if (topicInput) {
    topicInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        generateProductDesignUnified(AppState.selectedCarrierId, topicInput.value.trim());
      }
    });
  }
  if (reloadBtn) reloadBtn.addEventListener("click", () => generateProductDesignUnified(AppState.selectedCarrierId, topicInput ? topicInput.value.trim() : ""));
  if (imgBox && imgEl) {
    imgBox.addEventListener("click", () => {
      const lightbox = document.getElementById("img-lightbox");
      const lbImg = document.getElementById("lightbox-img");
      const lbCap = document.getElementById("lightbox-caption");
      if (lightbox && lbImg && imgEl.src) {
        lbImg.src = imgEl.src;
        if (lbCap) lbCap.innerText = document.getElementById("prod-title")?.innerText || "实体文创设计概念图";
        lightbox.style.display = "flex";
      }
    });
  }
}

// =========================================================================
// 双轨知识库检索测试、文档导入分块与配置抽屉
// =========================================================================
function renderKnowledgeBaseModal(testQuery = "") {
  const container = document.getElementById("kb-list-container");
  if (!container) return;
  const q = (testQuery || "").trim();

  if (q) {
    ClientRAGEngine.loadDocuments(AppState.slices);
    const hits = ClientRAGEngine.search(q, 10, [], 0.16);
    if (!hits.length) {
      container.innerHTML = `<div class="kb-item"><div class="kb-item-content">未检索到与“${escapeHtml(q)}”高于相关性阈值的切片（已自动拦截低相关噪声）。</div></div>`;
      return;
    }
    container.innerHTML = hits.map(h => {
      const s = h.slice;
      const isOfficial = s.type === "official";
      const canDel = String(s.id || "").startsWith("FIELD-USR-");
      return `
        <div class="kb-item">
          <div class="kb-item-head">
            <div class="source-title-wrap">
              <span class="${isOfficial ? 'tag-official' : 'tag-custom'}">${escapeHtml(s.type_label || (isOfficial ? '权威史料文献' : '实地调研访谈'))}</span>
              <strong>#${h.index} ${escapeHtml(s.title)}</strong>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="source-sim">混合相关性 ${(h.similarity * 100).toFixed(1)}%</span>
              ${canDel ? `<button class="kb-del-btn" type="button" onclick="deleteCustomSlice('${escapeHtml(s.id)}')">删除</button>` : ""}
            </div>
          </div>
          <div class="source-meta">编号：${escapeHtml(s.id || "")} · 命中特征词：${escapeHtml((h.matched_terms || []).join("、") || "语义概念扩展")}</div>
          <div class="kb-item-content">${escapeHtml(s.content || "")}</div>
        </div>
      `;
    }).join("");
    return;
  }

  container.innerHTML = AppState.slices.map(s => {
    const isOfficial = s.type === "official";
    const canDel = String(s.id || "").startsWith("FIELD-USR-");
    return `
      <div class="kb-item">
        <div class="kb-item-head">
          <div class="source-title-wrap">
            <span class="${isOfficial ? 'tag-official' : 'tag-custom'}">${escapeHtml(s.type_label || (isOfficial ? '权威史料文献' : '实地调研访谈'))}</span>
            <strong>${escapeHtml(s.title)}</strong>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="kb-item-id">${escapeHtml(s.id || "")}</span>
            ${canDel ? `<button class="kb-del-btn" type="button" onclick="deleteCustomSlice('${escapeHtml(s.id)}')">删除</button>` : ""}
          </div>
        </div>
        <div class="source-meta">出处：${escapeHtml(s.source || "调研档案")} · 记录：${escapeHtml(s.author || "调研团队")}</div>
        <div class="kb-item-content">${escapeHtml(s.content || "")}</div>
      </div>
    `;
  }).join("");
}

window.deleteCustomSlice = async function(sliceId) {
  if (AppState.backendAvailable) {
    try { await fetch(`/api/slices/${encodeURIComponent(sliceId)}`, { method: "DELETE" }); } catch (e) {}
  }
  AppState.slices = AppState.slices.filter(s => s.id !== sliceId);
  ClientRAGEngine.loadDocuments(AppState.slices);
  saveCustomSlices(AppState.slices);
  renderHeaderCounts();
  const kbSearch = document.getElementById("kb-search-input");
  renderKnowledgeBaseModal(kbSearch ? kbSearch.value : "");
  showToast(`已移除自定义切片 ${sliceId}`, "info");
};

function bindModalAndDrawerEvents() {
  const openSliceModalBtn = document.getElementById("btn-open-slice-modal");
  const closeSliceModalBtn = document.getElementById("btn-close-slice-modal");
  const cancelSliceModalBtn = document.getElementById("btn-cancel-slice-modal");
  const sliceModal = document.getElementById("slice-modal");
  const submitSliceBtn = document.getElementById("btn-submit-slice");
  const fillSampleBtn = document.getElementById("btn-fill-sample");
  const importFileBtn = document.getElementById("btn-import-file");
  const fileInput = document.getElementById("slice-file-input");

  const closeSliceModal = () => { if (sliceModal) sliceModal.style.display = "none"; };
  if (openSliceModalBtn && sliceModal) {
    openSliceModalBtn.onclick = () => {
      closeMobileSidebar();
      sliceModal.style.display = "flex";
    };
  }
  if (closeSliceModalBtn) closeSliceModalBtn.onclick = closeSliceModal;
  if (cancelSliceModalBtn) cancelSliceModalBtn.onclick = closeSliceModal;
  if (sliceModal) sliceModal.addEventListener("click", (e) => { if (e.target === sliceModal) closeSliceModal(); });

  if (importFileBtn && fileInput) {
    importFileBtn.onclick = () => fileInput.click();
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "").trim();
        const baseName = file.name.replace(/\.[^.]+$/, "");
        const titleEl = document.getElementById("new-slice-title");
        const sourceEl = document.getElementById("new-slice-source");
        const contentEl = document.getElementById("new-slice-content");
        if (titleEl && !titleEl.value.trim()) titleEl.value = baseName;
        if (sourceEl && !sourceEl.value.trim()) sourceEl.value = `导入文档：${file.name}`;
        if (contentEl) contentEl.value = text;
        showToast(`已读取文档《${file.name}》（共 ${text.length} 字）`, "success");
      };
      reader.readAsText(file, "utf-8");
      fileInput.value = "";
    });
  }

  if (fillSampleBtn) {
    fillSampleBtn.onclick = () => {
      document.getElementById("new-slice-title").value = "【一手访谈】93岁老战士张文生：戈壁打铁木把血泡实录";
      document.getElementById("new-slice-source").value = "2024阿拉尔军垦新村访谈口述";
      document.getElementById("new-slice-content").value = "口述人：原七一九团老战士张文生（现年93岁）。我们1950年春打坎土曼的时候，铁料不够，连敌人丢弃的迫击炮弹筒都拾来砸。老班长李铁匠说，炮弹壳的钢韧性好，淬火时听声音要脆。那会儿木柄全是戈壁上的野胡杨，握起来粗糙，两天下来全班战士手心都是血泡，血水浸进木把里，时间一久柄子都变成红褐色。这是打江山、保饭碗的命根子！";
    };
  }

  if (submitSliceBtn) {
    submitSliceBtn.onclick = async () => {
      const titleEl = document.getElementById("new-slice-title");
      const sourceEl = document.getElementById("new-slice-source");
      const contentEl = document.getElementById("new-slice-content");
      const title = titleEl.value.trim();
      const source = sourceEl.value.trim() || "实地田野调查实录";
      const content = contentEl.value.trim();
      if (!title || !content) return showToast("请填写文档标题与正文内容", "error");

      submitSliceBtn.disabled = true;
      let addedCount = 0;

      try {
        if (AppState.backendAvailable) {
          const resp = await fetch("/api/slices/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, source, content })
          });
          if (resp.ok) {
            const data = await resp.json();
            if (Array.isArray(data.slices)) {
              addedCount = data.doc?.chunks_added || 1;
              AppState.slices = data.slices;
            }
          }
        }

        if (!addedCount) {
          const chunks = ClientRAGEngine.chunkText(content);
          addedCount = chunks.length;
          let seq = AppState.slices.length + 1;
          chunks.forEach((ck, idx) => {
            while (AppState.slices.some(s => s.id === `FIELD-USR-${String(seq).padStart(2, "0")}`)) seq++;
            AppState.slices.push({
              id: `FIELD-USR-${String(seq).padStart(2, "0")}`,
              type: "custom",
              type_label: "实地调研访谈",
              title: chunks.length > 1 ? `${title}（片段 ${idx + 1}/${chunks.length}）` : title,
              source,
              author: "调研小组",
              content: ck,
              tags: ["口述史", "调研实录", "一手材料"]
            });
            seq++;
          });
        }
      } finally {
        submitSliceBtn.disabled = false;
      }

      ClientRAGEngine.loadDocuments(AppState.slices);
      saveCustomSlices(AppState.slices);
      titleEl.value = "";
      sourceEl.value = "";
      contentEl.value = "";
      renderHeaderCounts();
      closeSliceModal();
      showToast(addedCount > 1 ? `长文档已自动切分为 ${addedCount} 个语义片段并建立混合索引` : "资料已载入混合检索引擎并持久化保存", "success");
    };
  }

  // 知识库检索与管理弹窗
  const headerCounts = document.getElementById("header-counts");
  const kbModal = document.getElementById("kb-modal");
  const kbSearchInput = document.getElementById("kb-search-input");
  const closeKbBtn = document.getElementById("btn-close-kb-modal");
  const closeKbFooterBtn = document.getElementById("btn-close-kb-footer");
  const resetSlicesBtn = document.getElementById("btn-reset-slices");

  if (headerCounts && kbModal) {
    headerCounts.onclick = () => {
      closeMobileSidebar();
      if (kbSearchInput) kbSearchInput.value = "";
      renderKnowledgeBaseModal("");
      kbModal.style.display = "flex";
    };
  }
  if (kbSearchInput) {
    kbSearchInput.addEventListener("input", () => renderKnowledgeBaseModal(kbSearchInput.value));
  }
  if (closeKbBtn && kbModal) closeKbBtn.onclick = () => kbModal.style.display = "none";
  if (closeKbFooterBtn && kbModal) closeKbFooterBtn.onclick = () => kbModal.style.display = "none";
  if (kbModal) kbModal.addEventListener("click", (e) => { if (e.target === kbModal) kbModal.style.display = "none"; });

  if (resetSlicesBtn) {
    resetSlicesBtn.onclick = async () => {
      try {
        if (AppState.backendAvailable) {
          const resp = await fetch("/api/slices/reset", { method: "POST" });
          if (resp.ok) {
            const data = await resp.json();
            AppState.slices = data.slices || [...DEFAULT_SLICES];
          } else AppState.slices = [...DEFAULT_SLICES];
        } else {
          AppState.slices = [...DEFAULT_SLICES];
        }
      } catch (e) {
        AppState.slices = [...DEFAULT_SLICES];
      }
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_SLICES);
      ClientRAGEngine.loadDocuments(AppState.slices);
      renderHeaderCounts();
      if (kbSearchInput) kbSearchInput.value = "";
      renderKnowledgeBaseModal("");
      showToast("双轨知识库已恢复为默认初始档案", "success");
    };
  }

  // 灯箱
  const lightbox = document.getElementById("img-lightbox");
  const closeLightboxBtn = document.getElementById("btn-close-lightbox");
  if (closeLightboxBtn && lightbox) closeLightboxBtn.onclick = () => lightbox.style.display = "none";
  if (lightbox) lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.style.display = "none"; });

  // 全局模型配置抽屉
  const openDrawerBtn = document.getElementById("btn-open-drawer");
  const closeDrawerBtn = document.getElementById("btn-close-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");
  const drawer = document.getElementById("config-drawer");
  const providerSelect = document.getElementById("cfg-provider-select");
  const baseUrlGroup = document.getElementById("cfg-baseurl-group");
  const baseUrlInput = document.getElementById("cfg-base-url");
  const modelInput = document.getElementById("cfg-model-select");
  const apiKeyInput = document.getElementById("cfg-api-key");
  const testBtn = document.getElementById("btn-test-key");
  const saveKeyBtn = document.getElementById("btn-save-key");
  const testResultBox = document.getElementById("cfg-test-result");

  const syncProviderFields = (prov, overwriteValues = false) => {
    const preset = PROVIDER_PRESETS[prov] || PROVIDER_PRESETS.siliconflow;
    if (baseUrlGroup) baseUrlGroup.style.display = prov === "gemini" ? "none" : "block";
    if (overwriteValues) {
      if (baseUrlInput && preset.baseUrl) baseUrlInput.value = preset.baseUrl;
      if (modelInput && preset.defaultModel) modelInput.value = preset.defaultModel;
    }
  };

  if (providerSelect) {
    providerSelect.value = AppState.provider;
    providerSelect.addEventListener("change", () => {
      if (testResultBox) testResultBox.style.display = "none";
      syncProviderFields(providerSelect.value, true);
    });
  }
  if (baseUrlInput) baseUrlInput.value = AppState.baseUrl;
  if (modelInput) modelInput.value = AppState.selectedModel;
  if (apiKeyInput) apiKeyInput.value = AppState.apiKey;
  syncProviderFields(AppState.provider, false);

  const toggleDrawer = (show) => {
    if (drawer && drawerOverlay) {
      drawer.style.display = show ? "flex" : "none";
      drawerOverlay.style.display = show ? "block" : "none";
      if (!show && testResultBox) testResultBox.style.display = "none";
    }
  };

  if (openDrawerBtn) openDrawerBtn.onclick = () => { closeMobileSidebar(); toggleDrawer(true); };
  if (closeDrawerBtn) closeDrawerBtn.onclick = () => toggleDrawer(false);
  if (drawerOverlay) drawerOverlay.onclick = () => toggleDrawer(false);

  if (testBtn && testResultBox) {
    testBtn.onclick = async () => {
      const prov = providerSelect?.value || "siliconflow";
      const bUrl = baseUrlInput?.value.trim() || "";
      const mdl = modelInput?.value.trim() || "";
      const key = apiKeyInput?.value.trim() || "";
      if (!key) {
        testResultBox.className = "test-result-box fail";
        testResultBox.innerText = "请先在上方输入框粘贴 API Key 再测试连接。";
        testResultBox.style.display = "block";
        return;
      }

      testBtn.disabled = true;
      testBtn.innerText = "正在检测...";
      testResultBox.className = "test-result-box";
      testResultBox.innerText = "正在向大模型接口发起握手验证...";
      testResultBox.style.display = "block";

      try {
        if (AppState.backendAvailable) {
          const resp = await fetch("/api/llm/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: prov, base_url: bUrl, api_key: key, model: mdl })
          });
          if (resp.ok) {
            const res = await resp.json();
            testResultBox.className = `test-result-box ${res.ok ? "ok" : "fail"}`;
            testResultBox.innerText = res.ok ? `✓ ${res.message}（响应：${res.reply}）` : `✗ ${res.message}`;
            return;
          }
        }

        const direct = await callClientLLMComplete({
          provider: prov,
          baseUrl: bUrl,
          apiKey: key,
          model: mdl,
          systemPrompt: "你是连通性测试助手。",
          userPrompt: "请仅回复：连接正常",
          maxTokens: 24
        });
        if (direct.text) {
          testResultBox.className = "test-result-box ok";
          testResultBox.innerText = `✓ 模型 ${direct.model} 浏览器直连验证成功（响应：${direct.text.trim().slice(0, 30)}）`;
        } else {
          testResultBox.className = "test-result-box fail";
          testResultBox.innerText = `✗ 连接未通过：${direct.error || "请检查 API Key 或模型名称"}`;
        }
      } finally {
        testBtn.disabled = false;
        testBtn.innerText = "测试连接";
      }
    };
  }

  if (saveKeyBtn) {
    saveKeyBtn.onclick = () => {
      AppState.provider = providerSelect?.value || "siliconflow";
      AppState.baseUrl = baseUrlInput?.value.trim() || PROVIDER_PRESETS[AppState.provider]?.baseUrl || "";
      AppState.selectedModel = modelInput?.value.trim() || PROVIDER_PRESETS[AppState.provider]?.defaultModel || "Qwen/Qwen2.5-7B-Instruct";
      AppState.apiKey = apiKeyInput?.value.trim() || "";

      localStorage.setItem(STORAGE_KEYS.PROVIDER, AppState.provider);
      localStorage.setItem(STORAGE_KEYS.BASE_URL, AppState.baseUrl);
      localStorage.setItem(STORAGE_KEYS.MODEL, AppState.selectedModel);
      localStorage.setItem(STORAGE_KEYS.API_KEY, AppState.apiKey);

      renderSidebarModelStatus();
      toggleDrawer(false);
      showToast(AppState.apiKey ? "大模型流式推理配置已保存" : "已切换为本地混合检索摘录模式", "success");
    };
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSliceModal();
      if (kbModal) kbModal.style.display = "none";
      if (lightbox) lightbox.style.display = "none";
      toggleDrawer(false);
      closeMobileSidebar();
    }
  });
}

// =========================================================================
// 通用工具与问卷 Markdown 渲染
// =========================================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const item = document.createElement("div");
  item.className = `toast-item ${type}`;
  item.innerText = message;
  container.appendChild(item);
  setTimeout(() => {
    item.style.opacity = "0";
    item.style.transition = "opacity 220ms ease";
    setTimeout(() => item.remove(), 240);
  }, 2600);
}

function copyText(text, label) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`已复制${label}至剪贴板`, "success");
  }).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast(`已复制${label}至剪贴板`, "success");
  });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdownToHtml(md) {
  if (!md) return "";
  let html = escapeHtml(md);
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/^---$/gim, '<hr style="border:none; border-top:1px solid var(--border-hairline); margin:16px 0;" />');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^- \[ \] (.*$)/gim, '<div style="display:flex; align-items:center; gap:8px; margin:4px 0;"><input type="checkbox" disabled /> <span>$1</span></div>');

  if (html.includes("|")) {
    const lines = html.split("\n");
    let inTable = false;
    let tableHtml = '<table class="survey-table"><tbody>';
    const newLines = [];
    for (const line of lines) {
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        if (line.includes(":---") || line.includes("---")) continue;
        inTable = true;
        const cells = line.split("|").filter((c, i, a) => i > 0 && i < a.length - 1);
        tableHtml += "<tr>";
        cells.forEach(c => { tableHtml += `<td>${c.trim()}</td>`; });
        tableHtml += "</tr>";
      } else {
        if (inTable) {
          tableHtml += "</tbody></table>";
          newLines.push(tableHtml);
          tableHtml = '<table class="survey-table"><tbody>';
          inTable = false;
        }
        newLines.push(line);
      }
    }
    if (inTable) {
      tableHtml += "</tbody></table>";
      newLines.push(tableHtml);
    }
    html = newLines.join("\n");
  }

  return html.replace(/\n\n/g, "<br><br>");
}
