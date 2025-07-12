// Unified Role System for MesaRPG
// Resolves inconsistencies between display roles, internal roles, and permissions

export type UserRoleDisplay = "Mestre" | "Jogador"
export type UserRoleInternal = "GM" | "PLAYER" 
export type UserRolePermission = "owner" | "member"

/**
 * Maps display role (UI) to internal role (logic)
 */
export const mapDisplayToInternal = (role: UserRoleDisplay): UserRoleInternal => {
  return role === "Mestre" ? "GM" : "PLAYER"
}

/**
 * Maps internal role to permission level
 */
export const mapInternalToPermission = (role: UserRoleInternal): UserRolePermission => {
  return role === "GM" ? "owner" : "member"
}

/**
 * Maps display role directly to permission level
 */
export const mapDisplayToPermission = (role: UserRoleDisplay): UserRolePermission => {
  return role === "Mestre" ? "owner" : "member"
}

/**
 * Checks if a role represents GM privileges
 */
export const isGMRole = (role: UserRoleDisplay | UserRoleInternal): boolean => {
  return role === "Mestre" || role === "GM"
}

/**
 * Checks if a role represents Player privileges
 */
export const isPlayerRole = (role: UserRoleDisplay | UserRoleInternal): boolean => {
  return role === "Jogador" || role === "PLAYER"
}

/**
 * Converts any role format to display format
 */
export const normalizeToDisplay = (role: string): UserRoleDisplay => {
  if (role === "GM" || role === "Mestre" || role === "owner") {
    return "Mestre"
  }
  return "Jogador"
}

/**
 * Converts any role format to internal format
 */
export const normalizeToInternal = (role: string): UserRoleInternal => {
  if (role === "Mestre" || role === "GM" || role === "owner") {
    return "GM"
  }
  return "PLAYER"
}

/**
 * Role validation utilities
 */
export const RoleValidation = {
  isValidDisplayRole: (role: string): role is UserRoleDisplay => {
    return role === "Mestre" || role === "Jogador"
  },
  
  isValidInternalRole: (role: string): role is UserRoleInternal => {
    return role === "GM" || role === "PLAYER"
  },
  
  isValidPermissionRole: (role: string): role is UserRolePermission => {
    return role === "owner" || role === "member"
  }
}

export default {
  mapDisplayToInternal,
  mapInternalToPermission,
  mapDisplayToPermission,
  isGMRole,
  isPlayerRole,
  normalizeToDisplay,
  normalizeToInternal,
  RoleValidation
}