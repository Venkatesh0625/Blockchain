const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');

const { uuid } = require('uuidv4');

const Blockchain = require('./app/blockchain');
const coin = new Blockchain();

const port = process.argv[2] || 3000;
const peer_id = uuid().split('-').join('');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Endpoint to get the chain
app.get('/blockchain', (req, res) => {
    res.status(200).json({
        peer_id,
        chain: coin.chain
    });
});

// Endpoint to mine a block with transaction
app.get('/mine_block', (req, res) => {

    const prev_hash = coin.getLatest().hash;
    const data = {
        transactions: coin.pending_transactions,
        index: coin.getLatest().index + 1
    }

    const { nonce, timestamp } = coin.proofOfWork(prev_hash, data);
    const block = coin.addBlock(nonce, timestamp);

    const req_queue = Array();

    coin.nodes.forEach(node_uri => {

        const req_instance = request({
            uri: node_uri + '/broadcast-block',
            method: 'POST',
            body: { block },
            json: true
        });

        req_queue.push(req_instance);
    });

    Promise.all(req_queue)
        .then(data => {
            //This transaction is for miner from '000..' which is generated amount from the network
            const req_instance = request({
                uri: coin.self_url + '/broadcast-transaction',
                method: 'POST',
                body: {
                    transaction: {
                        sender: '0'.repeat(32),
                        receiver: peer_id,
                        amount: 0.65,
                        timestamp: new Date().getTime()
                    }
                },
                json: true
            }) 
            .then(data => res.status(200).json({
                    response: 'Block mined and updated in network',
                    block
                })
            );
        });
    
});

// Endpoint to broadcast transaction to the connected node and itself
app.post('/broadcast-transaction', (req, res) => {
    const transaction = req.body.transaction;
    
    const valid = coin.transaction.indexOf(transaction) === -1;
    if(valid) {
        coin.addTransaction(transaction);
        const req_queue = Array();

        coin.nodes.forEach(node_url => {

            const req_instance = request({
                uri: node_url + '/transaction',
                method: 'POST',
                body: { transaction }, 
                json: true
            });

            req_queue.push(req_instance);
        });

        Promise.all(req_queue)
            .then(data => {
                res.status(400).json({ response: 'Transaction added and broadcasted successfully' })  
            });
    }
});

// Endpoint to broadcast block 
app.post('/broadcast-block', (req, res) => {
    block = req.body.block;

    const valid = coin.getLatest().hash === block.prev_hash && (coin.getLatest().index + 1) === block.index;

    if(valid) {
        coin.chain.push(block);
        coin.pending_transactions = Array();
        res.status(200).json({
            response: ''
        });

        const req_queue = Array();

        coin.nodes.forEach(node_url => {

            const req_instance = request({
                uri:node_url + '/broadcast-block',
                method: 'POST',
                body: { block },
                json: true
            });

            req_queue.push(req_instance);
        });

        Promise.all(req_queue)
            .then(data => res.status(200).json({ response: '' }))


    } else {
        res.status(400).json({
            response: ''
        });
    };


});

// Endpoint to add a node to a single node to self 
app.post('/add-node', (req, res) => {
    const url = req.body.url;

    const not_exists = coin.nodes.indexOf(url) === -1;
    const not_self = coin.self_url !== url;

    if(not_exists && not_self) 
        coin.nodes.push(node_url)

    res.status(200).json({ response: `Added node ${url}` });
});



app.listen(3000);
