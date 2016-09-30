import {Filesystem} from '../Filesystem';
import assert = require('assert');
import fs = require('fs');
import cp = require('child_process');
let userid = require('userid');
let filesystem = new Filesystem();
let TMPDIR = process.env.TMPDIR;

describe('Filesystem', function() {
  var cleanup = () => { cp.exec('rm -rf ' + TMPDIR + 'a'); };
  before((done) => {
    cleanup(); 
    fs.writeFileSync(TMPDIR + 'test_file1', '1');
    fs.writeFileSync(TMPDIR + 'test_file2', '1');
    done(); 
  });
  after((done) => {
    cleanup();
    try { fs.unlinkSync(TMPDIR + 'test_file1'); } catch (e) {}
    try { fs.unlinkSync(TMPDIR + 'test_file2'); } catch (e) {}
    done(); 
  });

  it('mkdirSync: create nested set of dirs', function() {
    filesystem.mkdirSync(['a', 'b', 'c'], 0o777, TMPDIR);
    let stat = fs.statSync(TMPDIR + 'a/b/c');
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
    let stat = fs.statSync(TMPDIR + 'a/b/c');
    assert.equal(stat.mode.toString(8), '40777');
  });

  it('copySync: existence of copied file', () => {
    filesystem.copySync(TMPDIR + 'test_file1', TMPDIR + 'test_file2');
    assert.ok(fs.statSync(TMPDIR + 'test_file1').isFile());
  });

  it('existsSync: check list of files, single file', () => {
    let files = [TMPDIR + 'test_file1', TMPDIR + 'test_file2'];
    let dirs = [TMPDIR];
    assert.ok(filesystem.existsSync(dirs));
    assert.ok(filesystem.existsSync(files));
    assert.notEqual(true, filesystem.existsSync(TMPDIR + 'asldfjkalsd'));
  });

  it('touchSync: array of files - atime, mtime', () => {
    let files = [TMPDIR + 'touch_file1', TMPDIR + 'touch_file2'];
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
    filesystem.removeSync([TMPDIR + 'test_file1', TMPDIR + 'test_file2']);
    assert.ok(!fs.existsSync(TMPDIR + 'test_file1'));
    assert.ok(!fs.existsSync(TMPDIR + 'test_file2'));
  });

  it('chmodSync', () => {
    filesystem.chmodSync(TMPDIR + 'a', 0o755);
    assert.equal(fs.statSync(TMPDIR + 'a').mode.toString(8), '40755');
    assert.equal(fs.statSync(TMPDIR + 'a/b').mode.toString(8), '40777');
    assert.equal(fs.statSync(TMPDIR + 'a/b/c').mode.toString(8), '40777');
    filesystem.chmodSync(TMPDIR + 'a', 0o755, 0o000, true);
    assert.equal(fs.statSync(TMPDIR + 'a').mode.toString(8), '40755');
    assert.equal(fs.statSync(TMPDIR + 'a/b').mode.toString(8), '40755');
    assert.equal(fs.statSync(TMPDIR + 'a/b/c').mode.toString(8), '40755');
  });

  it('chownSync', () => {
    let uid = userid.uid('www-data');
    filesystem.chownSync(TMPDIR + 'a', 'www-data', true);
    assert.equal(fs.statSync(TMPDIR + '/a').uid, uid);
  });
});