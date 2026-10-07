# Mohammed Marzaq Portfolio

An interactive, neon night-market developer portfolio built with Vite, React, TypeScript, React Three Fiber, Drei, and GSAP. The root page is an interactive 3D scene; `/simple.html` provides a fast, accessible CV and project list for recruiters.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer

## Run locally

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To verify a production build locally:

```sh
npm run lint
npm run build
npm run preview
```

The production output is written to `dist/`. The simple CV is available at `/simple.html` in both development and production builds.

## Update content

  - Edit `src/data/projects.json` for the vending machine. Project image paths are relative to the public directory; place artwork in `public/projects/`.
  - Edit `src/data/profile.json` for the bio, experience, diplomas, and social URLs.
  - Edit `src/data/skills.json` for skill names and relative word-cloud strengths.
  - Keep the hand-authored CV and project list in `public/simple.html` in sync with the data files.
  - Replace the explicitly labeled sample project concepts and draft bio/skill weights before publishing. Add your real social URLs to `profile.json`.

  ## Deploy

  ### Netlify

  Connect the repository to Netlify. The included `netlify.toml` sets `npm run build` and `dist`; the `package-lock.json` lets Netlify install the exact dependency tree. No SPA fallback is required: Vite emits the app entry and `simple.html` as static pages.

  ### Vercel

  Import the repository in Vercel. The included `vercel.json` sets the Vite build command and `dist` output. Vercel can also detect these settings automatically.

  ### GitHub Pages

  The workflow at `.github/workflows/deploy.yml` builds and deploys on pushes to `main` and on manual dispatch. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source. The workflow derives the project-site base path from `GITHUB_REPOSITORY`; user/organization sites use `/`.

  For a custom domain on a project repository, set the Actions variable `VITE_BASE_PATH` to `/` so assets resolve from the domain root. The default is suitable for a standard `owner.github.io/repository/` project site.

  For other GitHub Pages workflows, set `GITHUB_ACTIONS=true` and `GITHUB_REPOSITORY=owner/repository` during `npm run build`, or set `VITE_BASE_PATH` explicitly. Base paths must include leading and trailing slashes, for example `/portfolio/`.

  ## SEO and previews

  The HTML entry includes title, description, Open Graph, and Twitter card metadata. `public/og-image.svg` and `public/portfolio-mark.svg` are original local assets. Social-preview crawlers generally require an absolute image URL; after choosing a production domain, set `og:image` and `twitter:image` to `https://your-domain/og-image.svg` if the crawler does not resolve the relative base URL.

  ## Scripts

  - `npm run dev` starts the development server.
  - `npm run lint` runs ESLint.
  - `npm run build` creates the production site.
  - `npm run preview` serves the production build locally.
