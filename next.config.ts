import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The marketplace (browsing/hiring cooks, posting jobs, cook signup) is
  // no longer the active product — Sivan Cooks is now a planning tool. The
  // underlying routes, DB tables, and code are untouched and still work,
  // just not meant to be publicly discoverable anymore. Redirecting the
  // public entry points here (rather than deleting the pages) keeps this
  // fully reversible. Deep-link-only routes reached via emailed tokens —
  // /dashboard/[cook_id], /availability/[cook_id], /cook-messages/[cook_token],
  // /messages/[conversation_id], /bookings/[id]/confirm — are left alone
  // since they were never publicly discoverable in the first place.
  async redirects() {
    return [
      { source: '/cooks', destination: '/plan', permanent: false },
      { source: '/cooks/:path*', destination: '/plan', permanent: false },
      { source: '/jobs', destination: '/plan', permanent: false },
      { source: '/jobs/:path*', destination: '/plan', permanent: false },
      { source: '/apply', destination: '/plan', permanent: false },
      { source: '/my-bookings', destination: '/plan', permanent: false },
      { source: '/login', destination: '/plan', permanent: false },
      { source: '/client-login', destination: '/plan', permanent: false },
    ];
  },
};

export default nextConfig;
