# Production-ready Dockerfile for admin app

# Admin app build
FROM node:20 AS builder
WORKDIR /app

# Set environment variables for build time
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV NEXT_PUBLIC_BACKEND_URL=https://api.importcsv.com
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
ENV NEXT_PUBLIC_POSTHOG_KEY=phc_LkCjHOTsu2RZoYxnyPWEbycR8nFJlGZgtnl4bDQIws6
ENV NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Copy production package files and install dependencies
COPY admin/package.prod.json ./package.json
RUN npm install --legacy-peer-deps

# Copy admin source files (after handling node_modules)
COPY admin/ ./

# Build the admin app
RUN npm run build

# Stage 4: Production runner
FROM node:20 AS runner
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