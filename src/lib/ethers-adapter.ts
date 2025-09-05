import { useEffect, useMemo, useState } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import type { Address } from './types';

/** 从 wagmi 的 walletClient 构造 EIP-1193 兼容对象，交给 ethers BrowserProvider */
export function useEthersProvider() {
    const { data: walletClient } = useWalletClient();
    const [provider, setProvider] = useState<BrowserProvider | null>(null);

    useEffect(() => {
        if (!walletClient) { setProvider(null); return; }
        const eip1193 = { request: walletClient.request } as any;
        setProvider(new BrowserProvider(eip1193));
    }, [walletClient]);

    return provider;
}

export function useEthersSigner() {
    const provider = useEthersProvider();
    const [ready, setReady] = useState(false);
    useEffect(() => { setReady(!!provider); }, [provider]);
    return {
        getSigner: async () => {
            if (!provider) throw new Error('No provider');
            return await provider.getSigner(); // ethers v6
        },
        ready,
    };
}

/** 工具函数 */
export const weiToToken = (wei: bigint, decimals = 18) => formatUnits(wei, decimals);
export const toWei = (val: string, decimals = 18) => parseUnits(val, decimals);

/** 便捷合约实例化（ethers v6） */
export function makeContract<T extends object>(
    address: Address,
    abi: readonly string[],
    signerOrProvider: any
) {
    return new Contract(address, abi, signerOrProvider) as unknown as T;
}
