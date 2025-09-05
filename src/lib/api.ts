// src/lib/api.ts
export type CourseMeta = {
    id: number;                    // 课程 ID（与 ERC1155 tokenId 对应）
    title: string;
    description: string;
    videoUrl: string;              // 后端会做代理保护
    price: string;                 // token 最小单位字符串（如 18 位）
    creator: `0x${string}`;
};

export async function fetchCourses(): Promise<CourseMeta[]> {
    const r = await fetch("/api/courses", { credentials: "include" });
    if (!r.ok) throw new Error("加载课程失败");
    return r.json();
}

export async function fetchCourse(id: number): Promise<CourseMeta> {
    const r = await fetch(`/api/courses/${id}`, { credentials: "include" });
    if (!r.ok) throw new Error("加载课程详情失败");
    return r.json();
}

/** 
 * 建议后端接受 txHash 并自行从链上解析出 courseId（避免前端解 event）。
 * 若你的后端是另一套参数，也可在这里改一处即可。
 */
export async function createCourseIndex(payload: {
    txHash: string;
    title: string;
    description: string;
    videoUrl: string;
    price: string; // 最小单位
}) {
    const r = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ id: number }>;
}

export async function issuePlayToken(payload: {
    address: `0x${string}`;
    courseId: number;
    message: string;
    signature: string;
}) {
    const r = await fetch("/api/auth/issue-play-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ token: string; expiresIn: number }>;
}

export function playProxyUrl(courseId: number, token: string) {
    const u = new URL("/api/play", location.origin);
    u.searchParams.set("courseId", String(courseId));
    u.searchParams.set("token", token);
    return u.toString();
}
