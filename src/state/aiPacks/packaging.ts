// Packaging rules: where downloads go, how files and archives are named, what goes into a ZIP.

import { DEFAULT_SETTINGS } from '../../config/constants';
import { t } from '../../i18n';
import { composeAiPrompt, registerAiPack } from '../aiPack';
import { MAX_TEMPLATE_LENGTH, normalizeExtensions } from '../settingsSchema';
import { fieldDoc, settingField } from './fields';

const D = DEFAULT_SETTINGS;

const POST_TAGS = [
  ['author_name', 'creator name', 'Mira Art'],
  ['post_date', 'publication date, YYYY-MM-DD ("UnknownDate" when the site gives none)', '2024-03-17'],
  ['post_title', 'post title', 'March rewards'],
  ['post_id', 'post id on the site', '91283312'],
  ['user_id', 'creator id on the site', '4412093'],
  ['service', 'source platform: patreon, fanbox, fantia, boosty, subscribestar, gumroad, dlsite, afdian, discord, onlyfans, fansly and others', 'patreon'],
];
const FILE_TAGS = [
  ['file_index', 'number of the file inside its post, 3 digits', '007'],
  ['global_file_index', 'running number across a whole bulk archive (equals file_index for a single post), 3 digits', '142'],
  ['file_name', 'file name with extension, cleaned', 'page_01.png'],
  ['original_file_name', 'file name as uploaded, cleaned', 'page 01.png'],
  ['file_ext', 'extension without the dot', 'png'],
];
const BULK_INDEX = ['bulk_post_index', 'position of the post in the bulk selection, 3 digits (bulk single ZIP only)', '012'];
const tagList = (tags: string[][]): string => tags.map(([name, meaning, example]) => `  - \`{${name}}\`: ${meaning}. Example: \`${example}\``).join('\n');

const FIELDS = [
  'fileNameTemplate', 'bulkDownloadMode', 'bulkSingleSystemPathTemplate', 'bulkSingleInternalPathTemplate',
  'bulkMultipleSystemPathTemplate', 'savedFileNameTemplates', 'ignoredFileExtensions', 'zipCompressionLevel',
  'savePostContentAsText', 'addMetadataFile', 'addHtmlIndexInZip', 'savePostTags', 'savePostComments', 'skipDownloadedFiles',
] as const;

function prompt(): string {
  return composeAiPrompt(packagingPack, {
    role: 'Your job: edit its packaging rules, i.e. the folder and file name templates and what goes into the ZIP archives, so downloads are organised the way the user describes.',
    body: `
## How templates work
- A template is text with placeholders in curly braces. Each placeholder is replaced by a value; "/" in the template makes a folder.
- Values are cleaned before they are inserted: the characters \\ / : * ? " < > | and control characters are removed, runs of spaces become one, trailing dots and spaces are dropped. A value therefore never creates a folder by itself.
- Leading and trailing "/" are removed and "//" becomes "/". Paths are relative to the browser's downloads folder (individual files and archive names) or to the root of the ZIP (paths inside an archive).
- A placeholder that a template does not support is left in the name literally (for example "{post_count}" inside a file template stays as the text "{post_count}"), so use only the placeholders listed for each template.
- Lengths: a template is at most ${MAX_TEMPLATE_LENGTH} characters and must not be blank. Each file name part is cut to 180 characters.
- Text extras of a post (content.txt, tags.txt, comments.txt, metadata.json) are named with the same template, with {file_index} = "000" (or "meta") and {file_name} = that file name; for them only the post placeholders, {file_index} and {file_name} are filled. So end a file template with {file_name} (optionally prefixed by {file_index}_) to keep their names right.

## Placeholders
Post placeholders (every template except bulkSingleSystemPathTemplate):
${tagList(POST_TAGS)}
File placeholders (fileNameTemplate and bulkSingleInternalPathTemplate only):
${tagList(FILE_TAGS)}
${tagList([BULK_INDEX])}

## Fields in "settings"
${fieldDoc('fileNameTemplate', 'path of every file saved by the post buttons "Images" and "Attachments" (relative to the downloads folder), and path of each file inside a single-post ZIP. Post and file placeholders.', D)}
${fieldDoc('bulkDownloadMode', 'what "Download selected" on a creator page does: "single" = one ZIP with all selected posts, "multiple" = one ZIP per post.', D)}
${fieldDoc('bulkSingleSystemPathTemplate', 'name and folder of the one ZIP in "single" mode. Only two placeholders: {author_name} and {post_count} (number of posts, e.g. 37). Should end with ".zip".', D)}
${fieldDoc('bulkSingleInternalPathTemplate', 'path of each file inside that ZIP. Post and file placeholders plus {bulk_post_index}.', D)}
${fieldDoc('bulkMultipleSystemPathTemplate', 'name and folder of each per-post ZIP in "multiple" mode. Post placeholders only (files inside are always "{file_index}_{file_name}"). Should end with ".zip".', D)}
${fieldDoc('savedFileNameTemplates', 'presets the user can load into fileNameTemplate from a list: an array of {"name": string, "template": string}, at most 200 items, names unique and at most 200 characters. Returning this key replaces the whole list.', D)}
${fieldDoc('ignoredFileExtensions', 'extensions that are never downloaded, matched against the end of the final path, case-insensitive: an array of strings like "psd" or ".zip" (letters and digits, up to 16). Returning it replaces the whole list; [] downloads everything. Ignoring "txt" or "json" also drops the text extras above.', D)}
${fieldDoc('zipCompressionLevel', 'ZIP compression, one of 0 (store, fastest; images and videos are already compressed), 1, 4, 6, 9 (smallest, slowest).', D)}
${fieldDoc('savePostContentAsText', 'boolean: put the post text into the archive as content.txt.', D)}
${fieldDoc('addMetadataFile', 'boolean: put the post metadata from the site API into the archive as metadata.json.', D)}
${fieldDoc('addHtmlIndexInZip', 'boolean: add _index.html, a clickable list of posts and files, at the root of a bulk single ZIP.', D)}
${fieldDoc('savePostTags', 'boolean: put the post tags into the archive as tags.txt.', D)}
${fieldDoc('savePostComments', 'boolean: put the post comments into the archive as comments.txt.', D)}
${fieldDoc('skipDownloadedFiles', 'boolean: skip files that this browser has already downloaded once.', D)}

## Examples
- "Each creator in a folder by service, date first": fileNameTemplate = "{service}/{author_name}/{post_date} {post_title}/{file_index}_{file_name}".
- "Bulk archive per creator with the post count": bulkSingleSystemPathTemplate = "{author_name}/{author_name} ({post_count} posts).zip".
- "No Photoshop or archives": ignoredFileExtensions = ["psd", "zip", "rar", "7z"].`,
    example: { fileNameTemplate: '{service}/{author_name}/{post_date} {post_title}/{file_index}_{file_name}', bulkDownloadMode: 'single' },
  });
}

export const packagingPack = registerAiPack({
  id: 'packaging',
  order: 10,
  title: () => t('ai.pack.packaging'),
  fields: () => FIELDS.map((key) => key === 'ignoredFileExtensions' ? settingField(key, normalizeExtensions) : settingField(key)),
  systemPrompt: prompt,
});
