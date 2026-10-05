"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import { authReducer, initialAuthState, checkAuthSession } from "./slices/authSlice";
import { productReducer, initialProductState } from "./slices/productSlice";
import { adminReducer, initialAdminState } from "./slices/adminSlice";
import { cartReducer, initialCartState } from "./slices/cartSlice";
import { wishlistReducer, initialWishlistState } from "./slices/wishlistSlice";

const ReduxStoreContext = createContext(null);

const rootInitialState = {
  auth: initialAuthState,
  products: initialProductState,
  admin: initialAdminState,
  cart: initialCartState,
  wishlist: initialWishlistState,
};

function rootReducer(state, action) {
  return {
    auth: authReducer(state.auth, action),
    products: productReducer(state.products, action),
    admin: adminReducer(state.admin, action),
    cart: cartReducer(state.cart, action),
    wishlist: wishlistReducer(state.wishlist, action),
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
    // Verify session & sync cart/wishlist on mount
    checkAuthSession()(customDispatch);
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

