---
titleSuffix: Przewodnik implementacji renderowania po stronie klienta w frameworku Gez
description: Szczegółowy opis mechanizmu renderowania po stronie klienta w frameworku Gez, w tym statyczna kompilacja, strategie wdrażania i najlepsze praktyki, pomagające programistom w osiągnięciu wydajnego renderowania frontendu w środowisku bezserwerowym.
head:
  - - meta
    - property: keywords
      content: Gez, renderowanie po stronie klienta, CSR, statyczna kompilacja, renderowanie frontendu, wdrażanie bezserwerowe, optymalizacja wydajności
---

# Renderowanie po stronie klienta

Renderowanie po stronie klienta (Client-Side Rendering, CSR) to technika renderowania stron wykonywana po stronie przeglądarki. W Gez, gdy aplikacja nie może być wdrożona na instancji serwera Node.js, można wygenerować statyczny plik `index.html` podczas etapu kompilacji, umożliwiając czyste renderowanie po stronie klienta.

## Scenariusze użycia

Renderowanie po stronie klienta jest zalecane w następujących scenariuszach:

- **Środowiska statycznego hostingu**: takie jak GitHub Pages, CDN i inne usługi hostingu, które nie obsługują renderowania po stronie serwera
- **Proste aplikacje**: małe aplikacje, które nie wymagają szybkiego ładowania pierwszej strony ani wysokiego poziomu SEO
- **Środowisko deweloperskie**: szybkie podglądanie i debugowanie aplikacji podczas fazy rozwoju

## Konfiguracja

### Konfiguracja szablonu HTML

W trybie renderowania po stronie klienta należy skonfigurować uniwersalny szablon HTML. Ten szablon będzie służył jako kontener aplikacji, zawierający niezbędne odwołania do zasobów i punkt montowania.

```ts title="src/entry.server.ts"
import type { RenderContext } from '@gez/core';

export default async (rc: RenderContext) => {
    // Zatwierdzenie zbierania zależności
    await rc.commit();
    
    // Konfiguracja szablonu HTML
    rc.html = `
<!DOCTYPE html>
<html>
<head>
    ${rc.preload()}           // Preładowanie zasobów
    <title>Gez</title>
    ${rc.css()}               // Wstrzyknięcie stylów
</head>
<body>
    <div id="app"></div>
    ${rc.importmap()}         // Mapowanie importów
    ${rc.moduleEntry()}       // Moduł wejściowy
    ${rc.modulePreload()}     // Preładowanie modułów
</body>
</html>
`;
};
```

### Generowanie statycznego HTML

Aby użyć renderowania po stronie klienta w środowisku produkcyjnym, należy wygenerować statyczny plik HTML podczas etapu kompilacji. Gez dostarcza funkcję hooka `postBuild` do realizacji tej funkcjonalności:

```ts title="src/entry.node.ts"
import type { GezOptions } from '@gez/core';

export default {
    async postBuild(gez) {
        // Generowanie statycznego pliku HTML
        const rc = await gez.render();
        // Zapis pliku HTML
        gez.writeSync(
            gez.resolvePath('dist/client', 'index.html'),
            rc.html
        );
    }
} satisfies GezOptions;
```