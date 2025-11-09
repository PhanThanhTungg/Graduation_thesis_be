const INACTIVE_STATUSES = ['inactive', 'banned'];

export function isUserInactive(status: string): boolean {
  return INACTIVE_STATUSES.includes(status);
}