# dts-xdr
[![Stellar](https://circleci.com/gh/stellar/dts-xdr.svg?style=shield)](https://circleci.com/gh/stellar/dts-xdr)

`dts-xdr` is a library for generating `TypeScript` declarations file (`.d.ts`) for [js-xdr](https://github.com/stellar/js-xdr) auto-generated files.

This library uses [jscodeshift](https://github.com/facebook/jscodeshift) to generate the definitions, follow the steps below to generate definitions.

## Setup

```sh
git clone https://github.com/stellar/dts-xdr.git
cd dts-xdr
yarn install
```

## Usage

You can use this library in two mode:

### Source replacement

The first one is using inline replacement which is the default mode when you call `jscodeshift`. The following will replace the given file with the generated code:

> npx jscodeshift -t src/transform.js sample/stellar-xdr_generated.js

After you run the command above, `sample/stellar-xdr_generated.js` will have the type definitions.

### Output mode

The second mode is specifying an output file, this mode won't change the source file. The following command will generate a new file called `stellar-xdr_generated.d.ts` with the `TypeScript` declarations:

> OUT=stellar-xdr_generated.d.ts npx jscodeshift -t src/transform.js sample/stellar-xdr_generated.js
