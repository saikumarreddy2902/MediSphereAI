"""
MediSphere AI — Base Agent Abstract Class
All 14 AI agents inherit from this class.
"""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional
import asyncio
import uuid


class AgentStatus:
    RUNNING = "running"
    IDLE = "idle"
    ERROR = "error"
    PAUSED = "paused"


class AgentOutput:
    def __init__(
        self,
        agent_name: str,
        recommendations: List[Dict],
        alerts: List[Dict],
        insights: Dict[str, Any],
        metadata: Optional[Dict] = None,
    ):
        self.agent_name = agent_name
        self.recommendations = recommendations
        self.alerts = alerts
        self.insights = insights
        self.metadata = metadata or {}
        self.generated_at = datetime.utcnow().isoformat()
        self.run_id = str(uuid.uuid4())


class BaseAgent(ABC):
    """
    Abstract base class for all MediSphere AI Agents.

    To implement a new agent:
    1. Inherit from BaseAgent
    2. Implement the `analyze()` method
    3. Define `agent_name`, `description`, and `category`
    4. Register in orchestrator.py
    """

    agent_name: str = "Base Agent"
    description: str = "Base agent description"
    category: str = "General"
    run_interval_seconds: int = 30

    def __init__(self):
        self.status: str = AgentStatus.IDLE
        self.last_run: Optional[datetime] = None
        self.last_output: Optional[AgentOutput] = None
        self.run_count: int = 0
        self.error_count: int = 0
        self.total_runtime_ms: int = 0

    @abstractmethod
    async def analyze(self) -> AgentOutput:
        """
        Core analysis logic. Override this in each agent.

        Returns:
            AgentOutput with recommendations, alerts, and insights.

        LLM Integration Point:
            # Uncomment to enable Ollama LLM:
            # from langchain_community.llms import Ollama
            # llm = Ollama(model="qwen3:8b", base_url=settings.OLLAMA_BASE_URL)
            # response = llm.invoke(self.build_prompt(data))
        """
        pass

    async def run(self) -> AgentOutput:
        """Execute the agent analysis cycle with timing and error handling."""
        self.status = AgentStatus.RUNNING
        start_time = datetime.utcnow()

        try:
            output = await self.analyze()
            self.last_output = output
            self.last_run = datetime.utcnow()
            self.run_count += 1
            elapsed = (datetime.utcnow() - start_time).microseconds // 1000
            self.total_runtime_ms += elapsed
            self.status = AgentStatus.IDLE
            return output

        except Exception as e:
            self.status = AgentStatus.ERROR
            self.error_count += 1
            raise e

    def get_status(self) -> Dict[str, Any]:
        """Return current agent health and metrics."""
        avg_runtime = self.total_runtime_ms // max(1, self.run_count)
        return {
            "agent_name": self.agent_name,
            "description": self.description,
            "category": self.category,
            "status": self.status,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "run_count": self.run_count,
            "error_count": self.error_count,
            "avg_runtime_ms": avg_runtime,
            "health_score": max(0, 100 - (self.error_count * 10)),
        }

    def build_prompt(self, data: Dict) -> str:
        """Build a structured prompt for LLM analysis."""
        return f"""
You are the {self.agent_name} for MediSphere AI Hospital Operations Platform.

Your role: {self.description}

Current hospital data:
{data}

Analyze the data and provide:
1. Top 3 operational recommendations (actionable, specific)
2. Any critical alerts that require immediate attention
3. Key insights and trends

Format your response as structured JSON.
"""

    def format_recommendation(
        self,
        title: str,
        description: str,
        priority: str = "medium",
        impact: str = "",
    ) -> Dict:
        return {
            "id": str(uuid.uuid4()),
            "agent": self.agent_name,
            "category": self.category,
            "title": title,
            "description": description,
            "priority": priority,
            "impact": impact,
            "created_at": datetime.utcnow().isoformat(),
        }

    def format_alert(
        self,
        title: str,
        message: str,
        severity: str = "warning",
    ) -> Dict:
        return {
            "id": str(uuid.uuid4()),
            "agent": self.agent_name,
            "title": title,
            "message": message,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def query_llm_rag(self, current_data: Dict) -> AgentOutput:
        """
        Queries Ollama LLM augmented with historical context from Qdrant Vector DB.
        """
        from app.core.config import settings
        from app.core.vector_store import vector_store
        import httpx
        import json

        # 1. Search past insights in Qdrant
        rag_context = ""
        try:
            hits = vector_store.search_documents("medisphere_knowledge", self.agent_name, limit=3)
            if hits:
                rag_context = "\n".join([f"- Past Finding: {hit['payload'].get('text_content', '')}" for hit in hits])
        except Exception as e:
            print(f"RAG search error: {e}")

        # 2. Build prompt
        prompt = self.build_prompt(current_data)
        if rag_context:
            prompt += f"\n\nHistorical Context from Vector Store:\n{rag_context}"

        prompt += "\n\nCRITICAL: Respond ONLY with a valid JSON object. Do not include markdown codeblocks (like ```json), explanations, or trailing text."

        recommendations = []
        alerts = []
        insights = {}

        try:
            # 3. Call Ollama (JSON Mode if supported or standard request)
            # Use short timeout to avoid blocking execution loops
            async with httpx.AsyncClient(timeout=8.0) as httpx_client:
                response = await httpx_client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    response_text = result.get("response", "").strip()
                    
                    # Parse output JSON
                    parsed = json.loads(response_text)
                    recommendations = [self.format_recommendation(
                        r.get("title", ""),
                        r.get("description", ""),
                        r.get("priority", "medium"),
                        r.get("impact", "")
                    ) for r in parsed.get("recommendations", [])]
                    
                    alerts = [self.format_alert(
                        a.get("title", ""),
                        a.get("message", ""),
                        a.get("severity", "warning")
                    ) for a in parsed.get("alerts", [])]
                    
                    insights = parsed.get("insights", {})
                    
                    # 4. Save new insights to Qdrant
                    try:
                        vector_store.upsert_document(
                            "medisphere_knowledge",
                            response_text,
                            {"agent": self.agent_name, "category": self.category}
                        )
                    except Exception as e:
                        print(f"RAG upsert error: {e}")
                else:
                    raise Exception(f"Ollama returned status code {response.status_code}")
                    
        except Exception as e:
            print(f"Ollama execution failed for {self.agent_name}: {e}. Falling back to default heuristics.")
            raise e

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights=insights
        )
