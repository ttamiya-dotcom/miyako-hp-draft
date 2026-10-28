/* みやこキャピタル コーポレートサイト 動きの仕掛け（v2.0）
   外部の部品は使わない。html に ix の印が無いとき（視差効果を減らす設定）は、動かす仕掛けは働かせず最後の形で見せる。
   1. ページの切り替わりの幕   2. 読み進めた分の線・ヘッダー   3. ページ見出しの写真と英字の視差
   4. 投資領域の帯             5. ホーム: 画面いっぱいの言葉 / ロゴが集まって MIYAKO に / ご案内の写真
   6. 会社概要: 文が濃くなる・拠点の時刻・研究から次の産業への1本の線
   7. チーム: 写真の傾き        8. 投資先: 絞り込みと表示の切り替え */
(function () {
  var root = document.documentElement, IX = root.classList.contains('ix');
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  var hh = null;  // ヘッダーの高さ（毎回読み直すと重いので、幅が変わったときだけ読み直す）
  function HH() { if (hh === null) hh = parseFloat(getComputedStyle(root).getPropertyValue('--hh')) || 0; return hh; }
  addEventListener('resize', function () { hh = null; });
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return [].slice.call((el || document).querySelectorAll(s)); }
  var onScrolls = [];
  function tick() { onScrolls.forEach(function (f) { f(); }); }
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick);

  /* 1. ページの切り替わり: サイト内のリンクを押すと藍の幕が下りてから移る */
  if (IX) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:|\/\/)/i.test(href)) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.hash) return;
      e.preventDefault();
      root.classList.add('leaving');
      setTimeout(function () { location.href = a.href; }, 380);
    });
    addEventListener('pageshow', function () { root.classList.remove('leaving'); });
  }

  /* 2. 読み進めた分の線と、ヘッダーの細さ */
  var bar = $('.progress span');
  onScrolls.push(function () {
    var h = root.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty('--p', h > 0 ? clamp(scrollY / h).toFixed(4) : 0);
    root.classList.toggle('scrolled', scrollY > 40);
  });

  /* 3. ページ見出し: 写真はゆっくり、英字は横へずれる */
  var phImg = $('.ph-img'), phRow = $('.ph-word .row');
  if (IX && phImg) onScrolls.push(function () {
    var y = Math.min(scrollY, innerHeight * 1.2);
    phImg.style.setProperty('--py', (y * 0.35).toFixed(1) + 'px');
    if (phRow) phRow.style.setProperty('--sx', (-y * 0.22).toFixed(1) + 'px');
  });

  /* 4. 投資領域の帯: いつも少しずつ流れ、スクロールの速さで勢いが増す */
  $$('.marquee').forEach(function (m) {
    if (!IX) return;
    var track = $('.track', m), set = $('.set', m), x = 0, v = 0, last = scrollY, live = false, t0 = 0;
    var dir = parseFloat(m.getAttribute('data-dir') || '-1');   // -1 は左へ、1 は右へ流れる
    function frame(t) {
      var dt = t0 ? Math.min(64, t - t0) : 16; t0 = t;
      var d = scrollY - last; last = scrollY; v = v * 0.9 + d * 0.6;
      x += dir * ((40 * dt / 1000) + Math.abs(v) * 0.25);
      var w = set.offsetWidth;
      if (w && x <= -w) x += w;
      if (w && x > 0) x -= w;
      track.style.setProperty('--mx', x.toFixed(1) + 'px');
      if (live) requestAnimationFrame(frame); else t0 = 0;
    }
    new IntersectionObserver(function (es) { live = es[0].isIntersecting; if (live) requestAnimationFrame(frame); }).observe(m);
  });

  /* 5-1. ホーム: 「アカデミアの知を、」の文字の中に時計台。スクロールで文字が手前へ飛び抜け、2行目が立ち上がる */
  var op = $('#opener');
  if (op && IX) {
    var stage = $('.stage', op), p1 = $('.p1', op), full = $('.full', op), chars = $$('.p2 i', op), lead = $('.l2', op);
    var fades = [$('.e0', op), $('.hint', op)];
    var out = function (v) { return 1 - Math.pow(1 - v, 3); };
    // マウスの位置に合わせて、大きな文字が少し向きを変える
    var tilt = { x: 0, y: 0 }, upd;
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      tilt.x = ((e.clientX - r.left) / r.width - .5) * 14; tilt.y = -((e.clientY - r.top) / r.height - .5) * 10; upd();
    });
    stage.addEventListener('mouseleave', function () { tilt.x = 0; tilt.y = 0; upd(); });
    onScrolls.push(upd = function () {
      var r = op.getBoundingClientRect(), p = clamp((HH() - r.top) / (op.offsetHeight - stage.offsetHeight));
      var z = Math.pow(clamp((p - .06) / .38), 3);
      p1.style.transform = 'perspective(1400px) rotateX(' + tilt.y.toFixed(2) + 'deg) rotateY(' + tilt.x.toFixed(2) + 'deg) scale(' + (1 + z * 11).toFixed(3) + ')';
      p1.style.opacity = (1 - clamp((p - .32) / .12)).toFixed(3);
      var f = clamp((p - .2) / .2);
      full.style.opacity = f.toFixed(3);
      full.style.transform = 'scale(' + (1.25 - .25 * out(f)).toFixed(3) + ')';
      fades.forEach(function (el) { if (el) el.style.opacity = 1 - clamp(p / .05); });
      chars.forEach(function (c, i) {
        var t = out(clamp((p - .46 - i * (.3 / Math.max(chars.length, 6))) / .1));
        c.style.opacity = t.toFixed(3);
        c.style.transform = 'translateY(' + ((1 - t) * 45).toFixed(1) + '%)';
      });
      lead.style.opacity = clamp((p - .72) / .08).toFixed(3);
    });
  }

  /* 5-2. ホーム: 投資先のロゴが漂い、集まって MIYAKO の文字になり、並んで一覧になる */
  var ga = $('#gather');
  if (ga && IX) (function () {
    var stage = $('.stage', ga), tiles = $$('.t', ga), c0 = $('.c0', ga), c1 = $('.c1', ga), c2 = $('.c2', ga);
    var FONT = {
      M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X'], I: ['X', 'X', 'X', 'X', 'X'],
      Y: ['X...X', '.X.X.', '..X..', '..X..', '..X..'], A: ['.XXX.', 'X...X', 'XXXXX', 'X...X', 'X...X'],
      K: ['X...X', 'X..X.', 'XXX..', 'X..X.', 'X...X'], O: ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.']
    };  // 6文字で 62 マス（投資先のロゴの数と同じ）
    function rng(s) { return function () { s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function ease(v) { return v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    var S = [], T = 0;
    function layout() {
      var W = stage.clientWidth, H = stage.clientHeight, n = tiles.length, R = rng(7);
      var cols = W >= 1000 ? 8 : W >= 700 ? 6 : 5, rows = Math.ceil(n / cols);
      var top = c2.offsetHeight + 40, availH = H - top - 24, availW = Math.min(W - 32, 1100);
      var px = Math.min(availW / cols, availH / (rows * 0.51)), gw = px * 0.9, gh = gw / 2.2, py = gh + px * 0.1;
      var gridTop = top + Math.min((availH - rows * py) / 2, 24);
      var lines = W >= 820 ? ['MIYAKO'] : ['MIY', 'AKO'], cells = [], maxc = 0, gap = 1.5;
      lines.forEach(function (w, li) {
        var x = 0;
        w.split('').forEach(function (ch, k) {
          var g = FONT[ch];
          g.forEach(function (row, r) { row.split('').forEach(function (c, cc) { if (c === 'X') cells.push([x + cc, li * (5 + gap) + r, li]); }); });
          x += g[0].length + (k < w.length - 1 ? 1 : 0);
        });
        maxc = Math.max(maxc, x);
        cells.forEach(function (c) { if (c[2] === li) c.push(x); });
      });
      var rowsT = lines.length * 5 + (lines.length - 1) * gap;
      var pitch = Math.min(W * 0.9 / maxc, H * 0.56 / rowsT), cs = pitch * 0.9;
      var wy = H * 0.42 - rowsT * pitch / 2;
      c1.style.top = (wy + rowsT * pitch + Math.max(24, pitch * .8)) + 'px';
      var perm = cells.map(function (c, i) { return i; });
      for (var i = perm.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
      var r0 = c0.getBoundingClientRect(), rs = stage.getBoundingClientRect();
      var bx0 = Math.max(r0.left - rs.left, W * 0.5 - 380) - 30, bx1 = Math.min(r0.right - rs.left, W * 0.5 + 380) + 30;
      var by0 = r0.top - rs.top - 30, by1 = r0.bottom - rs.top + 30;
      S = tiles.map(function (el, i) {
        var c = cells[perm[i]] || cells[i % cells.length], lineW = c[3];
        var x0, y0, k = 0, sc = 0.55 + R() * 0.6;
        do { x0 = W * (0.03 + R() * 0.94); y0 = H * (0.05 + R() * 0.9); k++; }
        while (k < 40 && x0 > bx0 - gw * sc / 2 && x0 < bx1 + gw * sc / 2 && y0 > by0 - gh * sc / 2 && y0 < by1 + gh * sc / 2);
        var gi = i % cols, gr = Math.floor(i / cols), inRow = Math.min(cols, n - gr * cols);
        return {
          a: { x: x0, y: y0, w: gw * sc, h: gh * sc, r: (R() - .5) * 34, o: .35 + R() * .55 },
          b: { x: W / 2 + (c[0] - lineW / 2 + .5) * pitch, y: wy + (c[1] + .5) * pitch, w: cs, h: cs },
          c: { x: W / 2 + (gi - inRow / 2 + .5) * px, y: gridTop + (gr + .5) * py, w: gw, h: gh },
          d: R() * 0.1, ph: R() * 6.28, sp: .4 + R() * .6, img: el.querySelector('img'), dd: i * 16 + R() * 200
        };
      });
      update();
    }
    var drop0 = 0;   // ロゴが上から降ってきて弾む（見え始めたときに一度だけ）
    function bounce(t) { var n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; }
    function update() {
      var r = ga.getBoundingClientRect(), p = clamp((HH() - r.top) / (ga.offsetHeight - stage.offsetHeight));
      var now = performance.now(), W = stage.clientWidth;
      if (!drop0 && r.top < innerHeight * .8) drop0 = now;
      var wave = ((now / 2600) % 1) * (W + 400) - 200;   // 文字の上を金の光が横切る
      tiles.forEach(function (el, i) {
        var s = S[i]; if (!s) return;
        var a = ease(clamp((p - .10 - s.d) / .26)), b = ease(clamp((p - .56 - s.d) / .24));
        var drift = (1 - a) * 14, t = T / 1000 * s.sp + s.ph;
        var x = lerp(lerp(s.a.x + Math.sin(t) * drift, s.b.x, a), s.c.x, b);
        var fall = drop0 ? (1 - bounce(clamp((now - drop0 - s.dd) / 1100))) * -(s.a.y + 90) : -(s.a.y + 90);
        var y = lerp(lerp(s.a.y + fall + Math.cos(t * .8) * drift, s.b.y, a), s.c.y, b);
        var w = lerp(lerp(s.a.w, s.b.w, a), s.c.w, b), h = lerp(lerp(s.a.h, s.b.h, a), s.c.h, b);
        var m = a * (1 - b);  // 文字になっている間は藍のマス（ロゴは乗算で藍に沈む）
        el.style.width = w.toFixed(1) + 'px'; el.style.height = h.toFixed(1) + 'px';
        el.style.opacity = lerp(s.a.o, 1, a).toFixed(3);
        var gl = m * Math.max(0, 1 - Math.abs(x - wave) / 150);
        el.style.background = 'rgb(' + Math.round(lerp(lerp(255, 46, m), 214, gl)) + ',' + Math.round(lerp(lerp(255, 74, m), 172, gl)) + ',' + Math.round(lerp(lerp(255, 125, m), 84, gl)) + ')';
        el.style.borderColor = m > .5 ? 'transparent' : '';
        s.img.style.opacity = (1 - .5 * m).toFixed(2);
        el.style.transform = 'translate(' + (x - w / 2).toFixed(1) + 'px,' + (y - h / 2).toFixed(1) + 'px) rotate(' + lerp(s.a.r, 0, a).toFixed(1) + 'deg)';
      });
      c0.style.opacity = 1 - clamp((p - .03) / .1);
      c1.style.opacity = clamp((p - .38) / .06) * (1 - clamp((p - .52) / .05));
      var o2 = clamp((p - .76) / .08);
      c2.style.opacity = o2; c2.style.visibility = o2 ? 'visible' : 'hidden';  // 見えない間は Tab で止まらない
    }
    var live = false;
    function frame(t) { T = t; update(); if (live) requestAnimationFrame(frame); }
    new IntersectionObserver(function (es) { live = es[0].isIntersecting; if (live) requestAnimationFrame(frame); }).observe(ga);
    onScrolls.push(update);
    addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    layout();
  })();

  /* 5-3. ホーム: ご案内に触れると、そのページの写真がカーソルについてくる */
  var peekLinks = $$('[data-peek]');
  if (peekLinks.length && IX && matchMedia('(hover: hover)').matches) {
    var pk = document.createElement('div'); pk.className = 'peek'; pk.setAttribute('aria-hidden', 'true'); document.body.appendChild(pk);
    peekLinks.forEach(function (a) {
      a.addEventListener('mouseenter', function () { pk.style.backgroundImage = 'url(' + a.getAttribute('data-peek') + ')'; pk.classList.add('on'); });
      a.addEventListener('mouseleave', function () { pk.classList.remove('on'); });
      a.addEventListener('mousemove', function (e) { pk.style.left = e.clientX + 'px'; pk.style.top = e.clientY + 'px'; });
    });
  }

  /* 6-1. 会社概要: 方針の文が、読み進めるにつれて濃くなる */
  $$('[data-scrub]').forEach(function (el) {
    if (!IX) return;
    var ws = $$('.w', el);
    onScrolls.push(function () {
      var r = el.getBoundingClientRect();
      var p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35));
      var k = Math.round(p * ws.length);
      ws.forEach(function (w, i) { w.classList.toggle('on', i < k); });
    });
  });

  /* 6-2. 拠点の現地時刻 */
  var clocks = $$('[data-tz]');
  if (clocks.length && window.Intl) {
    var draw = function () {
      clocks.forEach(function (c) {
        var tz = c.getAttribute('data-tz'), now = new Date();
        var hm = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
        var zone = c.getAttribute('data-zone') || (new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
          .formatToParts(now).filter(function (x) { return x.type === 'timeZoneName'; }).map(function (x) { return x.value; })[0] || '');
        c.innerHTML = '<span class="dot" aria-hidden="true"></span><span>' + hm + '</span><small>' + zone + '</small><small>' + c.getAttribute('data-label') + '</small>';
      });
    };
    draw(); setInterval(draw, 20000);
  }

  /* 6-3. 研究から次の産業への1本の線: 読む位置（画面の6割の高さ）まで伸びる。成長支援で3つに分かれ、最後は IPO・M&A の会社へ枝分かれする */
  var route = $('#route');
  if (route) (function () {
    var NS = 'http://www.w3.org/2000/svg', svg = $('.lines', route), tip = $('.tip', route);
    var sts = $$('.st', route), brs = $$('.br', route), lgs = $$('.lg', route), P = [], marks = [];
    function box(el) { var r = el.getBoundingClientRect(), s = route.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; }
    function add(d, thin, target) {
      var b = document.createElementNS(NS, 'path'); b.setAttribute('d', d); b.setAttribute('class', 'base'); svg.appendChild(b);
      var k = document.createElementNS(NS, 'path'); k.setAttribute('d', d); k.setAttribute('class', 'ink' + (thin ? ' thin' : '')); svg.appendChild(k);
      var L = k.getTotalLength(), samp = [];
      for (var i = 0; i <= 120; i++) { var q = k.getPointAtLength(L * i / 120); samp.push([L * i / 120, q.y, q.x]); }
      k.style.strokeDasharray = L + ' ' + L;
      P.push({ el: k, L: L, s: samp, target: target });
    }
    function layout() {
      svg.innerHTML = ''; P = [];
      // 線の色: 藍から始まり、最後（次の産業へ）で金に変わる
      var H0 = route.offsetHeight, g = document.createElementNS(NS, 'linearGradient');
      g.setAttribute('id', 'inkgrad'); g.setAttribute('gradientUnits', 'userSpaceOnUse');
      g.setAttribute('x1', 0); g.setAttribute('y1', 0); g.setAttribute('x2', 0); g.setAttribute('y2', H0);
      [['0', '#2E4A7D'], ['.7', '#2E4A7D'], ['1', '#C9A046']].forEach(function (st) {
        var e = document.createElementNS(NS, 'stop'); e.setAttribute('offset', st[0]); e.setAttribute('stop-color', st[1]); g.appendChild(e);
      });
      var defs = document.createElementNS(NS, 'defs'); defs.appendChild(g); svg.appendChild(defs);
      var W = route.clientWidth, H = route.offsetHeight, narrow = innerWidth <= 860;  // CSS の max-width:860px と同じ物差し
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var cx = narrow ? box(sts[0]).x + 13 : W / 2;   // 狭い幅では、各節目の丸（左端から 2px + 半径 11px）に幹を通す
      var ex = box($('.exits', route)), yf = ex.y - (narrow ? 12 : 56);
      marks = sts.map(function (st) { return { el: st, y: box(st).y + (narrow ? 17 : st.classList.contains('mid') ? 9 : 19) }; });
      add('M' + cx + ',0 L' + cx + ',' + yf, false, null);
      if (!narrow) {
        var t = box($('.tri', route)), y0 = t.y - 64, y1 = t.y + t.h + 40;
        [0, 2].forEach(function (k) {
          var b = box(brs[k]), x = b.x + b.w / 2, top = b.y, bot = b.y + b.h;
          add('M' + cx + ',' + y0 + ' C' + cx + ',' + (y0 + 40) + ' ' + x + ',' + (top - 40) + ' ' + x + ',' + top +
              ' L' + x + ',' + bot + ' C' + x + ',' + (bot + 30) + ' ' + cx + ',' + (y1 - 30) + ' ' + cx + ',' + y1, true, null);
        });
      }
      brs.forEach(function (b) { marks.push({ el: b, y: box(b).y + (narrow ? 20 : 0) }); });
      lgs.forEach(function (lg) {
        var b = box(lg), d, my = b.y + b.h / 2;
        if (narrow) d = 'M' + cx + ',' + yf + ' L' + cx + ',' + (my - 24) + ' C' + cx + ',' + my + ' ' + cx + ',' + my + ' ' + b.x + ',' + my;
        else d = 'M' + cx + ',' + yf + ' C' + cx + ',' + (yf + 50) + ' ' + (b.x + b.w / 2) + ',' + (b.y - 60) + ' ' + (b.x + b.w / 2) + ',' + b.y;
        add(d, true, lg);
      });
      update();
    }
    function update() {
      var s = route.getBoundingClientRect(), head = IX ? innerHeight * 0.62 - s.top : 1e9;
      P.forEach(function (p, i) {
        var len = 0;
        for (var j = 0; j < p.s.length; j++) { if (p.s[j][1] <= head) len = p.s[j][0]; else break; }
        p.el.style.strokeDashoffset = (p.L - len).toFixed(1);
        if (p.target) p.target.classList.toggle('on', len >= p.L - 1);
        if (i === 0) {
          var pt = p.s[Math.min(p.s.length - 1, Math.round(len / p.L * 120))];
          tip.style.opacity = IX && len > 2 && len < p.L - 2 ? 1 : 0;
          tip.style.transform = 'translate(' + pt[2].toFixed(1) + 'px,' + pt[1].toFixed(1) + 'px)';
        }
      });
      marks.forEach(function (m) { m.el.classList.toggle('on', head >= m.y); });
    }
    onScrolls.push(update);
    addEventListener('resize', layout);
    addEventListener('load', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    layout();
  })();

  /* 7. チーム: 写真がカーソルの方へ少し傾く */
  if (IX && matchMedia('(hover: hover)').matches) $$('.team-grid .card').forEach(function (c) {
    var ph = $('.ph', c);
    c.addEventListener('mousemove', function (e) {
      var r = ph.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      ph.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg'); ph.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
    });
    c.addEventListener('mouseleave', function () { ph.style.setProperty('--ry', '0deg'); ph.style.setProperty('--rx', '0deg'); });
  });

  /* 8. 投資先: IPO・M&A・EXIT で絞り込み、ロゴと社名の表示を切り替える（並び替えは動きでつなぐ） */
  var tools = $('.pf-tools'), grid = $('.logos');
  if (tools && grid) (function () {
    var items = $$('li', grid);
    function flip(change) {
      var first = new Map();
      if (IX && grid.animate) items.forEach(function (li) { if (!li.classList.contains('hide')) first.set(li, li.getBoundingClientRect()); });
      change();
      if (!(IX && grid.animate)) return;
      items.forEach(function (li, i) {
        if (li.classList.contains('hide')) return;
        var a = first.get(li), b = li.getBoundingClientRect();
        if (a) {
          var dx = a.left - b.left, dy = a.top - b.top;
          if (dx || dy) li.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 550, easing: 'cubic-bezier(.2,.7,.2,1)' });
        } else {
          li.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: Math.min(i, 20) * 12, easing: 'ease-out', fill: 'backwards' });
        }
      });
    }
    $$('[data-f]', tools).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-f');
        $$('[data-f]', tools).forEach(function (b) { b.setAttribute('aria-pressed', b === btn); });
        flip(function () { items.forEach(function (li) { li.classList.toggle('hide', f !== 'all' && li.getAttribute('data-mark') !== f); }); });
      });
    });
    $$('[data-v]', tools).forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('[data-v]', tools).forEach(function (b) { b.setAttribute('aria-pressed', b === btn); });
        grid.classList.toggle('as-list', btn.getAttribute('data-v') === 'list');
        if (IX && grid.animate) grid.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'ease-out' });
      });
    });
  })();


  /* 9. スクロールの勢い（速さ）で、大きな文字を傾ける。止まると元に戻る */
  if (IX) (function () {
    var last = scrollY, sk = 0, running = false;
    var targets = $$('.ph-word .row,.wordmark,.entries .en,.fund2 .amt');   // 傾ける要素にだけ値を書く（ページ全体を計算し直さない）
    function put(v) { targets.forEach(function (el) { el.style.setProperty('--skew', v); }); }
    function frame() {
      var v = scrollY - last; last = scrollY;
      sk += (Math.max(-7, Math.min(7, v * 0.12)) - sk) * 0.18;
      put(sk.toFixed(2) + 'deg');
      if (Math.abs(sk) > 0.02 || v) requestAnimationFrame(frame); else { running = false; put('0deg'); }
    }
    addEventListener('scroll', function () { if (!running) { running = true; requestAnimationFrame(frame); } }, { passive: true });
  })();

  /* 10. カーソル: 点がすぐ追い、輪が遅れて追う。押せる所で膨らみ、行き先によって言葉を出す */
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var cur = $('.cursor');
  if (IX && fine && cur) (function () {
    var ring = $('.ring', cur), dot = $('.dot', cur), lab = $('.lab', cur);
    var mx = -100, my = -100, rx = -100, ry = -100, seen = false;
    var LABELS = [['.logos a', 'VISIT'], ['.team-grid .card,.acard', 'OPEN'], ['.entries a', 'VIEW'], ['.news a', 'READ'],
                  ['.mailcard', 'MAIL'], ['.extlink', 'OPEN'], ['.lg', ''], ['.gather .more', 'VIEW']];
    root.classList.add('cur');
    cur.style.opacity = 0;   // 最初にマウスが動くまでは出さない（画面の角に点が残らないように）
    var looping = false;
    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; rx = mx; ry = my; cur.style.opacity = 1; }
      if (!looping) { looping = true; requestAnimationFrame(loop); }
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      // 経歴を開いている間は、ふだんのカーソルに戻す（開いた画面の上には重ねられないため）
      root.classList.toggle('cur', !document.querySelector('dialog[open]'));
    });
    document.addEventListener('mouseover', function (e) {
      var t = e.target, label = '';
      for (var i = 0; i < LABELS.length; i++) { var el = t.closest && t.closest(LABELS[i][0]); if (el) { label = LABELS[i][1]; break; } }
      var press = t.closest && t.closest('a,button,label,[role=button],input[type=radio],input[type=checkbox]');
      cur.classList.toggle('label', !!label);
      cur.classList.toggle('hover', !label && !!press);
      lab.textContent = label;
    });
    addEventListener('mousedown', function () { cur.classList.add('down'); });
    addEventListener('mouseup', function () { cur.classList.remove('down'); });
    document.addEventListener('mouseleave', function () { cur.style.opacity = 0; });
    document.addEventListener('mouseenter', function () { cur.style.opacity = 1; });
    function loop() {   // 輪が追いついたら止める（止まっている間は描き直さない）
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
      if (Math.abs(mx - rx) + Math.abs(my - ry) > 0.3) requestAnimationFrame(loop); else looping = false;
    }
    // 経歴を開け閉めしたときも、すぐにふだんのカーソルと切り替える
    $$('dialog.bio').forEach(function (d) { d.addEventListener('close', function () { root.classList.add('cur'); }); });
    $$('[data-open]').forEach(function (b) { b.addEventListener('click', function () { root.classList.remove('cur'); }); });
  })();

  /* 11. 吸い付くボタン: カーソルが近づくと、ボタンが少しカーソルの方へ寄る */
  if (IX && fine) $$('.more,.seg button,nav.gnav a,.totop,.extlink,.pager a,.bio-nav button,.mailcard .arrow,.lang').forEach(function (el) {
    var box = el.classList.contains('arrow') ? el.closest('.mailcard') : el;
    box.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) * 0.3, y = (e.clientY - (r.top + r.height / 2)) * 0.4;
      el.style.transition = 'translate .15s ease-out'; el.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
    });
    box.addEventListener('mouseleave', function () { el.style.transition = 'translate .6s cubic-bezier(.2,.7,.2,1)'; el.style.translate = '0px 0px'; });
  });

  /* 12. 英字の見出しが、ばらばらの字から組み上がる（画面に入ったとき・メニューに触れたとき） */
  var GLYPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function scramble(el) {
    if (el._sc) return;
    var txt = el.getAttribute('data-txt') || el.textContent, n = 0, frames = 16;
    el.setAttribute('data-txt', txt); el._sc = true;
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', txt);
    (function step() {
      n++;
      var keep = Math.floor(txt.length * n / frames);
      el.textContent = txt.split('').map(function (c, i) {
        return i < keep || c === ' ' ? c : GLYPH.charAt(Math.floor(Math.random() * GLYPH.length));
      }).join('');
      if (n < frames) setTimeout(step, 34); else { el.textContent = txt; el._sc = false; }
    })();
  }
  if (IX) {
    var heads = $$('.head .en,.office2 .city,.st .no');
    var sio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { scramble(e.target); sio.unobserve(e.target); } }); }, { threshold: .6 });
    heads.forEach(function (h) { if (/^[A-Z0-9 ・&/.　]+$/.test(h.textContent.trim())) sio.observe(h); });
    if (fine) $$('nav.gnav a:not(.lang)').forEach(function (a) { a.addEventListener('mouseenter', function () { scramble(a); }); });
  }

  /* 13. ページ見出しの大きな英字: カーソルが近い字ほど持ち上がる */
  var word = $('.ph-word');
  if (IX && fine && word) (function () {
    var chs = $$('.ch', word), ph = word.closest('.ph');
    ph.addEventListener('mousemove', function (e) {
      chs.forEach(function (c) {
        var r = c.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2));
        var k = Math.max(0, 1 - d / 220);
        c.style.translate = '0 ' + (-k * 28).toFixed(1) + 'px';
        c.classList.toggle('near', k > .5);
      });
    });
    ph.addEventListener('mouseleave', function () { chs.forEach(function (c) { c.style.translate = '0 0'; c.classList.remove('near'); }); });
  })();

  /* 14. ファンドの総額: 数字がドラムのように回って止まる */
  var odos = $$('[data-odo]');
  if (odos.length && IX) (function () {
    odos.forEach(function (el) {
      var v = el.getAttribute('data-odo'), k = 0;
      // 数字は見えない文字で本文に残す（読み上げ・ページ内検索・印刷のため）。回るドラムは飾り
      el.innerHTML = '<span class="vh">' + v + '</span><span class="odo" aria-hidden="true">' + v.split('').map(function (c) {
        if (!/\d/.test(c)) return '<span>' + c + '</span>';
        var col = ''; for (var i = 0; i < 20; i++) col += '<b>' + (i % 10) + '</b>';
        // 止まる字と同じ幅にする（見えない字で幅を取り、回る列はその上に重ねる）
        return '<span class="d"><i class="sz">' + c + '</i><span class="s" data-n="' + c + '" style="--k:' + (k++) + '">' + col + '</span></span>';
      }).join('') + '</span>';
    });
    var oio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        $$('.s', e.target).forEach(function (s) { s.style.transform = 'translateY(-' + ((10 + parseInt(s.getAttribute('data-n'), 10)) * 1.3).toFixed(1) + 'em)'; });
        oio.unobserve(e.target);
      });
    }, { threshold: .4 });
    odos.forEach(function (el) { oio.observe(el); });
  })();

  /* 15. 幕開け（ホームを開いた最初の1回だけ）: 0 から 100 まで数えて、幕を上げる */
  if (root.classList.contains('intro')) (function () {
    var num = $('.loader .ld-num'), bar2 = $('.loader .ld-bar'), t0 = null, dur = 1900;
    try { sessionStorage.setItem('mc-intro', '1'); } catch (e) {}
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 2);
      num.textContent = Math.round(e * 100); bar2.style.setProperty('--lp', e.toFixed(3));
      if (p < 1) requestAnimationFrame(step); else setTimeout(done, 150);
    }
    var fired = false;
    function done() {
      if (fired) return; fired = true;
      root.classList.add('intro-done');
      if (window.__mcBurst) window.__mcBurst(innerWidth / 2, innerHeight * .55, 90);   // 幕が上がるとき、金の粉がはじける
    }
    requestAnimationFrame(step);
    setTimeout(done, dur + 600);   // 描画が止まる環境でも幕は必ず上がる
  })();

  /* 16. 回る円の文字: ゆっくり回り、スクロールすると速く回る */
  var badge = $('.badge svg');
  if (badge && IX) (function () {
    var a = 0, last = scrollY, vis = false;
    function loop() {
      var v = scrollY - last; last = scrollY;
      a += 0.15 + Math.abs(v) * 0.4;
      badge.style.setProperty('--rot', (a % 360).toFixed(1) + 'deg');
      if (vis) requestAnimationFrame(loop);
    }
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) requestAnimationFrame(loop); }).observe(badge);
  })();


  /* 17. 金の粉: カーソルの後ろにこぼれ、幕開けではじける（画面に重ねた1枚の描画面） */
  if (IX) (function () {
    var cv = document.createElement('canvas'); cv.className = 'glitter'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var c = cv.getContext('2d'), dpr = Math.min(1.5, window.devicePixelRatio || 1), ps = [], run = false, last = 0, lx = -1, ly = -1;
    function size() { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
    size(); addEventListener('resize', size);
    function add(x, y, vx, vy, life) {
      ps.push({ x: x, y: y, vx: vx, vy: vy, t: 0, life: life, r: 1.2 + Math.random() * 2.6, gold: Math.random() < .75 });
      if (!run) { run = true; last = 0; requestAnimationFrame(frame); }
    }
    function frame(t) {
      var dt = last ? Math.min(.05, (t - last) / 1000) : .016; last = t;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
      ps = ps.filter(function (p) { return (p.t += dt) < p.life; });
      ps.forEach(function (p) {
        p.vy += 420 * dt; p.vx *= .985; p.x += p.vx * dt; p.y += p.vy * dt;
        var a = 1 - p.t / p.life, r = p.r * (0.6 + 0.4 * Math.sin(p.t * 22));
        c.globalAlpha = a; c.fillStyle = p.gold ? '#C99A3A' : '#F2DFA4';
        c.shadowColor = 'rgba(233,200,120,.9)'; c.shadowBlur = 8;
        star(c, p.x, p.y, r * 2.2);
      });
      c.globalAlpha = 1;
      if (ps.length) requestAnimationFrame(frame); else { run = false; c.clearRect(0, 0, innerWidth, innerHeight); }
    }
    if (fine) addEventListener('mousemove', function (e) {
      if (lx < 0) { lx = e.clientX; ly = e.clientY; return; }
      var d = Math.hypot(e.clientX - lx, e.clientY - ly);
      if (d < 7 || root.classList.contains('intro') && !root.classList.contains('intro-done')) return;
      lx = e.clientX; ly = e.clientY;
      for (var i = 0; i < 2; i++) add(e.clientX, e.clientY, (Math.random() - .5) * 90, -40 - Math.random() * 80, .6 + Math.random() * .5);
    });
    window.__mcBurst = function (x, y, n) {
      for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = 160 + Math.random() * 520;
        add(x, y, Math.cos(a) * v, Math.sin(a) * v - 180, .9 + Math.random() * .9); }
    };
  })();

  /* 4 つ角の光（きらめき）の形 */
  function star(c, x, y, r) {
    c.beginPath(); c.moveTo(x, y - r);
    c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
    c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
  }

  /* 18. 光の筋ときらめき: 写真の帯・ホームの最初の画面・メールのカードに、長時間露光のような金の光の筋が流れ、星がまたたく */
  if (IX) $$('.ph-photo,.opener .stage,.mailcard').forEach(function (host) {
    var cv = document.createElement('canvas'); cv.className = 'fx'; cv.setAttribute('aria-hidden', 'true');
    host.insertBefore(cv, host.firstChild.nextSibling || null);
    var c = cv.getContext('2d'), dpr = Math.min(1.5, window.devicePixelRatio || 1), W = 0, H = 0, stars = [], trails = [], live = false;
    var onCard = host.classList.contains('mailcard');
    function setup() {
      W = host.clientWidth; H = host.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
      var n = Math.max(10, Math.min(60, Math.round(W * H / 15000)));
      // 明るい地の上でも見えるよう、星は金を主にし（白は写真の上だけ少し）、筋は太めに
      var white = host.classList.contains('ph-photo') ? .3 : 0;
      stars = []; for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: 2.2 + Math.random() * 4.6,
        ph: Math.random() * 6.3, sp: 1 + Math.random() * 2.5, vy: -(4 + Math.random() * 14), gold: onCard || Math.random() >= white });
      var m = onCard ? 2 : (W < 700 ? 4 : 8);
      trails = []; for (var j = 0; j < m; j++) trails.push({ y0: .15 + Math.random() * .75, amp: 14 + Math.random() * 60, fq: .0018 + Math.random() * .004,
        ph: Math.random() * 6.3, sp: 180 + Math.random() * 380, head: Math.random() * W, len: 260 + Math.random() * 420, w: 1.4 + Math.random() * 2.2 });
    }
    var lt = 0;
    function frame(t) {
      if (!live) return;
      var s = t / 1000, k60 = lt ? Math.min(3, (t - lt) / (1000 / 60)) : 1; lt = t;   // 画面の書き換えの速さ（60Hz・120Hz）によらず同じ速さで動かす
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      trails.forEach(function (tr) {
        tr.head += tr.sp / 60 * k60; if (tr.head - tr.len > W) { tr.head = -20; tr.y0 = .2 + Math.random() * .7; }
        for (var k = 0; k < 24; k++) {
          var x1 = tr.head - tr.len * k / 24, x2 = tr.head - tr.len * (k + 1) / 24;
          var y1 = tr.y0 * H + tr.amp * Math.sin(x1 * tr.fq + tr.ph + s * .4), y2 = tr.y0 * H + tr.amp * Math.sin(x2 * tr.fq + tr.ph + s * .4);
          c.strokeStyle = onCard ? 'rgba(242,223,164,' + (0.6 * (1 - k / 24)) + ')' : 'rgba(196,148,52,' + (0.95 * (1 - k / 24)) + ')';
          c.lineWidth = tr.w * (1 - k / 30); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
        }
        c.fillStyle = '#FFF6DA'; c.shadowColor = 'rgba(233,200,120,.95)'; c.shadowBlur = 12;
        var hy = tr.y0 * H + tr.amp * Math.sin(tr.head * tr.fq + tr.ph + s * .4);
        c.beginPath(); c.arc(tr.head, hy, tr.w * 1.6, 0, 7); c.fill(); c.shadowBlur = 0;
      });
      stars.forEach(function (p) {
        p.y += p.vy / 60 * k60; if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        var a = Math.max(0, Math.sin(s * p.sp + p.ph)); if (a < .05) return;
        c.globalAlpha = a; c.fillStyle = p.gold ? '#C99A3A' : '#FFFFFF';
        c.shadowColor = 'rgba(226,184,90,.95)'; c.shadowBlur = 10;
        star(c, p.x, p.y, p.r * (0.7 + a * .6));
      });
      c.globalAlpha = 1; c.shadowBlur = 0;
      requestAnimationFrame(frame);
    }
    setup(); addEventListener('resize', setup);
    new IntersectionObserver(function (es) { var v = es[es.length - 1].isIntersecting; if (v && !live) { live = true; lt = 0; requestAnimationFrame(frame); } live = v; }).observe(host);
  });

  /* 19. 横に駆け抜けるファンド（ホーム）: 縦にスクロールすると、2015・2019・2023 が横へ流れる */
  var runSec = $('#run');
  if (runSec && IX) (function () {
    var stage = $('.stage', runSec), track = $('.track', runSec), prog = $('.run-prog', runSec), dist = 0;
    var flat = matchMedia('(max-height: 560px)');   // 高さが低い画面では縦に並べる（CSS と同じ条件）
    function layout() {
      if (flat.matches) { runSec.style.height = ''; track.style.setProperty('--tx', '0px'); dist = 0; return; }
      dist = Math.max(0, track.scrollWidth - stage.clientWidth);
      runSec.style.height = (dist + stage.offsetHeight) + 'px';
      upd();
    }
    function upd() {
      if (flat.matches) return;
      var r = runSec.getBoundingClientRect(), p = clamp((HH() - r.top) / Math.max(1, runSec.offsetHeight - stage.offsetHeight));
      track.style.setProperty('--tx', (-p * dist).toFixed(1) + 'px');
      if (prog) prog.style.setProperty('--rp', p.toFixed(4));
    }
    onScrolls.push(upd);
    addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    layout();
  })();

  tick();
})();
