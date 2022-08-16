const puppeteer = require("puppeteer");
const cors = require('cors');
const im = require('imagemagick');
const Pages = require('./models/Directories.js')
const express = require('express');
var bodyParser = require('body-parser')
const path = require('path');
const app = express();
const Screenshots = require('./models/screenshots.js');
const fs = require('fs');
const compression = require('compression');

//Import the mongoose module
const mongoose = require('mongoose');


app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
const port = 3080
app.use(cors());
app.use(express.static('public'));
//app.use('/images', express.static('ImageDatabase'));
app.use('/images', express.static(path.join(__dirname, 'ImageDatabase')))
app.use(compression());

//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/pageoverlapp';
//var mongoDB = 'mongodb+srv://jbgranja:mongo1506@cluster0.ndjj8c5.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));


app.get('/api/directory', async (req, res) => {
    const hostnames = await Pages.find({});
    console.log(hostnames);
    res.status(200).send(hostnames);
})

app.get('/api/directory/:id', (req, res) => {
    host_query = req.params.id
    console.log(host_query);
    const results = Screenshots.distinct('pathname', { hostname: host_query }, function (error, results) {
        console.log("distinc works");
        res.status(200);
        res.send(results);
    });

})

app.get('/api/thumbnails', async (req, res) => {
    if (req.query.url) {
        let thumbnails = await Screenshots.find({ url: req.query.url });
        res.status(200);
        res.send(thumbnails);

        req.query.url
    }


    else {
        let thumbnails = await Screenshots.find({ hostname: req.query.hostname, pathname: req.query.pathname });
        res.status(200);
        res.send(thumbnails);
    }

})


app.get('/api/screenshots/:Id', async (req, res) => {
    const id = req.params.Id
    const screenshot = await Screenshots.findById(id);
    res.status(200).send(screenshot)

})

app.delete('/api/screenshots/:Id', async (req, res) => {
    const id = req.params.Id
    const screenshot = await Screenshots.deleteOne({ _id: id });
    res.status(200).send(screenshot)
})

app.post('/api/pageshot', async (req, res) => {
    const { url, type } = req.body
    let browser = await  puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
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
    let fulllPageScreen = false;
    let screenshot_dimensions;
    if (type == "abovefold") {
        screenshot_dimensions = [1280, 768];
        await page.setViewport({
            width: 1280,
            height: 768,
            deviceScaleFactor: 1
        });
    }

    else if (type == "belowfold") {
        screenshot_dimensions = [1280, 1536];
        await page.setViewport({
            width: 1280,
            height: 1536,
            deviceScaleFactor: 1
        });
    }

    else if (type == "fullscreen") {
        fulllPageScreen = true
    }

    else {
        screenshot_dimensions = [1280, 768];
        await page.setViewport({
            width: 1280,
            height: 768,
            deviceScaleFactor: 1
        });
    }


    page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36');
    await page.goto(url);
    const hostname = domain_from_url(page.url());

    await page.waitForTimeout(400);
    await page.evaluate(() => {
        document.body.style.background = 'transparent';
        header_divs = document.querySelectorAll('div');

        document.querySelector('html').style.background = "transparent";
        for (let i = 0; i < header_divs.length; i++) {
            if (header_divs[i].style.backgroundImage.length <= 0) {
                header_divs[i].style.background = 'transparent';
                header_divs[i].style.backgroundColor = 'transparent';
            }
        }
    });



    const screenshot_url = url
    const parsed_url = new URL(screenshot_url)
    const screenshot_pathname = parsed_url.pathname


    const main_dir = './ImageDatabase/' + hostname;
    const thumbnail_main_dir = './ImageDatabase/' + hostname + '/thumbnails';

    var imageName = hostname + "-" + year + "-" + month + "-" + day + "-" + hours + "-" + minutes + "-" + seconds;

    if (!fs.existsSync(main_dir)) {
        console.log('main pathfile does not exists');
        fs.mkdirSync(main_dir, { recursive: true });
    }

    if (!fs.existsSync(thumbnail_main_dir)) {
        console.log('thumbnail pathfile does not exists');
        fs.mkdirSync(thumbnail_main_dir, { recursive: true });
    }

    //Saving JPG Screenshot
    await page.screenshot({
        path: "./ImageDatabase/" + hostname + "/" + imageName + ".jpg", fullPage: fulllPageScreen,
        omitBackground: true
    });


    //Saving Directories Info
    let doc_page = await Pages.findOne({ hostname })
    if (!doc_page) {
        const doc_page = new Pages({
            title: "dsdsd",
            url: url,
            type: 'png',
            directory: main_dir,
            hostname: hostname
        });
        await doc_page.save();
        console.log('directory saved');
    }


    //saving screenshot info
    const screenshot = await new Screenshots({
        title: imageName,
        url: url,
        pathname: screenshot_pathname,
        directory: "/images/" + hostname,
        hostname: hostname,
        dimensions: screenshot_dimensions,
        Screentype: type
    });

    await screenshot.save(function (err) {
        if (err) {
            res.status(500);
            res.send(err);
        }
        res.status(200)
        res.send("/images/" + hostname + "/" + imageName + ".jpg");
    });

    //PNG Screenshot
    await page.screenshot({
        path: "./ImageDatabase/" + hostname + "/" + imageName + ".png", fullPage: fulllPageScreen,
        omitBackground: true
    });

    //Creating Thumbnail
    im.convert(["./ImageDatabase/" + hostname + "/" + imageName + ".jpg", '-resize', '356', "./ImageDatabase/" + hostname + "/thumbnails/" + imageName + ".jpg"],
        function (err, stdout) {
            if (err) throw err;
            console.log('stdout:', stdout);
        });
    await browser.close();
    //saving directory info
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
