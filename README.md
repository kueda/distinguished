# Distinguished

A web-based tool for generating HTML comparison tables of species traits with photos, designed for use in iNaturalist comments and journal posts.

## Features

- Search and select taxa from iNaturalist
- Define custom traits for comparison
- Add descriptions and photos for each taxon/trait combination
- Crop images using bounding box selection
- Generate HTML in two formats:
  - **Comment mode**: Uses weserv.nl proxy for server-side image cropping
  - **Journal mode**: Uses CSS-based cropping with inline styles
- Copy generated HTML to clipboard
- Live preview of comparison table

## Development

### Prerequisites

- Node.js v20.19 or later (specified in `.nvmrc`)
- npm

### Setup

```bash
# Use correct Node version
nvm use

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Project Structure

```
src/
  routes/
    +page.svelte              # Main application
  lib/
    components/
      ImageCropper.svelte     # Image cropping modal
    inat-api.ts              # iNaturalist API integration
    html-generator.ts        # HTML output generators
```

## Deployment

The app is configured with `@sveltejs/adapter-static` for static hosting on GitHub Pages or similar platforms.

```bash
npm run build
# Deploy the build/ directory
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
