FROM node:22-alpine AS base
ENV COREPACK_DEFAULT_TO_LATEST=0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Builder 단계: 설치 및 빌드 진행
FROM base AS builder
WORKDIR /app

# 필요한 파일만 복사 (패키지 관리 파일 등)
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

RUN corepack enable
# 캐시를 사용하여 pnpm 설치 속도 향상
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --frozen-lockfile

# 소스 코드 복사 후 빌드 수행
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# 프로덕션에 필요한 의존성만 남김
RUN pnpm prune --prod

# Runner 단계: 최종 실행 환경 구성
FROM base AS runner
WORKDIR /app

# 필요한 파일만 복사 (빌드 산출물, 프로덕션 의존성, 실행에 필요한 파일 등)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

CMD ["npm", "run", "start:prod"]
