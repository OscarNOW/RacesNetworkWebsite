//users/sendemail?email=<>
module.exports = {
    execute(error, end, req, extra, params) {

        let email = params.email
        extra.emailVerifications.waitingEmails.push(email)

        let code = Math.random();
        code = Math.floor((code * 10000000000));

        var mailOptions = {
            from: '"RacesNetwork" <racesnetworkwebsite@gmail.com>',
            to: email,
            subject: 'RacesNetwork Email Verificatie',
            text: `Hoi dit is de Email Verificatie. Als je geen afbeelding ziet kan je op deze link gebruiken http://${extra.url}//users/verify?code=${code}.`,
            html: `<img src="http://${extra.url}//users/verify?code=${code}"></img> Hoi dit is de Email Verificatie. Als je geen afbeelding ziet kan je op deze link gebruiken <a href="http://${extra.url}//users/verify?code=${code}">http://${extra.url}//users/verify?code=${code}</a>.`
        };

        async function sendMail() {
            let res = await extra.transporter.sendMail(mailOptions)

            extra.emailVerifications.codes[code] = email
            extra.emailVerifications.emails[email] = code
            extra.emailVerifications.waitingEmails[email] = null;

        }

        sendMail()

    }
}