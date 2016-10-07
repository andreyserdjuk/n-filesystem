import {ENOBUFS, EROFS} from 'constants';
import * as readline from 'readline';
import fs = require('fs');
const touch = require('touch');
const path = require('path');

export class Filesystem {

    /**
     * Copies a file.
     *
     * If the target file is older than the origin file, it's always overwritten.
     * If the target file is newer, it is overwritten only when the
     * overwriteNewerFiles option is set to true.
     *
     * @param string originFile          The original filename
     * @param string targetFile          The target filename
     * @param bool   overwriteNewerFiles If true, target files newer than origin files are overwritten
     *
     * @throws Error When originFile doesn't exist
     * @throws Error When copy fails
     */
    public copySync(originFile:string, targetFile:string, overwriteNewerFiles:boolean = false)
    {
        let originModified = fs.statSync(originFile).birthtime;

        try {
            var targetModified = fs.statSync(targetFile).birthtime;
        } catch (e) {
            var targetModified = new Date();
        }

        if (overwriteNewerFiles || (
            !overwriteNewerFiles && originModified > targetModified
        )) {
            fs.createReadStream(originFile).pipe(fs.createWriteStream(targetFile));
        }
    }

    /**
     * Creates a directory recursively.
     *
     * @param string|array|\Traversable dirs The directory path
     * @param int                       mode The directory mode
     *
     * @throws Error On any directory creation failure
     */
    public mkdirSync(dirs:Array<string>|string, mode:number = 0o777, root:string = '')
    {
        let path = root? root : __dirname;
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
    public existsSync(files:Array<string>|string)
    {
        files = this.makeIter(files);
        
        for (let file of files) {
            try {
                let stat = fs.statSync(file);
            } catch (e) {
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
    public touchSync(files:Array<string>|string, time:Date = null, atime:Date = null)
    {
        let options = {force: true},
            filesList = this.makeIter(files);

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
     * @param string|array|\Traversable files A filename, an array of files, or a \Traversable instance to remove
     */
    public removeSync(files:Array<string>|string)
    {
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
    public chmodSync(files:Array<string>|string, mode:number, umask:number = 0o000, recursive:boolean = false)
    {
        let filesList = this.makeIter(files);

        for (let file of filesList) {
            let stat = fs.statSync(file);

            if (stat.isSymbolicLink()) {
                fs.lchmodSync(file, mode & ~umask);
            } else {
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
    public chownSync(files:Array<string>|string, uid:number, recursive:boolean = false)
    {
        let filesList = this.makeIter(files);

        for (let file of filesList) {
            let stat = fs.statSync(file);

            if (stat.isSymbolicLink()) {
                fs.lchownSync(file, uid, stat.gid);
            } else {
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
    public chgrpSync(files:Array<string>|string, gid:number, recursive:boolean = false)
    {
        let filesList = this.makeIter(files);

        for (let file of filesList) {
            let stat = fs.statSync(file);

            if (stat.isSymbolicLink()) {
                fs.lchownSync(file, stat.uid, gid);
            } else {
                fs.chownSync(file, stat.uid, gid);
            }

            if (recursive && stat.isDirectory() && !stat.isSymbolicLink()) {
                let dirs = fs.readdirSync(file);
                this.chgrpSync(dirs.map((dir) => file + '/' + dir), gid, true);
            }
        }
    }

    /**
     * Atomically dumps content into a file.
     *
     * @param string   filename The file to be written to
     * @param string   content  The data to write into the file
     * @param null|int mode     The file mode (octal). If null, file permissions are not modified
     *
     * @throws IOException If the file cannot be written to.
     */
    public dumpFileSync(filename, content, mode = 0o666)
    {
        let dir = path.dirname(filename);
        let isDirectory = false;

        try {
            let stat = fs.fstatSync(dir);
            isDirectory = true;
        } catch (e) {}

        if (!isDirectory) {
            this.mkdirSync(dir.split('/'));
        } else {
            try {
                fs.accessSync(dir, fs.W_OK);
            } catch (e) {
                throw new Error('Unable to write to the "' + dir + '" directory.')
            }
        }

        fs.writeFileSync(filename, content, {mode: mode});
    }

    /**
     * Renames a file or a directory.
     *
     * @param string origin    The origin filename or directory
     * @param string target    The new filename or directory
     * @param bool   overwrite Whether to overwrite the target if it already exists
     *
     * @throws IOException When target file or directory already exists
     * @throws IOException When origin cannot be renamed
     */
    public renameSync(origin, target, overwrite = false)
    {
        // we check that target does not exist
        if (!overwrite && this.isReadable(target)) {
            throw new Error('Cannot rename because the target "' + target + '" already exists.');
        }

        fs.renameSync(origin, target);
    }

    /**
     * Tells whether a file exists and is readable.
     *
     * @param string filename Path to the file
     *
     * @throws IOException When windows path is longer than 258 characters
     */
    private isReadable(filename)
    {
        if (fs.existsSync(filename)) {
            let stat = fs.statSync(filename);
            if (stat.isDirectory()) {
                return false;
            }

            try {
                // cannot import fs.constants.R_OK
                fs.accessSync(filename, 4);
                return true;
            } catch(e) {
                return false;
            }
        }

        return false;
    }

    /**
     * @param mixed files
     *
     * @return traversable
     */
    protected makeIter(files:Array<any>|string)
    {
        if (typeof files === 'string' || typeof files === 'number') {
            files = new Array(files.toString());
        }

        if (!Array.isArray(files)) {
            files = [];
        }

        return files;
    }
}