import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCulture } from "../context/CultureContext";

interface Props {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const settingsPaths = [
  "/vehicles", "/materials", "/vendors", "/projects",
  "/fuels", "/roles", "/permissions", "/role-permissions", "/salary-setup", "/government-office", "/maintenance-parts",
];

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { can } = useAuth();
  const { t } = useCulture();

  const topMenu = [
    { to: "/", label: t.nav.dashboard, icon: DashboardIcon },
    { to: "/users", label: t.nav.users, icon: UsersIcon, policy: "users.view" },
    { to: "/transportation", label: t.nav.transportation, icon: TransportationIcon, policy: "transportation.view" },
    { to: "/fuel-log", label: t.nav.fuelLog, icon: FuelLogIcon, policy: "fuel_log.view" },
    { to: "/dozer-log", label: t.nav.dozerLog, icon: DozerLogIcon, policy: "dozer_log.view" },
    { to: "/vehicle-maintenance", label: t.nav.vehicleMaintenance, icon: VehicleMaintenanceIcon, policy: "vehicle_maintenance.view" },
    { to: "/project-details", label: t.nav.projectDetails, icon: ProjectDetailsIcon, policy: "projects.view" },
    { to: "/monthly-salary", label: t.nav.monthlySalary, icon: MonthlySalaryIcon, policy: "monthly_salary.view" },
    { to: "/salary-details", label: t.nav.salaryDetails, icon: SalaryDetailIcon, policy: "salary_detail.view" },
  ];

  const settingsMenu = [
    { to: "/vehicles", label: t.nav.vehicles, icon: VehiclesIcon, policy: "vehicles.view" },
    { to: "/materials", label: t.nav.materials, icon: MaterialsIcon, policy: "materials.view" },
    { to: "/vendors", label: t.nav.vendors, icon: VendorsIcon, policy: "vendors.view" },
    { to: "/projects", label: t.nav.projects, icon: ProjectsIcon, policy: "projects.view" },
    { to: "/fuels", label: t.nav.fuelTypes, icon: FuelIcon, policy: "fuel_types.view" },
    { to: "/government-office", label: t.nav.governmentOffice, icon: GovernmentOfficeIcon, policy: "govt_offices.view" },
    { to: "/maintenance-parts", label: t.nav.maintenanceParts, icon: MaintenancePartsIcon, policy: "maintenance_parts.view" },
    { to: "/salary-setup", label: t.nav.salarySetup, icon: SalarySetupIcon, policy: "salary_setup.view" },
    { to: "/roles", label: t.nav.roles, icon: RolesIcon, policy: "roles.view" },
    { to: "/permissions", label: t.nav.permissions, icon: PermissionsIcon, policy: "permissions.view" },
    { to: "/role-permissions", label: t.nav.rolePermissions, icon: RolePermissionsIcon, policy: "role_permissions.view" },
  ];

  const visibleTopMenu = topMenu.filter((m) => !m.policy || can(m.policy));
  const visibleSettingsMenu = settingsMenu.filter((m) => !m.policy || can(m.policy));

  const isInSettings = settingsPaths.some((p) => location.pathname === p);
  const [settingsOpen, setSettingsOpen] = useState(isInSettings);
  const width = collapsed ? "w-16" : "w-60";

  const navContent = (isMobile = false) => (
    <>
      <div
        className={`flex items-center border-b border-slate-800 ${
          collapsed && !isMobile ? "justify-center px-2" : "justify-between px-6"
        } py-4`}
      >
        <div>
          <h1 className="text-xl font-semibold tracking-wide">CMS</h1>
          <p className="text-xs text-slate-400">Admin console</p>
        </div>
        {isMobile ? (
          <button
            type="button"
            onClick={onMobileClose}
            className="w-8 h-8 inline-flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label="Close menu"
          >
            <XIcon />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="w-8 h-8 inline-flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronIcon direction={collapsed ? "right" : "left"} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleTopMenu.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={isMobile ? onMobileClose : undefined}
            title={collapsed && !isMobile ? label : undefined}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded text-sm",
                collapsed && !isMobile ? "justify-center px-0 py-2" : "px-3 py-2",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              ].join(" ")
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {(!collapsed || isMobile) && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Settings group — hidden entirely when user has no access to any submenu item */}
        {visibleSettingsMenu.length > 0 && (
        <>
        <button
          type="button"
          onClick={() => setSettingsOpen((o) => !o)}
          title={collapsed && !isMobile ? "Settings" : undefined}
          className={[
            "w-full flex items-center gap-3 rounded text-sm",
            collapsed && !isMobile ? "justify-center px-0 py-2" : "px-3 py-2",
            isInSettings
              ? "text-white"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
          ].join(" ")}
        >
          <SettingsIcon className="w-5 h-5 shrink-0" />
          {(!collapsed || isMobile) && (
            <>
              <span className="flex-1 text-left">{t.nav.settings}</span>
              <ChevronIcon direction={settingsOpen ? "down" : "right"} />
            </>
          )}
        </button>

        {(settingsOpen || (collapsed && !isMobile)) && (
          <div className={collapsed && !isMobile ? "space-y-1" : "ml-3 border-l border-slate-700 pl-2 space-y-1"}>
            {visibleSettingsMenu.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={isMobile ? onMobileClose : undefined}
                title={collapsed && !isMobile ? label : undefined}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded text-sm",
                    collapsed && !isMobile ? "justify-center px-0 py-2" : "px-3 py-2",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {(!collapsed || isMobile) && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        )}
        </>
        )}
      </nav>

      <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-500">
        v0.1.0
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex md:flex-col ${width} bg-slate-900 text-slate-100 min-h-screen transition-all duration-200 shrink-0`}
      >
        {navContent(false)}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-900 text-slate-100 transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent(true)}
      </aside>
    </>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" | "down" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      {direction === "left" && <polyline points="15 6 9 12 15 18" />}
      {direction === "right" && <polyline points="9 6 15 12 9 18" />}
      {direction === "down" && <polyline points="6 9 12 15 18 9" />}
    </svg>
  );
}

function RolesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <line x1="19" y1="8" x2="21" y2="10" />
      <line x1="21" y1="8" x2="19" y2="10" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FuelLogIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function FuelIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 22V8l6-6h6l2 2v2h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2v7" />
      <path d="M3 22h12" />
      <path d="M9 2v6H3" />
      <rect x="6" y="13" width="6" height="5" rx="1" />
    </svg>
  );
}

function TransportationIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function VendorsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
      <circle cx="12" cy="7" r="1" />
    </svg>
  );
}

function ProjectsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

function MaterialsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PermissionsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function RolePermissionsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function DozerLogIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="13" width="14" height="6" rx="1.5" />
      <path d="M16 16h3l3-4V9h-6" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M2 13l4-6h6l2 6" />
    </svg>
  );
}

function VehiclesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h10l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function MonthlySalaryIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

function SalarySetupIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <circle cx="12" cy="15" r="2" />
      <line x1="6" y1="15" x2="8" y2="15" />
      <line x1="16" y1="15" x2="18" y2="15" />
    </svg>
  );
}


function VehicleMaintenanceIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function ProjectDetailsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
      <line x1="14" y1="15" x2="18" y2="15" />
    </svg>
  );
}

function SalaryDetailIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="2" y1="9" x2="22" y2="9" />
      <line x1="8" y1="3" x2="8" y2="9" />
      <line x1="16" y1="3" x2="16" y2="9" />
      <line x1="6" y1="14" x2="12" y2="14" />
      <line x1="6" y1="18" x2="10" y2="18" />
    </svg>
  );
}

function MaintenancePartsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </svg>
  );
}

function GovernmentOfficeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <rect x="9" y="13" width="6" height="8" />
      <line x1="9" y1="10" x2="9" y2="10.01" />
      <line x1="15" y1="10" x2="15" y2="10.01" />
    </svg>
  );
}
