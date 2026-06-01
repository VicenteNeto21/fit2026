function initParticles(canvasId, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const colors = options.colors || ['rgba(255, 95, 23, 0.08)', 'rgba(255, 200, 0, 0.08)', 'rgba(28, 0, 255, 0.04)'];
    const count = options.count || 8;
    const maxRadius = options.maxRadius || 80;
    const minRadius = options.minRadius || 40;
    const speedX = options.speedX || 0.4;
    const speedY = options.speedY || 0.5;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height + canvas.height * 0.2;
            this.radius = Math.random() * (maxRadius - minRadius) + minRadius;
            this.vx = Math.random() * speedX - speedX / 2;
            this.vy = -(Math.random() * speedY + 0.08);
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.y + this.radius < 0) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    for (let i = 0; i < count; i++) particles.push(new Particle());

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(loop);
    }
    loop();
}
