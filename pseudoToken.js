/**
 * Token transactions controller
 */

const verifyAsync = require('./verifyWorker');
const VERIFY_WORKERS = 6;

class PseudoToken {
    constructor(initialEmissions = [], walletObject) {
        this.wallets = {};
        this._totalSupply = 0;

        /**
         * @var {Wallet}
         */
        this._walletObject = walletObject;

        //Initial token minting
        for (let emission of initialEmissions) {
            this.mint(emission.to, emission.amount);
        }
    }

    _checkTxSign(tx) {
        return true;
        //return this._walletObject.verifyData(tx.data, tx.sign, tx.pubkey);
        //return false;
    }

    _createWalletIfNotExists(address) {
        if(typeof this.wallets[address] === 'undefined') {
            this.wallets[address] = 0;
        }
    }

    balanceOf(address) {
        this._createWalletIfNotExists(address);
        return this.wallets[address];
    }

    totalSupply() {
        return this._totalSupply;
    }

    mint(to, amount) {
        this._createWalletIfNotExists(to);
        this.wallets[to] += amount;

        this._totalSupply += amount;

        return true;
    }

    burn(from, amount) {
        this._createWalletIfNotExists(from);

        if(this.wallets[from] - amount < 0) {
            console.log('Insufficient funds', from);
            return false;
        }

        this.wallets[from] -= amount;

        this._totalSupply -= amount;

        return true;
    }

    transfer(from, to, amount) {
        this._createWalletIfNotExists(to);
        if(this.burn(from, amount)) {
            this.mint(to, amount);
            return true;
        }

        return false;
    }

    updateStateByTX(tx) {
        //Если подпись транзакции корректна то обрабатываем её
        if(this._checkTxSign(tx)) {
            this.transfer(tx.pubkey, tx.to, tx.amount);
        } else {
            console.log('Invalid TX sign', tx.pubkey, tx.sign);
        }
    }

    async _verifySigns(txs) {
        console.time('Verify');
        let delta = txs.length / VERIFY_WORKERS;
        let workers = [];

        let needWorkers =  Math.ceil(txs.length / delta);
        
        for (let i = 0; i < needWorkers; i++) {
            let workerTxs = txs.slice(0, Math.round(delta));
            txs = txs.slice(Math.round(delta));
            workers.push(verifyAsync(workerTxs));
        }

        console.log('Start workers', workers.length);

        try {
            await Promise.all(workers);
        } catch (e) {
            console.timeEnd('Verify');
            return false;
        }
        console.timeEnd('Verify');
        return true;
    }

    async processBlock(block) {
        console.log('Start block processing');

        if(await this._verifySigns(block.txs)) {
            console.time('Processing block');
            for (let tx of block.txs) {
                this.updateStateByTX(tx);
            }
            console.timeEnd('Processing block');
        } else {
            console.log('Invalid signs');
        }
    }
}

module.exports = PseudoToken;