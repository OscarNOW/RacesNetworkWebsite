//#region LoginManager !V1.5!
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
                document.cookie = `${val}=${getCookie(val)};expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`
            }
        })
        window.location.reload()
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

    changePassword(newPassword) {
        if (!this.loggedIn) return false;
        if (this.isDiscord) return false;
        if (newPassword == '') return false;

        httpGetAsync(`http://${window.location.href.split('/')[2]}//users/change?isDiscord=${this.isDiscord}&logInfo1=${this.logInfo1}&logInfo2=${this.logInfo2}&changeUser=${this.userId}&change=password&value=${newPassword}`, () => {
            document.cookie = `password=${newPassword};path=/`;
            this.logInfo2 = newPassword;
        })
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
let url = `http://${window.location.href.split('/')[2]}/data/usericons/<user>.png`
let role;
let user;
let background;
let color;
let redirect;

function onload() {

    role = document.getElementById('role').className

    background = document.getElementById('taggBackground').className
    color = document.getElementById('taggColor').className

    redirect = document.getElementById('redirect').className;
    if (redirect == '|redirect|') redirect = null;

    if (redirect) {
        document.getElementById('redirectButton').style.display = null;
        document.getElementById('redirectButton').onclick = () => { window.open(redirect, '_self') }

        document.getElementById('redirectText').innerText = window.location.href.split('&redirect=')[1].split('/')[3];
    }

    if ((background == 'null') || (color == 'null') || (document.getElementById('tagg').innerText == 'undefined')) {
        document.getElementById('tagg').parentElement.removeChild(document.getElementById('tagg'))
    } else {
        document.getElementById('tagg').style.backgroundColor = `rgb(${background})`
        document.getElementById('tagg').style.color = `rgb(${color})`
    }

    user = document.getElementById('user').className

    document.getElementById('avatar').style.backgroundImage = `url('${url.replace('<user>', user)}')`

    $('#avatarChooser').change(postUserIcon)

    log.callback(() => {
        if (log.hasPermissionOver('editOtherPage', user) || (log.userId == user)) {
            document.getElementById('editIcon').style.width = null;
            document.getElementById('editIcon').style.height = null;
            document.getElementById('editIcon').style.top = null;
            document.getElementById('editIcon').style.left = null;
        }
        if (log.hasPermissionOver('deleteOtherUser', user) || (log.userId == user)) {
            document.getElementById('deleteIcon').style.width = null;
            document.getElementById('deleteIcon').style.height = null;
            document.getElementById('deleteIcon').style.top = null;
            document.getElementById('deleteIcon').style.left = null;
        }
        let deleteText = document.getElementById('deleteText')
        let replaceText = ''
        if (log.userId == user) {
            replaceText = 'jouw'
        } else {
            replaceText = 'dit'
        }
        deleteText.innerText = deleteText.innerText.replace('[owner]', replaceText)
    })

    updateDeleteOverlay()

}

async function updateDeleteOverlay() {
    await timeout(500)

    document.getElementById('deletePrompt').style.display = null;
}

async function edit() {
    if (!(log.hasPermissionOver('editOtherPage', user) || (log.userId == user))) return;
    document.getElementById('editIcon').style.width = 0;
    document.getElementById('editIcon').style.height = 0;
    document.getElementById('editIcon').style.top = 'var(--user-padding-top)';
    document.getElementById('editIcon').style.left = '95vw';

    document.getElementById('deleteIcon').style.left = 'calc(95vw - 1vmax)';
    document.getElementById('avatarOverlay').style.display = null;

    if ((log.userId == user) && (!log.isDiscord)) {
        document.getElementById('changePassword').style.display = null;
        await timeout(100)
        document.getElementById('changePasswordButton').style.width = '10vw'
    }

    let input;
    let elm;

    if (log.hasPermissionOver('editOtherPage', user)) {
        input = document.createElement('input')
        elm = document.getElementById('tagg')
        elm.innerText = role
        input.type = 'text'
        input.style.height = (window.getComputedStyle(document.getElementById('infoBorder'), null).height.split('px')[0] - 3) + 'px'
        input.style.width = (parseFloat(window.getComputedStyle(elm, null).width.split('px')[0]) + 50) + 'px'
        input.style.backgroundColor = `rgb(${background})`
        input.style.color = `rgb(${color})`
        input.style.padding = 'none'
        input.style.margin = 'none'
        input.style.border = 'none'
        input.style.outline = 'none'
        input.style.fontFamily = 'Roboto'
        input.style.fontSize = '2vmax'
        input.value = role
        input.className = role
        input.onblur = function () {
            if (this.value == this.className) return;
            if (!log.loggedIn) throw new Error('User is not logged in')
            if (roles[this.value]) {

                if (roles[this.value].permissionLevel > roles[log.user.role].permissionLevel) return this.value = this.className

                this.className = this.value
                this.style.backgroundColor = `rgb(${roles[this.value].background})`
                this.style.color = `rgb(${roles[this.value].color})`
                $.post(`http://${window.location.href.split('/')[2]}//users/change`,
                    {
                        isdiscord: log.isDiscord,
                        loginfo1: log.logInfo1,
                        loginfo2: log.logInfo2,
                        changeuser: user,
                        change: 'role',
                        value: this.value
                    },
                    (data, status) => {
                        console.log(status)
                    });
            } else {
                this.value = this.className
            }
        }
        document.getElementById('leftContainer').appendChild(input)
        input.appendChild(elm)
        elm.parentNode.removeChild(elm)
    }

    input = document.createElement('input')
    elm = document.getElementById('username')
    input.type = 'text'
    input.style.height = (window.getComputedStyle(document.getElementById('infoBorder'), null).height.split('px')[0] - 3) + 'px'
    input.style.width = (window.getComputedStyle(elm, null).width.split('px')[0]) + 'px'
    input.autocomplete = 'none'
    input.style.backgroundColor = 'none'
    input.style.padding = 'none'
    input.style.margin = 'none'
    input.style.border = 'none'
    input.style.outline = 'none'
    input.style.fontFamily = 'Roboto'
    input.style.fontSize = '2vmax'
    input.value = elm.innerText
    input.className = elm.innerText;
    input.onblur = function () {
        if (this.value == this.className) return;
        $.post(`http://${window.location.href.split('/')[2]}//users/change`,
            {
                isDiscord: log.isDiscord,
                logInfo1: log.logInfo1,
                logInfo2: log.logInfo2,
                changeUser: user,
                change: 'username',
                value: this.value
            },
            (data, status) => {
                this.className = this.value;
            });
    }
    document.getElementById('leftContainer').appendChild(input)
    input.appendChild(elm)
    elm.parentNode.removeChild(elm)

    //autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"

    input = document.createElement('input')
    elm = document.getElementById('email')
    input.type = 'text'
    input.style.height = (window.getComputedStyle(document.getElementById('infoBorder'), null).height.split('px')[0] - 3) + 'px'
    input.style.width = (window.getComputedStyle(elm, null).width.split('px')[0]) + 'px'
    input.style.backgroundColor = 'none'
    input.style.padding = 'none'
    input.style.margin = 'none'
    input.style.border = 'none'
    input.style.outline = 'none'
    input.style.fontFamily = 'Stint Ultra Expanded'
    input.style.fontSize = '1.8vmax'
    input.value = elm.innerText
    input.className = elm.innerText
    input.onblur = function () {
        if (this.value == this.className) return;
        if (log.userId == user) {
            window.open(`http://${window.location.href.split('/')[2]}/register/waitEmail?email=${this.value}&redirect=${window.location.href}`, '_self')
        } else {
            $.post(`http://${window.location.href.split('/')[2]}//users/change`,
                {
                    isDiscord: log.isDiscord,
                    logInfo1: log.logInfo1,
                    logInfo2: log.logInfo2,
                    changeUser: user,
                    change: 'email',
                    value: this.value
                },
                (data, status) => {
                    this.className = this.value
                });
        }
    }
    document.getElementById('rightContainer').appendChild(input)
    input.appendChild(elm)
    elm.parentNode.removeChild(elm)

}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function editIcon() {
    document.getElementById('avatarChooser').click();
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

async function postUserIcon() {
    //*
    var blobFile = $('#avatarChooser')[0].files[0];
    let img = await toBase64(blobFile);

    let data = `isDiscord=${log.isDiscord}&logInfo1=${log.logInfo1}&logInfo2=${log.logInfo2}&changeUser=${user}&change=${'avatar'}&value=${img}`

    //*
    $.ajax({
        url: `http://${window.location.href.split('/')[2]}//users/change`,
        type: "POST",
        data: data,
        processData: false,
        contentType: false,
        success: async function (response) {
            updateAvatar()
        },
        error: function (jqXHR, textStatus, errorMessage) {
            console.error(errorMessage)
        }
    });
    //*/

}

async function updateAvatar() {

    let newImg = document.createElement('div')
    newImg.style.position = 'fixed'
    newImg.style.left = `${document.getElementById('avatar').getBoundingClientRect().left - 0.5}px`
    newImg.style.top = `${document.getElementById('avatar').getBoundingClientRect().top - 0.5}px`
    newImg.style.width = `${document.getElementById('avatar').offsetWidth + 1}px`
    newImg.style.height = `${document.getElementById('avatar').offsetHeight + 1}px`
    newImg.style.borderRadius = '50%'

    newImg.style.backgroundSize = 'cover'
    newImg.style.backgroundRepeat = 'no-repeat'
    newImg.style.backgroundPosition = 'center'

    newImg.style.zIndex = 11
    newImg.style.backgroundColor = 'white'

    newImg.style.display = 'none'
    newImg.style.opacity = 0
    newImg.style.display = null;
    document.getElementById('body').appendChild(newImg)

    newImg.style.transition = 'opacity 0.5s linear 0s'
    await timeout(100)

    newImg.style.opacity = 1

    await timeout(1000)

    document.getElementById('avatar').style.backgroundImage = `url("http://${window.location.href.split('/')[2]}/data/usericons/w4cz1.png?refresh=${new Date().getTime()}")`
    document.getElementById('avatar').style.opacity = 0
    document.getElementById('avatar').style.zIndex = 12

    await timeout(100)

    document.getElementById('avatar').style.transition = 'opacity 0.5s linear 0s'
    await timeout(100)

    document.getElementById('avatar').style.opacity = 1

    await timeout(500)

    document.getElementById('avatar').style.zIndex = 10

    newImg.parentElement.removeChild(newImg)

}

async function deleteProfileButton() {
    if (!(log.hasPermissionOver('deleteOtherUser', user) || (log.userId == user))) return;
    document.getElementById('deleteIcon').style.zIndex = 9;
    document.getElementById('deleteIcon').style.width = 0;
    document.getElementById('deleteIcon').style.height = 0;
    document.getElementById('deleteIcon').style.top = 'var(--user-padding-top)';
    document.getElementById('deleteIcon').style.left = '95vw';

    document.getElementById('deletePrompt').style.left = null;
    document.getElementById('deletePrompt').style.pointerEvents = null;
}

async function cancelDelete() {
    document.getElementById('deleteIcon').style.transition = 'none';

    document.getElementById('deleteIcon').style.zIndex = null;
    document.getElementById('deleteIcon').style.width = null;
    document.getElementById('deleteIcon').style.height = null;
    document.getElementById('deleteIcon').style.top = null;
    document.getElementById('deleteIcon').style.left = null;

    document.getElementById('deletePrompt').style.left = '-110vw';
    document.getElementById('deletePrompt').style.pointerEvents = 'none';

    await timeout(100)

    document.getElementById('deleteIcon').style.transition = null;
}

function deleteAccount() {
    document.getElementById('deleteText').innerText = 'Laden...'
    document.getElementById('deleteText').style.fontSize = '10vmax'
    document.getElementById('deleteText').style.marginBottom = '0'
    document.getElementById('deleteYes').parentElement.removeChild(document.getElementById('deleteYes'))
    document.getElementById('deleteNo').parentElement.removeChild(document.getElementById('deleteNo'))

    $.post(`http://${window.location.href.split('/')[2]}//users/delete`,
        {
            isDiscord: log.isDiscord,
            logInfo1: log.logInfo1,
            logInfo2: log.logInfo2,
            user: user
        },
        (data, status) => {
            window.open(`http://${window.location.href.split('/')[2]}/forum`)
        });

}

async function editPassword() {
    if (!((log.userId == user) && (!log.isDiscord))) return false;

    document.getElementById('editPasswordPrompt').style.display = null;
    await timeout(100);
    document.getElementById('editPasswordPrompt').style.left = '0'
}

async function changePassword() {
    function returnError(msg) {
        document.getElementById('passwordErrorMessage').innerText = msg;
    }

    if (!log.loggedIn) return returnError('Je moet ingelogd zijn om dit te doen');
    if (log.isDiscord) return returnError('Je moet niet ingelogd zijn met Discord om dit te doen');
    if (document.getElementById('passwordField1').value == '') return returnError('Je moet een wachtwoord invoeren');
    if (document.getElementById('passwordField2').value == '') return returnError('Je moet een wachtwoord invoeren');
    if (!(document.getElementById('passwordField1').value == document.getElementById('passwordField2').value)) return returnError('De twee wachtwoorden zijn niet het zelfde');

    let password = document.getElementById('passwordField2').value
    log.changePassword(password);

    document.getElementById('editPasswordPrompt').style.left = '-150vw'
    await timeout(600);
    document.getElementById('editPasswordPrompt').style.display = null;

    document.getElementById('passwordField1').value = ''
    document.getElementById('passwordField2').value = ''

    returnError('')
}