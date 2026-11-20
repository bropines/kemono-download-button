// Creator page blocks are moved only as direct siblings. The top paginator, cards and bottom
// paginator form one indivisible group; no native node is wrapped or moved to a different parent.
import type { KdlModule } from '../../core/types';
import { el } from '../../utils/dom';
import { ensureKit } from '../../ui/kit';
import { t } from '../../i18n';
import { ORDER_CONTROLS_STYLE, orderOverviewSections, type OverviewSection } from '../creatorOverview/order';
import { getModuleSetting, onRegistryChange } from '../../core/registry';

const ORDER = ['similar', 'overview', 'posts'];
const CHANGE = 'kdl:creator-sections-changed';
let active = false;
let suspended = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let tracked: { root: Element; groups: OverviewSection[]; slots: Comment[]; cleanup: () => void; headings: HTMLElement[] } | null = null;

const members = (section: OverviewSection): HTMLElement[] => section.members ?? [section.node];

function restore(): void {
  if (!tracked) return;
  const previous = tracked;
  tracked = null;
  previous.cleanup();
  previous.headings.forEach((heading) => heading.remove());
  previous.slots.forEach((slot, index) => {
    const nodes = members(previous.groups[index]);
    if (slot.isConnected && nodes.every((node) => node.parentElement === previous.root)) slot.after(...nodes);
    slot.remove();
  });
}

function sync(): void {
  if (suspended) return;
  if (!/^\/[^/]+\/user\/[^/?#]+\/?$/.test(location.pathname)) return restore();
  const root = document.querySelector('.site-section--user');
  if (!root) return restore();
  const children = Array.from(root.children);
  const direct = (selector: string) => children.find((node) => node.matches(selector)) as HTMLElement | undefined;
  const similar = direct('.kdl-sim');
  const overview = direct('.kdl-ov');
  const top = direct('#paginator-top');
  const cards = direct('.card-list');
  const bottom = direct('#paginator-bottom');
  const groups: OverviewSection[] = [];
  if (similar) groups.push({ id: 'similar', node: similar, title: t('similar.title'), visibility: { module: 'creator.blockOrder', key: 'hideSimilar' } });
  if (overview) groups.push({ id: 'overview', node: overview, title: t('overview.creatorBlock'), visibility: { module: 'creator.blockOrder', key: 'hideOverview' } });
  // Only group the three known, adjacent native elements; if a site uses different markup,
  // leave its post list untouched rather than detach pagination or move unrelated widgets.
  if (top && cards && bottom && top.nextElementSibling === cards && cards.nextElementSibling === bottom) {
    groups.push({ id: 'posts', node: cards, title: t('overview.postsBlock'), members: [top, cards, bottom], visibility: { module: 'creator.blockOrder', key: 'hidePosts' } });
  }
  if (tracked && tracked.root === root && tracked.groups.length === groups.length && tracked.groups.every((old) => {
    const next = groups.find((group) => group.id === old.id);
    const a = members(old), b = next ? members(next) : [];
    return a.length === b.length && a.every((node, index) => node === b[index]);
  })) return;
  restore();
  if (!groups.length) return;
  // Restoring an older arrangement may itself move the nodes. Slots must follow the
  // resulting DOM order, including when an asynchronous block appeared or disappeared.
  const currentChildren = Array.from(root.children);
  groups.sort((a, b) => currentChildren.indexOf(members(a)[0]) - currentChildren.indexOf(members(b)[0]));
  ensureKit();
  const headings: HTMLElement[] = [];
  const heads = new Map<SectionId, HTMLElement>();
  groups.forEach((group) => {
    let head: HTMLElement | null = group.id === 'similar' ? group.node.querySelector('.kdl-sim__head') : null;
    if (!head) {
      head = el('div', { className: 'kdl-creator-order__head' }, [el('span', { className: 'kdl-creator-order__title' }, [group.title])]);
      group.node.prepend(head);
      headings.push(head);
    }
    heads.set(group.id, head);
  });
  const slots = groups.map((group) => {
    const slot = document.createComment('kdl-creator-block-position');
    members(group)[0].before(slot);
    return slot;
  });
  const sorted = orderOverviewSections(groups, { key: 'creatorBlocks.order', defaults: ORDER, heading: (group) => heads.get(group.id) ?? null });
  const byNode = new Map(groups.map((group) => [group.node, group]));
  slots.forEach((slot, index) => slot.after(...members(byNode.get(sorted.nodes[index])!)));
  tracked = { root, groups, slots, headings, cleanup: sorted.cleanup };
}

type SectionId = string;

export const creatorBlocksModule: KdlModule = {
  id: 'creator.blockOrder',
  name: 'Creator page block order',
  description: 'Reorder similar creators, the overview and the posts with their pagination.',
  group: 'Lists',
  pages: ['creator'],
  defaultEnabled: true,
  after: ['creators.similar', 'creators.overview'],
  settings: [
    { key: 'editMode', label: 'Edit page layout', type: 'boolean', default: false, hint: 'Show drag handles and move buttons for creator and post blocks.' },
    { key: 'hideSimilar', label: 'Hide similar creators', type: 'boolean', default: false },
    { key: 'hideOverview', label: 'Hide creator overview', type: 'boolean', default: false },
    { key: 'hidePosts', label: 'Hide posts', type: 'boolean', default: false },
  ],
  styles: `
.kdl-creator-order__head { display: flex; align-items: center; gap: 4px; color: var(--kdl-muted-foreground); font-size: 13px; font-weight: 600; }
.kdl-creator-order__title { margin-right: auto; }
html:not([data-kdl-layout-edit]) .site-section--user > [data-kdl-hidden-block] { display: none !important; }
html[data-kdl-layout-edit] .site-section--user > [data-kdl-hidden-block] { opacity: 0.65; }
.kdl-ov__order .kdl-ui-btn.kdl-ov__visibility { width: 28px; height: 28px; padding: 4px; }
@media (max-width: 600px), (pointer: coarse) { .kdl-ov__order .kdl-ui-btn.kdl-ov__visibility { width: 44px; height: 44px; } }
.kdl-ov__order { display: inline-flex; align-items: center; margin-left: auto; flex: 0 0 auto; }
.kdl-ov__order .kdl-ui-btn.kdl-ov__move, .kdl-ov__order .kdl-ui-btn.kdl-ov__drag { width: 28px; height: 28px; padding: 4px; color: var(--kdl-muted-foreground); }
.kdl-ov__drag { cursor: grab; touch-action: none; }
.kdl-ov__drag:active { cursor: grabbing; }
.kdl-sim[data-kdl-dragging], .kdl-ov[data-kdl-dragging], .card-list[data-kdl-dragging] { opacity: 0.65; }
${ORDER_CONTROLS_STYLE}
`,
  mount(ctx) {
    active = true;
    suspended = false;
    const syncEdit = () => document.documentElement.toggleAttribute('data-kdl-layout-edit', getModuleSetting<boolean>('creator.blockOrder', 'editMode') === true);
    syncEdit();
    const off = onRegistryChange((event) => { if (event.type === 'setting' && event.id === 'creator.blockOrder' && event.key === 'editMode') syncEdit(); });
    document.addEventListener(CHANGE, sync);
    ctx.onCleanup(() => { off(); document.documentElement.removeAttribute('data-kdl-layout-edit'); document.removeEventListener(CHANGE, sync); active = false; clearTimeout(timer); restore(); });
    sync();
  },
  update: sync,
  beforeSnapshot() {
    clearTimeout(timer);
    const path = location.pathname;
    suspended = true;
    restore();
    timer = setTimeout(() => { suspended = false; if (active && location.pathname === path) sync(); }, 0);
  },
};
