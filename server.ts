const fs = require('fs-extra');
const express = require('express');
const app = express();

const paramRegex = /(.*?)=(.*?)(?:&|$)/g;
const label = {
    add: addLabelFn,
    remove: removeLabelFn,
    list: listFn
};

function addLabelFn(res, name, user) {
    const path = `./labels/${name}.json`;

    fs.pathExists(path, (err, exists) => {
        if(exists) {
            let label = require(path);
            res.send(`A label named ${name} was already submitted by ${label.owner}. Please wait until it's time to vote to show your support.`);
        } else {
            fs.ensureFileSync(path);
            fs.writeJSONSync(path, {
                owner: user
            });
            res.send(`Succesfully added ${name} to the list of names.`);
        }
    });
}

function listFn(res) {
    let listString = `The following labels were added to the list:`;
    fs.readdir('./labels', (err, files) => {
        if(files) {
            files.forEach(file => {
                listString = listString  + `\n-\t${file.replace('.json')}`;
                console.log(file)
            });
            res.send(listString);
        } else {
            res.send('There are currently no names in the list.');
        }
    });
}

function removeLabelFn(res, name, user) {
    const path = `./labels/${name}.json`;

    fs.pathExists(path, (err, exists) => {
        if(exists) {
            let label = require(path);
            if(label.owner !== user) {
                res.send(`The label named ${name} was submitted by ${label.owner}. Please ask this person to remove it.`);
            } else {
                fs.removeSync(path);
                res.send(`The label named ${name} was removed.`);
            }
        } else {
            res.send(`There is no label named ${name} in the list.`);
        }
    });
}

function parseData(data) {
    let m;
    let params = {};

    while ((m = paramRegex.exec(data)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === paramRegex.lastIndex) {
            paramRegex.lastIndex++;
        }
        params[m[1]] = m[2];
    }
    return params;
}

function delegate(res, params) {
    const paramsArray = params.text.split('+');
    switch (params.text.split('+')[0]) {
        case 'add':
            label.add(res, paramsArray[1], params.user_name);
            break;
        case 'remove':
            label.remove(res, paramsArray[1], params.user_name);
            break;
        case 'list':
            label.list(res);
            break;
        default:
            res.send(`No action named ${params.text.split('+')[0]} is available to you at this time.`);
            break;
    }
}

app.post('/names-collector', function (req, res) {
    let bodyStr = '';
    req.on("data",function(chunk){
        bodyStr += chunk.toString();
    });
    req.on("end", function(){
        delegate(res, parseData(bodyStr));
    });
});

app.listen(8080);