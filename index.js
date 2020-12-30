const fs = require('fs');
var lockFile = require('lockfile')

let body = [];
// // Use fs.readFile() method to read the file
// fs.readFile('read.txt', 'utf8', function(err, data){
//
//
//     // Display the file content
//     body = data.split("\n");
//     // console.log();
//     console.log(body[0]);
// });

// fs.open('myfile', 'wx', (err, fd) => {
//     if (err) {
//         if (err.code === 'EEXIST') {
//             console.error('myfile already exists');
//             return;
//         }
//
//         throw err;
//     }
//
//     writeMyData(fd);
// });


// lockFile.lock('read.txt', function (er, isLocked) {
//     // if the er happens, then it failed to acquire a lock.
//     // if there was not an error, then the file was created,
//     // and won't be deleted until we unlock it.
//
//     // do my stuff, free of interruptions
//     // then, some time later, do:
//     lockFile.unlock('some-file.lock', function (er) {
//         // er means that an error happened, and is probably bad.
//     })
// })

const fileName = 'read.txt';

function getFilesizeInMegaBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats.size;
    return fileSizeInBytes; // / (1024*1024);
}

// console.log(getFilesizeInMegaBytes('read.txt'));

const create = (key, value, timeToLive = -1) => {
    const body = read();
    if(body.hasOwnProperty(key)){
        throw new Error("Key already exists! Try again with a new key");
    }
    const fileSize = getFilesizeInMegaBytes(fileName);
    if(fileSize > 600){
        clear();
    }
    const data = `"${key}":{"timeToLive":${seconds_since_epoch()+timeToLive},"value":${JSON.stringify(value)}},`;
    if(fileSize + data.length > 1000){
        throw new Error("Out of memory, try deleting some contents");
    }
    append(data);
}

const getValue = (id) => {
    const body = read();
    if(body.hasOwnProperty(id)) {
        return body[id]["value"];
    } else{
        throw new Error("Record not found!");
    }
}

const append = (message) => {
    lockFile.lock(`${fileName}.lock`, function (er, isLocked) {
        if(er) throw er;
        if(isLocked){
            throw new Error("Already in use..");
        }
        fs.appendFile(fileName, message, (err) => {
            if (err) throw err;
            console.log('The data was appended to file!');
        });
        lockFile.unlock(`${fileName}.lock`, function (e) {
            if(e) throw e;
        })
    });
}

const write = (message) => {
    lockFile.lock(`${fileName}.lock`, function (er, isLocked) {
        if(er) throw er;
        if(isLocked){
            throw new Error("Already in use..");
        }
        fs.writeFile(fileName, message, 'utf8', () => {
            console.log("done");
        });
        lockFile.unlock(`${fileName}.lock`, function (e) {
            if(e) throw e;
        });
    });
}

const read = () => {
    // const data = await fs.readFile(fileName, 'utf8', function(err, data){
    //     // const str = data + '\n}';
    //     // console.log(str);
    //     const body = JSON.parse(data);
    //     console.log("body", body);
    //     return body;
    // });
    // console.log("inner", data);
    const data = fs.readFileSync(fileName, {encoding: 'utf-8'});
    const dataStr = '{' + data.substring(0, data.length - 1) + '}';
    const body = JSON.parse(dataStr);
    return body;
}

const deleteMessage = (id) => {
    const body = read();
    if(body.hasOwnProperty(id)){
        console.log(body[id]);
        delete body[id];
        const body_new = JSON.stringify(body);
        write(body_new.substring(1, body_new.length));
    } else{
        throw new Error("Data Not Found!");
    }
}

const seconds_since_epoch = () => {
    return Math.floor( Date.now() / 1000 );
}

const clear = () => {
    const body = read();
    const body_new = {};
    const now = seconds_since_epoch();
    for (let [key, value] of Object.entries(body)) {
        if(value["timeToLive"] >= now){
            body_new[key] = value;
        }
    }
    const data = JSON.stringify(body_new);
    if(data.length <= 2){
        write("");
    }
    else write(data.substring(1, data.length - 1)+",");
}

// append('"Key4" : {"timeToLive": 6, "value" : {}},');
// clearAndWrite('"Key6" : {"timeToLive": 6, "value" : {}},');
// deleteMessage("Key3");
// create('key10', {"id": "123", "name":"abc"}, 12);
// console.log(getValue('key'));
// console.log(read());
// console.log(getFilesizeInMegaBytes('tmp.txt'));

// {"Key":"value","Key1":"value1","key2":"value2","key3":"value3","key4":"value4","key5":"value5","key6":"value6", "key7":"value7"}

// {
// "Key" : {
// 		"timeToLive" : 2,
// 		"value" : {}
// 	},
// "Key1" : {
// 		"timeToLive" : 10,
// 		"value" : {}
// 	}
// }