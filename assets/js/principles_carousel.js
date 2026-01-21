document.addEventListener('DOMContentLoaded', function() {
  const grid = document.getElementById('principlesGrid');
  if (!grid) return;
  
  const cards = Array.from(grid.querySelectorAll('.principle-card'));
  const prevBtn = document.querySelector('.carousel-arrow.prev');
  const nextBtn = document.querySelector('.carousel-arrow.next');
  
  if (!prevBtn || !nextBtn || cards.length === 0) return;
  
  const cardsPerView = 3;
  let currentIndex = 0;
  
  function updateCarousel() {
    cards.forEach((card, index) => {
      if (index >= currentIndex && index < currentIndex + cardsPerView) {
        card.style.display = 'block';
        card.style.opacity = '1';
        card.style.transition = 'opacity 0.3s ease';
      } else {
        card.style.display = 'none';
        card.style.opacity = '0';
      }
    });
    
    // Update button states
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= cards.length - cardsPerView;
    
    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
    nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    prevBtn.style.pointerEvents = prevBtn.disabled ? 'none' : 'auto';
    nextBtn.style.pointerEvents = nextBtn.disabled ? 'none' : 'auto';
  }
  
  function showPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  }
  
  function showNext() {
    if (currentIndex < cards.length - cardsPerView) {
      currentIndex++;
      updateCarousel();
    }
  }
  
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);
  
  // Initialize
  updateCarousel();
});

