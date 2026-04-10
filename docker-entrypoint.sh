#!/bin/sh
set -e

echo "[entrypoint] running prisma migrate deploy..."
npx prisma migrate deploy

echo "[entrypoint] starting Next.js on 0.0.0.0:${PORT:-3000}..."
exec node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
