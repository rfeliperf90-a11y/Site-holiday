// Shared navigation script (menu only)
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    const navItems = document.querySelectorAll('.nav-link');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks) navLinks.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (navLinks && !e.target.closest('.navbar')) {
            navLinks.classList.remove('active');
        }
    });
});
