//users/isverified?email=<>
module.exports = {
    execute(error, end, req, extra, params) {

        let email = params.email

        let verified = extra.emailVerifications.VerifiedEmails.includes(email)
        let isWaiting = extra.emailVerifications.waitingEmails.includes(email)
        let isSend = verified
        if (extra.emailVerifications.emails[email]) isSend = true;

        //response.writeHead(200, { 'Content-Type': mime.lookup('.json') });
        return end(JSON.stringify({
            verified: verified,
            isWaiting: isWaiting,
            isSend: isSend
        }))

    }
}