import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Shopping from "./pages/Shopping";
import Expenses from "./pages/Expenses";
import Medications from "./pages/Medications";
import Kepa from "./pages/Kepa";
import Pension from "./pages/Pension";
import MedicalExams from "./pages/MedicalExams";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Shopping />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="medications" element={<Medications />} />
        <Route path="kepa" element={<Kepa />} />
        <Route path="pension" element={<Pension />} />
        <Route path="medical-exams" element={<MedicalExams />} />
      </Route>
    </Routes>
  );
}
