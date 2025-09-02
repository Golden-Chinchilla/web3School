// lib/contracts.ts
import Phantom from "./PhantomABI.json";
import CoursePass1155ABI from "./CoursePass1155ABI.json";
import CourseRegistryABI from "./CourseRegistryABI.json";

export const CONTRACTS = {
    PHANTOM_TOKEN: {
        address: "0x25d3c9805C9f77Bd80b7ec5571549b19bF9F2717" as `0x${string}`,
        abi: Phantom.abi,
        symbol: "$PHT",
    },
    CourseRegistry: {
        address: "0x7465F8527C20BC8F1a6C18Eee12C23D1033e8F37" as `0x${string}`,
        abi: CourseRegistryABI.abi,
    },
    CoursePass1155: {
        address: "0x2C4df61d4c9761422Af7D1eF07023896128a42ad" as `0x${string}`,
        abi: CoursePass1155ABI.abi,
    },

};
