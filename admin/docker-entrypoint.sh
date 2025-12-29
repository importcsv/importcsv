#!/bin/sh
set -e

# Function to copy frontend build to node_modules
copy_frontend() {
  if [ -d "/frontend/build/react" ]; then
    rm -rf ./node_modules/@importcsv/react
    mkdir -p ./node_modules/@importcsv/react/build
    cp -r /frontend/build/react ./node_modules/@importcsv/react/build/react
    cp /frontend/package.json ./node_modules/@importcsv/react/package.json
  fi
}

# Build frontend from mounted source (ensures latest code)
if [ -d "/frontend/src" ]; then
  echo "Building @importcsv/react from source..."
  cd /frontend && npm run build:react 2>&1 | tail -3
  cd /app
fi

# Copy the fresh build to node_modules
echo "Copying to node_modules..."
copy_frontend

# Start watch process in background (rebuilds + copies on source changes)
if [ "$FRONTEND_WATCH" = "true" ]; then
  echo "Starting frontend watch (rebuilds on changes)..."
  (
    cd /frontend
    # Store initial checksum of source files
    LAST_CHECKSUM=$(find src -type f -name "*.ts" -o -name "*.tsx" -o -name "*.css" 2>/dev/null | xargs cat 2>/dev/null | md5sum | cut -d' ' -f1)

    while true; do
      sleep 3
      # Calculate current checksum
      CURRENT_CHECKSUM=$(find src -type f -name "*.ts" -o -name "*.tsx" -o -name "*.css" 2>/dev/null | xargs cat 2>/dev/null | md5sum | cut -d' ' -f1)

      # Only rebuild if files actually changed
      if [ "$CURRENT_CHECKSUM" != "$LAST_CHECKSUM" ]; then
        echo "[watch] Source changed, rebuilding frontend..."
        npm run build:react 2>&1 | tail -1
        cd /app && copy_frontend
        # Touch a file to trigger Next.js hot reload
        touch /app/next.config.ts 2>/dev/null || touch /app/next.config.js 2>/dev/null || true
        echo "[watch] Updated @importcsv/react - Next.js will reload"
        cd /frontend
        LAST_CHECKSUM=$CURRENT_CHECKSUM
      fi
    done
  ) &
fi

exec "$@"
