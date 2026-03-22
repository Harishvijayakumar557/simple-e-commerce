(function () {
  const CART_KEY = "simple-shop-cart";

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function setCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
  }

  function cartItemCount(cart) {
    return Object.values(cart).reduce(function (n, q) {
      return n + q;
    }, 0);
  }

  function updateCartBadge() {
    var el = document.querySelector(".cart-count");
    if (!el) return;
    var n = cartItemCount(getCart());
    el.textContent = n > 0 ? String(n) : "";
    el.dataset.count = String(n);
  }

  function fetchProducts() {
    return fetch("/api/products").then(function (res) {
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    });
  }

  function formatPrice(n) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  }

  function addToCart(productId, qty) {
    qty = qty || 1;
    var cart = getCart();
    cart[productId] = (cart[productId] || 0) + qty;
    setCart(cart);
  }

  function setLineQty(productId, qty) {
    var cart = getCart();
    if (qty <= 0) delete cart[productId];
    else cart[productId] = qty;
    setCart(cart);
  }

  function removeLine(productId) {
    var cart = getCart();
    delete cart[productId];
    setCart(cart);
  }

  window.Shop = {
    getCart: getCart,
    setCart: setCart,
    cartItemCount: cartItemCount,
    updateCartBadge: updateCartBadge,
    fetchProducts: fetchProducts,
    formatPrice: formatPrice,
    addToCart: addToCart,
    setLineQty: setLineQty,
    removeLine: removeLine,
  };
})();
