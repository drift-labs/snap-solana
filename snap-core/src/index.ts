import "@metamask/snaps-types";
import {
  Divider,
  Text,
  divider,
  heading,
  panel,
  text,
} from "@metamask/snaps-ui";
import {
  Keypair,
  SerializeConfig,
  SimulatedTransactionResponse,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { deriveSolanaKeypair } from "./keypair";

// const SOLANA_CLUSTER_URL = "https://api.mainnet-beta.solana.com";


const SOLANA_CLUSTER_URL = "https://tx-sim.drift.trade";

const DEBUG = false;

export interface SimulationResultsRPCResponse {
  jsonrpc: string;
  result: {
    context: {
      slot: number;
      apiVersion: string;
    };
    value?: SimulatedTransactionResponse;
  };
  id: number;
}

export const simulateTransaction = async (
  serializedTx: Buffer,
  addresses?: string[],
  id = 1
) => {
  const secondaryParams = {
    replaceRecentBlockhash: true,
    encoding: "base64",
  };

  if (addresses) {
    // @ts-ignore
    secondaryParams.accounts = {
      encoding: "jsonParsed",
      addresses,
    };
  }

  const body = JSON.stringify({
    id,
    jsonrpc: "2.0",
    method: "simulateTransaction",
    params: [serializedTx.toString("base64"), secondaryParams],
  });

  const res = await fetch(SOLANA_CLUSTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body
  });

  if (res.status >= 400) {
    throw new Error(`Error - ${res.status} ${res.statusText}`);
  }

  let data: SimulationResultsRPCResponse;

  try {
    data = (await res.json()) as SimulationResultsRPCResponse;
  } catch (err) {
    const textdata = await res.text();
    throw new Error(`${res.status} ${res.statusText} ${textdata}`);
  }

  return {
    results: data?.result.value,
    body
  }
};

export const getSimulatedTransactionBalanceChanges = async (
  simulationResults: SimulatedTransactionResponse,
  addresses: string[],
  walletAddress: string
) => {
  const accountsChanged: any[] = [];

  // Also we need to know the current balance here, as well as the decimals
  // In order to display human readable balance change
  // So another rpc call for current balances?
  simulationResults.accounts?.forEach((account, i) => {
    if (
      account?.owner === "11111111111111111111111111111111" &&
      addresses[i] === walletAddress
    ) {
      accountsChanged.push({
        symbol: "SOL",
        lamports: account?.lamports,
        address: addresses[i],
      });
    } else {
      accountsChanged.push({
        // data: account?.data,
        mint: "",
        symbol: "Unknown", // TODO how to get this?
        lamports: account?.lamports,
        address: addresses[i],
      });
    }
  });

  return accountsChanged.map((account) => {
    return JSON.stringify(account);
  });
};

const getSimulateTransactionDisplayText = async (
  serializedTx: Buffer,
  walletAddress: string,
  addresses?: string[]
) => {
  const simulationResultsText = [];

  try {
    const {results: simulationResults, body} = await simulateTransaction(
      serializedTx,
      addresses
    );
    simulationResultsText.push(text(body))
    if (simulationResults) {
      // simulationResultsText.push(text(JSON.stringify(simulationResults)));
      const balanceChanges = await getSimulatedTransactionBalanceChanges(
        simulationResults,
        addresses || [],
        walletAddress
      );
      balanceChanges.forEach((balanceChange) => {
        simulationResultsText.push(text(balanceChange));
      });
    } else {
      simulationResultsText.push(text("Transaction simulation failed:"));
      simulationResultsText.push(text("Unknown error"));
      simulationResultsText.push(
        text(
          "You can still send this transaction, but estimated balance changes are unavailable"
        )
      );
    }
  } catch (err) {
    simulationResultsText.push(text("Transaction simulation failed:"));
    simulationResultsText.push(text(`${err}`));
    simulationResultsText.push(
      text(
        "You can still send this transaction, but estimated balance changes are unavailable"
      )
    );
  }

  // simulationResultsText.push(text(serializedTx.toString("base64")));

  return simulationResultsText;
};

export const showDebugDialog = (err: any) => {
  snap.request({
    method: "snap_dialog",
    params: {
      type: "alert",
      content: panel([text(`${err}`)]),
    },
  });
};

/**
 * Shows the Solana public key in Metamask, mostly just for testing
 */
export const showPublicKeyHandler = async () => {
  const keypair = await deriveSolanaKeypair();

  return snap.request({
    method: "snap_dialog",
    params: {
      type: "alert",
      content: panel([
        text(`Your Solana public key: `),
        text(`${keypair?.publicKey.toString()}`),
      ]),
    },
  });
};

/**
 * Returns the public key for use in the UI that Metmask is connected to
 */
export const getPublicKeyHandler = async () => {
  try {
    const keypair = await deriveSolanaKeypair();
    return keypair?.publicKey?.toString();
  } catch (err) {
    if (DEBUG) {
      showDebugDialog(err);
    }
    throw err;
  }
};

/**
 * A Transaction param for signing
 */
export type TransactionParams = {
  /**
   * JSON.stringified Buffer -- the mm json rpc handles this a little differently than a plain JSON.stringify, because the buffer becomes an object with keys and values instead of an actual array. From the UI side though, it should just be passed into the json rpc as a buffer.
   */
  transaction: Record<string, number>;

  /**
   * A Solana SerializeConfig to be used with the transaction when serializing the signed transaction.
   */
  serializeConfig?: SerializeConfig;

  /**
   * Set to true if this is a versioned transaction
   */
  isVersionedTransaction?: boolean;
};

/**
 * All parameters for for signTransactionHandler
 */
export type SignTransactionParams = {
  /**
   * Origin url of the request, this will be displayed to the user
   */
  origin: string;

  /**
   * (Optional): Account index to derive, if you want to derive a different account index. default: 0
   */
  accountIndex?: number;
} & TransactionParams;

const optionalBooleanTypes = ["undefined", "boolean"];
const optionalNumberTypes = ["undefined", "number"];

function typeCheckTransactionParams(params: TransactionParams) {
  if (typeof params.transaction !== "object") {
    throw new TypeError("TypeError: transaction must be a serialized Buffer");
  } else {
    for (const key in params.transaction) {
      if (
        typeof key !== "string" ||
        typeof params.transaction[key] !== "number"
      ) {
        throw new TypeError(
          "TypeError: transaction must be a serialized Buffer"
        );
      }
    }
  }

  if (params.serializeConfig !== undefined) {
    if (
      typeof params.serializeConfig != "object" ||
      !optionalBooleanTypes.includes(
        typeof params.serializeConfig.requireAllSignatures
      ) ||
      !optionalBooleanTypes.includes(
        typeof params.serializeConfig.verifySignatures
      )
    ) {
      throw new TypeError(
        "TypeError: serializedConfig must be a SerializeConfig type from @solana/web3.js"
      );
    }
  }

  if (!optionalBooleanTypes.includes(typeof params.isVersionedTransaction)) {
    throw new TypeError("TypeError: isVerionedTransaction must be a boolean");
  }
}

function typeCheckSignTransactionParams(params: SignTransactionParams) {
  typeCheckTransactionParams({
    transaction: params.transaction,
    serializeConfig: params.serializeConfig,
    isVersionedTransaction: params.isVersionedTransaction,
  });

  if (typeof params.origin !== "string") {
    throw new TypeError("TypeError: origin must be a string");
  }

  if (!optionalNumberTypes.includes(typeof params.accountIndex)) {
    throw new TypeError("TypeError: accountIndex must be a number");
  }
}

/**
 * Signs a single Solana transaction
 */
export const signTransactionHandler = async (params: SignTransactionParams) => {
  try {
    typeCheckSignTransactionParams(params);

    const byteArray = Object.keys(params.transaction).map(
      (key) => params.transaction[key]
    );
    const buf = Buffer.from(byteArray);

    const keypair = (await deriveSolanaKeypair(params.accountIndex)) as Keypair;

    const walletAddress = keypair.publicKey.toBase58();

    if (params.isVersionedTransaction) {
      const tx = VersionedTransaction.deserialize(buf);

      const accountKeys = tx.message.getAccountKeys();
      const addresses = accountKeys.staticAccountKeys.map((acct) =>
        acct.toBase58()
      );
      const simulationResultsText = await getSimulateTransactionDisplayText(
        buf,
        walletAddress,
        addresses
      );

      const instructionDetailsText: Text[] = [];

      tx.message.compiledInstructions.forEach((instruction, index) => {
        const programIndex = instruction.programIdIndex;
        const accountKeys = tx.message.getAccountKeys();
        const programAccountKey = accountKeys.get(programIndex);
        const programId = programAccountKey?.toString() || "unknown";
        const data = instruction.data
          ? Buffer.from(instruction.data)?.toString("base64")
          : "";

        instructionDetailsText.push(text("\n"));
        instructionDetailsText.push(text(`**Instruction #${index + 1}**`));
        instructionDetailsText.push(text(`**Program:** ${programId}`));
        instructionDetailsText.push(text(`**Data:** [${data}]`));
      });

      // How can we make this message more user-friendly?
      const confirmed = await snap.request({
        method: "snap_dialog",
        params: {
          type: "confirmation",
          content: panel([
            heading(`${params.origin} wants you to approve a transaction:`),
            ...simulationResultsText,
            divider(),
            ...instructionDetailsText,
          ]),
        },
      });

      if (confirmed) {
        tx.sign([keypair]);

        const signedTransaction = Buffer.from(tx.serialize());

        return {
          transaction: signedTransaction.toJSON(),
        };
      } else {
        throw new Error("User rejected transaction");
      }
    } else {
      const tx = Transaction.from(buf);

      const addresses: Set<string> = new Set();

      tx.instructions.forEach((ix) => {
        ix.keys.forEach((key) => {
          addresses.add(key.pubkey.toBase58());
        });
      });

      const simulationResultsText = await getSimulateTransactionDisplayText(
        buf,
        walletAddress,
        [...addresses]
      );

      const instructionDetailsText: Text[] = [];
      tx.instructions.forEach((instruction, index) => {
        const programId = instruction.programId?.toString() || "unknown";
        const data = instruction.data.toString("base64");

        instructionDetailsText.push(text("\n"));
        instructionDetailsText.push(text(`**Instruction #${index + 1}**`));
        instructionDetailsText.push(text(`**Program:** ${programId}`));
        instructionDetailsText.push(text(`**Data:** ${data}`));
      });

      // How can we make this message more user-friendly?
      const confirmed = await snap.request({
        method: "snap_dialog",
        params: {
          type: "confirmation",
          content: panel([
            heading(`${params.origin} wants you to approve a transaction:`),
            divider(),
            ...simulationResultsText,
            divider(),
            ...instructionDetailsText,
          ]),
        },
      });

      if (confirmed) {
        tx.sign(keypair);

        const signatures = tx.signatures;
        const signedTransaction = tx.serialize(params?.serializeConfig);

        return {
          signatures: signatures.map((sig) => ({
            publicKey: sig.publicKey.toString(),
            signature: sig.signature?.toJSON(),
          })),
          transaction: signedTransaction.toJSON(),
        };
      } else {
        throw new Error("User rejected transaction");
      }
    }
  } catch (err) {
    if (DEBUG) {
      showDebugDialog(err);
    }
    throw err;
  }
};

/**
 * All parameters for signAllTransactionsHandler
 */
export type signAllTransactionsParams = {
  /**
   * Origin url of the request, this will be displayed to the user
   */
  origin: string;

  /**
   * (Optional): Account index to derive, if you want to derive a different account index. default: 0
   */
  accountIndex?: number;

  transactions: TransactionParams[];
};

function typeCheckSignAllTransactionParams(params: signAllTransactionsParams) {
  params.transactions.forEach(
    ({ transaction, serializeConfig, isVersionedTransaction }) => {
      typeCheckTransactionParams({
        transaction,
        serializeConfig,
        isVersionedTransaction,
      });
    }
  );

  if (typeof params.origin !== "string") {
    throw new TypeError("TypeError: origin must be a string");
  }

  if (!optionalNumberTypes.includes(typeof params.accountIndex)) {
    throw new TypeError("TypeError: accountIndex must be a number");
  }
}

/**
 * Signs all Solana transactions in params.transactions
 */
export const signAllTransactionsHandler = async (
  params: signAllTransactionsParams
) => {
  try {
    typeCheckSignAllTransactionParams(params);

    const instructionDetailsText: Text[] = [];

    // Turn all JSON params into Transaction objects
    const transactions = params.transactions.map((paramTx, txIndex) => {
      const byteArray = Object.keys(paramTx.transaction).map(
        (key) => paramTx.transaction[key]
      );
      const buf = Buffer.from(byteArray);

      instructionDetailsText.push(divider());
      instructionDetailsText.push(text(`**Transaction ${txIndex + 1}**`));

      if (paramTx.isVersionedTransaction) {
        const tx = VersionedTransaction.deserialize(buf);

        // Pretty print tx + instruction details
        tx.message.compiledInstructions.forEach((instruction, index) => {
          const programIndex = instruction.programIdIndex;
          const accountKeys = tx.message.getAccountKeys();
          const programAccountKey = accountKeys.get(programIndex);
          const programId = programAccountKey?.toString() || "unknown";

          const data = instruction.data
            ? Buffer.from(instruction.data)?.toString("base64")
            : "";

          instructionDetailsText.push(text("\n"));
          instructionDetailsText.push(text(`**Instruction #${index + 1}**`));
          instructionDetailsText.push(text(`**Program:** ${programId}`));
          instructionDetailsText.push(text(`**Data:** ${data}`));
        });

        return tx;
      } else {
        const tx = Transaction.from(buf);

        // Pretty print tx + instruction details
        tx.instructions.forEach((instruction, index) => {
          const programId = instruction.programId?.toString() || "unknown";
          const data = instruction.data?.toString("base64") || "";

          instructionDetailsText.push(text("\n"));
          instructionDetailsText.push(text(`**Instruction #${index + 1}**`));
          instructionDetailsText.push(text(`**Program:** ${programId}`));
          instructionDetailsText.push(text(`**Data:** ${data}`));
        });

        return tx;
      }
    });

    const confirmed = await snap.request({
      method: "snap_dialog",
      params: {
        type: "confirmation",
        content: panel([
          heading(
            `${params.origin} wants you to approve ${transactions.length} transactions:`
          ),
          ...instructionDetailsText,
        ]),
      },
    });

    if (confirmed) {
      const keypair = (await deriveSolanaKeypair(
        params.accountIndex
      )) as Keypair;

      const signed = transactions.map((_tx, index) => {
        const isVersionedTransaction =
          params.transactions[index].isVersionedTransaction;

        if (isVersionedTransaction) {
          const tx = _tx as VersionedTransaction;
          tx.sign([keypair]);

          const signedTransaction = Buffer.from(tx.serialize());

          return {
            transaction: signedTransaction.toJSON(),
          };
        } else {
          const tx = _tx as Transaction;
          tx.sign(keypair);
          const signatures = tx.signatures;
          const serializeConfig = params.transactions[index].serializeConfig;
          const signedTransaction = tx.serialize(serializeConfig);

          return {
            signatures: signatures.map((sig) => ({
              publicKey: sig.publicKey.toString(),
              signature: sig.signature?.toJSON(),
            })),
            transaction: signedTransaction.toJSON(),
          };
        }
      });

      return signed;
    } else {
      throw new Error("User rejected transaction");
    }
  } catch (err) {
    if (DEBUG) {
      showDebugDialog(err);
    }
    throw err;
  }
};
