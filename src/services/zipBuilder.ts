import { Zip, ZipDeflate, ZipPassThrough, strToU8 } from 'fflate';

// Output is folded into Blob parts in slices, so the finished archive never sits in memory twice
const BLOB_PART_BYTES = 32 * 1024 * 1024;

/**
 * Streams entries into a ZIP as they arrive: each file's bytes can be released right after it is added,
 * instead of holding every file plus the finished archive in memory at once (zipSync / JSZip).
 */
export class ZipBuilder {
  private readonly zip: Zip;
  private readonly finished: Promise<void>;
  private readonly names = new Set<string>();
  private parts: Blob[] = [];
  private pending: Uint8Array[] = [];
  private pendingBytes = 0;

  constructor(private readonly level = 0) {
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    this.finished = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.zip = new Zip((error, chunk, final) => {
      if (error) return reject(error);
      this.pending.push(chunk);
      this.pendingBytes += chunk.byteLength;
      if (this.pendingBytes >= BLOB_PART_BYTES) this.flush();
      if (final) resolve();
    });
  }

  /** Adds a file and returns the (deduplicated) name it was stored under. */
  addFile(name: string, data: Uint8Array | ArrayBuffer | string): string {
    const entryName = this.uniqueName(name.replace(/^\/+/, '').trim() || 'file');
    const bytes = typeof data === 'string' ? strToU8(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
    const entry = this.level > 0 ? new ZipDeflate(entryName, { level: this.level as any }) : new ZipPassThrough(entryName);
    this.zip.add(entry);
    entry.push(bytes, true);
    return entryName;
  }

  async toBlob(): Promise<Blob> {
    this.zip.end();
    await this.finished;
    this.flush();
    return new Blob(this.parts, { type: 'application/zip' });
  }

  private flush(): void {
    if (this.pending.length === 0) return;
    this.parts.push(new Blob(this.pending as BlobPart[]));
    this.pending = [];
    this.pendingBytes = 0;
  }

  private uniqueName(name: string): string {
    if (!this.names.has(name)) {
      this.names.add(name);
      return name;
    }
    const dot = name.lastIndexOf('.');
    const hasExtension = dot > name.lastIndexOf('/') + 1;
    const base = hasExtension ? name.slice(0, dot) : name;
    const extension = hasExtension ? name.slice(dot) : '';
    let counter = 2;
    while (this.names.has(`${base}_${counter}${extension}`)) counter++;
    const unique = `${base}_${counter}${extension}`;
    this.names.add(unique);
    return unique;
  }
}
