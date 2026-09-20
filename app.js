import { Connection, PublicKey, Transaction, TransactionInstruction } from 'https://esm.sh/@solana/web3.js@1.98.4';

const RPC = 'https://rpc.cookiescan.io';
const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const connection = new Connection(RPC, 'confirmed');
let publicKey = null;

const $ = (id) => document.getElementById(id);
const setStatus = (text, kind = '') => { $('status').textContent = text; $('status').className = `status ${kind}`; };

async function connectWallet() {
  const wallet = window.solana;
  if (!wallet?.connect) {
    setStatus('Install or enable the Nightly wallet extension.', 'error');
    return;
  }
  try {
    const result = await wallet.connect();
    publicKey = result.publicKey;
    $('wallet').textContent = `${publicKey.toBase58().slice(0, 6)}…${publicKey.toBase58().slice(-6)}`;
    $('connect').textContent = 'Wallet connected';
    $('publish').disabled = false;
    $('publish').textContent = 'Publish on-chain pulse';
    setStatus('Connected. Publishing requires a wallet signature and network fee.', 'info');
  } catch (error) { setStatus(error.message || 'Wallet connection cancelled.', 'error'); }
}

async function publishPulse() {
  if (!publicKey) return;
  const message = $('message').value.trim();
  if (!message) { setStatus('Write a short message first.', 'error'); return; }
  try {
    setStatus('Preparing transaction…', 'info');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey }).add(
      new TransactionInstruction({ keys: [], programId: MEMO_PROGRAM, data: new TextEncoder().encode(`cookie-pulse:${message}`) })
    );
    const signed = await window.solana.signAndSendTransaction(tx);
    await connection.confirmTransaction({ signature: signed.signature, blockhash, lastValidBlockHeight }, 'confirmed');
    setStatus(`Confirmed: ${signed.signature}`, 'success');
  } catch (error) { setStatus(error.message || 'Transaction failed or was cancelled.', 'error'); }
}

async function refreshBlock() {
  try { $('block').textContent = `Latest block: ${await connection.getBlockHeight('confirmed')}`; }
  catch (error) { $('block').textContent = `RPC unavailable: ${error.message}`; }
}

$('connect').addEventListener('click', connectWallet);
$('publish').addEventListener('click', publishPulse);
$('refresh').addEventListener('click', refreshBlock);
refreshBlock();
