#!/bin/sh
set -e

echo "Generating runtime-config.js..."

cat <<EOF > /app/public/runtime-config.js
window.RUNTIME_CONFIG = {
  API_URL: "${NEXT_PUBLIC_API_URL}"
};
EOF

echo "runtime-config.js generated:"
cat /app/public/runtime-config.js

exec "$@"