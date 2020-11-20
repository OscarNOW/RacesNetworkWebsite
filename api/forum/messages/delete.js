//forum/messages/delete?message=<>&isDiscord=<>&logInfo1=<>&logInfo2=<>
module.exports = {
    async execute(error, end, req, extra, params) {

        let verified = await extra.verifyUser(params.isDiscord, params.logInfo1, params.logInfo2);
        if (!verified.loggedIn) return error(401)

        let messageId = params.message

        if (!messageId) return error(400)
        if (!extra.messages.list[messageId]) return error(400)
        if (extra.messages.list[messageId].parent) return error(400)

        if (!((verified.user == extra.messages.list[messageId].author) || (extra.roles[extra.users.list[verified.user].role].permissions.includes('deleteOtherPost')))) return error(401)

        let reactions = extra.messages.list[messageId].reactions
        reactions.forEach(val => {
            delete extra.messages.list[val]
        })

        delete extra.messages.list[messageId]

        extra.update()

        end()

    }
}