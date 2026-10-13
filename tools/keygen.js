/* Cuspr license tool (seller side).
   node keygen.js init               create signing key pair in the private folder and print the public JWK
   node keygen.js issue <tier> <who> make a license key (tier: supporter | pro)
   The private key never goes in the repository. Default folder: D:\AstroChart\private (override with CUSPR_KEY_DIR). */
const crypto = require("crypto"), fs = require("fs"), path = require("path");
const dir = process.env.CUSPR_KEY_DIR || "D:\\AstroChart\\private";
const priv = path.join(dir, "cuspr_private.pem"), pubf = path.join(dir, "cuspr_public.jwk.json");
const b64 = b => Buffer.from(b).toString("base64url");
const [cmd, tier, ...who] = process.argv.slice(2);
if (cmd === "init") {
  if (fs.existsSync(priv)) { console.error("Key already exists; refusing to overwrite."); process.exit(1); }
  fs.mkdirSync(dir, {recursive: true});
  const {privateKey, publicKey} = crypto.generateKeyPairSync("ec", {namedCurve: "P-256"});
  fs.writeFileSync(priv, privateKey.export({type: "pkcs8", format: "pem"}));
  const jwk = publicKey.export({format: "jwk"});
  fs.writeFileSync(pubf, JSON.stringify(jwk));
  console.log(JSON.stringify(jwk));
} else if (cmd === "issue" && ["supporter", "pro"].includes(tier) && who.length) {
  const payload = b64(JSON.stringify({t: tier, n: who.join(" "), i: new Date().toISOString().slice(0, 10)}));
  const sig = crypto.sign("sha256", Buffer.from(payload), {key: fs.readFileSync(priv), dsaEncoding: "ieee-p1363"});
  console.log("CUSPR1." + payload + "." + b64(sig));
} else { console.error("Usage: node keygen.js init | issue <supporter|pro> <name or email>"); process.exit(1); }
