export interface SavedTemplate {
  name: string;
  template: string;
}

export interface DownloaderSettings {
  savePostTags: boolean;
  savePostComments: boolean;
  sessionCookie: string;
  enableAPIFetch: boolean;
  enableDebugLogging: boolean;
  savePostContentAsText: boolean;
  maxConcurrentFileDownloadsInZip: number;
  maxConcurrentOperations: number;
  showZipButton: boolean;
  showImagesButton: boolean;
  showFilesButton: boolean;
  showCopyLinksButton: boolean;
  showShareButton: boolean;
  showTranslateButton: boolean;
  translationProvider: 'none' | 'gemini' | 'deepl' | 'yandex' | 'google';
  translationLanguage: string;
  geminiApiKey: string;
  translationModelName: string;
  deeplApiKey: string;
  deeplApiTier: 'free' | 'pro';
  maxConcurrentIndividualDownloads: number;
  enableDownloadRetries: boolean;
  downloadRetryCount: number;
  downloadRetryDelay: number;
  zipFileDownloadTimeout: number;
  zipCompressionLevel: number;
  addMetadataFile: boolean;
  addHtmlIndexInZip: boolean;
  fileNameTemplate: string;
  bulkDownloadMode: 'single' | 'multiple';
  bulkSingleSystemPathTemplate: string;
  bulkSingleInternalPathTemplate: string;
  cacheDurationHours: number;
  bulkMultipleSystemPathTemplate: string;
  savedFileNameTemplates: SavedTemplate[];
  ignoredFileExtensions: string[];
}

export type SupportedService =
  | 'patreon'
  | 'fanbox'
  | 'fantia'
  | 'boosty'
  | 'subscribestar'
  | 'dlsite'
  | 'gumroad'
  | 'afdian'
  | 'candystand'
  | 'pixiv'
  | 'onlyfans'
  | 'fansly'
  | 'candyfuns'
  | 'discord'
  | (string & {});

export interface PostDetails {
  service: SupportedService;
  userID: string;
  authorName: string;
  postID: string;
  postTitle: string;
  postDate?: string;
  postContent?: string;
  rawApiData?: any;
}

export interface FileItem {
  name: string;
  data: any;
  source: 'url' | 'text';
  isMedia?: boolean;
  isAttachment?: boolean;
}

export interface QueueTask {
  type: string;
  action: (pd: PostDetails) => Promise<any>;
  postDetails: PostDetails;
  buttonElement: HTMLElement | null;
  originalButtonText: string;
}

export interface AppState {
  globalMediaCounter: number;
  cachedPostFiles: FileItem[] | null;
  originalPostContentHTML: string | null;
  downloadQueue: QueueTask[];
  isQueueProcessing: boolean;
  activeOperations: number;
  selectedPostIds: Set<string>;
  translationCache: Record<string, string>;
  favoritedArtists: Set<string>;
  favoritedPosts: Set<string>;
  favoritesFetched: boolean;
  queueIndicatorElement: HTMLElement | null;
}

export type EmbedAction = 'button' | 'hide';
export type EmbedRules = Record<string, EmbedAction | string>;

export interface KuiAppState {
  isDebugModeEnabled: boolean;
  isVerboseDebugEnabled: boolean;
  isPreloadEnabled: boolean;
  isHideEmptySectionsEnabled: boolean;
  isPostPageModuleActive: boolean;
  embedRules: EmbedRules;
  sessionKey: string;
}

export interface PostFileData {
  name: string;
  path: string;
}

export interface VideoData {
  title: string;
  src: string;
}

export interface GalleryLayoutElement extends HTMLDivElement {
  navigate?: (direction: number) => void;
}

declare global {
  var JSZip: any;
  function GM_addStyle(css: string): HTMLStyleElement | undefined;
  function GM_download(options: {
    url: string;
    name: string;
    saveAs?: boolean;
    onload?: () => void;
    onerror?: (error: any) => void;
    ontimeout?: () => void;
    onprogress?: (event: any) => void;
  }): { abort: () => void } | undefined;
  // Tampermonkey/Violentmonkey GM_* storage is synchronous (only the GM.* dot API returns promises)
  function GM_getValue<T>(key: string, defaultValue?: T): T;
  function GM_setValue<T>(key: string, value: T): void;
  function GM_registerMenuCommand(name: string, fn: () => void): void;
  function GM_setClipboard(text: string): void;
  function GM_xmlhttpRequest(details: any): any;

  class Plyr {
    constructor(targets: HTMLElement | string, options?: Record<string, any>);
    on(event: string, callback: (event: any) => void): void;
    destroy(): void;
    media?: HTMLVideoElement;
    elements: {
      container?: HTMLElement;
    };
    source: any;
  }
}

