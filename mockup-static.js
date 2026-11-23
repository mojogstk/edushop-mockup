/*
 * Interactions for the static GitHub Pages mockup only (not used by the app).
 * Plain browser JavaScript, loaded by every exported page:
 * - the presentation theme dialog (palette, crest, light/dark), matching the
 *   app's ThemeSwitcher and its sessionStorage key;
 * - shop filters and the compare form, sent to the pre-generated page for
 *   that exact selection (same URL scheme as scripts/export-static-mockup.mjs).
 */
(function () {
  var root = document.documentElement;
  var base = root.getAttribute("data-mockup-base") || "";
  var KEY = "edushop-theme";
  var DEFAULT_PRESET = "kestrel-valley";
  var LAPTOPS = ["macbook-neo", "macbook-air-15-m5", "macbook-pro-14-m5"];

  function read() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || "{}") || {};
    } catch {
      return {};
    }
  }
  function write(state) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode: the change still applies */
    }
  }
  function apply(state) {
    if (state.preset && state.preset !== DEFAULT_PRESET)
      root.setAttribute("data-preset", state.preset);
    else root.removeAttribute("data-preset");
    if (state.mode === "light" || state.mode === "dark") root.setAttribute("data-mode", state.mode);
    else root.removeAttribute("data-mode");
  }

  // ---- Theme dialog ----
  var opener = document.querySelector('button[aria-haspopup="dialog"]');
  var dialog = document.querySelector("dialog");
  if (opener && dialog) {
    var status = opener.parentElement && opener.parentElement.querySelector('[role="status"]');
    var sync = function () {
      var s = read();
      var preset = s.preset || DEFAULT_PRESET;
      var mode = s.mode || "system";
      dialog.querySelectorAll('input[name="preset"]').forEach(function (i) {
        i.checked = i.value === preset;
      });
      dialog.querySelectorAll('input[name="mode"]').forEach(function (i) {
        i.checked = i.value === mode;
      });
    };
    opener.addEventListener("click", function () {
      sync();
      dialog.showModal();
    });
    dialog.querySelectorAll("button").forEach(function (b) {
      if (b.textContent.indexOf("Close") !== -1) {
        b.addEventListener("click", function () {
          dialog.close();
        });
      }
    });
    dialog.addEventListener("close", function () {
      setTimeout(function () {
        opener.focus();
      }, 0);
    });
    dialog.addEventListener("change", function (e) {
      var t = e.target;
      if (!t || (t.name !== "preset" && t.name !== "mode")) return;
      var s = read();
      s[t.name] = t.value;
      write(s);
      apply(s);
      var label = t.closest("label");
      if (status && label) {
        status.textContent =
          (t.name === "preset" ? "Theme changed to " : "Appearance set to ") +
          label.textContent.trim();
      }
    });
  }

  // ---- Filter forms -> pre-generated pages ----
  function slug(query) {
    return query
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  }
  function target(appPath, query) {
    return base + appPath + (query ? "/q-" + slug(query) : "") + "/";
  }
  document.querySelectorAll("form[data-app-action]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var appPath = form.getAttribute("data-app-action");
      var data = new FormData(form);
      var parts = [];
      if (appPath === "/shop") {
        var type = data.get("type");
        var sort = data.get("sort");
        if (type && type !== "all") parts.push("type=" + type);
        if (sort && sort !== "featured") parts.push("sort=" + sort);
        if (data.get("stock") === "in") parts.push("stock=in");
      } else if (appPath === "/compare") {
        var items = data.getAll("items").map(String);
        var chosen = LAPTOPS.filter(function (s) {
          return items.indexOf(s) !== -1;
        });
        parts.push(chosen.length ? "items=" + chosen.join(",") : "submitted=1");
      }
      window.location.href = target(appPath, parts.join("&"));
    });
  });
})();
