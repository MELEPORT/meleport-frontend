import React, { useEffect, useState } from 'react'
import { Button, Card, PageHeader, notification } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { utils, transactions } from "near-api-js";
import { login, parseTokenWithDecimals } from "../utils";
import { functionCall } from 'near-api-js/lib/transaction';
import GameFilter from './GameFillter/GameFilter';
import getConfig from '../config'

const { Meta } = Card;
//const nearConfig = getConfig(process.env.NODE_ENV || 'development')
// removed process.env.NODE_ENV || to deploy on web
const nearConfig = getConfig('development')

function MarketPlace() {
    const [data, setData] = useState([]);
    const [nfts, setNFTs] = useState([]);
    const [tokenList, setTokenList] = useState([]);
    const [filteredGameMarket, setFilteredGameMarket] = useState('HAMMER_GAME');
    const [filteredGameUser, setFilteredGameUser] = useState('HAMMER_GAME');

    const filterChangeHandlerMarket = (selectedGame) => {
        setFilteredGameMarket(selectedGame);
    };

    const filterChangeHandlerUser = (selectedGame) => {
        setFilteredGameUser(selectedGame);
    };

    useEffect(async () => {
        if (window.accountId) {
            let data = await window.contractNFT.nft_tokens_for_owner({ "account_id": window.accountId, "from_index": "0", "limit": 40 });
            console.log("Data: ", data);
            setNFTs(data);
        }
    }, []);

    async function handleBuy(item) {
        console.log(item);
        try {
            if (!window.walletConnection.isSignedIn()) return login();

            if (item.sale_conditions.is_native) {
                let nearBalance = await window.account.getAccountBalance();
                if (nearBalance.available < parseInt(item.sale_conditions.amount)) {
                    notification["warning"]({
                        message: 'Your NEAR balance is not enough',
                        description:
                            'Your account does not have enough balance to buy NFT!',
                    });

                    return;
                }

                await window.contractMarket.offer(
                    {
                        nft_contract_id: item.nft_contract_id,
                        token_id: item.token_id
                    },
                    300000000000000,
                    item.sale_conditions.amount
                )
            } else {
                // Check balance
                let vbicBalance = await window.contractFT.ft_balance_of({ account_id: window.accountId })
                if (vbicBalance < parseInt(item.sale_conditions.amount)) {
                    notification["warning"]({
                        message: 'Your MeP balance is not enough!',
                        description:
                            'Your account does not have enough MeP balance to buy NFT! If you dont owne any MeP, refer MELEPORT Document for more infomation',
                    });

                    return;
                }

                // Handle storage deposit
                let message = {
                    nft_contract_id: window.contractNFT.contractId,
                    token_id: item.token_id
                }
                const result = await window.account.signAndSendTransaction({
                    receiverId: window.contractFT.contractId,
                    actions: [
                        transactions.functionCall(
                            'storage_deposit',
                            { account_id: item.owner_id },
                            10000000000000,
                            utils.format.parseNearAmount("0.01")
                        ),
                        transactions.functionCall(
                            'ft_transfer_call',
                            { receiver_id: window.contractMarket.contractId, amount: item.sale_conditions.amount, msg: JSON.stringify(message) },
                            250000000000000,
                            "1"
                        )
                    ]
                });

                console.log("Result: ", result);
            }

        } catch (e) {
            console.log("Error: ", e);
        }
    }

    async function handleMarkToSwap(item) {
        console.log(item);
        try {
            if (!window.walletConnection.isSignedIn()) return login();

            // Handle storage deposit
            let message = {
                nft_contract_id: window.contractNFT.contractId,
                token_id: item.token_id
            }

            // near call nft - market.test_nft.testnet markdown_swap_token '{"nft_contract_id": "nft-tutorial.test_nft.testnet", "token_id": "BNB", "is_swap": true}' --account_id test_nft.testnet

            const result = await window.account.signAndSendTransaction({
                receiverId: window.contractMarket.contractId,
                actions: [
                    transactions.functionCall(
                        'storage_deposit',
                        { account_id: item.owner_id },
                        10000000000000,
                        utils.format.parseNearAmount("0.01")
                    ),
                    transactions.functionCall(
                        'markdown_swap_token',
                        {
                            nft_contract_id: window.contractNFT.contractId,
                            token_id: item.token_id,
                            is_swap: true
                        },
                        10000000000000
                    ),
                ]
            });

            console.log("Result: ", result);
        }

        catch (e) {
            console.log("Error: ", e);
        }


    }

    useEffect(async () => {
        try {
            let data = await window.contractMarket.get_sales(
                {
                    from_index: "0",
                    limit: 40
                }
            );

            let mapItemData = data.map(async item => {
                let itemData = await window.contractNFT.nft_token({ token_id: item.token_id });

                return {
                    ...item,
                    itemData
                }
            });

            let dataNew = await Promise.all(mapItemData);
            console.log("Data market: ", dataNew);
            setData(dataNew);
        } catch (e) {
            console.log(e);
        }
    }, []);

    useEffect(async () => {
        if (window.accountId) {
            // Get token list
            let tokenList = [];
            let nearBalance = await window.account.getAccountBalance();
            let vbicBalance = await window.contractFT.ft_balance_of({ account_id: window.accountId })

            tokenList.push({
                isNative: true,
                symbol: "NEAR",
                balance: nearBalance.available,
                decimals: 24,
                contractId: "near"
            });

            tokenList.push({
                isNative: false,
                symbol: "MeP",
                balance: vbicBalance,
                decimals: 18,
                contractId: window.contractFT.contractId
            });

            setTokenList(tokenList);
        }
    }, []);

    return (
        <div>
            <PageHeader
                className="site-page-header"
                title="Marketplace"
            />
            <h2>Select the Game you want to Swap:</h2>
            <h4>Note: Until now, SWAP feature only applies to NFTs listed with MeP token.<br /> If you want to test SWAP feature please mint some NFT and list it with 0 MeP as price, or contact us via Telegram Channel: <a href="https://t.me/meleport">MELEPORT Support</a> to send you some MeP tokens</h4>

            <GameFilter selected={filteredGameMarket} onChangeFilter={filterChangeHandlerMarket} />
            <div style={{ padding: 30, display: "flex" }}>
                {
                    data.filter(filteredData => {
                        return filteredData.itemData.metadata.description === filteredGameMarket;
                    }).map(item => {
                        return (
                            <div>
                                <h4>{item.token_id}</h4>
                                <Card
                                    key={item.token_id}
                                    hoverable
                                    style={{ width: 240, marginRight: 15, marginBottom: 15 }}
                                    cover={<img style={{ height: 300, width: "100%", objectFit: "contain" }} alt="Media NFT" src={item.itemData.metadata.media} />}
                                    actions={[
                                        <Button onClick={() => handleBuy(item)} icon={<ShoppingCartOutlined />}> SWAP </Button>
                                    ]}
                                >
                                    <h1>{item.sale_conditions.is_native ?
                                        utils.format.formatNearAmount(item.sale_conditions.amount) + " NEAR" :
                                        parseTokenWithDecimals(item.sale_conditions.amount, item.sale_conditions.decimals) + " MeP"
                                    }</h1>
                                    <Meta title={item.token_id} description={item.owner_id} />
                                    <h4 style={{ color: 'green' }}>{item.is_swap === true ? "READY TO SWAP" : ""}</h4>
                                </Card>
                            </div>
                        )
                    })
                }
            </div>
            <hr />

            <h2>YOUR NFTs</h2>
            <h1>User</h1>
            <h2>Select your Game:</h2>
            <GameFilter selected={filteredGameUser} onChangeFilter={filterChangeHandlerUser} />
            <div style={{ padding: 30, display: "flex" }}>
                {
                    nfts.filter(filteredUser => {
                        return filteredUser.metadata.description === filteredGameUser;
                    }).map((item) => {
                        return (
                            <div>
                                <Card
                                    key={item.token_id}
                                    hoverable
                                    style={{ width: 240, marginRight: 15, marginBottom: 15 }}
                                    cover={<img style={{ height: 300, width: "100%", objectFit: "contain" }} alt="nft-cover" src={item.metadata.media} />}
                                    actions={[
                                        <Button onClick={() => handleMarkToSwap(item)} icon={<ShoppingCartOutlined />}> Select to Swap </Button>
                                    ]}
                                >
                                    <Meta title={`${item.metadata.title} (${item.approved_account_ids[nearConfig.marketContractName] >= 0 ? "SALE" : "NOT SALE"})`} description={item.owner_id} />
                                </Card>
                            </div>
                        )
                    })
                }

            </div>
        </div >
    )
}

export default MarketPlace;