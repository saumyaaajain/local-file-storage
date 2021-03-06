const fs = require('fs');
let lockFile = require('lockfile')

class LocalFileStorage{
    constructor(filename = 'FileStorage.txt') {
        this.fileName = filename;
        this.#createFile(filename);
    }
    fileName = 'FileStorage.txt';

    #createFile = (filename) => {
        fs.writeFile(filename, "", function (err) {
            if (err) throw err;
        });
    }

    #getFilesizeInMegaBytes = (filename) => {
        let stats = fs.statSync(filename);
        let fileSizeInBytes = stats.size;
        return this.#convertToMB(fileSizeInBytes);
    }

    #convertToMB = (size) => {
        return size / (1024*1024);
    }

    create = (key, value, timeToLive = -1) => {
        const body = this.#read();
        if(body.hasOwnProperty(key)){
            throw new Error("Key already exists! Try again with a new key");
        }
        const fileSize = this.#getFilesizeInMegaBytes(this.fileName);
        if(fileSize > 600){
            this.#clear();
        }
        let dataToStore = "";
        try{
            dataToStore = JSON.stringify(value);
        } catch (e){
            throw new Error("Please give valid arguments");
        }
        const data = `"${key}":{"timeToLive":${this.#seconds_since_epoch()+timeToLive},"value":${dataToStore}},`;
        if(fileSize + this.#convertToMB(data.length) > 1000){
            throw new Error("Out of memory, try deleting some records");
        }
        return this.#append(data);
    }

    get = async (id) => {
        const body = await this.#read().then(r => r).catch(e => e);
        if (body.hasOwnProperty(id)) {
            return body[id]["value"];
        } else {
            throw new Error("Record not found!");
        }
    }

    #append = (message) => {
        let that = this;
        return new Promise((res, rej) => {
            lockFile.lock(`${that.fileName}.lock`, function (er, isLocked) {
                if(isLocked){
                    rej(new Error("Already in use.."));
                }
                if(er) {
                    rej(er);
                }
                fs.appendFile(that.fileName, message, (err) => {
                    if (err) {
                        rej(err);
                    }
                    console.log('Record Added!!');
                });
                lockFile.unlock(`${that.fileName}.lock`, function (e) {
                    if(e) {
                        rej(e);
                    }
                    res("Record added successfully");
                })
            });
        });
    }

    #write = (message) => {
        let that = this;
        return new Promise((res, rej) => {
            lockFile.lock(`${this.fileName}.lock`, function (er, isLocked) {
                if(isLocked){
                    rej(new Error("Already in use"));
                }
                if(er) {
                    rej(er);
                }
                fs.writeFile(that.fileName, message, 'utf8', () => {
                    console.log("written");
                });
                lockFile.unlock(`${that.fileName}.lock`, function (e) {
                    if(e) {
                        rej(e);
                    }
                    res("Successfully written");
                });
            });
        });
    }

    #read = () => {
        let that = this;
        return new Promise((res, rej) => {
            fs.readFile(that.fileName, 'utf8', function(err, data){
                if(err){
                    rej(err);
                }
                const dataStr = '{' + data.substring(0, data.length - 1) + '}';
                const body = JSON.parse(dataStr);
                res(body);
            });
        });
    }

    delete = async (id) => {
        const body = await this.#read()
            .then(r => r)
            .catch(e => {
                throw new Error(e)
            });
        if(body.hasOwnProperty(id)){
            console.log(body[id]);
            delete body[id];
            const body_new = JSON.stringify(body);
            return this.#write(body_new.substring(1, body_new.length-1));
        } else{
            throw new Error("Record Not Found!");
        }
    }

    #seconds_since_epoch = () => {
        return Math.floor( Date.now() / 1000 );
    }

    #clear = () => {
        const body = this.#read()
            .then(r => r)
            .catch(e => {
                throw new Error(e)
            });
        const body_new = {};
        const now = this.#seconds_since_epoch();
        for (let [key, value] of Object.entries(body)) {
            if(value["timeToLive"] >= now || value["timeToLive"] === -1){
                body_new[key] = value;
            }
        }
        const data = JSON.stringify(body_new);
        if(data.length <= 2){
            return this.#write("");
        }
        else return this.#write(data.substring(1, data.length - 1)+",");
    }

}

module.exports = LocalFileStorage;