import { apiClient } from "@/lib/api/apiClient";

export const initialShippingState = {
  config: {
    freeShippingThreshold: 800,
    isFreeShippingEnabled: true,
    standardBaseRate: 45,
    standardLocalRate: 35,
    standardEstimatedDays: "2-4 business days",
    expressBaseRate: 79,
    expressLocalRate: 59,
    expressEstimatedDays: "1-2 business days",
    shippingDiscountOffer: 20,
    isOfferActive: true,
    offerLabel: "Goshala Delivery Subsidy",
    offerBannerText: "Special Seva Offer: Flat ₹20 Delivery Subsidy Applied at Checkout!",
  },
  loading: false,
  error: null,
  loaded: false,
};

export const shippingSliceActions = {
  FETCH_START: "shipping/FETCH_START",
  FETCH_SUCCESS: "shipping/FETCH_SUCCESS",
  FETCH_FAILURE: "shipping/FETCH_FAILURE",
  UPDATE_CONFIG: "shipping/UPDATE_CONFIG",
};

export function shippingReducer(state = initialShippingState, action) {
  switch (action.type) {
    case shippingSliceActions.FETCH_START:
      return { ...state, loading: true, error: null };
    case shippingSliceActions.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        error: null,
        config: { ...state.config, ...action.payload },
      };
    case shippingSliceActions.FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case shippingSliceActions.UPDATE_CONFIG:
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };
    default:
      return state;
  }
}

// Thunk to fetch public shipping config from backend
export const fetchShippingConfig = () => async (dispatch) => {
  dispatch({ type: shippingSliceActions.FETCH_START });
  try {
    const res = await apiClient.get("/orders/shipping/config");
    if (res?.success && res.config) {
      dispatch({ type: shippingSliceActions.FETCH_SUCCESS, payload: res.config });
      return res.config;
    }
  } catch (err) {
    console.error("[shippingSlice] Failed to fetch shipping config:", err);
    dispatch({ type: shippingSliceActions.FETCH_FAILURE, payload: err.message });
  }
};

// Selectors
export const selectShippingConfig = (state) => state.shipping?.config || initialShippingState.config;
export const selectFreeShippingThreshold = (state) =>
  state.shipping?.config?.freeShippingThreshold ?? 800;
export const selectIsFreeShippingEnabled = (state) =>
  state.shipping?.config?.isFreeShippingEnabled ?? true;
export const selectShippingDiscountOffer = (state) =>
  state.shipping?.config?.shippingDiscountOffer ?? 20;
export const selectIsOfferActive = (state) =>
  state.shipping?.config?.isOfferActive ?? true;
export const selectOfferLabel = (state) =>
  state.shipping?.config?.offerLabel || "Goshala Delivery Subsidy";
export const selectOfferBannerText = (state) =>
  state.shipping?.config?.offerBannerText || "Special Seva Offer: Flat ₹20 Delivery Subsidy Applied at Checkout!";
