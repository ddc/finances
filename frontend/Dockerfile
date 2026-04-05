ARG BUN_IMAGE=oven/bun:1.3.11-alpine
ARG NGINX_IMAGE=nginx:1.29.7-alpine3.23

FROM ${BUN_IMAGE} AS build

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM ${NGINX_IMAGE} AS final
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid && \
    mkdir -p /etc/nginx/certs && chown nginx:nginx /etc/nginx/certs && \
    mkdir -p /app/logs && chown nginx:nginx /app/logs
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
USER nginx
EXPOSE 8443