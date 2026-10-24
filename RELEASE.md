# Release process

## Local test packages

```powershell
python -m pip install pillow
python tools\release.py
node tests\test.js
```

The Gumroad-facing Supporter and Pro ZIPs require real purchaser keys. `Cuspr-0.3.0-beta-pro-test.zip` bypasses licensing and must stay local. Do not upload Supporter, Pro or Pro test packages to a public GitHub release.

The Gumroad icon is `release-assets\branding\cuspr-gumroad-icon-600.png`.

## Public signed packages

Push a `v0.3.0-beta` tag after tests and Gumroad validation. The release workflow builds only Free and Free with Ads, creates `SHA256SUMS` and an SPDX SBOM, then keylessly signs each public artifact with Cosign.

```powershell
cosign verify-blob `
  --bundle Cuspr-0.3.0-beta-free.zip.bundle `
  --certificate-identity-regexp "https://github.com/CusprAstro/CusprAstro.github.io/.github/workflows/release.yml@" `
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" `
  Cuspr-0.3.0-beta-free.zip
```

These signatures prove artifact integrity and workflow identity. They are not Authenticode signatures for Windows executables.

## Storefront configuration still required

Add the public Gumroad product-page URLs in `app\license.js`:

- `LICENSE_CONFIG.gumroad.products.supporter.storefront`
- `LICENSE_CONFIG.gumroad.products.pro.storefront`

Product IDs are already configured for verification. Never substitute product IDs for purchaser license keys during testing.
