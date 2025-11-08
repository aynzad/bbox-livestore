# Synced Bbox Livestore!

## Stack

- [React](https://react.dev/)
- [TanStack Router](https://tanstack.com/router)
- [Livestore](https://docs.livestore.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Konva-js](https://konvajs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn](https://ui.shadcn.com/)

## Getting Started

### Environment Setup

Before running the application, you need to set up environment variables:

1. **Copy the example environment file:**

   ```bash
   cp .env.example .env
   ```

2. **Fill in your environment variables in `.env`:**
   - `VITE_LIVESTORE_SYNC_URL`: Your Cloudflare Workers backend URL
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (public, safe to expose)

3. **Set Cloudflare Workers secrets** (for the backend):

   ```bash
   # For development
   wrangler secret put JWT_SECRET --env dev
   wrangler secret put GOOGLE_CLIENT_ID --env dev
   wrangler secret put GOOGLE_CLIENT_SECRET --env dev

   # For production
   wrangler secret put JWT_SECRET --env prod
   wrangler secret put GOOGLE_CLIENT_ID --env prod
   wrangler secret put GOOGLE_CLIENT_SECRET --env prod
   ```

   **Important:** Never commit secrets to version control. Always use Cloudflare Workers secrets for sensitive values.

### Running the Application

To run this application:

```bash
pnpm install
pnpm start
```

## Building For Production

To build this application for production:

```bash
pnpm build
```
