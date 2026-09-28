/* ==========================================================================
   Bilrey Engineering — main.js
   Vanilla JS only. Handles: sticky nav state, mobile menu, scroll-reveal,
   animated stat counters, project filtering, testimonial carousel,
   case-study modal, and contact form validation.
   ========================================================================== */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Sticky / adaptive navigation
     --------------------------------------------------------------------- */
  function initNav() {
    var nav = document.getElementById("site-nav");
    if (!nav) return;

    var isHome = nav.getAttribute("data-transparent-home") === "true";

    function updateScrollState() {
      var scrolled = window.scrollY > 24;
      nav.setAttribute("data-scrolled", isHome ? String(scrolled) : "true");
      nav.classList.toggle("text-white", isHome && !scrolled);
      nav.classList.toggle("text-[var(--ink-900)]", !(isHome && !scrolled));
    }

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    var toggle = document.getElementById("nav-toggle");
    var menu = document.getElementById("mobile-menu");
    var iconOpen = document.getElementById("icon-menu-open");
    var iconClose = document.getElementById("icon-menu-close");

    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var isOpen = menu.classList.contains("is-open");
        setMenu(!isOpen);
      });

      menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          setMenu(false);
        });
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menu.classList.contains("is-open")) {
          setMenu(false);
          toggle.focus();
        }
      });
    }

    function setMenu(open) {
      menu.classList.toggle("is-open", open);
      menu.classList.toggle("hidden", !open);
      toggle.setAttribute("aria-expanded", String(open));
      if (iconOpen && iconClose) {
        iconOpen.classList.toggle("hidden", open);
        iconClose.classList.toggle("hidden", !open);
      }
      document.body.classList.toggle("overflow-hidden", open);
    }

    /* Active nav link highlighting based on current path */
    var here = window.location.pathname.split("/").pop() || "index.html";
    nav.querySelectorAll("[data-nav-link]").forEach(function (link) {
      var target = link.getAttribute("data-nav-link");
      if (target === here) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------------------------------------------------------------------
     Scroll reveal (IntersectionObserver)
     --------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Animated stat counters
     --------------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;

    function animate(el) {
      var target = parseFloat(el.getAttribute("data-counter"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (prefersReducedMotion) {
        el.textContent = target + suffix;
        return;
      }
      var duration = 1400;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.floor(eased * target);
        el.textContent = value + suffix;
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = target + suffix;
        }
      }
      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animate);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Project filtering
     --------------------------------------------------------------------- */
  function initProjectFilter() {
    var chips = document.querySelectorAll("[data-filter]");
    var cards = document.querySelectorAll("[data-category]");
    if (!chips.length || !cards.length) return;

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        var filter = chip.getAttribute("data-filter");

        cards.forEach(function (card) {
          var category = card.getAttribute("data-category");
          var match = filter === "all" || category === filter;
          if (match) {
            card.hidden = false;
            requestAnimationFrame(function () {
              card.classList.remove("filtering-out");
            });
          } else {
            card.classList.add("filtering-out");
            window.setTimeout(function () {
              card.hidden = true;
            }, prefersReducedMotion ? 0 : 300);
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Case study modal
     --------------------------------------------------------------------- */
  function initProjectModal() {
    var modal = document.getElementById("case-study-modal");
    if (!modal) return;

    var panel = modal.querySelector(".modal-panel");
    var closeBtn = modal.querySelector("[data-modal-close]");
    var triggers = document.querySelectorAll("[data-case-study]");
    var lastFocused = null;

    var fields = {
      category: modal.querySelector("[data-field='category']"),
      title: modal.querySelector("[data-field='title']"),
      location: modal.querySelector("[data-field='location']"),
      image: modal.querySelector("[data-field='image']"),
      overview: modal.querySelector("[data-field='overview']"),
      challenge: modal.querySelector("[data-field='challenge']"),
      approach: modal.querySelector("[data-field='approach']"),
      solution: modal.querySelector("[data-field='solution']"),
      results: modal.querySelector("[data-field='results']"),
      tech: modal.querySelector("[data-field='tech']")
    };

    function openModal(data) {
      lastFocused = document.activeElement;
      fields.category.textContent = data.category || "";
      fields.title.textContent = data.title || "";
      fields.location.textContent = data.location || "";
      fields.image.src = data.image || "";
      fields.image.alt = data.title ? data.title + " project photograph" : "";
      fields.image.classList.toggle("hidden", !data.image);
      fields.overview.textContent = data.overview || "";
      fields.challenge.textContent = data.challenge || "";
      fields.approach.textContent = data.approach || "";
      fields.solution.textContent = data.solution || "";
      fields.results.textContent = data.results || "";
      fields.tech.innerHTML = "";
      (data.tech || "").split(",").forEach(function (t) {
        t = t.trim();
        if (!t) return;
        var span = document.createElement("span");
        span.className = "tech-chip inline-flex items-center rounded-full border border-[var(--line)] px-3 py-1 text-xs font-medium text-[var(--ink-600)]";
        span.textContent = t;
        fields.tech.appendChild(span);
      });

      modal.classList.remove("hidden");
      document.body.classList.add("overflow-hidden");
      window.requestAnimationFrame(function () {
        closeBtn.focus();
      });
      document.addEventListener("keydown", onKeydown);
    }

    function closeModal() {
      modal.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
      document.removeEventListener("keydown", onKeydown);
      if (lastFocused) lastFocused.focus();
    }

    function onKeydown(e) {
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab") trapFocus(e);
    }

    function trapFocus(e) {
      var focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        openModal({
          category: trigger.getAttribute("data-category-label"),
          title: trigger.getAttribute("data-title"),
          location: trigger.getAttribute("data-location"),
          image: trigger.getAttribute("data-image"),
          overview: trigger.getAttribute("data-overview"),
          challenge: trigger.getAttribute("data-challenge"),
          approach: trigger.getAttribute("data-approach"),
          solution: trigger.getAttribute("data-solution"),
          results: trigger.getAttribute("data-results"),
          tech: trigger.getAttribute("data-tech")
        });
      });
    });

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.classList.contains("modal-overlay")) {
        closeModal();
      }
    });
  }

  /* ---------------------------------------------------------------------
     Testimonial carousel
     --------------------------------------------------------------------- */
  function initTestimonialCarousel() {
    var root = document.querySelector("[data-carousel]");
    if (!root) return;

    var track = root.querySelector(".testimonial-track");
    var slides = root.querySelectorAll("[data-slide]");
    var prevBtn = root.querySelector("[data-carousel-prev]");
    var nextBtn = root.querySelector("[data-carousel-next]");
    var dotsWrap = root.querySelector("[data-carousel-dots]");
    if (!track || !slides.length) return;

    var index = 0;
    var dots = [];

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot h-2.5 w-2.5 rounded-full";
      dot.setAttribute("aria-label", "Go to testimonial " + (i + 1));
      dot.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (d, di) {
        d.setAttribute("aria-current", String(di === index));
      });
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); });

    goTo(0);

    var autoplay;
    function startAutoplay() {
      if (prefersReducedMotion) return;
      autoplay = window.setInterval(function () { goTo(index + 1); }, 7000);
    }
    function stopAutoplay() {
      window.clearInterval(autoplay);
    }
    startAutoplay();
    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);
    root.addEventListener("focusin", stopAutoplay);
    root.addEventListener("focusout", startAutoplay);
  }

  /* ---------------------------------------------------------------------
     Contact form validation
     --------------------------------------------------------------------- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var successPanel = document.getElementById("form-success");

    var validators = {
      "full-name": function (v) { return v.trim().length >= 2; },
      "email": function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      "phone": function (v) { return v.trim() === "" || /^[0-9+()\-.\s]{7,20}$/.test(v.trim()); },
      "project-type": function (v) { return v.trim() !== ""; },
      "message": function (v) { return v.trim().length >= 10; }
    };

    var messages = {
      "full-name": "Please enter your full name (2+ characters).",
      "email": "Please enter a valid email address.",
      "phone": "Please enter a valid phone number.",
      "project-type": "Please select a project type.",
      "message": "Please provide a few details (10+ characters)."
    };

    function validateField(field) {
      var name = field.name;
      var validator = validators[name];
      if (!validator) return true;
      var valid = validator(field.value);
      var errorEl = form.querySelector('[data-error-for="' + name + '"]');
      field.setAttribute("aria-invalid", String(!valid));
      if (errorEl) {
        errorEl.textContent = valid ? "" : messages[name];
        errorEl.classList.toggle("is-visible", !valid);
      }
      return valid;
    }

    Object.keys(validators).forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      field.addEventListener("blur", function () { validateField(field); });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var allValid = true;
      Object.keys(validators).forEach(function (name) {
        var field = form.elements[name];
        if (!field) return;
        if (!validateField(field)) allValid = false;
      });

      if (!allValid) {
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      form.classList.add("hidden");
      if (successPanel) {
        successPanel.classList.remove("hidden");
        successPanel.setAttribute("tabindex", "-1");
        successPanel.focus();
      }
    });
  }

  /* ---------------------------------------------------------------------
     Init
     --------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveal();
    initCounters();
    initProjectFilter();
    initProjectModal();
    initTestimonialCarousel();
    initContactForm();
  });
})();
