# IZ HAIR TREND — Futuristic 3D Landing (RU/EN)

A Vite + React + TypeScript project using Three.js, @react-three/fiber, @react-three/drei, postprocessing, Tailwind CSS, and Framer Motion.

## Run locally
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
```

## Deploy
### Vercel (recommended)
- Import the repo, or use Vercel CLI.
- Build command: `npm run build`
- Output dir: `dist`
- Add your domain `izhairtrend.shop` in Project → Settings → Domains

### Netlify / Cloudflare Pages
- Build: `npm run build`
- Publish: `dist`

## Logo
Export your provided logo as **SVG or PNG** and set the path in `src/App.tsx`:
```ts
const logoUrl: string | null = "/logo.svg";
```
Then place the file at `public/logo.svg`.
