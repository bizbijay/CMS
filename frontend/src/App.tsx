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
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./components/Toaster";
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
        <Route path="/users" element={<Users />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/transportation" element={<Transportation />} />
        <Route path="/fuels" element={<Fuels />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/permissions" element={<Permissions />} />
        <Route path="/role-permissions" element={<RolePermissions />} />
        <Route path="/fuel-log" element={<FuelLog />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}
