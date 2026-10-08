# Stack guide

This template is a static single page app for GitHub Pages: Vite 8, React 19, TypeScript 7 (strict),
Tailwind v4, shadcn/ui style components, TanStack Router / Query / Table v9 / Form, tRPC v11 running
in the browser, Zod v4, Effect v4, gdp-ts proofs, Vitest 5, Playwright, Biome.

Everything below is copied from this repo. Read the referenced file before writing similar code.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run qa` | typecheck, lint, unit tests, build, e2e, media. Must be green before you finish. |
| `npm run e2e` | Playwright walk through `e2e/shots.ts`, writes `docs/screenshots/NN-name.png` and a video |
| `npm run media` | newest e2e video to `docs/demo.mp4` and `docs/demo.gif` |
| `npm run format` | Biome fixes formatting and import order |

## Placeholders

Keep these literal strings until the prototype is generated: `skin-advisor-ops` in `vite.config.ts` (`base`)
and `playwright.config.ts`, `Advisor Ops Console` in `index.html`, `Revieve Oy` in the footer
(`src/components/layout/app-shell.tsx`). `index.html` keeps `<meta name="robots" content="noindex, nofollow">`.

## Layout

```
src/
  main.tsx                  providers: QueryClient, TRPCProvider, TooltipProvider, RouterProvider
  router.tsx                code-based routes, hash history, Register augmentation
  app.css                   Tailwind v4 theme (CSS variables, one accent hue)
  routes/                   one file per page
  components/ui/            shadcn style primitives (Radix + cva + cn)
  components/<feature>/     feature components
  schemas/                  Zod schemas and inferred types
  data/                     mock data parsed through Zod, in-memory store
  server/                   tRPC router (runs in the browser)
  domain/                   Effect services with typed errors
  proofs/                   gdp-ts trusted modules
  lib/                      utils, branded ids, tRPC client, session
e2e/                        Playwright spec, shots list, ffmpeg shim
scripts/media.mjs           video to mp4/gif
```

## Routing: TanStack Router

Typed, code-based routes with hash history. File: `src/router.tsx`. Links use `Link` from the
router, never raw hrefs. Params come from `accountRoute.useParams()`.

```ts
export const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts/$accountId",
  component: AccountPage,
});

const routeTree = rootRoute.addChildren([overviewRoute, accountRoute]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

```tsx
<Link to="/accounts/$accountId" params={{ accountId: row.original.id }}>
```

## Data: Zod v4 schemas and mock data

Every entity has a schema in `src/schemas/`, ids are branded in `src/lib/ids.ts`, and mock data in
`src/data/` is parsed at module load so a typo fails immediately. File: `src/schemas/account.ts`,
`src/data/accounts.ts`.

```ts
export const Account = z.object({
  id: AccountId,
  name: z.string().min(2).max(60),
  ownerId: UserId,
  type: AccountType,
  status: AccountStatus,
  currency: Currency,
  balance: z.number(),
  creditLimit: z.number().positive().nullable(),
  openedAt: z.iso.date(),
  history: z.array(BalancePoint).min(1),
});
export type Account = z.infer<typeof Account>;
```

```ts
export const accounts = z.array(Account).parse([
  { id: "acc_001", name: "Northwind Payroll", ownerId: "usr_001", type: "checking", ... },
]);
```

Mock data rules: fictional people and company names only, realistic amounts and real currency codes,
always parsed through the schema, keep it small (under ten rows per entity is enough).

## API: tRPC v11 in the browser

There is no server. The router runs behind `unstable_localLink` with a `createContext` that adds a
small delay so loading states are real. Every input is a Zod schema. Components only call tRPC
through `useTRPC()` plus TanStack Query hooks. Files: `src/server/trpc.ts`,
`src/server/routers/accounts.ts`, `src/lib/trpc.ts`.

```ts
const t = initTRPC.context<Context>().create({ allowOutsideOfServer: true });
export const router = t.router;
export const publicProcedure = t.procedure;
```

```ts
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    unstable_localLink({
      router: appRouter,
      createContext: () => createContext(session.viewerId),
    }),
  ],
});
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: false } },
});
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
```

```tsx
const trpc = useTRPC();
const accountsQuery = useQuery(trpc.accounts.list.queryOptions());
const update = useMutation(
  trpc.accounts.update.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.accounts.pathKey() });
    },
  }),
);
```

Plain CRUD over mock data is just Zod + tRPC: validate the input, read or write the store, return.

## Domain logic: Effect v4

Use Effect when the logic has failure modes worth typing: pricing rules, eligibility, scheduling,
multi-step workflows. Skip it for plain CRUD. One service per concern, errors as `Data.TaggedError`,
dependencies as `Context.Service`, run at the tRPC boundary. File: `src/domain/account-rules.ts`,
boundary in `src/server/routers/accounts.ts`, tests in `src/domain/account-rules.test.ts`.

```ts
export class AccountClosed extends Data.TaggedError("AccountClosed")<{
  readonly accountId: AccountId;
}> {}

export class AccountRepo extends Context.Service<
  AccountRepo,
  { readonly byId: (id: AccountId) => Account | undefined }
>()("AccountRepo") {}

export const applyAccountPatch = Effect.fn("applyAccountPatch")(function* (
  accountId: AccountId,
  patch: AccountPatch,
) {
  const repo = yield* AccountRepo;
  const current = repo.byId(accountId);
  if (!current) return yield* new AccountNotFound({ accountId });
  if (current.status === "closed") return yield* new AccountClosed({ accountId });
  return { ...current, name: patch.name };
});
```

At the boundary, `Effect.result` turns failures into a value you map to `TRPCError` with an
exhaustive `switch` on `_tag`:

```ts
const result = await Effect.runPromise(
  applyAccountPatch(account.value, input.patch).pipe(repoLayer, Effect.result),
);
if (Result.isFailure(result)) throw toTRPCError(result.failure);
```

## Authorization: gdp-ts proofs

Use gdp-ts when the prototype has roles, permissions, plans or entitlements, or ownership. Skip it
when every viewer can do everything. One trusted module per fact under `src/proofs/`; it keeps the
prover private and exports the proof type and the checking function. Sensitive functions demand the
proof about their exact arguments, so skipping the check is a compile error. File:
`src/proofs/can-edit-account.ts`, consumer in `src/data/account-store.ts`, handler in
`src/server/routers/accounts.ts`.

```ts
const CanEditAccount = defineProof("CanEditAccount");
export interface CanEditAccount<U, A> extends Proof<"CanEditAccount", [U, A]> {}

export function canEditAccount<U, A>(
  user: Named<U, UserId>,
  account: Named<A, AccountId>,
): CanEditAccount<U, A> | null {
  const viewer = userStore.byId(user.value);
  const target = accountStore.byId(account.value);
  if (!viewer || !target) return null;
  return isEditor(viewer, target) ? CanEditAccount.prove(user, account) : null;
}
```

```ts
write<U, A>(account: Named<A, AccountId>, next: Account, _proof: CanEditAccount<U, A>): Account {
  table.set(account.value, next);
  return next;
},
```

```ts
update: publicProcedure.input(UpdateAccountInput).mutation(({ ctx, input }) =>
  name(ctx.viewer.id, input.accountId, async (user, account) => {
    const proof = canEditAccount(user, account);
    if (!proof) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot edit this account." });
    ...
    return accountStore.write(account, result.success, proof);
  }),
),
```

UI hints (disabling a button) use a plain function like `editAccessHint`; they never replace the
proof. Never forge a proof with `as`.

## UI: Tailwind v4 and shadcn style components

CSS-first config in `src/app.css`: `@import "tailwindcss"`, `@import "tw-animate-css"`, semantic
variables in `:root`, exposed with `@theme inline`. Light theme, one accent hue, system font stack.
Components live in `src/components/ui/` and follow shadcn/ui: Radix primitive, `cva` variants,
`cn` from `src/lib/utils.ts`, `data-slot` attributes. Icons come from `lucide-react`.

```tsx
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ...",
  {
    variants: {
      variant: { default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90", ... },
      size: { default: "h-9 px-4 py-2", sm: "h-8 rounded-md px-3 text-xs", icon: "size-9" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
```

Available: button, card, badge, input, label, select, tabs, dialog, tooltip, separator, progress,
skeleton, table, chart. Add new ones in the same style. Every page has loading (Skeleton), error and
empty states; see `src/routes/overview.tsx` and `src/routes/account.tsx`. Check layouts at 390px.

Chart: `src/components/ui/chart.tsx` wraps Recharts 3 with a `ChartConfig` that becomes
`--color-<key>` variables. Example in `src/components/accounts/balance-chart.tsx`:

```tsx
const config = { balance: { label: "Balance", color: "var(--chart-1)" } } satisfies ChartConfig;

<ChartContainer config={config} className="h-56 w-full aspect-auto">
  <AreaChart data={data}>
    <CartesianGrid vertical={false} strokeDasharray="3 3" />
    <XAxis dataKey="month" minTickGap={24} tickLine={false} axisLine={false} tickFormatter={monthLabel} />
    <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatMoney(v, currency)} />} />
    <Area dataKey="balance" type="monotone" stroke="var(--color-balance)" fill="url(#fill-balance)" />
  </AreaChart>
</ChartContainer>
```

Motion: one subtle entrance animation through `FadeIn` in `src/components/fade-in.tsx`. It returns a
plain div when `useReducedMotion()` is true.

## Table: TanStack Table v9

Register only the features you use with `tableFeatures`, keep `features` and `columns` at module
scope, build columns with `createColumnHelper`, render with `table.FlexRender`. File:
`src/components/accounts/accounts-table.tsx`.

```ts
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
});
const helper = createColumnHelper<typeof features, Account>();
const columns = helper.columns([
  helper.accessor("name", { header: "Account", sortFn: "alphanumeric", cell: ({ getValue }) => ... }),
  helper.accessor("balance", { header: "Balance", sortFn: "basic", enableGlobalFilter: false }),
]);

const table = useTable({
  features, columns, data: accounts,
  getRowId: (row) => row.id,
  state: { sorting, globalFilter },
  onSortingChange: setSorting,
  onGlobalFilterChange: setGlobalFilter,
  globalFilterFn: "includesString",
});
```

Put `aria-sort` on the `<th>`, not on the sort button. Numeric columns sort descending first.

## Form: TanStack Form v1 with Zod

The Zod schema is the validator (Standard Schema). Field errors are objects with a `message`. The
submit handler calls a tRPC mutation that invalidates the query. File:
`src/components/accounts/edit-account-dialog.tsx`.

```tsx
const form = useForm({
  defaultValues: { name: account.name, creditLimit: account.creditLimit } as AccountPatch,
  validators: { onChange: AccountPatch },
  onSubmit: ({ value }) => update.mutateAsync({ accountId: account.id, patch: value }),
});

<form.Field name="name">
  {(field) => {
    const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined;
    return (
      <div className="grid gap-2">
        <Label htmlFor={field.name}>Name</Label>
        <Input id={field.name} value={field.state.value} onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)} aria-invalid={error ? true : undefined} />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }}
</form.Field>
```

## Session

`src/lib/session.ts` holds the signed-in user id in a tiny external store so the tRPC link and
React read the same value. Switching users invalidates every query. Use it for role demos.

## Tests

Vitest 5 with jsdom and Testing Library; setup in `src/test/setup.ts` imports
`@testing-library/jest-dom/vitest`. Unit test domain services (`src/domain/*.test.ts`) and one
component per feature (`src/components/**/*.test.tsx`). Components that render router `Link`s mock
`@tanstack/react-router` with a plain anchor.

```ts
function run<A, E>(effect: Effect.Effect<A, E, AccountRepo>) {
  return Effect.runPromise(effect.pipe(withFakeRepo, Effect.result));
}
const result = await run(applyAccountPatch(legacy.id, { name: "Renamed", creditLimit: null }));
expect(Result.isFailure(result) && result.failure._tag).toBe("AccountClosed");
```

## Screenshots and video

`e2e/shots.ts` exports the main states as `{ name, path, steps? }`. `e2e/demo.spec.ts` visits each
one at 1440x900, reloads (hash navigation keeps the document), runs the steps with their assertions,
and saves `docs/screenshots/NN-name.png`. Add a shot for every meaningful state you build. Then:

```
npm run e2e     # starts vite preview on 4173, records video
npm run media   # test-results/**/*.webm -> docs/demo.mp4 (H.264, 1280 wide) and docs/demo.gif (8 fps, < 9 MB)
```

Chromium comes from `PW_CHROMIUM_PATH` when set. `e2e/ffmpeg-shim.ts` points Playwright at the
system ffmpeg when its own download is missing (offline sandboxes); it does nothing otherwise.

## Rules

- Every tRPC input is a Zod schema. Components only call tRPC through `useTRPC()` and TanStack Query.
- Routes are typed; links use the router's `Link` with `params`, never raw hrefs.
- Accessibility: Radix primitives, a `Label` for every input, visible focus rings, contrast that
  passes AA, `aria-sort` on headers, `role="status"` on loading placeholders, tooltips only as hints.
- Effect only for real domain logic with typed failures; gdp-ts only when there are roles or
  ownership. Otherwise Zod + tRPC.
- Mock data: fictional names, realistic numbers and currencies, parsed through Zod at module load.
- No network calls. No new dependencies unless they are in the `deps-request.txt` allowlist.
- No logos, trademarks or copied text from the target company. No em dashes in README or UI text.
- `npm run qa` must be green with zero warnings before you finish. Leave no TODOs.
- Commits: short plain messages at real milestones ("Add accounts table"). Never amend.
