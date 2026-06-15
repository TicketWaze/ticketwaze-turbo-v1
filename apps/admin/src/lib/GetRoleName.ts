export default function GetRoleName(value: number) {
    const Role = {
        Pending: 0,
        Viewer: 1,
        Support: 2,
        Moderator: 3,
        Admin: 4,
        Owner: 5,
    } as const

    return Object.entries(Role).find(([, v]) => v === value)?.[0] ?? 'Unknown'
}