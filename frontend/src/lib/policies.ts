// Maps policy names (used in code) to permission names stored in the database.
// These names match exactly the seed data in add_permissions_tables.sql.
export const POLICY_MAP: Record<string, string> = {
  "dashboard.view":        "dashboard.view",

  "users.view":            "users.view",
  "users.add":             "users.add",
  "users.edit":            "users.edit",
  "users.delete":          "users.delete",

  "transportation.view":   "transportation.view",
  "transportation.add":    "transportation.add",
  "transportation.edit":   "transportation.edit",
  "transportation.delete": "transportation.delete",

  "fuel_log.view":         "fuel_log.view",
  "fuel_log.add":          "fuel_log.add",
  "fuel_log.edit":         "fuel_log.edit",
  "fuel_log.delete":       "fuel_log.delete",

  "vehicles.view":         "vehicles.view",
  "vehicles.add":          "vehicles.add",
  "vehicles.edit":         "vehicles.edit",
  "vehicles.delete":       "vehicles.delete",

  "materials.view":        "materials.view",
  "materials.add":         "materials.add",
  "materials.edit":        "materials.edit",
  "materials.delete":      "materials.delete",

  "vendors.view":          "vendors.view",
  "vendors.add":           "vendors.add",
  "vendors.edit":          "vendors.edit",
  "vendors.delete":        "vendors.delete",
  "vendor_management.view": "vendor_management.view",

  "projects.view":         "projects.view",
  "projects.add":          "projects.add",
  "projects.edit":         "projects.edit",
  "projects.delete":       "projects.delete",

  "fuel_types.view":       "fuel_types.view",
  "fuel_types.add":        "fuel_types.add",
  "fuel_types.edit":       "fuel_types.edit",
  "fuel_types.delete":     "fuel_types.delete",

  "roles.view":            "roles.view",
  "roles.add":             "roles.add",
  "roles.edit":            "roles.edit",
  "roles.delete":          "roles.delete",

  "permissions.view":      "permissions.view",
  "permissions.add":       "permissions.add",
  "permissions.edit":      "permissions.edit",
  "permissions.delete":    "permissions.delete",

  "role_permissions.view": "role_permissions.view",
  "role_permissions.edit": "role_permissions.edit",

  "monthly_salary.view":    "monthly_salary.view",
  "monthly_salary.edit":    "monthly_salary.edit",

  "salary_setup.view":      "salary_setup.view",
  "salary_setup.add":       "salary_setup.add",
  "salary_setup.edit":      "salary_setup.edit",
  "salary_setup.delete":    "salary_setup.delete",

  "salary_payment.view":    "salary_payment.view",
  "salary_payment.add":     "salary_payment.add",
  "salary_payment.edit":    "salary_payment.edit",
  "salary_payment.delete":  "salary_payment.delete",

  "salary_detail.view":     "salary_detail.view",

  "extra_expenses.view":   "extra_expenses.view",
  "extra_expenses.add":    "extra_expenses.add",
  "extra_expenses.edit":   "extra_expenses.edit",
  "extra_expenses.delete": "extra_expenses.delete",
  "extra_expenses.verify": "extra_expenses.verify",
};

export type PolicyName = keyof typeof POLICY_MAP;
