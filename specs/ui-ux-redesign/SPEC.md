# SPEC: UI/UX Redesign

## Objective

Redesign the visual layout and design system of the Broadcast web app to replace the unstyled MUI defaults with a professional Indigo + Zinc palette, a clean white top header, and expressive message status treatment. No logic, Firebase, or data layer changes are made.

## Architecture / Stack

- **React + TypeScript (`web/`)** — all changes are purely presentational; no hooks, services, or routing changes
- **MUI v9 (`@mui/material`)** — custom `ThemeProvider` added to override palette, border radius, and component defaults
- **Tailwind CSS v4** — used for layout utilities and spacing; CSS custom properties added to `index.css` for design tokens
- **Git worktree** — changes made in an isolated `design/ui-redesign` branch via `git worktree add ../broadcast-design`

## Implementation Steps

1. **Worktree** — Create `git worktree add ../broadcast-design -b design/ui-redesign`; all subsequent work happens inside `../broadcast-design/web/src/`

2. **`web/src/index.css`** — Add CSS custom properties for the full token set: background, surface, border levels, primary, text hierarchy (4 levels), scheduled (amber), sent (emerald), and destructive red

3. **`web/src/main.tsx`** — Wrap `<App />` with MUI `ThemeProvider`; configure `palette.primary.main` (#4F46E5), `palette.background.default` (#FAFAFA), `palette.background.paper` (#FFFFFF), `shape.borderRadius` (8), and component overrides for `MuiCard` (border, no shadow), `MuiButton`, and `MuiTextField`

4. **`web/src/components/layout/app-layout.tsx`** — Replace `<AppBar>` with a plain white `<header>` (56px, `border-b border-zinc-200`); left: indigo dot + "Broadcast" wordmark; right: user email in secondary text + ghost logout button; main content area uses `bg-zinc-50 min-h-screen p-6`

5. **`web/src/pages/login-page.tsx`** — Full-height centered layout on zinc-50 background; white card (`max-w-sm`, `rounded-xl`, `border border-zinc-200`, `p-8`); "Broadcast" title at top; MUI Tabs below

6. **`web/src/pages/connections-page.tsx`** — Page heading + filled indigo "Nova conexão" button; responsive card grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`); empty state with centered muted text

7. **`web/src/components/connections/connection-card.tsx`** — White card, `border border-zinc-200 rounded-xl`, no shadow; connection name at top; "Contatos" and "Mensagens" as ghost navigation buttons; edit/delete icon buttons receded to zinc-400 at bottom

8. **`web/src/pages/contacts-page.tsx`** — Header with plain back icon + "Contatos" title + "Novo contato" button; optional connection name as subtitle (`text-sm text-zinc-500`)

9. **`web/src/components/contacts/contact-card.tsx`** — Single-row compact layout: indigo avatar initial circle + name (`font-medium`) + phone (`text-zinc-500 text-sm`) + edit/delete at far right; `border border-zinc-200 rounded-xl px-4 py-3`

10. **`web/src/pages/messages-page.tsx`** — Header with back icon + title + button; filter component placed below header

11. **`web/src/components/messages/message-filter.tsx`** — Replace MUI `Tabs` with pill segmented control: outer `inline-flex bg-zinc-100 rounded-lg p-1`; active pill is white with subtle shadow; inactive is `text-zinc-500`

12. **`web/src/components/messages/message-card.tsx`** — Signature element: 4px left border accent (`border-l-4 border-amber-400` scheduled / `border-l-4 border-emerald-400` sent); card border `border border-zinc-200 rounded-xl`; top row: recipients bold + status chip right-aligned; middle: 2-line clamped body; bottom: date in `text-xs text-zinc-400` + conditional edit/delete; status chips use manual color tokens (amber/emerald backgrounds), not MUI `color` props

## Technical Considerations

- **No logic changes**: components must not gain or lose props, hooks must not be modified, service functions are untouched. Only JSX structure and `className`/`sx` styling changes.
- **MUI + Tailwind coexistence**: MUI's `sx` overrides and `className` Tailwind utilities must be applied carefully — MUI's CSS specificity can override Tailwind; prefer `sx` for MUI-component internals and `className` for layout wrappers.
- **Tailwind v4 token access**: CSS custom properties defined in `index.css` can be referenced directly in `style={{ color: 'var(--color-primary)' }}` or via Tailwind arbitrary values `text-[var(--color-primary)]`; they are not Tailwind theme tokens.
- **MUI ThemeProvider scope**: must wrap at the `main.tsx` root level, outside `<App />`, so all nested MUI components inherit the theme.
- **Card depth strategy**: borders-only — do not add `boxShadow` anywhere. MUI's default `Card` shadow must be explicitly zeroed in the theme override (`boxShadow: 'none'`).
- **Status chip colors**: do not use MUI `color="warning"` or `color="success"` on `<Chip>` — these pull from the MUI palette and may not match the amber/emerald tokens. Use `sx={{ backgroundColor: 'var(--color-scheduled-bg)', color: 'var(--color-scheduled)' }}` directly.
- **Worktree isolation**: the main branch remains untouched; the worktree branch can be previewed and merged separately after visual review.
- **TypeScript**: run `pnpm --prefix web run tsc --noEmit` in the worktree before considering work complete; no type errors may be introduced.
