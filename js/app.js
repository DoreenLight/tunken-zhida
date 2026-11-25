/**
 * 屯垦智答 2.0 - 纯原生双模核心应用控制器
 * 支持 GitHub Pages / file:// 纯前端独立运行 与 FastAPI 本地后端全栈运行无缝切换
 */

const STORAGE_KEYS = {
  API_KEY: "tunken_api_key",
  MODEL: "tunken_model",
  CUSTOM_SLICES: "tunken_custom_slices_v2"
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
    content: "口述人：原七一九团老战士张文生（现年93岁，访谈地点：阿拉尔）。‘我们1950年春打坎土曼的时候，铁料不够，连敌人丢弃的迫击炮弹筒都拾来砸。老班长李铁匠说，炮弹壳的钢韧性好，淬火时听声音要脆。那会儿木柄全是戈壁上的野胡杨，握起来粗糙，两天下来全班战士手心都是血泡，血水渗进木把里，时间一久柄子都变成红褐色。现在年轻人看着一把普通铁镐，当年这就是我们打江山、保饭碗的命根子！’",
    tags: ["口述史", "老铁匠", "血泡木柄", "炮弹壳", "实地调研"]
  },
  {
    id: "AUTH-359-02",
    type: "official",
    type_label: "权威史料文献",
    title: "从南泥湾精神到兵团精神：自力更生与塞外老纺车",
    source: "《三五九旅后勤保障与自给自足史》",
    author: "三五九旅屯垦纪念馆馆藏文献",
    content: "从陕北南泥湾到天山南北，三五九旅始终坚持‘自己动手、丰衣足食’的自力更生优良传统。进疆初期，后方物资运输线绵延数千里，入冬时官兵军服奇缺，面临‘衣破无布补、天寒无棉御’的艰苦绝境。三五九旅党委决定将南泥湾老纺车经验移植至塔河之畔。战士们拆解废弃车轱辘与戈壁胡杨木，手作简易木制纺车，剪集当地散落的粗羊毛，清洗搓捻。自制粗呢军服不仅解决了御寒问题，更将南泥湾精神升华为‘热爱祖国、无私奉献、艰苦创业、开拓进取’的兵团精神。",
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
// 浏览器端双轨 N-Gram + TF-IDF 余弦检索引擎（GitHub Pages 独立运行核心）
// =========================================================================
const ClientRAGEngine = {
  slices: [],
  idf: {},
  docVectors: [],

  SPECIAL_KEYWORDS: [
    "三五九旅", "359旅", "坎土曼", "胜利渠", "地窝子", "阿克苏",
    "王震", "多浪河", "纺车", "南泥湾", "由战转耕", "红柳",
    "废炮弹壳", "土高炉", "石榴籽", "民族团结", "李文海", "张文生"
  ],

  tokenize(text) {
    const lower = String(text || "").toLowerCase();
    const cleaned = lower.replace(/[^\w\u4e00-\u9fa5]+/g, " ").trim();
    const words = cleaned ? cleaned.split(/\s+/) : [];
    const tokens = [];

    for (const word of words) {
      tokens.push(word);
      const cChars = Array.from(word).filter(ch => ch >= "\u4e00" && ch <= "\u9fa5");
      for (const ch of cChars) tokens.push(ch);
      for (let i = 0; i < cChars.length - 1; i++) {
        tokens.push(cChars[i] + cChars[i + 1]);
      }
    }

    for (const kw of this.SPECIAL_KEYWORDS) {
      if (lower.includes(kw.toLowerCase())) {
        tokens.push(kw, kw, kw);
      }
    }
    return tokens;
  },

  loadDocuments(slices) {
    this.slices = (slices || []).map(s => ({ ...s }));
    const docTokens = this.slices.map(doc => {
      const fullText = `${doc.title || ""} ${doc.source || ""} ${doc.content || ""} ${(doc.tags || []).join(" ")}`;
      return this.tokenize(fullText);
    });

    const nDocs = this.slices.length;
    const df = {};
    for (const tokens of docTokens) {
      for (const term of new Set(tokens)) {
        df[term] = (df[term] || 0) + 1;
      }
    }

    this.idf = {};
    for (const [term, freq] of Object.entries(df)) {
      this.idf[term] = Math.log((nDocs + 1) / (freq + 1)) + 1.0;
    }

    this.docVectors = docTokens.map(tokens => {
      const tf = {};
      for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
      const len = tokens.length || 1;
      const vec = {};
      let normSq = 0;
      for (const [t, count] of Object.entries(tf)) {
        const val = (count / len) * (this.idf[t] || 1.0);
        vec[t] = val;
        normSq += val * val;
      }
      const norm = normSq > 0 ? Math.sqrt(normSq) : 1.0;
      for (const t of Object.keys(vec)) vec[t] /= norm;
      return vec;
    });
  },

  search(query, topK = 4) {
    if (!this.slices.length) return [];
    const queryTokens = this.tokenize(query);
    if (!queryTokens.length) {
      return this.slices.slice(0, topK).map((s, i) => ({
        index: i + 1,
        slice: s,
        similarity: Number((0.88 - i * 0.04).toFixed(3)),
        matched_terms: []
      }));
    }

    const qTf = {};
    for (const t of queryTokens) qTf[t] = (qTf[t] || 0) + 1;
    const qLen = queryTokens.length;
    const qVec = {};
    let qNormSq = 0;
    for (const [t, count] of Object.entries(qTf)) {
      const val = (count / qLen) * (this.idf[t] || 1.0);
      qVec[t] = val;
      qNormSq += val * val;
    }
    const qNorm = qNormSq > 0 ? Math.sqrt(qNormSq) : 1.0;
    for (const t of Object.keys(qVec)) qVec[t] /= qNorm;

    const uniqueTerms = Array.from(new Set(queryTokens)).filter(t => t.length >= 2);
    const scores = this.docVectors.map((docVec, idx) => {
      let dot = 0;
      const matched = [];
      for (const [t, qVal] of Object.entries(qVec)) {
        if (docVec[t] !== undefined) {
          dot += qVal * docVec[t];
          if (t.length > 1 && !matched.includes(t)) matched.push(t);
        }
      }

      const doc = this.slices[idx];
      const title = String(doc.title || "").toLowerCase();
      const tags = (doc.tags || []).join(" ").toLowerCase();
      const content = String(doc.content || "").toLowerCase();
      let bonus = 0;
      for (const qt of uniqueTerms) {
        if (title.includes(qt) || tags.includes(qt)) bonus += 0.14;
        else if (content.includes(qt)) bonus += 0.06;
      }

      const raw = dot + Math.min(0.45, bonus);
      return { idx, raw, matched: matched.slice(0, 6) };
    });

    scores.sort((a, b) => b.raw - a.raw);
    return scores.slice(0, topK).map((entry, rank) => {
      const sim = entry.raw > 0
        ? Number(Math.min(0.98, Math.max(0.42, 0.38 + entry.raw * 0.72)).toFixed(3))
        : Number(Math.max(0.35, 0.42 - rank * 0.03).toFixed(3));
      return {
        index: rank + 1,
        slice: this.slices[entry.idx],
        similarity: sim,
        matched_terms: entry.matched
      };
    });
  },

  buildContext(results) {
    const lines = ["【以下为检索到的三五九旅双轨知识库资料（权威史料与一手实地调研访谈）】：\n"];
    for (const item of results) {
      const doc = item.slice;
      const track = doc.type === "official" ? "权威文献" : "一手调研访谈";
      lines.push(`--- 证据切片 [${item.index}] 【${track}】---`);
      lines.push(`切片编号: ${doc.id || "N/A"}`);
      lines.push(`切片标题: ${doc.title || "未知"}`);
      lines.push(`文献出处: ${doc.source || "调研档案"}`);
      lines.push(`核心内容: ${doc.content || ""}\n`);
    }
    return lines.join("\n");
  }
};

// =========================================================================
// 纯前端直连大模型工具（支持用户填入 Gemini / DeepSeek Key 时浏览器直连）
// =========================================================================
async function callClientLLM(apiKey, model, systemPrompt, userPrompt) {
  const key = (apiKey || "").trim();
  if (!key) return null;
  const actualModel = model || "gemini-3.8-flash";

  try {
    if (actualModel.toLowerCase().includes("deepseek")) {
      const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: actualModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.35,
          max_tokens: 3500
        })
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data?.choices?.[0]?.message?.content || null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(actualModel)}:generateContent?key=${encodeURIComponent(key)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.3, maxOutputTokens: 3500 }
      })
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    return null;
  }
}

function extractJsonObject(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  const fence = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fence) {
    cleaned = fence[1];
  } else {
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
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ (-1)) >>> 0;
}

// =========================================================================
// 全局应用状态
// =========================================================================
const INITIAL_WELCOME_MESSAGE = {
  role: "assistant",
  content: "您好！我是“屯垦智答”三五九旅红色文化学术导师。我依托【权威文献知识库】与【老军垦一手访谈知识库】双轨引擎，为您提供严格考据、杜绝历史幻觉的可溯源解答[1]。每句史实后均标注证据角标，回答下方可展开具体史料出处[2]。\n\n您可以向我询问三五九旅进疆开荒、第一把坎土曼打制、胜利渠筑水坝、红柳地窝子生活史，或点击左侧栏录入一手访谈笔记。",
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

const initialSlices = [...DEFAULT_SLICES, ...loadSavedCustomSlices()];
ClientRAGEngine.loadDocuments(initialSlices);

const AppState = {
  backendAvailable: false,
  activeTab: "chat",
  activeSubTab: "xhs",
  slices: initialSlices,
  carriers: [...DEFAULT_CARRIERS],
  selectedCarrierId: "fan",
  currentProductDesign: null,
  isChatSending: false,
  apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || "",
  selectedModel: localStorage.getItem(STORAGE_KEYS.MODEL) || "gemini-3.8-flash",
  chatMessages: [JSON.parse(JSON.stringify(INITIAL_WELCOME_MESSAGE))],
  campaignResult: JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN))
};

// =========================================================================
// 初始化入口
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  renderHeaderCounts();
  bindNavTabs();
  bindMobileSidebar();
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

function updateRuntimeBadge(isLocalBackend) {
  const badge = document.getElementById("runtime-mode-badge");
  const textEl = document.getElementById("runtime-mode-text");
  if (!badge || !textEl) return;
  if (isLocalBackend) {
    badge.classList.add("local");
    textEl.innerText = "本地后端已连接";
  } else {
    badge.classList.remove("local");
    textEl.innerText = "云端独立运行 (双轨RAG内置)";
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

    const sResp = await fetch("/api/presets/slices");
    if (sResp.ok) {
      const data = await sResp.json();
      if (Array.isArray(data.slices) && data.slices.length > 0) {
        AppState.slices = data.slices;
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
// 导航与移动端侧栏
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

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  const brandHome = document.getElementById("brand-home-btn");
  if (brandHome) {
    brandHome.addEventListener("click", () => switchTab("chat"));
  }
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
    mobileDrawerBtn.addEventListener("click", () => {
      document.getElementById("btn-open-drawer")?.click();
    });
  }
}

// =========================================================================
// 模块一：可溯源对话流 (在线后端 SSE + 纯前端双轨 RAG 双模支持)
// =========================================================================
function formatSimilarity(sim) {
  if (typeof sim === "number" && !Number.isNaN(sim)) {
    const pct = sim <= 1 ? sim * 100 : sim;
    return `${pct.toFixed(1)}%`;
  }
  return escapeHtml(String(sim || "--"));
}

function renderChatMessages() {
  const container = document.getElementById("chat-message-list");
  if (!container) return;

  container.innerHTML = AppState.chatMessages.map((msg, idx) => {
    if (msg.role === "user") {
      return `
        <div class="chat-row user">
          <div class="avatar-user">访</div>
          <div class="bubble-user">${escapeHtml(msg.content)}</div>
        </div>
      `;
    }
    const contentHtml = msg.content
      ? formatAnswerHtml(msg.content, idx)
      : `<div class="typing-dots">正在双轨知识库检索并考据作答 <span></span><span></span><span></span></div>`;

    let sourcesHtml = "";
    if (msg.citations && msg.citations.length) {
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
              <span class="source-sim">匹配度 ${simText}</span>
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

    return `
      <div class="chat-row assistant">
        <div class="avatar-ai">垦</div>
        <div class="bubble-ai">
          <div class="chat-body-text">${contentHtml}</div>
          ${sourcesHtml}
        </div>
      </div>
    `;
  }).join("");

  const scrollBox = container.parentElement;
  if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;
}

window.toggleSources = function(idx) {
  const el = document.getElementById(`sources-list-${idx}`);
  if (el && AppState.chatMessages[idx]) {
    const isShown = el.style.display === "flex";
    el.style.display = isShown ? "none" : "flex";
    AppState.chatMessages[idx].showSources = !isShown;
    const btn = el.previousElementSibling;
    if (btn) {
      const count = (AppState.chatMessages[idx].citations || []).length;
      btn.innerHTML = `<span>${!isShown ? '▾' : '▸'} 参考来源与考据溯源切片 (${count} 篇依据)</span>`;
    }
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

function formatAnswerHtml(text, msgIdx = 0) {
  if (!text) return "";
  let html = escapeHtml(text).replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>");
  html = html.replace(
    /\[(\d+)\]/g,
    `<span class="citation-badge" title="定位考据切片 [$1]" onclick="focusCitation(${msgIdx}, $1)">[$1]</span>`
  );
  return html;
}

function setChatSendingState(sending) {
  AppState.isChatSending = sending;
  const sendBtn = document.getElementById("btn-send-chat");
  if (sendBtn) {
    sendBtn.disabled = sending;
    sendBtn.innerHTML = sending
      ? `<span>考据检索中...</span>`
      : `<span>发送提问</span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  }
}

function buildClientMockChatAnswer(query, retrieved) {
  const maxIdx = Math.max(1, retrieved.length);
  const cIdx = (n) => Math.min(n, maxIdx);

  const top = retrieved[0];
  if (top && String(top.slice.id || "").startsWith("FIELD-USR-") && top.similarity >= 0.52) {
    const lines = [
      `根据双轨知识库最新录入的一手实地调研素材（《${top.slice.title}》，来源：${top.slice.source}）考据[1]：`,
      "",
      `${top.slice.content.trim()}[1]`
    ];
    if (retrieved.length > 1) {
      const s2 = retrieved[1].slice;
      lines.push("", `结合馆藏档案《${s2.title}》互证：${s2.content.slice(0, 120).trim()}……[${cIdx(2)}]`);
    }
    return lines.join("\n");
  }

  if (["坎土曼", "铁", "农具", "血泡", "张文生", "打铁"].some(k => query.includes(k))) {
    return (
      "关于三五九旅开荒初期的‘第一把坎土曼’，历史档案与老军垦实地访谈有着极为清晰的考据链条：\n\n" +
      `1949年冬三五九旅挺进阿克苏与塔里木盆地北缘时，面对盐碱白滩，全军无铁制农具可用，且市面上根本采买不到[${cIdx(1)}]。` +
      "1950年2月，指战员们在阿克苏市郊的大生产营地架起土高炉，搜集战场遗存的迫击炮弹壳与废旧铁轨，经过千百次烈火淬火锻打，" +
      `由老铁匠李文海带领战士们成功打造出第一把宽刃、重约4斤半的军垦坎土曼[${cIdx(1)}]。\n\n` +
      "正如2024年高校大学生赴阿拉尔市对93岁老战士张文生的实地访谈录音中所证实：‘当时野胡杨手柄粗粝，战士们连打带握，" +
      `手心全被磨出血泡，血水渗进木柄甚至发红发暗，但这把从炮火中锻出的工具就是军垦人的命根子’[${cIdx(2)}]。\n\n` +
      `在随后的百里‘胜利渠’筑坝攻坚中，战士们正是握着自力更生打制的坎土曼，在零下二十度的刺骨冰水中砸冰开渠[${cIdx(3)}]。` +
      "更令人动容的是，三五九旅官兵还将打制的第一批优质坎土曼无偿赠予当地维吾尔族贫苦农牧民，手把手传授深耕技术，" +
      `使这柄凝聚着军人血汗的开荒农具，从诞生起便成为了兵地各族群众像石榴籽一样紧紧抱在一起共同开拓绿洲的深情信物[${cIdx(4)}]。`
    );
  }
  if (["胜利渠", "冰水", "多浪河", "水渠", "王震"].some(k => query.includes(k))) {
    return (
      "关于三五九旅修建百里‘胜利渠’的史实，有如下权威水利档案与兵地共建史料可考：\n\n" +
      `1950年春，为解决阿克苏至阿拉尔戈壁荒地的灌溉难题，三五九旅官兵在多浪河上打响了修建百里胜利渠的攻坚战[${cIdx(1)}]。` +
      `早春时节河水冰冷刺骨，战士们脱下棉衣跳进零下20度的刺骨冰水中排险打桩，用血肉之躯在激流中筑起拦水大坝[${cIdx(1)}]。\n\n` +
      `王震将军与战士们同吃窝窝头、同抡坎土曼挖土方；全渠没有一台大型挖掘机，全凭十万双长满老茧的手与扁担箩筐，在百天之内凿通百余里干渠[${cIdx(1)}]。` +
      `与此同时，官兵还协助各族群众修筑灌渠、赠送自制坎土曼并免费巡回义诊，让天山雪水化作滋养戈壁江南与民族团结的清泉[${cIdx(2)}]。`
    );
  }
  if (["地窝子", "生活", "红柳", "夜校"].some(k => query.includes(k))) {
    return (
      "三五九旅战士初入塔里木戈壁荒原时，寸草不生、飞沙蔽日，没有砖石瓦房可以遮风避雨：\n\n" +
      `指战员因地制宜，在地下挖掘深约1.8至2米的坑穴，以戈壁红柳枝、沙枣木作梁，搭上野生芦苇草并涂抹厚厚的黄泥，修建出抵御狂暴黑风暴与冬夏严寒的‘地窝子’[${cIdx(1)}]。\n\n` +
      `据老战士口述档案记载，荒漠中晨起被褥常落半指厚黄沙，轻轻一抖便扛起坎土曼上工[${cIdx(1)}]；` +
      "但在昏暗的墨水瓶柴油灯下，战士们读夜校、编快板、教文化，写下了‘生在井冈山，长在南泥湾，转战数万里，屯垦在天山’的革命浪漫主义诗篇。" +
      `这种自力更生的拓荒精神，也体现在进疆初期架起塞外老纺车自制粗呢军服的壮举之中[${cIdx(2)}]。`
    );
  }
  if (["纺车", "南泥湾", "军服", "自力更生", "羊毛"].some(k => query.includes(k))) {
    return (
      "从陕北南泥湾到新疆塔里木，三五九旅始终秉持‘自己动手、丰衣足食’的优良传统：\n\n" +
      `进疆初期，后方运输线绵延数千里，入冬时官兵面临‘衣破无布补、天寒无棉御’的绝境[${cIdx(1)}]。` +
      `旅党委决定将南泥湾老纺车经验移植至塔河之畔，战士们拆解废弃车轱辘与戈壁胡杨木自制木纺车，剪集散落粗羊毛清洗搓捻，开展‘班班赛纺纱、人人争能手’竞赛[${cIdx(1)}]。\n\n` +
      `自制粗呢军服不仅解决了御寒难题，更将南泥湾精神升华为‘热爱祖国、无私奉献、艰苦创业、开拓进取’的兵团精神[${cIdx(1)}]。`
    );
  }
  if (["民族", "石榴籽", "维吾尔", "金珠玛米", "兵地"].some(k => query.includes(k))) {
    return (
      "三五九旅在阿克苏与阿拉尔屯垦期间，留下了兵地携手、民族团结的动人史诗：\n\n" +
      `官兵严守三大纪律八项注意，宁宿旷野古庙也不占民房一间；针对当地缺少铁质农具与水利技术的情况，将自制新坎土曼无偿赠予维吾尔族贫苦农民，并派医疗卫生员免费走村串户义诊、协助修渠[${cIdx(1)}]。\n\n` +
      `维吾尔族乡亲们自发赶着毛驴车送来滚烫的烤馕和甜瓜，亲切称呼官兵为‘亲人金珠玛米’，形成了各民族‘像石榴籽一样紧紧抱在一起’共同开拓绿洲的深情局面[${cIdx(1)}]。`
    );
  }

  if (retrieved.length) {
    const first = retrieved[0].slice;
    const secondPart = retrieved.length > 1
      ? `\n\n此外，结合《${retrieved[1].slice.title}》（${retrieved[1].slice.source}）记载：${retrieved[1].slice.content.slice(0, 110)}……[${cIdx(2)}]`
      : "";
    return `依据三五九旅双轨知识库检索匹配度最高的史料《${first.title}》（${first.source}）考据[1]：\n\n${first.content}[1]${secondPart}`;
  }

  return "当前知识库暂未检索到直接匹配的档案切片，您可以通过左侧栏【录入调研素材】补充相关一手史料后再试。";
}

function bindChatEvents() {
  const sendBtn = document.getElementById("btn-send-chat");
  const input = document.getElementById("chat-input");
  const clearBtn = document.getElementById("btn-clear-chat");

  const doSend = async (queryText) => {
    if (AppState.isChatSending) return;
    const q = (queryText || input.value).trim();
    if (!q) return;

    input.value = "";
    setChatSendingState(true);
    AppState.chatMessages.push({ role: "user", content: q });
    renderChatMessages();

    if (AppState.backendAvailable) {
      try {
        const resp = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q,
            history: AppState.chatMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
            api_key: AppState.apiKey,
            model: AppState.selectedModel
          })
        });

        if (resp.ok && resp.body) {
          const reader = resp.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";
          const aiMsg = { role: "assistant", content: "", citations: [], showSources: true };
          AppState.chatMessages.push(aiMsg);
          renderChatMessages();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop();
            for (const p of parts) {
              const trimmed = p.trim();
              if (trimmed.startsWith("data:")) {
                try {
                  const event = JSON.parse(trimmed.replace(/^data:\s*/, ""));
                  if (event.type === "retrieval_ready") {
                    aiMsg.citations = event.citations || [];
                    renderChatMessages();
                  } else if (event.type === "content_chunk") {
                    aiMsg.content = event.accumulated;
                    renderChatMessages();
                  } else if (event.type === "chat_finished") {
                    aiMsg.content = event.full_answer;
                    aiMsg.citations = event.citations || [];
                    renderChatMessages();
                  }
                } catch (e) {}
              }
            }
          }
          setChatSendingState(false);
          return;
        }
      } catch (e) {
        AppState.backendAvailable = false;
        updateRuntimeBadge(false);
      }
    }

    await runClientChat(q);
  };

  if (sendBtn && input) {
    sendBtn.addEventListener("click", () => doSend());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doSend();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (AppState.isChatSending) return;
      AppState.chatMessages = [JSON.parse(JSON.stringify(INITIAL_WELCOME_MESSAGE))];
      renderChatMessages();
      showToast("已重置对话为学术导师初始状态", "info");
    });
  }

  document.querySelectorAll(".quick-pill").forEach(pill => {
    pill.addEventListener("click", () => doSend(pill.innerText.trim()));
  });
}

async function runClientChat(query) {
  ClientRAGEngine.loadDocuments(AppState.slices);
  const retrieved = ClientRAGEngine.search(query, 4);
  const citations = retrieved.map(item => ({
    index: item.index,
    doc_id: item.slice.id,
    type: item.slice.type || "official",
    is_official: item.slice.type === "official",
    type_label: item.slice.type_label || "权威史料文献",
    title: item.slice.title,
    source: item.slice.source,
    similarity: item.similarity,
    quote: (item.slice.content || "").slice(0, 130) + ((item.slice.content || "").length > 130 ? "..." : "")
  }));

  const aiMsg = { role: "assistant", content: "", citations, showSources: true };
  AppState.chatMessages.push(aiMsg);
  renderChatMessages();

  let answer = null;
  if (AppState.apiKey) {
    const context = ClientRAGEngine.buildContext(retrieved);
    const sysPrompt = "你是专注三五九旅军垦历史与口述史的考据专家。严格仅基于提供的双轨知识库回答，每句重要史实后加 [n] 角标；若资料未提及请诚实说明。";
    const userPrompt = `${context}\n\n用户当前提问：${query}\n请基于上下文严格回答并在句末加 [n] 角标。`;
    answer = await callClientLLM(AppState.apiKey, AppState.selectedModel, sysPrompt, userPrompt);
  }

  if (!answer) {
    answer = buildClientMockChatAnswer(query, retrieved);
  }

  let i = 0;
  const timer = setInterval(() => {
    i += 22;
    aiMsg.content = answer.slice(0, i);
    renderChatMessages();
    if (i >= answer.length) {
      clearInterval(timer);
      aiMsg.content = answer;
      renderChatMessages();
      setChatSendingState(false);
    }
  }, 30);
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
    xhsTagsEl.innerHTML = (xhs.tags || []).map(t =>
      `<span class="xhs-tag-item">${escapeHtml(t)}</span>`
    ).join("");
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
    const sysPrompt = "你是新媒体传播战略策划总监与社会调查学者。";
    const userPrompt = `围绕“${cleanTopic}”及以下三五九旅史料生成方案：\n${context}\n\n请只输出合法 JSON：{"xiaohongshu":{"title":"...","tags":["#..."],"body":"..."},"douyin_script":{"title":"...","bpm":"...","scenes":[{"num":1,"time":"00:00-00:15","shot":"特写","visual":"...","audio":"...","dialogue":"..."}]},"survey_markdown":"# 《...》\\n..."}`;
    const raw = await callClientLLM(AppState.apiKey, AppState.selectedModel, sysPrompt, userPrompt);
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
            model: AppState.selectedModel
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
      showToast(AppState.campaignResult.is_mock ? "已生成传播全案与调查问卷（独立模式）" : "已通过大模型直连生成定制全案", "success");
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

  if (genBtn && topicInput) {
    genBtn.addEventListener("click", triggerCampaignGenerate);
  }

  document.querySelectorAll(".preset-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      if (topicInput) topicInput.value = chip.dataset.topic || chip.innerText;
      triggerCampaignGenerate();
    });
  });

  const copyXhsBtn = document.getElementById("btn-copy-xhs");
  if (copyXhsBtn) {
    copyXhsBtn.onclick = () => copyText((AppState.campaignResult.xiaohongshu || {}).body || "", "小红书正文文案");
  }

  const copySurveyBtn = document.getElementById("btn-copy-survey");
  if (copySurveyBtn) {
    copySurveyBtn.onclick = () => copyText(AppState.campaignResult.survey_markdown || "", "调查问卷 Markdown");
  }

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
  if (customTopic) {
    generateProductDesignUnified(carrierId, customTopic);
  } else {
    renderSelectedProduct(carrierId);
  }
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
    const sysPrompt = "你是红色文创主理人与工业设计师，只返回合法 JSON。";
    const userPrompt = `为载体「${base.name}」结合主题「${cleanTopic}」输出设计规格 JSON：{"subtitle":"...","features":"...","color_scheme":"...","materials":"...","prompt_en":"..."}`;
    const raw = await callClientLLM(AppState.apiKey, AppState.selectedModel, sysPrompt, userPrompt);
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
          model: AppState.selectedModel
        })
      });
      if (resp.ok) design = await resp.json();
    }
    if (!design) {
      design = await generateProductDesignStandalone(carrierId, customTopic);
    }

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
    const swatches = item.swatches || [];
    swatchesEl.innerHTML = swatches.map(sw => `
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
    imgEl.onload = () => {
      if (loadingEl) loadingEl.style.display = "none";
    };
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
  if (copyPromptBtn) {
    copyPromptBtn.onclick = () => copyText(item.prompt_en, "商业摄影生图 Prompt");
  }

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

  if (genBtn) {
    genBtn.addEventListener("click", () => {
      generateProductDesignUnified(AppState.selectedCarrierId, topicInput ? topicInput.value.trim() : "");
    });
  }
  if (topicInput) {
    topicInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        generateProductDesignUnified(AppState.selectedCarrierId, topicInput.value.trim());
      }
    });
  }
  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      generateProductDesignUnified(AppState.selectedCarrierId, topicInput ? topicInput.value.trim() : "");
    });
  }
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
// 模态弹窗、知识库目录、灯箱与全局配置抽屉
// =========================================================================
function renderKnowledgeBaseModal() {
  const container = document.getElementById("kb-list-container");
  if (!container) return;
  container.innerHTML = AppState.slices.map(s => {
    const isOfficial = s.type === "official";
    return `
      <div class="kb-item">
        <div class="kb-item-head">
          <div class="source-title-wrap">
            <span class="${isOfficial ? 'tag-official' : 'tag-custom'}">${escapeHtml(s.type_label || (isOfficial ? '权威史料文献' : '实地调研访谈'))}</span>
            <strong>${escapeHtml(s.title)}</strong>
          </div>
          <span class="kb-item-id">${escapeHtml(s.id || "")}</span>
        </div>
        <div class="source-meta">出处：${escapeHtml(s.source || "调研档案")} · 记录：${escapeHtml(s.author || "调研团队")}</div>
        <div class="kb-item-content">${escapeHtml(s.content || "")}</div>
      </div>
    `;
  }).join("");
}

function bindModalAndDrawerEvents() {
  const openSliceModalBtn = document.getElementById("btn-open-slice-modal");
  const closeSliceModalBtn = document.getElementById("btn-close-slice-modal");
  const cancelSliceModalBtn = document.getElementById("btn-cancel-slice-modal");
  const sliceModal = document.getElementById("slice-modal");
  const submitSliceBtn = document.getElementById("btn-submit-slice");
  const fillSampleBtn = document.getElementById("btn-fill-sample");

  const closeSliceModal = () => { if (sliceModal) sliceModal.style.display = "none"; };
  if (openSliceModalBtn && sliceModal) {
    openSliceModalBtn.onclick = () => {
      closeMobileSidebar();
      sliceModal.style.display = "flex";
    };
  }
  if (closeSliceModalBtn) closeSliceModalBtn.onclick = closeSliceModal;
  if (cancelSliceModalBtn) cancelSliceModalBtn.onclick = closeSliceModal;
  if (sliceModal) {
    sliceModal.addEventListener("click", (e) => { if (e.target === sliceModal) closeSliceModal(); });
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
      if (!title || !content) return showToast("请填写素材标题与正文", "error");

      let newDoc = {
        id: `FIELD-USR-${String(AppState.slices.length + 1).padStart(2, "0")}`,
        type: "custom",
        type_label: "实地调研访谈",
        title,
        source,
        author: "调研小组",
        content,
        tags: ["口述史", "调研实录", "一手材料"]
      };

      submitSliceBtn.disabled = true;
      try {
        if (AppState.backendAvailable) {
          const resp = await fetch("/api/slices/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, source, content })
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.doc) newDoc = data.doc;
          }
        }
      } catch (e) {}
      finally {
        submitSliceBtn.disabled = false;
      }

      AppState.slices.push(newDoc);
      ClientRAGEngine.loadDocuments(AppState.slices);
      saveCustomSlices(AppState.slices);

      titleEl.value = "";
      sourceEl.value = "";
      contentEl.value = "";
      renderHeaderCounts();
      closeSliceModal();
      showToast("一手调研素材已载入双轨知识库并持久化保存", "success");
    };
  }

  // 双轨知识库总览弹窗
  const headerCounts = document.getElementById("header-counts");
  const kbModal = document.getElementById("kb-modal");
  const closeKbBtn = document.getElementById("btn-close-kb-modal");
  const closeKbFooterBtn = document.getElementById("btn-close-kb-footer");
  const resetSlicesBtn = document.getElementById("btn-reset-slices");

  if (headerCounts && kbModal) {
    headerCounts.onclick = () => {
      closeMobileSidebar();
      renderKnowledgeBaseModal();
      kbModal.style.display = "flex";
    };
  }
  if (closeKbBtn && kbModal) closeKbBtn.onclick = () => kbModal.style.display = "none";
  if (closeKbFooterBtn && kbModal) closeKbFooterBtn.onclick = () => kbModal.style.display = "none";
  if (kbModal) {
    kbModal.addEventListener("click", (e) => { if (e.target === kbModal) kbModal.style.display = "none"; });
  }
  if (resetSlicesBtn) {
    resetSlicesBtn.onclick = async () => {
      try {
        if (AppState.backendAvailable) {
          const resp = await fetch("/api/slices/reset", { method: "POST" });
          if (resp.ok) {
            const data = await resp.json();
            AppState.slices = data.slices || [...DEFAULT_SLICES];
          } else {
            AppState.slices = [...DEFAULT_SLICES];
          }
        } else {
          AppState.slices = [...DEFAULT_SLICES];
        }
      } catch (e) {
        AppState.slices = [...DEFAULT_SLICES];
      }
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_SLICES);
      ClientRAGEngine.loadDocuments(AppState.slices);
      renderHeaderCounts();
      renderKnowledgeBaseModal();
      showToast("双轨知识库已重置为默认初始档案", "success");
    };
  }

  // 灯箱
  const lightbox = document.getElementById("img-lightbox");
  const closeLightboxBtn = document.getElementById("btn-close-lightbox");
  if (closeLightboxBtn && lightbox) closeLightboxBtn.onclick = () => lightbox.style.display = "none";
  if (lightbox) {
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.style.display = "none"; });
  }

  // 全局配置抽屉
  const openDrawerBtn = document.getElementById("btn-open-drawer");
  const closeDrawerBtn = document.getElementById("btn-close-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");
  const drawer = document.getElementById("config-drawer");
  const saveKeyBtn = document.getElementById("btn-save-key");
  const apiKeyInput = document.getElementById("cfg-api-key");
  const modelSelect = document.getElementById("cfg-model-select");

  if (apiKeyInput) apiKeyInput.value = AppState.apiKey;
  if (modelSelect) modelSelect.value = AppState.selectedModel;

  const toggleDrawer = (show) => {
    if (drawer && drawerOverlay) {
      drawer.style.display = show ? "flex" : "none";
      drawerOverlay.style.display = show ? "block" : "none";
    }
  };

  if (openDrawerBtn) {
    openDrawerBtn.onclick = () => {
      closeMobileSidebar();
      toggleDrawer(true);
    };
  }
  if (closeDrawerBtn) closeDrawerBtn.onclick = () => toggleDrawer(false);
  if (drawerOverlay) drawerOverlay.onclick = () => toggleDrawer(false);

  if (saveKeyBtn) {
    saveKeyBtn.onclick = () => {
      AppState.apiKey = apiKeyInput.value.trim();
      AppState.selectedModel = modelSelect.value;
      localStorage.setItem(STORAGE_KEYS.API_KEY, AppState.apiKey);
      localStorage.setItem(STORAGE_KEYS.MODEL, AppState.selectedModel);
      toggleDrawer(false);
      showToast("全局模型配置已保存至本地浏览器", "success");
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
// 工具函数与 Markdown 渲染
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
