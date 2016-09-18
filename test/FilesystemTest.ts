import {Filesystem} from '../Filesystem';
import assert = require('assert');
import fs = require('fs');
import cp = require('child_process');

var filesystem = new Filesystem();

describe('Filesystem.mkdir', function() {
  var cleanup = (done) => { cp.exec('rm -rf a'); done(); };
  before((done) => { cleanup(done); filesystem.mkdir(['a', 'b', 'c'], 0o777, '');});
  after((done) => cleanup(done));

  it('mkdir: create nested set of dirs', function() {
    let stat = fs.statSync('a/b/c');
    assert.ok(stat.isDirectory());
  });

  it('mkdir: created dirs should have 777 permissions', () => {
    //      S_IFMT     0170000   bit mask for the file type bit field
    //      S_IFSOCK   0140000   socket
    //      S_IFLNK    0120000   symbolic link
    //      S_IFREG    0100000   regular file
    //      S_IFBLK    0060000   block device
    //      S_IFDIR    0040000   directory --->>> we got this
    //      S_IFCHR    0020000   character device
    //      S_IFIFO    0010000   FIFO
    let stat = fs.statSync('a/b/c');
    assert.equal(stat.mode.toString(8), '40777');
  });

  it ('copy: existence of copied file', () => {
    before((done) => { fs.writeFileSync('./test_file', '1'); done(); });
    after((done) => { fs.unlink('./test_file'); done(); });
    filesystem.copy('./test_file', './test_file');
    assert.ok(fs.statSync('./test_file').isFile());
  });
});