import {Filesystem} from '../Filesystem';
import assert = require('assert');
import fs = require('fs');
import cp = require('child_process');

var filesystem = new Filesystem();

describe('Filesystem.mkdir', function() {
  var cleanup = () => { cp.exec('rm -rf a'); };
  before((done) => {
    cleanup(); 
    fs.writeFileSync('./test_file1', '1');
    fs.writeFileSync('./test_file2', '1');
    done(); 
  });
  after((done) => {
    cleanup();
    fs.unlink('./test_file1');
    fs.unlink('./test_file2');
    done(); 
  });

  it('mkdir: create nested set of dirs', function() {
    filesystem.mkdir(['a', 'b', 'c'], 0o777, '');
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
  it('mkdir: created dirs should have 777 permissions', () => {
    let stat = fs.statSync('a/b/c');
    assert.equal(stat.mode.toString(8), '40777');
  });

  it ('copy: existence of copied file', () => {
    filesystem.copy('./test_file1', './test_file2');
    assert.ok(fs.statSync('./test_file1').isFile());
  });

  it('exists: check list of files, single file', () => {
    let files = ['package.json', 'README.md'];
    let dirs = ['test'];
    assert.ok(filesystem.exists(dirs));
    assert.ok(filesystem.exists(files));
    assert.notEqual(true, filesystem.exists('asldfjkalsd'));
  });

  it('touch: array of files - atime, mtime', () => {
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
      filesystem.touch(file, mtime, atime);
      let stat = fs.statSync(file);
      assert.equal(stat.atime.getSeconds() - 10, stat.mtime.getSeconds());
    }
  });
});