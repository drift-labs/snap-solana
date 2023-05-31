## Snap-solana
<br>

This repo contains a [Metamask Snap]((https://docs.metamask.io/snaps/)) that allows metamask to function as a solana wallet, and a wallet adapter that extends the [Solana wallet standard](https://github.com/solana-labs/wallet-standard) to connect to the snap.
<br><br>

---

### Setting up the project:
<br>
`cd snap && yarn`<br>
`cd snap-wallet-adapter && yarn`
<br><br>

---

### Building and running the project:
<br>

**Solana Wallet Snap:**

Run `yarn dev` from the `snap` folder. 

Snaps are served from a url which *must* either be localhost or npm. 

Running `yarn dev` in the `snap` folder will start webpack in watch mode, and start an express server to serve the snap bundle.

Some caveats: 
- We are currently not using the snaps cli (`@metamask/snaps-cli`) because it was throwing errors trying to compile `@solana/web3.js`. It's optional anyway but something to be aware of.
- Using webpack with a plugin for snaps instead.
- The `snaps-webpack-plugin` folder is a COPY of the official [snaps webpack plugin](https://github.com/MetaMask/snaps/tree/main/packages/snaps-webpack-plugin), because the official one threw the error `undefined is not a constructor` when trying to import and use in the webpack config. Possibly fixable by adjusting the project setup (using esm or ts for the webpack config?), we should revisit this later. For now the source code has been copied and changed to a named export which works. To rebuild the webpack plugin, run `yarn build-webpack-plugin`
<br><br>

**Wallet Adapter:**

Just run `yarn build && yarn link`, then run `yarn link @drift-labs/snap-wallet-adapter` from the Drift UI. It doesn't have a watch feature so you need to run this each time you make a change but it's pretty fast.

To use the wallet adapter in the UI with the Snap being served locally, set the `snapId` param of the constructor to: `local:http://localhost:8080`

In the Drift UI, you should set these environment variables for local development: 
```
NEXT_PUBLIC_MM_SNAP_ENABLED=true
NEXT_PUBLIC_MM_SNAP_ID=local:http://localhost:8080
NEXT_PUBLIC_MM_SNAP_VERSON=<current version>
```
<br><br>

---

### Publishing / Releases

New releases should update the npm package version of the wallet adapter and snap, add a git tag with the matching verison, and publish to npm.

Release automation coming soon.
