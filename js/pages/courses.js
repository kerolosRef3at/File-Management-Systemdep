// js/pages/courses.js
import { renderLayout } from '../shared/layout.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. رسم القائمة الجانبية (active page = courses)
    renderLayout('courses');

    const contentArea = document.getElementById('page-content');

    // 2. الداتا الوهمية للكورسات (لعدم وجود API حالياً)
    const mockCourses = [
        { id: 1, title: "Advanced Software Architecture & Design Patterns", dept: "IT", img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=500", lessons: 24, size: "1.2 GB" },
        { id: 2, title: "Fluid Dynamics and Thermodynamics Laboratory", dept: "ME", img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=500", lessons: 18, size: "850 MB" },
        { id: 3, title: "Digital Logic Design & Microprocessors", dept: "EL", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=500", lessons: 32, size: "2.4 GB" },
        { id: 4, title: "Introduction to Machine Learning & Neural Networks", dept: "IT", img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=500", lessons: 28, size: "3.1 GB" },
        { id: 5, title: "Robotics Systems Engineering & Automation", dept: "ME", img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=500", lessons: 42, size: "5.2 GB" }
    ];

    // 3. دالة تحديد لون الـ Badge حسب القسم
    function getDeptColor(dept) {
        if (dept === 'IT') return '#0284c7'; // Blue
        if (dept === 'ME') return '#ef4444'; // Red
        if (dept === 'EL') return '#d97706'; // Yellow/Orange
        return 'var(--primary-dark)';
    }

    // 4. بناء الهيكل الأساسي للواجهة
    contentArea.innerHTML = `
        <div class="courses-header">
            <div>
                <h1 style="color: var(--primary-dark); font-size: 2rem;">Course Repository</h1>
                <p style="color: var(--text-gray);">Explore and manage standardized academic curriculums for the Faculty of Engineering and Information Technology.</p>
            </div>
            <div class="dept-tabs" id="deptTabs">
                <button class="dept-tab active" data-dept="all">All Departments</button>
                <button class="dept-tab" data-dept="IT">IT</button>
                <button class="dept-tab" data-dept="ME">ME</button>
                <button class="dept-tab" data-dept="EL">EL</button>
            </div>
        </div>

        <div class="course-grid" id="courseGrid"></div>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid var(--border-color);">
            <p style="color: var(--text-gray); font-size: 0.85rem; margin-bottom: 15px;">Showing <span id="visibleCount">0</span> of 124 Courses</p>
            <button class="btn-outline">Load More Resources</button>
        </div>
    `;

    const courseGrid = document.getElementById('courseGrid');

    // 5. دالة رسم الكروت
    // 5. دالة رسم الكروت (بعد التعديل لربطها بصفحة التفاصيل)
    function renderCourses(courses) {
        courseGrid.innerHTML = ''; // تفريغ الشبكة

        // رسم كروت الكورسات
        courses.forEach(course => {
            // إنشاء الكارت كعنصر HTML
            const card = document.createElement('div');
            card.className = 'course-card';
            card.style.cursor = 'pointer';
            
            // ربط الكارت بصفحة التفاصيل وتمرير الـ ID
            card.addEventListener('click', () => { 
                window.location.href = `course-details.html?id=${course.id}`; 
            });

            // إضافة المحتوى الداخلي
            card.innerHTML = `
                <div class="course-thumbnail">
                    <span class="course-badge" style="background-color: ${getDeptColor(course.dept)};">${course.dept}</span>
                    <img src="${course.img}" alt="${course.title}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div class="course-info">
                    <h3>${course.title}</h3>
                    <div class="course-meta">
                        <span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> ${course.lessons} Lessons</span>
                        <span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg> ${course.size}</span>
                    </div>
                </div>
            `;

            courseGrid.appendChild(card);
        });

        // إضافة كارت (إنشاء كورس جديد) في النهاية
        const addCard = document.createElement('div');
        addCard.className = 'add-course-card';
        addCard.innerHTML = `
            <div class="add-course-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <h3>Upload New Course</h3>
            <p>Standardize curriculum by adding new course modules to the central repository.</p>
        `;
        
        // توجيه كارت الإنشاء لصفحة Builder
        addCard.addEventListener('click', () => {
            window.location.href = 'create-course.html';
        });
        
        courseGrid.appendChild(addCard);

        document.getElementById('visibleCount').innerText = courses.length;
    }

    // 6. تفعيل أزرار الفلترة
    const tabs = document.querySelectorAll('.dept-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // تظبيط الـ UI للأزرار
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');

            // فلترة الداتا
            const dept = e.target.getAttribute('data-dept');
            if (dept === 'all') {
                renderCourses(mockCourses);
            } else {
                const filtered = mockCourses.filter(c => c.dept === dept);
                renderCourses(filtered);
            }
        });
    });

    // رسم كل الكورسات عند بداية التحميل
    renderCourses(mockCourses);
});