"use strict";
const fs = require('fs');
const touch = require('touch');
class Filesystem {
    /**
     * Creates a directory recursively.
     */
    mkdir(dirs, mode = 0o777, root = '') {
        var path = root ? root : __dirname;
        dirs = this.makeIter(dirs);
        for (let dir of dirs) {
            path = path.replace(/\/+$/, '') + '/' + dir;
            if (fs.existsSync(path)) {
                continue;
            }
            fs.mkdirSync(path, mode);
            fs.chmodSync(path, mode); // because mkdirSync uses only default mode
        }
    }
    copy(originFile, targetFile, overwriteNewerFiles = false) {
        var originModified = fs.statSync(originFile).birthtime;
        try {
            var targetModified = fs.statSync(targetFile).birthtime;
        }
        catch (e) {
            var targetModified = new Date();
        }
        if (overwriteNewerFiles || (!overwriteNewerFiles && originModified > targetModified)) {
            fs.createReadStream(originFile).pipe(fs.createWriteStream(targetFile));
        }
    }
    exists(files) {
        files = this.makeIter(files);
        for (let file of files) {
            try {
                let stat = fs.statSync(file);
            }
            catch (e) {
                return false;
            }
        }
        return true;
    }
    touch(files, time = null, atime = null) {
        var options = { force: true }, filesList = this.makeIter(files);
        if (null !== time) {
            options['time'] = time;
        }
        if (null !== atime) {
            options['atime'] = atime;
        }
        for (let file of filesList) {
            touch.sync(file, options);
        }
    }
    makeIter(arr) {
        if (typeof arr === 'string' || typeof arr === 'number') {
            arr = new Array(arr.toString());
        }
        return arr;
    }
}
exports.Filesystem = Filesystem;
