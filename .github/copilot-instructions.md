# G-Events Copilot Instructions

## Project Overview
G-Events is a Next.js 16 event management system built with React 19, TypeScript, and Tailwind CSS v4. The app uses the App Router architecture with server and client components.

## Architecture
- **Framework**: Next.js 16 with App Router (`app/` directory)
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming (light/dark mode support)
- **Fonts**: Geist Sans and Geist Mono loaded via `next/font`
- **Linting**: ESLint with Next.js core web vitals and TypeScript rules

Key directories:
- `app/`: Next.js app router pages and layouts
- `public/`: Static assets (SVGs, favicon)

## Development Workflow
- **Start dev server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production**: `npm run start`
- **Lint**: `npm run lint`

## Branching & Contributions
- **Main branch**: `main` (protected, production-ready)
- **Development branch**: `nightly` (target for all PRs)
- **Commits**: Follow Conventional Commits format: `type(scope): subject`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
  - Example: `feat(auth): implement google oauth login`

## Code Patterns
- **Components**: Use TypeScript with React.FC or function declarations
- **Styling**: Tailwind classes with CSS custom properties for theming
  - Example: `bg-zinc-50 dark:bg-black` for responsive backgrounds
- **Fonts**: Access via CSS variables `--font-geist-sans`, `--font-geist-mono`
- **Images**: Use Next.js `<Image>` component with priority for above-the-fold
- **Layout**: Root layout in `app/layout.tsx` handles fonts and metadata

## Configuration
- **TypeScript**: Paths configured with `"@/*": ["./*"]` (relative to project root)
- **ESLint**: Flat config with Next.js overrides, ignores `.next/**`
- **PostCSS**: Configured for Tailwind v4 with `@tailwindcss/postcss`

## Dependencies
Core: Next.js 16.1.1, React 19.2.3, Tailwind CSS v4
Dev: TypeScript 5, ESLint 9, @types packages

## Notes
- Project is proprietary; avoid external sharing
- Currently at starter template stage - expand event management features in `app/` directory
- Use `app/page.tsx` as entry point for main functionality</content>
<parameter name="filePath">x:/projects/g-events/G-Events/.github/copilot-instructions.md