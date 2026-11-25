"""
屯垦智答 2.0 - 核心后端逻辑自检测试脚本
涵盖：
1. 双轨知识库（权威文献 vs 一手访谈）余弦检索
2. 模块一 Chat RAG 对话流
3. 模块二 全案传播与调研问卷生成
4. 模块三 实用实体文创设计与生图
"""

import asyncio
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.presets import DEFAULT_KNOWLEDGE_SLICES, PRODUCT_CARRIERS
from backend.rag_engine import global_rag_engine
from backend.llm_service import global_llm_service


def test_dual_track_rag():
    print(">>> 正在测试 1：双轨知识库（权威文献与实地访谈）与向量检索...")
    official_count = sum(1 for s in global_rag_engine.slices if s.get("type") == "official")
    custom_count = sum(1 for s in global_rag_engine.slices if s.get("type") == "custom")
    print(f"✓ 当前切片总数: {len(global_rag_engine.slices)} (权威: {official_count}, 调研访谈: {custom_count})")
    assert official_count >= 5, "权威文献切片不足5条"

    # 测试检索
    query = "第一把坎土曼老铁匠打铁与木把血泡"
    results = global_rag_engine.search(query, top_k=3)
    assert len(results) > 0, "检索结果为空"
    print(f"✓ 检索命中 Top 1: {results[0]['slice']['title']} (类型: {results[0]['slice'].get('type_label')})")

    # 测试动态追加一手调研素材
    new_doc = global_rag_engine.add_custom_field_slice(
        title="【测试访谈】老军垦回忆录测试条目",
        content="当年我们在多浪河畔开荒，天寒地冻，全靠一把坎土曼。",
        source="测试来源"
    )
    assert new_doc["type"] == "custom"
    print(f"✓ 成功动态追加一手调研素材，当前知识库总数: {len(global_rag_engine.slices)}")


async def test_chat_stream():
    print("\n>>> 正在测试 2：模块一 智能多轮问答对话流 (Chat RAG Stream)...")
    query = "第一把手工打制的坎土曼有什么历史考据？"
    retrieved = global_rag_engine.search(query, top_k=2)
    context = global_rag_engine.build_rag_context(retrieved)

    events = []
    async for event in global_llm_service.chat_stream(
        query=query,
        history=[],
        retrieved_slices=retrieved,
        context=context,
        api_key="",
        model_name="gemini-3.8-flash"
    ):
        events.append(event)

    types = [e.get("type") for e in events]
    print(f"✓ 对话事件类型: {set(types)}")
    assert "retrieval_ready" in types, "缺少 retrieval_ready 事件"
    assert "content_chunk" in types, "缺少 content_chunk 事件"
    assert "chat_finished" in types, "缺少 chat_finished 事件"

    finish_event = next(e for e in events if e.get("type") == "chat_finished")
    assert len(finish_event["citations"]) > 0, "缺少溯源引用文献"
    print("✓ 考证回答生成成功，带有严格引用证据切片")


async def test_campaign_and_survey():
    print("\n>>> 正在测试 3：模块二 全案传播与调研问卷生成...")
    topic = "让三五九旅第一把坎土曼走进青年"
    retrieved = global_rag_engine.search(topic, top_k=2)
    context = global_rag_engine.build_rag_context(retrieved)

    result = await global_llm_service.generate_campaign_and_survey(topic, context)
    assert "xiaohongshu" in result, "缺少小红书方案"
    assert "douyin_script" in result, "缺少抖音分镜"
    assert "survey_markdown" in result, "缺少调查问卷"
    assert "李克特量表" in result["survey_markdown"] or "认同度评估" in result["survey_markdown"], "问卷缺少李克特量表"
    print("✓ 全案传播策划与标准 Markdown 调查问卷生成成功！")


async def test_product_design():
    print("\n>>> 正在测试 4：模块三 实用实体文创设计与生图...")
    assert len(PRODUCT_CARRIERS) >= 5, "实体文创载体不足5款"
    print(f"✓ 实用载体库数量: {len(PRODUCT_CARRIERS)} 款 ({', '.join([c['name'] for c in PRODUCT_CARRIERS])})")

    carrier_id = "fan"
    design = await global_llm_service.generate_product_design(
        carrier_id=carrier_id,
        custom_topic="第一把坎土曼图腾",
        context="三五九旅开荒"
    )
    assert design["name"] == "便携手持小风扇"
    assert "product studio photography" in design["prompts"]["en"]
    assert design["image_url"].startswith("http")
    print(f"✓ 实体文创【{design['name']}】工业设计说明与商业摄影 Prompt 生成成功！")


if __name__ == "__main__":
    test_dual_track_rag()
    asyncio.run(test_chat_stream())
    asyncio.run(test_campaign_and_survey())
    asyncio.run(test_product_design())
    print("\n===============================")
    print("★ 三大核心重构模块自检全部 100% 成功通过！ ★")
    print("===============================")
