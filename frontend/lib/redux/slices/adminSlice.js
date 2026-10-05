import { apiClient } from "@/lib/api/apiClient";

export const initialAdminState = {
  sidebarExpanded: true,
  dashboardStats: null,
  loadingStats: false,
  toast: null,
};

export const adminSliceActions = {
  TOGGLE_SIDEBAR: "admin/toggleSidebar",
  SET_SIDEBAR: "admin/setSidebar",
  SET_DASHBOARD_STATS: "admin/setDashboardStats",
  SET_LOADING_STATS: "admin/setLoadingStats",
  SHOW_TOAST: "admin/showToast",
  HIDE_TOAST: "admin/hideToast",
};

export function adminReducer(state = initialAdminState, action) {
  switch (action.type) {
    case adminSliceActions.TOGGLE_SIDEBAR:
      return { ...state, sidebarExpanded: !state.sidebarExpanded };
    case adminSliceActions.SET_SIDEBAR:
      return { ...state, sidebarExpanded: action.payload };
    case adminSliceActions.SET_DASHBOARD_STATS:
      return { ...state, dashboardStats: action.payload, loadingStats: false };
    case adminSliceActions.SET_LOADING_STATS:
      return { ...state, loadingStats: action.payload };
    case adminSliceActions.SHOW_TOAST:
      return { ...state, toast: action.payload };
    case adminSliceActions.HIDE_TOAST:
      return { ...state, toast: null };
    default:
      return state;
  }
}

// Selectors
export const selectSidebarExpanded = (state) => state.admin.sidebarExpanded;
export const selectDashboardStats = (state) => state.admin.dashboardStats;
export const selectAdminToast = (state) => state.admin.toast;

// Thunks
export const fetchDashboardStats = () => async (dispatch) => {
  dispatch({ type: adminSliceActions.SET_LOADING_STATS, payload: true });
  try {
    const res = await apiClient.get("/admin/dashboard/stats");
    dispatch({ type: adminSliceActions.SET_DASHBOARD_STATS, payload: res.data });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch dashboard stats:", err);
    dispatch({ type: adminSliceActions.SET_LOADING_STATS, payload: false });
  }
};

export const triggerToast = (message, type = "success") => (dispatch) => {
  dispatch({
    type: adminSliceActions.SHOW_TOAST,
    payload: { id: Date.now(), message, type },
  });
  setTimeout(() => {
    dispatch({ type: adminSliceActions.HIDE_TOAST });
  }, 4000);
};
