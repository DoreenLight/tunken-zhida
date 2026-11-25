"""
屯垦智答 2.5 - 端到端 API 与静态资源集成测试
"""

import json
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_e2e():
    print(">>> 正在测试健康检查 GET /api/health ...")
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["official_count"] >= 5
    assert data["rag_engine"] == "hybrid-bm25-semantic"
    print("✓ Health check 正常:", data)

    print("\n>>> 正在测试首页静态页面 GET / ...")
    res = client.get("/")
    assert res.status_code == 200
    assert "屯垦智答 2.0" in res.text
    print("✓ 首页 index.html 正常加载")

    print("\n>>> 正在测试混合 RAG 多轮指代与闲聊过滤 POST /api/chat/stream ...")
    # 1) 闲聊不带引用
    with client.stream("POST", "/api/chat/stream", json={"query": "你好"}) as s_res:
        assert s_res.status_code == 200
        g_events = [json.loads(line[6:]) for line in s_res.iter_lines() if line and line.startswith("data: ")]
    g_ready = next(e for e in g_events if e["type"] == "retrieval_ready")
    assert g_ready["citations"] == []
    print("✓ 闲聊请求返回 0 引用切片")

    # 2) 多轮追问触发指代消解与精准命中
    history = [
        {"role": "user", "content": "93岁老战士张文生口述了什么？"},
        {"role": "assistant", "content": "张文生回忆了1950年打制坎土曼的经历。"}
    ]
    with client.stream("POST", "/api/chat/stream", json={"query": "他说的木柄是什么木头？", "history": history}) as s_res2:
        assert s_res2.status_code == 200
        r_events = [json.loads(line[6:]) for line in s_res2.iter_lines() if line and line.startswith("data: ")]
    r_ready = next(e for e in r_events if e["type"] == "retrieval_ready")
    assert r_ready["analysis"]["is_rewritten"] is True
    assert len(r_ready["citations"]) >= 1
    assert "is_official" in r_ready["citations"][0]
    print("✓ 多轮指代改写 SSE 对话流正常，命中切片数:", len(r_ready["citations"]))

    print("\n>>> 正在测试长文档自动分块追加、单条删除与重置 ...")
    long_doc = "三五九旅官兵在阿克苏垦荒期间，自制木犁与铁耙改良盐碱土壤。" * 18
    add_res = client.post("/api/slices/add", json={
        "title": "阿克苏改良盐碱地长篇调研笔记",
        "content": long_doc,
        "source": "端到端测试档案"
    })
    assert add_res.status_code == 200
    add_data = add_res.json()
    first_custom_id = add_data["doc"]["id"]
    assert add_data["total_count"] >= 8

    del_res = client.delete(f"/api/slices/{first_custom_id}")
    assert del_res.status_code == 200

    # 内置官方切片不允许删除
    protect_res = client.delete("/api/slices/AUTH-359-01")
    assert protect_res.status_code == 404

    reset_res = client.post("/api/slices/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["total_count"] == 6
    print("✓ 长文档自动分块、单条删除、官方文献保护与重置全部正常")

    print("\n>>> 正在测试传播全案与实体文创接口 ...")
    camp_res = client.post("/api/campaign/generate", json={"topic": "红柳地窝子青年精神传承"})
    assert camp_res.status_code == 200
    assert "红柳地窝子" in camp_res.json()["xiaohongshu"]["title"]

    prod_res = client.post("/api/product/generate", json={"carrier_id": "cap", "topic": "军垦拓荒"})
    assert prod_res.status_code == 200
    assert prod_res.json()["name"] == "军垦拓荒刺绣帽子"
    print("✓ 全案传播与文创生成接口正常")

    print("\n===============================")
    print("★ 屯垦智答 2.5 全流程端到端 API 测试 100% 通过！ ★")
    print("===============================")


if __name__ == "__main__":
    test_e2e()
