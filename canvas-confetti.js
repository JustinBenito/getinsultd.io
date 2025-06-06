// canvas-confetti v1.6.0
// Source: https://github.com/catdad/canvas-confetti
!(function (t, e) {
  !(function t(e, n, a, i) {
    var o = !!(
      e.Worker &&
      e.Blob &&
      e.Promise &&
      e.OffscreenCanvas &&
      e.OffscreenCanvasRenderingContext2D &&
      e.HTMLCanvasElement &&
      e.HTMLCanvasElement.prototype.transferControlToOffscreen &&
      e.URL &&
      e.URL.createObjectURL
    );
    function r() {}
    function l(t) {
      var a = n.exports.Promise,
        i = void 0 !== a ? a : e.Promise;
      return "function" == typeof i ? new i(t) : (t(r, r), null);
    }
    var c,
      s,
      u,
      d,
      f,
      h,
      g,
      m,
      b =
        ((u = Math.floor(1e3 / 60)),
        (d = {}),
        (f = 0),
        "function" == typeof requestAnimationFrame &&
        "function" == typeof cancelAnimationFrame
          ? ((c = function (t) {
              var e = Math.random();
              return (
                (d[e] = requestAnimationFrame(function n(a) {
                  f === a || f + u - 1 < a
                    ? ((f = a), delete d[e], t())
                    : (d[e] = requestAnimationFrame(n));
                })),
                e
              );
            }),
            (s = function (t) {
              d[t] && cancelAnimationFrame(d[t]);
            }))
          : ((c = function (t) {
              return setTimeout(t, u);
            }),
            (s = function (t) {
              return clearTimeout(t);
            })),
        { frame: c, cancel: s }),
      M =
        ((m = {}),
        function () {
          if (h) return h;
          if (!a && o) {
            var e = [
              "var CONFETTI, SIZE = {}, module = {};",
              "(" + t.toString() + ")(this, module, true, SIZE);",
              "onmessage = function(msg) {",
              "  if (msg.data.options) {",
              "    CONFETTI(msg.data.options).then(function () {",
              "      if (msg.data.callback) {",
              "        postMessage({ callback: msg.data.callback });",
              "      }",
              "    });",
              "  } else if (msg.data.reset) {",
              "    CONFETTI.reset();",
              "  } else if (msg.data.resize) {",
              "    SIZE.width = msg.data.resize.width;",
              "    SIZE.height = msg.data.resize.height;",
              "  } else if (msg.data.canvas) {",
              "    SIZE.width = msg.data.canvas.width;",
              "    SIZE.height = msg.data.canvas.height;",
              "    CONFETTI = module.exports.create(msg.data.canvas);",
              "  }",
              "}",
            ].join("\n");
            try {
              h = new Worker(URL.createObjectURL(new Blob([e])));
            } catch (t) {
              return (
                void 0 !== typeof console &&
                  "function" == typeof console.warn &&
                  console.warn("🎊 Could not load worker", t),
                null
              );
            }
            !(function (t) {
              function e(e, n) {
                t.postMessage({ options: e || {}, callback: n });
              }
              (t.init = function (e) {
                var n = e.transferControlToOffscreen();
                t.postMessage({ canvas: n }, [n]);
              }),
                (t.fire = function (n, a, i) {
                  if (g) return e(n, null), g;
                  var o = Math.random().toString(36).slice(2);
                  return (g = l(function (a) {
                    function r(e) {
                      e.data.callback === o &&
                        (delete m[o],
                        t.removeEventListener("message", r),
                        (g = null),
                        i(),
                        a());
                    }
                    t.addEventListener("message", r),
                      e(n, o),
                      (m[o] = r.bind(null, { data: { callback: o } }));
                  }));
                }),
                (t.reset = function () {
                  for (var e in (t.postMessage({ reset: !0 }), m))
                    m[e](), delete m[e];
                });
            })(h);
          }
          return h;
        }),
      y = {
        particleCount: 50,
        angle: 90,
        spread: 45,
        startVelocity: 45,
        decay: 0.9,
        gravity: 1,
        drift: 0,
        ticks: 200,
        x: 0.5,
        y: 0.5,
        shapes: ["square", "circle", "star"],
        zIndex: 100,
        colors: [
          "#26ccff",
          "#a25afd",
          "#ff5e7e",
          "#88ff5a",
          "#fcff42",
          "#ffa62d",
          "#ff36ff",
        ],
        disableForReducedMotion: !1,
        scalar: 1,
      };
    function p(t, e, n) {
      return (function (t, e) {
        return e ? e(t) : t;
      })(t && null != t[e] ? t[e] : y[e], n);
    }
    function w(t) {
      return t < 0 ? 0 : Math.floor(t);
    }
    function x(t) {
      return parseInt(t, 16);
    }
    function C(t) {
      return t.map(v);
    }
    function v(t) {
      var e = String(t).replace(/[^0-9a-f]/gi, "");
      return (
        e.length < 6 && (e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2]),
        {
          r: x(e.substring(0, 2)),
          g: x(e.substring(2, 4)),
          b: x(e.substring(4, 6)),
        }
      );
    }
    function k(t) {
      (t.width = document.documentElement.clientWidth),
        (t.height = document.documentElement.clientHeight);
    }
    function I(t) {
      var e = t.getBoundingClientRect();
      (t.width = e.width), (t.height = e.height);
    }
    function T(t, e, n, o, r) {
      var c,
        s,
        u = e.slice(),
        d = t.getContext("2d"),
        f = l(function (e) {
          function l() {
            (c = s = null), d.clearRect(0, 0, o.width, o.height), r(), e();
          }
          function g() {
            a &&
              !(o.width === i.width && o.height === i.height) &&
              ((o.width = t.width = i.width), (o.height = t.height = i.height)),
              o.width ||
                o.height ||
                (n(t), (o.width = t.width), (o.height = t.height)),
              d.clearRect(0, 0, o.width, o.height),
              (u = u.filter(function (t) {
                return (function (t, e) {
                  (e.x += Math.cos(e.angle2D) * e.velocity + e.drift),
                    (e.y += Math.sin(e.angle2D) * e.velocity + e.gravity),
                    (e.wobble += e.wobbleSpeed),
                    (e.velocity *= e.decay),
                    (e.tiltAngle += 0.1),
                    (e.tiltSin = Math.sin(e.tiltAngle)),
                    (e.tiltCos = Math.cos(e.tiltAngle)),
                    (e.random = Math.random() + 5),
                    (e.wobbleX = e.x + 10 * e.scalar * Math.cos(e.wobble)),
                    (e.wobbleY = e.y + 10 * e.scalar * Math.sin(e.wobble));
                  var n = e.tick++ / e.totalTicks,
                    a = e.x + e.random * e.tiltCos,
                    i = e.y + e.random * e.tiltSin,
                    o = e.wobbleX + e.random * e.tiltCos,
                    r = e.wobbleY + e.random * e.tiltSin;
                  return (
                    (t.fillStyle =
                      "rgba(" +
                      e.color.r +
                      ", " +
                      e.color.g +
                      ", " +
                      e.color.b +
                      ", " +
                      (1 - n) +
                      ")"),
                    t.beginPath(),
                    "circle" === e.shape
                      ? t.ellipse
                        ? t.ellipse(
                            e.x,
                            e.y,
                            Math.abs(o - a) * e.ovalScalar,
                            Math.abs(r - i) * e.ovalScalar,
                            (Math.PI / 10) * e.wobble,
                            0,
                            2 * Math.PI
                          )
                        : (function (t, e, n, a, i, o, r, l, c) {
                            t.save(),
                              t.translate(e, n),
                              t.rotate(o),
                              t.scale(a, i),
                              t.arc(0, 0, 1, r, l, c),
                              t.restore();
                          })(
                            t,
                            e.x,
                            e.y,
                            Math.abs(o - a) * e.ovalScalar,
                            Math.abs(r - i) * e.ovalScalar,
                            (Math.PI / 10) * e.wobble,
                            0,
                            2 * Math.PI
                          )
                      : "star" === e.shape
                      ? (function (t, x, y, spikes, outerRadius, innerRadius) {
                          let rot = (Math.PI / 2) * 3;
                          let step = Math.PI / spikes;
                          t.beginPath();
                          t.moveTo(x, y - outerRadius);
                          for (let i = 0; i < spikes; i++) {
                            t.lineTo(
                              x + Math.cos(rot) * outerRadius,
                              y + Math.sin(rot) * outerRadius
                            );
                            rot += step;
                            t.lineTo(
                              x + Math.cos(rot) * innerRadius,
                              y + Math.sin(rot) * innerRadius
                            );
                            rot += step;
                          }
                          t.lineTo(x, y - outerRadius);
                          t.closePath();
                        })(
                          t,
                          e.x,
                          e.y,
                          5, // 5 spikes
                          e.scalar * 10, // outer radius
                          e.scalar * 4 // inner radius
                        )
                      : (t.moveTo(Math.floor(e.x), Math.floor(e.y)),
                        t.lineTo(Math.floor(e.wobbleX), Math.floor(i)),
                        t.lineTo(Math.floor(o), Math.floor(r)),
                        t.lineTo(Math.floor(a), Math.floor(e.wobbleY))),
                    t.closePath(),
                    t.fill(),
                    e.tick < e.totalTicks
                  );
                })(d, t);
              })).length
                ? (c = b.frame(g))
                : l();
          }
          (c = b.frame(g)), (s = l);
        });
      return {
        addFettis: function (t) {
          return (u = u.concat(t)), f;
        },
        canvas: t,
        promise: f,
        reset: function () {
          c && b.cancel(c), s && s();
        },
      };
    }
    function E(t, n) {
      var a,
        i = !t,
        r = !!p(n || {}, "resize"),
        c = p(n, "disableForReducedMotion", Boolean),
        s = o && !!p(n || {}, "useWorker") ? M() : null,
        u = i ? k : I,
        d = !(!t || !s) && !!t.__confetti_initialized,
        f =
          "function" == typeof matchMedia &&
          matchMedia("(prefers-reduced-motion)").matches;
      function h(e, n, i) {
        for (
          var o,
            r,
            l,
            c,
            s,
            d = p(e, "particleCount", w),
            f = p(e, "angle", Number),
            h = p(e, "spread", Number),
            g = p(e, "startVelocity", Number),
            m = p(e, "decay", Number),
            b = p(e, "gravity", Number),
            M = p(e, "drift", Number),
            y = p(e, "colors", C),
            x = p(e, "ticks", Number),
            v = p(e, "shapes"),
            k = p(e, "scalar"),
            I = (function (t) {
              var e = p(t, "origin", Object);
              return (e.x = p(e, "x", Number)), (e.y = p(e, "y", Number)), e;
            })(e),
            E = d,
            S = [],
            F = t.width * I.x,
            N = t.height * I.y;
          E--;

        )
          S.push(
            ((o = {
              x: F,
              y: N,
              angle: f,
              spread: h,
              startVelocity: g,
              color: y[E % y.length],
              shape:
                v[
                  ((c = 0),
                  (s = v.length),
                  Math.floor(Math.random() * (s - c)) + c)
                ],
              ticks: x,
              decay: m,
              gravity: b,
              drift: M,
              scalar: k,
            }),
            (r = void 0),
            (l = void 0),
            (r = o.angle * (Math.PI / 180)),
            (l = o.spread * (Math.PI / 180)),
            {
              x: o.x,
              y: o.y,
              wobble: 10 * Math.random(),
              wobbleSpeed: Math.min(0.11, 0.1 * Math.random() + 0.05),
              velocity: 0.5 * o.startVelocity + Math.random() * o.startVelocity,
              angle2D: -r + (0.5 * l - Math.random() * l),
              tiltAngle: (0.5 * Math.random() + 0.25) * Math.PI,
              color: o.color,
              shape: o.shape,
              tick: 0,
              totalTicks: o.ticks,
              decay: o.decay,
              drift: o.drift,
              random: Math.random() + 2,
              tiltSin: 0,
              tiltCos: 0,
              wobbleX: 0,
              wobbleY: 0,
              gravity: 3 * o.gravity,
              ovalScalar: 0.6,
              scalar: o.scalar,
            })
          );
        return a ? a.addFettis(S) : (a = T(t, S, u, n, i)).promise;
      }
      function g(n) {
        var o = c || p(n || {}, "disableForReducedMotion", Boolean),
          g = p(n, "zIndex", Number);
        if (o && f)
          return l(function (t) {
            t();
          });
        i && a
          ? (t = a.canvas)
          : i &&
            !t &&
            ((t = (function (t) {
              var e = document.createElement("canvas");
              return (
                (e.style.position = "fixed"),
                (e.style.top = "0px"),
                (e.style.left = "0px"),
                (e.style.pointerEvents = "none"),
                (e.style.zIndex = t),
                e
              );
            })(g)),
            document.body.appendChild(t)),
          r && !d && u(t);
        var m = { width: t.width, height: t.height };
        function b() {
          if (s) {
            var e = {
              getBoundingClientRect: function () {
                if (!i) return t.getBoundingClientRect();
              },
            };
            return (
              u(e),
              void s.postMessage({
                resize: { width: e.width, height: e.height },
              })
            );
          }
          m.width = m.height = null;
        }
        function M() {
          (a = null),
            r && e.removeEventListener("resize", b),
            i && t && (document.body.removeChild(t), (t = null), (d = !1));
        }
        return (
          s && !d && s.init(t),
          (d = !0),
          s && (t.__confetti_initialized = !0),
          r && e.addEventListener("resize", b, !1),
          s ? s.fire(n, m, M) : h(n, m, M)
        );
      }
      return (
        (g.reset = function () {
          s && s.reset(), a && a.reset();
        }),
        g
      );
    }
    (n.exports = E(null, { useWorker: !0, resize: !0 })),
      (n.exports.create = E);
  })(
    (function () {
      return void 0 !== t ? t : "undefined" != typeof self ? self : this || {};
    })(),
    e,
    !1
  ),
    (t.confetti = e.exports);
})(window, {});

// Our custom confetti functions
export function fireConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Particles from the top
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#ff0000", "#00ff00", "#0000ff"],
        gravity: 1.2,
      })
    );
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#ff0000", "#00ff00", "#0000ff"],
        gravity: 1.2,
      })
    );
  }, 250);
}

// More dramatic celebration
export function fireCelebrationConfetti() {
  const end = Date.now() + 3 * 1000;

  // Launch fireworks
  const colors = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
  ];

  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();

  // Add some bursts in the middle
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 },
      colors: colors,
      startVelocity: 30,
    });
  }, 1000);
}

// Star confetti effect
export function fireStarConfetti() {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = {
    startVelocity: 25,
    spread: 360,
    ticks: 50,
    zIndex: 9999,
    shapes: ["star"], // Using star shape
    colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4FB0FF", "#98FB98"], // Gold, orange, coral, light blue, light green
    scalar: 2, // Make stars a bit larger
  };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 35 * (timeLeft / duration);

    // Burst of stars from center
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.4, 0.6), y: randomInRange(0.4, 0.6) },
        gravity: 0.8, // Slightly lower gravity for more floaty effect
      })
    );
  }, 200);
}

// Fireworks effect for single click
export function fireFireworks() {
  const duration = 1500;
  const animationEnd = Date.now() + duration;

  // Vibrant firework colors
  const colors = [
    "#ff0000",
    "#ffd700",
    "#00ff00",
    "#0000ff",
    "#ff00ff",
    "#ffffff",
  ];

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  (function launchFirework() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) return;

    // Launch point - slightly randomized along bottom
    const startX = randomInRange(0.2, 0.8);
    const startY = 1;

    // Explosion point - randomized in upper half of screen
    const endX = randomInRange(0.1, 0.9);
    const endY = randomInRange(0.1, 0.5);

    // Launch particle
    confetti({
      startVelocity: 30,
      spread: 10,
      particleCount: 1,
      scalar: 2,
      ticks: 50,
      origin: { x: startX, y: startY },
      colors: ["#ffb62d"], // Golden trail
      gravity: 0.4,
    });

    // After a delay, create the explosion
    setTimeout(() => {
      // Create circular explosion
      for (let i = 0; i < 360; i += 12) {
        // 30 particles in circle
        const angle = i * (Math.PI / 180);
        confetti({
          particleCount: 1,
          startVelocity: 20,
          angle: i,
          spread: 0,
          origin: { x: endX, y: endY },
          colors: [colors[Math.floor(Math.random() * colors.length)]],
          ticks: 100,
          gravity: 0.6,
          scalar: 1.2,
          drift: Math.cos(angle) * 0.5,
        });
      }
    }, 500); // Explosion happens after 500ms

    if (timeLeft > 0) {
      requestAnimationFrame(launchFirework);
    }
  })();
}
