#!/bin/sh
set -e

# Start the Node.js API server (serves frontend static files too)
cd /app/backend-tsklets/api
exec node dist/index.js
