(function () {
  const NAV_ID = "pedagogy-section-nav";
  const STYLE_LINK_ID = "page-style";
  let mainObserver = null;
  let sectionObserver = null;

  function onPedagogyPage() {
    const styleLink = document.getElementById(STYLE_LINK_ID);
    return !!styleLink && /styles\/pedagogy\.css(?:$|\?)/.test(styleLink.href);
  }

  function ensureHeadingIds(headings) {
    const used = new Set();
    headings.forEach((heading, index) => {
      let id =
        heading.id ||
        heading.textContent
          .toLowerCase()
          .replace(/[^\w]+/g, "-")
          .replace(/^-+|-+$/g, "") ||
        `section-${index + 1}`;
      while (used.has(id)) id = `${id}-${index + 1}`;
      used.add(id);
      heading.id = id;
    });
  }

  function setActive(id) {
    const nav = document.getElementById(NAV_ID);
    if (!nav) return;
    nav.querySelectorAll("a").forEach((a) => {
      a.toggleAttribute("aria-current", a.getAttribute("href") === `#${id}`);
    });
  }

  function applyCollapsed(nav, collapsed) {
    nav.classList.toggle("collapsed", collapsed);
    const btn = nav.querySelector(".pedagogy-section-nav-toggle");
    if (btn) {
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      btn.setAttribute(
        "aria-label",
        collapsed ? "Expand navigation" : "Collapse navigation",
      );
      btn.textContent = collapsed ? "+" : "−";
    }
  }

  function teardownNav() {
    if (sectionObserver) {
      sectionObserver.disconnect();
      sectionObserver = null;
    }
    const existing = document.getElementById(NAV_ID);
    if (existing) existing.remove();
  }

  function buildNav() {
    if (!onPedagogyPage()) {
      teardownNav();
      return;
    }

    const main = document.querySelector("main");
    if (!main) return;

    const headings = Array.from(main.querySelectorAll("h1, h2"));
    if (headings.length < 2) {
      teardownNav();
      return;
    }

    ensureHeadingIds(headings);

    teardownNav();

    const nav = document.createElement("aside");
    nav.id = NAV_ID;
    nav.className = "pedagogy-section-nav";

    const header = document.createElement("div");
    header.className = "pedagogy-section-nav-header";

    const title = document.createElement("p");
    title.className = "pedagogy-section-nav-title";
    title.textContent = "Navigation";
    header.appendChild(title);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "pedagogy-section-nav-toggle";
    toggle.addEventListener("click", () => {
      const collapsed = !nav.classList.contains("collapsed");
      applyCollapsed(nav, collapsed);
    });
    header.appendChild(toggle);

    nav.appendChild(header);

    const list = document.createElement("ul");
    headings.forEach((heading) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${heading.id}`;
      a.textContent = heading.textContent.trim();
      a.addEventListener("click", (event) => {
        event.preventDefault();
        setActive(heading.id);
        heading.scrollIntoView();
        history.replaceState(null, "", `#${heading.id}`);
      });
      li.appendChild(a);
      list.appendChild(li);
    });
    nav.appendChild(list);
    document.body.appendChild(nav);

    applyCollapsed(nav, false);

    sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0] && visible[0].target && visible[0].target.id) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0, 1] },
    );

    headings.forEach((heading) => sectionObserver.observe(heading));
    setActive(headings[0].id);
  }

  // ---------- Plyr audio player ----------
  const PLYR_CSS = "https://cdn.plyr.io/3.7.8/plyr.css";
  const PLYR_JS = "https://cdn.plyr.io/3.7.8/plyr.polyfilled.js";

  function ensurePlyrCSS() {
    if (document.querySelector('link[data-plyr-css="1"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = PLYR_CSS;
    link.dataset.plyrCss = "1";
    document.head.appendChild(link);
  }

  async function setupAudioPlayers() {
    if (!onPedagogyPage()) return;
    const audios = document.querySelectorAll("audio.js-plyr");
    if (audios.length === 0) return;

    ensurePlyrCSS();

    if (typeof window.Plyr === "undefined") {
      try {
        await loadScript(PLYR_JS);
      } catch (e) {
        return;
      }
    }
    if (typeof window.Plyr === "undefined") return;

    audios.forEach((audio) => {
      if (audio.dataset.plyrInitialized === "1") return;
      audio.dataset.plyrInitialized = "1";
      new window.Plyr(audio, {
        controls: ["play", "progress", "current-time"],
        seekTime: 15,
        invertTime: false,
      });
    });
  }

  function startObservers() {
    const main = document.querySelector("main");
    if (!main) return;

    if (mainObserver) {
      mainObserver.disconnect();
    }

    mainObserver = new MutationObserver(() => {
      buildNav();
      setupAudioPlayers();
    });

    mainObserver.observe(main, { childList: true, subtree: true });
  }

  startObservers();
  buildNav();
  setupAudioPlayers();
})();
