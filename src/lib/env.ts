// Safe environment loader for Vercel/Next.js

export function getEnv(name: string, fallback?: string): string {
  if (typeof process === "undefined" || !process.env) {
    // Not in Node.js, fallback for build
    return fallback ?? "";
  }
  const value = process.env[name];
  if (typeof value === "undefined" || value === "") {
    // Return fallback during build, throw only at runtime
    if (typeof window === "undefined") {
      // Node.js runtime
      if (fallback !== undefined) return fallback;
      throw new Error(`Missing required env var: ${name}`);
    }
    // Client/browser: fallback
    return fallback ?? "";
  }
  return value;
}
