export interface ParsedLink {
  /** URL with any glued-on text removed */
  url: string;
  /** Password / decryption key written right after the URL, if any */
  password: string | null;
  /** Text that was glued onto the URL (label, password, prose); keep it visible in the post */
  trailing: string;
}

// Posts often glue credentials straight onto links: "https://mega.nz/#P!abc...Password:xyz".
// Longer alternatives first so "password" wins over "pass".
const CREDENTIAL_LABEL = /(password|passwd|passcode|pass|pwd|pw|key|пароль|パスワード|暗証番号|密码|密碼|비밀번호|비번)\s*([:：=])/gi;
// "=" is only trusted after an unambiguous label; "key=" / "pw=" are usually real query params
const LONG_LABEL = /^(password|passwd|passcode|пароль|パスワード|暗証番号|密码|密碼|비밀번호)$/i;
// A label right after one of these is part of the URL itself (?password=, &key=, /pass:...)
const URL_DELIMITERS = "?&#=/;";
// Links on these sites point to file hosts whose URLs are ASCII, so CJK text or full-width
// punctuation glued after a link ends it ("…/d/AbC12、パスは…")
const CJK_TEXT = /[　-〿぀-ヿ㐀-鿿가-힯＀-￯]/;
const TRAILING_PUNCTUATION = /[.,;:!?'"»]$/;

const MEGA_URL = /^https?:\/\/(?:www\.)?mega(?:\.co)?\.nz\//i;
// Base64url key lengths: file keys are 43 chars, folder keys 22
const MEGA_MODERN_KEY = /^(https?:\/\/[^/]+\/(file|folder|embed)\/[A-Za-z0-9_-]{8}#)([A-Za-z0-9_-]+)/i;
const MEGA_LEGACY_KEY = /^(https?:\/\/[^/]+\/#(F?)![A-Za-z0-9_-]{8}!)([A-Za-z0-9_-]+)/i;

function trimMegaKey(url: string): string {
  if (!MEGA_URL.test(url)) return url;
  const modern = url.match(MEGA_MODERN_KEY);
  if (modern) {
    const keyLength = modern[2].toLowerCase() === "folder" ? 22 : 43;
    return modern[3].length > keyLength ? modern[1] + modern[3].slice(0, keyLength) : url;
  }
  const legacy = url.match(MEGA_LEGACY_KEY);
  if (legacy) {
    const keyLength = legacy[2] ? 22 : 43;
    return legacy[3].length > keyLength ? legacy[1] + legacy[3].slice(0, keyLength) : url;
  }
  return url;
}

function trimTrailingPunctuation(url: string): string {
  let result = url;
  while (result.length > 0) {
    const last = result[result.length - 1];
    if (TRAILING_PUNCTUATION.test(last)) {
      result = result.slice(0, -1);
    } else if (last === ")" && result.split("(").length < result.split(")").length) {
      // Unbalanced ")" belongs to the surrounding prose, "wiki/Foo_(bar)" keeps its own
      result = result.slice(0, -1);
    } else {
      break;
    }
  }
  return result;
}

/**
 * Splits a raw URL match into the real link and whatever text was glued onto it,
 * extracting a password when the glued text is a credential label.
 */
export function parseGluedUrl(raw: string): ParsedLink {
  const hostStart = raw.indexOf("//") + 2;
  const pathStart = raw.indexOf("/", hostStart);
  let urlEnd = raw.length;
  let password: string | null = null;

  const cjkIndex = raw.slice(hostStart).search(CJK_TEXT);
  if (cjkIndex !== -1) urlEnd = hostStart + cjkIndex;

  if (pathStart !== -1) {
    CREDENTIAL_LABEL.lastIndex = pathStart;
    let match: RegExpExecArray | null;
    while ((match = CREDENTIAL_LABEL.exec(raw)) !== null) {
      if (match.index > urlEnd) break;
      if (URL_DELIMITERS.includes(raw[match.index - 1])) continue;
      if (match[2] === "=" && !LONG_LABEL.test(match[1])) continue;

      urlEnd = match.index;
      const afterLabel = raw.slice(match.index + match[0].length);
      const passwordEnd = afterLabel.search(CJK_TEXT);
      password = (passwordEnd === -1 ? afterLabel : afterLabel.slice(0, passwordEnd)) || null;
      break;
    }
  }

  const url = trimMegaKey(trimTrailingPunctuation(raw.slice(0, urlEnd)));
  return { url, password, trailing: raw.slice(url.length) };
}
