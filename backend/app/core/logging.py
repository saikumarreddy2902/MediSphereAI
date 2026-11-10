"""
MediSphere AI — Logging Configuration
"""
import sys

from loguru import logger

from app.core.config import settings


def setup_logging():
    """Configure structured JSON logging for production."""
    logger.remove()  # Remove default logger
    
    if settings.ENVIRONMENT == "production":
        # Structured JSON logs for Datadog / Render / Splunk
        logger.add(
            sys.stdout,
            format="{message}",
            serialize=True,
            level="INFO",
            backtrace=True,
            diagnose=False
        )
    else:
        # Pretty logs for local dev
        logger.add(
            sys.stdout,
            colorize=True,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level="DEBUG",
        )
