# Noto Serif KR

Google Fonts / Adobe Noto Serif Korean, SIL Open Font License 1.1 (see OFL.txt).
Downloaded from the official google/fonts repository at commit
`e7db6ca603fd4862010383ff17ffd6cc4ffac1c0`:
https://github.com/google/fonts/blob/e7db6ca603fd4862010383ff17ffd6cc4ffac1c0/ofl/notoserifkr/NotoSerifKR%5Bwght%5D.ttf

Upstream Noto source revision, recorded by Google's METADATA.pb:
`985fa52c81c1d6692ccdd82bc3656e8fb932fd89` in notofonts/noto-cjk.
Copyright 2017–2024 Adobe. Unmodified outline design; Unicode subsets retain
variable weights 200–900, naming and license metadata. No synthetic bolding.

Rebuild with `tools/fonts/subset-korean.py SOURCE.ttf` using FontTools + Brotli.
`coverage.json` retains the original SHA256, every source cmap codepoint and
subset byte sizes. All 11,172 precomposed Hangul syllables, Jamo, Latin and
upstream Hanja are retained. Fonts are fetched by CSS unicode-range on demand;
there is no font preload. The shared web build emits hashed font assets and
includes them in its protected publication graph.
