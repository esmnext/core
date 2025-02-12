import type { GezOptions } from '@gez/core';
import express from 'express';

export default {
    async createDevApp(gez) {
        return import('@gez/rspack-vue').then((m) =>
            m.createRspackVue2App(gez)
        );
    },
    async createServer(gez) {
        const server = express();
        server.use(gez.middleware);
        server.get('*', async (req, res) => {
            res.setHeader('Content-Type', 'text/html;charset=UTF-8');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Keep-Alive', 'timeout=5');
            const result = await gez.render({
                importmapMode: 'js',
                params: { url: req.url }
            });
            res.send(result.html);
        });
        server.listen(3002, () => {
            console.log('http://localhost:3002');
        });
    },
    modules: {
        imports: {
            'ssr-vue2-remote': 'root:../ssr-vue2-remote/dist'
        },
        externals: {
            vue: 'ssr-vue2-remote/npm/vue',
            '@gez/vue-ui': 'ssr-vue2-remote/npm/@gez/vue-ui'
        }
    },
    async postCompileProdHook(gez) {
        const render = await gez.render({
            params: { url: '/' }
        });
        gez.writeSync(
            gez.resolvePath('dist/client', 'index.html'),
            render.html
        );
    }
} satisfies GezOptions;
