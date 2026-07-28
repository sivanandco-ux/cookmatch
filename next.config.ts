import type { NextConfig } from "next";

// The marketplace routes (browsing/hiring cooks, posting jobs, cook signup)
// were previously redirected to /plan since Sivan Cooks' active product is
// the planning tool. Reactivated (no redirects) so the marketplace can be
// shown as a portfolio piece — it isn't linked from the live nav/home page,
// so it's only reachable if you already have the URL. Seeded with generic
// placeholder data only, not real signups.
const nextConfig: NextConfig = {};

export default nextConfig;
