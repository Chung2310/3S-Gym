# Step 1: Build frontend
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run build:backend

FROM node:24-alpine AS runner
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3008

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 3008
CMD ["npm", "run", "start:production"]
