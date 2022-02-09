import Eventsource from 'eventsource';
import fs from 'fs';
import path from 'path';
import serialize from 'serialize-javascript';
import write from 'write';

import type * as Genesis from '.';
import { Plugin } from './plugin';
import type { Renderer } from './renderer';
import { SSR } from './ssr';

const mf = Symbol('mf');

interface Data {
    version: string;
    clientVersion: string;
    serverVersion: string;
    files: {};
}

class RemoteModule {
    public remote: RemoteItem;
    public constructor(remote: RemoteItem) {
        this.remote = remote;
        remote.ssr.sandboxGlobal[this.varName] = this;
    }
    public get varName () {
        const { mf, options } = this.remote;
        const name = options.name;
        const varName = mf.getWebpackPublicPathVarName(name);
        return varName;
    }
    public get filename () {
        const { serverVersion, mf, baseDir } = this.remote;
        const version = serverVersion ? `.${serverVersion}` : '';

        return path.resolve(
            baseDir,
            `js/${mf.entryName}${version}.js`
        );

    }
    public async init() {
        await this.remote.init();
    }
    public destroy () {
        delete global[this.varName]
    }
}

class RemoteItem {
    public ssr: Genesis.SSR;
    public options: Genesis.MFRemote;
    public version = '';
    public clientVersion = '';
    public serverVersion = '';
    public ready = new ReadyPromise<true>();
    private eventsource?: Eventsource;
    private remoteModule: RemoteModule;
    private renderer?: Renderer;
    public constructor(ssr: Genesis.SSR, options: Genesis.MFRemote) {
        this.ssr = ssr;
        this.options = options;
        this.remoteModule = new RemoteModule(this);
    }
    public get mf() {
        return MF.get(this.ssr);
    }
    public get baseDir() {
        return path.resolve(
            this.ssr.outputDirInServer,
            `remotes/${this.options.name}`
        );
    }
    public async init(renderer?: Renderer) {
        if (renderer) {
            this.renderer = renderer;
        }
        if (!this.eventsource) {
            this.eventsource = new Eventsource(this.options.serverUrl);
            this.eventsource.addEventListener('message', this.onMessage);
        }
        await this.ready.await;
    }
    public onMessage = (evt: MessageEvent) => {
        const data: Data = JSON.parse(evt.data);
        if (data.version === this.version) {
            return;
        }

        Object.keys(data.files).forEach((file) => {
            const text = data.files[file];
            const fullPath = path.resolve(this.baseDir, file);
            write.sync(fullPath, text);
        });
        this.version = data.version;
        this.clientVersion = data.clientVersion;
        this.serverVersion = data.serverVersion;

        const name = this.options.name;
        if (this.ready.finished) {
            this.renderer?.reload();
            console.log(`${name} remote dependent reload completed`);
        } else {
            console.log(`${name} remote dependent download completed`);
            this.ready.finish(true);
        }
    };
    public destroy() {
        const { eventsource } = this;
        if (eventsource) {
            eventsource.removeEventListener('message', this.onMessage);
            eventsource.close();
        }
        this.remoteModule.destroy();
    }
    public inject() {
        const { name, publicPath } = this.options;
        const { clientVersion, mf } = this;
        const version = clientVersion ? `.${clientVersion}` : '';
        const fullPath =
            publicPath + `/${name}/js/${mf.entryName}${version}.js`;
        const value = serialize(fullPath);
        const varName = mf.getWebpackPublicPathVarName(name);

        return `window["${varName}"] = ${value};`;
    }
}

class Remote {
    public items: RemoteItem[];
    public ssr: SSR;
    public constructor(ssr: Genesis.SSR) {
        this.ssr = ssr;
        this.items = this.mf.options.remotes.map(
            (opts) => new RemoteItem(ssr, opts)
        );
    }
    public get mf() {
        return MF.get(this.ssr);
    }
    public inject() {
        const { items } = this;
        if (!items.length) {
            return '';
        }
        const arr = items.map((item) => {
            return item.inject();
        });
        return `<script>${arr.join('')}</script>`;
    }
    public init(...args: Parameters<RemoteItem['init']>) {
        return Promise.all(this.items.map((item) => item.init(...args)));
    }
}

type ExposesWatchCallback = (data: Data) => void;

class Exposes {
    public ssr: Genesis.SSR;
    private subs: ExposesWatchCallback[] = [];
    public constructor(ssr: Genesis.SSR) {
        this.ssr = ssr;
    }
    public get mf() {
        return MF.get(this.ssr);
    }
    public watch(cb: ExposesWatchCallback, version = '') {
        this.subs.push(cb);
        const newVersion = this.readText(this.mf.outputExposesVersion);
        if (version !== newVersion) {
            const text = this.readText(this.mf.outputExposesFiles);
            text && cb(JSON.parse(text));
        }
        return () => {
            const index = this.subs.indexOf(cb);
            if (index > -1) {
                this.subs.splice(index, 1);
            }
        };
    }
    public emit() {
        const text = this.readText(this.mf.outputExposesFiles);
        if (!text) return;
        const data: Data = JSON.parse(text);
        this.subs.forEach((cb) => cb(data));
    }
    public readText(fullPath: string) {
        if (!fs.existsSync(fullPath)) {
            return '';
        }
        return fs.readFileSync(fullPath, { encoding: 'utf-8' });
    }
}

export class MFPlugin extends Plugin {
    public constructor(ssr: Genesis.SSR) {
        super(ssr);
    }
    public get mf() {
        return MF.get(this.ssr);
    }
    public renderBefore(context: Genesis.RenderContext): void {
        context.data.script += this.mf.remote.inject();
    }
}

export class MF {
    public static is(ssr: Genesis.SSR) {
        return ssr[mf] instanceof MF;
    }
    public static get(ssr: Genesis.SSR): MF {
        if (!this.is(ssr)) {
            throw new TypeError(`SSR instance: MF instance not found`);
        }
        return ssr[mf];
    }
    public options: Required<Genesis.MFOptions> = {
        remotes: [],
        exposes: {},
        shared: {}
    };
    public exposes: Exposes;
    public remote: Remote;
    public entryName = 'exposes';
    protected ssr: Genesis.SSR;
    protected mfPlugin: MFPlugin;
    public constructor(ssr: Genesis.SSR, options: Genesis.MFOptions = {}) {
        this.ssr = ssr;
        Object.assign(this.options, options);
        ssr[mf] = this;
        this.mfPlugin = new MFPlugin(ssr);
        this.exposes = new Exposes(ssr);
        this.remote = new Remote(ssr);
        ssr.plugin.use(this.mfPlugin);
        if (ssr.options?.build?.extractCSS !== false) {
            throw new TypeError(
                `To use MF plug-in, build.extractCSS needs to be set to false`
            );
        }
    }
    public get name() {
        return SSR.fixVarName(this.ssr.name);
    }
    public get outputExposesVersion() {
        return path.resolve(
            this.ssr.outputDirInServer,
            'vue-ssr-server-exposes-version.txt'
        );
    }
    public get outputExposesFiles() {
        return path.resolve(
            this.ssr.outputDirInServer,
            'vue-ssr-server-exposes-files.json'
        );
    }
    public getWebpackPublicPathVarName(name: string) {
        return `__webpack_public_path_${this.name}_${SSR.fixVarName(name)}`;
    }
}

export class ReadyPromise<T> {
    /**
     * 执行完成
     */
    public finish!: (value: T) => void;
    /**
     * 等待执行完成
     */
    public await: Promise<T>;
    /**
     * 是否已经执行完成
     */
    public finished = false;
    public constructor() {
        this.await = new Promise<T>((resolve) => {
            this.finish = (value: T) => {
                this.finished = true;
                resolve(value);
            };
        });
    }
    public get loading() {
        return !this.finished;
    }
}
