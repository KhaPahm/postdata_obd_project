// Require lib
const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch')
const chokidar = require('chokidar');
const formdata = require('form-data')
require('dotenv').config();

const port = process.env.PORT || 3000;

const app = express();

// Create folder path of files
const folderPath = path.join(__dirname, 'files');

// Define accessToken as a null string
let accessToken = "";

// Login function with 2 probs username and passsword
async function logIn(userName, password) {
    // Get login url from envaironment variable
    const logInApi = process.env.LOGIN_API;

    // Setup data to post api
    const data = {
        name: userName,
        password: password
    }

    // Call api login to get accesstoken
    await fetch(logInApi, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            // Set accessToken 
            accessToken = data.result.accessToken;
        })
        // If error when call api, it will be log error in terminal
        .catch(err => console.error(err))
} 

// Upload file function with 1 probs is upload's file path
async function uploadFile(filePath) {
    // Get upload file url from envaironment variable
    const uploadApi = process.env.UPLOAD_FILE_API;

    // Create read stream file
    const file = fs.createReadStream(filePath)

    // Create form data to post file
    const fileData = new formdata();
    // Append file data with name 'fileData'
    fileData.append('fileData', file);

    // Call api to upload file
    await fetch(uploadApi, {
        method: 'POST',
        // Set header Authorization is accessToken
        headers: {
            'Authorization': accessToken
        },
        // Set body is formdata
        body: fileData
    })
        .then(res => {
            return res.json();
        })
        .then(data => {
            // If upload file success
            if(data.success) {
                // Remove file
                fs.unlink(filePath, (err) => {
                    if(err) {
                        console.error(err);;
                    }
                })
                // Notify upload file success
                console.log("Upload file success!");
            } else {
                console.log(data.err);
            }
        })
        .catch(err => console.error(err))
}

// Create watcher to monitor changes of floder files
var watcher = chokidar.watch(folderPath, {ignored: /^\./, persistent: true});
watcher
    // If have a new file
    .on('add', async function(folderPath) {
        // Check login
        // If not logged in
        if (!accessToken) {
            const username = process.env.USER_NAME;
            const password = process.env.PASSWORD;
            // Login with username and password get from environment variable
            await logIn(username, password);
        } 
        // Call upload file function
        await uploadFile(folderPath);
    })
    // Catch error
    .on('error', function(error) {console.error('Error happened', error);})

app.listen(port, () => console.log(`Server is running in port: ${port}`));