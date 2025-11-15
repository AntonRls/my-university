#!/bin/sh
set -eu

TEMPLATE_PATH="/usr/share/nginx/html/runtime-config.js.template"
TARGET_PATH="/usr/share/nginx/html/runtime-config.js"

if [ -f "$TEMPLATE_PATH" ]; then
  envsubst '${TENANT_API_BASE_URL} ${AUTH_API_BASE_URL} ${ADMIN_API_BASE_URL}' \
    < "$TEMPLATE_PATH" > "${TARGET_PATH}.tmp"
  mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
fi

exec nginx -g "daemon off;"

