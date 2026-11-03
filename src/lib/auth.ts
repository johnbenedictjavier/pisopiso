export function buildAuthPassword(email: string, pin: string): string {
  return `PisoPiso-${email.trim().toLowerCase()}-${pin}-access`
}
