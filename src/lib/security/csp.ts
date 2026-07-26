const normalizeDirective = (parts: readonly string[]) => parts.join(" ");

export function createApplicationCsp(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV === "development";

  const directives = [
    normalizeDirective(["default-src", "'self'"]),
    normalizeDirective([
      "script-src",
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
    ]),
    normalizeDirective(["style-src", "'self'", `'nonce-${nonce}'`]),
    normalizeDirective(["style-src-attr", "'unsafe-inline'"]),
    normalizeDirective([
      "img-src",
      "'self'",
      "data:",
      "blob:",
      "https://*.supabase.co",
      "https://k.kakaocdn.net",
      "https://lh3.googleusercontent.com",
    ]),
    normalizeDirective(["font-src", "'self'", "data:"]),
    normalizeDirective(["media-src", "'self'", "data:", "blob:"]),
    normalizeDirective([
      "connect-src",
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      ...(isDevelopment ? ["ws:", "http:"] : []),
    ]),
    normalizeDirective(["frame-src", "'self'"]),
    normalizeDirective(["worker-src", "'self'", "blob:"]),
    normalizeDirective(["manifest-src", "'self'"]),
    normalizeDirective(["object-src", "'none'"]),
    normalizeDirective(["base-uri", "'self'"]),
    normalizeDirective(["form-action", "'self'"]),
    normalizeDirective(["frame-ancestors", "'none'"]),
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}
