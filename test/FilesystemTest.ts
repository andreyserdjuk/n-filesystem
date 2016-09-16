import {Filesystem} from '../Filesystem';
import assert = require('assert');
import fs = require('fs');
import cp = require('child_process');

var filesystem = new Filesystem();

describe('Filesystem.mkdir', function() {
  it('should create nested set of dirs', function() {
    before((done) => {
      cp.exec('rm -rf a');
    });

    assert.ok(true);
    filesystem.mkdir(['a', 'b', 'c'], 777, '');
    let stat = fs.statSync('a/b/c');
    assert.ok(stat.isDirectory());
    assert.equal(stat.mode, 777);
  });
});