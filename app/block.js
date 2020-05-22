const sha256 = require('sha256');

function Block(nonce, timestamp) {
    this.index = 0;
    this.timestamp = timestamp;
    this.nonce = nonce;
    this.prev_hash = '0';
    this.transactions = Array();
    this.hash = '0';
}


Block.prototype.calcHash = function () {
    return sha256(this.index + this.prev_hash + this.timestamp + this.transactions + this.nonce);
}

module.exports = Block;

//install these dependencies node-gyp, libxmljs