(() => {
  const $ = (id) => document.getElementById(id);
  const dropZone = $("drop-zone");
  const fileInput = $("file-input");
  const preview = $("preview");
  const uploadSection = $("upload-section");
  const loading = $("loading");
  const errorBox = $("error");
  const results = $("results");
  const overallBar = $("overall");
  const overallLegend = $("overall-legend");
  const shelvesEl = $("shelves");
  const resetBtn = $("reset");

  const colorCache = new Map();

  const hashStr = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  };

  const colorFor = (brand) => {
    if (!colorCache.has(brand)) {
      colorCache.set(brand, `hsl(${hashStr(brand) % 360}, 55%, 55%)`);
    }
    return colorCache.get(brand);
  };

  const show = (el) => { el.hidden = false; };
  const hide = (el) => { el.hidden = true; };

  const clearChildren = (el) => {
    while (el.firstChild) el.removeChild(el.firstChild);
  };

  const sortByPctDesc = (arr) => [...arr].sort((a, b) => b.pct - a.pct);

  const buildStackBar = (container, brands) => {
    clearChildren(container);
    container.classList.add("stack-bar");
    sortByPctDesc(brands).forEach((b) => {
      const seg = document.createElement("span");
      seg.className = "seg";
      seg.style.width = b.pct + "%";
      seg.style.background = colorFor(b.brand);
      seg.title = `${b.brand} — ${b.pct}%`;
      container.appendChild(seg);
    });
  };

  const buildLegend = (container, brands) => {
    clearChildren(container);
    const ul = document.createElement("ul");
    sortByPctDesc(brands).forEach((b) => {
      const li = document.createElement("li");
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.background = colorFor(b.brand);
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = b.brand;
      const pct = document.createElement("span");
      pct.className = "pct";
      pct.textContent = `${b.pct}%`;
      li.append(swatch, name, pct);
      ul.appendChild(li);
    });
    container.appendChild(ul);
  };

  const renderShelves = (shelves) => {
    clearChildren(shelvesEl);
    shelves.forEach((s) => {
      const card = document.createElement("article");
      card.className = "shelf-card";

      const head = document.createElement("header");
      head.className = "shelf-head";
      const nameEl = document.createElement("span");
      nameEl.className = "shelf-name";
      nameEl.textContent = s.shelf;
      const metaEl = document.createElement("span");
      metaEl.className = "shelf-meta";
      metaEl.textContent = `~${s.total_width_px}px`;
      head.append(nameEl, metaEl);

      const bar = document.createElement("div");
      buildStackBar(bar, s.brands);

      const legend = document.createElement("div");
      legend.className = "legend";
      buildLegend(legend, s.brands);

      card.append(head, bar, legend);
      shelvesEl.appendChild(card);
    });
  };

  const renderResults = (data) => {
    buildStackBar(overallBar, data.overall);
    buildLegend(overallLegend, data.overall);
    renderShelves(data.shelves);
  };

  const showError = (msg) => {
    hide(loading);
    errorBox.textContent = msg;
    show(errorBox);
    show(uploadSection);
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      show(preview);
    };
    reader.readAsDataURL(file);

    hide(uploadSection);
    hide(errorBox);
    show(loading);

    const fd = new FormData();
    fd.append("image", file);

    fetch("/analyze", { method: "POST", body: fd })
      .then((r) => {
        if (!r.ok) return r.text().then((t) => Promise.reject(new Error(t || `HTTP ${r.status}`)));
        return r.json();
      })
      .then((data) => {
        hide(loading);
        renderResults(data);
        show(results);
      })
      .catch((err) => showError(err.message || "Upload failed"));
  };

  fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

  dropZone.addEventListener("click", () => fileInput.click());
  ["dragenter", "dragover"].forEach((ev) =>
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.add("is-dragging");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.remove("is-dragging");
    })
  );
  dropZone.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });

  resetBtn.addEventListener("click", () => {
    fileInput.value = "";
    preview.removeAttribute("src");
    hide(preview);
    hide(results);
    hide(errorBox);
    clearChildren(overallBar);
    clearChildren(overallLegend);
    clearChildren(shelvesEl);
    show(uploadSection);
  });
})();
