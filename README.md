# Cuspr (beta v0.1.0)

Live: https://cusprastro.github.io/

An interactive astrology app that runs entirely in your browser or offline as a Windows desktop app. Enter a birth date, time and place to get a natal chart, a written reading, and a forecast for the months ahead. Nothing is uploaded.

## Features

- **Chart:** tropical zodiac, Placidus houses, aspects, interactive wheel
- **Reading:** personality, career, health, happiness and life-challenge write-ups
- **Forecast:** transits, eclipses and progressions
- **Chart Twins:** finds the closest matches among 1,000 famous (and infamous) people
- **Astrologers & Sites:** a guide to well-regarded astrologers and astrology resources
- **Astrology News:** a feed from reputable astrology publications
- **Chat:** community discussion hosted on GitHub Discussions (via [giscus](https://giscus.app))

## Run it

- **Web:** open `index.html` in any modern browser (single self-contained file), or publish it with GitHub Pages using the included workflow.
- **Windows desktop (offline):** from `desktop/`, run `npm install` then `npm run pack`. Copy the built `index.html` into `desktop/` first.
- **Rebuild the single file:** `python app/bundle.py` (needs Pillow). Output goes to `app/dist/`.
- **Chat setup:** see [SETUP.md](SETUP.md).

## How it works

Planetary positions come from [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT). Local birth time is converted to UT with the IANA time zone database built into the browser. The Chart Twins data (`app/famous_data.js`) is precomputed by `app/build_famous.js`: 54 curated entries have commonly cited birth times, and the rest use local noon, so their Moon is approximate and Rising/Midheaven are not compared. Their birth dates and places come from Wikidata (CC0), ranked by Wikipedia page views.

## Beta

This is the first beta. Expect rough edges; please report issues or share feedback in Discussions.

## Disclaimer

Astrology is symbolic and offered for reflection and entertainment. Rankings of astrologers and sites are qualitative, and chart resemblance does not predict anyone's fate.

## License

[MIT](LICENSE)
