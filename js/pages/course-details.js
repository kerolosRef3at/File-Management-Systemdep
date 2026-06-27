// js/pages/course-details.js
import { renderLayout } from '../shared/layout.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. رسم القائمة الجانبية وتثبيت زر الكورسات منور
    renderLayout('courses');

    const contentArea = document.getElementById('page-content');

    // 2. محاكاة قاعدة بيانات المحتوى لكل كورس
    const coursesData = {
        "1": {
            title: "Advanced Software Architecture & Design Patterns",
            dept: "IT",
            modules: [
                {
                    name: "Module 1: Creational & Structural Patterns",
                    lessons: [
                        { id: "l1", title: "1. Introduction to Architectural Styles", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" },
                        { id: "l2", title: "2. Singleton & Factory Pattern Deep Dive", file: "https://www.w3schools.com/html/movie.mp4", type: "video" },
                        { id: "l3", title: "3. Adapter and Proxy Structural Implementation", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" }
                    ]
                },
                {
                    name: "Module 2: Behavioral Patterns & SOLID",
                    lessons: [
                        { id: "l4", title: "4. Observer Pattern & Event-Driven Architecture", file: "https://www.w3schools.com/html/movie.mp4", type: "video" },
                        { id: "l5", title: "5. Interface Segregation & Dependency Inversion", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" }
                    ]
                }
            ]
        }
    };

    // الحصول على الـ ID من الرابط (الافتراضي كورس رقم 1 لو مفيش بارامتر)
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id') || "1";
    const currentCourse = coursesData[courseId] || coursesData["1"];

    // 3. بناء الهيكل الخارجي للصفحة (شاشة العرض المزدوجة)
    contentArea.innerHTML = `
        <div style="margin-bottom: 25px;">
            <a href="courses.html" style="color:var(--text-gray); font-size:0.9rem; display:flex; align-items:center; gap:5px; margin-bottom:10px; text-decoration:none;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to Catalog
            </a>
            <h1 style="color: var(--primary-dark); font-size: 1.8rem; line-height: 1.2;">${currentCourse.title}</h1>
        </div>

        <div class="viewer-layout">
            <div>
                <div class="video-player-container">
                    <video class="main-video" id="videoPlayer" controls autoplay controlsList="nodownload">
                        <source src="${currentCourse.modules[0].lessons[0].file}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="video-description-box">
                        <h2 id="currentVideoTitle">${currentCourse.modules[0].lessons[0].title}</h2>
                        <p style="color: var(--text-gray); font-size: 0.95rem; margin-bottom: 20px;">Faculty of Engineering & IT — Standardized Core Resource Center.</p>
                        <button class="btn-outline" style="display:inline-flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                            Download Attachments (PDF / Code)
                        </button>
                    </div>
                </div>
            </div>

            <div class="playlist-sidebar" id="playlistSidebar"></div>
        </div>
    `;

    // 4. توليد قائمة التشغيل ديناميكياً بالوحدات والدروس
    const sidebar = document.getElementById('playlistSidebar');
    const player = document.getElementById('videoPlayer');
    const playerTitle = document.getElementById('currentVideoTitle');

    currentCourse.modules.forEach((mod, modIndex) => {
        // إنشاء صندوق الوحدة
        const modWrapper = document.createElement('div');
        modWrapper.innerHTML = `
            <div class="playlist-module-header">
                <span>${mod.name}</span>
                <span style="font-size:0.75rem; color:var(--text-gray); font-weight:normal;">${mod.lessons.length} parts</span>
            </div>
            <ul class="playlist-lessons-list" id="mod-list-${modIndex}"></ul>
        `;
        sidebar.appendChild(modWrapper);

        // حقن الدروس داخل الوحدة
        const listContainer = document.getElementById(`mod-list-${modIndex}`);
        mod.lessons.forEach((lesson, lesIndex) => {
            const li = document.createElement('li');
            // أول درس في أول وحدة يأخذ كلاس نشط تلقائياً
            li.className = `playlist-lesson-item ${modIndex === 0 && lesIndex === 0 ? 'active-lesson' : ''}`;
            li.dataset.file = lesson.file;
            li.dataset.title = lesson.title;
            li.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>${lesson.title}</span>
            `;
            listContainer.appendChild(li);
        });
    });

    // 5. تفعيل الضغط والتبديل بين الفيديوهات (Interactivity)
    document.querySelectorAll('.playlist-lesson-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const clickedItem = e.currentTarget;

            // ضبط الألوان والـ Highlight
            document.querySelectorAll('.playlist-lesson-item').forEach(li => li.classList.remove('active-lesson'));
            clickedItem.classList.add('active-lesson');

            // تغيير مسار الفيديو في الـ Player وتحديث العنوان
            const videoSrc = clickedItem.dataset.file;
            const videoTitle = clickedItem.dataset.title;

            player.src = videoSrc;
            playerTitle.innerText = videoTitle;
            player.load();
            player.play();
        });
    });
});