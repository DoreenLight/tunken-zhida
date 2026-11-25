"""
混合可溯源 RAG 检索引擎 2.5 (Hybrid Traceable RAG Engine)
集成：
1. 停用词过滤 + 领域实体词典分词 + 概念同义词语义扩展
2. 查询意图识别（闲聊/元问题零误报）与多轮对话指代消解改写
3. 长文档自动语义分块 (Sliding-Window Paragraph/Sentence Chunking)
4. Okapi BM25 稀疏检索 + 语义余弦向量稠密特征融合 + 严格相关性阈值过滤
"""

import math
import re
from typing import List, Dict, Any, Optional, Set
from backend.presets import DEFAULT_KNOWLEDGE_SLICES


STOPWORDS: Set[str] = {
    "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一", "一个", "上", "也", "很",
    "到", "说", "要", "去", "你", "您", "会", "着", "没有", "看", "好", "自己", "这", "那", "这个",
    "那个", "什么", "怎么", "怎样", "如何", "为什么", "请问", "能否", "可以", "帮我", "告诉", "介绍",
    "一下", "关于", "哪些", "多少", "吗", "呢", "吧", "啊", "呀", "哦", "嗯", "哈", "嘛", "么",
    "今天", "明天", "昨天", "现在", "时候", "事情", "问题", "内容", "方面", "情况", "知道", "觉得",
    "写一段", "写一个", "代码", "天气", "吃饭"
}

CHITCHAT_PATTERNS = [
    r"^(你好|您好|嗨|哈喽|早上好|中午好|下午好|晚上好|hey|hi|hello)[\s!！。，,？?]*$",
    r"^(在吗|在不在|有人吗|忙吗)[\s!！。，,？?]*$",
    r"^(你是谁|您是谁|你叫什么|介绍一下你自己|你能做什么|你会干什么|有什么功能|怎么用)[\s!！。，,？?]*$",
    r"^(谢谢|多谢|感谢|辛苦了|太棒了|好的|明白了|知道了|再见|拜拜|ok|thanks)[\s!！。，,？?]*$",
]

COREFERENCE_MARKERS = (
    "他", "她", "它", "他们", "她们", "它们", "这把", "那把", "这条", "那条", "这种", "那种",
    "这件", "那件", "当时", "后来", "那里", "这儿", "那儿", "这位", "那位", "老人", "上面", "刚才"
)

DOMAIN_ENTITIES = [
    "三五九旅", "359旅", "七一九团", "坎土曼", "胜利渠", "地窝子", "阿克苏", "阿拉尔",
    "塔里木", "王震", "多浪河", "老纺车", "纺车", "南泥湾", "兵团精神", "由战转耕",
    "红柳", "沙枣木", "废炮弹壳", "炮弹壳", "土高炉", "石榴籽", "民族团结", "民族共建",
    "维吾尔族", "金珠玛米", "李文海", "李铁匠", "张文生", "血泡", "胡杨木", "夜校"
]

# 概念与同义词双向语义扩展表：解决用户用口语提问（不含档案原词）时的召回问题
SYNONYM_GROUPS = [
    ["坎土曼", "农具", "铁镐", "锄头", "铁锹", "铁锨", "工具", "打铁", "锻造", "淬火", "炮弹壳", "李文海"],
    ["张文生", "老战士", "老军垦", "老兵", "口述", "访谈", "采访", "血泡", "木柄", "胡杨", "手心"],
    ["老纺车", "纺车", "纺纱", "织布", "御寒", "军服", "军装", "衣服", "棉衣", "粗呢", "羊毛", "南泥湾", "丰衣足食", "自力更生"],
    ["胜利渠", "多浪河", "修渠", "挖渠", "水渠", "水利", "灌溉", "引水", "修坝", "筑坝", "冰水", "打桩", "雪水", "王震"],
    ["地窝子", "住房", "住处", "住所", "房子", "宿舍", "地下", "土坑", "窑洞", "红柳", "芦苇", "风沙", "夜校", "生活"],
    ["民族共建", "民族团结", "石榴籽", "维吾尔族", "少数民族", "老乡", "村民", "农牧民", "金珠玛米", "义诊", "烤馕", "兵地"],
    ["三五九旅", "359旅", "屯垦", "戍边", "开荒", "垦荒", "大生产", "新疆", "阿克苏", "阿拉尔", "塔里木", "戈壁"]
]


class RAGEngine:
    def __init__(self, slices: Optional[List[Dict[str, Any]]] = None):
        self.slices: List[Dict[str, Any]] = []
        self.doc_tokens: List[List[str]] = []
        self.doc_semantic_tokens: List[List[str]] = []
        self.doc_lengths: List[int] = []
        self.avg_doc_len: float = 1.0
        self.bm25_idf: Dict[str, float] = {}
        self.semantic_idf: Dict[str, float] = {}
        self.doc_tf: List[Dict[str, int]] = []
        self.doc_vectors: List[Dict[str, float]] = []
        self._custom_counter: int = 1

        initial_data = slices if slices is not None else DEFAULT_KNOWLEDGE_SLICES
        self.load_documents(initial_data)

    def _expand_synonyms(self, tokens: List[str], raw_text: str) -> List[str]:
        expanded = list(tokens)
        lower_raw = raw_text.lower()
        for group in SYNONYM_GROUPS:
            if any(term in lower_raw or term in tokens for term in group):
                for syn in group[:5]:
                    expanded.append(syn)
        return expanded

    def _tokenize(self, text: str, include_unigrams: bool = False) -> List[str]:
        """领域词典增强 + 停用词过滤 + 中文 2/3-Gram 特征提取"""
        text = (text or "").lower().strip()
        if not text:
            return []

        tokens: List[str] = []
        # 1. 优先提取领域专有名词
        for ent in DOMAIN_ENTITIES:
            ent_low = ent.lower()
            count = text.count(ent_low)
            if count > 0:
                tokens.extend([ent_low] * (count * 2))

        # 2. 切分连续中英文片段
        clean_text = re.sub(r"[^\w\u4e00-\u9fa5]+", " ", text)
        for seg in clean_text.split():
            if seg in STOPWORDS:
                continue
            # 英文或数字词元
            ascii_parts = re.findall(r"[a-z0-9]{2,}", seg)
            for ap in ascii_parts:
                if ap not in STOPWORDS:
                    tokens.append(ap)

            # 中文字符序列提取 2-gram 与 3-gram（大幅降低单字噪声）
            c_seq = "".join(ch for ch in seg if "\u4e00" <= ch <= "\u9fa5")
            if not c_seq:
                continue
            if len(c_seq) <= 4 and c_seq not in STOPWORDS:
                tokens.append(c_seq)
            for i in range(len(c_seq) - 1):
                bg = c_seq[i:i + 2]
                if bg not in STOPWORDS:
                    tokens.append(bg)
            for i in range(len(c_seq) - 2):
                tg = c_seq[i:i + 3]
                if tg not in STOPWORDS:
                    tokens.append(tg)
            if include_unigrams:
                for ch in c_seq:
                    if ch not in STOPWORDS:
                        tokens.append(ch)

        return tokens

    def load_documents(self, slices: List[Dict[str, Any]]):
        """载入切片并构建 BM25 索引 + 语义扩展余弦向量索引"""
        self.slices = [dict(s) for s in slices]
        self.doc_tokens = []
        self.doc_semantic_tokens = []
        self.doc_tf = []
        self.doc_lengths = []

        for doc in self.slices:
            title = doc.get("title", "")
            tags_str = " ".join(doc.get("tags", []))
            source = doc.get("source", "")
            content = doc.get("content", "")
            # 标题与标签赋予更高词频权重
            weighted_text = f"{title} {title} {tags_str} {tags_str} {source} {content}"
            base_tokens = self._tokenize(weighted_text, include_unigrams=False)
            sem_tokens = self._expand_synonyms(base_tokens, weighted_text)

            self.doc_tokens.append(base_tokens)
            self.doc_semantic_tokens.append(sem_tokens)
            self.doc_lengths.append(max(1, len(base_tokens)))

            tf_map: Dict[str, int] = {}
            for t in base_tokens:
                tf_map[t] = tf_map.get(t, 0) + 1
            self.doc_tf.append(tf_map)

        n_docs = len(self.slices)
        self.avg_doc_len = (sum(self.doc_lengths) / n_docs) if n_docs > 0 else 1.0

        # 构建 Okapi BM25 IDF
        df_bm25: Dict[str, int] = {}
        for tf_map in self.doc_tf:
            for term in tf_map.keys():
                df_bm25[term] = df_bm25.get(term, 0) + 1

        self.bm25_idf = {}
        for term, df in df_bm25.items():
            self.bm25_idf[term] = math.log(1.0 + (n_docs - df + 0.5) / (df + 0.5))

        # 构建语义向量 TF-IDF
        df_sem: Dict[str, int] = {}
        for sem_tokens in self.doc_semantic_tokens:
            for term in set(sem_tokens):
                df_sem[term] = df_sem.get(term, 0) + 1

        self.semantic_idf = {
            term: math.log((n_docs + 1.0) / (df + 1.0)) + 1.0
            for term, df in df_sem.items()
        }

        self.doc_vectors = []
        for sem_tokens in self.doc_semantic_tokens:
            tf: Dict[str, int] = {}
            for t in sem_tokens:
                tf[t] = tf.get(t, 0) + 1
            length = max(1, len(sem_tokens))
            vec: Dict[str, float] = {}
            norm_sq = 0.0
            for t, cnt in tf.items():
                val = (1.0 + math.log(cnt)) / length * self.semantic_idf.get(t, 1.0)
                vec[t] = val
                norm_sq += val * val
            norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
            for t in vec:
                vec[t] /= norm
            self.doc_vectors.append(vec)

    def chunk_text(self, text: str, chunk_size: int = 340, overlap: int = 60) -> List[str]:
        """按段落与句子边界对长文档做滑动窗口分块"""
        cleaned = re.sub(r"\n{3,}", "\n\n", (text or "").strip())
        if len(cleaned) <= chunk_size + 60:
            return [cleaned] if cleaned else []

        sentences = [s.strip() for s in re.split(r"(?<=[。！？!?；;\n])", cleaned) if s.strip()]
        chunks: List[str] = []
        current = ""
        for sent in sentences:
            if len(current) + len(sent) <= chunk_size:
                current += sent
            else:
                if current:
                    chunks.append(current.strip())
                    tail = current[-overlap:] if overlap > 0 and len(current) > overlap else ""
                    current = tail + sent
                else:
                    for i in range(0, len(sent), chunk_size - overlap):
                        chunks.append(sent[i:i + chunk_size].strip())
                    current = ""
        if current.strip():
            chunks.append(current.strip())
        return chunks

    def add_custom_field_slice(
        self,
        title: str,
        content: str,
        source: str = "老军垦实地调研访谈整理",
        author: str = "调研团队",
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """动态追加用户实地调研素材（长文档自动语义切片）"""
        chunks = self.chunk_text(content)
        added_docs: List[Dict[str, Any]] = []
        total_chunks = len(chunks)

        for idx, chunk in enumerate(chunks):
            while any(s.get("id") == f"FIELD-USR-{self._custom_counter:02d}" for s in self.slices):
                self._custom_counter += 1
            new_id = f"FIELD-USR-{self._custom_counter:02d}"
            self._custom_counter += 1
            chunk_title = f"{title}（片段 {idx + 1}/{total_chunks}）" if total_chunks > 1 else title
            new_doc = {
                "id": new_id,
                "type": "custom",
                "type_label": "实地调研访谈",
                "title": chunk_title,
                "source": source,
                "author": author,
                "content": chunk,
                "tags": tags or ["口述史", "调研实录", "一手材料"]
            }
            self.slices.append(new_doc)
            added_docs.append(new_doc)

        self.load_documents(self.slices)
        return added_docs[0] if len(added_docs) == 1 else {
            **added_docs[0],
            "chunks_added": len(added_docs),
            "all_docs": added_docs
        }

    def delete_slice(self, slice_id: str) -> bool:
        """删除单条自定义切片（保护内置权威切片）"""
        before = len(self.slices)
        self.slices = [
            s for s in self.slices
            if not (s.get("id") == slice_id and str(slice_id).startswith("FIELD-USR-"))
        ]
        if len(self.slices) < before:
            self.load_documents(self.slices)
            return True
        return False

    def analyze_query(self, query: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """识别闲聊意图并对多轮上下文指代进行消解与检索词改写"""
        q = (query or "").strip()
        if not q:
            return {"intent": "chitchat", "original_query": q, "rewritten_query": q, "is_rewritten": False}

        for pat in CHITCHAT_PATTERNS:
            if re.match(pat, q, flags=re.IGNORECASE):
                return {"intent": "chitchat", "original_query": q, "rewritten_query": q, "is_rewritten": False}

        # 检测是否需要结合历史对话做指代消解
        has_pronoun = any(m in q for m in COREFERENCE_MARKERS)
        has_explicit_entity = any(ent.lower() in q.lower() for ent in DOMAIN_ENTITIES)
        for doc in self.slices:
            if str(doc.get("id", "")).startswith("FIELD-USR-"):
                clean_t = re.sub(r"[【】（）()\s0-9片段/]+", "", doc.get("title", ""))
                if len(clean_t) >= 2 and clean_t[:4] in q:
                    has_explicit_entity = True

        needs_context = bool(history) and (has_pronoun or (len(q) <= 12 and not has_explicit_entity))
        if needs_context and history:
            recent_text = " ".join(
                turn.get("content", "")[:220]
                for turn in history[-4:]
                if isinstance(turn, dict) and turn.get("content")
            )
            carry_terms: List[str] = []
            for ent in DOMAIN_ENTITIES:
                if ent in recent_text and ent not in q and ent not in carry_terms:
                    carry_terms.append(ent)
            # 同时检查自定义切片标题中的专有词
            for doc in self.slices:
                if str(doc.get("id", "")).startswith("FIELD-USR-"):
                    t_tokens = [t for t in self._tokenize(doc.get("title", "")) if len(t) >= 2]
                    for tt in t_tokens[:2]:
                        if tt in recent_text.lower() and tt not in q.lower() and tt not in carry_terms:
                            carry_terms.append(tt)

            if carry_terms:
                rewritten = f"{' '.join(carry_terms[:3])} {q}"
                return {
                    "intent": "rag_query",
                    "original_query": q,
                    "rewritten_query": rewritten,
                    "expanded_entities": carry_terms[:3],
                    "is_rewritten": True
                }

        return {"intent": "rag_query", "original_query": q, "rewritten_query": q, "is_rewritten": False}

    def search(
        self,
        query: str,
        top_k: int = 4,
        history: Optional[List[Dict[str, str]]] = None,
        min_score: float = 0.20
    ) -> List[Dict[str, Any]]:
        """执行 BM25 + 语义扩展向量混合检索，过滤低于相关性阈值的噪声切片"""
        if not self.slices:
            return []

        analysis = self.analyze_query(query, history)
        if analysis["intent"] == "chitchat":
            return []

        effective_query = analysis["rewritten_query"]
        q_base_tokens = self._tokenize(effective_query, include_unigrams=False)
        if not q_base_tokens:
            return []

        q_sem_tokens = self._expand_synonyms(q_base_tokens, effective_query)

        # 构建查询语义向量
        q_tf: Dict[str, int] = {}
        for t in q_sem_tokens:
            q_tf[t] = q_tf.get(t, 0) + 1
        q_len = max(1, len(q_sem_tokens))
        q_vec: Dict[str, float] = {}
        q_norm_sq = 0.0
        for t, cnt in q_tf.items():
            # 未在语料库出现过的陌生词给予低权重，防止稀释已知概念词
            idf_w = self.semantic_idf.get(t, 0.25)
            val = ((1.0 + math.log(cnt)) / q_len) * idf_w
            q_vec[t] = val
            q_norm_sq += val * val
        q_norm = math.sqrt(q_norm_sq) if q_norm_sq > 0 else 1.0
        for t in q_vec:
            q_vec[t] /= q_norm

        k1 = 1.5
        b = 0.75
        unique_q_base = list(dict.fromkeys(q_base_tokens))

        bm25_raw_list: List[float] = []
        sem_cos_list: List[float] = []
        matched_terms_list: List[List[str]] = []
        exact_boost_list: List[float] = []

        for idx, doc in enumerate(self.slices):
            tf_map = self.doc_tf[idx]
            dl = self.doc_lengths[idx]
            matched: List[str] = []

            # 1. Okapi BM25 得分
            bm25_score = 0.0
            for qt in unique_q_base:
                f = tf_map.get(qt, 0)
                if f > 0:
                    idf = self.bm25_idf.get(qt, 0.0)
                    denom = f + k1 * (1.0 - b + b * (dl / self.avg_doc_len))
                    bm25_score += idf * ((f * (k1 + 1.0)) / denom)
                    if len(qt) >= 2 and qt not in matched:
                        matched.append(qt)

            # 2. 语义扩展向量余弦相似度
            doc_vec = self.doc_vectors[idx]
            cos_sim = 0.0
            for t, q_val in q_vec.items():
                if t in doc_vec:
                    cos_sim += q_val * doc_vec[t]
                    if len(t) >= 2 and t not in matched:
                        matched.append(t)

            # 3. 标题 / 标签短语精确命中加权
            title_low = str(doc.get("title", "")).lower()
            tags_low = " ".join(doc.get("tags", [])).lower()
            boost = 0.0
            for qt in unique_q_base:
                if len(qt) >= 2 and (qt in title_low or qt in tags_low):
                    boost += 0.12

            bm25_raw_list.append(bm25_score)
            sem_cos_list.append(cos_sim)
            matched_terms_list.append(matched[:6])
            exact_boost_list.append(min(0.30, boost))

        max_bm25 = max(bm25_raw_list) if bm25_raw_list else 0.0
        scored_items = []
        for idx in range(len(self.slices)):
            bm25_norm = (bm25_raw_list[idx] / (max_bm25 + 1.2)) if max_bm25 > 0 else 0.0
            sem_score = sem_cos_list[idx]
            # 没有任何实际词元或概念交集时直接判 0
            if bm25_raw_list[idx] <= 0.0 and sem_score < 0.12:
                continue

            hybrid_score = 0.52 * bm25_norm + 0.48 * sem_score + exact_boost_list[idx]
            if hybrid_score >= min_score:
                scored_items.append((idx, hybrid_score, matched_terms_list[idx]))

        scored_items.sort(key=lambda x: x[1], reverse=True)

        results = []
        for rank, (idx, raw_hybrid, matched) in enumerate(scored_items[:top_k]):
            display_sim = round(min(0.985, 0.56 + raw_hybrid * 0.46), 3)
            results.append({
                "index": rank + 1,
                "slice": self.slices[idx],
                "similarity": display_sim,
                "raw_score": round(raw_hybrid, 4),
                "matched_terms": matched
            })
        return results

    def extract_relevant_sentences(
        self,
        query: str,
        search_results: List[Dict[str, Any]],
        max_per_slice: int = 2
    ) -> List[Dict[str, Any]]:
        """句子级相关性抽取（用于无外部大模型 API 时的精准摘录式问答）"""
        q_tokens = set(self._expand_synonyms(self._tokenize(query), query))
        extracted = []
        for item in search_results:
            doc = item["slice"]
            content = doc.get("content", "")
            sents = [s.strip() for s in re.split(r"(?<=[。！？!?])", content) if len(s.strip()) > 6]
            if not sents:
                continue
            scored_sents = []
            for pos, s in enumerate(sents):
                s_low = s.lower()
                hit = sum(2.0 if len(t) >= 3 else 1.0 for t in q_tokens if len(t) >= 2 and t in s_low)
                # 兼顾首句背景信息
                score = hit + (0.25 if pos == 0 else 0.0)
                scored_sents.append((score, pos, s))
            scored_sents.sort(key=lambda x: x[0], reverse=True)
            chosen = sorted(scored_sents[:max_per_slice], key=lambda x: x[1])
            extracted.append({
                "index": item["index"],
                "doc": doc,
                "similarity": item["similarity"],
                "sentences": [c[2] for c in chosen]
            })
        return extracted

    def build_rag_context(self, search_results: List[Dict[str, Any]]) -> str:
        """构建注入给大模型的双轨知识库考证上下文"""
        if not search_results:
            return "【当前检索结果：双轨知识库中未检索到与该问题直接相关的史料切片】"

        lines = ["【以下为混合检索引擎命中的三五九旅双轨知识库资料（权威文献 + 一手调研访谈）】：\n"]
        for item in search_results:
            idx = item["index"]
            doc = item["slice"]
            track_label = "权威文献" if doc.get("type") == "official" else "一手调研访谈"
            lines.append(f"--- 证据切片 [{idx}] 【{track_label} | 相关性 {round(item['similarity'] * 100, 1)}%】---")
            lines.append(f"切片编号: {doc.get('id', 'N/A')}")
            lines.append(f"切片标题: {doc.get('title', '未知')}")
            lines.append(f"文献出处: {doc.get('source', '调研档案')}")
            lines.append(f"核心内容: {doc.get('content', '')}")
            lines.append("")
        return "\n".join(lines)


# 全局单例
global_rag_engine = RAGEngine()
