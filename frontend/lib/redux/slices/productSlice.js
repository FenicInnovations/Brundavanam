import { apiClient } from "@/lib/api/apiClient";

export const initialProductState = {
  items: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    search: "",
    category: "",
    subcategory: "",
    status: "all",
    stockStatus: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  selectedProduct: null,
  categories: [],
  loading: false,
  submitting: false,
  error: null,
};

export const productSliceActions = {
  SET_PRODUCTS: "products/setProducts",
  SET_SELECTED_PRODUCT: "products/setSelectedProduct",
  SET_FILTERS: "products/setFilters",
  SET_CATEGORIES: "products/setCategories",
  SET_LOADING: "products/setLoading",
  SET_SUBMITTING: "products/setSubmitting",
  SET_ERROR: "products/setError",
  UPDATE_STOCK_LOCAL: "products/updateStockLocal",
  REMOVE_PRODUCT_LOCAL: "products/removeProductLocal",
};

export function productReducer(state = initialProductState, action) {
  switch (action.type) {
    case productSliceActions.SET_PRODUCTS:
      return {
        ...state,
        items: action.payload.data,
        pagination: action.payload.pagination,
        loading: false,
        error: null,
      };
    case productSliceActions.SET_SELECTED_PRODUCT:
      return {
        ...state,
        selectedProduct: action.payload,
        loading: false,
        error: null,
      };
    case productSliceActions.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    case productSliceActions.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload,
      };
    case productSliceActions.SET_LOADING:
      return { ...state, loading: action.payload };
    case productSliceActions.SET_SUBMITTING:
      return { ...state, submitting: action.payload };
    case productSliceActions.SET_ERROR:
      return { ...state, error: action.payload, loading: false, submitting: false };
    case productSliceActions.UPDATE_STOCK_LOCAL:
      return {
        ...state,
        items: state.items.map((prod) =>
          prod._id === action.payload.id ? { ...prod, stock: action.payload.stock } : prod
        ),
        selectedProduct:
          state.selectedProduct && state.selectedProduct._id === action.payload.id
            ? { ...state.selectedProduct, stock: action.payload.stock }
            : state.selectedProduct,
      };
    case productSliceActions.REMOVE_PRODUCT_LOCAL:
      return {
        ...state,
        items: state.items.filter((prod) => prod._id !== action.payload),
        pagination: { ...state.pagination, total: Math.max(0, state.pagination.total - 1) },
      };
    default:
      return state;
  }
}

// Selectors
export const selectProducts = (state) => state.products.items;
export const selectProductPagination = (state) => state.products.pagination;
export const selectProductFilters = (state) => state.products.filters;
export const selectSelectedProduct = (state) => state.products.selectedProduct;
export const selectCategories = (state) => state.products.categories;
export const selectProductLoading = (state) => state.products.loading;
export const selectProductSubmitting = (state) => state.products.submitting;
export const selectProductError = (state) => state.products.error;

// Thunks
export const fetchProducts = (overrideParams = {}) => async (dispatch, getState) => {
  dispatch({ type: productSliceActions.SET_LOADING, payload: true });
  try {
    const currentState = getState ? getState().products : initialProductState;
    const params = {
      ...currentState.filters,
      page: currentState.pagination.page,
      limit: currentState.pagination.limit,
      ...overrideParams,
    };

    const res = await apiClient.get("/admin/products", params);
    dispatch({ type: productSliceActions.SET_PRODUCTS, payload: res });
    return res;
  } catch (err) {
    dispatch({ type: productSliceActions.SET_ERROR, payload: err.message });
    throw err;
  }
};

export const fetchProductById = (id) => async (dispatch) => {
  dispatch({ type: productSliceActions.SET_LOADING, payload: true });
  try {
    const res = await apiClient.get(`/admin/products/${id}`);
    dispatch({ type: productSliceActions.SET_SELECTED_PRODUCT, payload: res.data });
    return res.data;
  } catch (err) {
    dispatch({ type: productSliceActions.SET_ERROR, payload: err.message });
    throw err;
  }
};

export const createProduct = (productData) => async (dispatch) => {
  dispatch({ type: productSliceActions.SET_SUBMITTING, payload: true });
  try {
    const res = await apiClient.post("/admin/products", productData);
    dispatch({ type: productSliceActions.SET_SUBMITTING, payload: false });
    return res.data;
  } catch (err) {
    dispatch({ type: productSliceActions.SET_ERROR, payload: err.message });
    throw err;
  }
};

export const updateProduct = ({ id, data }) => async (dispatch) => {
  dispatch({ type: productSliceActions.SET_SUBMITTING, payload: true });
  try {
    const res = await apiClient.put(`/admin/products/${id}`, data);
    dispatch({ type: productSliceActions.SET_SELECTED_PRODUCT, payload: res.data });
    dispatch({ type: productSliceActions.SET_SUBMITTING, payload: false });
    return res.data;
  } catch (err) {
    dispatch({ type: productSliceActions.SET_ERROR, payload: err.message });
    throw err;
  }
};

export const deleteProduct = ({ id, hardDelete = false }) => async (dispatch) => {
  dispatch({ type: productSliceActions.SET_LOADING, payload: true });
  try {
    const res = await apiClient.delete(`/admin/products/${id}`, { hardDelete });
    dispatch({ type: productSliceActions.REMOVE_PRODUCT_LOCAL, payload: id });
    dispatch({ type: productSliceActions.SET_LOADING, payload: false });
    return res;
  } catch (err) {
    dispatch({ type: productSliceActions.SET_ERROR, payload: err.message });
    throw err;
  }
};

export const updateProductStock = ({ id, stock, variants }) => async (dispatch) => {
  try {
    const body = {};
    if (stock !== undefined) body.stock = stock;
    if (variants) body.variants = variants;
    const res = await apiClient.patch(`/admin/products/${id}/stock`, body);
    dispatch({
      type: productSliceActions.UPDATE_STOCK_LOCAL,
      payload: { id, stock: res.data.stock },
    });
    return res.data;
  } catch (err) {
    dispatch({ type: productSliceActions.SET_ERROR, payload: err.message });
    throw err;
  }
};

export const fetchCategories = (all = false) => async (dispatch) => {
  // 1. Primary: Ultra-fast GraphQL query backed by Redis
  try {
    const { gqlRequest } = await import("@/lib/graphql/client");
    const { GET_CATEGORIES_QUERY } = await import("@/lib/graphql/queries");

    const data = await gqlRequest(GET_CATEGORIES_QUERY, { all });
    if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
      const normalized = data.categories.map((c) => ({
        ...c,
        _id: c.id,
      }));
      dispatch({ type: productSliceActions.SET_CATEGORIES, payload: normalized });
      return normalized;
    }
  } catch (err) {
    console.warn("[productSlice:GraphQL] Falling back to REST for categories:", err?.message || err);
  }

  // 2. Fallback: REST endpoint
  try {
    const endpoint = all ? "/categories?all=true" : "/categories";
    const res = await apiClient.get(endpoint);
    dispatch({ type: productSliceActions.SET_CATEGORIES, payload: res.data || [] });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch categories:", err);
  }
};

export const createCategory = (categoryData) => async (dispatch) => {
  try {
    const res = await apiClient.post("/categories", categoryData);
    await dispatch(fetchCategories(true));
    return res.data;
  } catch (err) {
    console.error("Failed to create category:", err);
    throw err;
  }
};

export const updateCategory = ({ id, data }) => async (dispatch) => {
  try {
    const res = await apiClient.put(`/categories/${id}`, data);
    await dispatch(fetchCategories(true));
    return res.data;
  } catch (err) {
    console.error("Failed to update category:", err);
    throw err;
  }
};

export const deleteCategory = (id) => async (dispatch) => {
  try {
    const res = await apiClient.delete(`/categories/${id}`);
    await dispatch(fetchCategories(true));
    return res;
  } catch (err) {
    console.error("Failed to delete category:", err);
    throw err;
  }
};


function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Uploads a file directly to Google Cloud Storage bucket via backend proxy
 */
export const uploadGcsMedia = (file, fileType = "image") => async () => {
  try {
    const base64 = await fileToBase64(file);

    const res = await apiClient.post("/admin/products/media/upload-direct", {
      fileName: file.name,
      mimeType: file.type,
      fileType,
      base64,
    });

    return res.data;
  } catch (err) {
    console.error("GCS Upload Error:", err);
    throw err;
  }
};
