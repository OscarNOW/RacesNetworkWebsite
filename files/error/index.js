function onload() {
    document.getElementById('title').innerText = document.getElementById('errorMessage').innerText
    if (document.getElementById('errorFile').innerText == '|errorFile|') document.getElementById('errorFileWrapper').parentElement.removeChild(document.getElementById('errorFileWrapper'))
}