FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy dependency manifests with node user ownership
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled artifacts and migrations with node user ownership
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/migrations ./migrations

# Ensure temporary upload directory exists and is writable by the non-root user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Switch from root to the built-in unprivileged node user
USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
