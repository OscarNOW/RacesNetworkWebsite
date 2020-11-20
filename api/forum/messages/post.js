//forum/messages/post
module.exports = {
    async execute(error, end, req, extra, params) {

        if (Object.getOwnPropertyNames(params).length < 5) return error(400)

        let content = params.content
        let tagg = params.tagg
        let isDiscord = params.isDiscord
        let logInfo1 = params.logInfo1
        let logInfo2 = params.logInfo2
        let allowReactions = true;

        if (!logInfo1) return error(401)
        if (!logInfo2) return error(401)

        tagg = tagg.toLowerCase()

        if (isDiscord == 'false') isDiscord = false;
        if (isDiscord == 'true') isDiscord = true;

        let correctTaggs = [
            'unban',
            'unmute',
            'unwarn',
            'melding'
        ]

        if (!correctTaggs.includes(tagg)) return error(400)
        if (tagg == 'melding') allowReactions = params.allowReactions;

        let user;

        if (isDiscord) {
            let userJson = await extra.discordLogin(logInfo1);
            if (!userJson.id) return error(401)
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

        if (tagg == 'melding') {
            if (!extra.roles[extra.users.list[user].role]) return error(401)
            if (!extra.roles[extra.users.list[user].role].permissions.includes('makeAnnouncement')) return error(401)
        }

        content = extra.removeHtml(content)

        let messageId = extra.random();
        while (extra.messages.list[messageId]) {
            messageId = extra.random();
        }

        if (allowReactions == 'true') allowReactions = true;
        if (allowReactions == 'false') allowReactions = false;

        let obj = {
            author: user,
            text: content,
            parent: null,
            reactions: [],
            tagg: tagg,
            allowReactions: allowReactions,
            timestamp: new Date().getTime(),
            status: 'open'
        }

        extra.messages.list[messageId] = obj;
        extra.update()

        end()

    }
}