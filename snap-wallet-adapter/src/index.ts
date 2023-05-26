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
	icon: string;
	readyState: WalletReadyState;
	connecting: boolean;
	supportedTransactionVersions?: ReadonlySet<TransactionVersion>;
	snapId: string;
	snapVersion: string;

	public publicKey: PublicKey;
	public autoApprove: boolean;

	public constructor({
		snapId,
		snapVersion,
		url,
	}: {
		snapId: string;
		snapVersion: string;
		url: string;
	}) {
		super();

		this.snapId = snapId;
		this.snapVersion = snapVersion;

		// For now, pass these in. Eventually sould be hosted somewhere probably
		this.url = url;

		// Not sure if this works as a public resource? We'll see
		this.icon =
			'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg';
	}

	public async signMessage(_message: Uint8Array): Promise<Uint8Array> {
		throw new Error('Method not implemented.');
	}

	// @ts-ignore
	public async signTransaction(tx: Transaction | VersionedTransaction) {
		// @ts-ignore -- why isn't this working?
		const signed = (await window.ethereum.request({
			method: 'wallet_invokeSnap',
			params: {
				snapId: this.snapId,
				request: {
					method: 'signTransaction',
					serializedTx: tx.serialize().toString(),
				},
			},
		})) as Transaction;

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
	 */
	public connect = async () => {
		if (!window.ethereum) {
			throw new Error('Metamask not detected');
		}

		console.log('connecting to snap');

		const installedSnaps = (await window.ethereum.request({
			method: 'wallet_getSnaps',
		})) as GetSnapsResponse;

		console.log('installedSnaps', installedSnaps);

		// If snap is not installed or version is outdated, ask to (re)install it
		// if (!installedSnaps['solana-wallet']) {
		// }

		// Then connect it

		await window.ethereum.request({
			method: 'wallet_requestSnaps',
			params: {
				[this.snapId]: {
					version: this.snapVersion,
				},
			},
		});

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

	public disconnect = async () => {};
}
