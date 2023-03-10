const express = require("express")
const app = express()
const http = require("http").createServer(app)

const compressImages = require("compress-images")
const formidable = require("formidable")

const fileSystem = require("fs")
app.set("view engine", "ejs")
// [other modules]

function formParser(req, res, next) {
    const form = formidable({ multiples: true });

    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        req.files = files
        next()
    });
}

function compressImage(image) {

    fileSystem.readFile(image.filepath, function (error, data) {
        if (error) throw error

        const filePath = "temp-uploads/" + image.originalFilename
        const compressedFilePath = "article-img/"
        const compression = 60

        fileSystem.writeFile(filePath, data, async function (error) {
            if (error) throw error

            compressImages(filePath, compressedFilePath, { compress_force: false, statistic: true, autoupdate: true }, false,
                { jpg: { engine: "mozjpeg", command: ["-quality", compression] } },
                { png: { engine: "pngcrush", command: false } },
                { svg: { engine: "svgo", command: "--multipass" } },
                { gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
                async function (error, completed, statistic) {
                    console.log("-------------")
                    console.log(error)
                    console.log(completed)
                    console.log(statistic)
                    console.log("-------------")

                    fileSystem.unlink(filePath, function (error) {
                        if (error) throw error
                    })
                }
            )
        })

        fileSystem.unlink(image.filepath, function (error) {
            if (error) throw error
        })
    })
}

const port = process.env.PORT || 3000

http.listen(port, function () {
    console.log("Server started running at port: " + port)

    app.post("/compressImage", formParser, function (request, result) {
        let images = request.files.image
        if (images.length > 1) {
            for (const image of images) {
                if (image.size > 0) {
                    if (image.mimetype == "image/png" || image.mimetype == "image/jpeg") {
                        compressImage(image)
                    } else {
                        result.send("Please select an image")
                    }
                } else {
                    result.send("Please select an image")
                }
            }
        } else {
            if (images.size > 0) {
                if (images.mimetype == "image/png" || images.mimetype == "image/jpeg") {
                    compressImage(images)
                } else {
                    result.send("Please select an image")
                }
            } else {
                result.send("Please select an image")
            }
        }
        result.send("File has been compressed and saved.")
    })

    app.get("/", function (request, result) {
        result.render("index")
    })
})