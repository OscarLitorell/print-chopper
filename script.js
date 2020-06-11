

const canvas = document.getElementById("main-canvas")
const ctx = canvas.getContext("2d")

const sourceImage = document.getElementById("source-image")
const fileInput = document.getElementById("file")
const paperHeightInput = document.getElementById("paper-height")
const paperWidthInput = document.getElementById("paper-width")
const paperMarginInput = document.getElementById("paper-margin")
const imageResolutionInput = document.getElementById("image-resolution")

const download = document.getElementById("download")


// Replace the width and height
function swapPaperDimensions() {
    let height = paperWidthInput.value
    let width = paperHeightInput.value

    paperHeightInput.value = height
    paperWidthInput.value = width
}

// Resize the canvas (mostly called when the window is resized)
function resize() {
    let w = canvas.parentElement.offsetWidth
    let h = canvas.parentElement.offsetHeight

    
    if (sourceImage) {
        let r = Math.min(w / sourceImage.width, h / sourceImage.height)

        canvas.width = sourceImage.width * r
        canvas.height = sourceImage.height * r

        ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height)
    }
}



/**
 * Draw a line on the canvas.
 * @param {number[]} start The start coordinate, with pixels relative to the source image size.
 * @param {number[]} end The end coordinate, with pixels relative to the source image size.
 */
function drawLine(start, end, color="cyan") {
    let ratio = canvas.width / sourceImage.width
    
    // Start and end coordinates but relative to the canvas resolution instead of the source image.
    let canvasStart = start.map(x => x * ratio)
    let canvasEnd = end.map(x => x * ratio)
    
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.moveTo(...canvasStart)
    ctx.lineTo(...canvasEnd)
    ctx.stroke()
}


function drawCanvas() {
    let paperHeight = paperHeightInput.value
    let paperWidth = paperWidthInput.value
    let paperMargin = paperMarginInput.value
    let imageResolution = imageResolutionInput.value
    
    let paperOuterPixelWidth = 0.1 * paperWidth * imageResolution
    let paperOuterPixelHeight = 0.1 * paperHeight * imageResolution
    let marginPixels = 0.1 * paperMargin * imageResolution
    let paperInnerPixelWidth = paperOuterPixelWidth - 2 * marginPixels
    let paperInnerPixelHeight = paperOuterPixelHeight - 2 * marginPixels
    
    let horizontalPapers = Math.ceil(sourceImage.width / paperInnerPixelWidth)
    let verticalPapers = Math.ceil(sourceImage.height / paperInnerPixelHeight)
    
    // Vertical lines
    for (let x = 1; x < horizontalPapers; x++) {
        let lineX = x * paperInnerPixelWidth
        drawLine([lineX, 0], [lineX, sourceImage.height])
    }
    
    // Horizontal lines
    for (let y = 1; y < verticalPapers; y++) {
        let lineY = y * paperInnerPixelHeight
        drawLine([0, lineY], [sourceImage.width, lineY])
    }
    
}

async function canvasToBlob(canvas) {
    if (canvas.toBlob) {
        return new Promise(res => canvas.toBlob(res), "image/png")
        
    } else if (canvas.msToBlob) {
        return canvas.msToBlob()
    }
}


function main() {
    
    let file = fileInput.files[0]
    
    if (!file) {
        alert("Please upload an image")
        return
    }
    
    sourceImage.src = URL.createObjectURL(file)
    
    sourceImage.onload = () => {
        let paperHeight = paperHeightInput.value
        let paperWidth = paperWidthInput.value
        let paperMargin = paperMarginInput.value
        let imageResolution = imageResolutionInput.value
        
        let paperOuterPixelWidth = 0.1 * paperWidth * imageResolution
        let paperOuterPixelHeight = 0.1 * paperHeight * imageResolution
        let marginPixels = 0.1 * paperMargin * imageResolution
        let paperInnerPixelWidth = paperOuterPixelWidth - 2 * marginPixels
        let paperInnerPixelHeight = paperOuterPixelHeight - 2 * marginPixels
        
        let horizontalPapers = Math.ceil(sourceImage.width / paperInnerPixelWidth)
        let verticalPapers = Math.ceil(sourceImage.height / paperInnerPixelHeight)
        
        resize()
        drawCanvas()
        
        
        let hiddenCanvases = document.getElementById("hidden-canvases")
        
        let zip = new JSZip()
        
        let images = []
        
        
        for (let x = 0; x < horizontalPapers; x++) {
            for (let y = 0; y < verticalPapers; y++) {
                
                let newCanvas = document.createElement("canvas")
                newCanvas.width = paperOuterPixelWidth
                newCanvas.height = paperOuterPixelHeight
                
                let newCtx = newCanvas.getContext("2d")
                
                let sx = x * paperInnerPixelWidth
                let sy = y * paperInnerPixelHeight
                
                newCtx.drawImage(sourceImage, sx, sy, paperInnerPixelWidth, paperInnerPixelHeight, marginPixels, marginPixels, paperInnerPixelWidth, paperInnerPixelHeight)
                newCtx.moveTo(marginPixels, marginPixels)
                newCtx.lineTo(marginPixels + paperInnerPixelWidth, marginPixels)
                newCtx.lineTo(marginPixels + paperInnerPixelWidth, marginPixels + paperInnerPixelHeight)
                newCtx.lineTo(marginPixels, marginPixels + paperInnerPixelHeight)
                newCtx.lineTo(marginPixels, marginPixels)
                newCtx.stroke()
                
                hiddenCanvases.appendChild(newCanvas)
                
                let promise = canvasToBlob(newCanvas)
                promise.then(blob => {
                    zip.file(`${x}_${y}.png`, blob)
                })
                images.push(promise)
            }
        }
        
        Promise.all(images).then(() => {
            zip.generateAsync({type: "blob"}).then(zipped => {
                let url = URL.createObjectURL(zipped)
                download.href = url
                download.hidden = false
            })
        })
    }
}


resize()
window.addEventListener("resize", resize)
window.addEventListener("resize", drawCanvas)

