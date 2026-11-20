import type { KdlModule } from '../../core/types';

// HTMX clones synchronously after beforeSnapshot. Restore the live page on the next task,
// unless the module was unmounted or navigation has already changed the page.
export function reversibleTransform(apply: () => void, revert: () => void): Pick<KdlModule, 'mount' | 'update' | 'unmount' | 'beforeSnapshot'> {
  let active = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    mount() { active = true; apply(); },
    update: apply,
    unmount() { active = false; clearTimeout(timer); revert(); },
    beforeSnapshot() {
      clearTimeout(timer);
      const path = location.pathname;
      revert();
      timer = setTimeout(() => { if (active && location.pathname === path) apply(); }, 0);
    },
  };
}
