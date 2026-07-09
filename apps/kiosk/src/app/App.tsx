import { BrowserRouter, useRoutes } from "react-router";
import { AppErrorBoundary } from "./error-boundary.tsx";
import { Providers } from "./providers";
import { routes } from "./routes";

function AppRoutes() {
  return useRoutes(routes);
}

export function App() {
  return (
    <AppErrorBoundary>
      <Providers>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </Providers>
    </AppErrorBoundary>
  );
}
