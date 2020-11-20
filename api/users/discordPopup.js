//users/discordPopup
module.exports = {
    execute(error, end, req, extra, params) {

        end(JSON.stringify(extra.accountsNotOnDiscord))

    }
}