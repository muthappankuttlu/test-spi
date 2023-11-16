const db = require("./index.model");
// const ethers = require("ethers");
const Web3 = require("web3");
// import { attach, getConfig } from "retry-axios";
// import axios from "axios";
// const getConfig = require("retry-axios");
// const axios = require("axios");
// const retry = require("retry-axios");
const Path = require("path");
// const moralispage = require("./moralis.js");
const axios = require("axios");
const axiosRetry = require("axios-retry");
const rateLimit = require("axios-rate-limit");
var functionRecallCounting = 0;
const fetch = (...args) =>
    import ("node-fetch").then(({ default: fetch }) => fetch(...args));
const { RateLimit } = require("async-sema");

// const Moralis = require("moralis").default;
// const { EvmChain } = require("@moralisweb3/common-evm-utils");
// const chain = EvmChain.ETHEREUM;
const cheerio = require("cheerio");

var fileSystem = require("fs");
var fastcsv = require("fast-csv");
// const fs = require("fs");
const fs = require("graceful-fs");
const { parse } = require("csv-parse");
const csv = require("csv-parser");
const Sequelize = require("sequelize");
var exec = require("child_process").exec;
const nodeCron = require("node-cron");

// var jsonminify = require("jsonminify");

const TS = Math.floor(new Date().getTime());
const CURL = process.env.CLIENT_URL;

const ethscan = db.ethscanTable;
const Op = db.Sequelize.Op;

exports.selectProvider = async() => {
    try {
        let select = Math.floor(Math.random() * 10) + 1;
        let selector = process.env["MAINNET_PROVIDER" + "_" + select];
        console.log("Special Provider", select, selector);
        const rpcURL = `https://mainnet.infura.io/v3/${selector}`;
        const web3 = new Web3(rpcURL, {
            clientConfig: {
                maxReceivedFrameSize: 100000000,
                maxReceivedMessageSize: 100000000,
            },
        });
        let block = (await web3.eth.getBlockNumber()) - 10;
        console.log("Provider", select, selector, rpcURL, block);
        return { web3, block };
    } catch (error) {
        let needer = "Invalid JSON RPC response";
        let exceed =
            "Contract Catch Error Error: Returned error: daily request count exceeded, request rate limited";
        console.log(
            "Provider Try Catch 7834",
            error.message,
            error.message.indexOf(needer) > -1,
            error.message.indexOf(exceed) > -1
        );
        if (error.message.indexOf(needer) > -1) {
            if (functionRecallCounting++ >= 10) {
                return;
            }
            this.selectProvider();
        } else if (error.message.indexOf(exceed) > -1) {
            console.log("SATZ 2", error.message);
            if (functionRecallCounting++ >= 10) {
                return;
            }
            this.selectProvider();
        } else {
            console.log(error.message);
        }
    }
};

exports.index = async(req, res) => {
    let w3 = await this.selectProvider().then((r) => r);
    if (!w3) {
        w3 = await this.selectProvider().then((r) => r);
    }
    const web3 = w3 ? w3.web3 : "";
    const blockNumber = w3 ? w3.block : "";
    // console.log("My Special Provider Result", web3);
    const regEx = /^0x0+$/;
    var Blockarrays = [],
        size = 500,
        myArrayFiltered;
    var itemsFormatted = [];
    let itemsNotFormatted = {},
        filteredTosCollections;
    let oldData = [];
    let i;
    let count = 0;
    const publicDir = __dirname + "/ethscan/";
    const files = this.getDirectoriesList(publicDir);

    if (files && files.length > 0) {
        // console.log("Index File countoun", files, files.length);

        let filteredTo = await this.cscraper(req, res).then((rw) => rw);

        // request access through php
        // if (this.getPhpData()) {
        //     console.log("this.getPhpData()"), this.getPhpData();
        //     filteredTo = [...this.getPhpData(), ...filteredTo];
        //     this.rmphpDir();
        //     console.log("Remove all php json files");
        // }

        let filteredTos = [
            ...new Map(filteredTo.flat().map((m) => [m.address, m])).values(),
        ];

        console.log("Final Arr 2-->", filteredTos);
        if (filteredTos.length > 0) {
            let publicDir = __dirname + "/ethscan/";
            let files = this.getDirectoriesList(publicDir);
            let inputPath = publicDir + files.sort().reverse()[0];
            // console.log("InputPath", inputPath);
            let oldFileData = await this.countFileLines(inputPath)
                .then((res) => {
                    return res;
                })
                .then((resData) => {
                    return resData;
                })
                .catch((err) => {
                    return err;
                });

            let oldData = oldFileData.map((oValue, iIndex, Arr) => {
                if (web3.utils.isAddress(oValue.address)) {
                    let fileData = oValue.address;
                    return {
                        address: fileData,
                    };
                }
            });

            let oldDataArr = oldData.filter(function(el) {
                return el != null && el != false && el != "";
            });



            // let filteredTos = [
            //     { address: '0x1b2151b9453898bd480457edca09b83f0d49348a' },
            //     { address: '0x7cb5648450bee34bd2d5977c0f3dbac0def2ebf9' },
            //     { address: '0x2f3be05f00f9963a746c6cb54c6749cda81e6cca' },
            //     { address: '0x7268c398c67f9de9b9b463c79eba084f0bd8368e' },
            //     { address: '0x22f1403c1184d50bdcb832b25b8ac22faa35a9a3' },
            //     { address: '0xea124b21969ed91ed513f170027d36d0262f95e3' }
            // ];

            // Check already exist or Not
            let rvDuplicateArr = await this.isAddressExist(filteredTos)
                .then((ad) => ad)
                .then((ac) => ac);
            console.log("rvDuplicateArr second", rvDuplicateArr);

            if (!rvDuplicateArr) {
                console.log("Finished No fetch data");
                return false;
            }
            // return;
            var uniqueRecordsArr = [...oldDataArr, ...rvDuplicateArr];

            let finalfilteredTosCollections =
                this.customArrayFilter(uniqueRecordsArr);

            while (finalfilteredTosCollections.length > 0) {
                Blockarrays.push(finalfilteredTosCollections.splice(0, size));
            }

            Blockarrays.map((currVal, currInd, currArr) => {
                this.createFiles(publicDir, currVal);
                if (currInd == 0) {
                    fs.unlinkSync(inputPath);
                }
            });
        }
    } else {
        let filteredTos = await this.cscraper(req, res).then((rw) => rw);

        if (filteredTos.length > 0) {

            // let filteredTos = [
            //     { address: '0x1b2151b9453898bd480457edca09b83f0d49348a' },
            //     { address: '0x7cb5648450bee34bd2d5977c0f3dbac0def2ebf9' },
            //     { address: '0x2f3be05f00f9963a746c6cb54c6749cda81e6cca' },
            //     { address: '0x7268c398c67f9de9b9b463c79eba084f0bd8368e' },
            //     { address: '0x22f1403c1184d50bdcb832b25b8ac22faa35a9a3' },
            //     { address: '0xea124b21969ed91ed513f170027d36d0262f95e3' }
            // ];

            let finalfilteredTosCollections = this.customArrayFilter(filteredTos);

            // Check already exist or Not
            let rvDuplicateArr = await this.isAddressExist(
                    finalfilteredTosCollections
                )
                .then((ad) => ad)
                .then((ac) => ac);

            if (!rvDuplicateArr) {
                return false;
            }

            while (rvDuplicateArr.length > 0) {
                Blockarrays.push(rvDuplicateArr.splice(0, size));
            }
            Blockarrays.map((currVal, currInd, currArr) => {
                this.createFiles(publicDir, currVal);
            });
        }
    }
    console.log("ETH Game Over", new Date());
    // return res.redirect(CURL + "/scrap-blocks-tx-list");
    return true;
};

exports.isAddressExist = async(array) => {
    return Promise.all(
        array.map(async(v) => {
            let condition = { address: v.address };
            return await ethscan
                .findOne({ where: condition })
                .then(async function(obj) {
                    // update
                    // if (obj) return obj.update(values);
                    if (obj) { return false; } else {
                        // insert
                        console.log('Insert', { address: v.address });
                        return await ethscan.create(condition, { raw: true }).then((ins) => {
                            return ins ? { address: v.address } : '';
                        });
                    }
                });
        })).then((cc) => this.customArrayFilter(cc));
};

exports.cscraper = async(req, res) => {
    try {
        const limit = RateLimit(1);
        const dex = await this.dexScraper();
        if (!dex) {
            return false;
        }
        // console.log(dex, "\n", "ETH DEX SAKTHI");

        let contractArr = await Promise.all(
            dex.splice(0, 4).map(async(v, i, arr) => {
                return await this.contractScraper(v.decentralized).then((ress) => {
                    return ress;
                });
            })
        ).then((r) => {
            let filteredToContracts = [
                ...new Map(
                    r
                    .flat()
                    .filter((item) => item)
                    .filter(function(el) {
                        return (
                            el.contracts != null &&
                            el.contracts != false &&
                            el.contracts != ""
                        );
                    })
                    .map((m) => [m.contracts, m])
                ).values(),
            ];
            return filteredToContracts;
        });

        if (!contractArr) {
            return false;
        }

        console.log("ETH contractArr", contractArr);

        let uAddress = await Promise.all(
            contractArr
            .splice(0, 5)
            .filter((item) => item)
            .map(async(vl, il) => {
                if (vl) {
                    return await this.transactionLog(vl.contracts).then((res) => {
                        return res;
                    });
                }
            })
        ).then((rc) => {
            let filteredTo = [
                ...new Map(
                    rc
                    .flat()
                    .filter((item) => item)
                    .map((m) => [m.address, m])
                ).values(),
            ];
            return filteredTo;
        });

        console.log("ETH uAddress", uAddress);

        if (!uAddress) {
            return false;
        }

        let isValid = await Promise.all(
                uAddress
                .splice(0, 100)
                .filter((item) => item)
                .map(async(valid2, di2, arr2) => {
                    // console.log("input", valid2.address);
                    return await this.userValidAddress(valid2.address).then(
                        async(resAddress) => {
                            // console.log("resAddress", resAddress);
                            return await resAddress;
                        }
                    );
                })
            )
            .then((r2) => {
                let filteredTo2 = [
                    ...new Map(
                        r2
                        .flat()
                        .filter((item) => item)
                        .map((m2) => [m2.address, m2])
                    ).values(),
                ];

                return filteredTo2.filter((item) => item);
            })
            .catch(function(error) {
                console.log("ETH catch ", error);
                return error;
            });

        console.log("isValid", isValid);
        return isValid;
    } catch (err) {
        console.log(err);
    }
};

exports.dexScraper = async() => {
    let url = "https://etherscan.io/dextracker_txns";
    const coinArray = [];
    const limit = RateLimit(1);
    await limit();
    let response = await fetch(url)
        .then((dex) => {
            console.log("Error DEX Code", dex.status);
            return dex.text();
        })
        .catch((e) => {
            console.log("---394-->", e);
        });

    const html_data = response.toString();
    const $ = cheerio.load(html_data);
    const selectedElem = ".myFnExpandBox_searchVal";
    const keys = ["decentralized"];
    $(selectedElem).each((parentIndex, parentElem) => {
        let keyIndex = 0;
        const coinDetails = {};
        $(parentElem).each((childId, childElem) => {
            const value = $(childElem).text();
            if (value) {
                coinDetails[keys[keyIndex]] = value;
                keyIndex++;
            }
        });
        coinArray.push(coinDetails);
    });

    let filteredTo = [
        ...new Map(
            coinArray.filter((item) => item).map((m) => [m.decentralized, m])
        ).values(),
    ];
    return filteredTo;
};

exports.contractScraper = async(decentralizedAddr) => {
    if (!decentralizedAddr) {
        return false;
    }
    let url = `https://etherscan.io/tx/${decentralizedAddr}`;
    const coinArray = [];
    const limit = RateLimit(1);
    await limit();

    return await fetch(url)
        .then(async(contract) => {
            if (contract.status == 200) {
                const coinDetails = {};
                const html_data = await contract.text();
                const $ = cheerio.load(html_data);
                // const selectedElem = "a#contractCopy";
                console.log("ETH Contract_URL", url, contract.status);
                // const selectedElem =
                //     "#ContentPlaceHolder1_maintable > div:nth-child(1) > div:nth-child(11) > div.col-md-9 > div:nth-child(1) > a.text-break";
                const selectedElem =
          "#ContentPlaceHolder1_maintable > div.card.p-5.mb-3 > div:nth-child(11) > div.col-md-9 > div:nth-child(1) > span > a.text-break";
                const keys = ["contracts"];
                $(selectedElem).each((parentIndex, parentElem) => {
                    let keyIndex = 0;
                    $(parentElem).each((childId, childElem) => {
                        const value = $(childElem).text();
                        if (value) {
                            coinDetails[keys[keyIndex]] = value;
                            keyIndex++;
                        }
                    });
                    coinArray.push(coinDetails);
                });

                console.log("CoinDetails", !coinDetails);

                if (!coinDetails) {
                    console.log("Empty Contract address fetching");
                    const coinArray2 = [];
                    // const selectedElem2 =
                    //     "#ContentPlaceHolder1_maintable > div:nth-child(1) > div:nth-child(8) > div.col-md-9 > div > a.text-break";
                    const selectedElem2 =
                    "#ContentPlaceHolder1_maintable > div.card.p-5.mb-3 > div:nth-child(11) > div.col-md-9 > div:nth-child(1) > span > a.text-break";
                    $(selectedElem2).each((parentIndex, parentElem2) => {
                        const value2 = $(parentElem2).text();
                        if (value2) {
                            coinArray2.push({ contracts: value2 });
                        }
                    });
                    let coinArray = [...coinArray, ...coinArray2];
                }
                return coinArray;
            } else {
                return false;
            }
        })
        .catch((e) => {
            console.log("---395-->", e);
        });
};

exports.transactionLog = async(logAdd) => {
    if (!logAdd) {
        return false;
    }
    let url = `https://etherscan.io/txs?a=${logAdd}`;
    const coinArray = [];
    const limit = RateLimit(5);
    await limit();

    return await fetch(url)
        .then((usr_log) => {
            if (usr_log.status == 200) {
                return usr_log
                    .text()
                    .then((lg) => {
                        const $ = cheerio.load(lg);
                        // const selectedElem = "#paywall_mask > table > tbody";
                        const selectedElem =
                            "#ContentPlaceHolder1_divTransactions > div.table-responsive > table > tbody";
                        const keys = ["Address"];
                        $(selectedElem).each((parentIndex, parentElem) => {
                            $(parentElem)
                                .children()
                                .each((childId, childElem) => {
                                    const value = $(childElem)
                                        .find("td:nth-child(8) > div > a:nth-child(1)")
                                        .attr("data-bs-title");
                                    console.log("ETH User_Log_URL", url, usr_log.status, value);
                                    if (value) {
                                        coinArray.push({ address: value });
                                    }
                                });
                        });
                        return coinArray;
                    })
                    .catch((logs) => logs);
            } else {
                return false;
            }
        })
        .catch((e) => {
            console.log("---397-->", e);
            return false;
        });
};

exports.userValidAddress = async(userAdd) => {
    if (!userAdd) {
        return false;
    }
    let from = 5000;
    let userValidAddressUrl = `https://etherscan.io/address/${userAdd}`;
    const coinArray = [];
    const limit = RateLimit(20);
    await limit();
    return await fetch(userValidAddressUrl)
        .then(async(usr_logRes) => {
            // console.log("PRE URL", userValidAddressUrl, usr_logRes.status);
            return await usr_logRes
                .text()
                .then((logv) => {
                    const html_data = logv.toString();
                    const $ = cheerio.load(html_data);
                    const selectedElem = "#dropdownMenuBalance";
                    $(selectedElem).each((parentIndex, parentElem) => {
                        const value = $(parentElem).text();
                        if (value) {
                            let removeComma = value.toString().split("\n")[1];
                            if (removeComma) {
                                removeComma = removeComma.replace(/[^a-zA-Z0-9 |.]/g, "");
                            } else {
                                removeComma = 0;
                            }

                            console.log(
                                "User_Log_URL",
                                userValidAddressUrl,
                                usr_logRes.status,
                                userAdd,
                                from,
                                removeComma,
                                removeComma >= from
                            );

                            if (removeComma >= from) {
                                coinArray.push({ address: userAdd });
                            }
                        }
                    });
                    return coinArray;
                })
                .catch((re) => re);
        })
        .catch((e) => {
            console.log("---398-->", e);
            return false;
        });
};

exports.getDirectoriesList = (source) => {
    const files = fs.readdirSync(source);
    return files;
};

exports.existOrNotStr = (array, value) => {
    // `Array#some` loops through the array until the iterator
    // function returns true; it returns true if the iterator
    // does at some point, false otherwise
    return (function iterate(array, value) {
        return array.some(function(entry) {
            // If this entry in the array is an array, recurse
            if (Array.isArray(entry)) {
                return iterate(entry, value);
            }
            // It isn't, do an equality check
            return entry === value;
        });
    })(array, value);
};

exports.customArrayFilter = (array) => {
    if (!array) {
        return false;
    }
    let filteredTosCollections = array.filter(function(el) {
        // return el != null;
        return el != null && el != false && el != "";
    });

    if (filteredTosCollections) {
        let finalfilteredTosCollections = [
            ...new Map(filteredTosCollections.map((m) => [m.address, m])).values(),
        ];
        return finalfilteredTosCollections;
    } else {
        return false;
    }
};

exports.countFileLines = async(filePath) => {
    function getData(file, type) {
        let data = [];
        return new Promise((resolve, reject) => {
            try {
                // fs.createReadStream(file)
                //   .on("error", (error) => {
                //     reject(error);
                //   })
                //   .pipe(
                //     parse({
                //       delimiter: ",",
                //       from_line: 2,
                //       index: 1,
                //       invalid_field_length: true,
                //       columns: false,
                //       trim: true,
                //       relax_column_count: true,
                //     })
                //   )
                //   .on("data", (row) => {
                //     let item = {
                //       // From: row[0],
                //       // To: JSON.parse(JSON.stringify(row))[0].toString(),
                //       To: JSON.parse(JSON.stringify(row))[0],
                //       // Symbol: row[2],
                //       // Amount: row[3],
                //       rawData: JSON.parse(JSON.stringify(row))[0],
                //     };

                //     data.push(item);
                //   })
                //   .on("end", () => {
                //     resolve({ data });
                //   });
                return fs.readFile(filePath, "utf8", (err, jsonString) => {
                    if (err) {
                        console.log("File read failed:", err);
                        return;
                    }
                    // console.log(
                    //   "File data:",
                    //   JSON.stringify(jsonString),
                    //   JSON.parse(JSON.stringify(jsonString))
                    // );
                    resolve(JSON.parse(JSON.stringify(jsonString)));
                });
            } catch (error) {
                console.log(error);
            }
        });
    }
    // console.log("Sakthi Test Data");
    async function testGetData() {
        try {
            const data = await getData(filePath, {});
            // console.log("Read Data", JSON.parse(data));
            return JSON.parse(data);
        } catch (error) {
            console.error("testGetData: An error occurred: ", error.message);
        }
    }
    return await testGetData();
};

exports.fetchBlockRecordList = (req, res) => {
    const publicDir = __dirname + "/ethscan/";
    const files = this.getDirectoriesList(publicDir);
    // console.log(publicDir, files);
    return res.render("records", {
        records: files,
        dirpath: CURL + "/ethscan/",
    });
};

exports.retryHTTPCall = async(url) => {
    if (!url) return false;
    return await axios({ url: url })
        .then((result) => {
            console.log(result);
            return result;
        })
        .catch((err) => {
            console.log(err.response);
            if (err.response.status !== 200) {
                throw new Error(
                    `API call failed with status code: ${err.response.status} after 4 retry attempts`
                );
            }
        });
};

exports.php = (req, res) => {
    // exec("./php/etherscan/php scrap.php", function (error, stdout, stderr) {
    // exec("php scrap.php", function(error, stdout, stderr) {
    //     console.log("stdout", stdout, error, stderr);
    //     // res.send(stdout);
    // });

    // var spawn = spawn('php', ['scrap.php']);
    // spawn.stdout.on('data', function(msg) {
    //     console.log(msg.toString())
    // });

};

exports.getPhpData = () => {
    const directory = "./php/etherscan/eth/";
    const jsonContainer = [];
    const jsonsInDir = fs
        .readdirSync(directory)
        .filter((file) => Path.extname(file) === ".json");

    jsonsInDir.forEach((file) => {
        const fileData = fs.readFileSync(Path.join(directory, file));
        jsonContainer.push(JSON.parse(fileData.toString()));
    });

    return jsonContainer ? jsonContainer.flat() : "";
};

exports.rmphpDir = async() => {
    const directory = "./php/etherscan/eth/";
    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(Path.join(directory, file), (err) => {
                if (err) throw err;
            });
        }
        return true;
    });
};

exports.rmuniqueAddressDir = async() => {
    const directory = "./ethscan/";
    const jsonContainer = [];
    const jsonsInDir = fs
        .readdirSync(directory)
        .filter((file) => Path.extname(file) === ".json");

    jsonsInDir.forEach((file) => {
        const fileData = fs.readFileSync(Path.join(directory, file));
        jsonContainer.push(JSON.parse(fileData.toString()));
    });

    if (jsonContainer && this.customArrayFilter(jsonContainer.flat())) {
        console.log("Directory Unique is completed");
        return this.makeUniqueAddressDir(
            this.customArrayFilter(jsonContainer.flat())
        );
    }
    console.log("Directory Unique Failed");
    return true;
};
exports.makeUniqueAddressDir = async(array) => {
    if (!array) {
        return false;
    }

    let arrayTemp = array;

    let date = new Date().toJSON().slice(0, 10);
    const directory = __dirname + "/ethscan/";
    const tempDirectory = __dirname + "/temp/eth/";
    let size = 500;

    console.log("3333--->", arrayTemp);

    let dateWiseTempDir = tempDirectory + date + "/";
    if (fs.existsSync(dateWiseTempDir)) {
        // Do something
        this.removeDirFiles(dateWiseTempDir);
        this.createFiles(dateWiseTempDir, array);
        // }
    } else {
        fs.mkdirSync(dateWiseTempDir, { recursive: true });
        this.createFiles(dateWiseTempDir, array);
    }

    var Blockarrays = [];
    while (array.length > 0) {
        Blockarrays.push(array.splice(0, size));
    }

    this.removeDirFiles(directory);
    Blockarrays.map((currVal, currInd, currArr) => {
        this.createFiles(directory, currVal);
    });
    return true;
};

exports.removeDirFiles = async(url) => {
    if (!url) {
        return false;
    }
    fs.readdir(url, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(Path.join(url, file), (err) => {
                if (err) throw err;
            });
        }
        return true;
    });
};

exports.createFiles = async(directory, currVal) => {
    if (!directory && !currVal) {
        return false;
    }

    let date = new Date().toJSON().slice(0, 10);
    let fileTitle =
        `block_dex_etherscan_scrap_${date}`.replace(/-/g, "_") +
        "_" +
        Date.now() +
        ".json"; // or 'my-unique-title'

    let data = JSON.stringify(currVal, null, 1)
        .replace(/\r?\n|\r/g, "")
        .split("[")
        .join("[ \n")
        .split(",")
        .join(", \n")
        .split("}]")
        .join("} \n ]");
    fs.writeFileSync(directory + fileTitle, data);
    return true;
};

// Schedule a job to run every two minutes
const job = nodeCron.schedule("*/1 * * * *", this.index);
// const job1 = nodeCron.schedule("*/2 * * * *", this.php);
// const job1 = nodeCron.schedule("*/25 * * * * *", this.php);

// const job3 = nodeCron.schedule("0 0 0 * * *", this.rmuniqueAddressDir);