//users/change
module.exports = {
    async execute(error, end, req, extra, params) {

        if (Object.getOwnPropertyNames(params).length < 6) return error(400)

        let isDiscord = params.isDiscord
        let logInfo1 = params.logInfo1
        let logInfo2 = params.logInfo2
        let changeUser = params.changeUser
        let change = params.change
        let value = params.value

        if (!logInfo1) return error(401)
        if (!logInfo2) return error(401)

        if (isDiscord == 'false') isDiscord = false
        if (isDiscord == 'true') isDiscord = true

        let user;

        if (isDiscord) {
            let userJson = await extra.discordLogin(logInfo1);
            if (!userJson.id) return extra.error(401)
            for (const [key, value] of Object.entries(extra.users.list)) {
                if (!value) continue;
                if (!(value.discord)) continue;
                if (value.discord.id = userJson.id) user = key;
            }
        } else {
            user = logInfo1;
            if (!(extra.users.list[logInfo1])) return error(401)
            if (!(extra.users.list[logInfo1].password == extra.owf(logInfo2))) return error(401)
        }

        //Authentication
        //1. Je bent een hoger level dan de persoon van de info die je probeert te veranderen
        //2. Je verandert je eigen account
        if (!((extra.roles[extra.users.list[user].role].permissionLevel > extra.roles[extra.users.list[changeUser].role].permissionLevel) || (user == changeUser))) return error(401)

    /*  } els*/if (change == 'role') {
            if (!(extra.roles[extra.users.list[user].role].permissionLevel > extra.roles[extra.users.list[changeUser].role].permissionLevel)) return error(401)
            if (!extra.roles[value]) return errorCode(response, 400)

            if (extra.roles[extra.users.list[user].role].permissionLevel < extra.roles[value].permissionLevel) return error(401)

            extra.users.list[changeUser].role = value;
            update()
        } else if (change == 'username') {

            extra.users.list[changeUser].username = extra.removeHtml(value);
            extra.update()

            end();

        } else if (change == 'email') {
            //Als je zelf je mail aanpast moet de mail geverifieerd zijn
            if (!(extra.emailVerifications.VerifiedEmails.includes(value) || (extra.roles[extra.users.list[user].role].permissionLevel > extra.roles[extra.users.list[changeUser].role].permissionLevel))) return error(401)

            extra.users.list[changeUser].email = value;
            extra.update();

            end()
        } else if (change == 'avatar') {

            params.value = params.value.replace(/\s/g, '+')

            let filetype = params.value.split(',')[0].split('/')[1].split(';')[0]
            let base64 = params.value.split(',')[1] + ''

            let tempPath = `./files/data/usericons/tempUserAvatar.${filetype}`

            let bitmap = Buffer.from(base64, 'base64')
            extra.fs.writeFile(tempPath, bitmap, function (err) {
                if (err) throw err;
            })

            //*
            extra.jimp.read(tempPath).then(img => {
                img.write(`./files/data/usericons/${params.changeUser}.png`)

                error(200)
            })
            //*/

        } else if (change == 'password') {
            if (!(user == changeUser)) return error(401);
            if (extra.users.list[user].discord) return error(400);

            let hashedPasword = extra.owf(value);
            extra.users.list[user].password = hashedPasword;
            extra.update();

            end();
        }

    }
}