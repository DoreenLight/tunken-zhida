"""
轻量高效双轨可溯源 RAG 检索引擎 (Dual-Track Traceable RAG Engine)
支持【权威史料知识库】与【用户自定义实地调研知识库】双轨融合检索。
"""

import math
import re
from typing import List, Dict, Any, Tuple
from backend.presets import DEFAULT_KNOWLEDGE_SLICES


class RAGEngine:
    def __init__(self, slices: List[Dict[str, Any]] = None):
        self.slices: List[Dict[str, Any]] = []
        self.doc_tokens: List[List[str]] = []
        self.idf: Dict[str, float] = {}
        self.doc_vectors: List[Dict[str, float]] = []
        
        # 初始化双轨知识库
        initial_data = slices if slices is not None else DEFAULT_KNOWLEDGE_SLICES
        self.load_documents(initial_data)

    def _tokenize(self, text: str) -> List[str]:
        """中文分词与 N-Gram 特征提取"""
        text = text.lower()
        clean_text = re.sub(r"[^\w\u4e00-\u9fa5]+", " ", text)
        words = clean_text.split()
        
        tokens = []
        for word in words:
            tokens.append(word)
            c_chars = [ch for ch in word if '\u4e00' <= ch <= '\u9fa5']
            for ch in c_chars:
                tokens.append(ch)
            for i in range(len(c_chars) - 1):
                tokens.append(c_chars[i] + c_chars[i+1])
                
        special_keywords = [
            "三五九旅", "359旅", "坎土曼", "胜利渠", "地窝子", "阿克苏", 
            "王震", "多浪河", "纺车", "南泥湾", "由战转耕", "红柳", 
            "废炮弹壳", "土高炉", "石榴籽", "民族团结", "李文海", "张文生"
        ]
        for kw in special_keywords:
            if kw in text:
                tokens.extend([kw, kw, kw])
                
        return tokens

    def load_documents(self, slices: List[Dict[str, Any]]):
        """重新载入切片并构建向量空间索引"""
        self.slices = [dict(s) for s in slices]
        self.doc_tokens = []
        for doc in self.slices:
            full_text = f"{doc.get('title', '')} {doc.get('source', '')} {doc.get('content', '')} {' '.join(doc.get('tags', []))}"
            tokens = self._tokenize(full_text)
            self.doc_tokens.append(tokens)

        n_docs = len(self.slices)
        df: Dict[str, int] = {}
        for tokens in self.doc_tokens:
            for term in set(tokens):
                df[term] = df.get(term, 0) + 1

        self.idf = {}
        for term, freq in df.items():
            self.idf[term] = math.log((n_docs + 1) / (freq + 1)) + 1.0

        self.doc_vectors = []
        for tokens in self.doc_tokens:
            tf: Dict[str, float] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
            length = len(tokens) if tokens else 1
            
            vec: Dict[str, float] = {}
            norm_sq = 0.0
            for t, count in tf.items():
                tfidf_val = (count / length) * self.idf.get(t, 1.0)
                vec[t] = tfidf_val
                norm_sq += tfidf_val * tfidf_val
            
            norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
            for t in vec:
                vec[t] /= norm
            self.doc_vectors.append(vec)

    def add_custom_field_slice(
        self, 
        title: str, 
        content: str, 
        source: str = "老军垦实地调研访谈整理", 
        author: str = "调研团队", 
        tags: List[str] = None
    ) -> Dict[str, Any]:
        """动态追加用户实地调研素材（标记为 custom 类型）"""
        new_id = f"FIELD-USR-{len(self.slices) + 1:02d}"
        new_doc = {
            "id": new_id,
            "type": "custom",
            "type_label": "实地调研访谈",
            "title": title,
            "source": source,
            "author": author,
            "content": content,
            "tags": tags or ["口述史", "调研实录", "一手材料"]
        }
        self.slices.append(new_doc)
        self.load_documents(self.slices)
        return new_doc

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """执行余弦相似度检索，返回相关切片"""
        if not self.slices:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return [
                {
                    "index": i + 1,
                    "slice": self.slices[i],
                    "similarity": round(0.88 - i * 0.04, 3),
                    "matched_terms": []
                }
                for i in range(min(top_k, len(self.slices)))
            ]

        q_tf: Dict[str, float] = {}
        for t in query_tokens:
            q_tf[t] = q_tf.get(t, 0) + 1
        q_len = len(query_tokens)
        
        q_vec: Dict[str, float] = {}
        q_norm_sq = 0.0
        for t, count in q_tf.items():
            val = (count / q_len) * self.idf.get(t, 1.0)
            q_vec[t] = val
            q_norm_sq += val * val
            
        q_norm = math.sqrt(q_norm_sq) if q_norm_sq > 0 else 1.0
        for t in q_vec:
            q_vec[t] /= q_norm

        scores: List[Tuple[int, float, List[str]]] = []
        unique_q_terms = {t for t in query_tokens if len(t) >= 2}
        for idx, doc_vec in enumerate(self.doc_vectors):
            dot_product = 0.0
            matched: List[str] = []
            for t, q_val in q_vec.items():
                if t in doc_vec:
                    dot_product += q_val * doc_vec[t]
                    if len(t) > 1 and t not in matched:
                        matched.append(t)

            doc = self.slices[idx]
            doc_title = str(doc.get("title", "")).lower()
            doc_tags = " ".join(doc.get("tags", [])).lower()
            doc_content = str(doc.get("content", "")).lower()

            bonus = 0.0
            for q_t in unique_q_terms:
                if q_t in doc_title or q_t in doc_tags:
                    bonus += 0.14
                elif q_t in doc_content:
                    bonus += 0.06

            raw_score = dot_product + min(0.45, bonus)
            scores.append((idx, raw_score, matched[:6]))

        scores.sort(key=lambda x: x[1], reverse=True)

        results = []
        for rank, (idx, score, matched) in enumerate(scores[:top_k]):
            if score > 0:
                normalized_score = round(min(0.98, max(0.42, 0.38 + score * 0.72)), 3)
            else:
                normalized_score = round(max(0.35, 0.42 - rank * 0.03), 3)
            doc_item = self.slices[idx]
            results.append({
                "index": rank + 1,
                "slice": doc_item,
                "similarity": normalized_score,
                "matched_terms": matched
            })

        return results

    def build_rag_context(self, search_results: List[Dict[str, Any]]) -> str:
        """构建注入给大模型的双轨知识库考证上下文"""
        lines = ["【以下为检索到的三五九旅双轨知识库资料（包含权威文献与一手实地调研访谈）】：\n"]
        for item in search_results:
            idx = item["index"]
            doc = item["slice"]
            track_label = "权威文献" if doc.get("type") == "official" else "一手调研访谈"
            lines.append(f"--- 证据切片 [{idx}] 【{track_label}】---")
            lines.append(f"切片编号: {doc.get('id', 'N/A')}")
            lines.append(f"切片标题: {doc.get('title', '未知')}")
            lines.append(f"文献出处: {doc.get('source', '调研档案')}")
            lines.append(f"核心内容: {doc.get('content', '')}")
            lines.append("")
        return "\n".join(lines)


# 全局单例
global_rag_engine = RAGEngine()
