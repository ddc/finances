# ---------------------------------------------------------------------------
# Build stage: compiles psycopg2 against libpq and resolves the virtualenv
# ---------------------------------------------------------------------------
ARG PYTHON_IMAGE=python:3.14.7-alpine3.24
FROM ${PYTHON_IMAGE} AS python-base

LABEL Description="Finances Backend"

ENV WORKDIR=/app \
    TZ="UTC" \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR ${WORKDIR}

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

RUN apk upgrade --no-cache && apk add --no-cache ca-certificates gcc musl-dev postgresql-dev

COPY pyproject.toml uv.lock ${WORKDIR}/

RUN set -ex && \
    uv sync --frozen --no-dev && \
    uv cache clean

# ---------------------------------------------------------------------------
# Final stage: clean base with only the libpq runtime, no compiler or headers
# ---------------------------------------------------------------------------
FROM ${PYTHON_IMAGE} AS final

LABEL Description="Finances Backend"

ARG LOG_DIRECTORY="/app/logs"

ENV LOG_DIRECTORY="${LOG_DIRECTORY}" \
    WORKDIR=/app \
    TERM=xterm \
    TZ="UTC" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONFAULTHANDLER=1 \
    PYTHONHASHSEED=random \
    UV_SYSTEM_PYTHON=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_CACHE_DIR=/tmp/uv-cache

WORKDIR ${WORKDIR}

RUN apk upgrade --no-cache && apk add --no-cache ca-certificates postgresql-libs

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/
COPY --from=python-base --chown=65534:65534 ${WORKDIR}/.venv ${WORKDIR}/.venv
COPY --chmod=555 manage.py ${WORKDIR}/
COPY --chmod=555 finances ${WORKDIR}/finances
COPY --chmod=555 core ${WORKDIR}/core
COPY --chmod=555 pyproject.toml ${WORKDIR}/
COPY --chmod=555 uv.lock ${WORKDIR}/

RUN set -ex && \
    ${WORKDIR}/.venv/bin/python -c "import django, psycopg2; print('venv OK', django.get_version())" && \
    mkdir -p "${LOG_DIRECTORY}" "${WORKDIR}/staticfiles" && \
    chown -R 65534:65534 "${LOG_DIRECTORY}" "${WORKDIR}/staticfiles"

# 65534:65534 is nobody:nobody in alpine. Numeric so the host can resolve it (DL3066)
USER 65534:65534

EXPOSE 8000

CMD ["uv", "run", "--frozen", "--no-sync", "gunicorn", "finances.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"]
