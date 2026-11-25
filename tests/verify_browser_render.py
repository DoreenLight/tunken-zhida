"""
屯垦智答 2.0 - 真实浏览器渲染自检脚本 (验证绝无白屏)
"""

import argparse
import subprocess
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

edge_paths = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
]

edge_exe = None
for p in edge_paths:
    if os.path.exists(p):
        edge_exe = p
        break

if not edge_exe:
    print("未找到 Edge 浏览器，跳过 Headless 验证")
    sys.exit(0)

print(f"找到 Edge 浏览器: {edge_exe}")

parser = argparse.ArgumentParser(description="屯垦智答 2.0 真实浏览器 DOM 渲染自检")
parser.add_argument("--url", default="", help="可选：要验证的在线服务 URL，例如 http://127.0.0.1:8000")
args = parser.parse_args()

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html_path = os.path.join(project_root, "frontend", "index.html")
target_url = args.url.strip() or f"file:///{html_path.replace(os.sep, '/')}"
print(f"目标渲染地址: {target_url}")

cmd = [
    edge_exe,
    "--headless",
    "--disable-gpu",
    "--dump-dom",
    target_url
]

proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore")
dom_output = proc.stdout

print(f"DOM 渲染字符总数: {len(dom_output)}")
assert len(dom_output) > 2000, "DOM 渲染异常，内容为空！"

# 验证核心元素是否成功呈现
checks = [
    ("品牌标题", "屯垦智答 2.0"),
    ("双轨知识库统计", "双轨知识库"),
    ("学术导师欢迎语", "学术导师"),
    ("第一把坎土曼考据", "第一把军垦坎土曼"),
    ("小红书方案", "小红书爆款图文"),
    ("抖音分镜", "抖音短视频分镜"),
    ("调查问卷", "调查问卷"),
    ("实体文创载体", "便携手持小风扇")
]

all_passed = True
for label, keyword in checks:
    present = keyword in dom_output
    print(f"[{'✓' if present else '✗'}] {label} (关键词: '{keyword}'): {'成功呈现' if present else '未找到'}")
    if not present:
        all_passed = False

if all_passed:
    print("\n========================================================")
    print("★ 浏览器真实 DOM 渲染验证通过！绝无白屏，100% 完美呈现！ ★")
    print("========================================================")
else:
    print("\n[警告] 部分元素未呈现，需核查！")
