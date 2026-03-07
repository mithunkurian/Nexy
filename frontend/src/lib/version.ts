// Bump APP_VERSION manually when releasing a significant update
export const APP_VERSION = "1.0";

// Injected automatically at build time by next.config.ts
export const BUILD_DATE: string =
  process.env.NEXT_PUBLIC_BUILD_DATE ?? "–";

// Full badge label e.g. "Nexy v1.0 · 07 Mar 26"
export const VERSION_LABEL = `Nexy v${APP_VERSION} · ${BUILD_DATE}`;
