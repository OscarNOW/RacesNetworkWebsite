function createDiv() {

    currentId++
    elements[currentId] = new element()


    document.getElementById('wrapper').appendChild(elements[currentId].element);
    document.getElementById('overlay').appendChild(elements[currentId].overlay);

}

function onload() {
    createDiv()
    document.addEventListener("wheel", window.parent.wheel, true);
}

//#region Element class
class element {

    constructor() {
        this.xStick = '50' //vw
        this.yStick = '50' //vh

        this.xOffset = '0' //px
        this.yOffset = '0' //px

        this.width = '20' //vw
        this.height = '40' //vh

        this.updateStart()
    }

    update() {
        this.element.style.display = 'inline-block'
        this.overlay.style.display = 'inline-block'

        this.element.id = this.id
        this.overlay.id = this.id

        this.element.style.setProperty('--x-stick', `${this.xStick}vw`);
        this.element.style.setProperty('--y-stick', `${this.yStick}vh`);
        this.overlay.style.setProperty('--x-stick', `${this.xStick}vw`);
        this.overlay.style.setProperty('--y-stick', `${this.yStick}vh`);

        this.element.style.setProperty('--x-offset', `${this.xOffset}px`);
        this.element.style.setProperty('--y-offset', `${this.yOffset}px`);
        this.overlay.style.setProperty('--x-offset', `${this.xOffset}px`);
        this.overlay.style.setProperty('--y-offset', `${this.yOffset}px`);


        this.element.style.setProperty('--width', `${this.width}vw`);
        this.element.style.setProperty('--height', `${this.height}vh`);
        this.overlay.style.setProperty('--width', `${this.width}vw`);
        this.overlay.style.setProperty('--height', `${this.height}vh`);

        this.element.style.width = `var(--width)`
        this.element.style.height = `var(--height)`
        this.overlay.style.width = `var(--width)`
        this.overlay.style.height = `var(--height)`

        this.element.style.zIndex = this.zIndex

    }

    updateStart() {


        this.zIndex = currentId
        this.id = currentId

        this.element = document.createElement('div')
        this.element.classList.add('element')

        this.overlay = document.createElement('div')
        this.overlay.classList.add('overlay')

        this.overlay.onclick = function () {
            selected(this.id)
        }

        this.overlay.style.zIndex = this.zIndex + 10000

        let thi = this;
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        /* otherwise, move the DIV from anywhere inside the DIV:*/
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

            thi.overlay.style.cursor = 'move'
            selected(thi.id)

            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            let vw = window.innerWidth * 0.01
            let vh = window.innerHeight * 0.01

            let xStick = thi.xStick * vw
            let yStick = thi.yStick * vh

            // set the element's new position:
            thi.yOffset = (thi.yOffset + yStick) - pos2
            thi.xOffset = (thi.xOffset + xStick) - pos1

            thi.xOffset = thi.xOffset - xStick;
            thi.yOffset = thi.yOffset - yStick;

            thi.update()

        }

        function closeDragElement() {
            /* stop moving when mouse button is released:*/
            document.onmouseup = null;
            document.onmousemove = null;

            thi.overlay.style.cursor = null

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
    }
}