import { apiClient } from "@/lib/api/apiClient";

const GUEST_CART_STORAGE_KEY = "bg_guest_cart";

// Load guest cart from localStorage safely
export function getInitialGuestCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to parse guest cart from localStorage:", err);
    return [];
  }
}

// Save guest cart to localStorage
export function saveGuestCart(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save guest cart to localStorage:", err);
  }
}

// Clear guest cart from localStorage
export function clearGuestCartStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear guest cart storage:", err);
  }
}

export const initialCartState = {
  items: [],
  loading: false,
  isSyncing: false,
  error: null,
};

export const cartSliceActions = {
  SET_CART: "cart/setCart",
  ADD_GUEST_ITEM: "cart/addGuestItem",
  UPDATE_GUEST_QTY: "cart/updateGuestQty",
  REMOVE_GUEST_ITEM: "cart/removeGuestItem",
  CLEAR_CART_LOCAL: "cart/clearCartLocal",
  SET_LOADING: "cart/setLoading",
  SET_SYNCING: "cart/setSyncing",
  SET_ERROR: "cart/setError",
};

export function cartReducer(state = initialCartState, action) {
  switch (action.type) {
    case cartSliceActions.SET_CART:
      return {
        ...state,
        items: action.payload,
        loading: false,
        isSyncing: false,
        error: null,
      };

    case cartSliceActions.ADD_GUEST_ITEM: {
      const { product, variantId, variantLabel, quantity } = action.payload;
      const copy = [...state.items];

      const existingIndex = copy.findIndex(
        (item) =>
          item.product._id === product._id &&
          (variantId ? item.variantId === variantId : !item.variantId)
      );

      if (existingIndex > -1) {
        const combined = copy[existingIndex].quantity + quantity;
        copy[existingIndex].quantity = Math.min(combined, product.stock || 99);
      } else {
        copy.push({
          _id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          product,
          variantId: variantId || null,
          variantLabel: variantLabel || "",
          quantity: Math.min(quantity, product.stock || 99),
          addedAt: new Date().toISOString(),
        });
      }

      saveGuestCart(copy);
      return { ...state, items: copy };
    }

    case cartSliceActions.UPDATE_GUEST_QTY: {
      const { itemId, quantity } = action.payload;
      let copy = [...state.items];

      if (quantity <= 0) {
        copy = copy.filter((item) => item._id !== itemId);
      } else {
        copy = copy.map((item) => {
          if (item._id === itemId) {
            const maxStock = item.product?.stock || 99;
            return { ...item, quantity: Math.min(quantity, maxStock) };
          }
          return item;
        });
      }

      saveGuestCart(copy);
      return { ...state, items: copy };
    }

    case cartSliceActions.REMOVE_GUEST_ITEM: {
      const copy = state.items.filter((item) => item._id !== action.payload);
      saveGuestCart(copy);
      return { ...state, items: copy };
    }

    case cartSliceActions.CLEAR_CART_LOCAL: {
      clearGuestCartStorage();
      return { ...state, items: [] };
    }

    case cartSliceActions.SET_LOADING:
      return { ...state, loading: action.payload };

    case cartSliceActions.SET_SYNCING:
      return { ...state, isSyncing: action.payload };

    case cartSliceActions.SET_ERROR:
      return { ...state, error: action.payload, loading: false, isSyncing: false };

    default:
      return state;
  }
}

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartSyncing = (state) => state.cart.isSyncing;

export const selectCartTotalCount = (state) =>
  state.cart.items.reduce((total, item) => total + (item.quantity || 0), 0);

export const getItemEffectivePrice = (item) => {
  if (!item) return 0;
  const product = item.product || {};

  // Check variant price first if item has a variantId
  if (item.variantId && Array.isArray(product.variants) && product.variants.length > 0) {
    const variant = product.variants.find(
      (v) =>
        (v._id && v._id.toString() === item.variantId.toString()) ||
        (v.id && v.id.toString() === item.variantId.toString())
    );
    if (variant) {
      const vPrice = Number(variant.price) || 0;
      const vDisc = Number(variant.discountPrice) || 0;
      return vDisc > 0 && vDisc < vPrice ? vDisc : vPrice;
    }
  }

  // Base product price
  const pPrice = Number(product.price) || 0;
  const pDisc = Number(product.discountPrice) || 0;
  return pDisc > 0 && pDisc < pPrice ? pDisc : pPrice;
};

export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((total, item) => {
    return total + getItemEffectivePrice(item) * (item.quantity || 1);
  }, 0);

// Thunks
export const fetchCart = () => async (dispatch, getState) => {
  const { auth } = getState();
  if (!auth.isAuthenticated) return;

  dispatch({ type: cartSliceActions.SET_LOADING, payload: true });
  try {
    const res = await apiClient.get("/cart");
    dispatch({ type: cartSliceActions.SET_CART, payload: res.data || [] });
  } catch (err) {
    dispatch({ type: cartSliceActions.SET_ERROR, payload: err.message });
  }
};

export const addToCart = ({ product, variantId, variantLabel, quantity = 1 }) => async (dispatch, getState) => {
  const { auth } = getState();

  if (!auth.isAuthenticated) {
    // Guest User: store locally
    dispatch({
      type: cartSliceActions.ADD_GUEST_ITEM,
      payload: { product, variantId, variantLabel, quantity },
    });
    return;
  }

  // Logged In User: send to MongoDB API
  dispatch({ type: cartSliceActions.SET_LOADING, payload: true });
  try {
    const res = await apiClient.post("/cart/items", {
      productId: product._id,
      variantId,
      variantLabel,
      quantity,
    });
    dispatch({ type: cartSliceActions.SET_CART, payload: res.data || [] });
  } catch (err) {
    dispatch({ type: cartSliceActions.SET_ERROR, payload: err.message });
    throw err;
  }
};

export const updateCartQuantity = ({ itemId, quantity }) => async (dispatch, getState) => {
  const { auth } = getState();

  if (!auth.isAuthenticated) {
    dispatch({
      type: cartSliceActions.UPDATE_GUEST_QTY,
      payload: { itemId, quantity },
    });
    return;
  }

  try {
    const res = await apiClient.put(`/cart/items/${itemId}`, { quantity });
    dispatch({ type: cartSliceActions.SET_CART, payload: res.data || [] });
  } catch (err) {
    dispatch({ type: cartSliceActions.SET_ERROR, payload: err.message });
  }
};

export const removeFromCart = (itemId) => async (dispatch, getState) => {
  const { auth } = getState();

  if (!auth.isAuthenticated) {
    dispatch({
      type: cartSliceActions.REMOVE_GUEST_ITEM,
      payload: itemId,
    });
    return;
  }

  try {
    const res = await apiClient.delete(`/cart/items/${itemId}`);
    dispatch({ type: cartSliceActions.SET_CART, payload: res.data || [] });
  } catch (err) {
    dispatch({ type: cartSliceActions.SET_ERROR, payload: err.message });
  }
};

/**
 * Merges local guest cart items with DB cart post-login
 */
export const mergeGuestCart = () => async (dispatch) => {
  const guestItems = getInitialGuestCart();

  dispatch({ type: cartSliceActions.SET_SYNCING, payload: true });
  try {
    if (guestItems.length > 0) {
      const res = await apiClient.post("/cart/merge", { guestItems });
      dispatch({ type: cartSliceActions.SET_CART, payload: res.data || [] });
      clearGuestCartStorage();
    } else {
      const res = await apiClient.get("/cart");
      dispatch({ type: cartSliceActions.SET_CART, payload: res.data || [] });
    }
  } catch (err) {
    console.error("Cart merge error:", err);
    // Fallback: fetch DB cart if merge API fails
    try {
      const res = await apiClient.get("/cart");
      dispatch({ type: cartSliceActions.SET_CART, payload: res.data || [] });
    } catch (e) {
      dispatch({ type: cartSliceActions.SET_ERROR, payload: err.message });
    }
  }
};

export const clearCart = () => async (dispatch, getState) => {
  const { auth } = getState();
  if (auth.isAuthenticated) {
    try {
      await apiClient.delete("/cart");
    } catch (e) {
      console.error("Failed to clear DB cart:", e);
    }
  }
  dispatch({ type: cartSliceActions.CLEAR_CART_LOCAL });
};
