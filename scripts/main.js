// configure marked with syntax highlighting and mermaid support
const renderer = new marked.Renderer();
let p5Queue = [];

renderer.code = ({ text, lang }) => {
  if (lang === "mermaid") return `<div class="mermaid">${text}</div>`;
  if (lang === "p5.js") {
    const id = `p5-sketch-${p5Queue.length}`;
    p5Queue.push({ id, code: text });
    return `<div class="p5-sketch" id="${id}"></div>`;
  }
  const html =
    lang && hljs.getLanguage(lang)
      ? hljs.highlight(text, { language: lang, ignoreIllegals: true }).value
      : hljs.highlightAuto(text).value;
  return `<pre><code class="hljs">${html}</code></pre>`;
};
renderer.heading = ({ text, depth }) => {
  const id = text
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "");
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

marked.use({ renderer });

mermaid.initialize({ startOnLoad: false, theme: "neutral" });

// add a "copy" button to each code block
function addCopyButtons(container) {
  container.querySelectorAll("pre").forEach((pre) => {
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "copy";
    btn.onclick = () =>
      navigator.clipboard
        .writeText(pre.querySelector("code")?.innerText ?? pre.innerText)
        .then(() => {
          btn.textContent = "copied!";
          setTimeout(() => (btn.textContent = "copy"), 1500);
        });
    pre.appendChild(btn);
  });
}

// parse YAML-lite front matter (--- key: value --- blocks)
function parseFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return { data: {}, content: text };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    data[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return { data, content: text.slice(match[0].length) };
}

// mark the active nav link
function setNavActive(slug) {
  document.querySelectorAll("nav a").forEach((a) => {
    a.toggleAttribute("aria-current", a.getAttribute("href") === `#${slug}`);
  });
}

// inject or update a per-page <link> stylesheet
function applyPageCSS(href) {
  let link = document.getElementById("page-style");
  if (!link) {
    link = document.createElement("link");
    link.id = "page-style";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (href) {
    link.href = href;
    link.disabled = false;
  } else {
    link.disabled = true;
  }
}

// load content/{slug}.md into <main>
const main = document.querySelector("main");

async function loadPage(slug) {
  p5Queue = [];
  const res = await fetch(`content/${slug}.md`);
  if (!res.ok) {
    main.innerHTML = "<p>Page not found...or yet to be found.</p>";
    return;
  }

  const { data, content } = parseFrontMatter(await res.text());

  applyPageCSS(data.css || null);
  document.title = data.title
    ? `${data.title} — Critical AI Potluck`
    : "Critical AI Potluck";
  setNavActive(slug);

  const headerHtml = data.title ? `<h1>${data.title}</h1>` : "";
  const subHtml = [data.date, data.author].filter(Boolean).join(" · ");

  main.innerHTML =
    headerHtml + (subHtml ? `<p>${subHtml}</p>` : "") + marked.parse(content);
  addCopyButtons(main);
  await mermaid.run({ nodes: main.querySelectorAll(".mermaid") });
  p5Queue.forEach(({ id, code }) => new p5(new Function("p", code), id));
  window.scrollTo(0, 0);
}

function navigate(hash) {
  const el = hash && document.getElementById(hash);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  } else {
    loadPage(hash || "index");
  }
}

window.addEventListener("hashchange", () => navigate(location.hash.slice(1)));
navigate(location.hash.slice(1));
