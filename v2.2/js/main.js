/* メニューの開閉（スマートフォン幅） */
(function () {
  var b = document.querySelector('.menu-btn'), n = document.querySelector('.gnav');
  if (!b || !n) return;
  b.addEventListener('click', function () {
    var o = n.classList.toggle('open');
    b.setAttribute('aria-expanded', o);
  });
})();

/* チームの経歴（押すと開く。背景を押すか × か Esc で閉じる） */
(function () {
  var cards = document.querySelectorAll('[data-open]');
  if (!cards.length || typeof HTMLDialogElement !== 'function') return;
  document.documentElement.classList.add('has-dialog');
  cards.forEach(function (c) {
    c.addEventListener('click', function () {
      var d = document.getElementById(c.getAttribute('data-open'));
      if (d) d.showModal();
    });
  });
  var all = [].slice.call(document.querySelectorAll('dialog.bio'));
  all.forEach(function (d, i) {
    // 前の人・次の人へ（端まで行ったら反対の端へ）
    d.querySelectorAll('[data-go]').forEach(function (g) {
      g.addEventListener('click', function () {
        var n = all[(i + parseInt(g.getAttribute('data-go'), 10) + all.length) % all.length];
        d.close(); n.showModal();
      });
    });
  });
  document.querySelectorAll('dialog.bio').forEach(function (d) {
    d.querySelector('.close').addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  });
})();
