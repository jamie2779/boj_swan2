FROM node:22-alpine AS base
ENV COREPACK_DEFAULT_TO_LATEST=0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

FROM base AS builder
WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yml ./
COPY pnpm-workspace.yml ./

RUN corepack enable
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM base AS runner
WORKDIR /app

COPY --from=builder /app ./

CMD ["node", "dist/index.js"]
