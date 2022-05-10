const {
    buildOrderData,
} = require('../test/helpers/orderUtils');
const ethSigUtil = require('eth-sig-util');
const {
    cutLastArg,
} = require('../test/helpers/utils');

const Wallet = require('ethereumjs-wallet').default;
const { privateKeyTest } = require('../secrets.json');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

let wallet;
const account = Wallet.fromPrivateKey(Buffer.from(privateKeyTest, 'hex'));

async function main () {
    const [deployer] = await ethers.getSigners();
    wallet = deployer;
    console.log('invoke contracts with the account:', deployer.address);
    //0x16A3de85E22EAa96C2F483c8824586cd60d64d57
    let bscMainnet = '0xA8A0213bb2ce671E457Ec14D08EB9d40E6DA8e2d';
    this.swap = await ethers.getContractAt('LimitOrderProtocol', bscMainnet);
    if(true){
        return;
    }
    // let linkAddress = '0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06';
    // let busdAddress = '0xB3A4eC7d0b14B57002a8AFBF352e3779187dD971';
    // this.link = await ethers.getContractAt('TokenMock', linkAddress);
    // this.busd = await ethers.getContractAt('TokenMock', busdAddress);
    // this.chainId = new web3.utils.BN(97);
    if (true) {
        let hashUnmuteMsg = await this.swap.hashUnmuteMsg();
        console.log('msg:', hashUnmuteMsg.toString());
        // await this.swap.updateOperator("0x6ce8Ea05AFDF026BA6e9998936598EE8F0163F3a");
        return;
        await this.link.approve(this.swap.address, '1000000');
        await this.busd.approve(this.swap.address, '1000000');
        const order = await buildOrder(this.swap, this.link, this.busd, 4, 1);
        const data = buildOrderData(this.chainId, this.swap.address, order);
        console.log('data:', data);

        const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });
        let [signer] = await ethers.getSigners();
        this.wallet = new ethers.Wallet(privateKeyTest, signer.provider);
        let msg = await this.swap.hashUnmuteMsg();
        let userSig = await this.wallet.signMessage(ethers.utils.arrayify(msg));
        let ssss = await ethers.utils.defaultAbiCoder.encode(['bytes', 'bytes'],
            [signature, userSig]);
        console.log('ssss:', ssss.toString());
        return;
        const receipt = await this.swap.fillOrder(order, ssss, 1, 0, 1);
        return;
    }
    if (false) {
        // await limitOrderProtocolProxy.updateOperator("0x6ce8Ea05AFDF026BA6e9998936598EE8F0163F3a");

        let operator = await limitOrderProtocolProxy.operator();
        console.log('operator:', operator.toString());

        let hash = await limitOrderProtocolProxy.hashUnmuteMsg();
        console.log('hash:', hash.toString());
        return;
    }
    if (false) {
        const limitOrderProtocolProxy = await ethers.getContractAt('LimitOrderProtocolProxy', '0xB5CCb02319158260d8C3A125473380650113c363');
        let impl = await limitOrderProtocolProxy.implementation();
        console.log('impl:', impl.toString());
        let admin = await limitOrderProtocolProxy.admin();
        console.log('admin:', admin.toString());
        // let proxyAdmin = '0xDE7c5B5b2385153d7936a9c8E5B9a1E93F4fEE3e';
        // await limitOrderProtocolProxy.changeAdmin(proxyAdmin);
        return;
    }
}

async function buildOrder (
    exchange,
    makerAsset,
    takerAsset,
    makingAmount,
    takingAmount,
    allowedSender = ZERO_ADDRESS,
    predicate = '0x',
    permit = '0x',
    interaction = '0x',
    receiver = ZERO_ADDRESS,
) {
    return await buildOrderWithSalt(exchange, '1', makerAsset, takerAsset, makingAmount, takingAmount, allowedSender, predicate, permit, interaction, receiver);
}

async function buildOrderWithSalt (
    exchange,
    salt,
    makerAsset,
    takerAsset,
    makingAmount,
    takingAmount,
    allowedSender = ZERO_ADDRESS,
    predicate = '0x',
    permit = '0x',
    interaction = '0x',
    receiver = ZERO_ADDRESS,
) {
    let fragment = exchange.interface.getFunction('getMakerAmount');
    let getMakerAmount = exchange.interface.encodeFunctionData(fragment, [makingAmount, takingAmount, 0]);

    fragment = exchange.interface.getFunction('getTakerAmount');
    let getTakerAmount = exchange.interface.encodeFunctionData(fragment, [makingAmount, takingAmount, 0]);
    return {
        salt: salt,
        makerAsset: makerAsset.address,
        takerAsset: takerAsset.address,
        maker: wallet.address,
        receiver,
        allowedSender,
        makingAmount,
        takingAmount,
        makerAssetData: '0x',
        takerAssetData: '0x',
        getMakerAmount: cutLastArg(getMakerAmount),
        getTakerAmount: cutLastArg(getTakerAmount),
        predicate: predicate,
        permit: permit,
        interaction: interaction,
    };
}

async function encodeData (name, method, ...arg) {
    const MyContract = await ethers.getContractFactory(name);
    const fragment = MyContract.interface.getFunction(method);
    return MyContract.interface.encodeFunctionData(fragment, arg);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
