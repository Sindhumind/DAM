# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Required for video metadata extraction and thumbnail generation (must run as root before USER node)
RUN apk add --no-cache ffmpeg

# Copy dependency manifests with node user ownership
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled artifacts with node user ownership
COPY --from=build --chown=node:node /app/dist ./dist

# Ensure application directory is owned by node (and /tmp remains writable for FFmpeg scratch files)
RUN chown -R node:node /app

# Switch from root to the built-in unprivileged node user
USER node

CMD ["node", "dist/worker.js"]
