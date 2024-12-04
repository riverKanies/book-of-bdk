import {  WalletWrapper, greet } from '../rust/pkg';

// needed to handle js Map serialization
const Store = {
    save: data => {
        if (!data) {
            console.log("No data to save");
            return;
        }
        const serializedStaged = JSON.stringify(data, (key, value) => {
            if (value instanceof Map) {
                return {
                    dataType: 'Map',
                    value: Array.from(value.entries())
                };
            }
            return value;
        });
        localStorage.setItem("walletData", serializedStaged);
    },
    load: () => {
        const walletDataString = localStorage.getItem("walletData");
        // Convert serialized Maps back to Map objects when loading
        const walletData = JSON.parse(walletDataString, (key, value) => {
            if (value?.dataType === 'Map') {
                return new Map(value.value);
            }
            return value;
        });
        return walletData;
    }
}


const externalDescriptor = "tr([12071a7c/86'/1'/0']tpubDCaLkqfh67Qr7ZuRrUNrCYQ54sMjHfsJ4yQSGb3aBr1yqt3yXpamRBUwnGSnyNnxQYu7rqeBiPfw3mjBcFNX4ky2vhjj9bDrGstkfUbLB9T/0/*)#z3x5097m";
const internalDescriptor = "tr([12071a7c/86'/1'/0']tpubDCaLkqfh67Qr7ZuRrUNrCYQ54sMjHfsJ4yQSGb3aBr1yqt3yXpamRBUwnGSnyNnxQYu7rqeBiPfw3mjBcFNX4ky2vhjj9bDrGstkfUbLB9T/1/*)#n9r4jswr";

async function run() {    
    console.log(greet()); // Should print "Hello, bdk-wasm!"
    
    const walletData = Store.load();
    console.log("Wallet data:", walletData);

    if (!walletData) {
        console.log("No wallet data found, creating new wallet");
        // Test wallet creation
        // --8<-- [start:new]
        const wallet = new WalletWrapper(
            "signet",
            externalDescriptor,
            internalDescriptor,
            "https://mutinynet.com/api"
        );
        // --8<-- [end:new]

        console.log("Performing Full Scan");
        // --8<-- [start:scan]
        // Test sync
        await wallet.scan(2);
        // --8<-- [end:scan]


        const staged = wallet.take_staged();
        console.log("Staged:", staged);
        // Convert Maps to serializable objects before storing
        Store.save(staged);
        console.log("Wallet data saved to local storage");


    } else {
        console.log("Loading wallet from local storage");
        
        // localStorage.removeItem("walletData");

        // Make sure to parse the walletData with Map conversion here too
        const loaded = WalletWrapper.load(
            walletData,
            "https://mutinynet.com/api",
            externalDescriptor,
            internalDescriptor
        );

        console.log("Loaded:", loaded);

        console.log("Syncing...");
        await loaded.sync(2);
        
        console.log("Balance (Loaded):", loaded.balance());

        const merged = loaded.take_merged(walletData);
        console.log("Merged:", merged);

        console.log("New address (Loaded):", loaded.get_new_address());

        // const staged = loaded.take_staged();
        // console.log("Staged:", staged);

        const merged2 = loaded.take_merged(walletData);
        console.log("Merged2:", merged2);

        Store.save(merged2);
        console.log("new address saved");
    }

    // // --8<-- [start:utils]
    // // Test balance
    // console.log("Balance:", wallet.balance());
    
    // // Test address generation
    // console.log("New address:", wallet.get_new_address());
    // // --8<-- [end:utils]
}

run().catch(console.error);