// Reorder only post sections that are direct siblings inside the post body. Native nodes are
// never moved between containers, and the original order is restored before HTMX snapshots.
import type { KdlModule } from '../../core/types';
import { ensureKit } from '../../ui/kit';
import { ORDER_CONTROLS_STYLE, orderOverviewSections, type OverviewSection } from '../creatorOverview/order';

const IDS = ['downloads', 'content', 'files', 'videos'];
const selectors: Record<string, string> = {
  downloads: '.post__attachments',
  content: '.post__content',
  files: '.post__files, .kui-gallery-layout',
  videos: '.post__videos, .kui-video-gallery-layout, .post__video, .kui-video-section',
};
let tracked: { root: Element; nodes: HTMLElement[]; slots: Comment[]; cleanup: () => void } | null = null;
let active = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function restore(): void {
  if (!tracked) return;
  tracked.cleanup();
  tracked.slots.forEach((slot, index) => {
    const section = tracked!.nodes[index];
    if (slot.isConnected && section.parentElement === tracked!.root) slot.after(section);
    slot.remove();
  });
  tracked = null;
}

function sync(): void {
  const root = document.querySelector('.post__body');
  if (!root) return restore();
  const sections: OverviewSection[] = [];
  Array.from(root.children).forEach((element) => {
    if (!(element instanceof HTMLElement) || !element.classList.contains('kui-post-section')) return;
    const heading = element.querySelector<HTMLElement>(':scope > h2');
    if (!heading) return;
    const id = IDS.find((key) => !sections.some((s) => s.id === key) && (element.matches(selectors[key]) || element.querySelector(selectors[key])));
    if (id) sections.push({ id, node: element, title: heading.textContent?.trim() || id });
  });
  if (tracked && tracked.root === root && tracked.nodes.length === sections.length && tracked.nodes.every((node) => sections.some((s) => s.node === node))) return;
  restore();
  if (sections.length < 2) return;
  ensureKit();
  const slots = sections.map(({ node }) => {
    const marker = document.createComment('kdl-post-block-position');
    node.before(marker);
    return marker;
  });
  const ordered = orderOverviewSections(sections, { key: 'postBlocks.order', defaults: IDS, heading: ':scope > h2' });
  slots.forEach((slot, index) => slot.after(ordered.nodes[index]));
  tracked = { root, slots, nodes: sections.map((section) => section.node), cleanup: ordered.cleanup };
}

export const postBlocksModule: KdlModule = {
  id: 'post.blockOrder',
  name: 'Post block order',
  description: 'Reorder the post content, downloads, files and video blocks.',
  group: 'Post page',
  pages: ['post'],
  defaultEnabled: true,
  requires: ['kui.post'],
  after: ['kui.post'],
  styles: `
.kui-post-section > h2:has(> .kdl-ov__order:not([hidden])) { display: flex; align-items: center; gap: 4px; }
.kdl-ov__order { display: inline-flex; align-items: center; margin-left: auto; flex: 0 0 auto; }
.kdl-ov__order .kdl-ui-btn.kdl-ov__move, .kdl-ov__order .kdl-ui-btn.kdl-ov__drag { width: 28px; height: 28px; padding: 4px; color: var(--kdl-muted-foreground); }
.kdl-ov__drag { cursor: grab; touch-action: none; }
.kdl-ov__drag:active { cursor: grabbing; }
.kui-post-section[data-kdl-dragging] { opacity: 0.65; }
${ORDER_CONTROLS_STYLE}
`,
  mount() { active = true; sync(); },
  update: sync,
  unmount() { active = false; clearTimeout(timer); restore(); },
  beforeSnapshot() {
    clearTimeout(timer);
    const path = location.pathname;
    restore();
    timer = setTimeout(() => { if (active && location.pathname === path) sync(); }, 0);
  },
};
