//forum/messages/reactions?message=<>
module.exports = {
    execute(error, end, req, extra, params) {

        let messageId = params.message
        let message = extra.messages.list[messageId]

        if (!message) return error(404)

        let obj = []
        message.reactions.forEach((val, index) => {
            let msg = extra.messages.list[val]

            obj.push({
                author: msg.author,
                text: extra.textToHtml(msg.text),
                date: extra.time(msg.timestamp),
                id: message.reactions[index]
            })
        })
        extra.response.writeHead(200, { 'Content-Type': extra.mime.lookup('.json') });
        return end(JSON.stringify(obj))

    }
}