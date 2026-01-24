# Multi-stage Dockerfile for admin app with local frontend build

# Stage 1: Build the frontend package
FROM node:22 AS frontend-builder
WORKDIR /frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy frontend source and build
COPY frontend/ ./
RUN NODE_ENV=production npm run build:react

# Stage 2: Build the admin app
FROM node:22 AS builder
WORKDIR /app

# Set environment variables for build time
# Client-side URL must be accessible from browser
ENV NEXT_PUBLIC_BACKEND_URL=https://api.importcsv.com
# HelpScout support widget (cloud only)
ENV NEXT_PUBLIC_CRISP_WEBSITE_ID=414e970e-7407-43c4-ba2a-2f178843a8eb
ENV NEXT_PUBLIC_POSTHOG_KEY=phc_LkCjHOTsu2RZoYxnyPWEbycR8nFJlGZgtnl4bDQIws6
ENV NEXT_PUBLIC_IMPORTCSV_CLOUD=true
# Copy package files
COPY admin/package.json admin/package-lock.json ./

# Install dependencies (using lockfile for reproducible builds)
RUN npm ci --legacy-peer-deps

# Now replace the npm version with our locally built version
# We need to preserve the build/react structure that package.json expects
RUN rm -rf ./node_modules/@importcsv/react
RUN mkdir -p ./node_modules/@importcsv/react/build
COPY --from=frontend-builder /frontend/build/react ./node_modules/@importcsv/react/build/react
COPY --from=frontend-builder /frontend/package.json ./node_modules/@importcsv/react/package.json

# Copy admin source files
COPY admin/ ./

# Build the admin app
RUN npm run build

# Production runner
FROM node:22 AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV production

# Copy built files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./

# Copy all node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Create a non-root user and set permissions
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app/.next
USER nextjs

# Expose port
EXPOSE 3000

# Start the production server
CMD ["npm", "start"]