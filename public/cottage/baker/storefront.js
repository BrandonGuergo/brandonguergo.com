// One maker's shelf, read-only, for a phone without Cottage.
//
// Reads exactly what a signed-out phone reads: `bakers` and `listings` through
// the publishable key, under "Public read of baker profiles" and "Anyone can
// read the board". A taken-down maker, a hidden post, a paused board and a
// clipped town all come back empty here because the database says so, not
// because this file checks. No ordering — that's the app.
(() => {
  "use strict";

  const SUPABASE = "https://kuyaqbgcewnkcnnlyufx.supabase.co";
  const KEY = "sb_publishable_OwPaJtYYnfoXFMnONj4luA_sVnZuQ7S";
  const PHOTOS = `${SUPABASE}/storage/v1/object/public/bake-photos/`;
  const SHELF_LIMIT = 50;
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const $ = (id) => document.getElementById(id);
  const article = document.querySelector(".storefront");
  const status = $("shelf-status");

  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });

  function photoURL(path) {
    return PHOTOS + path.split("/").map(encodeURIComponent).join("/");
  }

  async function read(table, query) {
    const response = await fetch(`${SUPABASE}/rest/v1/${table}?${query}`, {
      headers: { apikey: KEY, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`${table} ${response.status}`);
    return response.json();
  }

  // The three market columns arrived with the tag. A database that does not
  // have them yet still has to show the kitchen.
  async function readBaker(id) {
    const columns = "name,neighborhood,state,bio,photo_path,market_place,market_starts_at,market_ends_at";
    try {
      return await read("bakers", `select=${columns}&id=eq.${id}`);
    } catch {
      return read("bakers", `select=name,neighborhood,state,bio,photo_path&id=eq.${id}`);
    }
  }

  // The same rule as FarmersMarket.showing: still open, and both ends are
  // today in Florida. A half-written row is not a market.
  function marketWindow(maker) {
    const place = (maker.market_place || "").trim();
    const starts = maker.market_starts_at ? new Date(maker.market_starts_at) : null;
    const ends = maker.market_ends_at ? new Date(maker.market_ends_at) : null;
    if (!place || place.length > 80 || !starts || !ends) return null;
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) return null;
    const now = new Date();
    if (!(now < ends)) return null;
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    if (day.format(now) !== day.format(starts) || day.format(now) !== day.format(ends)) return null;
    const clock = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
    });
    return { place, hours: `${clock.format(starts)} – ${clock.format(ends)}` };
  }

  function showMarket(maker) {
    const today = marketWindow(maker);
    if (!today) return;
    $("maker-market-tag").hidden = false;
    $("maker-market-hours").textContent = today.hours;
    $("maker-market-place").textContent = today.place;
    const box = $("maker-market");
    box.hidden = false;
    box.setAttribute("aria-label", `Farmer's Market, ${today.hours}, ${today.place}`);
  }

  function finish(sentence) {
    status.textContent = sentence;
    article.setAttribute("aria-busy", "false");
  }

  // `ready_on` is a calendar day with no zone; read it as the local day.
  function readyLine(readyOn) {
    if (!readyOn) return null;
    const [y, m, d] = readyOn.split("-").map(Number);
    const ready = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return ready > today ? `Ready ${day.format(ready)}` : null;
  }

  function item(listing) {
    const li = document.createElement("li");
    li.className = "shelf-item";

    if (listing.photo_path) {
      const img = document.createElement("img");
      img.src = photoURL(listing.photo_path);
      img.alt = "";
      img.loading = "lazy";
      li.append(img);
    }

    const text = document.createElement("div");
    const name = document.createElement("p");
    name.className = "shelf-name";
    name.textContent = listing.recipe_name;
    const detail = document.createElement("p");
    detail.className = "shelf-detail";
    const soldOut = listing.sold_out_at || listing.quantity_available <= 0;
    detail.textContent = [
      price.format(Number(listing.price)),
      listing.category,
      readyLine(listing.ready_on),
      soldOut ? "Sold out" : null,
    ].filter(Boolean).join(" · ");
    text.append(name, detail);
    li.append(text);
    return li;
  }

  async function load() {
    // The shared link is /cottage/baker/<id>. GitHub Pages cannot rewrite
    // that path, so a phone without the app is sent to /cottage/baker/?id=<id>.
    const fromQuery = new URLSearchParams(location.search).get("id") || "";
    const parts = location.pathname.split("/").filter(Boolean);
    const at = parts.lastIndexOf("baker");
    const id = UUID.test(fromQuery) ? fromQuery : (at >= 0 ? parts[at + 1] || "" : "");
    if (!UUID.test(id)) {
      finish("This link doesn't point to a kitchen on Cottage.");
      return;
    }

    try {
      const [makers, shelf] = await Promise.all([
        readBaker(id),
        read("listings",
          "select=id,recipe_name,category,price,photo_path,quantity_available,sold_out_at,ready_on," +
          "baker_name,baker_neighborhood,baker_bio,baker_photo_path" +
          `&baker_id=eq.${id}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}` +
          `&order=posted_at.desc&limit=${SHELF_LIMIT}`),
      ]);

      // A post carries its maker's name, town, bio and photo, stamped off the
      // profile; a kitchen with no readable profile row still has a face.
      const post = shelf[0];
      const maker = makers[0] || (post && {
        name: post.baker_name,
        neighborhood: post.baker_neighborhood,
        state: null,
        bio: post.baker_bio,
        photo_path: post.baker_photo_path,
      });
      if (!maker) {
        finish("This kitchen isn't on Cottage right now.");
        return;
      }

      const name = maker.name.trim() || "A Florida home kitchen";
      $("maker-name").textContent = name;
      document.title = `${name} — Cottage`;
      if (maker.neighborhood.trim()) {
        $("maker-town").textContent =
          [maker.neighborhood.trim(), maker.state].filter(Boolean).join(", ");
        $("maker-town").hidden = false;
      }
      if (maker.bio.trim()) {
        $("maker-bio").textContent = maker.bio.trim();
        $("maker-bio").hidden = false;
      }
      showMarket(maker);
      if (maker.photo_path) {
        $("maker-photo").src = photoURL(maker.photo_path);
        $("maker-photo").hidden = false;
      }

      if (shelf.length === 0) {
        finish("Nothing on the shelf right now. Get Cottage to hear when something's posted.");
        return;
      }
      $("shelf").replaceChildren(...shelf.map(item));
      $("shelf").hidden = false;
      status.hidden = true;
      finish("");
    } catch {
      finish("Couldn't reach Cottage just now. Reload the page to try again.");
    }
  }

  load();
})();
