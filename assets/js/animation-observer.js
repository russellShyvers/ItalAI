/**
 * Card Slide-In Animations
 * Scroll-triggered animations that respect loading screens
 * 
 * Usage:
 * 1. Include this script in your page
 * 2. Add 'card-animated' class + animation class to your cards
 * 3. Add 'header-animated' class + animation class to your headers
 * 4. Elements will animate when scrolled into view after loading completes
 * 5. Optional: Add data-delay="500" to delay animation by 500ms
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    threshold: 0.2,              // Trigger when 20% of element is visible
    rootMargin: '0px 0px -50px 0px', // Start slightly before entering viewport
    loadingScreenId: 'loading-screen',   // ID of your loading screen element
    loadingScreenClass: 'loaded',        // Class added when loading is done
    transitionDelay: 600,        // Wait for loading screen transition (ms)
    observeOnce: false,          // Set to true to animate only once per element
  };

  // Store active timeouts for cleanup
  const activeTimeouts = new Map();

  // Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const delay = parseInt(element.getAttribute('data-delay')) || 0;
        
        // Clear any existing timeout for this element
        if (activeTimeouts.has(element)) {
          clearTimeout(activeTimeouts.get(element));
        }
        
        // Apply animation after delay
        const timeoutId = setTimeout(() => {
          element.classList.add('is-visible');
          activeTimeouts.delete(element);
        }, delay);
        
        activeTimeouts.set(element, timeoutId);
        
        // Stop observing if configured for one-time animation
        if (CONFIG.observeOnce) {
          observer.unobserve(element);
        }
      } else if (!CONFIG.observeOnce) {
        const element = entry.target;
        
        // Clear pending timeout if element leaves viewport
        if (activeTimeouts.has(element)) {
          clearTimeout(activeTimeouts.get(element));
          activeTimeouts.delete(element);
        }
        
        // Remove class when out of view (for repeat animations)
        element.classList.remove('is-visible');
      }
    });
  }, {
    threshold: CONFIG.threshold,
    rootMargin: CONFIG.rootMargin
  });

  /**
   * Initialize card animations
   * Finds all cards with 'card-animated' class and observes them
   */
  function initCardAnimations() {
    const cards = document.querySelectorAll('.card-animated');
    
    if (cards.length === 0) {
      console.warn('[CardAnimations] No elements with class "card-animated" found');
      return;
    }

    cards.forEach(card => observer.observe(card));
    console.log(`[CardAnimations] Initialized ${cards.length} animated cards`);
  }

  /**
   * Initialize header animations
   * Finds all headers with 'header-animated' class and observes them
   */
  function initHeaderAnimations() {
    const headers = document.querySelectorAll('.header-animated');
    
    if (headers.length === 0) {
      console.warn('[CardAnimations] No elements with class "header-animated" found');
      return;
    }

    headers.forEach(header => observer.observe(header));
    console.log(`[CardAnimations] Initialized ${headers.length} animated headers`);
  }

  /**
   * Wait for loading screen to complete
   * Handles multiple scenarios: class-based, removal, or no loading screen
   */
  function waitForLoadingComplete() {
    const loadingScreen = document.getElementById(CONFIG.loadingScreenId);
    
    // No loading screen - initialize immediately
    if (!loadingScreen) {
      console.log('[CardAnimations] No loading screen found, initializing immediately');
      initCardAnimations();
      initHeaderAnimations();
      return;
    }

    // Loading screen already has 'loaded' class
    if (loadingScreen.classList.contains(CONFIG.loadingScreenClass)) {
      console.log('[CardAnimations] Loading screen already complete');
      setTimeout(() => {
        initCardAnimations();
        initHeaderAnimations();
      }, CONFIG.transitionDelay);
      return;
    }

    console.log('[CardAnimations] Waiting for loading screen to complete...');

    // Watch for 'loaded' class to be added
    const classObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (loadingScreen.classList.contains(CONFIG.loadingScreenClass)) {
            console.log('[CardAnimations] Loading screen completed (class detected)');
            setTimeout(() => {
              initCardAnimations();
              initHeaderAnimations();
            }, CONFIG.transitionDelay);
            classObserver.disconnect();
          }
        }
      });
    });

    classObserver.observe(loadingScreen, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Fallback: Watch for loading screen removal from DOM
    const removalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node.id === CONFIG.loadingScreenId) {
            console.log('[CardAnimations] Loading screen completed (removal detected)');
            initCardAnimations();
            initHeaderAnimations();
            removalObserver.disconnect();
            classObserver.disconnect();
          }
        });
      });
    });

    removalObserver.observe(document.body, {
      childList: true
    });

    // Safety timeout (in case observers fail)
    setTimeout(() => {
      const stillExists = document.getElementById(CONFIG.loadingScreenId);
      if (stillExists && !stillExists.classList.contains(CONFIG.loadingScreenClass)) {
        console.warn('[CardAnimations] Loading screen timeout - forcing initialization');
        initCardAnimations();
        initHeaderAnimations();
        classObserver.disconnect();
        removalObserver.disconnect();
      }
    }, 10000); // 10 second timeout
  }

  /**
   * Public API for manual control
   */
  window.CardAnimations = {
    /**
     * Initialize animations manually
     */
    init: function() {
      initCardAnimations();
      initHeaderAnimations();
    },

    /**
     * Initialize only card animations
     */
    initCards: initCardAnimations,

    /**
     * Initialize only header animations
     */
    initHeaders: initHeaderAnimations,

    /**
     * Reset all animations
     */
    reset: function() {
      const elements = document.querySelectorAll('.card-animated, .header-animated');
      
      // Clear all active timeouts
      activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      activeTimeouts.clear();
      
      elements.forEach(element => {
        element.classList.remove('is-visible');
        observer.observe(element);
      });
    },

    /**
     * Stop observing all elements
     */
    destroy: function() {
      // Clear all active timeouts
      activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      activeTimeouts.clear();
      
      observer.disconnect();
      console.log('[CardAnimations] Observer disconnected');
    },

    /**
     * Update configuration
     */
    configure: function(options) {
      Object.assign(CONFIG, options);
      console.log('[CardAnimations] Configuration updated', CONFIG);
    }
  };

  // Auto-initialize on window load
  window.addEventListener('load', function() {
    // Small delay to ensure loading screen script has run
    setTimeout(waitForLoadingComplete, 100);
  });

  console.log('[CardAnimations] Script loaded');
})();