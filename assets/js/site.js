(() => {
  const body = document.body;
  if (window.AOS) {
    window.AOS.init({
      duration: 720,
      easing: 'ease-out-cubic',
      once: true,
      offset: 72,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });
  }
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = body.classList.toggle('menu-open');
      nav.classList.toggle('mobile-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      body.classList.remove('menu-open');
      nav.classList.remove('mobile-open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const answer = item?.querySelector('.faq-answer');
      if (!item || !answer) return;
      const open = item.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
      answer.style.height = open ? `${answer.scrollHeight}px` : '0px';
    });
  });

  document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
    const filterButtons = scope.querySelectorAll('[data-filter]');
    const filterCards = scope.querySelectorAll('[data-category]');
    const search = scope.querySelector('[data-blog-search]');
    const empty = scope.querySelector('[data-blog-empty]');
    let activeFilter = 'todos';
    let activeJourney = '';
    let searchTerm = '';
    const applyFilters = () => {
      let visibleCount = 0;
      filterCards.forEach((card) => {
        const categoryMatch = activeFilter === 'todos' || card.getAttribute('data-category') === activeFilter;
        const journeyMatch = !activeJourney || card.getAttribute('data-journey') === activeJourney;
        const searchMatch = !searchTerm || (card.getAttribute('data-search') || '').includes(searchTerm);
        const visible = categoryMatch && journeyMatch && searchMatch;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      if (empty) empty.hidden = visibleCount > 0;
    };
    // Destaque do catálogo: só o painel ativo fica no DOM; os outros esperam em <template>.
    // Trocar é mover o painel do template para a tela e guardar o anterior no mesmo template.
    const features = scope.querySelector('[data-catalog-features]');
    const showPanel = (slug) => {
      if (!slug || !features) return;
      const current = features.querySelector(':scope > [data-catalog-panel]');
      const stored = features.querySelector(`template[data-catalog-template="${slug}"]`);
      if (current?.dataset.catalogPanel !== slug && stored) {
        features.prepend(stored.content.firstElementChild);
        if (current) {
          stored.content.append(current);
          stored.dataset.catalogTemplate = current.dataset.catalogPanel;
        }
      }
      scope.querySelectorAll('[data-catalog-slug]').forEach((card) => card.classList.toggle('active', card.dataset.catalogSlug === slug));
    };
    // Carrossel do catálogo: os nomes trocam o destaque sozinhos, em loop lento; clique escolhe, mouse em cima pausa.
    const carousel = scope.querySelector('[data-catalog-carousel]');
    if (carousel && features) {
      const section = scope.closest('section') || scope;
      const delay = 7000;
      const visibleChips = () => [...carousel.querySelectorAll('[data-catalog-slug]')].filter((chip) => !chip.hidden);
      let timer = null;
      let paused = false;
      const select = (chip) => {
        showPanel(chip.dataset.catalogSlug);
        if (carousel.scrollWidth > carousel.clientWidth) carousel.scrollTo({ left: chip.offsetLeft - (carousel.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
      };
      const next = () => {
        const chips = visibleChips();
        if (!chips.length) return;
        const current = chips.findIndex((chip) => chip.classList.contains('active'));
        select(chips[(current + 1) % chips.length]);
      };
      const stop = () => { clearInterval(timer); timer = null; };
      const start = () => { stop(); if (!paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(next, delay); };
      const pause = () => { paused = true; stop(); };
      const resume = () => { paused = false; start(); };
      carousel.querySelectorAll('[data-catalog-slug]').forEach((chip) => chip.addEventListener('click', () => { select(chip); start(); }));
      section.addEventListener('mouseenter', pause);
      section.addEventListener('mouseleave', resume);
      section.addEventListener('focusin', (event) => { if (event.target.matches(':focus-visible')) pause(); });
      section.addEventListener('focusout', (event) => { if (!section.contains(event.relatedTarget) && paused && !section.matches(':hover')) resume(); });
      filterButtons.forEach((button) => button.addEventListener('click', () => start()));
      start();
    }
    filterButtons.forEach((button) => button.addEventListener('click', () => {
      activeFilter = button.getAttribute('data-filter');
      activeJourney = '';
      filterButtons.forEach((item) => item.classList.toggle('active', item === button));
      applyFilters();
      const selected = [...filterCards].find((card) => !card.hidden);
      if (selected) showPanel(selected.dataset.catalogSlug);
    }));
    if (search) search.addEventListener('input', () => {
      searchTerm = search.value.trim().toLocaleLowerCase('pt-BR');
      applyFilters();
    });
    if (search) document.querySelectorAll('[data-trail-filter]').forEach((trail) => trail.addEventListener('click', () => {
      activeFilter = 'todos';
      activeJourney = trail.getAttribute('data-trail-filter') || '';
      filterButtons.forEach((item) => item.classList.toggle('active', item.getAttribute('data-filter') === 'todos'));
      applyFilters();
    }));
  });

  document.querySelectorAll('[data-copy-link]').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.getAttribute('data-copy-link') || window.location.href;
      try {
        await navigator.clipboard.writeText(value);
        const label = button.querySelector('span');
        if (label) {
          const original = label.textContent;
          label.textContent = 'Link copiado';
          window.setTimeout(() => { label.textContent = original; }, 1800);
        }
      } catch {
        window.prompt('Copie o link do artigo:', value);
      }
    });
  });

  const hero = document.querySelector('[data-hero-slider]');
  if (hero) {
    const slides = [...hero.querySelectorAll('[data-hero-slide]')];
    const dots = [...hero.querySelectorAll('[data-hero-dot]')];
    let active = 0;
    let timer;
    const show = (index) => {
      active = index;
      slides.forEach((slide, slideIndex) => {
        const selected = slideIndex === active;
        slide.hidden = !selected;
        slide.classList.toggle('is-active', selected);
      });
      dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === active));
    };
    const play = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => show((active + 1) % slides.length), 5600);
    };
    dots.forEach((dot, index) => dot.addEventListener('click', () => { show(index); play(); }));
    hero.addEventListener('mouseenter', () => window.clearInterval(timer));
    hero.addEventListener('mouseleave', play);
    hero.addEventListener('focusin', () => window.clearInterval(timer));
    hero.addEventListener('focusout', play);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) play();
  }

  // Vídeo do YouTube só carrega no clique, para não pesar a página.
  document.querySelectorAll('[data-video-facade]').forEach((shell) => {
    shell.querySelector('button').addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${shell.dataset.videoFacade}?autoplay=1&rel=0`;
      frame.title = shell.dataset.videoTitle;
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allowFullscreen = true;
      shell.querySelector('.tv-player').replaceChildren(frame);
    }, { once: true });
  });

  const sequence = document.querySelector('[data-hero-sequence]');
  if (sequence && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData) {
    const canvas = sequence.querySelector('canvas');
    const context = canvas.getContext('2d');
    const total = Number(sequence.dataset.frames);
    const interval = 1000 / Number(sequence.dataset.fps);
    const frames = [];
    let current = 0;
    let last = 0;
    let visible = true;
    const tick = (time) => {
      if (visible && time - last >= interval) {
        last = time;
        context.drawImage(frames[current], 0, 0, canvas.width, canvas.height);
        current = (current + 1) % total;
      }
      window.requestAnimationFrame(tick);
    };
    const start = () => {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(sequence);
      context.drawImage(frames[0], 0, 0, canvas.width, canvas.height);
      sequence.classList.add('is-playing');
      window.requestAnimationFrame(tick);
    };
    const load = () => {
      let loaded = 0;
      for (let index = 1; index <= total; index += 1) {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => { loaded += 1; if (loaded === total) start(); };
        image.src = `${sequence.dataset.heroSequence}f${String(index).padStart(3, '0')}.webp`;
        frames.push(image);
      }
    };
    if (document.readyState === 'complete') load();
    else window.addEventListener('load', load, { once: true });
  }

  const megaMenus = document.querySelectorAll('.mega-menu');
  document.addEventListener('click', (event) => {
    megaMenus.forEach((menu) => {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') megaMenus.forEach((menu) => menu.removeAttribute('open'));
  });

  const progress = document.querySelector('[data-reading-progress]');
  if (progress) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const sections = tocLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    const tocObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      tocLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`));
    }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 });
    sections.forEach((section) => tocObserver.observe(section));
  }

  document.querySelectorAll('[data-ai-summary]').forEach((summary) => {
    const trigger = summary.querySelector('[data-ai-summary-trigger]');
    const content = summary.querySelector('[data-ai-summary-content]');
    if (!trigger || !content) return;
    trigger.addEventListener('click', () => {
      const open = trigger.getAttribute('aria-expanded') !== 'true';
      trigger.setAttribute('aria-expanded', String(open));
      content.hidden = !open;
      summary.classList.toggle('is-open', open);
      const label = trigger.querySelector('.ai-summary-action');
      if (label) label.firstChild.textContent = open ? 'Ocultar resumo ' : 'Gerar resumo ';
    });
  });

  document.querySelectorAll('[data-ai-summary-launch]').forEach((button) => {
    button.addEventListener('click', () => {
      const summary = document.querySelector('[data-ai-summary]');
      const trigger = summary?.querySelector('[data-ai-summary-trigger]');
      if (!summary || !trigger) return;
      if (trigger.getAttribute('aria-expanded') !== 'true') trigger.click();
      summary.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    });
  });

  const tvPlayer = document.querySelector('[data-tv-player]');
  if (tvPlayer) {
    const frame = tvPlayer.querySelector('[data-tv-frame]');
    const poster = tvPlayer.querySelector('[data-tv-player-poster]');
    const title = tvPlayer.querySelector('[data-tv-title]');
    const summary = tvPlayer.querySelector('[data-tv-summary]');
    const kicker = tvPlayer.querySelector('[data-tv-kicker]');
    const youtube = tvPlayer.querySelector('[data-tv-youtube]');
    poster?.addEventListener('click', () => {
      if (!frame) return;
      const current = new URL(frame.src);
      current.searchParams.set('autoplay', '1');
      frame.src = current.toString();
      tvPlayer.classList.add('is-playing');
    });
    document.querySelectorAll('[data-tv-video]').forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.videoId;
      if (!id || !frame) return;
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.title = button.dataset.videoTitle || 'Vídeo da TV Wolves';
      if (title) title.textContent = button.dataset.videoTitle || '';
      if (summary) summary.textContent = button.dataset.videoSummary || '';
      if (kicker) kicker.textContent = button.dataset.videoKicker || '';
      if (youtube) youtube.href = button.dataset.videoUrl || '#';
      tvPlayer.classList.add('is-playing');
      document.querySelectorAll('[data-tv-video]').forEach((item) => item.closest('.tv-card')?.classList.toggle('is-active', item === button));
      tvPlayer.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    }));
  }

  const legacyLibrary = document.querySelector('[data-legacy-library]');
  if (legacyLibrary) {
    const toggleLegacy = legacyLibrary.querySelector('[data-legacy-toggle]');
    toggleLegacy?.addEventListener('click', () => {
      const open = legacyLibrary.classList.toggle('is-expanded');
      toggleLegacy.textContent = open ? 'Mostrar menos' : `Mostrar todo o acervo (${legacyLibrary.querySelectorAll('[data-legacy-card]').length})`;
    });
  }

  // Gestão 360: cada volta completa do anel conclui uma fase no card; as fases se repetem sem fim.
  document.querySelectorAll('[data-cycle]').forEach((card) => {
    const section = card.closest('section');
    const phases = [...card.querySelectorAll('[data-cycle-phase]')];
    const dots = [...card.querySelectorAll('.cycle-steps span')];
    if (!phases.length || !section) return;
    const setPhase = (index) => {
      phases.forEach((phase, k) => phase.classList.toggle('active', k === index));
      dots.forEach((dot, k) => { dot.classList.toggle('active', k === index); dot.classList.toggle('done', k < index); });
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      phases[0].querySelectorAll('[data-cycle-item]').forEach((item) => item.classList.add('done'));
      section.style.setProperty('--cycle', 1);
      return;
    }
    const lap = 4200;
    let phase = 0;
    let start = 0;
    const frame = (now) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / lap, 1);
      section.style.setProperty('--cycle', progress.toFixed(4));
      const items = phases[phase].querySelectorAll('[data-cycle-item]');
      items.forEach((item, k) => item.classList.toggle('done', progress >= (k + 1) / items.length - 0.001));
      if (progress < 1) { requestAnimationFrame(frame); return; }
      section.classList.add('lap-done');
      setTimeout(() => {
        section.classList.remove('lap-done');
        items.forEach((item) => item.classList.remove('done'));
        phase = (phase + 1) % phases.length;
        setPhase(phase);
        start = 0;
        requestAnimationFrame(frame);
      }, 900);
    };
    setPhase(0);
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); requestAnimationFrame(frame); }
    }, { threshold: 0.3 });
    observer.observe(section);
  });

  const revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('visible'));
  }

  // Agendamento: monta a mensagem e abre o WhatsApp do escritório (nada é gravado em servidor).
  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const linhas = [form.dataset.intro || 'Olá, quero agendar um atendimento no Colemar Fernandes Advogados.'];
      if (data.get('nome')) linhas.push(`Nome: ${data.get('nome')}`);
      if (data.get('area')) linhas.push(`Assunto: ${data.get('area')}`);
      if (data.get('periodo')) linhas.push(`Melhor período: ${data.get('periodo')}`);
      if (data.get('mensagem')) linhas.push(`Recado: ${data.get('mensagem')}`);
      const numero = form.dataset.whatsapp;
      const aviso = form.querySelector('[data-form-aviso]');
      if (!numero) {
        if (aviso) aviso.hidden = false;
        return;
      }
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener,noreferrer');
      const modalAberto = form.closest('dialog');
      if (modalAberto) modalAberto.close();
    });
  });

  // Popup de agendamento: todo link [data-wa-popup] abre o formulário; sem suporte a <dialog>, segue o link do wa.me.
  const modal = document.querySelector('[data-wa-modal]');
  const lembrar = (chave, valor) => { try { sessionStorage.setItem(chave, valor); } catch (e) { /* navegação privada */ } };
  const lembrado = (chave) => { try { return sessionStorage.getItem(chave); } catch (e) { return null; } };
  if (modal && typeof modal.showModal === 'function') {
    document.addEventListener('click', (event) => {
      const gatilho = event.target.closest('[data-wa-popup]');
      if (!gatilho) return;
      event.preventDefault();
      esconderBalao();
      modal.showModal();
      document.documentElement.classList.add('wa-modal-open');
      const primeiro = modal.querySelector('input[name="nome"]');
      if (primeiro && window.matchMedia('(min-width: 641px)').matches) primeiro.focus();
    });
    modal.querySelector('[data-wa-close]')?.addEventListener('click', () => modal.close());
    modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });
    modal.addEventListener('close', () => document.documentElement.classList.remove('wa-modal-open'));
  }

  // Balão do botão flutuante: aparece depois de alguns segundos, "digitando" e depois a oferta.
  const balao = document.querySelector('[data-wa-bubble]');
  function esconderBalao() {
    if (!balao || balao.hidden) return;
    balao.classList.remove('is-open');
    setTimeout(() => { balao.hidden = true; }, 250);
    lembrar('waBalao', 'fechado');
  }
  if (balao && !lembrado('waBalao')) {
    setTimeout(() => {
      balao.hidden = false;
      requestAnimationFrame(() => balao.classList.add('is-open'));
      setTimeout(() => {
        balao.querySelector('[data-wa-typing]').hidden = true;
        balao.querySelector('[data-wa-msg]').hidden = false;
      }, 1600);
    }, 4000);
    balao.querySelector('[data-wa-bubble-close]').addEventListener('click', esconderBalao);
  }
})();
