// this will be converted into the new "full wallet" example, which will build off the quickstart example. This example will include seed and descriptor creation, getting sats fromm a faucet and transaction broadcasting, etc...

use bdk_wallet::keys::bip39::{Language, Mnemonic, WordCount};
use bdk_wallet::keys::{GeneratableKey, GeneratedKey};
use bdk_wallet::miniscript::Tap;
use bdk_wallet::bitcoin::bip32::Xpriv;
use bdk_wallet::bitcoin::Network;
use bdk_wallet::KeychainKind;
use bdk_wallet::template::{Bip86, DescriptorTemplate};

fn main() {
    let mnemonic: GeneratedKey<_, Tap> =
    Mnemonic::generate((WordCount::Words12, Language::English))
        .expect("Failed to generate mnemonic");
    println!("generated Seed Words:");
    println!("{}", mnemonic.to_string());
    println!("save these to recover your wallet later");

    let seed = mnemonic.to_seed("");
    let xprv: Xpriv =
        Xpriv::new_master(Network::Signet, &seed).expect("Failed to create master key");
    println!("created Master Private Key:");
    println!("{}", xprv);

    let (descriptor, key_map, _) = Bip86(xprv, KeychainKind::External)
        .build(Network::Signet)
        .expect("Failed to build external descriptor");
    println!("external descriptor: {}", descriptor);
    let (change_descriptor, change_key_map, _) = Bip86(xprv, KeychainKind::Internal)
        .build(Network::Signet)
        .expect("Failed to build internal descriptor");
    println!("internal descriptor: {}", change_descriptor);
    //notice that descriptors are defined with pubkeys. this means our wallet won't be able to sign, we'll need a separate signer

    // at this point we just pick up with the quickstart example
}
