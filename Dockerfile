FROM node:22-alpine AS base

FROM base AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM base AS runner
WORKDIR /app

COPY --from=builder /app ./

RUN npm prune --production

CMD ["node", "dist/index.js"]
