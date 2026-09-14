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

  // ===== SEQUENTIAL VIDEO LOADER =====
  // Loads videos one-by-one (1st → 2nd → 3rd → …) in the background
  // to avoid bandwidth contention, reduce RAM, and keep scrolling smooth.
  function setupVideoShowcase() {
    const videoCards = document.querySelectorAll('.video-card');
    if (videoCards.length === 0) return;

    // Per-video state: 'idle' → 'loading' → 'loaded'
    const states = Array.from(videoCards, () => 'idle');
    let sequentialNext = 0;     // Next index for background sequential loading
    let loadingIndex = -1;      // Index currently downloading (-1 = none)
    const priorityQueue = [];   // Indices the user is approaching (load first)

    // --- 1. Card scroll-reveal animation ---
    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          visibilityObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '80px 0px 0px 0px'
    });
    videoCards.forEach(card => visibilityObserver.observe(card));

    // --- 2. Pause videos that scroll out of view ---
    const playbackObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (!entry.isIntersecting && video && !video.paused) {
          video.pause();
        }
      });
    }, { threshold: 0 });
    videoCards.forEach(card => playbackObserver.observe(card));

    // --- 3. Priority observer: if user scrolls near a video, queue it next ---
    const priorityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Array.from(videoCards).indexOf(entry.target);
          if (idx !== -1 && states[idx] === 'idle' && !priorityQueue.includes(idx)) {
            priorityQueue.push(idx);
            processQueue();
          }
          priorityObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '400px 0px 200px 0px'  // Trigger well before the card is on-screen
    });
    videoCards.forEach(card => priorityObserver.observe(card));

    // --- Load a single video by index ---
    function loadVideo(index) {
      if (states[index] !== 'idle') return;

      const card = videoCards[index];
      const video = card.querySelector('video');
      const source = video ? video.querySelector('source') : null;

      // Already has src or nothing to load → skip
      if (!source || !source.dataset.src || source.getAttribute('src')) {
        states[index] = 'loaded';
        loadingIndex = -1;
        processQueue();
        return;
      }

      states[index] = 'loading';
      loadingIndex = index;

      // Apply src and begin download
      source.src = source.dataset.src;
      video.preload = 'auto';
      video.load();

      const markDone = () => {
        if (states[index] === 'loaded') return; // Guard against double-fire
        states[index] = 'loaded';
        loadingIndex = -1;
        processQueue();
      };

      // Move to next video once this one can start playing
      video.addEventListener('canplay', markDone, { once: true });
      // Handle broken / unreachable sources
      video.addEventListener('error', markDone, { once: true });
      // Hard timeout so the queue never stalls (large files / slow connections)
      setTimeout(markDone, 25000);
    }

    // --- Decide what to load next ---
    function processQueue() {
      if (loadingIndex !== -1) return; // Only one video loads at a time

      // Priority videos first (user is scrolling toward them)
      while (priorityQueue.length > 0) {
        const idx = priorityQueue.shift();
        if (states[idx] === 'idle') {
          loadVideo(idx);
          return;
        }
      }

      // Continue the sequential 1→2→3→… background chain
      while (sequentialNext < videoCards.length) {
        if (states[sequentialNext] === 'idle') {
          const idx = sequentialNext;
          sequentialNext++;
          // Defer to idle time so animations / scrolling stay smooth
          const schedule = window.requestIdleCallback
            ? (cb) => window.requestIdleCallback(cb, { timeout: 5000 })
            : (cb) => setTimeout(cb, 200);
          schedule(() => loadVideo(idx));
          return;
        }
        sequentialNext++;
      }
    }

    // --- Only one video plays at a time ---
    const allVideos = document.querySelectorAll('.video-card video');
    allVideos.forEach(video => {
      video.addEventListener('play', () => {
        allVideos.forEach(other => {
          if (other !== video) other.pause();
        });
      });
    });

    // --- Kick off sequential loading after the page has rendered ---
    function kickoff() {
      // Short delay lets the hero section animate without competition
      setTimeout(() => {
        loadVideo(0);
        sequentialNext = 1;
      }, 1000);
    }

    if (document.readyState === 'complete') {
      kickoff();
    } else {
      window.addEventListener('load', kickoff, { once: true });
    }
  }

  // ===== SKETCH PROGRESSIVE REVEAL =====
  function setupSketchReveal() {
    const sketchCards = document.querySelectorAll('.sketch-card');
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

    sketchCards.forEach(card => {
      sketchObserver.observe(card);
      // Random rotation on desktop
      if (!isMobile) {
        const rotation = (Math.random() * 4 - 2).toFixed(1); // -2 to 2 degrees
        card.style.transform = `translateY(40px) scale(0.95) rotate(${rotation}deg)`;
        
        // Need to override the visible class transform to include rotation
        card.addEventListener('transitionend', (e) => {
          if(e.propertyName === 'transform' && card.classList.contains('visible') && !card.matches(':hover')) {
             card.style.transform = `rotate(${rotation}deg)`;
          }
        });
      }
    });
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

      // Same for video cards (visibility only; loading handled by sequential loader)
      document.querySelectorAll('.video-card:not(.visible)').forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100) {
          card.classList.add('visible');
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

      // Same for gear devices
      document.querySelectorAll('.gear-device:not(.visible)').forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100) {
          card.classList.add('visible');
        }
      });

      // Same for connect cards
      document.querySelectorAll('.connect-card:not(.visible)').forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100) {
          card.classList.add('visible');
        }
      });
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

    lightboxImg.classList.add('lightbox-animating');
    lightboxImg.style.transform = 'scale(0.92)';
    lightboxImg.style.opacity = '0.5';

    setTimeout(() => {
      lightboxImg.src = sketchSrcs[currentLightboxIndex];
      lightboxCounter.textContent = (currentLightboxIndex + 1) + ' / ' + sketchSrcs.length;
      lightboxImg.style.transform = 'scale(1)';
      lightboxImg.style.opacity = '1';
      setTimeout(() => lightboxImg.classList.remove('lightbox-animating'), 600);
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

  // ===== GEAR SECTION REVEAL =====
  function setupGearReveal() {
    const gearDevices = document.querySelectorAll('.gear-device');
    if (gearDevices.length === 0) return;

    const gearObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          gearObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '40px 0px 0px 0px'
    });

    gearDevices.forEach(device => gearObserver.observe(device));
  }

  // ===== CONNECT SECTION REVEAL =====
  function setupConnectReveal() {
    const connectCards = document.querySelectorAll('.connect-card');
    if (connectCards.length === 0) return;

    const connectObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          connectObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '30px 0px 0px 0px'
    });

    connectCards.forEach(card => connectObserver.observe(card));
  }

  // ===== STAT COUNTERS =====
  function setupStatCounters() {
    const counters = document.querySelectorAll('.stat-counter');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const endValue = parseInt(target.getAttribute('data-target'));
          let startValue = 0;
          const duration = 2000;
          let startTime = null;

          function easeOutExpo(x) {
            return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
          }

          function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = (currentTime - startTime) / duration;
            if (progress < 1) {
              const currentVal = Math.floor(easeOutExpo(progress) * endValue);
              target.innerText = currentVal;
              requestAnimationFrame(animate);
            } else {
              target.innerText = endValue;
            }
          }
          requestAnimationFrame(animate);
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(c => observer.observe(c));
  }

  // ===== VIDEO INTERACTIONS =====
  function setupVideoInteractions() {
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
      const video = card.querySelector('video');
      const playBtn = card.querySelector('.mobile-play-btn');
      if (!video) return;

      let manualPlay = false;

      // Desktop Hover Preview
      if (!isMobile) {
        card.addEventListener('mouseenter', () => {
          if (!manualPlay) {
             video.muted = true; // Mute for preview so browser allows autoplay
             video.play().catch(()=>{});
             card.classList.add('is-playing');
          }
        });
        card.addEventListener('mouseleave', () => {
          if (!manualPlay) {
            video.pause();
            card.classList.remove('is-playing');
          }
        });
      }

      // Custom Play Button Click (Works on both mobile & desktop if visible)
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          manualPlay = true;
          video.muted = false; // Unmute for manual viewing
          video.play().catch(()=>{});
          card.classList.add('is-playing');
        });
      }
      
      // Native Controls Events
      video.addEventListener('pause', () => {
        card.classList.remove('is-playing');
        manualPlay = false;
      });
      video.addEventListener('play', () => {
        card.classList.add('is-playing');
      });
      video.addEventListener('volumechange', () => {
        if (!video.muted) manualPlay = true; // If user unmutes, they are watching it manually
      });
    });

  }

  // ===== DEVICE 3D TILT =====
  function setupDeviceTilt() {
    if (isMobile) return;
    const visuals = document.querySelectorAll('.gear-device-visual');
    
    visuals.forEach(visual => {
      const img = visual.querySelector('img');
      visual.addEventListener('mousemove', (e) => {
        const rect = visual.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
        const rotateY = ((x - centerX) / centerX) * 10;
        
        img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
      });
      
      visual.addEventListener('mouseleave', () => {
        img.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
      });
    });
  }

  // ===== MAGNETIC CONNECT BUTTONS =====
  function setupMagneticConnect() {
    if (isMobile) return;
    const cards = document.querySelectorAll('.connect-card');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update glow sweep position
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        
        // Magnetic pull
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const pullX = (x - centerX) * 0.1;
        const pullY = (y - centerY) * 0.1;
        
        card.style.transform = `translate(${pullX}px, ${pullY}px)`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = `translate(0px, 0px)`;
      });
    });
  }

  // ===== INIT =====
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  createParticles();
  setupScrollReveal();
  setupVideoShowcase();
  setupVideoInteractions();
  setupSketchReveal();
  setupJourneyAnimation();
  setupGearReveal();
  setupConnectReveal();
  setupFallback();
  
  // Cinematic additions
  setupStatCounters();
  setupDeviceTilt();
  setupMagneticConnect();

})();
