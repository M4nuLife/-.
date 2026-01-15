
console.log("main.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const HEADER_OFFSET = 90;

  // =========================
  // ПЛАВНЫЙ СКРОЛЛ (ТОЛЬКО JS)
  // =========================
  document.addEventListener(
    "click",
    (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const id = link.getAttribute("href");
      if (!id || id === "#") return;

      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      e.stopPropagation();

      const targetTop =
        target.getBoundingClientRect().top + window.pageYOffset;
      const scrollY = Math.max(0, targetTop - HEADER_OFFSET);

      console.log("SCROLL TO:", scrollY);

      window.scrollTo({
        top: scrollY,
        behavior: "smooth",
      });
    },
    true // capture-фаза — КЛЮЧЕВО
  );

  // =========================
  // КНОПКА "УЗНАТЬ БОЛЬШЕ"
  // =========================
  const btn = document.querySelector(".btn-main");
  if (btn) {
    btn.addEventListener("click", () => {
      const target = document.querySelector("#appearance");
      if (!target) return;

      const targetTop =
        target.getBoundingClientRect().top + window.pageYOffset;
      const scrollY = Math.max(0, targetTop - HEADER_OFFSET);

      console.log("BUTTON SCROLL TO:", scrollY);

      window.scrollTo({
        top: scrollY,
        behavior: "smooth",
      });
    });
  }

  // =========================
  // ШАПКА ПРИ СКРОЛЛЕ
  // =========================
  const header = document.getElementById("header");
  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("header--scrolled", window.scrollY > 20);
  };

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  // =========================
  // APPEARANCE PANEL
  // =========================
  const panel = document.querySelector(".appearance__panel");
  if (panel) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        panel.classList.toggle("is-visible", entry.isIntersecting);
      },
      { threshold: 0.35 }
    );
    observer.observe(panel);
  }
});
