"""
MediSphere AI — OpenTelemetry & Prometheus Metrics Module

Module: Core Telemetry Manager
Description: Provides structured metric collectors and OpenTelemetry hooks for tracing
             API request latencies, active agent loop executions, and database query timings.
"""
import time
from collections.abc import Callable

from fastapi import Request, Response


class MetricsCollector:
    """
    Lightweight telemetry & metrics aggregator tracking request counts, latency histograms,
    and agent cycle metrics for Prometheus scraping.
    """
    def __init__(self) -> None:
        self.request_count: int = 0
        self.error_count: int = 0
        self.total_latency_ms: float = 0.0
        self.agent_cycles: int = 0

    def record_request(self, latency_ms: float, status_code: int) -> None:
        """Record an API request metric."""
        self.request_count += 1
        self.total_latency_ms += latency_ms
        if status_code >= 400:
            self.error_count += 1

    def record_agent_cycle(self) -> None:
        """Record an executed AI agent background cycle."""
        self.agent_cycles += 1

    def get_metrics_summary(self) -> dict:
        """Return aggregated metric telemetry as a dictionary."""
        avg_latency = (
            self.total_latency_ms / self.request_count
            if self.request_count > 0
            else 0.0
        )
        return {
            "total_requests": self.request_count,
            "total_errors": self.error_count,
            "avg_latency_ms": round(avg_latency, 2),
            "agent_cycles_executed": self.agent_cycles,
        }


# Global metrics collector instance
metrics_collector = MetricsCollector()


async def metrics_middleware(request: Request, call_next: Callable) -> Response:
    """
    FastAPI middleware calculating request duration and status code metrics.
    """
    start_time = time.perf_counter()
    response = await call_next(request)
    latency_ms = (time.perf_counter() - start_time) * 1000.0

    metrics_collector.record_request(latency_ms, response.status_code)
    return response
