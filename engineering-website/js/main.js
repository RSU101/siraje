/* ===== ENGINEERING PRO - Main JavaScript ===== */
/* Backend forms + validation + responsive mobile menu + 3D viewer */

(function () {
  'use strict';

  const API_BASE = 'backend/api.php';

  document.addEventListener('DOMContentLoaded', function () {
    initSlideshow();
    initMobileMenu();
    initActiveNav();
    initBackToTop();
    initForms();
    initLiveClock();
    initStatCounters();
    initScrollReveal();
    initModelViewers();
  });

  /* ---------- Slideshow ---------- */
  function initSlideshow() {
    var slides = document.querySelectorAll('.slide');
    var dots = document.querySelectorAll('.dot-indicator');
    var prevBtn = document.querySelector('.slide-nav.prev');
    var nextBtn = document.querySelector('.slide-nav.next');
    var currentSlide = 0;
    var slideInterval;

    if (!slides.length) return;

    function showSlide(index) {
      slides.forEach(function (s, i) { s.classList.toggle('active', i === index); });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
      currentSlide = index;
    }

    function nextSlide() { showSlide((currentSlide + 1) % slides.length); }
    function prevSlide() { showSlide((currentSlide - 1 + slides.length) % slides.length); }
    function start() { slideInterval = setInterval(nextSlide, 5000); }
    function stop() { clearInterval(slideInterval); }

    showSlide(0);
    start();

    if (nextBtn) nextBtn.addEventListener('click', function () { stop(); nextSlide(); start(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { stop(); prevSlide(); start(); });
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { stop(); showSlide(i); start(); });
    });

    var slideshow = document.querySelector('.slideshow');
    if (slideshow) {
      slideshow.addEventListener('mouseenter', stop);
      slideshow.addEventListener('mouseleave', start);
    }
  }

  /* ---------- Responsive Mobile Menu ---------- */
  function initMobileMenu() {
    var hamburger = document.querySelector('.hamburger');
    var navLinks = document.querySelector('.nav-links');
    var overlay = document.querySelector('.nav-overlay');

    if (!hamburger || !navLinks) return;

    function openMenu() {
      navLinks.classList.add('open');
      hamburger.classList.add('active');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      if (overlay) overlay.classList.add('visible');
    }

    function closeMenu() {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      if (overlay) overlay.classList.remove('visible');
    }

    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (navLinks.classList.contains('open')) closeMenu();
      else openMenu();
    });

    if (overlay) overlay.addEventListener('click', closeMenu);

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 768 && navLinks.classList.contains('open')) closeMenu();
    });
  }

  /* ---------- Active nav ---------- */
  function initActiveNav() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .menubar a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  /* ---------- Back to top ---------- */
  function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 400);
    });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     FORM VALIDATION + ERROR HANDLING
     ============================================================ */

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^[\d\s\+\-\(\)]{7,20}$/;

  function initForms() {
    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
      bindLiveValidation(contactForm, getContactRules());
      contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        clearFormAlerts(contactForm);
        var payload = {
          name: getVal(contactForm, 'name'),
          email: getVal(contactForm, 'email'),
          department: getVal(contactForm, 'department'),
          message: getVal(contactForm, 'message')
        };
        var errors = validatePayload(payload, getContactRules());
        if (Object.keys(errors).length) {
          showFieldErrors(contactForm, errors);
          showFormAlert(contactForm, 'error', 'Please fix the highlighted fields before submitting.');
          focusFirstError(contactForm);
          return;
        }
        submitForm(contactForm, 'contact', payload);
      });
    }

    var serviceForm = document.getElementById('serviceForm');
    if (serviceForm) {
      bindLiveValidation(serviceForm, getServiceRules());
      serviceForm.addEventListener('submit', function (e) {
        e.preventDefault();
        clearFormAlerts(serviceForm);
        var payload = {
          company: getVal(serviceForm, 'company'),
          contact: getVal(serviceForm, 'contact'),
          phone: getVal(serviceForm, 'phone'),
          serviceType: getVal(serviceForm, 'serviceType'),
          details: getVal(serviceForm, 'details')
        };
        var errors = validatePayload(payload, getServiceRules());
        if (Object.keys(errors).length) {
          showFieldErrors(serviceForm, errors);
          showFormAlert(serviceForm, 'error', 'Please fix the highlighted fields before submitting.');
          focusFirstError(serviceForm);
          return;
        }
        submitForm(serviceForm, 'service', payload);
      });
    }
  }

  function getContactRules() {
    return {
      name: [
        { test: function (v) { return v.length > 0; }, msg: 'Full name is required.' },
        { test: function (v) { return v.length >= 2; }, msg: 'Name must be at least 2 characters.' },
        { test: function (v) { return v.length <= 120; }, msg: 'Name is too long (max 120 characters).' }
      ],
      email: [
        { test: function (v) { return v.length > 0; }, msg: 'Email address is required.' },
        { test: function (v) { return EMAIL_RE.test(v); }, msg: 'Enter a valid email address (e.g. name@company.com).' }
      ],
      department: [
        { test: function (v) { return v.length > 0; }, msg: 'Please select a department.' }
      ],
      message: [
        { test: function (v) { return v.length > 0; }, msg: 'Message is required.' },
        { test: function (v) { return v.length >= 10; }, msg: 'Message must be at least 10 characters.' },
        { test: function (v) { return v.length <= 2000; }, msg: 'Message is too long (max 2000 characters).' }
      ]
    };
  }

  function getServiceRules() {
    return {
      company: [
        { test: function (v) { return v.length > 0; }, msg: 'Company / site name is required.' },
        { test: function (v) { return v.length >= 2; }, msg: 'Company name must be at least 2 characters.' },
        { test: function (v) { return v.length <= 150; }, msg: 'Company name is too long.' }
      ],
      contact: [
        { test: function (v) { return v.length > 0; }, msg: 'Contact person name is required.' },
        { test: function (v) { return v.length >= 2; }, msg: 'Contact name must be at least 2 characters.' }
      ],
      phone: [
        { test: function (v) { return v.length > 0; }, msg: 'Phone number is required.' },
        { test: function (v) { return PHONE_RE.test(v); }, msg: 'Enter a valid phone number (7–20 digits, + - ( ) allowed).' }
      ],
      serviceType: [
        { test: function (v) { return v.length > 0; }, msg: 'Please select a service type.' }
      ],
      details: [
        { test: function (v) { return v.length > 0; }, msg: 'Job / project details are required.' },
        { test: function (v) { return v.length >= 10; }, msg: 'Please provide at least 10 characters of detail.' },
        { test: function (v) { return v.length <= 3000; }, msg: 'Details are too long (max 3000 characters).' }
      ]
    };
  }

  function getVal(form, name) {
    var el = form.elements[name];
    if (!el) return '';
    return String(el.value || '').trim();
  }

  function validatePayload(payload, rules) {
    var errors = {};
    Object.keys(rules).forEach(function (field) {
      var value = payload[field] != null ? String(payload[field]).trim() : '';
      var fieldRules = rules[field];
      for (var i = 0; i < fieldRules.length; i++) {
        if (!fieldRules[i].test(value)) {
          errors[field] = fieldRules[i].msg;
          break;
        }
      }
    });
    return errors;
  }

  function bindLiveValidation(form, rules) {
    Object.keys(rules).forEach(function (field) {
      var el = form.elements[field];
      if (!el) return;
      var eventName = el.tagName === 'SELECT' ? 'change' : 'blur';
      el.addEventListener(eventName, function () {
        var value = String(el.value || '').trim();
        var fieldRules = rules[field];
        var msg = null;
        for (var i = 0; i < fieldRules.length; i++) {
          if (!fieldRules[i].test(value)) {
            msg = fieldRules[i].msg;
            break;
          }
        }
        if (msg) {
          setFieldError(form, field, msg);
        } else {
          clearFieldError(form, field);
          if (value) setFieldValid(form, field);
        }
      });
      el.addEventListener('input', function () {
        if (el.classList.contains('is-invalid')) {
          var value = String(el.value || '').trim();
          var fieldRules = rules[field];
          var ok = fieldRules.every(function (r) { return r.test(value); });
          if (ok) {
            clearFieldError(form, field);
            setFieldValid(form, field);
          }
        }
      });
    });
  }

  function ensureErrorEl(form, field) {
    var group = form.elements[field] && form.elements[field].closest('.form-group');
    if (!group) return null;
    var err = group.querySelector('.field-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'field-error';
      err.setAttribute('role', 'alert');
      group.appendChild(err);
    }
    return err;
  }

  function setFieldError(form, field, message) {
    var el = form.elements[field];
    if (!el) return;
    el.classList.add('is-invalid');
    el.classList.remove('is-valid');
    el.setAttribute('aria-invalid', 'true');
    var err = ensureErrorEl(form, field);
    if (err) {
      err.textContent = message;
      err.classList.add('visible');
    }
  }

  function clearFieldError(form, field) {
    var el = form.elements[field];
    if (!el) return;
    el.classList.remove('is-invalid');
    el.removeAttribute('aria-invalid');
    var group = el.closest('.form-group');
    if (group) {
      var err = group.querySelector('.field-error');
      if (err) {
        err.textContent = '';
        err.classList.remove('visible');
      }
    }
  }

  function setFieldValid(form, field) {
    var el = form.elements[field];
    if (!el) return;
    el.classList.add('is-valid');
    el.classList.remove('is-invalid');
  }

  function showFieldErrors(form, errors) {
    Object.keys(errors).forEach(function (field) {
      setFieldError(form, field, errors[field]);
    });
  }

  function clearAllFieldStates(form) {
    form.querySelectorAll('.is-invalid, .is-valid').forEach(function (el) {
      el.classList.remove('is-invalid', 'is-valid');
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.field-error').forEach(function (err) {
      err.textContent = '';
      err.classList.remove('visible');
    });
  }

  function focusFirstError(form) {
    var first = form.querySelector('.is-invalid');
    if (first) {
      first.focus({ preventScroll: false });
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function ensureAlertEl(form) {
    var existing = form.querySelector('.form-alert');
    if (existing) return existing;
    var alert = document.createElement('div');
    alert.className = 'form-alert';
    alert.setAttribute('role', 'status');
    alert.setAttribute('aria-live', 'polite');
    form.insertBefore(alert, form.firstChild);
    return alert;
  }

  function showFormAlert(form, type, message) {
    var alert = ensureAlertEl(form);
    alert.className = 'form-alert form-alert--' + type + ' visible';
    alert.textContent = message;
  }

  function clearFormAlerts(form) {
    var alert = form.querySelector('.form-alert');
    if (alert) {
      alert.className = 'form-alert';
      alert.textContent = '';
    }
  }

  async function submitForm(form, type, payload) {
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    var originalText = btn.textContent;
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.textContent = 'Sending...';
    clearFormAlerts(form);
    showFormAlert(form, 'info', 'Submitting your request...');

    var url = API_BASE + '?type=' + encodeURIComponent(type);
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = null;

    try {
      if (controller) {
        timeoutId = setTimeout(function () { controller.abort(); }, 15000);
      }

      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(Object.assign({}, payload, { type: type })),
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      var data = {};
      var contentType = res.headers.get('content-type') || '';
      if (contentType.indexOf('application/json') !== -1) {
        try {
          data = await res.json();
        } catch (parseErr) {
          throw new Error('INVALID_JSON');
        }
      } else if (res.status === 404 || res.status === 0) {
        throw new Error('BACKEND_OFFLINE');
      } else {
        throw new Error('UNEXPECTED_RESPONSE');
      }

      if (res.ok && data.success) {
        clearAllFieldStates(form);
        showFormAlert(form, 'success', data.message || 'Submitted successfully. We will get back to you soon.');
        btn.textContent = 'Sent successfully';
        btn.classList.remove('is-loading');
        btn.classList.add('is-success');
        form.reset();
        setTimeout(function () {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.classList.remove('is-success');
          clearFormAlerts(form);
        }, 4000);
        return;
      }

      // Server returned validation / business errors
      if (data.errors && typeof data.errors === 'object') {
        showFieldErrors(form, data.errors);
        showFormAlert(form, 'error', data.error || 'Please correct the errors below.');
        focusFirstError(form);
      } else {
        showFormAlert(form, 'error', data.error || ('Server error (' + res.status + '). Please try again.'));
      }
      resetButton(btn, originalText);
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      console.warn('Form submit error:', err && err.message ? err.message : err);

      if (err && err.name === 'AbortError') {
        showFormAlert(form, 'error', 'Request timed out. Check your connection and try again.');
        resetButton(btn, originalText);
        return;
      }

      if (err && (err.message === 'BACKEND_OFFLINE' || err.message === 'Failed to fetch' || err.name === 'TypeError')) {
        // Graceful offline / no-backend demo mode
        showFormAlert(
          form,
          'warning',
          'Backend not available — request accepted in demo mode. Start the PHP server to store submissions.'
        );
        btn.textContent = 'Accepted (demo)';
        btn.classList.remove('is-loading');
        btn.classList.add('is-success');
        form.reset();
        clearAllFieldStates(form);
        setTimeout(function () {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.classList.remove('is-success');
          clearFormAlerts(form);
        }, 4500);
        return;
      }

      if (err && err.message === 'INVALID_JSON') {
        showFormAlert(form, 'error', 'Unexpected server response. Please try again later.');
      } else {
        showFormAlert(form, 'error', 'Network or server error. Please try again in a moment.');
      }
      resetButton(btn, originalText);
    }
  }

  function resetButton(btn, originalText) {
    btn.textContent = originalText;
    btn.disabled = false;
    btn.classList.remove('is-loading', 'is-success');
  }

  /* ---------- Live clock ---------- */
  function initLiveClock() {
    var el = document.getElementById('liveClock');
    if (!el) return;
    function tick() {
      el.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Animated stats ---------- */
  function initStatCounters() {
    var numbers = document.querySelectorAll('.stat-item .number');
    if (!numbers.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.dataset.target || el.textContent.replace(/\D/g, ''), 10);
        if (!isNaN(target)) animateCount(el, target);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });
    numbers.forEach(function (el) { observer.observe(el); });
  }

  function animateCount(el, target) {
    var duration = 1500;
    var startTime = performance.now();
    var suffix = el.textContent.replace(/[0-9]/g, '') || '';
    function update(now) {
      var progress = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* ---------- Scroll reveal ---------- */
  function initScrollReveal() {
    var elements = document.querySelectorAll('.card, .feature-item, .stat-item, .model-card');
    if (!elements.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        setTimeout(function () {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, (i % 6) * 70);
        observer.unobserve(el);
      });
    }, { threshold: 0.12 });
    elements.forEach(function (el) {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }

  /* ---------- 3D Model Viewer ---------- */
  function initModelViewers() {
    document.querySelectorAll('model-viewer').forEach(function (viewer) {
      viewer.addEventListener('load', function () { viewer.classList.add('loaded'); });
      viewer.addEventListener('error', function () {
        var fallback = viewer.parentElement && viewer.parentElement.querySelector('.model-fallback');
        if (fallback) fallback.style.display = 'flex';
      });
    });
    document.querySelectorAll('[data-orbit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-target');
        var viewer = document.getElementById(id);
        if (viewer && viewer.cameraOrbit !== undefined) {
          viewer.cameraOrbit = btn.getAttribute('data-orbit');
        }
      });
    });
  }
})();
