"""
“屯垦智答”三五九旅红色文化与文创赋能系统 - 一键启动器
运行命令: python run.py
"""

import os
import sys
import webbrowser
import time
import threading
import uvicorn

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def open_browser(port: int):
    time.sleep(1.5)
    url = f"http://127.0.0.1:{port}"
    print(f"\n[屯垦智答] 正在自动在默认浏览器打开系统页面: {url}")
    webbrowser.open(url)

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)

    PORT = int(os.environ.get("PORT", 8000))
    HOST = os.environ.get("HOST", "0.0.0.0")

    print("=" * 65)
    print("★ 正在启动【屯垦智答】三五九旅红色文化与文创赋能智能工作流系统 ★")
    print(f"★ 访问地址: http://127.0.0.1:{PORT}")
    print("★ 本地内置轻量可溯源 RAG 引擎 + 多智能体流水线 + 3D 文创概念生成")
    print("=" * 65)

    # 启动异步线程打开浏览器
    threading.Thread(target=open_browser, args=(PORT,), daemon=True).start()

    # 启动 Uvicorn 服务
    uvicorn.run(
        "backend.main:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="info"
    )
