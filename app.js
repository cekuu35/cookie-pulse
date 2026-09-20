import { Connection, PublicKey, Transaction, TransactionInstruction } from 'https://esm.sh/@solana/web3.js@1.98.4';
import bs58 from 'https://esm.sh/bs58@6.0.0';

const RPC = 'https://rpc.cookiescan.io';
const COOKIE_GENESIS = '9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2';
const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const connection = new Connection(RPC, 'confirmed');
let publicKey = null;
let walletAccount = null;
let nightly = null;

const $ = (id) => document.getElementById(id);
const setStatus = (text, kind = '') => { $('status').textContent = text; $('status').className = `status ${kind}`; };

async function connectWallet() {
  nightly = window.nightly?.solana;
  const legacyWallet = window.solana;
  if (!nightly?.features?.['standard:connect']?.connect && !legacyWallet?.connect) {
    setStatus('Install or enable the Nightly wallet extension.', 'error');
    return;
  }
  try {
    if (nightly?.features?.['standard:connect']?.connect) {
      const result = await nightly.features['standard:connect'].connect({});
      walletAccount = result.accounts[0];
      publicKey = new PublicKey(walletAccount.address);
    } else {
      const result = await legacyWallet.connect();
      publicKey = result.publicKey;
    }
    $('wallet').textContent = `${publicKey.toBase58().slice(0, 6)}…${publicKey.toBase58().slice(-6)}`;
    $('connect').textContent = 'Wallet connected';
    $('publish').disabled = false;
    $('switch').disabled = false;
    $('publish').textContent = 'Publish on-chain pulse';
    setStatus('Connected. Publishing requires a wallet signature and network fee.', 'info');
  } catch (error) { setStatus(error.message || 'Wallet connection cancelled.', 'error'); }
}

async function switchToCookieChain() {
  if (!nightly?.changeNetwork) { setStatus('Nightly network switching is unavailable. Open Nightly network settings and add Cookie Chain manually.', 'error'); return; }
  try {
    await nightly.changeNetwork({ genesisHash: COOKIE_GENESIS, url: RPC });
    setStatus('Cookie Chain network selected. Reconnect the wallet, then publish again.', 'success');
  } catch (error) { setStatus(error.message || 'Network switch cancelled.', 'error'); }
}

async function publishPulse() {
  if (!publicKey) return;
  const message = $('message').value.trim();
  if (!message) { setStatus('Write a short message first.', 'error'); return; }
  try {
    const balance = await connection.getBalance(publicKey, 'confirmed');
    if (balance === 0) throw new Error('AccountNotFound: this wallet has no COOK on Cookie Chain. Switch networks, then fund the wallet with a small amount of COOK for the network fee.');
    setStatus('Preparing transaction…', 'info');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey }).add(
      new TransactionInstruction({ keys: [], programId: MEMO_PROGRAM, data: new TextEncoder().encode(`cookie-pulse:${message}`) })
    );
    let signature;
    const features = nightly?.features;
    const payload = {
      account: walletAccount,
      transaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
      chain: 'solana:mainnet',
      options: { commitment: 'confirmed' }
    };
    const signAndSend = features?.['solana:signAndSendTransaction'] || features?.['standard:signAndSendTransaction'];
    const sign = features?.['solana:signTransaction'] || features?.['standard:signTransaction'];
    if (signAndSend?.signAndSendTransaction) {
      const result = await signAndSend.signAndSendTransaction(payload);
      signature = bs58.encode(result[0].signature);
    } else if (sign?.signTransaction) {
      const signed = await sign.signTransaction(payload);
      signature = await connection.sendRawTransaction(signed[0].signedTransaction, { preflightCommitment: 'confirmed' });
    } else {
      if (!window.solana?.signAndSendTransaction) throw new Error('Nightly signing API is unavailable. Update the Nightly extension and reload.');
      const signed = await window.solana.signAndSendTransaction(tx);
      signature = signed.signature;
    }
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
    setStatus(`Confirmed: ${signature}`, 'success');
  } catch (error) { setStatus(error.message || 'Transaction failed or was cancelled.', 'error'); }
}

async function refreshBlock() {
  try { $('block').textContent = `Latest block: ${await connection.getBlockHeight('confirmed')}`; }
  catch (error) { $('block').textContent = `RPC unavailable: ${error.message}`; }
}

$('connect').addEventListener('click', connectWallet);
$('switch').addEventListener('click', switchToCookieChain);
$('publish').addEventListener('click', publishPulse);
$('refresh').addEventListener('click', refreshBlock);
refreshBlock();
