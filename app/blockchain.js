const sha256 = require('sha256');

const Block = require('./block');

function Blockchain() {
    this.chain = Array();
    this.pending_transactions = Array();

    this.self_url;
    this.nodes = Array();

    this.genesisBlock();
}

Blockchain.prototype.genesisBlock = function () {
    let block = new Block(0, new Date().getTime())
    block.hash = '0';
    this.chain.push(block);
}

Blockchain.prototype.addBlock = function (nonce, timestamp) {
    let block = new Block(nonce, timestamp);
    block.index = this.chain.length;
    block.prev_hash = this.getLatest().hash;
    block.transactions = this.pending_transactions;
    block.hash = block.calcHash();
    this.pendingTransactions = Array();
    this.chain.push(block);
    return block;
}

Blockchain.prototype.getLatest = function () {
    return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createTransaction = function (sender, receiver, amount, timestamp) {
    return {
        amount,
        sender,
        receiver,
        timestamp
    }
}

Blockchain.prototype.addTransaction = function (transaction) {
    this.pending_transactions.push(transaction);
    return this.chain.length;
}

Blockchain.prototype.hashBlock = function (prev_hash, data, nonce, timestamp) {
    return sha256(prev_hash + String(nonce) + String(timestamp) + JSON.stringify(data));
} 

Blockchain.prototype.proofOfWork = function (prev_hash, data) {
    let nonce = 0;
    let timestamp = new Date().getTime();
    let hash = this.hashBlock(prev_hash, data, nonce, timestamp);

    while (hash.substring(0,4) !== '0000') {
        nonce++;
        timestamp = new Date().getTime();
        hash = this.hashBlock(prev_hash, data, nonce, timestamp);
    }
    return nonce;
}

Blockchain.prototype.validateChain = function (blockchain) {
    let valid = true;

    for(let i = 1; i < blockchain.length; i++) {
        const curr_block = blockchain[i];
        const prev_block = blockchain[i-1];

        const hash = this.hashBlock(prev_block.hash, {
            transactions: curr_block.transactions,
            index: curr_block.index
        }, curr_block.nonce, curr_block.timestamp);

        if (hash.slice(-4) !== '0000')
            valid = false;
        if(prev_block.hash !== curr_block.prev_hash)
            valid = false;
    }

    valid = valid && 
        blockchain[0].hash === '0' && 
        blockchain[0].prev_hash === '0' && 
        blockchain[0].nonce === 0 && 
        blockchain[0].transactions.length === 0;

    return valid;
}

module.exports = Blockchain;

