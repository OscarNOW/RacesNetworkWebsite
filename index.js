const url = require('./settings.json').generic.websiteUrl

const http = require('http');
const fs = require('fs');
var mime = require('mime-types')
let jimp = require('jimp')
let formidable = require('formidable');

const fetch = require('node-fetch');

var messages = require('./files/data/messages.json')
var users = require('./files/data/users.json');
let nodemailer = require('nodemailer');

let discordOauth = require('./settings.json').oauth.discord
let client_id = discordOauth.client_id
let client_secret = discordOauth.client_secret
let discordRedirect = `http://${url}/login/redirect/discord`

const emailVerifications = {
    VerifiedEmails: [],
    waitingEmails: [],
    codes: {},
    emails: {}
}

let accountsNotOnDiscord = []

let sameErrors = {};
evalErrors()

let botPassword;

//#region Roles
let roles = require('./settings.json').forum.roles
//#endregion
//#region owf(data)
class Sha256 {

    /**
     * Generates SHA-256 hash of string.
     *
     * @param   {string} msg - (Unicode) string to be hashed.
     * @param   {Object} [options]
     * @param   {string} [options.msgFormat=string] - Message format: 'string' for JavaScript string
     *   (gets converted to UTF-8 for hashing); 'hex-bytes' for string of hex bytes ('616263' ≡ 'abc') .
     * @param   {string} [options.outFormat=hex] - Output format: 'hex' for string of contiguous
     *   hex bytes; 'hex-w' for grouping hex bytes into groups of (4 byte / 8 character) words.
     * @returns {string} Hash of msg as hex character string.
     *
     * @example
     *   import Sha256 from './sha256.js';
     *   const hash = Sha256.hash('abc'); // 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
     */
    static hash(msg, options) {
        const defaults = { msgFormat: 'string', outFormat: 'hex' };
        const opt = Object.assign(defaults, options);

        // note use throughout this routine of 'n >>> 0' to coerce Number 'n' to unsigned 32-bit integer

        switch (opt.msgFormat) {
            default: // default is to convert string to UTF-8, as SHA only deals with byte-streams
            case 'string': msg = utf8Encode(msg); break;
            case 'hex-bytes': msg = hexBytesToString(msg); break; // mostly for running tests
        }

        // constants [§4.2.2]
        const K = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

        // initial hash value [§5.3.3]
        const H = [
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

        // PREPROCESSING [§6.2.1]

        msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

        // convert string msg into 512-bit blocks (array of 16 32-bit integers) [§5.2.1]
        const l = msg.length / 4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
        const N = Math.ceil(l / 16);  // number of 16-integer (512-bit) blocks required to hold 'l' ints
        const M = new Array(N);     // message M is N×16 array of 32-bit integers

        for (let i = 0; i < N; i++) {
            M[i] = new Array(16);
            for (let j = 0; j < 16; j++) { // encode 4 chars per integer (64 per block), big-endian encoding
                M[i][j] = (msg.charCodeAt(i * 64 + j * 4 + 0) << 24) | (msg.charCodeAt(i * 64 + j * 4 + 1) << 16)
                    | (msg.charCodeAt(i * 64 + j * 4 + 2) << 8) | (msg.charCodeAt(i * 64 + j * 4 + 3) << 0);
            } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
        }
        // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
        // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
        // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
        const lenHi = ((msg.length - 1) * 8) / Math.pow(2, 32);
        const lenLo = ((msg.length - 1) * 8) >>> 0;
        M[N - 1][14] = Math.floor(lenHi);
        M[N - 1][15] = lenLo;


        // HASH COMPUTATION [§6.2.2]

        for (let i = 0; i < N; i++) {
            const W = new Array(64);

            // 1 - prepare message schedule 'W'
            for (let t = 0; t < 16; t++) W[t] = M[i][t];
            for (let t = 16; t < 64; t++) {
                W[t] = (Sha256.σ1(W[t - 2]) + W[t - 7] + Sha256.σ0(W[t - 15]) + W[t - 16]) >>> 0;
            }

            // 2 - initialise working variables a, b, c, d, e, f, g, h with previous hash value
            let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];

            // 3 - main loop (note '>>> 0' for 'addition modulo 2^32')
            for (let t = 0; t < 64; t++) {
                const T1 = h + Sha256.Σ1(e) + Sha256.Ch(e, f, g) + K[t] + W[t];
                const T2 = Sha256.Σ0(a) + Sha256.Maj(a, b, c);
                h = g;
                g = f;
                f = e;
                e = (d + T1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (T1 + T2) >>> 0;
            }

            // 4 - compute the new intermediate hash value (note '>>> 0' for 'addition modulo 2^32')
            H[0] = (H[0] + a) >>> 0;
            H[1] = (H[1] + b) >>> 0;
            H[2] = (H[2] + c) >>> 0;
            H[3] = (H[3] + d) >>> 0;
            H[4] = (H[4] + e) >>> 0;
            H[5] = (H[5] + f) >>> 0;
            H[6] = (H[6] + g) >>> 0;
            H[7] = (H[7] + h) >>> 0;
        }

        // convert H0..H7 to hex strings (with leading zeros)
        for (let h = 0; h < H.length; h++) H[h] = ('00000000' + H[h].toString(16)).slice(-8);

        // concatenate H0..H7, with separator if required
        const separator = opt.outFormat == 'hex-w' ? ' ' : '';

        return H.join(separator);

        /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

        function utf8Encode(str) {
            try {
                return new TextEncoder().encode(str, 'utf-8').reduce((prev, curr) => prev + String.fromCharCode(curr), '');
            } catch (e) { // no TextEncoder available?
                return unescape(encodeURIComponent(str)); // monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
            }
        }

        function hexBytesToString(hexStr) { // convert string of hex numbers to a string of chars (eg '616263' -> 'abc').
            const str = hexStr.replace(' ', ''); // allow space-separated groups
            return str == '' ? '' : str.match(/.{2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
        }
    }



    /**
     * Rotates right (circular right shift) value x by n positions [§3.2.4].
     * @private
     */
    static ROTR(n, x) {
        return (x >>> n) | (x << (32 - n));
    }


    /**
     * Logical functions [§4.1.2].
     * @private
     */
    static Σ0(x) { return Sha256.ROTR(2, x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); }
    static Σ1(x) { return Sha256.ROTR(6, x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); }
    static σ0(x) { return Sha256.ROTR(7, x) ^ Sha256.ROTR(18, x) ^ (x >>> 3); }
    static σ1(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x >>> 10); }
    static Ch(x, y, z) { return (x & y) ^ (~x & z); }          // 'choice'
    static Maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); } // 'majority'

}

function owf(msg) {
    return Sha256.hash(msg.toLowerCase());
}
//#endregion

//*
let transporter = nodemailer.createTransport({
    host: "smtp.elasticemail.com",
    port: 2525,
    secure: false,
    auth: {
        user: "racesnetworkwebsite@gmail.com",
        pass: "4EE184A21920B71BAEAD5C4423AFAAAD4719"
    }
});
//*/
/*
let transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "d1730901b00068",
        pass: "bf45ef33f868e2"
    }
});
//*/

transporter.verify(function (error, success) {
    if (error) {
        throw error;
    }
});

http.createServer(async function (request, response) {

    let parseError = error => parseErrorRaw(error, response)

    if ((request.connection.encrypted ? true : false)) {
        console.log(`redirecting to http://${url}${request.url}`)
        response.writeHead(308, {
            'Location': `http://${url}${request.url}`
        });
        return response.end();
    }

    try {

        if (request.url.toLowerCase().startsWith('//')) { //Als API call |myAPI|
            let call = remove(request.url, '//')
            let params = {}
            let path = call
            if (path.includes('?')) {
                path.split('?')[1].split('&').forEach(val => {
                    params[val.split('=')[0]] = decodeURIComponent(val.split('=')[1].replace(/\+/g, ' '))
                })
                path = path.split('?')[0]
            }
            path = `./api/${path}.js`
            if (fs.existsSync(path)) {
                let ex = require(path)

                let exists = true;
                try {
                    if (!ex.execute) exists = false;
                } catch {
                    exists = false;
                }
                let msg = `Error: Execute function does not exist in api call\n    at (${path})`
                if (!exists) errorCode(response, 500)
                if (!exists) return console.warn(msg)

                let extra = {
                    roles,
                    messages,
                    users,
                    update,
                    emailVerifications,
                    random,
                    discordLogin,
                    discordRefresh,
                    url,
                    response,
                    owf,
                    botPassword,
                    textToHtml,
                    time,
                    transporter,
                    mime,
                    jimp,
                    formidable,
                    fs,
                    removeHtml,
                    verifyUser,
                    accountsNotOnDiscord,
                    removeFromDiscordPopUp(user) {
                        let index = accountsNotOnDiscord.indexOf(user)
                        if (index == -1) return false;
                        accountsNotOnDiscord.splice(index, 1)
                        return true;
                    }
                }

                if (request.method == 'POST') {
                    let body = ''
                    request.on('data', function (data) {
                        body += data
                    })
                    request.on('end', async function () {
                        let cont = {}
                        body.split('&').forEach((val, index) => {
                            let key = decodeURIComponent(val.split('=')[0].replace(/\+/g, ' '))
                            let value = decodeURIComponent(val.split('=')[1].replace(/\+/g, ' '))
                            cont[key] = decodeURIComponent(value);
                        })
                        params = cont;
                        ex.execute(code => { errorCode(response, code); }, data => { response.end(data) }, request, extra, params, response)
                    })
                } else {
                    ex.execute(code => { errorCode(response, code); }, data => { response.end(data) }, request, extra, params, response)
                }
            } else {
                return errorCode(response, 404)
            }

            return;

        } else { //Als geen API call
            //#region Path eval
            let path = request.url.toLowerCase()
            if (path.includes('?')) path = path.split('?')[0]

            let orgPath = path;
            if (path.split('/')[1] && path.split('/')[2]) {
                if (path.split('/')[1] == path.split('/')[2]) {
                    path = `/${path.split('/').splice(2).join('/')}`
                }
            }
            if (!path.split('/')[path.split('/').length - 1].includes('.')) {
                if (!path.endsWith('/')) path = `${path}/`
                path = `${path}index.html`
            }
            path = `./files${path}`

            if (!fs.existsSync(path)) {
                let newPath = `/${orgPath.split('/').splice(2).join('/')}`
                if (!newPath.split('/')[newPath.split('/').length - 1].includes('.')) {
                    if (!newPath.endsWith('/')) newPath = `${newPath}/`
                    newPath = `${path}index.html`
                }
                newPath = `./files${newPath}`
                if (fs.existsSync(newPath)) path = newPath
            }
            //#endregion
            //#region urlData(key)
            function urlData(k) {
                let key = k;

                if (key == 'messageId') key = 'message'
                if (key == 'userId') key = 'user'

                if (!request.url.toLowerCase().includes('?')) return false;
                if (!request.url.includes(`${key}=`)) return false;

                if (k == 'message') return messages.list[request.url.split(`${key}=`)[1].split('&')[0]];
                if (k == 'user') return users.list[request.url.split(`${key}=`)[1].split('&')[0]];

                return request.url.split(`${key}=`)[1].split('&')[0];
            }
            //#endregion

            if (path == './files/login/redirect/discord/index.html') {
                if (urlData('code')) {

                    let newRandom = random()

                    let url = `https://discord.com/api/oauth2/token`

                    let data = {
                        'client_id': client_id,
                        'client_secret': client_secret,
                        'grant_type': 'authorization_code',
                        'code': urlData('code'),
                        'redirect_uri': discordRedirect,
                        'scope': 'identify email'
                    }
                    let params = _encode(data)
                    let res = await fetch(url,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            body: params
                        });

                    let json = await res.json();

                    let token = json['access_token'];
                    let userJson = await discordLogin(token);
                    let isNew = true;

                    for (const [key, value] of Object.entries(users.list)) {
                        if (!value) continue;
                        if (!(value.discord)) continue;
                        if (value.discord.id == userJson.id) isNew = false;
                    }

                    if (isNew) {
                        let obj = {
                            username: userJson.username,
                            role: "speler",
                            email: userJson.email,
                            password: null,
                            discord: {
                                token: `${userJson.username}#${userJson.discriminator}`,
                                id: userJson.id,
                                lang: userJson.locale
                            }
                        }
                        users.list[newRandom] = obj;
                        update()

                        let profileLink = `https://cdn.discordapp.com/avatars/${userJson.id}/${userJson.avatar}.png`
                        //#region IMAGE CREATION
                        jimp.read(profileLink).then(img => {
                            img.write(`./files/data/usericons/${newRandom}.png`)
                        })
                        //#endregion

                        let url = require('./settings.json').webhooks.discord.communication

                        botPassword = Math.floor(Math.random() * 10000000000)
                        let data = {
                            'content': `{\n    "type": "accountCreation",\n    "info": {\n        "userId": "${userJson.id}",\n        "auth": {\n            "password": "${botPassword}"\n        }\n    }\n}`
                        }
                        let params = _encode(data)
                        let res = await fetch(url,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                },
                                body: params
                            });


                    }

                    fs.readFile('./files/login/setCookie/index.html', function (err, data) {
                        if (err) throw err;
                        let newData = data;

                        let newText = newData.toString('utf-8').replace('|access_token|', json['access_token']).replace('|refresh_token|', json['refresh_token'])
                        newData = Buffer.from(newText, 'utf-8')

                        response.writeHead(200, { 'Content-Type': mime.lookup('.html') });
                        return response.end(newData);

                    })

                    return;
                } else if (urlData('error')) {
                    if (urlData('error').toLowerCase() == 'access_denied') {
                        fs.readFile('./files/login/setCookie/index.html', function (err, data) {
                            if (err) throw err;
                            let newData = data;

                            let newText = newData.toString('utf-8')
                            newData = Buffer.from(newText, 'utf-8')

                            response.writeHead(200, { 'Content-Type': mime.lookup('.html') });
                            return response.end(newData);

                        })
                        return;
                    }
                }
            } else if (path == './files/login/discord/index.html') {
                response.writeHead(308, {
                    'Location': `https://discordapp.com/api/oauth2/authorize?client_id=${client_id}&scope=identify%20email&response_type=code&redirect_uri=${discordRedirect}`
                });
                return response.end();
            } else if (path.startsWith('./files/users/') && (!path.endsWith('./files/users/index.html'))) {
                let user = path.split('./files/users/')[1]
                if (user.endsWith('/index.html')) user = user.split('/index.html')[0]

                response.writeHead(301, {
                    'Location': `/user?user=${user}`
                });
                return response.end();

            } else if (path.startsWith('./files/forum/messages/') && (!path.endsWith('./files/forum/messages/index.html'))) {
                let msg = path.split('./files/forum/messages/')[1]
                if (msg.endsWith('/index.html')) msg = msg.split('/index.html')[0]

                if (!((msg == 'load') || (msg.includes('index')))) {

                    response.writeHead(301, {
                        'Location': `/forum/message?message=${msg}`
                    });
                    return response.end();

                }

            } else if (path == './files/forum/messages/index.html') {
                if (urlData('logInfo1')) {

                    if (!urlData('logInfo1')) return errorCode(response, 401)
                    if (!urlData('logInfo2')) return errorCode(response, 401)
                    if (!urlData('isDiscord')) return errorCode(response, 401)

                    let user;

                    if (urlData('isDiscord')) {
                        let userJson = await discordLogin(urlData('logInfo1'));
                        if (!userJson.id) return errorCode(response, 401)
                        for (const [key, value] of Object.entries(users.list)) {
                            if (!value) continue;
                            if (!(value.discord)) continue;
                            if (value.discord.id = userJson.id) user = key;
                        }
                    } else {
                        user = urlData('logInfo1');
                        if (!(users.list[urlData('logInfo1')])) return errorCode(response, 401)
                        if (!(users.list[urlData('logInfo1')].password == owf(urlData('logInfo2')))) return error(401)
                    }

                } else {
                    response.writeHead(308, {
                        'Location': `http://${url}/forum/messages/load${urlData('filter') ? `?filter=${urlData('filter')}` : ''}`
                    });
                    return response.end();
                }
            } else if (path.startsWith('./files/error/') && path.endsWith('/index.html')) {
                let error = path.split('./files/error/')[1].split('/index.html')[0]
                if (error == 'index.html') error = null;
                if (!error) return errorCode(response, 200);

                return errorCode(response, error)
            }

            if (fs.existsSync(path)) {


                fs.readFile(path, async function (err, data) {
                    if (err) throw err;
                    let newData = data

                    if (path == './files/register/waitemail/index.html') {
                        if (urlData('email')) {
                            let newText = newData.toString('utf-8').replace('|email|', urlData('email'))
                            newData = Buffer.from(newText, 'utf-8')
                        } else {
                            return errorCode(response, 404)
                        }
                        if (urlData('password')) {
                            let newText = newData.toString('utf-8').replace('|password|', urlData('password'))
                            newData = Buffer.from(newText, 'utf-8')
                        }
                        if (urlData('username')) {
                            let newText = newData.toString('utf-8').replace('|username|', urlData('username'))
                            newData = Buffer.from(newText, 'utf-8')
                        }
                        if (urlData('redirect')) {
                            let newText = newData.toString('utf-8').replace('|redirect|', urlData('redirect'))
                            newData = Buffer.from(newText, 'utf-8')
                        }
                    } else if (path == './files/forum/message/index.html') {
                        if (urlData('message')) {

                            let dateText = time(urlData('message').timestamp)

                            let text = textToHtml(urlData('message').text)
                            let userId = urlData('message').author;
                            let newText = newData.toString('utf-8').replace('|message|', text).replace('|user|', userId).replace('|messageId|', urlData('messageId')).replace('|date|', dateText)
                            newData = Buffer.from(newText, 'utf-8')
                        } else {
                            return errorCode(response, 404)
                        }
                        if (urlData('message').parent) {
                            response.writeHead(308, {
                                'Location': `http://${url}/forum/message?message=${urlData('message').parent}&reaction=${urlData('messageId')}`
                            });
                            return response.end()
                        }


                        if (urlData('message').tagg) {
                            let newText = newData.toString('utf-8').replace('|tagg|', urlData('message').tagg)
                            newData = Buffer.from(newText, 'utf-8')
                        }
                    } else if (path == './files/forum/index.html') {
                        if (messages.list[messages.special.forumWelcome]) {
                            let text = textToHtml(messages.list[messages.special.forumWelcome].text)
                            let newText = newData.toString('utf-8').replace('|message|', text)
                            newData = Buffer.from(newText, 'utf-8')
                        }
                    } else if (path == './files/user/index.html') {
                        if (urlData('user')) {

                            let tagg = roles[urlData('user').role];
                            if (!tagg) tagg = '';

                            let newText = newData.toString('utf-8').replace('|user|', urlData('userId')).replace('|username|', urlData('user').username).replace('|role|', urlData('user').role).replace('|tagg|', tagg.tagg).replace('|taggBackground|', tagg.background).replace('|taggColor|', tagg.color)
                            newData = Buffer.from(newText, 'utf-8')
                        }
                        if (urlData('email')) {
                            let newText = newData.toString('utf-8').replace('|email|', urlData('email'))
                            newData = Buffer.from(newText, 'utf-8')
                        } else if (urlData('user')) {
                            let newText = newData.toString('utf-8').replace('|email|', urlData('user').email)
                            newData = Buffer.from(newText, 'utf-8')
                        }
                    } else if (path == './files/user/edit/index.html') {
                        if (urlData('userId')) {
                            let newText = newData.toString('utf-8').replace('|userId|', urlData('userId'))
                            newData = Buffer.from(newText, 'utf-8')
                        }
                    } else if (path == './files/user/edit/org/index.html') {
                        if (urlData('user')) {
                            let newText = newData.toString('utf-8').replace('|avatar|', `/data/usericons/${urlData('userId')}.png`).replace('|role|', urlData('user').role)
                            newData = Buffer.from(newText, 'utf-8')
                        } else {
                            return errorCode(response, 404)
                        }
                    } else if (path == './files/forum/messages/load/index.html') {
                        if (urlData('filter')) {
                            let newText = newData.toString('utf-8').replace('|filter|', urlData('filter'))
                            newData = Buffer.from(newText, 'utf-8')
                        }
                    } else if (path == './files/forum/messages/index.html') {
                        if (urlData('filter')) {
                            let newText = newData.toString('utf-8').replace('|filter|', urlData('filter'))
                            newData = Buffer.from(newText, 'utf-8')
                        }
                    } else if (path == './files/login/index.html') {
                        if (urlData('type')) {
                            let newText = newData.toString('utf-8').replace('|type|', urlData('type'))
                            newData = Buffer.from(newText, 'utf-8')
                        }
                    }

                    if (urlData('redirect')) {
                        let newText = newData.toString('utf-8').replace('|redirect|', urlData('redirect'))
                        newData = Buffer.from(newText, 'utf-8')
                    }

                    response.writeHead(200, { 'Content-Type': mime.lookup(path) });
                    return response.end(newData);
                });

            } else {

                if (path.includes('.html')) {
                    errorCode(response, 404)
                } else {
                    return response.end()
                }
            }
        }

    } catch (err) {
        parseError(err)
    }

}).listen(process.env.PORT || 5000)


//#region remove(string, remove)
function remove(string, remove) {
    return string.split(remove).join('')
}
//#endregion
//#region textToHtml(text)
function textToHtml(text) {
    let oldText = text;
    let newText = oldText;

    //////////////////
    //**VETGEDRUKT**//
    //////////////////
    //#region 
    let isBold = false;
    let ret = false;

    while (true) {
        ret = false;
        let lastCharacter;
        oldText.split('').forEach((val, index) => {
            if (ret) return;
            if (lastCharacter) {
                if ((lastCharacter == '*') && (val == '*')) {

                    isBold = !isBold
                    ret = true;
                    if (isBold) {
                        let arr = newText.split('')
                        arr[index] = '<b>'
                        arr[index - 1] = ''
                        newText = arr.join('')
                    } else {
                        let arr = newText.split('')
                        arr[index] = '</b>'
                        arr[index - 1] = ''
                        newText = arr.join('')
                    }

                }
            }
            lastCharacter = val;
        })
        oldText = newText
        if (!ret) break;
    }
    if (isBold) newText = oldText + '</b>'
    oldText = newText
    /////////////
    //**KLAAR**//
    /////////////
    //#endregion
    /////////////
    //*SCHUIN*//
    ////////////
    //#region 
    let isItalic = false;
    ret = false;

    while (true) {
        ret = false;
        oldText.split('').forEach((val, index) => {
            if (ret) return;
            if (val == '*') {

                isItalic = !isItalic
                ret = true;
                if (isItalic) {
                    let arr = newText.split('')
                    arr[index] = '<i>'
                    newText = arr.join('')
                } else {
                    let arr = newText.split('')
                    arr[index] = '</i>'
                    newText = arr.join('')
                }

            }
            lastCharacter = val;
        })
        oldText = newText
        if (!ret) break;
    }
    if (isItalic) newText = oldText + '</i>'
    oldText = newText
    /////////////
    //**KLAAR**//
    /////////////
    //#endregion
    //////////////
    //~~STREEP~~//
    //////////////
    //#region 
    let isLine = false;
    ret = false;

    while (true) {
        ret = false;
        let lastCharacter;
        oldText.split('').forEach((val, index) => {
            if (ret) return;
            if (lastCharacter) {
                if ((lastCharacter == '~') && (val == '~')) {

                    isLine = !isLine
                    ret = true;
                    if (isLine) {
                        let arr = newText.split('')
                        arr[index] = '<div class="line">'
                        arr[index - 1] = ''
                        newText = arr.join('')
                    } else {
                        let arr = newText.split('')
                        arr[index] = '</div>'
                        arr[index - 1] = ''
                        newText = arr.join('')
                    }

                }
            }
            lastCharacter = val;
        })
        oldText = newText
        if (!ret) break;
    }
    if (isBold) newText = oldText + '</div>'
    oldText = newText
    /////////////
    //**KLAAR**//
    /////////////
    //#endregion
    /////////////////
    //`ACHTERGROND`//
    /////////////////
    //#region 
    let isBackground = false;
    ret = false;

    while (true) {
        ret = false;
        oldText.split('').forEach((val, index) => {
            if (ret) return;
            if (val == '`') {

                isBackground = !isBackground
                ret = true;
                if (isBackground) {
                    let arr = newText.split('')
                    arr[index] = '<div class="background">'
                    newText = arr.join('')
                } else {
                    let arr = newText.split('')
                    arr[index] = '</div>'
                    newText = arr.join('')
                }

            }
            lastCharacter = val;
        })
        oldText = newText
        if (!ret) break;
    }
    if (isBackground) newText = oldText + '</div>'
    oldText = newText
    /////////
    //KLAAR//
    /////////
    //#endregion
    //////////////////////
    //[google.com]{link}//
    //////////////////////
    //#region 
    let isLink = false;
    let isText = 0;
    let link;
    ret = false;

    while (true) {
        ret = false;
        oldText.split('').forEach((val, index) => {
            if (ret) return;

            if (val == '[') {

                isLink = true
                link = '';

                return;

            }

            if (val == ']') {

                if (!isLink) return;

                isLink = false

                return;

            }

            if (val == '{') {

                if (!link) return;

                isText++
                ret = true

                let arr = newText.split('')
                if (!(link.startsWith('http'))) link = `http://${link}`
                arr[index] = `<a href="${link}">`
                newText = arr.join('')

                return;

            }

            if (val == '}') {

                if (!(isText > 0)) return;

                isText--
                ret = true

                let arr = newText.split('')
                arr[index] = `</a>`
                newText = arr.join('')

                return;
            }

            if (isLink) {
                link = link + val
            }

        })
        oldText = newText
        if (!ret) break;
    }
    if (isLink) newText = oldText + '</a>'
    oldText = newText

    isLink = false;
    ret = false;
    while (true) {
        ret = false;
        isLink = false;
        oldText.split('').forEach((val, index) => {
            if (ret) return;

            if (val == '[') {

                isLink = true
                link = '';

                return;

            }

            if (val == ']') {

                if (!isLink) return;
                isLink = false

                newText = newText.replace('[]', '')

                return;

            }

            if (isLink) {

                ret = true;

                let arr = newText.split('')
                arr[index] = ``
                newText = arr.join('')

                return;

            }

        })
        oldText = newText
        if (!ret) break;
    }
    if (isLink) newText = oldText + '</a>'
    oldText = newText

    /////////
    //KLAAR//
    /////////
    //#endregion
    //////
    //\n//
    //////
    //#region 
    ret = false;

    while (true) {
        ret = false;
        oldText.split('').forEach((val, index) => {
            if (ret) return;
            if (val == '\n') {

                ret = true;
                let arr = newText.split('')
                arr[index] = '<br>'
                newText = arr.join('')

            }
        })
        oldText = newText
        if (!ret) break;
    }
    oldText = newText
    //#endregion


    return newText;

}
//#endregion
//#region update()
function update() {
    fs.writeFile('./files/data/messages.json', JSON.stringify(messages, null, 4), () => { })
    fs.writeFile('./files/data/users.json', JSON.stringify(users, null, 4), () => { })
}
//#endregion
//#region errorCode(response, code)
function errorCode(response, code, errorFile) {
    response.writeHead(code, { 'Content-Type': 'text/plain' });
    let text = ``

    let errorMessage = require('./settings.json').generic.httpErrorMessages[(code + "").split('')[0] * 100]
    if (errorMessage) if (errorMessage[code]) text += errorMessage[code]

    let path = './files/error/index.html'

    fs.readFile(path, async function (err, data) {
        if (err) throw err;
        let newData = data

        let newText = newData.toString('utf-8').replace('|errorCode|', code).replace('|errorMessage|', text)
        newData = Buffer.from(newText, 'utf-8')

        if (errorFile) {
            newText = newData.toString('utf-8').replace('|errorFile|', errorFile)
            newData = Buffer.from(newText, 'utf-8')
        }

        response.writeHead(code, { 'Content-Type': mime.lookup(path) });
        return response.end(newData);
    })
}
//#endregion
//#region random()
let char = 'abcdefghijklmnopqrstuvwxyz1234567890' //Alle characters voor username ids en Bericht ids
let length = 5 //De lengte voor username ids en Bericht ids
function random() {
    let chars = char.split('')

    let count = 0;

    let text = '';
    for (let i = 0; i < length; i++) {
        count++
        text = text + chars[Math.floor(((new Date().getDay() / 7) + (new Date().getMinutes() / 59) + (new Date().getSeconds() / 59) + (new Date().getSeconds() / 59) + (new Date().getSeconds() / 59)) / 5 * chars.length / count)];
    }

    return text;
}
//#endregion
//#region _encode(obj)
function _encode(obj) {
    let string = "";

    for (const [key, value] of Object.entries(obj)) {
        if (!value) continue;
        string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }

    return string.substring(1);
}
//#endregion
//#region discordRefresh(refreshToken)
async function discordRefresh(refreshToken) {
    let data = {
        'client_id': client_id,
        'client_secret': client_secret,
        'refresh_token': refreshToken,
        'grant_type': "refresh_token"
    }
    let params = _encode(data)

    let res = await fetch('https://discordapp.com/api/oauth2/token',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

    let userData = await res.json();
    return new Promise(async resolve => {
        await userData;
        resolve(userData)
    })

}
//#endregion
//#region discordLogin(accessToken)
async function discordLogin(token) {
    let userData = await fetch('http://discord.com/api/users/@me',
        {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })

    let userJson = await userData.json()

    return new Promise(async resolve => {
        await userJson;
        resolve(userJson)
    })
}
//#endregion
//#region time(timestamp)
function time(timestamp) {
    let date = new Date(timestamp);
    let currentDate = new Date();

    let dateInfo = {
        minutes: date.getMinutes(),
        hours: date.getHours()
    }

    if ((dateInfo.minutes + '').length == 1) dateInfo.minutes = `0${dateInfo.minutes}`
    if ((dateInfo.hours + '').length == 1) dateInfo.hours = `0${dateInfo.hours}`

    let dateText = '';
    if (date.getHours() == currentDate.getHours() && date.getMinutes() == currentDate.getMinutes() && date.getDate() == currentDate.getDate() && date.getMonth() == currentDate.getMonth() && date.getFullYear() == currentDate.getFullYear()) {
        dateText = 'nu';
    } else if (date.getHours() == currentDate.getHours() && date.getDate() == currentDate.getDate() && date.getMonth() == currentDate.getMonth() && date.getFullYear() == currentDate.getFullYear()) {
        if (currentDate.getMinutes() - date.getMinutes() == 1) {
            dateText = `${currentDate.getMinutes() - date.getMinutes()} minuut geleden`;
        } else {
            dateText = `${currentDate.getMinutes() - date.getMinutes()} minuten geleden`;
        }
    } else if ((date.getDate() == currentDate.getDate()) && (date.getMonth() == currentDate.getMonth()) && (date.getFullYear() == currentDate.getFullYear())) {
        dateText = `vandaag om ${dateInfo.hours}:${dateInfo.minutes}`
    } else if ((date.getDate() == currentDate.getDate() - 1) && (date.getMonth() == currentDate.getMonth()) && (date.getFullYear() == currentDate.getFullYear())) {
        dateText = `gisteren om ${dateInfo.hours}:${dateInfo.minutes}`
    } else if (((currentDate.getDate() - date.getDate()) <= 50 && ((currentDate.getDate() - date.getDate()) < 0)) && date.getMonth() == currentDate.getMonth() && date.getFullYear() == currentDate.getFullYear()) {
        if ((currentDate.getDate() - date.getDate()) == 1) {
            dateText = `${currentDate.getDate() - date.getDate()} dag geleden`
        } else {
            dateText = `${currentDate.getDate() - date.getDate()} dagen geleden`
        }
    } else {
        let month = date.getMonth() + 1;
        if (`${month}`.length == 1) {
            month = `0${month}`
        }
        dateText = `${date.getDate() + 1}-${month}-${date.getFullYear()}`
    }

    return dateText;
}
//#endregion
//#region removeHtml(html)
function removeHtml(string) {
    let newContent = string.split('')
    //let htmlCount = 0;
    string.split('').forEach((val, index) => {
        //if (val == '<') htmlCount++;
        //if (htmlCount < 0) htmlCount = 0

        //if (htmlCount > 0) {
        //    newContent[index] = 'null';
        //}

        if (val == '<') newContent[index] = '&lt'
        if (val == '>') newContent[index] = '&gt'

        //if (val == '>') htmlCount--;
        //if (htmlCount < 0) htmlCount = 0
    })
    return newContent.join('')
}
//#endregion
//#region parseErrorRaw(error object, response)
function parseErrorRaw(error, response) {
    let errorMessage = error.stack
    let fileIsSpecial = true
    let sameFile;

    let files = fs.readdirSync('./errors/')

    if (files[0]) {
        files.forEach(file => {
            let data = fs.readFileSync(`./errors/${file}`)

            let fileContent = data.toString('utf-8');
            if (fileContent.split('\n')[0] == errorMessage.split('\n')[0]) {
                fileIsSpecial = false;
                sameFile = file;
            }
        })
    }

    if (fileIsSpecial) {
        let date = new Date().getTime()
        let path = `./errors/${date}.txt`
        fs.writeFile(path, errorMessage, err => { if (err) throw err; })
        evalErrors(`${date}.txt`)
        errorCode(response, 500, date)

        let url = require('./settings.json').webhooks.discord["dev-meldingen"]

        let data = {
            'content': `<@416613326886273024> Er is een nieuwe server error: **${errorMessage.split(': ')[0]}**. \`(${date})\``
        }
        let params = _encode(data)
        fetch(url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

    } else {
        let path = `./errors/${sameFile}`
        fs.readFile(path, (err, data) => {
            if (err) throw err;
            evalErrors(`${sameFile}`)
            return errorCode(response, 500, sameFile)
        })
    }
}
//#endregion
//#region evalErrors()
function evalErrors(path) {
    return;
    if (path) if ((!sameErrors[path]) && (!(sameErrors[path] == 0))) sameErrors[path] = -1;
    if (path) sameErrors[path]++
    console.clear()
    try {
        fs.readdir('./errors/', (err, files) => {
            if (err) throw err;
            if (files[0]) {
                let message = `Er zijn ${files.length} errors!`
                if (files.length == 1) message = `Er is ${files.length} error!`

                console.warn(message)
                console.log()
                files.forEach(val => {
                    if ((!sameErrors[val]) && (!(sameErrors[val] == 0))) sameErrors[val] = 0
                    console.warn(`./errors/${val}    ${sameErrors[val] + 1}`)
                })
                console.log()
                console.warn(message)
            }
        })
    } catch (err) {
        console.warn(err)
    }
}
//#endregion
//#region verifyUser(isDiscord, logInfo1, logInfo2)
async function verifyUser(isDiscord, logInfo1, logInfo2) {

    return new Promise(async resolve => {

        notLoggedIn = { loggedIn: false };

        if ((!isDiscord) && (!(isDiscord === false))) resolve(notLoggedIn);
        if (!logInfo1) resolve(notLoggedIn);
        if (!logInfo2) resolve(notLoggedIn);

        if (isDiscord == 'false') isDiscord = false
        if (isDiscord == 'true') isDiscord = true

        let user;

        if (isDiscord) {
            let userJson = await discordLogin(logInfo1);
            if (!userJson.id) resolve(notLoggedIn);
            for (const [key, value] of Object.entries(users.list)) {
                if (!value) continue;
                if (!(value.discord)) continue;
                if (value.discord.id = userJson.id) user = key;
            }
        } else {
            user = logInfo1;
            if (!(users.list[logInfo1])) resolve(notLoggedIn);
            if (!(users.list[logInfo1].password == owf(logInfo2))) resolve(notLoggedIn);
        }

        resolve({
            loggedIn: true,
            user: user
        })

    })

}
//#endregion
