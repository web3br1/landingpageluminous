# LP Dinâmica por Headers — Guia Rápido

Fluxo: headers → middleware (normalize + sticky A/B) → resolvePageConfig → adapter → compose → PageRenderer.

- Middleware: `x-tenant`, `x-campaign`, `x-ab-variant`, `x-vercel-ip-country`, `accept-language`. Reescreve `/` → `/{tenant}`.
- Resolver: KV opcional + fallback local + overrides (geo/AB). Tipos Zod.
- Adapter: `lib/landing/config-to-composition.ts` → shape de `PageRenderer`.
- Rota: `app/[slug]/page.tsx` + `generateMetadata`.
- Revalidate: `POST /api/revalidate { tag, sig }` (HMAC SHA-256) → `revalidateTag(tag)`.

Tags recomendadas: `tenant:{id}`, `campaign:{id}`.

Checks

- Lint/Type-check/Tests/E2E.
- Lighthouse CI (porta 3002 em dev).
- Depcruise: UI sem fetch; sem ciclos.
