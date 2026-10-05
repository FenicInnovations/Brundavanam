"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { useDispatch, useSelector, selectSelectedProduct, selectProductLoading } from "@/lib/redux/store";
import { fetchProductById } from "@/lib/redux/slices/productSlice";
import { FormSkeleton } from "@/components/admin/SkeletonLoader";

export default function EditProductPage() {
  const params = useParams();
  const dispatch = useDispatch();
  const product = useSelector(selectSelectedProduct);
  const loading = useSelector(selectProductLoading);

  useEffect(() => {
    if (params?.id) {
      dispatch(fetchProductById(params.id));
    }
  }, [dispatch, params?.id]);

  if (loading || !product || product._id !== params?.id) {
    return <FormSkeleton />;
  }

  return <ProductForm initialData={product} isEdit={true} />;
}
