.PHONY: help up down restart logs build test lint dev

help:
	@echo "MediSphere AI Management Commands:"
	@echo "  make up       - Start all Docker containers in background"
	@echo "  make down     - Stop all Docker containers"
	@echo "  make restart  - Restart all Docker containers"
	@echo "  make logs     - Follow container logs"
	@echo "  make build    - Rebuild Docker images"
	@echo "  make test     - Run backend test suite"
	@echo "  make lint     - Run linter checks"

up:
	docker compose up -d --build

prod-up:
	docker compose -f docker-compose.prod.yml up -d --build

down:
	docker compose down

prod-down:
	docker compose -f docker-compose.prod.yml down

restart:
	docker compose restart

logs:
	docker compose logs -f

build:
	docker compose build --no-cache

test:
	python -m pytest backend/tests -v

type-check:
	cd frontend && npx tsc --noEmit

lint:
	python -m flake8 backend/app

seed:
	python backend/seed.py

export-openapi:
	python -c "import json; from app.main import app; print(json.dumps(app.openapi(), indent=2))" > docs/openapi.json

