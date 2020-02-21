/**
 iZ³ | Izzzio blockchain - https://izzz.io
 @author: Andrey Nedobylsky (admin@twister-vl.ru)
 */


const Signable = require(global.PATH.mainDir + '/modules/blocksModels/signable');
const storj = require(global.PATH.mainDir + '/modules/instanceStorage');
const cryptography = storj.get('cryptography');

let type = 'TX';

/**
 * TX  block
 * @type {Signable}
 */
class TX extends Signable {

    /**
     * Create TX
     * @param {string} from
     * @param {string} to
     * @param {string }amount
     */
    constructor(to, amount) {
        super();
        this.type = type;
        this.data = '';
        this.to = to;
        this.amount = amount;
        this.generateData();
    }

    /**
     * Создаёт строку данных для подписи
     */
    generateData() {
        this.data = cryptography.hash(this.type + this.from + this.to + this.amount);
    }


}

module.exports = TX;