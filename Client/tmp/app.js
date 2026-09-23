import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Auth from "./pages/Auth";
import Klanten from "./pages/Klanten";
import Dashboard from "./pages/Dashboard";
import PatchPlan from "./pages/PatchPlan";
import Rack from "./pages/Rack";
function App() {
  return /* @__PURE__ */ React.createElement(BrowserRouter, null, /* @__PURE__ */ React.createElement(ToastContainer, { position: "bottom-right", autoClose: 2e3 }), /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-4" }, /* @__PURE__ */ React.createElement(Routes, null, /* @__PURE__ */ React.createElement(Route, { path: "/auth", element: /* @__PURE__ */ React.createElement(Auth, null) }), /* @__PURE__ */ React.createElement(Route, { element: /* @__PURE__ */ React.createElement(ProtectedRoute, null) }, /* @__PURE__ */ React.createElement(Route, { path: "/", element: /* @__PURE__ */ React.createElement(Klanten, null) }), /* @__PURE__ */ React.createElement(Route, { path: "/klanten", element: /* @__PURE__ */ React.createElement(Navigate, { to: "/", replace: true }) }), /* @__PURE__ */ React.createElement(Route, { path: "/klanten/:klantId", element: /* @__PURE__ */ React.createElement(Dashboard, null) }), /* @__PURE__ */ React.createElement(
    Route,
    {
      path: "/klanten/:klantId/racks/:rackId",
      element: /* @__PURE__ */ React.createElement(Rack, null)
    }
  ), /* @__PURE__ */ React.createElement(Route, { path: "/klanten/:klantId/patchplan", element: /* @__PURE__ */ React.createElement(PatchPlan, null) })), /* @__PURE__ */ React.createElement(Route, { path: "*", element: /* @__PURE__ */ React.createElement(Navigate, { to: "/", replace: true }) }))));
}
export {
  App as default
};
