import type { Eip1193Provider } from "ethers"; // ethers v6 自带的类型

declare global {
    interface Window {
        ethereum?: Eip1193Provider;
    }
}
