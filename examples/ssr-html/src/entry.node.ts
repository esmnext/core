import http from 'node:http';
import path from 'node:path';
import type { GezOptions } from '@gez/core';

export default {
    // 设置应用的唯一名字，如果有多个项目，则名字不能重复
    name: 'ssr-html',
    // 本地执行 dev 和 build 时会使用
    async createDevApp(gez) {
        return import('@gez/rspack').then((m) =>
            m.createApp(gez, (buildContext) => {
                // 可以在这里修改 Rspack 编译的配置
            })
        );
    },
    async createServer(gez) {
        const server = http.createServer((req, res) => {
            // 静态文件处理
            gez.middleware(req, res, async () => {
                // 传入渲染的参数
                const ctx = await gez.render({
                    url: req.url
                });
                // 响应 HTML 内容
                res.end(ctx.html);
            });
        });
        // 监听端口
        server.listen(3005, () => {
            console.log('http://localhost:3005');
        });
    },
    async generateHtml(gez) {
        const ctx = await gez.render(
            { url: '/' },
            {
                base: '/gez/'
            }
        );
        gez.write(
            path.resolve(gez.getProjectPath('dist/client'), 'index.html'),
            ctx.html
        );
    }
} satisfies GezOptions;
