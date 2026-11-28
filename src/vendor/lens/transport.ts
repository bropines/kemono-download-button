import { postBinary } from './gm';
import type { BinaryResponse } from './gm';
import type { Bytes } from './types';

/**
 * Stands in for upstream 2.14's `transport.ts`.
 *
 * Upstream's engine no longer imports `gm.ts`: a front end installs a
 * transport and the engine asks for it. `lens/search.ts` is written against
 * that, while this copy's `gm.ts` and `lens/client.ts` are still 2.10, where
 * the request ladder is called directly. So the transport here is simply that
 * ladder: a search goes out exactly as a translation does, on the same hosts,
 * anonymous, with the same encoding retries.
 */
export interface BinaryRequest {
  url: string;
  headers: Record<string, string>;
  body: Bytes;
  timeoutMs: number;
}

export interface Transport {
  post(request: BinaryRequest): Promise<BinaryResponse>;
}

const transport: Transport = { post: postBinary };

export function getTransport(): Transport {
  return transport;
}
