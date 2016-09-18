"use strict";
const fs = require('fs');
class Filesystem {
    /**
     * Creates a directory recursively.
     */
    mkdir(dirs, mode = 0o777, root = '') {
        var path = root ? root : __dirname;
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
        if (overwriteNewerFiles) {
            fs.unlink(targetFile);
        }
        fs.createReadStream(originFile).pipe(fs.createWriteStream(targetFile));
    }
    exists(files) {
        if (typeof files === 'string') {
            files = new Array(files);
        }
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
}
exports.Filesystem = Filesystem;
