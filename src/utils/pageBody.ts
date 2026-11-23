// A response or cached "file" that is in fact a web page: a redirect page a host handed back unfollowed (nginx's
// "302 Found", 138 bytes: AdGuard's request engine did that) or an error page. Never to be saved or cached as a file.

// A UTF-8 byte order mark may come first (as bytes here; as text it is whitespace to \s)
const PAGE_START = /^(?:\xef\xbb\xbf)?\s*<(?:!doctype\s+html|html|head|body|center|h1)\b/i;

/** The first bytes are an HTML document's */
export function bytesLookLikePage(data: ArrayBuffer | ArrayBufferView | null | undefined): boolean {
  if (!data) return false;
  const view = ArrayBuffer.isView(data)
    ? new Uint8Array(data.buffer, data.byteOffset, Math.min(64, data.byteLength))
    : new Uint8Array(data as ArrayBuffer, 0, Math.min(64, (data as ArrayBuffer).byteLength));
  return PAGE_START.test(String.fromCharCode(...view));
}

/** Text that starts like an HTML document */
export function textLooksLikePage(text: string): boolean {
  return PAGE_START.test(text.slice(0, 64));
}
