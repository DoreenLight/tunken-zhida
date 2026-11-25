"""
三五九旅红色文化与文创赋能系统 - 预置精选调研数据、实体文创载体与智能体样本
"""

# 双轨知识库：权威文献切片与老军垦实地访谈切片
DEFAULT_KNOWLEDGE_SLICES = [
    {
        "id": "AUTH-359-01",
        "type": "official",
        "type_label": "权威史料文献",
        "title": "进驻阿克苏与第一把军垦坎土曼的淬火诞生",
        "source": "《三五九旅屯垦戍边实录》卷一·进军和田与阿克苏开荒纪事",
        "author": "原三五九旅七一九团老军垦口述史研究小组",
        "content": (
            "1949年冬至1950年初，三五九旅进驻新疆阿克苏及塔里木盆地北缘。面对茫茫戈壁荒原与盐碱白滩，"
            "指战员们放下枪杆、拿起农具准备大生产。当时全军极度缺乏铁质工具，市面上根本买不到足够的开荒农具。"
            "三五九旅指战员发动全军寻找废弃铁轨、破旧炮弹壳、废弃车辆钢板和缴获武器残件，在荒原上支起土高炉和简易铁匠炉。"
            "1950年2月，在阿克苏市郊的大生产锻造营地里，老铁匠李文海与战士们在叮当打铁声中，用废炮弹壳打制出第一把军垦坎土曼。"
            "这把坎土曼宽刃、重约4斤半、刃口经过反复淬火，锋利沉实，既能刨开坚硬如石的盐碱红胶泥，又能当铁锨铲沙筑埂。"
            "第一把坎土曼的诞生，标志着三五九旅完成了由‘一手拿枪’到‘一手拿镐’的历史性战转耕转变，成为军垦战士开天辟地的第一图腾。"
        ),
        "tags": ["第一把坎土曼", "阿克苏开荒", "打铁铸农具", "由战转耕", "军垦图腾"]
    },
    {
        "id": "AUTH-359-02",
        "type": "official",
        "type_label": "权威史料文献",
        "title": "从南泥湾精神到兵团精神：自力更生与塞外老纺车",
        "source": "《三五九旅后勤保障与自给自足史》",
        "author": "三五九旅屯垦纪念馆馆藏文献",
        "content": (
            "从陕北南泥湾到天山南北，三五九旅始终坚持‘自己动手、丰衣足食’的自力更生优良传统。"
            "进疆初期，后方物资运输线绵延数千里，入冬时官兵军服奇缺，面临‘衣破无布补、天寒无棉御’的艰苦绝境。"
            "三五九旅党委决定将南泥湾老纺车经验移植至塔河之畔。战士们拆解废弃车轱辘与戈壁胡杨木，手作简易木制纺车，"
            "剪集当地散落的粗羊毛，清洗搓捻。营区内外开展了‘班班赛纺纱、人人争能手’的劳动竞赛。"
            "自制粗呢军服的诞生不仅解决了御寒问题，更将南泥湾精神升华为‘热爱祖国、无私奉献、艰苦创业、开拓进取’的兵团精神。"
        ),
        "tags": ["南泥湾精神", "兵团精神", "老纺车", "自力更生", "纺毛线"]
    },
    {
        "id": "AUTH-359-03",
        "type": "official",
        "type_label": "权威史料文献",
        "title": "胜利渠战役：踏破寒冰引天山雪水浇灌戈壁江南",
        "source": "《农一师水利开荒志》·多浪河引水工程档案",
        "author": "第一师阿拉尔市史志办",
        "content": (
            "水是戈壁农业的生命线。1950年春，为解决阿克苏至阿拉尔荒地的灌溉，三五九旅官兵在多浪河上打响修建百里胜利渠战役。"
            "早春时节河水冰冷刺骨，战士们脱下棉衣跳进零下20度的刺骨冰水中排险打桩，用血肉之躯在激流中筑起拦水大坝。"
            "王震将军同战士们同吃窝窝头、同抡坎土曼挖土方。全渠无一台大型挖掘机，硬凭十万双长满老茧的手与简易扁担箩筐，"
            "在百天之内凿通百余里干渠，引天山雪水浸润荒芜瀚海，为当年万亩麦浪与棉田打下不朽奠基。"
        ),
        "tags": ["胜利渠", "多浪河", "冰水打桩", "水利工程", "王震"]
    },
    {
        "id": "AUTH-359-04",
        "type": "official",
        "type_label": "权威史料文献",
        "title": "红柳地窝子：地下两米的青春岁月与生活史",
        "source": "《戈壁长歌：三五九旅老战士口述实录》第4章",
        "author": "塔里木大学西域文化与红色军垦研究所",
        "content": (
            "初到荒原无砖无瓦，风沙漫天，战士们挖掘地下1.8至2米的土坑，以红柳枝和沙枣木为梁，盖以芦苇与泥浆，制成‘地窝子’。"
            "地窝子冬暖夏凉，但沙尘常透缝而入。老军垦口述：‘清晨起床被面上常积一层黄沙，抖抖被褥便又扛起坎土曼上工。’"
            "在幽暗的柴油墨水瓶小灯下，官兵们读夜校、编快板、教文化，写下‘生在井冈山，长在南泥湾，转战数万里，屯垦在天山’的崇高诗篇。"
        ),
        "tags": ["地窝子", "红柳芦苇", "军垦生活史", "革命浪漫主义"]
    },
    {
        "id": "AUTH-359-05",
        "type": "official",
        "type_label": "权威史料文献",
        "title": "民族共建与石榴籽情深：三五九旅与各族农牧民同心开荒",
        "source": "《天山筑梦：兵地各族群众共同开荒历史档案》",
        "author": "阿克苏地区文史研究资料选辑",
        "content": (
            "三五九旅各部初驻阿克苏及阿拉尔各乡镇时，严守三大纪律八项注意，宁宿旷野古庙也不占民房一间。"
            "针对当地少数民族群众缺少铁质农具与水利技术的情况，官兵们将铁匠炉打制的新坎土曼赠予贫苦维吾尔族农民，"
            "并派出医疗卫生员免费走村串户义诊，协助修筑灌渠。维吾尔族群众自发赶着毛驴车送来滚烫的烤馕和甜瓜，"
            "亲切地称军垦官兵为‘亲人金珠玛米’，形成了兵地携手、各族群众‘像石榴籽一样紧紧抱在一起’的和谐局面。"
        ),
        "tags": ["民族共建", "鱼水情深", "赠送坎土曼", "石榴籽", "兵地融合"]
    },
    {
        "id": "FIELD-359-01",
        "type": "custom",
        "type_label": "一手调研访谈",
        "title": "【调研访谈录】老军垦张文生老人回忆1950年打铁与掌心血泡",
        "source": "2024年暑期大学生红色三下乡·阿拉尔市军垦新村访谈实录",
        "author": "高校大学生‘踏寻三五九旅足迹’调研队",
        "content": (
            "口述人：原七一九团老战士张文生（现年93岁，访谈地点：阿拉尔）。"
            "‘我们1950年春打坎土曼的时候，铁料不够，连敌人丢弃的迫击炮弹筒都拾来砸。老班长李铁匠说，炮弹壳的钢韧性好，"
            "淬火时听声音要脆。那会儿木柄全是戈壁上的野胡杨，握起来粗糙，两天下来全班战士手心都是血泡，血水浸进木把里，"
            "时间一久柄子都变成红褐色。现在年轻人看着一把普通铁镐，当年这就是我们打江山、保饭碗的命根子！’"
        ),
        "tags": ["口述史", "老铁匠", "血泡木柄", "炮弹壳", "实地调研"]
    }
]

# 模块三：实体文创实用载体库定义
PRODUCT_CARRIERS = [
    {
        "id": "fan",
        "name": "便携手持小风扇",
        "subtitle": "戈壁清风·手持复古折叠小风扇",
        "features": "扇叶防卷发设计、手柄立体坎土曼浮雕握感、低噪微风吹拂戈壁清凉、Type-C应急快充",
        "color_scheme": "军垦冷轧绿 / 戈壁麦浪金 / 铸铁哑光黑",
        "materials": "ABS环保哑光喷砂工程塑料、锌合金做旧金属吊坠扣、硅胶防滑条",
        "prompt_en": (
            "Professional product studio photography of a portable handheld red-cultural mini fan, "
            "vintage military olive green and matte brushed brass accents, ergonomic handle engraved with 359th brigade pioneer pickaxe Kantuman relief pattern, "
            "bladeless anti-tangle safety airflow grill, minimalist industrial design, crisp white studio background, soft shadows, sharp focus, 8k resolution, product showcase."
        ),
        "mock_img": "https://image.pollinations.ai/prompt/Professional%20product%20photography%20handheld%20mini%20fan%20military%20olive%20green%20and%20brass%20relief%20texture%20minimalist%20industrial%20design%20clean%20white%20background%20studio%20lighting?width=800&height=800&nologo=true&seed=3591"
    },
    {
        "id": "cap",
        "name": "军垦拓荒刺绣帽子",
        "subtitle": "天山印记·水洗做旧帆布工装鸭舌帽",
        "features": "重磅水洗做旧帆布耐磨透气、后侧刺绣三五九旅经纬度坐标（81°17′E, 40°32′N）、前檐立体红星铜扣",
        "color_scheme": "沙漠卡其 / 军绿水洗灰 / 晚霞铁锈红",
        "materials": "16安加厚重磅水洗纯棉帆布、铜质做旧日字调节扣、高密立体棉线刺绣",
        "prompt_en": (
            "Product commercial photography of a stylish washed canvas vintage baseball cap, "
            "earthy military khaki and distressed sage green color, front high-density 3D embroidery of vintage pioneer hoe Kantuman and subtle red star badge, "
            "side stamped with geographic coordinates of Alar Xinjiang, placed neatly on clean white studio backdrop, dramatic natural lighting, textile texture details, 8k."
        ),
        "mock_img": "https://image.pollinations.ai/prompt/Commercial%20product%20photography%20washed%20canvas%20vintage%20baseball%20cap%20military%20khaki%20embroidered%20red%20star%20badge%20clean%20white%20studio%20background%208k?width=800&height=800&nologo=true&seed=3592"
    },
    {
        "id": "cup",
        "name": "戈壁拓荒多功能保温杯",
        "subtitle": "多浪清泉·智能数显双层真空保温杯",
        "features": "LED轻触温度数显杯盖、杯身激光微雕阿克苏百里胜利渠水文线、隐藏式折叠战术把手",
        "color_scheme": "哑光战壕绿 / 麦穗磨砂金 / 极简冷灰",
        "materials": "食品级316L医用不锈钢内胆、外层仿粗粝岩石触感喷塑涂层、竹木杯盖嵌铜扣",
        "prompt_en": (
            "Studio product photography of a premium tactical vacuum insulated thermos water bottle, "
            "matte army green finish with laser-engraved topographical river wave lines of Shengli Canal, brushed gold stainless steel cap with touch digital temperature display, "
            "ultra-clean solid white studio backdrop, soft elegant reflections, high-end industrial product design, 8k resolution."
        ),
        "mock_img": "https://image.pollinations.ai/prompt/Studio%20product%20photography%20tactical%20vacuum%20thermos%20matte%20army%20green%20brushed%20gold%20details%20clean%20white%20studio%20backdrop%20soft%20reflections%208k?width=800&height=800&nologo=true&seed=3593"
    },
    {
        "id": "bag",
        "name": "军垦拓荒工装帆布袋",
        "subtitle": "由战转耕·重磅复古托特工装包",
        "features": "双层加固大容量仓底、外侧多功能坎土曼工具挂环插袋、丝网手工套印1950阿克苏开荒纪念章",
        "color_scheme": "原生态棉麻胚白 / 军绿拼接 / 赭石红丝印",
        "materials": "20安超厚原生未漂白棉麻帆布、真牛皮提手手把加固、实心黄铜铆钉",
        "prompt_en": (
            "Flat lay product catalog photography of a rugged heavy-duty canvas tote messenger bag, "
            "natural ecru off-white canvas with vintage olive green reinforced webbing straps, front vintage silkscreen print of 1950 pioneer tools and cotton branch typography, "
            "solid brass rivets, isolated on pristine white studio background, studio lighting, hyper-realistic fabric texture, 8k."
        ),
        "mock_img": "https://image.pollinations.ai/prompt/Product%20catalog%20photography%20heavy-duty%20canvas%20tote%20bag%20natural%20ecru%20olive%20green%20straps%20brass%20rivets%20isolated%20white%20background%208k?width=800&height=800&nologo=true&seed=3594"
    },
    {
        "id": "magnet",
        "name": "金属复古浮雕冰箱贴",
        "subtitle": "红柳记忆·双层立体合金文创贴",
        "features": "双层错位镂空立体浮雕、红柳枝地窝子造型结合老铁匠打铁剪影、暗夜微夜光涂层设计",
        "color_scheme": "复古红古铜 / 珐琅中国红 / 哑光黑铁",
        "materials": "锌合金高压压铸做旧电镀、手工填色软珐琅、环保高强钕铁硼磁石",
        "prompt_en": (
            "Macro product shot of an exquisite commemorative zinc alloy 3D relief fridge magnet, "
            "antique copper plating with rich red enamel accents, depicting soldiers forging pickaxe hoe near subterranean diwozi shelter under starry sky, "
            "layered architectural metal relief, studio lighting on pure white background, sharp metallic textures, 8k resolution."
        ),
        "mock_img": "https://image.pollinations.ai/prompt/Macro%20product%20shot%203D%20metal%20relief%20fridge%20magnet%20antique%20copper%20and%20red%20enamel%20details%20pure%20white%20background%208k?width=800&height=800&nologo=true&seed=3595"
    }
]

# 模块二：精选全案传播方案与调研问卷标准 Markdown
MOCK_CAMPAIGN_SURVEY_RESULT = {
    "topic": "让三五九旅第一把坎土曼走进青年",
    "xiaohongshu": {
        "title": "家人们破防了！70年前这届军垦青年，竟用废炮弹壳‘手搓’出开荒神器⛏️",
        "tags": ["#三五九旅", "#军垦青年", "#第一把坎土曼", "#红色文旅", "#拒绝精神内耗", "#多民族青年", "#大学生特种兵打卡"],
        "body": (
            "如果在20岁那年，把你扔进零下20度的塔里木荒原，面前只有戈壁盐碱滩和漫天风沙，手里甚至连一把开荒的铁锹都没有，你会怎么办？🥺\n\n"
            "在阿克苏三五九旅纪念馆里，这把锈迹斑斑却刃口极锋利的坎土曼真的狠狠戳中了我！\n\n"
            "🔥 真实历史比电影更硬核：\n"
            "1️⃣【废炮弹壳手敲农具】：1950年刚进疆，根本买不到铁工具。三五九旅的爷爷奶奶们在戈壁滩支起土高炉，捡战场上的破铁轨、废炮弹壳，烈火淬火，硬是一锤一锤敲出了军垦第一把坎土曼！\n"
            "2️⃣【血泡磨出的绿洲奇迹】：4斤半纯手工锻造，为了引雪水修百里胜利渠，战士们在刺骨冰水里打桩，手掌磨破渗血，血水染红了胡杨木手柄！\n"
            "3️⃣【兵民一家的信物】：打出的第一批好农具，官兵二话不说先送给周边维吾尔族贫苦乡亲，手把手教开荒技术，乡亲们赶着驴车送来热腾腾的烤馕……\n\n"
            "🌾 走过阿克苏与阿拉尔，才懂什么是‘向戈壁要绿洲’。\n"
            "面对考研、求职、生活的坚硬硬土，愿我们都能握紧属于自己的这把‘精神坎土曼’——没有路，就用双手砸出一条路！💪\n\n"
            "📍打卡坐标：新疆阿克苏 / 阿拉尔三五九旅屯垦纪念馆\n"
            "💡文创周边：手持复古清风扇 & 拓荒坐标刺绣帆布帽已入！"
        )
    },
    "douyin_script": {
        "title": "《回响在冻土下的打铁声》（60秒短视频/分镜头脚本）",
        "bpm": "低沉心跳呼吸声 -> 骤然激昂的金属锻打重音 -> 壮阔冬不拉与交响管弦",
        "scenes": [
            {
                "scene_num": 1,
                "time": "00:00 - 00:10",
                "shot": "特写/微距 (Close-up)",
                "visual": "漫天戈壁黄沙呼啸掠过枯黄芦苇。镜头缓缓推进至一柄插在冻土上的深褐色旧坎土曼，刃口在风沙中闪烁斑驳微光。",
                "audio": "呼啸的风暴声、老式钟表滴答声与急促心跳混音",
                "dialogue": "（低沉画外音）‘面对坚硬如铁的现实与一望无际的荒原，你是否也曾想过退缩？’"
            },
            {
                "scene_num": 2,
                "time": "00:10 - 00:25",
                "shot": "快速蒙太奇/快剪 (Montage)",
                "visual": "熊熊燃烧的土高炉火星四溅！青年战士与老铁匠汗流浃背赤膊抡锤，重锤砸在通红废炮弹钢坯上！快速穿插战士们跳进零下20度刺骨冰水打桩筑坝的黑白历史定格照。",
                "audio": "震耳欲聋、清脆铿锵的‘铛！铛！铛！’锻打铁器音效，如急促战鼓",
                "dialogue": "‘没有枪炮，我们能打胜仗；没有农具，我们就把炮弹壳熔成开荒破土的刀！’"
            },
            {
                "scene_num": 3,
                "time": "00:25 - 00:45",
                "shot": "升降镜头推进至全景 (Crane/Wide)",
                "visual": "淬火白气腾空而起，晨光破云而出照射在崭新锋利的坎土曼上！各族青年官兵与维吾尔族老乡并肩发力将农具铲入坚硬盐碱地，下一秒转场为千顷金色麦浪与万亩雪白棉田迎风涌动！",
                "audio": "欢快奔放的维吾尔族冬不拉琴声与交响乐澎湃交织",
                "dialogue": "‘一铲下去是戈壁荒滩，一万铲下去是塞外江南！’"
            },
            {
                "scene_num": 4,
                "time": "00:45 - 00:60",
                "shot": "虚实转场/当代青年视角 (Match Cut)",
                "visual": "镜头无缝拉回到现代阿拉尔市大学生创客空间与塔里木大学校园，当代青年手持带有坎土曼浮雕的复古小风扇与工装包，目光坚定望向远方。",
                "audio": "清脆治愈的金属敲击余音收尾，配以温暖舒缓电子氛围音乐",
                "dialogue": "‘致敬每一个在坚硬生活里，亲手锻打出勇气、把荒原变绿洲的青年！’"
            }
        ]
    },
    "survey_markdown": (
        "# 《三五九旅红色文化青年群体传播效果与文创接受度调查问卷》\n\n"
        "> 尊敬的受访者：您好！本问卷旨在深入调研三五九旅屯垦历史、兵团精神在当代多民族青年及高校大学生群体中的传播效果与文化认同，并评估实用文创产品的研发方向。您的真实反馈对推进红色文化创新传承具有重要意义，所有数据均严格匿名，感谢您的支持！\n\n"
        "---\n\n"
        "### 一、受访者基础人口学画像\n\n"
        "**1. 您的年龄区间是：**\n"
        "- [ ] A. 18岁以下\n"
        "- [ ] B. 18 - 25岁（高校在读/初入职场）\n"
        "- [ ] C. 26 - 35岁（青年工作者/青年骨干）\n"
        "- [ ] D. 36岁及以上\n\n"
        "**2. 您的民族属性：**\n"
        "- [ ] A. 汉族\n"
        "- [ ] B. 维吾尔族\n"
        "- [ ] C. 哈萨克族\n"
        "- [ ] D. 回族 / 蒙古族 / 柯尔克孜族等其他少数民族\n\n"
        "**3. 您的职业或身份：**\n"
        "- [ ] A. 在校大学生 / 研究生\n"
        "- [ ] B. 文化传媒 / 新媒体创作者\n"
        "- [ ] C. 企事业单位青年职工\n"
        "- [ ] D. 青年创业者 / 自由职业者\n\n"
        "---\n\n"
        "### 二、三五九旅红色历史认知与触达渠道\n\n"
        "**4. 在参与本次调研前，您对三五九旅进驻新疆屯垦戍边历史的了解程度是：**\n"
        "- [ ] A. 非常深入（熟知阿克苏开荒、第一把坎土曼、胜利渠等具体事件）\n"
        "- [ ] B. 较为熟悉（听过南泥湾、地窝子、兵团建设等主要精神）\n"
        "- [ ] C. 仅知晓名字（知道是著名战斗部队，不清楚具体屯垦细节）\n"
        "- [ ] D. 完全不了解\n\n"
        "**5. 您最倾向于通过哪些新媒体形式接触三五九旅红色文化？（可多选）**\n"
        "- [ ] A. 小红书视觉图文笔记（故事化、年轻化排版）\n"
        "- [ ] B. 抖音 / 视频号 / B站 剧情短剧与微电影分镜\n"
        "- [ ] C. 沉浸式情景打铁工坊 / 红色剧本杀体验\n"
        "- [ ] D. 具有实用价值的生活文创周边（手持风扇、水杯、帆布袋）\n"
        "- [ ] E. 严肃文博纪录片与权威书籍\n\n"
        "---\n\n"
        "### 三、红色文化情感认同度评估（5级李克特量表）\n"
        "> 请根据您的真实感受评分（1=完全不认同，2=不太认同，3=一般，4=比较认同，5=完全认同）\n\n"
        "| 评价指标 | 1分 | 2分 | 3分 | 4分 | 5分 |\n"
        "| :--- | :---: | :---: | :---: | :---: | :---: |\n"
        "| 6. 三五九旅“废炮弹壳打制第一把坎土曼”的奋斗故事对当代青年攻克精神内耗具有强烈的激励共鸣 | ○ | ○ | ○ | ○ | ○ |\n"
        "| 7. 兵地共建、各族群众“像石榴籽紧抱”共同拓荒的历史细节增进了我的中华民族共同体认同 | ○ | ○ | ○ | ○ | ○ |\n"
        "| 8. 相比于传统口号宣讲，结合当代青年生活痛点的“生活史视角”更容易引发我的情感共鸣 | ○ | ○ | ○ | ○ | ○ |\n"
        "| 9. 我愿意向身边同学或朋友主动分享具有工业美感的军垦红色新媒体内容 | ○ | ○ | ○ | ○ | ○ |\n\n"
        "---\n\n"
        "### 四、实体文创周边设计与购买意愿评估\n\n"
        "**10. 下列结合三五九旅硬核元素的实体文创中，您最感兴趣且愿意日常携带使用的是？（最多选2项）**\n"
        "- [ ] A. 便携手持小风扇（戈壁清风概念、坎土曼浮雕手柄、防卷发扇叶）\n"
        "- [ ] B. 军垦拓荒工装刺绣帽子（水洗做旧帆布、阿克苏经纬度微标）\n"
        "- [ ] C. 戈壁拓荒多功能保温杯（哑光战壕绿、激光雕刻胜利渠水文线、智能数显）\n"
        "- [ ] D. 军垦工装帆布托特包（20安超厚棉麻、手工铁扣件、开荒图章）\n"
        "- [ ] E. 金属复古立体浮雕冰箱贴（双层红铜合金、红星软珐琅、暗夜微光）\n\n"
        "**11. 您认为红色文创要真正“打动年轻人”，最关键的核心要素是什么？**\n"
        "- [ ] A. 极高的日常实用性（必须是生活中天天能用得上的物件）\n"
        "- [ ] B. 工业级现代设计审美（拒绝廉价红黄塑料感，注重哑光金属与帆布质感）\n"
        "- [ ] C. 深厚且真挚的历史细节支撑（每件产品背后有真实的文物故事铭牌）\n"
        "- [ ] D. 合理亲民的定价（50元以内的青年文创首选区间）\n\n"
        "---\n\n"
        "### 五、开放式宝贵意见与建议\n\n"
        "**12. 请用一两句话写下：您认为如何能让三五九旅的“开荒精神”以更酷、更有力量的方式走进当下的多民族青年圈层？**\n"
        "答：_________________________________________________________________\n\n"
        "（问卷结束，再次感谢您对三五九旅红色文化创新赋能研究的大力支持！）"
    )
}
