(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const HEADER_SCROLL_Y = 20;
  const SCROLL_EXTRA_OFFSET = 20;

  function initHeaderNav() {
    const header = $('#header');
    const navToggle = $('.nav-toggle');
    const nav = $('.nav');

    if (!header) return;

    const setHeaderState = () => {
      header.classList.toggle('header--scrolled', window.scrollY > HEADER_SCROLL_Y);
    };

    const setNavOpen = (open) => {
      header.classList.toggle('nav-open', open);
      navToggle?.setAttribute('aria-expanded', String(open));
    };

    const closeNav = () => setNavOpen(false);

    window.addEventListener('scroll', setHeaderState, { passive: true });
    setHeaderState();

    navToggle?.addEventListener('click', () => {
      const isOpen = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });

    document.addEventListener('click', (e) => {
      if (!header.classList.contains('nav-open')) return;
      if (e.target.closest('.nav-toggle')) return;
      if (nav && nav.contains(e.target)) return;
      closeNav();
    });

    return { header, closeNav };
  }

  function initSmoothScroll(headerApi) {
    const header = headerApi?.header;

    const getOffset = () => (header ? header.offsetHeight + SCROLL_EXTRA_OFFSET : 90);

    const scrollToId = (id) => {
      const target = $(id);
      if (!target) return;

      const top = target.getBoundingClientRect().top + window.pageYOffset - getOffset();
      window.scrollTo({ top, behavior: 'smooth' });
    };

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      if (!$(id)) return;

      e.preventDefault();
      scrollToId(id);
      headerApi?.closeNav?.();
    });

    $('.btn-main')?.addEventListener('click', () => scrollToId('#appearance'));
  }

  function initRevealOnScroll() {
    const sections = $$('main > section');
    if (!sections.length) return;

    sections.forEach((s) => s.classList.add('reveal'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-inview', entry.isIntersecting);
        });
      },
      { threshold: 0.12 }
    );

    sections.forEach((s) => observer.observe(s));
  }

  function initAppearancePanel() {
    const panel = $('.appearance__panel');
    if (!panel) return;

    const observer = new IntersectionObserver(
      ([entry]) => panel.classList.toggle('is-visible', entry.isIntersecting),
      { threshold: 0.35 }
    );

    observer.observe(panel);
  }

  function initFooter() {
    const yearNode = $('#yearNow');
    if (yearNode) yearNode.textContent = String(new Date().getFullYear());

    $('#backToTop')?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

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
        a: [
          'Заяц-беляк',
          'Пищуха',
          'Суслик',
          'Мышь-полевка'
        ],
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

    const qText = $('#qText');
    const qAnswers = $('#qAnswers');
    const qPrev = $('#qPrev');
    const qNext = $('#qNext');
    const qCurrent = $('#qCurrent');
    const qTotal = $('#qTotal');
    const qBar = $('#qBar');

    const qResult = $('#qResult');
    const rTitle = $('#rTitle');
    const rText = $('#rText');
    const qRestart = $('#qRestart');

    const required = [qText, qAnswers, qPrev, qNext, qCurrent, qTotal, qBar, qResult, rTitle, rText, qRestart];
    if (required.some((n) => !n)) return;

    let index = 0;
    const answers = Array(quizData.length).fill(null);
    let showCorrect = false;

    qTotal.textContent = String(quizData.length);

    const setProgress = () => {
      const pct = (index / quizData.length) * 100;
      qBar.style.width = `${pct}%`;
    };

    function renderQuestion() {
      const item = quizData[index];
      if (!item) return;

      showCorrect = false;
      qAnswers.classList.remove('is-locked');

      qText.textContent = item.q;
      qCurrent.textContent = String(index + 1);
      setProgress();

      qAnswers.innerHTML = '';

      const frag = document.createDocumentFragment();

      item.a.forEach((text, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz__answer';
        btn.textContent = text;

        if (answers[index] === i) btn.classList.add('is-selected');

        btn.addEventListener('click', () => {
          if (showCorrect) return;

          answers[index] = i;

          $$('.quiz__answer', qAnswers).forEach((b) => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');

          qNext.disabled = false;
        });

        frag.appendChild(btn);
      });

      qAnswers.appendChild(frag);

      qPrev.disabled = index === 0;
      qNext.disabled = answers[index] === null;
      qNext.textContent = index === quizData.length - 1 ? 'Завершить' : 'Дальше';

      qResult.hidden = true;
    }

    function highlightCorrect() {
      showCorrect = true;
      qAnswers.classList.add('is-locked');

      const correctIndex = quizData[index].correct;

      $$('.quiz__answer', qAnswers).forEach((btn, i) => {
        if (i === correctIndex) btn.classList.add('is-correct');
        if (answers[index] === i && i !== correctIndex) btn.classList.add('is-wrong');
      });
    }

    function finishQuiz() {
      const correctCount = answers.reduce(
        (sum, val, i) => sum + (val === quizData[i].correct ? 1 : 0),
        0
      );

      const percent = Math.round((correctCount / quizData.length) * 100);

      qBar.style.width = '100%';
      qText.textContent = 'Тест завершён';
      qAnswers.innerHTML = '';

      rTitle.textContent = `Результат: ${percent}%`;

      if (percent === 100) {
        rText.textContent = 'Отлично! Вы прекрасно разбираетесь в теме манула.';
      } else if (percent >= 70) {
        rText.textContent = 'Хороший результат. Вы знаете о мануле больше, чем большинство людей.';
      } else if (percent >= 40) {
        rText.textContent = 'Неплохо, но статья явно была не зря 🙂';
      } else {
        rText.textContent = 'Стоит перечитать материал — манул заслуживает внимания.';
      }

      qResult.hidden = false;
      qPrev.disabled = true;
      qNext.disabled = true;
    }

    qPrev.addEventListener('click', () => {
      if (index === 0) return;
      index -= 1;
      renderQuestion();
    });

    qNext.addEventListener('click', () => {
      if (answers[index] === null) return;

      if (!showCorrect) {
        highlightCorrect();

        window.setTimeout(() => {
          if (index < quizData.length - 1) {
            index += 1;
            renderQuestion();
          } else {
            finishQuiz();
          }
        }, 600);
      }
    });

    qRestart.addEventListener('click', () => {
      answers.fill(null);
      index = 0;
      renderQuestion();
      $('#quiz')?.scrollIntoView({ behavior: 'smooth' });
    });

    renderQuestion();
  }

  function initPhotoStripAutoScroll() {
    const track = document.querySelector('.photo-strip__track');
    if (!track) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    track.classList.add('is-auto');

    const SPEED = 45;
    let rafId = null;
    let running = true;
    let last = performance.now();

    const pause = () => {
      if (!running) return;
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      track.classList.remove('is-auto');
    };

    const resume = () => {
      if (running) return;
      running = true;
      track.classList.add('is-auto');
      last = performance.now();
      rafId = requestAnimationFrame(step);
    };

    const step = (now) => {
      if (!running) return;

      const dt = (now - last) / 1000;
      last = now;

      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll > 0) {
        track.scrollLeft += SPEED * dt;
        if (track.scrollLeft >= maxScroll - 1) track.scrollLeft = 0;
      }

      rafId = requestAnimationFrame(step);
    };

    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', resume);

    track.addEventListener('wheel', pause, { passive: true });
    track.addEventListener('touchstart', pause, { passive: true });
    track.addEventListener('pointerdown', pause);

    let t = null;
    const resumeLater = () => {
      clearTimeout(t);
      t = setTimeout(resume, 2000);
    };

    track.addEventListener('wheel', resumeLater, { passive: true });
    track.addEventListener('touchend', resumeLater, { passive: true });
    track.addEventListener('pointerup', resumeLater);

    rafId = requestAnimationFrame(step);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const headerApi = initHeaderNav();
    initSmoothScroll(headerApi);
    initRevealOnScroll();
    initAppearancePanel();
    initFooter();
    initQuiz();
    initPhotoStripAutoScroll();
  });
})();



