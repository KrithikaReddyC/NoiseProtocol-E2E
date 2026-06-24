/* Noise Protocol landing page interactions
   - aurora light beams (reproduced from the source component)
   - scroll reveals via IntersectionObserver (no scroll listeners)
   - nav background on scroll, animated perf bars, lucide icons
*/
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Render lucide icons --------------------------------------------------
  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // ---- Aurora light beams ---------------------------------------------------
  function buildBeams(count) {
    var container = document.getElementById('beams');
    if (!container) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var riseDur = Math.random() * 2 + 4;   // 4-6s rise
      var fadeDur = riseDur;                  // synced fade
      var dropDur = Math.random() * 3 + 3;   // 3-6s drop
      var beam = document.createElement('div');
      beam.className = 'light-beam';
      beam.style.left = (Math.random() * 100) + '%';
      beam.style.width = (Math.floor(Math.random() * 3) + 1) + 'px';
      beam.style.animationDelay = (Math.random() * 5) + 's';
      beam.style.animationDuration = riseDur + 's, ' + fadeDur + 's, ' + dropDur + 's';
      frag.appendChild(beam);
    }
    container.appendChild(frag);
  }

  // ---- Scroll reveals -------------------------------------------------------
  function initReveals() {
    var items = document.querySelectorAll('.reveal, .reveal-fade');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // ---- Performance bars (fill when in view) --------------------------------
  function initBars() {
    var fills = document.querySelectorAll('.bar-fill');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      fills.forEach(function (el) { el.style.width = el.getAttribute('data-w'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.getAttribute('data-w');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    fills.forEach(function (el) { io.observe(el); });
  }

  // ---- Nav background on scroll --------------------------------------------
  function initNav() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 16) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    // passive listener purely for a cosmetic class toggle (cheap, throttled by rAF)
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () { onScroll(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
    onScroll();
  }

  // ---- Card spotlight (pointer-tracked glow) -------------------------------
  function initCardGlow() {
    if (reduceMotion) return;
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // ---- 3D tilt cards --------------------------------------------------------
  function initTilt() {
    if (reduceMotion) return;
    var MAX = 10.5; // degrees, matches the source component range
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var xPct = (e.clientX - r.left) / r.width - 0.5;
        var yPct = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (xPct * MAX * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-yPct * MAX * 2).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  function start() {
    initIcons();
    buildBeams(reduceMotion ? 24 : 60);
    initReveals();
    initBars();
    initNav();
    initTilt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
