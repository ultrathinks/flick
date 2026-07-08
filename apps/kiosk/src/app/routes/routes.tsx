import { Navigate, type RouteObject } from "react-router";
import { PairingPage } from "@/pages/pairing";
import { PaymentPage } from "@/pages/payment";
import { PaymentCompletePage } from "@/pages/payment-complete";
import { ProductsPage } from "@/pages/products";
import { RoutingPage } from "@/pages/routing";

export const routes: RouteObject[] = [
  { index: true, element: <RoutingPage /> },
  { path: "pairing", element: <PairingPage /> },
  { path: "products", element: <ProductsPage /> },
  { path: "payment", element: <PaymentPage /> },
  { path: "payment/complete", element: <PaymentCompletePage /> },
  { path: "*", element: <Navigate to="/" replace /> },
];
