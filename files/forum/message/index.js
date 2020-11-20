//#region LoginManager !V1.4!
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
let messages;
let url2 = `http://${window.location.href.split('/')[2]}/data/messages.json`

$.getJSON(url2, data => {
    messages = data;
})

let taggEnabled;
let date;

function getScroll() {
    if (window.pageYOffset != undefined) {
        return {
            x: pageXOffset,
            y: pageYOffset
        };
    } else {
        var sx, sy, d = document,
            r = d.documentElement,
            b = d.body;
        sx = r.scrollLeft || b.scrollLeft || 0;
        sy = r.scrollTop || b.scrollTop || 0;
        return {
            x: sx,
            y: sy
        };
    }
}

let makeup = {
    "b": "**<text>**",
    "i": "*<text>*",
    "s": "~~<text>~~",
    "l": "[<link>]{<text>}",
    "c": "`<text>`"
}

let mX;
let mY;

document.onmousemove = handleMouseMove;
function handleMouseMove(event) {
    var eventDoc, doc, body;

    event = event || window.event; // IE-ism

    // If pageX/Y aren't available and clientX/Y are,
    // calculate pageX/Y - logic taken from jQuery.
    // (This is to support old IE)
    if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = event.clientX +
            (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
            (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY +
            (doc && doc.scrollTop || body && body.scrollTop || 0) -
            (doc && doc.clientTop || body && body.clientTop || 0);
    }

    // Use event.pageX / event.pageY here
    mX = event.pageX;
    mY = event.pageY;
}

async function checkTT(selection) {

    for (let i = 0; i < 10; i++) {
        while (selection.toString().trim().length) {
            await timeout(100)
        }
        showToolTip(false)
        while (!selection.toString().trim().length) {
            await timeout(100)
        }
        showToolTip(selection)
    }

}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showToolTip(selection, force) {
    if (selection && (mouseIsInMakeReactions)) {

        document.getElementById('toolTip').style.display = 'initial'

        if (!(div.mouseIsOver)) {
            document.getElementById('toolTip').style.top = `calc(${mY - getScroll().y}px - 3vmax - 25px)`
            document.getElementById('toolTip').style.left = `calc(${mX}px - 30px)`
        }

    } else {

        if ((div.mouseIsOver) && (!force)) return;

        if (document.getElementById('toolTip')) {

            document.getElementById('toolTip').style.display = 'none'
            document.getElementById('toolTip').style.width = '20vw'
            document.getElementById('box').style.cursor = 'pointer'
            document.getElementById('url').style.display = 'none'
            document.getElementById('urlText').value = ''
            var selections = document.getElementsByClassName("toolTipSelection");
            for (var i = 0; i < selections.length; i++) {
                let selection = selections.item(i)
                selection.style.display = 'unset';
            }

        }
    }
}

function toolTip(click) {
    let clicked = click.toLowerCase()
    if (!clicked) return;

    if (clicked == 'l') {

        selectedText = '';
        selectedText = document.getSelection().toString()

        document.getElementById('toolTip').style.width = '30vw'
        document.getElementById('box').style.cursor = 'text'
        document.getElementById('url').style.display = 'block'
        var selections = document.getElementsByClassName("toolTipSelection");
        for (var i = 0; i < selections.length; i++) {
            let selection = selections.item(i)
            selection.style.display = 'none';
        }

    } else {

        if (!(makeup[clicked])) return;

        let text = document.getSelection().toString()
        if ((document.getSelection().toString().startsWith(makeup[clicked].split('<text>')[0])) && (document.getSelection().toString().endsWith(makeup[clicked].split('<text>')[1]))) {
            text = text.substring(makeup[clicked].split('<text>')[0].split('').length)
            text = text.slice(0, -(makeup[clicked].split('<text>')[0].split('').length));
        } else {
            text = makeup[clicked].replace('<text>', text)
        }

        if (!makeup[clicked]) return;

        if (document.queryCommandSupported('insertText')) {
            document.execCommand(
                'insertText',
                false,
                text
            );
        } else {
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
        }

        showToolTip(false, true)

    }

}

let mouseDown = 0;

let mouseIsInMakeReactions = false;
function onload() {

    resize()

    let tagg = document.getElementById('tagg').className
    if (tagg == '|tagg|') tagg = undefined;
    if (tagg) {
        document.getElementById('taggText').innerText = tagg;
        taggEnabled = true;
    } else {
        document.getElementById('taggElement').parentNode.removeChild(document.getElementById('taggElement'))
        taggEnabled = false;
    }

    let user = document.getElementById('user').className

    document.getElementById('userLink').href = `http://${window.location.href.split('/')[2]}/users/${user}`
    document.getElementById('userIcon').style.backgroundImage = `url(http://${window.location.href.split('/')[2]}/data/usericons/${user}.png)`

    document.fonts.ready.then(resize)

    updateReactionPost()
    document.getElementById('reactionTextarea').oninput = updateReactionPost

    function updateReactionPost() {
        updatePostReactionCount()
        resize()
    }

    div = document.getElementById("box");
    div.mouseIsOver = false;
    div.onmouseover = function () { this.mouseIsOver = true; };
    div.onmouseout = function () { this.mouseIsOver = false; }

    document.getElementById('reactionTextarea').addEventListener("mouseenter", () => mouseIsInMakeReactions = true)
    document.getElementById('reactionTextarea').addEventListener("mouseleave", () => mouseIsInMakeReactions = false)

    document.getElementById('urlText').addEventListener("keyup", function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            if (!selectedText) return;

            let text = makeup['l'].replace('<text>', selectedText).replace('<link>', document.getElementById('urlText').value)

            document.getElementById('reactionTextarea').value = document.getElementById('reactionTextarea').value.replace(selectedText, text)

            showToolTip(false, true)
            selectedText = '';

        }
    });

    document.body.onmousedown = function () { ++mouseDown; }
    document.body.onmouseup = function () { --mouseDown; }
    checkTT(document.getSelection())
    document.getElementById('reactionTextarea').addEventListener("mouseup", () => {
        var selection = document.getSelection();
        if (!selection.toString().trim().length) {

            showToolTip(false)

            checkTT(selection)

        } else {

            showToolTip(selection)

            checkTT(selection)

        }
    })

    updateReactions()

    document.getElementById('closeOrOpenPost').onclick = () => {
        document.getElementById('closeOrOpenPostCheckbox').checked = !document.getElementById('closeOrOpenPostCheckbox').checked
    }
    document.getElementById('closeOrOpenPostCheckbox').onclick = () => {
        document.getElementById('closeOrOpenPostCheckbox').checked = !document.getElementById('closeOrOpenPostCheckbox').checked
    }

    function canNotReact() {
        document.getElementById('noReact').style.display = null;
        document.getElementById('reactionTextarea').parentNode.removeChild(document.getElementById('reactionTextarea'))
        document.getElementById('count').parentNode.removeChild(document.getElementById('count'))
        document.getElementById('postReaction').parentNode.removeChild(document.getElementById('postReaction'))
        document.getElementById('toolTip').parentNode.removeChild(document.getElementById('toolTip'))
        document.getElementById('closeOrOpenPost').parentNode.removeChild(document.getElementById('closeOrOpenPost'))
        return;
    }

    log.callback(() => {
        if ((log.hasPermissionOver('deleteOtherPost', document.getElementById('user').className)) || (log.userId == document.getElementById('user').className)) {
            document.getElementById('deleteButton').style.display = null;
        }
        if (!(log.hasPermission('reactOtherPost') || (document.getElementById('user').className == log.userId))) {
            return canNotReact();
        }
        if (!(messages.list[document.getElementById('messageId').className].allowReactions || (document.getElementById('user').className == log.userId))) {
            if (log.loggedIn) {
                if (!log.hasPermissionOver('reactOnNonReactable', document.getElementById('user').className)) return canNotReact();
            } else {
                return canNotReact();
            }
        }
        if (log.loggedIn) {
            document.getElementById('loginToReact').parentNode.removeChild(document.getElementById('loginToReact'))
        } else {
            document.getElementById('reactionTextarea').parentNode.removeChild(document.getElementById('reactionTextarea'))
            document.getElementById('count').parentNode.removeChild(document.getElementById('count'))
            document.getElementById('postReaction').parentNode.removeChild(document.getElementById('postReaction'))
            document.getElementById('toolTip').parentNode.removeChild(document.getElementById('toolTip'))

            document.getElementById('loginToReact').style.display = null;
        }
        updatePostReactionOpenOrClose()
    })

}

function updatePostReactionCount() {
    document.getElementById('count').innerText = `${document.getElementById('reactionTextarea').value.length}/${document.getElementById('reactionTextarea').maxLength}`
}

function updateReactions() {

    for (let ii = document.getElementById('allReactions').childNodes.length; ii > 0; ii--) {
        document.getElementById('allReactions').childNodes[ii - 1].parentElement.removeChild(document.getElementById('allReactions').childNodes[ii - 1])
    }

    let messageId = document.getElementById('messageId').className
    $.getJSON(`http://${window.location.href.split('/')[2]}//forum/messages/reactions?message=${messageId}`, reactions => {
        if (reactions) {
            /*
            <div>
                <div class="reactionUserIcon"></div>
                <div class="reactionDate">
                    <p>vandaag om 15:00</p>
                </div>
                <p>TEKST</p>
            </div>
            //*/
            reactions.forEach(val => {
                let reaction = document.createElement('div')

                let profilePicture = document.createElement('div')
                profilePicture.classList.add('reactionUserIcon')
                profilePicture.style.backgroundImage = `url(http://${window.location.href.split('/')[2]}/data/usericons/${val.author}.png)`
                reaction.appendChild(profilePicture)

                let reactionText = document.createElement('p')
                reactionText.innerText = val.date

                let reactionDate = document.createElement('div')
                reactionDate.classList.add('reactionDate')
                reactionDate.appendChild(reactionText)
                reaction.appendChild(reactionDate)

                if ((log.hasPermissionOver('deleteOtherReaction', val.author)) || (val.author == log.userId)) {

                    let deletebutton = document.createElement('div')
                    deletebutton.onclick = async function () {
                        this.firstChild.style.cursor = 'wait';
                        document.getElementById('body').style.cursor = 'wait';
                        deleteReaction(val);
                    }

                    let deleteText = document.createElement('div')
                    deleteText.classList.add('deleteImage')

                    let deleteVerticalCenter = document.createElement('div')
                    deleteVerticalCenter.appendChild(deleteText)

                    let innerDelete = document.createElement('div')
                    innerDelete.appendChild(deleteVerticalCenter)
                    deletebutton.appendChild(innerDelete)

                    let delebuttonContainer = document.createElement('div')
                    delebuttonContainer.classList.add('delebuttonContainer')
                    delebuttonContainer.appendChild(deletebutton)
                    reaction.appendChild(delebuttonContainer)

                }

                let text = document.createElement('p')
                text.innerHTML = val.text
                reaction.appendChild(text)
                document.getElementById('allReactions').appendChild(reaction)

            })
        }

        resize()
    });
}

function resize() {
    document.getElementById('userIcon').style.left = `calc(${document.getElementById('message').getBoundingClientRect().left}px - (var(--size) / 2))`
    document.getElementById('userIcon').style.top = `calc(${document.getElementById('message').getBoundingClientRect().top}px - (var(--size) / 2))`

    if (taggEnabled) {
        document.getElementById('taggElement').style.left = `calc(${document.getElementById('userIcon').getBoundingClientRect().right}px + 0.5vw)`
        document.getElementById('taggElement').style.top = `calc(${document.getElementById('message').getBoundingClientRect().top}px - ${document.getElementById('taggElement').offsetHeight / 2}px)`

        document.getElementById('dateElement').style.left = `calc(${document.getElementById('taggElement').getBoundingClientRect().right}px + 1vw)`
    } else {
        document.getElementById('dateElement').style.left = `calc(${document.getElementById('userIcon').getBoundingClientRect().right}px + 1vw)`
    }
    document.getElementById('dateElement').style.top = `calc(${document.getElementById('message').getBoundingClientRect().top}px - ${document.getElementById('dateElement').offsetHeight / 2}px)`

    document.getElementById('deleteButton').style.top = `calc(${document.getElementById('message').getBoundingClientRect().top}px - ${document.getElementById('deleteButton').offsetHeight / 2}px + 2px)`
    document.getElementById('deleteButton').style.left = `calc(${document.getElementById('message').getBoundingClientRect().right}px - ${document.getElementById('deleteButton').offsetWidth / 2}px - 2px)`

    if (document.getElementById('count')) {
        document.getElementById('count').style.left = `calc(${document.getElementById('reactionTextarea').getBoundingClientRect().right}px - ${document.getElementById('count').offsetWidth}px - ${document.getElementById('reactionTextarea').scrollHeight > document.getElementById('reactionTextarea').clientHeight ? 2 : 1}vw)`
        document.getElementById('count').style.top = `calc(${document.getElementById('reactionTextarea').getBoundingClientRect().bottom}px - ${document.getElementById('count').offsetHeight}px - 1vh)`

        document.getElementById('postReaction').style.top = `calc(${document.getElementById('count').getBoundingClientRect().top}px - 2.5vh)`
        document.getElementById('postReaction').style.left = `calc(${document.getElementById('reactionTextarea').getBoundingClientRect().right}px - ${document.getElementById('postReaction').offsetWidth}px - ${document.getElementById('reactionTextarea').scrollHeight > document.getElementById('reactionTextarea').clientHeight ? 2 : 1}vw)`
    }
    if (document.getElementById('closeOrOpenPost')) {
        document.getElementById('closeOrOpenPost').style.left = `calc((90vw + 3px) - ${document.getElementById('closeOrOpenPost').offsetWidth}px - ${document.getElementById('reactionTextarea').scrollHeight > document.getElementById('reactionTextarea').clientHeight ? 2 : 1}vw)`
        document.getElementById('closeOrOpenPost').style.top = `calc(${document.getElementById('reactionTextarea').getBoundingClientRect().top}px + 1vh)`
    }

}

async function post() {

    let conte = document.getElementById('reactionTextarea').value

    if (!document.getElementById('reactionTextarea').value) return;
    document.getElementById('postReaction').style.cursor = 'wait'
    document.getElementById('postReaction').onclick = null

    await timeout(100)

    let data = {
        content: conte,
        parent: document.getElementById('messageId').className,
        isDiscord: log.isDiscord,
        logInfo1: log.logInfo1,
        logInfo2: log.logInfo2
    }
    if (document.getElementById('closeOrOpenPost')) {
        if (document.getElementById('closeOrOpenPostCheckbox').checked) {
            if (messages.list[document.getElementById('messageId').className].status == 'closed') {
                data.changePostStatus = 'open'
            } else {
                data.changePostStatus = 'closed'
            }
        }
    }
    let url = `http://${document.location.href.split('/')[2]}//forum/messages/reactions/post`


    let messageId = random()
    while (messages.list[messageId]) {
        messageId = random();
    }
    $.post(url, data, async (data, status) => {
        await timeout(400)

        document.getElementById('reactionTextarea').value = ''
        updateReactions()
        updatePostReactionCount()
        updatePostReactionOpenOrClose()
        document.getElementById('postReaction').style.cursor = null
        document.getElementById('postReaction').onclick = post
        document.getElementById('closeOrOpenPostCheckbox').checked = false

        await timeout(100)
        window.scrollTo(0, document.body.scrollHeight);

    })

}

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

function beginLoad() {
    log.callback(async () => {
        if (!messages) {
            while (!messages) {
                await timeout(500)
            }
        }
        let allow = ((log.hasPermission('seeOtherPost')) || (log.userId == document.getElementById('user').className) || (messages.list[document.getElementById('messageId').className].tagg == 'melding'))
        if (allow) {
            onload()
            document.getElementById('body').style.overflow = null
            document.getElementById('overlay').parentElement.removeChild(document.getElementById('overlay'))
        } else {
            document.getElementById('else').parentElement.removeChild(document.getElementById('else'))
            document.getElementById('overlayMessage').innerText = 'Je moet inloggen om dit bericht te zien'
            document.getElementById('overlayMessage').style.fontSize = '5vmax'
            document.getElementById('overlay').style.cursor = 'pointer'
            document.getElementById('overlay').onclick = log.login
        }
    })
}

async function updatePostReactionOpenOrClose() {
    messages = null;
    $.getJSON(url2, data => {
        messages = data;
    })

    if (!messages) {
        while (!messages) {
            await timeout(500)
        }
    }
    if (messages.list[document.getElementById('messageId').className].status == 'closed') {
        document.getElementById('closeOrOpenPostText').innerText = 'Post opnieuw openen'
        if (log.hasPermission('openOtherPost')) {
            document.getElementById('closeOrOpenPost').style.display = null;
        }
    } else {
        document.getElementById('closeOrOpenPostText').innerText = 'Post sluiten'
        if (log.hasPermission('closeOtherPost')) {
            document.getElementById('closeOrOpenPost').style.display = null;
        }
    }

    resize()
}

function deleteReaction(reaction) {

    if (!((log.hasPermissionOver('deleteOtherReaction', reaction.author)) || (reaction.author == log.userId))) return false;

    httpGetAsync(`http://${window.location.href.split('/')[2]}//forum/messages/reactions/delete?message=${reaction.id}&isDiscord=${log.isDiscord}&logInfo1=${log.logInfo1}&logInfo2=${log.logInfo2}`, () => {
        updateReactions();
        document.getElementById('body').style.cursor = null;
    })
}

function deletePost() {
    if (!((log.hasPermissionOver('deleteOtherPost', document.getElementById('user').className)) || (log.userId == document.getElementById('user').className))) return false;

    document.getElementById('deleteButton').style.cursor = 'wait'
    document.getElementById('body').style.cursor = 'wait'

    httpGetAsync(`http://${window.location.href.split('/')[2]}//forum/messages/delete?message=${document.getElementById('messageId').className}&isDiscord=${log.isDiscord}&logInfo1=${log.logInfo1}&logInfo2=${log.logInfo2}`, () => {
        document.getElementById('deleteButton').style.cursor = null;
        document.getElementById('body').style.cursor = null;

        window.open(`/forum`, '_self')
    })
}