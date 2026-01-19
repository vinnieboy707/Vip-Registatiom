FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend ./backend
COPY shared ./shared

# Build backend
RUN npm run build

# Frontend builder
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend ./

# Build frontend
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built backend
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/backend/src ./backend/src

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy config files
COPY .env.example ./.env

# Create necessary directories
RUN mkdir -p backend/database backend/logs

# Expose ports
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/backend/src/server.js"]
