//users/post
module.exports = {
    execute(error, end, req, extra, params) {

        let email = params.email
        let password = params.password

        if (!email) return error(400)
        if (!password) return error(400)

        if (!(extra.emailVerifications.VerifiedEmails.includes(email))) return error(401)

        let isTaken = false;
        for (const [key, value] of Object.entries(extra.users.list)) {
            if (!value) continue;
            if (value.email == email) isTaken = true;
        }

        if (isTaken) return error(401)

        let id = extra.random();
        while (extra.users.list[id]) {
            id = extra.random();
        }

        let obj = {
            username: params.username ? params.username : email.split('@')[0],
            role: "speler",
            email: email,
            password: extra.owf(password),
            discord: null
        }

        extra.users.list[id] = obj;
        extra.update();

        //#region IMAGE CREATION
        extra.jimp.read('./files/pics/User.png').then(img => {
            img.write(`./files/data/usericons/${id}.png`)
        })
        //#endregion

    }
}