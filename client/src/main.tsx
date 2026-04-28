import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./core/App/App";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

if (
  typeof window !== "undefined" &&
  import.meta.env.PROD &&
  window.location.protocol === "http:" &&
  !/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)
) {
  const secureUrl = `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(secureUrl);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60,    // keep cache 1 hour
      retry: 1,
      retryDelay: 800,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
});
createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
  // </StrictMode>
);
