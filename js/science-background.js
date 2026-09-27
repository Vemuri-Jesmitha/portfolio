(() => {
  const canvas = document.getElementById("global-science-field");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const stars = [];
  const constellations = [];
  const shootingStars = [];
  let nextShootingStar = 0;
  let lastFrameTime = 0;

  const mouse = {
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5
  };

  const scrollState = {
    current: 0,
    target: 0
  };

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;

    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createScene();
  }

  function createScene() {
    stars.length = 0;
    constellations.length = 0;

    const starCount = Math.min(
      150,
      Math.max(70, Math.floor((width * height) / 11500))
    );

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.25 + 0.25,
        alpha: Math.random() * 0.45 + 0.12,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 5 + 1.5,
        depth: Math.random() * 0.8 + 0.2,
        drift: Math.random() * 1.2 - 0.6,
        scrollDepth: Math.random() * 0.35 + 0.12
      });
    }

    shootingStars.length = 0;
    nextShootingStar = performance.now() + 900 + Math.random() * 1400;

    /*
     * Constellation 1
     */
    addConstellation(
      [
        [0.69, 0.20],
        [0.74, 0.17],
        [0.79, 0.21],
        [0.84, 0.16],
        [0.88, 0.22],
        [0.82, 0.28],
        [0.75, 0.26]
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [2, 5],
        [5, 6],
        [6, 1]
      ]
    );

    /*
     * Constellation 2
     */
    addConstellation(
      [
        [0.08, 0.60],
        [0.13, 0.55],
        [0.19, 0.58],
        [0.23, 0.64],
        [0.18, 0.69],
        [0.12, 0.67]
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 0]
      ]
    );

    /*
     * Constellation 3
     */
    addConstellation(
      [
        [0.56, 0.76],
        [0.61, 0.71],
        [0.67, 0.73],
        [0.71, 0.80],
        [0.66, 0.85],
        [0.59, 0.83]
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 0],
        [1, 5]
      ]
    );
  }

  function spawnShootingStar() {
    const angle = 0.38 + Math.random() * 0.22;
    const speed = 700 + Math.random() * 450;

    shootingStars.push({
      x: Math.random() * width * 0.75 + width * 0.08,
      y: Math.random() * height * 0.42 + height * 0.06,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: 90 + Math.random() * 90,
      life: 0,
      maxLife: 0.7 + Math.random() * 0.35
    });
  }

  function updateShootingStars(dt) {
    if (performance.now() >= nextShootingStar && shootingStars.length < 2) {
      spawnShootingStar();
      nextShootingStar = performance.now() + 1400 + Math.random() * 2200;
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const star = shootingStars[i];

      star.x += star.vx * dt;
      star.y += star.vy * dt;
      star.life += dt;

      const progress = star.life / star.maxLife;
      const fade = progress < 0.15
        ? progress / 0.15
        : Math.max(0, 1 - (progress - 0.15) / 0.85);

      const distance = Math.hypot(star.vx, star.vy);
      const tailX = star.x - (star.vx / distance) * star.length;
      const tailY = star.y - (star.vy / distance) * star.length;

      const gradient = ctx.createLinearGradient(
        tailX,
        tailY,
        star.x,
        star.y
      );

      gradient.addColorStop(0, "rgba(180, 160, 255, 0)");
      gradient.addColorStop(0.65, `rgba(210, 200, 255, ${0.25 * fade})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, ${0.95 * fade})`);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(star.x, star.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(star.x, star.y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${fade})`;
      ctx.fill();

      if (
        star.life >= star.maxLife ||
        star.x > width + 220 ||
        star.y > height + 220
      ) {
        shootingStars.splice(i, 1);
      }
    }
  }

  function addConstellation(points, connections) {
    constellations.push({
      points: points.map(([x, y], index) => ({
        x,
        y,
        size: index % 3 === 0 ? 1.8 : 1.15,
        phase: Math.random() * Math.PI * 2
      })),
      connections
    });
  }

  function drawBackground(time) {
    const dt = lastFrameTime
      ? Math.min((time - lastFrameTime) / 1000, 0.05)
      : 0;

    lastFrameTime = time;

    ctx.clearRect(0, 0, width, height);

    mouse.x += (mouse.targetX - mouse.x) * 0.025;
    mouse.y += (mouse.targetY - mouse.y) * 0.025;

    const px = (mouse.x - 0.5) * 14;
    const py = (mouse.y - 0.5) * 10;

    scrollState.target = window.scrollY || window.pageYOffset || 0;
    scrollState.current +=
      (scrollState.target - scrollState.current) * 0.055;

    const scrollY = scrollState.current;

    /*
     * STAR FIELD
     */
    stars.forEach((star, index) => {
      if (!reducedMotion) {
        star.y += (star.speed * dt) / height;
        star.x += (star.drift * dt) / width;

        if (star.y > 1.01) star.y = -0.01;
        if (star.x > 1.01) star.x = -0.01;
        if (star.x < -0.01) star.x = 1.01;
      }

      let x = star.x * width + px * star.depth * 0.12;
      let y =
        star.y * height +
        py * star.depth * 0.12 -
        scrollY * star.scrollDepth;

      const wrapHeight = height + 180;
      y = ((y + 90) % wrapHeight + wrapHeight) % wrapHeight - 90;

      const pulse = reducedMotion
        ? 0
        : Math.sin(time * 0.0015 + star.phase) * 0.12;

      const alpha = Math.max(
        0.04,
        star.alpha + pulse
      );

      ctx.beginPath();
      ctx.arc(x, y, star.r, 0, Math.PI * 2);

      ctx.fillStyle = `rgba(225, 220, 255, ${alpha})`;
      ctx.fill();

      /*
       * OCCASIONAL STAR STREAK
       */
      if (
        !reducedMotion &&
        index % 47 === 0 &&
        Math.sin(time * 0.00018 + index) > 0.78
      ) {
        ctx.beginPath();

        ctx.moveTo(x, y);

        ctx.lineTo(
          x - 28 * star.depth,
          y + 11 * star.depth
        );

        ctx.strokeStyle = `rgba(180, 160, 255, ${
          alpha * 0.35
        })`;

        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });

    /*
     * CONSTELLATIONS
     */
    constellations.forEach((group, groupIndex) => {
      const groupParallax = 0.35 + groupIndex * 0.12;

      /*
       * Connecting lines
       */
      group.connections.forEach(([a, b]) => {
        const p1 = group.points[a];
        const p2 = group.points[b];

        const x1 =
          p1.x * width +
          px * groupParallax;

        const y1 =
          p1.y * height +
          py * groupParallax -
          scrollY * (0.08 + groupIndex * 0.035);

        const x2 =
          p2.x * width +
          px * groupParallax;

        const y2 =
          p2.y * height +
          py * groupParallax -
          scrollY * (0.08 + groupIndex * 0.035);

        ctx.beginPath();

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        ctx.strokeStyle =
          "rgba(139, 92, 246, 0.105)";

        ctx.lineWidth = 0.55;
        ctx.stroke();
      });

      /*
       * Star nodes
       */
      group.points.forEach((point, index) => {
        const x =
          point.x * width +
          px * groupParallax;

        const y =
          point.y * height +
          py * groupParallax -
          scrollY * (0.08 + groupIndex * 0.035);

        const pulse = reducedMotion
          ? 0
          : Math.sin(
              time * 0.0007 +
              point.phase +
              index
            ) * 0.22;

        const alpha = 0.42 + pulse;

        /*
         * Soft halo
         */
        const gradient = ctx.createRadialGradient(
          x,
          y,
          0,
          x,
          y,
          9
        );

        gradient.addColorStop(
          0,
          `rgba(139, 92, 246, ${Math.max(
            0.08,
            alpha * 0.18
          )})`
        );

        gradient.addColorStop(
          1,
          "rgba(139, 92, 246, 0)"
        );

        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);

        ctx.fillStyle = gradient;
        ctx.fill();

        /*
         * Star node
         */
        ctx.beginPath();

        ctx.arc(
          x,
          y,
          point.size,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          `rgba(220, 212, 255, ${Math.max(
            0.18,
            alpha
          )})`;

        ctx.fill();
      });
    });

    /*
     * SHOOTING STARS
     */
    if (!reducedMotion) {
      updateShootingStars(dt);
    }

    /*
     * SUBTLE ORBITAL GEOMETRY
     */
    const orbitalSets = [
      {
        x: width * 0.72 + px * 0.25,
        y: height * 0.43 + py * 0.25 - scrollY * 0.05,
        rx: width * 0.17,
        ry: height * 0.055,
        rotation: -0.18
      },
      {
        x: width * 0.34 + px * 0.18,
        y: height * 0.67 + py * 0.18 - scrollY * 0.035,
        rx: width * 0.13,
        ry: height * 0.04,
        rotation: 0.3
      }
    ];

    orbitalSets.forEach((orbit, index) => {
      ctx.save();

      ctx.translate(
        orbit.x,
        orbit.y
      );

      ctx.rotate(
        orbit.rotation
      );

      ctx.beginPath();

      ctx.ellipse(
        0,
        0,
        orbit.rx,
        orbit.ry,
        0,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        `rgba(139, 92, 246, ${
          index === 0 ? 0.045 : 0.028
        })`;

      ctx.lineWidth = 0.6;

      ctx.stroke();

      ctx.restore();
    });

    if (!reducedMotion) {
      requestAnimationFrame(drawBackground);
    }
  }

  /*
   * CURSOR PARALLAX
   */
  window.addEventListener(
    "mousemove",
    (event) => {
      mouse.targetX =
        event.clientX / width;

      mouse.targetY =
        event.clientY / height;
    },
    { passive: true }
  );

  /*
   * RESIZE
   */
  window.addEventListener(
    "resize",
    resize
  );

  /*
   * INITIALIZE
   */
  resize();

  if (reducedMotion) {
    drawBackground(0);
  } else {
    requestAnimationFrame(drawBackground);
  }
})();