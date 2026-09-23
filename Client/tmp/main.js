import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";
import "./index.css";
import App from "./App.jsx";
const ReactQueryDevtools = lazy(
  () => import("@tanstack/react-query-devtools").then((m) => ({
    default: m.ReactQueryDevtools
  }))
);
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        toast.error(error.response?.data?.error || "Er ging iets mis");
      }
    }
  }
});
const container = document.getElementById("root");
let root = window.__reactRoot;
if (!root) {
  root = createRoot(container);
  window.__reactRoot = root;
}
root.render(
  /* @__PURE__ */ React.createElement(StrictMode, null, /* @__PURE__ */ React.createElement(Provider, { store }, /* @__PURE__ */ React.createElement(PersistGate, { loading: null, persistor }, /* @__PURE__ */ React.createElement(QueryClientProvider, { client: queryClient }, /* @__PURE__ */ React.createElement(App, null), import.meta.env.DEV && /* @__PURE__ */ React.createElement(Suspense, { fallback: null }, /* @__PURE__ */ React.createElement(ReactQueryDevtools, { initialIsOpen: false }))))))
);
