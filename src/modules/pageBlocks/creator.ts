// Creator page blocks are moved only as direct siblings. The top paginator, cards and bottom
// paginator form one indivisible group; no native node is wrapped or moved to a different parent.
import type { KdlModule } from '../../core/types';
import { el } from '../../utils/dom';
import { ensureKit } from '../../ui/kit';
import { t } from '../../i18n';
import { normalizeOrder, ORDER_CONTROLS_STYLE, orderOptions, orderOverviewSections, settingOrder, type OverviewSection } from '../creatorOverview/order';
import { getModuleSetting, onRegistryChange } from '../../core/registry';

const ORDER = ['similar', 'overview', 'posts'];
// The order is the select setting "order" (Settings → Modules), also changed by the edit mode's move buttons
const orderStore = () => settingOrder('creator.blockOrder', 'order', 'creatorBlocks.order');
const CHANGE = 'kdl:creator-sections-changed';
const LIVE_SEARCH_MORE = 'kdl-live-search-more';
let active = false;
let suspended = false;
let timer: ReturnType<typeof setTimeout> | undefined;
// `slot` marks where the site put the posts group (top paginator, cards, bottom paginator), for restore()
let tracked: { root: Element; groups: OverviewSection[]; slot: Comment | null; cleanup: () => void; headings: HTMLElement[] } | null = null;

const members = (section: OverviewSection): HTMLElement[] => section.members ?? [section.node];

// Puts `nodes` right before `before` (null: at the end), in order, moving only the ones that are not there yet.
// A moved node restarts its animations, so the page visibly rebuilds: a block already in place is never touched.
function putBefore(root: Element, nodes: HTMLElement[], before: Element | null): void {
  let ref = before;
  // One of the nodes may stand there now
  while (ref && nodes.includes(ref as HTMLElement)) ref = ref.nextElementSibling;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.parentElement !== root || node.nextElementSibling !== ref) root.insertBefore(node, ref);
    ref = node;
  }
}

// The posts group (the site's own nodes, fifty cards with their pictures) stays where it is: our blocks, which
// arrive one by one from the API, are placed around it. The cards used to be taken out and put back every time
// a block arrived, so they cascaded in a second time on a page that was already shown.
function arrange(root: Element, sorted: OverviewSection[]): void {
  const at = sorted.findIndex((group) => group.id === 'posts');
  if (at < 0) {
    // Only our blocks: in order, where the last of them stands
    const nodes = sorted.map((group) => group.node);
    const inDom = Array.from(root.children).filter((child) => nodes.includes(child as HTMLElement));
    putBefore(root, nodes, inDom[inDom.length - 1]?.nextElementSibling ?? null);
    return;
  }
  const posts = members(sorted[at]);
  putBefore(root, sorted.slice(0, at).map((group) => group.node), posts[0]);
  putBefore(root, sorted.slice(at + 1).map((group) => group.node), posts[posts.length - 1].nextElementSibling);
}

function dropControls(): void {
  if (!tracked) return;
  tracked.cleanup();
  tracked.cleanup = () => {};
  tracked.headings.forEach((heading) => heading.remove());
  tracked.headings = [];
}

function restore(): void {
  if (!tracked) return;
  dropControls();
  const previous = tracked;
  tracked = null;
  const { slot, root } = previous;
  const posts = previous.groups.find((group) => group.id === 'posts');
  if (slot?.isConnected && posts) {
    const nodes = members(posts);
    if (nodes.every((node) => node.parentElement === root)) {
      // Back where the site had them (moved only if the user reordered the page), our blocks above
      let ref: Node = slot;
      nodes.forEach((node) => {
        if (ref.nextSibling !== node) root.insertBefore(node, ref.nextSibling);
        ref = node;
      });
      const own = previous.groups.filter((group) => group !== posts && group.node.parentElement === root).map((group) => group.node);
      putBefore(root, own, nodes[0]);
    }
  }
  slot?.remove();
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
  // The live search puts its "Load more" box right after the cards: it travels with them.
  const tail: HTMLElement[] = [];
  let afterCards = cards?.nextElementSibling ?? null;
  while (afterCards && afterCards.id === LIVE_SEARCH_MORE) {
    tail.push(afterCards as HTMLElement);
    afterCards = afterCards.nextElementSibling;
  }
  // The skin lifts the creator tabs out of the top paginator; until it has, moving the paginator would move them too
  const tabsInside = !!top?.querySelector(':scope > .tabs');
  if (top && cards && bottom && !tabsInside && top.nextElementSibling === cards && afterCards === bottom) {
    groups.push({ id: 'posts', node: cards, title: t('overview.postsBlock'), members: [top, cards, ...tail, bottom], visibility: { module: 'creator.blockOrder', key: 'hidePosts' } });
  }
  if (tracked && tracked.root === root && tracked.groups.length === groups.length && tracked.groups.every((old) => {
    const next = groups.find((group) => group.id === old.id);
    const a = members(old), b = next ? members(next) : [];
    return a.length === b.length && a.every((node, index) => node === b[index]);
  })) return;
  // Same page, another set of blocks (one arrived or went): only the edit controls are rebuilt
  const slot = tracked && tracked.root === root && tracked.slot?.isConnected ? tracked.slot : null;
  if (slot) {
    dropControls();
    tracked = null;
  } else restore();
  if (!groups.length) return void slot?.remove();
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
  const posts = groups.find((group) => group.id === 'posts');
  let mark = slot;
  if (mark && !posts) {
    mark.remove();
    mark = null;
  }
  if (!mark && posts) {
    mark = document.createComment('kdl-creator-block-position');
    members(posts)[0].before(mark);
  }
  const sorted = orderOverviewSections(groups, { key: 'creatorBlocks.order', defaults: ORDER, heading: (group) => heads.get(group.id) ?? null, store: orderStore() });
  const byNode = new Map(groups.map((group) => [group.node, group]));
  arrange(root, sorted.nodes.map((node) => byNode.get(node)!));
  tracked = { root, groups, slot: mark, headings, cleanup: sorted.cleanup };
}

type SectionId = string;

// The order was chosen in the settings: the blocks move to it. A move made on the page stored the order the page
// already shows, which is left alone (rebuilding the controls would take the focus off the button just pressed).
function resort(): void {
  if (!tracked) return;
  const shown = [...tracked.groups]
    .sort((a, b) => (a.node.compareDocumentPosition(b.node) & 4 ? -1 : 1))
    .map((group) => group.id);
  const wanted = normalizeOrder(orderStore().read(), ORDER).filter((id) => shown.includes(id));
  if (shown.join('|') === wanted.join('|')) return;
  // Another set of groups than the tracked one: sync() takes the in-place path and arranges them anew
  tracked.groups = [];
  sync();
}

export const creatorBlocksModule: KdlModule = {
  id: 'creator.blockOrder',
  name: 'Creator page block order',
  description: 'Reorder similar creators, the overview and the posts with their pagination.',
  group: 'Lists',
  pages: ['creator'],
  defaultEnabled: true,
  // The skin's creator part gives the tabs a row of their own, so the posts group is only pagination and cards
  requires: ['ui.shadcn.creator'],
  after: ['creators.similar', 'creators.overview'],
  settings: [
    { key: 'editMode', label: 'Edit page layout', type: 'boolean', default: false, hint: 'Show drag handles and move buttons for creator and post blocks.' },
    { key: 'hideSimilar', label: 'Hide similar creators', type: 'boolean', default: false },
    { key: 'hideOverview', label: 'Hide creator overview', type: 'boolean', default: false },
    { key: 'hidePosts', label: 'Hide posts', type: 'boolean', default: false },
    {
      key: 'order',
      label: 'Order of the blocks',
      type: 'select',
      default: ORDER.join('-'),
      options: orderOptions(ORDER, { similar: 'Similar creators', overview: 'Creator overview', posts: 'Posts' }),
      hint: 'Also with the move buttons of "Edit page layout".',
    },
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
    const off = onRegistryChange((event) => {
      if (event.type !== 'setting' || event.id !== 'creator.blockOrder') return;
      if (event.key === 'editMode') syncEdit();
      if (event.key === 'order') resort();
    });
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
