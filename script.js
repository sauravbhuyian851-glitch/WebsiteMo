/* ============================================================
   WebsiteMo — JavaScript
   Handles: Navigation, Scroll Animations, Testimonial Slider,
            Counter Animation, Form Handling, Back-to-Top
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ─── Elements ───
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const backToTop = document.getElementById('back-to-top');
  const contactForm = document.getElementById('contact-form');
  const testimonialTrack = document.getElementById('testimonial-track');
  const testimonialDots = document.querySelectorAll('.testimonial-dot');

  // ─── Navbar Scroll Effect ───
  let lastScroll = 0;
  const handleNavScroll = () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Show/hide back to top
    if (currentScroll > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }

    // Active nav link highlight
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const id = section.getAttribute('id');
      const navLink = document.querySelector(`.nav-links a[href="#${id}"]`);
      if (navLink) {
        if (rect.top <= 150 && rect.bottom > 150) {
          navLink.classList.add('active');
        } else {
          navLink.classList.remove('active');
        }
      }
    });

    lastScroll = currentScroll;
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // run once on load

  // ─── Mobile Nav Toggle ───
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileNav.classList.toggle('active');
    document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
  });

  // Close mobile nav on link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // ─── Smooth Scroll for all anchor links ───
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      e.preventDefault();
      const target = document.querySelector(targetId);
      if (target) {
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ─── Back to Top ───
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ─── Scroll Reveal Animations ───
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Stagger animation for sibling elements
        const parent = entry.target.parentElement;
        const siblings = parent ? parent.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale') : [];
        let delay = 0;

        if (siblings.length > 1) {
          const siblingIndex = Array.from(siblings).indexOf(entry.target);
          delay = siblingIndex * 100;
        }

        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);

        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ─── Counter Animation ───
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'));
        const duration = 2000;
        const startTime = performance.now();

        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutQuart(progress);
          const current = Math.floor(easedProgress * target);

          el.textContent = current + '+';

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            el.textContent = target + '+';
          }
        };

        requestAnimationFrame(animate);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => counterObserver.observe(el));

  // ─── Testimonial Slider ───
  let currentSlide = 0;
  const totalSlides = testimonialDots.length;
  let autoPlayInterval;

  const goToSlide = (index) => {
    currentSlide = index;
    if (testimonialTrack) {
      testimonialTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    testimonialDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % totalSlides);
  };

  // Dot click handlers
  testimonialDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.getAttribute('data-index'));
      goToSlide(index);
      resetAutoPlay();
    });
  });

  // Auto-play
  const startAutoPlay = () => {
    autoPlayInterval = setInterval(nextSlide, 5000);
  };

  const resetAutoPlay = () => {
    clearInterval(autoPlayInterval);
    startAutoPlay();
  };

  startAutoPlay();

  // Pause on hover
  const slider = document.getElementById('testimonial-slider');
  if (slider) {
    slider.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
    slider.addEventListener('mouseleave', startAutoPlay);
  }

  // Touch support for testimonial slider
  let touchStartX = 0;
  let touchEndX = 0;

  if (slider) {
    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swipe left - next
          goToSlide((currentSlide + 1) % totalSlides);
        } else {
          // Swipe right - prev
          goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
        }
        resetAutoPlay();
      }
    }, { passive: true });
  }

  // ─── Contact Form Handling ───
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('contact-submit');
      const originalContent = submitBtn.innerHTML;

      // Loading state
      submitBtn.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Sending...
        </span>
      `;
      submitBtn.disabled = true;

      // Simulate sending (replace with actual backend)
      setTimeout(() => {
        submitBtn.innerHTML = `
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Message Sent!
          </span>
        `;
        submitBtn.style.background = '#10B981';
        submitBtn.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';

        contactForm.reset();

        setTimeout(() => {
          submitBtn.innerHTML = originalContent;
          submitBtn.disabled = false;
          submitBtn.style.background = '';
          submitBtn.style.boxShadow = '';
        }, 3000);
      }, 1500);
    });
  }

  // ─── Add spin animation for loading ───
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
});
