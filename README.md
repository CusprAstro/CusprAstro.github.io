# Cuspr v0.3.0 beta

Live app: https://cusprastro.github.io/

Cuspr is a private, installable astrology app for birth charts, written readings, transit forecasts and a real-ephemeris Cosmic Planner. It runs as a single browser file or an offline-capable Windows Electron app. Birth profiles stay in local storage and are not uploaded.

## v0.3 consumer beta

- **Cosmic Planner:** day/month calendar with transit-derived scores for overall momentum, luck, love, career, money and purchases, non-medical health and energy, travel, creativity and entertainment, home and family, communication and learning, and rest and reflection
- Best and caution days, suggested and avoid actions, score rationale, strength/confidence, Moon theme, color and movie genre
- Category filters, date detail, local seven-day cache and Pro history navigation
- **Chart:** tropical zodiac, Placidus houses, aspects and downloadable wheel
- **Reading and forecast:** natal interpretation plus transits, eclipses, stations, ingresses and secondary progressions
- **Chart Twins, sources, news and discussion**
- Responsive keyboard-accessible interface for mobile and desktop

Astrology is symbolic and offered for reflection and entertainment. Planner scores are not medical, financial, legal, safety or travel advice.

## Editions

| | Free | Free with Ads | Supporter | Pro |
|---|---:|---:|---:|---:|
| Advertising | none | restrained sponsored cards | none | none |
| Cosmic Planner | rolling 7 days | current month | current month | current month + 24-month history |
| Reading | first 3 sections | complete | complete | complete |
| Forecast | 3 months | 6 months | 6 months | 12 months |
| Chart twins | top 3 | top 10 | top 10 | top 25 |
| Saved profiles | 2 | 10 | 10 | unlimited |
| Print / save PDF | - | yes | yes | yes |

Free with Ads is an explicit opt-in and receives Supporter feature limits. Sponsored cards appear only on Home, Plans, the end of News and the end of Forecast. They use ordinary links—no trackers, injected scripts, popups or automatic downloads—and carry an affiliate disclosure.

Configured affiliate destinations:

- `https://adguard.com/?aid=138471`
- `https://adguard-vpn.com/?aid=138471`
- `https://adguard-dns.io/?aid=138471`

Promo/install link arrays are present in `app/license.js` but intentionally empty until owner-supplied URLs are available.

## Purchase verification

Gumroad product IDs:

- Pro: `B2HpRnlL66EA931sJ9xOlg==`
- Supporter: `S0wa78i_Tu7s5_A65WTrPg==`

These are **product IDs, not buyer keys and not storefront URLs**. A customer must paste the buyer/license key from a real Gumroad purchase. Cuspr verifies it through Gumroad's official `POST /v2/licenses/verify` endpoint, using an allowlisted Electron IPC proxy in the desktop build. Successful entitlements are cached locally for offline use and revalidated periodically; revoked/refunded purchases are removed when Gumroad confirms they are inactive. Full keys are never logged and users can remove the cached entitlement from Plans.

The actual Gumroad storefront URLs and real purchaser keys were not supplied, so the app does not invent checkout links or fake verification success. PayPal.me/lircin remains available. Seller-issued complimentary `CUSPR1` keys signed with ECDSA P-256 remain supported:

```powershell
node tools\keygen.js init
node tools\keygen.js issue pro "buyer@email"
```

The private key defaults to `D:\AstroChart\private` and must never be committed.

## Build and test

Requirements: Python 3 with Pillow, Node.js 22, and desktop dependencies installed with `npm ci` in `desktop\`.

```powershell
node tests\run-tests.js
python app\bundle.py - index.html
.\scripts\build-release.ps1 -Version 0.3.0-beta
```

The release script creates:

- `release\Cuspr-0.3.0-beta-web.zip`
- `release\Cuspr-0.3.0-beta-windows-x64.zip`
- `release\SHA256SUMS`

`-IncludeTestBuild` additionally creates `release\Cuspr-0.3.0-beta-unlocked-pro-test.zip` for local QA only. It is intentionally excluded from the GitHub Actions release workflow and must not be publicly shipped or sold. The normal public build is universal: edition access is selected by ad opt-in or verified entitlement rather than forced at build time.

## Artifact signing

`.github/workflows/release-beta.yml` builds the public artifacts, generates an SPDX JSON SBOM, writes `SHA256SUMS`, and uses keyless Sigstore/cosign OIDC signing. Each artifact and the checksum file receives a `.sigstore.json` bundle. Workflow permissions are limited to `contents: read` and `id-token: write`.

Sigstore bundles prove the workflow identity and artifact integrity. They are **not Windows Authenticode signatures**, so Windows may still show an unknown-publisher warning until a separate code-signing certificate is configured.

## Project layout

- `app\`: editable web source and bundler
- `desktop\`: Electron wrapper
- `tests\`: dependency-free behavioral/static tests
- `scripts\build-release.ps1`: local reproducible packaging
- `.github\workflows\pages.yml`: Pages deployment
- `.github\workflows\release-beta.yml`: beta build, SBOM and signing

Astronomical positions use [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT). Famous-chart source notes remain in the app's Method screen.

## License

[MIT](LICENSE)
