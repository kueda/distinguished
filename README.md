# Distinguished

A tool for generating comparison tables of species traits with photos, designed for use in [iNaturalist](https://www.inaturalist.org) comments and journal posts. Explain how you made your identification in words and pictures.

## Features

- Search and select taxa from iNaturalist
- Define traits for comparison
- Add descriptions for each taxon/trait combination
- Add photos for each taxon/trait combination from iNaturalist observations or any other image on the web
- Crop images to focus in on the relevant parts
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

The app is configured with `@sveltejs/adapter-static` for static hosting on GitHub Pages or similar platforms. If you've forked it on GitHub and have pushed a change to the main branch, it should already be available at `https://github.com/{your_username}/distinguished`.

## Note

I built this in a few hours with [Claude Code](https://claude.com/product/claude-code) and as such, it's not beautiful inside or out, but it gets the job done.
