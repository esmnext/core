import './layout.css';

interface LayoutOptions {
    url?: string;
}

export function layout(slot: string, options: LayoutOptions = {}) {
    // 判断链接是否激活
    const isActive = (path: string) => {
        // 对于空路径的特殊处理
        if (!path) {
            return '';
        }

        // 如果 options.url 不存在，返回空字符串
        if (!options.url) {
            return '';
        }

        // 从 URL 中移除查询参数
        const urlWithoutQuery = options.url.split('?')[0];
        const pathWithoutQuery = path.split('?')[0];

        // 对于首页的特殊处理
        if (path === '/' && urlWithoutQuery === '/') {
            return 'active';
        }

        return urlWithoutQuery === pathWithoutQuery ? 'active' : '';
    };

    return `
<div class="layout">
    <header class="header">
        <div>
            <h1><img src="https://www.gez-esm.com/logo.svg" alt="Gez Logo" width="48" height="48"></h1>
            <nav class="nav">
                <a href="/" class="${isActive('/')}">首页</a>
                <a href="/about" class="${isActive('/about')}">关于我们</a>
                <a href="https://github.com/dp-os/gez/tree/master/examples/ssr-html" target="_blank">示例代码</a>
            </nav>
        </div>
    </header>
    <main class="main">
        ${slot}
    </main>
</div>
`;
}
