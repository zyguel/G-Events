### Quick Start Next.js App Creation

Source: https://nextjs.org/docs/app/getting-started/installation

Create a new Next.js application named 'my-app' and start the development server immediately. This command uses the --yes flag to skip interactive prompts and apply default configurations.

```pnpm
pnpm create next-app@latest my-app --yes
cd my-app
pnpm dev
```

```npm
npx create-next-app@latest my-app --yes
cd my-app
npm run dev
```

```yarn
yarn create next-app@latest my-app --yes
cd my-app
yarn dev
```

```bun
bun create next-app@latest my-app --yes
cd my-app
bun dev
```

--------------------------------

### Next.js CLI Configuration Prompts

Source: https://nextjs.org/docs/app/getting-started/installation

A reference of the interactive prompts provided by create-next-app, showing available options for project naming, defaults, and advanced customization settings.

```terminal
What is your project named? my-app
Would you like to use the recommended Next.js defaults?
    Yes, use recommended defaults - TypeScript, ESLint, Tailwind CSS, App Router, AGENTS.md
    No, reuse previous settings
    No, customize settings - Choose your own preferences

# Customization options:
Would you like to use TypeScript? No / Yes
Which linter would you like to use? ESLint / Biome / None
Would you like to use React Compiler? No / Yes
Would you like to use Tailwind CSS? No / Yes
Would you like your code inside a `src/` directory? No / Yes
Would you like to use App Router? (recommended) No / Yes
Would you like to customize the import alias (`@/*` by default)? No / Yes
What import alias would you like configured? @/*
Would you like to include AGENTS.md to guide coding agents to write up-to-date Next.js code? No / Yes
```

--------------------------------

### Import Statement Comparison - Before and After

Source: https://nextjs.org/docs/app/getting-started/installation

Demonstrates the difference between using relative imports and absolute imports with module aliases in Next.js. The after example shows the cleaner syntax achieved through proper configuration.

```jsx
// Before
import { Button } from '../../../components/button'

// After
import { Button } from '@/components/button'
```

--------------------------------

### Install OpenTelemetry packages with bun

Source: https://nextjs.org/docs/app/guides/open-telemetry

Install the required OpenTelemetry packages and dependencies using bun package manager. This command installs @vercel/otel along with core OpenTelemetry SDK and instrumentation libraries needed for observability setup.

```bash
bun add @vercel/otel @opentelemetry/sdk-logs @opentelemetry/api-logs @opentelemetry/instrumentation
```

--------------------------------

### Initialize Next.js project with Vitest example

Source: https://nextjs.org/docs/app/guides/testing/vitest

Scaffold a new Next.js project using the official with-vitest template. This is the fastest way to get a pre-configured testing environment.

```pnpm
pnpm create next-app --example with-vitest with-vitest-app
```

```npm
npx create-next-app@latest --example with-vitest with-vitest-app
```

```yarn
yarn create next-app --example with-vitest with-vitest-app
```

```bun
bun create next-app --example with-vitest with-vitest-app
```

--------------------------------

### Create Next.js project with Playwright example

Source: https://nextjs.org/docs/app/guides/testing/playwright

Quickly scaffold a new Next.js project with Playwright pre-configured using create-next-app. Supports multiple package managers (pnpm, npm, yarn, bun). This is the fastest way to get started with Playwright in Next.js.

```bash
pnpm create next-app --example with-playwright with-playwright-app
```

```bash
npx create-next-app@latest --example with-playwright with-playwright-app
```

```bash
yarn create next-app --example with-playwright with-playwright-app
```

```bash
bun create next-app --example with-playwright with-playwright-app
```

--------------------------------

### Manual Next.js Dependency Installation

Source: https://nextjs.org/docs/app/getting-started/installation

Install the core packages required to run a Next.js application manually. This includes the latest versions of next, react, and react-dom.

```pnpm
pnpm i next@latest react@latest react-dom@latest
```

```npm
npm i next@latest react@latest react-dom@latest
```

```yarn
yarn add next@latest react@latest react-dom@latest
```

```bun
bun add next@latest react@latest react-dom@latest
```

--------------------------------

### Install OpenTelemetry packages with npm

Source: https://nextjs.org/docs/app/guides/open-telemetry

Install the required OpenTelemetry packages and dependencies using npm package manager. This command installs @vercel/otel along with core OpenTelemetry SDK and instrumentation libraries needed for observability setup.

```bash
npm install @vercel/otel @opentelemetry/sdk-logs @opentelemetry/api-logs @opentelemetry/instrumentation
```

--------------------------------

### Create Next.js App from Official Example

Source: https://nextjs.org/docs/app/api-reference/cli/create-next-app

Bootstraps a new project using an official example from the Next.js repository. This method uses the --example flag followed by the specific example name and the desired project folder name.

```pnpm
pnpm create next-app --example [example-name] [your-project-name]
```

```npm
npx create-next-app@latest --example [example-name] [your-project-name]
```

```yarn
yarn create next-app --example [example-name] [your-project-name]
```

```bun
bun create next-app --example [example-name] [your-project-name]
```

--------------------------------

### Next.js server debugger output example

Source: https://nextjs.org/docs/pages/guides/debugging

Example terminal output when Next.js server starts with --inspect flag enabled. Shows debugger listening on WebSocket URL and server ready confirmation, indicating successful debugging setup.

```bash
Debugger listening on ws://127.0.0.1:9229/0cf90313-350d-4466-a748-cd60f4e47c95
For help, see: https://nodejs.org/en/docs/inspector
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

--------------------------------

### Install OpenTelemetry packages with yarn

Source: https://nextjs.org/docs/app/guides/open-telemetry

Install the required OpenTelemetry packages and dependencies using yarn package manager. This command installs @vercel/otel along with core OpenTelemetry SDK and instrumentation libraries needed for observability setup.

```bash
yarn add @vercel/otel @opentelemetry/sdk-logs @opentelemetry/api-logs @opentelemetry/instrumentation
```

--------------------------------

### Install OpenTelemetry packages with pnpm

Source: https://nextjs.org/docs/app/guides/open-telemetry

Install the required OpenTelemetry packages and dependencies using pnpm package manager. This command installs @vercel/otel along with core OpenTelemetry SDK and instrumentation libraries needed for observability setup.

```bash
pnpm add @vercel/otel @opentelemetry/sdk-logs @opentelemetry/api-logs @opentelemetry/instrumentation
```

--------------------------------

### Configure Biome Scripts in package.json

Source: https://nextjs.org/docs/app/getting-started/installation

Adds scripts for linting and formatting using Biome, a high-performance alternative to ESLint and Prettier.

```json
{
  "scripts": {
    "lint": "biome check",
    "format": "biome format --write"
  }
}
```

--------------------------------

### Create Next.js app with Jest example using bun

Source: https://nextjs.org/docs/app/guides/testing/jest

Quickly bootstrap a new Next.js project with Jest pre-configured using the with-jest example template via bun package manager.

```bash
bun create next-app --example with-jest with-jest-app
```

--------------------------------

### Configure Next.js Image Formats for AVIF and WebP in `next.config.js`

Source: https://nextjs.org/docs/pages/api-reference/components/image-legacy

This example demonstrates how to configure Next.js to support both AVIF and WebP image formats, with AVIF being preferred. For browsers that support AVIF, it will be used; otherwise, WebP will serve as a fallback. This setup ensures optimal image compression for modern browsers while maintaining compatibility across a wider range of clients.

```js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}
```

--------------------------------

### Initialize Next.js project with API support using create-next-app

Source: https://nextjs.org/docs/app/guides/backend-for-frontend

These commands demonstrate how to create a new Next.js project using `create-next-app` with the `--api` flag. This flag automatically sets up an example `route.ts` file, providing a starting point for API development. It supports various package managers like pnpm, npm, yarn, and bun.

```bash
pnpm create next-app --api
```

```bash
npx create-next-app@latest --api
```

```bash
yarn create next-app --api
```

```bash
bun create next-app --api
```

--------------------------------

### Create Next.js app with Jest example using npm

Source: https://nextjs.org/docs/app/guides/testing/jest

Quickly bootstrap a new Next.js project with Jest pre-configured using the with-jest example template via npm package manager.

```bash
npx create-next-app@latest --example with-jest with-jest-app
```

--------------------------------

### Initialize Next.js project with Jest example using create-next-app

Source: https://nextjs.org/docs/pages/guides/testing/jest

This command initializes a new Next.js project using the `with-jest` example template. It leverages `create-next-app` to quickly set up a Next.js application pre-configured with Jest for unit and snapshot testing, providing a ready-to-use testing environment.

```bash
pnpm create next-app --example with-jest with-jest-app
```

```bash
npx create-next-app@latest --example with-jest with-jest-app
```

```bash
yarn create next-app --example with-jest with-jest-app
```

```bash
bun create next-app --example with-jest with-jest-app
```

--------------------------------

### Next.js Scripts Configuration

Source: https://nextjs.org/docs/app/getting-started/installation

Standard script definitions for the package.json file to handle development, production builds, and linting. Includes support for Turbopack by default.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "lint:fix": "eslint --fix"
  }
}
```

--------------------------------

### Create Next.js app with Jest example using pnpm

Source: https://nextjs.org/docs/app/guides/testing/jest

Quickly bootstrap a new Next.js project with Jest pre-configured using the with-jest example template via pnpm package manager.

```bash
pnpm create next-app --example with-jest with-jest-app
```

--------------------------------

### Initialize Next.js with Cypress using create-next-app

Source: https://nextjs.org/docs/app/guides/testing/cypress

Quickly bootstrap a new Next.js project pre-configured with Cypress using the official 'with-cypress' example template.

```pnpm
pnpm create next-app --example with-cypress with-cypress-app
```

```npm
npx create-next-app@latest --example with-cypress with-cypress-app
```

```yarn
yarn create next-app --example with-cypress with-cypress-app
```

```bun
bun create next-app --example with-cypress with-cypress-app
```

--------------------------------

### Install `server-only` package using npm, yarn, pnpm, or bun

Source: https://nextjs.org/docs/app/getting-started/server-and-client-components

These commands show how to install the `server-only` package using various JavaScript package managers. While optional in Next.js for functionality, installing it can help resolve linting issues related to extraneous dependencies and provide clearer error messages during development.

```bash
npm install server-only
```

```bash
yarn add server-only
```

```bash
pnpm add server-only
```

```bash
bun add server-only
```

--------------------------------

### Reference Static Assets from Public Folder in Next.js

Source: https://nextjs.org/docs/app/getting-started/installation

Demonstrates how to use the Next.js Image component to display static assets stored in the public directory using root-relative paths.

```tsx
import Image from 'next/image'

export default function Page() {
  return <Image src="/profile.png" alt="Profile" width={100} height={100} />
}
```

```jsx
import Image from 'next/image'

export default function Page() {
  return <Image src="/profile.png" alt="Profile" width={100} height={100} />
}
```

--------------------------------

### Create Next.js app with Jest example using yarn

Source: https://nextjs.org/docs/app/guides/testing/jest

Quickly bootstrap a new Next.js project with Jest pre-configured using the with-jest example template via yarn package manager.

```bash
yarn create next-app --example with-jest with-jest-app
```

--------------------------------

### Configure Next.js build and start scripts in package.json

Source: https://nextjs.org/docs/app/getting-started/deploying

This snippet shows the essential `scripts` configuration in `package.json` for a Next.js application. It defines commands for development (`dev`), building for production (`build`), and starting the production server (`start`). These scripts are crucial for deploying Next.js as a Node.js server.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

--------------------------------

### Configure ESLint Scripts in package.json

Source: https://nextjs.org/docs/app/getting-started/installation

Adds standard linting and auto-fix scripts to the project configuration for maintaining code quality with ESLint.

```json
{
  "scripts": {
    "lint": "eslint",
    "lint:fix": "eslint --fix"
  }
}
```

--------------------------------

### Install web-push CLI Globally for VAPID Key Generation

Source: https://nextjs.org/docs/app/guides/progressive-web-apps

These commands demonstrate how to globally install the `web-push` command-line interface using various package managers (pnpm, npm, yarn, bun). The CLI is essential for generating the VAPID public and private keys required for implementing the Web Push API.

```bash
pnpm add -g web-push
```

```bash
npm install -g web-push
```

```bash
yarn global add web-push
```

```bash
bun add -g web-push
```

--------------------------------

### Generate Jest configuration file for Next.js projects

Source: https://nextjs.org/docs/pages/guides/testing/jest

This command initiates the Jest configuration setup process, guiding the user through prompts to create a `jest.config.ts` or `jest.config.js` file. This file will contain the base configuration required for running tests with Jest in the project, which can then be further customized for Next.js.

```bash
pnpm create jest@latest
```

```bash
npm init jest@latest
```

```bash
yarn create jest@latest
```

```bash
bun create jest@latest
```

--------------------------------

### Create Home Page in Next.js App Router

Source: https://nextjs.org/docs/app/getting-started/installation

Defines the entry point for the application at the root route. This component is rendered when users navigate to the base URL of the site.

```tsx
export default function Page() {
  return <h1>Hello, Next.js!</h1>
}
```

```jsx
export default function Page() {
  return <h1>Hello, Next.js!</h1>
}
```

--------------------------------

### Configure Module Path Aliases with baseUrl and paths

Source: https://nextjs.org/docs/app/getting-started/installation

Establishes both baseUrl and paths configuration to create semantic module aliases. The paths option maps alias patterns to actual directory locations, enabling clean imports like @/components/* that resolve to src/components/*.

```json
{
  "compilerOptions": {
    "baseUrl": "src/",
    "paths": {
      "@/styles/*": ["styles/*"],
      "@/components/*": ["components/*"]
    }
  }
}
```

--------------------------------

### Illustrate Next.js Docs File Structure with Alphabetical Sorting (TXT)

Source: https://nextjs.org/docs/community/contribution-guide

This example demonstrates how file-system routing organizes documentation pages, where files within a directory are sorted alphabetically. This approach is beneficial for sections like API references, making it easier for developers to quickly locate specific functions or components.

```txt
04-functions
├── after.mdx
├── cacheLife.mdx
├── cacheTag.mdx
└── ...
```

--------------------------------

### Using Available Icons in MDX Documentation

Source: https://nextjs.org/docs/community/contribution-guide

Provides examples of how to embed predefined icons, such as `<Check>` and `<Cross>`, directly into MDX documentation files. It shows how to specify the size of the icons for visual presentation within the content.

```mdx
<Check size={18} />
<Cross size={18} />
```

--------------------------------

### GET /api/hello

Source: https://nextjs.org/docs/pages/building-your-application/routing/api-routes

A basic example of a Next.js API route that returns a JSON greeting message.

```APIDOC
## GET /api/hello

### Description
Returns a simple JSON response with a greeting message from the server.

### Method
GET

### Endpoint
/api/hello

### Parameters
#### Query Parameters
- **req.query** (object) - Optional - An object containing the query string parameters.

### Request Example
{}

### Response
#### Success Response (200)
- **message** (string) - A greeting string: "Hello from Next.js!"

### Response Example
{
  "message": "Hello from Next.js!"
}
```

--------------------------------

### Start Standalone Production Server

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/output

Commands to execute the minimal production server generated in the standalone directory, with support for custom port and hostname environment variables.

```bash
node .next/standalone/server.js
```

```bash
PORT=8080 HOSTNAME=0.0.0.0 node server.js
```

--------------------------------

### Demonstrate Next.js Docs File Structure with Ordered Learning Path (TXT)

Source: https://nextjs.org/docs/community/contribution-guide

This snippet shows a file structure where pages are prefixed with two-digit numbers to enforce a specific learning order. This method is ideal for guiding users through foundational concepts or sequential topics, ensuring they encounter information in a logical progression.

```txt
01-getting-started
├── 01-installation.mdx
├── 02-project-structure.mdx
├── 03-layouts-and-pages.mdx
└── ...
```

--------------------------------

### Initialize Playwright in existing Next.js project

Source: https://nextjs.org/docs/app/guides/testing/playwright

Manually install and configure Playwright in an existing Next.js project. Runs an interactive setup wizard that creates playwright.config.ts and configures the testing framework. Supports pnpm, npm, yarn, and bun package managers.

```bash
pnpm create playwright
```

```bash
npm init playwright
```

```bash
yarn create playwright
```

```bash
bun create playwright
```

--------------------------------

### Test Content Negotiation with Curl

Source: https://nextjs.org/docs/app/guides/backend-for-frontend

Command-line examples using curl to verify that the server correctly responds with Markdown when the specific Accept header is provided, and HTML otherwise.

```bash
# Returns Markdown
curl -H "Accept: text/markdown" https://example.com/docs/getting-started

# Returns the normal HTML page
curl https://example.com/docs/getting-started
```

--------------------------------

### Migrate to ESLint CLI via Next.js Codemod

Source: https://nextjs.org/docs/app/getting-started/installation

Executes a codemod to transition project scripts from the legacy 'next lint' command to the standard ESLint CLI.

```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

--------------------------------

### Programmatic Navigation with useRouter in Next.js Client Components

Source: https://nextjs.org/docs/app/api-reference/functions/use-router

This example demonstrates how to use the `useRouter` hook from `next/navigation` to programmatically navigate to a different route (`/dashboard`) when a button is clicked. It shows a basic Client Component setup in Next.js, importing `useRouter` and calling `router.push()` within an event handler. This approach is suitable when the `<Link>` component is not sufficient for specific navigation needs.

```tsx
'use client'

import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  return (
    <button type="button" onClick={() => router.push('/dashboard')}>
      Dashboard
    </button>
  )
}
```

```jsx
'use client'

import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  return (
    <button type="button" onClick={() => router.push('/dashboard')}>
      Dashboard
    </button>
  )
}
```

--------------------------------

### Install Next.js Dependency with Package Managers

Source: https://nextjs.org/docs/app/guides/migrating/from-vite

This step outlines how to install the `next` package, which is the core dependency for a Next.js application. It provides commands for various package managers including pnpm, npm, yarn, and bun, ensuring compatibility with different project setups.

```bash
pnpm add next@latest
```

```bash
npm install next@latest
```

```bash
yarn add next@latest
```

```bash
bun add next@latest
```

--------------------------------

### Install OpenTelemetry dependencies for Next.js

Source: https://nextjs.org/docs/app/guides/open-telemetry

Install the required OpenTelemetry SDK, resource, convention, and exporter packages using your preferred package manager. These dependencies are necessary for manual trace configuration and exporting.

```pnpm
pnpm add @opentelemetry/sdk-node @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/sdk-trace-node @opentelemetry/exporter-trace-otlp-http
```

```npm
npm install @opentelemetry/sdk-node @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/sdk-trace-node @opentelemetry/exporter-trace-otlp-http
```

```yarn
yarn add @opentelemetry/sdk-node @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/sdk-trace-node @opentelemetry/exporter-trace-otlp-http
```

```bun
bun add @opentelemetry/sdk-node @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/sdk-trace-node @opentelemetry/exporter-trace-otlp-http
```

--------------------------------

### Initialize Jest configuration with bun

Source: https://nextjs.org/docs/app/guides/testing/jest

Generate a basic Jest configuration file interactively using bun, which creates jest.config.ts or jest.config.js with setup prompts.

```bash
bun create jest@latest
```

--------------------------------

### Start Next.js Application in Production Mode

Source: https://nextjs.org/docs/app/api-reference/cli/next

The `next start` command initiates a Next.js application in production mode. It requires the application to be pre-compiled using `next build`. This command allows specifying a custom port, hostname, and connection keep-alive timeout for the server.

```bash
next start -p 3001
```

--------------------------------

### Markdown syntax and HTML output example

Source: https://nextjs.org/docs/app/guides/mdx

Demonstrates the conversion of basic Markdown syntax, such as bold text and hyperlinks, into structurally valid HTML elements.

```markdown
I **love** using [Next.js](https://nextjs.org/)
```

```html
<p>I <strong>love</strong> using <a href="https://nextjs.org/">Next.js</a></p>
```

--------------------------------

### Example Cypress Component Test for a Next.js Page

Source: https://nextjs.org/docs/app/guides/testing/cypress

This code demonstrates how to write a Cypress component test for a Next.js page component. It illustrates mounting a React component using `cy.mount()`, asserting the presence and content of an `h1` tag, and validating a link's visibility, providing a practical example of component-level validation.

```tsx
import Page from '../../app/page'

describe('<Page />', () => {
  it('should render and display expected content', () => {
    // Mount the React component for the Home page
    cy.mount(<Page />)

    // The new page should contain an h1 with "Home"
    cy.get('h1').contains('Home')

    // Validate that a link with the expected URL is present
    // Following the link is better suited to an E2E test
    cy.get('a[href="/about"]').should('be.visible')
  })
})
```

--------------------------------

### next start Command

Source: https://nextjs.org/docs/app/api-reference/cli/next

Starts the Next.js application in production mode. The application must be compiled with next build first. This command provides options for configuring the port, hostname, and other server settings.

```APIDOC
## next start

### Description
Starts the application in production mode. The application should be compiled with `next build` first.

### Command
```bash
next start [directory] [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show all available options. |
| `[directory]` | A directory on which to start the application. If no directory is provided, the current directory will be used. |
| `-p, --port <port>` | Specify a port number on which to start the application. (default: 3000, env: PORT) |
| `-H, --hostname <hostname>` | Specify a hostname on which to start the application (default: 0.0.0.0). |
| `--keepAliveTimeout <keepAliveTimeout>` | Specify the maximum amount of milliseconds to wait before closing the inactive connections. |
| `--experimental-cpu-prof` | Enables CPU profiling using V8's inspector. Profiles are saved to `.next/cpu-profiles/` on exit. |

### Usage Examples

```bash
# Start application on default port 3000
next start

# Start application on custom port
next start -p 8080

# Start application on custom hostname and port
next start -H localhost -p 3001

# Start application in specific directory
next start ./my-app

# Enable CPU profiling
next start --experimental-cpu-prof
```
```

--------------------------------

### Create Web App Manifest for Next.js PWA

Source: https://nextjs.org/docs/app/guides/progressive-web-apps

This snippet demonstrates how to create a web app manifest file (`app/manifest.ts` or `app/manifest.js`) in a Next.js project using the App Router. The manifest defines the PWA's name, short name, description, start URL, display mode, theme colors, and icons, enabling home screen installation and a native-like user experience. This configuration allows users to install the PWA on their device's home screen.

```tsx
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Next.js PWA',
    short_name: 'NextPWA',
    description: 'A Progressive Web App built with Next.js',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

```jsx
export default function manifest() {
  return {
    name: 'Next.js PWA',
    short_name: 'NextPWA',
    description: 'A Progressive Web App built with Next.js',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

--------------------------------

### Launch the Cypress test runner

Source: https://nextjs.org/docs/app/guides/testing/cypress

Execute the newly added script to open the Cypress testing suite for the first time and initialize configuration.

```pnpm
pnpm cypress:open
```

```npm
npm run cypress:open
```

```yarn
yarn cypress:open
```

```bun
bun run cypress:open
```

--------------------------------

### Initialize Jest configuration with npm

Source: https://nextjs.org/docs/app/guides/testing/jest

Generate a basic Jest configuration file interactively using npm, which creates jest.config.ts or jest.config.js with setup prompts.

```bash
npm init jest@latest
```

--------------------------------

### Examples for Upgrading Next.js with Codemod

Source: https://nextjs.org/docs/app/guides/upgrading/codemods

These examples illustrate various ways to use the `npx @next/codemod upgrade` command. You can upgrade to the latest patch, minor (default), or major version, specify an exact version number, or target a canary release.

```bash
# Upgrade to the latest patch (e.g. 16.0.7 -> 16.0.8)
npx @next/codemod upgrade patch
```

```bash
# Upgrade to the latest minor (e.g. 15.3.7 -> 15.4.8). This is the default.
npx @next/codemod upgrade minor
```

```bash
# Upgrade to the latest major (e.g. 15.5.7 -> 16.0.7)
npx @next/codemod upgrade major
```

```bash
# Upgrade to a specific version
npx @next/codemod upgrade 16
```

```bash
# Upgrade to the canary release
npx @next/codemod upgrade canary
```

--------------------------------

### Install @next/bundle-analyzer for Webpack

Source: https://nextjs.org/docs/app/guides/package-bundling

This command installs the `@next/bundle-analyzer` plugin, which is used with Webpack to visualize application bundle sizes. It's a development dependency that helps identify large packages and dependencies for optimization.

```bash
pnpm add @next/bundle-analyzer
```

```bash
npm install @next/bundle-analyzer
```

```bash
yarn add @next/bundle-analyzer
```

```bash
bun add @next/bundle-analyzer
```

--------------------------------

### Implement Cached GET Route Handler with Static Fetching

Source: https://nextjs.org/docs/app/getting-started/route-handlers

Shows how to opt into static caching for a GET Route Handler using the 'force-static' configuration. This example fetches data from an external API and returns a JSON response using the Response.json helper.

```typescript
export const dynamic = 'force-static'

export async function GET() {
  const res = await fetch('https://data.mongodb-api.com/...', {
    headers: {
      'Content-Type': 'application/json',
      'API-Key': process.env.DATA_API_KEY,
    },
  })
  const data = await res.json()

  return Response.json({ data })
}
```

```javascript
export const dynamic = 'force-static'

export async function GET() {
  const res = await fetch('https://data.mongodb-api.com/...', {
    headers: {
      'Content-Type': 'application/json',
      'API-Key': process.env.DATA_API_KEY,
    },
  })
  const data = await res.json()

  return Response.json({ data })
}
```

--------------------------------

### Install ESLint and Next.js Configuration

Source: https://nextjs.org/docs/app/api-reference/config/eslint

Install the core ESLint package and the Next.js configuration as development dependencies using your preferred package manager.

```bash
pnpm add -D eslint eslint-config-next
```

```bash
npm i -D eslint eslint-config-next
```

```bash
yarn add --dev eslint eslint-config-next
```

```bash
bun add -d eslint eslint-config-next
```

--------------------------------

### Track Router Navigation Transitions in Next.js Client Instrumentation

Source: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

This example shows how to export an `onRouterTransitionStart` function from `instrumentation-client.ts` or `instrumentation-client.js` to receive notifications when a Next.js router navigation begins. The function receives the destination URL and the type of navigation ('push', 'replace', or 'traverse') as parameters. It logs the navigation details and marks a performance point for tracking navigation start times.

```typescript
performance.mark('app-init')

export function onRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse'
) {
  console.log(`Navigation started: ${navigationType} to ${url}`)
  performance.mark(`nav-start-${Date.now()}`)
}
```

```javascript
performance.mark('app-init')

export function onRouterTransitionStart(url, navigationType) {
  console.log(`Navigation started: ${navigationType} to ${url}`)
  performance.mark(`nav-start-${Date.now()}`)
}
```

--------------------------------

### Configure baseUrl in tsconfig.json or jsconfig.json

Source: https://nextjs.org/docs/app/getting-started/installation

Sets up the baseUrl compiler option to establish a base directory for module resolution. This configuration allows imports to be resolved relative to the specified base path instead of using relative paths.

```json
{
  "compilerOptions": {
    "baseUrl": "src/"
  }
}
```

--------------------------------

### Implementing TypeScript and JavaScript Code Switcher in MDX

Source: https://nextjs.org/docs/community/contribution-guide

Demonstrates the MDX syntax for creating a language switcher between TypeScript and JavaScript code examples. This involves using the `switcher` prop on consecutive code blocks, allowing users to toggle between different language versions of the same functionality.

```mdx
```tsx filename="app/page.tsx" switcher

```

```jsx filename="app/page.js" switcher

```
```

--------------------------------

### GitHub Actions Workflow for Next.js Adapter E2E Testing

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/adapterPath

Complete GitHub Actions workflow that builds Next.js with an adapter and runs parallelized end-to-end deployment tests across 16 test groups. The workflow handles checkout, dependency installation, Playwright setup, and test execution with proper caching and environment configuration.

```yaml
name: test-e2e-deploy

on:
  workflow_dispatch:
    inputs:
      nextjsRef:
        description: 'Next.js repo ref (branch/tag/SHA)'
        default: 'canary'
        type: string
  # schedule:
  #   - cron: '0 2 * * *'

jobs:
  build:
    name: Build Next.js + adapter
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
        with:
          path: adapter

      - uses: actions/checkout@v4
        with:
          repository: vercel/next.js
          ref: ${{ inputs.nextjsRef || 'canary' }}
          path: nextjs
          fetch-depth: 25

      - uses: actions/setup-node@v4
        with: { node-version: '20' }

      - name: Setup pnpm
        run: npm i -g corepack@0.31 && corepack enable

      - name: Install & build Next.js
        working-directory: nextjs
        run: pnpm install && pnpm build && pnpm install

      - name: Install Playwright
        working-directory: nextjs
        run: pnpm playwright install --with-deps chromium

      - name: Build adapter
        working-directory: adapter
        run: pnpm install && pnpm build

      - uses: actions/cache/save@v4
        with:
          path: |
            nextjs
            adapter
            ~/.cache/ms-playwright
          key: build-${{ github.sha }}-${{ github.run_id }}

  test:
    name: Tests (${{ matrix.group }})
    needs: build
    runs-on: ubuntu-latest
    timeout-minutes: 60
    strategy:
      fail-fast: false
      matrix:
        group:
          [
            1/16,
            2/16,
            3/16,
            4/16,
            5/16,
            6/16,
            7/16,
            8/16,
            9/16,
            10/16,
            11/16,
            12/16,
            13/16,
            14/16,
            15/16,
            16/16,
          ]
    steps:
      - uses: actions/cache/restore@v4
        with:
          path: |
            nextjs
            adapter
            ~/.cache/ms-playwright
          key: build-${{ github.sha }}-${{ github.run_id }}

      - uses: actions/setup-node@v4
        with: { node-version: '20' }

      - name: Setup pnpm
        run: npm i -g corepack@0.31 && corepack enable

      - name: Ensure Playwright browser
        working-directory: nextjs
        run: pnpm playwright install chromium

      - name: Make scripts executable
        run: chmod +x adapter/scripts/e2e-deploy.sh adapter/scripts/e2e-logs.sh adapter/scripts/e2e-cleanup.sh

      - name: Run deploy tests
        working-directory: nextjs
        env:
          NEXT_TEST_MODE: deploy
          NEXT_E2E_TEST_TIMEOUT: 240000
          NEXT_EXTERNAL_TESTS_FILTERS: test/deploy-tests-manifest.json
          ADAPTER_DIR: ${{ github.workspace }}/adapter
          IS_TURBOPACK_TEST: 1
          NEXT_TEST_JOB: 1
          NEXT_TELEMETRY_DISABLED: 1
          NEXT_TEST_DEPLOY_SCRIPT_PATH: ${{ github.workspace }}/adapter/scripts/e2e-deploy.sh
          NEXT_TEST_DEPLOY_LOGS_SCRIPT_PATH: ${{ github.workspace }}/adapter/scripts/e2e-logs.sh
          NEXT_TEST_CLEANUP_SCRIPT_PATH: ${{ github.workspace }}/adapter/scripts/e2e-cleanup.sh
        run: node run-tests.js --timings -g ${{ matrix.group }} -c 2 --type e2e
```

--------------------------------

### Define a Static GET Route Handler in Next.js

Source: https://nextjs.org/docs/app/getting-started/route-handlers

This example demonstrates a basic GET Route Handler that returns static data. Since it doesn't access any uncached or runtime-specific data, Next.js can prerender this route at build time, optimizing performance.

```tsx
export async function GET() {
  return Response.json({
    projectName: 'Next.js',
  })
}
```

--------------------------------

### Initialize Jest configuration with pnpm

Source: https://nextjs.org/docs/app/guides/testing/jest

Generate a basic Jest configuration file interactively using pnpm, which creates jest.config.ts or jest.config.js with setup prompts.

```bash
pnpm create jest@latest
```

--------------------------------

### Install Jest dependencies with bun

Source: https://nextjs.org/docs/app/guides/testing/jest

Install Jest and required testing libraries as development dependencies for Next.js project using bun, including jest-environment-jsdom, React Testing Library, and TypeScript support.

```bash
bun add -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

--------------------------------

### Start Next.js Development Server with Specific Bundlers

Source: https://nextjs.org/docs/pages/guides/migrating/from-create-react-app

Commands to launch the local development environment using either the default Turbopack engine or the legacy Webpack bundler. The --webpack flag is required if a custom webpack configuration is defined in next.config.ts.

```Bash
next dev  # Uses Turbopack by default

# To use Webpack instead (similar to CRA):
next dev --webpack
```

--------------------------------

### Access URL query parameters with useSearchParams in Next.js

Source: https://nextjs.org/docs/pages/api-reference/functions/use-search-params

This example demonstrates how to implement the useSearchParams hook to retrieve query parameters from the URL. It includes handling for null states during prerendering and uses the get() method to extract specific values.

```tsx
import { useSearchParams } from 'next/navigation'

export default function Dashboard() {
  const searchParams = useSearchParams()

  if (!searchParams) {
    // Render fallback UI while search params are not yet available
    return null
  }

  const search = searchParams.get('search')

  // URL -> `/dashboard?search=my-project` 
  // `search` -> 'my-project'
  return <>Search: {search}</>
}
```

```jsx
import { useSearchParams } from 'next/navigation'

export default function Dashboard() {
  const searchParams = useSearchParams()

  if (!searchParams) {
    // Render fallback UI while search params are not yet available
    return null
  }

  const search = searchParams.get('search')

  // URL -> `/dashboard?search=my-project` 
  // `search` -> 'my-project'
  return <>Search: {search}</>
}
```

--------------------------------

### Install Playwright dependencies for CI environments

Source: https://nextjs.org/docs/app/guides/testing/playwright

Install all system dependencies required for Playwright to run in headless mode on CI/CD platforms. Must be executed before running tests in continuous integration environments.

```bash
npx playwright install-deps
```

--------------------------------

### Test streaming endpoint with curl

Source: https://nextjs.org/docs/app/guides/streaming

Command-line example to test a streaming endpoint and observe chunks arriving progressively. Demonstrates how to verify streaming behavior from the browser or terminal.

```bash
curl http://localhost:3000/api/stream
```

--------------------------------

### Run Next.js Development Server with Turbopack or Webpack

Source: https://nextjs.org/docs/app/guides/migrating/from-create-react-app

These commands show how to start the Next.js development server. By default, Next.js uses Turbopack for faster local development, but the `--webpack` flag can be added to explicitly use Webpack, providing a similar bundling experience to Create React App.

```bash
next dev  # Uses Turbopack by default
```

```bash
next dev --webpack
```

--------------------------------

### Install Jest dependencies with npm

Source: https://nextjs.org/docs/app/guides/testing/jest

Install Jest and required testing libraries as development dependencies for Next.js project using npm, including jest-environment-jsdom, React Testing Library, and TypeScript support.

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

--------------------------------

### Install Jest and React Testing Library development dependencies for Next.js

Source: https://nextjs.org/docs/pages/guides/testing/jest

This command installs essential development dependencies for integrating Jest and React Testing Library into a Next.js project. It includes `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `ts-node`, and `@types/jest` to enable comprehensive unit and component testing.

```bash
pnpm add -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

```bash
yarn add -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

```bash
bun add -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

--------------------------------

### Render Syntax Highlighted Code in a Next.js Server Component

Source: https://nextjs.org/docs/app/guides/package-bundling

This example refactors the syntax highlighting logic to a Next.js Server Component using `shiki`. By performing the highlighting on the server, only the static HTML is sent to the client, significantly reducing the client-side JavaScript bundle size.

```tsx
import { codeToHtml } from 'shiki'

export default async function Page() {
  const code = `export function hello() {
    console.log("hi")
  }`

  // The Shiki package runs on the server and is never bundled for the client.
  const highlightedHtml = await codeToHtml(code, {
    lang: 'tsx',
    theme: 'github-dark',
  })

  return (
    <article>
      <h1>Blog Post Title</h1>

      {/* Client receives plain markup */}
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    </article>
  )
}
```

--------------------------------

### Install MDX dependencies for Next.js

Source: https://nextjs.org/docs/app/guides/mdx

Commands to install the necessary packages for MDX support in Next.js using various package managers like npm, pnpm, yarn, or bun.

```bash
pnpm add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

```bash
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

```bash
yarn add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

```bash
bun add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

--------------------------------

### Implement a GET Route Handler Accessing Runtime Headers in Next.js

Source: https://nextjs.org/docs/app/getting-started/route-handlers

This example shows a GET Route Handler that accesses request-specific runtime data, specifically the `user-agent` header using `next/headers`. Accessing runtime APIs like `headers()` terminates prerendering, causing the route to be rendered at request time.

```tsx
import { headers } from 'next/headers'

export async function GET() {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent')

  return Response.json({ userAgent })
}
```

--------------------------------

### Create a Cypress Component Test for a React Page

Source: https://nextjs.org/docs/pages/guides/testing/cypress

Demonstrates how to write a component test using the cy.mount command to render a React component. It includes assertions to verify that specific headings and links are visible in the rendered output.

```jsx
import AboutPage from '../../pages/about'

describe('<AboutPage />', () => {
  it('should render and display expected content', () => {
    // Mount the React component for the About page
    cy.mount(<AboutPage />)

    // The new page should contain an h1 with "About page"
    cy.get('h1').contains('About')

    // Validate that a link with the expected URL is present
    // *Following* the link is better suited to an E2E test
    cy.get('a[href="/"]').should('be.visible')
  })
})
```

--------------------------------

### Implement Analytics Tracking for Router Navigation in Next.js Client

Source: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

This example illustrates how to initialize an analytics tracking library and leverage the `onRouterTransitionStart` function to capture detailed navigation events. It tracks page transitions with metadata such as the destination URL, navigation type, and a timestamp. This enables comprehensive user behavior analysis and insights into application usage patterns.

```typescript
import { analytics } from './lib/analytics'

analytics.init()

export function onRouterTransitionStart(url: string, navigationType: string) {
  analytics.track('page_navigation', {
    url,
    type: navigationType,
    timestamp: Date.now(),
  })
}
```

```javascript
import { analytics } from './lib/analytics'

analytics.init()

export function onRouterTransitionStart(url, navigationType) {
  analytics.track('page_navigation', {
    url,
    type: navigationType,
    timestamp: Date.now(),
  })
}
```

--------------------------------

### Install Jest dependencies with pnpm

Source: https://nextjs.org/docs/app/guides/testing/jest

Install Jest and required testing libraries as development dependencies for Next.js project using pnpm, including jest-environment-jsdom, React Testing Library, and TypeScript support.

```bash
pnpm add -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

--------------------------------

### Use Skypack CDN Modules in React Components

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/urlImports

An example of importing a library from the Skypack CDN and utilizing it within a React component's useEffect hook. This allows using third-party libraries without local npm installation.

```javascript
import confetti from 'https://cdn.skypack.dev/canvas-confetti'
import { useEffect } from 'react'

export default () => {
  useEffect(() => {
    confetti()
  })
  return <p>Hello</p>
}
```

--------------------------------

### Create a Component Unit Test

Source: https://nextjs.org/docs/app/guides/testing/jest

Example of a Next.js page component and its corresponding test file. The test uses React Testing Library to verify that the component renders the correct heading element.

```jsx
// app/page.js
import Link from 'next/link'

export default function Page() {
  return (
    <div>
      <h1>Home</h1>
      <Link href="/about">About</Link>
    </div>
  )
}
```

```jsx
// __tests__/page.test.jsx
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Page from '../app/page'

describe('Page', () => {
  it('renders a heading', () => {
    render(<Page />)

    const heading = screen.getByRole('heading', { level: 1 })

    expect(heading).toBeInTheDocument()
  })
})
```

--------------------------------

### Install Cypress as a development dependency

Source: https://nextjs.org/docs/app/guides/testing/cypress

Add the Cypress package to your existing Next.js project as a devDependency using various package managers.

```pnpm
pnpm add -D cypress
```

```npm
npm install -D cypress
```

```yarn
yarn add -D cypress
```

```bun
bun add -D cypress
```

--------------------------------

### Install Vitest dependencies manually

Source: https://nextjs.org/docs/app/guides/testing/vitest

Install the necessary peer dependencies for Vitest, including jsdom for DOM simulation and React Testing Library for component utilities. TypeScript users should also include vite-tsconfig-paths.

```pnpm
# Using TypeScript
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
# Using JavaScript
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
```

```npm
# Using TypeScript
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
# Using JavaScript
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
```

```yarn
# Using TypeScript
yarn add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
# Using JavaScript
yarn add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
```

```bun
# Using TypeScript
bun add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
# Using JavaScript
bun add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
```

--------------------------------

### Configure Content Security Policy (CSP) with SRI in Next.js

Source: https://nextjs.org/docs/app/guides/content-security-policy

This example shows how to define and apply a Content Security Policy (CSP) header within `next.config.js` while SRI is enabled. It includes a basic CSP definition that allows self-hosted resources and conditionally enables 'unsafe-eval' for development, then applies this policy to all routes.

```js
const isDev = process.env.NODE_ENV === 'development'

const cspHeader = `
    default-src 'self';
    script-src 'self'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`

module.exports = {
  experimental: {
    sri: {
      algorithm: 'sha256',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ]
  },
}
```

--------------------------------

### Configure Next.js Middleware with a matcher using negative lookahead regex

Source: https://nextjs.org/docs/messages/middleware-upgrade-guide

This TypeScript example shows how to use a `matcher` configuration with a regular expression, specifically a negative lookahead, to exclude certain paths from Middleware execution. It matches all request paths except those starting with `api`, `_next/static`, or `favicon.ico`.

```ts
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|favicon.ico).*)',
  ],
}
```

--------------------------------

### Optimize Heavy Client Workloads by Moving to Server Components

Source: https://nextjs.org/docs/pages/guides/package-bundling

This section demonstrates how to reduce client bundle size by moving computationally intensive tasks, such as syntax highlighting, from Client Components to Server Components. The first example shows an inefficient client-side implementation where the entire highlighting library is bundled. The second example refactors this to a server component, where the highlighting occurs on the server, and only the static HTML is sent to the client, significantly reducing the client-side JavaScript payload.

```tsx
'use client'

import Highlight from 'prism-react-renderer'
import theme from 'prism-react-renderer/themes/github'

export default function Page() {
  const code = `export function hello() {
    console.log("hi")
  }`

  return (
    <article>
      <h1>Blog Post Title</h1>

      {/* The prism package and its tokenization logic are shipped to the client */}
      <Highlight code={code} language="tsx" theme={theme}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={className} style={style}>
            <code>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </article>
  )
}
```

```tsx
import { codeToHtml } from 'shiki'

export default async function Page() {
  const code = `export function hello() {
    console.log("hi")
  }`

  // The Shiki package runs on the server and is never bundled for the client.
  const highlightedHtml = await codeToHtml(code, {
    lang: 'tsx',
    theme: 'github-dark',
  })

  return (
    <article>
      <h1>Blog Post Title</h1>

      {/* Client receives plain markup */}
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    </article>
  )
}
```

--------------------------------

### Configure Custom App for Global Layout

Source: https://nextjs.org/docs/pages/getting-started/installation

Initializes pages and allows for global layouts, persistent state, or global CSS. The _app file wraps every page in the application to provide consistent structure.

```tsx
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
```

```jsx
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
```

--------------------------------

### Install Tailwind CSS v3 with bun

Source: https://nextjs.org/docs/app/guides/tailwind-v3-css

Install Tailwind CSS v3, PostCSS, and Autoprefixer as development dependencies using bun, then initialize Tailwind configuration files. This command generates both tailwind.config.js and postcss.config.js automatically.

```bash
bun add -D tailwindcss@^3 postcss autoprefixer
bunx tailwindcss init -p
```

--------------------------------

### Basic Next.js Link Component Usage in TSX

Source: https://nextjs.org/docs/community/contribution-guide

Provides a minimum working example of the Next.js `<Link>` component in TypeScript React (TSX). It includes the necessary import statement and shows how to use the component to create a simple navigation link, ensuring the code is ready to be copied and pasted.

```tsx
import Link from 'next/link'

export default function Page() {
  return <Link href="/about">About</Link>
}
```

--------------------------------

### Initialize Jest configuration with yarn

Source: https://nextjs.org/docs/app/guides/testing/jest

Generate a basic Jest configuration file interactively using yarn, which creates jest.config.ts or jest.config.js with setup prompts.

```bash
yarn create jest@latest
```

--------------------------------

### Conditionally Displaying Content for App/Pages Router in MDX

Source: https://nextjs.org/docs/community/contribution-guide

Demonstrates how to use `<PagesOnly>` and `<AppOnly>` components within MDX files to conditionally display content specific to either the Next.js App Router or Pages Router. This ensures that documentation examples and explanations are relevant to the user's chosen routing paradigm.

```mdx
This content is shared between App and Pages.

<PagesOnly>

This content will only be shown on the Pages docs.

</PagesOnly>

This content is shared between App and Pages.
```

--------------------------------

### Reference Shared Content in Next.js Docs Pages (MDX)

Source: https://nextjs.org/docs/community/contribution-guide

This MDX example shows how a page can consume content from another source page using the 'source' metadata field. This mechanism is crucial for avoiding content duplication, especially for features common to both App and Pages Routers, ensuring that updates to the source content are reflected automatically across all referencing pages.

```mdx
---
title: <Link>
description: API reference for the <Link> component.
source: app/api-reference/components/link
---

{/* DO NOT EDIT THIS PAGE. */}
{/* The content of this page is pulled from the source above. */}
```

--------------------------------

### Update `package.json` Scripts for Next.js Commands

Source: https://nextjs.org/docs/app/guides/migrating/from-create-react-app

Modify the `scripts` section in your `package.json` file to replace Create React App-specific commands with their Next.js equivalents. This includes commands for development (`dev`), building (`build`), and starting the production server (`start`).

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "npx serve@latest ./build"
  }
}
```

--------------------------------

### Install Jest dependencies with yarn

Source: https://nextjs.org/docs/app/guides/testing/jest

Install Jest and required testing libraries as development dependencies for Next.js project using yarn, including jest-environment-jsdom, React Testing Library, and TypeScript support.

```bash
yarn add -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

--------------------------------

### Initialize Next.js App Instance programmatically

Source: https://nextjs.org/docs/app/guides/custom-server

Import the next module and create a new application instance with optional configuration. This instance is required to connect a custom server with the Next.js framework logic.

```javascript
import next from 'next'

const app = next({})
```

--------------------------------

### Install @next/eslint-plugin-next with package managers

Source: https://nextjs.org/docs/app/api-reference/config/eslint

Install the @next/eslint-plugin-next package using various package managers (pnpm, npm, yarn, bun). Use this plugin directly when you have conflicting plugins or custom configurations.

```bash
pnpm add -D @next/eslint-plugin-next
```

```bash
npm i -D @next/eslint-plugin-next
```

```bash
yarn add --dev @next/eslint-plugin-next
```

```bash
bun add -d @next/eslint-plugin-next
```

--------------------------------

### Install Tailwind CSS v3 with npm

Source: https://nextjs.org/docs/app/guides/tailwind-v3-css

Install Tailwind CSS v3, PostCSS, and Autoprefixer as development dependencies using npm, then initialize Tailwind configuration files. This command generates both tailwind.config.js and postcss.config.js automatically.

```bash
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

--------------------------------

### Define npm Scripts for Cypress E2E and Component Testing

Source: https://nextjs.org/docs/app/guides/testing/cypress

This `package.json` snippet provides example npm scripts for running Cypress tests. It includes commands for both end-to-end (E2E) and component tests, differentiating between interactive (`open`) and headless (`run`) modes, making it suitable for both local development and automated CI environments.

```json
{
  "scripts": {
    "e2e": "start-server-and-test dev http://localhost:3000 \"cypress open --e2e\"",
    "e2e:headless": "start-server-and-test dev http://localhost:3000 \"cypress run --e2e\"",
    "component": "cypress open --component",
    "component:headless": "cypress run --component"
  }
}
```

--------------------------------

### Configure Metadata with metadataBase and Resulting HTML Output

Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

This example shows how to define a base URL in a layout or page and how Next.js resolves relative paths into fully qualified URLs in the head section. It covers canonical links, language alternates, and OpenGraph images.

```jsx
export const metadata = {
  metadataBase: new URL('https://acme.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'de-DE': '/de-DE',
    },
  },
  openGraph: {
    images: '/og-image.png',
  },
}
```

```html
<link rel="canonical" href="https://acme.com" />
<link rel="alternate" hreflang="en-US" href="https://acme.com/en-US" />
<link rel="alternate" hreflang="de-DE" href="https://acme.com/de-DE" />
<meta property="og:image" content="https://acme.com/og-image.png" />
```

--------------------------------

### Handling Cookies in Next.js Middleware: After API Change (TypeScript)

Source: https://nextjs.org/docs/messages/middleware-upgrade-guide

This example illustrates the updated Cookies API in Next.js middleware, which now uses a `cookies` instance on `NextResponse` that extends Map. It demonstrates setting cookies with `response.cookies.set`, retrieving cookie details with `response.cookies.getWithOptions`, and deleting cookies with `response.cookies.delete`, aligning with a more consistent `get`/`set` model.

```ts
export function middleware() {
  const response = new NextResponse()

  // set a cookie
  response.cookies.set('vercel', 'fast')

  // set another cookie with options
  response.cookies.set('nextjs', 'awesome', { path: '/test' })

  // get all the details of a cookie
  const { value, ...options } = response.cookies.getWithOptions('vercel')
  console.log(value) // => 'fast'
  console.log(options) // => { name: 'vercel', Path: '/test' }

  // deleting a cookie will mark it as expired
  response.cookies.delete('vercel')

  return response
}
```

--------------------------------

### Install @next/third-parties package with package managers

Source: https://nextjs.org/docs/app/guides/third-party-libraries

Install the @next/third-parties library with the latest version alongside Next.js using various package managers (pnpm, npm, yarn, bun). This library is experimental and recommended to be installed with latest or canary flags.

```bash
pnpm add @next/third-parties@latest next@latest
```

```bash
npm install @next/third-parties@latest next@latest
```

```bash
yarn add @next/third-parties@latest next@latest
```

```bash
bun add @next/third-parties@latest next@latest
```

--------------------------------

### Render Syntax Highlighted Code in a Next.js Client Component

Source: https://nextjs.org/docs/app/guides/package-bundling

This example demonstrates rendering syntax-highlighted code using `prism-react-renderer` within a Next.js Client Component. While functional, it increases the client bundle size as the entire highlighting library is shipped to the client, even for static content.

```tsx
'use client'

import Highlight from 'prism-react-renderer'
import theme from 'prism-react-renderer/themes/github'

export default function Page() {
  const code = `export function hello() {
    console.log("hi")
  }`

  return (
    <article>
      <h1>Blog Post Title</h1>

      {/* The prism package and its tokenization logic are shipped to the client */}
      <Highlight code={code} language="tsx" theme={theme}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={className} style={style}>
            <code>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </article>
  )
}
```

--------------------------------

### Revalidate Cached Data in Route Handler - TypeScript

Source: https://nextjs.org/docs/app/api-reference/functions/revalidatePath

Example of a GET route handler that fetches data with force-cache enabled. This demonstrates how revalidatePath can invalidate cached data accessed within route handlers by targeting the route path.

```typescript
export async function GET() {
  const data = await fetch('https://api.vercel.app/blog', {
    cache: 'force-cache',
  })

  return Response.json(await data.json())
}
```

--------------------------------

### Create a sample React component for testing

Source: https://nextjs.org/docs/app/guides/testing/vitest

A basic Next.js page component used to demonstrate unit testing. It contains a standard heading and a navigation link.

```tsx
import Link from 'next/link'

export default function Page() {
  return (
    <div>
      <h1>Home</h1>
      <Link href="/about">About</Link>
    </div>
  )
}
```

```jsx
import Link from 'next/link'

export default function Page() {
  return (
    <div>
      <h1>Home</h1>
      <Link href="/about">About</Link>
    </div>
  )
}
```

--------------------------------

### Embedding TSX Code Blocks in MDX with Filename

Source: https://nextjs.org/docs/community/contribution-guide

Illustrates the correct syntax for embedding a TypeScript React (TSX) code block within an MDX file, including how to specify the programming language and a `filename` attribute. This ensures proper rendering and context for code examples in the documentation.

```mdx
```tsx filename="app/page.tsx"
export default function Page() {
  return <h1>Hello, Next.js!</h1>
}
```
```

--------------------------------

### Install React Compiler Babel Plugin in Next.js

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler

To enable the React Compiler in your Next.js project, you first need to install the `babel-plugin-react-compiler` package as a development dependency. This plugin is essential for the compiler's functionality.

```pnpm
pnpm add -D babel-plugin-react-compiler
```

```npm
npm install -D babel-plugin-react-compiler
```

```yarn
yarn add -D babel-plugin-react-compiler
```

```bun
bun add -D babel-plugin-react-compiler
```

--------------------------------

### Migrate withAmp to page-level configuration

Source: https://nextjs.org/docs/pages/guides/upgrading/version-9

Manual migration example showing how to replace the withAmp higher-order component with the new exported config object for AMP support.

```javascript
// Before
import { withAmp } from 'next/amp'

function Home() {
  return <h1>My AMP Page</h1>
}

export default withAmp(Home, { hybrid: true })

// After
export default function Home() {
  return <h1>My AMP Page</h1>
}

export const config = {
  amp: 'hybrid',
}
```

--------------------------------

### Install Tailwind CSS v3 with pnpm

Source: https://nextjs.org/docs/app/guides/tailwind-v3-css

Install Tailwind CSS v3, PostCSS, and Autoprefixer as development dependencies using pnpm, then initialize Tailwind configuration files. This command generates both tailwind.config.js and postcss.config.js automatically.

```bash
pnpm add -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

--------------------------------

### Manually Prefetch Routes with Next.js useRouter Hook

Source: https://nextjs.org/docs/app/guides/prefetching

This example illustrates how to programmatically prefetch routes using the `router.prefetch()` method from `next/navigation`. This is useful for warming up routes outside the viewport or based on user interactions like hovering, providing fine-grained control over prefetching behavior.

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { CustomLink } from '@components/link'

export function PricingCard() {
  const router = useRouter()

  return (
    <div onMouseEnter={() => router.prefetch('/pricing')}>
      {/* other UI elements */}
      <CustomLink href="/pricing">View Pricing</CustomLink>
    </div>
  )
}
```

--------------------------------

### Create an MDX page with React components

Source: https://nextjs.org/docs/app/guides/mdx

An example of an MDX file that combines standard Markdown formatting with the ability to import and render custom React components.

```mdx
import { MyComponent } from 'my-component'

# Welcome to my MDX page!

This is some **bold** and _italics_ text.

This is a list in markdown:

- One
- Two
- Three

Checkout my React component:

<MyComponent />
```

--------------------------------

### Install Tailwind CSS v3 with yarn

Source: https://nextjs.org/docs/app/guides/tailwind-v3-css

Install Tailwind CSS v3, PostCSS, and Autoprefixer as development dependencies using yarn, then initialize Tailwind configuration files. This command generates both tailwind.config.js and postcss.config.js automatically.

```bash
yarn add -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

--------------------------------

### Configuring Next.js Build Adapters (Experimental)

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

Demonstrates how to enable and configure the experimental Build Adapters API in `next.config.js` using the `experimental.adapterPath` option. This allows custom build integrations and platform-specific modifications to the Next.js build process.

```javascript
const nextConfig = {
  experimental: {
    adapterPath: require.resolve('./my-adapter.js'),
  },
}

module.exports = nextConfig
```

--------------------------------

### Configure `basePath` in Next.js Configuration (`next.config.mjs`)

Source: https://nextjs.org/docs/pages/guides/migrating/from-vite

Shows how to configure the `basePath` property in `next.config.mjs` using an environment variable. This example also includes `output: 'export'` for Single-Page Application (SPA) export and `distDir` settings, which are common for static site generation.

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Outputs a Single-Page Application (SPA).
  distDir: './dist', // Changes the build output directory to `./dist/`.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH, // Sets the base path to `/some-base-path`.
}

export default nextConfig
```

--------------------------------

### Write a Cypress E2E navigation test script

Source: https://nextjs.org/docs/app/guides/testing/cypress

A sample Cypress test that visits the home page, clicks a link, and asserts that the URL and page content update correctly.

```javascript
describe('Navigation', () => {
  it('should navigate to the about page', () => {
    // Start from the index page
    cy.visit('http://localhost:3000/')

    // Find a link with an href attribute containing "about" and click it
    cy.get('a[href*="about"]').click()

    // The new url should include "/about"
    cy.url().should('include', '/about')

    // The new page should contain an h1 with "About"
    cy.get('h1').contains('About')
  })
})
```

--------------------------------

### Configure Optional Metadata Fields for Next.js Docs Pages (YAML)

Source: https://nextjs.org/docs/community/contribution-guide

This YAML example showcases various optional metadata fields that can be used to enhance Next.js documentation pages. Fields like 'nav_title' override the page title in navigation, 'source' pulls content from another page, 'related' lists linked pages, and 'version' indicates the development stage, offering flexibility in content presentation and management.

```yaml
---
nav_title: Nav Item Title
source: app/building-your-application/optimizing/images
related:
  description: See the image component API reference.
  links:
    - app/api-reference/components/image
version: experimental
---
```

--------------------------------

### Access Cookies in Next.js 'use cache: private' Functions

Source: https://nextjs.org/docs/app/api-reference/directives/use-cache-private

This example illustrates how to retrieve and utilize cookies within an asynchronous function (`getRecommendations`) marked with `'use cache: private'`. It demonstrates using `next/headers` to get the session ID and `next/cache` functions like `cacheTag` and `cacheLife` to manage personalized caching for product recommendations.

```tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag } from 'next/cache'

export async function generateStaticParams() {
  return [{ id: '1' }]
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div>
      <ProductDetails id={id} />
      <Suspense fallback={<div>Loading recommendations...</div>}>
        <Recommendations productId={id} />
      </Suspense>
    </div>
  )
}

async function Recommendations({ productId }: { productId: string }) {
  const recommendations = await getRecommendations(productId)

  return (
    <div>
      {recommendations.map((rec) => (
        <ProductCard key={rec.id} product={rec} />
      ))}
    </div>
  )
}

async function getRecommendations(productId: string) {
  'use cache: private'
  cacheTag(`recommendations-${productId}`)
  cacheLife({ stale: 60 })

  // Access cookies within private cache functions
  const sessionId = (await cookies()).get('session-id')?.value || 'guest'

  return getPersonalizedRecommendations(productId, sessionId)
}
```

```jsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag } from 'next/cache'

export async function generateStaticParams() {
  return [{ id: '1' }]
}

export default async function ProductPage({ params }) {
  const { id } = await params

  return (
    <div>
      <ProductDetails id={id} />
      <Suspense fallback={<div>Loading recommendations...</div>}>
        <Recommendations productId={id} />
      </Suspense>
    </div>
  )
}

async function Recommendations({ productId }) {
  const recommendations = await getRecommendations(productId)

  return (
    <div>
      {recommendations.map((rec) => (
        <ProductCard key={rec.id} product={rec} />
      ))}
    </div>
  )
}

async function getRecommendations(productId) {
  'use cache: private'
  cacheTag(`recommendations-${productId}`)
  cacheLife({ stale: 60 })

  // Access cookies within private cache functions
  const sessionId = (await cookies()).get('session-id')?.value || 'guest'

  return getPersonalizedRecommendations(productId, sessionId)
}
```

--------------------------------

### GET /app/api

Source: https://nextjs.org/docs/app/guides/backend-for-frontend

A basic endpoint demonstrating how to perform a server-side redirect to an external URL using the redirect function.

```APIDOC
## GET /app/api

### Description
Simple Route Handler that performs a redirect to an external website.

### Method
GET

### Endpoint
/app/api

### Response
#### Success Response (307)
- **Location** (header) - Redirects the client to https://nextjs.org/.

#### Response Example
HTTP/1.1 307 Temporary Redirect
Location: https://nextjs.org/
```

--------------------------------

### Example Next.js Server Function Log Output

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/logging

This bash snippet demonstrates the typical output format in the terminal when a Next.js Server Function is invoked and logging is enabled, showing the function name, arguments, and duration.

```bash
POST /
  └─ ƒ myAction(arg1, arg2) in 5ms app/actions.ts
```

--------------------------------

### Extend Jest with Custom DOM Matchers

Source: https://nextjs.org/docs/app/guides/testing/jest

Configures Jest to use @testing-library/jest-dom matchers like .toBeInTheDocument(). This setup involves updating the Jest configuration and creating a setup file to import the library.

```typescript
// jest.config.ts
setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']

// jest.setup.ts
import '@testing-library/jest-dom'
```

```javascript
// jest.config.js
setupFilesAfterEnv: ['<rootDir>/jest.setup.js']

// jest.setup.js
import '@testing-library/jest-dom'
```

--------------------------------

### Install Tailwind CSS and PostCSS dependencies

Source: https://nextjs.org/docs/app/getting-started/css

Install Tailwind CSS and its PostCSS plugin as development dependencies using your preferred package manager.

```bash
pnpm add -D tailwindcss @tailwindcss/postcss
```

```bash
npm install -D tailwindcss @tailwindcss/postcss
```

```bash
yarn add -D tailwindcss @tailwindcss/postcss
```

```bash
bun add -D tailwindcss @tailwindcss/postcss
```

--------------------------------

### Get All Cookies in Next.js Server Components

Source: https://nextjs.org/docs/app/api-reference/functions/cookies

This snippet illustrates how to retrieve all available cookies or cookies matching a specific name within a Next.js Server Component. It utilizes the `cookies()` function to access the cookie store asynchronously and then calls `.getAll()` to fetch an array of cookie objects. The example then maps over these cookies to display their names and values.

```tsx
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  return cookieStore.getAll().map((cookie) => (
    <div key={cookie.name}>
      <p>Name: {cookie.name}</p>
      <p>Value: {cookie.value}</p>
    </div>
  ))
}
```

```jsx
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  return cookieStore.getAll().map((cookie) => (
    <div key={cookie.name}>
      <p>Name: {cookie.name}</p>
      <p>Value: {cookie.value}</p>
    </div>
  ))
}
```

--------------------------------

### Use Tailwind CSS Utility Classes in Next.js - TypeScript

Source: https://nextjs.org/docs/app/guides/tailwind-v3-css

Apply Tailwind CSS utility classes to HTML elements using the className attribute in a Next.js component (TypeScript version). This example demonstrates text sizing, font weight, and text decoration utilities.

```typescript
export default function Page() {
  return <h1 className="text-3xl font-bold underline">Hello, Next.js!</h1>
}
```

--------------------------------

### Add MDX Loader with Babel via Next.js Webpack Configuration

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/webpack

This example demonstrates how to integrate a custom webpack loader, such as `@mdx-js/loader`, into a Next.js project. It shows how to push a new rule to `config.module.rules` and utilize `options.defaultLoaders.babel` to ensure the custom loader works correctly with Next.js's internal Babel setup. This pattern is useful for extending file processing capabilities.

```javascript
// Example config for adding a loader that depends on babel-loader
// This source was taken from the @next/mdx plugin source:
// https://github.com/vercel/next.js/tree/canary/packages/next-mdx
module.exports = {
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.mdx/,
      use: [
        options.defaultLoaders.babel,
        {
          loader: '@mdx-js/loader',
          options: pluginOptions.options,
        },
      ],
    })

    return config
  },
}
```

--------------------------------

### Create Next.js App from GitHub Repository

Source: https://nextjs.org/docs/app/api-reference/cli/create-next-app

Creates a new application based on any public GitHub repository. By providing the repository URL to the --example flag, developers can quickly clone and initialize community-maintained boilerplates or custom templates.

```pnpm
pnpm create next-app --example "https://github.com/.../" [your-project-name]
```

```npm
npx create-next-app@latest --example "https://github.com/.../" [your-project-name]
```

```yarn
yarn create next-app --example "https://github.com/.../" [your-project-name]
```

```bun
bun create next-app --example "https://github.com/.../" [your-project-name]
```

--------------------------------

### Define a basic GET Route Handler in Next.js

Source: https://nextjs.org/docs/app/guides/backend-for-frontend

This snippet shows how to create a simple `GET` Route Handler in Next.js using `route.ts` or `route.js` files. It defines an `export function GET(request: Request)` that will handle `GET` requests to the corresponding API path, such as `/api`. This is the fundamental structure for creating public API endpoints.

```ts
export function GET(request: Request) {}
```

```js
export function GET(request) {}
```

--------------------------------

### View build output for static and partially prerendered routes

Source: https://nextjs.org/docs/app/guides/public-static-pages

Shows the terminal output from running `next build` to verify route prerendering status. The first example shows a fully static route with 15-minute revalidation, while the second shows a partially prerendered route with dynamic server-streamed content, indicated by the ◐ symbol.

```bash
Route (app)      Revalidate  Expire
┌ ○ /products           15m      1y
└ ○ /_not-found

○  (Static)  prerendered as static content
```

```bash
Route (app)      Revalidate  Expire
┌ ◐ /products    15m      1y
└ ◐ /_not-found

◐  (Partial Prerender)  Prerendered as static HTML with dynamic server-streamed content
```

--------------------------------

### Create Next.js Configuration File

Source: https://nextjs.org/docs/app/guides/migrating/from-vite

This step instructs you to create a `next.config.mjs` file at the root of your project to define Next.js configuration options. The example demonstrates how to configure the build output to 'export' for a Single-Page Application (SPA) and specify a custom build directory, `./dist`.

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Outputs a Single-Page Application (SPA).
  distDir: './dist', // Changes the build output directory to `./dist/`.
}

export default nextConfig
```

--------------------------------

### Create Basic Page in Next.js Pages Router

Source: https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts

A page is a React Component exported from a file in the pages directory. This example demonstrates a basic component that becomes accessible at the /about route.

```jsx
export default function About() {
  return <div>About</div>
}
```

--------------------------------

### Phase-based Next.js Configuration

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js

Using the 'phase' argument to apply different configuration settings depending on whether the application is in development, production, or build mode.

```javascript
// @ts-check

const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase, { defaultConfig }) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      /* development only config options here */
    }
  }

  return {
    /* config options for all phases except development here */
  }
}
```

--------------------------------

### Initialize Catch-all Page Component

Source: https://nextjs.org/docs/app/guides/migrating/from-create-react-app

Sets up the initial page component within the catch-all route. It includes generateStaticParams to ensure the root path is prerendered as static HTML while acting as a placeholder for the SPA logic.

```tsx
export function generateStaticParams() {
  return [{ slug: [''] }]
}

export default function Page() {
  return '...' // We'll update this
}
```

```jsx
export function generateStaticParams() {
  return [{ slug: [''] }]
}

export default function Page() {
  return '...' // We'll update this
}
```

--------------------------------

### Manually install latest Next.js and React dependencies

Source: https://nextjs.org/docs/app/getting-started/upgrading

Explicitly install the latest versions of Next.js, React, and related ESLint configurations. This method ensures all core peer dependencies are updated simultaneously across different package managers.

```pnpm
pnpm i next@latest react@latest react-dom@latest eslint-config-next@latest
```

```npm
npm i next@latest react@latest react-dom@latest eslint-config-next@latest
```

```yarn
yarn add next@latest react@latest react-dom@latest eslint-config-next@latest
```

```bun
bun add next@latest react@latest react-dom@latest eslint-config-next@latest
```

--------------------------------

### Install @next/env for external environment loading

Source: https://nextjs.org/docs/app/guides/environment-variables

Install the @next/env package to manually load environment variables in scripts that run outside of the standard Next.js runtime, such as database migrations.

```bash
npm install @next/env
```

```bash
pnpm add @next/env
```

```bash
yarn add @next/env
```

```bash
bun add @next/env
```

--------------------------------

### Implement getStaticPaths and getStaticProps for Dynamic Routes

Source: https://nextjs.org/docs/pages/api-reference/functions/get-static-paths

Demonstrates how to export getStaticPaths to define dynamic routes and getStaticProps to fetch data for each generated page. This example shows a basic implementation fetching repository data from the GitHub API.

```tsx
import type {
  InferGetStaticPropsType,
  GetStaticProps,
  GetStaticPaths,
} from 'next'

type Repo = {
  name: string
  stargazers_count: number
}

export const getStaticPaths = (async () => {
  return {
    paths: [
      {
        params: {
          name: 'next.js',
        },
      }, // See the "paths" section below
    ],
    fallback: true, // false or "blocking"
  }
}) satisfies GetStaticPaths

export const getStaticProps = (async (context) => {
  const res = await fetch('https://api.github.com/repos/vercel/next.js')
  const repo = await res.json()
  return { props: { repo } }
}) satisfies GetStaticProps<{
  repo: Repo
}>

export default function Page({
  repo,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return repo.stargazers_count
}
```

```jsx
export async function getStaticPaths() {
  return {
    paths: [
      {
        params: {
          name: 'next.js',
        },
      }, // See the "paths" section below
    ],
    fallback: true, // false or "blocking"
  }
}

export async function getStaticProps() {
  const res = await fetch('https://api.github.com/repos/vercel/next.js')
  const repo = await res.json()
  return { props: { repo } }
}

export default function Page({ repo }) {
  return repo.stargazers_count
}
```

--------------------------------

### Initialize a Next.js Custom Server with Node.js HTTP

Source: https://nextjs.org/docs/pages/guides/custom-server

This code demonstrates how to programmatically start a Next.js application using a custom Node.js HTTP server. It initializes Next.js in development or production mode, prepares the app, and then creates an HTTP server to handle incoming requests through Next.js's request handler. This approach is used when the default Next.js server doesn't meet specific application requirements.

```typescript
import { createServer } from 'http'
import next from 'next'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res)
  }).listen(port)

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? 'development' : process.env.NODE_ENV
    }`
  )
})

```

```javascript
import { createServer } from 'http'
import next from 'next'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res)
  }).listen(port)

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? 'development' : process.env.NODE_ENV
    }`
  )
})

```

--------------------------------

### Write Next.js Bundle Analysis Output to Disk

Source: https://nextjs.org/docs/app/api-reference/cli/next

Use the `--output` flag with `next experimental-analyze` to write the analysis results to disk without starting a local server. The output is saved to `.next/diagnostics/analyze` and can be copied or shared for comparison or further inspection.

```bash
# Write output to .next/diagnostics/analyze
npx next experimental-analyze --output

# Copy the output for comparison with a future analysis
cp -r .next/diagnostics/analyze ./analyze-before-refactor
```

--------------------------------

### Automate Next.js Adapter Deployment using Bash and Node.js

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/adapterPath

This script prepares a Next.js application for deployment by injecting a local adapter dependency into package.json, setting environment paths, and capturing build metadata for testing purposes.

```bash
node -e "
const pkg=JSON.parse(require('fs').readFileSync('package.json','utf8'));
pkg.dependencies=pkg.dependencies||{};
pkg.dependencies['adapter']='file:${ADAPTER_DIR}';
require('fs').writeFileSync('package.json',JSON.stringify(pkg,null,2));
" >&2

export NEXT_ADAPTER_PATH="${ADAPTER_DIR}/dist/index.js"

BUILD_ID="$(cat .next/BUILD_ID)"
DEPLOYMENT_ID="my-adapter-local"
IMMUTABLE_ASSET_TOKEN="undefined"

{
  echo "BUILD_ID: $BUILD_ID"
  echo "DEPLOYMENT_ID: $DEPLOYMENT_ID"
  echo "IMMUTABLE_ASSET_TOKEN: $IMMUTABLE_ASSET_TOKEN"
} >> .adapter-build.log

pnpm build
provider-cli-to-deploy
```

--------------------------------

### Use Local Images with Query Strings in Next.js

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

Demonstrates how to use local image sources with query strings in Next.js. Local images with query strings now require explicit configuration in localPatterns to prevent enumeration attacks. The example shows using an Image component with a query parameter and the corresponding next.config configuration.

```tsx
import Image from 'next/image'

export default function Page() {
  return <Image src="/assets/photo?v=1" alt="Photo" width="100" height="100" />
}
```

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/assets/**',
        search: '?v=1',
      },
    ],
  },
}

export default nextConfig
```

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/assets/**',
        search: '?v=1',
      },
    ],
  },
}

module.exports = nextConfig
```

--------------------------------

### Configure `sizes` property for responsive `next/legacy/image` in Next.js

Source: https://nextjs.org/docs/pages/api-reference/components/image-legacy

This example demonstrates how to use the `sizes` property with `next/legacy/image` component in a Next.js application. It specifies different image widths (`100vw`, `50vw`, `33vw`) based on viewport breakpoints to optimize image loading and performance for responsive layouts. The `layout="fill"` property is used to ensure the image fills its parent container.

```javascript
import Image from 'next/legacy/image'
const Example = () => (
  <div className="grid-element">
    <Image
      src="/example.png"
      layout="fill"
      sizes="(max-width: 768px) 100vw,
              (max-width: 1200px) 50vw,
              33vw"
    />
  </div>
)
```

--------------------------------

### Start Next.js Development Server

Source: https://nextjs.org/docs/app/guides/mcp

Execute the development command using your preferred package manager. The MCP server requires a running Next.js instance to discover and connect to the application runtime.

```bash
pnpm dev
```

```bash
npm run dev
```

```bash
yarn dev
```

```bash
bun dev
```

--------------------------------

### Initialize Client-Side Instrumentation in Next.js

Source: https://nextjs.org/docs/app/guides/analytics

Sets up global analytics and error tracking using the instrumentation-client file which runs before the frontend code starts executing.

```javascript
// Initialize analytics before the app starts
console.log('Analytics initialized')

// Set up global error tracking
window.addEventListener('error', (event) => {
  // Send to your error tracking service
  reportError(event.error)
})
```

--------------------------------

### Install eslint-config-prettier with package managers

Source: https://nextjs.org/docs/app/api-reference/config/eslint

Install the eslint-config-prettier dependency using various package managers (pnpm, npm, yarn, bun). This package resolves conflicts between ESLint formatting rules and Prettier.

```bash
pnpm add -D eslint-config-prettier
```

```bash
npm i -D eslint-config-prettier
```

```bash
yarn add --dev eslint-config-prettier
```

```bash
bun add -d eslint-config-prettier
```

--------------------------------

### Install OpenTelemetry API in Next.js project

Source: https://nextjs.org/docs/app/guides/open-telemetry

These commands demonstrate how to add the `@opentelemetry/api` package to your Next.js project using different package managers (pnpm, npm, yarn, bun). This package is required to use OpenTelemetry APIs for custom tracing.

```bash
pnpm add @opentelemetry/api
```

```bash
npm install @opentelemetry/api
```

```bash
yarn add @opentelemetry/api
```

```bash
bun add @opentelemetry/api
```

--------------------------------

### Read URL Query Parameters with useSearchParams - TypeScript

Source: https://nextjs.org/docs/app/api-reference/functions/use-search-params

Demonstrates how to use the useSearchParams hook in a TypeScript Client Component to extract and display a search parameter from the URL. The hook returns a read-only URLSearchParams object that provides methods like get() to retrieve specific query parameters. This example shows extracting a 'search' parameter from a URL like /dashboard?search=my-project.

```typescript
'use client'

import { useSearchParams } from 'next/navigation'

export default function SearchBar() {
  const searchParams = useSearchParams()

  const search = searchParams.get('search')

  // URL -> `/dashboard?search=my-project`
  // `search` -> 'my-project'
  return <>Search: {search}</>
}
```

```javascript
'use client'

import { useSearchParams } from 'next/navigation'

export default function SearchBar() {
  const searchParams = useSearchParams()

  const search = searchParams.get('search')

  // URL -> `/dashboard?search=my-project`
  // `search` -> 'my-project'
  return <>Search: {search}</>
}
```

--------------------------------

### Configure Vitest for Next.js

Source: https://nextjs.org/docs/app/guides/testing/vitest

Create a configuration file to define the testing environment. This setup uses jsdom and the React plugin to enable component testing within a Node.js environment.

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
  },
})
```

```javascript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
```

--------------------------------

### Vite Static Image Import Example

Source: https://nextjs.org/docs/app/guides/migrating/from-vite

Illustrates how Vite handles static image imports, where importing an image file returns its public URL as a string. This example shows a basic React component using the imported image URL in an `<img>` tag, typical for a Vite-based application.

```tsx
import image from './img.png' // `image` will be '/assets/img.2d8efhg.png' in production

export default function App() {
  return <img src={image} />
}
```

--------------------------------

### Generate Turbopack Trace for Performance Analysis

Source: https://nextjs.org/docs/app/guides/local-development

Starts the Next.js development server with Turbopack tracing enabled. This command generates a trace file in the .next/dev directory to help identify compilation bottlenecks.

```bash
NEXT_TURBOPACK_TRACING=1 pnpm dev
```

```bash
NEXT_TURBOPACK_TRACING=1 npm run dev
```

```bash
NEXT_TURBOPACK_TRACING=1 yarn dev
```

```bash
NEXT_TURBOPACK_TRACING=1 bun dev
```

--------------------------------

### Enable Caching for Next.js GET Route Handlers

Source: https://nextjs.org/docs/app/guides/upgrading/version-15

This snippet demonstrates how to opt `GET` functions in Next.js Route Handlers into caching. By setting `export const dynamic = 'force-static'` in the Route Handler file, the `GET` method's response will be cached.

```js
export const dynamic = 'force-static'

export async function GET() {}
```

--------------------------------

### Implement a Custom Cache Handler Class

Source: https://nextjs.org/docs/app/guides/self-hosting

Provides a template for a custom cache handler class with methods for getting, setting, and revalidating cache entries using a custom storage backend.

```javascript
const cache = new Map()

module.exports = class CacheHandler {
  constructor(options) {
    this.options = options
  }

  async get(key) {
    // This could be stored anywhere, like durable storage
    return cache.get(key)
  }

  async set(key, data, ctx) {
    // This could be stored anywhere, like durable storage
    cache.set(key, {
      value: data,
      lastModified: Date.now(),
      tags: ctx.tags,
    })
  }

  async revalidateTag(tags) {
    // tags is either a string or an array of strings
    tags = [tags].flat()
    // Iterate over all entries in the cache
    for (let [key, value] of cache) {
      // If the value's tags include the specified tag, delete this entry
      if (value.tags.some((tag) => tags.includes(tag))) {
        cache.delete(key)
      }
    }
  }

  // If you want to have temporary in memory cache for a single request that is reset
  // before the next request you can leverage this method
  resetRequestCache() {}
}
```

--------------------------------

### GET /app/auth/callback

Source: https://nextjs.org/docs/app/guides/backend-for-frontend

Handles the return flow from third-party authentication providers by setting a secure session cookie and redirecting the user.

```APIDOC
## GET /app/auth/callback

### Description
Processes a third-party authentication flow completion, extracts the session token, and redirects the user to their destination.

### Method
GET

### Endpoint
/app/auth/callback

### Parameters
#### Query Parameters
- **session_token** (string) - Required - The token provided by the third-party authentication service.
- **redirect_url** (string) - Required - The URL where the user should be sent after the cookie is set.

### Request Example
GET /app/auth/callback?session_token=xyz789&redirect_url=/dashboard

### Response
#### Success Response (302)
- **Set-Cookie** (header) - Sets a secure, httpOnly cookie named `_token` containing the session token.
- **Location** (header) - Redirects the user to the specified `redirect_url`.

#### Response Example
HTTP/1.1 302 Found
Location: /dashboard
Set-Cookie: _token=xyz789; Path=/; Secure; HttpOnly
```

--------------------------------

### getExpiration() - Get Tag Expiration

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers

Get the maximum revalidation timestamp for a set of tags. Returns 0 if tags were never revalidated, a timestamp representing the most recent revalidation, or Infinity to indicate soft tags should be checked in the get method.

```APIDOC
## GET Tag Expiration

### Description
Get the maximum revalidation timestamp for a set of tags. Used to determine when tags were last revalidated.

### Method Signature
```ts
getExpiration(tags: string[]): Promise<number>
```

### Parameters
#### Required Parameters
- **tags** (string[]) - Array of tags to check expiration for.

### Returns
- **Promise<number>** - Returns one of:
  - 0 if none of the tags were ever revalidated
  - A timestamp (in milliseconds) representing the most recent revalidation
  - Infinity to indicate soft tags should be checked in the get method instead

### Implementation Example
```js
const cacheHandler = {
  async getExpiration(tags) {
    // Return 0 if not tracking tag revalidation
    return 0

    // Or return the most recent revalidation timestamp
    // return Math.max(...tags.map(tag => tagTimestamps.get(tag) || 0));
  },
}
```

### Notes
- If you're not tracking tag revalidation timestamps, return 0
- Find the most recent revalidation timestamp across all provided tags
- Return Infinity if you prefer to handle soft tag checking in the get method
```

--------------------------------

### Create Next.js App with Default Template

Source: https://nextjs.org/docs/app/api-reference/cli/create-next-app

Initializes a new Next.js project using the default template via an interactive CLI. Users can configure essential features like TypeScript, ESLint, Tailwind CSS, and the App Router during the setup process.

```pnpm
pnpm create next-app
```

```npm
npx create-next-app@latest
```

```yarn
yarn create next-app
```

```bun
bun create next-app
```

--------------------------------

### Configure Next.js Asset Prefix and Rewrites for Older Versions

Source: https://nextjs.org/docs/app/guides/multi-zones

For Next.js versions older than 15, an `assetPrefix` alone might not be sufficient to correctly serve static assets in a multi-zone setup. This configuration demonstrates how to combine `assetPrefix` with a `rewrite` rule to ensure that assets prefixed with `/blog-static/_next/` are correctly routed to the internal `/_next/` path of the Next.js application. This ensures proper loading of static files for the zone.

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: '/blog-static',
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/blog-static/_next/:path+',
          destination: '/_next/:path+',
        },
      ],
    }
  },
}
```

--------------------------------

### GET /sitemap.xml (Static File)

Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

For smaller applications, you can create a static `sitemap.xml` file directly in your `app` directory. Next.js will serve this file as your sitemap.

```APIDOC
## GET /sitemap.xml

### Description
This endpoint serves a static sitemap.xml file directly from the `app` directory. It's suitable for smaller applications where the sitemap content is fixed.

### Method
GET

### Endpoint
/sitemap.xml

### Parameters
#### Path Parameters
N/A

#### Query Parameters
N/A

#### Request Body
N/A (The sitemap content is defined by the static file itself)

### Request Example
```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://acme.com</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>yearly</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>https://acme.com/about</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://acme.com/blog</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

### Response
#### Success Response (200)
The response is an XML document conforming to the Sitemaps XML format, listing the URLs of the site.

#### Response Example
```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://acme.com</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>yearly</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>https://acme.com/about</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://acme.com/blog</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```
```

--------------------------------

### Client-side Data Fetching with SWR in React

Source: https://nextjs.org/docs/pages/building-your-application/data-fetching/client-side

This example illustrates client-side data fetching using the SWR React Hook library, which is highly recommended for its built-in caching, revalidation, and other advanced features. It defines a simple `fetcher` function and uses the `useSWR` hook to fetch and manage profile data, automatically handling loading and error states.

```jsx
import useSWR from 'swr'

const fetcher = (...args) => fetch(...args).then((res) => res.json())

function Profile() {
  const { data, error } = useSWR('/api/profile-data', fetcher)

  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.bio}</p>
    </div>
  )
}
```

--------------------------------

### Configure Next.js Link Component for Prefetching with Proxy Rewrites

Source: https://nextjs.org/docs/pages/api-reference/components/link

This example demonstrates how to use the `next/link` component when a Next.js Proxy is involved in URL rewrites. It dynamically sets the `href` prop to the actual target path (e.g., `/auth/dashboard` or `/public/dashboard`) based on authentication status, while the `as` prop maintains the user-facing URL (e.g., `/dashboard`). This ensures correct prefetching and URL display, depending on `next/link` and a custom authentication hook.

```tsx
'use client'

import Link from 'next/link'
import useIsAuthed from './hooks/useIsAuthed' // Your auth hook

export default function Home() {
  const isAuthed = useIsAuthed()
  const path = isAuthed ? '/auth/dashboard' : '/public/dashboard'
  return (
    <Link as="/dashboard" href={path}>
      Dashboard
    </Link>
  )
}
```

```js
'use client'

import Link from 'next/link'
import useIsAuthed from './hooks/useIsAuthed' // Your auth hook

export default function Home() {
  const isAuthed = useIsAuthed()
  const path = isAuthed ? '/auth/dashboard' : '/public/dashboard'
  return (
    <Link as="/dashboard" href={path}>
      Dashboard
    </Link>
  )
}
```

--------------------------------

### Run Next.js standalone server locally

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/output

This command executes the minimal `server.js` file located within the `.next/standalone` directory. This server is generated when the `output` option is set to `'standalone'` and allows running the Next.js application without `next start` or `node_modules`.

```bash
node .next/standalone/server.js
```

--------------------------------

### Create React component for testing

Source: https://nextjs.org/docs/pages/guides/testing/jest

Simple Next.js Home component that renders a heading element. This component serves as the subject for the subsequent test examples demonstrating rendering and snapshot testing.

```jsx
export default function Home() {
  return <h1>Home</h1>
}
```

--------------------------------

### Install Sass Dependency in Next.js

Source: https://nextjs.org/docs/app/guides/sass

This snippet demonstrates how to install the `sass` package as a development dependency in a Next.js project using various package managers like pnpm, npm, yarn, and bun. This is the initial step required to enable Sass styling capabilities within your application.

```bash
pnpm add -D sass
```

```bash
npm install --save-dev sass
```

```bash
yarn add -D sass
```

```bash
bun add -D sass
```

--------------------------------

### Interpret Turbopack Trace Files

Source: https://nextjs.org/docs/app/guides/local-development

Commands to process the generated Turbopack trace file. This starts a local server to visualize the trace data on the official Next.js trace viewer website.

```bash
npx next internal trace .next/dev/trace-turbopack
```

```bash
npx next internal turbo-trace-server .next/dev/trace-turbopack
```

--------------------------------

### Consume SWR data in a Next.js client component (TSX/JSX)

Source: https://nextjs.org/docs/app/guides/single-page-applications

This example demonstrates how a client component uses the `useSWR` hook to fetch or retrieve data. When combined with server-provided `fallback` data from `SWRConfig`, this pattern allows client components to seamlessly access pre-rendered data using their existing SWR logic. The `fetcher` function is provided for client-side fetching, but the component can also leverage data from the server's fallback.

```tsx
'use client';

import useSWR from 'swr';

export function Profile() {
  const fetcher = (url) => fetch(url).then((res) => res.json());
  // The same SWR pattern you already know
  const { data, error } = useSWR('/api/user', fetcher);

  return '...';
}
```

```jsx
'use client';

import useSWR from 'swr';

export function Profile() {
  const fetcher = (url) => fetch(url).then((res) => res.json());
  // The same SWR pattern you already know
  const { data, error } = useSWR('/api/user', fetcher);

  return '...';
}
```

--------------------------------

### Read local files using process.cwd and getStaticProps in Next.js

Source: https://nextjs.org/docs/pages/api-reference/functions/get-static-props

This example demonstrates how to use the Node.js 'fs' and 'path' modules to read files from a local directory during the build process. It utilizes process.cwd() to resolve the base directory correctly across different environments where Next.js is executed.

```jsx
import { promises as fs } from 'fs'
import path from 'path'

// posts will be populated at build time by getStaticProps()
function Blog({ posts }) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.filename}>
          <h3>{post.filename}</h3>
          <p>{post.content}</p>
        </li>
      ))}
    </ul>
  )
}

// This function gets called at build time on server-side.
// It won't be called on client-side, so you can even do
// direct database queries.
export async function getStaticProps() {
  const postsDirectory = path.join(process.cwd(), 'posts')
  const filenames = await fs.readdir(postsDirectory)

  const posts = filenames.map(async (filename) => {
    const filePath = path.join(postsDirectory, filename)
    const fileContents = await fs.readFile(filePath, 'utf8')

    // Generally you would parse/transform the contents
    // For example you can transform markdown to HTML here

    return {
      filename,
      content: fileContents,
    }
  })
  // By returning { props: { posts } }, the Blog component
  // will receive `posts` as a prop at build time
  return {
    props: {
      posts: await Promise.all(posts),
    },
  }
}

export default Blog
```

--------------------------------

### Navigate with dynamic query parameters using Next.js Link href object

Source: https://nextjs.org/docs/pages/api-reference/components/link

This example illustrates how to use an object for the `href` prop to navigate to a path with dynamic query parameters. It allows constructing URLs like `/about?name=test` by specifying `pathname` and `query` properties within the `href` object, providing flexibility for complex routing.

```tsx
import Link from 'next/link'

// Navigate to /about?name=test
export default function Home() {
  return (
    <Link
      href={{
        pathname: '/about',
        query: { name: 'test' },
      }}
    >
      About
    </Link>
  )
}
```

```jsx
import Link from 'next/link'

// Navigate to /about?name=test
export default function Home() {
  return (
    <Link
      href={{
        pathname: '/about',
        query: { name: 'test' },
      }}
    >
      About
    </Link>
  )
}
```

--------------------------------

### Configure Root Layout with Navigation Blocker (Next.js)

Source: https://nextjs.org/docs/app/api-reference/components/link

Demonstrates wrapping the application root with the NavigationBlockerProvider. This setup is required to provide the blocking context to all components within the Next.js App Router.

```tsx
import { NavigationBlockerProvider } from './contexts/navigation-blocker'\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode\n}) {\n  return (
```

--------------------------------

### Basic metadataBase Setup in Next.js Layout

Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

Define the metadataBase property in the root layout to apply a default URL prefix across all application routes. This configuration is essential when using relative paths in metadata to avoid build-time errors.

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://acme.com'),
}
```

```jsx
export const metadata = {
  metadataBase: new URL('https://acme.com'),
}
```

--------------------------------

### Implement Navigation with Prefetching using Next.js Link Component

Source: https://nextjs.org/docs/app/getting-started/linking-and-navigating

This example demonstrates how to use the Next.js Link component within a layout to enable automatic background prefetching. It illustrates the difference between the optimized Link component, which loads route data when the link enters the viewport, and standard HTML anchor tags which do not prefetch.

```tsx
import Link from 'next/link'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <nav>
          {/* Prefetched when the link is hovered or enters the viewport */}
          <Link href="/blog">Blog</Link>
          {/* No prefetching */}
          <a href="/contact">Contact</a>
        </nav>
        {children}
      </body>
    </html>
  )
}
```

```jsx
import Link from 'next/link'

export default function Layout() {
  return (
    <html>
      <body>
        <nav>
          {/* Prefetched when the link is hovered or enters the viewport */}
          <Link href="/blog">Blog</Link>
          {/* No prefetching */}
          <a href="/contact">Contact</a>
        </nav>
        {children}
      </body>
    </html>
  )
}
```

--------------------------------

### PWA Install Prompt with iOS Detection

Source: https://nextjs.org/docs/app/guides/progressive-web-apps

A component that detects if the app is running on iOS or in standalone mode. It provides specific instructions for iOS users to manually add the application to their home screen.

```tsx
function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    )

    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  if (isStandalone) {
    return null // Don't show install button if already installed
  }

  return (
    <div>
      <h3>Install App</h3>
      <button>Add to Home Screen</button>
      {isIOS && (
        <p>
          To install this app on your iOS device, tap the share button
          <span role="img" aria-label="share icon">
            {' '}
            ⎋{' '}
          </span>
          and then "Add to Home Screen"
          <span role="img" aria-label="plus icon">
            {' '}
            ➕{' '}
          </span>
          .
        </p>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <div>
      <PushNotificationManager />
      <InstallPrompt />
    </div>
  )
}
```

```jsx
function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    );

    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  if (isStandalone) {
    return null; // Don't show install button if already installed
  }

  return (
    <div>
      <h3>Install App</h3>
      <button>Add to Home Screen</button>
      {isIOS && (
        <p>
          To install this app on your iOS device, tap the share button
          <span role="img" aria-label="share icon">
            {' '}
            ⎋{' '}
          </span>
          and then "Add to Home Screen"
          <span role="img" aria-label="plus icon">
            {' '}
            ➕{' '}
          </span>
          .
        </p>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <div>
      <PushNotificationManager />
      <InstallPrompt />
    </div>
  );
}
```

--------------------------------

### Fetch Data in Next.js Server Components

Source: https://nextjs.org/docs/app/api-reference/functions/fetch

Demonstrates how to use the extended `fetch` API with `async` and `await` directly within Next.js Server Components to retrieve and render data from an external API. This example fetches blog posts and displays their titles in a list.

```tsx
export default async function Page() {
  let data = await fetch('https://api.vercel.app/blog')
  let posts = await data.json()
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

```jsx
export default async function Page() {
  let data = await fetch('https://api.vercel.app/blog')
  let posts = await data.json()
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

--------------------------------

### Context Provider Setup for Client-Side Authentication

Source: https://nextjs.org/docs/app/guides/authentication

Demonstrates wrapping the application with an authentication context provider in the root layout. This enables Client Components to access session data through context, though Server Components rendered as children will not have access to the context provider's session data.

```typescript
import { ContextProvider } from 'auth-lib'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ContextProvider>{children}</ContextProvider>
      </body>
    </html>
  )
}
```

--------------------------------

### Proxy File Setup and Location

Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy

Instructions for creating and properly locating the proxy.ts or proxy.js file in your Next.js project. The file should be placed at the project root or src directory at the same level as pages or app directories.

```APIDOC
## Proxy File Setup

### Description
Guidelines for creating and placing the proxy file in your Next.js project structure.

### File Location
- **Default location**: Project root directory (same level as `pages` or `app`)
- **Alternative location**: Inside `src` directory (if applicable)
- **File naming**: `proxy.ts` or `proxy.js`

### File Naming with Custom Page Extensions
If you've customized `pageExtensions` configuration, name your proxy file accordingly:
- For `.page.ts` extension: `proxy.page.ts`
- For `.page.js` extension: `proxy.page.js`

### Project Structure Example
```
project-root/
├── app/
│   └── page.tsx
├── proxy.ts          ← Proxy file at root level
└── next.config.js
```

### Alternative Structure with src/
```
project-root/
├── src/
│   ├── app/
│   │   └── page.tsx
│   └── proxy.ts      ← Proxy file in src directory
└── next.config.js
```

### File Requirements
- Must export a proxy function (default or named export)
- Must be at the same level as `pages` or `app` directory
- Respects custom `pageExtensions` configuration
- Optional config object export for matcher configuration

### Notes
- Proxy is meant to be invoked separately from render code
- In optimized cases, can be deployed to CDN for fast redirect/rewrite handling
- Should not rely on shared modules or globals
- Use headers, cookies, rewrites, redirects, or URL to pass information to application
```

--------------------------------

### Configure Cypress scripts in package.json

Source: https://nextjs.org/docs/app/guides/testing/cypress

Add the 'cypress:open' command to your project scripts to facilitate launching the Cypress test runner from the terminal.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "cypress:open": "cypress open"
  }
}
```

--------------------------------

### Advanced Rewrite Configuration with beforeFiles, afterFiles, and Fallback

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites

Configure rewrites with fine-grained control using beforeFiles, afterFiles, and fallback phases. beforeFiles rewrites are checked before static files, afterFiles are checked after static files but before dynamic routes, and fallback rewrites are checked last before rendering 404 pages. This example includes conditional matching with query parameters.

```javascript
module.exports = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/some-page',
          destination: '/somewhere-else',
          has: [{ type: 'query', key: 'overrideMe' }],
        },
      ],
      afterFiles: [
        {
          source: '/non-existent',
          destination: '/somewhere-else',
        },
      ],
      fallback: [
        {
          source: '/:path*',
          destination: `https://my-old-site.com/:path*`,
        },
      ],
    }
  },
}
```

--------------------------------

### Create Basic GET Route Handler in Next.js

Source: https://nextjs.org/docs/app/api-reference/file-conventions/route

Demonstrates a simple GET request handler returning a JSON response using the Web Response API. This is the fundamental building block for creating API endpoints in Next.js.

```typescript
export async function GET() {
  return Response.json({ message: 'Hello World' })
}
```

```javascript
export async function GET() {
  return Response.json({ message: 'Hello World' })
}
```

--------------------------------

### Implement responsive `next/image` with remote URL

Source: https://nextjs.org/docs/app/api-reference/components/image

For images sourced from a remote URL, `next/image` requires explicit `width` and `height` props to calculate the aspect ratio. This example demonstrates how to make such an image responsive by combining these props with `sizes` and `style`, ensuring correct layout and performance.

```jsx
import Image from 'next/image'

export default function Page({ photoUrl }) {
  return (
    <Image
      src={photoUrl}
      alt="Picture of the author"
      sizes="100vw"
      style={{
        width: '100%',
        height: 'auto',
      }}
      width={500}
      height={300}
    />
  )
}
```

--------------------------------

### Load Static and Conditional Polyfills in Next.js

Source: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

Demonstrates how to handle browser compatibility by importing mandatory polyfills statically and loading feature-specific polyfills like ResizeObserver dynamically only when required by the client environment.

```typescript
import './lib/polyfills'

if (!window.ResizeObserver) {
  import('./lib/polyfills/resize-observer').then((mod) => {
    window.ResizeObserver = mod.default
  })
}
```

```javascript
import './lib/polyfills'

if (!window.ResizeObserver) {
  import('./lib/polyfills/resize-observer').then((mod) => {
    window.ResizeObserver = mod.default
  })
}
```

--------------------------------

### Basic Next.js Configuration

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js

Standard configuration export using an object. Supports CommonJS (.js), ESM (.mjs), and TypeScript (.ts) formats for defining application settings.

```javascript
// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
}

module.exports = nextConfig
```

```javascript
// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
}

export default nextConfig
```

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
}

export default nextConfig
```

--------------------------------

### Define Root Layout with manual head tags in Next.js

Source: https://nextjs.org/docs/app/guides/migrating/from-create-react-app

Initial setup of the Root Layout in Next.js, including manual HTML head tags for title and favicon. This structure mimics a traditional React index.html file during the early stages of migration.

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
        <title>React App</title>
        <meta name="description" content="Web site created..." />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
```

```jsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
        <title>React App</title>
        <meta name="description" content="Web site created..." />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
```

--------------------------------

### Implement Basic Client-Side Instrumentation in Next.js

Source: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

This snippet demonstrates how to set up fundamental client-side instrumentation directly within the `instrumentation-client.ts` or `instrumentation-client.js` file. It includes marking application initialization for performance monitoring, initializing analytics services, and setting up a global error listener to report unhandled exceptions. This code executes before the application becomes interactive, capturing early events.

```typescript
// Set up performance monitoring
performance.mark('app-init')

// Initialize analytics
console.log('Analytics initialized')

// Set up error tracking
window.addEventListener('error', (event) => {
  // Send to your error tracking service
  reportError(event.error)
})
```

```javascript
// Set up performance monitoring
performance.mark('app-init')

// Initialize analytics
console.log('Analytics initialized')

// Set up error tracking
window.addEventListener('error', (event) => {
  // Send to your error tracking service
  reportError(event.error)
})
```

--------------------------------

### Optimize Next.js Server Action Return Values (TypeScript)

Source: https://nextjs.org/docs/app/guides/data-security

This snippet demonstrates how to optimize return values from Next.js Server Actions. It contrasts a 'bad' example that returns a full database record, potentially exposing sensitive internal fields, with a 'good' example that returns only a simple success status, ensuring only necessary data is sent to the client.

```tsx
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// BAD: Returns the full database record, which may include
// internal fields the client should not see.
export async function updateUser(data: FormData) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return db.user.update({
    where: { id: session.user.id },
    data: { name: data.get('name') as string },
  })
}

// GOOD: Returns only what the client needs.
export async function updateUserSafe(data: FormData) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  await db.user.update({
    where: { id: session.user.id },
    data: { name: data.get('name') as string },
  })
  return { success: true }
}
```

--------------------------------

### Statically Generate Dynamic GET Route Handlers with `generateStaticParams` (Next.js)

Source: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes

This snippet demonstrates how to implement `generateStaticParams` alongside a `GET` Route Handler in Next.js. `generateStaticParams` fetches a list of blog post IDs at build time, allowing the corresponding API routes to be pre-rendered. The `GET` handler then serves the data for these static paths, while also being capable of dynamically handling requests for IDs not generated at build time.

```typescript
export async function generateStaticParams() {
  const posts: { id: number }[] = await fetch(
    'https://api.vercel.app/blog'
  ).then((res) => res.json())

  return posts.map((post) => ({
    id: `${post.id}`,
  }))
}

export async function GET(
  request: Request,
  { params }: RouteContext<'/api/posts/[id]'>
) {
  const { id } = await params
  const res = await fetch(`https://api.vercel.app/blog/${id}`)

  if (!res.ok) {
    return Response.json({ error: 'Post not found' }, { status: 404 })
  }

  const post = await res.json()
  return Response.json(post)
}
```

```javascript
export async function generateStaticParams() {
  const posts = await fetch('https://api.vercel.app/blog').then((res) =>
    res.json()
  )

  return posts.map((post) => ({
    id: `${post.id}`,
  }))
}

export async function GET(request, { params }) {
  const { id } = await params
  const res = await fetch(`https://api.vercel.app/blog/${id}`)

  if (!res.ok) {
    return Response.json({ error: 'Post not found' }, { status: 404 })
  }

  const post = await res.json()
  return Response.json(post)
}
```

--------------------------------

### Define Basic GET Route Handler in Next.js

Source: https://nextjs.org/docs/app/getting-started/route-handlers

This snippet demonstrates the basic convention for defining a GET request handler in the app directory. It uses the standard Web Request API and can be implemented in either TypeScript or JavaScript.

```typescript
export async function GET(request: Request) {}
```

```javascript
export async function GET(request) {}
```

--------------------------------

### GET /api/search

Source: https://nextjs.org/docs/app/api-reference/file-conventions/route

Explains how to retrieve and handle URL query parameters using the NextRequest instance in a Route Handler.

```APIDOC
## GET /api/search

### Description
Uses the `NextRequest` instance to access convenience methods for handling URL query parameters via `request.nextUrl.searchParams`.

### Method
GET

### Endpoint
/api/search

### Parameters
#### Query Parameters
- **query** (string) - Optional - The search term provided in the URL query string.

### Request Example
GET /api/search?query=hello

### Response
#### Success Response (200)
- **query** (string) - The value of the query parameter extracted from the URL.

#### Response Example
{
  "query": "hello"
}
```

--------------------------------

### Start Next.js dev server with inspect flag - bun

Source: https://nextjs.org/docs/pages/guides/debugging

Launches the Next.js development server with Node.js debugging enabled using bun package manager. The --inspect flag configures the debugger for the underlying runtime.

```bash
bun run dev --inspect
```

--------------------------------

### Restrict External Images by Search Query in Next.js

Source: https://nextjs.org/docs/pages/api-reference/components/image-legacy

Configure remotePatterns to require a specific query string for external images. This example ensures that only images with the exact version parameter are optimized.

```javascript
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.example.com',
        search: '?v=1727111025337',
      },
    ],
  },
}
```

--------------------------------

### Define Next.js Configuration as an Async Function

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js

Introduced in Next.js 12.1.0, this example demonstrates using an `async` function for `next.config.js`. This enables asynchronous operations within the configuration logic, such as fetching data or performing other async tasks before returning the configuration object.

```javascript
// @ts-check

module.exports = async (phase, { defaultConfig }) => {
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    /* config options here */
  }
  return nextConfig
}
```

--------------------------------

### Run Jest Tests via CLI

Source: https://nextjs.org/docs/app/guides/testing/jest

Commands to execute the test suite using different JavaScript package managers.

```bash
# pnpm
pnpm test

# npm
npm run test

# yarn
yarn test

# bun
bun run test
```

--------------------------------

### Exposing Environment Variables to Client Components

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

Explains the use of the NEXT_PUBLIC_ prefix in environment variables to make them accessible within 'use client' components, replacing publicRuntimeConfig.

```bash
NEXT_PUBLIC_API_URL="/api"
```

```typescript
'use client'

export default function ClientComponent() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  return <p>API URL: {apiUrl}</p>
}
```

--------------------------------

### Regex Path Matching with Numeric Constraints

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites

Demonstrates regex-based path matching using parenthesis notation to constrain parameter values. In this example, the pattern only matches numeric post IDs with one or more digits.

```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/old-blog/:post(\\d{1,})',
        destination: '/blog/:post', // Matched parameters can be used in the destination
      },
    ]
  },
}
```

--------------------------------

### Install Next.js 13 using package managers

Source: https://nextjs.org/docs/pages/guides/upgrading/version-13

Commands to upgrade Next.js, React, and ESLint configurations to version 13. This ensures the project meets the minimum version requirements for the Next.js 13 environment.

```bash
npm i next@13 react@latest react-dom@latest eslint-config-next@13
```

```bash
yarn add next@13 react@latest react-dom@latest eslint-config-next@13
```

```bash
pnpm i next@13 react@latest react-dom@latest eslint-config-next@13
```

```bash
bun add next@13 react@latest react-dom@latest eslint-config-next@13
```

--------------------------------

### Configure tsconfig.json for Next.js Compatibility

Source: https://nextjs.org/docs/app/guides/migrating/from-vite

A complete tsconfig.json example optimized for Next.js. It includes the 'next' plugin, enables esModuleInterop, sets the react-jsx transform, and configures appropriate include/exclude paths.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["./src", "./dist/types/**/*.ts", "./next-env.d.ts"],
  "exclude": ["./node_modules"]
}
```

--------------------------------

### Analyze Next.js Bundle Output with `next experimental-analyze`

Source: https://nextjs.org/docs/app/api-reference/cli/next

This command analyzes your application's bundle output using Turbopack, helping you understand the size and composition of JavaScript, CSS, and other assets. It does not produce an application build. By default, it starts a local server to explore bundle composition in the browser.

```bash
pnpm next experimental-analyze
```

```bash
npx next experimental-analyze
```

```bash
yarn next experimental-analyze
```

```bash
bunx next experimental-analyze
```

--------------------------------

### Generate VAPID Keys using web-push CLI

Source: https://nextjs.org/docs/app/guides/progressive-web-apps

This command uses the globally installed `web-push` CLI to generate a pair of VAPID public and private keys. These keys are crucial for authenticating your application with push services and should be securely stored, typically in environment variables.

```bash
web-push generate-vapid-keys
```

--------------------------------

### Using Statically Imported Image Source with Next.js Image Component

Source: https://nextjs.org/docs/app/api-reference/components/image

This example demonstrates importing an image directly as a module and passing it to the `src` prop. This method automatically infers `width` and `height`, making it convenient for local images.

```jsx
import profile from './profile.png'

export default function Page() {
  return <Image src={profile} />
}
```

--------------------------------

### Deprecated Multi-Module Pattern in next/dynamic

Source: https://nextjs.org/docs/messages/next-dynamic-modules

This example illustrates the legacy method of loading multiple components using the 'modules' property and a custom render function. This pattern is deprecated and should be refactored to ensure future compatibility.

```jsx
import dynamic from 'next/dynamic'

const HelloBundle = dynamic({
  modules: () => {
    const components = {
      Hello1: () => import('../components/hello1').then((m) => m.default),
      Hello2: () => import('../components/hello2').then((m) => m.default),
    }

    return components
  },
  render: (props, { Hello1, Hello2 }) => (
    <div>
      <h1>{props.title}</h1>
      <Hello1 />
      <Hello2 />
    </div>
  ),
})

function DynamicBundle() {
  return <HelloBundle title="Dynamic Bundle" />
}

export default DynamicBundle
```

--------------------------------

### Configure `basePath` in `next.config.mjs` for Next.js

Source: https://nextjs.org/docs/app/guides/migrating/from-vite

Shows how to configure the `basePath` property in `next.config.mjs` using an environment variable. This example also includes common configurations for `output` and `distDir` when exporting a Next.js application as a Single-Page Application (SPA).

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Outputs a Single-Page Application (SPA).
  distDir: './dist', // Changes the build output directory to './dist/'.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH, // Sets the base path to `/some-base-path`.
}

export default nextConfig
```

--------------------------------

### Integrate Client Context Provider into Next.js Server Layout

Source: https://nextjs.org/docs/app/getting-started/server-and-client-components

This example shows how a Next.js Server Component, specifically a `RootLayout`, can import and render a Client Component (`ThemeProvider`) that provides React Context. By wrapping `children` with the `ThemeProvider`, all client components within the layout can consume the provided context, while the layout itself remains a Server Component.

```typescript
import ThemeProvider from './theme-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

```javascript
import ThemeProvider from './theme-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

--------------------------------

### GET /_next/static/

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/deploymentId

Next.js automatically manages asset versioning and headers when a deploymentId is configured.

```APIDOC
## GET /_next/static/

### Description
When deploymentId is set, Next.js appends a query parameter to static assets and includes specific headers in navigation requests to prevent version skew.

### Method
GET

### Endpoint
/_next/static/[asset-path]

### Parameters
#### Query Parameters
- **dpl** (string) - Required - The deployment ID appended to static asset URLs for cache busting.

#### Response Headers
- **x-nextjs-deployment-id** (string) - The deployment ID of the server instance responding to the request.
- **x-deployment-id** (string) - The deployment ID sent by the client in navigation requests.

### Request Example
GET /_next/static/css/main.css?dpl=my-deployment-id

### Response
#### Success Response (200)
- **data-dpl-id** (attribute) - Injected into the <html> element to track the current deployment version on the client.
```

--------------------------------

### Dynamic Functional Configuration

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js

Configuring Next.js using a function that provides access to the current phase and default configuration. This approach supports asynchronous logic and environment-specific branching.

```javascript
// @ts-check

export default (phase, { defaultConfig }) => {
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    /* config options here */
  }
  return nextConfig
}
```

```javascript
// @ts-check

module.exports = async (phase, { defaultConfig }) => {
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    /* config options here */
  }
  return nextConfig
}
```

--------------------------------

### Adding Single and Multi-line Notes in MDX

Source: https://nextjs.org/docs/community/contribution-guide

Demonstrates the syntax for creating both single-line and multi-line 'Good to know' notes within MDX files. This feature is used to provide important but non-critical information to the reader without distracting from the main content.

```mdx
> **Good to know**: This is a single line note.

> **Good to know**:
>
> - We also use this format for multi-line notes.
> - There are sometimes multiple items worth knowing or keeping in mind.
```

--------------------------------

### Create Next.js App with yarn

Source: https://nextjs.org/docs/app/api-reference/cli/create-next-app

Initialize a new Next.js application using yarn package manager. Provides an alternative package management approach for Next.js project setup.

```bash
yarn create next-app [project-name] [options]
```

--------------------------------

### Install Next.js 9 using various package managers

Source: https://nextjs.org/docs/pages/guides/upgrading/version-9

Commands to upgrade the Next.js package to version 9 using npm, yarn, pnpm, or bun.

```bash
npm i next@9
```

```bash
yarn add next@9
```

```bash
pnpm up next@9
```

```bash
bun add next@9
```

--------------------------------

### Create Static GET Route Handler in Next.js Export Mode

Source: https://nextjs.org/docs/app/guides/backend-for-frontend

Implements a GET Route Handler configured for static generation in export mode using the 'force-static' dynamic setting. This handler returns a simple text response and can be used to generate static HTML, JSON, TXT, or other files at build time without requiring a runtime server.

```typescript
export const dynamic = 'force-static'

export function GET() {
  return new Response('Hello World', { status: 200 })
}
```

--------------------------------

### GET /api/project-info

Source: https://nextjs.org/docs/app/getting-started/route-handlers

A static route handler that returns project information. This endpoint is prerendered at build time as it does not access runtime data.

```APIDOC
## GET /api/project-info

### Description
A static route handler that returns project information. It is prerendered at build time.

### Method
GET

### Endpoint
/api/project-info

### Parameters
None

### Response
#### Success Response (200)
- **projectName** (string) - The name of the project.

### Response Example
{
  "projectName": "Next.js"
}
```

--------------------------------

### Load Next.js Environment Variables for Testing with Jest/Cypress

Source: https://nextjs.org/docs/app/guides/environment-variables

This JavaScript snippet demonstrates how to programmatically load Next.js environment variables, including those from `.env.test`, into a testing environment. It uses the `loadEnvConfig` function from the `@next/env` package to ensure tests run with the same environment configuration as Next.js, typically placed in a Jest global setup file or similar testing setup.

```js
import { loadEnvConfig } from '@next/env'

export default async () => {
  const projectDir = process.cwd()
  loadEnvConfig(projectDir)
}
```

--------------------------------

### Configure Wildcard Path Matching for Next.js Headers

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers

This example shows how to use wildcard parameters, like `:slug*`, in the `source` property to match paths with zero or more segments. This is useful for matching nested paths (e.g., `/blog/a/b/c`). Similar to regular parameters, the matched wildcard value can be incorporated into the header `key` and `value` for dynamic header generation.

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/blog/:slug*',
        headers: [
          {
            key: 'x-slug',
            value: ':slug*', // Matched parameters can be used in the value
          },
          {
            key: 'x-slug-:slug*', // Matched parameters can be used in the key
            value: 'my other custom header value',
          },
        ],
      },
    ]
  },
}
```

--------------------------------

### Integrate Next.js Navigation Events Component into Root Layout

Source: https://nextjs.org/docs/app/api-reference/functions/use-router

This example shows how to embed the `NavigationEvents` client component into a Next.js root layout (`app/layout.js`). It highlights the importance of wrapping such components in a `Suspense` boundary to handle client-side rendering during prerendering, especially when using hooks like `useSearchParams`.

```jsx
import { Suspense } from 'react'
import { NavigationEvents } from './components/navigation-events'

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}

        <Suspense fallback={null}>
          <NavigationEvents />
        </Suspense>
      </body>
    </html>
  )
}
```

--------------------------------

### Accessing User-Agent in Next.js Middleware: After Helper (TypeScript)

Source: https://nextjs.org/docs/messages/middleware-upgrade-guide

This example demonstrates the new recommended way to access user agent details in Next.js middleware using the `userAgent` helper imported from `next/server`. This helper reduces middleware bundle size by allowing developers to opt-in to user agent parsing. It shows how to destructure device information to determine the viewport and modify the URL.

```ts
import { NextRequest, NextResponse, userAgent } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const { device } = userAgent(request)
  const viewport = device.type === 'mobile' ? 'mobile' : 'desktop'
  url.searchParams.set('viewport', viewport)
  return NextResponse.rewrite(url)
}
```

--------------------------------

### Configure Jest with Next.js using TypeScript

Source: https://nextjs.org/docs/app/guides/testing/jest

Set up Jest configuration file in TypeScript format using next/jest transformer, which automatically handles Next.js-specific configuration including transforms, mocking, and environment setup.

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
```

--------------------------------

### GET /items/[slug]

Source: https://nextjs.org/docs/app/api-reference/file-conventions/route

Demonstrates how to use dynamic route segments to capture parameters from the URL path in Next.js Route Handlers.

```APIDOC
## GET /items/[slug]

### Description
Route Handlers can use Dynamic Segments to create request handlers from dynamic data. This endpoint captures a 'slug' from the URL path.

### Method
GET

### Endpoint
/items/[slug]

### Parameters
#### Path Parameters
- **slug** (string) - Required - The dynamic segment of the URL (e.g., 'a', 'b', or 'c').

### Request Example
GET /items/a

### Response
#### Success Response (200)
- **params** (object) - An object containing the dynamic route parameters.

#### Response Example
{
  "slug": "a"
}
```

--------------------------------

### Applying a Shared Layout Component within an MDX File

Source: https://nextjs.org/docs/pages/guides/mdx

This example demonstrates how to import a previously defined shared layout component directly into an MDX file and wrap the MDX content with it. This method ensures that the specific MDX page inherits the structure and styling provided by the layout.

```mdx
import MdxLayout from '../components/mdx-layout'

# Welcome to my MDX page!

export default function MDXPage({ children }) {
  return <MdxLayout>{children}</MdxLayout>

}
```

--------------------------------

### GET /api/og (Image Generation)

Source: https://nextjs.org/docs/app/api-reference/functions/image-response

Utilize the ImageResponse constructor within a Route Handler to dynamically generate PNG images from JSX elements.

```APIDOC
## GET /api/og

### Description
Generates dynamic images using JSX and CSS. This is typically implemented in Route Handlers to create social media assets like Open Graph images.

### Method
GET

### Endpoint
/api/route.js (or any custom route path)

### Parameters
#### Constructor Arguments
- **element** (ReactElement) - Required - The JSX element to render into an image.
- **options** (Object) - Optional - Configuration for the image and HTTP response.

#### Options Object
- **width** (number) - Optional - Image width. Default: 1200.
- **height** (number) - Optional - Image height. Default: 630.
- **emoji** (string) - Optional - Emoji set to use ('twemoji' | 'blobmoji' | 'noto' | 'openmoji'). Default: 'twemoji'.
- **fonts** (Array) - Optional - Array of font objects containing name, data (ArrayBuffer), weight, and style.
- **debug** (boolean) - Optional - Enable debug mode for layout. Default: false.
- **status** (number) - Optional - HTTP response status code. Default: 200.
- **statusText** (string) - Optional - HTTP response status text.
- **headers** (Record) - Optional - Custom HTTP headers for the response.

### Request Example
```javascript
import { ImageResponse } from 'next/og';

export async function GET() {
  return new ImageResponse(
    (
      <div style={{ fontSize: 40, color: 'black', background: 'white', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Hello World
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

### Response
#### Success Response (200)
- **Content-Type** (image/png) - The generated image file.

#### Response Example
[Binary PNG Data]
```

--------------------------------

### Generate Bundle Report with @next/bundle-analyzer

Source: https://nextjs.org/docs/pages/guides/package-bundling

Run this command to initiate bundle analysis using the `@next/bundle-analyzer` plugin. By setting `ANALYZE=true`, the plugin configured in `next.config.js` activates, generating and opening visual reports of your bundles in new browser tabs for inspection.

```bash
ANALYZE=true npm run build
```

```bash
ANALYZE=true yarn build
```

```bash
ANALYZE=true pnpm build
```

--------------------------------

### Configure Jest with Next.js using JavaScript

Source: https://nextjs.org/docs/app/guides/testing/jest

Set up Jest configuration file in JavaScript format using next/jest transformer, which automatically handles Next.js-specific configuration including transforms, mocking, and environment setup.

```javascript
const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config)
```

--------------------------------

### GET /api/users/[id]

Source: https://nextjs.org/docs/app/getting-started/route-handlers

A dynamic route handler that uses path parameters to retrieve specific user data.

```APIDOC
## GET /api/users/[id]

### Description
Retrieves information for a specific user based on the ID provided in the URL path.

### Method
GET

### Endpoint
/api/users/[id]

### Parameters
#### Path Parameters
- **id** (string) - Required - The unique identifier of the user.

### Response
#### Success Response (200)
- **id** (string) - The identifier of the user returned.

### Response Example
{
  "id": "user_12345"
}
```

--------------------------------

### Dynamic route with getStaticProps and getStaticPaths in Next.js

Source: https://nextjs.org/docs/pages/building-your-application/rendering/static-site-generation

Combines getStaticPaths and getStaticProps for dynamic routes to prerender individual posts. getStaticPaths specifies which post IDs to prerender, while getStaticProps fetches the data for each specific post at build time.

```jsx
export default function Post({ post }) {
  // Render post...
}

export async function getStaticPaths() {
  // ...
}

// This also gets called at build time
export async function getStaticProps({ params }) {
  // params contains the post `id`.
  // If the route is like /posts/1, then params.id is 1
  const res = await fetch(`https://.../posts/${params.id}`)
  const post = await res.json()

  // Pass post data to the page via props
  return { props: { post } }
}
```

--------------------------------

### GET /api/products

Source: https://nextjs.org/docs/app/getting-started/route-handlers

A cached route handler that performs a database query but uses 'use cache' to allow the response to be prerendered and revalidated.

```APIDOC
## GET /api/products

### Description
Fetches a list of products from the database. Uses caching to optimize performance and allow prerendering.

### Method
GET

### Endpoint
/api/products

### Parameters
None

### Response
#### Success Response (200)
- **Array** (object[]) - A list of product objects.

### Response Example
[
  {
    "id": 1,
    "name": "Product A"
  },
  {
    "id": 2,
    "name": "Product B"
  }
]
```

--------------------------------

### HOOK modifyConfig

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/adapterPath

An asynchronous lifecycle hook that allows an adapter to modify the Next.js configuration object before the build starts.

```APIDOC
## HOOK modifyConfig

### Description
Called for any CLI command that loads the next.config.js file to allow programmatic modification of the configuration based on the build phase.

### Method
ASYNC HOOK

### Parameters
#### Request Body
- **config** (NextConfigComplete) - Required - The complete Next.js configuration object.
- **context.phase** (string) - Required - The current build phase (e.g., phase-production-build).
- **context.nextVersion** (string) - Required - The version of Next.js currently running.

### Request Example
{
  "config": {},
  "context": {
    "phase": "phase-production-build",
    "nextVersion": "16.2.1"
  }
}

### Response
#### Success Response (200)
- **config** (NextConfigComplete) - The modified configuration object to be used by Next.js.
```

--------------------------------

### GET /app/webhook

Source: https://nextjs.org/docs/app/guides/backend-for-frontend

Receives event notifications from third-party applications (like a CMS) to trigger route revalidation based on a cache tag.

```APIDOC
## GET /app/webhook

### Description
Receives event notifications from third-party applications to revalidate a route when content changes in a CMS.

### Method
GET

### Endpoint
/app/webhook

### Parameters
#### Query Parameters
- **token** (string) - Required - Security token to authorize the revalidation request.
- **tag** (string) - Required - The cache tag to be revalidated.

### Request Example
GET /app/webhook?token=MY_SECRET_TOKEN&tag=collection

### Response
#### Success Response (200)
- **success** (boolean) - Indicates if the revalidation was successful.

#### Response Example
{
  "success": true
}

#### Error Response (401)
- **success** (boolean) - False if the token is invalid.

#### Error Response (400)
- **success** (boolean) - False if the tag parameter is missing.
```

--------------------------------

### Opt Out of Next.js Fetch Memoization

Source: https://nextjs.org/docs/app/api-reference/functions/fetch

Explains how to bypass the automatic memoization of `GET` requests in Next.js Server Components. By passing an `AbortController` signal to the `fetch` options, the request will execute every time instead of sharing results.

```js
const { signal } = new AbortController()
fetch(url, { signal })
```

--------------------------------

### Proxy Authentication

Source: https://nextjs.org/docs/app/guides/backend-for-frontend

Implement authentication checks in the proxy function to validate requests before they reach API routes. This example demonstrates how to return a 401 Unauthorized response when authentication fails.

```APIDOC
## Proxy Authentication

### Description
Intercept incoming requests and validate authentication before allowing them to proceed to route handlers.

### Configuration
- **File**: `proxy.ts` or `proxy.js`
- **Matcher**: `/api/:function*` - targets all API routes
- **Export**: `config` object with matcher pattern and `proxy` function

### Parameters
#### Request Object
- **request** (Request) - Required - The incoming HTTP request object

### Proxy Function
```ts
export const config = {
  matcher: '/api/:function*',
}

export function proxy(request: Request) {
  if (!isAuthenticated(request)) {
    return Response.json(
      { success: false, message: 'authentication failed' },
      { status: 401 }
    )
  }
}
```

### Response
#### Unauthorized Response (401)
- **success** (boolean) - false
- **message** (string) - 'authentication failed'

#### Response Example
```json
{
  "success": false,
  "message": "authentication failed"
}
```
```

--------------------------------

### Generate bundle report with @next/bundle-analyzer

Source: https://nextjs.org/docs/app/guides/package-bundling

These commands trigger a build process with the `ANALYZE` environment variable set to 'true', activating the `@next/bundle-analyzer` plugin. This generates a visual report of the application's bundle sizes, which can be used for optimization.

```bash
ANALYZE=true npm run build
```

```bash
ANALYZE=true yarn build
```

--------------------------------

### Combine Static, Cached, and Streaming Content in Next.js

Source: https://nextjs.org/docs/app/getting-started/caching

This complete example shows how to build a page with static headers, cached data fetching using the 'use cache' directive, and dynamic streaming for user-specific data using Suspense. It also features a Server Action that uses 'updateTag' to revalidate cached content.

```tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag, updateTag } from 'next/cache'
import Link from 'next/link'

export default function BlogPage() {
  return (
    <>
      {/* Static content - prerendered automatically */}
      <header>
        <h1>Our Blog</h1>
        <nav>
          <Link href="/">Home</Link> | <Link href="/about">About</Link>
        </nav>
      </header>

      {/* Cached dynamic content - included in the static shell */}
      <BlogPosts />

      {/* Runtime dynamic content - streams at request time */}
      <Suspense fallback={<p>Loading your preferences...</p>}>
        <UserPreferences />
      </Suspense>

      {/* Mutation - server action that revalidates the cache */}
      <Suspense fallback={<p>Loading...</p>}>
        <CreatePost />
      </Suspense>
    </>
  )
}

// Everyone sees the same blog posts (revalidated every hour)
async function BlogPosts() {
  'use cache'
  cacheLife('hours')
  cacheTag('posts')

  const res = await fetch('https://api.vercel.app/blog')
  const posts = await res.json()

  return (
    <section>
      <h2>Latest Posts</h2>
      <ul>
        {posts.slice(0, 5).map((post: any) => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>
              By {post.author} on {post.date}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Personalized per user based on their cookie
async function UserPreferences() {
  const theme = (await cookies()).get('theme')?.value || 'light'
  const favoriteCategory = (await cookies()).get('category')?.value

  return (
    <aside>
      <p>Your theme: {theme}</p>
      {favoriteCategory && <p>Favorite category: {favoriteCategory}</p>}
    </aside>
  )
}

// Admin-only form that creates a post and revalidates the cache
async function CreatePost() {
  const isAdmin = (await cookies()).get('role')?.value === 'admin'
  if (!isAdmin) return null

  async function createPost(formData: FormData) {
    'use server'
    await db.post.create({ data: { title: formData.get('title') } })
    updateTag('posts')
  }

  return (
    <form action={createPost}>
      <input name="title" placeholder="Post title" required />
      <button type="submit">Publish</button>
    </form>
  )
}
```

--------------------------------

### Create a Dynamic GET Route Handler with Non-Deterministic Operations in Next.js

Source: https://nextjs.org/docs/app/getting-started/route-handlers

This snippet illustrates a GET Route Handler that includes a non-deterministic operation, `Math.random()`. When such operations are present, Next.js stops prerendering during the build process and defers the route to request-time rendering, ensuring dynamic content.

```tsx
export async function GET() {
  return Response.json({
    randomNumber: Math.random(),
  })
}
```

--------------------------------

### Migrating experimental.dynamicIO to cacheComponents

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

Illustrates the configuration update required in next.config.js to replace the deprecated experimental.dynamicIO flag with the new cacheComponents flag.

```javascript
// Next.js 15 - experimental.dynamicIO is now removed
module.exports = {
  experimental: {
    dynamicIO: true,
  },
}
```

```javascript
// Next.js 16 - use cacheComponents instead
module.exports = {
  cacheComponents: true,
}
```

--------------------------------

### Manually Upgrade Next.js and React Dependencies

Source: https://nextjs.org/docs/app/guides/upgrading/version-15

Manually install the latest versions of Next.js, React, React DOM, and ESLint configurations to meet the requirements for version 15.

```pnpm
pnpm add next@latest react@latest react-dom@latest eslint-config-next@latest
```

```npm
npm install next@latest react@latest react-dom@latest eslint-config-next@latest
```

```yarn
yarn add next@latest react@latest react-dom@latest eslint-config-next@latest
```

```bun
bun add next@latest react@latest react-dom@latest eslint-config-next@latest
```

--------------------------------

### Implement getStaticProps for Build-Time Data Fetching in Next.js

Source: https://nextjs.org/docs/pages/api-reference/functions/get-static-props

This example demonstrates how to use `getStaticProps` in Next.js to fetch data at build time. The function fetches repository information from the GitHub API and passes it as props to the page component. Imports within `getStaticProps` are not bundled for the client-side, allowing for direct server-side code execution.

```tsx
import type { InferGetStaticPropsType, GetStaticProps } from 'next'

type Repo = {
  name: string
  stargazers_count: number
}

export const getStaticProps = (async (context) => {
  const res = await fetch('https://api.github.com/repos/vercel/next.js')
  const repo = await res.json()
  return { props: { repo } }
}) satisfies GetStaticProps<{
  repo: Repo
}>

export default function Page({
  repo,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return repo.stargazers_count
}
```

```jsx
export async function getStaticProps() {
  const res = await fetch('https://api.github.com/repos/vercel/next.js')
  const repo = await res.json()
  return { props: { repo } }
}

export default function Page({ repo }) {
  return repo.stargazers_count
}
```

--------------------------------

### Migrate Next.js Middleware for authorization: Before and After

Source: https://nextjs.org/docs/messages/middleware-upgrade-guide

These TypeScript examples demonstrate the migration path for handling authorization in Next.js Middleware. The 'Before' snippet shows a deprecated pattern of directly returning a JSON response for authentication failure. The 'After' snippet illustrates the recommended approach of redirecting unauthenticated users to a login page, aligning with Middleware's role in rewriting or redirecting requests.

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAuthValid } from './lib/auth'

export function middleware(request: NextRequest) {
  // Example function to validate auth
  if (isAuthValid(request)) {
    return NextResponse.next()
  }

  return NextResponse.json({ message: 'Auth required' }, { status: 401 })
}
```

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAuthValid } from './lib/auth'

export function middleware(request: NextRequest) {
  // Example function to validate auth
  if (isAuthValid(request)) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', request.nextUrl.pathname)

  return NextResponse.redirect(loginUrl)
}
```

--------------------------------

### Update `bundlePagesRouterDependencies` in Next.js Config

Source: https://nextjs.org/docs/app/guides/upgrading/version-15

This example demonstrates the renaming of the `experimental.bundlePagesExternals` configuration option to its stable counterpart, `bundlePagesRouterDependencies`, in `next.config.js` for Next.js applications.

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Before
  experimental: {
    bundlePagesExternals: true,
  },

  // After
  bundlePagesRouterDependencies: true,
}

module.exports = nextConfig
```

--------------------------------

### Implement Static Data Fetching in Next.js App Directory

Source: https://nextjs.org/docs/pages/guides/migrating/app-router-migration

Demonstrates how to perform static data fetching in the app directory using the fetch API with default caching. This replaces the getStaticProps pattern by leveraging Server Components and the force-cache default.

```jsx
// `app` directory

// This function can be named anything
async function getProjects() {
  const res = await fetch(`https://...`)
  const projects = await res.json()

  return projects
}

export default async function Index() {
  const projects = await getProjects()

  return projects.map((project) => <div>{project.name}</div>)
}
```

--------------------------------

### Migrated Nested Layouts (After Migration)

Source: https://nextjs.org/docs/pages/guides/migrating/app-router-migration

The modern approach to layouts in the app directory, utilizing separate page.js and layout.js files. This example shows how to use a Client Component for layout logic while maintaining a Server Component for the layout wrapper.

```jsx
// app/dashboard/page.js
export default function Page() {
  return <p>My Page</p>
}

// app/dashboard/DashboardLayout.js
'use client'

export default function DashboardLayout({ children }) {
  return (
    <div>
      <h2>My Dashboard</h2>
      {children}
    </div>
  )
}

// app/dashboard/layout.js
import DashboardLayout from './DashboardLayout'

export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
```

--------------------------------

### Display Next.js System and Environment Information

Source: https://nextjs.org/docs/app/api-reference/cli/next

The `next info` command outputs crucial details about the current system and Next.js environment. This information is valuable for debugging and reporting issues, including OS, Node.js, npm, Yarn, pnpm versions, and installed Next.js related package versions. The `--verbose` option can be used to collect additional diagnostic data.

```bash
next info
```

--------------------------------

### Replace NextRequest Geo and IP with @vercel/functions

Source: https://nextjs.org/docs/app/guides/upgrading/codemods

Installs @vercel/functions and migrates 'geo' and 'ip' property access on NextRequest to use standalone geolocation and ipAddress utility functions.

```bash
npx @next/codemod@latest next-request-geo-ip .
```

```ts
// Before transformation
import type { NextRequest } from 'next/server'

export function GET(req: NextRequest) {
  const { geo, ip } = req
}
```

```ts
// After transformation
import type { NextRequest } from 'next/server'
import { geolocation, ipAddress } from '@vercel/functions'

export function GET(req: NextRequest) {
  const geo = geolocation(req)
  const ip = ipAddress(req)
}
```

--------------------------------

### Defining a Root Layout for Next.js Application

Source: https://nextjs.org/docs/app/api-reference/file-conventions/layout

This example shows how to define the top-most root layout for a Next.js application, located in the `app` directory. It is responsible for rendering the `<html>` and `<body>` tags and wrapping the entire application's content (`children`), establishing global UI structure.

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

```jsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

--------------------------------

### Enabling Next.js Draft Mode in a Route Handler

Source: https://nextjs.org/docs/app/api-reference/functions/draft-mode

Provides an example of a Next.js Route Handler that imports `draftMode` and calls its `enable()` method to activate Draft Mode, typically used for content preview workflows.

```tsx
import { draftMode } from 'next/headers'

export async function GET(request: Request) {
  const draft = await draftMode()
  draft.enable()
  return new Response('Draft mode is enabled')
}
```

```js
import { draftMode } from 'next/headers'

export async function GET(request) {
  const draft = await draftMode()
  draft.enable()
  return new Response('Draft mode is enabled')
}
```

--------------------------------

### Configure Local Fonts in Next.js

Source: https://nextjs.org/docs/app/api-reference/components/font

Import and initialize local fonts using next/font/local. This setup allows you to specify font files within your project directory and apply them to your layout.

```tsx
import localFont from 'next/font/local'

// Font files can be colocated inside of `app`
const myFont = localFont({
  src: './my-font.woff2',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={myFont.className}>
      <body>{children}</body>
    </html>
  )
}
```

```jsx
import localFont from 'next/font/local'

// Font files can be colocated inside of `app`
const myFont = localFont({
  src: './my-font.woff2',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={myFont.className}>
      <body>{children}</body>
    </html>
  )
}
```

--------------------------------

### Create Dynamic Next.js API Routes with URL Parameters

Source: https://nextjs.org/docs/pages/building-your-application/routing/api-routes

This example illustrates how to implement dynamic API routes in Next.js, following the same file naming conventions as dynamic pages. It demonstrates how to access dynamic parameters from the URL using `req.query` and respond with content based on these parameters, enabling flexible API endpoints.

```ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { pid } = req.query
  res.end(`Post: ${pid}`)
}
```

```js
export default function handler(req, res) {
  const { pid } = req.query
  res.end(`Post: ${pid}`)
}
```

--------------------------------

### Get Maximum Revalidation Timestamp with getExpiration() Method

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers

Returns the maximum revalidation timestamp for a set of tags. Returns 0 if tags were never revalidated, a timestamp in milliseconds for the most recent revalidation, or Infinity to defer soft tag checking to the get method. Used to determine cache expiration based on tag revalidation history.

```typescript
getExpiration(tags: string[]): Promise<number>
```

```javascript
const cacheHandler = {
  async getExpiration(tags) {
    // Return 0 if not tracking tag revalidation
    return 0

    // Or return the most recent revalidation timestamp
    // return Math.max(...tags.map(tag => tagTimestamps.get(tag) || 0));
  },
}
```

--------------------------------

### PREFETCH router.prefetch()

Source: https://nextjs.org/docs/app/api-reference/functions/use-router

Prefetches the provided route for faster client-side transitions.

```APIDOC
## PREFETCH router.prefetch()

### Description
Prefetch the provided route for faster client-side transitions. Includes an optional callback for when data becomes stale.

### Method
PREFETCH

### Endpoint
router.prefetch(href: string, options?: { onInvalidate?: () => void })

### Parameters
#### Arguments
- **href** (string) - Required - The URL to prefetch.
- **onInvalidate** (function) - Optional - Callback triggered when prefetched data becomes stale.

### Request Example
```javascript
router.prefetch('/settings', { onInvalidate: () => console.log('Stale!') });
```

### Response
#### Success Response (200)
- **void** - This method does not return a value.
```

--------------------------------

### Copy Next.js Bundle Analyzer output for comparison

Source: https://nextjs.org/docs/app/guides/package-bundling

This command copies the generated bundle analysis directory to a new location. This allows users to archive or compare different analysis reports, for instance, to track changes in bundle size over time or across different code versions.

```bash
cp -r .next/diagnostics/analyze ./analyze-before-refactor
```

--------------------------------

### Removed Next.js AMP Hook and Page Configuration

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

Shows examples of `next/amp` hook imports (`useAmp`) and page-level `config.amp` exports that are no longer supported in Next.js 16 due to the complete removal of AMP functionality. These constructs should be removed from your codebase.

```tsx
// Removed
import { useAmp } from 'next/amp'

// Removed
export const config = { amp: true }
```

--------------------------------

### Display Video from Vercel Blob using React Suspense

Source: https://nextjs.org/docs/app/guides/videos

This example demonstrates how to fetch a video URL from Vercel Blob storage and render it in a Next.js page. It utilizes React Suspense to provide a fallback UI while the asynchronous blob metadata is being retrieved.

```jsx
import { Suspense } from 'react'
import { list } from '@vercel/blob'

export default function Page() {
  return (
    <Suspense fallback={<p>Loading video...</p>}>
      <VideoComponent fileName="my-video.mp4" />
    </Suspense>
  )
}

async function VideoComponent({ fileName }) {
  const { blobs } = await list({
    prefix: fileName,
    limit: 1,
  })
  const { url } = blobs[0]

  return (
    <video controls preload="none" aria-label="Video player">
      <source src={url} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}
```

--------------------------------

### Configure Next.js Middleware with a matcher for specific paths

Source: https://nextjs.org/docs/messages/middleware-upgrade-guide

This TypeScript example demonstrates how to define a Next.js Middleware that applies to specific routes using the `matcher` configuration. It rewrites requests to `/about/:path*` and `/dashboard/:path*` to `/about-2`. The `matcher` config is preferred for performance as it avoids invoking the Middleware on every request.

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.rewrite(new URL('/about-2', request.url))
}

// Supports both a single string value or an array of matchers
export const config = {
  matcher: ['/about/:path*', '/dashboard/:path*'],
}
```

--------------------------------

### GET Route Handler with Tag Revalidation - Next.js

Source: https://nextjs.org/docs/app/api-reference/functions/revalidateTag

Implements a GET route handler that accepts a 'tag' query parameter and revalidates cached content associated with that tag using Next.js revalidateTag function. Returns JSON response indicating revalidation status and current timestamp. Requires the tag parameter; returns error message if missing.

```typescript
import type { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get('tag')

  if (tag) {
    revalidateTag(tag, 'max')
    return Response.json({ revalidated: true, now: Date.now() })
  }

  return Response.json({
    revalidated: false,
    now: Date.now(),
    message: 'Missing tag to revalidate',
  })
}
```

```javascript
import { revalidateTag } from 'next/cache'

export async function GET(request) {
  const tag = request.nextUrl.searchParams.get('tag')

  if (tag) {
    revalidateTag(tag, 'max')
    return Response.json({ revalidated: true, now: Date.now() })
  }

  return Response.json({
    revalidated: false,
    now: Date.now(),
    message: 'Missing tag to revalidate',
  })
}
```

--------------------------------

### Optimize Next.js bundle size by isolating Client Components

Source: https://nextjs.org/docs/app/getting-started/server-and-client-components

This example illustrates how to reduce the client-side JavaScript bundle size by applying 'use client' only to specific interactive components, such as a search bar, while keeping the surrounding layout as a Server Component. This ensures that only the necessary interactive parts are rendered on the client, improving performance.

```tsx
// Client Component
import Search from './search'
// Server Component
import Logo from './logo'

// Layout is a Server Component by default
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav>
        <Logo />
        <Search />
      </nav>
      <main>{children}</main>
    </>
  )
}
```

```jsx
// Client Component
import Search from './search'
// Server Component
import Logo from './logo'

// Layout is a Server Component by default
export default function Layout({ children }) {
  return (
    <>
      <nav>
        <Logo />
        <Search />
      </nav>
      <main>{children}</main>
    </>
  )
}
```

```tsx
'use client'

export default function Search() {
  // ...
}
```

```jsx
'use client'

export default function Search() {
  // ...
}
```

--------------------------------

### Track Performance Metrics with Performance Observer in Next.js

Source: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

Uses the Performance Observer API to calculate Time to Interactive by monitoring navigation timing entries. It also provides a utility to mark the start of router transitions using performance marks.

```typescript
const startTime = performance.now()

const observer = new PerformanceObserver(
  (list: PerformanceObserverEntryList) => {
    for (const entry of list.getEntries()) {
      if (entry instanceof PerformanceNavigationTiming) {
        console.log('Time to Interactive:', entry.loadEventEnd - startTime)
      }
    }
  }
)

observer.observe({ entryTypes: ['navigation'] })

export function onRouterTransitionStart(url: string) {
  performance.mark(`nav-start-${url}`)
}
```

```javascript
const startTime = performance.now()

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry instanceof PerformanceNavigationTiming) {
      console.log('Time to Interactive:', entry.loadEventEnd - startTime)
    }
  }
})

observer.observe({ entryTypes: ['navigation'] })

export function onRouterTransitionStart(url) {
  performance.mark(`nav-start-${url}`)
}
```

--------------------------------

### Using LayoutProps Helper for Type-Safe Layouts in Next.js

Source: https://nextjs.org/docs/app/api-reference/file-conventions/layout

This example demonstrates the use of the global `LayoutProps` helper to provide strong typing for layout components in Next.js. It infers types for `children` and named slots (like `analytics`) based on the directory structure, enhancing type safety without requiring explicit imports after type generation.

```tsx
export default function Layout(props: LayoutProps<'/dashboard'>) {
  return (
    <section>
      {props.children}
      {/* If you have app/dashboard/@analytics, it appears as a typed slot: */}
      {/* {props.analytics} */}
    </section>
  )
}
```

--------------------------------

### Create Catch-all Entrypoint Page in Next.js

Source: https://nextjs.org/docs/app/guides/migrating/from-vite

Sets up an optional catch-all route segment to handle all application paths as a Single Page Application (SPA). It uses generateStaticParams to define the initial index route.

```typescript
import '../../index.css'

export function generateStaticParams() {
  return [{ slug: [''] }]
}

export default function Page() {
  return '...' // We'll update this
}
```

```javascript
import '../../index.css'

export function generateStaticParams() {
  return [{ slug: [''] }]
}

export default function Page() {
  return '...' // We'll update this
}
```

--------------------------------

### GET /api/user-agent

Source: https://nextjs.org/docs/app/getting-started/route-handlers

A dynamic route handler that accesses request-specific header data using the Next.js headers() API.

```APIDOC
## GET /api/user-agent

### Description
Retrieves the User-Agent string from the incoming request headers.

### Method
GET

### Endpoint
/api/user-agent

### Parameters
None

### Response
#### Success Response (200)
- **userAgent** (string) - The user agent string extracted from the request headers.

### Response Example
{
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
}
```

--------------------------------

### Install Next.js 11 with bun

Source: https://nextjs.org/docs/pages/guides/upgrading/version-11

Upgrade Next.js to version 11 along with React 17 using bun package manager. This command updates the core Next.js framework and React dependencies to their version 11 and 17 releases respectively.

```bash
bun add next@11 react@17 react-dom@17
```

--------------------------------

### Configure lazyRoot with React component in Next.js Image component

Source: https://nextjs.org/docs/pages/api-reference/components/image-legacy

This example shows how to use the `lazyRoot` prop with a custom React component that forwards its ref. The `Container` component receives a ref and passes it to its underlying `div`, allowing `Image` components to use it for lazy loading within a custom scrollable container.

```jsx
import Image from 'next/legacy/image'
import React from 'react'

const Container = React.forwardRef((props, ref) => {
  return (
    <div ref={ref} style={{ overflowX: 'scroll', width: '500px' }}>
      {props.children}
    </div>
  )
})

const Example = () => {
  const lazyRoot = React.useRef(null)

  return (
    <Container ref={lazyRoot}>
      <Image lazyRoot={lazyRoot} src="/one.jpg" width="500" height="500" />
      <Image lazyRoot={lazyRoot} src="/two.jpg" width="500" height="500" />
    </Container>
  )
}
```

--------------------------------

### Hoisting Data Fetching in Next.js Root Layout

Source: https://nextjs.org/docs/app/guides/single-page-applications

Initiates a server-side data fetch in the root layout without awaiting the Promise. This allows Next.js to start streaming the response early and prevents client-side waterfalls by passing the Promise to a provider.

```tsx
import { UserProvider } from './user-provider'
import { getUser } from './user' // some server-side function

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let userPromise = getUser() // do NOT await

  return (
    <html lang="en">
      <body>
        <UserProvider userPromise={userPromise}>{children}</UserProvider>
      </body>
    </html>
  )
}
```

```jsx
import { UserProvider } from './user-provider'
import { getUser } from './user' // some server-side function

export default function RootLayout({ children }) {
  let userPromise = getUser() // do NOT await

  return (
    <html lang="en">
      <body>
        <UserProvider userPromise={userPromise}>{children}</UserProvider>
      </body>
    </html>
  )
}
```

--------------------------------

### Create Next.js App with bun

Source: https://nextjs.org/docs/app/api-reference/cli/create-next-app

Initialize a new Next.js application using bun package manager. Bun is a fast JavaScript runtime and package manager alternative.

```bash
bun create next-app [project-name] [options]
```

--------------------------------

### Embed external platform videos using iframes in Next.js

Source: https://nextjs.org/docs/app/guides/videos

This example shows how to embed video content from external hosting providers like YouTube or Vimeo using the <iframe> tag. This approach is ideal for offloading video hosting and processing to specialized third-party services.

```jsx
export default function Page() {
  return (
    <iframe src="https://www.youtube.com/embed/19g66ezsKAg" allowFullScreen />
  )
}
```

--------------------------------

### Implement Resource Hints with ReactDOM in Next.js Client Components

Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

This client component demonstrates using `ReactDOM.preload`, `ReactDOM.preconnect`, and `ReactDOM.prefetchDNS` methods. These functions allow developers to safely insert resource hints into the document's `<head>`, addressing scenarios where the Next.js Metadata API lacks direct support for specific `<link>` attributes.

```tsx
'use client'

import ReactDOM from 'react-dom'

export function PreloadResources() {
  ReactDOM.preload('...', { as: '...' })
  ReactDOM.preconnect('...', { crossOrigin: '...' })
  ReactDOM.prefetchDNS('...')

  return '...'
}
```

```jsx
'use client'

import ReactDOM from 'react-dom'

export function PreloadResources() {
  ReactDOM.preload('...', { as: '...' })
  ReactDOM.preconnect('...', { crossOrigin: '...' })
  ReactDOM.prefetchDNS('...')

  return '...'
}
```

--------------------------------

### Enable React Compiler in Next.js Configuration

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler

After installing the Babel plugin, enable the React Compiler by setting the `reactCompiler` option to `true` in your `next.config.js` or `next.config.ts` file. This tells Next.js to apply the compiler's optimizations.

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
}

export default nextConfig
```

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
}

module.exports = nextConfig
```

--------------------------------

### Configure Next.js Tracing with `src/` Directory Paths

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/output

This example illustrates how `outputFileTracingIncludes` and `outputFileTracingExcludes` work when a `src/` directory is used. Route keys remain the same, but file glob patterns in the values can reference paths under `src/` as they are resolved relative to the project root. This allows for organized file management within the `src/` structure.

```javascript
module.exports = {
  outputFileTracingIncludes: {
    '/products/*': ['src/lib/payments/**/*'],
    '/*': ['src/config/runtime/**/*.json'],
  },
  outputFileTracingExcludes: {
    '/api/*': ['src/temp/**/*', 'public/large-logs/**/*'],
  },
}
```

--------------------------------

### Run ESLint CLI

Source: https://nextjs.org/docs/app/api-reference/config/eslint

Execute the ESLint command-line interface to analyze the project for potential issues based on the configured rules.

```bash
pnpm exec eslint .
```

```bash
npx eslint .
```

```bash
yarn eslint .
```

```bash
bunx eslint .
```

--------------------------------

### Configure VAPID Keys in Next.js .env File

Source: https://nextjs.org/docs/app/guides/progressive-web-apps

This example shows how to store the generated VAPID public and private keys in your Next.js project's `.env` file. These environment variables (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`) are then accessed by the `web-push` library to authenticate push notification requests.

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

--------------------------------

### Deprecated Next.js Middleware response body patterns

Source: https://nextjs.org/docs/messages/middleware-upgrade-guide

This JavaScript example lists patterns for creating response bodies in Next.js Middleware that are no longer supported. Middleware can no longer produce a response body, and attempting to do so will result in a runtime error. Developers should migrate to `rewrite` or `redirect`.

```js
new Response('a text value')
new Response(streamOrBuffer)
new Response(JSON.stringify(obj), { headers: 'application/json' })
NextResponse.json()
```

--------------------------------

### Import testing-library jest-dom custom matchers

Source: https://nextjs.org/docs/pages/guides/testing/jest

Import @testing-library/jest-dom in the Jest setup file to enable custom matchers like .toBeInTheDocument() across all tests. For versions before 6.0, use the extend-expect import path instead.

```typescript
import '@testing-library/jest-dom'
```

```javascript
import '@testing-library/jest-dom'
```

--------------------------------

### GET /api/random-number

Source: https://nextjs.org/docs/app/getting-started/route-handlers

A dynamic route handler that generates a random number. Prerendering is deferred to request-time due to the use of non-deterministic operations.

```APIDOC
## GET /api/random-number

### Description
Generates a random number at request time using non-deterministic operations.

### Method
GET

### Endpoint
/api/random-number

### Parameters
None

### Response
#### Success Response (200)
- **randomNumber** (number) - A randomly generated numeric value.

### Response Example
{
  "randomNumber": 0.842157
}
```

--------------------------------

### Run Next.js CLI commands using various package managers

Source: https://nextjs.org/docs/app/api-reference/cli/next

Demonstrates the basic syntax for executing Next.js CLI commands with pnpm, npm, yarn, and bun. This command allows you to specify a Next.js command and any additional options. Note that npm requires `--` before CLI flags for forwarding.

```bash
pnpm next [command] [options]
```

```bash
npx next [command] [options]
```

```bash
yarn next [command] [options]
```

```bash
bunx next [command] [options]
```

--------------------------------

### Use generateStaticParams with Route Handlers in Next.js

Source: https://nextjs.org/docs/app/api-reference/functions/generate-static-params

Illustrates how to statically generate API responses for specific IDs at build time by combining generateStaticParams with a GET Route Handler.

```ts
export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }]
}

export async function GET(
  request: Request,
  { params }: RouteContext<'/api/posts/[id]'>
) {
  const { id } = await params
  // This will be statically generated for IDs 1, 2, and 3
  return Response.json({ id, title: `Post ${id}` })
}
```

```js
export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }]
}

export async function GET(request, { params }) {
  const { id } = await params
  // This will be statically generated for IDs 1, 2, and 3
  return Response.json({ id, title: `Post ${id}` })
}
```

--------------------------------

### Cache Handler Method: get()

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/incrementalCacheHandlerPath

Retrieves a cached value using a specified key and context. The `ctx` parameter provides information about the type of cache entry.

```APIDOC
## get()

### Description
Retrieves a cached value using a specified key and context. The `ctx` parameter contains a `kind` property that indicates the type of cache entry being retrieved.

### Method
get

### Parameters
#### Method Parameters
- **key** (string) - Required - The key to the cached value.
- **ctx** (object) - Required - Context including the cache entry kind. Possible values for `ctx.kind` include `'APP_PAGE'`, `'APP_ROUTE'`, `'PAGES'`, `'FETCH'`, and `'IMAGE'`.

### Request Example
```json
{
  "key": "my-page-cache-key",
  "ctx": {
    "kind": "APP_PAGE"
  }
}
```

### Response
#### Success Response
- **Cached Value** (any) - The cached value associated with the key, or `null` if not found.

#### Response Example
```json
{
  "value": {
    "html": "<html>...</html>",
    "kind": "APP_PAGE",
    "status": 200
  }
}
```
Or `null` if the key is not found.
```

--------------------------------

### Parallel Data Fetching with Promise.all in JavaScript

Source: https://nextjs.org/docs/app/getting-started/fetching-data

Implements parallel data fetching in JavaScript by initiating multiple fetch requests simultaneously and awaiting them together with Promise.all. This pattern optimizes performance by starting all requests at once rather than waiting for each to complete sequentially.

```jsx
import Albums from './albums'

async function getArtist(username) {
  const res = await fetch(`https://api.example.com/artist/${username}`)
  return res.json()
}

async function getAlbums(username) {
  const res = await fetch(`https://api.example.com/artist/${username}/albums`)
  return res.json()
}

export default async function Page({ params }) {
  const { username } = await params

  // Initiate requests
  const artistData = getArtist(username)
  const albumsData = getAlbums(username)

  const [artist, albums] = await Promise.all([artistData, albumsData])

  return (
    <>
      <h1>{artist.name}</h1>
      <Albums list={albums} />
    </>
  )
}
```

--------------------------------

### Initialize OpenTelemetry NodeSDK with OTLP Exporter

Source: https://nextjs.org/docs/app/guides/open-telemetry

Manually set up the OpenTelemetry NodeSDK by defining service resources and span processors. This configuration uses the OTLPTraceExporter to send telemetry data to a compatible backend.

```typescript
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'next-app',
  }),
  spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
})
sdk.start()
```

```javascript
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'next-app',
  }),
  spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
})
sdk.start()
```

--------------------------------

### Start Next.js dev server with inspect flag - yarn

Source: https://nextjs.org/docs/pages/guides/debugging

Launches the Next.js development server with Node.js debugging enabled using yarn package manager. Enables connection to Node.js debugger for server-side code inspection.

```bash
yarn dev --inspect
```

--------------------------------

### Upgrade Next.js to version 12 using package managers

Source: https://nextjs.org/docs/pages/guides/upgrading/version-12

Commands to install Next.js 12 along with compatible versions of React 17 and the ESLint configuration for Next.js. Choose the command based on your project's package manager.

```bash
npm i next@12 react@17 react-dom@17 eslint-config-next@12
```

```bash
yarn add next@12 react@17 react-dom@17 eslint-config-next@12
```

```bash
pnpm up next@12 react@17 react-dom@17 eslint-config-next@12
```

```bash
bun add next@12 react@17 react-dom@17 eslint-config-next@12
```

--------------------------------

### Install Next.js canary version for early feature access

Source: https://nextjs.org/docs/app/getting-started/upgrading

Update to the canary release to test upcoming features like auth interrupts and new file conventions. It is recommended to ensure your application is stable on the latest release before switching to canary.

```pnpm
pnpm add next@canary
```

```npm
npm i next@canary
```

```yarn
yarn add next@canary
```

```bun
bun add next@canary
```

--------------------------------

### Set allowedDevOrigins in next.config.js

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins

Configures the Next.js development server to permit requests from specific external origins or wildcards. This is essential when testing with custom local domains or proxy setups.

```javascript
module.exports = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
}
```

--------------------------------

### Migrate from images.domains to images.remotePatterns in Next.js Config

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

This snippet demonstrates how to transition from the deprecated `images.domains` configuration to the more secure and flexible `images.remotePatterns` in your `next.config.js` file. `remotePatterns` allows for more granular control over allowed image sources, including protocol and hostname.

```javascript
// image.domains is deprecated
module.exports = {
  images: {
    domains: ['example.com'],
  },
}
```

```javascript
// Use image.remotePatterns instead
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
}
```

--------------------------------

### GET /sitemap.xml (Programmatic Generation)

Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

For dynamic sitemaps, create a `sitemap.js` or `sitemap.ts` file that exports a default function returning an array of URL objects. Next.js will generate the `sitemap.xml` based on this function's output.

```APIDOC
## GET /sitemap.xml

### Description
This endpoint serves a dynamically generated sitemap.xml file. The content is produced by a `sitemap.js` or `sitemap.ts` file that exports a function returning an array of URL objects.

### Method
GET

### Endpoint
/sitemap.xml

### Parameters
#### Path Parameters
N/A

#### Query Parameters
N/A

#### Request Body
N/A (The sitemap content is generated by server-side code)

### Request Example
```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://acme.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: 'https://acme.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://acme.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]
}
```

### Response
#### Success Response (200)
The response is an XML document generated from the array of URL objects returned by the `sitemap.js` or `sitemap.ts` function.

#### Response Example
```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://acme.com</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>yearly</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>https://acme.com/about</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://acme.com/blog</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```
```

--------------------------------

### Configure Remark and Rehype Plugins in Next.js

Source: https://nextjs.org/docs/app/guides/mdx

Set up remark and rehype plugins in next.config.mjs to transform MDX content. This example enables GitHub Flavored Markdown support using remark-gfm. Requires ESM configuration file format and the @next/mdx package.

```javascript
import remarkGfm from 'remark-gfm'
import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow .mdx extensions for files
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // Optionally, add any other Next.js config below
}

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
})

// Combine MDX and Next.js config
export default withMDX(nextConfig)
```

--------------------------------

### Correctly Using Next.js Head Component in _document.js

Source: https://nextjs.org/docs/messages/no-duplicate-head

This example demonstrates the correct implementation of the `Head` component within `pages/_document.js` in a Next.js application. It shows how to define a custom `Document` class and render a single `Head` component to avoid duplicate usage errors and ensure proper application behavior.

```jsx
import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    //...
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
```

--------------------------------

### Start Next.js dev server with inspect flag - npm

Source: https://nextjs.org/docs/pages/guides/debugging

Launches the Next.js development server with Node.js debugging enabled using npm package manager. The --inspect flag enables debugger listening on the default port 9229.

```bash
npm run dev -- --inspect
```

--------------------------------

### Example Next.js Browser Console Log Output in Terminal

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/logging

This bash snippet illustrates how a browser `console.log` message, originating from a client component, appears in the development terminal when `browserToTerminal` logging is active, including its source file and line number.

```bash
[browser] Hello World (app/page.tsx:8:17)
```

--------------------------------

### Create Optional Catch-all Route Directory Structure

Source: https://nextjs.org/docs/app/guides/migrating/from-create-react-app

Defines the file system layout required to intercept all routes in a Next.js App Router project. This structure uses an optional catch-all segment to map various paths to a single page file.

```bash
app
 ┣ [[...slug]]
 ┃ ┗ page.tsx
 ┣ layout.tsx
```

--------------------------------

### Configure VSCode User Settings for MDX Markdown Preview

Source: https://nextjs.org/docs/community/contribution-guide

This JSON snippet configures VSCode's user settings to associate `.mdx` files with the `markdown` language mode. This enables the built-in Markdown previewer for MDX files, allowing contributors to preview their documentation changes locally within the editor before submission.

```json
{
  "files.associations": {
    "*.mdx": "markdown"
  }
}
```

--------------------------------

### Copy Static Assets to Standalone Directory

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/output

Uses the shell copy command to manually move public and static asset folders into the standalone directory, as the minimal server does not include them by default.

```bash
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
```

--------------------------------

### Implement Next.js Internationalized Routing with proxy.js

Source: https://nextjs.org/docs/app/guides/internationalization

This `proxy.js` example demonstrates how to redirect incoming requests to include a locale in the URL path. It checks if the pathname already contains a supported locale; if not, it determines the preferred locale (e.g., using `getLocale` function) and redirects the request to a new URL with the locale prefix. The `config.matcher` ensures the proxy runs on relevant paths, excluding internal Next.js routes.

```javascript
import { NextResponse } from "next/server";

let locales = ['en-US', 'nl-NL', 'nl']

// Get the preferred locale, similar to the above or using a library
function getLocale(request) { /* ... */ }

export function proxy(request) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  // Redirect if there is no locale
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  // e.g. incoming request is /products
  // The new URL is now /en-US/products
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next).*),'
    // Optional: only run on root (/) URL
    // '/'
  ],
}
```

--------------------------------

### Disable Next.js Image Optimization using unoptimized prop

Source: https://nextjs.org/docs/messages/no-img-element

This example shows how to use the `next/image` component while explicitly disabling its automatic image optimization. By passing the `unoptimized` prop, developers can still utilize other `next/image` features like blur-up placeholders without the performance benefits of optimization, useful for specific hosting or custom optimization scenarios.

```jsx
import Image from 'next/image'

const UnoptimizedImage = (props) => {
  return <Image {...props} unoptimized />
}
```

--------------------------------

### Unit Test next.config.js using unstable_getResponseFromNextConfig

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js

This snippet demonstrates how to unit test redirects within a Next.js configuration file using experimental testing utilities. It simulates a request to a specific URL and validates the resulting status code and redirect destination.

```javascript
import {
  getRedirectUrl,
  unstable_getResponseFromNextConfig,
} from 'next/experimental/testing/server'

const response = await unstable_getResponseFromNextConfig({
  url: 'https://nextjs.org/test',
  nextConfig: {
    async redirects() {
      return [{ source: '/test', destination: '/test2', permanent: false }]
    },
  },
})
expect(response.status).toEqual(307)
expect(getRedirectUrl(response)).toEqual('https://nextjs.org/test2')
```

--------------------------------

### Create static sitemap.xml file

Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

Defines a manual XML sitemap for smaller applications. This file should be placed in the root of the app directory and follow the standard Sitemaps XML protocol.

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://acme.com</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>yearly</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>https://acme.com/about</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://acme.com/blog</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

--------------------------------

### Next.js Middleware to Proxy Function Renaming Example

Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy

Illustrates the change in function signature and file name when migrating from the old 'middleware.ts' to the new 'proxy.ts' convention in Next.js. The 'middleware' function is renamed to 'proxy'.

```diff
// middleware.ts -> proxy.ts

- export function middleware() {
+ export function proxy() {
```

--------------------------------

### Example Next.js Client Component with Console Log

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/logging

This `tsx` code snippet shows a simple Next.js client component that includes a `console.log` statement within an `onClick` handler. When `browserToTerminal` logging is enabled, this log will be forwarded to the development terminal.

```tsx
'use client'

export default function Home() {
  return (
    <button
      type="button"
      onClick={() => {
        console.log('Hello World')
      }}
    >
      Click me
    </button>
  )
}
```

--------------------------------

### Set PORT environment variable for Next.js dev and start

Source: https://nextjs.org/docs/pages/guides/upgrading/version-11

Use the PORT environment variable to specify the port for Next.js development or production server. This provides an alternative to using the -p/--port command-line flag.

```bash
PORT=4000 next start
```

--------------------------------

### Implement inline navigation feedback with useLinkStatus

Source: https://nextjs.org/docs/app/api-reference/functions/use-link-status

This example shows how to create a Hint component that uses the useLinkStatus hook to apply a CSS class when a navigation is pending. The component must be nested within a Link component to function correctly.

```tsx
'use client'\n\nimport Link from 'next/link'\nimport { useLinkStatus } from 'next/link'\n\nfunction Hint() {\n  const { pending } = useLinkStatus()\n  return (\n    <span aria-hidden className={`link-hint ${pending ? 'is-pending' : ''}`} />\n  )\n}\n\nexport default function Header() {\n  return (\n    <header>\n      <Link href="/dashboard" prefetch={false}>\n        <span className="label">Dashboard</span> <Hint />\n      </Link>\n    </header>\n  )\n}
```

```jsx
'use client'\n\nimport Link from 'next/link'\nimport { useLinkStatus } from 'next/link'\n\nfunction Hint() {\n  const { pending } = useLinkStatus()\n  return (\n    <span aria-hidden className={`link-hint ${pending ? 'is-pending' : ''}`} />\n  )\n}\n\nexport default function Header() {\n  return (\n    <header>\n      <Link href="/dashboard" prefetch={false}>\n        <span className="label">Dashboard</span> <Hint />\n      </Link>\n    </header>\n  )\n}
```

--------------------------------

### Include Common Native/Runtime Assets in Next.js Tracing

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/output

This example provides common patterns for `outputFileTracingIncludes` to ensure native or runtime assets from `node_modules` are included in the trace. Using a global route key (`'/*'`) ensures these critical dependencies are available across the entire application, preventing deployment issues.

```javascript
module.exports = {
  outputFileTracingIncludes: {
    '/*': ['node_modules/sharp/**/*', 'node_modules/aws-crt/dist/bin/**/*'],
  },
}
```

--------------------------------

### Forward Authorization header in Next.js Server Components

Source: https://nextjs.org/docs/app/api-reference/functions/headers

This example shows how to retrieve the 'authorization' header using the `headers` function and then forward it in a `fetch` request within a Next.js Server Component. This is a common pattern for authenticating API calls by propagating the user's authorization token.

```jsx
import { headers } from 'next/headers'

export default async function Page() {
  const authorization = (await headers()).get('authorization')
  const res = await fetch('...', {
    headers: { authorization }, // Forward the authorization header
  })
  const user = await res.json()

  return <h1>{user.name}</h1>
}
```

--------------------------------

### Get Cookie value using NextResponse in TypeScript

Source: https://nextjs.org/docs/pages/api-reference/functions/next-response

Retrieves the value of a specific cookie from the response object. It returns the cookie object or undefined if the cookie is not found.

--------------------------------

### Enable bundlePagesRouterDependencies in next.config.js

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/bundlePagesRouterDependencies

Configures Next.js to automatically bundle server-side dependencies for the Pages Router. This helps reduce cold start times and ensures consistent behavior with the App Router.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  bundlePagesRouterDependencies: true,
}

module.exports = nextConfig
```

--------------------------------

### create-next-app Basic Usage

Source: https://nextjs.org/docs/app/api-reference/cli/create-next-app

Initialize a new Next.js application using the create-next-app CLI. Supports multiple package managers including npm, pnpm, yarn, and bun. The command accepts a project name and optional configuration flags.

```APIDOC
## CLI create-next-app

### Description
Create a new Next.js application using the create-next-app command-line interface. This is the easiest way to get started with Next.js and supports initialization with various templates and configurations.

### Command
```bash
pnpm create next-app [project-name] [options]
npx create-next-app@latest [project-name] [options]
yarn create next-app [project-name] [options]
bun create next-app [project-name] [options]
```

### Parameters
#### Command Arguments
- **project-name** (string) - Optional - Name of the project directory to create

#### Options
- **-h, --help** (flag) - Optional - Show all available options
- **-v, --version** (flag) - Optional - Output the version number
- **--no-*** (flag) - Optional - Negate default options (e.g., --no-ts)
- **--ts, --typescript** (flag) - Optional - Initialize as a TypeScript project (default)
- **--js, --javascript** (flag) - Optional - Initialize as a JavaScript project
- **--tailwind** (flag) - Optional - Initialize with Tailwind CSS config (default)
- **--react-compiler** (flag) - Optional - Initialize with React Compiler enabled
- **--eslint** (flag) - Optional - Initialize with ESLint config
- **--biome** (flag) - Optional - Initialize with Biome config
- **--no-linter** (flag) - Optional - Skip linter configuration
- **--app** (flag) - Optional - Initialize as an App Router project
- **--api** (flag) - Optional - Initialize a project with only route handlers
- **--src-dir** (flag) - Optional - Initialize inside a src/ directory
- **--turbopack** (flag) - Optional - Force enable Turbopack in generated package.json (enabled by default)
- **--webpack** (flag) - Optional - Force enable Webpack in generated package.json
- **--import-alias** (string) - Optional - Specify import alias to use (default "@/*")
- **--empty** (flag) - Optional - Initialize an empty project
- **--use-npm** (flag) - Optional - Bootstrap the application using npm
- **--use-pnpm** (flag) - Optional - Bootstrap the application using pnpm
- **--use-yarn** (flag) - Optional - Bootstrap the application using Yarn
- **--use-bun** (flag) - Optional - Bootstrap the application using Bun
- **-e, --example** (string) - Optional - An example name or GitHub URL to bootstrap the app with
- **--example-path** (string) - Optional - Specify the path to the example separately
- **--reset-preferences** (flag) - Optional - Reset any stored preferences
- **--skip-install** (flag) - Optional - Skip installing packages
- **--disable-git** (flag) - Optional - Disable git initialization
- **--agents-md** (flag) - Optional - Include AGENTS.md and CLAUDE.md to guide coding agents (default)
- **--yes** (flag) - Optional - Use previous preferences or defaults for all options

### Request Example
```bash
pnpm create next-app my-app --ts --tailwind --eslint
```

### Response
The command creates a new Next.js project directory with the following structure:
- Project directory with specified name
- Configured package.json with dependencies
- Next.js configuration files
- Selected linter and styling configurations
- Git repository initialization (unless --disable-git is used)

### Success Indicators
- Project directory successfully created
- Dependencies installed (unless --skip-install is used)
- Configuration files generated based on selected options
- Ready to start development with `npm run dev` or equivalent
```

--------------------------------

### Update skipProxyUrlNormalize configuration - TypeScript/JavaScript

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

Configuration flags containing the middleware name are renamed in Next.js 16. For example, skipMiddlewareUrlNormalize is now skipProxyUrlNormalize. Update your next.config file accordingly. The version 16 codemod can automatically update these flags.

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  skipProxyUrlNormalize: true,
}

export default nextConfig
```

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  skipProxyUrlNormalize: true,
}

module.exports = nextConfig
```

--------------------------------

### Define paths and locales in getStaticPaths return object

Source: https://nextjs.org/docs/pages/api-reference/functions/get-static-paths

Shows the structure of the paths array within the getStaticPaths return object. It includes examples of passing dynamic parameters and configuring locales for internationalization (i18n).

```js
return {
  paths: [
    { params: { id: '1' }},
    {
      params: { id: '2' },
      // with i18n configured the locale for the path can be returned as well
      locale: "en",
    },
  ],
  fallback: ...
}
```

--------------------------------

### Create responsive `next/image` from static import

Source: https://nextjs.org/docs/app/api-reference/components/image

Shows how to make a statically imported image responsive in Next.js. By setting `width: '100%'` and `height: 'auto'` along with `sizes='100vw'`, the image scales to fill its parent while preserving its aspect ratio, adapting to various screen sizes.

```jsx
import Image from 'next/image'
import mountains from '../public/mountains.jpg'

export default function Responsive() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Image
        alt="Mountains"
        // Importing an image will
        // automatically set the width and height
        src={mountains}
        sizes="100vw"
        // Make the image display full width
        // and preserve its aspect ratio
        style={{
          width: '100%',
          height: 'auto',
        }}
      />
    </div>
  )
}
```

--------------------------------

### Configure Next.js Browser Console Log Forwarding

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/logging

These `next.config.js` examples demonstrate how to configure forwarding of browser console logs to the terminal during Next.js development. This feature aids in debugging client-side code without needing to inspect browser developer tools, allowing for forwarding all logs or only warnings and errors.

```js
module.exports = {
  logging: {
    browserToTerminal: true,
  },
}
```

```js
module.exports = {
  logging: {
    browserToTerminal: 'warn',
  },
}
```

--------------------------------

### Specifying Internal Image Source with Next.js Image Component

Source: https://nextjs.org/docs/app/api-reference/components/image

This example shows how to use an internal path string for the `src` prop of the Next.js `Image` component. It's suitable for images located within the public directory of your Next.js project.

```jsx
<Image src="/profile.png" />
```

--------------------------------

### Handle script initialization on mount with onReady in Next.js

Source: https://nextjs.org/docs/pages/api-reference/components/script

The onReady handler runs after the script loads and every time the component is re-mounted. This is ideal for re-initializing complex third-party widgets like Google Maps during route navigation.

```jsx
import { useRef } from 'react'
import Script from 'next/script'

export default function Page() {
  const mapRef = useRef()

  return (
    <>
      <div ref={mapRef}></div>
      <Script
        id="google-maps"
        src="https://maps.googleapis.com/maps/api/js"
        onReady={() => {
          new google.maps.Map(mapRef.current, {
            center: { lat: -34.397, lng: 150.644 },
            zoom: 8,
          })
        }}
      />
    </>
  )
}
```

--------------------------------

### Enable Shallow Routing with useRouter Hook

Source: https://nextjs.org/docs/pages/building-your-application/routing/linking-and-navigating

Demonstrates how to use shallow routing with the useRouter hook to update the URL query parameters without re-running data fetching methods. The example shows setting shallow: true in router.push() options and watching for query changes with useEffect.

```jsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Current URL is '/'
function Page() {
  const router = useRouter()

  useEffect(() => {
    // Always do navigations after the first render
    router.push('/?counter=10', undefined, { shallow: true })
  }, [])

  useEffect(() => {
    // The counter changed!
  }, [router.query.counter])
}

export default Page
```

--------------------------------

### Start Next.js dev server with inspect flag - pnpm

Source: https://nextjs.org/docs/pages/guides/debugging

Launches the Next.js development server with Node.js debugging enabled using pnpm package manager. The --inspect flag passes debugging configuration to the underlying Node.js process, allowing browser DevTools connection.

```bash
pnpm dev --inspect
```

--------------------------------

### Configure Internationalization in next.config.js

Source: https://nextjs.org/docs/pages/guides/internationalization

Defines the core i18n configuration including supported locales, default language, and domain mapping. This setup allows Next.js to handle routing and locale parsing automatically.

```javascript
module.exports = {
  i18n: {
    // These are all the locales you want to support in
    // your application
    locales: ['en-US', 'fr', 'nl-NL'],
    // This is the default locale you want to be used when visiting
    // a non-locale prefixed path e.g. `/hello`
    defaultLocale: 'en-US',
    // This is a list of locale domains and the default locale they
    // should handle (these are only required when setting up domain routing)
    // Note: subdomains must be included in the domain value to be matched e.g. "fr.example.com".
    domains: [
      {
        domain: 'example.com',
        defaultLocale: 'en-US',
      },
      {
        domain: 'example.nl',
        defaultLocale: 'nl-NL',
      },
      {
        domain: 'example.fr',
        defaultLocale: 'fr',
        // an optional http field can also be used to test
        // locale domains locally with http instead of https
        http: true,
      }
    ]
  }
}
```

--------------------------------

### CLI next experimental-analyze

Source: https://nextjs.org/docs/app/api-reference/cli/next

Analyzes the application's bundle output using Turbopack to visualize bundle size and composition.

```APIDOC
## CLI next experimental-analyze

### Description
Analyzes bundle output (JS, CSS, assets) using Turbopack. Starts a local server for visualization or writes results to disk.

### Method
CLI

### Endpoint
next experimental-analyze [directory] [options]

### Parameters
#### Path Parameters
- **directory** (string) - Optional - A directory on which to analyze the application.

#### Query Parameters
- **--output** (boolean) - Optional - Write analysis files to .next/diagnostics/analyze without starting the server.
- **--port** (number) - Optional - Specify a port number to serve the analyzer on (default: 4000).
- **--no-mangling** (boolean) - Optional - Disables name mangling for debugging purposes.
- **--profile** (boolean) - Optional - Enables production profiling for React.

### Request Example
npx next experimental-analyze --output --port 4000

### Response
#### Success Response (200)
- **output** (directory) - Analysis files written to .next/diagnostics/analyze or interactive UI served at specified port.
```

--------------------------------

### Generate Open Graph Images using External Data in Next.js

Source: https://nextjs.org/docs/app/api-reference/functions/generate-image-metadata

This example shows how to use `generateImageMetadata` to fetch data and return metadata for multiple images. It also includes an Image component that uses `ImageResponse` to render content based on dynamic IDs and product parameters.

```tsx
import { ImageResponse } from 'next/og'
import { getCaptionForImage, getOGImages } from '@/app/utils/images'

export async function generateImageMetadata({
  params,
}: {
  params: { id: string }
}) {
  const images = await getOGImages(params.id)

  return images.map((image, idx) => ({
    id: idx,
    size: { width: 1200, height: 600 },
    alt: image.text,
    contentType: 'image/png',
  }))
}

export default async function Image({
  params,
  id,
}: {
  params: Promise<{ id: string }>
  id: Promise<number>
}) {
  const productId = (await params).id
  const imageId = await id
  const text = await getCaptionForImage(productId, imageId)

  return new ImageResponse(
    (
      <div
        style={
          {
            // ...
          }
        }
      >
        {text}
      </div>
    )
  )
}
```

```jsx
import { ImageResponse } from 'next/og'
import { getCaptionForImage, getOGImages } from '@/app/utils/images'

export async function generateImageMetadata({ params }) {
  const images = await getOGImages(params.id)

  return images.map((image, idx) => ({
    id: idx,
    size: { width: 1200, height: 600 },
    alt: image.text,
    contentType: 'image/png',
  }))
}

export default async function Image({ params, id }) {
  const productId = (await params).id
  const imageId = await id
  const text = await getCaptionForImage(productId, imageId)

  return new ImageResponse(
    (
      <div
        style={
          {
            // ...
          }
        }
      >
        {text}
      </div>
    )
  )
}
```

--------------------------------

### Generate multiple image metadata and render dynamic icons (Next.js)

Source: https://nextjs.org/docs/app/api-reference/functions/generate-image-metadata

This example shows how `generateImageMetadata` returns an array of objects, each defining metadata for a different image version, including `id`, `contentType`, and `size`. The `Icon` component then uses the resolved `id` prop to dynamically render the corresponding image using `ImageResponse`, demonstrating how to create multiple icons from a single route segment.

```tsx
import { ImageResponse } from 'next/og'

export function generateImageMetadata() {
  return [
    {
      contentType: 'image/png',
      size: { width: 48, height: 48 },
      id: 'small',
    },
    {
      contentType: 'image/png',
      size: { width: 72, height: 72 },
      id: 'medium',
    },
  ]
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const iconId = await id
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 88,
          background: '#000',
          color: '#fafafa',
        }}
      >
        Icon {iconId}
      </div>
    )
  )
}
```

```jsx
import { ImageResponse } from 'next/og'

export function generateImageMetadata() {
  return [
    {
      contentType: 'image/png',
      size: { width: 48, height: 48 },
      id: 'small',
    },
    {
      contentType: 'image/png',
      size: { width: 72, height: 72 },
      id: 'medium',
    },
  ]
}

export default async function Icon({ id }) {
  const iconId = await id
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 88,
          background: '#000',
          color: '#fafafa',
        }}
      >
        Icon {iconId}
      </div>
    )
  )
}
```

--------------------------------

### get() - Retrieve Cache Entry

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers

Retrieve a cache entry for the given cache key. This method should check if the entry exists, verify it hasn't expired based on the revalidate time, and return undefined for missing or expired entries.

```APIDOC
## GET Cache Entry

### Description
Retrieve a cache entry for the given cache key. Checks expiration status and returns the entry if valid, or undefined if not found or expired.

### Method Signature
```ts
get(cacheKey: string, softTags: string[]): Promise<CacheEntry | undefined>
```

### Parameters
#### Required Parameters
- **cacheKey** (string) - The unique key for the cache entry.
- **softTags** (string[]) - Tags to check for staleness (used in some cache strategies).

### Returns
- **CacheEntry | undefined** - Returns a CacheEntry object if found and valid, or undefined if not found or expired.

### Implementation Example
```js
const cacheHandler = {
  async get(cacheKey, softTags) {
    const entry = cache.get(cacheKey)
    if (!entry) return undefined

    // Check if expired
    const now = Date.now()
    if (now > entry.timestamp + entry.revalidate * 1000) {
      return undefined
    }

    return entry
  },
}
```

### Notes
- Your get method should retrieve the cache entry from storage
- Check if it has expired based on the revalidate time
- Return undefined for missing or expired entries
```

--------------------------------

### Configure Permissions-Policy Header in Next.js

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers

Sets the Permissions-Policy header (formerly Feature-Policy) to control which browser features and APIs can be used in the application. The example disables camera, microphone, geolocation, and browsing-topics features for enhanced privacy and security.

```javascript
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
}
```

--------------------------------

### Configure Google Font with Specific Weight in Next.js

Source: https://nextjs.org/docs/pages/getting-started/fonts

This example illustrates how to configure a Google Font (Roboto) with a specific weight when using `next/font/google` in a Next.js Pages Router application. This is essential for non-variable fonts to ensure proper rendering and demonstrates setting the `weight` property along with `subsets` within the font configuration object.

```tsx
import { Roboto } from 'next/font/google'
import type { AppProps } from 'next/app'

const roboto = Roboto({
  weight: '400',
  subsets: ['latin'],
})

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <main className={roboto.className}>
      <Component {...pageProps} />
    </main>
  )
}
```

```jsx
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  weight: '400',
  subsets: ['latin'],
})

export default function MyApp({ Component, pageProps }) {
  return (
    <main className={roboto.className}>
      <Component {...pageProps} />
    </main>
  )
}
```

--------------------------------

### Statically Generate Dynamic Routes using generateStaticParams in Next.js

Source: https://nextjs.org/docs/app/api-reference/functions/generate-static-params

This example demonstrates how to fetch data and return a list of parameters to populate dynamic route segments at build time. It includes both the generation function and the page component that consumes the parameters.

```tsx
// Return a list of `params` to populate the [slug] dynamic segment
export async function generateStaticParams() {
  const posts = await fetch('https://.../posts').then((res) => res.json())

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // ...
}
```

```jsx
// Return a list of `params` to populate the [slug] dynamic segment
export async function generateStaticParams() {
  const posts = await fetch('https://.../posts').then((res) => res.json())

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function Page({ params }) {
  const { slug } = await params
  // ...
}
```

--------------------------------

### router.push Navigation to Dynamic Route

Source: https://nextjs.org/docs/pages/api-reference/functions/use-router

Shows how to navigate to a dynamic route using router.push. The example navigates to '/post/abc' which corresponds to a dynamic route file 'pages/post/[pid].js'. The dynamic segment is passed as part of the URL string.

```jsx
import { useRouter } from 'next/router'

export default function Page() {
  const router = useRouter()

  return (
    <button type="button" onClick={() => router.push('/post/abc')}>
      Click me
    </button>
  )
}
```

--------------------------------

### GET /sitemap.xml (Image Sitemaps)

Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

Extend the programmatic sitemap generation to include image metadata. By adding an `images` array to a URL object, you can provide details for image sitemaps, enhancing search engine visibility for your images.

```APIDOC
## GET /sitemap.xml

### Description
This endpoint serves a dynamically generated sitemap.xml file that includes image metadata, adhering to the Google Image Sitemaps specification.

### Method
GET

### Endpoint
/sitemap.xml

### Parameters
#### Path Parameters
N/A

#### Query Parameters
N/A

#### Request Body
N/A (The sitemap content is generated by server-side code)

### Request Example
```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com',
      lastModified: '2021-01-01',
      changeFrequency: 'weekly',
      priority: 0.5,
      images: ['https://example.com/image.jpg'],
    },
  ]
}
```

### Response
#### Success Response (200)
The response is an XML document containing URL entries with embedded image information, formatted for image sitemaps.

#### Response Example
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
  <url>
    <loc>https://example.com</loc>
    <image:image>
      <image:loc>https://example.com/image.jpg</image:loc>
    </image:image>
    <lastmod>2021-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```
```

--------------------------------

### Enable manual graceful shutdown handling in Next.js package.json

Source: https://nextjs.org/docs/pages/guides/self-hosting

This `package.json` script modification enables manual graceful shutdown handling in Next.js by setting the `NEXT_MANUAL_SIG_HANDLE` environment variable to `true` for the `start` command. This allows developers to register custom handlers for `SIGTERM` or `SIGINT` signals, facilitating cleanup operations before the server shuts down. Note that this feature is not available in `next dev`.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "NEXT_MANUAL_SIG_HANDLE=true next start"
  }
}
```

--------------------------------

### Use Webpack flag for unsupported platforms

Source: https://nextjs.org/docs/app/api-reference/turbopack

Command-line instructions for platforms without native Turbopack bindings (e.g., FreeBSD, OpenBSD). Falls back to WebAssembly bindings which support SWC compilation and minification but not Turbopack.

```bash
next dev --webpack
next build --webpack
```

--------------------------------

### Implement preloading in Next.js Server Components

Source: https://nextjs.org/docs/app/guides/caching-without-cache-components

Demonstrates calling a preload function before an asynchronous blocking task in a Next.js Page. This allows data fetching to start immediately while other server-side logic, such as permission checks, is being processed.

```tsx
import { getItem, preload, checkIsAvailable } from '@/lib/data'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Start loading item data
  preload(id)
  // Perform another asynchronous task
  const isAvailable = await checkIsAvailable()

  return isAvailable ? <Item id={id} /> : null
}

async function Item({ id }: { id: string }) {
  const result = await getItem(id)
  // ...
}
```

```jsx
import { getItem, preload, checkIsAvailable } from '@/lib/data'

export default async function Page({ params }) {
  const { id } = await params
  // Start loading item data
  preload(id)
  // Perform another asynchronous task
  const isAvailable = await checkIsAvailable()

  return isAvailable ? <Item id={id} /> : null
}

async function Item({ id }) {
  const result = await getItem(id)
  // ...
}
```

--------------------------------

### Get image props for custom rendering with getImageProps

Source: https://nextjs.org/docs/app/api-reference/components/image

Retrieves the underlying <img> element properties to be used in custom components, such as a figure with a caption, without using React state.

```jsx
import { getImageProps } from 'next/image'

const { props } = getImageProps({
  src: 'https://example.com/image.jpg',
  alt: 'A scenic mountain view',
  width: 1200,
  height: 800,
})

function ImageWithCaption() {
  return (
    <figure>
      <img {...props} />
      <figcaption>A scenic mountain view</figcaption>
    </figure>
  )
}
```

--------------------------------

### Configure External Image Loader in Next.js

Source: https://nextjs.org/docs/pages/api-reference/components/image-legacy

Set up a custom cloud provider for image optimization instead of the built-in API. This configuration uses the 'loader' and 'path' properties to generate absolute URLs for providers like imgix.

```javascript
module.exports = {
  images: {
    loader: 'imgix',
    path: 'https://example.com/myaccount/',
  },
}
```

--------------------------------

### Configure Next.js with ECMAScript Module Export (.mjs)

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js

This example shows how to use ECMAScript modules (ESM) for Next.js configuration by naming the file `next.config.mjs`. It uses `export default` to define the configuration object, aligning with modern JavaScript module practices.

```javascript
// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
}

export default nextConfig
```

--------------------------------

### Parallel Data Fetching with Promise.all in TypeScript

Source: https://nextjs.org/docs/app/getting-started/fetching-data

Implements parallel data fetching by initiating multiple fetch requests simultaneously and awaiting them together with Promise.all. This pattern optimizes performance by starting all requests at once rather than waiting for each to complete sequentially.

```tsx
import Albums from './albums'

async function getArtist(username: string) {
  const res = await fetch(`https://api.example.com/artist/${username}`)
  return res.json()
}

async function getAlbums(username: string) {
  const res = await fetch(`https://api.example.com/artist/${username}/albums`)
  return res.json()
}

export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  // Initiate requests
  const artistData = getArtist(username)
  const albumsData = getAlbums(username)

  const [artist, albums] = await Promise.all([artistData, albumsData])

  return (
    <>
      <h1>{artist.name}</h1>
      <Albums list={albums} />
    </>
  )
}
```

--------------------------------

### Favicon, Icon, and Apple Icon Files

Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata

File convention for defining favicon, icon, and apple-icon metadata files. These files can be defined as static image files (e.g., favicon.ico, icon.png, apple-icon.png) or as dynamic variants using code generation.

```APIDOC
## Favicon, Icon, and Apple Icon Files

### Description
File convention for defining favicon, icon, and apple-icon metadata files in Next.js applications.

### File Conventions
- **favicon.ico** - Static favicon file (supported formats: .ico, .jpg, .jpeg, .png, .svg)
- **icon.png** - Static icon file (supported formats: .jpg, .jpeg, .png, .svg)
- **apple-icon.png** - Static Apple icon file (supported formats: .jpg, .jpeg, .png)
- **icon.js/ts/tsx** - Dynamic icon generation using code
- **apple-icon.js/ts/tsx** - Dynamic Apple icon generation using code

### Supported Formats
- Static: .ico, .jpg, .jpeg, .png, .svg
- Dynamic: .js, .ts, .tsx

### Caching
These files are cached by default in Next.js. In production, files are served with hashes for optimal caching.

### Usage
Place metadata files in your route segment directory. Next.js will automatically serve the files and update the relevant head elements with correct metadata including asset URLs and file types.
```

--------------------------------

### Implement Google Font with Optional Display in Next.js

Source: https://nextjs.org/docs/messages/google-font-display

This example demonstrates how to correctly include a Google Font in a Next.js page using the 'display=optional' parameter. This strategy minimizes layout shifts and ensures better performance by only showing the font if it is available immediately.

```jsx
import Head from 'next/head'

export default function IndexPage() {
  return (
    <div>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Krona+One&display=optional"
          rel="stylesheet"
        />
      </Head>
    </div>
  )
}
```

--------------------------------

### Implement redirect in Next.js Server Components

Source: https://nextjs.org/docs/app/api-reference/functions/redirect

Example of using the redirect function within an async Server Component to handle unauthorized access or missing data. Note that redirect throws an error and terminates rendering.

```tsx
import { redirect } from 'next/navigation'

async function fetchTeam(id: string) {
  const res = await fetch('https://...')
  if (!res.ok) return undefined
  return res.json()
}

export default async function Profile({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const team = await fetchTeam(id)

  if (!team) {
    redirect('/login')
  }

  // ...
}
```

```jsx
import { redirect } from 'next/navigation'

async function fetchTeam(id) {
  const res = await fetch('https://...')
  if (!res.ok) return undefined
  return res.json()
}

export default async function Profile({ params }) {
  const { id } = await params
  const team = await fetchTeam(id)

  if (!team) {
    redirect('/login')
  }

  // ...
}
```

--------------------------------

### Install Next.js 11 with npm

Source: https://nextjs.org/docs/pages/guides/upgrading/version-11

Upgrade Next.js to version 11 along with React 17 using npm package manager. This command updates the core Next.js framework and React dependencies to their version 11 and 17 releases respectively.

```bash
npm i next@11 react@17 react-dom@17
```

--------------------------------

### Get a Specific Cookie from NextRequest

Source: https://nextjs.org/docs/pages/api-reference/functions/next-request

Retrieves the value of a specific cookie by its name from the `NextRequest` object. If multiple cookies with the same name exist, the first one encountered is returned; otherwise, `undefined` is returned.

```ts
request.cookies.get('show-banner')
```

--------------------------------

### Configure Browserslist in package.json

Source: https://nextjs.org/docs/architecture/supported-browsers

Define target browser versions using Browserslist configuration in package.json. Next.js uses this configuration to determine which JavaScript features and polyfills to include in the build. This example targets Chrome 111+, Edge 111+, Firefox 111+, and Safari 16.4+.

```json
{
  "browserslist": ["chrome 111", "edge 111", "firefox 111", "safari 16.4"]
}
```

--------------------------------

### Create a Page Component in Next.js

Source: https://nextjs.org/docs/app/getting-started/layouts-and-pages

Create a page by adding a page file inside the app directory and default exporting a React component. This example creates an index page at the root route (/) that displays a heading. The page file is the special file convention for defining route-specific UI in Next.js.

```typescript
export default function Page() {
  return <h1>Hello Next.js!</h1>
}
```

```javascript
export default function Page() {
  return <h1>Hello Next.js!</h1>
}
```

--------------------------------

### Fetch CMS data with getStaticProps in Next.js (TypeScript)

Source: https://nextjs.org/docs/pages/building-your-application/rendering/static

This example illustrates fetching a list of blog posts from a CMS using `getStaticProps` in a Next.js application. The data is fetched server-side at build time and passed as props to the `Blog` page component for rendering.

```typescript
// posts will be populated at build time by getStaticProps()
export default function Blog({ posts }) {
  return (
    <ul>
      {posts.map((post) => (
        <li>{post.title}</li>
      ))}
    </ul>
  )
}
 
// This function gets called at build time on server-side.
// It won't be called on client-side, so you can even do
// direct database queries.
export async function getStaticProps() {
  // Call an external API endpoint to get posts.
  // You can use any data fetching library
  const res = await fetch('https://.../posts')
  const posts = await res.json()
 
  // By returning { props: { posts } }, the Blog component
  // will receive `posts` as a prop at build time
  return {
    props: {
      posts,
    },
  }
}
```

--------------------------------

### Configure Next.js to use Webpack instead of Turbopack

Source: https://nextjs.org/docs/app/api-reference/turbopack

Package.json configuration to opt-in to Webpack bundler instead of the default Turbopack. Use the --webpack flag with dev, build, and start scripts when Turbopack is not suitable for your project.

```json
{
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack",
    "start": "next start"
  }
}
```

--------------------------------

### generateStaticParams with Single Dynamic Segment

Source: https://nextjs.org/docs/app/api-reference/functions/generate-static-params

Example implementation of generateStaticParams for a blog page with a single dynamic [slug] segment. Fetches posts from an API and returns an array of slug parameters to pre-render each blog post page at build time.

```APIDOC
## generateStaticParams - Single Dynamic Segment

### Description
Implementation example for a blog page with a single dynamic segment. Fetches blog posts and generates static params for each post slug.

### File Location
`app/blog/[slug]/page.tsx`

### Implementation (TypeScript)
```typescript
export async function generateStaticParams() {
  const posts = await fetch('https://.../posts').then((res) => res.json())

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Page content here
}
```

### Implementation (JavaScript)
```javascript
export async function generateStaticParams() {
  const posts = await fetch('https://.../posts').then((res) => res.json())

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function Page({ params }) {
  const { slug } = await params
  // Page content here
}
```

### How It Works
1. Fetches all blog posts from API endpoint
2. Maps each post to an object with slug property
3. Next.js generates a static page for each returned slug
4. Pages are pre-rendered at build time, not on-demand

### Return Value
Array of objects: `[{ slug: 'post-1' }, { slug: 'post-2' }, ...]`
```

--------------------------------

### Implement Next.js Edge API Route for proxying requests

Source: https://nextjs.org/docs/messages/middleware-upgrade-guide

This TypeScript example shows how to create an Edge API Route in Next.js to proxy requests to an external API. It demonstrates setting the `runtime` to `edge` and forwarding headers, such as `authorization` cookies, to a backend service. This pattern is useful for scenarios where Middleware was previously used to forward headers.

```ts
import { type NextRequest } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  const authorization = req.cookies.get('authorization')
  return fetch('https://backend-api.com/api/protected', {
    method: req.method,
    headers: {
      authorization,
    },
    redirect: 'manual',
  })
}
```

--------------------------------

### Run Next.js Bundle Analyzer for Turbopack

Source: https://nextjs.org/docs/app/guides/package-bundling

This command initiates the experimental Next.js Bundle Analyzer, integrated with Turbopack, to inspect server and client modules. It opens an interactive view in the browser, allowing for detailed analysis of module graphs and dependencies.

```bash
npx next experimental-analyze
```

```bash
yarn next experimental-analyze
```

```bash
pnpm next experimental-analyze
```

```bash
bunx next experimental-analyze
```

--------------------------------

### Run Prettier to Format MDX Files Before PR Submission

Source: https://nextjs.org/docs/community/contribution-guide

This command instructs contributors to run Prettier to automatically format MDX files before submitting a Pull Request. Executing `pnpm prettier-fix` ensures that all documentation files adhere to the project's defined code style, promoting consistency and streamlining the review process.

```bash
pnpm prettier-fix
```

--------------------------------

### Custom Spans with OpenTelemetry

Source: https://nextjs.org/docs/pages/guides/open-telemetry

Create custom spans using OpenTelemetry APIs to track specific operations in your Next.js application. This example demonstrates how to instrument a function that fetches GitHub stars and wraps it in a custom span.

```APIDOC
## Custom Spans Implementation

### Description
Implement custom spans using OpenTelemetry APIs to track specific operations and performance metrics in your Next.js application.

### Installation

Install the OpenTelemetry API package:

```bash
pnpm add @opentelemetry/api
# or
npm install @opentelemetry/api
# or
yarn add @opentelemetry/api
# or
bun add @opentelemetry/api
```

### Usage Example

```typescript
import { trace } from '@opentelemetry/api'

export async function fetchGithubStars() {
  return await trace
    .getTracer('nextjs-example')
    .startActiveSpan('fetchGithubStars', async (span) => {
      try {
        return await getValue()
      } finally {
        span.end()
      }
    })
}
```

### Key Points
- The `register` function executes before your code runs in a new environment
- Custom spans are automatically added to the exported trace
- Use `trace.getTracer()` to create a tracer instance
- Call `span.end()` to complete the span tracking
```

--------------------------------

### Define Local Font Sources with next/font/local

Source: https://nextjs.org/docs/pages/api-reference/components/font

Examples of specifying font file paths using the src property. It supports single string paths for individual files or arrays of objects to define multiple weights and styles for a single font family.

```javascript
// Example 1: Single font file string
src: './fonts/my-font.woff2'

// Example 2: Array of objects for multiple weights and styles
src: [
  {
    path: './inter/Inter-Thin.ttf',
    weight: '100'
  },
  {
    path: './inter/Inter-Regular.ttf',
    weight: '400'
  },
  {
    path: './inter/Inter-Bold-Italic.ttf',
    weight: '700',
    style: 'italic'
  }
]
```

--------------------------------

### Configure Custom Type Declarations in tsconfig.json

Source: https://nextjs.org/docs/app/api-reference/config/typescript

Demonstrates how to include a custom declaration file in the TypeScript configuration to prevent Next.js from overwriting manual type changes. This setup ensures that both auto-generated and manual types are correctly resolved by the compiler.

```json
{
  "compilerOptions": {
    "skipLibCheck": true
    //...truncated...
  },
  "include": [
    "new-types.d.ts",
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": ["node_modules"]
}
```

--------------------------------

### Expanding Image to Parent with Next.js Image Component `fill` Prop

Source: https://nextjs.org/docs/app/api-reference/components/image

This example uses the `fill` prop to make the image expand and fill its parent element. The parent element must have a `position` style (e.g., `relative`, `fixed`, `absolute`) for this prop to function correctly.

```js
<Image src="/profile.png" fill={true} />
```

--------------------------------

### Bash Deploy Script Template for Next.js Adapter Testing

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/adapterPath

Template for a custom deploy script that builds and deploys an isolated test application. The script must exit with non-zero on failure, output the deployment URL to stdout, and persist diagnostic data to files for later retrieval by the logs script.

```bash
#!/usr/bin/env bash
set -euo pipefail
```

--------------------------------

### Add Next.js Config to Existing ESLint Flat Config

Source: https://nextjs.org/docs/app/api-reference/config/eslint

Import and spread the 'eslint-config-next/core-web-vitals' package into your existing ESLint configuration array. This method ensures Next.js specific rules are applied alongside your existing linting setup.

```javascript
import nextConfig from 'eslint-config-next/core-web-vitals'
// Your other config imports...

const eslintConfig = [
  // Your other configurations...
  ...nextConfig,
]

export default eslintConfig
```

--------------------------------

### Illustrate Initial Root Template Mount in Next.js (`/`)

Source: https://nextjs.org/docs/app/api-reference/file-conventions/template

This JSX snippet demonstrates the initial React tree structure when a Next.js application loads at the root path (`/`). It shows the `RootLayout` wrapping the primary `Template` (defined in `app/template.tsx`), which then renders the main `Page` component. The `key` prop on the `Template` is set to the current path segment.

```jsx
<RootLayout>
  {/* app/template.tsx */}
  <Template key="/">
    <Page />
  </Template>
</RootLayout>
```

--------------------------------

### Node.js Runtime Handler Interface

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/adapterPath

The Node.js runtime handler interface defines how to invoke Node.js entrypoints using IncomingMessage and ServerResponse primitives. Adapters can pass platform-specific helpers through requestMeta to handle hostname resolution, revalidation, and 404 rendering without relying on internal implementations.

```APIDOC
## Node.js Runtime Handler

### Description
Defines the interface for invoking Node.js entrypoints in Next.js. Supports passing request metadata and context helpers for platform-specific implementations.

### Handler Signature
```typescript
handler(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: {
    waitUntil?: (promise: Promise<void>) => void
    requestMeta?: RequestMeta
  }
): Promise<void>
```

### Parameters
#### Context Object (ctx)
- **waitUntil** (function) - Optional - Accepts a promise to extend handler execution time
- **requestMeta** (object) - Optional - Platform-specific metadata and helper functions

### RequestMeta Fields
- **relativeProjectDir** (string) - Required - Relative path from process.cwd() to the Next.js project directory
- **hostname** (string) - Optional - Hostname used by route handlers when constructing absolute URLs
- **revalidate** (function) - Optional - Internal revalidate function to avoid revalidating over the network
- **render404** (function) - Optional - Function to render the 404 page for pages router notFound: true

### Request Example
```typescript
await handler(req, res, {
  requestMeta: {
    relativeProjectDir: '.',
    hostname: '127.0.0.1',
    revalidate: async ({ urlPath, headers, opts }) => {
      // platform-specific revalidate implementation
    },
    render404: async (req, res, parsedUrl, setHeaders) => {
      // platform-specific 404 rendering implementation
    }
  }
})
```

### Related Files
- `packages/next/src/build/templates/app-page.ts`
- `packages/next/src/build/templates/app-route.ts`
- `packages/next/src/build/templates/pages-api.ts`
```

--------------------------------

### Install Next.js 11 with pnpm

Source: https://nextjs.org/docs/pages/guides/upgrading/version-11

Upgrade Next.js to version 11 along with React 17 using pnpm package manager. This command updates the core Next.js framework and React dependencies to their version 11 and 17 releases respectively.

```bash
pnpm up next@11 react@17 react-dom@17
```

--------------------------------

### Create a Client Component for React Context Provider in Next.js

Source: https://nextjs.org/docs/app/getting-started/server-and-client-components

This snippet defines a React Client Component (`ThemeProvider`) that sets up a React Context. It uses the `'use client'` directive and accepts `children`, making it suitable for wrapping other components to provide a shared context value (e.g., theme) to its descendants. React Context is not directly supported in Server Components, so it must be provided by a Client Component.

```typescript
'use client'

import { createContext } from 'react'

export const ThemeContext = createContext({})

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
}
```

```javascript
'use client'

import { createContext } from 'react'

export const ThemeContext = createContext({})

export default function ThemeProvider({ children }) {
  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
}
```

--------------------------------

### Memoize Data Fetching with React `cache` in Next.js

Source: https://nextjs.org/docs/app/getting-started/metadata-and-og-images

This example demonstrates how to use React's `cache` function to memoize data requests, preventing duplicate fetches when the same data is needed for both metadata generation and page rendering in Next.js. The `getPost` function fetches a blog post from a database, and `cache` ensures it executes only once, even if called multiple times across different parts of the application, improving performance and reducing database load.

```ts
import { cache } from 'react'
import { db } from '@/app/lib/db'

// getPost will be used twice, but execute only once
export const getPost = cache(async (slug: string) => {
  const res = await db.query.posts.findFirst({ where: eq(posts.slug, slug) })
  return res
})
```

```js
import { cache } from 'react'
import { db } from '@/app/lib/db'

// getPost will be used twice, but execute only once
export const getPost = cache(async (slug) => {
  const res = await db.query.posts.findFirst({ where: eq(posts.slug, slug) })
  return res
})
```

--------------------------------

### Configure Cypress E2E testing with JavaScript

Source: https://nextjs.org/docs/pages/guides/testing/cypress

Set up the cypress.config.js file with JavaScript to configure E2E testing. Uses defineConfig from Cypress and includes setupNodeEvents hook for custom event handling.

```javascript
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {},
  },
})
```

--------------------------------

### Build-Time Environment Variable Replacement Example

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/env

Demonstrates how Next.js replaces environment variables at build time. The JSX code containing process.env.customKey is transformed to include the literal string value 'my-value' directly in the output, which is the result of webpack's DefinePlugin static replacement.

```jsx
return <h1>The value of customKey is: {'my-value'}</h1>
```

--------------------------------

### Configure SWR fallback data in Next.js RootLayout (TSX/JS)

Source: https://nextjs.org/docs/app/guides/single-page-applications

This snippet illustrates how to set up `SWRConfig` in a Next.js Server Component `RootLayout` to provide initial `fallback` data from a server-side function like `getUser()`. This allows pre-populating SWR's cache on the server, making data immediately available to client components without requiring a separate API route. The `getUser()` call is not awaited, and child components reading this data will suspend until it's ready.

```tsx
import { SWRConfig } from 'swr';
import { getUser } from './user'; // some server-side function

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRConfig
      value={{
        fallback: {
          // We do NOT await getUser() here
          // Only components that read this data will suspend
          '/api/user': getUser(),
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

```js
import { SWRConfig } from 'swr';
import { getUser } from './user'; // some server-side function

export default function RootLayout({ children }) {
  return (
    <SWRConfig
      value={{
        fallback: {
          // We do NOT await getUser() here
          // Only components that read this data will suspend
          '/api/user': getUser(),
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

--------------------------------

### Configure Cache Expiration with cacheLife

Source: https://nextjs.org/docs/app/api-reference/functions/cacheLife

Sets the maximum time (in seconds) before the server must regenerate cached content synchronously. This example sets an expiration of one hour.

```tsx
cacheLife({ expire: 3600 }) // 1 hour
```

--------------------------------

### Configure Partial Prerendering with cacheComponents - JavaScript

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

Enable Partial Prerendering (PPR) in Next.js 16 using the cacheComponents configuration option in next.config.js. This replaces the experimental PPR flag from Next.js 15. PPR works differently in version 16, so refer to migration guides if upgrading from version 15 canaries.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
}

module.exports = nextConfig
```

--------------------------------

### Integrating Client Components with Server-Side Metadata in Next.js

Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

This example demonstrates how to use the `metadata` export (or `generateMetadata`) in a Server Component `page.tsx` or `page.js` file, while moving client-side interactive logic into a separate Client Component. This pattern ensures that metadata is resolved on the server before the page renders, allowing Next.js to include it in the initial HTML response, while still enabling client-side interactivity.

```tsx
import type { Metadata } from 'next'
import { InteractiveComponent } from './interactive-component'

export const metadata: Metadata = {
  title: 'My Page',
}

export default function Page() {
  return <InteractiveComponent />
}
```

```jsx
import { InteractiveComponent } from './interactive-component'

export const metadata = {
  title: 'My Page',
}

export default function Page() {
  return <InteractiveComponent />
}
```

```tsx
'use client'

export function InteractiveComponent() {
  // Client-side interactivity (hooks, event handlers, etc.)
}
```

```jsx
'use client'

export function InteractiveComponent() {
  // Client-side interactivity (hooks, event handlers, etc.)
}
```

--------------------------------

### Displaying content based on Next.js dynamic `params` in Server Components

Source: https://nextjs.org/docs/app/api-reference/file-conventions/page

This example shows how to use dynamic route segments (`params`) to fetch or display specific content in a Next.js Server Component. The `params` prop is a Promise that resolves to an object containing the values of the dynamic segments from the URL.

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <h1>Blog Post: {slug}</h1>
}
```

```jsx
export default async function Page({ params }) {
  const { slug } = await params
  return <h1>Blog Post: {slug}</h1>
}
```

--------------------------------

### Fetch Data in Next.js Client Components with SWR

Source: https://nextjs.org/docs/app/guides/static-exports

For client-side data fetching in a static Next.js application, Client Components can utilize libraries like SWR to manage and memoize requests. This allows data to be fetched dynamically in the browser after the initial static page load, providing a traditional Single-Page Application (SPA) experience for data updates. The examples demonstrate handling loading and error states.

```tsx
'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Page() {
  const { data, error } = useSWR(
    `https://jsonplaceholder.typicode.com/posts/1`,
    fetcher
  )
  if (error) return 'Failed to load'
  if (!data) return 'Loading...'

  return data.title
}
```

```jsx
'use client'

import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((r) => r.json())

export default function Page() {
  const { data, error } = useSWR(
    `https://jsonplaceholder.typicode.com/posts/1`,
    fetcher
  )
  if (error) return 'Failed to load'
  if (!data) return 'Loading...'

  return data.title
}
```

--------------------------------

### Configure Turbopack loader with options via import attributes

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack

Pass loader options as a JSON-encoded string using the turbopackLoaderOptions import attribute. This example uses the string-replace-loader to replace a placeholder value in an imported JavaScript file.

```typescript
import value from '../data.js' with { turbopackLoader: 'string-replace-loader', turbopackLoaderOptions: '{"search":"PLACEHOLDER","replace":"replaced value"}' }
```

--------------------------------

### Using Native ESM in next.config.mts for CommonJS Projects

Source: https://nextjs.org/docs/app/api-reference/config/typescript

This example illustrates how to use `next.config.mts` to explicitly define an ECMAScript Module (ESM) within a CommonJS project. This allows the use of native ESM syntax, such as top-level `await` and dynamic `import()`, for your Next.js configuration.

```ts
import type { NextConfig } from 'next'

// Top-level await and dynamic import are supported
const flags = await import('./flags.js').then((m) => m.default ?? m)

const nextConfig: NextConfig = {
  /* config options here */
  typedRoutes: Boolean(flags?.typedRoutes),
}

export default nextConfig
```

--------------------------------

### Read Nonce in Next.js Pages Router getServerSideProps

Source: https://nextjs.org/docs/pages/guides/content-security-policy

This example shows how to retrieve the nonce from the `x-nonce` request header using `getServerSideProps` in the Next.js Pages Router. The extracted nonce is then passed as a prop to the page component, allowing it to be applied to `<Script>` components for external resources.

```tsx
import Script from 'next/script'

import type { GetServerSideProps } from 'next'

export default function Page({ nonce }) {
  return (
    <Script
      src="https://www.googletagmanager.com/gtag/js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const nonce = req.headers['x-nonce']
  return { props: { nonce } }
}
```

```jsx
import Script from 'next/script'
export default function Page({ nonce }) {
  return (
    <Script
      src="https://www.googletagmanager.com/gtag/js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  )
}

export async function getServerSideProps({ req }) {
  const nonce = req.headers['x-nonce']
  return { props: { nonce } }
}
```

--------------------------------

### Create Custom Server in Next.js using Node.js http module

Source: https://nextjs.org/docs/app/guides/custom-server

This snippet demonstrates how to programmatically initialize a Next.js application and handle incoming HTTP requests using a custom server. It uses the next() function to create an app instance and app.getRequestHandler() to process requests via the standard Node.js http module.

```typescript
import { createServer } from 'http'
import next from 'next'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res)
  }).listen(port)

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? 'development' : process.env.NODE_ENV
    }`
  )
})
```

```javascript
import { createServer } from 'http'
import next from 'next'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res)
  }).listen(port)

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? 'development' : process.env.NODE_ENV
    }`
  )
})
```

--------------------------------

### Type-Safe Redirect in Middleware with Route Casting

Source: https://nextjs.org/docs/app/api-reference/config/typescript

Use Route type casting in middleware to ensure redirects point to valid routes. This example shows a proxy middleware that redirects requests with type-safe route validation.

```typescript
import type { Route } from 'next'
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/proxy-redirect') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Usage in component
export default function Page() {
  return <Link href={'/proxy-redirect' as Route}>Link Text</Link>
}
```

--------------------------------

### Preload Critical Images in Next.js

Source: https://nextjs.org/docs/app/api-reference/components/image

Instructs the browser to start downloading the image early by inserting a link tag in the document head. This is specifically intended for Largest Contentful Paint (LCP) elements and hero images located above the fold.

```jsx
// Default preload is false
<Image preload={false} />
```

--------------------------------

### Configure Next.js Metadata for Apple Web App and iTunes

Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

This snippet demonstrates how to configure metadata for Apple Web Apps and iTunes in Next.js. It includes settings for iTunes App Store ID, app arguments, web app title, status bar style, and startup images with media queries. The generated HTML includes `apple-itunes-app` meta tags, `apple-mobile-web-app` meta tags, and `apple-touch-startup-image` link tags for an enhanced iOS user experience.

```jsx
export const metadata = {
  itunes: {
    appId: 'myAppStoreID',
    appArgument: 'myAppArgument',
  },
  appleWebApp: {
    title: 'Apple Web App',
    statusBarStyle: 'black-translucent',
    startupImage: [
      '/assets/startup/apple-touch-startup-image-768x1004.png',
      {
        url: '/assets/startup/apple-touch-startup-image-1536x2008.png',
        media: '(device-width: 768px) and (device-height: 1024px)',
      },
    ],
  },
}
```

```html
<meta
  name="apple-itunes-app"
  content="app-id=myAppStoreID, app-argument=myAppArgument"
/>
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Apple Web App" />
<link
  href="/assets/startup/apple-touch-startup-image-768x1004.png"
  rel="apple-touch-startup-image"
/>
<link
  href="/assets/startup/apple-touch-startup-image-1536x2008.png"
  media="(device-width: 768px) and (device-height: 1024px)"
  rel="apple-touch-startup-image"
/>
<meta
  name="apple-mobile-web-app-status-bar-style"
  content="black-translucent"
/>
```

--------------------------------

### Implementing Remote Caching for Product Pricing with User Currency in Next.js

Source: https://nextjs.org/docs/app/api-reference/directives/use-cache-remote

This example showcases how to use `'use cache: remote'` in a Next.js application to cache product prices based on a user's currency preference, which is retrieved from cookies. It demonstrates the use of `cacheTag` for invalidation and `cacheLife` for setting an expiration time. This pattern is beneficial for serverless environments where a shared remote cache can improve performance by serving cached prices to all users with the same currency.

```tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheTag, cacheLife } from 'next/cache'

export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }]
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div>
      <ProductDetails id={id} />
      <Suspense fallback={<div>Loading price...</div>}>
        <ProductPrice productId={id} />
      </Suspense>
    </div>
  )
}

function ProductDetails({ id }: { id: string }) {
  return <div>Product: {id}</div>
}

async function ProductPrice({ productId }: { productId: string }) {
  // Reading cookies defers this component to request time
  const currency = (await cookies()).get('currency')?.value ?? 'USD'

  // Cache the price per product and currency combination
  // All users with the same currency share this cache entry
  const price = await getProductPrice(productId, currency)

  return (
    <div>
      Price: {price} {currency}
    </div>
  )
}

async function getProductPrice(productId: string, currency: string) {
  'use cache: remote'
  cacheTag(`product-price-${productId}`)
  cacheLife({ expire: 3600 }) // 1 hour

  // Cached per (productId, currency) - few currencies means high cache utilization
  return db.products.getPrice(productId, currency)
}
```

```jsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheTag, cacheLife } from 'next/cache'

export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }]
}

export default async function ProductPage({ params }) {
  const { id } = await params

  return (
    <div>
      <ProductDetails id={id} />
      <Suspense fallback={<div>Loading price...</div>}>
        <ProductPrice productId={id} />
      </Suspense>
    </div>
  )
}

function ProductDetails({ id }) {
  return <div>Product: {id}</div>
}

async function ProductPrice({ productId }) {
  // Reading cookies defers this component to request time
  const currency = (await cookies()).get('currency')?.value ?? 'USD'

  // Cache the price per product and currency combination
  // All users with the same currency share this cache entry
  const price = await getProductPrice(productId, currency)

  return (
    <div>
      Price: {price} {currency}
    </div>
  )
}

async function getProductPrice(productId, currency) {
  'use cache: remote'
  cacheTag(`product-price-${productId}`)
  cacheLife({ expire: 3600 }) // 1 hour

  // Cached per (productId, currency) - few currencies means high cache utilization
  return db.products.getPrice(productId, currency)
}
```

--------------------------------

### Demonstrate `refresh` Error Outside Next.js Server Action

Source: https://nextjs.org/docs/app/api-reference/functions/refresh

This example illustrates that the `refresh` function can only be called from within Server Actions. Attempting to use it in other contexts, such as a Route Handler, will result in an error, as shown by calling `refresh()` directly within a `POST` function.

```typescript
import { refresh } from 'next/cache'

export async function POST() {
  // This will throw an error
  refresh()
}
```

--------------------------------

### Suppress warnings for optional dependencies

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackIgnoreIssue

Suppress 'Module not found' warnings from optional require() calls wrapped in try/catch blocks. This example targets a specific directory containing optional feature code and matches the 'Module not found' title.

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    ignoreIssue: [
      {
        path: '**/lib/optional-feature/**',
        title: 'Module not found',
      },
    ],
  },
}

export default nextConfig
```

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    ignoreIssue: [
      {
        path: '**/lib/optional-feature/**',
        title: 'Module not found',
      },
    ],
  },
}

module.exports = nextConfig
```

--------------------------------

### Configure Image Maximum Redirects in Next.js

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

This snippet demonstrates how to configure the `maximumRedirects` option for image optimization in Next.js. The default value has changed to 3, but you can set it to 0 to disable redirects or increase it for specific use cases. Examples are provided for both TypeScript and JavaScript configuration files.

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    maximumRedirects: 0, // Disable redirects
    // or
    maximumRedirects: 5, // Increase for edge cases
  },
}

export default nextConfig
```

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    maximumRedirects: 0, // Disable redirects
    // or
    maximumRedirects: 5, // Increase for edge cases
  },
}

module.exports = nextConfig
```

--------------------------------

### ImageResponse Constructor Signature (JSX)

Source: https://nextjs.org/docs/app/api-reference/functions/image-response

Defines the constructor for `ImageResponse`, detailing its required `element` (a ReactElement) and optional `options` such as `width`, `height`, `emoji` style, `fonts` configuration, `debug` mode, and HTTP response `status`, `statusText`, and `headers`. This signature guides developers on how to instantiate `ImageResponse` with various customization parameters.

```jsx
import { ImageResponse } from 'next/og'

new ImageResponse(
  element: ReactElement,
  options: {
    width?: number = 1200
    height?: number = 630
    emoji?: 'twemoji' | 'blobmoji' | 'noto' | 'openmoji' = 'twemoji',
    fonts?: {
      name: string,
      data: ArrayBuffer,
      weight: number,
      style: 'normal' | 'italic'
    }[]
    debug?: boolean = false

    // Options that will be passed to the HTTP response
    status?: number = 200
    statusText?: string
    headers?: Record<string, string>
  },
)
```

--------------------------------

### Get All Cookies or Specific Cookies from NextRequest

Source: https://nextjs.org/docs/pages/api-reference/functions/next-request

Retrieves all cookies matching a given name from the `NextRequest` object. If no name is provided, it returns an array of all cookies present in the request, each as an object containing `name`, `value`, and `Path`.

```ts
// Given incoming request /home
// [
//   { name: 'experiments', value: 'new-pricing-page', Path: '/home' },
//   { name: 'experiments', value: 'winter-launch', Path: '/home' },
// ]
request.cookies.getAll('experiments')
```

```ts
// Alternatively, get all cookies for the request
request.cookies.getAll()
```

--------------------------------

### Create Source Content for Shared Next.js Docs Pages (MDX)

Source: https://nextjs.org/docs/community/contribution-guide

This MDX snippet demonstrates a page designed to serve as a content source for other documentation pages, particularly for features shared between the App and Pages Routers. By defining the primary content here, it can be pulled into multiple locations, preventing duplication and ensuring consistency across the documentation.

```mdx
---
title: <Link>
description: API reference for the <Link> component.
---

This API reference will help you understand how to use the props
and configuration options available for the Link Component.
```

--------------------------------

### Basic Next.js Preview API Route for Manual Testing (JavaScript)

Source: https://nextjs.org/docs/pages/guides/preview-mode

This example provides a complete, simple Next.js API route (`pages/api/preview.js`) designed for manual testing of Preview Mode. It sets the necessary preview data cookies and sends a confirmation message back to the browser, allowing developers to verify the mode is enabled.

```js
// simple example for testing it manually from your browser.
export default function handler(req, res) {
  res.setPreviewData({})
  res.end('Preview mode enabled')
}
```

--------------------------------

### Configure experimental SWC WASM plugins

Source: https://nextjs.org/docs/architecture/nextjs-compiler

Allows the use of experimental SWC plugins written in WASM to customize transformation behavior. Plugins are configured via an array of tuples containing the plugin path (npm package or local path) and options.

```javascript
module.exports = {
  experimental: {
    swcPlugins: [
      [
        'plugin',
        {
          ...pluginOptions,
        },
      ],
    ],
  },
}
```

--------------------------------

### Display local images from public directory using Next.js Image (TSX/JSX)

Source: https://nextjs.org/docs/app/getting-started/images

This example demonstrates how to render a local image stored in the `public` folder using the Next.js `<Image>` component. The `src` attribute is a path relative to the `public` directory. Explicit `width` and `height` props are provided to ensure correct aspect ratio and prevent layout shifts during image loading.

```tsx
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="/profile.png"
      alt="Picture of the author"
      width={500}
      height={500}
    />
  )
}
```

```jsx
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="/profile.png"
      alt="Picture of the author"
      width={500}
      height={500}
    />
  )
}
```

--------------------------------

### Install Next.js 11 with yarn

Source: https://nextjs.org/docs/pages/guides/upgrading/version-11

Upgrade Next.js to version 11 along with React 17 using yarn package manager. This command updates the core Next.js framework and React dependencies to their version 11 and 17 releases respectively.

```bash
yarn add next@11 react@17 react-dom@17
```

--------------------------------

### Run Jest tests with package managers

Source: https://nextjs.org/docs/pages/guides/testing/jest

Commands to execute Jest tests using different package managers (pnpm, npm, yarn, bun). Each package manager has its own syntax for running npm scripts defined in package.json.

```bash
pnpm test
```

```bash
npm run test
```

```bash
yarn test
```

```bash
bun run test
```

--------------------------------

### Read cookies in Next.js Server Components

Source: https://nextjs.org/docs/app/api-reference/functions/cookies

This example demonstrates how to use the async cookies function to retrieve a specific cookie value within a Server Component. The function must be awaited to access the cookie store methods.

```tsx
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')
  return '...'
}
```

```javascript
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')
  return '...'
}
```

--------------------------------

### Configure Next.js Output File Tracing Root in Monorepos

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/output

This snippet demonstrates how to set `outputFileTracingRoot` in `next.config.js` to define the base directory for file tracing. This is crucial in monorepo setups to ensure files outside the immediate Next.js project directory (e.g., two levels up) are included in the build trace.

```javascript
const path = require('path')

module.exports = {
  // this includes files from the monorepo base two directories up
  outputFileTracingRoot: path.join(__dirname, '../../'),
}
```

--------------------------------

### Implement Logout Action with Next.js Session Deletion

Source: https://nextjs.org/docs/app/guides/authentication

This example demonstrates how to create a server action for user logout. It calls the `deleteSession` function to clear the user's session and then redirects the user to the login page, ensuring a clean logout process.

```ts
import { cookies } from 'next/headers'
import { deleteSession } from '@/app/lib/session'

export async function logout() {
  await deleteSession()
  redirect('/login')
}
```

```js
import { cookies } from 'next/headers'
import { deleteSession } from '@/app/lib/session'

export async function logout() {
  await deleteSession()
  redirect('/login')
}
```

--------------------------------

### Basic Web Vitals logging in Next.js

Source: https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals

Demonstrates how to create a client component that captures performance metrics and logs them to the console. This component is designed to be integrated into the root layout to monitor the entire application's performance.

```javascript
// app/_components/web-vitals.js
'use client'

import { useReportWebVitals } from 'next/web-vitals'

const logWebVitals = (metric) => {
  console.log(metric)
}

export function WebVitals() {
  useReportWebVitals(logWebVitals)

  return null
}

// app/layout.js
import { WebVitals } from './_components/web-vitals'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  )
}
```

--------------------------------

### Debug Next.js Prerendering Errors with `--debug-prerender`

Source: https://nextjs.org/docs/app/api-reference/cli/next

Use the `--debug-prerender` flag with `next build` to get detailed output for prerendering errors. This flag disables server code minification, generates server source maps, enables source map consumption, and allows the build to continue after the first error, providing more readable stack traces. This option is for development debugging only and should not be used for production builds due to potential performance impacts.

```bash
next build --debug-prerender
```

--------------------------------

### Add Loading Component to Dynamic Route in Next.js

Source: https://nextjs.org/docs/app/getting-started/linking-and-navigating

Create a loading.tsx file in a dynamic route folder (e.g., app/blog/[slug]/loading.tsx) to display loading UI while the dynamic content is being fetched and rendered. This prevents users from experiencing a blank page and improves perceived performance for dynamic routes.

```typescript
export default function Loading() {
  return <LoadingSkeleton />
}
```

```javascript
export default function Loading() {
  return <LoadingSkeleton />
}
```

--------------------------------

### Implement Basic Redirect in proxy.js

Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy

Demonstrates how to redirect a request to a new URL using the proxy function. Includes a configuration object with a matcher to define specific paths where the proxy should execute.

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}

export const config = {
  matcher: '/about/:path*',
}
```

```javascript
import { NextResponse } from 'next/server'

// This function can be marked `async` if using `await` inside
export function proxy(request) {
  return NextResponse.redirect(new URL('/home', request.url))
}

export const config = {
  matcher: '/about/:path*',
}
```

--------------------------------

### Akamai custom image loader function for Next.js

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/images

This JavaScript function provides an example of a custom image loader for Next.js using Akamai's image optimization service. It constructs an Akamai-specific URL by appending the `imwidth` parameter with the requested image width. This function can be used as a `loaderFile` or passed directly to the `loader` prop of the `next/image` component.

```js
// Docs: https://techdocs.akamai.com/ivm/reference/test-images-on-demand
export default function akamaiLoader({ src, width, quality }) {
  return `https://example.com/${src}?imwidth=${width}`
}
```

--------------------------------

### Configure PixelBin Image Loader for Next.js

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/images

Utilizes PixelBin's transformation syntax for resizing and compression. It requires a cloud name and enables automatic format selection via the f_auto parameter.

```javascript
// Doc (Resize): https://www.pixelbin.io/docs/transformations/basic/resize/#width-w
// Doc (Optimise): https://www.pixelbin.io/docs/optimizations/quality/#image-quality-when-delivering
// Doc (Auto Format Delivery): https://www.pixelbin.io/docs/optimizations/format/#automatic-format-selection-with-f_auto-url-parameter
export default function pixelBinLoader({ src, width, quality }) {
  const name = '<your-cloud-name>'
  const opt = `t.resize(w:${width})~t.compress(q:${quality || 75})`
  return `https://cdn.pixelbin.io/v2/${name}/${opt}/${src}?f_auto=true`
}
```

--------------------------------

### Migrate Route Handlers with Async Params

Source: https://nextjs.org/docs/app/guides/upgrading/version-15

Update route handlers to await params from segmentData, which is now a Promise type. This applies to GET and other HTTP method handlers that receive segment data with params.

```typescript
// Before
type Params = { slug: string }

export async function GET(request: Request, segmentData: { params: Params }) {
  const params = segmentData.params
  const slug = params.slug
}

// After
type Params = Promise<{ slug: string }>

export async function GET(request: Request, segmentData: { params: Params }) {
  const params = await segmentData.params
  const slug = params.slug
}
```

```javascript
// Before
export async function GET(request, segmentData) {
  const params = segmentData.params
  const slug = params.slug
}

// After
export async function GET(request, segmentData) {
  const params = await segmentData.params
  const slug = params.slug
}
```

--------------------------------

### Integrate TypeScript ESLint Configuration in Next.js (JavaScript)

Source: https://nextjs.org/docs/app/api-reference/config/eslint

This example shows how to incorporate TypeScript-specific lint rules into your Next.js ESLint configuration by adding `eslint-config-next/typescript` to your `eslint.config.mjs`. These rules are based on `plugin:@typescript-eslint/recommended` and enhance linting for TypeScript projects. The snippet also includes the `core-web-vitals` configuration and custom global ignores.

```javascript
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
```

--------------------------------

### Server Action with Read-Your-Own-Writes - TypeScript and JavaScript

Source: https://nextjs.org/docs/app/api-reference/functions/updateTag

Demonstrates a complete example of using updateTag in a Server Action to create a post and immediately invalidate relevant cache tags, ensuring users see fresh data without stale content.

```typescript
'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')

  // Create the post in your database
  const post = await db.post.create({
    data: { title, content },
  })

  // Invalidate cache tags so the new post is immediately visible
  // 'posts' tag: affects any page that displays a list of posts
  updateTag('posts')
  // 'post-{id}' tag: affects the individual post detail page
  updateTag(`post-${post.id}`)

  // Redirect to the new post - user will see fresh data, not cached
  redirect(`/posts/${post.id}`)
}
```

```javascript
'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData) {
  const title = formData.get('title')
  const content = formData.get('content')

  // Create the post in your database
  const post = await db.post.create({
    data: { title, content },
  })

  // Invalidate cache tags so the new post is immediately visible
  // 'posts' tag: affects any page that displays a list of posts
  updateTag('posts')
  // 'post-{id}' tag: affects the individual post detail page
  updateTag(`post-${post.id}`)

  // Redirect to the new post - user will see fresh data, not cached
  redirect(`/posts/${post.id}`)
}
```

--------------------------------

### Manage Request Cookies with NextRequest in TypeScript

Source: https://nextjs.org/docs/app/api-reference/functions/next-request

The cookies property allows for reading and mutating the Set-Cookie header on the request. It provides methods to set, get, delete, check, and clear cookies during request processing.

```typescript
// Set a cookie with a name and value
request.cookies.set('show-banner', 'false');

// Get a specific cookie by name
request.cookies.get('show-banner');

// Get all cookies or all cookies matching a name
request.cookies.getAll('experiments');
request.cookies.getAll();

// Delete a specific cookie
request.cookies.delete('experiments');

// Check if a cookie exists
request.cookies.has('experiments');

// Remove all cookies from the request
request.cookies.clear();
```

--------------------------------

### Access Geolocation Data with `@vercel/functions` in Next.js Middleware

Source: https://nextjs.org/docs/app/guides/upgrading/version-15

This TypeScript example demonstrates how to retrieve geolocation data, specifically the city, from a `NextRequest` object using the `geolocation` function provided by the `@vercel/functions` package within Next.js middleware.

```ts
import { geolocation } from '@vercel/functions'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { city } = geolocation(request)

  // ...
}
```

--------------------------------

### Next.js PPR Runtime Request Flow Diagram

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/adapterPath

This diagram illustrates the runtime flow for serving Partial Prerendering (PPR) content. It shows how a client request is handled by an adapter, which retrieves a cached HTML shell and postponed state, streams the shell immediately, and then invokes the Next.js handler in the background to resume rendering and append the remaining content.

```text
Client
  | GET /ppr-route
  v
Adapter Router
  |
  |-- read cached shell + postponedState ---> Platform Cache
  |<------------- cache hit -----------------|
  |
  |-- create responseStream = concat(shellStream, resumedStream)
  |
  |-- start piping shellStream ------------> Client (first bytes)
  |
  |-- invoke handler(req, res, { requestMeta: { postponed } })
  |   -------------------------------------> Entrypoint (handler)
  |   <------------------------------------- resumed chunks/cache entry
  |
  |-- append resumed chunks to resumedStream
  |
  '-- client receives one HTTP response:
      [shell bytes........][resumed bytes........]
```

--------------------------------

### Script Component with onLoad Event Handler in Next.js

Source: https://nextjs.org/docs/app/guides/scripts

Shows how to use the onLoad event handler to execute code after a script finishes loading. This example imports the Script component in a Client Component (marked with 'use client') and logs a message when the external script loads successfully.

```tsx
'use client'

import Script from 'next/script'

export default function Page() {
  return (
    <>
      <Script
        src="https://example.com/script.js"
        onLoad={() => {
          console.log('Script has loaded')
        }}
      />
    </>
  )
}
```

```jsx
'use client'

import Script from 'next/script'

export default function Page() {
  return (
    <>
      <Script
        src="https://example.com/script.js"
        onLoad={() => {
          console.log('Script has loaded')
        }}
      />
    </>
  )
}
```

--------------------------------

### Configure Next.js Asset Prefix for a Zone

Source: https://nextjs.org/docs/app/guides/multi-zones

This configuration sets an `assetPrefix` for a Next.js application, which is crucial when deploying multiple Next.js apps (zones) under a single domain. The `assetPrefix` ensures that static assets (JavaScript, CSS) from this zone are served from a unique path, preventing conflicts with assets from other zones. This example prefixes all assets with '/blog-static'.

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: '/blog-static',
}
```

--------------------------------

### Read and Apply Nonce to Next.js Script Component in Server Component

Source: https://nextjs.org/docs/app/guides/content-security-policy

This example illustrates how to retrieve a nonce from the `x-nonce` HTTP header within a Next.js Server Component using the `headers()` function. The extracted nonce is then passed to the `nonce` prop of a `<Script>` component, allowing specific external scripts to bypass CSP restrictions while maintaining security.

```tsx
import { headers } from 'next/headers'
import Script from 'next/script'

export default async function Page() {
  const nonce = (await headers()).get('x-nonce')

  return (
    <Script
      src="https://www.googletagmanager.com/gtag/js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  )
}
```

```jsx
import { headers } from 'next/headers'
import Script from 'next/script'

export default async function Page() {
  const nonce = (await headers()).get('x-nonce')

  return (
    <Script
      src="https://www.googletagmanager.com/gtag/js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  )
}
```

--------------------------------

### Share Data Promise Across Component Tree via Context in Next.js Layout

Source: https://nextjs.org/docs/app/guides/streaming

This example shows how to fetch data in a Next.js Server Component layout (`app/layout.tsx`) and pass the resulting promise to a custom `UserProvider`. This pattern enables any descendant component within the subtree to access and resolve the same promise using React context and the `use()` hook, promoting efficient data sharing and avoiding redundant fetches.

```tsx
import { getUser } from '@/lib/data'
// Stores the promise in React context for the subtree
import { UserProvider } from './user-provider'

export default function Layout({ children }: { children: React.ReactNode }) {
  const userPromise = getUser()

  return <UserProvider userPromise={userPromise}>{children}</UserProvider>
}
```

--------------------------------

### Handle Runtime APIs with Suspense Boundary

Source: https://nextjs.org/docs/app/building-your-application/rendering

Wrap components that access runtime APIs (cookies, headers, searchParams, params) in a Suspense boundary since these APIs require request-time information. This ensures the component doesn't block the static shell generation.

```TypeScript
import { cookies } from 'next/headers'
import { Suspense } from 'react'

async function UserGreeting() {
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value || 'light'
  return <p>Your theme: {theme}</p>
}

export default function Page() {
  return (
    <>
      <h1>Dashboard</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <UserGreeting />
      </Suspense>
    </>
  )
}
```

--------------------------------

### Run Tests with bun

Source: https://nextjs.org/docs/pages/guides/testing/vitest

Execute tests in a Next.js project using the bun package manager. This command runs the test script defined in the project's package.json configuration.

```bash
bun run test
```

--------------------------------

### Configure Web Application Manifest in Next.js Metadata

Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

Export metadata with manifest property pointing to a web application manifest JSON file URL. This generates a link tag referencing the manifest file, enabling progressive web app capabilities and app installation features.

```jsx
export const metadata = {
  manifest: 'https://nextjs.org/manifest.json',
}
```

--------------------------------

### Fetching Locale-Specific Data with `getStaticProps` in Next.js

Source: https://nextjs.org/docs/pages/guides/internationalization

This example illustrates how `getStaticProps` can fetch data specific to the current locale. The `locale` parameter is passed to `getStaticProps`, allowing for API calls that retrieve localized content. It also shows how to prevent a specific locale variant of a page from being prerendered by returning `notFound: true`.

```js
export async function getStaticProps({ locale }) {
  // Call an external API endpoint to get posts.
  // You can use any data fetching library
  const res = await fetch(`https://.../posts?locale=${locale}`)
  const posts = await res.json()

  if (posts.length === 0) {
    return {
      notFound: true
    }
  }

  // By returning { props: posts }, the Blog component
  // will receive `posts` as a prop at build time
  return {
    props: {
      posts
    }
  }
}
```

--------------------------------

### Use Tailwind utility classes in Next.js

Source: https://nextjs.org/docs/pages/guides/tailwind-v3-css

Apply Tailwind CSS utility classes to HTML elements in Next.js components. This example demonstrates using text sizing, font weight, and text decoration utilities.

```jsx
export default function Page() {
  return <h1 className="text-3xl font-bold underline">Hello, Next.js!</h1>
}
```

```tsx
export default function Page() {
  return <h1 className="text-3xl font-bold underline">Hello, Next.js!</h1>
}
```

--------------------------------

### Globally configure unoptimized images in Next.js

Source: https://nextjs.org/docs/pages/api-reference/components/image-legacy

This configuration demonstrates how to set `unoptimized` to `true` for all images globally within `next.config.js`. This is useful for projects where image optimization is not desired or handled externally, affecting all `Image` components in the application.

```js
module.exports = {
  images: {
    unoptimized: true,
  },
}
```

--------------------------------

### Lazy Load External Libraries on Demand

Source: https://nextjs.org/docs/app/guides/lazy-loading

Load external libraries dynamically using the import() function only when needed. This example demonstrates loading fuse.js for fuzzy search functionality after a user types in a search input, reducing initial bundle size.

```jsx
'use client'

import { useState } from 'react'

const names = ['Tim', 'Joe', 'Bel', 'Lee']

export default function Page() {
  const [results, setResults] = useState()

  return (
    <div>
      <input
        type="text"
        placeholder="Search"
        onChange={async (e) => {
          const { value } = e.currentTarget
          // Dynamically load fuse.js
          const Fuse = (await import('fuse.js')).default
          const fuse = new Fuse(names)

          setResults(fuse.search(value))
        }}
      />
      <pre>Results: {JSON.stringify(results, null, 2)}</pre>
    </div>
  )
}
```

--------------------------------

### Remove `unstable_` Prefix from Stabilized Next.js APIs

Source: https://nextjs.org/docs/app/guides/upgrading/codemods

The `remove-unstable-prefix` codemod removes the `unstable_` prefix from Next.js APIs that have been stabilized. This ensures your codebase uses the official, stable API names, as shown in the transformation example from `unstable_cacheTag` to `cacheTag`.

```bash
npx @next/codemod@latest remove-unstable-prefix .
```

```typescript
import { unstable_cacheTag as cacheTag } from 'next/cache'

cacheTag()
```

```typescript
import { cacheTag } from 'next/cache'

cacheTag()
```

--------------------------------

### Save Next.js Bundle Analyzer report to disk

Source: https://nextjs.org/docs/app/guides/package-bundling

This command runs the experimental Next.js Bundle Analyzer and saves its analysis output as a static file to disk. This is useful for sharing analysis with teammates or comparing bundle sizes before and after optimizations, without opening the interactive UI.

```bash
npx next experimental-analyze --output
```

```bash
yarn next experimental-analyze --output
```

```bash
pnpm next experimental-analyze --output
```

```bash
bunx next experimental-analyze --output
```

--------------------------------

### Configure Webpack Loaders in Turbopack

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack

Add webpack loader support to Turbopack by configuring file extension rules in next.config.js. This example demonstrates basic loader configuration for SVG files using @svgr/webpack to import SVG files as React components.

```javascript
module.exports = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}
```

--------------------------------

### Implement partial prerendering with Suspense boundary

Source: https://nextjs.org/docs/app/guides/public-static-pages

Demonstrates how to use React Suspense with a fallback UI to enable partial prerendering (PPR) in Next.js. The PromotionContent component streams in dynamically while the fallback PromotionSkeleton is prerendered with static content. This separates prerenderable work from request-time work, allowing the page to serve instantly from a CDN while dynamic content loads in parallel.

```typescript
import { Suspense } from 'react'
import db from '@/db'
import { List, Promotion, PromotionSkeleton } from '@/app/products/ui'
import { getPromotion } from '@/app/products/data'

function Header() {}

async function ProductList() {}

// Dynamic component (streamed)
async function PromotionContent() {
  const promotion = await getPromotion()
  return <Promotion data={promotion} />
}

export default async function Page() {
  return (
    <>
      <Suspense fallback={<PromotionSkeleton />}>
        <PromotionContent />
      </Suspense>
      <Header />
      <ProductList />
    </>
  )
}
```

--------------------------------

### Fetch external API data with getStaticProps in Next.js (TypeScript)

Source: https://nextjs.org/docs/pages/building-your-application/rendering/static

This example demonstrates how to use `getStaticProps` in a Next.js page to fetch data from an external API at build time. It defines a type for the fetched data and passes it as props to the page component for static site generation.

```typescript
import type { InferGetStaticPropsType, GetStaticProps } from 'next'
 
type Repo = {
  name: string
  stargazers_count: number
}
 
export const getStaticProps = (async (context) => {
  const res = await fetch('https://api.github.com/repos/vercel/next.js')
  const repo = await res.json()
  return { props: { repo } }
}) satisfies GetStaticProps<{
  repo: Repo
}>
 
export default function Page({
  repo,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return repo.stargazers_count
}
```

--------------------------------

### Basic Rewrite Configuration in next.config.js

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites

Configure a simple rewrite that maps an incoming request path to a different destination path. The rewrite acts as a URL proxy, masking the destination while keeping the original URL visible to the user. This example shows the basic syntax with source and destination properties.

```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/about',
        destination: '/',
      },
    ]
  },
}
```

--------------------------------

### Configure Next.js TypeScript Options in `next.config.js`

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/typescript

This snippet demonstrates the basic structure for configuring TypeScript behavior within a Next.js project's `next.config.js` file. It shows the default settings for `ignoreBuildErrors` and `tsconfigPath`, providing a starting point for customizing TypeScript integration.

```javascript
module.exports = {
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: 'tsconfig.json',
  },
}
```

--------------------------------

### Redirect directly within Next.js Client Components

Source: https://nextjs.org/docs/app/api-reference/functions/redirect

This example demonstrates how to invoke the redirect function during the rendering phase of a Client Component. When triggered during initial Server-Side Rendering (SSR), Next.js performs a server-side redirect to the specified path.

```tsx
'use client'

import { redirect, usePathname } from 'next/navigation'

export function ClientRedirect() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin') && !pathname.includes('/login')) {
    redirect('/admin/login')
  }

  return <div>Login Page</div>
}
```

```jsx
'use client'

import { redirect, usePathname } from 'next/navigation'

export function ClientRedirect() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin') && !pathname.includes('/login')) {
    redirect('/admin/login')
  }

  return <div>Login Page</div>
}
```

--------------------------------

### Static Files Output Structure

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/adapterPath

Static assets and auto-statically optimized pages. Represents built static files with optional immutable content hashing for cache optimization.

```APIDOC
## Static Files (`outputs.staticFiles`)

### Description
Static assets and auto-statically optimized pages with immutable content hashing.

### Output Type
`STATIC_FILE`

### Properties

- **type** (string) - Required - Always set to 'STATIC_FILE'
- **id** (string) - Required - Route identifier
- **filePath** (string) - Required - Path to the built file
- **pathname** (string) - Required - URL pathname
- **immutableHash** (string | undefined) - Optional - Content hash when the filename contains a hash, indicating the file is immutable

### Example Output
```json
{
  "type": "STATIC_FILE",
  "id": "static-css-main",
  "filePath": ".next/static/css/main.a1b2c3d4.css",
  "pathname": "/_next/static/css/main.a1b2c3d4.css",
  "immutableHash": "a1b2c3d4"
}
```
```

--------------------------------

### Implementing Suspense for Loading States in Next.js Layouts

Source: https://nextjs.org/docs/app/api-reference/file-conventions/layout

This example demonstrates how to use React's `Suspense` component within a Next.js layout to provide a fallback UI while a child component (e.g., `DashboardNav`) fetches data or renders. This approach prevents navigation from blocking and ensures a smooth user experience, especially when dealing with uncached or runtime data access in layouts. It takes `children` and renders them after the suspended component.

```tsx
import { Suspense } from 'react'
import { NavSkeleton } from './nav-skeleton'
import { DashboardNav } from './dashboard-nav'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<NavSkeleton />}>
        <DashboardNav />
      </Suspense>
      <main>{children}</main>
    </>
  )
}
```

```jsx
import { Suspense } from 'react'
import { NavSkeleton } from './nav-skeleton'
import { DashboardNav } from './dashboard-nav'

export default function Layout({ children }) {
  return (
    <>
      <Suspense fallback={<NavSkeleton />}>
        <DashboardNav />
      </Suspense>
      <main>{children}</main>
    </>
  )
}
```

--------------------------------

### Configure Next.js Metadata Inheritance and Overriding

Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

This example demonstrates how Next.js handles metadata inheritance between a root `layout.js` file and a specific `page.js` file. The `layout.js` defines base metadata, while `page.js` can override specific fields like `title` and inherit others like `openGraph` if not explicitly defined. The output shows the resulting HTML `<title>` and `<meta>` tags after inheritance.

```jsx
export const metadata = {
  title: 'Acme',
  openGraph: {
    title: 'Acme',
    description: 'Acme is a...',
  },
}
```

```jsx
export const metadata = {
  title: 'About',
}

// Output:
// <title>About</title>
// <meta property="og:title" content="Acme" />
// <meta property="og:description" content="Acme is a..." />
```

--------------------------------

### refreshTags() - Sync Tag State

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers

Called periodically before starting a new request to sync with external tag services. For in-memory caches, this can be a no-op. For distributed caches, use this to sync tag state from an external service or database.

```APIDOC
## POST Refresh Tags

### Description
Sync cache tag state with external services. Called periodically before starting a new request to ensure tag state is current.

### Method Signature
```ts
refreshTags(): Promise<void>
```

### Parameters
None

### Returns
- **Promise<void>** - Resolves when tag state has been refreshed.

### Implementation Example
```js
const cacheHandler = {
  async refreshTags() {
    // For in-memory cache, no action needed
    // For distributed cache, sync tag state from external service
  },
}
```

### Notes
- Useful for coordinating cache invalidation across multiple instances or services
- For in-memory caches, this can be a no-op
- For distributed caches, sync tag state from an external service or database before processing requests
```

--------------------------------

### Implement Request Context with AsyncLocalStorage

Source: https://nextjs.org/docs/app/api-reference/functions/after

Complete implementation example using Node.js AsyncLocalStorage to manage request context and inject the `waitUntil` function. This pattern enables serverless platforms to support Next.js `after` functionality by storing context per request and providing it to the Next.js handler.

```tsx
import { AsyncLocalStorage } from 'node:async_hooks'

const RequestContextStorage = new AsyncLocalStorage<NextRequestContextValue>()

// Define and inject the accessor that next.js will use
const RequestContext: NextRequestContext = {
  get() {
    return RequestContextStorage.getStore()
  },
}
globalThis[Symbol.for('@next/request-context')] = RequestContext

const handler = (req, res) => {
  const contextValue = { waitUntil: YOUR_WAITUNTIL }
  // Provide the value
  return RequestContextStorage.run(contextValue, () => nextJsHandler(req, res))
}
```

--------------------------------

### Configure Webpack Loaders with Options in Turbopack

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack

Pass configuration options to webpack loaders using an object format instead of a string. Options must be plain JavaScript primitives, objects, and arrays. This example shows @svgr/webpack configured with the icon option enabled.

```javascript
module.exports = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              icon: true,
            },
          },
        ],
        as: '*.js',
      },
    },
  },
}
```

--------------------------------

### Conditionally Configure PostCSS Plugins with postcss.config.js in Next.js

Source: https://nextjs.org/docs/pages/guides/post-css

This example shows how to use a `postcss.config.js` file to apply PostCSS plugins conditionally based on the `NODE_ENV` environment variable. It allows for different plugin sets in development versus production, such as applying transformations only in production builds.

```js
module.exports = {
  plugins:
    process.env.NODE_ENV === 'production'
      ? [
          'postcss-flexbugs-fixes',
          [
            'postcss-preset-env',
            {
              autoprefixer: {
                flexbox: 'no-2009',
              },
              stage: 3,
              features: {
                'custom-properties': false,
              },
            },
          ],
        ]
      : [
          // No transformations in development
        ],
}
```

--------------------------------

### Delegate to Data Access Layer from Next.js Server Actions

Source: https://nextjs.org/docs/app/guides/data-security

This example shows how a "use server" action can delegate its mutation responsibilities to a Data Access Layer (DAL). By calling a function from the DAL, the Server Action remains concise, while the DAL handles the complex logic including authentication, authorization, and database operations. This approach simplifies Server Actions and leverages the centralized security of the DAL.

```ts
'use server'

import { deletePost } from '@/data/posts'
import { revalidatePath } from 'next/cache'

export async function deletePostAction(postId: string) {
  await deletePost(postId) // Auth + authz happen inside the DAL
  revalidatePath('/posts')
}
```

--------------------------------

### Create Loading Component with loading.js in Next.js

Source: https://nextjs.org/docs/app/getting-started/fetching-data

Create a loading.js file in your route folder to display a loading UI while the page is being rendered. This component is automatically wrapped in a Suspense boundary and streams the entire page content. The loading state appears immediately on navigation, then swaps with the rendered content.

```typescript
export default function Loading() {
  // Define the Loading UI here
  return <div>Loading...</div>
}
```

```javascript
export default function Loading() {
  // Define the Loading UI here
  return <div>Loading...</div>
}
```

--------------------------------

### Basic In-Memory Cache Handler Implementation

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers

Minimal JavaScript implementation of a Next.js cache handler using a Map for storage. Demonstrates core caching concepts including get/set operations, expiration checking, pending operation tracking, and tag-based invalidation. This example is suitable for development but lacks production features like LRU eviction and comprehensive error handling.

```javascript
const cache = new Map()
const pendingSets = new Map()

module.exports = {
  async get(cacheKey, softTags) {
    // Wait for any pending set operation to complete
    const pendingPromise = pendingSets.get(cacheKey)
    if (pendingPromise) {
      await pendingPromise
    }

    const entry = cache.get(cacheKey)
    if (!entry) {
      return undefined
    }

    // Check if entry has expired
    const now = Date.now()
    if (now > entry.timestamp + entry.revalidate * 1000) {
      return undefined
    }

    return entry
  },

  async set(cacheKey, pendingEntry) {
    // Create a promise to track this set operation
    let resolvePending
    const pendingPromise = new Promise((resolve) => {
      resolvePending = resolve
    })
    pendingSets.set(cacheKey, pendingPromise)

    try {
      // Wait for the entry to be ready
      const entry = await pendingEntry

      // Store the entry in the cache
      cache.set(cacheKey, entry)
    } finally {
      resolvePending()
      pendingSets.delete(cacheKey)
    }
  },

  async refreshTags() {
    // No-op for in-memory cache
  },

  async getExpiration(tags) {
    // Return 0 to indicate no tags have been revalidated
    return 0
  },

  async updateTags(tags, durations) {
    // Implement tag-based invalidation
    for (const [key, entry] of cache.entries()) {
      if (entry.tags.some((tag) => tags.includes(tag))) {
        cache.delete(key)
      }
    }
  },
}
```

--------------------------------

### Implement Static Site Generation using getStaticProps in Next.js

Source: https://nextjs.org/docs/pages/guides/migrating/app-router-migration

Uses the getStaticProps function to fetch data at build time in the pages directory. This allows for pre-rendering pages with external data, improving performance and SEO.

```jsx
// `pages` directory

export async function getStaticProps() {
  const res = await fetch(`https://...`)
  const projects = await res.json()

  return { props: { projects } }
}

export default function Index({ projects }) {
  return projects.map((project) => <div>{project.name}</div>)
}
```

--------------------------------

### Conditionally Fetching Draft Data in Next.js `getStaticProps`

Source: https://nextjs.org/docs/pages/guides/draft-mode

This JavaScript example demonstrates how to modify data fetching logic within `getStaticProps` based on `context.draftMode`. It allows fetching from different API endpoints (e.g., draft vs. production) to display unpublished content.

```js
export async function getStaticProps(context) {
  const url = context.draftMode
    ? 'https://draft.example.com'
    : 'https://production.example.com'
  const res = await fetch(url)
  // ...
}
```

--------------------------------

### Implement UI-Level Caching for Components and Pages

Source: https://nextjs.org/docs/app/building-your-application/rendering

Cache an entire component, page, or layout by adding the 'use cache' directive at the top of the component body. This caches the rendered output along with any data fetching operations within the component.

```TypeScript
import { cacheLife } from 'next/cache'

export default async function Page() {
  'use cache'
  cacheLife('hours')

  const users = await db.query('SELECT * FROM users')

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

--------------------------------

### Use NextProxy Type for Automatic Type Inference

Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy

Demonstrates using the NextProxy type for shorthand proxy function definition with automatic type inference for request (NextRequest) and event (NextFetchEvent) parameters. Includes example of accessing request pathname and returning JSON response.

```typescript
import type { NextProxy } from 'next/server'

export const proxy: NextProxy = (request, event) => {
  event.waitUntil(Promise.resolve())
  return Response.json({ pathname: request.nextUrl.pathname })
}
```

--------------------------------

### Define Supported HTTP Methods in Next.js Route Handlers

Source: https://nextjs.org/docs/app/api-reference/file-conventions/route

Shows how to export functions corresponding to standard HTTP methods like GET, POST, PUT, DELETE, and PATCH. Next.js automatically handles the OPTIONS method if it is not explicitly defined.

```typescript
export async function GET(request: Request) {}

export async function HEAD(request: Request) {}

export async function POST(request: Request) {}

export async function PUT(request: Request) {}

export async function DELETE(request: Request) {}

export async function PATCH(request: Request) {}

// If `OPTIONS` is not defined, Next.js will automatically implement `OPTIONS` and set the appropriate Response `Allow` header depending on the other methods defined in the Route Handler.
export async function OPTIONS(request: Request) {}
```

```javascript
export async function GET(request) {}

export async function HEAD(request) {}

export async function POST(request) {}

export async function PUT(request) {}

export async function DELETE(request) {}

export async function PATCH(request) {}

// If `OPTIONS` is not defined, Next.js will automatically implement `OPTIONS` and set the appropriate Response `Allow` header depending on the other methods defined in the Route Handler.
export async function OPTIONS(request) {}
```

--------------------------------

### Import Global CSS in Next.js Root Layout - JavaScript

Source: https://nextjs.org/docs/app/guides/tailwind-v3-css

Import the global CSS file in the Next.js root layout component (JavaScript version). This ensures Tailwind styles are available throughout the entire application.

```javascript
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

--------------------------------

### Load Custom Fonts in Next.js ImageResponse

Source: https://nextjs.org/docs/app/api-reference/functions/image-response

Demonstrates how to load custom fonts from the file system and configure them in ImageResponse options for Open Graph image generation. The example loads an Inter SemiBold font file and applies it to the generated image with specified style and weight properties.

```typescript
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Image metadata
export const alt = 'My site'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
  // Font loading, process.cwd() is Next.js project directory
  const interSemiBold = await readFile(
    join(process.cwd(), 'assets/Inter-SemiBold.ttf')
  )

  return new ImageResponse(
    (
      // ...
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: interSemiBold,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  )
}
```

--------------------------------

### Implement Dynamic Navigation in Blog Layouts

Source: https://nextjs.org/docs/app/api-reference/file-conventions/layout

A layout component that fetches a list of posts and maps them to custom NavLink components. This pattern allows layouts to provide dynamic navigation based on server-side data.

```tsx
import { NavLink } from './nav-link'
import getPosts from './get-posts'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const featuredPosts = await getPosts()
  return (
    <div>
      {featuredPosts.map((post) => (
        <div key={post.id}>
          <NavLink slug={post.slug}>{post.title}</NavLink>
        </div>
      ))}
      <div>{children}</div>
    </div>
  )
}
```

```jsx
import { NavLink } from './nav-link'
import getPosts from './get-posts'

export default async function Layout({ children }) {
  const featuredPosts = await getPosts()
  return (
    <div>
      {featuredPosts.map((post) => (
        <div key={post.id}>
          <NavLink slug={post.slug}>{post.title}</NavLink>
        </div>
      ))}
      <div>{children}</div>
    </div>
  )
}
```

--------------------------------

### Demonstrating error when passing tainted value directly (TSX)

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/taint

This example illustrates the effect of `experimental_taintUniqueValue`. Attempting to pass the directly tainted `systemConfig.SERVICE_API_KEY` (even if reassigned to a new variable `version`) to a client component will result in an error, preventing accidental exposure of sensitive data.

```tsx
export async function Dashboard() {
  const systemConfig = await getSystemConfig()
  // Someone makes a mistake in a PR
  const version = systemConfig.SERVICE_API_KEY

  return <ClientDashboard version={version} />
}
```

--------------------------------

### Opt Out of Static Shell with Empty Suspense Fallback in Next.js

Source: https://nextjs.org/docs/app/building-your-application/rendering

Demonstrates placing a Suspense boundary with an empty fallback at the root layout level to defer the entire app to request time. This prevents static shell generation and causes every request to block until full page rendering completes. Useful for apps requiring fully dynamic rendering.

```typescript
import { Suspense } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <Suspense fallback={null}>
        <body>{children}</body>
      </Suspense>
    </html>
  )
}
```

--------------------------------

### Synchronize Cache Tags with refreshTags() Method

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers

Called periodically before starting a new request to sync cache tag state with external services. For in-memory caches this can be a no-op, but for distributed caches it syncs tag state from external services or databases before processing requests.

```typescript
refreshTags(): Promise<void>
```

```javascript
const cacheHandler = {
  async refreshTags() {
    // For in-memory cache, no action needed
    // For distributed cache, sync tag state from external service
  },
}
```

--------------------------------

### revalidateTag in Server Action - TypeScript

Source: https://nextjs.org/docs/app/api-reference/functions/revalidateTag

Demonstrates using revalidateTag in a Server Action with TypeScript. The example shows marking the 'posts' tag as stale with profile='max', which triggers stale-while-revalidate semantics when pages using that tag are next visited.

```typescript
'use server'

import { revalidateTag } from 'next/cache'

export default async function submit() {
  await addPost()
  revalidateTag('posts', 'max')
}
```

--------------------------------

### Conditionally load polyfills in React hooks

Source: https://nextjs.org/docs/architecture/supported-browsers

Dynamically import polyfills only when needed by checking for feature support at runtime. This approach reduces bundle size by loading polyfills only for browsers that require them. The example uses a custom hook to conditionally load a structured-clone polyfill when the feature is not available.

```typescript
import { useCallback } from 'react'

export const useAnalytics = () => {
  const tracker = useCallback(async (data: unknown) => {
    if (!('structuredClone' in globalThis)) {
      import('polyfills/structured-clone').then((mod) => {
        globalThis.structuredClone = mod.default
      })
    }

    /* Do some work that uses structured clone */
  }, [])

  return tracker
}
```

```javascript
import { useCallback } from 'react'

export const useAnalytics = () => {
  const tracker = useCallback(async (data) => {
    if (!('structuredClone' in globalThis)) {
      import('polyfills/structured-clone').then((mod) => {
        globalThis.structuredClone = mod.default
      })
    }

    /* Do some work that uses structured clone */
  }, [])

  return tracker
}
```

--------------------------------

### Dynamic Route Page with State Management

Source: https://nextjs.org/docs/pages/api-reference/functions/use-router

Demonstrates a dynamic route page component that maintains state across navigations. The example shows how state persists when navigating between different pages using the same component, illustrating the default Next.js behavior where components are not unmounted.

```jsx
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Page(props) {
  const router = useRouter()
  const [count, setCount] = useState(0)
  return (
    <div>
      <h1>Page: {router.query.slug}</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increase count</button>
      <Link href="/one">one</Link> <Link href="/two">two</Link>
    </div>
  )
}
```

--------------------------------

### Applying Next.js Fonts with Tailwind CSS Utility Classes

Source: https://nextjs.org/docs/pages/api-reference/components/font

This HTML example demonstrates how to apply the configured fonts to elements using standard Tailwind CSS utility classes like `font-sans` and `font-mono`. These classes will resolve to the fonts defined via `next/font` and configured in `tailwind.config.js`.

```html
<p class="font-sans ...">The quick brown fox ...</p>
<p class="font-mono ...">The quick brown fox ...</p>
```

--------------------------------

### Integrate Memoized Data for `generateMetadata` and Page Component in Next.js

Source: https://nextjs.org/docs/app/getting-started/metadata-and-og-images

This example illustrates how to integrate a memoized data fetching function (`getPost`) into a Next.js dynamic route (`app/blog/[slug]/page.tsx` or `.js`). It shows how both the `generateMetadata` function and the default page component can call the same `getPost` function to fetch data, leveraging memoization to ensure efficient data retrieval without duplicate requests, thereby optimizing data access and improving application performance.

```tsx
import { getPost } from '@/app/lib/data'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getPost(params.slug)
  return {
    title: post.title,
    description: post.description,
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  return <div>{post.title}</div>
}
```

```jsx
import { getPost } from '@/app/lib/data'

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug)
  return {
    title: post.title,
    description: post.description,
  }
}

export default async function Page({ params }) {
  const post = await getPost(params.slug)
  return <div>{post.title}</div>
}
```

--------------------------------

### Dynamically configure `deploymentId` in Next.js `next.config.js` with environment variables

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/deploymentId

This example illustrates how to dynamically set the `deploymentId` in `next.config.js` using environment variables like `DEPLOYMENT_VERSION` or `GIT_SHA`. This approach is ideal for multi-server or rolling deployment scenarios where the identifier needs to reflect the current deployment version.

```javascript
module.exports = {
  deploymentId: process.env.DEPLOYMENT_VERSION || process.env.GIT_SHA,
}
```

--------------------------------

### Import Global CSS in Next.js Root Layout - TypeScript

Source: https://nextjs.org/docs/app/guides/tailwind-v3-css

Import the global CSS file in the Next.js root layout component (TypeScript version). This ensures Tailwind styles are available throughout the entire application.

```typescript
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

--------------------------------

### Log Web Vitals using useReportWebVitals in Next.js

Source: https://nextjs.org/docs/pages/api-reference/functions/use-report-web-vitals

This example demonstrates the basic implementation of useReportWebVitals within a custom App component. The hook accepts a callback function that receives metric objects containing performance data for the current page load.

```jsx
import { useReportWebVitals } from 'next/web-vitals'

const logWebVitals = (metric) => {
  console.log(metric)
}

function MyApp({ Component, pageProps }) {
  useReportWebVitals(logWebVitals)

  return <Component {...pageProps} />
}
```

--------------------------------

### Type Checking Next.js Configuration with JSDoc in JavaScript

Source: https://nextjs.org/docs/app/api-reference/config/typescript

For projects using `next.config.js`, this example shows how to leverage JSDoc comments to add type checking capabilities within your IDE. The `@ts-check` directive and `@type {import('next').NextConfig}` JSDoc comment provide type hints without converting to TypeScript.

```js
// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
}

module.exports = nextConfig
```

--------------------------------

### Configure default minimum cache TTL for Next.js images

Source: https://nextjs.org/docs/pages/api-reference/components/image-legacy

This configuration sets the default Time to Live (TTL) in seconds for cached optimized images in Next.js. The `minimumCacheTTL` ensures that optimized images are cached for at least the specified duration, which is 4 hours (14400 seconds) in this example, before revalidation is considered. This value is used if the upstream image's `Cache-Control` header does not provide a larger `max-age`.

```javascript
module.exports = {
  images: {
    minimumCacheTTL: 14400, // 4 hours
  },
}
```

--------------------------------

### Implementing Hover-Based Prefetching for Next.js Links

Source: https://nextjs.org/docs/app/guides/prefetching

This client component provides a custom `<Link>` wrapper that defers prefetching until the user hovers over the link. This optimizes resource usage by only prefetching routes that the user is likely to visit, offering a balance between performance and controlled prefetching.

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

export function HoverPrefetchLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const [active, setActive] = useState(false)

  return (
    <Link
      href={href}
      prefetch={active ? null : false}
      onMouseEnter={() => setActive(true)}
    >
      {children}
    </Link>
  )
}
```

```jsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

export function HoverPrefetchLink({ href, children }) {
  const [active, setActive] = useState(false)

  return (
    <Link
      href={href}
      prefetch={active ? null : false}
      onMouseEnter={() => setActive(true)}
    >
      {children}
    </Link>
  )
}
```

--------------------------------

### Handle Deterministic Operations in Next.js Prerendering

Source: https://nextjs.org/docs/app/building-your-application/rendering

Shows how synchronous I/O operations, module imports, and pure computations can be used in async components for automatic static prerendering. The component reads a JSON file synchronously, imports constants, and performs pure computations on the data, all of which are included in the static HTML shell.

```typescript
import fs from 'node:fs'

export default async function Page() {
  const content = fs.readFileSync('./config.json', 'utf-8')
  const constants = await import('./constants.json')
  const processed = JSON.parse(content).items.map((item) => item.value * 2)

  return (
    <div>
      <h1>{constants.appName}</h1>
      <ul>
        {processed.map((value, i) => (
          <li key={i}>{value}</li>
        ))}
      </ul>
    </div>
  )
}
```

--------------------------------

### Load environment variables from .env file in Next.js

Source: https://nextjs.org/docs/pages/guides/environment-variables

Configure environment variables in a .env file that are automatically loaded into process.env. These variables can be accessed in Next.js data fetching methods and API routes. The example shows loading database credentials for use in getStaticProps.

```txt
DB_HOST=localhost
DB_USER=myuser
DB_PASS=mypassword
```

```javascript
export async function getStaticProps() {
  const db = await myDB.connect({
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
  })
  // ...
}
```

--------------------------------

### ReactDOM.preload Method Signature (TypeScript)

Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

Provides the TypeScript signature for the `ReactDOM.preload` method. This method is used to initiate early loading of a resource, corresponding to the `<link rel="preload">` HTML tag. It requires a `href` and an `as` option to specify the resource type.

```tsx
ReactDOM.preload(href: string, options: { as: string })
```

--------------------------------

### Handle Header Overriding Behavior in Next.js

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers

This example illustrates how Next.js resolves conflicts when multiple header configurations match the same path and attempt to set the same header key. When such a conflict occurs, the header defined later in the `headers` array will override any previously set values for that specific key and path. This behavior ensures predictable header outcomes.

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-hello',
            value: 'there',
          },
        ],
      },
      {
        source: '/hello',
        headers: [
          {
            key: 'x-hello',
            value: 'world',
          },
        ],
      },
    ]
  },
}
```

--------------------------------

### Fetch data on each request using getServerSideProps in Next.js

Source: https://nextjs.org/docs/pages/api-reference/functions/get-server-side-props

This example demonstrates how to fetch external API data on every request and pass it as props to a React component. It includes type-safe implementation for TypeScript and a standard JavaScript version for the Next.js Pages Router.

```tsx
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'

type Repo = {
  name: string
  stargazers_count: number
}

export const getServerSideProps = (async () => {
  // Fetch data from external API
  const res = await fetch('https://api.github.com/repos/vercel/next.js')
  const repo: Repo = await res.json()
  // Pass data to the page via props
  return { props: { repo } }
}) satisfies GetServerSideProps<{ repo: Repo }>

export default function Page({
  repo,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <main>
      <p>{repo.stargazers_count}</p>
    </main>
  )
}
```

```jsx
export async function getServerSideProps() {
  // Fetch data from external API
  const res = await fetch('https://api.github.com/repos/vercel/next.js')
  const repo = await res.json()
  // Pass data to the page via props
  return { props: { repo } }
}

export default function Page({ repo }) {
  return (
    <main>
      <p>{repo.stargazers_count}</p>
    </main>
  )
}
```

--------------------------------

### Create Next.js App with pnpm

Source: https://nextjs.org/docs/app/api-reference/cli/create-next-app

Initialize a new Next.js application using pnpm package manager. This command creates a new project with the specified project name and applies any provided options.

```bash
pnpm create next-app [project-name] [options]
```

--------------------------------

### Register OpenTelemetry in Next.js instrumentation.js|ts

Source: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

This snippet demonstrates how to export a `register` function in `instrumentation.ts` or `instrumentation.js` to initialize OpenTelemetry. This function is called once when the Next.js server starts and must complete before handling requests. It integrates observability by calling `registerOTel` from `@vercel/otel`.

```ts
import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel('next-app')
}
```

```js
import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel('next-app')
}
```

--------------------------------

### Implement Next.js Middleware with conditional logic for specific paths

Source: https://nextjs.org/docs/messages/middleware-upgrade-guide

This TypeScript example illustrates how to use conditional statements within a Next.js Middleware function to apply logic only to specific paths. It demonstrates checking `request.nextUrl.pathname` to execute different code blocks for `/about` and `/dashboard` routes, offering explicit ordering control.

```ts
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/about')) {
    // This logic is only applied to /about
  }

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // This logic is only applied to /dashboard
  }
}
```

--------------------------------

### Implement Layout with Navigation Links and Loading Indicators

Source: https://nextjs.org/docs/app/api-reference/functions/use-link-status

Create a layout component that renders a navigation menu with multiple links, each accompanied by a LoadingIndicator component. Maps through an array of link objects to generate navigation items, demonstrating how to integrate the loading indicator into a real navigation structure.

```tsx
import Link from 'next/link'
import LoadingIndicator from './components/loading-indicator'

const links = [
  { href: '/shop/electronics', label: 'Electronics' },
  { href: '/shop/clothing', label: 'Clothing' },
  { href: '/shop/books', label: 'Books' },
]

function Menubar() {
  return (
    <div>
      {links.map((link) => (
        <Link key={link.label} href={link.href}>
          <span className="label">{link.label}</span> <LoadingIndicator />
        </Link>
      ))}
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Menubar />
      {children}
    </div>
  )
}
```

```jsx
import Link from 'next/link'
import LoadingIndicator from './components/loading-indicator'

const links = [
  { href: '/shop/electronics', label: 'Electronics' },
  { href: '/shop/clothing', label: 'Clothing' },
  { href: '/shop/books', label: 'Books' },
]

function Menubar() {
  return (
    <div>
      {links.map((link) => (
        <Link key={link.label} href={link.href}>
          <span className="label">{link.label}</span> <LoadingIndicator />
        </Link>
      ))}
    </div>
  )
}

export default function Layout({ children }) {
  return (
    <div>
      <Menubar />
      {children}
    </div>
  )
}
```

--------------------------------

### Retrieve Cache Entry with get() Method

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers

Retrieves a cache entry by key and checks for expiration based on revalidate time. Returns the CacheEntry object if valid, or undefined if not found or expired. The method accepts a cache key string and optional soft tags array for staleness checking.

```typescript
get(cacheKey: string, softTags: string[]): Promise<CacheEntry | undefined>
```

```javascript
const cacheHandler = {
  async get(cacheKey, softTags) {
    const entry = cache.get(cacheKey)
    if (!entry) return undefined

    // Check if expired
    const now = Date.now()
    if (now > entry.timestamp + entry.revalidate * 1000) {
      return undefined
    }

    return entry
  },
}
```

--------------------------------

### POST /api/hello

Source: https://nextjs.org/docs/pages/building-your-application/routing/api-routes

Demonstrates how to handle POST requests and access the request body in a Next.js API route.

```APIDOC
## POST /api/hello

### Description
Processes an incoming POST request using the built-in request helpers to parse the body.

### Method
POST

### Endpoint
/api/hello

### Parameters
#### Request Body
- **req.body** (object) - Required - An object containing the body parsed by content-type.

#### Cookies
- **req.cookies** (object) - Optional - An object containing the cookies sent by the request.

### Request Example
{
  "name": "John Doe"
}

### Response
#### Success Response (200)
- **status** (string) - Confirmation of the processed request.

### Response Example
{
  "message": "Post request received"
}
```

--------------------------------

### Next.js Blog Page Integrating Static, Cached, and Streaming Content

Source: https://nextjs.org/docs/app/building-your-application/rendering

This `app/blog/page.tsx` file illustrates a full Next.js page that combines various rendering strategies. It includes a static header, a `BlogPosts` component that fetches and caches data using `use cache`, `cacheLife`, and `cacheTag`, and `UserPreferences` and `CreatePost` components that stream dynamic content using `Suspense`. The `CreatePost` component also demonstrates a server action to revalidate the 'posts' cache using `updateTag` after a new post is created.

```tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag, updateTag } from 'next/cache'
import Link from 'next/link'
 
export default function BlogPage() {
  return (
    <>
      {/* Static content - prerendered automatically */}
      <header>
        <h1>Our Blog</h1>
        <nav>
          <Link href="/">Home</Link> | <Link href="/about">About</Link>
        </nav>
      </header>
 
      {/* Cached dynamic content - included in the static shell */}
      <BlogPosts />
 
      {/* Runtime dynamic content - streams at request time */}
      <Suspense fallback={<p>Loading your preferences...</p>}>
        <UserPreferences />
      </Suspense>
 
      {/* Mutation - server action that revalidates the cache */}
      <Suspense fallback={<p>Loading...</p>}>
        <CreatePost />
      </Suspense>
    </>
  )
}
 
// Everyone sees the same blog posts (revalidated every hour)
async function BlogPosts() {
  'use cache'
  cacheLife('hours')
  cacheTag('posts')
 
  const res = await fetch('https://api.vercel.app/blog')
  const posts = await res.json()
 
  return (
    <section>
      <h2>Latest Posts</h2>
      <ul>
        {posts.slice(0, 5).map((post: any) => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>
              By {post.author} on {post.date}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
 
// Personalized per user based on their cookie
async function UserPreferences() {
  const theme = (await cookies()).get('theme')?.value || 'light'
  const favoriteCategory = (await cookies()).get('category')?.value
 
  return (
    <aside>
      <p>Your theme: {theme}</p>
      {favoriteCategory && <p>Favorite category: {favoriteCategory}</p>}
    </aside>
  )
}
 
// Admin-only form that creates a post and revalidates the cache
async function CreatePost() {
  const isAdmin = (await cookies()).get('role')?.value === 'admin'
  if (!isAdmin) return null
 
  async function createPost(formData: FormData) {
    'use server'
    await db.post.create({ data: { title: formData.get('title') } })
    updateTag('posts')
  }
 
  return (
    <form action={createPost}>
      <input name="title" placeholder="Post title" required />
      <button type="submit">Publish</button>
    </form>
  )
}
```

--------------------------------

### Implement a basic Next.js adapter

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/adapterPath

A minimal implementation of a custom adapter that modifies configuration during the production build phase and logs build output details such as page paths and API routes.

```javascript
/** @type {import('next').NextAdapter} */
const adapter = {
  name: 'my-custom-adapter',

  async modifyConfig(config, { phase }) {
    // Modify the Next.js config based on the build phase
    if (phase === 'phase-production-build') {
      return {
        ...config,
        // Add your modifications
      }
    }
    return config
  },

  async onBuildComplete({
    routing,
    outputs,
    projectDir,
    repoRoot,
    distDir,
    config,
    nextVersion,
    buildId,
  }) {
    // Process the build output
    console.log('Build completed with', outputs.pages.length, 'pages')
    console.log('Build ID:', buildId)
    console.log('Dynamic routes:', routing.dynamicRoutes.length)

    // Access emitted output entries
    for (const page of outputs.pages) {
      console.log('Page:', page.pathname, 'at', page.filePath)
    }

    for (const apiRoute of outputs.pagesApi) {
      console.log('API Route:', apiRoute.pathname, 'at', apiRoute.filePath)
    }

    for (const appPage of outputs.appPages) {
      console.log('App Page:', appPage.pathname, 'at', appPage.filePath)
    }

    for (const prerender of outputs.prerenders) {
      console.log('Prerendered:', prerender.pathname)
    }
  },
}

module.exports = adapter
```

--------------------------------

### Implement GoogleTagManager in root layout

Source: https://nextjs.org/docs/app/guides/third-party-libraries

Add the GoogleTagManager component to your root layout to load Google Tag Manager for all routes. Pass your GTM container ID (starting with GTM-) as the gtmId prop. The component fetches the original inline script after hydration.

```typescript
import { GoogleTagManager } from '@next/third-parties/google'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <GoogleTagManager gtmId="GTM-XYZ" />
      <body>{children}</body>
    </html>
  )
}
```

```javascript
import { GoogleTagManager } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <GoogleTagManager gtmId="GTM-XYZ" />
      <body>{children}</body>
    </html>
  )
}
```

--------------------------------

### Route Requests to Next.js Zones using Rewrites

Source: https://nextjs.org/docs/app/guides/multi-zones

This configuration demonstrates how to use Next.js `rewrites` to route incoming requests to different zones (separate Next.js applications) based on their URL paths. It includes rules for routing specific paths like '/blog' and '/blog/:path+' to a designated blog domain, as well as routing the associated static assets ('/blog-static/:path+') to ensure the correct zone handles all its content. The `destination` should point to the production domain of the respective zone.

```js
async rewrites() {
    return [
        {
            source: '/blog',
            destination: `${process.env.BLOG_DOMAIN}/blog`,
        },
        {
            source: '/blog/:path+',
            destination: `${process.env.BLOG_DOMAIN}/blog/:path+`,
        },
        {
            source: '/blog-static/:path+',
            destination: `${process.env.BLOG_DOMAIN}/blog-static/:path+`,
        }
    ];
}
```

--------------------------------

### Configure Turbopack in Next.js 15 with Experimental Flag

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

Set up Turbopack configuration in Next.js 15 using the experimental.turbopack property. This configuration approach is used before Turbopack becomes a stable top-level option.

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    turbopack: {
      // options
    },
  },
}

export default nextConfig
```

--------------------------------

### Perform CPU Profiling in Next.js with `--experimental-cpu-prof`

Source: https://nextjs.org/docs/app/api-reference/cli/next

Capture CPU profiles to analyze performance bottlenecks in your Next.js application using the `--experimental-cpu-prof` flag. This flag enables V8's built-in CPU profiler and saves the generated profiles to the `.next/cpu-profiles/` directory upon process exit. It can be used with both `next build` to profile the build process and `next dev` to profile the development server.

```bash
# Profile the build process
next build --experimental-cpu-prof

# Profile the dev server (profile saved on Ctrl+C or SIGTERM)
next dev --experimental-cpu-prof
```

--------------------------------

### Define Server Functions in separate files for Next.js mutations

Source: https://nextjs.org/docs/app/getting-started/mutating-data

Create reusable server-side logic by placing the 'use server' directive at the top of a file or within specific functions. This example demonstrates handling FormData and implementing authentication checks for creating and deleting posts.

```typescript
import { auth } from '@/lib/auth'

export async function createPost(formData: FormData) {
  'use server'
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const title = formData.get('title')
  const content = formData.get('content')

  // Mutate data
  // Revalidate cache
}

export async function deletePost(formData: FormData) {
  'use server'
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const id = formData.get('id')

  // Verify the user owns this resource before deleting
  // Mutate data
  // Revalidate cache
}
```

```javascript
import { auth } from '@/lib/auth'

export async function createPost(formData) {
  'use server'
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const title = formData.get('title')
  const content = formData.get('content')

  // Mutate data
  // Revalidate cache
}

export async function deletePost(formData) {
  'use server'
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const id = formData.get('id')

  // Verify the user owns this resource before deleting
  // Mutate data
  // Revalidate cache
}
```

--------------------------------

### Optimize Icon Imports in React

Source: https://nextjs.org/docs/app/guides/local-development

Demonstrates how to import specific icons directly from a library's distribution folder instead of using top-level imports. This prevents the compiler from processing thousands of unused modules, significantly improving build performance.

```jsx
import { TriangleIcon } from "@phosphor-icons/react/dist/csr/Triangle"
```

--------------------------------

### Illustrate Next.js Server Actions Security Features

Source: https://nextjs.org/docs/app/guides/data-security

This example demonstrates how Next.js enhances the security of Server Actions. It shows that actions used in the application receive secure, encrypted IDs for client-side reference, while unused actions are eliminated from the client bundle during `next build`, preventing public access and reducing attack surface.

```jsx
// app/actions.js
'use server'

// If this action **is** used in our application, Next.js
// will create a secure ID to allow the client to reference
// and call the Server Action.
export async function updateUserAction(formData) {}

// If this action **is not** used in our application, Next.js
// will automatically remove this code during `next build`
// and will not create a public endpoint.
export async function deleteUserAction(formData) {}
```

--------------------------------

### Apply Wildcard Path Matching to Next.js Headers

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers

Use wildcard modifiers on path parameters to match multiple path segments. The * modifier matches zero or more segments, + matches one or more, and ? matches zero or one. For example, /blog/:slug* matches /blog, /blog/a, and /blog/a/b/c.

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/blog/:slug*',
        headers: [
          {
            key: 'x-slug',
            value: ':slug*',
          },
          {
            key: 'x-slug-:slug*',
            value: 'my other custom header value',
          },
        ],
      },
    ]
  },
}
```

--------------------------------

### Use refresh function in Server Action - TypeScript/JavaScript

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

The refresh function from 'next/cache' allows you to refresh the client router from within a Server Action. This example demonstrates marking a notification as read in the database and then refreshing the notification count displayed in the header. Use this when you need to refresh the client router after performing an action.

```typescript
'use server'

import { refresh } from 'next/cache'

export async function markNotificationAsRead(notificationId: string) {
  // Update the notification in the database
  await db.notifications.markAsRead(notificationId)

  // Refresh the notification count displayed in the header
  refresh()
}
```

```javascript
'use server'

import { refresh } from 'next/cache'

export async function markNotificationAsRead(notificationId) {
  // Update the notification in the database
  await db.notifications.markAsRead(notificationId)

  // Refresh the notification count displayed in the header
  refresh()
}
```

--------------------------------

### Implement Mixed Caching Strategies with Next.js Directives

Source: https://nextjs.org/docs/app/api-reference/directives/use-cache-remote

This example shows how to use 'use cache', 'use cache: remote', and 'use cache: private' to manage data at different scopes. It utilizes cacheTag for invalidation and cacheLife for expiration settings within an asynchronous React component.

```tsx
import { Suspense } from 'react'
import { connection } from 'next/server'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag } from 'next/cache'

// Static product data - prerendered at build time
async function getProduct(id: string) {
  'use cache'
  cacheTag(`product-${id}`)

  // This is cached at build time and shared across all users
  return db.products.find({ where: { id } })
}

// Shared pricing data - cached at runtime in remote handler
async function getProductPrice(id: string) {
  'use cache: remote'
  cacheTag(`product-price-${id}`)
  cacheLife({ expire: 300 }) // 5 minutes

  // This is cached at runtime and shared across all users
  return db.products.getPrice({ where: { id } })
}

// User-specific recommendations - private cache per user
async function getRecommendations(productId: string) {
  'use cache: private'
  cacheLife({ expire: 60 }) // 1 minute

  const sessionId = (await cookies()).get('session-id')?.value

  // This is cached per-user and never shared
  return db.recommendations.findMany({
    where: { productId, sessionId },
  })
}

export default async function ProductPage({ params }) {
  const { id } = await params

  // Static product data
  const product = await getProduct(id)

  return (
    <div>
      <ProductDetails product={product} />

      {/* Dynamic shared price */}
      <Suspense fallback={<PriceSkeleton />}>
        <ProductPriceComponent productId={id} />
      </Suspense>

      {/* Dynamic personalized recommendations */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <ProductRecommendations productId={id} />
      </Suspense>
    </div>
  )
}

function ProductDetails({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  )
}

async function ProductPriceComponent({ productId }) {
  // Defer to request time
  await connection()

  const price = await getProductPrice(productId)
  return <div>Price: ${price}</div>
}

async function ProductRecommendations({ productId }) {
  const recommendations = await getRecommendations(productId)
  return <RecommendationsList items={recommendations} />
}

function PriceSkeleton() {
  return <div>Loading price...</div>
}

function RecommendationsSkeleton() {
  return <div>Loading recommendations...</div>
}

function RecommendationsList({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}
```

--------------------------------

### Implement default.js for Next.js Parallel Routes

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

This snippet shows how to create the now-required `default.js` file for all Parallel Route slots in Next.js. You can either call `notFound()` to render a 404 page or return `null` to render nothing, maintaining previous behavior for optional slots.

```tsx
import { notFound } from 'next/navigation'

export default function Default() {
  notFound()
}
```

```tsx
export default function Default() {
  return null
}
```

--------------------------------

### Render Server Component within Client Modal in Next.js Page

Source: https://nextjs.org/docs/app/getting-started/server-and-client-components

This example demonstrates how a Next.js Server Component (`Page`) can render a Client Component (`Modal`) and pass another Server Component (`Cart`) as its child. This pattern allows server-rendered UI to be visually nested within client-side interactive components, leveraging the `children` prop for seamless integration.

```typescript
import Modal from './ui/modal'
import Cart from './ui/cart'

export default function Page() {
  return (
    <Modal>
      <Cart />
    </Modal>
  )
}
```

```javascript
import Modal from './ui/modal'
import Cart from './ui/cart'

export default function Page() {
  return (
    <Modal>
      <Cart />
    </Modal>
  )
}
```

--------------------------------

### Example of browser console log with source location in Next.js terminal

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/logging

This React component demonstrates a `console.log` call within client-side code that, when `browserToTerminal` is enabled, will output to the Next.js development terminal. The log message in the terminal will automatically include the source file path and line number, aiding in quick navigation to the origin of the log. This enhances the debugging experience by providing immediate context.

```tsx
export default function Home() {
  return (
    <button
      type="button"
      onClick={() => {
        console.log('Hello World')
      }}
    >
      Click me
    </button>
  )
}
```

--------------------------------

### Run Next.js Codemod CLI

Source: https://nextjs.org/docs/app/guides/upgrading/codemods

This command demonstrates the basic usage of the Next.js codemod CLI. It requires specifying a `transform` name and a `path` to the files or directory to be transformed. Optional flags like `--dry` for a dry-run and `--print` for output comparison are also available.

```bash
npx @next/codemod <transform> <path>
```

--------------------------------

### Error When Using updateTag Outside Server Actions - TypeScript

Source: https://nextjs.org/docs/app/api-reference/functions/updateTag

Shows an example of incorrect usage where updateTag is called in a Route Handler, which throws an error. Demonstrates the proper alternative using revalidateTag for non-Server Action contexts.

```typescript
import { updateTag } from 'next/cache'

export async function POST() {
  // This will throw an error
  updateTag('posts')
  // Error: updateTag can only be called from within a Server Action

  // Use revalidateTag instead in Route Handlers
  revalidateTag('posts', 'max')
}
```

--------------------------------

### Enable HTTPS for Next.js Development Server

Source: https://nextjs.org/docs/app/api-reference/cli/next

Enable HTTPS for your Next.js development server using the `--experimental-https` flag with `next dev`. This generates a self-signed certificate for a secure `https://localhost:3000` environment, useful for webhooks or authentication. Alternatively, provide custom certificates and keys using `--experimental-https-key`, `--experimental-https-cert`, and optionally `--experimental-https-ca`. This feature is strictly for development and uses `mkcert` for local certificates, not for production.

```bash
next dev --experimental-https
```

```bash
next dev --experimental-https --experimental-https-key ./certificates/localhost-key.pem --experimental-https-cert ./certificates/localhost.pem
```

--------------------------------

### Change Next.js Development Server Port

Source: https://nextjs.org/docs/app/api-reference/cli/next

Next.js development and start servers default to `http://localhost:3000`. You can change this default port using the `-p` option with `next dev` or by setting the `PORT` environment variable. Note that the `PORT` environment variable cannot be set in `.env` files as the HTTP server boots up before `.env` variables are initialized.

```bash
next dev -p 4000
```

```bash
PORT=4000 next dev
```

--------------------------------

### Implement POST Route Handler with error handling in Next.js

Source: https://nextjs.org/docs/app/guides/backend-for-frontend

This example demonstrates how to create an asynchronous `POST` Route Handler in Next.js, incorporating `try/catch` blocks for robust error management. It calls an external `submit` function and returns appropriate HTTP status codes (204 for success, 500 for errors). Sensitive error details should be avoided in client responses.

```ts
import { submit } from '@/lib/submit'

export async function POST(request: Request) {
  try {
    await submit(request)
    return new Response(null, { status: 204 })
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : 'Unexpected error'

    return new Response(message, { status: 500 })
  }
}
```

```js
import { submit } from '@/lib/submit'

export async function POST(request) {
  try {
    await submit(request)
    return new Response(null, { status: 204 })
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : 'Unexpected error'

    return new Response(message, { status: 500 })
  }
}
```

--------------------------------

### Define Next.js RootLayout with Sticky Header (TSX/JSX)

Source: https://nextjs.org/docs/app/api-reference/components/link

This snippet illustrates how to set up a `RootLayout` in Next.js that includes a sticky header. The `className` property is used to apply Tailwind CSS classes for `sticky`, `top-0`, and `h-16`, creating a header that remains visible at the top of the viewport. This setup often requires additional CSS to prevent content from being obscured during scroll-to-anchor navigation.

```tsx
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 h-16 bg-white">
          {/* Navigation */}
        </header>
        {children}
      </body>
    </html>
  )
}
```

```jsx
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 h-16 bg-white">
          {/* Navigation */}
        </header>
        {children}
      </body>
    </html>
  )
}
```

--------------------------------

### Next.js `onCacheEntryV2` Callback Flow Diagram

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/adapterPath

This diagram illustrates the flow within the `requestMeta.onCacheEntryV2` callback. It shows how the callback receives `cacheEntry` and `meta` arguments, conditionally persists HTML and postponed state to the platform cache if the entry is an `APP_PAGE`, and then determines whether to continue the normal Next.js response flow or short-circuit if the adapter has already handled the response.

```text
Entrypoint (handler)
  | onCacheEntryV2(cacheEntry, { url })
  v
requestMeta.onCacheEntryV2 callback
  |
  |-- if APP_PAGE ---> persist html + postponedState + headers ---> Platform Cache
  |
  '-- return false: continue normal Next.js response flow
      return true:  adapter already handled response (short-circuit)
```

--------------------------------

### Implement `getInitialProps` in Next.js Custom App (TypeScript/JavaScript)

Source: https://nextjs.org/docs/pages/building-your-application/routing/custom-app

This example shows how to use `getInitialProps` within the custom Next.js `App` component to fetch and inject additional data into all pages. It's important to note that using `getInitialProps` in `App` will disable Automatic Static Optimization for pages that do not use `getStaticProps`. This pattern is generally not recommended in favor of the App Router for data fetching.

```tsx
import App, { AppContext, AppInitialProps, AppProps } from 'next/app'

type AppOwnProps = { example: string }

export default function MyApp({
  Component,
  pageProps,
  example,
}: AppProps & AppOwnProps) {
  return (
    <>
      <p>Data: {example}</p>
      <Component {...pageProps} />
    </>
  )
}

MyApp.getInitialProps = async (
  context: AppContext
): Promise<AppOwnProps & AppInitialProps> => {
  const ctx = await App.getInitialProps(context)

  return { ...ctx, example: 'data' }
}
```

```jsx
import App from 'next/app'

export default function MyApp({ Component, pageProps, example }) {
  return (
    <>
      <p>Data: {example}</p>
      <Component {...pageProps} />
    </>
  )
}

MyApp.getInitialProps = async (context) => {
  const ctx = await App.getInitialProps(context)

  return { ...ctx, example: 'data' }
}
```

--------------------------------

### Create Loading Component with loading.tsx in Next.js

Source: https://nextjs.org/docs/app/getting-started/linking-and-navigating

Create a loading.tsx file in your route folder to display a fallback UI while the route is loading. Next.js automatically wraps the page content in a Suspense boundary, showing the loading skeleton until the actual content is ready. This enables partial prefetching and improves navigation performance.

```typescript
export default function Loading() {
  // Add fallback UI that will be shown while the route is loading.
  return <LoadingSkeleton />
}
```

```javascript
export default function Loading() {
  // Add fallback UI that will be shown while the route is loading.
  return <LoadingSkeleton />
}
```

--------------------------------

### Implement Webhook Revalidation in Next.js Route Handlers

Source: https://nextjs.org/docs/app/guides/backend-for-frontend

Handles incoming GET requests from third-party services to trigger on-demand cache revalidation. It validates a secret token and a specific tag from query parameters before executing revalidateTag.

```typescript
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (token !== process.env.REVALIDATE_SECRET_TOKEN) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  const tag = request.nextUrl.searchParams.get('tag')

  if (!tag) {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  revalidateTag(tag)

  return NextResponse.json({ success: true })
}
```

```javascript
import { NextResponse } from 'next/server'

export async function GET(request) {
  const token = request.nextUrl.searchParams.get('token')

  if (token !== process.env.REVALIDATE_SECRET_TOKEN) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  const tag = request.nextUrl.searchParams.get('tag')

  if (!tag) {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  revalidateTag(tag)

  return NextResponse.json({ success: true })
}
```

--------------------------------

### Accessing Dynamic Route Parameters with useParams Hook in Next.js

Source: https://nextjs.org/docs/app/api-reference/functions/use-params

This example demonstrates how to use the `useParams` hook within a Next.js Client Component to retrieve dynamic route parameters from the current URL. It shows how the hook returns an object mapping dynamic segment names to their corresponding values, useful for building dynamic pages based on URL segments.

```tsx
'use client'\n\nimport { useParams } from 'next/navigation'\n\nexport default function ExampleClientComponent() {\n  const params = useParams<{ tag: string; item: string }>()\n\n  // Route -> /shop/[tag]/[item]\n  // URL -> /shop/shoes/nike-air-max-97\n  // `params` -> { tag: 'shoes', item: 'nike-air-max-97' }\n  console.log(params)\n\n  return '...'\n}
```

```jsx
'use client'\n\nimport { useParams } from 'next/navigation'\n\nexport default function ExampleClientComponent() {\n  const params = useParams()\n\n  // Route -> /shop/[tag]/[item]\n  // URL -> /shop/shoes/nike-air-max-97\n  // `params` -> { tag: 'shoes', item: 'nike-air-max-97' }\n  console.log(params)\n\n  return '...'\n}
```

--------------------------------

### Fetch Data in Next.js Server Component and Pass Promise to Client Component

Source: https://nextjs.org/docs/app/guides/streaming

This example illustrates how to initiate an asynchronous data fetch within a Next.js Server Component (`app/dashboard/page.tsx` or `.js`) without awaiting its resolution. The unresolved promise is then passed as a prop to a Client Component (`StatsChart`), wrapped within a `<Suspense>` boundary to provide an immediate loading fallback while the data streams.

```tsx
import { Suspense } from 'react'
import { StatsChart } from './stats-chart'

type Stats = { revenue: number; orders: number }

async function getStats(): Promise<Stats> {
  const res = await fetch('https://api.example.com/stats')
  return res.json()
}

export default function Dashboard() {
  // Start the fetch during server render, don't await it
  const statsPromise = getStats()

  return (
    <Suspense fallback={<p>Loading chart...</p>}>
      <StatsChart dataPromise={statsPromise} />
    </Suspense>
  )
}
```

```jsx
import { Suspense } from 'react'
import { StatsChart } from './stats-chart'

async function getStats() {
  const res = await fetch('https://api.example.com/stats')
  return res.json()
}

export default function Dashboard() {
  // Start the fetch during server render, don't await it
  const statsPromise = getStats()

  return (
    <Suspense fallback={<p>Loading chart...</p>}>
      <StatsChart dataPromise={statsPromise} />
    </Suspense>
  )
}
```

--------------------------------

### Implement Responsive Images using Fill and ObjectFit in Next.js

Source: https://nextjs.org/docs/app/api-reference/components/image

Demonstrates how to make an image fill its parent container when the aspect ratio is unknown. This approach requires a parent container with relative positioning and uses the objectFit property to maintain visual consistency.

```jsx
import Image from 'next/image'
import mountains from '../public/mountains.jpg'

export default function Fill() {
  return (
    <div
      style={{
        display: 'grid',
        gridGap: '8px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, auto))',
      }}
    >
      <div style={{ position: 'relative', width: '400px' }}>
        <Image
          alt="Mountains"
          src={mountains}
          fill
          sizes="(min-width: 808px) 50vw, 100vw"
          style={{
            objectFit: 'cover', // cover, contain, none
          }}
        />
      </div>
      {/* And more images in the grid... */}
    </div>
  )
}
```

--------------------------------

### Create Route Handler for Draft Mode in Next.js

Source: https://nextjs.org/docs/app/guides/draft-mode

Create a basic Route Handler file that will serve as the endpoint for enabling Draft Mode. This handler accepts GET requests and returns a Response object. The file can be named anything but is typically placed at app/api/draft/route.ts or app/api/draft/route.js depending on your preferred language.

```typescript
export async function GET(request: Request) {
  return new Response('')
}
```

```javascript
export async function GET() {
  return new Response('')
}
```

--------------------------------

### Configure Express server for Next.js 12 WebSocket HMR

Source: https://nextjs.org/docs/pages/guides/upgrading/version-12

Express middleware using app.all() to handle all HTTP methods for the HMR endpoint and pass requests to the Next.js request handler. Ensures WebSocket upgrade requests are properly forwarded in custom server setups.

```javascript
app.all('/_next/webpack-hmr', (req, res) => {
  nextjsRequestHandler(req, res)
})
```

--------------------------------

### Next.js `getStaticPaths` and `getStaticProps` with `fallback: false`

Source: https://nextjs.org/docs/pages/api-reference/functions/get-static-paths

This example demonstrates how to use `getStaticPaths` with `fallback: false` in a Next.js dynamic route (`[id].js`) to prerender a fixed set of pages at build time. It fetches a list of posts from an external API to define the paths and then uses `getStaticProps` to fetch individual post data for each prerendered page. Any path not explicitly returned by `getStaticPaths` will result in a 404 error.

```jsx
function Post({ post }) {
  // Render post...
}

// This function gets called at build time
export async function getStaticPaths() {
  // Call an external API endpoint to get posts
  const res = await fetch('https://.../posts')
  const posts = await res.json()

  // Get the paths we want to prerender based on posts
  const paths = posts.map((post) => ({
    params: { id: post.id },
  }))

  // We'll prerender only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

// This also gets called at build time
export async function getStaticProps({ params }) {
  // params contains the post `id`.
  // If the route is like /posts/1, then params.id is 1
  const res = await fetch(`https://.../posts/${params.id}`)
  const post = await res.json()

  // Pass post data to the page via props
  return { props: { post } }
}

export default Post
```

--------------------------------

### Configure consistent build ID for Next.js

Source: https://nextjs.org/docs/pages/guides/self-hosting

This configuration in `next.config.js` allows you to generate a consistent build ID across different environments. By overriding the default build ID generation, you ensure that the same build is used when deploying to multiple containers or stages, preventing inconsistencies. The example uses a `GIT_HASH` environment variable for a unique, version-controlled ID.

```jsx
module.exports = {
  generateBuildId: async () => {
    // This could be anything, using the latest git hash
    return process.env.GIT_HASH
  }
}
```

--------------------------------

### Applying Next.js Font Styles using `style` Property

Source: https://nextjs.org/docs/pages/api-reference/components/font

This example demonstrates applying a loaded font's styles to an HTML element using its `style` property. The `style` property provides a CSS style object, including `fontFamily`, which can be directly passed to an element's `style` attribute.

```tsx
<p style={inter.style}>Hello World</p>
```

--------------------------------

### Globally Customizing MDX Elements with React Components

Source: https://nextjs.org/docs/pages/guides/mdx

This example demonstrates how to define global custom React components in `mdx-components.tsx` or `mdx-components.js` to override default HTML elements generated by MDX. This allows for consistent styling and behavior across all MDX files, such as custom `h1` or `img` components.

```tsx
import type { MDXComponents } from 'mdx/types'
import Image, { ImageProps } from 'next/image'

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

const components = {
  // Allows customizing built-in components, e.g. to add styling.
  h1: ({ children }) => (
    <h1 style={{ color: 'red', fontSize: '48px' }}>{children}</h1>
  ),
  img: (props) => (
    <Image
      sizes="100vw"
      style={{ width: '100%', height: 'auto' }}
      {...(props as ImageProps)}
    />
  ),
} satisfies MDXComponents

export function useMDXComponents(): MDXComponents {
  return components
}
```

```js
import Image from 'next/image'

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

const components = {
  // Allows customizing built-in components, e.g. to add styling.
  h1: ({ children }) => (
    <h1 style={{ color: 'red', fontSize: '48px' }}>{children}</h1>
  ),
  img: (props) => (
    <Image sizes="100vw" style={{ width: '100%', height: 'auto' }} {...props} />
  ),
}

export function useMDXComponents() {
  return components
}
```

--------------------------------

### Detect Device Type and Rewrite Request using userAgent in Next.js

Source: https://nextjs.org/docs/app/api-reference/functions/userAgent

This example demonstrates how to use the userAgent helper to identify a user's device type (e.g., mobile or tablet) and rewrite the request URL with a viewport query parameter. It is typically implemented in Middleware to serve device-specific content.

```typescript
import { NextRequest, NextResponse, userAgent } from 'next/server'

export function proxy(request: NextRequest) {
  const url = request.nextUrl
  const { device } = userAgent(request)

  // device.type can be: 'mobile', 'tablet', 'console', 'smarttv',
  // 'wearable', 'embedded', or undefined (for desktop browsers)
  const viewport = device.type || 'desktop'

  url.searchParams.set('viewport', viewport)
  return NextResponse.rewrite(url)
}
```

```javascript
import { NextResponse, userAgent } from 'next/server'

export function proxy(request) {
  const url = request.nextUrl
  const { device } = userAgent(request)

  // device.type can be: 'mobile', 'tablet', 'console', 'smarttv',
  // 'wearable', 'embedded', or undefined (for desktop browsers)
  const viewport = device.type || 'desktop'

  url.searchParams.set('viewport', viewport)
  return NextResponse.rewrite(url)
}
```

--------------------------------

### Trace Turbopack Output for Concurrent Next.js Builds

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

With `next dev` and `next build` now using separate output directories, this snippet provides commands to trace the Turbopack output. These commands are essential for debugging and understanding the build process when running concurrent development and build tasks.

```bash
pnpm next internal trace .next/dev/trace-turbopack
```

```bash
npx next internal trace .next/dev/trace-turbopack
```

```bash
yarn next internal trace .next/dev/trace-turbopack
```

```bash
bunx next internal trace .next/dev/trace-turbopack
```

--------------------------------

### Create Next.js App with npm

Source: https://nextjs.org/docs/app/api-reference/cli/create-next-app

Initialize a new Next.js application using npm package manager. This is the most common method for creating Next.js projects with the latest version.

```bash
npx create-next-app@latest [project-name] [options]
```

--------------------------------

### Create Shared Components for App and Pages Router

Source: https://nextjs.org/docs/pages/api-reference/functions/use-params

Example of a Breadcrumb component using useParams from next/navigation. This implementation works across both Next.js App and Pages routers by handling the potential null return during Pages Router pre-rendering.

```tsx
import { useParams } from 'next/navigation'

// This component works in both pages/ and app/
export function Breadcrumb() {
  const params = useParams<{ slug: string }>()

  if (!params) {
    // Fallback for Pages Router during prerendering
    return <nav>Home / ...</nav>
  }

  return <nav>Home / {params.slug}</nav>
}
```

```jsx
import { useParams } from 'next/navigation'

// This component works in both pages/ and app/
export function Breadcrumb() {
  const params = useParams()

  if (!params) {
    // Fallback for Pages Router during prerendering
    return <nav>Home / ...</nav>
  }

  return <nav>Home / {params.slug}</nav>
}
```

--------------------------------

### Conditionally export register and onRequestError based on Next.js runtime

Source: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

This JavaScript example demonstrates how to conditionally load different implementations for `register` and `onRequestError` based on the `process.env.NEXT_RUNTIME` environment variable. This allows tailoring behavior for Node.js or Edge runtimes within the `instrumentation.js` file, ensuring runtime-specific logic is applied.

```js
export function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return require('./register.edge')
  } else {
    return require('./register.node')
  }
}

export function onRequestError() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return require('./on-request-error.edge')
  } else {
    return require('./on-request-error.node')
  }
}
```

--------------------------------

### Configure Matcher with Advanced Object Configuration

Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy

Demonstrates advanced matcher configuration using objects with source patterns, locale settings, and conditional logic based on headers, query parameters, and cookies. Allows fine-grained control over when the proxy executes.

```javascript
export const config = {
  matcher: [
    {
      source: '/api/:path*',
      locale: false,
      has: [
        { type: 'header', key: 'Authorization', value: 'Bearer Token' },
        { type: 'query', key: 'userId', value: '123' },
      ],
      missing: [{ type: 'cookie', key: 'session', value: 'active' }],
    },
  ],
}
```

--------------------------------

### Access router.events in useEffect Hook - Next.js

Source: https://nextjs.org/docs/pages/guides/upgrading/version-11

Demonstrates the correct pattern for accessing router.events in Next.js 11+ by wrapping event listeners in a useEffect hook. This ensures router.events is accessible during rendering and prerendering. The example shows subscribing to routeChangeStart events and properly unsubscribing on component unmount.

```javascript
useEffect(() => {
  const handleRouteChange = (url, { shallow }) => {
    console.log(
      `App is changing to ${url} ${
        shallow ? 'with' : 'without'
      } shallow routing`
    )
  }

  router.events.on('routeChangeStart', handleRouteChange)

  // If the component is unmounted, unsubscribe
  // from the event with the `off` method:
  return () => {
    router.events.off('routeChangeStart', handleRouteChange)
  }
}, [router])
```

--------------------------------

### Handle Multiple HTTP Methods in API Route

Source: https://nextjs.org/docs/pages/building-your-application/routing/api-routes

Demonstrates how to handle different HTTP methods (POST, GET, etc.) within a single API route handler using req.method. This pattern allows routing different operations to the same endpoint based on the HTTP method used in the request.

```TypeScript
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Process a POST request
  } else {
    // Handle any other HTTP method
  }
}
```

```JavaScript
export default function handler(req, res) {
  if (req.method === 'POST') {
    // Process a POST request
  } else {
    // Handle any other HTTP method
  }
}
```

--------------------------------

### Configure Remote Image Patterns in Next.js Config

Source: https://nextjs.org/docs/app/getting-started/images

Sets up security restrictions for remote images by defining allowed URL patterns in next.config file. This configuration example restricts images to a specific AWS S3 bucket using protocol, hostname, and pathname matching. Supports both TypeScript and JavaScript configuration formats.

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        port: '',
        pathname: '/my-bucket/**',
        search: '',
      },
    ],
  },
}

export default config
```

```javascript
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        port: '',
        pathname: '/my-bucket/**',
        search: '',
      },
    ],
  },
}
```

--------------------------------

### Configure Cypress for E2E testing in TypeScript or JavaScript

Source: https://nextjs.org/docs/app/guides/testing/cypress

Set up the basic E2E configuration within the cypress.config file to enable End-to-End testing capabilities.

```typescript
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {},
  },
})
```

```javascript
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {},
  },
})
```

--------------------------------

### Handle request body in Next.js proxy and API route handler

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize

This example demonstrates how to access the request body within both a Next.js proxy function and an API route handler. The `proxyClientMaxBodySize` configuration limits the buffered body, and if exceeded, only a partial body will be available. The `request.text()` method is used to read the body in both the proxy and the route handler.

```ts
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  // Next.js automatically buffers the body with the configured size limit
  // You can read the body in proxy...
  const body = await request.text()

  // If the body exceeded the limit, only partial data will be available
  console.log('Body size:', body.length)

  return NextResponse.next()
}
```

```ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // ...and the body is still available in your route handler
  const body = await request.text()

  console.log('Body in route handler:', body.length)

  return NextResponse.json({ received: body.length })
}
```

--------------------------------

### Create Responsive Static Images in Next.js

Source: https://nextjs.org/docs/pages/api-reference/components/image

Illustrates how to make a statically imported image responsive by setting width to 100% and height to auto. Next.js automatically determines dimensions from the imported file metadata.

```jsx
import Image from 'next/image'
import mountains from '../public/mountains.jpg'

export default function Responsive() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Image
        alt="Mountains"
        src={mountains}
        sizes="100vw"
        style={{
          width: '100%',
          height: 'auto',
        }}
      />
    </div>
  )
}
```

--------------------------------

### Create Route Handler with Factory Pattern in Next.js

Source: https://nextjs.org/docs/app/guides/backend-for-frontend

Demonstrates using a third-party library's factory pattern to create a shared Route Handler for multiple HTTP methods (GET and POST). The library customizes behavior based on the request method and pathname. This pattern centralizes request handling logic in a single handler function.

```typescript
import { createHandler } from 'third-party-library'

const handler = createHandler({
  /* library-specific options */
})

export const GET = handler
// or
export { handler as POST }
```

--------------------------------

### Configure PostCSS Plugins with postcss.config.json in Next.js

Source: https://nextjs.org/docs/pages/guides/post-css

This snippet illustrates the default PostCSS configuration structure used by Next.js, which can be overridden by creating a `postcss.config.json` file. It demonstrates how to include essential plugins like `postcss-flexbugs-fixes` and `postcss-preset-env`, along with Autoprefixer settings, when customizing the PostCSS setup.

```json
{
  "plugins": [
    "postcss-flexbugs-fixes",
    [
      "postcss-preset-env",
      {
        "autoprefixer": {
          "flexbox": "no-2009"
        },
        "stage": 3,
        "features": {
          "custom-properties": false
        }
      }
    ]
  ]
}
```

--------------------------------

### Add Tailwind CSS Directives to Global CSS

Source: https://nextjs.org/docs/app/guides/tailwind-v3-css

Add Tailwind's three core directives (@tailwind base, @tailwind components, @tailwind utilities) to your global CSS file. These directives inject Tailwind's styles into your application.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

--------------------------------

### Implement Closures in Next.js Server Actions

Source: https://nextjs.org/docs/app/guides/data-security

This example illustrates how Next.js Server Actions can form closures, allowing them to access variables from their outer scope, such as `publishVersion`. Next.js automatically encrypts these closed-over variables when they are sent to the client and back to the server, protecting sensitive data from exposure.

```tsx
export default async function Page() {
  const publishVersion = await getLatestVersion();

  async function publish() {
    "use server";
    if (publishVersion !== await getLatestVersion()) {
      throw new Error('The version has changed since pressing publish');
    }
    ...
  }

  return (
    <form>
      <button formAction={publish}>Publish</button>
    </form>
  );
}
```

```jsx
export default async function Page() {
  const publishVersion = await getLatestVersion();

  async function publish() {
    "use server";
    if (publishVersion !== await getLatestVersion()) {
      throw new Error('The version has changed since pressing publish');
    }
    ...
  }

  return (
    <form>
      <button formAction={publish}>Publish</button>
    </form>
  );
}
```

--------------------------------

### Handle Uncaught Exceptions in Next.js `getStaticProps` (TypeScript/JavaScript)

Source: https://nextjs.org/docs/pages/guides/incremental-static-regeneration

This example illustrates how to manage uncaught errors within `getStaticProps` in Next.js. By throwing an error on failed data fetches, the system ensures the cache is not updated with stale data, and the last successfully generated page remains visible until a successful revalidation.

```tsx
import type { GetStaticProps } from 'next'

interface Post {
  id: string
  title: string
  content: string
}

interface Props {
  post: Post
}

export const getStaticProps: GetStaticProps<Props> = async ({
  params,
}: {
  params: { id: string }
}) => {
  // If this request throws an uncaught error, Next.js will
  // not invalidate the currently shown page and
  // retry getStaticProps on the next request.
  const res = await fetch(`https://api.vercel.app/blog/${params.id}`)
  const post: Post = await res.json()

  if (!res.ok) {
    // If there is a server error, you might want to
    // throw an error instead of returning so that the cache is not updated
    // until the next successful request.
    throw new Error(`Failed to fetch posts, received status ${res.status}`)
  }

  return {
    props: { post },
    // Next.js will invalidate the cache when a
    // request comes in, at most once every 60 seconds.
    revalidate: 60,
  }
}
```

```jsx
export async function getStaticProps({ params }) {
  // If this request throws an uncaught error, Next.js will
  // not invalidate the currently shown page and
  // retry getStaticProps on the next request.
  const res = await fetch(`https://api.vercel.app/blog/${params.id}`)
  const post = await res.json()

  if (!res.ok) {
    // If there is a server error, you might want to
    // throw an error instead of returning so that the cache is not updated
    // until the next successful request.
    throw new Error(`Failed to fetch posts, received status ${res.status}`)
  }

  return {
    props: { post },
    // Next.js will invalidate the cache when a
    // request comes in, at most once every 60 seconds.
    revalidate: 60,
  }
}
```

--------------------------------

### Use Wildcard Hostnames in Next.js Remote Patterns

Source: https://nextjs.org/docs/pages/api-reference/components/image-legacy

Implement wildcard patterns in the hostname property to allow images from multiple subdomains. The '**' syntax matches any number of subdomains at the beginning of the hostname.

```javascript
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
        port: '',
        search: '',
      },
    ],
  },
}
```

--------------------------------

### Create Client-Only Entrypoint with Dynamic Import

Source: https://nextjs.org/docs/app/guides/migrating/from-create-react-app

Implements a Client Component that wraps the legacy App component using Next.js dynamic imports. By setting ssr to false, it ensures the component only executes in the browser environment.

```tsx
'use client'

import dynamic from 'next/dynamic'

const App = dynamic(() => import('../../App'), { ssr: false })

export function ClientOnly() {
  return <App />
}
```

```jsx
'use client'

import dynamic from 'next/dynamic'

const App = dynamic(() => import('../../App'), { ssr: false })

export function ClientOnly() {
  return <App />
}
```

--------------------------------

### Configure lazyRoot with DOM element in Next.js Image component

Source: https://nextjs.org/docs/pages/api-reference/components/image-legacy

This example demonstrates how to use the `lazyRoot` prop to specify a scrollable parent DOM element for lazy loading. It uses `React.useRef` to create a ref and assigns it to both the parent `div` and the `Image` components, ensuring images within the scrollable area are loaded correctly.

```jsx
import Image from 'next/legacy/image'
import React from 'react'

const Example = () => {
  const lazyRoot = React.useRef(null)

  return (
    <div ref={lazyRoot} style={{ overflowX: 'scroll', width: '500px' }}>
      <Image lazyRoot={lazyRoot} src="/one.jpg" width="500" height="500" />
      <Image lazyRoot={lazyRoot} src="/two.jpg" width="500" height="500" />
    </div>
  )
}
```

--------------------------------

### Create Database Session in Next.js API Route

Source: https://nextjs.org/docs/pages/guides/authentication

Handles server-side session creation by generating a unique session ID, inserting session data into the database with user ID and creation timestamp, and returning the session ID. Includes error handling for database operations. Requires a database connection and insertSession method to be implemented.

```typescript
import db from '../../lib/db'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = req.body
    const sessionId = generateSessionId()
    await db.insertSession({
      sessionId,
      userId: user.id,
      createdAt: new Date(),
    })

    res.status(200).json({ sessionId })
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
```

```javascript
import db from '../../lib/db'

export default async function handler(req, res) {
  try {
    const user = req.body
    const sessionId = generateSessionId()
    await db.insertSession({
      sessionId,
      userId: user.id,
      createdAt: new Date(),
    })

    res.status(200).json({ sessionId })
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
```

--------------------------------

### Migrate Next.js Linting to ESLint CLI Configuration

Source: https://nextjs.org/docs/app/guides/upgrading/codemods

This codemod automates the migration of Next.js projects from using `next lint` to a standard ESLint CLI setup. It generates an `eslint.config.mjs` file with Next.js recommended configurations, updates `package.json` scripts, and adds necessary ESLint dependencies. The codemod also intelligently preserves any existing ESLint configurations found in the project.

```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

```json
{
  "scripts": {
    "lint": "next lint"
  }
}
```

```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

```js
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
]

export default eslintConfig
```

--------------------------------

### Create Basic API Route Handler in Next.js

Source: https://nextjs.org/docs/pages/building-your-application/routing/api-routes

Creates a simple API endpoint that returns a JSON response with a 200 status code. The handler receives NextApiRequest and NextApiResponse objects for processing HTTP requests and sending responses. This example demonstrates the basic structure for both TypeScript and JavaScript implementations.

```TypeScript
import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
  message: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.status(200).json({ message: 'Hello from Next.js!' })
}
```

```JavaScript
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello from Next.js!' })
}
```

--------------------------------

### Set Default `fetch` Caching for Next.js Layouts and Pages

Source: https://nextjs.org/docs/app/guides/upgrading/version-15

This example illustrates how to set a default caching behavior for all `fetch` requests within a Next.js layout or page using `export const fetchCache = 'default-cache'`. It also shows that individual `cache` options on `fetch` requests will override this default.

```js
// Since this is the root layout, all fetch requests in the app
// that don't set their own cache option will be cached.
export const fetchCache = 'default-cache'

export default async function RootLayout() {
  const a = await fetch('https://...') // Cached
  const b = await fetch('https://...', { cache: 'no-store' }) // Not cached

  // ...
}
```

--------------------------------

### Implement Redirects in Next.js API Routes

Source: https://nextjs.org/docs/pages/building-your-application/routing/api-routes

This example illustrates how to perform a client-side redirect from a Next.js API route after a successful operation, such as a form submission. It uses `res.redirect(statusCode, path)` to send a redirect response, handling potential errors with a 500 status to inform the client of failure.

```ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name, message } = req.body

  try {
    await handleFormInputAsync({ name, message })
    res.redirect(307, '/')
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch data' })
  }
}
```

```js
export default async function handler(req, res) {
  const { name, message } = req.body

  try {
    await handleFormInputAsync({ name, message })
    res.redirect(307, '/')
  } catch (err) {
    res.status(500).send({ error: 'failed to fetch data' })
  }
}
```

--------------------------------

### Cleanup Effects and Timers When Activity Hides Content

Source: https://nextjs.org/docs/app/guides/preserving-ui-state

Shows how React automatically runs effect cleanup functions when Activity hides content, similar to unmount behavior. This example demonstrates a timer that pauses when the component is hidden by properly returning a cleanup function from useEffect.

```tsx
'use client'

import { useEffect, useState } from 'react'

function LiveTimer() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + 1), 1000)
    return () => clearInterval(id) // Pauses when hidden
  }, [])

  return <p>Count: {count}</p>
}
```

--------------------------------

### Set up NavigationBlockerProvider in Next.js Root Layout

Source: https://nextjs.org/docs/app/api-reference/components/link

Configure the root layout to wrap children with NavigationBlockerProvider, enabling navigation blocking functionality across the application. This provider manages state for detecting unsaved changes and prompting user confirmation before navigation.

```jsx
import { NavigationBlockerProvider } from './contexts/navigation-blocker'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavigationBlockerProvider>{children}</NavigationBlockerProvider>
      </body>
    </html>
  )
}
```

--------------------------------

### Implementing `revalidatePath` in a Next.js Route Handler

Source: https://nextjs.org/docs/app/api-reference/functions/revalidatePath

This example demonstrates how to create a Next.js Route Handler (API endpoint) that leverages `revalidatePath`. The handler accepts a `path` query parameter and uses it to programmatically revalidate a specific page or data. It provides both TypeScript and JavaScript versions for flexibility.

```ts
import { revalidatePath } from 'next/cache'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')

  if (path) {
    revalidatePath(path)
    return Response.json({ revalidated: true, now: Date.now() })
  }

  return Response.json({
    revalidated: false,
    now: Date.now(),
    message: 'Missing path to revalidate',
  })
}
```

```js
import { revalidatePath } from 'next/cache'

export async function GET(request) {
  const path = request.nextUrl.searchParams.get('path')

  if (path) {
    revalidatePath(path)
    return Response.json({ revalidated: true, now: Date.now() })
  }

  return Response.json({
    revalidated: false,
    now: Date.now(),
    message: 'Missing path to revalidate',
  })
}
```

--------------------------------

### Handle Route Conflicts between Page and Route Files in Next.js

Source: https://nextjs.org/docs/app/getting-started/route-handlers

This example illustrates a route conflict scenario where a `page.js` (or `page.ts`) file and a `route.js` (or `route.ts`) file exist at the same route level. Next.js does not allow this configuration, as each file type takes over all HTTP verbs for its route, leading to a conflict.

```ts
export default function Page() {
  return <h1>Hello, Next.js!</h1>
}

// Conflict
// `app/route.ts`
export async function POST(request: Request) {}
```

```js
export default function Page() {
  return <h1>Hello, Next.js!</h1>
}

// Conflict
// `app/route.js`
export async function POST(request) {}
```

--------------------------------

### Apply Next.js headers conditionally using `has` and `missing` fields

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers

This comprehensive example shows how to apply headers conditionally in Next.js based on the presence or absence of specific request properties like headers, cookies, queries, or host. The `has` field requires all specified conditions to match, while `missing` requires all specified conditions to not match. This allows for fine-grained control over header injection based on complex request criteria.

```js
module.exports = {
  async headers() {
    return [
      // if the header `x-add-header` is present,
      // the `x-another-header` header will be applied
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-add-header',
          }
        ],
        headers: [
          {
            key: 'x-another-header',
            value: 'hello',
          }
        ]
      },
      // if the header `x-no-header` is not present,
      // the `x-another-header` header will be applied
      {
        source: '/:path*',
        missing: [
          {
            type: 'header',
            key: 'x-no-header',
          }
        ],
        headers: [
          {
            key: 'x-another-header',
            value: 'hello',
          }
        ]
      },
      // if the source, query, and cookie are matched,
      // the `x-authorized` header will be applied
      {
        source: '/specific/:path*',
        has: [
          {
            type: 'query',
            key: 'page',
            // the page value will not be available in the
            // header key/values since value is provided and
            // doesn't use a named capture group e.g. (?<page>home)
            value: 'home',
          },
          {
            type: 'cookie',
            key: 'authorized',
            value: 'true',
          }
        ],
        headers: [
          {
            key: 'x-authorized',
            value: ':authorized',
          }
        ]
      },
      // if the header `x-authorized` is present and
      // contains a matching value, the `x-another-header` will be applied
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-authorized',
            value: '(?<authorized>yes|true)',
          }
        ],
        headers: [
          {
            key: 'x-another-header',
            value: ':authorized',
          }
        ]
      },
      // if the host is `example.com`,
      // this header will be applied
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'example.com',
          }
        ],
        headers: [
          {
            key: 'x-another-header',
            value: ':authorized',
          }
        ]
      }
    ]
  }
}
```

--------------------------------

### Implement Path Matching Redirects in Next.js

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects

Demonstrates how to use named parameters like :slug to match specific path segments. The matched parameter is then passed through to the destination path.

```javascript
module.exports = {
  async redirects() {
    return [
      {
        source: '/old-blog/:slug',
        destination: '/news/:slug',
        permanent: true,
      },
    ]
  },
}
```

--------------------------------

### Fix synchronous dynamic API access in Next.js Server Components using await

Source: https://nextjs.org/docs/messages/sync-dynamic-apis

For Server Components or Route Handlers, explicitly `await` the dynamic API (e.g., `params`) before accessing its properties. This example demonstrates how to asynchronously destructure `params.id` within an `async` Page component, resolving the warning.

```jsx
async function Page({ params }) {
  // asynchronous access of `params.id`.
  const { id } = await params
  return <p>ID: {id}</p>
}
```

--------------------------------

### CONFIG /matcher

Source: https://nextjs.org/docs/pages/api-reference/file-conventions/proxy

Defines specific paths for the Proxy to execute using strings, arrays, or conditional objects.

```APIDOC
## CONFIG matcher

### Description
The `matcher` option allows you to target specific paths for the Proxy to run on. It supports direct strings, arrays of paths, and complex objects for conditional matching based on headers, cookies, or query parameters.

### Method
CONFIG

### Endpoint
export const config = { matcher: [...] }

### Parameters
#### Matcher Object Properties
- **source** (string) - Required - The path or pattern used to match the request paths. Supports named parameters and regex.
- **locale** (boolean) - Optional - When false, ignores locale-based routing in path matching.
- **has** (array) - Optional - Conditions based on the presence of specific headers, query parameters, or cookies.
- **missing** (array) - Optional - Conditions based on the absence of specific request elements.

### Request Example
{
  "matcher": [
    {
      "source": "/api/:path*",
      "has": [
        { "type": "header", "key": "Authorization", "value": "Bearer Token" }
      ],
      "missing": [{ "type": "cookie", "key": "session" }]
    }
  ]
}

### Response
#### Success Response (Static Analysis)
- **status** (string) - Validated at build-time for static analysis.
```

--------------------------------

### Use CSS Modules for Component-Scoped Styles in Next.js

Source: https://nextjs.org/docs/messages/no-css-tags

This example illustrates how to integrate CSS Modules into a Next.js component. By importing a `.module.css` file, styles are automatically scoped to the component, preventing global style collisions. The imported `styles` object provides class names that can be applied to elements, ensuring modular and maintainable styling.

```jsx
import styles from './extra.module.css'

export class Home {
  render() {
    return (
      <div>
        <button type="button" className={styles.active}>
          Open
        </button>
      </div>
    )
  }
}
```

--------------------------------

### Configure Custom Webpack in Next.js `next.config.ts`

Source: https://nextjs.org/docs/app/guides/migrating/from-create-react-app

This snippet demonstrates how to extend Next.js's Webpack configuration within `next.config.ts` to accommodate custom setups, similar to those found in Create React App. It highlights the need to explicitly enable Webpack in the `dev` script when using this configuration.

```typescript
import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Modify the webpack config here
    return config
  },
}

export default nextConfig
```

--------------------------------

### Update search parameters using useRouter and useSearchParams in Next.js (TSX/JSX)

Source: https://nextjs.org/docs/pages/api-reference/functions/use-search-params

This example demonstrates how to programmatically update URL search parameters in a Next.js application. It combines `useRouter` for navigation and `useSearchParams` to read current parameters, along with `URLSearchParams` to construct new query strings, allowing for dynamic updates like sorting or filtering.

```tsx
import { useRouter } from 'next/router'
import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  if (!searchParams) {
    return null
  }

  return (
    <>
      <p>Sort By</p>
      <button
        onClick={() => {
          router.push(router.pathname + '?' + createQueryString('sort', 'asc'))
        }}
      >
        ASC
      </button>
      <button
        onClick={() => {
          router.push(router.pathname + '?' + createQueryString('sort', 'desc'))
        }}
      >
        DESC
      </button>
    </>
  )
}
```

```jsx
import { useRouter } from 'next/router'
import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams?.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  if (!searchParams) {
    return null
  }

  return (
    <>
      <p>Sort By</p>
      <button
        onClick={() => {
          router.push(router.pathname + '?' + createQueryString('sort', 'asc'))
        }}
      >
        ASC
      </button>
      <button
        onClick={() => {
          router.push(router.pathname + '?' + createQueryString('sort', 'desc'))
        }}
      >
        DESC
      </button>
    </>
  )
}
```

--------------------------------

### Use Next.js Image Component with Custom Loader in Static Export

Source: https://nextjs.org/docs/app/guides/static-exports

This example demonstrates how to use the `next/image` component within a Next.js application configured for static export with a custom image loader. It shows defining an image with an `alt` tag, `src`, `width`, and `height`, where the `src` will be processed by the custom loader.

```tsx
import Image from 'next/image'

export default function Page() {
  return <Image alt="turtles" src="/turtles.jpg" width={300} height={300} />
}
```

```jsx
import Image from 'next/image'

export default function Page() {
  return <Image alt="turtles" src="/turtles.jpg" width={300} height={300} />
}
```

--------------------------------

### Configure Cypress E2E testing with TypeScript

Source: https://nextjs.org/docs/pages/guides/testing/cypress

Set up the cypress.config.ts file with TypeScript to configure E2E testing. Uses defineConfig from Cypress and includes setupNodeEvents hook for custom event handling.

```typescript
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {},
  },
})
```

--------------------------------

### Display Active Route Segments using useSelectedLayoutSegments (Next.js)

Source: https://nextjs.org/docs/app/api-reference/functions/use-selected-layout-segments

This example demonstrates a Next.js Client Component that utilizes the `useSelectedLayoutSegments` hook to fetch and render the active route segments. It iterates through the returned segments and displays them in an unordered list, providing a dynamic way to visualize the current path within a layout.

```tsx
'use client'\n\nimport { useSelectedLayoutSegments } from 'next/navigation'\n\nexport default function ExampleClientComponent() {\n  const segments = useSelectedLayoutSegments()\n\n  return (\n    <ul>\n      {segments.map((segment, index) => (\n        <li key={index}>{segment}</li>\n      ))}\n    </ul>\n  )\n}
```

```jsx
'use client'\n\nimport { useSelectedLayoutSegments } from 'next/navigation'\n\nexport default function ExampleClientComponent() {\n  const segments = useSelectedLayoutSegments()\n\n  return (\n    <ul>\n      {segments.map((segment, index) => (\n        <li key={index}>{segment}</li>\n      ))}\n    </ul>\n  )\n}
```

--------------------------------

### Revalidating All Cached Data in Next.js

Source: https://nextjs.org/docs/app/api-reference/functions/revalidatePath

This example demonstrates how to use `revalidatePath` to purge the entire Client Cache and invalidate all cached data across the application. By calling `revalidatePath('/', 'layout')`, all data will be revalidated on the next page visit, effectively performing a full cache clear.

```ts
import { revalidatePath } from 'next/cache'

revalidatePath('/', 'layout')
```

--------------------------------

### Fetching Data with TypeScript in Next.js Server Components

Source: https://nextjs.org/docs/app/api-reference/config/typescript

This example demonstrates how to fetch data asynchronously within a Next.js Server Component using TypeScript. It highlights that the return value from server-side data fetching functions is not serialized, allowing complex JavaScript types like Date, Map, or Set to be returned directly. The fetched data is then consumed within an `async` Page component.

```tsx
async function getData() {
  const res = await fetch('https://api.example.com/...')
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.
  return res.json()
}

export default async function Page() {
  const name = await getData()

  return '...'
}
```

--------------------------------

### Define Conditional Loader Rules with Arrays in Next.js Turbopack

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack

This example illustrates how to define multiple, disjoint loader rules for the same file type (e.g., `*.svg`) using an array of rule objects in `next.config.js`. It applies different loaders based on built-in conditions like `browser` and `not: 'browser'`, ensuring specific processing for client-side versus server-side contexts. Rules are executed in the order they appear in the array.

```javascript
module.exports = {
  turbopack: {
    rules: {
      '*.svg': [
        {
          condition: 'browser',
          loaders: ['@svgr/webpack'],
          as: '*.js'
        },
        {
          condition: { not: 'browser' },
          loaders: [require.resolve('./custom-svg-loader.js')],
          as: '*.js'
        }
      ]
    }
  }
}
```

--------------------------------

### Style `next/image` with CSS Modules in Next.js

Source: https://nextjs.org/docs/app/api-reference/components/image

Demonstrates how to apply styles to the `next/image` component using a CSS Module and the `className` prop. This is the recommended approach for styling in Next.js applications, promoting modularity and avoiding global style conflicts.

```jsx
import styles from './styles.module.css'

export default function MyImage() {
  return <Image className={styles.image} src="/my-image.png" alt="My Image" />
}
```

--------------------------------

### Configure Image Qualities in Next.js

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

Shows how to configure the qualities array for Next.js images. The default changed from allowing all qualities to only [75]. This configuration demonstrates supporting multiple quality levels (50, 75, 100) and explains quality coercion behavior.

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    qualities: [50, 75, 100],
  },
}

export default nextConfig
```

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [50, 75, 100],
  },
}

module.exports = nextConfig
```

--------------------------------

### Apply inline Turbopack loader with import attributes

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack

Use the `with` clause to apply a Turbopack loader to individual imports without affecting all files of that type. This example demonstrates loading a .txt file as a JavaScript module using the raw-loader. The import attributes support turbopackLoader, turbopackLoaderOptions, turbopackAs, and turbopackModuleType properties.

```typescript
// Apply a raw loader to import a .txt file as a JavaScript module
import rawText from '../data.txt' with { turbopackLoader: 'raw-loader', turbopackAs: '*.js' }

export default function Page() {
  return <p>{rawText}</p>
}
```

--------------------------------

### Set Request and Response Headers in Next.js

Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy

This example illustrates how to manipulate HTTP headers for both incoming requests and outgoing responses using `NextResponse` in Next.js. It shows how to clone request headers, set new ones for upstream processing via `NextResponse.next({ request: { headers: ... } })`, and add response headers before sending the response back to the client.

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Clone the request headers and set a new header `x-hello-from-proxy1`
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hello-from-proxy1', 'hello')

  // You can also set request headers in NextResponse.next
  const response = NextResponse.next({
    request: {
      // New request headers
      headers: requestHeaders,
    },
  })

  // Set a new response header `x-hello-from-proxy2`
  response.headers.set('x-hello-from-proxy2', 'hello')
  return response
}
```

```javascript
import { NextResponse } from 'next/server'

export function proxy(request) {
  // Clone the request headers and set a new header `x-hello-from-proxy1`
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hello-from-proxy1', 'hello')

  // You can also set request headers in NextResponse.next
  const response = NextResponse.next({
    request: {
      // New request headers
      headers: requestHeaders,
    },
  })

  // Set a new response header `x-hello-from-proxy2`
  response.headers.set('x-hello-from-proxy2', 'hello')
  return response
}
```

--------------------------------

### Create Form with Server Action in Next.js

Source: https://nextjs.org/docs/app/api-reference/components/form

Demonstrates how to create a form component that triggers a Server Action mutation. The Form component accepts an action prop that receives a server function to handle form submission. This example shows a post creation form with a title input field.

```tsx
import Form from 'next/form'
import { createPost } from '@/posts/actions'

export default function Page() {
  return (
    <Form action={createPost}>
      <input name="title" />
      {/* ... */}
      <button type="submit">Create Post</button>
    </Form>
  )
}
```

```jsx
import Form from 'next/form'
import { createPost } from '@/posts/actions'

export default function Page() {
  return (
    <Form action={createPost}>
      <input name="title" />
      {/* ... */}
      <button type="submit">Create Post</button>
    </Form>
  )
}
```

--------------------------------

### Generate Unique Values Per Request Using connection() in Next.js

Source: https://nextjs.org/docs/app/building-your-application/rendering

Shows how to defer non-deterministic operations like crypto.randomUUID() to request time by calling connection() before the operation. The component is wrapped in Suspense to ensure the unique value is generated fresh for each request rather than being cached.

```typescript
import { connection } from 'next/server'
import { Suspense } from 'react'

async function UniqueContent() {
  await connection()
  const uuid = crypto.randomUUID()
  return <p>Request ID: {uuid}</p>
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UniqueContent />
    </Suspense>
  )
}
```

--------------------------------

### Import Third-Party Component Styles in Next.js

Source: https://nextjs.org/docs/pages/getting-started/css

Import CSS files required by third-party components directly within the component file. This example demonstrates importing styles from the @reach/dialog library and using the Dialog component with state management.

```jsx
import { useState } from 'react'
import { Dialog } from '@reach/dialog'
import VisuallyHidden from '@reach/visually-hidden'
import '@reach/dialog/styles.css'

function ExampleDialog(props) {
  const [showDialog, setShowDialog] = useState(false)
  const open = () => setShowDialog(true)
  const close = () => setShowDialog(false)

  return (
    <div>
      <button onClick={open}>Open Dialog</button>
      <Dialog isOpen={showDialog} onDismiss={close}>
        <button className="close-button" onClick={close}>
          <VisuallyHidden>Close</VisuallyHidden>
          <span aria-hidden>×</span>
        </button>
        <p>Hello there. I am a dialog</p>
      </Dialog>
    </div>
  )
}
```

--------------------------------

### Integrate Client Component into Entrypoint Page

Source: https://nextjs.org/docs/app/guides/migrating/from-vite

Updates the catch-all page to render the ClientOnly component. This connects the Next.js routing system to the existing client-side application logic.

```typescript
import '../../index.css'
import { ClientOnly } from './client'

export function generateStaticParams() {
  return [{ slug: [''] }]
}

export default function Page() {
  return <ClientOnly />
}
```

```javascript
import '../../index.css'
import { ClientOnly } from './client'

export function generateStaticParams() {
  return [{ slug: [''] }]
}

export default function Page() {
  return <ClientOnly />
}
```

--------------------------------

### Define Page Title with next/head in Next.js

Source: https://nextjs.org/docs/messages/no-title-in-document-head

This example demonstrates how to correctly define a page title in a Next.js application. It uses the `Head` component imported from `next/head` within a page component to set a specific title for that page, adhering to Next.js best practices for SEO and document structure.

```jsx
import Head from 'next/head'

export function Home() {
  return (
    <div>
      <Head>
        <title>My page title</title>
      </Head>
    </div>
  )
}
```

--------------------------------

### Next.js MDX Project File Structure

Source: https://nextjs.org/docs/pages/guides/mdx

This snippet outlines the recommended directory and file structure for a Next.js project that incorporates MDX. It shows where to place MDX content, page files, and the MDX component configuration file for proper integration.

```txt
  .
  ├── markdown/
  │   └── welcome.(mdx/md)
  ├── pages/
  │   └── mdx-page.(tsx/js)
  ├── mdx-components.(tsx/js)
  └── package.json
```

--------------------------------

### CSS Module Import Ordering in Turbopack

Source: https://nextjs.org/docs/app/api-reference/turbopack

Demonstrates how Turbopack orders CSS modules based on JavaScript import order. This example shows importing utility styles before button styles, which determines their order in the produced CSS chunk. Turbopack follows JS import order for CSS modules, unlike webpack which may ignore ordering in certain cases.

```jsx
import utilStyles from './utils.module.css'
import buttonStyles from './button.module.css'
export default function BlogPost() {
  return (
    <div className={utilStyles.container}>
      <button className={buttonStyles.primary}>Click me</button>
    </div>
  )
}
```

--------------------------------

### Cache Asynchronous Data using 'use cache' in Next.js

Source: https://nextjs.org/docs/messages/blocking-route

Apply the 'use cache' directive to asynchronous functions to allow Next.js to prerender the data. This example uses cacheTag and cacheLife for granular revalidation control.

```jsx
import { cacheTag, cacheLife } from 'next/cache'

async function getRecentArticles() {
  "use cache"
  // This cache can be revalidated by webhook or server action
  // when you call revalidateTag("articles")
  cacheTag("articles")
  // This cache will revalidate after an hour even if no explicit
  // revalidate instruction was received
  cacheLife('hours')
  return db.query(...)
}

export default async function Page() {
  const articles = await getRecentArticles(token);
  return <ArticleList articles={articles} />
}
```

--------------------------------

### Implementing Static Site Generation (SSG) in Next.js

Source: https://nextjs.org/docs/app/guides/migrating/app-router-migration

Shows how to pre-render pages at build time by fetching external data. The Pages directory uses the getStaticProps lifecycle method, whereas the App directory uses the standard fetch API with default caching enabled.

```jsx
// `pages` directory

export async function getStaticProps() {
  const res = await fetch(`https://...`)
  const projects = await res.json()

  return { props: { projects } }
}

export default function Index({ projects }) {
  return projects.map((project) => <div>{project.name}</div>)
}
```

```jsx
// `app` directory

// This function can be named anything
async function getProjects() {
  const res = await fetch(`https://...`)
  const projects = await res.json()

  return projects
}

export default async function Index() {
  const projects = await getProjects()

  return projects.map((project) => <div>{project.name}</div>)
}
```

--------------------------------

### use server Directive at File Top - TypeScript and JavaScript

Source: https://nextjs.org/docs/app/api-reference/directives/use-server

Demonstrates using the 'use server' directive at the top of a file to mark all exported functions as server-side functions. This example shows a createUser function that performs database operations with authentication checks. The directive ensures all functions in the file execute on the server.

```typescript
'use server'
import { db } from '@/lib/db' // Your database client
import { auth } from '@/lib/auth'

export async function createUser(data: { name: string; email: string }) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = await db.user.create({ data })
  return { id: user.id, name: user.name }
}
```

```javascript
'use server'
import { db } from '@/lib/db' // Your database client
import { auth } from '@/lib/auth'

export async function createUser(data) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = await db.user.create({ data })
  return { id: user.id, name: user.name }
}
```

--------------------------------

### Enable Local IP Optimization in Next.js Images

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

Demonstrates how to enable local IP optimization in Next.js by setting dangerouslyAllowLocalIP to true. This security restriction blocks local IP optimization by default and should only be enabled for private networks.

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true, // Only for private networks
  },
}

export default nextConfig
```

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowLocalIP: true, // Only for private networks
  },
}

module.exports = nextConfig
```

--------------------------------

### Configure Tailwind CSS v3 Template Paths

Source: https://nextjs.org/docs/app/guides/tailwind-v3-css

Configure the tailwind.config.js file to specify template paths where Tailwind should scan for class names. This configuration includes app, pages, and components directories with support for JavaScript, TypeScript, JSX, TSX, and MDX files.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

--------------------------------

### Wildcard Path Matching with Nested Segments

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites

Shows how to use wildcard matching with the * modifier to match zero or more path segments. This allows matching nested paths like /blog/a/b/c/d/hello-world.

```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/blog/:slug*',
        destination: '/news/:slug*', // Matched parameters can be used in the destination
      },
    ]
  },
}
```

--------------------------------

### Next.js `getStaticPaths` with `fallback: true` and `router.isFallback`

Source: https://nextjs.org/docs/pages/api-reference/functions/get-static-paths

This Next.js example demonstrates configuring `getStaticPaths` with `fallback: true` to allow new paths to be generated on demand. It shows how to use `router.isFallback` within the page component to display a loading indicator while a new page is being server-side rendered. The `getStaticProps` function fetches data for the post and includes `revalidate` for Incremental Static Regeneration.

```jsx
import { useRouter } from 'next/router'

function Post({ post }) {
  const router = useRouter()

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Loading...</div>
  }

  // Render post...
}

// This function gets called at build time
export async function getStaticPaths() {
  return {
    // Only `/posts/1` and `/posts/2` are generated at build time
    paths: [{ params: { id: '1' } }, { params: { id: '2' } }],
    // Enable statically generating additional pages
    // For example: `/posts/3`
    fallback: true,
  }
}

// This also gets called at build time
export async function getStaticProps({ params }) {
  // params contains the post `id`.
  // If the route is like /posts/1, then params.id is 1
  const res = await fetch(`https://.../posts/${params.id}`)
  const post = await res.json()

  // Pass post data to the page via props
  return {
    props: { post },
    // Re-generate the post at most once per second
    // if a request comes in
    revalidate: 1,
  }
}

export default Post
```

--------------------------------

### Implement Conditional Cache Lifetimes in Next.js

Source: https://nextjs.org/docs/app/api-reference/functions/cacheLife

Demonstrates how to use the cacheLife function within different code paths to set varying cache durations based on data availability. This example uses named profiles like 'minutes' for missing content and 'days' for published content.

```tsx
import { cacheLife, cacheTag } from 'next/cache'

async function getPostContent(slug: string) {
  'use cache'

  const post = await fetchPost(slug)

  // Tag the cache entry for targeted revalidation
  cacheTag(`post-${slug}`)

  if (!post) {
    // Content may not be published yet or could be in draft
    // Cache briefly to reduce database load
    cacheLife('minutes')
    return null
  }

  // Published content can be cached longer
  cacheLife('days')

  // Return only the necessary data to keep cache size minimal
  return post.data
}
```

--------------------------------

### Customize renderPage in Next.js Document - TypeScript and JavaScript

Source: https://nextjs.org/docs/pages/building-your-application/routing/custom-document

Demonstrates how to override renderPage in a custom _document file to enhance app and component rendering for server-side rendering support. The example shows wrapping the React tree with enhanceApp and enhanceComponent options. This pattern is useful for CSS-in-JS libraries that need server-side rendering capabilities.

```typescript
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    const originalRenderPage = ctx.renderPage

    // Run the React rendering logic synchronously
    ctx.renderPage = () =>
      originalRenderPage({
        // Useful for wrapping the whole react tree
        enhanceApp: (App) => App,
        // Useful for wrapping in a per-page basis
        enhanceComponent: (Component) => Component,
      })

    // Run the parent `getInitialProps`, it now includes the custom `renderPage`
    const initialProps = await Document.getInitialProps(ctx)

    return initialProps
  }

  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
```

```javascript
import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const originalRenderPage = ctx.renderPage

    // Run the React rendering logic synchronously
    ctx.renderPage = () =>
      originalRenderPage({
        // Useful for wrapping the whole react tree
        enhanceApp: (App) => App,
        // Useful for wrapping in a per-page basis
        enhanceComponent: (Component) => Component,
      })

    // Run the parent `getInitialProps`, it now includes the custom `renderPage`
    const initialProps = await Document.getInitialProps(ctx)

    return initialProps
  }

  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
```

--------------------------------

### Basic Dynamic Route Segment in Next.js

Source: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes

Creates a dynamic route segment using square bracket notation. The slug parameter is passed as a Promise to the Page component and must be awaited in Server Components. This example demonstrates a blog post route that accepts dynamic slug values.

```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <div>My Post: {slug}</div>
}
```

```javascript
export default async function Page({ params }) {
  const { slug } = await params
  return <div>My Post: {slug}</div>
}
```

--------------------------------

### Routing Information Structure

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/adapterPath

Complete routing information with processed patterns ready for deployment. Includes route phases, dynamic matchers, and common route field definitions.

```APIDOC
## Routing Information (`routing`)

### Description
Complete routing information available in onBuildComplete with processed patterns ready for deployment.

### Routing Phases

#### routing.beforeMiddleware
- Routes applied before middleware execution
- Includes generated header and redirect behavior

#### routing.beforeFiles
- Rewrite routes checked before filesystem route matching

#### routing.afterFiles
- Rewrite routes checked after filesystem route matching

#### routing.dynamicRoutes
- Dynamic matchers generated from route segments such as `[slug]` and catch-all routes

#### routing.onMatch
- Routes that apply after a successful match
- Example: immutable cache headers for hashed static assets

#### routing.fallback
- Final rewrite routes checked when earlier phases did not produce a match

### Common Route Fields

Each route entry can include:

- **source** (string) - Optional - Original route pattern
- **sourceRegex** (string) - Required - Compiled regex for matching requests
- **destination** (string) - Optional - Internal destination or redirect destination
- **headers** (Record<string, string>) - Optional - Headers to apply
- **has** (RouteHas[]) - Optional - Positive matching conditions
- **missing** (RouteHas[]) - Optional - Negative matching conditions
- **status** (number) - Optional - Redirect status code
- **priority** (number) - Optional - Internal route priority flag

### Example Routing Structure
```json
{
  "beforeMiddleware": [],
  "beforeFiles": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "status": 301
    }
  ],
  "afterFiles": [],
  "dynamicRoutes": [
    {
      "source": "/blog/:slug",
      "sourceRegex": "^\\/blog\\/([^\\/]+?)(?:\\/)?\\/?"
    }
  ],
  "onMatch": [],
  "fallback": []
}
```
```

--------------------------------

### Handle Dynamic Next.js Route Params with Suspense

Source: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes

This example illustrates how to manage dynamic route parameters using React's `Suspense` component when `generateStaticParams` is not utilized. Since `params` are asynchronous in this scenario, `Suspense` provides a fallback UI while the dynamic `slug` is being resolved at runtime, ensuring a smooth user experience during data fetching.

```tsx
import { Suspense } from 'react'

export default function Page({ params }: PageProps<'/blog/[slug]'>) {
  return (
    <div>
      <h1>Blog Post</h1>
      <Suspense fallback={<div>Loading...</div>}>
        {params.then(({ slug }) => (
          <Content slug={slug} />
        ))}
      </Suspense>
    </div>
  )
}

async function Content({ slug }: { slug: string }) {
  const res = await fetch(`https://api.vercel.app/blog/${slug}`)
  const post = await res.json()

  return (
    <article>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
    </article>
  )
}
```

--------------------------------

### Manually Pass Parameters in Query String

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites

Illustrates how to manually specify query parameters in the destination URL when some parameters are already used in the path. This allows selective parameter passing even when parameters are consumed by the destination.

```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/:first/:second',
        destination: '/:first?second=:second',
        // Since the :first parameter is used in the destination the :second parameter
        // will not automatically be added in the query although we can manually add it
        // as shown above
      },
    ]
  },
}
```

--------------------------------

### Disable Specific Next.js ESLint Rules (JavaScript)

Source: https://nextjs.org/docs/app/api-reference/config/eslint

This example illustrates how to modify or disable specific ESLint rules, including those from `react` and `@next/next` plugins, using the `rules` property in `eslint.config.mjs`. It also shows how to override the default global ignores provided by `eslint-config-next` to customize ignored files and directories.

```javascript
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
```

--------------------------------

### Define and Use Sass Variables in Next.js Components

Source: https://nextjs.org/docs/app/guides/sass

This example illustrates how to define Sass variables within a `.module.scss` file and then export them using the `:export` rule. The exported variables can then be imported into a React component (e.g., a Next.js page) and used for dynamic styling, providing a way to share design tokens between Sass and JavaScript.

```scss
$primary-color: #64ff00;

:export {
  primaryColor: $primary-color;
}
```

```jsx
// maps to root `/` URL

import variables from './variables.module.scss'

export default function Page() {
  return <h1 style={{ color: variables.primaryColor }}>Hello, Next.js!</h1>
}
```

--------------------------------

### Static Generation with getStaticProps in Next.js

Source: https://nextjs.org/docs/pages/building-your-application/rendering/static-site-generation

Demonstrates fetching external data at build time using getStaticProps to prerender a blog page with posts. The getStaticProps function is called at build time and passes fetched data as props to the page component, enabling static generation with dynamic content.

```jsx
export default function Blog({ posts }) {
  // Render posts...
}

// This function gets called at build time
export async function getStaticProps() {
  // Call an external API endpoint to get posts
  const res = await fetch('https://.../posts')
  const posts = await res.json()

  // By returning { props: { posts } }, the Blog component
  // will receive `posts` as a prop at build time
  return {
    props: {
      posts,
    },
  }
}
```

--------------------------------

### Build Output Types

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/adapterPath

Describes the different types of build outputs generated by Next.js, including pages, API routes, prerenders, static files, and middleware. Output composition varies based on the build configuration, particularly when using export mode.

```APIDOC
## Build Output Types

### Description
The outputs object contains arrays of different build output types generated by the Next.js build process. The specific outputs populated depend on the project configuration and build mode.

### Output Types

#### outputs.pages
- **Type**: Array of React pages
- **Source**: `pages/` directory
- **Description**: Server-side rendered pages from the pages router

#### outputs.pagesApi
- **Type**: Array of API routes
- **Source**: `pages/api/` directory
- **Description**: API route handlers from the pages router

#### outputs.appPages
- **Type**: Array of React pages
- **Source**: `app/` directory
- **Description**: Server and client components from the app router

#### outputs.appRoutes
- **Type**: Array of route handlers
- **Source**: `app/` directory
- **Description**: API routes and metadata routes (sitemap, robots, etc.) from the app router

#### outputs.prerenders
- **Type**: Array of prerendered routes
- **Description**: ISR-enabled routes and static prerenders

#### outputs.staticFiles
- **Type**: Array of static assets
- **Description**: Static assets and auto-statically optimized pages

#### outputs.middleware
- **Type**: Single middleware function or null
- **Description**: Middleware function if present in the project

### Configuration Notes

#### Export Mode (`config.output: 'export'`)
When `config.output` is set to `'export'`, only `outputs.staticFiles` is populated. All other arrays (`pages`, `appPages`, `pagesApi`, `appRoutes`, `prerenders`) will be empty since the entire application is exported as static files.

### Edge Runtime Output
For any route output with `runtime: 'edge'`, the `edgeRuntime` field is included containing canonical entry metadata for invoking that output in your edge runtime.
```

--------------------------------

### Update Catch-all Page to Render Client Component

Source: https://nextjs.org/docs/app/guides/migrating/from-create-react-app

Finalizes the entrypoint by importing and rendering the ClientOnly component within the catch-all page. This configuration effectively bridges the Next.js routing system with the client-side React application.

```tsx
import { ClientOnly } from './client'

export function generateStaticParams() {
  return [{ slug: [''] }]
}

export default function Page() {
  return <ClientOnly />
}
```

```jsx
import { ClientOnly } from './client'

export function generateStaticParams() {
  return [{ slug: [''] }]
}

export default function Page() {
  return <ClientOnly />
}
```

--------------------------------

### next info Command

Source: https://nextjs.org/docs/app/api-reference/cli/next

Prints relevant details about the current system which can be used to report Next.js bugs. This includes Operating System information, Binaries versions (Node.js, npm, Yarn, pnpm), and relevant package versions.

```APIDOC
## next info

### Description
Prints relevant details about the current system which can be used to report Next.js bugs when opening a GitHub issue. This information includes Operating System platform/arch/version, Binaries (Node.js, npm, Yarn, pnpm), package versions (next, react, react-dom), and more.

### Command
```bash
next info [options]
```

### Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show all available options. |
| `--verbose` | Collects additional information for debugging. |

### Response Example

```
Operating System:
  Platform: darwin
  Arch: arm64
  Version: Darwin Kernel Version 23.6.0
  Available memory (MB): 65536
  Available CPU cores: 10
Binaries:
  Node: 20.12.0
  npm: 10.5.0
  Yarn: 1.22.19
  pnpm: 9.6.0
Relevant Packages:
  next: 15.0.0-canary.115
  eslint-config-next: 14.2.5
  react: 19.0.0-rc
  react-dom: 19.0.0
  typescript: 5.5.4
Next.js Config:
  output: N/A
```

### Usage Examples

```bash
# Display system information
next info

# Display system information with verbose output
next info --verbose
```
```

--------------------------------

### Configure Remark and Rehype Plugins with Turbopack

Source: https://nextjs.org/docs/app/guides/mdx

Configure remark and rehype plugins for use with Turbopack by specifying plugin names as strings instead of imports. Supports plugins with and without options. Plugins must have serializable options since JavaScript functions cannot be passed to Rust.

```javascript
import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      // Without options
      'remark-gfm',
      // With options
      ['remark-toc', { heading: 'The Table' }],
    ],
    rehypePlugins: [
      // Without options
      'rehype-slug',
      // With options
      ['rehype-katex', { strict: true, throwOnError: true }],
    ],
  },
})

export default withMDX(nextConfig)
```

--------------------------------

### Define Next.js Configuration as a Function

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js

This snippet illustrates how to define the Next.js configuration as a function that receives `phase` and `defaultConfig` arguments. This allows for dynamic configuration based on the current build phase or other contextual information.

```javascript
// @ts-check

export default (phase, { defaultConfig }) => {
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    /* config options here */
  }
  return nextConfig
}
```

--------------------------------

### Implement Catch-All Null Component for Next.js Parallel Route (TSX/JSX)

Source: https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes

This example demonstrates a catch-all parallel route (`@auth/[...catchAll]/page.tsx`) that returns `null`. This is used to close a modal when navigating to any page other than the one that initially opened the modal, ensuring the modal's content is not displayed on subsequent routes.

```tsx
export default function CatchAll() {
  return null
}
```

```jsx
export default function CatchAll() {
  return null
}
```

--------------------------------

### Access dynamic route parameters in Next.js icon generation (TypeScript/JavaScript)

Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons

This example illustrates how to retrieve dynamic route parameters within the default export function of an icon file (e.g., `app/shop/[slug]/icon.tsx`). The function receives a `params` prop, which is a promise that resolves to an object containing the route parameters. This enables the creation of dynamic icons that can vary based on the URL segment, such as displaying a product-specific icon.

```tsx
export default async function Icon({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // ...
}
```

```jsx
export default async function Icon({ params }) {
  const { slug } = await params
  // ...
}
```

--------------------------------

### Retrieve E2E Test Logs for Next.js Adapters using Bash

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/adapterPath

A script contract for the Next.js test harness that extracts and replays build and server logs. It ensures required metadata like BUILD_ID and DEPLOYMENT_ID are present in the output for test validation.

```bash
#!/usr/bin/env bash
set -euo pipefail

if [ -f ".adapter-build.log" ]; then
  cat ".adapter-build.log"
fi

if [ -f ".adapter-server.log" ]; then
  echo "=== .adapter-server.log ==="
  cat ".adapter-server.log"
fi
```

--------------------------------

### Configure Next.js Proxy Matcher with Regular Expression Exclusion (JavaScript)

Source: https://nextjs.org/docs/pages/api-reference/file-conventions/proxy

This example shows how to use a regular expression within the `matcher` option to exclude specific paths from the Next.js Proxy. The regex `'/((?!api|_next/static|_next/image|.*\.png$).*)'` is used to ignore API routes, static files, image optimizations, and `.png` files, providing fine-grained control over proxy application.

```js
export const config = {
  matcher: [
    // Exclude API routes, static files, image optimizations, and .png files
    '/((?!api|_next/static|_next/image|.*\.png$).*)',
  ],
}
```

--------------------------------

### Illustrate Root and Nested Template Mount on First Segment Change to `/blog` in Next.js

Source: https://nextjs.org/docs/app/api-reference/file-conventions/template

This JSX snippet depicts the React tree after navigating to `/blog`. The root `Template` remounts due to the first segment change. Additionally, a new nested `Template` (from `app/blog/template.tsx`) mounts for the `/blog` segment, both receiving keys corresponding to their respective paths, and ultimately rendering the `BlogIndexPage`.

```jsx
<RootLayout>
  {/* app/template.tsx (root) */}
  <Template key="/blog">
    {/* app/blog/template.tsx */}
    <Template key="/blog">
      <BlogIndexPage />
    </Template>
  </Template>
</RootLayout>
```

--------------------------------

### Invoke Next.js Server Action from Client Component using formAction

Source: https://nextjs.org/docs/app/getting-started/mutating-data

This example demonstrates how a Client Component can trigger a Server Action. The `createPost` Server Action, imported from a file with the `'use server'` directive, is assigned to the `formAction` prop of an HTML `<button>`. When the button is clicked, it invokes the server-side `createPost` function, enabling server-side operations directly from client-side interactions.

```tsx
'use client'

import { createPost } from '@/app/actions'

export function Button() {
  return <button formAction={createPost}>Create</button>
}
```

```jsx
'use client'

import { createPost } from '@/app/actions'

export function Button() {
  return <button formAction={createPost}>Create</button>
}
```

--------------------------------

### Send Generic HTTP Response with Status Handling in Next.js API Routes

Source: https://nextjs.org/docs/pages/building-your-application/routing/api-routes

This example shows how to send a generic HTTP response from a Next.js API route, supporting string, object, or Buffer bodies. It uses `res.status().send()` and includes error handling to return appropriate HTTP status codes and messages, ensuring robust API behavior.

```ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await someAsyncOperation()
    res.status(200).send({ result })
  } catch (err) {
    res.status(500).send({ error: 'failed to fetch data' })
  }
}
```

```js
export default async function handler(req, res) {
  try {
    const result = await someAsyncOperation()
    res.status(200).send({ result })
  } catch (err) {
    res.status(500).send({ error: 'failed to fetch data' })
  }
}
```

--------------------------------

### Next.js Route Handler for Redirect Lookup

Source: https://nextjs.org/docs/app/guides/redirecting

Implements a GET Route Handler that retrieves redirect entries from a JSON file based on pathname query parameters. Handles Bloom filter false positives by verifying the redirect exists before returning it, and returns appropriate error responses for invalid or missing pathnames.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import redirects from '@/app/redirects/redirects.json'

type RedirectEntry = {
  destination: string
  permanent: boolean
}

export function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get('pathname')
  if (!pathname) {
    return new Response('Bad Request', { status: 400 })
  }

  // Get the redirect entry from the redirects.json file
  const redirect = (redirects as Record<string, RedirectEntry>)[pathname]

  // Account for bloom filter false positives
  if (!redirect) {
    return new Response('No redirect', { status: 400 })
  }

  // Return the redirect entry
  return NextResponse.json(redirect)
}
```

```javascript
import { NextResponse } from 'next/server'
import redirects from '@/app/redirects/redirects.json'

export function GET(request) {
  const pathname = request.nextUrl.searchParams.get('pathname')
  if (!pathname) {
    return new Response('Bad Request', { status: 400 })
  }

  // Get the redirect entry from the redirects.json file
  const redirect = redirects[pathname]

  // Account for bloom filter false positives
  if (!redirect) {
    return new Response('No redirect', { status: 400 })
  }

  // Return the redirect entry
  return NextResponse.json(redirect)
}
```

--------------------------------

### Dynamically Import Named Exports in Next.js

Source: https://nextjs.org/docs/app/guides/lazy-loading

This example illustrates how to dynamically import a specific named export from a module using `next/dynamic`. By chaining `.then((mod) => mod.ExportName)` to the `import()` promise, you can directly access and render the desired component. This pattern is essential for selectively loading parts of a module when full module import is not necessary.

```jsx
'use client'

export function Hello() {
  return <p>Hello!</p>
}
```

```jsx
import dynamic from 'next/dynamic'

const ClientComponent = dynamic(() =>
  import('../components/hello').then((mod) => mod.Hello)
)
```

--------------------------------

### Configure Next.js Fetch Logging for Full URLs

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/logging

This configuration in `next.config.js` enables the logging of the full URL for all fetch requests made during Next.js development, providing detailed insight into network activity.

```js
module.exports = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}
```

--------------------------------

### Configure Nitrogen AIO Image Loader for Next.js

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/images

A loader for Nitrogen AIO that manages transformations through a semicolon-separated 'aio' query parameter. It preserves existing parameters while adding width and quality.

```javascript
// Docs: https://docs.n7.io/aio/intergrations/
export default function aioLoader({ src, width, quality }) {
  const url = new URL(src, window.location.href)
  const params = url.searchParams
  const aioParams = params.getAll('aio')
  aioParams.push(`w-${width}`)
  if (quality) {
    aioParams.push(`q-${quality.toString()}`)
  }
  params.set('aio', aioParams.join(';'))
  return url.href
}
```

--------------------------------

### Configure Jest setupFilesAfterEnv in jest.config

Source: https://nextjs.org/docs/pages/guides/testing/jest

Add setupFilesAfterEnv configuration to Jest config file to automatically import custom matchers from @testing-library/jest-dom for all tests. This eliminates the need to manually import matchers in each test file.

```typescript
setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
```

```javascript
setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
```

--------------------------------

### Demonstrate synchronous dynamic API access warning in Next.js 15

Source: https://nextjs.org/docs/messages/sync-dynamic-apis

This example shows how direct, synchronous access to `params.id` within a Next.js Page component will trigger a warning in Next.js 15. This behavior applies to all dynamic APIs (e.g., `params`, `searchParams`, `cookies()`, `draftMode()`, `headers()`) which have been made asynchronous.

```jsx
function Page({ params }) {
  // direct access of `params.id`.
  return <p>ID: {params.id}</p>
}
```

--------------------------------

### Implement Snapshot Testing

Source: https://nextjs.org/docs/app/guides/testing/jest

Creates a snapshot test to track UI changes over time. This test captures the rendered output of a component and compares it against a saved reference file.

```jsx
import { render } from '@testing-library/react'
import Page from '../app/page'

it('renders homepage unchanged', () => {
  const { container } = render(<Page />)
  expect(container).toMatchSnapshot()
})
```

--------------------------------

### Implement Incremental Static Regeneration (ISR) for dynamic Next.js pages

Source: https://nextjs.org/docs/pages/guides/incremental-static-regeneration

This example demonstrates how to use `getStaticPaths` and `getStaticProps` with the `revalidate` option in Next.js to implement Incremental Static Regeneration for dynamic pages. It fetches blog post data from an external API, pre-renders known paths, and revalidates content at most once every 60 seconds, ensuring updated content is served efficiently.

```tsx
import type { GetStaticPaths, GetStaticProps } from 'next'

interface Post {
  id: string
  title: string
  content: string
}

interface Props {
  post: Post
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await fetch('https://api.vercel.app/blog').then((res) =>
    res.json()
  )
  const paths = posts.map((post: Post) => ({
    params: { id: String(post.id) },
  }))

  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps<Props> = async ({
  params,
}: {
  params: { id: string }
}) => {
  const post = await fetch(`https://api.vercel.app/blog/${params.id}`).then(
    (res) => res.json()
  )

  return {
    props: { post },
    // Next.js will invalidate the cache when a
    // request comes in, at most once every 60 seconds.
    revalidate: 60,
  }
}

export default function Page({ post }: Props) {
  return (
    <main>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </main>
  )
}
```

```jsx
export async function getStaticPaths() {
  const posts = await fetch('https://api.vercel.app/blog').then((res) =>
    res.json()
  )
  const paths = posts.map((post) => ({
    params: { id: post.id },
  }))

  return { paths, fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const post = await fetch(`https://api.vercel.app/blog/${params.id}`).then(
    (res) => res.json()
  )

  return {
    props: { post },
    // Next.js will invalidate the cache when a
    // request comes in, at most once every 60 seconds.
    revalidate: 60,
  }
}

export default function Page({ post }) {
  return (
    <main>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </main>
  )
}
```

--------------------------------

### Controlling Dialog State via URL Search Params in Next.js

Source: https://nextjs.org/docs/app/guides/preserving-ui-state

This example provides a robust solution for managing dialog state in Next.js by deriving its visibility from URL search parameters using `useSearchParams` and `useRouter`. This approach ensures that `useEffect` hooks dependent on the dialog's state re-run correctly after navigation, as changes to the URL (and thus the derived state) are always detected. It also demonstrates how to open and close the dialog by manipulating the URL.

```tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

function ProductTab() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isDialogOpen = searchParams.get('edit') === 'true'
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isDialogOpen) {
      inputRef.current?.focus()
    }
  }, [isDialogOpen])

  return (
    <div>
      <button onClick={() => router.push('?edit=true')}>Edit Product</button>

      {isDialogOpen && (
        <dialog open>
          <input ref={inputRef} placeholder="Product name" />
          <button onClick={() => router.replace('?', { scroll: false })}>
            Close
          </button>
        </dialog>
      )}
    </div>
  )
}
```

--------------------------------

### Implement Data-Level Caching with 'use cache' Directive

Source: https://nextjs.org/docs/app/building-your-application/rendering

Cache an asynchronous function that fetches or computes data by adding the 'use cache' directive at the top of the function body. Use cacheLife() to specify cache duration. This approach is useful when the same data is used across multiple components.

```TypeScript
import { cacheLife } from 'next/cache'

export async function getUsers() {
  'use cache'
  cacheLife('hours')
  return db.query('SELECT * FROM users')
}
```

--------------------------------

### Migrate from deprecated `url` to `withRouter` in Next.js pages

Source: https://nextjs.org/docs/messages/url-deprecated

This example demonstrates how to replace the deprecated `url` property with the `withRouter` higher-order component in a Next.js page. `withRouter` explicitly injects the Next.js router object into the component's props, providing access to properties like `pathname`, `asPath`, and `query` in a predictable manner.

```jsx
import { withRouter } from 'next/router'

class Page extends React.Component {
  render() {
    const { router } = this.props
    console.log(router)
    return <div>{router.pathname}</div>
  }
}

export default withRouter(Page)
```

--------------------------------

### Create Full-Screen Background Images with Next.js Image

Source: https://nextjs.org/docs/app/api-reference/components/image

Shows how to use the fill prop to create a background image that covers the entire viewport. It includes properties for quality optimization and blur placeholders to improve perceived performance.

```jsx
import Image from 'next/image'
import mountains from '../public/mountains.jpg'

export default function Background() {
  return (
    <Image
      alt="Mountains"
      src={mountains}
      placeholder="blur"
      quality={100}
      fill
      sizes="100vw"
      style={{
        objectFit: 'cover',
      }}
    />
  )
}
```

--------------------------------

### Handle Client-Side Navigation with Next.js Link onNavigate (TSX/JSX)

Source: https://nextjs.org/docs/app/api-reference/components/link

This example illustrates the use of the `onNavigate` event handler on a Next.js `<Link />` component, which triggers specifically during client-side navigations. The handler receives an event object, allowing custom logic execution or the prevention of navigation via `e.preventDefault()`. It's important to note that `onNavigate` differs from `onClick` by only activating for SPA navigations and not for external URLs or downloads.

```tsx
import Link from 'next/link'

export default function Page() {
  return (
    <Link
      href="/dashboard"
      onNavigate={(e) => {
        // Only executes during SPA navigation
        console.log('Navigating...')

        // Optionally prevent navigation
        // e.preventDefault()
      }}
    >
      Dashboard
    </Link>
  )
}
```

```jsx
import Link from 'next/link'

export default function Page() {
  return (
    <Link
      href="/dashboard"
      onNavigate={(e) => {
        // Only executes during SPA navigation
        console.log('Navigating...')

        // Optionally prevent navigation
        // e.preventDefault()
      }}
    >
      Dashboard
    </Link>
  )
}
```

--------------------------------

### Analyze Next.js Bundle with pnpm

Source: https://nextjs.org/docs/app/guides/package-bundling

This command builds the Next.js application while enabling bundle analysis, which opens reports in the browser to inspect module sizes and dependencies. It helps identify large modules for optimization.

```bash
ANALYZE=true pnpm build
```

--------------------------------

### Use `revalidateTag` with `cacheLife` in Next.js Server Actions

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

This example illustrates how to use the `revalidateTag` function within a Next.js Server Action to mark cached data as stale. The new `cacheLife` profile, specified as the second argument (e.g., 'max'), allows for fine-grained control over revalidation behavior, where users see stale data while fresh data is fetched in the background.

```typescript
'use server'

import { revalidateTag } from 'next/cache'

export async function updateArticle(articleId: string) {
  // Mark article data as stale - article readers see stale data while it revalidates
  revalidateTag(`article-${articleId}`, 'max')
}
```

```javascript
'use server'

import { revalidateTag } from 'next/cache'

export async function updateArticle(articleId) {
  // Mark article data as stale - article readers see stale data while it revalidates
  revalidateTag(`article-${articleId}`, 'max')
}
```

--------------------------------

### Legacy getLayout Pattern (Before Migration)

Source: https://nextjs.org/docs/pages/guides/migrating/app-router-migration

The traditional pattern for per-page layouts in the Next.js pages directory using a custom getLayout function attached to the page component.

```jsx
// components/DashboardLayout.js
export default function DashboardLayout({ children }) {
  return (
    <div>
      <h2>My Dashboard</h2>
      {children}
    </div>
  )
}

// pages/dashboard/index.js
import DashboardLayout from '../components/DashboardLayout'

export default function Page() {
  return <p>My Page</p>
}

Page.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>
}
```

--------------------------------

### Path Matching with Named Parameters

Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites

Demonstrates basic path matching where named parameters like :slug are matched and can be reused in the destination. This pattern matches single-level paths without nested segments.

```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/blog/:slug',
        destination: '/news/:slug', // Matched parameters can be used in the destination
      },
    ]
  },
}
```

--------------------------------

### Implement Page-Level Streaming with loading.js in Next.js

Source: https://nextjs.org/docs/app/guides/streaming

Create an automatic loading state for a route segment by defining a Loading component. Next.js automatically wraps the page content in a Suspense boundary and displays this component as a fallback while the page data resolves.

```tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
    </div>
  )
}
```

```jsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
    </div>
  )
}
```

--------------------------------

### Fix synchronous dynamic API access in Next.js Client Components using React.use()

Source: https://nextjs.org/docs/messages/sync-dynamic-apis

In Client Components, use `React.use()` to unwrap the Promise returned by dynamic APIs. This example shows how to asynchronously access `params.id` within a Client Component by wrapping `params` with `React.use()`, ensuring proper handling of the asynchronous value.

```jsx
'use client'
import * as React from 'react'

function Page({ params }) {
  // asynchronous access of `params.id`.
  const { id } = React.use(params)
  return <p>ID: {id}</p>
}
```

--------------------------------

### Implement Node.js Runtime Handler Interface in Next.js

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/adapterPath

Defines the entrypoint interface for Node.js runtimes using standard IncomingMessage and ServerResponse objects. It supports a context object for managing asynchronous tasks and request metadata for platform-specific revalidation and 404 rendering.

```typescript
handler(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: {
    waitUntil?: (promise: Promise<void>) => void
    requestMeta?: RequestMeta
  }
): Promise<void>

// Example invocation with requestMeta helpers
await handler(req, res, {
  requestMeta: {
    relativeProjectDir: '.',
    hostname: '127.0.0.1',
    revalidate: async ({ urlPath, headers, opts }) => {
      // platform-specific revalidate implementation
    },
    render404: async (req, res, parsedUrl, setHeaders) => {
      // platform-specific 404 rendering implementation
    },
  },
})
```

--------------------------------

### Configure Cypress for Next.js Component Testing

Source: https://nextjs.org/docs/app/guides/testing/cypress

This configuration snippet shows how to set up `cypress.config.ts` or `cypress.config.js` to enable component testing specifically for Next.js applications. It defines the `devServer` framework as 'next' and the bundler as 'webpack', which is essential for Cypress to correctly interpret and mount Next.js components during testing.

```ts
import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})
```

```js
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})
```

--------------------------------

### Implement Server-Side Redirect with getServerSideProps

Source: https://nextjs.org/docs/pages/api-reference/functions/get-server-side-props

Demonstrates how to use the redirect object within getServerSideProps to conditionally redirect users based on data fetching results. The redirect object requires a destination URL and a permanent boolean flag, with optional statusCode property for custom HTTP status codes. This example fetches data and redirects to the home page if no data is returned.

```javascript
export async function getServerSideProps(context) {
  const res = await fetch(`https://.../data`)
  const data = await res.json()

  if (!data) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {}, // will be passed to the page component as props
  }
}
```

--------------------------------

### Control scroll behavior on navigation with Next.js Link scroll prop

Source: https://nextjs.org/docs/pages/api-reference/components/link

This example shows how to use the `scroll` prop to disable automatic scrolling to the top of the page upon navigation. When `scroll` is set to `false`, Next.js will not attempt to adjust the scroll position. This allows the user to remain at their current scroll position on the new page, offering more control over the user experience.

```tsx
import Link from 'next/link'

export default function Home() {
  return (
    <Link href="/dashboard" scroll={false}>
      Dashboard
    </Link>
  )
}
```

```jsx
import Link from 'next/link'

export default function Home() {
  return (
    <Link href="/dashboard" scroll={false}>
      Dashboard
    </Link>
  )
}
```

--------------------------------

### Configure Turbopack Resolver Aliases and Extensions in Next.js

Source: https://nextjs.org/docs/app/api-reference/turbopack

Configure Turbopack resolver settings in next.config.js to add custom module aliases and file extensions. This example demonstrates adding a lodash alias and extending supported file types to include MDX, TSX, TypeScript, JSX, JavaScript, and JSON files.

```javascript
module.exports = {
  turbopack: {
    // Example: adding an alias and custom file extension
    resolveAlias: {
      underscore: 'lodash',
    },
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.json'],
  },
}
```

--------------------------------

### Configure Proxy Matcher for Selective Path Execution - Next.js

Source: https://nextjs.org/docs/app/guides/content-security-policy

Defines a matcher configuration object that filters proxy execution to specific request paths while excluding API routes, static assets, image optimization files, and favicon requests. It also filters out Next.js prefetch requests to optimize performance and reduce unnecessary CSP header processing.

```typescript
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
```

```javascript
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
```

--------------------------------

### Type JSON-LD Objects with TypeScript using schema-dts

Source: https://nextjs.org/docs/app/guides/json-ld

This example illustrates how to leverage the `schema-dts` package to add strong typing to JSON-LD objects in TypeScript. It defines a `Product` schema with `WithContext` to ensure type safety and autocompletion when creating structured data. This approach improves maintainability and reduces potential errors in structured data implementation.

```tsx
import { Product, WithContext } from 'schema-dts'

const jsonLd: WithContext<Product> = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Next.js Sticker',
  image: 'https://nextjs.org/imgs/sticker.png',
  description: 'Dynamic at the speed of static.',
}
```

--------------------------------

### Migrating from `next lint` to ESLint CLI with Codemods

Source: https://nextjs.org/docs/app/guides/upgrading/version-16

Provides codemod commands for various package managers to automate the migration from the removed `next lint` command to direct ESLint CLI usage. This helps update project scripts and configurations to use ESLint directly.

```bash
pnpm dlx @next/codemod@canary next-lint-to-eslint-cli .
```

```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

```bash
yarn dlx @next/codemod@canary next-lint-to-eslint-cli .
```

```bash
bunx @next/codemod@canary next-lint-to-eslint-cli .
```

--------------------------------

### Create a Static JSON Route Handler in Next.js for Static Export

Source: https://nextjs.org/docs/app/guides/static-exports

This code defines a Next.js Route Handler that responds to `GET` requests by returning a static JSON object. When `next build` is run with static export, this handler will generate a static `data.json` file, making it suitable for serving pre-rendered data.

```ts
export async function GET() {
  return Response.json({ name: 'Lee' })
}
```

```js
export async function GET() {
  return Response.json({ name: 'Lee' })
}
```

--------------------------------

### Setting a Default Fallback Title in Next.js Layout Metadata

Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

This example demonstrates using `title.default` within the `metadata` export in a Next.js layout file (`app/layout.tsx`) to provide a fallback title. Child route segments that do not explicitly define their own `title` will inherit this default, ensuring a consistent title even when specific page titles are omitted.

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Acme',
  },
}
```

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {}

// Output: <title>Acme</title>
```