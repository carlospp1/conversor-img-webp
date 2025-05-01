class Layout {
    constructor() {
        this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
        this.init();
    }

    init() {
        this.createNavbar();
        this.setActiveLink();
    }

    createNavbar() {
        const navbar = document.createElement('nav');
        navbar.className = 'navbar';
        navbar.innerHTML = `
            <ul class="nav-links">
                <li><a href="index.html">Conversión Individual</a></li>
                <li><a href="multiple.html">Conversión Múltiple</a></li>
            </ul>
        `;
        document.body.insertBefore(navbar, document.body.firstChild);
    }

    setActiveLink() {
        const links = document.querySelectorAll('.nav-links a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === this.currentPage) {
                link.classList.add('active');
            }
        });
    }
}

// Inicializar el layout cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new Layout();
}); 