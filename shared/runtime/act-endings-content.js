(function(G){'use strict';
// Art and exact ending copy are selected from the sole current catalogue.
G.HONRO_ACT_ENDINGS=structuredClone(G.HonroNarrativeCatalogue.data.actEndings);
if(G.HonroAct23V4?.preview()){delete G.HONRO_ACT_ENDINGS[20];delete G.HONRO_ACT_ENDINGS[30];}
})(globalThis);
