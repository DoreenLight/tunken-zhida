"""
大模型与混合 RAG 智能助手服务 2.5 (Streaming LLM & Hybrid RAG Service)
支持：
- 多平台真实 Token 级 SSE 流式输出（SiliconFlow 硅基流动 / DeepSeek / 通义千问 / Google Gemini / 自定义 OpenAI 兼容接口）
- API 连通性一键检测
- 无 API Key 时的精准句子级抽取式问答（Extractive QA）与零误报闲聊响应
"""

import asyncio
import copy
import json
import logging
import re
import urllib.parse
import zlib
from typing import Dict, Any, AsyncGenerator, List, Optional, Tuple
import httpx

from backend.presets import (
    PRODUCT_CARRIERS,
    MOCK_CAMPAIGN_SURVEY_RESULT,
)
from backend.prompts import (
    SYSTEM_PROMPT_CHAT_HYBRID,
    SYSTEM_PROMPT_CHAT_STRICT,
    SYSTEM_PROMPT_CAMPAIGN_SURVEY,
    SYSTEM_PROMPT_PRODUCT_DESIGN,
    build_chat_user_prompt,
    build_campaign_user_prompt,
    build_product_user_prompt,
)
from backend.rag_engine import global_rag_engine

logger = logging.getLogger("llm_service")
logging.basicConfig(level=logging.INFO)

PROVIDER_DEFAULTS: Dict[str, Dict[str, str]] = {
    "siliconflow": {
        "base_url": "https://api.siliconflow.cn/v1",
        "default_model": "Qwen/Qwen2.5-7B-Instruct",
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com/v1",
        "default_model": "deepseek-chat",
    },
    "dashscope": {
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "default_model": "qwen-plus",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "default_model": "gemini-2.5-flash",
    },
}

LEGACY_GEMINI_ALIASES = {
    "gemini-3.8-flash": "gemini-2.5-flash",
    "gemini-3.5-flash-lite": "gemini-2.5-flash-lite",
}


class LLMService:
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=60.0)

    async def close(self):
        """优雅关闭 HTTP 客户端连接池"""
        await self.http_client.aclose()

    def _resolve_provider(
        self,
        provider: Optional[str],
        base_url: Optional[str],
        model_name: Optional[str]
    ) -> Tuple[str, str, str]:
        """解析协议类型 ('openai' | 'gemini')、请求地址与实际模型名"""
        prov = (provider or "").strip().lower()
        model = (model_name or "").strip()
        b_url = (base_url or "").strip()

        if not prov:
            if b_url and "googleapis.com" not in b_url:
                prov = "custom"
            elif "deepseek" in model.lower():
                prov = "deepseek"
            elif "/" in model or model.lower().startswith("qwen"):
                prov = "siliconflow"
            else:
                prov = "gemini"

        if prov == "gemini":
            actual_model = LEGACY_GEMINI_ALIASES.get(model, model or "gemini-2.5-flash")
            return "gemini", PROVIDER_DEFAULTS["gemini"]["base_url"], actual_model

        preset = PROVIDER_DEFAULTS.get(prov, {})
        resolved_url = (b_url or preset.get("base_url") or "https://api.siliconflow.cn/v1").rstrip("/")
        actual_model = model or preset.get("default_model") or "Qwen/Qwen2.5-7B-Instruct"
        return "openai", resolved_url, actual_model

    def _extract_json_object(self, raw_text: Optional[str]) -> Optional[Dict[str, Any]]:
        """从模型响应中安全提取 JSON 对象"""
        if not raw_text:
            return None
        cleaned = raw_text.strip()
        fence_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", cleaned)
        if fence_match:
            cleaned = fence_match.group(1)
        else:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end > start:
                cleaned = cleaned[start:end + 1]
        try:
            parsed = json.loads(cleaned)
            return parsed if isinstance(parsed, dict) else None
        except Exception:
            return None

    async def call_llm_complete(
        self,
        api_key: str,
        model: Optional[str],
        system_prompt: str,
        user_prompt: str,
        provider: Optional[str] = None,
        base_url: Optional[str] = None,
        max_tokens: int = 3500
    ) -> Tuple[Optional[str], Optional[str]]:
        """非流式完整调用（用于全案 JSON、文创规格 JSON 与连通性检测），返回 (text, error)"""
        key = (api_key or "").strip()
        if not key:
            return None, "未提供 API Key"

        protocol, resolved_url, actual_model = self._resolve_provider(provider, base_url, model)

        try:
            if protocol == "gemini":
                url = f"{resolved_url}/models/{actual_model}:generateContent?key={key}"
                payload = {
                    "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                    "systemInstruction": {"role": "user", "parts": [{"text": system_prompt}]},
                    "generationConfig": {"temperature": 0.35, "maxOutputTokens": max_tokens}
                }
                resp = await self.http_client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", ""), None
                    return None, "Gemini 返回内容为空"
                return None, f"Gemini HTTP {resp.status_code}: {resp.text[:180]}"

            url = f"{resolved_url}/chat/completions"
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            payload = {
                "model": actual_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.35,
                "max_tokens": max_tokens
            }
            resp = await self.http_client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", ""), None
                return None, "接口未返回有效 choices"
            return None, f"HTTP {resp.status_code}: {resp.text[:180]}"
        except Exception as e:
            logger.warning(f"LLM complete error: {e}")
            return None, str(e)

    async def stream_llm_tokens(
        self,
        api_key: str,
        model: Optional[str],
        system_prompt: str,
        user_prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        provider: Optional[str] = None,
        base_url: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """真正的 Token 级流式大模型生成器（支持 OpenAI 兼容 SSE 与 Gemini SSE）"""
        key = (api_key or "").strip()
        if not key:
            return

        protocol, resolved_url, actual_model = self._resolve_provider(provider, base_url, model)

        if protocol == "gemini":
            url = f"{resolved_url}/models/{actual_model}:streamGenerateContent?alt=sse&key={key}"
            payload = {
                "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                "systemInstruction": {"role": "user", "parts": [{"text": system_prompt}]},
                "generationConfig": {"temperature": 0.35, "maxOutputTokens": 3500}
            }
            async with self.http_client.stream("POST", url, json=payload) as resp:
                if resp.status_code != 200:
                    err_body = (await resp.aread()).decode("utf-8", errors="ignore")
                    raise RuntimeError(f"Gemini HTTP {resp.status_code}: {err_body[:160]}")
                async for line in resp.aiter_lines():
                    line = line.strip()
                    if not line.startswith("data:"):
                        continue
                    raw_json = line[5:].strip()
                    if not raw_json or raw_json == "[DONE]":
                        continue
                    try:
                        chunk_obj = json.loads(raw_json)
                        parts = chunk_obj.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                        for part in parts:
                            txt = part.get("text", "")
                            if txt:
                                yield txt
                    except Exception:
                        continue
            return

        # OpenAI 兼容协议流式请求
        url = f"{resolved_url}/chat/completions"
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for turn in history[-6:]:
                r = turn.get("role")
                c = (turn.get("content") or "").strip()
                if r in ("user", "assistant") and c:
                    messages.append({"role": r, "content": c[:600]})
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": actual_model,
            "messages": messages,
            "temperature": 0.35,
            "max_tokens": 3500,
            "stream": True
        }

        async with self.http_client.stream("POST", url, json=payload, headers=headers) as resp:
            if resp.status_code != 200:
                err_body = (await resp.aread()).decode("utf-8", errors="ignore")
                raise RuntimeError(f"API HTTP {resp.status_code}: {err_body[:160]}")
            async for line in resp.aiter_lines():
                line = line.strip()
                if not line.startswith("data:"):
                    continue
                raw_json = line[5:].strip()
                if not raw_json or raw_json == "[DONE]":
                    break
                try:
                    chunk_obj = json.loads(raw_json)
                    delta = chunk_obj.get("choices", [{}])[0].get("delta", {})
                    content_piece = delta.get("content") or ""
                    if content_piece:
                        yield content_piece
                except Exception:
                    continue

    async def test_connection(
        self,
        provider: Optional[str],
        base_url: Optional[str],
        api_key: str,
        model: Optional[str]
    ) -> Dict[str, Any]:
        """验证用户配置的 API 密钥与模型连通性"""
        _, resolved_url, actual_model = self._resolve_provider(provider, base_url, model)
        reply, err = await self.call_llm_complete(
            api_key=api_key,
            model=actual_model,
            system_prompt="你是一个简洁的连通性测试助手。",
            user_prompt="请仅回复：连接正常",
            provider=provider,
            base_url=base_url,
            max_tokens=32
        )
        if reply:
            return {
                "ok": True,
                "model": actual_model,
                "endpoint": resolved_url,
                "reply": reply.strip()[:40],
                "message": f"模型 {actual_model} 连接验证成功"
            }
        return {
            "ok": False,
            "model": actual_model,
            "endpoint": resolved_url,
            "message": f"连接失败：{err or '未知错误'}"
        }

    def generate_image_url(self, prompt: str, seed: int = 359) -> str:
        """生成商业产品摄影展示图 URL"""
        encoded_prompt = urllib.parse.quote(prompt.strip())
        return f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=800&nologo=true&seed={seed}&model=flux"

    def _build_extractive_answer(
        self,
        query: str,
        retrieved_slices: List[Dict[str, Any]],
        analysis: Dict[str, Any],
        rag_mode: str = "hybrid"
    ) -> str:
        """无 API Key 时的精准句子抽取式问答与自然闲聊兜底（绝不乱加无关引用）"""
        if analysis.get("intent") == "chitchat":
            return (
                "您好！我是 **屯垦智答 AI 助手**。\n\n"
                "- **混合知识库检索（本地已就绪）**：内置 Okapi BM25 + 语义同义词向量引擎，您可以直接询问三五九旅进疆开荒、第一把坎土曼、百里胜利渠、红柳地窝子、塞外老纺车或老军垦访谈等任意细节，也可导入自己的 `.txt`/`.md` 调研笔记。\n"
                "- **全领域生成式 AI 对话**：点击左下角 **「模型与 API 配置」** 填入任意主流大模型密钥（如硅基流动免费模型 `Qwen/Qwen2.5-7B-Instruct` 或 DeepSeek），即可开启与市面上完全一致的自由流式推理与多轮探讨。"
            )

        if not retrieved_slices:
            if rag_mode == "strict":
                return "根据当前已收录的【权威史料文献】与【一手调研访谈】双轨知识库检索结果，暂无与该问题直接相关的档案记载。"
            return (
                f"当前本地双轨知识库中未检索到与 **“{query}”** 直接匹配的三五九旅史料切片（已自动过滤低相关性噪声，避免乱标引用）。\n\n"
                "您可以通过以下任一方式继续：\n"
                "1. 若这是通用问题或跨领域探讨，点击侧栏 **「模型与 API 配置」** 填入大模型 API Key（支持硅基流动免费模型、DeepSeek、通义千问、Gemini），即可解锁完整生成式 AI 对话；\n"
                "2. 若您手头有相关口述史或文献文档，点击 **「录入调研素材」** 导入 `.txt` / `.md` 或粘贴文本，系统将自动分块建立混合索引。"
            )

        effective_q = analysis.get("rewritten_query") or query
        extracted = global_rag_engine.extract_relevant_sentences(effective_q, retrieved_slices, max_per_slice=2)
        if not extracted:
            top_doc = retrieved_slices[0]["slice"]
            return f"依据双轨知识库《{top_doc.get('title', '')}》考据：{top_doc.get('content', '')}[1]"

        lines = ["基于双轨知识库混合检索（BM25 + 语义向量）命中的相关档案，为您梳理考据要点如下：\n"]
        for item in extracted[:3]:
            idx = item["index"]
            doc = item["doc"]
            track = "权威史料" if doc.get("type") == "official" else "一手访谈"
            body = "".join(item["sentences"]).strip()
            lines.append(f"- **《{doc.get('title', '')}》**（{track} · {doc.get('source', '')}）：{body}[{idx}]")

        lines.append(
            "\n> 提示：当前处于本地精准检索摘录模式；在侧栏「模型与 API 配置」填入在线大模型密钥后，可对上述史料进行深度归纳、对比与跨视角延展。"
        )
        return "\n".join(lines)

    # =========================================================================
    # 模块一：双轨可溯源对话聊天流 (真实 Token 级 SSE Stream)
    # =========================================================================
    async def chat_stream(
        self,
        query: str,
        history: List[Dict[str, str]],
        retrieved_slices: List[Dict[str, Any]],
        context: str,
        api_key: Optional[str] = None,
        model_name: Optional[str] = "Qwen/Qwen2.5-7B-Instruct",
        provider: Optional[str] = None,
        base_url: Optional[str] = None,
        rag_mode: str = "hybrid",
        query_analysis: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """执行混合 RAG 可溯源多轮流式对话"""
        has_api_key = bool(api_key and api_key.strip())
        analysis = query_analysis or {"intent": "rag_query", "original_query": query, "rewritten_query": query, "is_rewritten": False}

        citations = []
        for item in retrieved_slices:
            doc = item["slice"]
            doc_content = doc.get("content", "")
            citations.append({
                "index": item["index"],
                "doc_id": doc.get("id"),
                "type": doc.get("type", "official"),
                "is_official": doc.get("type", "official") == "official",
                "type_label": doc.get("type_label", "权威史料文献"),
                "title": doc.get("title"),
                "source": doc.get("source"),
                "similarity": item.get("similarity"),
                "matched_terms": item.get("matched_terms", []),
                "quote": doc_content[:140] + ("..." if len(doc_content) > 140 else "")
            })

        yield {
            "type": "retrieval_ready",
            "citations": citations,
            "analysis": analysis,
            "rag_mode": rag_mode
        }

        accumulated = ""
        actual_is_mock = True
        stream_error: Optional[str] = None

        if has_api_key:
            sys_prompt = SYSTEM_PROMPT_CHAT_STRICT if rag_mode == "strict" else SYSTEM_PROMPT_CHAT_HYBRID
            user_prompt = build_chat_user_prompt(
                query=query,
                context=context,
                history=history,
                has_citations=len(citations) > 0,
                rag_mode=rag_mode
            )
            try:
                async for token in self.stream_llm_tokens(
                    api_key=api_key,
                    model=model_name,
                    system_prompt=sys_prompt,
                    user_prompt=user_prompt,
                    history=history,
                    provider=provider,
                    base_url=base_url
                ):
                    actual_is_mock = False
                    accumulated += token
                    yield {
                        "type": "content_chunk",
                        "chunk": token,
                        "accumulated": accumulated
                    }
            except Exception as e:
                logger.warning(f"Streaming LLM failed, falling back to extractive QA: {e}")
                stream_error = str(e)

        if not accumulated.strip():
            actual_is_mock = True
            fallback_text = self._build_extractive_answer(query, retrieved_slices, analysis, rag_mode)
            if stream_error:
                fallback_text = f"> 在线大模型调用未成功（{stream_error[:90]}），已自动切换本地混合检索结果：\n\n" + fallback_text
            chunk_size = 24
            for i in range(0, len(fallback_text), chunk_size):
                piece = fallback_text[i:i + chunk_size]
                accumulated += piece
                yield {
                    "type": "content_chunk",
                    "chunk": piece,
                    "accumulated": accumulated
                }
                await asyncio.sleep(0.025)

        yield {
            "type": "chat_finished",
            "full_answer": accumulated,
            "citations": citations,
            "analysis": analysis,
            "is_mock": actual_is_mock
        }

    # =========================================================================
    # 模块二：新媒体全案策划与调研问卷自动生成
    # =========================================================================
    async def generate_campaign_and_survey(
        self,
        topic: str,
        context: str,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        provider: Optional[str] = None,
        base_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """一键生成小红书爆款、抖音分镜表与标准 Markdown 调查问卷"""
        clean_topic = (topic or "").strip() or "让三五九旅第一把坎土曼走进青年"
        has_api_key = bool(api_key and api_key.strip())

        if has_api_key:
            json_prompt = (
                f"{build_campaign_user_prompt(clean_topic, context)}\n\n"
                "请严格只输出一个合法 JSON 对象（不要额外解释），格式如下：\n"
                "{\n"
                '  "xiaohongshu": {"title": "...", "tags": ["#标签1", "#标签2"], "body": "..."},\n'
                '  "douyin_script": {"title": "...", "bpm": "...", "scenes": [{"num": 1, "time": "00:00 - 00:15", "shot": "特写", "visual": "...", "audio": "...", "dialogue": "..."}]},\n'
                '  "survey_markdown": "# 《...》\\n..."\n'
                "}"
            )
            raw_output, _ = await self.call_llm_complete(
                api_key=api_key,
                model=model_name,
                system_prompt=SYSTEM_PROMPT_CAMPAIGN_SURVEY,
                user_prompt=json_prompt,
                provider=provider,
                base_url=base_url
            )
            parsed = self._extract_json_object(raw_output)
            if parsed and isinstance(parsed.get("xiaohongshu"), dict) and parsed.get("survey_markdown"):
                douyin = parsed.get("douyin_script")
                if not isinstance(douyin, dict) or not isinstance(douyin.get("scenes"), list):
                    douyin = copy.deepcopy(MOCK_CAMPAIGN_SURVEY_RESULT["douyin_script"])
                return {
                    "topic": clean_topic,
                    "xiaohongshu": {
                        "title": parsed["xiaohongshu"].get("title") or f"【三五九旅破圈】{clean_topic}",
                        "tags": parsed["xiaohongshu"].get("tags") or ["#三五九旅", "#军垦青年", "#红色文旅"],
                        "body": parsed["xiaohongshu"].get("body") or ""
                    },
                    "douyin_script": douyin,
                    "survey_markdown": parsed["survey_markdown"],
                    "is_mock": False
                }

        res = copy.deepcopy(MOCK_CAMPAIGN_SURVEY_RESULT)
        res["topic"] = clean_topic
        if clean_topic != MOCK_CAMPAIGN_SURVEY_RESULT["topic"]:
            res["xiaohongshu"]["title"] = f"【{clean_topic}】70年前这届三五九旅军垦青年，到底有多硬核？"
            res["xiaohongshu"]["body"] = f"本期专题：{clean_topic}\n\n" + res["xiaohongshu"]["body"]
            res["douyin_script"]["title"] = f"《{clean_topic} · 冻土下的回响》（60秒短视频分镜头脚本）"
            res["survey_markdown"] = res["survey_markdown"].replace(
                "# 《三五九旅红色文化青年群体传播效果与文创接受度调查问卷》",
                f"# 《{clean_topic}——三五九旅红色文化青年传播效果调查问卷》"
            )
        res["is_mock"] = True
        return res

    # =========================================================================
    # 模块三：实用实体文创设计与生图 Prompt
    # =========================================================================
    async def generate_product_design(
        self,
        carrier_id: str,
        custom_topic: str,
        context: str,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        provider: Optional[str] = None,
        base_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """根据选定的文创载体生成工业设计说明与商品级概念图"""
        matched_carrier = next((c for c in PRODUCT_CARRIERS if c["id"] == carrier_id), PRODUCT_CARRIERS[0])
        clean_topic = (custom_topic or "").strip()
        has_api_key = bool(api_key and api_key.strip())

        subtitle = matched_carrier["subtitle"]
        features = matched_carrier["features"]
        color_scheme = matched_carrier["color_scheme"]
        materials = matched_carrier["materials"]
        prompt_en = matched_carrier["prompt_en"]
        prompt_zh = f"三五九旅红色文化实体文创【{matched_carrier['name']}】，工业级商业棚拍，纯白底产品展示，极简工装军旅质感，8K超清。"
        actual_is_mock = True

        if has_api_key and clean_topic:
            user_prompt = (
                f"{build_product_user_prompt(matched_carrier['name'], clean_topic, context)}\n\n"
                "请只输出一个合法 JSON 对象，格式如下：\n"
                '{"subtitle": "...", "features": "...", "color_scheme": "...", "materials": "...", "prompt_zh": "...", "prompt_en": "..."}'
            )
            raw_output, _ = await self.call_llm_complete(
                api_key=api_key,
                model=model_name,
                system_prompt=SYSTEM_PROMPT_PRODUCT_DESIGN,
                user_prompt=user_prompt,
                provider=provider,
                base_url=base_url
            )
            parsed = self._extract_json_object(raw_output)
            if parsed and parsed.get("prompt_en"):
                subtitle = parsed.get("subtitle") or subtitle
                features = parsed.get("features") or features
                color_scheme = parsed.get("color_scheme") or color_scheme
                materials = parsed.get("materials") or materials
                prompt_zh = parsed.get("prompt_zh") or prompt_zh
                prompt_en = parsed.get("prompt_en") or prompt_en
                actual_is_mock = False

        if actual_is_mock and clean_topic:
            subtitle = f"{matched_carrier['subtitle']} · 「{clean_topic[:16]}」定制款"
            features = f"融入「{clean_topic}」精神纹样定制铭牌；{matched_carrier['features']}"
            prompt_zh = f"三五九旅红色文化实体文创【{matched_carrier['name']}】（{clean_topic}主题），工业级商业棚拍，纯白底产品展示，8K超清。"
            prompt_en = f"{prompt_en}, themed around {clean_topic}"

        stable_seed = 3590 + (zlib.crc32(f"{carrier_id}:{clean_topic}".encode("utf-8")) % 1000)
        img_url = self.generate_image_url(prompt_en, seed=stable_seed)

        return {
            "carrier_id": matched_carrier["id"],
            "name": matched_carrier["name"],
            "subtitle": subtitle,
            "features": features,
            "color_scheme": color_scheme,
            "materials": materials,
            "prompts": {
                "zh": prompt_zh,
                "en": prompt_en
            },
            "image_url": img_url,
            "fallback_image_url": matched_carrier["mock_img"],
            "is_mock": actual_is_mock
        }


# 全局单例
global_llm_service = LLMService()
