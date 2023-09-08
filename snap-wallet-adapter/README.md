<div align="center">
  <img height="120x" src="https://uploads-ssl.webflow.com/611580035ad59b20437eb024/616f97a42f5637c4517d0193_Logo%20(1)%20(1).png" />
</div>

# @drift-labs/snap-wallet-adapter

This is a wallet adapter for the [Connect by Drift MetaMask Snap](https://github.com/drift-labs/snap-solana) that implements the [Solana Wallet Standard](https://github.com/solana-labs/wallet-standard). Installing and adding this snap to your application gives your users the ability to use MetaMask to interact with Solana!

### Snap Version: 0.2.1

The wallet adapter is locked to this version of the Connect by Drift snap.

### Installation

To install:
`npm install --save @drift-labs/snap-wallet-adapter`

To use the adapter in your application, create a new wallet adapter using the `SnapWalletAdapter` constructor that is exported from this package:
```ts
import { SnapWalletAdapter } from '@drift-labs/snap-wallet-adapter';

const driftSnapWalletAdapter = new SnapWalletAdapter();
```

To listen to events and connect, use the same interface as other Wallet Standard adapters:
```ts
  driftSnapWalletAdapter.on('connect', handleConnect);
  driftSnapWalletAdapter.on('disconnect', handleDisconnect);
  driftSnapWalletAdapter.on('error', handleError);

  await driftSnapWAlletAdapter.connet();
```

To display the name of the adapter and the icon you can use the icon and name properties of the wallet adapter instance (react example):
```tsx
const jsx = (
  <div>
    <img src={driftSnapWalletAdapter.icon} />
    {driftSnapWalletAdapter.name}
  </div>
);
```

This allows the snap wallet adapter instance to be appended to an array of other Wallet Standard adapters, and seamlessly be displayed and interacted with without code changes.

The icon will display the MetaMask icon, and the name will disply as `Connect by Drift` which is the name of the snap.

When the user connects to this wallet, MetaMask will open and either directly connect to the Connect by Drift snap, or will prompt the user to install the Connect by Drift snap if they haven't done so before.


