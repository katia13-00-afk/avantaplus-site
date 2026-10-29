(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* шапка и кнопка «наверх» */
  var header = $('#header'), totop = $('#totop'), lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('is-solid', y > 40);
      var dy = y - lastY;
      if (Math.abs(dy) > 6) {
        var menuOpen = header.classList.contains('menu-open');
        header.classList.toggle('is-hidden', dy > 0 && y > 300 && !menuOpen);
        lastY = y;
      }
    }
    if (totop) totop.classList.toggle('is-on', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (totop) totop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* мобильное меню */
  var burger = $('#burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
    });
    $$('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { header.classList.remove('menu-open'); });
    });
  }

  /* появление блоков при прокрутке */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.1 });
    $$('.rv').forEach(function (el) { io.observe(el); });
  } else {
    $$('.rv').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* слайдер автопарка */
  var cs = $('#carsSlider');
  if (cs) {
    var track = $('.cars__track', cs), slides = $$('.cars__slide', cs), dots = $('.dots', cs), ci = 0, startX = null;
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Слайд ' + (i + 1));
      b.addEventListener('click', function () { goCar(i); });
      dots.appendChild(b);
    });
    var busy = false, count = $('.cars__count', cs), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    if (count) count.textContent = pad(1) + ' / ' + pad(slides.length);
    var setState = function (sl, st) { sl.setAttribute('data-s', st); };
    slides.forEach(function (sl, k) { setState(sl, k === 0 ? 'active' : 'after'); });
    var goCar = function (i, dir) {
      var t = (i + slides.length) % slides.length;
      if (t === ci || busy) return;
      dir = dir || (t > ci ? 1 : -1);
      var cur = slides[ci], nxt = slides[t];
      /* следующая машина встаёт за краем со стороны движения без анимации */
      nxt.style.transition = 'none';
      setState(nxt, dir > 0 ? 'after' : 'before');
      void nxt.offsetWidth;
      nxt.style.transition = '';
      setState(cur, dir > 0 ? 'before' : 'after');
      setState(nxt, 'active');
      ci = t; busy = true;
      setTimeout(function () { busy = false; }, 700);
      $$('button', dots).forEach(function (b, k) { b.classList.toggle('is-active', k === ci); });
      if (count) count.textContent = pad(ci + 1) + ' / ' + pad(slides.length);
    };
    $$('.slider__arrow', cs).forEach(function (b) {
      b.addEventListener('click', function () { goCar(ci + +b.dataset.dir, +b.dataset.dir); });
    });
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) goCar(ci + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      startX = null;
    });
    $$('button', dots).forEach(function (b, k) { b.classList.toggle('is-active', k === 0); });
  }

  /* слайдер отзывов */
  var rs = $('#revSlider');
  if (rs) {
    var rv = $$('.review', rs), ri = 0;
    $$('.slider__arrow', rs).forEach(function (b) {
      b.addEventListener('click', function () {
        rv[ri].classList.remove('is-active');
        ri = (ri + +b.dataset.dir + rv.length) % rv.length;
        rv[ri].classList.add('is-active');
      });
    });
  }

  /* модальные окна */
  var lastFocus;
  function openModal(m) { if (!m) return; lastFocus = document.activeElement; m.classList.add('is-open'); document.body.style.overflow = 'hidden'; var x = $('.modal__x', m); if (x) x.focus(); }
  function closeModals() { $$('.modal.is-open').forEach(function (m) { m.classList.remove('is-open'); }); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  $$('[data-review]').forEach(function (b) { b.addEventListener('click', function () { openModal($('#review-' + b.dataset.review)); }); });
  $$('[data-staff]').forEach(function (b) { b.addEventListener('click', function () { openModal($('#staff-' + b.dataset.staff)); }); });
  $$('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m || e.target.hasAttribute('data-close')) closeModals(); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModals(); });

  /* выбор тарифа из карточки */
  $$('[data-tariff]').forEach(function (a) {
    a.addEventListener('click', function () { var f = $('#tariffField'); if (f) f.value = a.dataset.tariff; });
  });

  /* маска телефона */
  var phone = $('#phone');
  if (phone) {
    phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '');
      if (d[0] === '8' || d[0] === '7') d = d.slice(1);
      d = d.slice(0, 10);
      var s = '+7';
      if (d.length) s += ' (' + d.slice(0, 3);
      if (d.length >= 3) s += ')';
      if (d.length > 3) s += ' ' + d.slice(3, 6);
      if (d.length > 6) s += '-' + d.slice(6, 8);
      if (d.length > 8) s += '-' + d.slice(8, 10);
      phone.value = d.length ? s : '';
    });
  }

  /* отправка заявки */
  var form = $('#leadForm');
  if (form) {
    var msg = $('.form__msg', form), btn = $('button[type=submit]', form);
    function say(t, err) { msg.textContent = t; msg.classList.toggle('is-err', !!err); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var digits = form.phone.value.replace(/\D/g, '');
      if (!form.name.value.trim()) return say('Укажите имя', true);
      if (digits.length !== 11) return say('Введите телефон полностью', true);
      if (!form.consent.checked) return say('Нужно согласие на обработку данных', true);
      btn.disabled = true; say('Отправляем…');
      fetch(form.action, { method: 'POST', body: new FormData(form) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) throw new Error(j.error || 'error');
          say('Спасибо! Мы скоро свяжемся с вами.');
          form.reset();
          if (window.ym) { ym(108418015, 'reachGoal', 'lead'); }
        })
        .catch(function () { say('Не удалось отправить. Позвоните: +7 (953) 329-33-22', true); })
        .then(function () { btn.disabled = false; });
    });
  }

  /* колесо слегка вращается при прокрутке */
  var wheel = $('#wheel');
  if (wheel && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var ticking = false;
    var spin = function () {
      var r = wheel.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) wheel.style.transform = 'rotate(' + (window.scrollY * 0.12 % 360) + 'deg)';
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(spin); } }, { passive: true });
    spin();
  }

  /* зернистость поверх страницы (как на исходном сайте) */
  (function () {
    var size = 256, c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d'), img = ctx.createImageData(size, size), i, v;
    for (i = 0; i < img.data.length; i += 4) {
      v = Math.random() * 255 | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    var g = document.createElement('div');
    g.id = 'grain'; g.setAttribute('aria-hidden', 'true');
    g.style.backgroundImage = 'url(' + c.toDataURL() + ')';
    document.body.appendChild(g);
    document.documentElement.style.setProperty('--noise', 'url(' + c.toDataURL() + ')');
  })();

  /* цифры в «Гарантиях» считаются при появлении */
  var statsBox = $('.stats');
  if (statsBox && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var nums = $$('.stat b', statsBox).map(function (b) {
      var m = b.textContent.match(/^(\d+)(.*)$/);
      return { el: b, to: m ? +m[1] : 0, suf: m ? m[2] : '' };
    });
    nums.forEach(function (n) { n.el.textContent = '0' + n.suf; });
    var so = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      so.disconnect();
      var t0 = performance.now(), dur = 1400;
      (function tick(now) {
        var p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        nums.forEach(function (n) { n.el.textContent = Math.round(n.to * e) + n.suf; });
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.4 });
    so.observe(statsBox);
  }

  /* блик на «Ультра»: запускается заново, когда тарифы снова в зоне видимости */
  var tariffsBox = $('.tariffs');
  if (tariffsBox && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      tariffsBox.classList.toggle('glint-on', es[0].isIntersecting);
    }, { threshold: 0.35 }).observe(tariffsBox);
  }
})();
