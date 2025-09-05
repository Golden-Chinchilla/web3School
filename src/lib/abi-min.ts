// 精简 ABI，避免引入庞大文件（读写所需即可）
export const ERC20_MIN_ABI = [
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 value) returns (bool)',
] as const;

export const ERC1155_MIN_ABI = [
    'function balanceOf(address account, uint256 id) view returns (uint256)',
    'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
] as const;
