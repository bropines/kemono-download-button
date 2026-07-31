import { getApiAdapter } from '../api';
import { getCachedPost, setCachedPost } from './cacheService';
import { appState, getSettings, resetMediaCounter, state } from '../state/store';
import { FileItem, PostDetails } from '../types';
import { debugLog, getApiUrl, getFullUrl, resolveMediaUrl, htmlToFormattedText, sanitizeFilename, isMediaFile } from '../utils/helpers';
import { gmXmlhttpRequestWithRetries } from '../utils/http';

export function getPostDetailsFromPage(): PostDetails {
  const pathParts = window.location.pathname.split('/');
  let service = 'unknown';
  let userID = 'unknown';
  let postID = 'unknown';

  if (pathParts.includes('user') && pathParts.includes('post')) {
    const userIndex = pathParts.indexOf('user');
    service = pathParts[userIndex - 1] || 'unknown';
    userID = pathParts[userIndex + 1] || 'unknown';
    postID = pathParts[pathParts.indexOf('post') + 1] || 'unknown';
  }

  const authorName =
    document.querySelector('.post__user-name')?.textContent?.trim() ||
    document.querySelector('.user-header__name span[itemprop="name"]')?.textContent?.trim() ||
    'UnknownAuthor';

  const postTitle = document.querySelector('.post__title span')?.textContent?.trim() || 'UntitledPost';
  const postDateNode = document.querySelector('.post__published');
  let postDate = 'UnknownDate';
  if (postDateNode && postDateNode.textContent) {
    const dateMatch = postDateNode.textContent.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) postDate = dateMatch[0];
  }

  const postContentNode = document.querySelector('.post__content');
  const postContent = postContentNode ? htmlToFormattedText(postContentNode.innerHTML) : '';

  return { service, userID, authorName, postID, postTitle, postDate, postContent };
}

export function getPostCardDetails(cardNode: HTMLElement, pageAuthorName: string): PostDetails {
  const linkNode = cardNode.querySelector('a') as HTMLAnchorElement | null;
  const href = linkNode ? linkNode.getAttribute('href') || '' : '';
  const pathParts = href.split('/');
  let service = 'unknown';
  let userID = 'unknown';
  let postID = 'unknown';

  if (pathParts.includes('user') && pathParts.includes('post')) {
    const userIndex = pathParts.indexOf('user');
    service = pathParts[userIndex - 1] || 'unknown';
    userID = pathParts[userIndex + 1] || 'unknown';
    postID = pathParts[pathParts.indexOf('post') + 1] || 'unknown';
  } else {
    postID = cardNode.dataset.id || 'UnknownPostID';
    userID = cardNode.dataset.user || 'UnknownUserID';
    service = cardNode.dataset.service || 'UnknownService';
  }

  const postTitle = cardNode.querySelector('.post-card__header')?.textContent?.trim() || 'UntitledPost';
  const postDate = cardNode.querySelector('.post-card__footer time')?.getAttribute('datetime')?.split('T')[0] || 'UnknownDate';

  return { service, userID, authorName: pageAuthorName, postID, postTitle, postDate };
}

export function formatNameFromTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const sanitizedVal = sanitizeFilename(String(value ?? ''));
    result = result.replace(new RegExp(`{${key}}`, 'g'), sanitizedVal);
  }
  return result.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
}

export function generateFilePath(template: string, fileData: Record<string, any>, postDetails: PostDetails): string {
  const combinedData = {
    post_date: postDetails.postDate || 'UnknownDate',
    author_name: postDetails.authorName,
    post_title: postDetails.postTitle,
    post_id: postDetails.postID,
    user_id: postDetails.userID,
    service: postDetails.service,
    ...fileData
  };
  return formatNameFromTemplate(template, combinedData);
}

export function getWindowPageData(targetPostID?: string): any {
  try {
    const winData = (window as any).page_data;
    if (winData) {
      const post = winData.post || winData.props?.post || (Array.isArray(winData) ? winData[0] : winData);
      if (post && post.id && (!targetPostID || String(post.id) === String(targetPostID))) {
        return post;
      }
    }
  } catch (e) {
    debugLog('Failed to read page_data from window', e);
  }
  return null;
}

export async function collectFilesForPost(postDetails: PostDetails, options: Record<string, any> = {}): Promise<{ files: FileItem[]; postDate: string }> {
  await getSettings();
  const files: FileItem[] = [];
  let isApiSuccess = false;
  let rawApiData: any = null;
  const isPostPage = window.location.pathname.includes('/post/');
  const templateToUse = options.template || state.settings.fileNameTemplate;

  if (!options.isBulk && !options.noFiles) {
    resetMediaCounter();
  }

  if (state.settings.enableAPIFetch && postDetails.service !== 'unknown' && postDetails.userID !== 'unknown' && postDetails.postID !== 'unknown') {
    try {
      const cacheKey = `post_${postDetails.service}_${postDetails.userID}_${postDetails.postID}`;
      const windowPost = getWindowPageData(postDetails.postID);

      if (windowPost) {
        rawApiData = windowPost;
        console.log(`[Kemono DL] Post metadata loaded directly from window.page_data: ${postDetails.postID}`);
      } else {
        const cached = await getCachedPost(cacheKey);
        if (cached) {
          rawApiData = cached;
          console.log(`[Kemono DL] Post metadata loaded from IndexedDB cache: ${cacheKey}`);
        } else {
          console.log(`[Kemono DL] Fetching post metadata from API: ${postDetails.service}/${postDetails.userID}/${postDetails.postID}...`);
          rawApiData = await getApiAdapter().fetchPostData(postDetails.service, postDetails.userID, postDetails.postID);
          if (rawApiData) await setCachedPost(cacheKey, rawApiData);
        }
      }

      const post = rawApiData?.post || (Array.isArray(rawApiData) ? rawApiData[0] : rawApiData);
      if (post) {
        postDetails.rawApiData = post;
        if (post.published) postDetails.postDate = new Date(post.published).toISOString().split('T')[0];
        if (post.title) postDetails.postTitle = post.title;
        if (post.content) postDetails.postContent = htmlToFormattedText(post.content);
        isApiSuccess = true;
      }
    } catch (e) {
      debugLog('API Fetch failed, falling back to DOM parsing.', e);
    }
  }

  if (options.noFiles) {
    return { files: [], postDate: postDetails.postDate || 'UnknownDate' };
  }

  if (isApiSuccess && postDetails.rawApiData) {
    const post = postDetails.rawApiData;
    const allMediaFiles: Array<{ name: string; path: string }> = [];

    if (post.file?.path) {
      allMediaFiles.push({ name: post.file.name || post.file.path.split('/').pop(), path: post.file.path });
    }
    if (Array.isArray(post.attachments)) {
      post.attachments.forEach((att: any) => {
        if (att.path) allMediaFiles.push({ name: att.name || att.path.split('/').pop(), path: att.path });
      });
    }

    let localMediaCounter = 0;
    allMediaFiles.forEach((fileObj) => {
      appState.globalMediaCounter++;
      localMediaCounter++;
      const fileExt = fileObj.name.includes('.') ? fileObj.name.split('.').pop()! : '';
      const baseName = fileObj.name.substring(0, fileObj.name.length - (fileExt ? fileExt.length + 1 : 0));
      const fileIndex = String(localMediaCounter).padStart(3, '0');
      const globalFileIndex = String(appState.globalMediaCounter).padStart(3, '0');

      const pathData = {
        file_index: fileIndex,
        global_file_index: globalFileIndex,
        file_name: sanitizeFilename(baseName) + (fileExt ? '.' + fileExt : ''),
        original_file_name: sanitizeFilename(fileObj.name),
        file_ext: fileExt,
        bulk_post_index: options.bulk_post_index ? String(options.bulk_post_index).padStart(3, '0') : ''
      };

      const finalPath = generateFilePath(templateToUse, pathData, postDetails);
      const isMedia = isMediaFile(fileObj.name);
      files.push({ name: finalPath, data: resolveMediaUrl(fileObj.path, fileObj.name), source: 'url', isMedia });
    });

    if (state.settings.savePostContentAsText && post.content) {
      const formattedContent = htmlToFormattedText(post.content);
      if (formattedContent) {
        const textFileName = generateFilePath(templateToUse, { file_index: '000', file_name: 'content.txt' }, postDetails);
        files.push({ name: textFileName, data: formattedContent, source: 'text' });
      }
    }
  } else if (isPostPage) {
    let localMediaCounter = 0;
    const mediaNodes = document.querySelectorAll('.post__files .post__thumbnail a, .post__attachments a.post__attachment-link');

    mediaNodes.forEach((node) => {
      const href = node.getAttribute('href');
      if (!href) return;
      appState.globalMediaCounter++;
      localMediaCounter++;

      const originalName = node.getAttribute('download') || href.split('/').pop()?.split('?')[0] || 'file';
      const fileExt = originalName.includes('.') ? originalName.split('.').pop()! : '';
      const baseName = originalName.substring(0, originalName.length - (fileExt ? fileExt.length + 1 : 0));

      const pathData = {
        file_index: String(localMediaCounter).padStart(3, '0'),
        global_file_index: String(appState.globalMediaCounter).padStart(3, '0'),
        file_name: sanitizeFilename(baseName) + (fileExt ? '.' + fileExt : ''),
        original_file_name: sanitizeFilename(originalName),
        file_ext: fileExt
      };

      const finalPath = generateFilePath(templateToUse, pathData, postDetails);
      files.push({ name: finalPath, data: getFullUrl(href), source: 'url', isMedia: true });
    });

    if (state.settings.savePostContentAsText && postDetails.postContent) {
      const textFileName = generateFilePath(templateToUse, { file_index: '000', file_name: 'content.txt' }, postDetails);
      files.push({ name: textFileName, data: postDetails.postContent, source: 'text' });
    }
  }

  if (state.settings.addMetadataFile && isApiSuccess && postDetails.rawApiData) {
    const metaPath = generateFilePath(templateToUse, { file_index: 'meta', file_name: 'metadata.json' }, postDetails);
    files.push({ name: metaPath, data: JSON.stringify(postDetails.rawApiData, null, 2), source: 'text' });
  }

  if (state.settings.savePostTags && isPostPage) {
    try {
      const tagsCacheKey = `tags_${postDetails.service}_${postDetails.userID}`;
      let tagsData = await getCachedPost(tagsCacheKey);
      if (!tagsData) {
        tagsData = await getApiAdapter().fetchTags(postDetails.service, postDetails.userID);
        if (tagsData && tagsData.length > 0) {
          await setCachedPost(tagsCacheKey, tagsData);
        }
      }
      if (Array.isArray(tagsData) && tagsData.length > 0) {
        const tagsPath = generateFilePath(templateToUse, { file_index: 'tags', file_name: 'tags.txt' }, postDetails);
        files.push({ name: tagsPath, data: tagsData.join('\n'), source: 'text' });
      }
    } catch (e) {
      debugLog('Failed to fetch tags', e);
    }
  }

  if (state.settings.savePostComments && isPostPage) {
    try {
      const commentsCacheKey = `comments_${postDetails.service}_${postDetails.userID}_${postDetails.postID}`;
      let commentsData = await getCachedPost(commentsCacheKey);
      if (!commentsData) {
        commentsData = await getApiAdapter().fetchComments(postDetails.service, postDetails.userID, postDetails.postID);
        if (commentsData && commentsData.length > 0) {
          await setCachedPost(commentsCacheKey, commentsData);
        }
      }
      if (Array.isArray(commentsData) && commentsData.length > 0) {
        const commentsText = commentsData
          .map((c: any) => `[${c.published || 'N/A'}] ${c.commenter_name || 'User'}: ${c.content}`)
          .join('\n\n');
        const commentsPath = generateFilePath(templateToUse, { file_index: 'comments', file_name: 'comments.txt' }, postDetails);
        files.push({ name: commentsPath, data: commentsText, source: 'text' });
      }
    } catch (e) {
      debugLog('Failed to fetch comments', e);
    }
  }

  return { files, postDate: postDetails.postDate || 'UnknownDate' };
}

export async function fetchAndCachePostData(): Promise<void> {
  const postDetails = getPostDetailsFromPage();
  if (postDetails.service === 'unknown') return;
  try {
    const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
    appState.cachedPostFiles = files;
    debugLog(`Cached ${files.length} files for post ${postDetails.postID}`);
  } catch (err) {
    console.error('Failed to pre-cache post files:', err);
  }
}
