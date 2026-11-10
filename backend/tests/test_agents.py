"""
MediSphere AI — AI Agent Tests

Tests:
  - Each agent produces a valid AgentOutput with the correct structure
  - Orchestrator initializes all 15 expected agents
  - Critical recommendations are flagged with requires_review=True
  - Agent status returns expected fields
  - Orchestrator.trigger_agent works for named agents
"""

import pytest
from app.agents.base_agent import AgentOutput
from app.agents.bed_intelligence_agent import BedIntelligenceAgent
from app.agents.billing_agent import BillingIntelligenceAgent
from app.agents.emergency_agent import EmergencyResponseAgent
from app.agents.orchestrator import AgentOrchestrator
from app.agents.pharmacy_agent import PharmacyIntelligenceAgent

# ─── Agent Output Structure ────────────────────────────────────────────────

def assert_valid_agent_output(output: AgentOutput, agent_name: str):
    """Assert that an AgentOutput has the required structure."""
    assert isinstance(output, AgentOutput), f"{agent_name} did not return AgentOutput"
    assert isinstance(output.recommendations, list), "recommendations must be a list"
    assert isinstance(output.alerts, list), "alerts must be a list"
    assert isinstance(output.insights, dict), "insights must be a dict"
    assert isinstance(output.generated_at, str), "generated_at must be a string"
    assert output.agent_name, "agent_name must not be empty"

    # Validate recommendation structure
    for rec in output.recommendations:
        assert "title" in rec, "Each recommendation must have a title"
        assert "priority" in rec, "Each recommendation must have a priority"
        assert rec["priority"] in ("critical", "high", "medium", "low"), \
            f"Unknown priority value: {rec['priority']}"

    # Validate alert structure
    for alert in output.alerts:
        assert "title" in alert, "Each alert must have a title"
        assert "severity" in alert, "Each alert must have a severity"


# ─── Individual Agent Tests ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_emergency_agent():
    """EmergencyResponseAgent produces valid output."""
    agent = EmergencyResponseAgent()
    output = await agent.run()
    assert_valid_agent_output(output, "EmergencyResponseAgent")


@pytest.mark.asyncio
async def test_bed_intelligence_agent():
    """BedIntelligenceAgent produces valid output."""
    agent = BedIntelligenceAgent()
    output = await agent.run()
    assert_valid_agent_output(output, "BedIntelligenceAgent")


@pytest.mark.asyncio
async def test_pharmacy_agent():
    """PharmacyIntelligenceAgent produces valid output."""
    agent = PharmacyIntelligenceAgent()
    output = await agent.run()
    assert_valid_agent_output(output, "PharmacyIntelligenceAgent")


@pytest.mark.asyncio
async def test_billing_agent():
    """BillingIntelligenceAgent produces valid output."""
    agent = BillingIntelligenceAgent()
    output = await agent.run()
    assert_valid_agent_output(output, "BillingIntelligenceAgent")


# ─── Orchestrator Tests ────────────────────────────────────────────────────

def test_orchestrator_agent_count():
    """Orchestrator registers all 15 expected agents."""
    orchestrator = AgentOrchestrator()
    expected_agents = {
        "executive", "patient_flow", "appointment", "beds", "emergency",
        "staff", "laboratory", "pharmacy", "equipment", "billing",
        "insurance", "revenue", "predictive", "root_cause", "recommendation",
    }
    assert set(orchestrator.agents.keys()) == expected_agents, \
        f"Missing agents: {expected_agents - set(orchestrator.agents.keys())}"


def test_orchestrator_scheduling_completeness():
    """Every registered agent has a schedule entry."""
    orchestrator = AgentOrchestrator()
    for agent_name in orchestrator.agents:
        assert agent_name in orchestrator._schedules, \
            f"Agent '{agent_name}' has no schedule defined"


@pytest.mark.asyncio
async def test_orchestrator_trigger_agent():
    """trigger_agent('emergency') runs the agent and returns AgentOutput."""
    orchestrator = AgentOrchestrator()
    output = await orchestrator.trigger_agent("emergency")
    assert output is not None
    assert_valid_agent_output(output, "emergency (triggered)")


def test_critical_recommendation_flagged():
    """Critical recommendations are marked requires_review=True by _apply_output."""
    orchestrator = AgentOrchestrator()
    mock_output = AgentOutput(
        agent_name="TestAgent",
        recommendations=[{"title": "Urgent", "priority": "critical"}],
        alerts=[],
        insights={},
    )
    orchestrator._apply_output(mock_output)
    rec = orchestrator.all_outputs[-1].recommendations[0]
    assert rec.get("requires_review") is True
    assert rec.get("reviewed") is False


def test_agent_status_structure():
    """get_status() returns all expected fields for each agent."""
    orchestrator = AgentOrchestrator()
    for status in orchestrator.get_all_status():
        for field in ("agent_name", "status", "run_count", "error_count", "health_score"):
            assert field in status, f"Missing field '{field}' in agent status"
