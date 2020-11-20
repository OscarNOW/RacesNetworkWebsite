//users/delete
module.exports = {
    async execute(error, end, req, extra, params) {

        let isDiscord = params.isDiscord
        let logInfo1 = params.logInfo1
        let logInfo2 = params.logInfo2
        let deleteUser = params.user

        if ((!isDiscord) || (!logInfo1) || (!logInfo2)) return error(401);

        let verify = await extra.verifyUser(isDiscord, logInfo1, logInfo2)
        if (!verify.loggedIn) return error(401);
        let user = verify.user

        if (!((user == deleteUser) || (extra.roles[extra.users[deleteUser].role].permissions.includes('deleteOtherUser')))) return error(401);

        delete extra.users.list[deleteUser]
        for (const [key, val] of Object.entries(extra.messages.list)) {
            if (val.author == deleteUser) {
                delete extra.messages.list[key]
            }
        }

        extra.update();

        end()

    }
}