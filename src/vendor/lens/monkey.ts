// Stand-in for vite-plugin-monkey's '$' module, which upstream's gm.ts imports from.
// That plugin compiles each import into `typeof X != 'undefined' ? X : void 0`, so a
// host missing a function leaves it undefined and gm.ts can feature-detect it. A bare
// reference to a missing global would instead throw the moment the bundle loads.

declare const GM: any;
declare const GM_info: any;
declare const unsafeWindow: Window & typeof globalThis;

const gm = typeof GM !== 'undefined' ? GM : undefined;
const gmInfo = typeof GM_info !== 'undefined' ? GM_info : undefined;
const getValue = typeof GM_getValue !== 'undefined' ? GM_getValue : undefined;
const setValue = typeof GM_setValue !== 'undefined' ? GM_setValue : undefined;
const registerMenuCommand = typeof GM_registerMenuCommand !== 'undefined' ? GM_registerMenuCommand : undefined;
const xmlhttpRequest = typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest : undefined;
const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

export {
  gm as GM,
  gmInfo as GM_info,
  getValue as GM_getValue,
  setValue as GM_setValue,
  registerMenuCommand as GM_registerMenuCommand,
  xmlhttpRequest as GM_xmlhttpRequest,
  pageWindow as unsafeWindow
};
