# Stage 1: Build frontend
FROM node:22-alpine AS client-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build server
FROM node:22-alpine AS server-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci
COPY server/ ./server/
COPY src/types/ ./src/types/
RUN npm run build:server

# Stage 3: Production runtime
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --omit=dev
COPY --from=client-build /app/dist ./dist
COPY --from=server-build /app/server/dist ./server/dist
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "server/dist/index.js"]
