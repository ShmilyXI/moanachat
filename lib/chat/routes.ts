const PRODUCT_CHAT_PATHS = new Set(["/chat/agent", "/chat/classic"]);
const PUBLIC_AUTH_PATHS = new Set(["/login", "/register", "/sign-up"]);

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.has(pathname);
}

export function isChatSurfacePath(pathname: string): boolean {
  return (
    pathname === "/" ||
    (/^\/chat\/[^/]+$/.test(pathname) && !PRODUCT_CHAT_PATHS.has(pathname))
  );
}

export function extractChatId(pathname: string): string | null {
  const match = pathname.match(/^\/chat\/([^/]+)$/);
  return match && !PRODUCT_CHAT_PATHS.has(pathname) ? match[1] : null;
}

export function isPublicAssetPath(pathname: string): boolean {
  return (
    pathname === "/images" ||
    pathname.startsWith("/images/") ||
    /\.(?:gif|ico|jpe?g|png|svg|webp|woff2?)$/i.test(pathname)
  );
}
