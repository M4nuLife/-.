(() => {
  'use strict';

  /* ===== Utils ===== */

  const Utils = (window.Manul && window.Manul.utils) || {};
  const $ = Utils.$ || ((sel, root = document) => root.querySelector(sel));
  const $$ = Utils.$$ || ((sel, root = document) => Array.from(root.querySelectorAll(sel)));

  const HEADER_SCROLL_Y = 20;
  const SCROLL_EXTRA_OFFSET = 20;
  /* ===== Header / Nav ===== */

  function initHeaderNav() {
    const header = $('#header');
    const toggle = $('.nav-toggle');
    const nav = $('.nav');
    if (!header) return null;

    const setScrolled = () => {
      const scrolled = window.scrollY > HEADER_SCROLL_Y;
      document.body.classList.toggle('is-scrolled', scrolled);
      // keep legacy class for backwards-compatible styling
    };

    const setOpen = (open) => {
      header.classList.toggle('nav-open', open);
      toggle?.setAttribute('aria-expanded', String(open));
    };

    window.addEventListener('scroll', setScrolled, { passive: true });
    setScrolled();

    toggle?.addEventListener('click', () => {
      setOpen(!header.classList.contains('nav-open'));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    document.addEventListener('click', (e) => {
      if (!header.classList.contains('nav-open')) return;
      if (e.target.closest('.nav-toggle')) return;
      if (nav?.contains(e.target)) return;
      setOpen(false);
    });

    return { header, close: () => setOpen(false) };
  }

  /* ===== Smooth Scroll ===== */

  function initSmoothScroll(api) {
    const header = api?.header;

    const offset = () =>
      (header?.offsetHeight || 70) + SCROLL_EXTRA_OFFSET;

    const scrollToId = (id) => {
      const el = $(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset();
      window.scrollTo({ top, behavior: 'smooth' });
    };

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const id = link.getAttribute('href');
      if (!id || id === '#' || !$(id)) return;

      e.preventDefault();
      scrollToId(id);
      api?.close();
    });

    $('.btn-main')?.addEventListener('click', () => {
      scrollToId('#appearance');
    });
  }

  /* ===== Reveal on Scroll ===== */

  function initRevealOnScroll() {
    const sections = $$('main > section');
    if (!sections.length) return;

    sections.forEach((s) => s.classList.add('reveal'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          e.target.classList.toggle('is-inview', e.isIntersecting);
        });
      },
      { threshold: 0.12 }
    );

    sections.forEach((s) => observer.observe(s));
  }

  /* ===== Appearance Panel ===== */

  function initAppearancePanel() {
    const panel = $('.appearance__panel');
    if (!panel) return;

    const observer = new IntersectionObserver(
      ([e]) => panel.classList.toggle('is-visible', e.isIntersecting),
      { threshold: 0.35 }
    );

    observer.observe(panel);
  }

  /* ===== Footer ===== */

  function initFooter() {
  const yearNode = document.getElementById('yearNow');
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());

  const topButtons = document.querySelectorAll('#backToTop, .footer__top');
  topButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

  /* ===== Quiz ===== */

  function initQuiz() {
  const quizData = [
    {
      q: 'Чем уникальна шерсть манула по сравнению с другими кошачьими?',
      a: [
        'Она самая короткая и гладкая',
        'Она самая густая',
        'Она может менять цвет в зависимости от сезона',
        'Она абсолютно водонепроницаема'
      ],
      correct: 1
    },
    {
      q: 'Где находится главный в России научный центр по изучению и охране манула?',
      a: [
        'Национальный парк «Лосиный остров» (Москва)',
        'Заповедник «Кивач» (Карелия)',
        'Государственный природный заповедник «Даурский» (Забайкальский край)',
        'Приокско-Террасный заповедник (Московская область)'
      ],
      correct: 2
    },
    {
      q: 'Какое животное составляет основу рациона манула (до 90%)?',
      a: ['Заяц-беляк', 'Пищуха', 'Суслик', 'Мышь-полевка'],
      correct: 1
    },
    {
      q: 'Какова ключевая природная угроза для манула, связанная с погодными условиями?',
      a: [
        'Сильная летняя жара',
        'Многоснежные зимы и гололед',
        'Продолжительные весенние дожди',
        'Ураганные ветра'
      ],
      correct: 1
    },
    {
      q: 'Что является самой значительной антропогенной угрозой для жизни манула?',
      a: [
        'Прямая охота ради меха',
        'Отлов для зоопарков',
        'Гибель в браконьерских проволочных петлях',
        'Конфликты с домашним скотом'
      ],
      correct: 2
    },
    {
      q: 'Какая особенность поведения делает манула непригодным для жизни как домашнего питомца?',
      a: [
        'Он слишком громко мяукает',
        'Он требует особого диетического питания',
        'Он абсолютно дикий и не приручается даже в неволе',
        'Он ведет исключительно ночной образ жизни'
      ],
      correct: 2
    },
    {
      q: 'Какой эволюционный признак отличает глаза манула от глаз большинства кошек?',
      a: [
        'Они светятся красным светом',
        'У них прямоугольные зрачки',
        'У них круглые зрачки',
        'Они полностью черного цвета'
      ],
      correct: 2
    },
    {
      q: 'Где в России НЕТ устойчивой популяции манула?',
      a: [
        'Республика Тыва',
        'Забайкальский край',
        'Приморский край (тайга и смешанные леса)',
        'Республика Алтай'
      ],
      correct: 2
    }
  ];

    const els = {
      text: $('#qText'),
      answers: $('#qAnswers'),
      prev: $('#qPrev'),
      next: $('#qNext'),
      current: $('#qCurrent'),
      total: $('#qTotal'),
      bar: $('#qBar'),
      result: $('#qResult'),
      title: $('#rTitle'),
      textResult: $('#rText'),
      restart: $('#qRestart')
    };

    if (Object.values(els).some((n) => !n)) return;

    let index = 0;
    const answers = Array(quizData.length).fill(null);
    let locked = false;

    els.total.textContent = quizData.length;

    const progress = () => {
      els.bar.style.width = `${(index / quizData.length) * 100}%`;
    };

    const render = () => {
      const q = quizData[index];
      locked = false;

      els.text.textContent = q.q;
      els.current.textContent = index + 1;
      els.answers.innerHTML = '';
      els.answers.classList.remove('is-locked');

      q.a.forEach((txt, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'quiz__answer';
        b.textContent = txt;

        if (answers[index] === i) b.classList.add('is-selected');

        b.addEventListener('click', () => {
          if (locked) return;
          answers[index] = i;
          $$('.quiz__answer', els.answers).forEach((x) => x.classList.remove('is-selected'));
          b.classList.add('is-selected');
          els.next.disabled = false;
        });

        els.answers.appendChild(b);
      });

      els.prev.disabled = index === 0;
      els.next.disabled = answers[index] === null;
      els.next.textContent = index === quizData.length - 1 ? 'Завершить' : 'Дальше';
      els.result.hidden = true;

      progress();
    };

    const showCorrect = () => {
      locked = true;
      els.answers.classList.add('is-locked');

      const correct = quizData[index].correct;
      $$('.quiz__answer', els.answers).forEach((b, i) => {
        if (i === correct) b.classList.add('is-correct');
        if (answers[index] === i && i !== correct) b.classList.add('is-wrong');
      });
    };

    const finish = () => {
      const ok = answers.filter((a, i) => a === quizData[i].correct).length;
      const pct = Math.round((ok / quizData.length) * 100);

      els.bar.style.width = '100%';
      els.text.textContent = 'Тест завершён';
      els.answers.innerHTML = '';

      els.title.textContent = `Результат: ${pct}%`;
      els.textResult.textContent =
        pct === 100
          ? 'Отлично! Вы прекрасно разбираетесь в теме манула.'
          : pct >= 70
          ? 'Хороший результат. Вы знаете о мануле больше, чем большинство людей.'
          : pct >= 40
          ? 'Неплохо, но статья явно была не зря 🙂'
          : 'Стоит перечитать материал — манул заслуживает внимания.';

      els.result.hidden = false;
      els.prev.disabled = true;
      els.next.disabled = true;
    };

    els.prev.addEventListener('click', () => {
      if (index > 0) {
        index--;
        render();
      }
    });

    els.next.addEventListener('click', () => {
      if (answers[index] === null) return;
      if (!locked) {
        showCorrect();
        setTimeout(() => {
          index < quizData.length - 1 ? (index++, render()) : finish();
        }, 600);
      }
    });

    els.restart.addEventListener('click', () => {
      answers.fill(null);
      index = 0;
      render();
      $('#quiz')?.scrollIntoView({ behavior: 'smooth' });
    });

    render();
  }

  /* ===== Photo Strip Auto Scroll ===== */

  function initPhotoStripAutoScroll() {
    return; // disabled (lag fix)
    const track = $('.photo-strip__track');
    if (!track) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf;
    let last = performance.now();
    let active = true;

    const step = (t) => {
      if (!active) return;
      const dt = (t - last) / 1000;
      last = t;

      const max = track.scrollWidth - track.clientWidth;
      if (max > 0) {
        track.scrollLeft += 45 * dt;
        if (track.scrollLeft >= max - 1) track.scrollLeft = 0;
      }

      raf = requestAnimationFrame(step);
    };

    const pause = () => {
      active = false;
      cancelAnimationFrame(raf);
      track.classList.remove('is-auto');
    };

    const resume = () => {
      if (active) return;
      active = true;
      last = performance.now();
      track.classList.add('is-auto');
      raf = requestAnimationFrame(step);
    };

    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', resume);
    track.addEventListener('wheel', pause, { passive: true });
    track.addEventListener('touchstart', pause, { passive: true });
    track.addEventListener('pointerdown', pause);

    let t;
    const resumeLater = () => {
      clearTimeout(t);
      t = setTimeout(resume, 2000);
    };

    track.addEventListener('wheel', resumeLater, { passive: true });
    track.addEventListener('touchend', resumeLater, { passive: true });
    track.addEventListener('pointerup', resumeLater);

    track.classList.add('is-auto');
    raf = requestAnimationFrame(step);
  }

  /* ===== Photo Strip: drag + lightbox ===== */

  function initPhotoStripGallery() {
    const track = $('.photo-strip__track');
    if (!track) return;

    const images = $$('.photo-strip__item img', track);
    if (!images.length) return;

    images.forEach((img) => { img.draggable = false; });

    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    let ignoreClick = false;
    let targetScroll = 0;
    let rafMove = 0;

    const onDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture?.(e.pointerId);
      track.classList.add('is-dragging');
    };

    const onMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      targetScroll = startScroll - dx;
      if (!rafMove) {
        rafMove = requestAnimationFrame(() => {
          rafMove = 0;
          track.scrollLeft = targetScroll;
        });
      }
      e.preventDefault();
    };

    const onUp = (e) => {
      if (!isDown) return;
      isDown = false;
      if (rafMove) { cancelAnimationFrame(rafMove); rafMove = 0; }
      track.releasePointerCapture?.(e.pointerId);
      track.classList.remove('is-dragging');

      if (moved) {
        ignoreClick = true;
        setTimeout(() => {
          ignoreClick = false;
        }, 120);
      }
    };

    track.addEventListener('pointerdown', onDown);
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', onUp);
    track.addEventListener('pointercancel', onUp);

    const lightbox = document.createElement('div');
    lightbox.className = 'photo-lightbox';
    lightbox.hidden = true;
    lightbox.innerHTML = `
      <div class="photo-lightbox__backdrop" data-action="close"></div>
      <div class="photo-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Просмотр фото">
        <button class="photo-lightbox__close" type="button" aria-label="Закрыть" data-action="close">×</button>
        <button class="photo-lightbox__nav photo-lightbox__nav--prev" type="button" aria-label="Предыдущее" data-action="prev">‹</button>
        <figure class="photo-lightbox__figure">
          <img class="photo-lightbox__img" alt="" draggable="false" />
          <figcaption class="photo-lightbox__caption"></figcaption>
        </figure>
        <button class="photo-lightbox__nav photo-lightbox__nav--next" type="button" aria-label="Следующее" data-action="next">›</button>
      </div>
    `;
    document.body.appendChild(lightbox);

    const imgEl = $('.photo-lightbox__img', lightbox);
    const captionEl = $('.photo-lightbox__caption', lightbox);

    let index = 0;
    let lastActive = null;

    const setBodyLock = (lock) => {
      document.documentElement.classList.toggle('is-modal-open', lock);
    };

    const show = (i) => {
      index = (i + images.length) % images.length;
      const src = images[index].getAttribute('src');
      const alt = images[index].getAttribute('alt') || '';
      imgEl.src = src;
      imgEl.alt = alt;
      captionEl.textContent = alt;
    };

    const open = (i) => {
      lastActive = document.activeElement;
      lightbox.hidden = false;
      setBodyLock(true);
      show(i);
      $('.photo-lightbox__close', lightbox)?.focus();
    };

    const close = () => {
      lightbox.hidden = true;
      setBodyLock(false);
      imgEl.removeAttribute('src');
      captionEl.textContent = '';
      if (lastActive && lastActive.focus) lastActive.focus();
    };

    const prev = () => show(index - 1);
    const next = () => show(index + 1);

    lightbox.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const act = btn.getAttribute('data-action');
      if (act === 'close') close();
      if (act === 'prev') prev();
      if (act === 'next') next();
    });

    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    let swipeDown = false;
    let swipeStartX = 0;

    const swipeStart = (e) => {
      swipeDown = true;
      swipeStartX = e.clientX;
      imgEl.setPointerCapture?.(e.pointerId);
    };

    const swipeEnd = (e) => {
      if (!swipeDown) return;
      swipeDown = false;
      imgEl.releasePointerCapture?.(e.pointerId);
      const dx = e.clientX - swipeStartX;
      if (Math.abs(dx) < 50) return;
      dx > 0 ? prev() : next();
    };

    imgEl.addEventListener('pointerdown', swipeStart);
    imgEl.addEventListener('pointerup', swipeEnd);
    imgEl.addEventListener('pointercancel', swipeEnd);

    images.forEach((img, i) => {
      img.addEventListener('click', (e) => {
        if (ignoreClick) return;
        e.preventDefault();
        open(i);
      });
    });
  }

  /* ===== Init ===== */

  async function initApp() {
    try {
      if (window.CMS) {
        const cmsData = await window.CMS.load('./data/site.json');
        window.CMS.apply(document, cmsData);
      }

      const headerApi = initHeaderNav();
      initSmoothScroll(headerApi);      initAppearancePanel();
      initFooter();
      initQuiz();
initPhotoStripGallery();
    } catch (e) {
      console.error(e);
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();