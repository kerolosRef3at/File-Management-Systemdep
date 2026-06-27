// js/shared/i18n.js

export const translations = {
    en: {
        dashboard: "Dashboard",
        repository: "Repository",
        courses: "Courses",
        users: "Users",
        logs: "Audit Logs",
        profile: "Profile",
        searchPlaceholder: "Search files, departments...",
        uploadBtn: "Upload File"
    },
    ar: {
        dashboard: "لوحة التحكم",
        repository: "مستودع الملفات",
        courses: "المناهج والكورسات",
        users: "إدارة المستخدمين",
        logs: "سجلات النظام",
        profile: "الملف الشخصي",
        searchPlaceholder: "ابحث عن الملفات، الأقسام...",
        uploadBtn: "رفع ملف جديد"
    }
};

// دالة جلب اللغة الحالية للمتصفح
export function getCurrentLang() {
    return localStorage.getItem('aitu_lang') || 'en';
}