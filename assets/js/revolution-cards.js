document.addEventListener('DOMContentLoaded', function() {
    const tagButtons = document.querySelectorAll('.tag-button');
    const contentCards = document.querySelectorAll('.content-card');
    
    tagButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            
            // Update button states
            tagButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            
            // Update card visibility
            contentCards.forEach(card => {
                if (card.getAttribute('data-card') === targetId) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        });
    });
});