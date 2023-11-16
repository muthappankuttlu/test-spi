// const db = require("./index.model");
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
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
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
// const Sequelize = require("sequelize");

const nodeCron = require("node-cron");
// var jsonminify = require("jsonminify");

const TS = Math.floor(new Date().getTime());
const CURL = process.env.CLIENT_URL;

exports.selectProvider = async () => {
  try {
    let select = Math.floor(Math.random() * 10) + 1;
    let selector = process.env["MAINNET_PROVIDER" + "_" + select];
    console.log("Special Provider", select, selector);
    const rpcURL = `https://mainnet.infura.io/v3/${selector}`;
    // const rpcURL = `https://celo-mainnet.infura.io/v3/${selector}`;
    // const rpcURL = `https://eth-mainnet.g.alchemy.com/v2/H13JMgZej6CnpXj8VR23qF3qG-o1jOQP`;
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

exports.index = async (req, res) => {
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
  var headers = {
    // From: 'From'.replace(/,/g, ''), // remove commas to avoid errors
    To: "To",
    // Symbol: "Symbol",
    // Amount: "Amount"
  };
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
    // let myArrayFiltered = this.customArrayFilter(
    //   filteredTo.map((vs) => {
    //     console.log(this.existOrNotStr(oldData, vs.To));
    //     if (this.existOrNotStr(oldData, vs.To) == false) {
    //       return { To: vs.To };
    //     }
    //   })
    // );

    // console.log("filteredTo SATZ CATZ", filteredTo);
    let filteredTos = [
      ...new Map(filteredTo.flat(1).map((m) => [m.To, m])).values(),
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
            To: fileData,
          };
        }
      });

      let oldDataArr = oldData.filter(function (el) {
        return el != null && el != false && el != "";
      });

      var uniqueRecordsArr = [...oldDataArr, ...filteredTos];

      let finalfilteredTosCollections =
        this.customArrayFilter(uniqueRecordsArr);

      // console.log(
      //   "finalfilteredTosCollections Sakthi",
      //   finalfilteredTosCollections
      // );

      let finalfilteredTosCollectionsonly = finalfilteredTosCollections.map(
        (v) => {
          return { address: v.To };
        }
      );

      while (finalfilteredTosCollectionsonly.length > 0) {
        Blockarrays.push(finalfilteredTosCollectionsonly.splice(0, size));
      }

      // console.log("Blockarrays", Blockarrays);
      let timer = new Date().valueOf();
      Blockarrays.map((currVal, currInd, currArr) => {
        let fileTitle =
          `block_dex_etherscan_scrap_${new Date()
            .toJSON()
            .slice(0, 10)}`.replace(/-/g, "_") +
          "_" +
          Date.now() +
          ".json"; // or 'my-unique-title'

        // var ws = fileSystem.createWriteStream(publicDir + `${fileTitle}`);
        // fastcsv
        //   .write(currVal, { headers: true })
        //   .on("finish", function () {
        //     console.log("Done");

        //     // fs.unlinkSync(inputPath);
        //     if (Blockarrays.length == currInd + 1) {
        //       fs.unlink(inputPath, function (err) {
        //         // if(err) throw err;
        //         if (err) return true;
        //         console.log("File deleted!");
        //       });
        //     }
        //   })
        //   .pipe(ws);

        // console.log("fileTitle 2", currVal);
        // let data = jsonminify(JSON.stringify(currVal, null, "\t"));
        let data = JSON.stringify(currVal, null, 1)
          .replace(/\r?\n|\r/g, "")
          .split("[")
          .join("[ \n")
          .split(",")
          .join(", \n")
          .split("}]")
          .join("} \n ]");
        // console.log("fileTitle 37", data);
        fs.writeFileSync(publicDir + fileTitle, data);
        if (currInd == 0) {
          fs.unlinkSync(inputPath);
        }
      });
    }
  } else {
    let filteredTos = await this.cscraper(req, res).then((rw) => rw);

    if (filteredTos.length > 0) {
      let finalfilteredTosCollections = this.customArrayFilter(filteredTos);

      let finalfilteredTosCollectionsonly = finalfilteredTosCollections.map(
        (v) => {
          return { address: v.To };
        }
      );

      // console.log(
      //   "lastBackup Dhavasakthi",
      //   filteredTos.length > 0,
      //   finalfilteredTosCollectionsonly
      // );

      while (finalfilteredTosCollectionsonly.length > 0) {
        Blockarrays.push(finalfilteredTosCollectionsonly.splice(0, size));
      }
      let timer = new Date().valueOf();
      Blockarrays.map((currVal, currInd, currArr) => {
        let fileTitle =
          `block_dex_etherscan_scrap_${new Date()
            .toJSON()
            .slice(0, 10)}`.replace(/-/g, "_") +
          "_" +
          Date.now() +
          ".json"; // or 'my-unique-title'

        // var ws = fileSystem.createWriteStream(publicDir + `${fileTitle}`);
        // fastcsv
        //   .write(currVal, { headers: true })
        //   .on("finish", function () {
        //     console.log("Done");
        //   })
        //   .pipe(ws);

        // console.log("fileTitle 34", fileTitle);
        // let data = jsonminify(JSON.stringify(currVal, null, "\t"));
        let data = JSON.stringify(currVal, null, 1)
          .replace(/\r?\n|\r/g, "")
          .split("[")
          .join("[ \n")
          .split(",")
          .join(", \n")
          .split("}]")
          .join("} \n ]");
        // console.log("fileTitle 35", data);
        fs.writeFileSync(publicDir + fileTitle, data);
      });
    }
  }
  console.log("ETH Game Over");
  return res.redirect(CURL + "/scrap-blocks-tx-list");
};

exports.cscraper = async (req, res) => {
  try {
    const limit = RateLimit(3);
    const dex = await this.dexScraper();
    if (!dex) {
      return false;
    }
    console.log(dex, "\n", "ETH DEX SAKTHI");

    let contractArr = await Promise.all(
      dex.splice(0, 15).map(async (v, i, arr) => {
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
        .splice(0, 10)
        .filter((item) => item)
        .map(async (vl, il) => {
          return await this.transactionLog(vl.contracts).then((res) => {
            return res;
          });
        })
    ).then((rc) => {
      let filteredTo = [
        ...new Map(
          rc
            .flat()
            .filter((item) => item)
            .map((m) => [m.To, m])
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
        .splice(0, 200)
        .filter((item) => item)
        .map(async (valid2, di2, arr2) => {
          console.log("input", valid2.To);
          return await this.userValidAddress(valid2.To).then(
            async (resAddress) => {
              console.log("resAddress", resAddress);
              return await resAddress;
            }
          );
        })
    ).then((r2) => {
      let filteredTo2 = [
        ...new Map(
          r2
            .flat()
            .filter((item) => item)
            .map((m2) => [m2.To, m2])
        ).values(),
      ];

      return filteredTo2.filter((item) => item);
    });

    console.log("isValid", isValid);
    return isValid;
  } catch (err) {
    console.log(err);
  }
};

exports.dexScraper = async () => {
  let url = "https://etherscan.io/dextracker_txns";
  // https://cn.etherscan.com/

  // var pageLoad = await this.retryHTTPCall("https://etherscan.io/dex")
  //   .then((resPage) => {
  //     return resPage;
  //   })
  //   .then((res) => {
  //     return resPage;
  //   });
  // console.log(pageLoad);
  // return;

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

exports.contractScraper = async (decentralizedAddr) => {
  if (!decentralizedAddr) {
    return false;
  }
  let url = `https://etherscan.io/tx/${decentralizedAddr}`;
  const coinArray = [];
  const limit = RateLimit(4);
  await limit();

  return await fetch(url)
    .then(async (contract) => {
      if (contract.status == 200) {
        console.log("ETH Contract_URL", url, contract.status);
        const html_data = await contract.text();
        const $ = cheerio.load(html_data);
        // const selectedElem = "a#contractCopy";
        const selectedElem =
          "#ContentPlaceHolder1_maintable > div:nth-child(1) > div:nth-child(11) > div.col-md-9 > div:nth-child(1) > a.text-break";
        const keys = ["contracts"];
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
        return coinArray;
      } else {
        return false;
      }
    })
    .catch((e) => {
      console.log("---395-->", e);
    });
};

exports.transactionLog = async (logAdd) => {
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
                    .find("td:nth-child(7) > div > a:nth-child(1)")
                    .attr("data-bs-title");
                  console.log("ETH User_Log_URL", url, usr_log.status, value);
                  if (value) {
                    coinArray.push({ To: value });
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

exports.userValidAddress = async (userAdd) => {
  if (!userAdd) {
    return false;
  }
  let from = 5000;
  let userValidAddressUrl = `https://etherscan.io/address/${userAdd}`;
  const coinArray = [];
  const limit = RateLimit(20);
  await limit();
  return await fetch(userValidAddressUrl)
    .then(async (usr_logRes) => {
      console.log("PRE URL", userValidAddressUrl, usr_logRes.status);
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
                coinArray.push({ To: userAdd });
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
    return array.some(function (entry) {
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
  let filteredTosCollections = array.filter(function (el) {
    // return el != null;
    return el != null && el != false && el != "";
  });

  if (filteredTosCollections) {
    let finalfilteredTosCollections = [
      ...new Map(filteredTosCollections.map((m) => [m.To, m])).values(),
    ];
    return finalfilteredTosCollections;
  } else {
    return false;
  }
};

exports.countFileLines = async (filePath) => {
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

exports.retryHTTPCall = async (url) => {
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

// Schedule a job to run every two minutes
// const job = nodeCron.schedule("25 * * * * *", this.index);
