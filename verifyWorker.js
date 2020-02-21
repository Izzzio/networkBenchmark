/**
 * Signs checker
 */

const {
    Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

if(isMainThread) {
    module.exports = function verify(txs) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: txs
            });
            worker.on('message', (message) => {
                if(message) {
                    resolve(true);
                } else {
                    reject(new Error('Invalid sign'));
                }
            });
            worker.on('error', (e) => {
                console.log(e);
                reject(e);
            });
            worker.on('exit', (code) => {
                if(code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    };
} else {

    const {verify} = require('./iz3-fast-crypto/index');
    const txs = workerData;
    //console.log('Verify worker task length', txs.length);
    //console.time('WORKER');
    for (let tx of txs) {
        if(!verify(tx.data, tx.sign, tx.pubkey)) {
            parentPort.postMessage(false);
            break;
        }
    }
    //console.log('Verify worker end');
    //console.timeEnd('WORKER');

    parentPort.postMessage(true);

}