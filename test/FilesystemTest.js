"use strict";
const Filesystem_1 = require('../Filesystem');
const DirectoryPath_1 = require('../DirectoryPath');
const assert = require('assert');
const fs = require('fs');
const cp = require('child_process');
const os = require('os');
let filesystem = new Filesystem_1.Filesystem();
let TMPDIR = os.tmpdir();
describe('Filesystem', () => {
    var cleanup = () => { cp.exec('rm -rf ' + TMPDIR + '/a'); };
    before((done) => {
        cleanup();
        fs.writeFileSync(TMPDIR + '/test_file1', '1');
        fs.writeFileSync(TMPDIR + '/test_file2', '1');
        done();
    });
    after((done) => {
        cleanup();
        try {
            fs.unlinkSync(TMPDIR + '/test_file1');
        }
        catch (e) { }
        try {
            fs.unlinkSync(TMPDIR + '/test_file2');
        }
        catch (e) { }
        done();
    });
    it('mkdirSync: create nested set of dirs', () => {
        filesystem.mkdirSync(['a', 'b', 'c'], 0o777, TMPDIR);
        let stat = fs.statSync(TMPDIR + '/a/b/c');
        assert.ok(stat.isDirectory());
    });
    //      S_IFMT     0170000   bit mask for the file type bit field
    //      S_IFSOCK   0140000   socket
    //      S_IFLNK    0120000   symbolic link
    //      S_IFREG    0100000   regular file
    //      S_IFBLK    0060000   block device
    //      S_IFDIR    0040000   directory --->>> we got this
    //      S_IFCHR    0020000   character device
    //      S_IFIFO    0010000   FIFO
    it('mkdirSync: created dirs should have 777 permissions', () => {
        let stat = fs.statSync(TMPDIR + '/a/b/c');
        assert.equal(stat.mode.toString(8), '40777');
    });
    it('copySync: existence of copied file', () => {
        filesystem.copySync(TMPDIR + '/test_file1', TMPDIR + '/test_file2');
        assert.ok(fs.statSync(TMPDIR + '/test_file1').isFile());
    });
    it('existsSync: check list of files, single file', () => {
        let files = [TMPDIR + '/test_file1', TMPDIR + '/test_file2'];
        let dirs = [TMPDIR];
        assert.ok(filesystem.existsSync(dirs));
        assert.ok(filesystem.existsSync(files));
        assert.notEqual(true, filesystem.existsSync(TMPDIR + '/asldfjkalsd'));
    });
    it('touchSync: array of files - atime, mtime', () => {
        let files = [TMPDIR + '/touch_file1', TMPDIR + '/touch_file2'];
        after((done) => {
            for (let file of files)
                fs.unlink(file);
            done();
        });
        let atime = new Date();
        let mtime = new Date(atime.getTime());
        // add 1000 miliseconds
        atime.setTime(atime.getTime() + 1000);
        let atimeSec = Math.floor(atime.getTime() / 1000);
        let mtimeSec = Math.floor(mtime.getTime() / 1000);
        for (let file of files) {
            filesystem.touchSync(file, mtime, atime);
            let stat = fs.statSync(file);
            let statAtimeSec = Math.floor(stat.atime.getTime() / 1000);
            let statMtimeSec = Math.floor(stat.mtime.getTime() / 1000);
            let statMtimeSecPlus10Msec = Math.floor((stat.mtime.getTime() + 1000) / 1000);
            assert.equal(atimeSec, statAtimeSec);
            assert.equal(mtimeSec, statMtimeSec);
            assert.equal(atimeSec, statMtimeSecPlus10Msec);
        }
    });
    it('removeSync: remove list of files', () => {
        filesystem.removeSync([TMPDIR + '/test_file1', TMPDIR + '/test_file2']);
        assert.ok(!fs.existsSync(TMPDIR + '/test_file1'));
        assert.ok(!fs.existsSync(TMPDIR + '/test_file2'));
    });
    it('chmodSync', () => {
        filesystem.chmodSync(TMPDIR + '/a', 0o755);
        assert.equal(fs.statSync(TMPDIR + '/a').mode.toString(8), '40755');
        assert.equal(fs.statSync(TMPDIR + '/a/b').mode.toString(8), '40777');
        assert.equal(fs.statSync(TMPDIR + '/a/b/c').mode.toString(8), '40777');
        filesystem.chmodSync(TMPDIR + '/a', 0o755, 0o000, true);
        assert.equal(fs.statSync(TMPDIR + '/a').mode.toString(8), '40755');
        assert.equal(fs.statSync(TMPDIR + '/a/b').mode.toString(8), '40755');
        assert.equal(fs.statSync(TMPDIR + '/a/b/c').mode.toString(8), '40755');
    });
    it('chownSync: recursively', () => {
        filesystem.chownSync(TMPDIR + '/a', 999, true);
        assert.equal(fs.statSync(TMPDIR + '/a').uid, 999);
        assert.equal(fs.statSync(TMPDIR + '/a/b').uid, 999);
        assert.equal(fs.statSync(TMPDIR + '/a/b/c').uid, 999);
    });
    it('chgrpSync: recurisively', () => {
        filesystem.chgrpSync(TMPDIR + '/a', 999, true);
        assert.equal(fs.statSync(TMPDIR + '/a').gid, 999);
        assert.equal(fs.statSync(TMPDIR + '/a/b').gid, 999);
        assert.equal(fs.statSync(TMPDIR + '/a/b/c').gid, 999);
    });
    it('chgrpSync: non-recurisively', () => {
        filesystem.chgrpSync(TMPDIR + '/a', 888, true);
        filesystem.chgrpSync(TMPDIR + '/a', 999);
        assert.equal(fs.statSync(TMPDIR + '/a').gid, 999);
        assert.notEqual(fs.statSync(TMPDIR + '/a/b').gid, 999);
        assert.notEqual(fs.statSync(TMPDIR + '/a/b/c').gid, 999);
    });
    it('dumpFileSync', () => {
        let path = TMPDIR + '/a/d/u/m/p.txt';
        filesystem.dumpFileSync(path, 'node is cool', 0o755);
        let stat = fs.statSync(path);
        assert.equal(stat.mode.toString(8), '100755');
    });
});
describe('DirectoryPath', () => {
    it('iterable absolute path', () => {
        let directoryPath = new DirectoryPath_1.DirectoryPath('/absolute/path/to/dir');
        let dirs = [...directoryPath];
        assert.equal('/absolute', dirs[0]);
        assert.equal('path', dirs[1]);
        assert.equal('to', dirs[2]);
        assert.equal('dir', dirs[3]);
    });
    it('iterable relative path', () => {
        let directoryPath = new DirectoryPath_1.DirectoryPath('relative/path/to/dir');
        let dirs = [...directoryPath];
        assert.equal('relative', dirs[0]);
        assert.equal('path', dirs[1]);
        assert.equal('to', dirs[2]);
        assert.equal('dir', dirs[3]);
    });
});
