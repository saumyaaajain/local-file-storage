const fs = require('fs');
var lockFile = require('lockfile')

class JsonToFile{
    constructor(filename = 'read.txt') {
        this.fileName = filename;
        fs.writeFile(filename, "", function (err) {
            if (err) throw err;
            console.log('File is created successfully.');
        });
    }
    fileName = 'read.txt';

    getFilesizeInMegaBytes = (filename) => {
        var stats = fs.statSync(filename);
        var fileSizeInBytes = stats.size;
        return fileSizeInBytes / (1024*1024);
    }

    create = (key, value, timeToLive = -1) => {
        const body = this.read();
        if(body.hasOwnProperty(key)){
            throw new Error("Key already exists! Try again with a new key");
        }
        const fileSize = this.getFilesizeInMegaBytes(this.fileName);
        if(fileSize > 600){
            this.clear();
        }
        const data = `"${key}":{"timeToLive":${this.seconds_since_epoch()+timeToLive},"value":${JSON.stringify(value)}},`;
        if(fileSize + data.length > 1000){
            throw new Error("Out of memory, try deleting some records");
        }
        this.append(data);
    }

    get = (id) => {
        const body = this.read();
        if(body.hasOwnProperty(id)) {
            return body[id]["value"];
        } else{
            throw new Error("Record not found!");
        }
    }

    append = (message) => {
        var that = this;
        lockFile.lock(`${this.fileName}.lock`, function (er, isLocked) {
            if(er) throw er;
            if(isLocked){
                throw new Error("Already in use..");
            }
            fs.appendFile(that.fileName, message, (err) => {
                if (err) throw err;
                console.log('Record Added!!');
            });
            lockFile.unlock(`${that.fileName}.lock`, function (e) {
                if(e) throw e;
            })
        });
    }

    write = (message) => {
        var that = this;
        lockFile.lock(`${this.fileName}.lock`, function (er, isLocked) {
            if(er) throw er;
            if(isLocked){
                throw new Error("Already in use..");
            }
            fs.writeFile(that.fileName, message, 'utf8', () => {
                console.log("written");
            });
            lockFile.unlock(`${that.fileName}.lock`, function (e) {
                if(e) throw e;
            });
        });
    }

    read = () => {
        const data = fs.readFileSync(this.fileName, {encoding: 'utf-8'});
        const dataStr = '{' + data.substring(0, data.length - 1) + '}';
        const body = JSON.parse(dataStr);
        return body;
    }

    delete = (id) => {
        const body = this.read();
        if(body.hasOwnProperty(id)){
            console.log(body[id]);
            delete body[id];
            const body_new = JSON.stringify(body);
            this.write(body_new.substring(1, body_new.length-1));
        } else{
            throw new Error("Data Not Found!");
        }
    }

    seconds_since_epoch = () => {
        return Math.floor( Date.now() / 1000 );
    }

    clear = () => {
        const body = this.read();
        const body_new = {};
        const now = this.seconds_since_epoch();
        for (let [key, value] of Object.entries(body)) {
            if(value["timeToLive"] >= now){
                body_new[key] = value;
            }
        }
        const data = JSON.stringify(body_new);
        if(data.length <= 2){
            this.write("");
        }
        else this.write(data.substring(1, data.length - 1)+",");
    }

}
