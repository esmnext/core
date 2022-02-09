import vm from 'vm';
import path from 'path';
import fs from 'fs';
import nativeModule from 'module';
export class NodeVM {
    constructor(filename, sandbox = {}) {
        this.filename = filename;
        this.sandbox = sandbox;
        this.files = {};
    }
    require() {
        return this._require(this.filename);
    }
    destroy() {
        this.files = {};
        this.sandbox = {};
    }
    _require(id) {
        const files = this.files;
        if (files[id]) {
            return files[id];
        }
        const filename = require.resolve(id);
        const code = nativeModule.wrap(fs.readFileSync(filename, { encoding: 'utf-8' }));
        const factory = vm.runInNewContext(code, this.sandbox, {
            filename: filename,
            displayErrors: true
        });
        const dirname = path.dirname(filename);
        const module = { exports: {} };
        const _require = (id) => {
            if (path.isAbsolute(id)) {
                return this._require(id);
            }
            return this._require(path.resolve(dirname, id));
        };
        factory.call(module.exports, module.exports, _require, module, filename, dirname);
        files[id] = module.exports;
        return module.exports;
    }
}
