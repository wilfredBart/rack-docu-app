
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
          <Route path="/auth" element={<Auth />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Klanten />} />
            <Route path="/klanten" element={<Navigate to="/" replace />} />
            <Route path="/klanten/:klantId" element={<Dashboard />} />
            <Route path="/klanten/:klantId/patchplan" element={<PatchPlan />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}