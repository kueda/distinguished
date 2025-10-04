# Distinguished

A tool for generating comparison tables of species traits with photos, designed for use in iNaturalist comments and journal posts. Explain how you made your identification in words and pictures.

## Features

- Search and select taxa from iNaturalist
- Define traits for comparison
- Add descriptions and photos for each taxon/trait combination
- Crop images using bounding box selection
- Generate HTML suitable for pasting into:
  - **journal posts**: uses vanilla HTML and CSS to embed tables in iNat journal posts or anywhere else that supports HTML
  - **comments**: uses a 3rd-party image resizing service to get around the lack of CSS in iNaturalist comments

## Development

Feel free to fork and make this work the way you want it to.

### Prerequisites

- Node.js v20.19 or later (specified in `.nvmrc`)
- npm

### Setup

```bash
# Use correct Node version if you're using NVM
nvm use

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deployment

The app is configured with `@sveltejs/adapter-static` for static hosting on GitHub Pages or similar platforms.

```bash
npm run build
```

## Usage

1. **Add Taxa**: Search for species using the iNaturalist search
2. **Add Traits**: Define characteristics to compare
3. **Fill Cells**: For each taxon/trait combination:
   - Add a text description
   - Add an image URL
   - Optionally crop the image
   - Optionally add a link URL
4. **Choose Output Mode**: Select comment or journal format
5. **Copy HTML**: Use the generated HTML in iNaturalist

## Technologies

- SvelteKit 2.x with Svelte 5 runes
- TypeScript
- Native HTML elements (no UI framework)
- iNaturalist API
