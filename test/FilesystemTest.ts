import {Filesystem} from '../Filesystem';
import assert = require('assert');
import fs = require('fs');
import cp = require('child_process');

var filesystem = new Filesystem();

describe('Filesystem', function() {
  var cleanup = () => { cp.exec('rm -rf a'); };
  before((done) => {
    cleanup(); 
    fs.writeFileSync('./test_file1', '1');
    fs.writeFileSync('./test_file2', '1');
    done(); 
  });
  after((done) => {
    cleanup();
    try { fs.unlinkSync('./test_file1'); } catch (e) {}
    try { fs.unlinkSync('./test_file2'); } catch (e) {}
    done(); 
  });

  it('mkdirSync: create nested set of dirs', function() {
    filesystem.mkdirSync(['a', 'b', 'c'], 0o777, '');
    let stat = fs.statSync('a/b/c');
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
    let stat = fs.statSync('a/b/c');
    assert.equal(stat.mode.toString(8), '40777');
  });

  it('copySync: existence of copied file', () => {
    filesystem.copySync('./test_file1', './test_file2');
    assert.ok(fs.statSync('./test_file1').isFile());
  });

  it('existsSync: check list of files, single file', () => {
    let files = ['package.json', 'README.md'];
    let dirs = ['test'];
    assert.ok(filesystem.existsSync(dirs));
    assert.ok(filesystem.existsSync(files));
    assert.notEqual(true, filesystem.existsSync('asldfjkalsd'));
  });

  it('touchSync: array of files - atime, mtime', () => {
    let files = ['touch_file1', 'touch_file2'];
    after((done) => {
      for (let file of files)
        fs.unlink(file);
      done();
    });

    let atime = new Date();
    let mtime = new Date();
    atime.setSeconds(mtime.getSeconds() + 10);

    for (let file of files) {
      filesystem.touchSync(file, mtime, atime);
      let stat = fs.statSync(file);
      assert.equal(stat.atime.getSeconds() - 10, stat.mtime.getSeconds());
    }
  });

  it('removeSync: remove list of files', () => {
    filesystem.removeSync(['./test_file1', './test_file2']);
    assert.ok(!fs.existsSync('./test_file1'));
    assert.ok(!fs.existsSync('./test_file2'));
  });
});