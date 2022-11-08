import React, { useEffect, useState } from "react";
import { Card, List, Badge, Skeleton, Divider, Button } from "antd";
import getContractABI from "MockAPI/getContractABI";
import { useParams,useHistory } from "react-router-dom";
import { useMoralis, useMoralisQuery, useWeb3ExecuteFunction } from "react-moralis";
import { getNativeByChain } from "helpers/networks";
import getStyles from "../MockAPI/getStyles";


export default function ViewNFT() {
    const [NFT, setNFT] = useState(null);
    const [transactions, setTransactions] = useState(null);
    const { id } = useParams();
    const { Moralis, chainId, account } = useMoralis();
    const queryMarketItems = useMoralisQuery('CreatedMarketItems', query => query.limit(10000000));
    const nativeName = getNativeByChain(chainId);
    const contractProcessor = useWeb3ExecuteFunction();
    let history = useHistory();
    const customStyles = getStyles();

    const fetchMarketItems = JSON.parse(
        JSON.stringify(queryMarketItems.data, [
            "objectId",
            "createdAt",
            "price",
            "nftContract",
            "itemId",
            "sold",
            "tokenId",
            "seller",
            "owner",
            "confirmed"
        ])
    );

    const getMarketItem = () => {
        const result = {
            price:0.1,
            seller:'0x3'

        }
        return result;
    }

    const getTransactions = () => {
        const result = [];
        return result;
    }

    const getNFTMetaData = () => {
        let parsedURI = `${process.env.REACT_APP_MORALIS_SERVER_URL}/functions/getNFT?_ApplicationId=${process.env.REACT_APP_MORALIS_APPLICATION_ID}&nftId=${id}`
        let result = fetch(parsedURI)
            .then(response => response.json())
            .then(response => { return response })
        return Promise.resolve(result);
    }

    const getNFT = async () => {
        let result = { 
            name:`Land #${id}`,
            image:`https://mfarmgame.com/NFTs/${id}.png`,
         };
        setNFT(result);
    }

    const updateSoldMarketItem = async () => {
        const marketId = getMarketItem().objectId;
        const marketList = Moralis.Object.extend("CreatedMarketItems");
        const query = new Moralis.Query(marketList);
        await query.get(marketId)
            .then(obj => {
                obj.set("sold", true);
                obj.set("owner", account);
                obj.save();
            })
    }

    const addItemImage = () => {
        const ItemImage = Moralis.Object.extend("ItemImages");
        const itemImage = new ItemImage();
        const nft = NFT
        const tokenDetails = getMarketItem();

        itemImage.set("image", nft.image);
        itemImage.set("name", nft.name);
        itemImage.set("nftContract", tokenDetails.nftContract);
        itemImage.set("tokenId", tokenDetails.tokenId);

        itemImage.save();
    }

    const buyNFT = async () => {
        console.log('buy nft called')
        const tokenDetails = getMarketItem();
        const itemId = tokenDetails.itemId;
        const tokenPrice = tokenDetails.price;
        console.log(tokenDetails.itemId, 'itemId');
        const OPTIONS = {
            contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
            functionName: "createMarketSale",
            abi: getContractABI(),
            params: {
                itemId
            },
            msgValue: tokenPrice
        };

        await contractProcessor.fetch({
            params: OPTIONS,
            onSuccess: () => {
                alert('NFT bought!');
                updateSoldMarketItem();
                addItemImage();
                setTimeout(() => history.push('/transactions'), 10000);
            },
            onError: (error) => { 
                console.log(error);
                if(error.data?.message !== undefined){
                    alert(error.data?.message)
                }
            }
        })
    }

    useEffect(() => {
        getNFT();
    }, []);

    console.log(getTransactions(),'transactions');
    console.log(getMarketItem(),'getMarketItem');

    return (
        <div style={{ padding: "15px", maxWidth: "1030px", width: "100%" }}>
            <Skeleton loading={!NFT}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                    <img src={NFT?.image} alt={id} style={{ width: '50%' }} />
                    {getMarketItem() ?
                        <Badge.Ribbon
                            text={(getMarketItem().price / ("1e" + 18)) + ' ' + nativeName}
                            color={getMarketItem().sold ? 'gray' : 'green'}
                            placement='end'
                        /> :
                        <Badge.Ribbon
                            text={'Not Available'}
                            color={'green'}
                            placement='end'
                        />
                    }
                    <Card style={{ width: '50%', border: customStyles.cardBorder}}>
                        <h1>{NFT?.name}</h1>
                        <p style={{ paddingLeft: '1em' }}>{NFT?.description}</p>
                        <Divider />
                        {getMarketItem() ?
                            <div>
                                <b>Price: </b>
                                {`${getMarketItem().price / ("1e" + 18)} BNB`}
                            </div> :
                            <div>
                                <b>Price:</b>
                                - - - -
                            </div>
                        }
                        {getMarketItem() ?
                            <div>
                                <b>Owner: </b>
                                {
                                    getMarketItem().seller?.slice(0, 5) +
                                    '...' +
                                    getMarketItem().seller?.slice(getMarketItem().seller?.length - 5, getMarketItem().seller?.length)
                                }
                            </div> :
                            <div>
                                <b>Owner: </b>
                                - - - -
                            </div>
                        }
                        {getTransactions() &&
                            <List
                                size='small'
                                header={<b>Transactions</b>}
                                bordered
                                dataSource={getTransactions()}
                                renderItem={
                                    item =>
                                        <List.Item>
                                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <div style={{ color: 'green' }}>{item.price / ("1e" + 18) + ' BNB'}</div>
                                                <div style={{ marginLeft: '0.4rem', display: 'flex' }}>
                                                    {
                                                        item.seller.slice(0, 5) +
                                                        '...' +
                                                        item.seller.slice(item.seller.length - 5, item.seller.length)
                                                    }
                                                </div>
                                            </div>
                                        </List.Item>
                                }
                            />
                        }
                        <Button
                            onClick={buyNFT}
                            disabled={getMarketItem()?.sold}
                            style={{ marginTop: '1rem' }}
                            type="primary"
                        >
                            {!getMarketItem()?.sold ? 'Buy' :'Not Available'}
                        </Button>
                    </Card>
                </div>
            </Skeleton>
        </div>
    )
}