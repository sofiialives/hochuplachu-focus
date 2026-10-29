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

/* ==========================================================================
   Карусель этапов воронки + лайтбокс для iPhone-моков со скринами переписки
   ========================================================================== */
(function () {
  'use strict';

  /* ---- Лайтбокс: группы кликабельных phone-mock, открывающих полноэкранный скрин ---- */
  function initPhoneLightbox() {
    var lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    var img = document.getElementById('lightboxImg');
    var closeBtn = document.getElementById('lightboxClose');
    var prevBtn = document.getElementById('lightboxPrev');
    var nextBtn = document.getElementById('lightboxNext');
    var groups = {};

    document.querySelectorAll('.phone-mock').forEach(function (btn) {
      var group = btn.dataset.group || 'default';
      if (!groups[group]) groups[group] = [];
      groups[group].push(btn);
    });

    var currentGroup = null;
    var currentIndex = 0;

    function bigSrc(btn) {
      var src = btn.querySelector('img').getAttribute('src');
      return src.replace('/phone/', '/phone/big/');
    }

    function show(group, index) {
      var list = groups[group];
      if (!list || !list.length) return;
      currentGroup = group;
      currentIndex = (index + list.length) % list.length;
      img.src = bigSrc(list[currentIndex]);
      var multi = list.length > 1;
      prevBtn.hidden = !multi;
      nextBtn.hidden = !multi;
    }

    function open(group, index) {
      show(group, index);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
    }

    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
    }

    document.querySelectorAll('.phone-mock').forEach(function (btn) {
      btn.addEventListener('click', function () {
        open(btn.dataset.group || 'default', parseInt(btn.dataset.index || '0', 10));
      });
    });

    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    prevBtn.addEventListener('click', function () { show(currentGroup, currentIndex - 1); });
    nextBtn.addEventListener('click', function () { show(currentGroup, currentIndex + 1); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(currentGroup, currentIndex - 1);
      if (e.key === 'ArrowRight') show(currentGroup, currentIndex + 1);
    });
  }

  /* ---- Карусель "От холодного контакта до работающего партнёра" ---- */
  function initProcessCarousel() {
    var track = document.getElementById('processTrack');
    var dotsWrap = document.getElementById('processDots');
    var prevBtn = document.getElementById('processPrev');
    var nextBtn = document.getElementById('processNext');
    if (!track || !dotsWrap) return;
    var slides = Array.prototype.slice.call(track.children);
    var dots = [];

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'process-carousel__dot';
      dot.setAttribute('aria-label', 'Шаг ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });

    function activeIndex() {
      var scrollLeft = track.scrollLeft;
      var width = track.clientWidth;
      return Math.round(scrollLeft / width);
    }

    function updateUI() {
      var idx = Math.max(0, Math.min(slides.length - 1, activeIndex()));
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === slides.length - 1;
    }

    function goTo(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
      /* Update dots/arrows immediately instead of waiting for the scroll event:
         a debounced scroll-based sync alone can miss the final state when a
         smooth-scroll animation is interrupted by a quick second click. */
      dots.forEach(function (d, idx) { d.classList.toggle('is-active', idx === i); });
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === slides.length - 1;
    }

    prevBtn.addEventListener('click', function () { goTo(activeIndex() - 1); });
    nextBtn.addEventListener('click', function () { goTo(activeIndex() + 1); });
    var scrollTimer = null;
    track.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateUI, 60);
    });
    window.addEventListener('resize', updateUI);
    updateUI();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPhoneLightbox();
    initProcessCarousel();
  });
})();
