import fs = require('fs');

export class Filesystem {
    /**
     * Creates a directory recursively.
     */
    public mkdir(dirs:Array<string>, mode:number = 0o777, root:string = '')
    {
        var path = root;

        for (let dir of dirs) {
            path = path.replace(/\/+$/, '') + '/' + dir;
            if (fs.existsSync(path)) {
                continue;
            }

            fs.mkdirSync(path, mode);
            fs.chmodSync(path, mode); // because mkdirSync uses only default mode
        }
    }

    public copy(originFile, targetFile, overwriteNewerFiles = false)
    {
        if (overwriteNewerFiles) {
            fs.unlink(targetFile);
        }

        fs.createReadStream(originFile).pipe(fs.createWriteStream(targetFile));
    }
}

interface fs {
    mkdir(path: string | Buffer, callback?: (err?: NodeJS.ErrnoException) => void): void;
}