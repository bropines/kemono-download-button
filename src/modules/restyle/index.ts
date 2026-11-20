import type { KdlModule, ModuleContext } from '../../core/types';
import { getModuleSetting, onRegistryChange } from '../../core/registry';
import { applyThemeStyles, removeThemeStyles, stopAllThemeScripts, syncThemeScripts } from './apply';
import { getEnabledThemes, onThemesChange } from './store';
import { syncTransforms, undoAllTransforms } from './transforms';
import '../../ui/settings/sections/themes';

export const RESTYLE_ID = 'restyle';

let activeCtx: ModuleContext | null = null;
let snapshotTimer = 0;

function allowScripts(): boolean {
  return getModuleSetting<boolean>(RESTYLE_ID, 'allowScripts') === true;
}

/** Styles + DOM transforms + scripts for the current page */
function sync(ctx: ModuleContext): void {
  const themes = getEnabledThemes();
  applyThemeStyles(themes);
  syncTransforms(themes, ctx.page, ctx.site);
  syncThemeScripts(themes, allowScripts(), ctx.page, ctx.site, ctx.root);
}

function teardown(): void {
  clearTimeout(snapshotTimer);
  undoAllTransforms();
  stopAllThemeScripts();
  removeThemeStyles();
}

export const restyleModule: KdlModule = {
  id: RESTYLE_ID,
  name: 'Themes & restyle',
  description: 'User themes: CSS, colour variables and declarative layout transforms, plus built-in presets. Edit them in Settings → Themes.',
  group: 'Interface',
  pages: 'any',
  defaultEnabled: true,
  settings: [
    {
      key: 'allowScripts',
      label: 'Allow theme scripts',
      type: 'boolean',
      default: false,
      hint: 'Runs the script field of themes created in this browser. Imported themes never carry scripts.',
    },
  ],
  after: ['core'],
  // CSS can be applied before the DOM is ready; transforms and scripts still wait for mount.
  early() {
    applyThemeStyles(getEnabledThemes());
  },
  setup() {
    // Permanent: edits in the Themes tab and other modules' style injections
    onThemesChange(() => activeCtx && sync(activeCtx));
    onRegistryChange((event) => {
      if (!activeCtx) return;
      if (event.type === 'setting' && event.id === RESTYLE_ID) sync(activeCtx);
      // Another module's <style> may have landed after ours: keep the themes last
      else if (event.type === 'enabled' || event.type === 'mounted') applyThemeStyles(getEnabledThemes());
    });
  },
  mount(ctx) {
    activeCtx = ctx;
    sync(ctx);
    ctx.onCleanup(() => {
      activeCtx = null;
      teardown();
    });
  },
  update(ctx) {
    sync(ctx);
  },
  beforeSnapshot() {
    // htmx clones the DOM synchronously after this hook; put the changes back right after
    undoAllTransforms();
    clearTimeout(snapshotTimer);
    snapshotTimer = window.setTimeout(() => activeCtx && syncTransforms(getEnabledThemes(), activeCtx.page, activeCtx.site), 0);
  },
};
