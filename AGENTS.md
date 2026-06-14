## CSS

- **BEM**: `.block`, `.block__element`, `.block--modifier` (z. B. `.button`, `.button__icon`, `.button--primary`)
- **Design Tokens** aus `src/css/token.css` als Basis — Farben, Spacing, Typo nur via `var(--…)`; keine Hardcoded-Werte
- Komponenten-Styles in `css/components/`

## React + TypeScript

- **React 19** mit funktionalen Komponenten und Hooks
- **TypeScript** strict — `npm run check` (`tsc --noEmit`)
- Typen in `src/types/` (`models.ts`, `ui.ts`)
- Entry: `src/main.tsx` mit `QueryClientProvider`

## TanStack Query

- `@tanstack/react-query` — keine eigene Query-Implementierung
- `QueryClientProvider` in `main.tsx`
- Domain-Hooks in `features/*/queries/` und `features/*/mutations/`
- Query Keys in `src/lib/query/queryKeys.ts`

## Architektur (Standard React Query)

```
api/ → getApiClient()
lib/query/ → queryKeys
features/ → useQuery / useMutation / useInfiniteQuery Hooks
components/ → React UI (keine direkten API-Calls)
```

Neue Queries/Mutations immer unter `features/<domain>/queries|mutations/`.

## Daten

- API-Client: `src/api/client.ts`
- Block-Konstanten/Factory: `src/data/blocks.ts`
- Block-Cache-Helper: `src/features/blocks/cache/blockCache.ts`
