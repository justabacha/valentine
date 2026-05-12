// ========================================
// PARTICLE SYSTEM (SOFT ATMOSPHERE ENGINE)
// ========================================

export class ParticleSystem {

    constructor(canvas) {

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.particles = [];

        this.init();

        this.animate();

        window.addEventListener(
            'resize',
            () => this.resize()
        );
    }


    // ========================================
    // INIT
    // ========================================

    init(count = 85) {

        this.resize();

        this.particles = [];

        for (let i = 0; i < count; i++) {

            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                r: Math.random() * 2.2 + 0.8,
                alpha: Math.random() * 0.5 + 0.2,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.1 + 0.03
            });
        }
    }


    // ========================================
    // RESIZE
    // ========================================

    resize() {

        const container = this.canvas.parentElement;

        if (!container) return;

        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }


    // ========================================
    // THEME HOOK
    // ========================================

    getThemeColors() {

        const theme =
            document.body.getAttribute('data-theme')
            || 'lavender';

        switch (theme) {

            case 'moonlight':
                return { c1: "#9bb6e0", c2: "#7089c2" };

            case 'golden':
                return { c1: "#fad9a7", c2: "#e9b874" };

            case 'rose':
                return { c1: "#ffbbd5", c2: "#f298bc" };

            case 'ocean':
                return { c1: "#8ad4e0", c2: "#5daebd" };

            default:
                return { c1: "#cfb5ff", c2: "#a07ad0" };
        }
    }


    // ========================================
    // ANIMATION LOOP
    // ========================================

    animate() {

        if (!this.ctx) return;

        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        const { c1, c2 } = this.getThemeColors();

        for (let p of this.particles) {

            this.ctx.beginPath();

            const grad =
                this.ctx.createRadialGradient(
                    p.x, p.y, 0,
                    p.x, p.y, p.r * 2
                );

            grad.addColorStop(0, c1);
            grad.addColorStop(1, c2);

            this.ctx.fillStyle = grad;

            this.ctx.arc(
                p.x,
                p.y,
                p.r,
                0,
                Math.PI * 2
            );

            this.ctx.fill();

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
        }

        requestAnimationFrame(() => this.animate());
    }
}


// ========================================
// BOOTSTRAP HELPER
// ========================================

export function initializeParticles(canvas) {

    if (!canvas) return null;

    const system = new ParticleSystem(canvas);

    window.particleSystem = system;

    console.log("Particle engine online ✨");

    return system;
}