import {
	PublicKey,
	Transaction,
	// SignaturePubkeyPair,
	TransactionVersion,
	VersionedTransaction,
} from '@solana/web3.js';
import {
	BaseMessageSignerWalletAdapter,
	WalletName,
	WalletReadyState,
} from '@solana/wallet-adapter-base';

// The current version of the snap package
// Automatically generated when running yarn or yarn build
// The snap id should probably have a default imported like this too
import { SNAP_VERSION } from './version';

const metamaskIcon = 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg';

export type GetSnapsResponse = Record<string, Snap>;

export type Snap = {
	permissionName: string;
	id: string;
	version: string;
	initialPermissions: Record<string, unknown>;
};

export class SnapWalletAdapter extends BaseMessageSignerWalletAdapter {
	name: WalletName<string>;
	url: string;
	readyState: WalletReadyState;
	connecting: boolean;
	supportedTransactionVersions?: ReadonlySet<TransactionVersion>;
	snapId: string;
  icon = metamaskIcon;

  public static icon = metamaskIcon;

	public publicKey: PublicKey;
	public autoApprove: boolean;

	public constructor({
		snapId,
		url,
	}: {
		snapId: string;
		url: string;
	}) {
		super();

		this.snapId = snapId;
		this.url = url;
	}

	public async signMessage(_message: Uint8Array): Promise<Uint8Array> {
		throw new Error('Method not implemented.');
	}

	// @ts-ignore
	public async signTransaction(tx: Transaction | VersionedTransaction) {
    console.log('stringified tx: ', JSON.stringify(tx.serialize()));

		// @ts-ignore -- why isn't this working?
		const result = await window.ethereum.request({
			method: 'wallet_invokeSnap',
			params: {
				snapId: this.snapId,
				request: {
					method: 'signTransaction',
					transaction: tx.serialize()
				},
			},
		});

    console.log(JSON.stringify(result));

    const signed = Transaction.from(result);

		return signed;
	}

	// @ts-ignore
	public async signAllTransactions(txes: Transaction[]) {
		const results = await Promise.all(
			txes.map((tx) => this.signTransaction(tx))
		);

		return results;
	}

	/**
	 * Connects to a metamask snap
   *
   * @param forceUpdate - optional, forces the snap to be reinstalled on each connect if true
   *
	 */
	public connect = async (forceUpdate?: boolean) => {
		if (!window.ethereum) {
			throw new Error('Metamask not detected');
		}

		const installedSnaps = (await window.ethereum.request({
			method: 'wallet_getSnaps',
		})) as GetSnapsResponse;

		// console.log('installedSnaps', JSON.stringify(installedSnaps));

		// If snap is not installed or version is outdated, ask to (re)install it
		if (!installedSnaps[this.snapId] || installedSnaps[this.snapId]?.version !== SNAP_VERSION || forceUpdate) {
      // console.log('snap needs to be installed/updated');
      await window.ethereum.request({
        method: 'wallet_requestSnaps',
        params: {
          [this.snapId]: {
            version: SNAP_VERSION,
          },
        },
      });
    }

		const publicKey = new PublicKey(
			await window.ethereum.request({
				method: 'wallet_invokeSnap',
				params: {
					snapId: this.snapId,
					request: {
						method: 'getPublicKey',
					},
				},
			})
		);

		this.publicKey = publicKey;

		this.emit('connect', publicKey);
	};

	public disconnect = async () => {
    // Not sure if there's much for us to do here?
    this.publicKey = undefined;
    this.snapId = undefined;
    this.emit('disconnect');
  };
}
