export default function GetRoleName(value: number) {
    const Role = {
        CheckIn: 1,
        EventManager: 2,
        Finance: 3,
        Staff: 4,
        Admin: 5
    } as const
    
    return Object.entries(Role).find(([, v]) => v === value)?.[0] ?? 'Unknown'

}