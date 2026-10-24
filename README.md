# Cuspr v0.4.0 beta

**Website:** https://cusprastro.github.io/<br>
**Launch the app:** https://cusprastro.github.io/launch/<br>
**Plans and activation:** https://cusprastro.github.io/launch/#plans

Cuspr is a private astrology studio and real-ephemeris Cosmic Planner. The GitHub Pages property is both the commercial website and the installable web app: the root is a polished product/commerce experience, while `/launch/` is the full application. The same app is packaged for Windows with aligned visuals and features.

## Platforms

- **Android and desktop browsers:** installable Progressive Web App with manifest, service worker, offline shell, update prompts, responsive touch UI and safe-area handling
- **Windows x64:** Electron desktop package using the same generated app bundle and theme
- Cuspr is accurately described as an installable PWA on Android, **not a native APK**

## Editions and recurring membership

| Edition | Price | Access |
|---|---:|---|
| Free | $0 | ad-free essentials, rolling seven-day planner |
| Free with Ads | $0 | Supporter feature limits with restrained disclosed affiliate cards |
| Supporter | **$4.99/month** | full current month, complete reading, six-month forecast, printing, ad-free |
| Pro | **$9.99/month** | 24-month planner history, 12-month forecast, unlimited profiles, ad-free |

Supporter and Pro use recurring Gumroad memberships. Existing product IDs:

- Supporter: `S0wa78i_Tu7s5_A65WTrPg==`
- Pro: `B2HpRnlL66EA931sJ9xOlg==`

Membership activation requires the buyer license key from a real purchase and verifies the matching product ID through Gumroad's official license endpoint. Cancelled, ended, refunded and chargebacked memberships are rejected. Successful verification is cached locally, checked every seven days, and grants a clearly disclosed 14-day offline grace period from the last successful verification.

Real storefront/permalink URLs and real purchaser keys have not been supplied. Cuspr does not fake them. Follow [GUMROAD_SETUP.md](GUMROAD_SETUP.md) to create/configure the memberships, paste the URLs, test real keys, and define final refunds.

PayPal.me/lircin remains a one-time tip and does not grant recurring access unless the owner manually issues a signed complimentary `CUSPR1` key.

## Product

- Real planetary positions from Astronomy Engine
- Cosmic Planner with 11 scored dimensions, rationale, confidence, best/caution days and Moon themes
- Tropical natal chart, Placidus houses, aspects and exports
- Written reading, transit forecast, progressions, lunations and eclipses
- Chart Twins, curated references, astrology news and optional GitHub Discussions
- Local profiles and entitlement cache; no Cuspr account database
- Static, disclosed affiliate cards only in the approved four locations; no ad network scripts or trackers

Astrology is symbolic and for reflection/entertainment, not medical, legal, financial, safety or travel advice.

## Develop and test

Requirements: Python 3 + Pillow, Node.js 22, and `npm ci` in `desktop\`.

```powershell
node tests\run-tests.js
python app\bundle.py free launch\index.html
.\scripts\build-release.ps1 -Version 0.4.0-beta -IncludeTestBuild
```

`scripts\build-release.ps1` creates five edition ZIPs. Each of the four public edition ZIPs contains a PWA folder and a Windows x64 folder; the fifth is the local-only unlocked Pro Windows test package. Supporter/Pro public packages are **locked** and still require a matching active Gumroad key; they are not forced paid builds.

The public GitHub workflow uploads only locked public artifacts. It generates SHA-256 checksums, an SPDX SBOM and keyless Sigstore bundles. See [VERIFY_RELEASE.md](VERIFY_RELEASE.md). Sigstore artifact signing is not Windows Authenticode.

## Stable integration URLs

Concise public facts for the Quasar Labs site are maintained at [product-facts.html](product-facts.html), including stable links, pricing, platform language and product IDs.

The existing `cusprastro.github.io` user/org site is already the ideal dedicated GitHub subdomain. A custom domain can be added through GitHub Pages DNS/CNAME settings later; another `github.io` hostname cannot be invented without another GitHub account/organization.

## Legal and support

- [Privacy](privacy.html)
- [Terms](terms.html)
- [Refunds and cancellations](refunds.html)
- [Affiliate disclosure](affiliate.html)
- [Membership help](membership.html)
- [Support](support.html)

## License

[MIT](LICENSE)
