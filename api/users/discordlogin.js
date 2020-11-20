//users/discordlogin?access_token=<>&refresh_token=<>
module.exports = {
    async execute(error, end, req, extra, params) {

        let accessToken = params.access_token
        let refreshToken = params.refresh_token

        if ((!accessToken) || (!refreshToken)) return error(400)

        let login = await extra.discordLogin(accessToken)

        let obj = {
            isLoggedIn: false,
            changeIng: {
                access_token: null,
                refresh_token: null
            },
            id: login.id,
            avatar: `https://cdn.discordapp.com/avatars/${login.id}/${login.avatar}.png`
        }

        let foundUser = false;
        if (login.id) {

            for (const [key, val] of Object.entries(extra.users.list)) {
                if (!val.discord) continue;
                if (val.discord.id == login.id) foundUser = true;
            }

        }

        if (foundUser) {
            obj.isLoggedIn = true;
            obj.changeIng = null;
        } else { //Refreshen
            let refresh = await extra.discordRefresh(refreshToken)
            if (!refresh.access_token) {
                obj.isLoggedIn = false;
                obj.changeIng = null;
            } else {
                obj.isLoggedIn = true;
                obj.changeIng = {
                    access_token: refresh.access_token,
                    refresh_token: refresh.refresh_token
                }
            }
        }

        return end(JSON.stringify(obj))

    }
}