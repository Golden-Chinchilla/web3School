import { useParams } from "react-router";
import { useState } from "react";

// 模拟课程数据（真实项目会从后端/数据库获取）
const courses: Record<string, {
    title: string;
    author: string;
    date: string;
    videoUrl: string;
}> = {
    "1": {
        title: "React 入门课程",
        author: "Alice",
        date: "2025-09-01",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
    },
    "2": {
        title: "区块链基础课程",
        author: "Bob",
        date: "2025-08-28",
        videoUrl: "https://www.w3schools.com/html/movie.mp4"
    },
    "3": {
        title: "Web3 DApp 实战课程",
        author: "Charlie",
        date: "2025-08-25",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
    }
};

export const CourseDetail = () => {
    const { id } = useParams(); // 从 URL 中获取课程 id
    const [completed, setCompleted] = useState(false);

    const course = id ? courses[id] : null;

    if (!course) {
        return <h1 className="p-6 text-red-500">课程不存在</h1>;
    }

    const handleVideoEnded = () => {
        setCompleted(true);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
            <p className="text-gray-600">作者：{course.author}</p>
            <p className="text-gray-500 text-sm mb-4">发布时间：{course.date}</p>

            {/* 视频播放器 */}
            <video
                className="w-full rounded-lg border"
                controls
                onEnded={handleVideoEnded}
            >
                <source src={course.videoUrl} type="video/mp4" />
                您的浏览器不支持视频播放。
            </video>

            {/* 完成提示 */}
            {completed && (
                <p className="mt-4 text-green-600 font-semibold">
                    ✅ 恭喜你已完成课程学习！
                </p>
            )}
        </div>
    );
}




