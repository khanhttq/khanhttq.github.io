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

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, index) {
          if (entry.isIntersecting) {
            setTimeout(function () {
              entry.target.classList.add("is-visible");
            }, (index % 6) * 40);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (el) { observer.observe(el); });
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
    initReveal();
    initProjectFilter();
    initContactForm();
    initExperienceYears();
  });
})();
