import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getKioskProducts } from "@/entities/product/api/products";
import { ApiError } from "@/shared/api/client";
import type { Product } from "@/shared/api/types";
import { clearKioskData, getKioskSession } from "@/shared/model/storage";

type KioskProductsState = {
  products: Product[];
  isLoading: boolean;
  hasError: boolean;
  reload: () => void;
};

export function useKioskProducts(): KioskProductsState {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    const { token } = getKioskSession();
    if (!token) {
      navigate("/pairing", { replace: true });
      return;
    }

    try {
      setProducts(await getKioskProducts(token));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearKioskData();
        navigate("/pairing", { replace: true });
        return;
      }
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  return { products, isLoading, hasError, reload: load };
}
