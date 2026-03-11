/* eslint-disable no-alert */
(() => {
  const STORAGE_KEYS = {
    menu: "restaurant.menu.v1",
    sales: "restaurant.sales.v1",
    settings: "restaurant.settings.v1",
  };

  const DEFAULT_SETTINGS = {
    upiId: "yourupi@bank",
    payeeName: "Deepak Restaurant",
    phoneNumber: "8248158746",
  };

  const rupees = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);

  const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`);

  const safeParse = (s, fallback) => {
    try {
      if (!s) return fallback;
      return JSON.parse(s);
    } catch {
      return fallback;
    }
  };

  const placeholderImage = (name) => {
    const text = encodeURIComponent(String(name || "").slice(0, 22));
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop stop-color="#6d7cff"/><stop offset="1" stop-color="#9b7bff"/></linearGradient></defs>` +
      `<rect width="100%" height="100%" fill="url(#g)"/>` +
      `<circle cx="120" cy="110" r="70" fill="rgba(255,255,255,.18)"/>` +
      `<circle cx="720" cy="360" r="140" fill="rgba(0,0,0,.10)"/>` +
      `<text x="50%" y="56%" text-anchor="middle" font-family="Segoe UI, Arial" font-size="54" font-weight="800" fill="rgba(255,255,255,.92)">${text}</text>` +
      `</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const defaultMenu = () => [
    { id: uid(), name: "Idly", price: 30, category: "Breakfast", imageUrl: placeholderImage("Idly"), active: true },
    { id: uid(), name: "Thosa", price: 50, category: "Breakfast", imageUrl: placeholderImage("Thosa"), active: true },
    { id: uid(), name: "Poori", price: 45, category: "Breakfast", imageUrl: placeholderImage("Poori"), active: true },
    { id: uid(), name: "Vadai", price: 15, category: "Snacks", imageUrl: placeholderImage("Vadai"), active: true },
    { id: uid(), name: "Tea", price: 15, category: "Drinks", imageUrl: placeholderImage("Tea"), active: true },
    { id: uid(), name: "Coffee", price: 20, category: "Drinks", imageUrl: placeholderImage("Coffee"), active: true },
    { id: uid(), name: "Juice", price: 35, category: "Drinks", imageUrl: placeholderImage("Juice"), active: true },
  ];

  const loadSettings = () => {
    const s = safeParse(localStorage.getItem(STORAGE_KEYS.settings), null);
    return { ...DEFAULT_SETTINGS, ...(s || {}) };
  };
  const saveSettings = (settings) => localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));

  const loadMenu = () => {
    const m = safeParse(localStorage.getItem(STORAGE_KEYS.menu), null);
    if (Array.isArray(m) && m.length) return m;
    const seeded = defaultMenu();
    localStorage.setItem(STORAGE_KEYS.menu, JSON.stringify(seeded));
    return seeded;
  };
  const saveMenu = (menu) => localStorage.setItem(STORAGE_KEYS.menu, JSON.stringify(menu));

  const loadSales = () => safeParse(localStorage.getItem(STORAGE_KEYS.sales), []);
  const saveSales = (sales) => localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales));

  let settings = loadSettings();
  let menu = loadMenu();
  let sales = loadSales();

  const cart = new Map(); // itemId -> qty

  const $ = (id) => document.getElementById(id);

  const els = {
    tabs: Array.from(document.querySelectorAll(".tab")),
    views: {
      pos: $("view-pos"),
      manage: $("view-manage"),
      report: $("view-report"),
    },
    menuGrid: $("menuGrid"),
    menuSearch: $("menuSearch"),
    cartList: $("cartList"),
    subtotalText: $("subtotalText"),
    totalText: $("totalText"),
    taxPct: $("taxPct"),
    clearCartBtn: $("clearCartBtn"),
    printBtn: $("printBtn"),
    completeSaleBtn: $("completeSaleBtn"),
    customerName: $("customerName"),
    tableNo: $("tableNo"),
    printMeta: $("printMeta"),

    payNowBtn: $("payNowBtn"),
    qrModal: $("qrModal"),
    closeQrBtn: $("closeQrBtn"),
    closeQrBtn2: $("closeQrBtn2"),
    qrAmount: $("qrAmount"),
    qrCode: $("qrCode"),
    copyUpiBtn: $("copyUpiBtn"),

    // manage
    resetMenuBtn: $("resetMenuBtn"),
    menuForm: $("menuForm"),
    menuId: $("menuId"),
    menuName: $("menuName"),
    menuPrice: $("menuPrice"),
    menuCategory: $("menuCategory"),
    menuImage: $("menuImage"),
    menuActive: $("menuActive"),
    cancelEditBtn: $("cancelEditBtn"),
    manageList: $("manageList"),
    manageSearch: $("manageSearch"),

    // report
    reportMonth: $("reportMonth"),
    reportSearch: $("reportSearch"),
    kpiOrders: $("kpiOrders"),
    kpiRevenue: $("kpiRevenue"),
    reportTable: $("reportTable"),
    exportJsonBtn: $("exportJsonBtn"),
    clearSalesBtn: $("clearSalesBtn"),
  };

  const activeMenu = () => menu.filter((m) => m.active !== false);
  const getItem = (id) => menu.find((m) => m.id === id);

  const cartItemsExpanded = () => {
    const items = [];
    for (const [id, qty] of cart.entries()) {
      const m = getItem(id);
      if (!m) continue;
      items.push({ ...m, qty });
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  };

  const computeTotals = () => {
    const items = cartItemsExpanded();
    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const taxPct = Math.max(0, Number(els.taxPct.value || 0));
    const taxAmount = (subtotal * taxPct) / 100;
    const total = subtotal + taxAmount;
    return { items, subtotal, taxPct, taxAmount, total };
  };

  const setTab = (tab) => {
    els.tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.tab === tab));
    Object.entries(els.views).forEach(([k, v]) => v.classList.toggle("is-active", k === tab));
  };

  const renderMenu = () => {
    const q = (els.menuSearch.value || "").trim().toLowerCase();
    const list = activeMenu().filter((m) => {
      if (!q) return true;
      return `${m.name} ${m.category || ""}`.toLowerCase().includes(q);
    });

    els.menuGrid.innerHTML = list
      .map((m) => {
        const img = m.imageUrl || placeholderImage(m.name);
        const cat = m.category ? `<span class="chip">${escapeHtml(m.category)}</span>` : `<span class="chip">Item</span>`;
        return `
          <button class="card" type="button" data-add="${m.id}" aria-label="Add ${escapeAttr(m.name)}">
            <img src="${escapeAttr(img)}" alt="${escapeAttr(m.name)}" loading="lazy" />
            <div class="card-body">
              <div class="card-title">
                <strong>${escapeHtml(m.name)}</strong>
                <span class="price">${rupees(m.price)}</span>
              </div>
              <div class="muted">${cat} <span class="muted">• click to add</span></div>
            </div>
          </button>
        `;
      })
      .join("");
  };

  const renderCart = () => {
    const { items, subtotal, total } = computeTotals();
    els.subtotalText.textContent = rupees(subtotal);
    els.totalText.textContent = rupees(total);

    if (!items.length) {
      els.cartList.innerHTML = `<div class="muted">Cart is empty. Click a menu item to add.</div>`;
      return;
    }

    els.cartList.innerHTML = items
      .map((it) => {
        const line = it.price * it.qty;
        return `
          <div class="cart-item">
            <div class="cart-left">
              <div class="cart-name">${escapeHtml(it.name)}</div>
              <div class="cart-sub">${escapeHtml(it.category || "Item")} • ${rupees(it.price)} each</div>
              <div class="qty" aria-label="Quantity controls">
                <button type="button" data-qty-dec="${it.id}" aria-label="Decrease ${escapeAttr(it.name)}">−</button>
                <div class="num">${it.qty}</div>
                <button type="button" data-qty-inc="${it.id}" aria-label="Increase ${escapeAttr(it.name)}">+</button>
              </div>
            </div>
            <div class="cart-right">
              <strong>${rupees(line)}</strong>
              <button type="button" class="btn remove" data-remove="${it.id}">Remove</button>
            </div>
          </div>
        `;
      })
      .join("");
  };

  const clearCart = () => {
    cart.clear();
    renderCart();
  };

  const addToCart = (id, delta = 1) => {
    const item = getItem(id);
    if (!item || item.active === false) return;
    const next = (cart.get(id) || 0) + delta;
    if (next <= 0) cart.delete(id);
    else cart.set(id, next);
    renderCart();
  };

  const escapeHtml = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  const escapeAttr = escapeHtml;

  // Manage menu
  const beginEdit = (id) => {
    const item = getItem(id);
    if (!item) return;
    els.menuId.value = item.id;
    els.menuName.value = item.name || "";
    els.menuPrice.value = String(item.price ?? "");
    els.menuCategory.value = item.category || "";
    els.menuImage.value = item.imageUrl && !item.imageUrl.startsWith("data:image/svg+xml") ? item.imageUrl : "";
    els.menuActive.value = String(item.active !== false);
    els.menuName.focus();
  };

  const clearForm = () => {
    els.menuId.value = "";
    els.menuName.value = "";
    els.menuPrice.value = "";
    els.menuCategory.value = "";
    els.menuImage.value = "";
    els.menuActive.value = "true";
  };

  const renderManage = () => {
    const q = (els.manageSearch.value || "").trim().toLowerCase();
    const list = menu
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((m) => {
        if (!q) return true;
        return `${m.name} ${m.category || ""}`.toLowerCase().includes(q);
      });

    els.manageList.innerHTML = list
      .map((m) => {
        const status = m.active === false ? `<span class="chip">Inactive</span>` : `<span class="chip">Active</span>`;
        return `
          <div class="manage-row">
            <div>
              <strong>${escapeHtml(m.name)}</strong>
              <div class="small">${escapeHtml(m.category || "Item")} • ${rupees(m.price)} • ${status}</div>
            </div>
            <div class="manage-actions">
              <button class="btn btn-ghost" type="button" data-edit="${m.id}">Edit</button>
              <button class="btn btn-ghost danger" type="button" data-del="${m.id}">Delete</button>
            </div>
          </div>
        `;
      })
      .join("");
  };

  // Sales report
  const monthKey = (d) => {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const renderReport = () => {
    const selectedMonth = els.reportMonth.value || monthKey(new Date());
    if (!els.reportMonth.value) els.reportMonth.value = selectedMonth;
    const q = (els.reportSearch.value || "").trim().toLowerCase();

    const filtered = sales
      .filter((o) => monthKey(o.dateISO) === selectedMonth)
      .filter((o) => {
        if (!q) return true;
        const itemsStr = (o.items || []).map((i) => `${i.name}x${i.qty}`).join(" ");
        return `${o.customerName || ""} ${o.tableNo || ""} ${itemsStr}`.toLowerCase().includes(q);
      })
      .slice()
      .sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""));

    els.kpiOrders.textContent = String(filtered.length);
    els.kpiRevenue.textContent = rupees(filtered.reduce((sum, o) => sum + (o.total || 0), 0));

    if (!filtered.length) {
      els.reportTable.innerHTML = `<div class="muted">No orders for this month yet.</div>`;
      return;
    }

    const rows = filtered
      .map((o) => {
        const dt = new Date(o.dateISO);
        const when = Number.isNaN(dt.getTime()) ? "" : dt.toLocaleString("en-IN");
        const items = (o.items || []).map((i) => `${escapeHtml(i.name)} × ${i.qty}`).join("<br/>");
        const who = [o.customerName, o.tableNo ? `Table ${o.tableNo}` : ""].filter(Boolean).join(" • ");
        return `
          <tr>
            <td>${escapeHtml(when)}</td>
            <td>${escapeHtml(who || "-")}</td>
            <td>${items || "-"}</td>
            <td><strong>${rupees(o.total || 0)}</strong><div class="small">Tax ${Number(o.taxPct || 0)}%</div></td>
          </tr>
        `;
      })
      .join("");

    els.reportTable.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  };

  // QR payment
  const buildUpiLink = ({ amount, note }) => {
    const pa = settings.upiId;
    const pn = settings.payeeName;
    const am = (Math.round((amount || 0) * 100) / 100).toFixed(2);
    const phone = settings.phoneNumber ? `Phone: ${settings.phoneNumber}` : "";
    const tn = (note || "Restaurant bill") + (phone ? ` • ${phone}` : "");
    const params = new URLSearchParams({
      pa,
      pn,
      am,
      cu: "INR",
      tn,
    });
    return `upi://pay?${params.toString()}`;
  };

  const openQr = async () => {
    const { total } = computeTotals();
    if (total <= 0) {
      alert("Cart is empty.");
      return;
    }
    if (!window.QRCode) {
      alert("QR library not loaded. Please check your internet connection (for the QR script) and try again.");
      return;
    }
    if (!settings.upiId || settings.upiId === DEFAULT_SETTINGS.upiId) {
      // Keep it simple: prompt once if not customized
      const next = prompt("Enter UPI ID to receive payment (e.g., yourname@bank):", settings.upiId);
      if (next && next.trim()) {
        settings = { ...settings, upiId: next.trim() };
        saveSettings(settings);
      }
    }

    const upi = buildUpiLink({ amount: total, note: "Restaurant bill" });
    els.qrAmount.textContent = rupees(total);
    els.qrCode.innerHTML = "";

    // qrcodejs attaches to window.QRCode
    // eslint-disable-next-line no-new
    new window.QRCode(els.qrCode, { text: upi, width: 220, height: 220 });

    els.copyUpiBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(upi);
        alert("UPI link copied.");
      } catch {
        alert(upi);
      }
    };

    els.qrModal.showModal();
  };

  const closeQr = () => {
    if (els.qrModal.open) els.qrModal.close();
  };

  const completeSale = () => {
    const { items, subtotal, taxPct, taxAmount, total } = computeTotals();
    if (!items.length) {
      alert("Cart is empty.");
      return;
    }

    const order = {
      id: uid(),
      dateISO: new Date().toISOString(),
      customerName: (els.customerName.value || "").trim(),
      tableNo: (els.tableNo.value || "").trim(),
      items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
      subtotal,
      taxPct,
      taxAmount,
      total,
    };

    sales = [order, ...sales];
    saveSales(sales);
    clearCart();
    renderReport();
    alert("Sale saved.");
  };

  const buildPrintMeta = () => {
    const { subtotal, taxPct, taxAmount, total } = computeTotals();
    const parts = [];
    const cname = (els.customerName.value || "").trim();
    const tno = (els.tableNo.value || "").trim();
    if (cname) parts.push(`Customer: ${escapeHtml(cname)}`);
    if (tno) parts.push(`Table: ${escapeHtml(tno)}`);
    parts.push(`Date: ${new Date().toLocaleString("en-IN")}`);
    parts.push(`Subtotal: ${rupees(subtotal)}`);
    parts.push(`Tax: ${taxPct}% (${rupees(taxAmount)})`);
    parts.push(`Total: ${rupees(total)}`);
    els.printMeta.innerHTML = parts.join(" • ");
  };

  // Events
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    const add = t.closest("[data-add]")?.getAttribute("data-add");
    if (add) addToCart(add, 1);

    const inc = t.getAttribute("data-qty-inc");
    if (inc) addToCart(inc, 1);

    const dec = t.getAttribute("data-qty-dec");
    if (dec) addToCart(dec, -1);

    const rem = t.getAttribute("data-remove");
    if (rem) {
      cart.delete(rem);
      renderCart();
    }

    const edit = t.getAttribute("data-edit");
    if (edit) beginEdit(edit);

    const del = t.getAttribute("data-del");
    if (del) {
      const item = getItem(del);
      if (!item) return;
      if (!confirm(`Delete "${item.name}"?`)) return;
      menu = menu.filter((m) => m.id !== del);
      saveMenu(menu);
      // Remove from cart if present
      cart.delete(del);
      renderMenu();
      renderCart();
      renderManage();
    }
  });

  els.tabs.forEach((b) =>
    b.addEventListener("click", () => {
      setTab(b.dataset.tab);
      // render on tab switch (cheap)
      renderMenu();
      renderCart();
      renderManage();
      renderReport();
    }),
  );

  els.menuSearch.addEventListener("input", renderMenu);
  els.manageSearch.addEventListener("input", renderManage);
  els.reportSearch.addEventListener("input", renderReport);
  els.reportMonth.addEventListener("change", renderReport);

  els.taxPct.addEventListener("input", renderCart);
  els.clearCartBtn.addEventListener("click", () => {
    if (cart.size && !confirm("Clear the cart?")) return;
    clearCart();
  });

  els.printBtn.addEventListener("click", () => {
    buildPrintMeta();
    window.print();
  });

  els.payNowBtn.addEventListener("click", openQr);
  els.closeQrBtn.addEventListener("click", closeQr);
  els.closeQrBtn2.addEventListener("click", closeQr);

  els.completeSaleBtn.addEventListener("click", completeSale);

  els.menuForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = (els.menuId.value || "").trim();
    const name = (els.menuName.value || "").trim();
    const price = Number(els.menuPrice.value || 0);
    const category = (els.menuCategory.value || "").trim();
    const imageUrlRaw = (els.menuImage.value || "").trim();
    const active = els.menuActive.value === "true";

    if (!name) return;
    if (!Number.isFinite(price) || price < 0) return;

    const imageUrl = imageUrlRaw ? imageUrlRaw : placeholderImage(name);

    if (id) {
      menu = menu.map((m) => (m.id === id ? { ...m, name, price, category, imageUrl, active } : m));
    } else {
      menu = [{ id: uid(), name, price, category, imageUrl, active }, ...menu];
    }
    saveMenu(menu);
    clearForm();
    renderMenu();
    renderManage();
  });

  els.cancelEditBtn.addEventListener("click", () => clearForm());

  els.resetMenuBtn.addEventListener("click", () => {
    if (!confirm("Reset menu to default? (This will overwrite your saved menu items)")) return;
    menu = defaultMenu();
    saveMenu(menu);
    clearForm();
    renderMenu();
    renderManage();
  });

  els.exportJsonBtn.addEventListener("click", () => {
    const data = {
      exportedAt: new Date().toISOString(),
      menu,
      sales,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `restaurant-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  els.clearSalesBtn.addEventListener("click", () => {
    if (!confirm("Clear ALL sales data?")) return;
    sales = [];
    saveSales(sales);
    renderReport();
  });

  // Init
  const init = () => {
    // Default report month = current month
    els.reportMonth.value = monthKey(new Date());
    renderMenu();
    renderCart();
    renderManage();
    renderReport();
  };

  // qrcodejs loads async from CDN; ensure it exists before using Pay now.
  const waitForQr = (tries = 0) => {
    if (window.QRCode) return;
    if (tries > 60) return; // ~3s
    setTimeout(() => waitForQr(tries + 1), 50);
  };

  waitForQr();
  init();
})();

