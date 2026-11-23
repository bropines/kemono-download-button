// Set by vite (vite.config.ts) from package.json; GM_info is the fallback for other builds
declare const __KDL_VERSION__: string | undefined;
declare const GM_info: { script?: { version?: string } } | undefined;

export function scriptVersion(): string {
  if (typeof __KDL_VERSION__ === 'string' && __KDL_VERSION__) return __KDL_VERSION__;
  try {
    return (typeof GM_info !== 'undefined' && GM_info?.script?.version) || '';
  } catch {
    return '';
  }
}
