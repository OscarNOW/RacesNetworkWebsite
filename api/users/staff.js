//users/staff
module.exports = {
    execute(error, end, req, extra, params) {

        let staffRoles = [
            'bouwer',
            'helper',
            'junior_mod',
            'mod',
            'head_mod',
            'junior_admin',
            'admin',
            'head_admin',
            'event_manager',
            'roleplay_manager',
            'projecten_manager',
            'junior_developer',
            'developer',
            'staff_manager',
            'co_owner',
            'owner'
        ]

        let staffIds = [];
        for (const [key, value] of Object.entries(extra.users.list)) {
            if (!value) continue;
            if (staffRoles.includes(value.role)) {
                staffIds.push(key);
            }
        }

        let staffObjects = [];
        staffIds.forEach(val => {
            staffObjects.push({
                username: extra.users.list[val].username,
                image: `/data/usericons/${val}.png`,
                staffPage: `/user?user=${val}`
            })
        })

        end(JSON.stringify(staffObjects))
    }
}