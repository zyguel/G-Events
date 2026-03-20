# 🚀 G-Events

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-Proprietary-red) ![Version](https://img.shields.io/badge/version-1.0.0-orange)

**G-Events** is a **comprehensive event management dashboard** designed to give organizers full control over every stage of an event — from creation and registration to check-in, analytics, and certificate distribution.

## 📋 Table of Contents
* [About the Project](#-about-the-project)
* [Branching Strategy](#-branching-strategy)
* [Getting Started](#-getting-started)
* [Contribution Guidelines](#-contribution-guidelines)
* [Commit Standards](#-commit-standards)
* [Pull Request Process](#-pull-request-process)
* [License](#-license)

---

## 📖 About the Project

G-Events provides a robust solution for **managing the full lifecycle of events** — from drafting and publishing, through attendee registration and check-in, to post-event analytics and reporting.

**Key Features:**
* **Event Management:** Create, edit, and publish events with rich-text descriptions, banner images, agendas, themes, and objectives.
* **Attendee Registration & Order Forms:** Customisable multi-section order forms with field types (short answer, multiple choice, dropdowns, file upload, grids, etc.) and automatic confirmation pages.
* **Check-In:** Real-time attendee check-in interface for on-the-day operations.
* **Ticketing & Waitlists:** Manage ticket types, capacity limits, and waitlist queues.
* **Breakout Sessions:** Optional breakout session management per event.
* **Email Attendees:** Compose and send targeted emails to registered attendees directly from the dashboard.
* **Analytics & Reports:** Per-event and cross-event analytics (registrations, revenue, attendance trends, demographics) with export to CSV, Excel (XLSX), and PDF.
* **Certificates:** Certificate generation and distribution for attendees.
* **Team Management:** Role-based organisation user management with granular permissions.
* **Dark / Light Mode:** Full theme support across the entire admin dashboard.

### Built With

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database / Auth** | Supabase (PostgreSQL + Row-Level Security) |
| **Rich Text** | TipTap v3 (StarterKit, Underline, Link, Image, TextAlign, Color, FontFamily, FontSize, Placeholder) |
| **Charts / Data** | Custom Recharts-based components |
| **Exports** | jsPDF + jspdf-autotable (PDF), ExcelJS (XLSX), native CSV |
| **Animations** | Framer Motion v12 |
| **Icons** | Lucide React |
| **Date Handling** | date-fns v4, react-datepicker, react-time-picker |
| **Analytics** | Vercel Analytics |

---

## 🌿 Branching Strategy

We utilize a strict branching workflow to ensure stability while allowing for rapid development.

| Branch | Status | Description |
| :--- | :--- | :--- |
| **`main`** | 🟢 **Stable** | Production-ready code. This branch is protected and only accepts merges from `nightly` after thorough testing. **Do not push directly to main.** |
| **`nightly`** | 🟠 **Beta/Dev** | The active development branch. Contains the latest features and fixes. It may be unstable. All PRs should target this branch. |

---

## 🛠 Getting Started

### Prerequisites
* **Node.js** v20 or later
* **npm** v10 or later
* A **Supabase** project (free tier is sufficient for development)

### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/zyguel/G-Events.git
    ```
2.  **Checkout the development branch:**
    ```bash
    git checkout nightly
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Configure environment variables:**

    Create a `.env.local` file in the project root:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_DEFAULT_ORG_ID=1
    TS_TRANSLATION_MODEL=Xenova/m2m100_418M
    ```
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start local development server |
| `npm run build` | Compile production build |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint checks |

### Self-hosted Translation (TypeScript Engine)

This project exposes internal translation APIs powered by a TypeScript runtime model:

- `GET /api/translate/languages` - returns the fixed 10 supported languages from the TypeScript engine
- `POST /api/translate` - batch text translation
- `POST /api/translate/realtime` - translates nested payloads (objects/arrays), useful for DB/API responses
- `GET /api/translate/health` - reports model status and cache state

The TypeScript engine is currently limited to 10 languages:

- `en` English
- `zh` Chinese
- `es` Spanish
- `fr` French
- `de` German
- `ja` Japanese
- `ko` Korean
- `pt` Portuguese
- `hi` Hindi
- `ar` Arabic

Example realtime payload translation request:

```json
{
    "target": "es",
    "source": "en",
    "skipKeys": ["id", "email", "slug"],
    "payload": {
        "title": "Welcome",
        "description": "Manage your account settings",
        "items": [
            { "name": "Create Event" }
        ]
    }
}
```

---

## 🤝 Contribution Guidelines

We welcome contributions from the internal team. To ensure a smooth collaboration, please follow the standards outlined below.

### 📝 Commit Standards

We follow the **Conventional Commits** specification. This allows us to automatically generate changelogs and version numbers.

**Format:**
`type(scope): subject`

**Types:**
* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation only changes
* `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
* `refactor`: A code change that neither fixes a bug nor adds a feature
* `perf`: A code change that improves performance
* `test`: Adding missing tests or correcting existing tests
* `chore`: Changes to the build process or auxiliary tools and libraries

**Examples:**
> ✅ `feat(auth): implement google oauth login`
>
> ✅ `fix(calendar): correct timezone offset calculation`
>
> ✅ `docs(readme): update installation instructions`

**Bad Examples:**
> ❌ `added login` (Missing type)
>
> ❌ `fixed stuff` (Vague)

### ⚡ Safe Commit & Push Helper

A cross-platform Node.js script (`push-nightly.mjs`) is included at the repo root. It works on **macOS and Windows** using the Node.js already required by the project, and mirrors the GitHub Desktop workflow — pulling remote changes before committing, and auto-merging if the remote receives new commits between your pull and push.

```bash
# Via npm (recommended — works identically on macOS and Windows)
npm run push -- "feat(events): add certificate expiry field"

# Or directly with Node.js
node push-nightly.mjs "feat(events): add certificate expiry field"

# Commit only pre-staged files (skip auto git add --all)
npm run push -- "fix(checkin): resolve null ref" --no-add
```

The script will:
1. Ensure you are on the `nightly` branch (switches automatically if not).
2. Fetch `origin/nightly` to detect any remote-ahead commits.
3. Merge remote commits into local **before** creating the commit.
4. Stage and commit with the provided message.
5. Push to `origin/nightly`.
6. If the push is rejected (someone else pushed while you were working), automatically merge the new remote commits and retry the push.

### 🔄 Pull Request Process

1.  **Commit:** Commit your changes using the standards defined above.
2.  **Sync:** Ensure your branch is up to date with the upstream `nightly` branch to minimize conflicts.
3.  **Open PR:** Submit a Pull Request targeting the **`nightly`** branch.
    * *Note: PRs targeting `main` will be closed.*
4.  **Description:** Clearly describe the problem you are solving and the solution you implemented.
5.  **Review:** Wait for code review. Address any comments or requested changes.

---

## 📄 License

**Copyright © [Year] [Your Company/Name]. All Rights Reserved.**

This project is proprietary software. Unauthorized copying, distribution, modification, or use of this source code, via any medium, is strictly prohibited without the express written permission of the copyright holder.

This software is intended for private use only.
