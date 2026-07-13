import type { Routes } from "@b1nd/aid-kit/navigation";
import { ChargePage } from "@/pages/charge";

export const routes: Routes = {
  tabs: [{ path: "/", index: true, element: ChargePage }],
  stacks: [],
};
