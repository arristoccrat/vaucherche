# Public-site fonts

Self-hosted so builds never fetch from Google Fonts (a bad response from it
failed Vercel builds) and the site loads no third-party font CSS.

Made from the variable/static TTFs in github.com/google/fonts (ofl/unbounded,
ofl/manrope, ofl/ibmplexmono), all under the SIL Open Font License 1.1 (the
OFL-*.txt files here):

- `Unbounded-wght600-800.woff2`: Unbounded[wght], weight axis limited to 600–800.
- `Manrope-wght400-800.woff2`: Manrope[wght], weight axis limited to 400–800.
- `IBMPlexMono-{Medium,SemiBold,Bold}.woff2`: IBM Plex Mono 500 / 600 / 700.

Each is subset to Latin, Latin-1, Cyrillic (incl. Bulgarian), general
punctuation, arrows, € and №, all OpenType features kept:

```
fonttools varLib.instancer "Unbounded[wght].ttf" wght=600:800 -o unbounded.ttf
pyftsubset unbounded.ttf --flavor=woff2 --layout-features='*' \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0300-0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2000-206F,U+20AC,U+20BD,U+2116,U+2122,U+2190-2199,U+2212,U+2215,U+FEFF,U+FFFD"
```
