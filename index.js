/**
 iZ³ | Izzzio blockchain - https://izzz.io

 Copyright 2018 Izio LLC (OOO "Изио")

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * Давайте сделаем таким образом, самый простой и показательный пример – можете показать пример с пропускной способностью в 40к транзакций в децентрализованной сети?
 •    Развернуть сеть в регионах – США, Европа, Россия, Азия, Океания, можно даже в рамках одного IaaS провайдера
 •    В каждом регионе не менее 3х узлов

 Условия тестирования:
 •    Скорость синхронизации 400 тыс транзакций по переводу токенов в рамках сети по всем узлам
 •    Скорость синхронизации 400 тыс транзакций, исполняющих транзакцию смарт контракта в рамках сети по всем узлам
 •    Генерация транзакций в каждом из тестов будет проводиться блоками по 100 тыс. транзакций с 4х узлов в разных регионах

 Сколько у вас уйдет время на подготовку такого теста? Согласно вашим выводам, 400 тыс транзакций в сети должны в каждом из испытаний должны быть полностью синхронизированы в течении 10 секунд, верно?

 */


const logger = new (require(global.PATH.mainDir + '/modules/logger'))("NetworkBenchmark");

/**
 * @type {{assert: module.exports.assert, lt: module.exports.lt, true: module.exports.true, false: module.exports.false, gt: module.exports.gt, defined: module.exports.defined}}
 */
const assert = require(global.PATH.mainDir + '/modules/testing/assert');
/*
const storj = require(global.PATH.mainDir + '/modules/instanceStorage');
const Wallet = require(global.PATH.mainDir + '/modules/wallet');*/

const DApp = require(global.PATH.mainDir + '/app/DApp');
const fs = require('fs');

const TX = require('./blocks/TX')


const PseudoToken = require('./pseudoToken')

const TX_PER_BATCH = 100000;

let that;


/**
 * Deploy master contracts APP
 */
class App extends DApp {


    createTransaction(amount) {
        let wallet = this.getCurrentWallet();
        let tx = new TX(wallet.id + amount, amount);
        tx = wallet.signBlock(tx);
        return tx;
    }

    createTransactionsBatch() {
        let transactions = [];

        for (let i = 0; i < TX_PER_BATCH; i++) {
            let tx = this.createTransaction(i);
            transactions.push(tx);
            if(i % 1000 === 0) {
                console.log(i, '/', TX_PER_BATCH);
            }
        }

        return {type: 'TXS', txs: transactions};
    }

    /**
     * Initialize
     */
    init() {
        that = this;

        this.token = new PseudoToken([{
            to: this.getCurrentWallet().id,
            amount: 1000000000000
        }], this.getCurrentWallet());

        console.log('Total supply', this.token.totalSupply());

        this.registerBlockHandler('TXS', async function (block, blockSrc, cb) {
            console.log('newBlockTX', block.type, block.txs.length);
            await that.token.processBlock(block);
            cb();
        });

        /* process.on('SIGINT', () => {
             console.log('Terminating test...');
             process.exit();
         });*/

        process.on('unhandledRejection', error => {
            logger.fatalFall(error);
        });

        //Preparing environment
        /*logger.info('Deploying contract...');
        that.contracts.ecmaContract.deployContract(masterContract, 0, async function (deployedContract) {
            assert.assert(deployedContract !== null && Object.keys(deployedContract).length !== 0, "Invalid deployed contract");
            assert.true(deployedContract.address === that.getMasterContractAddress(), 'Invalid master contract address ' + that.getMasterContractAddress());
            logger.info("Master contract deployed");
        });*/

        setTimeout(function () {
            that.test();
        }, 5000)
    }

    async test() {

        let batch;

        try {
            batch = JSON.parse(fs.readFileSync('txs.json'));
        } catch (e) {

            console.log('Generate new transactions batch', e);
            batch = this.createTransactionsBatch();
            fs.writeFileSync('txs.json', JSON.stringify(batch));

        }

        console.log(batch.length);

        let batchStr = JSON.stringify(batch);
        console.log(batchStr.length);

        this.generateAndAddBlock(batchStr, function blockGenerated(generatedBlock) {
            //console.log(generatedBlock);
            console.log('Block generated');
            fs.writeFileSync('newBlock.json', JSON.stringify(generatedBlock));
        });

        //  console.log('Network benchmark test');
        //  process.exit();
    }

}

module.exports = App;