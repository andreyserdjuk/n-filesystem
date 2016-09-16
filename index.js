"use strict";
var fs = require('fs');
var Filesystem = (function () {
    function Filesystem() {
    }
    /**
     * Creates a directory recursively.
     */
    Filesystem.prototype.mkdir = function (dirs, mode, root) {
        if (mode === void 0) { mode = 511; }
        if (root === void 0) { root = ''; }
        var path = root;
        for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
            var dir = dirs_1[_i];
            path = path.replace(/\/+$/, '') + '/' + dir;
            if (fs.existsSync(path)) {
                continue;
            }
            fs.mkdirSync(path, mode);
            fs.chmodSync(path, mode); // because mkdirSync uses only default mode
        }
    };
    Filesystem.prototype.copy = function (originFile, targetFile, overwriteNewerFiles) {
        if (overwriteNewerFiles === void 0) { overwriteNewerFiles = false; }
        if (overwriteNewerFiles) {
            fs.unlink(targetFile);
        }
        fs.createReadStream(originFile).pipe(fs.createWriteStream(targetFile));
    };
    return Filesystem;
}());
exports.Filesystem = Filesystem;
