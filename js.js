"use strict";
// CONFIGURACIÓN: agrega tu número internacional, solo dígitos. Ejemplo México: 52 + 10 dígitos.
const WHATSAPP_NUMBER = "";
// 02. CATÁLOGO: modifica aquí nombres e imágenes. Conserva IDs únicos.
const products = [
  { id: "pay", name: "Pay de queso", image: "img/pay-queso-v2.jpg" },
  { id: "limon", name: "Pay de limón", image: "img/pay-limon.jpg" },
  { id: "tapioca", name: "Tapioca", image: "img/tapioca-vasos-altos.jpg" },
  { id: "brownie", name: "Brownie", image: "img/brownie.jpg" },
  {
    id: "zanahoria",
    name: "Pan de zanahoria",
    image: "img/pan-zanahoria-v2.jpg",
  },
];
// 03. RECUPERAR PEDIDO GUARDADO
let cart = {};
try {
  const saved = JSON.parse(localStorage.getItem("dulces-pedido") || "{}");
  if (saved && typeof saved === "object")
    products.forEach((p) => {
      const q = saved[p.id];
      if (Number.isInteger(q) && q > 0 && q <= 99) cart[p.id] = q;
    });
} catch {}
// 04. MENÚ MÓVIL
const menu = document.querySelector("#menu"),
  toggle = document.querySelector(".menu-toggle");
function closeMenu() {
  menu.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Abrir menú");
}
toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
});
menu
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", closeMenu));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".header")) closeMenu();
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 1100) closeMenu();
});
// 05. DIBUJAR PRODUCTOS Y AGREGAR AL PEDIDO
const grid = document.querySelector("#products");
products.forEach((p) => {
  const article = document.createElement("article");
  article.className = "product";
  article.innerHTML = `<div class="product-image"><img src="${p.image}" alt="${p.name}" loading="lazy"><div class="placeholder" hidden><span aria-hidden="true">♡</span><small>FOTOGRAFÍA DEL POSTRE</small></div></div><div class="product-content"><h3>${p.name}</h3><p>Consulta las presentaciones disponibles.</p><button type="button" class="button" data-add="${p.id}">Agregar a mi pedido</button></div>`;
  const img = article.querySelector("img");
  img.addEventListener("error", () => {
    img.remove();
    article.querySelector(".placeholder").hidden = false;
  });
  grid.append(article);
});
grid.addEventListener("click", (e) => {
  const b = e.target.closest("[data-add]");
  if (!b) return;
  const id = b.dataset.add;
  cart[id] = Math.min(99, (cart[id] || 0) + 1);
  renderCart();
  document.querySelector("#order-status").textContent =
    "Producto agregado. Revisa tu solicitud en “Cómo ordenar”.";
  b.textContent = "Agregado ✓";
  setTimeout(() => {
    b.textContent = "Agregar a mi pedido";
  }, 900);
});
// 06. MOSTRAR Y MODIFICAR CANTIDADES
function renderCart() {
  try {
    localStorage.setItem("dulces-pedido", JSON.stringify(cart));
  } catch {}
  const container = document.querySelector("#cart");
  container.replaceChildren();
  let count = 0;
  products.forEach((p) => {
    if (!cart[p.id]) return;
    count += cart[p.id];
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `<span>${p.name}</span><div class="cart-controls"><button type="button" data-id="${p.id}" data-change="-1" aria-label="Restar ${p.name}">−</button><span>${cart[p.id]}</span><button type="button" data-id="${p.id}" data-change="1" aria-label="Añadir ${p.name}">+</button><button type="button" data-id="${p.id}" data-change="remove" aria-label="Eliminar ${p.name}">×</button></div>`;
    container.append(row);
  });
  if (!count)
    container.innerHTML =
      '<p class="empty">Tu lista está vacía. Agrega postres del catálogo o describe tu pedido especial en las notas.</p>';
  document.querySelector("#count").textContent = `(${count})`;
  document.querySelector("#mobile-order-count").textContent = `(${count})`;
}
document.querySelector("#cart").addEventListener("click", (e) => {
  const b = e.target.closest("[data-change]");
  if (!b) return;
  const id = b.dataset.id;
  const change = b.dataset.change;
  if (change === "remove") delete cart[id];
  else {
    cart[id] = Math.min(99, (cart[id] || 0) + Number(change));
    if (cart[id] <= 0) delete cart[id];
  }
  renderCart();
});
// 07. FECHA Y ENVÍO POR WHATSAPP
const date = document.querySelector('[name="fecha"]');
const now = new Date();
date.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
document.querySelector("#order-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const status = document.querySelector("#order-status");
  const data = new FormData(e.currentTarget);
  const notes = String(data.get("notas")).trim();
  if (!Object.keys(cart).length && !notes) {
    status.textContent =
      "Agrega al menos un postre o describe tu pedido especial.";
    return;
  }
  if (!/^\d{10,15}$/.test(WHATSAPP_NUMBER)) {
    status.textContent =
      "Los pedidos por WhatsApp estarán disponibles cuando el negocio configure su número de contacto.";
    return;
  }
  const list = products
    .filter((p) => cart[p.id])
    .map((p) => `• ${p.name}: ${cart[p.id]}`)
    .join("\n");
  const message = `Hola, Dulces Tentaciones. Quiero consultar este pedido:\n\nNombre: ${String(data.get("nombre")).trim()}\nFecha deseada: ${data.get("fecha")}\n\n${list || "Pedido especial"}\n\nNotas: ${notes || "Sin notas"}\n\n¿Podrían confirmar disponibilidad y opciones de entrega o recolección?`;
  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer",
  );
  status.textContent =
    "Envía el mensaje desde WhatsApp para consultar y confirmar tu pedido.";
});
// 08. MARCAR LA SECCIÓN ACTIVA EN EL MENÚ
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          menu
            .querySelectorAll("a:not(.button)")
            .forEach((a) =>
              a.classList.toggle(
                "active",
                a.getAttribute("href") === `#${entry.target.id}`,
              ),
            );
        }
      });
    },
    { rootMargin: "-20% 0px -55% 0px" },
  );
  document
    .querySelectorAll("main>section[id]")
    .forEach((s) => observer.observe(s));
}
document.querySelector("#year").textContent = new Date().getFullYear();
renderCart();
