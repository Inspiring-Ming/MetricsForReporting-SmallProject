// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ESGDashboard from "./components/dashboard/dashboard";
import ImplementationUpload from "./components/upload/implementationUpload";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<ESGDashboard />} />
        <Route path="/upload" element={<ImplementationUpload />} />
        {/* optional: redirect root to /dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
