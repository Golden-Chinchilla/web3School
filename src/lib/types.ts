export type Address = `0x${string}`;

export type CourseMeta = {
    courseId: number;
    title: string;
    description: string;
    videoUrl: string;
    author: Address;
    price: string;          // wei in string
    tokenAddress: Address;  // ERC20
    createdAt: number;
    status: 'active' | 'inactive';
};
