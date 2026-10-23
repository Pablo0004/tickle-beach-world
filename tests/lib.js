exports.closeMenu = async (pg) => { await pg.evaluate(() => { for (const b of document.querySelectorAll('button')) if (b.textContent.trim() === 'Close' && b.offsetParent) b.click(); }); };
exports.look = async (pg, x, z, radius, theta, phi, wait = 9000) => {
  await pg.evaluate(([x, z, radius, theta, phi]) => { const c = App.cam; c.follow = null; c.fly = null; c.target.set(x, App.genHeight ? App.genHeight(x, z) : 0, z); c.radius = radius; if (theta != null) c.theta = theta; if (phi != null) c.phi = phi; }, [x, z, radius, theta, phi]);
  await pg.waitForTimeout(wait);
};
exports.shot = async (pg, name) => { await pg.screenshot({ path: name, timeout: 180000 }); };
exports.noClouds = async (pg) => { await pg.evaluate(() => { for (const o of App.scene.children) if (o.isInstancedMesh && o.material && o.material.opacity === 0.8) o.visible = false; }); };
exports.hidePanels = async (pg) => { await pg.addStyleTag({ content: '#panel,#topbar,#mapbox,#dock,#toasts{display:none!important}' }); };
