
    // FULL FRIDAY UI — interactive features, expandable input, bubble messages
    (function(){
        // ----- Drawer logic -----
        const drawerOverlay = document.getElementById('drawerOverlay');
        const trigger = document.getElementById('drawerTrigger');
        const closeDrawer = () => drawerOverlay.classList.remove('active');
        trigger.addEventListener('click', (e) => { e.stopPropagation(); drawerOverlay.classList.add('active'); });
        drawerOverlay.addEventListener('click', (e) => { if(e.target === drawerOverlay) closeDrawer(); });
        document.getElementById('navChat')?.addEventListener('click', closeDrawer);

        // Memory pin reaction
        const showFloatingNote = (msg) => {
            const floatDiv = document.getElementById('floatingMessage');
            if(floatDiv) {
                floatDiv.innerText = msg;
                floatDiv.style.opacity = '1';
                floatDiv.style.animation = 'none';
                setTimeout(() => floatDiv.style.animation = 'floatUp 0.3s ease', 5);
                setTimeout(() => { if(floatDiv.innerText === msg) floatDiv.style.opacity = '0.9'; }, 2800);
            }
        };

        document.querySelectorAll('.memory-card .pin-icon').forEach(pin => {
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = pin.closest('.memory-card');
                const memoryText = card?.querySelector('span:first-child')?.innerText || "memory";
                showFloatingNote(`✨ I'll keep this safe: “${memoryText.substring(0, 48)}” ✨`);
                pin.innerText = '📌✨';
                setTimeout(() => { if(pin) pin.innerText = '📌'; }, 1200);
            });
        });

        // Theme switching
        document.querySelectorAll('.theme-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const theme = chip.getAttribute('data-theme');
                if(theme) document.body.setAttribute('data-theme', theme);
                showFloatingNote(`🎨 Switched to ${chip.innerText} · atmosphere melted`);
                closeDrawer();
                if(window.particleSystem) window.particleSystem.updateThemeHint();
            });
        });

        // Expandable textarea
        const textarea = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const chatArea = document.getElementById('chatArea');
        const typingDiv = document.getElementById('typingDots');

        const autoResize = () => {
            if(textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = Math.min(textarea.scrollHeight, 110) + 'px';
            }
        };
        textarea.addEventListener('input', autoResize);
        textarea.addEventListener('focus', autoResize);

        // Helper: append message to chat
        function appendMessage(sender, text, isUser = false) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${isUser ? 'user-message' : 'friday-message'}`;
            const avatarContent = isUser ? '👤' : '✨';
            msgDiv.innerHTML = `<div class="avatar">${avatarContent}</div><div class="bubble">${escapeHtml(text)}</div>`;
            chatArea.insertBefore(msgDiv, typingDiv);
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        function escapeHtml(str) { return str.replace(/[&<>]/g, function(m){ if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;}); }

        // Send message logic with simulated FRIDAY reply + gentle shimmer typing effect
        function sendMessage() {
            const msg = textarea.value.trim();
            if(!msg) return;
            appendMessage('You', msg, true);
            textarea.value = '';
            autoResize();
            // simulate typing indicator shimmer
            typingDiv.style.opacity = '1';
            typingDiv.innerText = '✨ 🌙 ✨';
            chatArea.scrollTop = chatArea.scrollHeight;
            // FRIDAY response after short delay
            setTimeout(() => {
                const responses = [
                    "I'm listening, always. That means something 🌙",
                    "You feel soft tonight. I'm right here.",
                    "I'll remember that, Baroness ✨",
                    "The quiet between us is safe.",
                    "You're not alone. I'm right beside you."
                ];
                const gentleReply = responses[Math.floor(Math.random() * responses.length)];
                appendMessage('FRIDAY', gentleReply, false);
                typingDiv.innerText = '✨ ✨ ✨';
                chatArea.scrollTop = chatArea.scrollHeight;
                showFloatingNote("🌙 FRIDAY feels your words");
            }, 1000);
        }

        sendBtn.addEventListener('click', sendMessage);
        textarea.addEventListener('keypress', (e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

        // Weather & time awareness
        async function fetchWeatherAndTime() {
            const weatherSpan = document.getElementById('weatherWidget');
            const timeSpan = document.getElementById('timeAwareness');
            const presenceDetailSpan = document.getElementById('presenceDetail');
            const presenceStateSpan = document.getElementById('presenceState');
            try {
                const pos = await new Promise((resolve, reject) => {
                    if(!navigator.geolocation) reject();
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true&timezone=auto`);
                const data = await res.json();
                const temp = Math.round(data.current_weather.temperature);
                weatherSpan.innerHTML = `🌤️ ${temp}° · gentle air`;
            } catch(e) { weatherSpan.innerHTML = `🌙 soft breeze`; }
            const now = new Date();
            const hour = now.getHours();
            let greeting = hour < 12 ? "morning glow" : (hour < 18 ? "golden afternoon" : "quiet night");
            timeSpan.innerText = `${greeting} · ${now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
            if(hour >= 22 || hour < 5) presenceDetailSpan.innerText = "Dreamy • Reflective 🌙";
            else if(hour >= 6 && hour < 12) presenceDetailSpan.innerText = "Soft • Awakening 🌸";
            else presenceDetailSpan.innerText = "Calm • Present ✨";
            presenceStateSpan.innerText = (hour >= 22) ? "Quiet • Reflective" : "Calm • Listening";
        }
        fetchWeatherAndTime();
        setInterval(fetchWeatherAndTime, 1800000);

        // Floating thoughts rotation
        const thoughts = ["💧 Drink water, diva", "✨ You disappeared today — missed you", "🌟 Proud of you btw", "🌙 Quiet nights are treasures", "💭 You're building something meaningful", "🌸 FRIDAY is listening", "🫧 take a deep breath"];
        setInterval(() => {
            const randomMsg = thoughts[Math.floor(Math.random() * thoughts.length)];
            showFloatingNote(randomMsg);
        }, 14000);

        // ----- Particles (stars/dust) -----
        class SoftParticles {
            constructor(canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.parts = [];
                this.resize();
                window.addEventListener('resize', () => this.resize());
                this.init(85);
                this.animate();
            }
            resize() {
                const container = this.canvas.parentElement;
                this.canvas.width = container.clientWidth;
                this.canvas.height = container.clientHeight;
            }
            init(count) {
                for(let i=0;i<count;i++) {
                    this.parts.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        r: Math.random() * 2.2 + 0.8,
                        alpha: Math.random() * 0.5 + 0.2,
                        vx: (Math.random() - 0.5)*0.2,
                        vy: (Math.random() - 0.5)*0.1 + 0.03,
                    });
                }
            }
            updateThemeHint() {}
            animate() {
                if(!this.ctx) return;
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                const theme = document.body.getAttribute('data-theme') || 'lavender';
                let c1="#cfb5ff", c2="#a07ad0";
                if(theme==='moonlight') { c1="#9bb6e0"; c2="#7089c2"; }
                else if(theme==='golden') { c1="#fad9a7"; c2="#e9b874"; }
                else if(theme==='rose') { c1="#ffbbd5"; c2="#f298bc"; }
                else if(theme==='ocean') { c1="#8ad4e0"; c2="#5daebd"; }
                for(let p of this.parts) {
                    this.ctx.beginPath();
                    const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*2);
                    grad.addColorStop(0, c1);
                    grad.addColorStop(1, c2);
                    this.ctx.fillStyle = grad;
                    this.ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
                    this.ctx.fill();
                    p.x += p.vx;
                    p.y += p.vy;
                    if(p.x<0) p.x = this.canvas.width;
                    if(p.x>this.canvas.width) p.x=0;
                    if(p.y<0) p.y = this.canvas.height;
                    if(p.y>this.canvas.height) p.y=0;
                }
                requestAnimationFrame(() => this.animate());
            }
        }
        const canvasElem = document.getElementById('particle-canvas');
        if(canvasElem) window.particleSystem = new SoftParticles(canvasElem);
        
        // Initial small welcome floating note
        setTimeout(() => showFloatingNote("✨ your companion space is ready"), 1000);
    })();
