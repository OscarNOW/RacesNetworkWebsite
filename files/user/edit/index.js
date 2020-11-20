let size = 1;

function onload() {

    document.getElementById('edit').style.setProperty('--size', size)

    document.addEventListener("wheel", wheel, true);

}

function wheel(e) {

    // to make it work on IE or Chrome
    var variation = parseInt(e.deltaY) / 1000;

    size = size - variation;
    if (size < 0.6) size = 0.6

    document.getElementById('edit').style.setProperty('--size', size)

    return false;
}

function updateWindow(Ox, Oy, callback) {

    let vw = window.innerWidth * 0.01
    let vh = window.innerHeight * 0.01

    let width = (100 * vw) * (document.getElementById('edit').style.getPropertyValue('--size'))
    let height = ((100 * vh) * (document.getElementById('edit').style.getPropertyValue('--size')))

    let x = Ox * (window.innerWidth / width)
    let y = Oy * (window.innerHeight / height)

    updateWindowAbsolute(x, y, callback)

}

function updateWindowAbsolute(x, y, callback) {

    document.getElementById('edit').style.left = (document.getElementById('edit').style.left.split('px')[0] - x) + 'px'
    document.getElementById('edit').style.top = (document.getElementById('edit').style.top.split('px')[0] - y) + 'px'

    callback()

}