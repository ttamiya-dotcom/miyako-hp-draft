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
  document.querySelectorAll('dialog.bio').forEach(function (d) {
    d.querySelector('.close').addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  });
})();
