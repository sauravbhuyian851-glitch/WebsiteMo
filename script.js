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

  // ─── Contact Form Handling connected to CMS API ───
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('contact-submit');
      const originalContent = submitBtn.innerHTML;

      const name = document.getElementById('contact-name').value;
      const email = document.getElementById('contact-email').value;
      const phone = document.getElementById('contact-phone').value;
      const project = document.getElementById('contact-project').value;
      const budget = document.getElementById('contact-budget').value;
      const messageText = document.getElementById('contact-message').value;

      const fullMessage = `[Project Inquiry - ${project || 'General'} | Budget: ${budget || 'N/A'} | Phone: ${phone || 'N/A'}]\n\n${messageText}`;

      // Loading state
      submitBtn.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Sending...
        </span>
      `;
      submitBtn.disabled = true;

      try {
        // Post inquiry to CMS Comments API (postId 1 is default page/post)
        await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: 1,
            author: name,
            email: email,
            content: fullMessage
          })
        });

        submitBtn.innerHTML = `
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Message Sent to CMS!
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
        }, 3500);
      } catch (err) {
        console.error('CMS submission error:', err);
        submitBtn.innerHTML = originalContent;
        submitBtn.disabled = false;
      }
    });
  }



  // ─── Load Live Published Posts from CMS API ───
  const loadCmsPosts = async () => {
    const container = document.getElementById('cms-posts-grid');
    if (!container) return;

    try {
      const res = await fetch('/api/posts?post_type=post&status=publish');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      const posts = data.posts || [];

      if (posts.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; color: #646970; padding: 40px 20px; background: #ffffff; border-radius: 12px; border: 1px dashed #c3c4c7;">
            <p style="margin: 0; font-size: 15px; font-weight: 500;">No published posts yet. Publish posts from your <a href="/admin/#/posts/new" style="color: #2271b1; font-weight: 700; text-decoration: none;">Admin Panel</a> to display them here live!</p>
          </div>
        `;
        return;
      }

      const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      container.innerHTML = posts.map(post => `
        <article class="post-card" style="background: #ffffff; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 12px; font-weight: 700; color: #E60012; text-transform: uppercase; letter-spacing: 0.5px;">${new Date(post.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span style="font-size: 11px; background: #edf2f7; color: #4a5568; padding: 2px 8px; border-radius: 10px; font-weight: 600;">Published</span>
            </div>
            <h3 style="font-size: 20px; font-weight: 700; margin: 0 0 12px 0; color: #1a202c; line-height: 1.3;">${escapeHtml(post.title || 'Untitled')}</h3>
            <div style="font-size: 14px; color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
              ${escapeHtml(post.excerpt || post.content.replace(/<[^>]*>?/gm, '').substring(0, 140) + '...')}
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: #718096; border-top: 1px solid #edf2f7; padding-top: 16px;">
            <span>By ${escapeHtml(post.author_name || 'Admin')}</span>
            <span style="color: #2271b1; font-weight: 700; cursor: pointer;">Read More →</span>
          </div>
        </article>
      `).join('');
    } catch (err) {
      console.warn('[CMS Frontend] Could not load live posts:', err.message);
    }
  };

  loadCmsPosts();

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
