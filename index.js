const puppeteer = require("puppeteer");
const cors = require('cors');
const im = require('imagemagick');
const Pages = require('./models/Directories.js')
const express = require('express');
var bodyParser = require('body-parser')
const path = require('path');
const app = express();
const Screenshots = require('./models/screenshots.js');

//Import the mongoose module
const mongoose = require('mongoose');
const { hostname } = require("os");


app.use(bodyParser.urlencoded())
// parse application/json
app.use(bodyParser.json())
const port = 3080
app.use(cors());
app.use(express.static('public'));
app.use('/images', express.static('ImageDatabase'));

//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/pageoverlapp';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));


app.get('/api/directory', async (req, res) => {
    const hostnames = await  Pages.find({});
    console.log(hostnames);
    res.status(200).send(hostnames);
})

app.get('/api/directory/:id', async (req, res) => {
    host_query  = req.params.id
    console.log(host_query);
    const results = await   Screenshots.find({hostname:host_query})
    res.status(200);
    res.send(results);
})



app.delete('/api/screenshot/:Id', async (req, res) => {
    const id = req.query.id
    const screenshot = await Screenshot.findById(id);

})

app.post('/api/abovefold', async (req, res) => {
    const { url } = req.body
    let browser = await puppeteer.launch();
    let page = await browser.newPage();
    let date = new Date();
    let day = ("0" + date.getDate()).slice(-2);
    // current month
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    // current year
    let year = date.getFullYear();
    // current hours
    let hours = date.getHours();
    // current minutes
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();


    await page.setViewport({
        width: 1366,
        height: 768,
        deviceScaleFactor: 1
    });

    page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36');
    await page.goto(url);
    const hostname = domain_from_url(page.url());

    await page.waitForTimeout(1200);
    await page.evaluate(() => {
        document.body.style.background = 'transparent';
        header_divs = document.querySelectorAll('div ');
        for (let i = 0; i < header_divs.length; i++) {
            if (header_divs[i].style.backgroundImage.length <= 0) {
                header_divs[i].style.background = 'transparent';
            }
        }
    });
    const screenshot_url = await page.url(); 

    var fs = require('fs');
    var dir = './ImageDatabase/' + hostname;
    var imageName = hostname + "-" + year + "-" + month + "-" + day + "-" + hours + "-" + minutes + "-" + seconds;

    if (!fs.existsSync(dir)) {
        console.log('pathfile does not exists');
        fs.mkdirSync(dir, { recursive: true });
    }

    await page.screenshot({
        path: "./ImageDatabase/" + hostname + "/" + imageName + ".png", fullPage: false,
        omitBackground: true
    });


    // im.convert(["./ImageDatabase/" + hostname + "/" + imageName + ".png", '-resize', '256x120', "./ImageDatabase/" + hostname + "/thumbnails/"  + imageName + ".jpg"], 
    // function(err, stdout){
    //   if (err) throw err;
    //   console.log('stdout:', stdout);
    // });

    // im.resize({
    //     srcPath: "./ImageDatabase/" + hostname + "/" + imageName + ".png",
    //     dstPath: "./ImageDatabase/" + hostname + "/thumbnails" + imageName +  ".jpg",
    //     width: 356,  quality: 1,

    // }, function (err, stdout, stderr) {
    //     if (err) throw err;
    //     console.log('resized kittens.jpg to fit within 256x256px');
    // });

    await browser.close();

    //saving directory info

    let doc_page = await Pages.findOne({ hostname })
    if (!doc_page) {
        const doc_page = new Pages({
            title: "dsdsd",
            url: url,
            type: 'png',
            directory: dir,
            hostname: hostname
        });
        await doc_page.save();
        console.log('directory saved');
    }
    //saving screenshot info
    const screenshot = await new Screenshots({
        title: imageName + ".png",
        url: url,
        hostname: hostname,
        directory: "/images/" + imageName,
        hostname: hostname
    });

    await screenshot.save(function (err) {
        if (err) {
            res.status(500);
            res.send(err);
        }
        res.status(200)
        res.send("/images/" + hostname + "/" + imageName + ".png");
    });



})

function domain_from_url(url) {
    var result
    var match

    if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {
        result = match[1]
        console.log(result)
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
            result = match[0]
            console.log(match[0]);
        }
    }
    return result
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})