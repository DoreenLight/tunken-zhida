"""
三五九旅红色文化与文创赋能系统 - FastAPI 主服务
提供三大核心模块：
1. 屯垦智答·双轨可溯源对话系统 (Chat RAG)
2. 新媒体全案传播策划与自动调查问卷生成
3. 实用实体文创（小风扇/帽子/保温杯等）概念图与工业设计生成
"""

import json
import os
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.presets import DEFAULT_KNOWLEDGE_SLICES, PRODUCT_CARRIERS
from backend.rag_engine import global_rag_engine
from backend.llm_service import global_llm_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await global_llm_service.close()


app = FastAPI(
    title="屯垦智答 - 三五九旅红色文化与文创赋能系统",
    description="集成双轨可溯源问答、全案新媒体与调研问卷自动生成、实体生活文创概念设计三大核心系统。",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 数据请求模型
class AddCustomFieldSliceRequest(BaseModel):
    title: str = Field(..., description="调研素材标题")
    content: str = Field(..., description="老军垦口述录音整理或实地调研笔记正文")
    source: Optional[str] = Field("一手老军垦实地访谈实录", description="出处档案或调查人")
    author: Optional[str] = Field("红色调研小组", description="记录人或机构")
    tags: Optional[List[str]] = Field(default_factory=list, description="标签")


class ChatRequest(BaseModel):
    query: str = Field(..., description="用户对话提问")
    history: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="多轮对话历史")
    api_key: Optional[str] = Field("", description="可选 API Key")
    model: Optional[str] = Field("gemini-3.8-flash", description="基座模型")


class CampaignRequest(BaseModel):
    topic: str = Field("让三五九旅第一把坎土曼走进青年", description="传播核心命题")
    api_key: Optional[str] = Field("", description="可选 API Key")
    model: Optional[str] = Field("gemini-3.8-flash", description="基座模型")


class ProductRequest(BaseModel):
    carrier_id: str = Field("fan", description="载体ID: fan, cap, cup, bag, magnet")
    topic: Optional[str] = Field("", description="文创定制主题或精神要素")
    api_key: Optional[str] = Field("", description="可选 API Key")
    model: Optional[str] = Field("gemini-3.8-flash", description="基座模型")


# =========================================================================
# 基础与双轨知识库接口
# =========================================================================

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "app_name": "屯垦智答 2.0 (Tunken Zhida)",
        "knowledge_count": len(global_rag_engine.slices),
        "official_count": sum(1 for s in global_rag_engine.slices if s.get("type") == "official"),
        "custom_count": sum(1 for s in global_rag_engine.slices if s.get("type") == "custom"),
        "carriers_count": len(PRODUCT_CARRIERS)
    }


@app.get("/api/presets/slices")
async def get_slices():
    """获取当前双轨知识库中的所有文献与访谈切片"""
    return {
        "total_count": len(global_rag_engine.slices),
        "slices": global_rag_engine.slices
    }


@app.post("/api/slices/add")
async def add_custom_slice(payload: AddCustomFieldSliceRequest):
    """用户追加一手调研访谈素材"""
    if not payload.title.strip() or not payload.content.strip():
        raise HTTPException(status_code=400, detail="切片标题与内容正文不能为空")

    new_doc = global_rag_engine.add_custom_field_slice(
        title=payload.title,
        content=payload.content,
        source=payload.source,
        author=payload.author,
        tags=payload.tags
    )
    return {
        "message": "实地调研素材已成功录入双轨知识库，并完成向量索引！",
        "doc": new_doc,
        "total_count": len(global_rag_engine.slices)
    }


@app.post("/api/slices/reset")
async def reset_slices():
    """重置回系统初始的双轨知识库"""
    global_rag_engine.load_documents(DEFAULT_KNOWLEDGE_SLICES)
    return {
        "message": "已重置为系统预置的三五九旅双轨文献知识库",
        "total_count": len(global_rag_engine.slices),
        "slices": global_rag_engine.slices
    }


# =========================================================================
# 模块一：智能多轮可溯源问答 (Chat RAG - SSE Stream)
# =========================================================================

@app.post("/api/chat/stream")
async def chat_stream(payload: ChatRequest):
    """可溯源对话流端点 (SSE)"""
    retrieved = global_rag_engine.search(payload.query, top_k=4)
    context = global_rag_engine.build_rag_context(retrieved)

    async def event_generator():
        try:
            async for chunk in global_llm_service.chat_stream(
                query=payload.query,
                history=payload.history,
                retrieved_slices=retrieved,
                context=context,
                api_key=payload.api_key,
                model_name=payload.model
            ):
                event_line = f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                yield event_line.encode("utf-8")
        except Exception as e:
            err_data = {"type": "error", "message": f"对话流异常: {str(e)}"}
            yield f"data: {json.dumps(err_data, ensure_ascii=False)}\n\n".encode("utf-8")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


# =========================================================================
# 模块二：新媒体全案传播策划与调研问卷自动生成
# =========================================================================

@app.post("/api/campaign/generate")
async def generate_campaign(payload: CampaignRequest):
    """一键生成小红书爆款图文、抖音分镜脚本与标准 Markdown 调查问卷"""
    retrieved = global_rag_engine.search(payload.topic, top_k=2)
    context = global_rag_engine.build_rag_context(retrieved)

    result = await global_llm_service.generate_campaign_and_survey(
        topic=payload.topic,
        context=context,
        api_key=payload.api_key,
        model_name=payload.model
    )
    return result


# =========================================================================
# 模块三：实体文创实用载体设计与生图
# =========================================================================

@app.get("/api/product/carriers")
async def get_carriers():
    """获取所有支持的实用实体文创周边载体列表"""
    return {
        "count": len(PRODUCT_CARRIERS),
        "carriers": PRODUCT_CARRIERS
    }


@app.post("/api/product/generate")
async def generate_product(payload: ProductRequest):
    """生成指定载体的工业设计说明、白底摄影 Prompt 与概念图"""
    retrieved = global_rag_engine.search(payload.topic or "三五九旅坎土曼", top_k=2)
    context = global_rag_engine.build_rag_context(retrieved)

    design_data = await global_llm_service.generate_product_design(
        carrier_id=payload.carrier_id,
        custom_topic=payload.topic,
        context=context,
        api_key=payload.api_key,
        model_name=payload.model
    )
    return design_data


# =========================================================================
# 静态资源与前端页面挂载
# =========================================================================
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")
    css_dir = os.path.join(frontend_dir, "css")
    js_dir = os.path.join(frontend_dir, "js")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")

    @app.get("/favicon.svg")
    async def serve_favicon():
        icon_path = os.path.join(frontend_dir, "favicon.svg")
        if os.path.exists(icon_path):
            return FileResponse(icon_path, media_type="image/svg+xml")
        raise HTTPException(status_code=404, detail="Favicon not found")

    @app.get("/manifest.webmanifest")
    async def serve_manifest():
        manifest_path = os.path.join(frontend_dir, "manifest.webmanifest")
        if os.path.exists(manifest_path):
            return FileResponse(manifest_path, media_type="application/manifest+json")
        raise HTTPException(status_code=404, detail="Manifest not found")

    @app.get("/")
    async def serve_index():
        index_path = os.path.join(frontend_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "Frontend index.html not found"}
