export {
  archiveProduct,
  createProduct,
  fetchBoothProducts,
  type ProductInput,
  updateProduct,
} from "./api/product-api.ts";
export { type Product, productSchema } from "./model/types.ts";
export {
  useArchiveProduct,
  useBoothProducts,
  useCreateProduct,
  useUpdateProduct,
} from "./model/use-product.ts";
