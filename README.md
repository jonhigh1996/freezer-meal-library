# Freezer Meal Library

A no-build static web app for browsing 32 freezer-friendly recipes, cooking directions, and storage guidance. It is designed for Cloudflare Pages: there is no server, database, API key, or build process.

## Features

- Search by meal, ingredient, or preparation detail
- Filter by meal type, freezer quality score, and favorites
- Sort by name, cooking time, or storage time
- Open a full recipe card with cooking, packing, thawing, and reheating guidance
- Save favorites in the browser using `localStorage`
- Runs entirely in the browser and deploys as static files

## Run locally

Open `dist/index.html` in a modern browser. For reliable data loading, serve the `dist` directory with any static-file server, for example:

```powershell
npx serve dist
```

## Deploy to Cloudflare Pages

### Connect a GitHub repository

1. Push this folder to a GitHub repository.
2. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git** and select the repository.
3. Use these build settings:
   - Framework preset: **None**
   - Build command: leave blank
   - Build output directory: `dist`
4. Deploy. Future pushes automatically publish the static app.

### Deploy from the command line

With a Cloudflare account authenticated in Wrangler, deploy the prepared directory directly:

```powershell
npx wrangler pages deploy dist --project-name freezer-meal-library
```

`wrangler.toml` records the same output directory for local tooling. The Cloudflare `_headers` file applies basic static-site security headers and a short cache rule for recipe data.

The app has no build step or runtime dependencies. All behavior—including search, filters, dialogs, and favorites—runs in the visitor's browser.

## Data

Recipe data is stored in `dist/data/recipes.json`. Its source was supplied with this project. Food safety guidance and source links are displayed in the app for reference; always follow current official guidance and package directions.
