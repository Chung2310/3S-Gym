# Step 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Step 2: Build backend & Runner
FROM node:22-alpine AS runner
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3008

# Copy dependencies and source
COPY package*.json ./
RUN npm ci
COPY backend/ ./backend/

# Copy built frontend assets (dist) to backend/public
COPY --from=frontend-builder /app/dist ./backend/public

EXPOSE 3008
CMD ["npm", "start"]
