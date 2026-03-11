// Simple in-memory + localStorage store
const STORAGE_KEYS = {
  MEDICINES: "medicines",
  SALES: "sales", // { date: [ bills ] }
  THEME: "theme",
  DEMO_TABLETS: "demo_tablets_loaded_v1",
};

const LOW_STOCK_THRESHOLD = 10;
const EXPIRY_WARNING_DAYS = 30;

let medicines = [];
let currentBillItems = [];
let qr; // qrious instance
let lastGeneratedBillId = null;

function loadState() {
  const medsRaw = localStorage.getItem(STORAGE_KEYS.MEDICINES);
  const salesRaw = localStorage.getItem(STORAGE_KEYS.SALES);
  const theme = localStorage.getItem(STORAGE_KEYS.THEME);

  if (medsRaw) {
    try {
      medicines = JSON.parse(medsRaw);
    } catch {
      medicines = [];
    }
  } else {
    // Seed with some demo medicines
    medicines = [
      {
        id: crypto.randomUUID(),
        name: "Paracetamol 500mg",
        company: "MediLife Pvt Ltd",
        category: "Tablet",
        stock: 45,
        price: 18,
        expiry: getFutureDate(180),
        image: "",
      },
      {
        id: crypto.randomUUID(),
        name: "Cough Syrup DX",
        company: "GreenLeaf Pharma",
        category: "Syrup",
        stock: 8,
        price: 95,
        expiry: getFutureDate(25),
        image: "",
      },
      {
        id: crypto.randomUUID(),
        name: "Amoxicillin 250mg",
        company: "PureMeds",
        category: "Tablet",
        stock: 3,
        price: 22,
        expiry: getFutureDate(5),
        image: "",
      },
      {
        id: crypto.randomUUID(),
        name: "Pain Relief Gel",
        company: "HealFast",
        category: "Ointment",
        stock: 20,
        price: 120,
        expiry: getFutureDate(365),
        image: "",
      },
    ];
  }

  // Ensure we have a rich tablets list (first-time enhancement)
  ensureDemoTabletsLoaded();

  if (!salesRaw) {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify({}));
  }

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  }
}

function ensureDemoTabletsLoaded() {
  const alreadyLoaded = localStorage.getItem(STORAGE_KEYS.DEMO_TABLETS) === "1";
  if (alreadyLoaded) return;

  const demoTablets = [
    {
      name: "Cetirizine 10mg",
      company: "AllerFree",
      category: "Tablet",
      stock: 28,
      price: 12,
      expiry: getFutureDate(210),
      image:
        "https://images.pexels.com/photos/3683072/pexels-photo-3683072.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
    {
      name: "Ibuprofen 400mg",
      company: "PainCare",
      category: "Tablet",
      stock: 18,
      price: 26,
      expiry: getFutureDate(330),
      image:
        "https://images.pexels.com/photos/3683076/pexels-photo-3683076.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
    {
      name: "Vitamin C 500mg",
      company: "NutriPlus",
      category: "Tablet",
      stock: 60,
      price: 85,
      expiry: getFutureDate(480),
      image:
        "https://images.pexels.com/photos/3683082/pexels-photo-3683082.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
    {
      name: "Metformin 500mg",
      company: "GlucoWell",
      category: "Tablet",
      stock: 22,
      price: 38,
      expiry: getFutureDate(150),
      image:
        "https://images.pexels.com/photos/3683093/pexels-photo-3683093.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
    {
      name: "Pantoprazole 40mg",
      company: "GutGuard",
      category: "Tablet",
      stock: 14,
      price: 72,
      expiry: getFutureDate(90),
      image:
        "https://images.pexels.com/photos/3683089/pexels-photo-3683089.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
    {
      name: "Amlodipine 5mg",
      company: "CardioCare",
      category: "Tablet",
      stock: 12,
      price: 44,
      expiry: getFutureDate(260),
      image:
        "https://images.pexels.com/photos/3683090/pexels-photo-3683090.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
    {
      name: "Azithromycin 500mg",
      company: "PureMeds",
      category: "Tablet",
      stock: 9,
      price: 110,
      expiry: getFutureDate(45),
      image:
        "https://images.pexels.com/photos/3683084/pexels-photo-3683084.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
    {
      name: "Losartan 50mg",
      company: "BPShield",
      category: "Tablet",
      stock: 16,
      price: 58,
      expiry: getFutureDate(310),
      image:
        "https://images.pexels.com/photos/3683085/pexels-photo-3683085.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
    {
      name: "Levocetirizine 5mg",
      company: "AllerFree",
      category: "Tablet",
      stock: 7,
      price: 18,
      expiry: getFutureDate(35),
      image:
        "https://images.pexels.com/photos/3683088/pexels-photo-3683088.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
    {
      name: "Atorvastatin 10mg",
      company: "LipiCare",
      category: "Tablet",
      stock: 11,
      price: 68,
      expiry: getFutureDate(140),
      image:
        "https://images.pexels.com/photos/3683091/pexels-photo-3683091.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
    {
      name: "Montelukast 10mg",
      company: "BreatheWell",
      category: "Tablet",
      stock: 24,
      price: 98,
      expiry: getFutureDate(220),
      image:
        "https://images.pexels.com/photos/3683087/pexels-photo-3683087.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
    {
      name: "ORS Electrolyte Tablets",
      company: "HydraFix",
      category: "Tablet",
      stock: 34,
      price: 40,
      expiry: getFutureDate(365),
      image:
        "https://images.pexels.com/photos/3683078/pexels-photo-3683078.jpeg?auto=compress&cs=tinysrgb&w=300",
    },
  ];

  const existingKeys = new Set(
    medicines.map((m) => `${m.name}`.trim().toLowerCase())
  );
  const toAdd = demoTablets.filter(
    (m) => !existingKeys.has(m.name.trim().toLowerCase())
  );

  if (toAdd.length) {
    medicines.push(
      ...toAdd.map((m) => ({
        id: crypto.randomUUID(),
        ...m,
      }))
    );
    saveMedicines();
  }

  localStorage.setItem(STORAGE_KEYS.DEMO_TABLETS, "1");
}

function saveMedicines() {
  localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
}

function getSales() {
  const raw = localStorage.getItem(STORAGE_KEYS.SALES);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveSales(sales) {
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
}

function getAllBillsSorted() {
  const sales = getSales();
  const all = [];
  Object.keys(sales).forEach((date) => {
    (sales[date] || []).forEach((bill) => all.push(bill));
  });
  all.sort((a, b) => {
    const aKey = `${a.date}T${a.time}:00`;
    const bKey = `${b.date}T${b.time}:00`;
    return aKey < bKey ? 1 : aKey > bKey ? -1 : 0;
  });
  return all;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printBill(bill) {
  if (!bill) return;
  const shopName = "Deepak Medical Shop";
  const phone = "8248158746";

  const rows = bill.items
    .map(
      (it) => `
        <tr>
          <td>${escapeHtml(it.name)}</td>
          <td style="text-align:right">${it.quantity}</td>
          <td style="text-align:right">${it.price.toFixed(2)}</td>
          <td style="text-align:right">${(it.price * it.quantity).toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bill - ${shopName}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 18px; color: #111827; }
      .wrap { max-width: 720px; margin: 0 auto; }
      .title { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; }
      h1 { margin: 0; font-size: 20px; }
      .meta { font-size: 12px; color:#6b7280; }
      .box { border:1px solid #e5e7eb; border-radius: 12px; padding: 12px; margin-top: 12px; }
      table { width:100%; border-collapse: collapse; margin-top: 10px; }
      th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
      th { text-align:left; color:#6b7280; font-weight: 600; font-size: 12px; }
      .sum { margin-top: 12px; display:flex; justify-content:flex-end; }
      .sum table { width: 280px; }
      .sum td { border: none; padding: 6px 8px; }
      .total { font-weight:700; font-size: 14px; }
      @media print { button { display:none; } body { padding: 0; } .box { border:none; } }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="title">
        <div>
          <h1>${shopName}</h1>
          <div class="meta">Phone: ${phone} • UPI: deepakmedical@upi</div>
        </div>
        <div class="meta" style="text-align:right">
          <div><strong>Bill ID:</strong> ${escapeHtml(bill.id)}</div>
          <div><strong>Date:</strong> ${escapeHtml(bill.date)} ${escapeHtml(bill.time)}</div>
          <div><strong>Customer:</strong> ${escapeHtml(bill.customer)}</div>
        </div>
      </div>

      <div class="box">
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th style="text-align:right">Qty</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="sum">
          <table>
            <tr><td style="text-align:left;color:#6b7280">Subtotal</td><td style="text-align:right">${bill.subtotal.toFixed(2)}</td></tr>
            <tr><td style="text-align:left;color:#6b7280">GST (5%)</td><td style="text-align:right">${bill.tax.toFixed(2)}</td></tr>
            <tr class="total"><td style="text-align:left">Grand Total</td><td style="text-align:right">${bill.total.toFixed(2)}</td></tr>
          </table>
        </div>
      </div>

      <div class="meta" style="margin-top:10px">Thank you for visiting ${shopName}.</div>
      <button onclick="window.print()" style="margin-top:12px;padding:10px 14px;border-radius:10px;border:1px solid #e5e7eb;background:#111827;color:#fff;cursor:pointer">Print</button>
    </div>
  </body>
  </html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup blocked. Please allow popups to print the bill.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
}

function renderLastBills() {
  const tbody = document.querySelector("#lastBillsTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const bills = getAllBillsSorted().slice(0, 7);

  bills.forEach((b) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.date}</td>
      <td>${b.time}</td>
      <td>${b.customer}</td>
      <td>${b.items.length}</td>
      <td>${b.total.toFixed(2)}</td>
      <td style="text-align:right"></td>
    `;
    const actionTd = tr.lastElementChild;
    const viewBtn = document.createElement("button");
    viewBtn.className = "btn ghost";
    viewBtn.type = "button";
    viewBtn.innerHTML = '<i class="fa-solid fa-receipt"></i> View/Print';
    viewBtn.addEventListener("click", () => printBill(b));
    actionTd.appendChild(viewBtn);
    tbody.appendChild(tr);
  });

  if (!bills.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" style="color:#6b7280">No bills yet.</td>`;
    tbody.appendChild(tr);
  }
}

function getTodayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function formatCurrency(value) {
  return `₹${value.toFixed(2)}`;
}

function initNavigation() {
  const navButtons = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".page-section");
  const titleEl = document.getElementById("pageTitle");

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;

      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      sections.forEach((section) => {
        section.classList.toggle("active", section.id === target);
      });

      titleEl.textContent = btn.textContent.trim();
    });
  });
}

function initThemeToggle() {
  const btn = document.getElementById("themeToggle");
  const icon = btn.querySelector("i");
  const span = btn.querySelector("span");

  function updateLabel() {
    const isDark = document.documentElement.classList.contains("dark");
    icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    span.textContent = isDark ? "Light mode" : "Dark mode";
  }

  btn.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? "dark" : "light");
    updateLabel();
  });

  updateLabel();
}

function renderDate() {
  const el = document.getElementById("currentDate");
  const now = new Date();
  const options = { weekday: "short", year: "numeric", month: "short", day: "numeric" };
  el.textContent = now.toLocaleDateString(undefined, options);
}

function renderMedicinesTable() {
  const tbody = document.querySelector("#medicinesTable tbody");
  const search = document.getElementById("medicineSearch").value.toLowerCase();
  const categoryFilter = document.getElementById("categoryFilter").value;

  tbody.innerHTML = "";

  const filtered = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search) ||
      m.company.toLowerCase().includes(search) ||
      m.category.toLowerCase().includes(search);
    const matchesCategory = !categoryFilter || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  filtered.forEach((m) => {
    const tr = document.createElement("tr");

    const imgTd = document.createElement("td");
    const img = document.createElement("img");
    img.className = "medicine-img";
    img.src =
      m.image ||
      "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=300";
    img.alt = m.name;
    imgTd.appendChild(img);
    tr.appendChild(imgTd);

    tr.innerHTML += `
      <td>${m.name}</td>
      <td>${m.company}</td>
      <td>${m.category}</td>
      <td>${m.stock}</td>
      <td>${m.price.toFixed(2)}</td>
      <td>${m.expiry}</td>
    `;

    const statusTd = document.createElement("td");
    const pill = document.createElement("span");
    pill.classList.add("pill");

    const isExpired = new Date(m.expiry) < new Date();
    const daysToExpiry = (new Date(m.expiry) - new Date()) / (1000 * 60 * 60 * 24);

    if (isExpired) {
      pill.classList.add("expired");
      pill.textContent = "Expired";
    } else if (m.stock <= 0) {
      pill.classList.add("expired");
      pill.textContent = "Out of stock";
    } else if (m.stock <= LOW_STOCK_THRESHOLD) {
      pill.classList.add("low");
      pill.textContent = "Low stock";
    } else if (daysToExpiry <= EXPIRY_WARNING_DAYS) {
      pill.classList.add("low");
      pill.textContent = "Near expiry";
    } else {
      pill.classList.add("ok");
      pill.textContent = "Healthy";
    }
    statusTd.appendChild(pill);
    tr.appendChild(statusTd);

    const actionsTd = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
    editBtn.title = "Edit";
    editBtn.addEventListener("click", () => openMedicineModal(m));

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    delBtn.title = "Delete";
    delBtn.addEventListener("click", () => deleteMedicine(m.id));

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);
    tr.appendChild(actionsTd);

    tbody.appendChild(tr);
  });

  renderBillingMedicineOptions();
  renderDashboard();
  renderReports();
}

function renderBillingMedicineOptions() {
  const select = document.getElementById("billMedicine");
  select.innerHTML = "";

  medicines.forEach((m) => {
    if (m.stock > 0 && new Date(m.expiry) >= new Date()) {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `${m.name} (${m.stock} in stock)`;
      select.appendChild(opt);
    }
  });
}

function openMedicineModal(medicine) {
  const modal = document.getElementById("medicineModal");
  const title = document.getElementById("medicineModalTitle");
  const form = document.getElementById("medicineForm");

  if (medicine) {
    title.textContent = "Edit Medicine";
    form.medicineId.value = medicine.id;
    form.medicineName.value = medicine.name;
    form.companyName.value = medicine.company;
    form.medicineCategory.value = medicine.category;
    form.stockQuantity.value = medicine.stock;
    form.medicinePrice.value = medicine.price;
    form.expiryDate.value = medicine.expiry;
    form.medicineImage.value = medicine.image || "";
  } else {
    title.textContent = "Add Medicine";
    form.reset();
    form.medicineId.value = "";
    form.expiryDate.value = "";
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeMedicineModal() {
  const modal = document.getElementById("medicineModal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function deleteMedicine(id) {
  if (!confirm("Delete this medicine? This cannot be undone.")) return;
  medicines = medicines.filter((m) => m.id !== id);
  saveMedicines();
  renderMedicinesTable();
  pushTimeline(`Medicine deleted`, "The item has been removed from inventory.");
}

function initMedicineForm() {
  const btnAdd = document.getElementById("btnAddMedicine");
  const modalClose = document.getElementById("medicineModalClose");
  const modalCancel = document.getElementById("medicineModalCancel");
  const backdrop = document.querySelector("#medicineModal .modal-backdrop");
  const form = document.getElementById("medicineForm");

  btnAdd.addEventListener("click", () => openMedicineModal(null));
  modalClose.addEventListener("click", closeMedicineModal);
  modalCancel.addEventListener("click", closeMedicineModal);
  backdrop.addEventListener("click", closeMedicineModal);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = form.medicineId.value || crypto.randomUUID();
    const existingIndex = medicines.findIndex((m) => m.id === id);

    const medicine = {
      id,
      name: form.medicineName.value.trim(),
      company: form.companyName.value.trim(),
      category: form.medicineCategory.value,
      stock: Number(form.stockQuantity.value),
      price: Number(form.medicinePrice.value),
      expiry: form.expiryDate.value,
      image: form.medicineImage.value.trim(),
    };

    if (!medicine.name || !medicine.company || !medicine.expiry) {
      alert("Please fill all required fields.");
      return;
    }

    if (existingIndex >= 0) {
      medicines[existingIndex] = medicine;
      pushTimeline("Medicine updated", `${medicine.name} details were updated.`);
    } else {
      medicines.push(medicine);
      pushTimeline("Medicine added", `${medicine.name} was added to inventory.`);
    }

    saveMedicines();
    renderMedicinesTable();
    closeMedicineModal();
  });
}

function initMedicineFilters() {
  document.getElementById("medicineSearch").addEventListener("input", renderMedicinesTable);
  document.getElementById("categoryFilter").addEventListener("change", renderMedicinesTable);

  const btnAll = document.getElementById("btnAllMeds");
  const btnTabs = document.getElementById("btnTabletsOnly");
  const category = document.getElementById("categoryFilter");

  function setActiveChip(which) {
    btnAll.classList.toggle("active", which === "all");
    btnTabs.classList.toggle("active", which === "tablet");
  }

  btnAll.addEventListener("click", () => {
    category.value = "";
    setActiveChip("all");
    renderMedicinesTable();
  });

  btnTabs.addEventListener("click", () => {
    category.value = "Tablet";
    setActiveChip("tablet");
    renderMedicinesTable();
  });

  category.addEventListener("change", () => {
    setActiveChip(category.value === "Tablet" ? "tablet" : "all");
  });
}

function renderBillTable() {
  const tbody = document.querySelector("#billTable tbody");
  tbody.innerHTML = "";

  let subtotal = 0;

  currentBillItems.forEach((item, index) => {
    const rowTotal = item.price * item.quantity;
    subtotal += rowTotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.price.toFixed(2)}</td>
      <td>${rowTotal.toFixed(2)}</td>
      <td style="text-align:right"></td>
    `;

    const actionsTd = tr.lastElementChild;
    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    delBtn.title = "Remove";
    delBtn.addEventListener("click", () => {
      currentBillItems.splice(index, 1);
      renderBillTable();
      updateQRAmount();
    });
    actionsTd.appendChild(delBtn);

    tbody.appendChild(tr);
  });

  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  document.getElementById("billSubtotal").textContent = formatCurrency(subtotal);
  document.getElementById("billTax").textContent = formatCurrency(tax);
  document.getElementById("billTotal").textContent = formatCurrency(total);

  updateQRAmount(total);
}

function initBilling() {
  const btnAddToBill = document.getElementById("btnAddToBill");
  const btnClearBill = document.getElementById("btnClearBill");
  const btnProceedPayment = document.getElementById("btnProceedPayment");

  btnAddToBill.addEventListener("click", () => {
    const select = document.getElementById("billMedicine");
    const qtyInput = document.getElementById("billQuantity");
    const medId = select.value;
    const qty = Number(qtyInput.value);

    const medicine = medicines.find((m) => m.id === medId);
    if (!medicine) {
      alert("Please select a medicine in stock.");
      return;
    }

    if (qty <= 0) {
      alert("Quantity must be at least 1.");
      return;
    }

    if (qty > medicine.stock) {
      alert(`Only ${medicine.stock} units available in stock.`);
      return;
    }

    const existing = currentBillItems.find((i) => i.id === medId);
    if (existing) {
      if (existing.quantity + qty > medicine.stock) {
        alert(`Cannot exceed stock of ${medicine.stock}.`);
        return;
      }
      existing.quantity += qty;
    } else {
      currentBillItems.push({
        id: medicine.id,
        name: medicine.name,
        price: medicine.price,
        quantity: qty,
      });
    }

    renderBillTable();
  });

  btnClearBill.addEventListener("click", () => {
    if (!currentBillItems.length) return;
    if (!confirm("Clear current bill?")) return;
    currentBillItems = [];
    renderBillTable();
  });

  btnProceedPayment.addEventListener("click", () => {
    if (!currentBillItems.length) {
      alert("Add at least one item to the bill.");
      return;
    }
    // Jump to QR tab
    document.querySelector('.nav-item[data-target="qr"]').click();
    const status = document.getElementById("paymentStatus");
    status.textContent = "Awaiting payment...";
    status.className = "payment-status pending";
  });
}

function initQR() {
  const canvasContainer = document.getElementById("qrcode");
  qr = new QRious({
    element: document.createElement("canvas"),
    size: 140,
    value: "Deepak Medical Shop",
  });
  canvasContainer.innerHTML = "";
  canvasContainer.appendChild(qr.element);

  document.getElementById("btnSimulateScan").addEventListener("click", () => {
    const totalText = document.getElementById("billTotal").textContent;
    if (totalText === "₹0.00") {
      alert("No active bill to pay.");
      return;
    }
    const status = document.getElementById("paymentStatus");
    status.textContent = "Processing payment...";
    status.className = "payment-status pending";

    setTimeout(() => {
      status.textContent = "Payment Successful ✔ Bill generated.";
      status.className = "payment-status success";
      finalizeBill();
    }, 1200);
  });
}

function updateQRAmount(total) {
  const amount = total ?? 0;
  document.getElementById("qrAmount").textContent = formatCurrency(amount);
  const payload = `upi://pay?pa=deepakmedical@upi&pn=Deepak Medical Shop&am=${amount.toFixed(
    2
  )}&cu=INR&tn=Pharmacy%20Bill`;
  if (qr) qr.value = payload;
}

function finalizeBill() {
  const subtotal = parseFloat(
    document
      .getElementById("billSubtotal")
      .textContent.replace(/[₹,]/g, "") || "0"
  );
  const tax = parseFloat(
    document
      .getElementById("billTax")
      .textContent.replace(/[₹,]/g, "") || "0"
  );
  const total = parseFloat(
    document
      .getElementById("billTotal")
      .textContent.replace(/[₹,]/g, "") || "0"
  );

  if (!currentBillItems.length || total === 0) return;

  // Update stock
  currentBillItems.forEach((item) => {
    const med = medicines.find((m) => m.id === item.id);
    if (med) {
      med.stock -= item.quantity;
      if (med.stock < 0) med.stock = 0;
    }
  });
  saveMedicines();

  // Save sale
  const sales = getSales();
  const todayKey = getTodayKey();
  const now = new Date();
  const bill = {
    id: crypto.randomUUID(),
    date: todayKey,
    time: now.toTimeString().slice(0, 5),
    customer: document.getElementById("billCustomer").value.trim() || "Walk-in",
    items: structuredClone(currentBillItems),
    subtotal,
    tax,
    total,
  };

  sales[todayKey] = sales[todayKey] || [];
  sales[todayKey].push(bill);
  saveSales(sales);
  lastGeneratedBillId = bill.id;

  pushTimeline("Bill generated", `${bill.items.length} items billed for ${formatCurrency(total)}.`);

  // Clear current bill
  currentBillItems = [];
  renderBillTable();
  renderMedicinesTable();
  renderReports();
  renderLastBills();
}

function renderDashboard() {
  document.getElementById("statTotalMedicines").textContent = medicines.length;
  const sales = getSales();
  const todayKey = getTodayKey();
  const todaysBills = sales[todayKey] || [];
  const todayTotal = todaysBills.reduce((sum, b) => sum + b.total, 0);
  document.getElementById("statTodaySales").textContent = formatCurrency(todayTotal);
  document.getElementById("statTodayBills").textContent = `${todaysBills.length} bills`;

  const lowStock = medicines.filter((m) => m.stock <= LOW_STOCK_THRESHOLD).length;
  const nearExpiry = medicines.filter((m) => {
    const d = new Date(m.expiry);
    const diff = (d - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= EXPIRY_WARNING_DAYS;
  }).length;
  document.getElementById("statLowStock").textContent = lowStock;
  document.getElementById("statNearExpiry").textContent = nearExpiry;

  renderAlerts();
}

function pushTimeline(title, meta) {
  const list = document.getElementById("activityTimeline");
  const when = new Date().toTimeString().slice(0, 5);
  const li = document.createElement("li");
  li.className = "timeline-item";
  li.innerHTML = `
    <div class="timeline-icon">
      <i class="fa-solid fa-circle"></i>
    </div>
    <div class="timeline-content">
      <p class="timeline-title">${title}</p>
      <p class="timeline-meta">${meta} • ${when}</p>
    </div>
  `;
  list.prepend(li);

  // Keep only recent 5
  while (list.children.length > 5) {
    list.removeChild(list.lastChild);
  }
}

function renderAlerts() {
  const container = document.getElementById("alertContainer");
  container.innerHTML = "";

  const lowStockItems = medicines.filter((m) => m.stock <= LOW_STOCK_THRESHOLD);
  const expiryItems = medicines.filter((m) => {
    const d = new Date(m.expiry);
    const diff = (d - new Date()) / (1000 * 60 * 60 * 24);
    return diff < 0 || diff <= EXPIRY_WARNING_DAYS;
  });

  lowStockItems.forEach((m) => {
    const div = document.createElement("div");
    div.className = "alert-chip low-stock";
    div.innerHTML = `<i class="fa-solid fa-box-open"></i> ${m.name} is low on stock (${m.stock} left).`;
    container.appendChild(div);
  });

  expiryItems.forEach((m) => {
    const diff = Math.round(
      (new Date(m.expiry) - new Date()) / (1000 * 60 * 60 * 24)
    );
    const label =
      diff < 0 ? "expired" : `expiring in ${diff} day(s)`;
    const div = document.createElement("div");
    div.className = "alert-chip expiry";
    div.innerHTML = `<i class="fa-solid fa-skull-crossbones"></i> ${m.name} is ${label}.`;
    container.appendChild(div);
  });

  if (!container.children.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No critical alerts. You're all set!";
    container.appendChild(p);
  }
}

function renderReports() {
  const reportDateInput = document.getElementById("reportDate");
  const stockTbody = document.querySelector("#reportStockTable tbody");

  // Daily Sales
  const selectedDate = reportDateInput.value || getTodayKey();
  if (!reportDateInput.value) reportDateInput.value = selectedDate;

  const sales = getSales();
  const bills = sales[selectedDate] || [];
  document.getElementById("reportBillCount").textContent = bills.length;
  const totalSales = bills.reduce((sum, b) => sum + b.total, 0);
  document.getElementById("reportTotalSales").textContent = formatCurrency(totalSales);

  const salesTbody = document.querySelector("#reportSalesTable tbody");
  salesTbody.innerHTML = "";
  bills.forEach((b) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.time}</td>
      <td>${b.customer}</td>
      <td>${b.items.length}</td>
      <td>${b.total.toFixed(2)}</td>
    `;
    salesTbody.appendChild(tr);
  });

  // Stock report
  stockTbody.innerHTML = "";
  medicines.forEach((m) => {
    const tr = document.createElement("tr");
    const statusPill = document.createElement("span");
    statusPill.classList.add("pill");
    if (m.stock <= 0) {
      statusPill.classList.add("expired");
      statusPill.textContent = "Out of stock";
    } else if (m.stock <= LOW_STOCK_THRESHOLD) {
      statusPill.classList.add("low");
      statusPill.textContent = "Low";
    } else {
      statusPill.classList.add("ok");
      statusPill.textContent = "OK";
    }

    tr.innerHTML = `
      <td>${m.name}</td>
      <td>${m.category}</td>
      <td>${m.stock}</td>
      <td></td>
    `;
    tr.lastElementChild.appendChild(statusPill);
    stockTbody.appendChild(tr);
  });
}

function initReports() {
  document.getElementById("reportDate").addEventListener("change", renderReports);
}

window.addEventListener("DOMContentLoaded", () => {
  loadState();
  initNavigation();
  initThemeToggle();
  renderDate();
  initMedicineForm();
  initMedicineFilters();
  initBilling();
  initQR();
  initReports();
  renderMedicinesTable();
  renderBillTable();
  renderDashboard();
  renderLastBills();

  const btnPrintLatest = document.getElementById("btnPrintLatestBill");
  if (btnPrintLatest) {
    btnPrintLatest.addEventListener("click", () => {
      const bills = getAllBillsSorted();
      const latest = lastGeneratedBillId
        ? bills.find((b) => b.id === lastGeneratedBillId) || bills[0]
        : bills[0];
      if (!latest) {
        alert("No bills to print yet.");
        return;
      }
      printBill(latest);
    });
  }

  // Initial timeline items
  pushTimeline("System ready", "Deepak Medical Shop dashboard initialized.");
  pushTimeline("Inventory loaded", `${medicines.length} medicines in stock.`);
});

