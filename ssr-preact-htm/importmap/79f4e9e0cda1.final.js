(() => {
const base = document.currentScript.getAttribute('data-base');
const importmap = {"imports":{"ssr-preact-htm\u002Fsrc\u002Fentry.client":"\u002Fssr-preact-htm\u002Fsrc\u002Fentry.client.8f87cd31.final.js"}};
if (importmap.imports && base) {
    const imports = importmap.imports;
    Object.entries(imports).forEach(([k, v]) => {
        imports[k] = base + v;
    });
}
document.head.appendChild(Object.assign(document.createElement('script'), {
type: 'importmap',
innerHTML: JSON.stringify(importmap)
}));
})();