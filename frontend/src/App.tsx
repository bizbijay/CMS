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
import ExtraExpenses from "./pages/ExtraExpenses";
import SalarySetup from "./pages/SalarySetup";
import MonthlySalary from "./pages/MonthlySalary";
import SalaryPayments from "./pages/SalaryPayments";
import SalaryDetails from "./pages/SalaryDetails";
import SalaryBreakdown from "./pages/SalaryBreakdown";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectExpenses from "./pages/ProjectExpenses";
import ProjectWages from "./pages/ProjectWages";
import ProjectBreakdown from "./pages/ProjectBreakdown";
import ProjectCommissions from "./pages/ProjectCommissions";
import VehicleMaintenanceVehicles from "./pages/VehicleMaintenanceVehicles";
import VehicleMaintenanceLogs from "./pages/VehicleMaintenanceLogs";
import VehicleMaintenanceDetail from "./pages/VehicleMaintenanceDetail";
import GovernmentOffice from "./pages/GovernmentOffice";
import MaintenanceParts from "./pages/MaintenanceParts";
import PartyNames from "./pages/PartyNames";
import BankAccounts from "./pages/BankAccounts";
import AccountManagement from "./pages/AccountManagement";
import BankAccountDetails from "./pages/BankAccountDetails";
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
          path="/extra-expenses"
          element={
            <ProtectedRoute policy="extra_expenses.view">
              <ExtraExpenses />
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
        <Route
          path="/salary-details/:userId"
          element={
            <ProtectedRoute policy="salary_detail.view">
              <SalaryBreakdown />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-details"
          element={
            <ProtectedRoute policy="projects.view">
              <ProjectDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-details/:projectId/expenses"
          element={
            <ProtectedRoute policy="project_expenses.view">
              <ProjectExpenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-details/:projectId/wages"
          element={
            <ProtectedRoute policy="project_wages.view">
              <ProjectWages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-details/:projectId/commissions"
          element={
            <ProtectedRoute policy="project_commissions.view">
              <ProjectCommissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-details/:projectId/breakdown"
          element={
            <ProtectedRoute policy="projects.view">
              <ProjectBreakdown />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-maintenance"
          element={
            <ProtectedRoute policy="vehicle_maintenance.view">
              <VehicleMaintenanceVehicles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-maintenance/:vehicleId"
          element={
            <ProtectedRoute policy="vehicle_maintenance.view">
              <VehicleMaintenanceLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-maintenance/:vehicleId/:logId"
          element={
            <ProtectedRoute policy="vehicle_maintenance.view">
              <VehicleMaintenanceDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/government-office"
          element={
            <ProtectedRoute policy="govt_offices.view">
              <GovernmentOffice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance-parts"
          element={
            <ProtectedRoute policy="maintenance_parts.view">
              <MaintenanceParts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/party-names"
          element={
            <ProtectedRoute policy="party_names.view">
              <PartyNames />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bank-accounts"
          element={
            <ProtectedRoute policy="bank_accounts.view">
              <BankAccounts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-management"
          element={
            <ProtectedRoute policy="account_management.view">
              <AccountManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-management/:accountId"
          element={
            <ProtectedRoute policy="account_management.view">
              <BankAccountDetails />
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
