/* ==========================================================================
   KOMETA × Хочу Плачу! — доп. интерактив поверх базового wow.js/script.js:
   пословная анимация заголовков, вращающиеся кольца у иконок блоков,
   лёгкий 3D-наклон карточек за курсором (без переписывания базовой логики)
   ========================================================================== */
(function () {
  'use strict';
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Разбивает текст каждого .h2 на слова-span для пословной анимации ---- */
  function splitHeadingWords() {
    if (prefersReducedMotion) return;
    document.querySelectorAll('.h2').forEach(function (h) {
      if (h.dataset.split) return;
      h.dataset.split = '1';
      var text = h.textContent;
      var parts = text.split(/(\s+)/);
      h.textContent = '';
      var wi = 0;
      parts.forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          h.appendChild(document.createTextNode(part));
          return;
        }
        var span = document.createElement('span');
        span.className = 'word';
        span.style.setProperty('--i', wi++);
        span.textContent = part;
        h.appendChild(span);
      });
    });
  }

  /* ---- 2. Оборачивает иконки блоков работы в контейнер с вращающимся кольцом ---- */
  function addIconRings() {
    document.querySelectorAll('.feature-panel__icon').forEach(function (icon) {
      if (icon.parentElement.classList.contains('feature-panel__icon-wrap')) return;
      var wrap = document.createElement('span');
      wrap.className = 'feature-panel__icon-wrap';
      icon.parentNode.insertBefore(wrap, icon);
      wrap.appendChild(icon);
      var ring = document.createElement('span');
      ring.className = 'feature-panel__icon-ring';
      ring.setAttribute('aria-hidden', 'true');
      wrap.appendChild(ring);
    });
  }

  /* ---- 3. Лёгкий наклон карточек за курсором — "живая" iOS-подача ---- */
  function initCardTilt() {
    if (prefersReducedMotion) return;
    var selector = '.role-card, .step-chip, .rubric-item.glass, .goal-card, .target-card';
    document.querySelectorAll(selector).forEach(function (card) {
      var raf = null;
      function onMove(e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.transform = 'perspective(700px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' + (x * 5).toFixed(2) + 'deg) translateY(-6px)';
        });
      }
      function onLeave() {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = '';
      }
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerleave', onLeave);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    splitHeadingWords();
    addIconRings();
    initCardTilt();
  });
})();
