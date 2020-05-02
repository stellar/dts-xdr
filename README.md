`dts-xdr` is a library for generating TypeScript declarations (.d.ts) for [js-xdr](https://github.com/stellar/js-xdr) auto-generated files.

# Usage

> OUT=types.d.ts npx jscodeshift -t src/transform.js sample/stellar-xdr_generated.js
