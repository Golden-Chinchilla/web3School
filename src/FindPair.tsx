import { ethers } from "ethers";
import { useState } from "react";


export const FindPair = () => {
    const [pool, setPool] = useState<string | null>(null);

    const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/edb68ba45f804ca69f13448836abe647");

    // Uniswap V2 工厂合约地址（主网 & Sepolia 一样）
    const factoryV2 = new ethers.Contract(
        "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
        [
            "function getPair(address tokenA, address tokenB) external view returns (address pair)"
        ],
        provider
    );

    async function getV2Pool(tokenA: string, tokenB: string) {

        try {
            const poolAddress = await factoryV2.getPair(tokenA, tokenB);
            console.log("V2 Pool Address:", poolAddress);
            return poolAddress;
        } catch (error) {
            console.error("Error querying pool:", error);
        }

    }

    // 举例调用
    async function getPool() {

        // const pool = await getV2Pool("0x25d3c9805C9f77Bd80b7ec5571549b19bF9F2717", "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14");
        const pool = await getV2Pool("0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", "0xbe72E441BF55620febc26715db68d3494213D8Cb");
        setPool(pool);
    }

    return (
        <>
            <button className='w-20 h-10 bg-amber-700 rounded' onClick={getPool}></button>
            <h1>test</h1>
            {pool && <p>Pool Address: {pool}</p>}
        </>
    )
}
