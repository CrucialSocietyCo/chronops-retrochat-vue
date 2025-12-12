# ChronOps RetroChat Vue

`chronops-retrochat-vue` is a lightweight Vue 3 frontend delivering a single-room, retro-style realtime chat experience. It is designed for immediacy, presence, and simplified system feedback. This project represents the "pure chat surface" of the ChronOps ecosystem and intentionally excludes complex admin dashboards or CMS features.

![Retro Chat Screenshot](docs/screenshot.png)

## Quickstart

### Using npm

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Using pnpm

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

## Environment Variables

| Variable | Description | Required |
|:---|:---|:---:|
| `VITE_SUPABASE_URL` | API URL for your Supabase project | Yes |
| `VITE_SUPABASE_ANON_KEY` | Anon public key for client connection | Yes |

*Note: All variables prefixed with `VITE_` are exposed to the client browser.*

### `.env.example`

```ini
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

## Available Scripts

- `npm run dev` - Start the Vite development server
- `npm run build` - Build the application for production
- `npm run preview` - Locally preview the production build

## Feature Overview

- **Realtime Messaging**: Instant message delivery and updates via Supabase Realtime.
- **Typing Indicators**: Visual cues showing when other users are composing.
- **Message Reactions**: Simple emoji reactions attached to messages.
- **Join/Leave Banners**: System messages tracking user presence.
- **Cooldowns**: Visual feedback when rate limits are active.
- **AI Persona Rewrite**: Support for displaying rewritten system messages with custom styling.

## UX & Design Notes

This interface adopts a deliberate "Retro" aesthetic, prioritizing high-contrast text, clear borders, and immediate feedback over modern whitespace and animation. The design constraints are intentional: a single room, a single stream of consciousness, and zero friction to join.

## Architecture

The application is a standard Vue 3 Single Page Application (SPA). It initializes a Supabase client connection on load, subscribes to the realtime channel for the chatroom, and updates the local reactive state as events (INSERT, UDPATE) are received. No server-side rendering is performed; all logic executes in the client browser.

## Package Manager Policy

This project supports **npm** OR **pnpm**.

- Do **not** commit both `package-lock.json` and `pnpm-lock.yaml`.
- Ensure you commit the lockfile consistent with your chosen manager.

## Project Structure

```
chronops-retrochat-vue/
├── src/
│   ├── components/      # ChatHistory, ChatInput, UserList
│   ├── assets/          # CSS/SCSS and static images
│   ├── router/          # Simple Vue Router config
│   ├── App.vue          # Main layout and composition
│   └── main.js          # App entry point
├── public/              # Public static assets
└── vite.config.js       # Vite configuration
```

## Roadmap

1.  **Strict Typing**: Improve TypeScript coverage across all components.
2.  **Performance**: Optimize large message list rendering (virtual scrolling).
3.  **Resilience**: Better reconnection logic for spotty networks.
4.  **Themes**: Toggle support for "Dark Mode" or alternative retro skins.
5.  **Accessibilty**: Improved ARIA labels and keyboard navigation.

## Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Push changes and open a Pull Request.

Please create an issue to discuss significant UX changes or feature additions before starting work.

## License

MIT (See `LICENSE` file)
