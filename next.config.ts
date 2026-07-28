import type { NextConfig } from "next";

// The marketplace routes (browsing/hiring cooks, posting jobs, cook signup)
// were previously redirected to /plan since Sivan Cooks' active product is
// the planning tool. Reactivated (no redirects) so the marketplace can be
// shown as a portfolio piece — it isn't linked from the live nav/home page,
// so it's only reachable if you already have the URL. Seeded with generic
// placeholder data only, not real signups.
const nextConfig: NextConfig = {
  // Serves the standalone Sivan Spices vision doc (public/vision.html) at a
  // clean URL, bypassing the app's own layout/nav/chat widget entirely — it's
  // a different brand context (Sivan Spices, not Sivan Cooks) sharing this
  // deployment purely for hosting/OG-preview convenience.
  async rewrites() {
    return [{ source: '/vision', destination: '/vision.html' }];
  },
};

export default nextConfig;
