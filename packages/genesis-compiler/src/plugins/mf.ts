import {
    CompilerType,
    MF,
    Plugin,
    SSR,
    WebpackHookParams
} from '@fmfe/genesis-core';
import find from 'find';
import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import write from 'write';

export class MFPlugin extends Plugin {
    public constructor(ssr: SSR) {
        super(ssr);
    }
    public chainWebpack({ config, target }: WebpackHookParams) {
        const { ssr } = this;
        const mf = MF.get(ssr);
        const exposes: Record<string, string> = {};
        const entryName = mf.entryName;
        const remotes: Record<string, string> = {};

        Object.keys(mf.exposes).forEach((key) => {
            const filename = mf.exposes[key];
            const fullPath = path.isAbsolute(filename)
                ? filename
                : path.resolve(ssr.srcDir, filename);
            exposes[key] = fullPath;
        });
        mf.remotes.forEach((item) => {
            const varName = mf.name;
            const exposesVarName = mf.getVarName(item.name);
            remotes[item.name] = `promise new Promise(resolve => {
                var script = document.createElement('script')
                script.src = window["${exposesVarName}"];
                script.onload = function onload() {
                  var proxy = {
                    get: (request) => window["${varName}"].get(request),
                    init: (arg) => {
                      try {
                        return window["${varName}"].init(arg)
                      } catch(e) {
                        console.log('remote container already initialized')
                      }
                    }
                  }
                  resolve(proxy)
                }
                document.head.appendChild(script);
              })
              `;
        });
        const name = mf.name;

        config.plugin('module-federation').use(
            new webpack.container.ModuleFederationPlugin({
                name,
                filename: ssr.isProd
                    ? `js/${entryName}.[contenthash:8].js`
                    : `js/${entryName}.js`,
                exposes,
                remotes,
                shared: {
                    vue: {
                        singleton: true
                    },
                    'vue-router': {
                        singleton: true
                    }
                }
            })
        );
    }
    public afterCompiler(type: CompilerType) {
        const { ssr } = this;
        const mf = MF.get(ssr);
        const clientVersion = this._getVersion(ssr.outputDirInClient);
        const serverVersion = this._getVersion(ssr.outputDirInServer);
        const files = this._getFiles();
        const version = clientVersion + serverVersion;
        const text = JSON.stringify(
            {
                version,
                clientVersion,
                serverVersion,
                files
            },
            null,
            4
        );
        write.sync(
            path.resolve(ssr.outputDirInServer, `${mf.entryName}.json`),
            text,
            { newline: true }
        );
    }

    private _getVersion(root: string) {
        const { ssr } = this;
        const mf = MF.get(ssr);
        let version = '';
        const files = find.fileSync(path.resolve(root, './js'));
        const re = new RegExp(`${mf.entryName}\\..{8}.js`);
        const filename = files.find((filename) => {
            return re.test(filename);
        });
        if (filename) {
            const arr = filename.split('.');
            version = arr[1];
        }
        return version;
    }
    private _getFiles() {
        const { ssr } = this;
        const files = {};
        find.fileSync(path.resolve(ssr.outputDirInServer, './js')).forEach(
            (filename) => {
                const text = fs.readFileSync(filename, 'utf-8');
                const key = path.relative(ssr.outputDirInServer, filename);
                files[key] = text;
            }
        );
        return files;
    }
}
