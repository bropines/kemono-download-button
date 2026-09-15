import { DownloaderSettings } from '../types';
import { gmXmlhttpRequestWithRetries } from '../utils/http';

export interface TranslationLanguage {
  value: string;
  name: string;
  code: string;
}

// Stored setting value -> English name for LLM prompts and ISO code for machine translators
export const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  { value: 'auto', name: 'Browser language', code: '' },
  { value: 'russian', name: 'Russian', code: 'ru' },
  { value: 'english', name: 'English', code: 'en' },
  { value: 'ukrainian', name: 'Ukrainian', code: 'uk' },
  { value: 'chinese', name: 'Chinese (Simplified)', code: 'zh-CN' },
  { value: 'chinese_traditional', name: 'Chinese (Traditional)', code: 'zh-TW' },
  { value: 'japanese', name: 'Japanese', code: 'ja' },
  { value: 'korean', name: 'Korean', code: 'ko' },
  { value: 'german', name: 'German', code: 'de' },
  { value: 'french', name: 'French', code: 'fr' },
  { value: 'spanish', name: 'Spanish', code: 'es' },
  { value: 'portuguese', name: 'Portuguese', code: 'pt' },
  { value: 'italian', name: 'Italian', code: 'it' },
  { value: 'polish', name: 'Polish', code: 'pl' },
  { value: 'turkish', name: 'Turkish', code: 'tr' },
  { value: 'vietnamese', name: 'Vietnamese', code: 'vi' },
  { value: 'indonesian', name: 'Indonesian', code: 'id' },
  { value: 'thai', name: 'Thai', code: 'th' },
  { value: 'arabic', name: 'Arabic', code: 'ar' },
];

export const OPENAI_COMPATIBLE_PRESETS = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { id: 'gemini', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'google/gemini-2.5-flash' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { id: 'mistral', name: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', model: 'mistral-small-latest' },
  { id: 'ollama', name: 'Ollama (local)', baseUrl: 'http://localhost:11434/v1', model: '' },
  { id: 'lmstudio', name: 'LM Studio (local)', baseUrl: 'http://localhost:1234/v1', model: '' },
];

// Public key of Google's own website translator widget (also used by Chrome and FOSWLY/translate)
const GOOGLE_API_URL = 'https://translate-pa.googleapis.com/v1/translateHtml';
const GOOGLE_API_KEY = 'AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520';
// Yandex Browser's translation endpoint (FOSWLY/translate "yandexbrowser" provider)
const YANDEX_API_URL = 'https://browser.translate.yandex.net/api/v1/tr.json/translate';
const YANDEX_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 YaBrowser/26.6.0.0 Safari/537.36';

const MACHINE_BATCH_CHARS = 4000;
const MACHINE_BATCH_LINES = 100;

// Gemini 1.5 models are retired; the old default must not keep failing for existing installs
const LEGACY_GEMINI_MODEL = 'gemini-1.5-flash-latest';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function resolveLanguage(value: string): TranslationLanguage {
  const normalized = (value || '').toLowerCase();
  const known = TRANSLATION_LANGUAGES.find((lang) => lang.value === normalized && lang.code);
  if (known) return known;
  // "auto" or an unknown stored value: follow the browser UI language
  const browserCode = (navigator.language || 'en').split('-')[0];
  return TRANSLATION_LANGUAGES.find((lang) => lang.code.split('-')[0] === browserCode) || TRANSLATION_LANGUAGES[2];
}

export function isTranslationConfigured(settings: DownloaderSettings): boolean {
  switch (settings.translationProvider) {
    case 'google':
    case 'yandex':
      return true;
    case 'gemini':
      return !!settings.geminiApiKey;
    case 'deepl':
      return !!settings.deeplApiKey;
    case 'openai':
      return !!settings.openaiBaseUrl && !!settings.openaiModel;
    default:
      return false;
  }
}

export async function translateText(text: string, settings: DownloaderSettings, signal?: AbortSignal): Promise<string> {
  const language = resolveLanguage(settings.translationLanguage);
  switch (settings.translationProvider) {
    case 'google':
      return translateByLines(text, (lines) => translateGoogle(lines, language.code, signal));
    case 'yandex':
      return translateByLines(text, (lines) => translateYandex(lines, language.code, signal));
    case 'deepl':
      return translateDeepL(text, language.code, settings, signal);
    case 'gemini':
      return translateGemini(text, language.name, settings, signal);
    case 'openai':
      return translateOpenAiCompatible(text, language.name, settings, signal);
    default:
      throw new Error(`Provider ${settings.translationProvider} is not supported.`);
  }
}

const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const codePoint = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

const llmInstruction = (languageName: string): string =>
  `You are a professional translator. Translate the text from the user into ${languageName}. ` +
  'Preserve line breaks, formatting, URLs, names and emoji. Reply with the translation only, without explanations or quotes.';

// Machine translators get the non-empty lines in batches, so line breaks and blank lines survive exactly
async function translateByLines(text: string, translateBatch: (lines: string[]) => Promise<string[]>): Promise<string> {
  const lines = text.split('\n');
  const pending = lines.map((line, index) => ({ line, index })).filter(({ line }) => line.trim());

  for (let start = 0; start < pending.length; ) {
    let end = start;
    let chars = 0;
    while (end < pending.length && end - start < MACHINE_BATCH_LINES && (end === start || chars + pending[end].line.length <= MACHINE_BATCH_CHARS)) {
      chars += pending[end].line.length;
      end++;
    }
    const batch = pending.slice(start, end);
    const translated = await translateBatch(batch.map(({ line }) => line));
    batch.forEach(({ index }, i) => {
      if (translated[i]) lines[index] = translated[i];
    });
    start = end;
  }

  return lines.join('\n');
}

async function translateGoogle(lines: string[], targetCode: string, signal?: AbortSignal): Promise<string[]> {
  const response = await gmXmlhttpRequestWithRetries({
    method: 'POST',
    url: GOOGLE_API_URL,
    signal,
    headers: { 'Content-Type': 'application/json+protobuf', 'X-Goog-API-Key': GOOGLE_API_KEY },
    // translateHtml parses markup: escape the plain text going in, decode entities coming out
    data: JSON.stringify([[lines.map(escapeHtml), 'auto', targetCode], 'wt_lib']),
  });
  const translations = JSON.parse(response.responseText)?.[0];
  if (!Array.isArray(translations)) throw new Error('Unexpected response from Google Translate');
  return translations.map((item: unknown) => decodeHtmlEntities(String(item ?? '')));
}

async function translateYandex(lines: string[], targetCode: string, signal?: AbortSignal): Promise<string[]> {
  // Only the target language is passed, so Yandex detects the source; it has no Traditional Chinese
  const lang = targetCode.split('-')[0];
  const response = await gmXmlhttpRequestWithRetries({
    method: 'POST',
    url: `${YANDEX_API_URL}?srv=browser_video_translation&lang=${encodeURIComponent(lang)}`,
    signal,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': YANDEX_USER_AGENT },
    // Text goes in the body: long posts would exceed URL limits as query parameters
    data: new URLSearchParams(lines.map((line) => ['text', line])).toString(),
  });
  const data = JSON.parse(response.responseText);
  if (data?.code !== 200 || !Array.isArray(data.text)) {
    throw new Error(data?.message || `Yandex Translate error ${data?.code}`);
  }
  return data.text;
}

function deeplTargetCode(code: string): string {
  const upper = code.toUpperCase();
  if (upper === 'EN') return 'EN-US';
  if (upper === 'PT') return 'PT-PT';
  if (upper.startsWith('ZH')) return upper === 'ZH-TW' ? 'ZH-HANT' : 'ZH-HANS';
  return upper;
}

async function translateDeepL(text: string, targetCode: string, settings: DownloaderSettings, signal?: AbortSignal): Promise<string> {
  if (!settings.deeplApiKey) throw new Error('DeepL API key is missing in settings.');
  const baseUrl = settings.deeplApiTier === 'pro' ? 'https://api.deepl.com' : 'https://api-free.deepl.com';
  const response = await gmXmlhttpRequestWithRetries({
    method: 'POST',
    url: `${baseUrl}/v2/translate`,
    signal,
    headers: { Authorization: `DeepL-Auth-Key ${settings.deeplApiKey}`, 'Content-Type': 'application/json' },
    data: JSON.stringify({ text: [text], target_lang: deeplTargetCode(targetCode) }),
    responseType: 'json',
  });
  const output = response.response?.translations?.[0]?.text;
  if (!output) throw new Error('Invalid response structure from DeepL API');
  return output.trim();
}

async function translateGemini(text: string, languageName: string, settings: DownloaderSettings, signal?: AbortSignal): Promise<string> {
  if (!settings.geminiApiKey) throw new Error('Gemini API key is missing in settings.');
  const storedModel = settings.translationModelName?.trim();
  const model = !storedModel || storedModel === LEGACY_GEMINI_MODEL ? DEFAULT_GEMINI_MODEL : storedModel;
  const response = await gmXmlhttpRequestWithRetries({
    method: 'POST',
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': settings.geminiApiKey },
    data: JSON.stringify({
      systemInstruction: { parts: [{ text: llmInstruction(languageName) }] },
      contents: [{ role: 'user', parts: [{ text }] }],
    }),
    responseType: 'json',
  });
  const output = response.response?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('');
  if (!output) throw new Error('Invalid response structure from Gemini API');
  return output.trim();
}

async function translateOpenAiCompatible(text: string, languageName: string, settings: DownloaderSettings, signal?: AbortSignal): Promise<string> {
  const baseUrl = (settings.openaiBaseUrl || '').trim().replace(/\/+$/, '');
  if (!baseUrl) throw new Error('OpenAI-compatible base URL is missing in settings.');
  if (!settings.openaiModel) throw new Error('Model name is missing in settings.');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // Local servers (Ollama, LM Studio) work without a key
  if (settings.openaiApiKey) headers.Authorization = `Bearer ${settings.openaiApiKey}`;

  const response = await gmXmlhttpRequestWithRetries({
    method: 'POST',
    url: `${baseUrl}/chat/completions`,
    signal,
    headers,
    data: JSON.stringify({
      model: settings.openaiModel,
      temperature: 0.2,
      messages: [
        { role: 'system', content: llmInstruction(languageName) },
        { role: 'user', content: text },
      ],
    }),
    responseType: 'json',
  });
  const output = response.response?.choices?.[0]?.message?.content;
  if (typeof output !== 'string' || !output.trim()) throw new Error('Invalid response from the OpenAI-compatible API');
  // Reasoning models (DeepSeek R1, Qwen3...) may prepend their thinking
  return output.replace(/^\s*<think>[\s\S]*?<\/think>/i, '').trim();
}
