# Stage 1: build the UI.
FROM node:22-slim AS ui
WORKDIR /ui
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: the API, which also serves the built UI.
FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev
COPY backend/app ./app
COPY --from=ui /ui/dist /app/frontend/dist

# The image contains the seeded database. A restart gives the same 10,000 employees.
RUN uv run --no-dev python -m app.seed

ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uv run --no-dev uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
