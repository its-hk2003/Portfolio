/* Dharamveer Singh Tanwar — portfolio behaviour.
   Plain JS, no dependencies. Everything animated here is skipped
   when the visitor asks for reduced motion. */
(function () {
  "use strict";

  /* Where enquiries go.
     FORM_ENDPOINT empty  -> the form falls back to opening the visitor's mail app.
     FORM_ENDPOINT set    -> the form POSTs there and you get a record in that
     service's dashboard / inbox. Paste a Formspree URL (https://formspree.io/f/xxxxxxx)
     or any endpoint that accepts a POSTed form. Nothing else needs changing. */
  const FORM_ENDPOINT = "";
  const CONTACT_EMAIL = "dharamveer22062004@gmail.com";

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Theme ---- */
  const KEY = "dst-theme";
  const themeBtn = $("#themeToggle");

  function setTheme(theme) {
    if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");

    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", String(theme === "light"));
      themeBtn.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
    }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f9f6f1" : "#0f0e0d");
  }

  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  setTheme(saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      setTheme(next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
    });
  }

  /* ---- Menu on small screens ---- */
  const nav = $("#nav");
  const links = $("#navLinks");
  const navBtn = $("#navToggle");

  function shut() {
    links.classList.remove("is-open");
    nav.classList.remove("menu-open");
    navBtn.setAttribute("aria-expanded", "false");
    navBtn.setAttribute("aria-label", "Open menu");
  }

  if (links && navBtn) {
    navBtn.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      nav.classList.toggle("menu-open", open);
      navBtn.setAttribute("aria-expanded", String(open));
      navBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    links.addEventListener("click", (e) => { if (e.target.tagName === "A") shut(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && links.classList.contains("is-open")) { shut(); navBtn.focus(); }
    });
  }

  /* ---- Nav background + reading progress ---- */
  const bar = $("#progressBar");
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("is-stuck", y > 10);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---- Reveal on scroll ---- */
  const items = $$(".r, .step");
  items.forEach((el) => { if (el.dataset.r) el.style.setProperty("--d", el.dataset.r); });

  if (still || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -7% 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* ---- Which section the menu should highlight ---- */
  const byId = {};
  $$(".nav__links a").forEach((a) => { byId[a.getAttribute("href").slice(1)] = a; });

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = byId[entry.target.id];
        if (!link || !entry.isIntersecting) return;
        Object.values(byId).forEach((a) => a.classList.remove("is-active"));
        link.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => spy.observe(s));
  }

  /* ---- Pointer warmth on the service cards + hero ---- */
  if (!still && window.matchMedia("(hover: hover)").matches) {
    $$(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const box = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - box.left) / box.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - box.top) / box.height) * 100 + "%");
      });
    });

    const wash = $("#heroWash");
    const hero = $(".hero");
    if (wash && hero) {
      hero.addEventListener("pointermove", (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 34;
        const y = (e.clientY / window.innerHeight - 0.5) * 22;
        wash.style.transform = `translateX(-50%) translate(${x}px, ${y}px)`;
      });
      hero.addEventListener("pointerleave", () => { wash.style.transform = "translateX(-50%)"; });
    }
  }

  /* ---- Project photos: only swap out the drawn graphic once a photo loads ---- */
  $$(".work__shot").forEach((img) => {
    const show = () => img.closest(".work__thumb").classList.add("has-shot");
    if (img.complete && img.naturalWidth > 0) show();
    else img.addEventListener("load", show);
  });

  /* ---- Contact form ---- */
  const form = $("#contactForm");
  const statusEl = $("#formStatus");
  const sendBtn = $("#submitBtn");

  const checks = {
    name:    (v) => (v.trim().length >= 2 ? "" : "I need a name to reply to."),
    email:   (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "That email address doesn’t look right."),
    service: (v) => (v ? "" : "Pick whichever is closest."),
    message: (v) => (v.trim().length >= 12 ? "" : "A sentence or two, so I know what this is about."),
  };

  function check(input) {
    const rule = checks[input.name];
    if (!rule) return true;
    const problem = rule(input.value);
    const field = input.closest(".field");
    field.classList.toggle("has-error", Boolean(problem));
    const slot = field.querySelector(".error");
    if (slot) slot.textContent = problem;
    return !problem;
  }

  if (form) {
    $$("input, select, textarea", form).forEach((input) => {
      input.addEventListener("blur", () => check(input));
      input.addEventListener("input", () => {
        if (input.closest(".field").classList.contains("has-error")) check(input);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      statusEl.textContent = "";
      statusEl.classList.remove("is-error");

      const fields = $$("input, select, textarea", form);
      const bad = fields.filter((i) => !check(i));

      if (bad.length) {
        statusEl.textContent = "A couple of things need fixing above.";
        statusEl.classList.add("is-error");
        bad[0].focus();
        return;
      }

      const data = new FormData(form);
      const subject = `Project enquiry \u2014 ${data.get("service")}`;
      const body =
        `Name: ${data.get("name")}\n` +
        `Email: ${data.get("email")}\n` +
        `Need: ${data.get("service")}\n\n` +
        `${data.get("message")}\n`;

      const label = $(".btn__label", sendBtn);

      const done = (text, failed) => {
        sendBtn.disabled = false;
        label.textContent = "Send it";
        statusEl.textContent = text;
        statusEl.classList.toggle("is-error", Boolean(failed));
      };

      sendBtn.disabled = true;
      label.textContent = "Sending";

      if (!FORM_ENDPOINT) {
        // No form service configured yet, so hand the message to the visitor's
        // own mail app. They still have to press send, so this is a fallback.
        window.location.href =
          `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setTimeout(() => {
          done("Your draft is ready in your mail app \u2014 press send there and I\u2019ll reply within a day.");
        }, 900);
        return;
      }

      fetch(FORM_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Bad response " + res.status);
          form.reset();
          done("Thanks \u2014 that\u2019s with me. I\u2019ll reply within a working day.");
        })
        .catch(() => {
          done(
            "That didn\u2019t send. Email me directly at " + CONTACT_EMAIL + " and I\u2019ll pick it up.",
            true
          );
        });
    });
  }

  /* ---- Year ---- */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
