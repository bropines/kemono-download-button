// Public half of the locale signing key (ECDSA P-256). Packs downloaded from the repo are used only
// when their signature verifies against it. The private key never leaves the maintainer's machine
// (.keys/locale-signing.pem, gitignored); scripts/verify-locales.mjs reads this file in CI.
// Rotating the key: generate a new pair, replace this JWK, re-sign every locale (npm run sign-locales).
export const LOCALE_PUBLIC_KEY_JWK = {
  kty: 'EC',
  crv: 'P-256',
  x: 'X1vEtpksZ-9oJjcsTYvnA1jpF0-I-C_O3TkirNrnBpE',
  y: 'ZZUFDeiE7TC8o_ZGTtbpyzU1zSod1IDRdd6z21UgQ6E',
};
