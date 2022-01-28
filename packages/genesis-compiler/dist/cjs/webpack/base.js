"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseConfig = void 0;
const webpack_chain_1 = __importDefault(require("webpack-chain"));
const utils_1 = require("../utils");
class BaseConfig extends utils_1.BaseGenesis {
    constructor(ssr, target) {
        var _a, _b;
        super(ssr);
        const config = (this.config = new webpack_chain_1.default());
        config.mode(this.ssr.isProd ? 'production' : 'development');
        config.set('target', ssr.getBrowsers(target));
        config.output.publicPath(target == 'client' ? 'auto' : this.ssr.publicPath);
        config.resolve.extensions.add('.js');
        this.ready = this.ssr.plugin.callHook('chainWebpack', {
            target,
            config
        });
        config.output.pathinfo(false);
        config.stats('errors-warnings');
        const alias = (_b = (_a = ssr.options) === null || _a === void 0 ? void 0 : _a.build) === null || _b === void 0 ? void 0 : _b.alias;
        if (typeof alias === 'object') {
            Object.keys(alias).forEach((k) => {
                const v = alias[k];
                config.resolve.alias.set(k, v);
            });
        }
    }
    async toConfig() {
        await this.ready;
        return this.config.toConfig();
    }
}
exports.BaseConfig = BaseConfig;
