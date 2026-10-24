"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import { authReducer, initialAuthState, checkAuthSession } from "./slices/authSlice";
import { productReducer, initialProductState } from "./slices/productSlice";
import { adminReducer, initialAdminState } from "./slices/adminSlice";
import { cartReducer, initialCartState, cartSliceActions, getInitialGuestCart } from "./slices/cartSlice";
import { wishlistReducer, initialWishlistState, wishlistSliceActions, getInitialGuestWishlist } from "./slices/wishlistSlice";
import { shippingReducer, initialShippingState, fetchShippingConfig } from "./slices/shippingSlice";

const ReduxStoreContext = createContext(null);

const rootInitialState = {
  auth: initialAuthState,
  products: initialProductState,
  admin: initialAdminState,
  cart: initialCartState,
  wishlist: initialWishlistState,
  shipping: initialShippingState,
};

function rootReducer(state, action) {
  return {
    auth: authReducer(state.auth, action),
    products: productReducer(state.products, action),
    admin: adminReducer(state.admin, action),
    cart: cartReducer(state.cart, action),
    wishlist: wishlistReducer(state.wishlist, action),
    shipping: shippingReducer(state.shipping, action),
  };
}

export function ReduxProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, rootInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Custom thunk middleware wrapper with stable reference
  const customDispatch = useCallback(
    (action) => {
      if (typeof action === "function") {
        return action(customDispatch, () => stateRef.current);
      }
      return dispatch(action);
    },
    []
  );

  useEffect(() => {
    // 1. Safely hydrate guest cart & wishlist on client mount after DOM hydration matches server
    try {
      const localCart = getInitialGuestCart();
      if (Array.isArray(localCart) && localCart.length > 0) {
        customDispatch({ type: cartSliceActions.SET_CART, payload: localCart });
      }
      const localWishlist = getInitialGuestWishlist();
      if (Array.isArray(localWishlist) && localWishlist.length > 0) {
        customDispatch({ type: wishlistSliceActions.SET_WISHLIST, payload: localWishlist });
      }
    } catch (err) {
      console.warn("[redux:hydration] could not hydrate local storage:", err);
    }

    // 2. Verify session & sync cart/wishlist on mount
    checkAuthSession()(customDispatch);

    // 3. Fetch live dynamic shipping configuration & per-item delivery offer
    fetchShippingConfig()(customDispatch);
  }, [customDispatch]);

  const value = {
    state,
    dispatch: customDispatch,
  };

  return <ReduxStoreContext.Provider value={value}>{children}</ReduxStoreContext.Provider>;
}

export function useSelector(selectorFn) {
  const context = useContext(ReduxStoreContext);
  if (!context) {
    throw new Error("useSelector must be used within ReduxProvider");
  }
  return selectorFn(context.state);
}

export function useDispatch() {
  const context = useContext(ReduxStoreContext);
  if (!context) {
    throw new Error("useDispatch must be used within ReduxProvider");
  }
  return context.dispatch;
}

// Export slice actions, reducers, and selectors
export * from "./slices/authSlice";
export * from "./slices/productSlice";
export * from "./slices/adminSlice";
export * from "./slices/cartSlice";
export * from "./slices/wishlistSlice";
export * from "./slices/shippingSlice";

