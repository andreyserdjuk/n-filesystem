"use strict";
const fs = require('fs');
let touch = require('touch');
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
    copySync(originFile, targetFile, overwriteNewerFiles = false) {
        let originModified = fs.statSync(originFile).birthtime;
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
    mkdirSync(dirs, mode = 0o777, root = '') {
        let path = root ? root : __dirname;
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
    existsSync(files) {
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
    touchSync(files, time = null, atime = null) {
        let options = { force: true }, filesList = this.makeIter(files);
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
    removeSync(files) {
        let filesList = this.makeIter(files);
        for (let file of filesList) {
            fs.unlinkSync(file);
        }
    }
    /**
     * Change mode for an array of files or directories.
     *
     * @param string|array|\Traversable files     A filename, an array of files, or a \Traversable instance to change mode
     * @param int                       mode      The new mode (octal)
     * @param int                       umask     The mode mask (octal)
     * @param bool                      recursive Whether change the mod recursively or not
     *
     * @throws IOException When the change fail
     */
    chmodSync(files, mode, umask = 0o000, recursive = false) {
        let filesList = this.makeIter(files);
        for (let file of filesList) {
            let stat = fs.statSync(file);
            if (stat.isSymbolicLink()) {
                fs.lchmodSync(file, mode & ~umask);
            }
            else {
                fs.chmodSync(file, mode & ~umask);
            }
            if (recursive && stat.isDirectory() && !stat.isSymbolicLink()) {
                let dirs = fs.readdirSync(file);
                this.chmodSync(dirs.map((dir) => file + '/' + dir), mode, umask, true);
            }
        }
    }
    /**
     * Change the owner of an array of files or directories.
     *
     * @param string|array|\Traversable files     A filename, an array of files, or a \Traversable instance to change owner
     * @param number                    user      The new owner user id
     * @param bool                      recursive Whether change the owner recursively or not
     *
     * @throws IOException When the change fail
     */
    chownSync(files, uid, recursive = false) {
        let filesList = this.makeIter(files);
        for (let file of filesList) {
            let stat = fs.statSync(file);
            if (stat.isSymbolicLink()) {
                fs.lchownSync(file, uid, stat.gid);
            }
            else {
                fs.chownSync(file, uid, stat.gid);
            }
            if (recursive && stat.isDirectory() && !stat.isSymbolicLink()) {
                let dirs = fs.readdirSync(file);
                this.chownSync(dirs.map((dir) => file + '/' + dir), uid, true);
            }
        }
    }
    /**
     * Change the group of an array of files or directories.
     *
     * @param string|array|\Traversable files     A filename, an array of files, or a \Traversable instance to change group
     * @param string                    gid       The group id
     * @param bool                      recursive Whether change the group recursively or not
     *
     * @throws IOException When the change fail
     */
    chgrpSync(files, gid, recursive = false) {
        let filesList = this.makeIter(files);
        for (let file of filesList) {
            let stat = fs.statSync(file);
            if (stat.isSymbolicLink()) {
                fs.lchownSync(file, stat.uid, gid);
            }
            else {
                fs.chownSync(file, stat.uid, gid);
            }
            if (recursive && stat.isDirectory() && !stat.isSymbolicLink()) {
                let dirs = fs.readdirSync(file);
                this.chgrpSync(dirs.map((dir) => file + '/' + dir), gid, true);
            }
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
        if (!Array.isArray(files)) {
            files = [];
        }
        return files;
    }
}
exports.Filesystem = Filesystem;
