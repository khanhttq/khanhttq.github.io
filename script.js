(function () {
  "use strict";

  var BRIEF_ENDPOINT = "https://brief-proxy.trankhanh-qk.workers.dev"; // deployed brief-proxy Worker
  var BRIEF_TIMEOUT_MS = 15000;

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", function () {
      var isOpen = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        panel.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    // Stagger items that share a parent (cards in a grid, stats in a row).
    items.forEach(function (el) {
      var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) {
        return c.classList.contains("reveal");
      });
      var i = siblings.indexOf(el);
      if (i > 0) el.style.setProperty("--reveal-delay", Math.min(i, 5) * 90 + "ms");
    });
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach(function (el) { observer.observe(el); });
  }

  // Count stat numbers up from zero when they scroll into view ("06", "60+", "100%").
  function initCountUp() {
    if (!motionOK || !("IntersectionObserver" in window)) return;
    var nums = document.querySelectorAll(".stat-num");
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          var el = entry.target;
          var match = /^(\d+)(.*)$/.exec(el.textContent.trim());
          if (!match) return;
          var target = Number(match[1]);
          if (target < 5) return;
          var pad = match[1].charAt(0) === "0" ? match[1].length : 0;
          var suffix = match[2];
          var start = null;
          var duration = 1400;
          el.setAttribute("aria-label", el.textContent.trim());
          function frame(now) {
            if (start === null) start = now;
            var t = Math.min((now - start) / duration, 1);
            var value = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
            while (value.length < pad) value = "0" + value;
            el.textContent = value + suffix;
            if (t < 1) requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach(function (el) { observer.observe(el); });
  }

  // Header shadow, scroll progress line and a gentle hero image parallax.
  function initScrollEffects() {
    var header = document.querySelector(".site-header");
    var progress = null;
    if (header) {
      progress = document.createElement("div");
      progress.className = "scroll-progress";
      progress.setAttribute("aria-hidden", "true");
      header.appendChild(progress);
    }
    var parallaxImgs = motionOK ? document.querySelectorAll(".hero-media img") : [];
    var wide = window.matchMedia("(min-width: 769px)");
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (header) {
        header.classList.toggle("is-scrolled", y > 8);
        progress.style.setProperty("--scroll-progress", max > 0 ? Math.min(y / max, 1) : 0);
      }
      Array.prototype.forEach.call(parallaxImgs, function (img) {
        if (!wide.matches) { img.style.removeProperty("--parallax"); return; }
        var rect = img.parentNode.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.08;
        var limit = rect.height * 0.035;
        img.style.setProperty("--parallax", Math.max(-limit, Math.min(limit, offset)).toFixed(1) + "px");
      });
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  function initProjectFilter() {
    var rail = document.querySelector(".filter-rail");
    var cards = document.querySelectorAll("[data-category]");
    if (!rail || !cards.length) return;
    rail.addEventListener("click", function (event) {
      var chip = event.target.closest(".filter-chip");
      if (!chip) return;
      rail.querySelectorAll(".filter-chip").forEach(function (c) {
        c.classList.remove("is-active");
        c.setAttribute("aria-pressed", "false");
      });
      chip.classList.add("is-active");
      chip.setAttribute("aria-pressed", "true");
      var category = chip.dataset.filter;
      cards.forEach(function (card) {
        var show = category === "all" || card.dataset.category === category;
        card.style.display = show ? "" : "none";
      });
    });
  }

  function validateField(field) {
    var wrapper = field.closest(".od-field");
    if (!wrapper) return true;
    var valid = field.checkValidity();
    wrapper.classList.toggle("has-error", !valid);
    return valid;
  }

  function initExperienceYears() {
    var currentYear = new Date().getFullYear();
    document.querySelectorAll("[data-start-year]").forEach(function (el) {
      el.textContent = currentYear - Number(el.dataset.startYear);
    });
    document.querySelectorAll("[data-start-years]").forEach(function (el) {
      var total = el.dataset.startYears.split(",").reduce(function (sum, year) {
        return sum + currentYear - Number(year);
      }, 0);
      el.textContent = total + "+";
    });
  }

  function initContactForm() {
    var form = document.querySelector("#brief-form");
    if (!form) return;
    var status = form.querySelector(".form-status");
    var fields = form.querySelectorAll("input[required], select[required], textarea[required]");

    fields.forEach(function (field) {
      field.addEventListener("blur", function () { validateField(field); });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var allValid = true;
      fields.forEach(function (field) {
        if (!validateField(field)) allValid = false;
      });

      if (!allValid) {
        status.textContent = "Vui lòng kiểm tra lại các trường được đánh dấu bên dưới.";
        status.classList.remove("is-error");
        status.classList.add("is-visible", "is-error");
        var firstError = form.querySelector(".has-error input, .has-error select, .has-error textarea");
        if (firstError) firstError.focus();
        return;
      }

      var captcha = form.elements["cf-turnstile-response"];
      var captchaToken = captcha ? captcha.value : "";
      if (!captchaToken) {
        status.textContent = "Vui lòng hoàn tất bước xác minh trước khi gửi.";
        status.classList.add("is-visible", "is-error");
        return;
      }

      var submitBtn = form.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang gửi...";

      status.classList.remove("is-visible", "is-error");

      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, BRIEF_TIMEOUT_MS);

      function finish(message, isError) {
        clearTimeout(timeout);
        if (window.turnstile) window.turnstile.reset(); // tokens are single-use
        status.textContent = message;
        status.classList.toggle("is-error", isError);
        status.classList.add("is-visible");
        submitBtn.disabled = false;
        submitBtn.textContent = "Gửi brief";
        status.setAttribute("tabindex", "-1");
        status.focus();
      }

      var request = !BRIEF_ENDPOINT
        ? Promise.reject(new Error("BRIEF_ENDPOINT is not configured"))
        : fetch(BRIEF_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              full_name: form.elements["full-name"].value,
              email: form.elements["email"].value,
              project_type: form.elements["project-type"].value,
              budget: form.elements["budget"].value,
              brief: form.elements["brief"].value,
              turnstile_token: captchaToken
            })
          });

      request
        .then(function (response) {
          if (!response.ok) throw new Error("Brief proxy responded " + response.status);
          form.reset();
          form.querySelectorAll(".od-field").forEach(function (f) { f.classList.remove("has-error"); });
          finish("Đã nhận brief của bạn. Chúng tôi sẽ phản hồi trong vòng 1–2 ngày làm việc qua email.", false);
        })
        .catch(function () {
          finish("Chưa gửi được brief. Nội dung bạn nhập vẫn được giữ nguyên, vui lòng thử lại sau ít phút.", true);
        });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initExperienceYears();
    initReveal();
    initCountUp();
    initScrollEffects();
    initProjectFilter();
    initContactForm();
  });
})();
