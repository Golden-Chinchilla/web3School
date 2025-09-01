// lib/contracts.ts
import Phantom from "./PhantomABI.json";
import RegistryABI from "./Registry.json";

export const CONTRACTS = {
    PHANTOM_TOKEN: {
        address: "0x25d3c9805C9f77Bd80b7ec5571549b19bF9F2717",
        abi: Phantom.abi,
    },
    Registry: {
        address: "0x456...",
        abi: RegistryABI,
    },
};
