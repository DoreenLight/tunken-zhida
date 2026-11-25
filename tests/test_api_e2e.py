"""
屯垦智答 2.0 - 端到端 API 与静态资源集成测试
"""

import json
import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_e2e():
    print(">>> 正在测试健康检查与双轨知识库统计 GET /api/health ...")
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["official_count"] >= 5
    print("✓ Health check 数据正常:", data)

    print("\n>>> 正在测试知识库切片接口 GET /api/presets/slices ...")
    res = client.get("/api/presets/slices")
    assert res.status_code == 200
    slices_data = res.json()
    print(f"✓ 当前切片总数: {slices_data['total_count']}")

    print("\n>>> 正在测试首页静态页面 GET / ...")
    res = client.get("/")
    assert res.status_code == 200
    assert "屯垦智答 2.0" in res.text
    print("✓ 首页 index.html 正常加载并包含 2.0 新版标识")

    print("\n>>> 正在测试传播全案与问卷接口 POST /api/campaign/generate ...")
    res = client.post("/api/campaign/generate", json={"topic": "红柳地窝子青年精神传承"})
    assert res.status_code == 200
    camp_data = res.json()
    assert "xiaohongshu" in camp_data
    assert "survey_markdown" in camp_data
    assert "红柳地窝子" in camp_data["xiaohongshu"]["title"]
    assert isinstance(camp_data.get("douyin_script", {}).get("scenes"), list)
    assert len(camp_data["douyin_script"]["scenes"]) >= 4
    print("✓ 成功生成自定义主题小红书文案、抖音分镜与调查问卷，问卷字数:", len(camp_data["survey_markdown"]))

    print("\n>>> 正在测试可溯源 SSE 对话流 POST /api/chat/stream ...")
    with client.stream("POST", "/api/chat/stream", json={"query": "第一把坎土曼有什么考据？"}) as stream_res:
        assert stream_res.status_code == 200
        events = []
        for line in stream_res.iter_lines():
            if line and line.startswith("data: "):
                events.append(json.loads(line[6:]))
    event_types = {e.get("type") for e in events}
    assert {"retrieval_ready", "content_chunk", "chat_finished"}.issubset(event_types)
    ready_evt = next(e for e in events if e.get("type") == "retrieval_ready")
    assert len(ready_evt["citations"]) >= 1
    assert "is_official" in ready_evt["citations"][0]
    print("✓ SSE 对话流事件完整，citations 包含 is_official 溯源标识")

    print("\n>>> 正在测试双轨知识库动态追加与重置 POST /api/slices/add & /reset ...")
    add_res = client.post("/api/slices/add", json={
        "title": "【端到端测试访谈】塔里木河畔老兵口述",
        "content": "当年大家一起挥舞坎土曼在戈壁滩开垦万亩良田。",
        "source": "端到端测试档案"
    })
    assert add_res.status_code == 200
    assert add_res.json()["total_count"] >= 7
    reset_res = client.post("/api/slices/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["total_count"] == 6
    print("✓ 双轨知识库动态追加与重置接口正常")

    print("\n>>> 正在测试实体文创载体列表 GET /api/product/carriers ...")
    res = client.get("/api/product/carriers")
    assert res.status_code == 200
    car_data = res.json()
    assert car_data["count"] >= 5
    print("✓ 获取文创载体列表成功，数量:", car_data["count"])

    print("\n>>> 正在测试实体文创设计方案与生图 POST /api/product/generate ...")
    res = client.post("/api/product/generate", json={"carrier_id": "cap", "topic": "军垦拓荒"})
    assert res.status_code == 200
    prod_data = res.json()
    assert prod_data["name"] == "军垦拓荒刺绣帽子"
    assert "军垦拓荒" in prod_data["features"]
    print(f"✓ 成功生成【{prod_data['name']}】设计方案与生图 URL")

    print("\n===============================")
    print("★ 屯垦智答 2.0 全流程 API 测试全部 100% 成功通过！ ★")
    print("===============================")

if __name__ == "__main__":
    test_e2e()
