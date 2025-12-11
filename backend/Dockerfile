FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Cài đúng phiên bản theo lockfile
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy mã nguồn
COPY . .

EXPOSE 4000
CMD ["node","src/server.js"]
