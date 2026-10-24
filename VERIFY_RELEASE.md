# Verify a Cuspr release

GitHub Actions creates public edition ZIPs, `SHA256SUMS`, an SPDX JSON SBOM, and Sigstore bundles.

## Checksums

From the downloaded artifact directory:

```powershell
Get-Content SHA256SUMS
Get-FileHash .\Cuspr-0.4.0-beta-Free.zip -Algorithm SHA256
```

Compare the lowercase hash with the matching `SHA256SUMS` line.

## Sigstore/cosign

Install cosign, then verify a blob against its bundle and the repository workflow identity:

```powershell
cosign verify-blob `
  --bundle .\Cuspr-0.4.0-beta-Free.zip.sigstore.json `
  --certificate-identity-regexp "https://github.com/CusprAstro/CusprAstro.github.io/.github/workflows/release-beta.yml@refs/heads/main" `
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" `
  .\Cuspr-0.4.0-beta-Free.zip
```

Repeat for the desired public artifact and `SHA256SUMS`.

Sigstore proves artifact integrity and the GitHub Actions workflow identity. It is **not Windows Authenticode**. Windows can still display an unknown-publisher warning until the owner purchases/configures an Authenticode certificate.

The local unlocked Pro test ZIP is intentionally not uploaded or signed by the public workflow.
