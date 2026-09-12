/**
 * Static export, so the whole app can be served from GitHub Pages (and from
 * any other static host). There is no server: the browser talks to Supabase
 * directly, with Row Level Security as the authorization boundary.
 *
 * GITHUB_PAGES_BASE is set by scripts/build-gh-pages.mjs and is the URL this
 * branch publishes under -- "/opera-companion/" for the primary branch,
 * "/opera-companion/<branch-slug>/" for a preview. Outside that build it is
 * unset and everything resolves at the root, which is what `npm run dev`
 * wants.
 *
 * @type {import('next').NextConfig}
 */

// Next wants basePath without a trailing slash ("" or "/foo"), while
// GITHUB_PAGES_BASE always carries one.
const basePath = (process.env.GITHUB_PAGES_BASE || '/').replace(/\/$/, '');

const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  // Pages serves /foo/ as /foo/index.html; without this, routes 404.
  trailingSlash: true,
  images: {
    // No Next image optimizer without a server. Sources are remote
    // (assets.openopus.org) and Google avatars, served as-is.
    unoptimized: true,
  },
  env: {
    // next/link and next/image prepend basePath automatically; a plain
    // fetch() or window.location does not. Anything hand-building a URL
    // reads this instead of assuming the root.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

module.exports = nextConfig;
