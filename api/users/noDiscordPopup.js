//users/noDiscordPopup
module.exports = {
    async execute(error, end, req, extra, params) {

        let verified = await extra.verifyUser(params.isDiscord, params.logInfo1, params.logInfo2);
        if (!verified.loggedIn) return error(401)

        extra.removeFromDiscordPopUp(verified.user)

        end()
    }
}