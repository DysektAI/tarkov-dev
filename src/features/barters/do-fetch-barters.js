import fetch  from 'cross-fetch';

const doFetchBarters = async (language, prebuild = false) => {
    const bodyQuery = JSON.stringify({
        query: `{
            barters(lang: ${language}) {
                rewardItems {
                    item {
                        id
                        name
                        normalizedName
                        iconLink
                        wikiLink
                        properties {
                            ...on ItemPropertiesWeapon {
                                defaultPreset {
                                    iconLink
                                }
                            }
                        }
                        avg24hPrice
                        lastLowPrice
                        traderPrices {
                            priceRUB
                            price
                            currency
                            trader {
                                name
                            }
                        }
                        buyFor {
                            source
                            vendor {
                                name
                                normalizedName
                                __typename
                                ...on TraderOffer {
                                    trader {
                                        id
                                        name
                                        normalizedName
                                    }
                                    minTraderLevel
                                    taskUnlock {
                                        id
                                        tarkovDataId
                                        name
                                    }
                                }
                            }
                            priceRUB
                            price
                            currency
                        }
                        sellFor {
                            source
                            vendor {
                                name
                                normalizedName
                                __typename
                                ...on TraderOffer {
                                    trader {
                                        id
                                        name
                                        normalizedName
                                    }
                                    minTraderLevel
                                    taskUnlock {
                                        id
                                        tarkovDataId
                                        name
                                    }
                                }
                            }
                            priceRUB
                            price
                            currency
                        }
                        containsItems {
                            item {
                                id
                            }
                        }
                    }
                    count
                }
                requiredItems {
                    item {
                        id
                        name
                        normalizedName
                        iconLink
                        wikiLink
                        properties {
                            ...on ItemPropertiesWeapon {
                                defaultPreset {
                                    iconLink
                                }
                            }
                        }
                        avg24hPrice
                        lastLowPrice
                        traderPrices {
                            priceRUB
                            price
                            currency
                            trader {
                                name
                            }
                        }
                        buyFor {
                            source
                            vendor {
                                name
                                normalizedName
                                __typename
                                ...on TraderOffer {
                                    trader {
                                        id
                                        name
                                        normalizedName
                                    }
                                    minTraderLevel
                                    taskUnlock {
                                        id
                                        tarkovDataId
                                        name
                                    }
                                }
                            }
                            priceRUB
                            price
                            currency
                        }
                        sellFor {
                            source
                            vendor {
                                name
                                normalizedName
                                __typename
                                ...on TraderOffer {
                                    trader {
                                        id
                                        name
                                        normalizedName
                                    }
                                    minTraderLevel
                                    taskUnlock {
                                        id
                                        tarkovDataId
                                        name
                                    }
                                }
                            }
                            priceRUB
                            price
                            currency
                        }
                    }
                    count
                    attributes {
                        name
                        value
                    }
                }
                source
                trader {
                    id
                    name
                    normalizedName
                }
                level
                taskUnlock {
                    id
                    tarkovDataId
                    name
                    normalizedName
                }
            }
        }`,
    });

    const response = await fetch('https://api.tarkov.dev/graphql', {
        method: 'POST',
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: bodyQuery,
    });

    const bartersData = await response.json();

    if (bartersData.errors) {
        if (bartersData.data) {
            for (const error of bartersData.errors) {
                let badItem = false;
                if (error.path) {
                    badItem = bartersData.data;
                    for (let i = 0; i < 2; i++) {
                        badItem = badItem[error.path[i]];
                    }
                }
                console.log(`Error in barters API query: ${error.message}`);
                if (badItem) {
                    console.log(badItem)
                }
            }
        }
        // only throw error if this is for prebuild or data wasn't returned
        if (
            prebuild || !bartersData.data || 
            !bartersData.data.barters || !bartersData.data.barters.length
        ) {
            return Promise.reject(new Error(bartersData.errors[0].message));
        }
    }

    return bartersData.data.barters.map(barter => {
        barter.rewardItems.forEach(contained => {
            contained.item.iconLink = contained.item.properties?.defaultPreset?.iconLink || contained.item.iconLink;
        });
        barter.requiredItems.forEach(contained => {
            contained.item.iconLink = contained.item.properties?.defaultPreset?.iconLink || contained.item.iconLink;
        });
        return barter;
    });
};

export default doFetchBarters;
