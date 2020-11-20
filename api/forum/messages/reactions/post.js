//forum/messages/reactions/post
module.exports = {
    async execute(error, end, req, extra, params) {

        if (Object.getOwnPropertyNames(params).length < 5) return error(400)

        let content = params.content
        let parent = params.parent
        let isDiscord = params.isDiscord
        let logInfo1 = params.logInfo1
        let logInfo2 = params.logInfo2
        let changePostStatus = params.changePostStatus

        if (!parent) return error(400)
        if (!extra.messages.list[parent]) return error(400)
        if (extra.messages.list[parent].parent) return error(400)
        if (!changePostStatus) changePostStatus = false;

        let user;
        if (isDiscord == 'true') {
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

        if (!(extra.roles[extra.users.list[user].role].permissions.includes('reactOtherPost') || (user == extra.messages.list[parent].author))) return error(401)
        if ((!extra.messages.list[parent].allowReactions) && (!(user == extra.messages.list[parent].author))) {
            if (!extra.roles[extra.users.list[user].role].permissions.includes('reactOnNonReactable')) return error(401)
            console.log(extra.roles[extra.users.list[user].role].permissionLevel)
            console.log(new Error(extra.roles[extra.messages.list[parent].author.role]))
            if (!(extra.roles[extra.users.list[user].role].permissionLevel > extra.roles[extra.users.list[extra.messages.list[parent].author].role].permissionLevel)) return error(401)
        }

        if (changePostStatus) {
            if (changePostStatus == 'open') {
                if (!(extra.roles[extra.users.list[user].role].permissions.includes('openOtherPost'))) return error(401)
            } else if (changePostStatus == 'closed') {
                if (!(extra.roles[extra.users.list[user].role].permissions.includes('closeOtherPost'))) return error(401)
            } else {
                return error(400)
            }
        }

        content = extra.removeHtml(content)

        let messageId = extra.random();
        while (extra.messages.list[messageId]) {
            messageId = extra.random();
        }

        let obj = {
            author: user,
            text: content,
            parent: parent,
            reactions: null,
            tagg: null,
            timestamp: new Date().getTime(),
            status: null
        }

        extra.messages.list[messageId] = obj;
        extra.messages.list[parent].reactions.push(messageId)

        if (changePostStatus) extra.messages.list[parent].status = changePostStatus;

        extra.update()

        error(200)

    }
}