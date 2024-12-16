import {  WalletWrapper, greet } from '../rust/pkg';

// --8<-- [start:store]
// simple string storage example
const Store = {
    save: data => {
        if (!data) {
            console.log("No data to save");
            return;
        }
        
        // Validate new data is valid JSON object
        let newDataObj;
        try {
            newDataObj = JSON.parse(data);
            if (typeof newDataObj !== 'object' || newDataObj === null) {
                throw new Error("New data must be a JSON object");
            }
        } catch (e) {
            throw new Error("Invalid JSON format for new data");
        }

        // Check and validate old data
        const oldData = localStorage.getItem("walletData");
        if (oldData) {
            let oldDataObj;
            try {
                oldDataObj = JSON.parse(oldData);
                if (typeof oldDataObj !== 'object' || oldDataObj === null) {
                    throw new Error("Stored data is not a JSON object");
                }
            } catch (e) {
                throw new Error("Invalid JSON format in stored data");
            }
            console.log("comparing", oldDataObj, newDataObj);
            if (!isSubset(oldDataObj, newDataObj)) {
                throw new Error("Old data is not a subset of new data");
            }
        }
        
        localStorage.setItem("walletData", data);
    },
    load: () => {
        return localStorage.getItem("walletData");  // return the JSON string directly
    }
}

function isSubset(oldObj, newObj) {
    return Object.keys(oldObj).every(key => {
        // console.log("checking key:", key);
        
        // indexer get's updated, so the values change
        if (key === "indexer") {
            return true;
        }

        // sync can return less blocks than scan
        if (key === "blocks") {
            const oldKeys = Object.keys(oldObj[key]);
            const newKeys = Object.keys(newObj[key]);
            if (oldKeys.length === 0 && newKeys.length === 0) {
                return true;
            }
            if (oldKeys.length > 0 && newKeys.length > 0) {
                return true;
            }
            return false;
        }

        if (!(key in newObj)) return false;
        
        if (typeof oldObj[key] === 'object' && oldObj[key] !== null) {
            return isSubset(oldObj[key], newObj[key]);
        }
        
        return oldObj[key] === newObj[key];
    });
}
// --8<-- [end:store]

// --8<-- [start:descriptors]
const externalDescriptor = "tr([12071a7c/86'/1'/0']tpubDCaLkqfh67Qr7ZuRrUNrCYQ54sMjHfsJ4yQSGb3aBr1yqt3yXpamRBUwnGSnyNnxQYu7rqeBiPfw3mjBcFNX4ky2vhjj9bDrGstkfUbLB9T/0/*)#z3x5097m";
const internalDescriptor = "tr([12071a7c/86'/1'/0']tpubDCaLkqfh67Qr7ZuRrUNrCYQ54sMjHfsJ4yQSGb3aBr1yqt3yXpamRBUwnGSnyNnxQYu7rqeBiPfw3mjBcFNX4ky2vhjj9bDrGstkfUbLB9T/1/*)#n9r4jswr";
// --8<-- [end:descriptors]

async function run() {    
    console.log(greet()); // Should print "Hello, bdk-wasm!"
    
    // --8<-- [start:wallet]
    let walletDataString = Store.load();
    console.log("Wallet data:", walletDataString);

    let wallet;
    if (!walletDataString) {
        console.log("Creating new wallet");
        wallet = new WalletWrapper(
            "signet",
            externalDescriptor,
            internalDescriptor,
            "https://mutinynet.com/api"
        );

        console.log("Performing Full Scan...");
        await wallet.scan(2);

        const stagedDataString = wallet.take_staged();
        console.log("Staged:", stagedDataString);

        Store.save(stagedDataString);
        console.log("Wallet data saved to local storage");
        walletDataString = stagedDataString;
    } else {
        console.log("Loading wallet");
        wallet = WalletWrapper.load(
            walletDataString,
            "https://mutinynet.com/api",
            externalDescriptor,
            internalDescriptor
        );

        console.log("Syncing...");
        await wallet.sync(2);

        const stagedDataString = wallet.take_merged(walletDataString);
        console.log("Staged:", stagedDataString);

        Store.save(stagedDataString);
        console.log("Wallet data saved to local storage");
    }
    // --8<-- [end:wallet]
    
    // --8<-- [start:utils]
    // Test balance
    console.log("Balance:", wallet.balance());
    
    // Test address generation
    console.log("New address:", wallet.reveal_next_address());

    // handle changeset merge on rust side
    const mergedDataString = wallet.take_merged(walletDataString);
    
    console.log("Merged:", mergedDataString);

    Store.save(mergedDataString);
    console.log("new address saved");
    // --8<-- [end:utils]
}

run().catch(console.error);

// to clear local storage:
// localStorage.removeItem("walletData");
