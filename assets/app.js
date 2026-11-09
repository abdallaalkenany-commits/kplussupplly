(function () {
  var K = window.KPLUS || {};
  var AR = document.documentElement.lang.indexOf('ar') === 0;
  var m = document.querySelector('.menu'), n = document.getElementById('nav');
  if (m && n) m.addEventListener('click', function () { var o = n.classList.toggle('open'); m.setAttribute('aria-expanded', o); });

  function api(path, opts) {
    opts = opts || {};
    var h = { apikey: K.key, Authorization: 'Bearer ' + K.key, 'Content-Type': 'application/json' };
    for (var k in (opts.headers || {})) h[k] = opts.headers[k];
    return fetch(K.url + '/rest/v1/' + path, { method: opts.method || 'GET', headers: h, body: opts.body });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function wa(text) { return 'https://wa.me/' + K.wa + '?text=' + encodeURIComponent(text); }
  function money(v) { return v == null ? '' : Number(v).toLocaleString(AR ? 'ar-EG' : 'en-EG') + (AR ? ' ج.م' : ' EGP'); }

  // ---------- quote form: save to CRM (if connected) + open WhatsApp ----------
  document.querySelectorAll('.qform').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.elements.website && f.elements.website.value) return; // bot trap
      var d = {}, lines = [f.dataset.msg];
      Array.prototype.forEach.call(f.elements, function (el) {
        if (!el.name || el.name === 'website') return;
        var v = (el.value || '').trim(); d[el.name] = v || null;
        if (v) lines.push((el.dataset.label || el.name) + ': ' + v);
      });
      var msg = f.querySelector('.fmsg');
      var win = window.open(wa(lines.join('\n')), '_blank', 'noopener');
      if (!K.url) { if (msg) msg.textContent = f.dataset.ok; return; }
      d.lang = AR ? 'ar' : 'en'; d.page = location.pathname;
      api('quote_requests', { method: 'POST', body: JSON.stringify(d), headers: { Prefer: 'return=minimal' } })
        .then(function (r) { if (msg) msg.textContent = r.ok ? f.dataset.ok : f.dataset.err; if (r.ok) f.reset(); })
        .catch(function () { if (msg) msg.textContent = f.dataset.err; });
      if (!win && msg) msg.textContent = f.dataset.ok;
    });
  });

  if (!K.url) return;

  // ---------- live products on category pages ----------
  var grid = document.querySelector('[data-products]');
  if (grid) {
    api('products?select=*&active=eq.true&category=eq.' + encodeURIComponent(grid.dataset.products) + '&order=sort,id')
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        if (!rows.length) return;
        grid.innerHTML = rows.map(function (p) {
          var name = AR ? p.name_ar : (p.name_en || p.name_ar), spec = AR ? p.spec_ar : (p.spec_en || p.spec_ar), unit = AR ? p.unit_ar : (p.unit_en || p.unit_ar);
          return '<article class="card prod">' + (p.image_url ? '<img class="pimg" src="' + esc(p.image_url) + '" alt="' + esc(name) + '" loading="lazy">' : '') +
            '<h3>' + esc(name) + '</h3><p>' + esc(spec) + '</p>' +
            (p.show_price && p.price != null ? '<p class="price">' + money(p.price) + (unit ? ' / ' + esc(unit) : '') + '</p>' : '') +
            '<div class="pfoot"><span class="unit">' + grid.dataset.unitLabel + ': ' + esc(unit) + '</span>' +
            '<a class="btn sm" href="' + wa(grid.dataset.msg + ' ' + name) + '" rel="noopener">' + grid.dataset.quote + '</a></div></article>';
        }).join('');
      }).catch(function () {});
  }

  // ---------- offers page ----------
  var off = document.querySelector('[data-offers]');
  if (off) {
    api('offers?select=*&order=sort,id.desc').then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
      if (!rows.length) return;
      off.innerHTML = rows.map(function (o) {
        var t = AR ? o.title_ar : (o.title_en || o.title_ar), b = AR ? o.body_ar : (o.body_en || o.body_ar), u = AR ? o.unit_ar : (o.unit_en || o.unit_ar);
        return '<article class="card offer">' + (o.image_url ? '<img class="pimg" src="' + esc(o.image_url) + '" alt="' + esc(t) + '" loading="lazy">' : '') +
          (o.discount_label ? '<span class="tag">' + esc(o.discount_label) + '</span>' : '') +
          '<h3>' + esc(t) + '</h3>' + (b ? '<p>' + esc(b) + '</p>' : '') +
          (o.new_price != null ? '<p class="price">' + (o.old_price != null ? '<s>' + money(o.old_price) + '</s> ' : '') + money(o.new_price) + (u ? ' / ' + esc(u) : '') + '</p>' : '') +
          (o.ends_on ? '<p class="unit">' + off.dataset.until + ' ' + esc(o.ends_on) + '</p>' : '') +
          '<a class="btn sm" href="' + wa(off.dataset.msg + ' ' + t) + '" rel="noopener">' + off.dataset.quote + '</a></article>';
      }).join('');
    }).catch(function () {});
  }

  // ---------- category icons/images from dashboard ----------
  var cats = document.querySelectorAll('[data-cat]');
  if (cats.length) {
    api('categories?select=slug,image_url,icon_url').then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
      var map = {}; rows.forEach(function (c) { map[c.slug] = c; });
      cats.forEach(function (el) {
        var c = map[el.dataset.cat]; if (!c) return;
        var ic = el.querySelector('.ic');
        if (c.icon_url && ic) ic.innerHTML = '<img src="' + esc(c.icon_url) + '" alt="" width="40" height="40">';
        if (c.image_url && !el.querySelector('.cimg')) el.insertAdjacentHTML('afterbegin', '<img class="cimg" src="' + esc(c.image_url) + '" alt="" loading="lazy">');
      });
    }).catch(function () {});
  }
})();
