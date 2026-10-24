# Cuspr v0.3.0-beta

Live app: https://cusprastro.github.io/

Cuspr is a privacy-minded astrology app for the web and Windows. It calculates natal charts locally, writes a structured natal reading, compares chart twins, and turns real ephemeris/transit data into a practical daily **Cosmic Planner**.

## Consumer beta highlights

- **Natal chart:** tropical zodiac, Placidus houses (whole-sign polar fallback), aspects, downloadable SVG/PNG wheel
- **Professional reading:** personality, relationships, work, money, well-being and growth themes
- **Cosmic Planner:** daily and monthly views for overall/luck, love, career, money, energy, travel, creativity, home, communication and rest
- **Daily context:** best and caution windows, suggested actions, avoid guidance, signal strength/confidence, transit rationale, Moon sign, color cue and entertainment genre
- **Long-range forecast:** transits, stations, ingresses, lunations, eclipses and secondary progressions
- **History:** past-date selection for reflective review
- **Privacy:** profiles stay in browser storage; no Cuspr account is required
- **Accessibility:** keyboard focus, semantic controls, mobile navigation, improved contrast and reduced-motion support

Astrology is symbolic guidance for reflection and entertainment. It is not medical, legal, financial, relationship or safety advice.

## Editions

| | Free | Free with Ads | Supporter | Pro |
|---|---:|---:|---:|---:|
| Natal wheel, houses and aspects | yes | yes | yes | yes |
| Reading | first 3 sections | complete | complete | complete |
| Transit forecast | 3 months | 6 months | 6 months | 12 months |
| Cosmic Planner | 1 month | 6 months | 6 months | 12 months |
| Chart twins | 3 | 10 | 10 | 25 |
| Profiles | 2 | 10 | 10 | unlimited |
| Print / PDF | - | yes | yes | yes |
| Sponsored cards | no | restrained | no | no |

Free with Ads has Supporter-level features. Sponsored cards are clearly labelled, use only publisher-supplied AdGuard affiliate links, never run tracking scripts, never pop up, and never start downloads automatically. Core chart and natal-reading content stays ad-free.

## Run and test

```powershell
python app\bundle.py - index.html
node tests\test.js
```

Serve the repository instead of using `file://` when testing web APIs:

```powershell
python -m http.server 4173
```

## Build edition ZIPs

```powershell
python -m pip install pillow
python tools\release.py
```

This creates deterministic local artifacts under ignored `release-assets\`:

- `Cuspr-0.3.0-beta-free.zip`
- `Cuspr-0.3.0-beta-free-with-ads.zip`
- `Cuspr-0.3.0-beta-supporter.zip`
- `Cuspr-0.3.0-beta-pro.zip`
- `Cuspr-0.3.0-beta-pro-test.zip` — unlocked publisher-only test build
- `branding\cuspr-gumroad-icon-600.png` — exact 600×600 Gumroad icon
- `SHA256SUMS` and an SPDX SBOM

`python tools\release.py --public-only` builds only Free and Free with Ads. The GitHub release workflow uses this mode, so paid product packages and the unlocked Pro test build are never attached to public releases.

For Windows Electron packaging, first run `python tools\prepare_desktop.py <edition>`, then `npm ci` and `npm run pack` in `desktop\`. Generated Electron files and output remain ignored.

## Gumroad and complimentary licensing

The supplied Gumroad strings are configured as **product IDs**, not purchaser keys:

- Supporter: `S0wa78i_Tu7s5_A65WTrPg==`
- Pro: `B2HpRnlL66EA931sJ9xOlg==`

Customers paste the license key from their Gumroad receipt. Cuspr verifies it against Gumroad's official `/v2/licenses/verify` endpoint, caches successful entitlement metadata locally for offline use, periodically revalidates it, and supports removal. Electron verification uses a narrowly allowlisted IPC handler. Full keys are never logged.

The Gumroad storefront URLs are still missing. Add them to `LICENSE_CONFIG.gumroad.products.supporter.storefront` and `.pro.storefront` in `app\license.js` when available. PayPal.me/lircin remains configured.

Locally signed `CUSPR1.…` complimentary keys remain supported. `tools\keygen.js` keeps the private ECDSA key outside the repository; never commit it.

## Releases and signatures

`.github\workflows\release.yml` builds public packages, produces checksums and an SPDX SBOM, then uses Cosign keyless OIDC signing. Tagged builds publish each artifact with `.sig`, `.pem` and `.bundle` verification material.

Cosign signatures verify workflow provenance and artifact integrity. They are **not Windows Authenticode signatures** and do not remove SmartScreen warnings from Electron executables. See [RELEASE.md](RELEASE.md).

## Data and method

Planetary positions come from [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT). Time zones use the browser's IANA database. The Chart Twins dataset includes curated timed charts and Wikidata-derived date/place records; unknown times are calculated at local noon and do not compare angles.

Chat setup is documented in [SETUP.md](SETUP.md).

## License

[MIT](LICENSE)
