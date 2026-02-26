# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend assets (gulp compiles Pug, SCSS, scripts)
ENV MODE=PROD
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built assets and source from builder
# Build outputs to 'build/' in production mode; app serves from 'public'
COPY --from=builder /app/public ./public
COPY --from=builder /app/build ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/gulp ./gulp
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/vendors.json ./vendors.json

# Create uploads directory
RUN mkdir -p backend/uploads public/uploads && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "backend/server.js"]
