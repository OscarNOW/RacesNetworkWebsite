let email;
let password;
let username;
let redirect;
let isSend = false;
let sendEmailUrl = `http://${window.location.href.split('/')[2]}//users/sendEmail?email=<email>`
let checkUrl = `http://${window.location.href.split('/')[2]}//users/isVerified?email=<email>`

let char = 'abcdefghijklmnopqrstuvwxyz1234567890' //Alle characters voor username ids en Bericht ids
let length = 5 //De lengte voor username ids en Bericht ids

//#region LoginManager !V1.3!
try {
    if (!$) throw new Error('No jquery')
} catch {
    throw new Error('No jquery')
}

let users;
let usersUrl = `http://${window.location.href.split('/')[2]}/data/users.json`
$.getJSON(usersUrl, data => {
    users = data;
})

let roles;
let rolesUrl = `http://${window.location.href.split('/')[2]}//users/roles`
$.getJSON(rolesUrl, data => {
    roles = data;
})

class LogInManager {
    constructor() {
        this.loggedIn = false;

        this.logInfo1 = '';
        this.logInfo2 = '';
        this.userId = null;
        this.user = null;
        this.isDiscord = false;

        this.callbackFunction = () => { }
        this.isDoneLoad = false;

        this.Load()
    }
    callback(func) {
        this.callbackFunction = func;
        if (this.isDoneLoad) func(this);
    }
    async Load() {

        let callback = (t) => {

            this.makeDiscordPopup()

            this.isDoneLoad = true;
            this.callbackFunction(t)
        }

        let discordLogin = await this.discordLogin();
        if (discordLogin.isLoggedIn) {
            this.loggedIn = true;

            this.logInfo1 = discordLogin.access_token
            this.logInfo2 = discordLogin.refresh_token
            this.isDiscord = true;

            for (const [key, value] of Object.entries(users.list)) {
                if (!value) continue;
                if (!(value.discord)) continue;
                if (value.discord.id == discordLogin.id) this.userId = key;
            }

            if (this.userId) this.user = users.list[this.userId]

            return callback(this);
        }

        if (!getCookie) return callback(this);

        let user = getCookie('user')
        let password = getCookie('password')

        if (!user) return callback(this);
        if (!password) return callback(this);

        while (!users) {
            await wait(500)
        }

        if (!(users.list[user])) return callback(this);
        if (!(users.list[user].password == owf(password))) return callback(this);

        this.loggedIn = true;

        this.userId = user;
        this.user = users.list[user]
        this.logInfo1 = user;
        this.logInfo2 = password;
        this.isDiscord = false;

        callback(this)
        return;

    }
    checkOnDiscord() {
        return new Promise(resolve => {
            if (!this.loggedIn) resolve(false);
            if (!this.userId) resolve(false);

            let url = `http://${window.location.href.split('/')[2]}//users/discordPopup`
            httpGetAsync(url, text => {
                let json = JSON.parse(text)
                if (json.includes(this.userId)) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            })
        })
    }
    async makeDiscordPopup() {
        if (!this.loggedIn) return false;
        if (!this.isDiscord) return false;
        if (!this.userId) return false;

        let isOnDiscord = await this.checkOnDiscord();
        if (!isOnDiscord) {
            let popupContainer = document.createElement('div');
            popupContainer.id = 'discordOverlay'
            popupContainer.style.position = 'fixed'
            popupContainer.style.left = 0
            popupContainer.style.top = 0
            popupContainer.style.width = '100vw'
            popupContainer.style.height = '100vh'
            popupContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.781)'
            popupContainer.style.zIndex = 110
            popupContainer.style.display = 'flex'
            popupContainer.style.justifyContent = 'space-around'

            popupContainer.innerHTML = `
            
            <div style="width: fit-content; height: 100vh; display: flex; justify-content: space-around; flex-direction: column;">
                <div style="width: 35vw; height: 80vh; background-color: white; border: 3px solid black; border-radius: 100px; display: flex; justify-content: flex-start; flex-direction: column;">
                    <div class="horiCenter" style="display: flex; justify-content: space-around;">
                        <div class="discordPicture" style="background-image: url('/pics/logo.jpg'); background-size: cover; background-repeat: no-repeat; background-position: center; width: 7vmax; height: 7vmax; border-radius: 50%; margin-top: 4vh;"></div>
                    </div>
                    <div class="horiCenter" style="display: flex; justify-content: space-around;">
                        <p style="margin-top: 3vh; font-family: 'Roboto'; font-size: 1.5vmax;">Wil je de RacesNetwork discord joinen?</p>
                    </div>
                    <div class="yesNoBoxContainer" style="width: 100%; height: 40vh; display: flex; justify-content: space-around; flex-direction: column;">
                        <div class="horiCenter" style="display: flex; justify-content: space-around;">
                            <div onclick="log.yesDiscord()" class="discordYesNoBox yesBox" style="width: 8vw; height: 6vh; display: flex; justify-content: space-around; cursor: pointer; user-select: none; border-radius: 10px; background-color: rgb(114, 137, 218);">
                                <div style="width: fit-content; height: 100%; display: flex; justify-content: space-around; flex-direction: column;">
                                    <p style="margin: 0; font-size: 2.5vmax; font-family: 'Roboto';"><b>Ja</b></p>
                                </div>
                            </div>
                        </div>
                        <div class="horiCenter" style="display: flex; justify-content: space-around;">
                            <div class="discordYesNoBox noBox" onclick="log.noDiscord()" style="width: 8vw; height: 6vh; display: flex; justify-content: space-around; cursor: pointer; user-select: none; border-radius: 10px; background-color: rgb(182, 182, 182);">
                                <div style="width: fit-content; height: 100%; display: flex; justify-content: space-around; flex-direction: column;">
                                    <p style="margin: 0; font-size: 2.5vmax; font-family: 'Roboto';">Nee</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            `

            document.getElementById('body').appendChild(popupContainer)
            $("#discordOverlay").click(log.noDiscord).children().click(() => false);

        }
    }

    noDiscord() {
        this.removeDiscordPopup()
        document.getElementById('discordOverlay').parentElement.removeChild(document.getElementById('discordOverlay'))
    }
    yesDiscord() {
        this.removeDiscordPopup()
        document.getElementById('discordOverlay').parentElement.removeChild(document.getElementById('discordOverlay'))
        window.open(`https://discord.gg/6FgPqZe`)
    }

    removeDiscordPopup() {
        if (!log.loggedIn) return false;
        if (!log.isDiscord) return false;
        $.post(`http://${window.location.href.split('/')[2]}//users/noDiscordPopup`,
            {
                isDiscord: log.isDiscord,
                logInfo1: log.logInfo1,
                logInfo2: log.logInfo2
            },
            (data, status) => {
                console.log(status)
            });
    }

    login() {
        let newUrl = `http://${window.location.href.split('/')[2]}/login?redirect=${window.location.href}`
        window.open(newUrl, "_self")
    }
    logout() {
        let delCookieList = [
            'access_token',
            'refresh_token',
            'user',
            'password'
        ]

        delCookieList.forEach(val => {
            if (getCookie(val)) {
                document.cookie = `${val}=;expires=Thu, 01 Jan 1970 00:00:01 GMT`
            }
        })
        location.reload()
    }
    async discordLogin() {

        if (!getCookie) return false;

        let accessToken = getCookie('access_token')
        let refreshToken = getCookie('refresh_token')

        if (!accessToken) return false;
        if (!refreshToken) return false;

        let newUrl = `http://${window.location.href.split('/')[2]}//users/discordLogin?access_token=${accessToken}&refresh_token=${refreshToken}`

        return new Promise(resolve => {
            httpGetAsync(newUrl, text => {
                let json = JSON.parse(text)
                if (json.isChanging) {
                    document.cookie = `access_token=${json.isChanging.access_token}; path=/`;
                    document.cookie = `refresh=${json.isChanging.refresh_token}; path=/`;
                }
                json.access_token = getCookie('access_token')
                json.refresh_token = getCookie('refresh_token')
                resolve(json)
            })
        })

    }

    hasPermissionOver(permission, otherUser) {
        if (!this.loggedIn) return false;
        if (!otherUser) return false
        if (!permission) return false;
        if (!this.user) return false;

        if (!this.hasPermission(permission)) return false
        if (!(this.hasGreaterPermissionLevel(otherUser))) return false;

        return true;

    }

    hasPermission(permission) {
        if (!this.loggedIn) return false;
        if (!permission) return false;
        if (!this.user) return false;

        if (!roles[this.user.role]) return false;
        if (!(roles[this.user.role].permissions.includes(permission))) return false;

        return true;

    }

    hasGreaterPermissionLevel(otherUser) {
        if (!this.loggedIn) return false;
        if (!otherUser) return false;
        if (!this.user) return false;

        if (!(roles[this.user.role].permissionLevel > roles[users.list[otherUser].role].permissionLevel)) return false;

        return true;

    }

}
let log = new LogInManager()
function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
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
//#endregion

function onload() {

    email = document.getElementById('email').className
    if (email == '|email|') throw new Error('Email is undefined')
    password = document.getElementById('password').className
    if (password == '|password|') password = null;
    username = document.getElementById('username').className
    if (username == '|username|') username = null;

    redirect = document.getElementById('redirect').className
    if (redirect == '|redirect|') redirect = null;

    if (redirect) document.getElementById('iframe').src = redirect;
    if (redirect) if (redirect.includes('/user?user=')) document.getElementById('iframe').src = `${redirect}&email=${email}`
    if (redirect) document.getElementById('border').style.border = 'none'
    if (!redirect) document.getElementById('iframe').style.display = 'none'
    if (!redirect) document.getElementById('iframeShade').style.display = 'none'

    sendEmail()

}

async function httpGet(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    await xmlHttp.open("GET", theUrl, true);
    await xmlHttp.send(null);
    callback(await xmlHttp.responseText);
}

function sendEmail() {
    httpGet(sendEmailUrl.replace('<email>', email), () => {
        setTimeout(getStatus, 500)
    })
}

function getStatus() {
    console.log(`http://${window.location.href.split('/')[2]}//users/isVerified?email=${email}`)
    $.getJSON(`http://${window.location.href.split('/')[2]}//users/isVerified?email=${email}`, data => {
        let obj = {
            verified: data.verified,
            isWaiting: data.isWaiting,
            isSend: data.isSend
        }

        if (obj.verified) return verified()
        if (obj.isSend) { send() } else {
            if (!obj.isWaiting) return sendEmail()
        }
        isSend = obj.isSend;

        setTimeout(getStatus, 500)

    })
}

function verified() {

    if (password && username) {
        //*
        let newUrl = `http://${window.location.href.split('/')[2]}//users/post`
        let data = {
            email: email,
            password: password,
            username: username
        }

        let id = random()
        $.post(newUrl, data, (data, status) => { })
        while (users.list[id]) {
            id = random();
        }

        document.cookie = `user=${id}; path=/`;
        document.cookie = `password=${password}; path=/`;

        let url = `http://${window.location.href.split('/')[2]}/users/${id}`

        if (redirect) {
            url = redirect;
        }

        document.location.replace(url);
    } else if (redirect.includes('/user?user=')) {
        $.post(`http://${window.location.href.split('/')[2]}//users/change`,
            {
                isDiscord: log.isDiscord,
                logInfo1: log.logInfo1,
                logInfo2: log.logInfo2,
                changeUser: redirect.split('/user?user=')[1],
                change: 'email',
                value: email
            },
            (data, status) => {
                window.location.replace(`${redirect}&email=${email}`)
            });
    } else {
        throw new Error('Password or Username is undefined')
    }

    //*/

}

function send() {
    if (isSend) return;

    document.getElementById('border').style.display = null
    document.getElementById('body').style.cursor = null
}

//#region random()
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