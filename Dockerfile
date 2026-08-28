FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED="1"

RUN npm install --global pnpm@10.32.1

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN HUSKY=0 pnpm install --frozen-lockfile

FROM dependencies AS builder

COPY . .
RUN pnpm build

FROM base AS runner

ENV NODE_ENV="production"

COPY --from=builder /app ./

EXPOSE 3000

CMD ["sh", "-c", "pnpm exec tsx lib/db/migrate.ts && pnpm start"]
