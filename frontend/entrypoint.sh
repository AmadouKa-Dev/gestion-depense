#!/bin/sh
set -e
cat <<EOF > /app/public/runtime-config.js
window.RUNTIME_CONFIG = {
  API_URL: "${NEXT_PUBLIC_API_URL}"
};
EOF
exec "$@"