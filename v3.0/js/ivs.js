/* みやこキャピタルHP IVS 風の案（v3.0）の動き。build_ivs.py が site_ivs/js/ivs.js に写す */
(function () {
  var d = document, html = d.documentElement;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOVE = html.classList.contains('ix');
  window.__ivs = 1;   /* 動いた印（先頭のインライン script が、これが無ければ ix を外す） */

  /* ---------- メニュー ---------- */
  var mb = d.querySelector('.menu-btn'), ov = d.querySelector('.ovl');
  function setMenu(o) {
    html.classList.toggle('menu-open', o);
    if (mb) { mb.setAttribute('aria-expanded', String(o)); mb.setAttribute('aria-label', o ? mb.dataset.labelClose : mb.dataset.labelOpen); }
    if (ov) { ov.setAttribute('aria-hidden', String(!o)); if ('inert' in ov) ov.inert = !o; }
    if (o && ov) { var f = ov.querySelector('a'); if (f) setTimeout(function () { f.focus(); }, 120); }
  }
  if (mb && ov) {
    if ('inert' in ov) ov.inert = true;
    mb.addEventListener('click', function () { setMenu(!html.classList.contains('menu-open')); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && html.classList.contains('menu-open')) { setMenu(false); mb.focus(); } });
    ov.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- 上へ戻る ---------- */
  var tt = d.querySelector('.totop');
  function onScroll() { if (tt) tt.classList.toggle('show', scrollY > innerHeight * .8); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 文字が入れ替わって定まる（飾りの英字だけ） ---------- */
  var GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#+';
  function scramble(el) {
    var fin = el.getAttribute('data-text') || el.textContent;
    el.setAttribute('data-text', fin);
    if (RM || !MOVE) { el.textContent = fin; return; }
    var n = fin.length, f = 0, total = 14 + n * 2;
    (function step() {
      var s = '';
      for (var i = 0; i < n; i++) { var c = fin[i]; s += (c === ' ' || f > i * 2 + 8) ? c : GL[(Math.random() * GL.length) | 0]; }
      el.textContent = s;
      if (++f <= total) requestAnimationFrame(step); else el.textContent = fin;
    })();
  }

  /* ---------- 数え上げ ---------- */
  function countUp(el) {
    var to = el.getAttribute('data-count'), dec = (to.split('.')[1] || '').length, v = parseFloat(to);
    if (RM || !MOVE) { el.textContent = to; return; }
    var t0 = performance.now(), dur = 1600;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = (v * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step); else el.textContent = to;
    })(t0);
  }
  if (MOVE) d.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = (0).toFixed((el.getAttribute('data-count').split('.')[1] || '').length); });

  /* ---------- 画面に入ったら現れる ---------- */
  var targets = d.querySelectorAll('[data-rv],.sh,.hero,.phero,[data-scr],.fgrid');
  if ('IntersectionObserver' in window && MOVE) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target; t.classList.add('on'); io.unobserve(t);
        if (t.hasAttribute('data-scr')) scramble(t);
        t.querySelectorAll('[data-scr]').forEach(scramble);
        t.querySelectorAll('[data-count]').forEach(countUp);
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('on'); });
  }

  /* ---------- 3拠点の現地時刻 ---------- */
  var clocks = d.querySelectorAll('.clock[data-tz]');
  function tick() {
    clocks.forEach(function (c) {
      try {
        var s = new Date().toLocaleTimeString('en-GB', { timeZone: c.dataset.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        c.innerHTML = '<small>' + c.dataset.label + '</small>' + s;
      } catch (e) { c.textContent = ''; }
    });
  }
  if (clocks.length) { tick(); setInterval(tick, 1000); }

  /* ---------- 経歴の窓（前の人・次の人） ---------- */
  var opens = Array.prototype.slice.call(d.querySelectorAll('[data-open^="bio-"]'));
  var ids = opens.map(function (b) { return b.dataset.open; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  var lastBtn = null;
  function openBio(id) {
    var dl = d.getElementById(id); if (!dl || !dl.showModal) return false;
    d.querySelectorAll('dialog.bio[open]').forEach(function (o) { o.close(); });
    dl.showModal(); return true;
  }
  opens.forEach(function (b) {
    b.addEventListener('click', function (e) { if (openBio(b.dataset.open)) { e.preventDefault(); lastBtn = b; } });
  });
  d.querySelectorAll('dialog.bio').forEach(function (dl) {
    dl.addEventListener('click', function (e) { if (e.target === dl) dl.close(); });
    dl.querySelector('.close').addEventListener('click', function () { dl.close(); });
    dl.querySelectorAll('[data-go]').forEach(function (g) {
      g.addEventListener('click', function () {
        var i = ids.indexOf(dl.id), n = ids[(i + (+g.dataset.go) + ids.length) % ids.length];
        openBio(n);
        lastBtn = d.querySelector('[data-open="' + n + '"]');
      });
    });
    dl.addEventListener('close', function () { if (lastBtn && !d.querySelector('dialog.bio[open]')) lastBtn.focus(); });
  });

  /* ---------- 投資先の絞り込みと表示の切り替え ---------- */
  var tools = d.querySelector('.pf-tools'), grid = d.querySelector('.pgrid');
  if (tools && grid) {
    tools.classList.add('on-js');
    var items = grid.querySelectorAll('li');
    tools.querySelectorAll('[data-f]').forEach(function (b) {
      b.addEventListener('click', function () {
        tools.querySelectorAll('[data-f]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var f = b.dataset.f;
        items.forEach(function (li) { li.hidden = !(f === 'all' || li.dataset.mark === f); if (!li.hidden) li.classList.add('on'); });
      });
    });
    tools.querySelectorAll('[data-v]').forEach(function (b) {
      b.addEventListener('click', function () {
        tools.querySelectorAll('[data-v]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        grid.classList.toggle('list', b.dataset.v === 'list');
      });
    });
  }

  /* ---------- 流れる光沢（WebGL。1つの描き手で、画面に見えている canvas.fluid だけを描く） ---------- */
  var cvs = Array.prototype.slice.call(d.querySelectorAll('canvas.fluid'));
  if (!cvs.length) return;
  var off = d.createElement('canvas');
  var gl = off.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false }) || off.getContext('experimental-webgl');
  if (!gl) return;   // 描けないときは CSS のグラデーションのまま
  var PAL = {
    /* 明るい銀青（最初の画面・下層の見出し） */
    hero: [[.96, .975, 1], [.62, .72, 1], [.16, .32, 1], [.04, .08, .42], [1, 1, 1], .32],
    /* 青の地 */
    blue: [[.36, .49, 1], [.07, .22, 1], [.03, .1, .62], [.01, .03, .2], [.86, .91, 1], 0],
    /* 濃い地 */
    ink: [[.26, .39, 1], [.07, .13, .5], [.03, .05, .2], [.01, .015, .08], [.62, .72, 1], 0]
  };
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 r;uniform float t;uniform vec2 m;uniform vec3 c0,c1,c2,c3,sp;uniform float wash;uniform float seed;',
    'vec2 h2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453);}',
    'float nz(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(dot(h2(i),f),dot(h2(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(h2(i+vec2(0,1)),f-vec2(0,1)),dot(h2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 R=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*nz(p);p=R*p;a*=.5;}return v;}',
    'void main(){',
    ' vec2 p=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);',
    ' float T=t*.04+seed;',
    ' vec2 mm=(m-.5)*.3;',
    ' vec2 q=vec2(fbm(p*.7+vec2(0.,T)),fbm(p*.7+vec2(5.2,1.3)-T));',
    ' vec2 w=vec2(fbm(p*.65+1.6*q+vec2(1.7,9.2)+T*1.2+mm),fbm(p*.65+1.6*q+vec2(8.3,2.8)-T*.8-mm));',
    ' vec2 b=p*.55+2.1*w;',
    ' float e=.012;',
    ' float f=fbm(b),fx=fbm(b+vec2(e,0.)),fy=fbm(b+vec2(0.,e));',
    ' float h=sin(f*8.5),hx=sin(fx*8.5),hy=sin(fy*8.5);',
    ' vec3 n=normalize(vec3(-(hx-h)/e*.045,-(hy-h)/e*.045,1.));',
    ' vec3 L=normalize(vec3(-.45,.6,.75));',
    ' float df=clamp(dot(n,L),0.,1.);',
    ' float spc=pow(max(dot(reflect(-L,n),vec3(0.,0.,1.)),0.),18.);',
    ' vec3 col=mix(c3,c2,smoothstep(-.62,-.22,f));',
    ' col=mix(col,c1,smoothstep(-.3,.02,f));',
    ' col=mix(col,c0,smoothstep(-.02,.32,f));',
    ' col*=.55+.58*df;',
    ' col=mix(col,sp,clamp(spc*.9,0.,1.));',
    ' float dc=length(p*vec2(.7,1.2));col=mix(col,c0,wash*smoothstep(.8,.05,dc));',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');
  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  var pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['r', 't', 'm', 'c0', 'c1', 'c2', 'c3', 'sp', 'wash', 'seed'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });

  var mouse = { x: .5, y: .5 }, sm = { x: .5, y: .5 };
  addEventListener('pointermove', function (e) { mouse.x = e.clientX / innerWidth; mouse.y = 1 - e.clientY / innerHeight; }, { passive: true });

  var items2 = cvs.map(function (c, i) {
    return { c: c, ctx: c.getContext('2d'), vis: false, ovl: !!c.closest('.ovl'), pal: PAL[c.dataset.pal] || PAL.hero, seed: parseFloat(c.dataset.seed || (i * 3.7)) };
  });
  function fit(it) {
    var w = it.c.clientWidth, h = it.c.clientHeight;
    var s = Math.min(.45, 760 / Math.max(w, h, 1));
    it.c.width = Math.max(2, Math.round(w * s)); it.c.height = Math.max(2, Math.round(h * s));
    /* 描き手の画面は大きくなるときだけ作り直す（毎回の作り直しは重い） */
    if (off.width < it.c.width) off.width = it.c.width;
    if (off.height < it.c.height) off.height = it.c.height;
  }
  function draw(it, time) {
    var c = it.c; if (!c.width) fit(it);
    gl.viewport(0, 0, c.width, c.height);
    var P = it.pal;
    gl.uniform2f(U.r, c.width, c.height); gl.uniform1f(U.t, time); gl.uniform2f(U.m, sm.x, sm.y);
    gl.uniform3fv(U.c0, P[0]); gl.uniform3fv(U.c1, P[1]); gl.uniform3fv(U.c2, P[2]); gl.uniform3fv(U.c3, P[3]); gl.uniform3fv(U.sp, P[4]);
    gl.uniform1f(U.wash, P[5]); gl.uniform1f(U.seed, it.seed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    it.ctx.drawImage(off, 0, off.height - c.height, c.width, c.height, 0, 0, c.width, c.height);
  }
  var ro = 'ResizeObserver' in window ? new ResizeObserver(function (es) {
    es.forEach(function (e) { var it = items2.find(function (x) { return x.c === e.target; }); if (it) { fit(it); if (RM || !MOVE) draw(it, 14); } });
  }) : null;
  var vio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { var it = items2.find(function (x) { return x.c === e.target; }); if (it) it.vis = e.isIntersecting; });
  });
  items2.forEach(function (it) { fit(it); draw(it, 14); if (ro) ro.observe(it.c); vio.observe(it.c); });
  if (RM || !MOVE) return;
  var t0 = performance.now(), last = 0;
  (function loop(now) {
    requestAnimationFrame(loop);
    if (now - last < 33) return;   // 毎秒30回まで
    last = now;
    sm.x += (mouse.x - sm.x) * .05; sm.y += (mouse.y - sm.y) * .05;
    var time = 14 + (now - t0) / 1000;
    var mo = html.classList.contains('menu-open');
    items2.forEach(function (it) { if (it.ovl ? mo : (it.vis && !mo)) draw(it, time); });
  })(t0);
})();
