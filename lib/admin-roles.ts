export const adminRoles = new Set([
  "owner",
  "admin",
  "merchandiser",
  "inventory_manager",
  "content_editor"
]);

export function isAdminRole(role: unknown) {
  return typeof role === "string" && adminRoles.has(role);
}

