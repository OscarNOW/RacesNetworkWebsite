let url = `http://${window.location.href.split('/')[2]}/login`
if (getCookie('redirect')) url = getCookie('redirect');

let accessToken;
let refreshToken;

function onload() {
    accessToken = document.getElementById('access_token').className
    if (accessToken == '|access_token|') accessToken = null;
    refreshToken = document.getElementById('refresh_token').className
    if (refreshToken == '|refresh_token|') refreshToken = null;

    if ((!refreshToken) || (!accessToken)) {
        if (getCookie('redirect')) { window.location.replace(`http://${window.location.href.split('/')[2]}/login?redirect=${getCookie('redirect')}`) } else {
            window.location.replace(`http://${window.location.href.split('/')[2]}/login`)
        }
        return;
    }

    document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 7}`;

    if (getCookie('redirect')) document.cookie = `redirect=${getCookie('redirect')}; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/`

    window.open(url, "_self")
    console.log(url)
    document.getElementById('link').href = url

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