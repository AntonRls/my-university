FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json ./

# pnpm will work without lock file, it will generate one during install if needed
RUN pnpm install --no-strict-peer-dependencies

COPY . .

ARG VITE_TENANT_API_BASE_URL=https://linguabigben.ru
ARG VITE_AUTH_API_BASE_URL=https://linguabigben.ru:5051
ARG VITE_ADMIN_API_BASE_URL=https://linguabigben.ru:5002
ARG VITE_API_BASE_URL=https://linguabigben.ru
ARG VITE_DEFAULT_AUTH_TOKEN

ENV \
  VITE_TENANT_API_BASE_URL=${VITE_TENANT_API_BASE_URL} \
  VITE_AUTH_API_BASE_URL=${VITE_AUTH_API_BASE_URL} \
  VITE_ADMIN_API_BASE_URL=${VITE_ADMIN_API_BASE_URL} \
  VITE_API_BASE_URL=${VITE_API_BASE_URL} \
  VITE_DEFAULT_AUTH_TOKEN=${VITE_DEFAULT_AUTH_TOKEN}

RUN pnpm run build

FROM nginx:1.27-alpine AS runner

RUN apk add --no-cache gettext

COPY --from=builder /app/dist /usr/share/nginx/html

RUN if [ -f /usr/share/nginx/html/runtime-config.js ]; then \
      cp /usr/share/nginx/html/runtime-config.js /usr/share/nginx/html/runtime-config.js.template; \
    fi

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY ./entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]

