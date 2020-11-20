//forum/messages/fetch?isDiscord=<>&logInfo1=<>&logInfo2=<>
module.exports = {
    async execute(error, end, req, extra, params) {

        let verified = await extra.verifyUser(params.isDiscord, params.logInfo1, params.logInfo2);
        if (!verified.loggedIn) return error(401)

        let obj = [];
        let messages = [];
        for (const [key, value] of Object.entries(extra.messages.list)) {
            messages.push(key)
        }

        messages.sort((a, b) => {
            return ((extra.messages.list[b].timestamp) - (extra.messages.list[a].timestamp))
        })

        messages.forEach((v) => {
            let val = extra.messages.list[v]
            if (!val.tagg) return;
            if (val.tagg.toLowerCase() == 'melding') return;
            if (val.status == 'closed') return;
            if (params.filter) {
                if (!(val.tagg.toLowerCase() == params.filter.toLowerCase())) return;
            }
            obj.push({
                author: val.author,
                tagg: val.tagg,
                date: extra.time(val.timestamp),
                text: extra.textToHtml(val.text),
                id: v
            })
        })

        if (obj.length > 9) obj.length = 9;

        end(JSON.stringify(obj))
    }
}