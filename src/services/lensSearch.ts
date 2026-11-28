import { encodeForUpload } from '../vendor/lens/image';
import { ImageSearch } from '../vendor/lens/lens/search';
import type { SearchOptions } from '../vendor/lens/lens/search';
import { lensSettings, picture } from './lensImages';

// Google Lens search by image and AI Mode. The picture's bytes are uploaded from here (anonymously, the
// way image translation asks Lens), so Google never has to fetch the file from the archive's servers, which
// refuse hotlinks and redirect. What comes back is the address of Google's results page, for the browser.

// One upload per picture: "find the source" and then "ask AI" on the same picture reuse the session. The
// engine reopens a session past its 30 minutes by itself. A few, because each keeps its JPEG for that.
const MAX_SESSIONS = 4;
const sessions = new Map<string, Promise<ImageSearch>>();

function session(url: string): Promise<ImageSearch> {
  const known = sessions.get(url);
  if (known) {
    sessions.delete(url);
    sessions.set(url, known);
    return known;
  }
  const settings = lensSettings();
  const opening = picture(url)
    .then((pixels) => encodeForUpload(pixels.source, settings))
    .then(({ imageBytes, width, height }) => ImageSearch.upload({ imageBytes, width, height }, settings));
  // A failed upload is not remembered: the next click tries again
  opening.catch(() => {
    if (sessions.get(url) === opening) sessions.delete(url);
  });
  sessions.set(url, opening);
  while (sessions.size > MAX_SESSIONS) {
    const oldest = sessions.keys().next();
    if (oldest.done) break;
    sessions.delete(oldest.value);
  }
  return opening;
}

/** The address of Google's results page for the whole picture at `url`. */
export async function lensSearchUrl(url: string, options: SearchOptions): Promise<string> {
  const search = await session(url);
  return search.search({ kind: 'image' }, options);
}
