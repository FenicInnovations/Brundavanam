import { apiClient } from "@/lib/api/apiClient";

const GUEST_WISHLIST_STORAGE_KEY = "bg_guest_wishlist";

export function getInitialGuestWishlist() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to parse guest wishlist:", err);
    return [];
  }
}

export function saveGuestWishlist(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save guest wishlist:", err);
  }
}

export function clearGuestWishlistStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear guest wishlist storage:", err);
  }
}

export const initialWishlistState = {
  items: [],
  loading: false,
  error: null,
};

export const wishlistSliceActions = {
  SET_WISHLIST: "wishlist/setWishlist",
  TOGGLE_GUEST_WISHLIST: "wishlist/toggleGuestWishlist",
  CLEAR_WISHLIST_LOCAL: "wishlist/clearWishlistLocal",
  SET_LOADING: "wishlist/setLoading",
  SET_ERROR: "wishlist/setError",
};

export function wishlistReducer(state = initialWishlistState, action) {
  switch (action.type) {
    case wishlistSliceActions.SET_WISHLIST:
      return {
        ...state,
        items: action.payload,
        loading: false,
        error: null,
      };

    case wishlistSliceActions.TOGGLE_GUEST_WISHLIST: {
      const product = action.payload;
      const exists = state.items.some((item) => item.product._id === product._id);

      let updated;
      if (exists) {
        updated = state.items.filter((item) => item.product._id !== product._id);
      } else {
        updated = [
          ...state.items,
          {
            _id: `guest_w_${Date.now()}`,
            product,
            addedAt: new Date().toISOString(),
          },
        ];
      }

      saveGuestWishlist(updated);
      return { ...state, items: updated };
    }

    case wishlistSliceActions.CLEAR_WISHLIST_LOCAL: {
      clearGuestWishlistStorage();
      return { ...state, items: [] };
    }

    case wishlistSliceActions.SET_LOADING:
      return { ...state, loading: action.payload };

    case wishlistSliceActions.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    default:
      return state;
  }
}

// Selectors
export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistLoading = (state) => state.wishlist.loading;

export const selectIsInWishlist = (productId) => (state) =>
  state.wishlist.items.some(
    (item) => item.product?._id === productId || item.product === productId
  );

// Thunks
export const fetchWishlist = () => async (dispatch, getState) => {
  const { auth } = getState();
  if (!auth.isAuthenticated) return;

  dispatch({ type: wishlistSliceActions.SET_LOADING, payload: true });
  try {
    const res = await apiClient.get("/wishlist");
    dispatch({ type: wishlistSliceActions.SET_WISHLIST, payload: res.data || [] });
  } catch (err) {
    dispatch({ type: wishlistSliceActions.SET_ERROR, payload: err.message });
  }
};

export const toggleWishlist = (product) => async (dispatch, getState) => {
  const { auth } = getState();

  if (!auth.isAuthenticated) {
    dispatch({
      type: wishlistSliceActions.TOGGLE_GUEST_WISHLIST,
      payload: product,
    });
    return;
  }

  try {
    const res = await apiClient.post("/wishlist/toggle", { productId: product._id });
    dispatch({ type: wishlistSliceActions.SET_WISHLIST, payload: res.data || [] });
    return res.action;
  } catch (err) {
    dispatch({ type: wishlistSliceActions.SET_ERROR, payload: err.message });
    throw err;
  }
};

export const mergeGuestWishlist = () => async (dispatch) => {
  const guestItems = getInitialGuestWishlist();

  try {
    if (guestItems.length > 0) {
      const res = await apiClient.post("/wishlist/merge", { guestItems });
      dispatch({ type: wishlistSliceActions.SET_WISHLIST, payload: res.data || [] });
      clearGuestWishlistStorage();
    } else {
      const res = await apiClient.get("/wishlist");
      dispatch({ type: wishlistSliceActions.SET_WISHLIST, payload: res.data || [] });
    }
  } catch (err) {
    console.error("Wishlist merge error:", err);
  }
};
