"""
大模型与智能体综合服务 (LLM & Agent Service)
支持三五九旅多轮可溯源问答、全案传播与问卷自动生成、实体文创概念设计与生图。
具备高可用 Google Gemini / DeepSeek 兼容以及专家级离线 Mock Fallback。
"""

import asyncio
import copy
import json
import logging
import re
import urllib.parse
import zlib
from typing import Dict, Any, AsyncGenerator, List, Optional
import httpx

from backend.presets import (
    DEFAULT_KNOWLEDGE_SLICES,
    PRODUCT_CARRIERS,
    MOCK_CAMPAIGN_SURVEY_RESULT,
)
from backend.prompts import (
    SYSTEM_PROMPT_CHAT_RAG,
    SYSTEM_PROMPT_CAMPAIGN_SURVEY,
    SYSTEM_PROMPT_PRODUCT_DESIGN,
    build_chat_user_prompt,
    build_campaign_user_prompt,
    build_product_user_prompt,
)

logger = logging.getLogger("llm_service")
logging.basicConfig(level=logging.INFO)


class LLMService:
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=45.0)

    async def close(self):
        """优雅关闭 HTTP 客户端连接池"""
        await self.http_client.aclose()

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

    async def call_gemini(self, api_key: str, model: str, system_prompt: str, user_prompt: str) -> Optional[str]:
        """调用 Google Gemini API"""
        if not api_key:
            return None

        actual_model = model or "gemini-3.8-flash"
        if "deepseek" in actual_model.lower():
            return await self.call_openai_compatible(
                api_key=api_key,
                base_url="https://api.deepseek.com/v1",
                model=actual_model,
                system_prompt=system_prompt,
                user_prompt=user_prompt
            )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{actual_model}:generateContent?key={api_key}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "systemInstruction": {"role": "user", "parts": [{"text": system_prompt}]},
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 3500}
        }

        try:
            resp = await self.http_client.post(url, json=payload, headers={"Content-Type": "application/json"})
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}")

        return None

    async def call_openai_compatible(
        self, api_key: str, model: str, system_prompt: str, user_prompt: str, base_url: str = "https://api.deepseek.com/v1"
    ) -> Optional[str]:
        """调用 OpenAI / DeepSeek 兼容接口"""
        if not api_key:
            return None

        url = f"{base_url.rstrip('/')}/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": model or "deepseek-chat",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.35,
            "max_tokens": 3500
        }

        try:
            resp = await self.http_client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
        except Exception as e:
            logger.warning(f"OpenAI compatible call error: {e}")

        return None

    def generate_image_url(self, prompt: str, seed: int = 359) -> str:
        """调用 Pollinations.ai 极速生成高精产品摄影展示图"""
        encoded_prompt = urllib.parse.quote(prompt.strip())
        return f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=800&nologo=true&seed={seed}&model=flux"

    def _build_mock_chat_answer(self, query: str, retrieved_slices: List[Dict[str, Any]]) -> str:
        """基于检索切片与历史关键词生成高保真考据回答，并确保引用角标不越界"""
        max_idx = max(1, len(retrieved_slices))
        c_idx = lambda n: min(n, max_idx)

        top_item = retrieved_slices[0] if retrieved_slices else None
        top_doc = top_item["slice"] if top_item else None
        if top_doc and str(top_doc.get("id", "")).startswith("FIELD-USR-") and top_item.get("similarity", 0) >= 0.52:
            lines = [
                f"根据双轨知识库最新录入的一手实地调研素材（《{top_doc.get('title', '实地访谈')}》，来源：{top_doc.get('source', '调研实录')}）考据[1]：",
                "",
                f"{top_doc.get('content', '').strip()}[1]"
            ]
            if len(retrieved_slices) > 1:
                second_doc = retrieved_slices[1]["slice"]
                lines.extend([
                    "",
                    f"结合馆藏档案《{second_doc.get('title', '')}》互证：{second_doc.get('content', '')[:120].strip()}……[{c_idx(2)}]"
                ])
            return "\n".join(lines)

        if any(k in query for k in ("坎土曼", "铁", "农具", "血泡", "张文生", "打铁")):
            return (
                "关于三五九旅开荒初期的‘第一把坎土曼’，历史档案与老军垦实地访谈有着极为清晰的考据链条：\n\n"
                f"1949年冬三五九旅挺进阿克苏与塔里木盆地北缘时，面对盐碱白滩，全军无铁制农具可用，且市面上根本采买不到[{c_idx(1)}]。"
                "1950年2月，指战员们在阿克苏市郊的大生产营地架起土高炉，搜集战场遗存的迫击炮弹壳与废旧铁轨，经过千百次烈火淬火锻打，"
                f"由老铁匠李文海带领战士们成功打造出第一把宽刃、重约4斤半的军垦坎土曼[{c_idx(1)}]。\n\n"
                "正如2024年高校大学生赴阿拉尔市对93岁老战士张文生的实地访谈录音中所证实：‘当时野胡杨手柄粗粝，战士们连打带握，"
                f"手心全被磨出血泡，血水渗进木柄甚至发红发暗，但这把从炮火中锻出的工具就是军垦人的命根子’[{c_idx(2)}]。\n\n"
                f"在随后的百里‘胜利渠’筑坝攻坚中，战士们正是握着自力更生打制的坎土曼，在零下二十度的刺骨冰水中砸冰开渠[{c_idx(3)}]。"
                "更令人动容的是，三五九旅官兵还将打制的第一批优质坎土曼无偿赠予当地维吾尔族贫苦农牧民，手把手传授深耕技术，"
                f"使这柄凝聚着军人血汗的开荒农具，从诞生起便成为了兵地各族群众像石榴籽一样紧紧抱在一起共同开拓绿洲的深情信物[{c_idx(4)}]。"
            )
        if any(k in query for k in ("胜利渠", "冰水", "多浪河", "水渠", "王震")):
            return (
                "关于三五九旅修建百里‘胜利渠’的史实，有如下权威水利档案与兵地共建史料可考：\n\n"
                f"1950年春，为解决阿克苏至阿拉尔戈壁荒地的灌溉难题，三五九旅官兵在多浪河上打响了修建百里胜利渠的攻坚战[{c_idx(1)}]。"
                f"早春时节河水冰冷刺骨，战士们脱下棉衣跳进零下20度的刺骨冰水中排险打桩，用血肉之躯在激流中筑起拦水大坝[{c_idx(1)}]。\n\n"
                f"王震将军与战士们同吃窝窝头、同抡坎土曼挖土方；全渠没有一台大型挖掘机，全凭十万双长满老茧的手与扁担箩筐，在百天之内凿通百余里干渠[{c_idx(1)}]。"
                f"与此同时，官兵还协助各族群众修筑灌渠、赠送自制坎土曼并免费巡回义诊，让天山雪水化作滋养戈壁江南与民族团结的清泉[{c_idx(2)}]。"
            )
        if any(k in query for k in ("地窝子", "生活", "红柳", "夜校")):
            return (
                "三五九旅战士初入塔里木戈壁荒原时，寸草不生、飞沙蔽日，没有砖石瓦房可以遮风避雨：\n\n"
                f"指战员因地制宜，在地下挖掘深约1.8至2米的坑穴，以戈壁红柳枝、沙枣木作梁，搭上野生芦苇草并涂抹厚厚的黄泥，修建出抵御狂暴黑风暴与冬夏严寒的‘地窝子’[{c_idx(1)}]。\n\n"
                f"据老战士口述档案记载，荒漠中晨起被褥常落半指厚黄沙，轻轻一抖便扛起坎土曼上工[{c_idx(1)}]；"
                "但在昏暗的墨水瓶柴油灯下，战士们读夜校、编快板、教文化，写下了‘生在井冈山，长在南泥湾，转战数万里，屯垦在天山’的革命浪漫主义诗篇。"
                f"这种自力更生的拓荒精神，也体现在进疆初期架起塞外老纺车自制粗呢军服的壮举之中[{c_idx(2)}]。"
            )
        if any(k in query for k in ("纺车", "南泥湾", "军服", "自力更生", "羊毛")):
            return (
                "从陕北南泥湾到新疆塔里木，三五九旅始终秉持‘自己动手、丰衣足食’的优良传统：\n\n"
                f"进疆初期，后方运输线绵延数千里，入冬时官兵面临‘衣破无布补、天寒无棉御’的绝境[{c_idx(1)}]。"
                f"旅党委决定将南泥湾老纺车经验移植至塔河之畔，战士们拆解废弃车轱辘与戈壁胡杨木自制木纺车，剪集散落粗羊毛清洗搓捻，开展‘班班赛纺纱、人人争能手’竞赛[{c_idx(1)}]。\n\n"
                f"自制粗呢军服不仅解决了御寒难题，更将南泥湾精神升华为‘热爱祖国、无私奉献、艰苦创业、开拓进取’的兵团精神[{c_idx(1)}]，"
                f"与废炮弹壳铸坎土曼、红柳地窝子夜校共同构成了三五九旅屯垦戍边的精神底座[{c_idx(2)}]。"
            )
        if any(k in query for k in ("民族", "石榴籽", "维吾尔", "金珠玛米", "兵地")):
            return (
                "三五九旅在阿克苏与阿拉尔屯垦期间，留下了兵地携手、民族团结的动人史诗：\n\n"
                f"官兵严守三大纪律八项注意，宁宿旷野古庙也不占民房一间；针对当地缺少铁质农具与水利技术的情况，将自制新坎土曼无偿赠予维吾尔族贫苦农民，并派医疗卫生员免费走村串户义诊、协助修渠[{c_idx(1)}]。\n\n"
                f"维吾尔族乡亲们自发赶着毛驴车送来滚烫的烤馕和甜瓜，亲切称呼官兵为‘亲人金珠玛米’，形成了各民族‘像石榴籽一样紧紧抱在一起’共同开拓绿洲的深情局面[{c_idx(1)}]。"
            )

        if retrieved_slices:
            first = retrieved_slices[0]["slice"]
            second_part = ""
            if len(retrieved_slices) > 1:
                second = retrieved_slices[1]["slice"]
                second_part = f"\n\n此外，结合《{second.get('title', '')}》（{second.get('source', '')}）记载：{second.get('content', '')[:110]}……[{c_idx(2)}]"
            return (
                f"依据三五九旅双轨知识库检索匹配度最高的史料《{first.get('title', '')}》（{first.get('source', '')}）考据[1]：\n\n"
                f"{first.get('content', '')}[1]"
                f"{second_part}"
            )

        return "当前知识库暂未检索到与该提问直接匹配的档案切片，您可以点击右上角【+ 录入调研素材】补充相关一手史料后再试。"

    # =========================================================================
    # 模块一：双轨可溯源对话聊天流 (SSE Stream)
    # =========================================================================
    async def chat_stream(
        self,
        query: str,
        history: List[Dict[str, str]],
        retrieved_slices: List[Dict[str, Any]],
        context: str,
        api_key: Optional[str] = None,
        model_name: Optional[str] = "gemini-3.8-flash"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """执行可溯源多轮对话，支持流式 SSE"""
        has_api_key = bool(api_key and api_key.strip())

        # 整理引用溯源卡片清单
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
                "quote": doc_content[:130] + ("..." if len(doc_content) > 130 else "")
            })

        # 推送检索完成与引用信息
        yield {
            "type": "retrieval_ready",
            "citations": citations
        }
        await asyncio.sleep(0.12)

        answer_text = None
        if has_api_key:
            user_prompt = build_chat_user_prompt(query, context, history)
            answer_text = await self.call_gemini(api_key, model_name, SYSTEM_PROMPT_CHAT_RAG, user_prompt)

        actual_is_mock = not bool(answer_text)
        if not answer_text:
            answer_text = self._build_mock_chat_answer(query, retrieved_slices)

        chunk_size = 25 if actual_is_mock else 30
        delay = 0.035 if actual_is_mock else 0.02
        accumulated = ""
        for i in range(0, len(answer_text), chunk_size):
            chunk = answer_text[i:i + chunk_size]
            accumulated += chunk
            yield {
                "type": "content_chunk",
                "chunk": chunk,
                "accumulated": accumulated
            }
            await asyncio.sleep(delay)

        yield {
            "type": "chat_finished",
            "full_answer": answer_text,
            "citations": citations,
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
        model_name: Optional[str] = "gemini-3.8-flash"
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
            raw_output = await self.call_gemini(api_key, model_name, SYSTEM_PROMPT_CAMPAIGN_SURVEY, json_prompt)
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

            if raw_output and "问卷" in raw_output:
                fallback = copy.deepcopy(MOCK_CAMPAIGN_SURVEY_RESULT)
                survey_start = raw_output.find("#")
                return {
                    "topic": clean_topic,
                    "xiaohongshu": {
                        "title": f"【三五九旅破圈】{clean_topic[:24]}：70年前这届军垦青年有多硬核！",
                        "tags": ["#三五九旅", "#军垦青年", "#红色文旅", "#开荒精神", "#大学生特种兵"],
                        "body": raw_output[:survey_start].strip() if survey_start > 50 else raw_output[:700]
                    },
                    "douyin_script": fallback["douyin_script"],
                    "survey_markdown": raw_output[survey_start:] if survey_start != -1 else fallback["survey_markdown"],
                    "is_mock": False
                }

        res = copy.deepcopy(MOCK_CAMPAIGN_SURVEY_RESULT)
        res["topic"] = clean_topic
        if clean_topic != MOCK_CAMPAIGN_SURVEY_RESULT["topic"]:
            res["xiaohongshu"]["title"] = f"【{clean_topic}】70年前这届三五九旅军垦青年，到底有多硬核？🔥"
            res["xiaohongshu"]["body"] = (
                f"🎯 本期专题：{clean_topic}\n\n"
                + res["xiaohongshu"]["body"]
            )
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
        model_name: Optional[str] = "gemini-3.8-flash"
    ) -> Dict[str, Any]:
        """根据选定的文创载体（小风扇/帽子/保温杯等）生成工业设计说明与商品级概念图"""
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
            raw_output = await self.call_gemini(api_key, model_name, SYSTEM_PROMPT_PRODUCT_DESIGN, user_prompt)
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
