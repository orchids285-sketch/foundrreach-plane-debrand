# foundrreach-plane-debrand

Custom Plane AIO Docker image for FoundrReach. Wraps the official
`makeplane/plane-aio-community:v1.3.1` and rebuilds the frontend with three
React components patched out:

| File (in Plane source) | Change |
|---|---|
| `apps/web/app/(all)/[workspaceSlug]/(projects)/star-us-link.tsx` | "Star us on GitHub" link returns `null` |
| `apps/web/ce/components/workspace/edition-badge.tsx` | "Community" upgrade badge returns `null` |
| `apps/web/core/components/workspace/sidebar/help-section/root.tsx` | Help "?" menu returns `null` |

## How it works

1. `Dockerfile` clones Plane at the pinned `v1.3.1` tag inside the build.
2. The three patched files in `patches/` are dropped over their upstream
   counterparts.
3. The web bundle is rebuilt with `pnpm turbo run build --filter=web`.
4. The output is layered on top of `makeplane/plane-aio-community:v1.3.1`,
   replacing `/app/web`.

GitHub Actions builds this on every push to `main` and publishes the result to
`ghcr.io/<owner>/foundrreach-plane-aio:latest`. The Railway service for Plane
pulls that image.
