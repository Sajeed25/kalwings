const isProd = process.env.NODE_ENV === "production";

// Content Security Policy. 'unsafe-inline' is needed for Next's inline bootstrap scripts and our pre-paint theme
// script; everything else is locked to this origin. Dev needs 'unsafe-eval' for React refresh.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Friendly top-level routes from the product map. They forward to the role dashboards (sign-in is enforced there).
  redirects: async () => [
    ["/recruiter/dashboard", "/dashboard"], ["/recruiter/jobs", "/dashboard/roles"], ["/recruiter/candidates", "/dashboard/talent"],
    ["/recruiter/applications", "/dashboard/pipeline"], ["/recruiter/challenges", "/dashboard/challenges"], ["/recruiter/interviews", "/dashboard/interviews"], ["/recruiter/analytics", "/dashboard/analytics"],
    ["/college/dashboard", "/dashboard"], ["/college/students", "/dashboard/college"], ["/college/drives", "/dashboard/drives"], ["/college/reports", "/dashboard/college"],
    ["/admin/dashboard", "/dashboard"], ["/admin/users", "/dashboard/users"], ["/admin/companies", "/dashboard"], ["/admin/opportunities", "/dashboard/moderation"], ["/admin/moderation", "/dashboard/reports"], ["/admin/settings", "/dashboard/audit"],
    ["/assessments", "/dashboard/assessments"], ["/profile", "/dashboard/profile"], ["/portfolio", "/dashboard/portfolio"], ["/applications", "/dashboard/applications"], ["/messages", "/dashboard/applications"],
    ["/notifications", "/dashboard/notifications"], ["/settings", "/dashboard/account"], ["/register", "/join"], ["/forgot-password", "/login"], ["/verify", "/login"],
    ["/jobs", "/opportunities?type=JOB"], ["/internships", "/opportunities?type=INTERNSHIP"],
  ].map(([source, destination]) => ({ source, destination, permanent: false })),
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        ...(isProd ? [{ key: "Content-Security-Policy", value: csp }, { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
    // The service worker must always be fetched fresh so updates roll out.
    { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
  ],
};
export default nextConfig;
