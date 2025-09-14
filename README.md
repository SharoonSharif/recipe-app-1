# Personal Recipe Collection App

A secure personal recipe collection web application built for Gideon's mini project requirements.

## Tech Stack

- **TanStack Router** - Client-side routing
- **Bun** - JavaScript runtime
- **Railway** - Hosting platform
- **Descope** - Authentication
- **ShadCN/UI** - Modern UI components
- **Convex** - Real-time database
- **TailwindCSS** - Styling

## Features

- Secure user authentication
- Create, edit, and delete recipes
- Organize recipes by category
- Clean, modern interface
- Real-time data persistence

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## Deployment

The included GitHub Actions workflow runs `bun run build` (triggering `bunx convex codegen`) and deploys the generated `dist/` folder to GitHub Pages.
