# “屯垦智答 2.5” —— 三五九旅红色文化研究与文创设计工作台

> **359th Brigade Cultural Archive & Industrial Design Studio (v2.5)**  
> 集成 **【Okapi BM25 + 语义向量混合 RAG 智能助手】**、**【新媒体全案传播与调查问卷生成】** 与 **【实用实体文创工业设计打样】** 三大核心系统，全面支持 **Web 在线直开（GitHub Pages）**、**Android 原生安装包（APK）** 与 **FastAPI 本地全栈服务**。

---

## 🔗 在线体验与手机 APK 下载

- **GitHub Pages 在线访问（零配置秒开）**：https://doreenlight.github.io/tunken-zhida/
- **Android 手机正式签名安装包（v2.5.0）**：https://github.com/DoreenLight/tunken-zhida/releases/tag/v2.5.0

---

## ✨ 核心架构与升级亮点

### 1. 混合 RAG 检索引擎 2.5 + 真实流式 AI 助手
- **Okapi BM25 + 概念同义词语义向量融合**：结合领域专有词典、中文 2/3-Gram、双向同义概念扩展与标题/标签加权，支持口语化“零原词”召回（如询问“冬天没有棉衣怎么过冬做衣服”可精准命中《塞外老纺车》）。
- **多轮指代消解与相关性阈值拦截**：自动结合最近多轮上下文补全代词指代；内置停用词表与最低相关性截断阈值，日常问候或领域外问题自动返回 `0` 引用，杜绝乱标虚假角标。
- **长文档导入与自动语义分块**：支持直接导入本地 `.txt` / `.md` 研究资料，超长文本自动按句子/段落边界做滑动窗口分块（标注 `片段 1/N`），并支持在知识库面板内实时测试混合检索排序与单条删除。
- **多平台真实 Token 级 SSE 流式对话**：内置 **硅基流动 SiliconFlow（默认推荐免费模型 `Qwen/Qwen2.5-7B-Instruct`）**、**DeepSeek 官方**、**阿里云百炼（通义千问）**、**Google Gemini** 与 **自定义 OpenAI 兼容接口**，支持一键连通性测试、中途停止生成、重新生成与多会话历史持久化。

### 2. 新媒体全案传播策划与自动问卷生成
- 输入传播命题一键生成 **小红书爆款图文**（`ARCHIVE NO. 359` 封面概念卡 + 正文 + 标签）、**抖音短视频分镜头脚本** 与 **《三五九旅红色文化青年传播效果调查问卷》**（含 5 级李克特量表矩阵），支持复制与导出 `.md` 文件（手机端自动唤起系统原生分享/保存面板）。

### 3. 实用实体文创工业设计工作室
- 预置 **便携手持小风扇、军垦拓荒刺绣帽子、戈壁多功能保温杯、军垦工装帆布袋、金属复古浮雕冰箱贴** 5 款日常实用实体载体，输出可视化色卡体系、材质工艺说明、商业棚拍英文 Prompt 与视觉概念图（断网时自动降级为本地矢量工业蓝图 SVG）。

---

## 📂 目录结构

```text
tunken_zhida/
├── android/                 # Capacitor 6 原生 Android 工程（含朱砂印章「垦」多分辨率图标）
├── backend/
│   ├── main.py              # FastAPI 2.5 服务端入口、SSE 流与静态资源托管
│   ├── rag_engine.py        # Okapi BM25 + 语义向量混合检索、多轮改写与自动分块引擎
│   ├── llm_service.py       # 多平台真实 Token 级流式调度器与句子级抽取兜底
│   ├── prompts.py           # 智能助手模式 / 严格考据模式 / 全案 / 文创 System Prompts
│   └── presets.py           # 双轨知识库预置文献、5 款实用文创载体与问卷模板
├── frontend/
│   ├── index.html           # 档案考据 × 工业设计工作室响应式工作台（含手机底部三栏导航）
│   ├── css/style.css        # 宣纸暖灰 + 素白展陈 + 朱砂印泥红定制样式系统
│   ├── js/app.js            # 纯原生前端控制器（内置完整 ClientRAGEngine 混合检索引擎）
│   ├── favicon.svg          # 矢量朱砂方印「垦」图标
│   └── manifest.webmanifest # PWA 应用清单
├── scripts/
│   └── build_apk.ps1        # 一键同步并编译签名版 Android Release APK 脚本
├── tests/
│   ├── test_backend.py      # 混合 RAG、零误报拦截、指代消解与自动切片单元测试
│   ├── test_api_e2e.py      # FastAPI 全端点端到端集成测试
│   └── verify_browser_render.py # 真实无头浏览器 DOM 渲染校验
├── capacitor.config.json    # Capacitor 原生容器配置
├── package.json             # 前端与 APK 构建脚本配置
├── requirements.txt         # Python 后端依赖
└── run.py                   # 本地全栈服务一键启动脚本
```

---

## 🚀 本地运行与 APK 重新打包指南

### 1. 启动本地 Python 全栈服务
```powershell
pip install -r requirements.txt
python run.py
```
启动后默认访问：`http://127.0.0.1:8000`

### 2. 一键重新编译手机签名版 APK
修改 `frontend/` 代码后，在项目根目录执行：
```powershell
npm run apk:build
```
构建完成后将在项目根目录自动生成经过 v1 + v2 签名的 `屯垦智答_v2.5_手机安装包.apk`。
