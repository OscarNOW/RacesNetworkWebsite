//users/verify?code=<>
module.exports = {
    execute(error, end, req, extra, params) {

        let code = params.code
        let email = extra.emailVerifications.codes[code]
        extra.emailVerifications.codes[code] = null;
        extra.emailVerifications.emails[email] = null;

        if (code && email) {
            extra.emailVerifications.VerifiedEmails.push(email)
            extra.response.writeHead(308, {
                'Location': `http://${extra.url}/data/Verified.png`
            });
        } else {
            extra.response.writeHead(308, {
                'Location': `http://${extra.url}/data/Error.png`
            });
        }

        end()

    }
}