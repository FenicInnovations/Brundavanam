import { apiClient } from "@/lib/api/apiClient";
import { mergeGuestCart, cartSliceActions } from "./cartSlice";
import { mergeGuestWishlist, wishlistSliceActions } from "./wishlistSlice";

export const initialAuthState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  role: "customer",
  loading: true,
  error: null,
};

export const authSliceActions = {
  SET_USER: "auth/setUser",
  SET_LOADING: "auth/setLoading",
  SET_ERROR: "auth/setError",
  LOGOUT: "auth/logout",
};

export function authReducer(state = initialAuthState, action) {
  switch (action.type) {
    case authSliceActions.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isAdmin:
          action.payload?.isAdmin ||
          action.payload?.role === "admin" ||
          action.payload?.role === "super_admin",
        role: action.payload?.role || (action.payload?.isAdmin ? "admin" : "customer"),
        loading: false,
        error: null,
      };
    case authSliceActions.SET_LOADING:
      return { ...state, loading: action.payload };
    case authSliceActions.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case authSliceActions.LOGOUT:
      return {
        ...initialAuthState,
        loading: false,
      };
    default:
      return state;
  }
}

// Selectors
export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAdmin = (state) => state.auth.isAdmin;

// Thunks
export const checkAuthSession = () => async (dispatch) => {
  dispatch({ type: authSliceActions.SET_LOADING, payload: true });
  try {
    const res = await apiClient.get("/auth/me");
    if (res.success && res.user) {
      dispatch({ type: authSliceActions.SET_USER, payload: res.user });
      // Trigger cart and wishlist synchronization for logged-in user
      dispatch(mergeGuestCart());
      dispatch(mergeGuestWishlist());
    } else {
      dispatch({ type: authSliceActions.SET_USER, payload: null });
    }
  } catch (err) {
    dispatch({ type: authSliceActions.SET_USER, payload: null });
  }
};

/**
 * Call post OTP verification or password login to set user and sync cart/wishlist
 */
export const handleLoginSuccess = (user) => async (dispatch) => {
  dispatch({ type: authSliceActions.SET_USER, payload: user });
  // Synchronize & merge guest items with database
  await dispatch(mergeGuestCart());
  await dispatch(mergeGuestWishlist());
};

export const logoutUser = () => async (dispatch) => {
  try {
    await apiClient.post("/auth/logout");
  } catch (e) {
    console.error("Logout error:", e);
  } finally {
    dispatch({ type: authSliceActions.LOGOUT });
    // Reset cart and wishlist states to prevent data leaks between users
    dispatch({ type: cartSliceActions.CLEAR_CART_LOCAL });
    dispatch({ type: wishlistSliceActions.CLEAR_WISHLIST_LOCAL });
  }
};

export const logoutAdmin = logoutUser;
