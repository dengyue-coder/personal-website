/* ==========================================================================
   hsr.ct.ws — site interactions
   Vanilla ES2019+, no dependencies.
   ========================================================================== */
(function () {
  "use strict";

  /* 站点外链：以后把账号 / 仓库地址填到这里，全站 GitHub 入口（页脚、联系页、项目卡、顶栏）自动生效 */
  var GITHUB_URL = "https://github.com/your-username";

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ toast */
  var toastEl = null;
  var toastTimer = null;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2600);
  }

  /* ----------------------------------------------------------------- header */
  var header = $("[data-header]");
  var toTop = $("[data-to-top]");

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle("is-stuck", y > 24);
    if (toTop) toTop.classList.toggle("is-visible", y > 480);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  /* -------------------------------------------------------------- mobile nav */
  var nav = $("[data-nav]");
  var navToggle = $("[data-nav-toggle]");
  var scrim = $("[data-nav-scrim]");
  var navClose = $("[data-nav-close]");

  function setNav(open) {
    if (!nav) return;
    nav.classList.toggle("is-open", open);
    if (scrim) scrim.classList.toggle("is-open", open);
    document.body.classList.toggle("is-locked", open);
    if (navToggle) navToggle.setAttribute("aria-expanded", String(open));
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      setNav(!nav.classList.contains("is-open"));
    });
  }
  if (navClose) navClose.addEventListener("click", function () { setNav(false); });
  if (scrim) scrim.addEventListener("click", function () { setNav(false); });
  $$("[data-nav], [data-nav] a").forEach(function () {});
  if (nav) {
    $$("a", nav).forEach(function (a) {
      a.addEventListener("click", function () { setNav(false); });
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setNav(false);
  });

  /* --------------------------------------------------------------- reveal -- */
  var revealEls = $$("[data-reveal]");
  if (revealEls.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* -------------------------------------------------------------- count up -- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count") || "0");
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    if (prefersReduced) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    var start = performance.now();
    var dur = 1100;
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var counters = $$("[data-count]");
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
    } else {
      var cio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ------------------------------------------------------------- slider (topics) */
  var slider = $("[data-slider]");
  if (slider) {
    var track = $("[data-slider-track]", slider);
    var prev = $("[data-slider-prev]");
    var next = $("[data-slider-next]");
    var pos = 0;

    function visibleCount() {
      var v = getComputedStyle(slider).getPropertyValue("--slider-items");
      return parseInt(v, 10) || 1;
    }
    function maxPos() {
      var items = track.children.length;
      return Math.max(0, items - visibleCount());
    }
    function move() {
      pos = Math.max(0, Math.min(pos, maxPos()));
      var item = track.children[pos];
      var offset = item ? item.offsetLeft - track.children[0].offsetLeft : 0;
      track.style.transform = "translateX(-" + offset + "px)";
    }
    if (next) {
      next.addEventListener("click", function () {
        pos = pos >= maxPos() ? 0 : pos + 1;
        move();
      });
    }
    if (prev) {
      prev.addEventListener("click", function () {
        pos = pos <= 0 ? maxPos() : pos - 1;
        move();
      });
    }
    window.addEventListener("resize", move);
    window.addEventListener("load", move);
  }

  /* --------------------------------------------------------- blog list page -- */
  var listRoot = $("[data-post-list]");
  if (listRoot) {
    var cards = $$("[data-post]", listRoot);
    var filterBtns = $$("[data-filter]");
    var searchInput = $("[data-search]");
    var emptyState = $("[data-empty]");
    var pager = $("[data-pagination]");
    var perPage = parseInt(listRoot.getAttribute("data-per-page") || "6", 10);
    var state = { cat: "all", q: "", page: 1 };

    var params = new URLSearchParams(window.location.search);
    if (params.get("q")) state.q = params.get("q").trim();
    if (params.get("cat")) state.cat = params.get("cat");
    if (searchInput && state.q) searchInput.value = state.q;

    function match(card) {
      var cats = (card.getAttribute("data-cat") || "").split(" ");
      var hay = (card.getAttribute("data-search-text") || "").toLowerCase();
      var okCat = state.cat === "all" || cats.indexOf(state.cat) !== -1;
      var okQ = !state.q || hay.indexOf(state.q.toLowerCase()) !== -1;
      return okCat && okQ;
    }

    function render() {
      var hits = cards.filter(match);
      var pages = Math.max(1, Math.ceil(hits.length / perPage));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * perPage;

      cards.forEach(function (c) { c.style.display = "none"; });
      hits.slice(start, start + perPage).forEach(function (c) { c.style.display = ""; });

      if (emptyState) emptyState.classList.toggle("is-visible", hits.length === 0);

      if (pager) {
        pager.innerHTML = "";
        if (pages > 1) {
          var mk = function (label, page, disabled, active) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "page-btn" + (active ? " is-active" : "");
            b.innerHTML = label;
            if (disabled) b.disabled = true;
            b.addEventListener("click", function () {
              state.page = page;
              render();
              var top = listRoot.getBoundingClientRect().top + window.scrollY - 120;
              window.scrollTo({ top: top, behavior: prefersReduced ? "auto" : "smooth" });
            });
            pager.appendChild(b);
          };
          mk("&larr;", Math.max(1, state.page - 1), state.page === 1, false);
          for (var i = 1; i <= pages; i++) mk(String(i), i, false, i === state.page);
          mk("&rarr;", Math.min(pages, state.page + 1), state.page === pages, false);
        }
      }
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        state.cat = btn.getAttribute("data-filter");
        state.page = 1;
        render();
      });
    });
    filterBtns.forEach(function (b) {
      if (b.getAttribute("data-filter") === state.cat) {
        filterBtns.forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
      }
    });

    if (searchInput) {
      var t = null;
      searchInput.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () {
          state.q = searchInput.value.trim();
          state.page = 1;
          render();
        }, 160);
      });
    }

    /* 时间轴视图：按年份聚合，复用当前分类 / 搜索过滤 */
    var timelineBox = $("[data-timeline-view]");
    var viewBtns = $$("[data-view]");

    function renderTimeline() {
      if (!timelineBox) return;
      var hits = cards.filter(match);
      var byYear = {};
      hits.forEach(function (c) {
        var tm = $("time", c);
        var iso = tm ? tm.getAttribute("datetime") : "";
        var y = iso ? iso.slice(0, 4) : "其他";
        (byYear[y] = byYear[y] || []).push(c);
      });
      var years = Object.keys(byYear).sort().reverse();
      timelineBox.innerHTML = "";
      years.forEach(function (y) {
        var items = byYear[y];
        var group = document.createElement("div");
        group.className = "tl-year";
        var head = document.createElement("h3");
        head.className = "tl-year__title";
        head.innerHTML = y + "<em>" + items.length + " 篇</em>";
        var list = document.createElement("div");
        list.className = "tl-list";
        items.forEach(function (c) {
          var a = $("h3 a", c);
          var ex = $(".card-excerpt", c);
          var tm = $("time", c);
          var tags = $$(".card-tags span", c).map(function (s) {
            return "<span>" + s.textContent + "</span>";
          }).join("");
          var node = document.createElement("article");
          node.className = "tl-post";
          var meta = '<div class="card-meta">' +
            (tm ? '<time datetime="' + tm.getAttribute("datetime") + '">' + tm.textContent + "</time>" : "") +
            "</div>";
          node.innerHTML = meta +
            "<h3>" + (a ? '<a href="' + a.getAttribute("href") + '">' + a.textContent + "</a>" : "") + "</h3>" +
            (ex ? "<p>" + ex.textContent + "</p>" : "") +
            '<div class="card-tags">' + tags + "</div>";
          list.appendChild(node);
        });
        group.appendChild(head);
        group.appendChild(list);
        timelineBox.appendChild(group);
      });
    }

    function setView(v) {
      var timeline = v === "timeline";
      listRoot.classList.toggle("is-hidden", timeline);
      if (timelineBox) timelineBox.classList.toggle("is-active", timeline);
      if (pager) pager.style.display = timeline ? "none" : "";
      if (timeline) renderTimeline(); else render();
    }

    viewBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        viewBtns.forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        setView(b.getAttribute("data-view"));
      });
    });

    if (params.get("view") === "timeline") {
      var tlBtn = $('[data-view="timeline"]');
      if (tlBtn) {
        viewBtns.forEach(function (x) { x.classList.remove("is-active"); });
        tlBtn.classList.add("is-active");
      }
      setView("timeline");
    }

    render();
  }

  /* ------------------------------------------------------- reading progress -- */
  var progress = $("[data-progress]");
  var articleBody = $("[data-article-body]");
  if (progress && articleBody) {
    var updateProgress = function () {
      var rect = articleBody.getBoundingClientRect();
      var total = rect.height - window.innerHeight * 0.4;
      var done = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      progress.style.width = (total > 0 ? (done / total) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  /* ------------------------------------------------------------- TOC + spy -- */
  var tocRoot = $("[data-toc]");
  if (tocRoot && articleBody) {
    var heads = $$("h2, h3", articleBody);
    var list = $("[data-toc-list]", tocRoot);
    if (heads.length && list) {
      heads.forEach(function (h, i) {
        if (!h.id) h.id = "sec-" + (i + 1);
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.className = "toc-link" + (h.tagName === "H3" ? " toc-link--h3" : "");
        a.textContent = h.textContent.replace(/\s+/g, " ").trim();
        var li = document.createElement("li");
        li.appendChild(a);
        list.appendChild(li);
      });

      var links = $$(".toc-link", list);
      if ("IntersectionObserver" in window) {
        var spy = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) {
                links.forEach(function (l) {
                  l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id);
                });
              }
            });
          },
          { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
        );
        heads.forEach(function (h) { spy.observe(h); });
      }
    } else {
      tocRoot.style.display = "none";
    }
  }

  /* ------------------------------------------------------------- skill bars -- */
  var bars = $$(".bar i");
  if (bars.length) {
    var fill = function (el) {
      el.style.setProperty("--v", (el.getAttribute("data-value") || "0") + "%");
      el.classList.add("is-filled");
    };
    if (!("IntersectionObserver" in window) || prefersReduced) {
      bars.forEach(fill);
    } else {
      var bio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              fill(e.target);
              bio.unobserve(e.target);
            }
          });
        },
        { threshold: 0.35 }
      );
      bars.forEach(function (b) { bio.observe(b); });
    }
  }

  /* ------------------------------------------------------------------ share -- */
  var copyBtn = $("[data-copy-link]");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function () { toast("链接已复制"); },
          function () { toast(url); }
        );
      } else {
        toast(url);
      }
    });
  }

  /* ------------------------------------------------------------- contact form */
  var form = $("[data-contact-form]");
  if (form) {
    var status = $("[data-form-status]", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get("name") || "").toString().trim();
      var email = (data.get("email") || "").toString().trim();
      var msg = (data.get("message") || "").toString().trim();

      function fail(text) {
        if (status) {
          status.textContent = text;
          status.className = "form-status is-visible is-err";
        } else {
          toast(text);
        }
      }
      if (!name || !email || !msg) return fail("请把姓名、邮箱和留言都填完整。");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("邮箱格式看起来不对，检查一下。");

      var endpoint = form.getAttribute("action") || "contact.php";
      if (status) {
        status.textContent = "正在发送…";
        status.className = "form-status is-visible";
      }

      fetch(endpoint, { method: "POST", body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok) {
            form.reset();
            if (status) {
              status.textContent = res.message || "留言已送达，我会尽快回复。";
              status.className = "form-status is-visible is-ok";
            }
          } else {
            fail((res && res.message) || "发送没有成功，请直接用邮箱联系我。");
          }
        })
        .catch(function () {
          fail("留言通道尚未接通（上线 PHP + 数据库后自动生效）。现在可以直接发邮件到 3233721297@qq.com。");
        });
    });
  }

  /* -------------------------------------------------------------- newsletter */
  $$("[data-subscribe]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("input", f);
      var value = input ? input.value.trim() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        toast("请输入一个有效的邮箱地址");
        return;
      }
      input.value = "";
      toast("已记录这个邮箱，订阅功能上线后会通知你");
    });
  });

  /* ------------------------------------------------------------------ misc -- */
  $$("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* GitHub 入口：统一指向顶部 GITHUB_URL，后续只需改一处 */
  $$("[data-github]").forEach(function (a) {
    a.setAttribute("href", GITHUB_URL);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
  });

  var searchForms = $$("[data-search-form]");
  searchForms.forEach(function (f) {
    f.addEventListener("submit", function (e) {
      var input = $("input[name='q']", f);
      if (input && !input.value.trim()) {
        e.preventDefault();
        window.location.href = "blog.html";
      }
    });
  });

  /* ---------------------------------------------- ambient background -- */
  /* 动态背景层：网格 + 漂移光斑 + 浮动粒子；尊重 reduced-motion，页面隐藏时暂停 */
  (function ambientScene() {
    if (prefersReduced) return;

    var scene = document.createElement("div");
    scene.className = "bg-scene";
    scene.setAttribute("aria-hidden", "true");
    scene.innerHTML =
      '<div class="bg-grid"></div>' +
      '<div class="bg-orb bg-orb--1"></div>' +
      '<div class="bg-orb bg-orb--2"></div>' +
      '<div class="bg-orb bg-orb--3"></div>' +
      '<canvas class="bg-particles"></canvas>';
    document.body.insertBefore(scene, document.body.firstChild);

    var canvas = scene.querySelector(".bg-particles");
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [], raf = null, rto = null;
    var fine = window.matchMedia("(pointer: fine)").matches;

    function resize() {
      W = Math.floor(window.innerWidth * dpr);
      H = Math.floor(window.innerHeight * dpr);
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }

    function seed() {
      pts = [];
      var n = Math.max(10, Math.min(fine ? 34 : 16, Math.floor(window.innerWidth / 34)));
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: (Math.random() * 1.6 + 0.6) * dpr,
          vx: (Math.random() - 0.5) * 0.18 * dpr,
          vy: (Math.random() - 0.5) * 0.18 * dpr,
          o: Math.random() * 0.3 + 0.12
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(125, 211, 252," + p.o + ")";
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    function start() { if (raf === null) raf = requestAnimationFrame(frame); }
    function stop() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }

    resize();
    seed();
    start();

    window.addEventListener("resize", function () {
      clearTimeout(rto);
      rto = setTimeout(function () { resize(); seed(); }, 200);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
  })();

  /* ----------------------------------------------- card spotlight ---- */
  /* 卡片鼠标跟随光斑；主卡片在精尖设备上做轻微 3D 倾斜 */
  (function cardSpotlight() {
    if (prefersReduced) return;
    var fine = window.matchMedia("(pointer: fine)").matches;
    var sel = ".post-card, .project-card, .aside-card, .channel, .award, .info-item, .exp-card, .tag-tile, .stack-tile";

    $$(sel).forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        card.style.setProperty("--mx", x + "px");
        card.style.setProperty("--my", y + "px");
        if (fine && (card.classList.contains("post-card") || card.classList.contains("project-card"))) {
          var rx = ((y / r.height) - 0.5) * -4;
          var ry = ((x / r.width) - 0.5) * 4;
          card.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-3px)";
        }
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  })();

  /* -------------------------------------------------- cursor glow ---- */
  /* 全局鼠标微光（仅桌面精尖设备） */
  (function cursorGlow() {
    if (prefersReduced || !window.matchMedia("(pointer: fine)").matches) return;
    var glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2, x = tx, y = ty;
    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      glow.style.transform = "translate(" + (x - 200) + "px," + (y - 200) + "px)";
      requestAnimationFrame(loop);
    })();
  })();

  /* ------------------------------------------------------- theme toggle -- */
  /* 暗色 / 浅色双主题，本地持久化；首次跟随系统配色 */
  (function themeToggle() {
    var root = document.documentElement;
    var KEY = "hsr-theme";
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var theme = saved || "dark";
    root.setAttribute("data-theme", theme);

    var actions = $(".header-actions");
    if (!actions) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "切换明暗主题");
    btn.innerHTML =
      '<svg class="icon icon-moon" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"><path d="M160 136c0-30.62 4.51-61.61 16-88C99.57 81.27 48 159.32 48 248c0 119.29 96.71 216 216 216 88.68 0 166.73-51.57 200-128-26.39 11.49-57.38 16-88 16-119.29 0-216-96.71-216-216z"/></svg>' +
      '<svg class="icon icon-sun" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32"><path d="M256 48v48M256 416v48M403.08 108.92l-33.94 33.94M142.86 369.14l-33.94 33.94M464 256h-48M96 256H48M403.08 403.08l-33.94-33.94M142.86 142.86l-33.94-33.94"/><circle cx="256" cy="256" r="80"/></svg>';
    actions.insertBefore(btn, actions.firstChild);

    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
    });
  })();

  /* ------------------------------------------------------ typewriter ---- */
  /* 首屏 slogan 逐字打出；降低动效偏好下直接显示全文 */
  (function typewriter() {
    var el = $("[data-typewriter]");
    if (!el) return;
    var full = el.textContent.trim();
    if (prefersReduced || !full) { el.textContent = full; return; }
    el.textContent = "";
    var i = 0;
    (function step() {
      if (i <= full.length) {
        el.textContent = full.slice(0, i);
        i++;
        setTimeout(step, 42);
      }
    })();
  })();

  /* ---------------------------------------------------- project filter --- */
  /* 项目页按方向筛选 */
  (function projectFilter() {
    var bar = $("[data-proj-filter]");
    if (!bar) return;
    var cards = $$(".project-card");
    var btns = $$("[data-proj]", bar);
    function isMatch(card, f) {
      return f === "all" || card.getAttribute("data-badge") === f;
    }
    function render() {
      var active = bar.querySelector(".filter-btn.is-active");
      var f = active ? active.getAttribute("data-proj") : "all";
      cards.forEach(function (c) { c.style.display = isMatch(c, f) ? "" : "none"; });
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        render();
      });
    });
  })();
})();
