// Embed link rules: links to other sites inside post text become buttons or disappear.

import { t } from '../../i18n';
import type { EmbedRules } from '../../types';
import { composeAiPrompt, registerAiPack } from '../aiPack';
import { kuiState, setEmbedRules } from '../kuiState';

const DOMAIN = /^(\*\.)?([a-z0-9-]+\.)+[a-z0-9-]{2,}$/;
const MAX_RULES = 500;

/**
 * A rule set (lower-case domains, "button" or "hide"), or null when it is not an object. Strict (an AI answer):
 * any bad rule refuses the whole set. Lenient (a backup, written by the dialog): bad rules are dropped.
 */
export function parseEmbedRules(value: unknown, lenient = false): EmbedRules | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_RULES && !lenient) return null;
  const rules: EmbedRules = {};
  for (const [raw, action] of entries) {
    const domain = raw.trim().toLowerCase();
    const valid = (lenient ? domain !== '' : DOMAIN.test(domain)) && (action === 'button' || action === 'hide');
    if (valid) rules[domain] = action as 'button' | 'hide';
    else if (!lenient) return null;
  }
  return rules;
}

function prompt(): string {
  return composeAiPrompt(embedRulesPack, {
    role: 'Your job: edit the embed link rules, which decide what happens to links to other sites inside post text.',
    body: `
## How rules work
- Every link in a post's text is checked against the rules by its host name (a leading "www." is ignored). The first match in this order wins: the exact host, then for each parent domain "*.parent" and "parent". So a rule for "mega.nz" also covers "files.mega.nz".
- "button": the link is turned into a download-style button (a link inside a sentence keeps its place and gets the button too).
- "hide": the link is removed from the post text.
- Without a rule, known file hosts (mega, google drive, dropbox, pixeldrain, gofile, mediafire and similar) become buttons and every other link stays a plain link. Links to kemono, coomer and pawchive themselves are never touched.

## Fields in "settings"
- \`rules\`: an object mapping a domain to "button" or "hide", e.g. {"mega.nz": "button", "*.linktr.ee": "hide"}. Domains are lower case, without "https://", paths or ports; "*." may prefix a domain. At most ${MAX_RULES} rules. Returning \`rules\` replaces the whole set, so keep the existing rules you do not mean to remove. Default: {}.

## Examples
- "Hide social links": add "twitter.com", "x.com", "instagram.com", "*.tumblr.com" as "hide".
- "Buttons for my file hosts": add "pixeldrain.com", "gofile.io" as "button".`,
    example: { rules: { 'mega.nz': 'button', 'x.com': 'hide' } },
  });
}

export const embedRulesPack = registerAiPack({
  id: 'embedRules',
  order: 30,
  title: () => t('ai.pack.embedRules'),
  fields: () => [{
    key: 'rules',
    get: () => ({ ...kuiState.embedRules }),
    set: (value) => {
      const rules = parseEmbedRules(value);
      if (!rules) return false;
      setEmbedRules(rules);
      return true;
    },
  }],
  systemPrompt: prompt,
});
