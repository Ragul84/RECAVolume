import dotenv from "dotenv";
import { env } from "node:process";
import { Address, TonClient, WalletContractV4, internal, TonClient4, fromNano } from "@ton/ton";
import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import { getHttpV4Endpoint } from '@orbs-network/ton-access';
import { insertSubWallet } from "../models/User";
import { sleep } from "./dex";

// eslint-disable-next-line ts/no-require-imports
require('node:buffer')
dotenv.config()

const apiKey = env["API_KEY"]
const testApiKey = env["TEST_API_KEY"]
const feeAddr = env["FEE_ADDRESS"]? env["FEE_ADDRESS"] : "UQDwZVedDa_mN0tzqpBtBdtOGlOvJnxD9J5QZgqbY8LujE1Y";
const feePercent = env["FEE_PERCENT"]? parseFloat(env["FEE_PERCENT"]) : 5;
const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  apiKey: apiKey
});

export async function createWallet() {
    try {
        // Generate new key
        const mnemonics = await mnemonicNew()
        const keyPair = await mnemonicToPrivateKey(mnemonics)
        // Create wallet contract
        const workchain = 0 // Usually you need a workchain 0
        const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey })
        const mnemonic = mnemonics.join(" ")
        const address = wallet.address.toString()
        return { address,  mnemonic }
    } catch (error) {
        return null
    }
  
}

export async function testActivateWallet() {
    try {
        // const testclient = new TonClient({
        //   endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        //   apiKey: testApiKey,
        // });
        // let mnemonics = "";
        // let key = await mnemonicToPrivateKey(mnemonics.split(' '));

        // const mainWallet = WalletContractV4.create({
        //     workchain: 0,
        //     publicKey: key.publicKey,
        //     walletId: 5
        // });

        // const mainContract = client.open(mainWallet);
        // console.log("wallet " + 0, mainWallet.address.toString());
        
        // const balance = await mainContract.getBalance();
        // console.log((Number(fromNano(balance)).toFixed(2)).toString());
        // const feeSeq  = await mainContract.getSeqno();
        // const fee = mainContract.sendTransfer({
        //     seqno: feeSeq,
        //     secretKey: key.secretKey,
        //     sendMode : 128,
        //     messages: [internal({
        //         bounce: false,
        //         value : '0.1',
        //         to: 'UQBbC18a5WB1zcciu23NkukmqasdEO1pz7decU_JjvZHMZOv',
        //         body: 'recover',
        //     })]
        // });
        // await sleep(10000);

        
        /// Activate wallet
        
    } catch (error) {
        console.log(error);
    }
}

export async function createAndActivateSubwallet(mnemonic: string, length: number, id: number, startId: number) {
    try {
        // const endpoint = await getHttpV4Endpoint();
        // const tonClient = new TonClient4({ endpoint });
        const key = await mnemonicToPrivateKey(mnemonic.split(' '));
        const mainWallet = WalletContractV4.create({
            workchain: 0,
            publicKey: key.publicKey,
        });
        const mainContract = client.open(mainWallet);

        const balance = await mainContract.getBalance();
        const feeSeq = await mainContract.getSeqno()
        /// fee 5%
        const fee = await mainContract.sendTransfer({
            seqno: feeSeq,
            secretKey: key.secretKey,
            messages: [internal({
                bounce: false,
                value : (Number(fromNano(balance)) * feePercent / 100).toFixed(2).toString(),
                to: feeAddr,
            })]
        });
        console.log("fee ", fee);
        await sleep(30000);
        /// Activate wallet
        for (let index = 0; index < length; index++) {
            
            // Generate the wallet address
            const recieptWallet = WalletContractV4.create({
                workchain: 0,
                publicKey: key.publicKey,
                walletId: index + 1 + startId,
            });

            const user = await insertSubWallet(id, {address: recieptWallet.address.toString(), subwalletId: startId + index + 1});
            console.log(user);
            
            const seqno = await mainContract.getSeqno();
            const amount = (((Number(fromNano(balance)) * (100 - feePercent) / 100 - 1 ) / length).toFixed(2)).toString();
            const tx = await mainContract.sendTransfer({
                seqno,
                secretKey: key.secretKey,
                messages: [internal({
                    bounce: false,
                    value: amount,
                    to: recieptWallet.address.toString(),
                })]
            });
            console.log("wallet "+ index, recieptWallet.address.toString());

            await sleep(30000);
            
        }
    } catch (error) {
        console.log(error);
    }
}

export async function importWallet(mnemonic: string) {
    try {
        // Convert mnemonic to wallet key (private and public key)
        const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '))

        // Define the wallet type and workchain ID
        const wallet = WalletContractV4.create({
            publicKey: keyPair.publicKey,
            workchain: 0, // default workchain
        })
        const address = wallet.address.toString()
        return { address }
    } catch (error) {
        return null
    }
  
}

export async function get_Balance(walletAddr: string) {

  try {
        
        const address = Address.parse(walletAddr)
        // Get balance
        const balance = await client.getBalance(address)
        return Number(fromNano(balance));
    } catch (error) {
        console.error('Error getting wallet balance:', error);
        return null
    }
}