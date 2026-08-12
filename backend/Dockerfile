ARG PYTHON_IMAGE=python:3.14.7-alpine3.24
FROM ${PYTHON_IMAGE} AS python-base

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
    PATH="/home/appuser/.local/bin:$PATH"

WORKDIR ${WORKDIR}

RUN set -ex && \
    apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache ca-certificates curl postgresql-libs && \
    curl --proto '=https' --tlsv1.3 -LsSf https://astral.sh/uv/install.sh | sh && \
    addgroup -g 1000 appuser && \
    adduser -u 1000 -G appuser -h /home/appuser -D appuser && \
    mv /root/.local /home/appuser/.local && \
    chown -R appuser:appuser /home/appuser/.local

FROM python-base AS final

RUN apk update && apk upgrade --no-cache

COPY --chmod=555 manage.py ${WORKDIR}/
COPY --chmod=555 finances ${WORKDIR}/finances
COPY --chmod=555 core ${WORKDIR}/core
COPY --chmod=555 pyproject.toml ${WORKDIR}/
COPY --chmod=555 uv.lock ${WORKDIR}/

RUN set -ex && \
    mkdir -p "${LOG_DIRECTORY}" && \
    apk add --no-cache --virtual .build-deps gcc musl-dev postgresql-dev && \
    uv sync --frozen --no-dev && \
    apk del .build-deps && \
    uv cache clean && \
    mkdir -p "${WORKDIR}/staticfiles" && \
    chown -R appuser:appuser "${WORKDIR}" "${LOG_DIRECTORY}"

# appuser user id
USER 1000:1000

EXPOSE 8000

CMD ["uv", "run", "--frozen", "--no-sync", "gunicorn", "finances.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"]
