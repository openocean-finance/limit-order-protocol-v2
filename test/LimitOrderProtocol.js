const {
    expectRevert,
    BN,
    time,
    constants,
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');

const { bufferToHex } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const TokenMock = artifacts.require('TokenMock');
const WrappedTokenMock = artifacts.require('WrappedTokenMock');
const WethUnwrapper = artifacts.require('WethUnwrapper');
const LimitOrderProtocol = artifacts.require('LimitOrderProtocol');
const ERC721Proxy = artifacts.require('ERC721Proxy');

const {
    profileEVM,
    gasspectEVM,
} = require('./helpers/profileEVM');
const {
    buildOrderData,
    buildOrderRFQData,
} = require('./helpers/orderUtils');
const {
    getPermit,
    withTarget,
} = require('./helpers/eip712');
const {
    addr1PrivateKey,
    toBN,
    cutLastArg,
} = require('./helpers/utils');

describe('LimitOrderProtocol', async function () {
    let addr1, wallet;

    const privatekey = '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
    const account = Wallet.fromPrivateKey(Buffer.from(privatekey, 'hex'));

    function buildOrder (
        exchange,
        makerAsset,
        takerAsset,
        makingAmount,
        takingAmount,
        allowedSender = constants.ZERO_ADDRESS,
        predicate = '0x',
        permit = '0x',
        interaction = '0x',
        receiver = constants.ZERO_ADDRESS,
    ) {
        return buildOrderWithSalt(exchange, '1', makerAsset, takerAsset, makingAmount, takingAmount, allowedSender, predicate, permit, interaction, receiver);
    }

    function buildOrderWithSalt (
        exchange,
        salt,
        makerAsset,
        takerAsset,
        makingAmount,
        takingAmount,
        allowedSender = constants.ZERO_ADDRESS,
        predicate = '0x',
        permit = '0x',
        interaction = '0x',
        receiver = constants.ZERO_ADDRESS,
    ) {
        return {
            salt: salt,
            makerAsset: makerAsset.address,
            takerAsset: takerAsset.address,
            maker: wallet,
            receiver,
            allowedSender,
            makingAmount,
            takingAmount,
            makerAssetData: '0x',
            takerAssetData: '0x',
            getMakerAmount: cutLastArg(exchange.contract.methods.getMakerAmount(makingAmount, takingAmount, 0).encodeABI()),
            getTakerAmount: cutLastArg(exchange.contract.methods.getTakerAmount(makingAmount, takingAmount, 0).encodeABI()),
            predicate: predicate,
            permit: permit,
            interaction: interaction,
        };
    }

    function buildOrderRFQ (info, makerAsset, takerAsset, makingAmount, takingAmount, allowedSender = constants.ZERO_ADDRESS) {
        return {
            info,
            makerAsset: makerAsset.address,
            takerAsset: takerAsset.address,
            maker: wallet,
            allowedSender,
            makingAmount,
            takingAmount,
        };
    }

    before(async function () {
        [addr1, wallet] = await web3.eth.getAccounts();
    });

    beforeEach(async function () {
        this.dai = await TokenMock.new('DAI', 'DAI');
        this.weth = await WrappedTokenMock.new('WETH', 'WETH');

        this.swap = await LimitOrderProtocol.new();
        await this.swap.initialize();
        // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
        // from within the EVM as from the JSON RPC interface.
        // See https://github.com/trufflesuite/ganache-core/issues/515
        this.chainId = await this.dai.getChainId();

        await this.dai.mint(wallet, '1000000');
        await this.weth.mint(wallet, '1000000');
        await this.dai.mint(addr1, '1000000');
        await this.weth.mint(addr1, '1000000');

        await this.dai.approve(this.swap.address, '1000000');
        await this.weth.approve(this.swap.address, '1000000');
        await this.dai.approve(this.swap.address, '1000000', { from: wallet });
        await this.weth.approve(this.swap.address, '1000000', { from: wallet });
    });

    describe('wip', async function () {
        // it('transferFrom', async function () {
        //     await this.dai.approve(addr1, '2', { from: wallet });
        //     await this.dai.transferFrom(wallet, addr1, '1', { from: addr1 });
        // });
        //
        // it('should not swap with bad signature', async function () {
        //     const order = buildOrder(this.swap, this.dai, this.weth, 1, 1);
        //     const data = buildOrderData(this.chainId, this.swap.address, order);
        //     const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });
        //     const sentOrder = buildOrder(this.swap, this.dai, this.weth, 1, 2);
        //
        //     await expectRevert(
        //         this.swap.fillOrder(sentOrder, signature, 1, 0, 1),
        //         'LOP: bad signature',
        //     );
        // });
        //
        // it('should not fill (1,1)', async function () {
        //     const order = buildOrder(this.swap, this.dai, this.weth, 1, 1);
        //     const data = buildOrderData(this.chainId, this.swap.address, order);
        //     const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });
        //
        //     await expectRevert(
        //         this.swap.fillOrder(order, signature, 1, 1, 1),
        //         'LOP: only one amount should be 0',
        //     );
        // });
        //
        // it('should not fill above threshold', async function () {
        //     const order = buildOrder(this.swap, this.dai, this.weth, 2, 2);
        //     const data = buildOrderData(this.chainId, this.swap.address, order);
        //     const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });
        //
        //     await expectRevert(
        //         this.swap.fillOrder(order, signature, 2, 0, 1),
        //         'LOP: taking amount too high',
        //     );
        // });
        //
        // it('should not fill below threshold', async function () {
        //     const order = buildOrder(this.swap, this.dai, this.weth, 2, 2);
        //     const data = buildOrderData(this.chainId, this.swap.address, order);
        //     const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });
        //
        //     await expectRevert(
        //         this.swap.fillOrder(order, signature, 0, 2, 3),
        //         'LOP: making amount too low',
        //     );
        // });
        //
        // it('should fail when both amounts are zero', async function () {
        //     const order = buildOrder(this.swap, this.dai, this.weth, 100, 1);
        //     const data = buildOrderData(this.chainId, this.swap.address, order);
        //     const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });
        //
        //     await expectRevert(
        //         this.swap.fillOrder(order, signature, 0, 0, 0),
        //         'LOP: only one amount should be 0',
        //     );
        // });

        it('should swap fully based on signature', async function () {
            // Order: 1 DAI => 1 WETH
            // Swap:  1 DAI => 1 WETH

            const order = buildOrder(this.swap, this.dai, this.weth, 1, 1);
            const data = buildOrderData(this.chainId, this.swap.address, order);
            console.log('data:', data);
            const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

            const makerDai = await this.dai.balanceOf(wallet);
            const takerDai = await this.dai.balanceOf(addr1);
            const makerWeth = await this.weth.balanceOf(wallet);
            const takerWeth = await this.weth.balanceOf(addr1);

            await this.swap.updateOperator(account.getAddressString());

            let operator = await this.swap.operator();
            console.log('operator:', operator.toString());
            let msg = await this.swap.hashUnmuteMsg();
            console.log('msg:', msg.toString());

            let [signer] = await ethers.getSigners();
            this.wallet = new ethers.Wallet(privatekey, signer.provider);

            let userSig = await this.wallet.signMessage(ethers.utils.arrayify(msg));
            console.log('userSig:', userSig.toString());

            let ssss = await ethers.utils.defaultAbiCoder.encode(['bytes', 'bytes'],
                [signature, 0x0]);

            // ssss = "0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000410165f69bc380dfa6f4ea61d57af48b73c3ddd4e7a66acea05597d7614c2c07911ebe5bcab6bda8bdae9169ff749d0d39b20f7797f45b827875ee236cb14acfd01b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041c6ec56c73af55d3011e237e76826355ad943b02001698fc16c28cb9a1eae85876ddb27ed95e4760b925f00ef120f89cb2a35ba7aa6dc8f530cec0898315acdd91c00000000000000000000000000000000000000000000000000000000000000";
            // let address = "0x72f16Cae8F50Ad615AB5A8e231A496b2ace52532";
            // msg = "0xe87278da0e6d882a1e7d3eb23ce5fb0e67eac049d310887b64ac8639e5be7cc0";
            // await this.swap.verifySignature(ssss, msg, address);
            // return;
            const receipt = await this.swap.fillOrder(order, ssss, 1, 0, 1);

            // expect(
            //     await profileEVM(receipt.tx, ['CALL', 'STATICCALL', 'SSTORE', 'SLOAD', 'EXTCODESIZE']),
            // ).to.be.deep.equal([2, 2, 7, 7, 3]);

            expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
            expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
            expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
            expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
        });

            it('should swap fully based on RFQ signature', async function () {
                // Order: 1 DAI => 1 WETH
                // Swap:  1 DAI => 1 WETH

                for (const salt of ['000000000000000000000001', '000000000000000000000002']) {
                    const order = buildOrderRFQ(salt, this.dai, this.weth, 1, 1);
                    const data = buildOrderRFQData(this.chainId, this.swap.address, order);
                    const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                    const makerDai = await this.dai.balanceOf(wallet);
                    const takerDai = await this.dai.balanceOf(addr1);
                    const makerWeth = await this.weth.balanceOf(wallet);
                    const takerWeth = await this.weth.balanceOf(addr1);

                    const receipt = await this.swap.fillOrderRFQ(order, signature, 1, 0);

                    expect(
                        await profileEVM(receipt.tx, ['CALL', 'STATICCALL', 'SSTORE', 'SLOAD', 'EXTCODESIZE']),
                    ).to.be.deep.equal([2, 1, 7, 7, 2]);

                    await gasspectEVM(receipt.tx);

                    expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                    expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                    expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                    expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
                }
            });

            it('should swap half based on signature', async function () {
                // Order: 2 DAI => 2 WETH
                // Swap:  1 DAI => 1 WETH

                const order = buildOrder(this.swap, this.dai, this.weth, 2, 2);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                const receipt = await this.swap.fillOrder(order, signature, 1, 0, 1);

                expect(
                    await profileEVM(receipt.tx, ['CALL', 'STATICCALL', 'SSTORE', 'SLOAD', 'EXTCODESIZE']),
                ).to.be.deep.equal([2, 2, 7, 7, 3]);

                // await gasspectEVM(receipt.tx);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
            });

            it('should floor maker amount', async function () {
                // Order: 2 DAI => 10 WETH
                // Swap:  9 WETH <= 1 DAI

                const order = buildOrder(this.swap, this.dai, this.weth, 2, 10);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrder(order, signature, 0, 9, 1);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(9));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(9));
            });

            it('should fail on floor maker amount = 0', async function () {
                // Order: 2 DAI => 10 WETH
                // Swap:  4 WETH <= 0 DAI

                const order = buildOrder(this.swap, this.dai, this.weth, 2, 10);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                await expectRevert(
                    this.swap.fillOrder(order, signature, 0, 4, 0),
                    'LOP: can\'t swap 0 amount',
                );
            });

            it('should ceil taker amount', async function () {
                // Order: 10 DAI => 2 WETH
                // Swap:  4 DAI => 1 WETH

                const order = buildOrder(this.swap, this.dai, this.weth, 10, 2);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrder(order, signature, 4, 0, 1);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(4));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(4));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
            });
        });

        it('ERC721Proxy should work', async function () {
            const erc721proxy = await ERC721Proxy.new(this.swap.address);

            await this.dai.approve(erc721proxy.address, '10', { from: wallet });
            await this.weth.approve(erc721proxy.address, '10');

            const order = buildOrder(this.swap, erc721proxy, erc721proxy, 10, 10);
            order.makerAssetData = '0x' + erc721proxy.contract.methods.func_60iHVgK(wallet, constants.ZERO_ADDRESS, 0, 10, this.dai.address).encodeABI().substr(202);
            order.takerAssetData = '0x' + erc721proxy.contract.methods.func_60iHVgK(constants.ZERO_ADDRESS, wallet, 0, 10, this.weth.address).encodeABI().substr(202);

            const data = buildOrderData(this.chainId, this.swap.address, order);
            const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

            const makerDai = await this.dai.balanceOf(wallet);
            const takerDai = await this.dai.balanceOf(addr1);
            const makerWeth = await this.weth.balanceOf(wallet);
            const takerWeth = await this.weth.balanceOf(addr1);

            await this.swap.fillOrder(order, signature, 10, 0, 10);

            expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(10));
            expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(10));
            expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(10));
            expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(10));
        });

        describe('Permit', function () {
            describe('fillOrderToWithPermit', function () {
                it('DAI => WETH', async function () {
                    const swap = await LimitOrderProtocol.new();
                    await this.dai.approve(swap.address, '1000000', { from: account.getAddressString() });
                    const order = buildOrder(swap, this.dai, this.weth, 1, 1);
                    const data = buildOrderData(this.chainId, swap.address, order);
                    const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                    const permit = await getPermit(addr1, addr1PrivateKey, this.weth, '1', this.chainId, swap.address, '1');
                    const targetPermitPair = withTarget(this.weth.address, permit);

                    const makerDai = await this.dai.balanceOf(wallet);
                    const takerDai = await this.dai.balanceOf(addr1);
                    const makerWeth = await this.weth.balanceOf(wallet);
                    const takerWeth = await this.weth.balanceOf(addr1);
                    const allowance = await this.weth.allowance(account.getAddressString(), swap.address);

                    await swap.fillOrderToWithPermit(order, signature, 1, 0, 1, addr1, targetPermitPair);

                    expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                    expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                    expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                    expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
                    expect(allowance).to.be.bignumber.eq(new BN('0'));
                });

                it('rejects reused signature', async function () {
                    const swap = await LimitOrderProtocol.new();
                    await this.dai.approve(swap.address, '1000000', { from: account.getAddressString() });
                    const order = buildOrder(swap, this.dai, this.weth, 1, 1);
                    const data = buildOrderData(this.chainId, swap.address, order);
                    const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                    const permit = await getPermit(addr1, addr1PrivateKey, this.weth, '1', this.chainId, swap.address, '1');
                    const targetPermitPair = withTarget(this.weth.address, permit);
                    const requestFunc = () => swap.fillOrderToWithPermit(order, signature, 0, 1, 1, addr1, targetPermitPair);
                    await requestFunc();
                    await expectRevert(
                        requestFunc(),
                        'ERC20Permit: invalid signature',
                    );
                });

                it('rejects other signature', async function () {
                    const swap = await LimitOrderProtocol.new();
                    await this.dai.approve(swap.address, '1000000', { from: account.getAddressString() });
                    const order = buildOrder(swap, this.dai, this.weth, 1, 1);
                    const data = buildOrderData(this.chainId, swap.address, order);
                    const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                    const otherWallet = Wallet.generate();
                    const permit = await getPermit(addr1, otherWallet.getPrivateKey(), this.weth, '1', this.chainId, swap.address, '1');
                    const targetPermitPair = withTarget(this.weth.address, permit);
                    const requestFunc = () => swap.fillOrderToWithPermit(order, signature, 0, 1, 1, addr1, targetPermitPair);
                    await expectRevert(
                        requestFunc(),
                        'ERC20Permit: invalid signature',
                    );
                });

                it('rejects expired permit', async function () {
                    const deadline = (await time.latest()) - time.duration.weeks(1);
                    const swap = await LimitOrderProtocol.new();
                    await this.dai.approve(swap.address, '1000000', { from: account.getAddressString() });
                    const order = buildOrder(swap, this.dai, this.weth, 1, 1);
                    const data = buildOrderData(this.chainId, swap.address, order);
                    const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                    const permit = await getPermit(addr1, addr1PrivateKey, this.weth, '1', this.chainId, swap.address, '1', deadline);
                    const targetPermitPair = withTarget(this.weth.address, permit);
                    const requestFunc = () => swap.fillOrderToWithPermit(order, signature, 0, 1, 1, addr1, targetPermitPair);
                    await expectRevert(
                        requestFunc(),
                        'expired deadline',
                    );
                });
            });

            describe('fillOrderRFQToWithPermit', function () {
                it('DAI => WETH', async function () {
                    const swap = await LimitOrderProtocol.new();
                    await this.dai.approve(swap.address, '1000000', { from: account.getAddressString() });
                    const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 1, 1);
                    const data = buildOrderRFQData(this.chainId, swap.address, order);
                    const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                    const permit = await getPermit(addr1, addr1PrivateKey, this.weth, '1', this.chainId, swap.address, '1');

                    const makerDai = await this.dai.balanceOf(wallet);
                    const takerDai = await this.dai.balanceOf(addr1);
                    const makerWeth = await this.weth.balanceOf(wallet);
                    const takerWeth = await this.weth.balanceOf(addr1);
                    const allowance = await this.weth.allowance(account.getAddressString(), swap.address);

                    await swap.fillOrderRFQToWithPermit(order, signature, 1, 0, addr1, permit);

                    expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                    expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                    expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                    expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
                    expect(allowance).to.be.bignumber.eq(new BN('0'));
                });

                it('rejects reused signature', async function () {
                    const swap = await LimitOrderProtocol.new();
                    await this.dai.approve(swap.address, '1000000', { from: account.getAddressString() });
                    const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 1, 1);
                    const data = buildOrderRFQData(this.chainId, swap.address, order);
                    const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                    const permit = await getPermit(addr1, addr1PrivateKey, this.weth, '1', this.chainId, swap.address, '1');
                    const requestFunc = () => swap.fillOrderRFQToWithPermit(order, signature, 0, 1, addr1, permit);
                    await requestFunc();
                    await expectRevert(
                        requestFunc(),
                        'ERC20Permit: invalid signature',
                    );
                });

                it('rejects other signature', async function () {
                    const swap = await LimitOrderProtocol.new();
                    await this.dai.approve(swap.address, '1000000', { from: account.getAddressString() });
                    const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 1, 1);
                    const data = buildOrderRFQData(this.chainId, swap.address, order);
                    const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                    const otherWallet = Wallet.generate();
                    const permit = await getPermit(addr1, otherWallet.getPrivateKey(), this.weth, '1', this.chainId, swap.address, '1');
                    const requestFunc = () => swap.fillOrderRFQToWithPermit(order, signature, 0, 1, addr1, permit);
                    await expectRevert(
                        requestFunc(),
                        'ERC20Permit: invalid signature',
                    );
                });

                it('rejects expired permit', async function () {
                    const deadline = (await time.latest()) - time.duration.weeks(1);
                    const swap = await LimitOrderProtocol.new();
                    await this.dai.approve(swap.address, '1000000', { from: account.getAddressString() });
                    const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 1, 1);
                    const data = buildOrderRFQData(this.chainId, swap.address, order);
                    const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                    const permit = await getPermit(addr1, addr1PrivateKey, this.weth, '1', this.chainId, swap.address, '1', deadline);
                    const requestFunc = () => swap.fillOrderRFQToWithPermit(order, signature, 0, 1, addr1, permit);
                    await expectRevert(
                        requestFunc(),
                        'expired deadline',
                    );
                });
            });
        });

        describe('Amount Calculator', async function () {
            it('empty getTakerAmount should work on full fill', async function () {
                const order = buildOrder(this.swap, this.dai, this.weth, 10, 10);
                order.getTakerAmount = '0x';
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrder(order, signature, 10, 0, 10);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(10));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(10));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(10));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(10));
            });

            it('empty getTakerAmount should not work on partial fill', async function () {
                const order = buildOrder(this.swap, this.dai, this.weth, 10, 10);
                order.getTakerAmount = '0x';
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                await expectRevert(
                    this.swap.fillOrder(order, signature, 5, 0, 5),
                    'LOP: wrong amount',
                );
            });

            it('empty getMakerAmount should work on full fill', async function () {
                const order = buildOrder(this.swap, this.dai, this.weth, 10, 10);
                order.getMakerAmount = '0x';
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrder(order, signature, 0, 10, 10);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(10));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(10));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(10));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(10));
            });

            it('empty getMakerAmount should not work on partial fill', async function () {
                const order = buildOrder(this.swap, this.dai, this.weth, 10, 10);
                order.getMakerAmount = '0x';
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                await expectRevert(
                    this.swap.fillOrder(order, signature, 0, 5, 5),
                    'LOP: wrong amount',
                );
            });
        });

        describe('Order Cancelation', async function () {
            beforeEach(async function () {
                this.order = buildOrder(this.swap, this.dai, this.weth, 1, 1);
            });

            it('should cancel own order', async function () {
                await this.swap.cancelOrder(this.order, { from: wallet });
                const data = buildOrderData(this.chainId, this.swap.address, this.order);
                const orderHash = bufferToHex(ethSigUtil.TypedDataUtils.sign(data));
                expect(await this.swap.remaining(orderHash)).to.be.bignumber.equal('0');
            });

            it('should not cancel foreign order', async function () {
                await expectRevert(
                    this.swap.cancelOrder(this.order),
                    'LOP: Access denied',
                );
            });

            it('should not fill cancelled order', async function () {
                const data = buildOrderData(this.chainId, this.swap.address, this.order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                await this.swap.cancelOrder(this.order, { from: wallet });

                await expectRevert(
                    this.swap.fillOrder(this.order, signature, 1, 0, 1),
                    'LOP: remaining amount is 0',
                );
            });
        });

        describe('OrderRFQ Cancelation', async function () {
            it('should cancel own order', async function () {
                await this.swap.cancelOrderRFQ('1');
                const invalidator = await this.swap.invalidatorForOrderRFQ(addr1, '0');
                expect(invalidator).to.be.bignumber.equal(toBN('2'));
            });

            it('should cancel own order with huge number', async function () {
                await this.swap.cancelOrderRFQ('1023');
                const invalidator = await this.swap.invalidatorForOrderRFQ(addr1, '3');
                expect(invalidator).to.be.bignumber.equal(toBN('1').shln(255));
            });

            it('should not fill cancelled order', async function () {
                const order = buildOrderRFQ('1', this.dai, this.weth, 1, 1);
                const data = buildOrderRFQData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                await this.swap.cancelOrderRFQ('1', { from: wallet });

                await expectRevert(
                    this.swap.fillOrderRFQ(order, signature, 1, 0),
                    'LOP: invalidated order',
                );
            });
        });

        describe('Private Orders', async function () {
            it('should fill with correct taker', async function () {
                const order = buildOrder(this.swap, this.dai, this.weth, 1, 1, addr1);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrder(order, signature, 1, 0, 1);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
            });

            it('should not fill with incorrect taker', async function () {
                const order = buildOrder(this.swap, this.dai, this.weth, 1, 1, wallet);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                await expectRevert(
                    this.swap.fillOrder(order, signature, 1, 0, 1),
                    'LOP: private order',
                );
            });
        });

        describe('Predicate', async function () {
            it('`or` should pass', async function () {
                const ts1 = this.swap.contract.methods.timestampBelow(0xff0000).encodeABI();
                const balanceCall = this.dai.contract.methods.balanceOf(wallet).encodeABI();
                const gtCall = this.swap.contract.methods.gt('100000', this.dai.address, balanceCall).encodeABI();
                const predicate = this.swap.contract.methods.or(
                    [this.swap.address, this.swap.address],
                    [ts1, gtCall],
                ).encodeABI();
                const order = buildOrder(this.swap, this.dai, this.weth, 1, 1, constants.ZERO_ADDRESS, predicate);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrder(order, signature, 1, 0, 1);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
            });

            it('`or` should fail', async function () {
                const ts1 = this.swap.contract.methods.timestampBelow(0xff0000).encodeABI();
                const balanceCall = this.dai.contract.methods.balanceOf(wallet).encodeABI();
                const gtCall = this.swap.contract.methods.lt('100000', this.dai.address, balanceCall).encodeABI();
                const predicate = this.swap.contract.methods.or(
                    [this.swap.address, this.swap.address],
                    [ts1, gtCall],
                ).encodeABI();
                const order = buildOrder(this.swap, this.dai, this.weth, 1, 1, constants.ZERO_ADDRESS, predicate);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                await expectRevert(
                    this.swap.fillOrder(order, signature, 1, 0, 1),
                    'LOP: predicate returned false',
                );
            });

            it('`and` should pass', async function () {
                const ts1 = this.swap.contract.methods.timestampBelow(0xff000000).encodeABI();
                const balanceCall = this.dai.contract.methods.balanceOf(wallet).encodeABI();
                const gtCall = this.swap.contract.methods.eq('1000000', this.dai.address, balanceCall).encodeABI();
                const predicate = this.swap.contract.methods.and(
                    [this.swap.address, this.swap.address],
                    [ts1, gtCall],
                ).encodeABI();
                const order = buildOrder(this.swap, this.dai, this.weth, 1, 1, constants.ZERO_ADDRESS, predicate);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrder(order, signature, 1, 0, 1);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
            });

            it('nonce + ts example', async function () {
                const ts1 = this.swap.contract.methods.timestampBelow(0xff000000).encodeABI();
                const nonceCall = this.swap.contract.methods.nonceEquals(wallet, 0).encodeABI();
                const predicate = this.swap.contract.methods.and(
                    [this.swap.address, this.swap.address],
                    [ts1, nonceCall],
                ).encodeABI();
                const order = buildOrder(this.swap, this.dai, this.weth, 1, 1, constants.ZERO_ADDRESS, predicate);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrder(order, signature, 1, 0, 1);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
            });

            it('advance nonce', async function () {
                await this.swap.increaseNonce();
                expect(await this.swap.nonce(addr1)).to.be.bignumber.equal('1');
            });

            it('`and` should fail', async function () {
                const ts1 = this.swap.contract.methods.timestampBelow(0xff0000).encodeABI();
                const balanceCall = this.dai.contract.methods.balanceOf(wallet).encodeABI();
                const gtCall = this.swap.contract.methods.gt('100000', this.dai.address, balanceCall).encodeABI();
                const predicate = this.swap.contract.methods.and(
                    [this.swap.address, this.swap.address],
                    [ts1, gtCall],
                ).encodeABI();
                const order = buildOrder(this.swap, this.dai, this.weth, 1, 1, constants.ZERO_ADDRESS, predicate);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                await expectRevert(
                    this.swap.fillOrder(order, signature, 1, 0, 1),
                    'LOP: predicate returned false',
                );
            });
        });

        describe('Expiration', async function () {
            it('should fill when not expired', async function () {
                const order = buildOrder(this.swap, this.dai, this.weth, 1, 1, constants.ZERO_ADDRESS, this.swap.contract.methods.timestampBelow(0xff00000000).encodeABI());
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrder(order, signature, 1, 0, 1);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
            });

            it('should not fill when expired', async function () {
                const order = buildOrder(this.swap, this.dai, this.weth, 1, 1, constants.ZERO_ADDRESS, this.swap.contract.methods.timestampBelow(0xff0000).encodeABI());
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                await expectRevert(
                    this.swap.fillOrder(order, signature, 1, 0, 1),
                    'LOP: predicate returned false',
                );
            });

            it('should fill RFQ order when not expired', async function () {
                const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 1, 1);
                const data = buildOrderRFQData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrderRFQ(order, signature, 1, 0);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
            });

            it('should partial fill RFQ order', async function () {
                const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 2, 2);
                const data = buildOrderRFQData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrderRFQ(order, signature, 1, 0);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
            });

            it('should fully fill RFQ order', async function () {
                const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 1, 1);
                const data = buildOrderRFQData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrderRFQ(order, signature, 0, 0);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
            });

            it('should not partial fill RFQ order when 0', async function () {
                const order = buildOrderRFQ('20203181441137406086353707335681', this.dai, this.weth, 5, 10);
                const data = buildOrderRFQData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                await expectRevert(
                    this.swap.fillOrderRFQ(order, signature, 0, 1),
                    'LOP: can\'t swap 0 amount',
                );
            });

            it('should not fill RFQ order when expired', async function () {
                const order = buildOrderRFQ('308276084001730439550074881', this.dai, this.weth, 1, 1);
                const data = buildOrderRFQData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                await expectRevert(
                    this.swap.fillOrderRFQ(order, signature, 1, 0),
                    'LOP: order expired',
                );
            });

            it('should fill partially if not enough coins (taker)', async function () {
                const order = buildOrder(this.swap, this.dai, this.weth, 2, 2);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrder(order, signature, 0, 3, 2);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(2));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(2));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(2));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(2));
            });

            it('should fill partially if not enough coins (maker)', async function () {
                const order = buildOrder(this.swap, this.dai, this.weth, 2, 2);
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);

                await this.swap.fillOrder(order, signature, 3, 0, 3);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(2));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(2));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.addn(2));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(2));
            });
        });

        describe('Interaction', async function () {
            beforeEach(async function () {
                this.notificationReceiver = await WethUnwrapper.new();
            });

            it('should fill and unwrap token', async function () {
                const amount = web3.utils.toWei('1', 'ether');
                await web3.eth.sendTransaction({ from: wallet, to: this.weth.address, value: amount });

                const interaction = this.notificationReceiver.address + wallet.substr(2);

                const order = buildOrder(
                    this.swap,
                    this.dai,
                    this.weth,
                    1,
                    1,
                    constants.ZERO_ADDRESS,
                    this.swap.contract.methods.timestampBelow(0xff00000000).encodeABI(),
                    '0x',
                    interaction,
                    this.notificationReceiver.address,
                );
                const data = buildOrderData(this.chainId, this.swap.address, order);
                const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

                const makerDai = await this.dai.balanceOf(wallet);
                const takerDai = await this.dai.balanceOf(addr1);
                const makerWeth = await this.weth.balanceOf(wallet);
                const takerWeth = await this.weth.balanceOf(addr1);
                const makerEth = await web3.eth.getBalance(wallet);

                await this.swap.fillOrder(order, signature, 1, 0, 1);

                expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.subn(1));
                expect(await this.dai.balanceOf(addr1)).to.be.bignumber.equal(takerDai.addn(1));
                expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth);
                expect(web3.utils.toBN(await web3.eth.getBalance(wallet))).to.be.bignumber.equal(web3.utils.toBN(makerEth).addn(1));
                expect(await this.weth.balanceOf(addr1)).to.be.bignumber.equal(takerWeth.subn(1));
            });
    });
});
