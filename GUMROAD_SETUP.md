# Gumroad membership setup for Cuspr

Cuspr v0.4 uses recurring Gumroad memberships. The code already knows these product IDs:

| Edition | Monthly price | Product ID |
|---|---:|---|
| Supporter | $4.99/month | `S0wa78i_Tu7s5_A65WTrPg==` |
| Pro | $9.99/month | `B2HpRnlL66EA931sJ9xOlg==` |

Product IDs identify the product during license verification. They are **not storefront URLs and not purchaser license keys**.

## 1. Create or convert the products

In Gumroad:

1. Open **Products** and create one product named **Cuspr Supporter**.
2. Choose a membership/subscription product and set billing to **$4.99 monthly**.
3. Enable Gumroad license keys for the product.
4. Explain that the key in the receipt activates the website/PWA and Windows app.
5. Repeat for **Cuspr Pro** at **$9.99 monthly**.
6. Confirm the resulting product IDs match the table above. If Gumroad assigns different IDs, update `LICENSE_CONFIG.gumroadProducts` in `app/license.js`.

Recommended product copy:

- Supporter: full current-month Cosmic Planner, complete reading, six-month forecast, 10 profiles/twins limit, printing, and no sponsored cards.
- Pro: everything in Supporter plus 24 months of planner history, 12-month forecasts, 25 chart twins, unlimited profiles, and future Pro features.
- State clearly that astrology is for reflection/entertainment and not medical, legal or financial advice.

## 2. Enable license keys

In each product's content/settings:

1. Enable **Generate a unique license key per sale**.
2. Ensure the license key appears in the receipt and Gumroad Library.
3. Do not paste a seller API token, private key or purchaser key into this repository.
4. Cuspr uses Gumroad's public license verification endpoint and does not need a seller access token.

## 3. Add storefront/permalink URLs

Copy the public product URL for each membership, such as `https://yourname.gumroad.com/l/...`.

Edit `app/license.js`:

```js
storefrontUrls: {
  supporter: "PASTE_SUPPORTER_PUBLIC_URL",
  pro: "PASTE_PRO_PUBLIC_URL",
},
```

Rebuild with:

```powershell
python app\bundle.py free launch\index.html
```

Until real URLs are supplied, Cuspr deliberately shows “storefront URL pending.” It never constructs or guesses a checkout URL from a product ID.

## 4. Test with real purchases

Use Gumroad's test purchase mode if available for the membership product, or make a real purchase you can refund:

1. Buy Supporter and copy the buyer license key from the receipt.
2. Open `https://cusprastro.github.io/launch/#plans`.
3. Select **Supporter**, paste the key, and choose **Verify and unlock**.
4. Confirm Supporter features unlock and the status shows the 14-day offline grace date.
5. Try that Supporter key while selecting Pro; it must fail because the product ID does not match.
6. Repeat with a real Pro key.
7. Test **Restore / revalidate purchase** on a second browser/profile.

Automated tests use mocked Gumroad responses. A final real-key test remains mandatory before advertising membership sales.

## 5. Cancellation, refunds and chargebacks

- Buyers cancel using the manage-membership link in their Gumroad receipt or Gumroad Library.
- Cuspr revalidates active memberships after seven days.
- A successfully verified membership remains usable offline for 14 days from the last successful verification.
- If Gumroad reports `cancelled`, `subscription_cancelled_at`, `subscription_ended_at`, `refunded` or `chargebacked`, Cuspr removes paid access.
- After the offline grace date, Cuspr returns to Free until it can verify an active membership.
- Define the final seller refund window in Gumroad and mirror it in `refunds.html`.

## 6. PayPal and complimentary keys

`https://paypal.me/lircin` remains an optional one-time tip. PayPal does not automatically grant a recurring entitlement. If the owner chooses to reward a PayPal supporter, manually issue a signed complimentary key:

```powershell
node tools\keygen.js issue supporter "buyer@email"
```

The signing private key stays outside the repository.
