import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Vehicles from "./pages/Vehicles";
import Materials from "./pages/Materials";
import Vendors from "./pages/Vendors";
import Projects from "./pages/Projects";
import Transportation from "./pages/Transportation";
import Fuels from "./pages/Fuels";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import RolePermissions from "./pages/RolePermissions";
import FuelLog from "./pages/FuelLog";
import DozerLog from "./pages/DozerLog";
import SalarySetup from "./pages/SalarySetup";
import MonthlySalary from "./pages/MonthlySalary";
import SalaryPayments from "./pages/SalaryPayments";
import SalaryDetails from "./pages/SalaryDetails";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./components/Toaster";
import { AuthProvider } from "./context/AuthContext";
import { CultureProvider } from "./context/CultureContext";
import { useUnauthorizedHandler } from "./hooks/useUnauthorizedHandler";

function AppRoutes() {
  useUnauthorizedHandler();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute policy="users.view">
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transportation"
          element={
            <ProtectedRoute policy="transportation.view">
              <Transportation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-log"
          element={
            <ProtectedRoute policy="fuel_log.view">
              <FuelLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dozer-log"
          element={
            <ProtectedRoute policy="dozer_log.view">
              <DozerLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute policy="vehicles.view">
              <Vehicles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute policy="materials.view">
              <Materials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors"
          element={
            <ProtectedRoute policy="vendors.view">
              <Vendors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute policy="projects.view">
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuels"
          element={
            <ProtectedRoute policy="fuel_types.view">
              <Fuels />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute policy="roles.view">
              <Roles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/permissions"
          element={
            <ProtectedRoute policy="permissions.view">
              <Permissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/role-permissions"
          element={
            <ProtectedRoute policy="role_permissions.view">
              <RolePermissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monthly-salary"
          element={
            <ProtectedRoute policy="monthly_salary.view">
              <MonthlySalary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salary-setup"
          element={
            <ProtectedRoute policy="salary_setup.view">
              <SalarySetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salary-payments"
          element={
            <ProtectedRoute policy="salary_payment.view">
              <SalaryPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salary-details"
          element={
            <ProtectedRoute policy="salary_detail.view">
              <SalaryDetails />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <CultureProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </CultureProvider>
  );
}
