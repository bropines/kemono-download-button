import { el } from '../../../utils/dom';
import { cx, resolveContent, uid, type Content } from '../utils';

export interface TabItem {
  value: string;
  label: string;
  /** Panel content; a function is called once, the first time the tab opens. */
  content: Content;
  disabled?: boolean;
}

export interface TabsOptions {
  items: TabItem[];
  value?: string;
  ariaLabel?: string;
  className?: string;
  onChange?: (value: string) => void;
}

/** WAI-ARIA tabs: roving tabindex, arrows/Home/End move and activate. */
export function tabs(options: TabsOptions): HTMLDivElement {
  const base = uid('kdl-ui-tabs');
  const list = el('div', { className: 'kdl-ui-tabs__list' });
  list.setAttribute('role', 'tablist');
  if (options.ariaLabel) list.setAttribute('aria-label', options.ariaLabel);
  const root = el('div', { className: cx('kdl-ui-tabs', options.className) }, [list]);

  const entries = options.items.map((item, i) => {
    const tab = el('button', {
      type: 'button',
      id: `${base}-tab-${i}`,
      className: 'kdl-ui-tabs__trigger',
      textContent: item.label,
      disabled: !!item.disabled,
    });
    const panel = el('div', { id: `${base}-panel-${i}`, className: 'kdl-ui-tabs__panel', tabIndex: 0 });
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    list.append(tab);
    root.append(panel);
    return { item, tab, panel, rendered: false };
  });

  const select = (value: string, focus = false, notify = true) => {
    for (const entry of entries) {
      const active = entry.item.value === value;
      entry.tab.setAttribute('aria-selected', String(active));
      entry.tab.tabIndex = active ? 0 : -1;
      entry.tab.dataset.state = active ? 'active' : 'inactive';
      entry.panel.hidden = !active;
      if (active && !entry.rendered) {
        entry.panel.append(...resolveContent(entry.item.content).filter((c): c is string | Node => !!c));
        entry.rendered = true;
      }
      if (active && focus) entry.tab.focus();
    }
    root.dataset.value = value;
    if (notify) options.onChange?.(value);
  };

  entries.forEach(({ item, tab }) => tab.addEventListener('click', () => select(item.value)));
  list.addEventListener('keydown', (event) => {
    const enabled = entries.filter((e) => !e.item.disabled);
    const current = enabled.findIndex((e) => e.tab === event.target);
    if (current < 0) return;
    const next: Record<string, number> = {
      ArrowRight: (current + 1) % enabled.length,
      ArrowLeft: (current - 1 + enabled.length) % enabled.length,
      Home: 0,
      End: enabled.length - 1,
    };
    if (!(event.key in next)) return;
    event.preventDefault();
    select(enabled[next[event.key]].item.value, true);
  });

  const initial = options.value ?? options.items.find((i) => !i.disabled)?.value;
  if (initial !== undefined) select(initial, false, false);
  return root;
}
