import { Routes, Route, Navigate } from "react-router";
import { HeaderLayout } from "../layouts/HeaderLayout";
import { CourseDetail } from "../pages/CourseDetail";
import { BuyCourse } from "../pages/BuyCourse";
import { Profile } from "../pages/Profile";

export function IndexRoutes() {
    return (
        <Routes>
            {/* 父路由：公共 Layout */}
            <Route element={<HeaderLayout />}>
                <Route index element={<Navigate to="/me" replace />} />
                {/* 子路由：3 个页面 */}
                <Route path="/course/:id" element={<CourseDetail />} />
                <Route path="/buy/:id" element={<BuyCourse />} />
                <Route path="/me" element={<Profile />} />
                <Route path="*" element={'页面不存在'} />
            </Route>
        </Routes>
    );
}
