# Build stage
# ----------------------
FROM node:22.21.1-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# 1) nhận biến từ docker-compose build args (quan trọng cho NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
# nếu bạn còn NEXT_PUBLIC_API_BASE hay biến public khác thì thêm ở đây
ARG NEXT_PUBLIC_API_BASE

# 2) đưa ARG thành ENV để Next nhúng vào client bundle khi build
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ----------------------
# Runtime stage
# ----------------------
FROM node:22.21.1-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next 15 standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]




