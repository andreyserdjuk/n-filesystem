"use strict";
const fs = require('fs');
var touch = require('touch');
class Filesystem {
    /**
     * Copies a file.
     *
     * If the target file is older than the origin file, it's always overwritten.
     * If the target file is newer, it is overwritten only when the
     * $overwriteNewerFiles option is set to true.
     *
     * @param string $originFile          The original filename
     * @param string $targetFile          The target filename
     * @param bool   $overwriteNewerFiles If true, target files newer than origin files are overwritten
     *
     * @throws Error When originFile doesn't exist
     * @throws Error When copy fails
     */
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
    /**
     * Creates a directory recursively.
     *
     * @param string|array|\Traversable $dirs The directory path
     * @param int                       $mode The directory mode
     *
     * @throws Error On any directory creation failure
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
    /**
     * Checks the existence of files or directories.
     *
     * @param string|array|\Traversable files A filename, an array of files, or a \Traversable instance to check
     *
     * @return bool true if the file exists, false otherwise
     */
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
    /**
     * Sets access and modification time of file.
     *
     * @param string|array|\Traversable files A filename, an array of files, or a \Traversable instance to create
     * @param int                       time  The touch time as a Unix timestamp
     * @param int                       atime The access time as a Unix timestamp
     *
     * @throws Error When touch fails
     */
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
    /**
     * Removes files or directories.
     *
     * @param string|array|\Traversable$files A filename, an array of files, or a \Traversable instance to remove
     */
    remove(files) {
        var filesList = this.makeIter(files);
        for (let file of filesList) {
            fs.unlinkSync(file);
        }
    }
    /**
     * @param mixed files
     *
     * @return traversable
     */
    makeIter(files) {
        if (typeof files === 'string' || typeof files === 'number') {
            files = new Array(files.toString());
        }
        return files;
    }
}
exports.Filesystem = Filesystem;
