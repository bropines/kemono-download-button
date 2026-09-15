import { getCachedFile, setCachedFile } from './cacheService';
import { ZipBuilder } from './zipBuilder';
import { progressManager, ProgressTask } from '../ui/progressManager';
import { showMessage } from '../ui/toast';
import { updateQueueIndicator } from '../ui/components/fixedControls';
import { appState, getSettings, resetMediaCounter, state } from '../state/store';
import { FileItem, PostDetails } from '../types';
import { generateRandomId, sanitizeFilename, isFileExtensionIgnored } from '../utils/helpers';
import {
  abortError,
  downloadBlobWithGm,
  downloadFileWithFallback,
  gmXmlhttpRequestWithRetries,
  isAbortError,
  saveBlobViaAnchor
} from '../utils/http';
import { collectFilesForPost, getPostCardDetails, formatNameFromTemplate } from './collectorService';
import { addTaskToQueue } from './queueService';

const textContentOf = (data: unknown): string => (typeof data === 'string' ? data : JSON.stringify(data ?? ''));
const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

function filterIgnoredFiles(files: FileItem[]): FileItem[] {
  const ignoredExts = state.settings.ignoredFileExtensions || [];
  return files.filter((f) => !isFileExtensionIgnored(f.name, ignoredExts));
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
  signal?: AbortSignal
): Promise<void> {
  let next = 0;
  const lanes = Array.from({ length: Math.min(Math.max(1, limit || 1), items.length) }, async () => {
    // A cancelled task stops picking up items; the ones in flight are aborted through the same signal
    while (next < items.length && !signal?.aborted) {
      const index = next++;
      await worker(items[index], index);
    }
  });
  await Promise.all(lanes);
}

/** Fetches a file's bytes (optionally IndexedDB cache-first), reporting progress in percent. */
async function fetchFileBytes(
  url: string,
  onProgress: (percent: number) => void,
  useCache: boolean,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  if (useCache) {
    const cached = await getCachedFile(url);
    if (cached && cached.byteLength > 0) {
      onProgress(100);
      return cached;
    }
  }

  const response = await gmXmlhttpRequestWithRetries({
    method: 'GET',
    url,
    signal,
    responseType: 'arraybuffer',
    timeout: state.settings.zipFileDownloadTimeout || 120000,
    onprogress: (e: ProgressEvent) => {
      if (e.lengthComputable && e.total > 0) onProgress((e.loaded / e.total) * 100);
    }
  });

  const data: ArrayBuffer | null = response.response;
  if (!data || data.byteLength === 0) throw new Error('Downloaded file is empty');
  if (useCache) await setCachedFile(url, data);
  return data;
}

/** Downloads URL files straight into the ZIP; failures become failed_*.txt notes. Returns the failure count. */
async function addUrlFilesToZip(
  zip: ZipBuilder,
  urlFiles: FileItem[],
  task: ProgressTask,
  taskPrefix: string,
  useCache: boolean,
  statusPrefix = ''
): Promise<number> {
  let done = 0;
  let failed = 0;

  await runWithConcurrency(urlFiles, state.settings.maxConcurrentFileDownloadsInZip || 3, async (file, index) => {
    const fileTaskId = `${taskPrefix}-${index}`;
    task.addFile(fileTaskId, file.name);
    try {
      const data = await fetchFileBytes(file.data, (percent) => task.updateFileProgress(fileTaskId, percent), useCache, task.signal);
      zip.addFile(file.name || `file_${index + 1}.bin`, data);
      task.markFileComplete(fileTaskId, true);
    } catch (error: any) {
      task.markFileComplete(fileTaskId, false);
      if (isAbortError(error)) return;
      failed++;
      console.error(`[Kemono DL] Download failed for "${file.data}":`, error);
      const baseName = sanitizeFilename(file.name.split('/').pop() || 'file');
      zip.addFile(`failed_${baseName}.txt`, `Failed to download file.\nURL: ${file.data}\nError: ${error?.message || error}`);
    } finally {
      done++;
      if (!task.signal.aborted) task.updateStatus(`${statusPrefix}Downloading... ${done}/${urlFiles.length} done`);
    }
  }, task.signal);

  // Never hand a half-downloaded archive to the caller
  if (task.signal.aborted) throw abortError();
  return failed;
}

export async function executeZipDownload(postDetails: PostDetails): Promise<void> {
  const task = progressManager.createTask(`zip-${postDetails.postID}`, `ZIP: ${postDetails.postTitle}`);
  task.updateStatus('Fetching post metadata...');
  try {
    const isPostPage = window.location.pathname.includes('/post/');
    const { files: rawFiles } = isPostPage && appState.cachedPostFiles
      ? { files: appState.cachedPostFiles }
      : await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });

    const files = filterIgnoredFiles(rawFiles);
    if (files.length === 0) throw new Error('No content to ZIP (all files filtered or empty).');

    const zip = new ZipBuilder(Number(state.settings.zipCompressionLevel) || 0);
    files.filter((f) => f.source === 'text').forEach((file) => zip.addFile(file.name, textContentOf(file.data)));

    const urlFiles = files.filter((f) => f.source === 'url');
    task.updateStatus(`Downloading ${urlFiles.length} files...`);
    const failCount = await addUrlFilesToZip(zip, urlFiles, task, postDetails.postID, true);
    if (urlFiles.length > 0 && failCount === urlFiles.length) {
      throw new Error('All file downloads failed');
    }

    task.updateStatus('Zipping...');
    const blob = await zip.toBlob();
    if (blob.size === 0) throw new Error('Generated ZIP is empty.');
    saveBlobViaAnchor(blob, sanitizeFilename(`${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_${generateRandomId(6)}.zip`));

    task.updateStatus(`Complete! ${failCount > 0 ? `(${failCount} fails)` : ''}`);
  } catch (error: any) {
    if (isAbortError(error)) {
      task.updateStatus('Cancelled');
      return;
    }
    task.updateStatus(`Error: ${error.message}`);
    console.error('ZIP process error:', error);
    throw error;
  } finally {
    task.finish();
  }
}

export async function executeIndividualDownload(type: 'Images' | 'Attachments', postDetails: PostDetails): Promise<void> {
  await getSettings();
  const task = progressManager.createTask(`indiv-${type}-${postDetails.postID}`, `${type}: ${postDetails.postTitle}`);

  try {
    const isPostPage = window.location.pathname.includes('/post/');
    const { files } = isPostPage && appState.cachedPostFiles
      ? { files: appState.cachedPostFiles }
      : await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });

    let targetFiles: typeof files = [];

    if (type === 'Images') {
      targetFiles = files.filter((f) => f.source === 'url' && f.isMedia);
    } else if (type === 'Attachments') {
      targetFiles = files.filter((f) => f.source === 'url' && f.isAttachment);
      if (targetFiles.length === 0) {
        targetFiles = files.filter((f) => f.source === 'url');
      }
    }

    if (targetFiles.length === 0) {
      task.updateStatus(`No ${type.toLowerCase()} to download.`);
      task.finish(3000);
      return;
    }

    task.updateStatus(`Starting download of ${targetFiles.length} files...`);

    let completedCount = 0;
    await runWithConcurrency(targetFiles, state.settings.maxConcurrentIndividualDownloads || 3, async (file, i) => {
      const fileTaskId = `indiv-${i}`;
      task.addFile(fileTaskId, file.name);
      try {
        await downloadFileWithFallback(file.data, file.name, (pct) => task.updateFileProgress(fileTaskId, pct), task.signal);
        task.markFileComplete(fileTaskId, true);
      } catch (err: any) {
        task.markFileComplete(fileTaskId, false);
      } finally {
        completedCount++;
        if (!task.signal.aborted) task.updateStatus(`Downloaded ${completedCount}/${targetFiles.length}`);
      }
    }, task.signal);

    task.updateStatus(task.signal.aborted ? 'Cancelled' : 'All downloads triggered!');
  } catch (error: any) {
    task.updateStatus(`Error: ${error.message}`);
  } finally {
    task.finish();
  }
}

export interface DownloadFileSpec {
  url: string;
  fileName: string;
}

export async function downloadFilesToDiskWithProgress(
  downloadSpecs: DownloadFileSpec[],
  taskTitle: string,
  concurrency?: number
): Promise<void> {
  if (downloadSpecs.length === 0) return;
  await getSettings();

  const task = progressManager.createTask(`pick-${generateRandomId(8)}`, taskTitle);
  task.updateStatus(`Queued ${downloadSpecs.length} files...`);

  const maxConcurrency = concurrency ?? Math.max(1, state.settings.maxConcurrentIndividualDownloads || 3);
  let completedCount = 0;
  let failCount = 0;

  await runWithConcurrency(downloadSpecs, maxConcurrency, async (spec, i) => {
    const cleanName = sanitizeFilename(spec.fileName.split('/').pop() || spec.fileName);
    const fileTaskId = `pick-${i}`;
    task.addFile(fileTaskId, cleanName);

    try {
      const data = await fetchFileBytes(spec.url, (percent) => task.updateFileProgress(fileTaskId, percent), true, task.signal);
      saveBlobViaAnchor(new Blob([data]), cleanName);
      task.markFileComplete(fileTaskId, true);
    } catch (err: any) {
      task.markFileComplete(fileTaskId, false);
      if (isAbortError(err)) return;
      console.error(`[Kemono DL] Download error for ${cleanName}:`, err);
      failCount++;
    } finally {
      completedCount++;
      if (!task.signal.aborted) {
        task.updateStatus(`${completedCount}/${downloadSpecs.length} done${failCount > 0 ? `, ${failCount} failed` : ''}`);
      }
    }
  }, task.signal);

  if (task.signal.aborted) {
    task.updateStatus('Cancelled');
  } else {
    task.updateStatus(failCount === 0
      ? `✓ All ${downloadSpecs.length} files saved!`
      : `Done: ${completedCount - failCount} ok, ${failCount} failed`
    );
  }
  task.finish(5000);
}

export async function downloadPostAsZip(details: PostDetails): Promise<void> {
  const postTask = progressManager.createTask(`zip-multi-${details.postID}`, `ZIP: ${details.postTitle}`);
  try {
    const { files: rawFiles } = await collectFilesForPost(details, {
      isBulk: false,
      template: '{file_index}_{file_name}'
    });

    const files = filterIgnoredFiles(rawFiles);
    if (files.length === 0) throw new Error('No content to ZIP.');

    const zip = new ZipBuilder(Number(state.settings.zipCompressionLevel) || 0);
    files.filter((f) => f.source === 'text').forEach((file) => zip.addFile(file.name, textContentOf(file.data)));

    const urlFiles = files.filter((f) => f.source === 'url');
    postTask.updateStatus(`Downloading ${urlFiles.length} files...`);
    const failedFileCount = await addUrlFilesToZip(zip, urlFiles, postTask, `multi-${details.postID}`, false);

    postTask.updateStatus('Zipping...');
    const zipFileName = formatNameFromTemplate(state.settings.bulkMultipleSystemPathTemplate, {
      author_name: details.authorName,
      post_title: details.postTitle,
      post_id: details.postID,
      user_id: details.userID,
      service: details.service,
      post_date: details.postDate || 'UnknownDate'
    });

    downloadBlobWithGm(await zip.toBlob(), zipFileName);
    postTask.updateStatus(`Complete! ${failedFileCount > 0 ? `(${failedFileCount} fails)` : ''}`);
  } catch (error: any) {
    if (isAbortError(error)) {
      postTask.updateStatus('Cancelled');
      return;
    }
    console.error(`Failed to download post ${details.postID} as ZIP:`, error);
    postTask.updateStatus(`Error: ${error.message}`);
    throw error;
  } finally {
    postTask.finish();
  }
}

export async function executeBulkDownloadSingle(postIds: string[], authorName: string): Promise<void> {
  const task = progressManager.createTask(`bulk-single-${Date.now()}`, `Bulk Archive (${postIds.length} Posts)`);
  resetMediaCounter();

  try {
    const zip = new ZipBuilder(Number(state.settings.zipCompressionLevel) || 0);
    const addHtmlIndex = state.settings.addHtmlIndexInZip;
    let htmlIndex = addHtmlIndex
      ? `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Archive: ${escapeHtml(authorName)}</title><style>body{font-family:sans-serif;background-color:#2b2b2b;color:#f0f0f0;padding:20px}.container{max-width:900px;margin:auto;background-color:#333;padding:20px 40px;border-radius:8px}h1{color:#00aeff}h2{color:#e0e0e0}a{color:#87ceeb}</style></head><body><div class="container"><h1>Archive Index</h1><h3>Author: ${escapeHtml(authorName)}</h3><p>Total posts: ${postIds.length}</p><hr>`
      : '';

    for (let i = 0; i < postIds.length; i++) {
      if (task.signal.aborted) throw abortError();
      const postCard = document.querySelector(`article.post-card[data-id="${postIds[i]}"]`) as HTMLElement | null;
      if (!postCard) continue;

      const postDetails = getPostCardDetails(postCard, authorName);
      const postPrefix = `[${i + 1}/${postIds.length}] `;
      task.updateStatus(`${postPrefix}Fetching: ${postDetails.postTitle}`);

      const { files: rawFiles } = await collectFilesForPost(postDetails, {
        isBulk: true,
        bulk_post_index: i + 1,
        template: state.settings.bulkSingleInternalPathTemplate
      });
      const files = filterIgnoredFiles(rawFiles);

      if (addHtmlIndex) {
        const postLink = (postCard.querySelector('a') as HTMLAnchorElement | null)?.href || '#';
        const entries = files.length > 0
          ? files.map((file) => {
              const relativePath = file.name.split('/').map((part) => encodeURIComponent(part)).join('/');
              return `<li><a href="./${relativePath}">${escapeHtml(file.name.split('/').pop() || file.name)}</a></li>`;
            }).join('')
          : '<li>No files found.</li>';
        htmlIndex += `<div class="post-entry"><h2><a href="${escapeHtml(postLink)}" target="_blank">[${escapeHtml(postDetails.postDate || 'N/A')}] ${escapeHtml(postDetails.postTitle)}</a></h2><ul>${entries}</ul></div>`;
      }

      if (files.length === 0) continue;
      files.filter((f) => f.source === 'text').forEach((file) => zip.addFile(file.name, textContentOf(file.data)));

      const urlFiles = files.filter((f) => f.source === 'url');
      if (urlFiles.length > 0) {
        await addUrlFilesToZip(zip, urlFiles, task, `bulk-${i}`, false, postPrefix);
      }
    }

    if (addHtmlIndex) {
      zip.addFile('_index.html', `${htmlIndex}</div></body></html>`);
    }

    task.updateStatus(`Finalizing ZIP for ${postIds.length} posts...`);
    const finalZipName = formatNameFromTemplate(state.settings.bulkSingleSystemPathTemplate, {
      author_name: authorName,
      post_count: postIds.length
    });

    downloadBlobWithGm(await zip.toBlob(), finalZipName);
    task.updateStatus('Complete!');
  } catch (error: any) {
    if (isAbortError(error)) {
      task.updateStatus('Cancelled');
      return;
    }
    console.error('Bulk download (single) failed:', error);
    task.updateStatus(`Error: ${error.message}`);
  } finally {
    task.finish();
  }
}

export async function executeBulkDownloadMultiple(postIds: string[], authorName: string): Promise<void> {
  const task = progressManager.createTask(`bulk-multiple-${Date.now()}`, `Bulk Queuing (${postIds.length} Posts)`);
  task.updateStatus('Adding posts to the download queue...');

  for (let i = 0; i < postIds.length; i++) {
    if (task.signal.aborted) break;
    const postId = postIds[i];
    const postCard = document.querySelector(`article.post-card[data-id="${postId}"]`) as HTMLElement | null;
    if (!postCard) continue;

    const postDetails = getPostCardDetails(postCard, authorName);
    const { postDate } = await collectFilesForPost(postDetails, { isBulk: true, noFiles: true });
    postDetails.postDate = postDate;

    addTaskToQueue('Bulk-Single-Zip', downloadPostAsZip, postDetails, null);
    task.updateStatus(`Queued ${i + 1}/${postIds.length} posts...`);
  }

  task.updateStatus(task.signal.aborted
    ? 'Cancelled: the remaining posts were not queued.'
    : 'All posts queued! Downloads will start based on concurrency settings.');
  task.finish(3000);
}

export async function executeBulkDownload(postIdsOrEvent: Set<string> | any = null): Promise<void> {
  const downloadBtn = document.getElementById('kdl-bulk-download-btn') as HTMLButtonElement | null;
  let postIdsToProcess: Set<string>;

  if (postIdsOrEvent instanceof Set && postIdsOrEvent.size > 0) {
    postIdsToProcess = postIdsOrEvent;
  } else {
    postIdsToProcess = appState.selectedPostIds;
  }

  if (postIdsToProcess.size === 0) {
    showMessage('No posts selected.', 'warning');
    return;
  }

  if (downloadBtn) downloadBtn.disabled = true;
  updateQueueIndicator();

  const sortOrder = (document.getElementById('kdl-bulk-sort-order') as HTMLSelectElement)?.value || 'selection';
  let postIdsArray = Array.from(postIdsToProcess);

  if (sortOrder === 'oldest') {
    postIdsArray.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  } else if (sortOrder === 'newest') {
    postIdsArray.sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }

  const authorName = document.querySelector('.user-header__name span[itemprop="name"]')?.textContent?.trim() || 'UnknownAuthor';
  await getSettings();

  try {
    if (state.settings.bulkDownloadMode === 'multiple') {
      await executeBulkDownloadMultiple(postIdsArray, authorName);
    } else {
      await executeBulkDownloadSingle(postIdsArray, authorName);
    }
  } catch (error) {
    console.error('Bulk download execution failed:', error);
    showMessage('A critical error occurred during bulk download.', 'error');
  } finally {
    if (downloadBtn) downloadBtn.disabled = false;
    document.querySelectorAll('.kdl-post-checkbox:checked').forEach((cb: any) => {
      if (postIdsToProcess.has(cb.dataset.id)) cb.checked = false;
    });

    const bulkBtnOnPage = document.getElementById('kdl-bulk-download-btn') as HTMLButtonElement | null;
    if (bulkBtnOnPage) {
      appState.selectedPostIds.clear();
      bulkBtnOnPage.textContent = `Download Selected (0)`;
      bulkBtnOnPage.disabled = true;
    }
    updateQueueIndicator();
  }
}
