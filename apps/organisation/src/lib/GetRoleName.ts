export default function GetRoleName(value: number) {
  const Role = {
    Staff: 1,
    FinanceManager: 2,
    EventManager: 3,
    Admin: 4,
    Owner: 5,
  } as const;

  return Object.entries(Role).find(([, v]) => v === value)?.[0] ?? "Unknown";
}
