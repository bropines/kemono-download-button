/*
 * Kemono DL smoke test. Paste into DevTools on a kemono / coomer / pawchive page where the userscript runs,
 * then call one of:
 *
 *   await kdlSmoke()                    checks for the current page
 *   await kdlSmoke({ modules: true })   also switches every module off and on again from the Modules tab
 *   await kdlSmoke({ download: 'zip' }) also clicks a download button on a post page ('zip' | 'images' | 'attachments' | 'links')
 *   await kdlSmoke({ bulk: true })      on a creator page: ticks two posts, checks the dock bar, unticks them
 *
 * Run it on a post page, a creator page and /posts. It only reads the DOM and the site's public API,
 * and the download option starts a real download in your browser.
 */
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const kit = () => $('#kdl-root')?.shadowRoot || null;

  async function waitFor(fn, timeout = 8000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await sleep(150);
    }
    return null;
  }

  function buttonByText(text, root = document) {
    return $$('button, a', root).find((b) => b.textContent.trim() === text) || null;
  }

  async function openSettings(tab) {
    const link = $('#kdl-settings-btn-sidebar') || $('#kdl-settings-btn-header');
    if (!link) return null;
    link.click();
    const dialog = await waitFor(() => kit()?.querySelector('[role=dialog]'));
    if (!dialog) return null;
    if (tab) {
      const t = $$('[role=tab]', dialog).find((x) => x.textContent.trim() === tab);
      if (!t) return null;
      t.click();
      await sleep(300);
    }
    return dialog;
  }

  function closeSettings() {
    kit()?.querySelector('[role=dialog] .kdl-ui-dialog__close')?.click();
  }

  window.kdlSmoke = async function kdlSmoke(opts = {}) {
    const results = [];
    const errors = [];
    const onError = (e) => errors.push(String(e.message || e.reason?.message || e.reason));
    addEventListener('error', onError);
    addEventListener('unhandledrejection', onError);
    const check = (name, ok, info = '') => results.push({ check: name, result: ok ? 'PASS' : 'FAIL', info: String(info) });
    const note = (name, info) => results.push({ check: name, result: 'INFO', info: String(info) });

    try {
      const html = document.documentElement;
      const page = html.dataset.kdlPage;
      const site = html.dataset.kdlSite;
      check('script started (html[data-kdl-page])', !!page, `page=${page} site=${site}`);
      check('kit root with shadow DOM', !!kit(), kit() ? `${kit().childElementCount} children` : 'missing #kdl-root');
      check('floating controls', !!(kit()?.getElementById('kdl-fixed-controls') || $('#kdl-fixed-controls')));
      check('settings link', !!($('#kdl-settings-btn-sidebar') || $('#kdl-settings-btn-header')));
      note('shadcn site theme', (html.dataset.kdlUi || '').includes('shadcn') ? 'on' : 'off');
      note('theme styles', $$('style[id^="kdl-theme"]').map((s) => s.id).join(', ') || 'none');

      if (page === 'post') {
        const box = await waitFor(() => $('.kdl-actions-container'));
        check('post download buttons', !!box);
        const labels = box ? $$('button', box).map((b) => b.textContent.trim()) : [];
        note('post buttons', labels.join(' | '));
        const m = location.pathname.match(/\/([^/]+)\/user\/([^/]+)\/post\/([^/?#]+)/);
        if (m) {
          try {
            const r = await fetch(`/api/v1/${m[1]}/user/${m[2]}/post/${m[3]}`, { headers: { Accept: 'text/css' } });
            const data = r.ok ? await r.json() : null;
            const post = data?.post || data;
            check('post API reachable', r.ok, `HTTP ${r.status}, ${(post?.attachments?.length || 0) + (post?.file?.path ? 1 : 0)} files`);
          } catch (e) {
            check('post API reachable', false, e.message);
          }
        }
        if (opts.download && box) {
          const text = { zip: 'Download (ZIP)', images: 'Download Images', attachments: 'Download Attachments', links: 'Copy Links' }[opts.download];
          const btn = buttonByText(text, box);
          check(`"${text}" button present`, !!btn);
          if (btn) {
            btn.click();
            const started = await waitFor(
              () => btn.hasAttribute('data-loading') || btn.disabled || kit()?.querySelector('.kdl-ov-dock__slot[data-slot="progress"] *, .kdl-ov-dock__slot[data-slot="queue"] *, .kdl-ui-toast'),
              6000
            );
            check(`"${text}" started`, !!started, 'watch the progress panel and your downloads');
            if (opts.download !== 'links') {
              const done = await waitFor(() => !btn.hasAttribute('data-loading') && !btn.disabled, 180000);
              check(`"${text}" finished`, !!done, done ? 'button released' : 'still busy after 3 min');
            }
          }
        }
      }

      if (page === 'creator' || page === 'list' || page === 'search') {
        const cards = $$('article.post-card');
        await waitFor(() => !cards.length || $('.post-card-download-controls'));
        note('post cards', cards.length);
        check('card download controls', !cards.length || $$('.post-card-download-controls').length > 0, `${$$('.post-card-download-controls').length}/${cards.length}`);
        if (page === 'creator') {
          const boxes = $$('.kdl-post-checkbox');
          check('selection checkboxes', boxes.length > 0, `${boxes.length}/${cards.length}`);
          if (opts.bulk && boxes.length >= 2) {
            boxes.slice(0, 2).forEach((b) => b.click());
            const bar = await waitFor(() => kit()?.querySelector('.kdl-ov-bulkbar[data-state="open"]'), 3000);
            check('bulk bar opens on selection', !!bar, bar ? bar.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : '');
            boxes.slice(0, 2).forEach((b) => b.checked && b.click());
            const closed = await waitFor(() => kit()?.querySelector('.kdl-ov-bulkbar[data-state="closed"]'), 3000);
            check('bulk bar closes when cleared', !!closed);
          }
        }
      }

      const dialog = await openSettings('Modules');
      check('settings dialog + Modules tab', !!dialog);
      if (dialog) {
        const modules = $$('[data-module]', dialog);
        note('modules', modules.map((m) => `${m.dataset.module}:${m.dataset.state}`).join(' '));
        if (opts.modules) {
          for (const card of modules) {
            const sw = $('[role=switch]', card);
            if (!sw || sw.disabled || sw.getAttribute('aria-disabled') === 'true') continue;
            const before = errors.length;
            sw.click();
            await sleep(400);
            sw.click();
            await sleep(400);
            check(`toggle ${card.dataset.module}`, errors.length === before && card.dataset.state === (sw.getAttribute('aria-checked') === 'true' ? 'on' : 'off'), `state=${card.dataset.state}`);
          }
        }
        closeSettings();
      }
    } finally {
      removeEventListener('error', onError);
      removeEventListener('unhandledrejection', onError);
    }

    check('no page errors during the test', errors.length === 0, errors.slice(0, 3).join(' / '));
    console.table(results);
    const failed = results.filter((r) => r.result === 'FAIL').length;
    console.log(failed ? `%c${failed} check(s) failed` : '%call checks passed', `font-weight:bold;color:${failed ? '#ef4444' : '#22c55e'}`);
    return results;
  };
  console.log('kdlSmoke ready: await kdlSmoke({ modules: true, bulk: true, download: "zip" })');
})();
