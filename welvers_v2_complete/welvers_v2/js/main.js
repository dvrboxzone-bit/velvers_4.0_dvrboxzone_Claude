/* ================================================================
   WELVERS — main.js
   Mobile nav, search, cookie consent, newsletter, lang switcher
   ================================================================ */

(function () {
  'use strict';

  /* ── Util ── */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ── Mobile nav ── */
  function initMobileNav() {
    const toggle    = $('#menu-toggle');
    const inner     = $('#header-inner');
    const nav       = $('#nav');
    if (!toggle || !inner) return;

    let isOpen = false;

    function open() {
      isOpen = true;
      inner.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      document.body.style.overflow = 'hidden';
    }

    function close() {
      isOpen = false;
      inner.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
      document.body.style.overflow = '';
    }

    on(toggle, 'click', () => isOpen ? close() : open());

    // Close on nav-link click (mobile)
    $$('.nav__link', nav).forEach(link => on(link, 'click', close));

    // Close on outside click
    on(document, 'click', e => {
      if (isOpen && !e.target.closest('.header')) close();
    });

    // Close on ESC
    on(document, 'keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ── Search ── */
  function initSearch() {
    const bar = $('.search-bar');
    if (!bar) return;

    on(bar, 'click', () => {
      const url = '/search/';
      if (window.location.pathname !== url) {
        const q = prompt('Поиск инструментов и статей:');
        if (q && q.trim()) {
          window.location.href = url + '?q=' + encodeURIComponent(q.trim());
        }
      }
    });

    // ⌘K / Ctrl+K shortcut
    on(document, 'keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        bar.click();
      }
    });
  }

  /* ── Cookie banner ── */
  function initCookieBanner() {
    const banner = $('#cookieBanner');
    if (!banner) return;

    if (!localStorage.getItem('wv-cookie-ok')) {
      // Show after small delay
      setTimeout(() => banner.classList.add('is-visible'), 800);
    }

    // exposed globally for inline onclick handlers
    window.acceptCookie = () => {
      localStorage.setItem('wv-cookie-ok', '1');
      banner.classList.remove('is-visible');
    };

    window.dismissCookie = () => {
      banner.classList.remove('is-visible');
    };
  }

  /* ── Newsletter ── */
  function initNewsletter() {
    $$('.newsletter-form').forEach(form => {
      on(form, 'submit', e => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const email = input?.value?.trim();
        if (!email || !email.includes('@')) {
          showToast('Введите корректный email', 'error');
          return;
        }
        // TODO: integrate with email provider API
        showToast('✓ Вы подписаны на рассылку!');
        input.value = '';
      });
    });
  }

  /* ── Language switcher ── */
  function initLangSwitcher() {
    const saved = localStorage.getItem('wv-lang') || 'ru';

    $$('.lang-btn').forEach(btn => {
      const lang = btn.dataset.lang;
      if (lang === saved) btn.classList.add('lang-btn--active');
      else btn.classList.remove('lang-btn--active');
    });
  }

  window.switchLang = function (lang) {
    localStorage.setItem('wv-lang', lang);
    $$('.lang-btn').forEach(btn => {
      btn.classList.toggle('lang-btn--active', btn.dataset.lang === lang);
    });
    if (lang === 'en') {
      const enPath = '/en' + window.location.pathname;
      window.location.href = enPath;
    } else {
      const ruPath = window.location.pathname.replace(/^\/en/, '') || '/';
      window.location.href = ruPath;
    }
  };

  /* ── Toast notification ── */
  function showToast(msg, type = 'success') {
    // Remove existing
    $$('.wv-toast').forEach(t => t.remove());

    const el = document.createElement('div');
    el.className = 'wv-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.textContent = msg;

    Object.assign(el.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '999',
      padding: '12px 18px',
      background: type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(15,15,15,0.96)',
      border: '1px solid ' + (type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)'),
      borderRadius: '10px',
      fontSize: '13px',
      color: '#fff',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      animation: 'none',
      transition: 'opacity .3s, transform .3s',
      opacity: '0',
      transform: 'translateY(8px)',
    });

    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  window.wvShowToast = showToast;

  /* ── Smooth anchor scroll ── */
  function initAnchorScroll() {
    on(document, 'click', e => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  /* ── Intersection observer: fade-in cards ── */
  function initFadeIn() {
    if (!('IntersectionObserver' in window)) return;

    const style = document.createElement('style');
    style.textContent = `
      .tool-card, .category-card, .article-card, .comparison-row, .stats-card {
        opacity: 0;
        transform: translateY(16px);
        transition: opacity .45s ease, transform .45s ease;
      }
      .tool-card.is-visible, .category-card.is-visible,
      .article-card.is-visible, .comparison-row.is-visible, .stats-card.is-visible {
        opacity: 1;
        transform: none;
      }
    `;
    document.head.appendChild(style);

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    $$('.tool-card, .category-card, .article-card, .comparison-row, .stats-card')
      .forEach((el, i) => {
        el.style.transitionDelay = (i % 5) * 0.06 + 's';
        observer.observe(el);
      });
  }

  /* ── Header scroll shadow ── */
  function initHeaderScroll() {
    const header = $('.header');
    if (!header) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.style.boxShadow = window.scrollY > 20
          ? '0 1px 24px rgba(0,0,0,0.4)'
          : 'none';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── Init all ── */
  function init() {
    initMobileNav();
    initSearch();
    initCookieBanner();
    initNewsletter();
    initLangSwitcher();
    initAnchorScroll();
    initFadeIn();
    initHeaderScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
