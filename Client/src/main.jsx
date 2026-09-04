import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Redux imports
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";

import "./index.css";
import App from "./App.jsx";

const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((m) => ({
    default: m.ReactQueryDevtools,
  })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        toast.error(error.response?.data?.error || "Er ging iets mis");
      },
    },
  },
});

const container = document.getElementById("root");

// Controleer of de root al bestaat om de waarschuwing te voorkomen (bijv. bij Hot Module Replacement)
let root = window.__reactRoot;
if (!root) {
  root = createRoot(container);
  window.__reactRoot = root;
}

root.render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <App />
          {import.meta.env.DEV && (
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          )}
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
