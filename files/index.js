//let size = document.getElementById('title').getBoundingClientRect().bottom + 10;
//let pxSize = '' + size + 'px';
//document.getElementById('navbar').style.top = pxSize;

//VAR INIT
//#region 
var dc;


//#endregion

//SETTINGS
//#region 

const dcApi = 'https://discord.com/api/guilds/694492476408463491/widget.json'



//#endregion


window.addEventListener('scroll', function (e) {
    onResize()
})

//JSONP FUNCTION. geen normale json load, want dan een cross-site scripting error
//#region 

var $jsonp = (function () {
    var that = {};

    that.send = function (src, options) {
        var callback_name = options.callbackName || 'callback',
            on_success = options.onSuccess || function () { },
            on_timeout = options.onTimeout || function () { },
            timeout = options.timeout || 10; // sec

        var timeout_trigger = window.setTimeout(function () {
            window[callback_name] = function () { };
            on_timeout();
        }, timeout * 1000);

        window[callback_name] = function (data) {
            window.clearTimeout(timeout_trigger);
            on_success(data);
        }

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = src;

        document.getElementsByTagName('head')[0].appendChild(script);
    }

    return that;
})();

//#endregion

//DC api load
//#region 

function dcLoad() {
    $.getJSON(dcApi, function (data) {
        // JSON result in `data` variable
        dc = data;
        document.getElementById('dcName').innerText = dc.name;

        let motd;
        let motdName;
        let motdImg;


        let spelers;
        let staff;
        let bots;

        //find motd
        dc.channels.forEach(val => {
            if (val.name.startsWith('webhook motd: ')) motd = val.name.split('webhook motd: ')[1]
        })

        //find motd name
        dc.channels.forEach(val => {
            if (val.name.startsWith('webhook motd,name: ')) motdName = val.name.split('webhook motd,name: ')[1]
        })

        //find motd image code
        dc.channels.forEach(val => {
            if (val.name.toLowerCase().startsWith('webhook motd,img: ')) motdImg = 'https://cdn.discordapp.com/avatars/' + val.name.toLowerCase().split('webhook motd,img: ')[1] + '.png?size=2048'
        })


        //find speler channel
        dc.channels.forEach(val => {
            if (val.name.toLowerCase().startsWith('webhook spelers: ')) spelers = val.name.toLowerCase().split('webhook spelers: ')[1]
        })

        //find staff channel
        dc.channels.forEach(val => {
            if (val.name.toLowerCase().startsWith('webhook staff: ')) staff = val.name.toLowerCase().split('webhook staff: ')[1]
        })

        //find bots channel
        dc.channels.forEach(val => {
            if (val.name.toLowerCase().startsWith('webhook bots: ')) bots = val.name.toLowerCase().split('webhook bots: ')[1]
        })

        if ((!spelers) || (!staff) || (!bots)) {
            console.error('Discord widget failed, because "spelers" (' + spelers + '), "staff" (' + staff + ') or "bots" (' + bots + ') is undefined.')

            document.getElementById('dcSpelers').innerText = 'Er is helaas een error ontstaan.';
            document.getElementById('dcStaff').innerText = 'Meld dit zo snel mogelijk aan Oscar (DEV) met dit bericht:';
            document.getElementById('dcBots').innerText = 'Discord widget failed, because "spelers" (' + spelers + '), "staff" (' + staff + ') or "bots" (' + bots + ') is undefined.';

            return document.getElementById('dcMotdDiv').parentNode.removeChild(document.getElementById('dcMotdDiv'));
        }

        if ((!motd) || (!motdName)) {
            return document.getElementById('dcMotdDiv').parentNode.removeChild(document.getElementById('dcMotdDiv'));
        }

        document.getElementById('dcMotd').innerText = '' + motd;
        document.getElementById('dcMotdName').innerText = '' + motdName;
        document.getElementById('dcMotdImg').style.backgroundImage = "url('" + motdImg + "'"

        document.getElementById('dcSpelers').innerText = 'Spelers: ' + spelers;
        document.getElementById('dcStaff').innerText = 'Staff: ' + staff;
        document.getElementById('dcBots').innerText = 'Bots: ' + bots;
    })

        .fail(function () {
            console.error('Discord widget failed, because json load (function from Jquery) error.')

            document.getElementById('dcSpelers').innerText = 'Er is helaas een error ontstaan.';
            document.getElementById('dcStaff').innerText = 'Meld dit zo snel mogelijk aan Oscar (DEV) met dit bericht:';
            document.getElementById('dcBots').innerText = 'Discord widget failed, because json load (function from Jquery) error.';

            return;
            //on error delete widget
        })

}

//#endregion

function onLoad() {
    //*

    dcLoad();

    $('.onlyJS').prop('style', '');
    //$('#navbar').prop('top', '-1000vh');

    $(document).mousemove(function () { onResize() })
    onResize()
}

function onResize() {
    if ((document.getElementById('title').getBoundingClientRect().bottom) > 0) {
        let size = document.getElementById('title').getBoundingClientRect().bottom + 10;
        let pxSize = '' + size + 'px';
        document.getElementById('navbar').style.top = pxSize;
        document.getElementById('navbar').style.opacity = '0.9';
        document.getElementById('navbar').style.backgroundColor = 'rgb(42, 37, 37)';
    } else {
        document.getElementById('navbar').style.top = '10px';
        document.getElementById('navbar').style.backgroundColor = 'rgb(27, 27, 27)';
        if ($("#navbar:hover").length != 0) {
            document.getElementById('navbar').style.opacity = '0.9';
        } else {
            document.getElementById('navbar').style.opacity = '0.65';
        }
    }
}

function openLinkInNewPage(link) {
    window.open(link);
}

function openLinkHere(link) {
    window.open(link, "_self")
}

