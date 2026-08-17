# Step 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Step 2: Build backend & Runner
FROM node:22-alpine AS runner
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3008

# Copy backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./

# Copy built frontend assets to backend/public
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 3008
CMD ["node", "server.js"]
