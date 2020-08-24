try { require('jimp') }
catch(e) { return console.log("Jimp is required for this program to work! Type \"npm install jimp\" to install it.") }

const Jimp = require('jimp')
const zlib = require('zlib')
const fs = require('fs')

let directory = fs.readdirSync("./")
let extensions = [".png", ".jpg", ".jpeg", ".bmp"]
let file = directory.find(x => extensions.some(y => x.toLowerCase().endsWith(y)))
if (!file) return console.log("Could not find any image files! Drag a small PNG or JPEG into this folder.")

let data = require('./leveldata.json')
let tiles = {1: 917 , 2: 916, 4: 211, 8: "211,32,2", 16: "211,32,4"}
let gdLevels = process.env.HOME || process.env.USERPROFILE + "/AppData/Local/GeometryDash/CCLocalLevels.dat"

Jimp.read("./" + file).then(async img => {

    let pixels = {1: {}, 2: {}, 4: {}, 8: {}, 16: {}}
    let imageSize = img.bitmap.width * img.bitmap.height

    if (imageSize > 100000) console.log("Heads up - this program is made specifically for pixel art. Large images are not the best idea...")
    console.log(`Scanning ${file} ${imageSize > 10000 ? `(${imageSize} pixels, this may take a ${imageSize > 69420 ? "very very very long time" : "while"})` : ""}`)
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, i) {
        let rgb = [this.bitmap.data[i], this.bitmap.data[i + 1], this.bitmap.data[i + 2], this.bitmap.data[i + 3]]
        if (rgb[3] >= 200) pixels[1][`${x},${y}`] = rgb.slice(0, 3)
    })

    function optimize(obj, distance) {
        let scan = true
        Object.keys(obj).forEach((x, y) => {
            if (!obj[x] || obj[x][3] || !scan) return
            let xy = x.split(",").map(x => +x)
    
            let rightXY = (xy[0]) + "," + (xy[1] + distance)
            let downXY = (xy[0] + distance) + "," + (xy[1])
            let diaXY = (xy[0] + distance) + "," + (xy[1] + distance)
    
            let col = obj[x] || []
            let right = (obj[rightXY] || []).join(" ")
            let down = (obj[downXY] || []).join(" ")
            let dia = (obj[diaXY] || []).join(" ")

            if (col.join(" ") == right && right == down && down == dia) {
                pixels[distance*2][x] = col
                delete obj[x]; delete obj[rightXY]; delete obj[downXY]; delete obj[diaXY]
                scan = false
            }
            else obj[x].push(true)
        })
        return obj
    }

    let pixelCount = Object.keys(pixels[1]).length
    Object.keys(pixels).slice(0, -1).map(x => +x).forEach(i => {
        console.log(`Optimizing image (x${i})`)
        while (Object.keys(pixels[i]).length != Object.keys(optimize(pixels[i], i)).length) pixels[i] = optimize(pixels[i], i)
    })

    function rgb2hsv(r, g, b) {  // thanks absolute
        r = r/255; g = g/255; b = b/255
        let h = 0; let mx = Math.max(r, g, b); let mn = Math.min(r, g, b); let df = mx-mn
        if (mx == mn) h = 0
        else if (mx == r) h = (60 * ((g-b)/df) + 360) % 360
        else if (mx == g) h = (60 * ((b-r)/df) + 120) % 360
        else if (mx == b) h = (60 * ((r-g)/df) + 240) % 360
        return [Math.round(h), mx == 0 ? 0 : df/mx, mx]
    }

    console.log("Converting to GD level...")
    let levelStr = ""
    let objCount = 0
    Object.keys(pixels).map(x => +x).forEach(i => {
        Object.keys(pixels[i]).forEach(y => {
            let pos = y.split(",").map(x => +x)
            let xPos = 300 + (pos[0] * 30 / 4) + (i*3.75)
            let yPos = (200 + (img.bitmap.height * 8)) - (pos[1] * 30 / 4) - (i*3.75)
            let hsv = rgb2hsv(...pixels[i][y])
            levelStr += `1,${tiles[i]},2,${xPos},3,${yPos},21,10,41,1,43,${hsv[0]}a${hsv[1]}a${hsv[2]}a0a0;`
            objCount++
        })
    })

    fs.readFile(gdLevels, 'utf8', function(err, saveData) {

        if (err) return console.log("Error! Could not open or find GD save file")

        if (!saveData.startsWith('<?xml version="1.0"?>')) {
            console.log("Decrypting GD save file...")
            function xor(str, key) {
                str = String(str).split('').map(letter => letter.charCodeAt());
                let res = "";
                for (i = 0; i < str.length; i++) res += String.fromCodePoint(str[i] ^ key);
                return res;
            }
            saveData = xor(saveData, 11)
            saveData = Buffer.from(saveData, 'base64')
            try { saveData = zlib.unzipSync(saveData).toString() }
            catch(e) { return console.log("Error! GD save file seems to be corrupt!\nMaybe try saving a GD level in-game to refresh it?\n") }
        }
        
        console.log("Importing to GD...")
        saveData = saveData.split("<k>_isArr</k><t />")
        saveData[1] = saveData[1].replace(/<k>k_(\d+)<\/k><d><k>kCEK<\/k>/g, function(n) { return "<k>k_" + (Number(n.slice(5).split("<")[0])+1) + "</k><d><k>kCEK</k>" })
        saveData = saveData[0] + "<k>_isArr</k><t />" + data.ham + data.bur + levelStr + data.ger + saveData[1]        
        saveData = saveData.replace("[[NAME]]", file.split(".")[0].replace(/[^a-z|0-9]/gi, "").slice(0, 30)).replace("[[DESC]]", `${file} | ${pixelCount} pixels -> ${objCount} objects`)
        fs.writeFileSync(gdLevels, saveData, 'utf8')
        console.log(`Saved! (${pixelCount} pixels -> ${objCount} objects)`);
    })

})