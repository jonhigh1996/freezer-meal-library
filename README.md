# Freezer Meal Library

A React + Vite web app for browsing 32 freezer-friendly recipes, cooking directions, and storage guidance. It is designed for Cloudflare Pages: there is no server, database, or API key.

## Features

- Search by meal, ingredient, or preparation detail
- Filter by meal type, freezer quality score, and favorites
- Sort by name, cooking time, or storage time
- Open a full recipe card with cooking, packing, thawing, and reheating guidance
- Save favorites in the browser using `localStorage`
- Runs entirely in the browser and deploys as static files

## Run locally

Install dependencies and start the local Vite development server:

```powershell
npm install
npm run dev
```

## Deploy to Cloudflare Pages

### Connect a GitHub repository

1. Push this folder to a GitHub repository.
2. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git** and select the repository.
3. Use these build settings:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Deploy. Future pushes automatically publish the static app.

### Deploy from the command line

With a Cloudflare account authenticated in Wrangler, deploy the prepared directory directly:

```powershell
npx wrangler pages deploy dist --project-name freezer-meal-library
```

`wrangler.toml` records the same output directory for local tooling. The Cloudflare `_headers` file applies basic static-site security headers and a short cache rule for recipe data.

All behavior—including search, filters, dialogs, and favorites—runs in the visitor's browser. Recipe data is bundled locally in `public/data/recipes.json`; no recipe API is called at runtime.

## Data

Recipe data is stored in `dist/data/recipes.json`. Its source was supplied with this project. Food safety guidance and source links are displayed in the app for reference; always follow current official guidance and package directions.
