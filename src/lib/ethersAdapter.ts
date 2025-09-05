// src/lib/ethersAdapter.ts
import { useEffect, useMemo, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import {
    BrowserProvider,
    Contract,
    type Eip1193Provider,
    JsonRpcSigner,
    type Provider,
} from "ethers";
import { CONTRACTS } from "./contracts";

export function useEthers() {
    const { address, chainId, status } = useAccount();
    const { data: walletClient } = useWalletClient();

    const provider = useMemo<BrowserProvider | undefined>(() => {
        if (!walletClient) return undefined;

        // 用 WalletClient 包一层 EIP-1193 provider（避免直接引用 window.ethereum）
        const eip1193: Eip1193Provider = {
            // @ts-expect-error - viem 类型与 EIP-1193 接口略有差异，但 request 兼容
            request: (args) => walletClient.request(args as any),
            // 事件可选（ethers 不强制需要）
            on: () => { },
            removeListener: () => { },
        } as unknown as Eip1193Provider;

        return new BrowserProvider(eip1193);
    }, [walletClient]);

    const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);
    useEffect(() => {
        let mounted = true;
        (async () => {
            if (provider && address) {
                try {
                    const s = await provider.getSigner();
                    if (mounted) setSigner(s);
                } catch {
                    if (mounted) setSigner(undefined);
                }
            } else {
                setSigner(undefined);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [provider, address]);

    const ready = status === "connected" && !!address && !!provider;

    return { address, chainId, provider, signer, ready };
}

// ===== 合约实例（ethers） =====
export function getContracts(readOrWrite: Provider | JsonRpcSigner) {
    const token = new Contract(
        CONTRACTS.PHANTOM_TOKEN.address,
        CONTRACTS.PHANTOM_TOKEN.abi,
        readOrWrite
    );
    const registry = new Contract(
        CONTRACTS.CourseRegistry.address,
        CONTRACTS.CourseRegistry.abi,
        readOrWrite
    );
    const pass1155 = new Contract(
        CONTRACTS.CoursePass1155.address,
        CONTRACTS.CoursePass1155.abi,
        readOrWrite
    );
    return { token, registry, pass1155 };
}
