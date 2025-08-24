// Mobile nav toggle, click-driven dropdown with animation, and reveal animations
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('primary-menu');
  const dropdownItem = document.querySelector('.menu-item.dropdown');
  const dropdownToggle = dropdownItem && dropdownItem.querySelector('.dropdown-toggle');
  const dropdownMega = document.getElementById('mega-menu');

  // Mobile nav toggle
  if (navToggle && menu) {
    navToggle.addEventListener('click', (e) => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('show');
      e.stopPropagation();
    });

    // close mobile menu on outside click
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && menu.classList.contains('show')) {
        menu.classList.remove('show');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Dropdown toggle for click (desktop & touch)
  if (dropdownToggle && dropdownItem) {
    const openDropdown = () => {
      dropdownItem.classList.add('open');
      dropdownToggle.setAttribute('aria-expanded', 'true');
      dropdownMega && dropdownMega.setAttribute('aria-hidden', 'false');
    };
    const closeDropdown = () => {
      dropdownItem.classList.remove('open');
      dropdownToggle.setAttribute('aria-expanded', 'false');
      dropdownMega && dropdownMega.setAttribute('aria-hidden', 'true');
    };

    dropdownToggle.addEventListener('click', (e) => {
      const isOpen = dropdownItem.classList.contains('open');
      if (isOpen) closeDropdown(); else openDropdown();
      e.stopPropagation();
    });

    // keyboard: toggle with Enter/Space and close with Escape
    dropdownToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dropdownToggle.click();
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    });

    // close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!dropdownItem.contains(e.target)) closeDropdown();
    });

    // close with Escape key globally
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDropdown();
    });
  }

  // Reveal on scroll with IntersectionObserver
  const revealElems = document.querySelectorAll('.reveal');
  const revealGridCards = document.querySelectorAll('.reveal-grid .card');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('appear');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElems.forEach(el => observer.observe(el));
  revealGridCards.forEach(card => observer.observe(card));

  // Accessibility: respect reduced motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    document.querySelectorAll('.cake-large, .cupcake-small').forEach(el => el.style.animation = 'none');
    document.querySelectorAll('.dropdown-mega').forEach(el => el.style.transition = 'none');
  }
});