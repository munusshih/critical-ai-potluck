(function () {
  const STYLE_LINK_ID = "page-style";
  let mainObserver = null;

  function onPedagogyPage() {
    const styleLink = document.getElementById(STYLE_LINK_ID);
    return !!styleLink && /styles\/pedagogy\.css(?:$|\?)/.test(styleLink.href);
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
      setupAudioPlayers();
    });

    mainObserver.observe(main, { childList: true, subtree: true });
  }

  startObservers();
  setupAudioPlayers();
})();
