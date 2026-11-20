import { readStored, writeStored } from '../../state/gmStorage';
import { button, kitScope } from '../../ui/kit';
import { t } from '../../i18n';
import { getModuleSetting, onRegistryChange } from '../../core/registry';

export type SectionId = string;
export interface OverviewSection { id: SectionId; node: HTMLElement; title: string; members?: HTMLElement[] }

const ORDER_KEY = 'creatorOverview.order';
const DEFAULT_ORDER: SectionId[] = ['announcements', 'tags', 'links'];

// Larger hit areas on phones and other touch devices; headings may shrink instead of
// forcing the control row wider than the page.
export const ORDER_CONTROLS_STYLE = `
.kdl-ov__order[hidden], .kdl-creator-order__head[hidden] { display: none !important; }
@media (max-width: 600px), (pointer: coarse) {
  .kdl-ov__order .kdl-ui-btn.kdl-ov__move, .kdl-ov__order .kdl-ui-btn.kdl-ov__drag { width: 44px; height: 44px; }
  .kdl-ov__head .kdl-ov__title, .kdl-sim__head .kdl-sim__title, .kdl-creator-order__title {
    min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
}
`;

/** Reject unknown and repeated values while retaining positions for currently hidden sections. */
export function normalizeOrder(value: unknown, defaults: SectionId[] = DEFAULT_ORDER): SectionId[] {
  const result: SectionId[] = [];
  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (defaults.includes(item) && !result.includes(item)) result.push(item);
    });
  }
  defaults.forEach((item) => { if (!result.includes(item)) result.push(item); });
  return result;
}

export function moveSection(order: SectionId[], source: SectionId, target: SectionId, after: boolean): SectionId[] {
  if (source === target) return order;
  const next = order.filter((item) => item !== source);
  const index = next.indexOf(target);
  if (index < 0 || !order.includes(source)) return order;
  next.splice(index + (after ? 1 : 0), 0, source);
  return next;
}

/** Add pointer drag handles and keyboard/touch-friendly move buttons, saving one global order. */
export function orderOverviewSections(sections: OverviewSection[], options?: { key: string; defaults: SectionId[]; heading: string | ((section: OverviewSection) => HTMLElement | null) }): { nodes: HTMLElement[]; cleanup: () => void } {
  const key = options?.key ?? ORDER_KEY;
  const defaults = options?.defaults ?? DEFAULT_ORDER;
  let order: SectionId[];
  try { order = normalizeOrder(readStored<unknown>(key, []), defaults); }
  catch { order = [...defaults]; }
  const byId = new Map(sections.map((section) => [section.id, section]));
  const sorted = () => order.flatMap((id) => byId.has(id) ? [byId.get(id)!] : []);
  const nodes = sorted().map((section) => section.node);
  if (sections.length < 2) return { nodes, cleanup: () => {} };

  let cancelDrag = () => {};
  let editing = getModuleSetting<boolean>('creator.blockOrder', 'editMode') === true;
  const controlNodes: HTMLElement[] = [];
  const extraHeadings: HTMLElement[] = [];
  const controls = new Map<SectionId, { up: HTMLButtonElement; down: HTMLButtonElement }>();
  const apply = (source: SectionId, target: SectionId, after: boolean) => {
    if (!editing) return;
    const next = moveSection(order, source, target, after);
    if (next.join('|') === order.join('|')) return;
    order = next;
    const parent = byId.get(source)?.node.parentElement;
    const moved = byId.get(source);
    const destination = byId.get(target);
    const movedNodes = moved?.members ?? (moved ? [moved.node] : []);
    const targetNodes = destination?.members ?? (destination ? [destination.node] : []);
    const edge = after ? targetNodes[targetNodes.length - 1] : targetNodes[0];
    if (parent && edge && edge.parentElement === parent && movedNodes.every((node) => node.parentElement === parent)) {
      const before = after ? edge.nextSibling : edge;
      movedNodes.forEach((node) => parent.insertBefore(node, before));
    }
    sorted().forEach(({ id }, index, visible) => {
      const control = controls.get(id);
      if (!control) return;
      control.up.disabled = index === 0;
      control.down.disabled = index === visible.length - 1;
    });
    try { writeStored(key, order); } catch { /* Sorting still works for this page. */ }
  };

  sections.forEach(({ id, node, title }) => {
    const heading = options?.heading ?? '.kdl-ov__head';
    const head = typeof heading === 'function' ? heading(byId.get(id)!) : node.querySelector<HTMLElement>(heading);
    if (!head) return;
    if (head.matches?.('.kdl-creator-order__head')) extraHeadings.push(head);
    const move = (delta: number) => {
      const visible = sorted();
      const index = visible.findIndex((section) => section.id === id);
      const target = visible[index + delta];
      if (target) {
        apply(id, target.id, delta > 0);
        const control = controls.get(id);
        (delta < 0 ? (control?.up.disabled ? control.down : control?.up) : (control?.down.disabled ? control.up : control?.down))?.focus();
      }
    };
    const upLabel = t('overview.moveUp', { section: title });
    const downLabel = t('overview.moveDown', { section: title });
    const dragLabel = t('overview.drag', { section: title });
    const up = button({ variant: 'ghost', size: 'icon', icon: 'chevron-up', title: upLabel, ariaLabel: upLabel, className: 'kdl-ov__move', onClick: () => move(-1) });
    const down = button({ variant: 'ghost', size: 'icon', icon: 'chevron-down', title: downLabel, ariaLabel: downLabel, className: 'kdl-ov__move', onClick: () => move(1) });
    const handle = button({ variant: 'ghost', size: 'icon', icon: 'list', title: dragLabel, ariaLabel: dragLabel, className: 'kdl-ov__drag' });
    controls.set(id, { up, down });
    const buttons = kitScope([up, down, handle], { className: 'kdl-ov__order' });
    buttons.hidden = !editing;
    controlNodes.push(buttons);
    head.append(buttons);
    handle.addEventListener('pointerdown', (event) => {
      if (!editing || event.button !== 0) return;
      event.preventDefault();
      cancelDrag();
      const pointerId = event.pointerId;
      node.setAttribute('data-kdl-dragging', '');
      const stop = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onEnd);
        document.removeEventListener('pointercancel', onEnd);
        node.removeAttribute('data-kdl-dragging');
        cancelDrag = () => {};
      };
      const onMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        const targetNode = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        const target = sections.find((section) => (section.members ?? [section.node]).some((member) => member.contains(targetNode)));
        if (!target || target.id === id) return;
        const member = (target.members ?? [target.node]).find((item) => item.contains(targetNode)) ?? target.node;
        const bounds = member.getBoundingClientRect();
        apply(id, target.id, moveEvent.clientY > bounds.top + bounds.height / 2);
      };
      const onEnd = (end: PointerEvent) => { if (end.pointerId === pointerId) stop(); };
      cancelDrag = stop;
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onEnd);
      document.addEventListener('pointercancel', onEnd);
    });
  });
  sorted().forEach(({ id }, index, visible) => {
    const control = controls.get(id);
    if (control) { control.up.disabled = index === 0; control.down.disabled = index === visible.length - 1; }
  });
  extraHeadings.forEach((head) => { head.hidden = !editing; });
  const off = onRegistryChange((event) => {
    if (event.type !== 'setting' || event.id !== 'creator.blockOrder' || event.key !== 'editMode') return;
    editing = event.value === true;
    if (!editing) cancelDrag();
    controlNodes.forEach((node) => { node.hidden = !editing; });
    extraHeadings.forEach((head) => { head.hidden = !editing; });
  });
  return { nodes, cleanup: () => { off(); cancelDrag(); controlNodes.forEach((node) => node.remove()); } };
}
