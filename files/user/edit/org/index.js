function createDiv() {

    let el = new element()
    el.option('widget', 'userIcon')

    document.getElementById('toolTip').style.display = 'none'

}

let role;
let avatar;

function onload() {
    document.addEventListener("wheel", window.parent.wheel, true);

    if (!window.parent.updateWindow) {
        //window.location.replace('/user/edit')
    }

    role = document.getElementById('role').className
    avatar = document.getElementById('avatar').className

    console.log(role)
    console.log(avatar)

    createDiv()
}

//#region Element class
class element {

    constructor() {
        this.options = {

            x: '50', //vw
            y: '50', //vh

            width: '20', //vw
            height: '40', //vh

            backgroundColor: 'none', //color

            widget: null, // Usericon

        }

        this.updateStart()
    }

    option(opt, value) {
        if (value || value === null) {
            this.options[opt] = value;
            this.update()
        }
        return this.options[opt]
    }

    update() {

        if (this.option('widget')) {
            if (this.option('widget') == 'userIcon') {
                this.element.style.backgroundImage = `url(http://${window.location.href.split('/')[2]}${avatar})`
            }
        } else {
            this.element.style.backgroundImage = null
        }

        this.element.style.backgroundColor = this.options.backgroundColor;
        this.element.style.backgroundImage = this.options.backgroundImage;

        this.element.id = this.id
        this.overlay.id = this.id

        this.element.style.setProperty('--x', `${this.options.x}vw`);
        this.element.style.setProperty('--y', `${this.options.y}vh`);
        this.overlay.style.setProperty('--x', `${this.options.x}vw`);
        this.overlay.style.setProperty('--y', `${this.options.y}vh`);

        let width = this.options.width;
        let height = this.options.height;
        if (this.stickToWidth) width = this.stickToWidth
        if (this.stickToHeight) height = this.stickToHeight

        this.element.style.setProperty('--width', `${width}vw`);
        this.element.style.setProperty('--height', `${height}vh`);
        this.overlay.style.setProperty('--width', `${width}vw`);
        this.overlay.style.setProperty('--height', `${height}vh`);

        this.element.style.zIndex = this.zIndex

    }

    updateStart() {
        currentId++
        elements[currentId] = this

        this.stickToWidth = null;
        this.stickToHeight = null;

        this.zIndex = currentId
        this.id = currentId

        this.element = document.createElement('div')
        this.element.classList.add('element')
        this.element.classList.add('both')

        this.overlay = document.createElement('div')
        this.overlay.classList.add('overlay')
        this.overlay.classList.add('both')

        document.getElementById('wrapper').appendChild(this.element);
        document.getElementById('overlay').appendChild(this.overlay);

        this.overlay.onclick = function () {
            selected(this.id)
        }

        this.overlay.style.zIndex = this.zIndex + 10000

        let thi = this;
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        this.overlay.onmousedown = dragMouseDown;

        function dragMouseDown(e) {

            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {

            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            if (thi.stickToWidth) thi.stickToWidth = null;
            if (thi.stickToHeight) thi.stickToHeight = null;
            thi.overlay.style.cursor = 'move'
            selected(thi.id)

            let vw = window.innerWidth * 0.01
            let vh = window.innerHeight * 0.01

            // set the element's new position:
            thi.options.x = ((thi.options.x * vw) - pos1) / vw
            thi.options.y = ((thi.options.y * vh) - pos2) / vh

            thi.update()

        }

        function closeDragElement() {
            /* stop moving when mouse button is released:*/
            document.onmouseup = null;
            document.onmousemove = null;

            thi.overlay.style.cursor = null

            let rect = thi.element.getBoundingClientRect()
            let width = window.innerWidth;
            let height = window.innerHeight;

            if (rect.left < 0) {
                if (rect.top < 0) {

                    thi.stickToWidth = 50
                    thi.stickToHeight = 50

                    thi.options.x = 0
                    thi.options.y = 0

                } else if (rect.bottom > height) {

                    thi.stickToWidth = 50
                    thi.stickToHeight = 50

                    thi.options.x = 0
                    thi.options.y = 50

                } else {

                    thi.stickToWidth = 50
                    thi.stickToHeight = 100

                    thi.options.x = 0
                    thi.options.y = 0

                }
            } else if (rect.right > width) {
                if (rect.top < 0) {

                    thi.stickToWidth = 50
                    thi.stickToHeight = 50

                    thi.options.x = 50
                    thi.options.y = 0

                } else if (rect.bottom > height) {

                    thi.stickToWidth = 50
                    thi.stickToHeight = 50

                    thi.options.x = 50
                    thi.options.y = 50

                } else {

                    thi.stickToWidth = 50
                    thi.stickToHeight = 100

                    thi.options.x = 50
                    thi.options.y = 0

                }
            } else {
                if (rect.top < 0) {

                    thi.stickToWidth = 100
                    thi.stickToHeight = 100

                    thi.options.x = 0
                    thi.options.y = 0

                } else if (rect.bottom > height) {

                    thi.stickToWidth = 100
                    thi.stickToHeight = 50

                    thi.options.x = 0
                    thi.options.y = 50

                }
            }

            thi.update()

        }


        this.update()

    }

}
//#endregion
//#region Elements object
let selection = null;
let currentId = 0
let elements = {}
//#endregion

function selected(select) {
    if (selection) {
        elements[selection].overlay.style.zIndex = elements[selection].zIndex + 10000
        elements[selection].overlay.style.border = null
        elements[selection].element.style.border = null
    }

    selection = select;

    if (selection) {
        elements[selection].overlay.style.zIndex = 10000000
        elements[selection].overlay.style.border = '2px solid rgb(66, 133, 244)'
        elements[selection].element.style.border = '2px solid rgba(0, 0, 0, 0)'

        let vw = window.innerWidth * 0.01
        let vh = window.innerHeight * 0.01

        document.getElementById('toolTip').style.display = null
        document.getElementById('toolTip').style.left = (parseFloat(elements[selection].overlay.getBoundingClientRect().left) + (parseFloat(elements[selection].element.style.getPropertyValue('--width').split('vw')[0]) * vw) + 10) + 'px'
        document.getElementById('toolTip').style.top = (parseFloat(elements[selection].overlay.getBoundingClientRect().top) + (parseFloat(elements[selection].element.style.getPropertyValue('--height').split('vh')[0]) * vh / 2)) + 'px'
    } else {
        document.getElementById('toolTip').style.display = 'none'
    }
}

function clicked(click) {
    let elmt = elements[selection];
    if (!elmt) return console.log(new Error('Tried to click but none was selected'))

    if (click == 'i') {
        if (elmt.option('widget')) {
            elmt.option('widget', null)
        } else {
            elmt.option('widget', 'userIcon')
        }
    }

    elmt.update()
}

let canUpdate = true;
var p1 = 0, p2 = 0, p3 = 0, p4 = 0;
document.onmousedown = moveMouseDown;

function moveMouseDown(e) {

    if (e.button == 2) {
        document.getElementsByTagName('body')[0].style.cursor = 'grabbing'
        document.getElementById('mouse').style.pointerEvents = 'all'

        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        p3 = e.clientX;
        p4 = e.clientY;
        document.onmouseup = closeMoveElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementMove;

    }
}

function elementMove(e) {

    if (canUpdate) {

        document.getElementById('mouse').style.pointerEvents = 'all'

        canUpdate = false;

        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        p1 = p3 - e.clientX;
        p2 = p4 - e.clientY;

        window.parent.updateWindow(p1, p2, () => {
            canUpdate = true;
        })

    }

}

function closeMoveElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;

    document.getElementsByTagName('body')[0].style.cursor = null
    document.getElementById('mouse').style.pointerEvents = null

}