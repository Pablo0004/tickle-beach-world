const L = require('./lib');
module.exports = async (pg, log) => {
  await L.closeMenu(pg);
  const n = () => pg.evaluate(() => document.querySelectorAll('#toasts .toast').length);
  await pg.evaluate(() => { document.getElementById('toasts').innerHTML = ''; App.toast('A dragon is attacking somewhere!'); });
  log('on: shown', await n());
  // click it away
  const box = await pg.evaluate(() => { const r = document.querySelector('#toasts .toast').getBoundingClientRect(); return { x: r.x + 10, y: r.y + r.height / 2 }; });
  await pg.mouse.click(box.x, box.y); await pg.waitForTimeout(300);
  log('after click', await n());
  // a Watch toast: clicking beside the button removes it, the button still works
  await pg.evaluate(() => { window._w = 0; App.toastAction('A party goes down', 'Watch', () => { window._w++; }); });
  const tb = await pg.evaluate(() => { const r = document.querySelector('#toasts .toast.act .btn').getBoundingClientRect(); return { x: r.x + 5, y: r.y + 5 }; });
  await pg.mouse.click(tb.x, tb.y); await pg.waitForTimeout(300);
  log('watch pressed', await pg.evaluate(() => window._w), 'left', await n());
  // switch off in Menu > Settings
  await pg.evaluate(() => App.showMenu('settings'));
  await pg.click('#set-notify'); await pg.click('#helpClose');
  await pg.waitForTimeout(1800);
  await pg.evaluate(() => { App.toast('Another event'); App.toastAction('Fight!', 'Watch', () => {}); });
  log('off: shown', await n(), 'pref', await pg.evaluate(() => App.notifyOn()));
  // what answers a key press still shows
  await pg.keyboard.press('KeyV'); await pg.waitForTimeout(200);
  log('after V with nobody picked', await pg.evaluate(() => [...document.querySelectorAll('#toasts .toast')].map(e => e.textContent)));
  // first person still works after zooming out
  await pg.evaluate(() => { App.cam.radius = 2000; });
  await pg.waitForTimeout(1500);
  const id = await pg.evaluate(() => App.st.tickles.find(t => t.group.visible).id);
  await pg.evaluate((id) => App.enterFP(id), id);
  await pg.waitForTimeout(2500);
  log('fp camera', JSON.stringify(await pg.evaluate(() => ({ near: App.camera.near, far: App.camera.far, fp: App.fpOn() }))));
  await L.shot(pg, 'fp_after_zoom.png');
  await pg.evaluate(() => App.exitFP());
};
