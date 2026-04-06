.PHONY: up down migrate seed run test

up:
	docker compose up -d

down:
	docker compose down

migrate:
	alembic upgrade head

seed:
	python -m src.db.seed

run:
	uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000

test:
	python -m pytest tests/ -v
