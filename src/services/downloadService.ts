import JSZip from 'jszip';
import { getCachedFile, setCachedFile } from './cacheService';
import { progressManager } from '../ui/progressManager';
import { showMessage } from '../ui/toast';
import { updateQueueIndicator } from '../ui/components/fixedControls';
import { appState, getSettings, resetMediaCounter, state } from '../state/store';
import { PostDetails } from '../types';
import { generateRandomId, sanitizeFilename } from '../utils/helpers';
import { gmXmlhttpRequestWithRetries } from '../utils/http';
import { collectFilesForPost, getPostCardDetails, formatNameFromTemplate } from './collectorService';
import { addTaskToQueue } from './queueService';

export async function executeZipDownload(postDetails: PostDetails): Promise<void> {
  const task = progressManager.createTask(`zip-${postDetails.postID}`, `ZIP: ${postDetails.postTitle}`);
  task.updateStatus('Fetching post metadata...');
  console.log(`[Kemono DL] Initiating ZIP task for post ${postDetails.postID}: "${postDetails.postTitle}"`);
  try {
    const isPostPage = window.location.pathname.includes('/post/');
    const { files } = isPostPage && appState.cachedPostFiles
      ? { files: appState.cachedPostFiles }
      : await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });

    if (files.length === 0) throw new Error('No content to ZIP.');

    let successCount = 0;
    let failCount = 0;
    const urlFiles = files.filter((t) => t.source === 'url');
    const totalUrlFiles = urlFiles.length;

    console.log(`[Kemono DL] Total files collected: ${files.length} (${totalUrlFiles} URLs, ${files.length - totalUrlFiles} text items)`);
    task.updateStatus(`Downloading ${totalUrlFiles} files...`);

    const ZipConstructor = typeof JSZip !== 'undefined' ? JSZip : (window as any).JSZip;
    if (!ZipConstructor) {
      throw new Error('JSZip library is not loaded. Please verify JSZip availability.');
    }
    const zip = new ZipConstructor();

    files.forEach((file) => {
      if (file.source === 'text') zip.file(file.name, file.data);
    });

    const concurrency = Math.max(1, state.settings.maxConcurrentFileDownloadsInZip || 3);
    let queueIndex = 0;

    async function downloadWorker() {
      while (queueIndex < totalUrlFiles) {
        const i = queueIndex++;
        const file = urlFiles[i];
        const fileTaskId = `${postDetails.postID}-${i}`;
        task.addFile(fileTaskId, file.name);

        try {
          console.log(`[Kemono DL] [File ${i + 1}/${totalUrlFiles}] Starting download: ${file.name} (${file.data})`);
          const cachedData = await getCachedFile(file.data);
          let arrayBuffer: ArrayBuffer;

          if (cachedData) {
            console.log(`[Kemono DL] [File ${i + 1}/${totalUrlFiles}] Loaded from cache: ${file.name}`);
            arrayBuffer = cachedData;
            task.updateFileProgress(fileTaskId, 100);
          } else {
            const response = await gmXmlhttpRequestWithRetries({
              method: 'GET',
              url: file.data,
              responseType: 'arraybuffer',
              timeout: state.settings.zipFileDownloadTimeout,
              onprogress: (e: ProgressEvent) => {
                if (e.lengthComputable && e.total > 0) {
                  task.updateFileProgress(fileTaskId, (e.loaded / e.total) * 100);
                }
              }
            });
            arrayBuffer = response.response;
            if (arrayBuffer && arrayBuffer.byteLength > 0) {
              console.log(`[Kemono DL] [File ${i + 1}/${totalUrlFiles}] Downloaded successfully (${arrayBuffer.byteLength} bytes). Saving to cache.`);
              await setCachedFile(file.data, arrayBuffer, true);
            }
          }

          if (arrayBuffer && arrayBuffer.byteLength > 0) {
            zip.file(file.name, new Uint8Array(arrayBuffer));
            task.markFileComplete(fileTaskId, true);
          } else {
            throw new Error('Downloaded file ArrayBuffer is empty');
          }
        } catch (error: any) {
          failCount++;
          console.error(`[Kemono DL Error] File ${i + 1} download failed for URL "${file.data}":`, error);
          task.markFileComplete(fileTaskId, false);
          const sanitizedBase = sanitizeFilename(file.name.split('/').pop() || 'file');
          zip.file(
            `failed_${sanitizedBase}`,
            `Failed to download file.\nURL: ${file.data}\nError: ${error?.message || error}`
          );
        } finally {
          successCount++;
          task.updateStatus(`Downloading... ${successCount}/${totalUrlFiles} done`);
        }
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, totalUrlFiles) }, () => downloadWorker());
    await Promise.all(workers);

    console.log(`[Kemono DL] All downloads finished. Succeeded: ${successCount - failCount}, Failed: ${failCount}. Total files in zip object:`, Object.keys(zip.files).length);

    if (totalUrlFiles > 0 && failCount === totalUrlFiles) {
      throw new Error('All file downloads failed');
    }

    task.updateStatus('Zipping...');
    const zipName = sanitizeFilename(`${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_${generateRandomId(6)}.zip`);
    console.log(`[Kemono DL] Starting zip.generateAsync ({ type: 'uint8array' }) for "${zipName}"...`);

    let lastLoggedPercent = -1;
    const zipPromise = zip.generateAsync({ type: 'uint8array', compression: 'STORE' }, (meta: { percent: number }) => {
      const currentPercent = Math.floor(meta.percent);
      if (currentPercent !== lastLoggedPercent && currentPercent % 10 === 0) {
        lastLoggedPercent = currentPercent;
        console.log(`[Kemono DL] Zipping progress: ${currentPercent}%`);
      }
      task.updateStatus(`Zipping ${currentPercent}%`);
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('ZIP generation timed out after 60 seconds')), 60000);
    });

    const uint8Array = await Promise.race([zipPromise, timeoutPromise]);
    console.log(`[Kemono DL] Uint8Array generated (${uint8Array.byteLength} bytes). Constructing Blob...`);
    const blob = new Blob([uint8Array], { type: 'application/zip' });
    console.log(`[Kemono DL] ZIP Blob generated! Size: ${blob.size} bytes (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);

    if (!blob || blob.size === 0) throw new Error('Generated ZIP is empty.');

    const blobUrl = URL.createObjectURL(blob);
    console.log(`[Kemono DL] Triggering download for blob URL ${blobUrl}...`);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = zipName;
    downloadAnchor.style.display = 'none';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    console.log(`[Kemono DL] Download triggered successfully for ${zipName}`);

    task.updateStatus(`Complete! ${failCount > 0 ? `(${failCount} fails)` : ''}`);
  } catch (error: any) {
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

    const targetFiles = files.filter((f) => f.source === 'url' && (type === 'Images' ? f.isMedia : !f.isMedia));

    if (targetFiles.length === 0) {
      task.updateStatus(`No ${type.toLowerCase()} to download.`);
      task.finish(3000);
      return;
    }

    task.updateStatus(`Starting download of ${targetFiles.length} files...`);

    for (let i = 0; i < targetFiles.length; i++) {
      const file = targetFiles[i];
      const fileTaskId = `indiv-${i}`;
      task.addFile(fileTaskId, file.name);

      while (appState.activeOperations >= state.settings.maxConcurrentIndividualDownloads) {
        await new Promise((res) => setTimeout(res, 200));
      }

      GM_download({
        url: file.data,
        name: file.name,
        saveAs: false
      });

      task.markFileComplete(fileTaskId, true);
      task.updateStatus(`Triggered ${i + 1}/${targetFiles.length}`);
    }

    task.updateStatus('All downloads triggered!');
  } catch (error: any) {
    task.updateStatus(`Error: ${error.message}`);
  } finally {
    task.finish();
  }
}

export async function downloadPostAsZip(details: PostDetails): Promise<void> {
  const postTask = progressManager.createTask(`zip-multi-${details.postID}`, `ZIP: ${details.postTitle}`);
  try {
    const { files } = await collectFilesForPost(details, {
      isBulk: false,
      template: '{file_index}_{file_name}'
    });

    if (files.length === 0) throw new Error('No content to ZIP.');

    const zip = new JSZip();
    let failedFileCount = 0;
    const urlFiles = files.filter((f) => f.source === 'url');

    postTask.updateStatus(`Downloading ${urlFiles.length} files...`);

    files.forEach((file) => {
      if (file.source === 'text') zip.file(file.name, file.data);
    });

    const downloadPromises: Promise<void>[] = [];
    let activeFileDownloads = 0;

    for (let fileIndex = 0; fileIndex < urlFiles.length; fileIndex++) {
      const fileToDownload = urlFiles[fileIndex];
      downloadPromises.push(
        (async () => {
          while (activeFileDownloads >= state.settings.maxConcurrentFileDownloadsInZip) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
          activeFileDownloads++;
          const fileTaskId = `multi-${details.postID}-${fileIndex}`;
          postTask.addFile(fileTaskId, fileToDownload.name);

          try {
            const response = await gmXmlhttpRequestWithRetries({
              method: 'GET',
              url: fileToDownload.data,
              responseType: 'arraybuffer',
              timeout: state.settings.zipFileDownloadTimeout,
              onprogress: (e: ProgressEvent) => {
                if (e.lengthComputable) postTask.updateFileProgress(fileTaskId, (e.loaded / e.total) * 100);
              }
            });
            zip.file(fileToDownload.name, response.response);
            postTask.markFileComplete(fileTaskId, true);
          } catch (error) {
            failedFileCount++;
            postTask.markFileComplete(fileTaskId, false);
          } finally {
            activeFileDownloads--;
          }
        })()
      );
    }

    await Promise.all(downloadPromises);
    postTask.updateStatus('Zipping...');

    const zipFileName = formatNameFromTemplate(state.settings.bulkMultipleSystemPathTemplate, {
      author_name: details.authorName,
      post_title: details.postTitle,
      post_id: details.postID,
      user_id: details.userID,
      service: details.service,
      post_date: details.postDate || 'UnknownDate'
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    GM_download({ url: URL.createObjectURL(blob), name: zipFileName, saveAs: false });
    postTask.updateStatus(`Complete! ${failedFileCount > 0 ? `(${failedFileCount} fails)` : ''}`);
  } catch (error: any) {
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
    const zip = new JSZip();
    let htmlIndexString = '';

    if (state.settings.addHtmlIndexInZip) {
      htmlIndexString = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Archive: ${sanitizeFilename(authorName)}</title><style>body{font-family:sans-serif;background-color:#2b2b2b;color:#f0f0f0;padding:20px}.container{max-width:900px;margin:auto;background-color:#333;padding:20px 40px;border-radius:8px}h1{color:#00aeff}h2{color:#e0e0e0}a{color:#87ceeb}</style></head><body><div class="container"><h1>Archive Index</h1><h3>Author: ${sanitizeFilename(authorName)}</h3><p>Total posts: ${postIds.length}</p><hr>`;
    }

    for (let i = 0; i < postIds.length; i++) {
      const postId = postIds[i];
      const postCard = document.querySelector(`article.post-card[data-id="${postId}"]`) as HTMLElement | null;
      if (!postCard) continue;

      const postDetails = getPostCardDetails(postCard, authorName);
      task.updateStatus(`[${i + 1}/${postIds.length}] Fetching: ${postDetails.postTitle}`);

      const { files } = await collectFilesForPost(postDetails, {
        isBulk: true,
        bulk_post_index: i + 1,
        template: state.settings.bulkSingleInternalPathTemplate
      });

      if (state.settings.addHtmlIndexInZip) {
        const postLink = (postCard.querySelector('a') as HTMLAnchorElement)?.href || '#';
        htmlIndexString += `<div class="post-entry">h2><a href="${postLink}" target="_blank">[${postDetails.postDate || 'N/A'}] ${postDetails.postTitle}</a></h2><ul>`;
        if (files.length > 0) {
          files.forEach((file) => {
            const sanitizedPath = file.name.split('/').map((part) => encodeURIComponent(part)).join('/');
            htmlIndexString += `<li><a href="./${sanitizedPath}">${file.name.split('/').pop()}</a></li>`;
          });
        } else {
          htmlIndexString += `<li>No files found.</li>`;
        }
        htmlIndexString += `</ul></div>`;
      }

      if (files.length === 0) continue;

      files.forEach((file) => {
        if (file.source === 'text') zip.file(file.name, file.data);
      });

      const urlFiles = files.filter((f) => f.source === 'url');
      if (urlFiles.length > 0) {
        task.updateStatus(`[${i + 1}/${postIds.length}] Downloading ${urlFiles.length} files for ${postDetails.postTitle}`);
        const downloadPromises: Promise<void>[] = [];
        let activeFileDownloads = 0;

        for (let fileIndex = 0; fileIndex < urlFiles.length; fileIndex++) {
          const fileToDownload = urlFiles[fileIndex];
          downloadPromises.push(
            (async () => {
              while (activeFileDownloads >= state.settings.maxConcurrentFileDownloadsInZip) {
                await new Promise((resolve) => setTimeout(resolve, 200));
              }
              activeFileDownloads++;
              const fileTaskId = `bulk-${i}-${fileIndex}`;
              task.addFile(fileTaskId, fileToDownload.name);

              try {
                const response = await gmXmlhttpRequestWithRetries({
                  method: 'GET',
                  url: fileToDownload.data,
                  responseType: 'arraybuffer',
                  timeout: state.settings.zipFileDownloadTimeout,
                  onprogress: (e: ProgressEvent) => {
                    if (e.lengthComputable) task.updateFileProgress(fileTaskId, (e.loaded / e.total) * 100);
                  }
                });
                zip.file(fileToDownload.name, response.response);
                task.markFileComplete(fileTaskId, true);
              } catch (error: any) {
                task.markFileComplete(fileTaskId, false);
                zip.file(
                  `failed_${fileToDownload.name.split('/').pop()}`,
                  `Failed to download.\nURL: ${fileToDownload.data}\nError: ${error.message}`
                );
              } finally {
                activeFileDownloads--;
              }
            })()
          );
        }
        await Promise.all(downloadPromises);
      }
    }

    if (state.settings.addHtmlIndexInZip) {
      htmlIndexString += `</div></body></html>`;
      zip.file('_index.html', htmlIndexString);
    }

    task.updateStatus(`Zipping ${postIds.length} Posts...`);
    const finalZipName = formatNameFromTemplate(state.settings.bulkSingleSystemPathTemplate, {
      author_name: authorName,
      post_count: postIds.length
    });

    const blob = await zip.generateAsync({ type: 'blob' }, (meta: { percent: number }) => {
      task.updateStatus(`Generating final ZIP: ${meta.percent.toFixed(0)}%`);
    });

    GM_download({ url: URL.createObjectURL(blob), name: finalZipName, saveAs: false });
    task.updateStatus('Complete!');
  } catch (error: any) {
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
    const postId = postIds[i];
    const postCard = document.querySelector(`article.post-card[data-id="${postId}"]`) as HTMLElement | null;
    if (!postCard) continue;

    const postDetails = getPostCardDetails(postCard, authorName);
    const { postDate } = await collectFilesForPost(postDetails, { isBulk: true, noFiles: true });
    postDetails.postDate = postDate;

    addTaskToQueue('Bulk-Single-Zip', downloadPostAsZip, postDetails, null);
    task.updateStatus(`Queued ${i + 1}/${postIds.length} posts...`);
  }

  task.updateStatus('All posts queued! Downloads will start based on concurrency settings.');
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
