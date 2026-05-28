# syntax=docker/dockerfile:1.7
# FoundrReach custom Plane AIO build.
# Clones Plane v1.3.1 inline, applies our 3 React patches (hide GitHub-star,
# Community badge, "?" help menu), rebuilds the web bundle, and swaps it into
# the official plane-aio-community image.

ARG PLANE_VERSION=v1.3.1

# *****************************************************************************
# STAGE 1: Clone + patch the Plane source
# *****************************************************************************
FROM alpine/git:latest AS source
WORKDIR /src
ARG PLANE_VERSION
RUN git clone --depth 1 --branch ${PLANE_VERSION} https://github.com/makeplane/plane.git .

# Apply the 3 React patches: each component now returns null instead of rendering.
COPY patches/star-us-link.tsx       "apps/web/app/(all)/[workspaceSlug]/(projects)/star-us-link.tsx"
COPY patches/edition-badge.tsx      "apps/web/ce/components/workspace/edition-badge.tsx"
COPY patches/help-section-root.tsx  "apps/web/core/components/workspace/sidebar/help-section/root.tsx"

# *****************************************************************************
# STAGE 2: Prune the monorepo to the web app only
# *****************************************************************************
FROM node:22-alpine AS frontend-prune
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PNPM_HOME/bin:$PATH"
RUN corepack enable
ARG TURBO_VERSION=2.9.14
RUN pnpm add -g turbo@${TURBO_VERSION}
COPY --from=source /src/ .
RUN turbo prune --scope=web --docker

# *****************************************************************************
# STAGE 3: Install deps + build the patched frontend
# *****************************************************************************
FROM node:22-alpine AS frontend-build
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PNPM_HOME/bin:$PATH"
RUN corepack enable

COPY --from=frontend-prune /app/.gitignore .gitignore
COPY --from=frontend-prune /app/out/json/ .
COPY --from=frontend-prune /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=frontend-prune /app/out/full/ .
COPY --from=frontend-prune /app/turbo.json turbo.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch --store-dir=/pnpm/store
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store CI=true pnpm install --offline --frozen-lockfile --store-dir=/pnpm/store

ENV VITE_API_BASE_URL=""
ENV VITE_ADMIN_BASE_URL=""
ENV VITE_ADMIN_BASE_PATH="/god-mode"
ENV VITE_LIVE_BASE_URL=""
ENV VITE_LIVE_BASE_PATH="/live"
ENV VITE_SPACE_BASE_URL=""
ENV VITE_SPACE_BASE_PATH="/spaces"
ENV VITE_WEB_BASE_URL=""
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

RUN pnpm turbo run build --filter=web

# *****************************************************************************
# STAGE 4: Extend the official AIO image and swap in the patched web bundle
# *****************************************************************************
FROM makeplane/plane-aio-community:${PLANE_VERSION} AS runtime

# /app/web is what the AIO proxy serves at /.
RUN rm -rf /app/web && mkdir -p /app/web
COPY --from=frontend-build /app/apps/web/build/client/ /app/web/
