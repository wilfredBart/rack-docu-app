import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Auth from "./pages/Auth";
import Klanten from "./pages/Klanten";
import Dashboard from "./pages/Dashboard";
import PatchPlan from "./pages/PatchPlan";

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="bottom-right" autoClose={2000} />
      <div className="container mx-auto px-4">
        <Routes>
          {/* Publieke route */}
          <Route path="/auth" element={<Auth />} />

          {/* Beveiligde routes */}
          <Route element={<ProtectedRoute />}>
            {/* 1. Startpagina: Altijd het Klantenoverzicht */}
            <Route path="/" element={<Klanten />} />

            {/* 2. Specifieke Klant omgevingen op basis van klantId */}
            <Route path="/klanten/:klantId" element={<Dashboard />} />
            <Route path="/klanten/:klantId/patchplan" element={<PatchPlan />} />
          </Route>

          {/* Fallback als een pagina niet bestaat -> terug naar Klantenoverzicht */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
