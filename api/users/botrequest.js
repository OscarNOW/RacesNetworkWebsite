//users/botrequest
module.exports = {
    execute(error, end, req, extra, params) {

        if (Object.getOwnPropertyNames(params).length < 3) return error(400)

        let id = params.id
        let isOnServer = params.isOnServer
        let password = params.password

        if (!(password == extra.botPassword)) throw (new Error('Bot password is not correct'))

        if (isOnServer === 'false') isOnServer = false;
        if (isOnServer === 'true') isOnServer = true;

        if (isOnServer) {

            for (const [key, value] of Object.entries(extra.users.list)) {
                if (!value) continue;
                if (!(value.discord)) continue;
                if (value.discord.id == id) {
                    extra.users.list[key].role = params.role;
                    extra.update()
                }
            }

        } else {
            let user;

            for (const [key, value] of Object.entries(extra.users.list)) {
                if (!value) continue;
                if (!(value.discord)) continue;
                if (value.discord.id == id) {
                    user = key;
                }
            }

            extra.accountsNotOnDiscord.push(user)
        }

        end()

    }
}