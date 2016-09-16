"use strict";
const Filesystem_1 = require('../Filesystem');
const assert = require('assert');
const fs = require('fs');
const cp = require('child_process');
var filesystem = new Filesystem_1.Filesystem();
describe('Filesystem.mkdir', function () {
    it('should create nested set of dirs', function () {
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
