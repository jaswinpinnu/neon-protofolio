(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#year').textContent = new Date().getFullYear();

  // Mobile navigation
  const menuToggle = $('.menu-toggle');
  const nav = $('.desktop-nav');
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  $$('.desktop-nav a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));

  // Reveal content without making the site dependent on GSAP.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(el => observer.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  // Optional cinematic scroll choreography.
  if (!reducedMotion && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to('.hero-title', {
      yPercent: 16, opacity: 0.35, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero-grid', {
      backgroundPosition: '0px 180px', ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    $$('.project-card').forEach((card, i) => {
      gsap.fromTo(card, { y: 35 }, {
        y: 0, ease: 'power2.out',
        scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 45%', scrub: true }
      });
    });
  }

  // Project case studies: content is intentionally limited to the supplied resume.
  const projects = {
    commerce: {
      kicker: 'PROJECT FILE / 01 — PERSONAL PROJECT · 2026',
      title: 'RK FASHIONS',
      description: 'A responsive e-commerce web application built with HTML, CSS, JavaScript, and Firebase for desktop and mobile users.',
      details: ['Firebase Authentication', 'Registration & login', 'Password reset', 'Google Sign-In', 'Product categories & listings', 'Cart management', 'Saved addresses', 'UPI payment workflow', 'Order history', 'JavaScript & localStorage']
    },
    vision: {
      kicker: 'PROJECT FILE / 02 — CAPSTONE · 2026',
      title: 'LAND USE / LAND COVER CLASSIFICATION',
      description: 'A deep-learning capstone using Vision Transformers (ViT) to classify land-use and land-cover categories from satellite imagery.',
      details: ['Deep learning', 'Computer vision', 'Vision Transformers (ViT)', 'Satellite imagery', 'Image classification']
    }
  };
  const modal = $('#project-modal');
  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  };
  $$('.project-link').forEach(button => button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    if (!project) return;
    $('#modal-kicker').textContent = project.kicker;
    $('#modal-title').textContent = project.title;
    $('#modal-description').textContent = project.description;
    $('#modal-details').replaceChildren(...project.details.map(item => {
      const span = document.createElement('span');
      span.textContent = item;
      return span;
    }));
    modal.hidden = false;
    document.body.classList.add('modal-open');
    $('.modal-close').focus();
  }));
  $$('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  // Three.js city: procedural buildings, neon edges, stars and camera parallax.
  const canvas = $('#city-canvas');
  if (!window.THREE || !canvas) {
    canvas.style.display = 'none';
    return;
  }

  let renderer, scene, camera, animationFrame;
  let buildings = [];
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  let resizeObserver;
  const clock = new THREE.Clock();

  try {
    
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("city-canvas"),
  alpha: true,
  antialias: true
});

renderer.setClearColor(0x000000, 0);

  } catch (err) {
    canvas.style.display = 'none';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.7));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080a12, 0.022);
  camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 220);
  camera.position.set(0, 5.5, 23);

  scene.add(new THREE.HemisphereLight(0x6a8dbe, 0x090b13, 1.4));
  const cyanLight = new THREE.PointLight(0x00f5d4, 35, 65);
  cyanLight.position.set(-9, 7, -2);
  scene.add(cyanLight);
  const pinkLight = new THREE.PointLight(0xff3cac, 28, 60);
  pinkLight.position.set(9, 5, -8);
  scene.add(pinkLight);

  const groundMat = new THREE.MeshStandardMaterial({ color: 0x101625, metalness: 0.72, roughness: 0.38 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.3;
  scene.add(ground);

  // City blocks are deliberately procedural so no external 3D assets are required.
  const buildingMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x101827, metalness: 0.68, roughness: 0.42 }),
    new THREE.MeshStandardMaterial({ color: 0x17182c, metalness: 0.7, roughness: 0.36 }),
    new THREE.MeshStandardMaterial({ color: 0x0d202b, metalness: 0.65, roughness: 0.4 })
  ];
  const neonMats = [
    new THREE.MeshBasicMaterial({ color: 0x00f5d4 }),
    new THREE.MeshBasicMaterial({ color: 0xff3cac }),
    new THREE.MeshBasicMaterial({ color: 0x478bff })
  ];
  const seeded = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 64; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const x = side * (5.5 + seeded(i + 2) * 18);
    const z = -5 - row * 2.15 + seeded(i + 40) * 3;
    const w = 0.8 + seeded(i + 9) * 2.1;
    const h = 2.5 + seeded(i + 20) * 12.5;
    const d = 1 + seeded(i + 80) * 2.1;
    const geometry = new THREE.BoxGeometry(w, h, d);
    const building = new THREE.Mesh(geometry, buildingMaterials[i % buildingMaterials.length]);
    building.position.set(x, -2.3 + h / 2, z);
    building.rotation.y = (seeded(i + 100) - 0.5) * 0.1;
    scene.add(building);
    buildings.push({ mesh: building, baseY: building.position.y, phase: seeded(i + 10) * 6.28 });

    // Neon roof edge
    const edge = new THREE.Mesh(new THREE.BoxGeometry(w * 1.015, 0.035, d * 1.015), neonMats[i % neonMats.length]);
    edge.position.set(x, -2.3 + h, z);
    scene.add(edge);

    // A few vertical luminous strips per building
    const stripCount = 1 + Math.floor(seeded(i + 30) * 3);
    for (let s = 0; s < stripCount; s++) {
      const stripH = h * (0.3 + seeded(i * 4 + s + 2) * 0.55);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.025, stripH, 0.025), neonMats[(i + s + 1) % neonMats.length]);
      strip.position.set(
        x + (seeded(i + s + 12) - 0.5) * w * 0.8,
        -2.3 + stripH / 2 + 0.1,
        z + d / 2 + 0.025
      );
      scene.add(strip);
    }
  }

  // Hero sculpture: a luminous, slowly rotating torus knot above the skyline.
  const heroGroup = new THREE.Group();
  heroGroup.position.set(0, 2.1, -5);
  scene.add(heroGroup);
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.15, 0.28, 160, 18, 2, 3),
    new THREE.MeshStandardMaterial({ color: 0x9be9e6, metalness: 0.9, roughness: 0.16, emissive: 0x063d45, emissiveIntensity: 1.3 })
  );
  heroGroup.add(knot);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.018, 8, 120), neonMats[0]);
  ring.rotation.x = Math.PI / 2.6;
  heroGroup.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.012, 8, 120), neonMats[1]);
  ring2.rotation.x = Math.PI / 2.1;
  ring2.rotation.y = 0.4;
  heroGroup.add(ring2);

  // Star particles.
  const starCount = window.innerWidth < 700 ? 550 : 1100;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 100;
    starPositions[i * 3 + 1] = Math.random() * 35 - 2;
    starPositions[i * 3 + 2] = -Math.random() * 75 - 5;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x9deee9, size: 0.055, transparent: true, opacity: 0.75 }));
  scene.add(stars);

  // Minimal rain streaks.
  const rainCount = window.innerWidth < 700 ? 250 : 650;
  const rainPositions = new Float32Array(rainCount * 6);
  const rainSpeeds = [];
  for (let i = 0; i < rainCount; i++) {
    const x = (Math.random() - 0.5) * 55;
    const y = Math.random() * 30;
    const z = (Math.random() - 0.5) * 50 - 8;
    rainPositions[i * 6] = x;
    rainPositions[i * 6 + 1] = y;
    rainPositions[i * 6 + 2] = z;
    rainPositions[i * 6 + 3] = x - 0.07;
    rainPositions[i * 6 + 4] = y - 0.4;
    rainPositions[i * 6 + 5] = z;
    rainSpeeds.push(8 + Math.random() * 13);
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rain = new THREE.LineSegments(rainGeometry, new THREE.LineBasicMaterial({ color: 0x6fdedc, transparent: true, opacity: 0.24 }));
  scene.add(rain);

  window.addEventListener('pointermove', event => {
    targetX = (event.clientX / window.innerWidth - 0.5) * 1.2;
    targetY = (event.clientY / window.innerHeight - 0.5) * 0.55;
  }, { passive: true });

  let lastFrame = 0;
  const frameInterval = window.innerWidth < 700 ? 1000 / 30 : 1000 / 60;
  function animate(now = 0) {
    animationFrame = requestAnimationFrame(animate);
    if (document.hidden || now - lastFrame < frameInterval) return;
    lastFrame = now;
    const elapsed = clock.getElapsedTime();
    pointerX += (targetX - pointerX) * 0.025;
    pointerY += (targetY - pointerY) * 0.025;
    camera.position.x = pointerX * 1.2;
    camera.position.y = 5.5 - pointerY;
    camera.lookAt(pointerX * 0.4, 1.2, -9);
    heroGroup.rotation.y = elapsed * 0.18;
    heroGroup.rotation.x = Math.sin(elapsed * 0.32) * 0.12;
    heroGroup.position.y = 2.1 + Math.sin(elapsed * 0.7) * 0.18;
    ring.rotation.z = elapsed * 0.12;
    ring2.rotation.z = -elapsed * 0.09;
    buildings.forEach(item => {
      // Very subtle light-like vertical shimmer, without moving the geometry.
      item.mesh.material.emissive = new THREE.Color(0x030812);
      item.mesh.material.emissiveIntensity = 0.25 + (Math.sin(elapsed * 1.4 + item.phase) + 1) * 0.08;
    });
    const pos = rainGeometry.attributes.position.array;
    for (let i = 0; i < rainCount; i++) {
      const y = i * 6 + 1;
      pos[y] -= rainSpeeds[i] * 0.016;
      pos[y + 3] = pos[y] - 0.4;
      if (pos[y] < -3) {
        const newY = 18 + Math.random() * 12;
        pos[y] = newY;
        pos[y + 3] = newY - 0.4;
      }
    }
    rainGeometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.15 : 1.7));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !animationFrame) animate();
  });
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrame);
    renderer.dispose();
  });
})();
