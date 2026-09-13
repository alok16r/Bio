// ===== ALOK'S CREATIVE SPACE — Script =====

(function () {
  'use strict';

  // ===== DOM ELEMENTS =====
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxCounter = document.getElementById('lightboxCounter');

  // Detect mobile for adjusted thresholds
  const isMobile = window.innerWidth < 768;

  // ===== HERO PARTICLES =====
  function createParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    const count = isMobile ? 12 : 30;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.classList.add('hero-particle');
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (8 + Math.random() * 16) + 's';
      particle.style.animationDelay = (Math.random() * 12) + 's';
      particle.style.width = (2 + Math.random() * 3) + 'px';
      particle.style.height = particle.style.width;
      particle.style.opacity = (0.1 + Math.random() * 0.25);
      container.appendChild(particle);
    }
  }

  // ===== NAV SCROLL EFFECT =====
  function handleNavScroll() {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  // ===== MOBILE NAV =====
  function toggleMobileNav() {
    hamburger.classList.toggle('active');
    mobileNav.classList.toggle('active');
    document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
  }

  function closeMobileNav() {
    hamburger.classList.remove('active');
    mobileNav.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', toggleMobileNav);

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  // ===== SCROLL REVEAL (generic .reveal elements) =====
  function setupScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.01,
      rootMargin: '50px 0px 0px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  }

  // ===== VIDEO SCROLL SHOWCASE =====
  function setupVideoShowcase() {
    const videoCards = document.querySelectorAll('.video-card');

    // Use very low threshold so cards trigger reliably on mobile
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const card = entry.target;
        const video = card.querySelector('video');
        const source = video ? video.querySelector('source') : null;

        if (entry.isIntersecting) {
          card.classList.add('visible');

          // Lazy-load video src
          if (source && source.dataset.src && !source.getAttribute('src')) {
            source.setAttribute('src', source.dataset.src);
            video.load();
          }
        } else {
          // Pause video when it scrolls out of view
          if (video && !video.paused) {
            video.pause();
          }
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '80px 0px 0px 0px'
    });

    videoCards.forEach(card => videoObserver.observe(card));

    // Pause other videos when one starts playing
    const allVideos = document.querySelectorAll('.video-card video');
    allVideos.forEach(video => {
      video.addEventListener('play', () => {
        allVideos.forEach(other => {
          if (other !== video) other.pause();
        });
      });
    });
  }

  // ===== SKETCH PROGRESSIVE REVEAL =====
  function setupSketchReveal() {
    const sketchCards = document.querySelectorAll('.sketch-card');
    // On mobile, use 2-column stagger; on desktop, 4-column
    const cols = isMobile ? 2 : 4;

    const sketchObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.index) || 0;
          const delay = (index % cols) * 60;

          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);

          sketchObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.01,
      rootMargin: '40px 0px 0px 0px'
    });

    sketchCards.forEach(card => sketchObserver.observe(card));
  }

  // ===== ANIMATED EDITING JOURNEY TIMELINE =====
  function setupJourneyAnimation() {
    const timeline = document.getElementById('journeyTimeline');
    const progressLine = document.getElementById('journeyProgressLine');
    const steps = document.querySelectorAll('.journey-step');
    if (!timeline || !progressLine || steps.length === 0) return;

    let animated = false;

    const journeyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          animateTimeline();
          journeyObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '40px 0px 0px 0px'
    });

    journeyObserver.observe(timeline);

    function animateTimeline() {
      steps.forEach((step, i) => {
        const delay = i * 300;

        setTimeout(() => {
          step.classList.add('visible');

          if (i === 0) {
            progressLine.style.height = '0px';
          } else {
            const firstStep = steps[0];
            const currentStep = steps[i];

            const lineHeight = (currentStep.getBoundingClientRect().top + 9) - (firstStep.getBoundingClientRect().top + 9);
            progressLine.style.height = lineHeight + 'px';
          }
        }, delay);
      });
    }
  }

  // ===== SAFETY FALLBACK =====
  // If any elements are still hidden after page fully loads + 2s,
  // force-reveal them. Handles edge cases where IntersectionObserver
  // doesn't fire (e.g., element already in viewport on load).
  function setupFallback() {
    setTimeout(() => {
      // Force-reveal any .reveal that's in/above the viewport but wasn't triggered
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100) {
          el.classList.add('visible');
        }
      });

      // Same for video cards
      document.querySelectorAll('.video-card:not(.visible)').forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100) {
          card.classList.add('visible');
          const video = card.querySelector('video');
          const source = video ? video.querySelector('source') : null;
          if (source && source.dataset.src && !source.getAttribute('src')) {
            source.setAttribute('src', source.dataset.src);
            video.load();
          }
        }
      });

      // Same for sketch cards
      document.querySelectorAll('.sketch-card:not(.visible)').forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100) {
          card.classList.add('visible');
        }
      });

      // Same for journey steps
      const journeySteps = document.querySelectorAll('.journey-step:not(.visible)');
      if (journeySteps.length > 0) {
        const timeline = document.getElementById('journeyTimeline');
        if (timeline) {
          const rect = timeline.getBoundingClientRect();
          if (rect.top < window.innerHeight + 100) {
            journeySteps.forEach((step, i) => {
              setTimeout(() => step.classList.add('visible'), i * 150);
            });
          }
        }
      }
    }, 2000);
  }

  // ===== LIGHTBOX =====
  const sketchCards = document.querySelectorAll('.sketch-card');
  const sketchSrcs = [];
  let currentLightboxIndex = 0;

  sketchCards.forEach((card) => {
    const img = card.querySelector('img');
    if (img) sketchSrcs.push(img.src);
  });

  function openLightbox(index) {
    currentLightboxIndex = index;
    lightboxImg.src = sketchSrcs[index];
    lightboxCounter.textContent = (index + 1) + ' / ' + sketchSrcs.length;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!lightbox.classList.contains('active')) {
        lightboxImg.src = '';
      }
    }, 400);
  }

  function navigateLightbox(direction) {
    currentLightboxIndex += direction;
    if (currentLightboxIndex < 0) currentLightboxIndex = sketchSrcs.length - 1;
    if (currentLightboxIndex >= sketchSrcs.length) currentLightboxIndex = 0;

    lightboxImg.style.transform = 'scale(0.92)';
    lightboxImg.style.opacity = '0.5';

    setTimeout(() => {
      lightboxImg.src = sketchSrcs[currentLightboxIndex];
      lightboxCounter.textContent = (currentLightboxIndex + 1) + ' / ' + sketchSrcs.length;
      lightboxImg.style.transform = 'scale(1)';
      lightboxImg.style.opacity = '1';
    }, 200);
  }

  sketchCards.forEach((card, i) => {
    card.addEventListener('click', () => openLightbox(i));
  });

  lightboxClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });

  lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(-1);
  });

  lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  // Touch swipe on lightbox
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      navigateLightbox(diff > 0 ? 1 : -1);
    }
  }, { passive: true });

  // ===== SMOOTH SCROLL FOR NAV LINKS =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navHeight = nav.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  // ===== INIT =====
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  createParticles();
  setupScrollReveal();
  setupVideoShowcase();
  setupSketchReveal();
  setupJourneyAnimation();
  setupFallback();

})();
