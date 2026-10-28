/* 動きの共通部品（デザイン案A〜F で共用）
   - [data-reveal]   : 画面に入ったら .in を付ける（見た目は各ページの CSS で決める）
   - [data-count]    : 画面に入ったら 0 から数え上げる（data-dec で小数の桁数）
   - [data-parallax] : スクロールに合わせて背景画像を少し動かす（値は動く量。0.1〜0.3 程度）
   OS の「視差効果を減らす」設定のときは、動かさずに最終の状態を見せる */
(function () {
  // 読み込めたときだけ「動く前の状態（隠しておく）」を有効にする。読めなければ中身はそのまま見える
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('[data-reveal]');
  var counts = document.querySelectorAll('[data-count]');

  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var dur = 1600, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step); else el.textContent = end.toFixed(dec);
    }
    requestAnimationFrame(step);
    // 描画が止まる環境（裏のタブなど）でも、最後は必ず正しい数字にする
    setTimeout(function () { el.textContent = end.toFixed(dec); }, dur + 400);
  }

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add('in');
      if (el.hasAttribute('data-count')) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(function (el) { io.observe(el); });
  counts.forEach(function (el) { if (!el.hasAttribute('data-reveal')) io.observe(el); });

  var px = document.querySelectorAll('[data-parallax]');
  if (px.length) {
    var ticking = false;
    function update() {
      px.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var k = parseFloat(el.getAttribute('data-parallax')) || 0.2;
        var off = (r.top + r.height / 2 - innerHeight / 2) * k;
        el.style.setProperty('--py', off.toFixed(1) + 'px');
      });
      ticking = false;
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }
})();
