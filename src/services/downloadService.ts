import { getCachedFile, setCachedFile } from './cacheService';
import { saveBlob } from '../utils/saveFile';
import { ZipBuilder } from './zipBuilder';
import { progressManager, ProgressTask } from '../ui/progressManager';
import { showMessage } from '../ui/toast';
import { updateQueueIndicator } from '../ui/components/fixedControls';
import { appState, getSettings, state } from '../state/store';
import { FileItem, PostDetails } from '../types';
import { generateRandomId, getApiUrl, sanitizeFilename, isFileExtensionIgnored } from '../utils/helpers';
import { abortError, downloadFileWithFallback, gmXmlhttpRequestWithRetries, isAbortError } from '../utils/http';
import { collectFilesForPost, formatNameFromTemplate } from './collectorService';
import { addTaskToQueue } from './queueService';
import { t } from '../i18n';

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

/**
 * Downloads URL files straight into the ZIP; failures become failed_*.txt notes.
 * Returns the failure count and, per input file, the name the ZIP actually stored it under.
 */
async function addUrlFilesToZip(
  zip: ZipBuilder,
  urlFiles: FileItem[],
  task: ProgressTask,
  taskPrefix: string,
  useCache: boolean,
  statusPrefix = ''
): Promise<{ failed: number; storedNames: string[] }> {
  let done = 0;
  let failed = 0;
  const storedNames: string[] = [];

  await runWithConcurrency(urlFiles, state.settings.maxConcurrentFileDownloadsInZip || 3, async (file, index) => {
    const fileTaskId = `${taskPrefix}-${index}`;
    task.addFile(fileTaskId, file.name);
    try {
      const data = await fetchFileBytes(file.data, (percent) => task.updateFileProgress(fileTaskId, percent), useCache, task.signal);
      storedNames[index] = zip.addFile(file.name || `file_${index + 1}.bin`, data);
      task.markFileComplete(fileTaskId, true);
    } catch (error: any) {
      task.markFileComplete(fileTaskId, false);
      if (isAbortError(error)) return;
      failed++;
      console.error(`[Kemono DL] Download failed for "${file.data}":`, error);
      const baseName = sanitizeFilename(file.name.split('/').pop() || 'file');
      storedNames[index] = zip.addFile(`failed_${baseName}.txt`, `Failed to download file.\nURL: ${file.data}\nError: ${error?.message || error}`);
    } finally {
      done++;
      if (!task.signal.aborted) task.updateStatus(t('dl.task.downloadingDone', { prefix: statusPrefix, done, total: urlFiles.length }));
    }
  }, task.signal);

  // Never hand a half-downloaded archive to the caller
  if (task.signal.aborted) throw abortError();
  return { failed, storedNames };
}

export async function executeZipDownload(postDetails: PostDetails): Promise<void> {
  const task = progressManager.createTask(`zip-${postDetails.postID}`, t('dl.task.zipTitle', { title: postDetails.postTitle }));
  task.updateStatus(t('dl.task.fetchingMeta'));
  try {
    const isPostPage = window.location.pathname.includes('/post/');
    const { files: rawFiles } = isPostPage && appState.cachedPostFiles
      ? { files: appState.cachedPostFiles }
      : await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });

    const files = filterIgnoredFiles(rawFiles);
    if (files.length === 0) throw new Error(t('dl.task.noZipContent'));

    const zip = new ZipBuilder(Number(state.settings.zipCompressionLevel) || 0);
    files.filter((f) => f.source === 'text').forEach((file) => zip.addFile(file.name, textContentOf(file.data)));

    const urlFiles = files.filter((f) => f.source === 'url');
    task.updateStatus(t('dl.task.downloadingFiles', { count: urlFiles.length }));
    const { failed: failCount } = await addUrlFilesToZip(zip, urlFiles, task, postDetails.postID, true);
    if (urlFiles.length > 0 && failCount === urlFiles.length) {
      throw new Error(t('dl.task.allFailed'));
    }

    task.updateStatus(t('dl.task.zipping'));
    const blob = await zip.toBlob();
    if (blob.size === 0) throw new Error(t('dl.task.zipEmpty'));
    saveBlob(blob, sanitizeFilename(`${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_${generateRandomId(6)}.zip`));

    task.updateStatus(failCount > 0 ? t('dl.task.completeFails', { count: failCount }) : t('dl.task.complete'));
  } catch (error: any) {
    if (isAbortError(error)) {
      task.updateStatus(t('dl.task.cancelled'));
      return;
    }
    task.updateStatus(t('dl.task.error', { message: error.message }));
    console.error('ZIP process error:', error);
    throw error;
  } finally {
    task.finish();
  }
}

export async function executeIndividualDownload(type: 'Images' | 'Attachments', postDetails: PostDetails): Promise<void> {
  await getSettings();
  const task = progressManager.createTask(`indiv-${type}-${postDetails.postID}`, t(type === 'Images' ? 'dl.task.imagesTitle' : 'dl.task.attachmentsTitle', { title: postDetails.postTitle }));

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
      task.updateStatus(t(type === 'Images' ? 'dl.task.noImages' : 'dl.task.noAttachments'));
      task.finish(3000);
      return;
    }

    task.updateStatus(t('dl.task.starting', { count: targetFiles.length }));

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
        if (!task.signal.aborted) task.updateStatus(t('dl.task.downloadedOf', { done: completedCount, total: targetFiles.length }));
      }
    }, task.signal);

    task.updateStatus(task.signal.aborted ? t('dl.task.cancelled') : t('dl.task.allTriggered'));
  } catch (error: any) {
    task.updateStatus(t('dl.task.error', { message: error.message }));
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
  task.updateStatus(t('dl.task.queuedFiles', { count: downloadSpecs.length }));

  const maxConcurrency = concurrency ?? Math.max(1, state.settings.maxConcurrentIndividualDownloads || 3);
  let completedCount = 0;
  let failCount = 0;

  await runWithConcurrency(downloadSpecs, maxConcurrency, async (spec, i) => {
    const cleanName = sanitizeFilename(spec.fileName.split('/').pop() || spec.fileName);
    const fileTaskId = `pick-${i}`;
    task.addFile(fileTaskId, cleanName);

    try {
      const data = await fetchFileBytes(spec.url, (percent) => task.updateFileProgress(fileTaskId, percent), true, task.signal);
      saveBlob(new Blob([data]), cleanName);
      task.markFileComplete(fileTaskId, true);
    } catch (err: any) {
      task.markFileComplete(fileTaskId, false);
      if (isAbortError(err)) return;
      console.error(`[Kemono DL] Download error for ${cleanName}:`, err);
      failCount++;
    } finally {
      completedCount++;
      if (!task.signal.aborted) {
        task.updateStatus(failCount > 0
          ? t('dl.task.doneOfFailed', { done: completedCount, total: downloadSpecs.length, failed: failCount })
          : t('dl.task.doneOf', { done: completedCount, total: downloadSpecs.length }));
      }
    }
  }, task.signal);

  if (task.signal.aborted) {
    task.updateStatus(t('dl.task.cancelled'));
  } else {
    task.updateStatus(failCount === 0
      ? t('dl.task.allSaved', { count: downloadSpecs.length })
      : t('dl.task.doneSummary', { ok: completedCount - failCount, failed: failCount })
    );
  }
  task.finish(5000);
}

export async function downloadPostAsZip(details: PostDetails): Promise<void> {
  const postTask = progressManager.createTask(`zip-multi-${details.postID}`, t('dl.task.zipTitle', { title: details.postTitle }));
  try {
    const { files: rawFiles } = await collectFilesForPost(details, {
      isBulk: false,
      template: '{file_index}_{file_name}'
    });

    const files = filterIgnoredFiles(rawFiles);
    if (files.length === 0) throw new Error(t('dl.task.noZipContentShort'));

    const zip = new ZipBuilder(Number(state.settings.zipCompressionLevel) || 0);
    files.filter((f) => f.source === 'text').forEach((file) => zip.addFile(file.name, textContentOf(file.data)));

    const urlFiles = files.filter((f) => f.source === 'url');
    postTask.updateStatus(t('dl.task.downloadingFiles', { count: urlFiles.length }));
    const { failed: failedFileCount } = await addUrlFilesToZip(zip, urlFiles, postTask, `multi-${details.postID}`, false);

    postTask.updateStatus(t('dl.task.zipping'));
    const zipFileName = formatNameFromTemplate(state.settings.bulkMultipleSystemPathTemplate, {
      author_name: details.authorName,
      post_title: details.postTitle,
      post_id: details.postID,
      user_id: details.userID,
      service: details.service,
      post_date: details.postDate || 'UnknownDate'
    });

    saveBlob(await zip.toBlob(), zipFileName);
    postTask.updateStatus(failedFileCount > 0 ? t('dl.task.completeFails', { count: failedFileCount }) : t('dl.task.complete'));
  } catch (error: any) {
    if (isAbortError(error)) {
      postTask.updateStatus(t('dl.task.cancelled'));
      return;
    }
    console.error(`Failed to download post ${details.postID} as ZIP:`, error);
    postTask.updateStatus(t('dl.task.error', { message: error.message }));
    throw error;
  } finally {
    postTask.finish();
  }
}

/** Copies a descriptor so per-run fields (rawApiData, title/date from the API) never leak between runs. */
const clonePost = (post: PostDetails): PostDetails => ({ ...post, rawApiData: undefined });

const postPageUrl = (post: PostDetails): string => getApiUrl(`/${post.service}/user/${post.userID}/post/${post.postID}`);

/** Oldest-first order that does not assume numeric ids: digit ids compare as numbers, otherwise by date, then text. */
export function comparePostsAscending(a: PostDetails, b: PostDetails): number {
  const idA = String(a.postID);
  const idB = String(b.postID);
  if (/^\d+$/.test(idA) && /^\d+$/.test(idB)) {
    // Compared as digit strings, so ids beyond Number.MAX_SAFE_INTEGER still order correctly
    const trimmedA = idA.replace(/^0+(?=\d)/, '');
    const trimmedB = idB.replace(/^0+(?=\d)/, '');
    return trimmedA.length - trimmedB.length || (trimmedA < trimmedB ? -1 : trimmedA > trimmedB ? 1 : 0);
  }
  const dateA = a.postDate && a.postDate !== 'UnknownDate' ? a.postDate : '';
  const dateB = b.postDate && b.postDate !== 'UnknownDate' ? b.postDate : '';
  if (dateA && dateB && dateA !== dateB) return dateA < dateB ? -1 : 1;
  return idA.localeCompare(idB, undefined, { numeric: true });
}

export async function executeBulkDownloadSingle(posts: PostDetails[], authorName: string): Promise<void> {
  const task = progressManager.createTask('bulk-single', t('dl.task.bulkArchive', { count: posts.length }));
  // One counter per archive keeps global_file_index running across its posts without touching other runs
  const mediaCounter = { value: 0 };

  try {
    const zip = new ZipBuilder(Number(state.settings.zipCompressionLevel) || 0);
    const addHtmlIndex = state.settings.addHtmlIndexInZip;
    let htmlIndex = addHtmlIndex
      ? `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Archive: ${escapeHtml(authorName)}</title><style>body{font-family:sans-serif;background-color:#2b2b2b;color:#f0f0f0;padding:20px}.container{max-width:900px;margin:auto;background-color:#333;padding:20px 40px;border-radius:8px}h1{color:#00aeff}h2{color:#e0e0e0}a{color:#87ceeb}</style></head><body><div class="container"><h1>Archive Index</h1><h3>Author: ${escapeHtml(authorName)}</h3><p>Total posts: ${posts.length}</p><hr>`
      : '';

    for (let i = 0; i < posts.length; i++) {
      if (task.signal.aborted) throw abortError();
      const postDetails = clonePost(posts[i]);
      const postPrefix = `[${i + 1}/${posts.length}] `;
      task.updateStatus(t('dl.task.fetchingPost', { prefix: postPrefix, title: postDetails.postTitle }));

      const { files: rawFiles } = await collectFilesForPost(postDetails, {
        isBulk: true,
        bulk_post_index: i + 1,
        mediaCounter,
        template: state.settings.bulkSingleInternalPathTemplate
      });
      const files = filterIgnoredFiles(rawFiles);

      // The index links to what the ZIP really holds: deduplicated names (_2) and failed_*.txt notes
      const storedNames: string[] = [];
      files.filter((f) => f.source === 'text').forEach((file) => storedNames.push(zip.addFile(file.name, textContentOf(file.data))));
      const urlFiles = files.filter((f) => f.source === 'url');
      if (urlFiles.length > 0) {
        const result = await addUrlFilesToZip(zip, urlFiles, task, `bulk-${i}`, false, postPrefix);
        storedNames.push(...result.storedNames.filter(Boolean));
      }

      if (addHtmlIndex) {
        const entries = storedNames.length > 0
          ? storedNames.map((name) => {
              const relativePath = name.split('/').map((part) => encodeURIComponent(part)).join('/');
              return `<li><a href="./${relativePath}">${escapeHtml(name.split('/').pop() || name)}</a></li>`;
            }).join('')
          : '<li>No files found.</li>';
        htmlIndex += `<div class="post-entry"><h2><a href="${escapeHtml(postPageUrl(postDetails))}" target="_blank">[${escapeHtml(postDetails.postDate || 'N/A')}] ${escapeHtml(postDetails.postTitle)}</a></h2><ul>${entries}</ul></div>`;
      }
    }

    if (addHtmlIndex) {
      zip.addFile('_index.html', `${htmlIndex}</div></body></html>`);
    }

    task.updateStatus(t('dl.task.finalizing', { count: posts.length }));
    const finalZipName = formatNameFromTemplate(state.settings.bulkSingleSystemPathTemplate, {
      author_name: authorName,
      post_count: posts.length
    });

    saveBlob(await zip.toBlob(), finalZipName);
    task.updateStatus(t('dl.task.complete'));
  } catch (error: any) {
    if (isAbortError(error)) {
      task.updateStatus(t('dl.task.cancelled'));
      return;
    }
    console.error('Bulk download (single) failed:', error);
    task.updateStatus(t('dl.task.error', { message: error.message }));
  } finally {
    task.finish();
  }
}

export async function executeBulkDownloadMultiple(posts: PostDetails[]): Promise<void> {
  const task = progressManager.createTask('bulk-multiple', t('dl.task.bulkQueuing', { count: posts.length }));
  task.updateStatus(t('dl.task.addingToQueue'));

  for (let i = 0; i < posts.length; i++) {
    if (task.signal.aborted) break;
    const postDetails = clonePost(posts[i]);
    if (!postDetails.postDate || postDetails.postDate === 'UnknownDate') {
      const { postDate } = await collectFilesForPost(postDetails, { isBulk: true, noFiles: true });
      postDetails.postDate = postDate;
      postDetails.rawApiData = undefined;
    }

    addTaskToQueue('Bulk-Single-Zip', downloadPostAsZip, postDetails, null);
    task.updateStatus(t('dl.task.queuedPosts', { done: i + 1, total: posts.length }));
  }

  task.updateStatus(task.signal.aborted
    ? t('dl.task.queueCancelled')
    : t('dl.task.allQueued'));
  task.finish(3000);
}

/**
 * Downloads the given posts. Works from descriptors only (service/user/id/title/date), never from post cards
 * on the live page, so author-manager selections and selections made before an HTMX swap still download.
 */
export async function executeBulkDownload(posts: PostDetails[]): Promise<void> {
  const downloadBtn = document.getElementById('kdl-bulk-download-btn') as HTMLButtonElement | null;

  const seen = new Set<string>();
  const postsToProcess = posts.filter((post) => {
    const key = `${post.service}/${post.userID}/${post.postID}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (postsToProcess.length === 0) {
    showMessage(t('dl.bulk.noneSelected'), 'warning');
    return;
  }

  if (downloadBtn) downloadBtn.disabled = true;
  updateQueueIndicator();

  const sortOrder = (document.getElementById('kdl-bulk-sort-order') as HTMLSelectElement)?.value || 'selection';
  if (sortOrder === 'oldest') {
    postsToProcess.sort(comparePostsAscending);
  } else if (sortOrder === 'newest') {
    postsToProcess.sort((a, b) => comparePostsAscending(b, a));
  }

  const authorName = postsToProcess[0].authorName
    || document.querySelector('.user-header__name span[itemprop="name"]')?.textContent?.trim()
    || 'UnknownAuthor';
  const processedIds = new Set(postsToProcess.map((post) => String(post.postID)));
  await getSettings();

  try {
    if (state.settings.bulkDownloadMode === 'multiple') {
      await executeBulkDownloadMultiple(postsToProcess);
    } else {
      await executeBulkDownloadSingle(postsToProcess, authorName);
    }
  } catch (error) {
    console.error('Bulk download execution failed:', error);
    showMessage(t('dl.bulk.critical'), 'error');
  } finally {
    if (downloadBtn) downloadBtn.disabled = false;
    document.querySelectorAll('.kdl-post-checkbox:checked').forEach((cb: any) => {
      if (processedIds.has(cb.dataset.id)) cb.checked = false;
    });

    const bulkBtnOnPage = document.getElementById('kdl-bulk-download-btn') as HTMLButtonElement | null;
    if (bulkBtnOnPage) {
      appState.selectedPostIds.clear();
      bulkBtnOnPage.textContent = t('dl.bulk.downloadSelected', { count: 0 });
      bulkBtnOnPage.disabled = true;
    }
    updateQueueIndicator();
  }
}
