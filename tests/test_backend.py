"""
屯垦智答 2.5 - 混合检索引擎与流式 AI 助手核心逻辑测试
涵盖：
1. BM25 + 语义同义词扩展混合检索（含零原词口语检索）
2. 闲聊与领域外无关问题的相关性阈值拦截（零虚假引用）
3. 多轮对话代词指代消解与检索词改写
4. 长文档自动语义分块与单条删除
5. Chat RAG 流式对话、全案问卷生成、实体文创生成
"""

import asyncio
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.presets import DEFAULT_KNOWLEDGE_SLICES, PRODUCT_CARRIERS
from backend.rag_engine import global_rag_engine
from backend.llm_service import global_llm_service


def test_hybrid_rag_engine():
    print(">>> 正在测试 1：BM25 + 语义同义词混合检索与阈值过滤...")
    global_rag_engine.load_documents(DEFAULT_KNOWLEDGE_SLICES)

    # 1.1 精确检索
    results = global_rag_engine.search("第一把坎土曼老铁匠打铁与木把血泡", top_k=3)
    assert len(results) >= 2, "精确检索结果不足"
    print(f"✓ 精确检索 Top 1: {results[0]['slice']['title']} (相关性: {results[0]['similarity']})")

    # 1.2 零原词同义概念语义检索（不出现“纺车”，测试御寒/棉衣/做衣服召回）
    sem_hits = global_rag_engine.search("进疆冬天没有棉衣怎么御寒做衣服？", top_k=3)
    assert len(sem_hits) >= 1 and sem_hits[0]["slice"]["id"] == "AUTH-359-02", (
        f"语义扩展未命中老纺车切片，实际: {[h['slice']['id'] for h in sem_hits]}"
    )
    print(f"✓ 零原词同义语义检索成功命中: {sem_hits[0]['slice']['title']}")

    # 1.3 闲聊与无关技术问题零误报拦截
    greet_hits = global_rag_engine.search("你好", top_k=3)
    irrelevant_hits = global_rag_engine.search("帮我用Python写一个快速排序算法", top_k=3)
    assert greet_hits == [], f"问候语不应触发引用: {greet_hits}"
    assert irrelevant_hits == [], f"无关编程问题不应触发虚假引用: {irrelevant_hits}"
    print("✓ 闲聊问候与领域外问题均返回 0 引用（彻底消除乱标引用）")

    # 1.4 多轮指代消解改写
    history = [
        {"role": "user", "content": "93岁老战士张文生讲了什么？"},
        {"role": "assistant", "content": "原七一九团老战士张文生回忆了1950年春锻打坎土曼的往事。"}
    ]
    analysis = global_rag_engine.analyze_query("他当时握的木柄是什么材料？", history=history)
    assert analysis["is_rewritten"] is True and "张文生" in analysis["rewritten_query"], f"指代改写失败: {analysis}"
    follow_hits = global_rag_engine.search("他当时握的木柄是什么材料？", top_k=2, history=history)
    assert any(h["slice"]["id"] == "FIELD-359-01" for h in follow_hits), "多轮指代检索未命中张文生访谈"
    print(f"✓ 多轮指代消解成功: '{analysis['original_query']}' -> '{analysis['rewritten_query']}'")

    # 1.5 长文档自动语义分块与删除
    long_text = (
        "1951年秋，三五九旅七一八团在塔里木河沿岸开辟第二片棉区。战士们白天顶着烈日清理红柳包，晚上在地窝子里总结育种经验。" * 8
        + "老班长王德山用桦木削制了简易播种耧，使每天播种效率提升了三倍，当年秋收皮棉亩产创下垦区新高。" * 6
    )
    added = global_rag_engine.add_custom_field_slice(
        title="【长篇档案】塔里木河棉区开辟与播种耧改良纪事",
        content=long_text,
        source="垦区农业技术史料汇编"
    )
    assert added.get("chunks_added", 1) >= 2, "长文档未触发自动分块"
    print(f"✓ 长文档自动语义切片成功，生成片段数: {added['chunks_added']}")

    custom_hits = global_rag_engine.search("王德山改良播种耧提升效率", top_k=2)
    assert len(custom_hits) >= 1 and "播种耧" in custom_hits[0]["slice"]["content"]
    print("✓ 分块后细粒度段落检索命中成功")

    # 清理恢复默认知识库
    global_rag_engine.load_documents(DEFAULT_KNOWLEDGE_SLICES)


async def test_chat_stream():
    print("\n>>> 正在测试 2：模块一 混合 RAG 对话流与闲聊分流...")
    # 领域考据提问
    query = "第一把手工打制的坎土曼有多重？是谁带头打造的？"
    analysis = global_rag_engine.analyze_query(query)
    retrieved = global_rag_engine.search(query, top_k=3)
    context = global_rag_engine.build_rag_context(retrieved)

    events = []
    async for event in global_llm_service.chat_stream(
        query=query,
        history=[],
        retrieved_slices=retrieved,
        context=context,
        api_key="",
        query_analysis=analysis
    ):
        events.append(event)

    finish_evt = next(e for e in events if e.get("type") == "chat_finished")
    assert len(finish_evt["citations"]) > 0, "考据提问应返回引用切片"
    assert "4斤半" in finish_evt["full_answer"] or "李文海" in finish_evt["full_answer"], "句子抽取未命中核心事实"
    print("✓ 句子级精准考据回答生成成功，包含具体史实与引用角标")

    # 闲聊提问
    greet_analysis = global_rag_engine.analyze_query("你好")
    greet_events = []
    async for event in global_llm_service.chat_stream(
        query="你好",
        history=[],
        retrieved_slices=[],
        context="",
        api_key="",
        query_analysis=greet_analysis
    ):
        greet_events.append(event)
    greet_done = next(e for e in greet_events if e.get("type") == "chat_finished")
    assert greet_done["citations"] == [], "闲聊回答不应附带引用切片"
    print("✓ 闲聊问候自然响应且无冗余引用")


async def test_campaign_and_product():
    print("\n>>> 正在测试 3 & 4：全案传播问卷生成 + 实用实体文创设计...")
    topic = "让三五九旅第一把坎土曼走进青年"
    retrieved = global_rag_engine.search(topic, top_k=2)
    context = global_rag_engine.build_rag_context(retrieved)

    result = await global_llm_service.generate_campaign_and_survey(topic, context)
    assert "xiaohongshu" in result and "douyin_script" in result and "survey_markdown" in result
    assert len(PRODUCT_CARRIERS) >= 5

    design = await global_llm_service.generate_product_design(
        carrier_id="fan",
        custom_topic="第一把坎土曼图腾",
        context=context
    )
    assert design["name"] == "便携手持小风扇"
    assert design["image_url"].startswith("http")
    print("✓ 全案问卷与实体文创模块全部正常！")


if __name__ == "__main__":
    test_hybrid_rag_engine()
    asyncio.run(test_chat_stream())
    asyncio.run(test_campaign_and_product())
    print("\n===============================")
    print("★ 屯垦智答 2.5 混合 RAG 与流式助手自检 100% 通过！ ★")
    print("===============================")
