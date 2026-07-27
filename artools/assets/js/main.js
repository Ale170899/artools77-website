        // Initialize Icons
        lucide.createIcons();

        // Reveal Intersection Observer
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

        // Flashlight effect for cards
        document.querySelectorAll('.flashlight-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            });
        });

        // 2. Lenis Smooth Scroll Setup (FÃ­sica Premium)
        const lenis = new Lenis({
            duration: 1.5, // Controla o "peso" do scroll (inÃ©rcia base)
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1, // Restaura a sensibilidade original do mouse
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Connect Lenis to ScrollTrigger
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);


        // Animations
        document.addEventListener("DOMContentLoaded", () => {

            // Split Text
            const title = new SplitType('#hero-title', { types: 'lines, words' });
            gsap.set(title.words, { y: '100%', opacity: 0 });
            gsap.set('.video-wrapper', { scale: 1.1, opacity: 0 });
            gsap.set('#video-glow', { opacity: 0 });

            // Initial Timeline
            const tlInit = gsap.timeline({
                onComplete: () => {
                    gsap.to(["#right-indicator", "#bottom-indicator"], { opacity: 1, duration: 1 });
                }
            });

            // Video Entrance
            tlInit.to('.video-wrapper', {
                scale: 1,
                opacity: 1,
                duration: 2,
                ease: "power3.out"
            }, 0.2);

            tlInit.to('#video-glow', {
                opacity: 0.5,
                duration: 2,
                ease: "power2.out"
            }, 0.5);

            // Text Entrance
            tlInit.to(title.words, {
                y: '0%',
                opacity: 1,
                duration: 1.2,
                stagger: 0.05,
                ease: "expo.out"
            }, 0.6);

            // Desc & Buttons
            tlInit.to(['#hero-desc', '#hero-buttons'], {
                opacity: 1,
                y: 0,
                duration: 1.2,
                stagger: 0.2,
                ease: "power2.out"
            }, 1.2);
            gsap.set(['#hero-desc', '#hero-buttons'], { y: 20 });


            // 3. GSAP Native Video Scrubbing (Perfect 1:1 Mapping)
            const video = document.getElementById('hero-video');
            let isInitialized = false;

            function initParallax() {
                if (isInitialized) return;
                isInitialized = true;

                const scrollContainer = document.getElementById('scroll-container');

                // O vÃ­deo tenta tocar para garantir buffer inicial
                video.play().catch(e => { });

                // Motor Desacoplado: Play Nativo total na descida, e Rewind Proporcional na subida.
                let isRewinding = false;
                let rewindSnapshotProgress = 0;
                let rewindSnapshotTime = 0;

                // ForÃ§a o vÃ­deo a rodar nativamente
                video.play().catch(e => { });

                const scrollTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: scrollContainer,
                        start: "top top",
                        end: "bottom bottom",
                        scrub: true, // Resposta imediata para a interface
                        onUpdate: (self) => {
                            // Update right indicator line height
                            gsap.set("#scroll-progress-line", { height: `${self.progress * 100}%` });

                            if (video.duration && !isNaN(video.duration)) {
                                if (self.direction === 1) {
                                    // DESCENDO: Libera o player para tocar naturalmente sem lag
                                    if (isRewinding) {
                                        isRewinding = false;
                                        video.play().catch(e => { });
                                    }
                                } else if (self.direction === -1) {
                                    // SUBINDO: Inicia o Rewind
                                    if (!isRewinding) {
                                        isRewinding = true;
                                        video.pause();
                                        // Salva a posiÃ§Ã£o exata de onde comeÃ§amos a voltar para calcular a proporÃ§Ã£o
                                        rewindSnapshotProgress = self.progress;
                                        rewindSnapshotTime = video.currentTime;
                                    }

                                    // Calcula o retrocesso garantindo que volte ao 0 quando chegar no topo
                                    if (rewindSnapshotProgress > 0) {
                                        let ratio = self.progress / rewindSnapshotProgress;
                                        let newTime = ratio * rewindSnapshotTime;
                                        if (newTime < 0) newTime = 0;

                                        // OtimizaÃ§Ã£o leve para nÃ£o estressar a CPU
                                        if (Math.abs(video.currentTime - newTime) > 0.05) {
                                            video.currentTime = newTime;
                                        }
                                    }
                                }

                                // SeguranÃ§a: Quando chegar no topo exato
                                if (self.progress === 0) {
                                    isRewinding = false;
                                    video.currentTime = 0;
                                    video.play().catch(e => { });
                                }
                            }
                        }
                    }
                });

                // Inicializa o filtro puramente via GSAP para evitar que o CSS resete o brilho
                gsap.set('#video-layer', { filter: "grayscale(100%) contrast(125%) brightness(100%)" });

                // ForÃ§ar a timeline a ter uma duraÃ§Ã£o total padronizada de 1 (100% do scroll)
                scrollTl.to({}, { duration: 1 });

                // AnimaÃ§Ãµes simultÃ¢neas
                scrollTl
                    // O zoom do vÃ­deo acontece lentamente e um pouco mais forte para dar profundidade
                    .to('.video-wrapper', { scale: 1.15, ease: "none", duration: 1 }, 0)

                    // TEXTOS E BOTÃ•ES: Movemos todo o bloco pai de uma vez!
                    // Sai muito rÃ¡pido (5% do scroll) para focar logo no vÃ­deo
                    .to('#hero-text-wrapper', { y: -150, opacity: 0, ease: "power3.in", duration: 0.05 }, 0)
                    .to('#bottom-indicator', { opacity: 0, ease: "none", duration: 0.03 }, 0)

                    // MÃSCARA E CORES: Mais rÃ¡pido tambÃ©m (10% a 15%)
                    .to('#video-overlay', { opacity: 0, ease: "power2.inOut", duration: 0.10 }, 0)

                    // Tira o preto e branco garantindo brilho mÃ¡ximo (nÃ£o escurece a tela!)
                    .to('#video-layer', { filter: "grayscale(0%) contrast(100%) brightness(100%)", ease: "power2.inOut", duration: 0.15 }, 0);

                // (O vÃ­deo agora Ã© controlado 100% pelo requestAnimationFrame no onUpdate da timeline)
            }

            // Inicia imediatamente (as letras funcionam independente do buffer do vÃ­deo)
            initParallax();

            // 4. GSAP Animations & Interactions - Segunda Dobra (Architecture / Swiss Engineering)
            const archSection = document.getElementById('architecture-fold');
            if (archSection) {
                // Entrada animada do CabeÃ§alho (Tag, TÃ­tulo e SubtÃ­tulo)
                gsap.fromTo('#architecture-fold .arch-reveal', 
                    { y: 30, opacity: 0 },
                    {
                        scrollTrigger: {
                            trigger: '#architecture-fold',
                            start: 'top 99%',
                            toggleActions: 'play none none none'
                        },
                        y: 0,
                        opacity: 1,
                        stagger: 0.15,
                        duration: 0.8,
                        ease: 'power3.out'
                    }
                );

                // AnimaÃ§Ã£o do Card Visual da Esquerda (Orbital Mesh & Foto IA)
                gsap.fromTo('#architecture-fold .arch-left-card', 
                    { scale: 0.95, opacity: 0, x: -30 },
                    {
                        scrollTrigger: {
                            trigger: '#architecture-fold',
                            start: 'top 99%',
                            toggleActions: 'play none none none'
                        },
                        scale: 1.0,
                        opacity: 1,
                        x: 0,
                        duration: 1.0,
                        ease: 'power3.out'
                    }
                );

                // AnimaÃ§Ã£o Cascata (Stagger) dos Itens da Direita (01, 02, 03)
                gsap.fromTo('#architecture-fold .arch-item', 
                    { x: 30, opacity: 0 },
                    {
                        scrollTrigger: {
                            trigger: '#architecture-fold .arch-right-list',
                            start: 'top 99%',
                            toggleActions: 'play none none none'
                        },
                        x: 0,
                        opacity: 1,
                        stagger: 0.15,
                        duration: 0.8,
                        ease: 'power3.out'
                    }
                );

                // Efeito Parallax suave de SaÃ­da (Scrub ao rolar para o rodapÃ©)
                gsap.to('#architecture-fold .arch-left-card img', {
                    scrollTrigger: {
                        trigger: '#architecture-fold',
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1
                    },
                    yPercent: -15,
                    ease: 'none'
                });

                // Interatividade: Conectar hover da lista (01, 02, 03) com o card visual
                const items = document.querySelectorAll('#architecture-fold .arch-item');
                const cardImg = document.querySelector('#architecture-fold .arch-left-card img');
                items.forEach(item => {
                    item.addEventListener('mouseenter', () => {
                        gsap.to(cardImg, { scale: 1.15, filter: 'contrast(140%) brightness(110%)', duration: 0.5 });
                    });
                    item.addEventListener('mouseleave', () => {
                        gsap.to(cardImg, { scale: 1.0, filter: 'contrast(125%) brightness(100%)', duration: 0.5 });
                    });
                });

                // Reinicializa Ã­cones Lucide recÃ©m-adicionados
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            // 5. GSAP Animations â€” Terceira Dobra (Manifesto + Social Proof)
            const manifestoSection = document.getElementById('manifesto-fold');
            if (manifestoSection) {

                // Linha divisÃ³ria e tag de seÃ§Ã£o
                gsap.fromTo('#manifesto-fold .manifesto-reveal',
                    { y: 40, opacity: 0 },
                    {
                        scrollTrigger: {
                            trigger: '#manifesto-fold',
                            start: 'top 90%',
                            toggleActions: 'play none none none'
                        },
                        y: 0,
                        opacity: 1,
                        stagger: 0.2,
                        duration: 1.0,
                        ease: 'power3.out'
                    }
                );

                // Manifesto quote: words split reveal
                const manifestoLines = document.querySelectorAll('#manifesto-text span');
                gsap.fromTo(manifestoLines,
                    { y: 50, opacity: 0, skewY: 2 },
                    {
                        scrollTrigger: {
                            trigger: '#manifesto-text',
                            start: 'top 88%',
                            toggleActions: 'play none none none'
                        },
                        y: 0,
                        opacity: 1,
                        skewY: 0,
                        stagger: 0.12,
                        duration: 1.1,
                        ease: 'expo.out'
                    }
                );

                // Stats bar items â€” entrada cascata
                gsap.fromTo('#manifesto-fold .stat-item',
                    { y: 30, opacity: 0 },
                    {
                        scrollTrigger: {
                            trigger: '#manifesto-fold .stat-item',
                            start: 'top 90%',
                            toggleActions: 'play none none none',
                            onEnter: () => {
                                // Animated counters
                                document.querySelectorAll('#manifesto-fold .counter').forEach(el => {
                                    const target = parseInt(el.getAttribute('data-target'), 10);
                                    const isLarge = target > 100;
                                    let current = 0;
                                    const duration = 1800;
                                    const step = target / (duration / 16);
                                    const timer = setInterval(() => {
                                        current += step;
                                        if (current >= target) {
                                            current = target;
                                            clearInterval(timer);
                                        }
                                        el.textContent = isLarge
                                            ? Math.floor(current).toLocaleString('pt-BR') + '+'
                                            : Math.floor(current);
                                    }, 16);
                                });
                            }
                        },
                        y: 0,
                        opacity: 1,
                        stagger: 0.1,
                        duration: 0.7,
                        ease: 'power3.out'
                    }
                );

                // Testimonial cards â€” entrada stagger
                gsap.fromTo('#manifesto-fold .testimonial-card',
                    { y: 60, opacity: 0, scale: 0.97 },
                    {
                        scrollTrigger: {
                            trigger: '#manifesto-fold .testimonial-card',
                            start: 'top 88%',
                            toggleActions: 'play none none none'
                        },
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        stagger: 0.15,
                        duration: 0.9,
                        ease: 'power3.out'
                    }
                );

                // Parallax sutil no glow de fundo
                gsap.to('#manifesto-fold > div:nth-child(3)', {
                    scrollTrigger: {
                        trigger: '#manifesto-fold',
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1.5
                    },
                    yPercent: 20,
                    ease: 'none'
                });

                // Reinicializa Ã­cones Lucide recÃ©m-adicionados
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            // 6. GSAP Animations â€” Quarta Dobra (Guarantee Spotlight / VÃ­deo + Glow Box)
            const guaranteeSection = document.getElementById('guarantee-fold');
            if (guaranteeSection) {
                gsap.fromTo('#guarantee-fold .guarantee-reveal',
                    { y: 50, opacity: 0, scale: 0.98 },
                    {
                        scrollTrigger: {
                            trigger: '#guarantee-fold',
                            start: 'top 85%',
                            toggleActions: 'play none none none'
                        },
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        stagger: 0.25,
                        duration: 1.1,
                        ease: 'power3.out'
                    }
                );

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            // 7. Senior Interactive Polish: Magnetic Buttons & 3D Tilt Physics
            document.querySelectorAll('a.group, button, .stat-item').forEach(el => {
                el.addEventListener('mousemove', (e) => {
                    const rect = el.getBoundingClientRect();
                    const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
                    const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
                    gsap.to(el, { x: x, y: y, duration: 0.3, ease: 'power2.out' });
                });
                el.addEventListener('mouseleave', () => {
                    gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
                });
            });

            // Garante o cÃ¡lculo perfeito das posiÃ§Ãµes de rolagem apÃ³s o carregamento das imagens e fontes
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 300);
        });

