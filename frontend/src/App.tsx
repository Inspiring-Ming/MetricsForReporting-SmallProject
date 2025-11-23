// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ESGDashboard from "./components/dashboard/dashboard";
import UploadPage from "./components/upload/UploadPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<ESGDashboard />} />
        <Route path="/upload" element={<UploadPage />} />
        {/* optional: redirect root to /dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
