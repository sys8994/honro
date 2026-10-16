const art=globalThis.HONRO_TITLE_ART;
globalThis.HONRO_TITLE_LOGO=art.logo;globalThis.HONRO_TITLE_HANJA=art.hanja;
globalThis.HONRO_TITLE_SCENE=`<picture class="title-painting"><source media="(orientation: portrait)" type="image/webp" srcset="${art.portrait}"><source media="(orientation: portrait)" type="image/jpeg" srcset="${art.portraitFallback}"><source type="image/webp" srcset="${art.landscape}"><img src="${art.landscapeFallback}" alt="" decoding="async" fetchpriority="high" onerror="this.hidden=true"></picture>`;
