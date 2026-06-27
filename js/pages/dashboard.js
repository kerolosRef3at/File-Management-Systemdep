// js/pages/dashboard.js
import { renderLayout } from '../shared/layout.js';

document.addEventListener('DOMContentLoaded', () => {
    // رسم الـ Layout وتحديد الصفحة النشطة كـ dashboard
    renderLayout('dashboard');

    const contentArea = document.getElementById('page-content');

    // حقن محتوى الـ Dashboard
    contentArea.innerHTML = `
        <div class="dashboard-header">
            <div>
                <h1>Analytics & Performance</h1>
                <p>Infrastructure metrics and usage statistics for AITU campus.</p>
            </div>
            <div>
                <button class="btn-outline" style="margin-right: 10px;">Last 30 days</button>
                <button class="btn-primary"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> Export Report</button>
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-card-header">
                    Total Files
                    <div class="metric-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
                </div>
                <div class="metric-value">14,208</div>
                <div class="metric-trend">&uarr; 12% vs last month</div>
            </div>

            <div class="metric-card">
                <div class="metric-card-header">
                    Storage Capacity
                    <div class="metric-icon" style="background:#fef2f2; color:#ef4444;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg></div>
                </div>
                <div class="metric-value">8.4 <span style="font-size:1.2rem; color:var(--text-gray);">TB</span></div>
                <div style="background:#e2e8f0; height:4px; border-radius:2px; margin-top:10px; width:100%;"><div style="background:var(--primary-dark); width:84%; height:100%; border-radius:2px;"></div></div>
            </div>

            <div class="metric-card">
                <div class="metric-card-header">
                    Pending Tasks
                    <div class="metric-icon" style="background:#fff7ed; color:#f97316;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
                </div>
                <div class="metric-value">42</div>
                <div class="metric-trend neutral">Requires admin review</div>
            </div>

            <div class="metric-card">
                <div class="metric-card-header">
                    Net Activity
                    <div class="metric-icon" style="background:#f0fdf4; color:#10b981;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
                </div>
                <div class="metric-value">128.5k</div>
                <div class="metric-trend">&uarr; 5.2% growth</div>
            </div>
        </div>

        <div class="dashboard-row">
            <div class="dashboard-panel">
                <div class="panel-header">
                    Download Velocity
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--text-gray)" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </div>
                <svg width="100%" height="220" viewBox="0 0 600 220" preserveAspectRatio="none">
                    <line x1="0" y1="180" x2="600" y2="180" stroke="#f1f5f9" stroke-width="1"/>
                    <line x1="0" y1="120" x2="600" y2="120" stroke="#f1f5f9" stroke-width="1"/>
                    <line x1="0" y1="60" x2="600" y2="60" stroke="#f1f5f9" stroke-width="1"/>
                    
                    <path d="M 0 160 C 50 140, 100 120, 150 130 C 200 140, 250 150, 300 70 C 350 -10, 400 100, 450 40 C 500 -20, 550 10, 600 30" fill="none" stroke="var(--primary-dark)" stroke-width="3"/>
                    
                    <path d="M 0 160 C 50 140, 100 120, 150 130 C 200 140, 250 150, 300 70 C 350 -10, 400 100, 450 40 C 500 -20, 550 10, 600 30 L 600 220 L 0 220 Z" fill="var(--primary-blue)" opacity="0.1"/>
                    
                    <circle cx="0" cy="160" r="4" fill="var(--white)" stroke="var(--primary-dark)" stroke-width="2"/>
                    <circle cx="150" cy="130" r="4" fill="var(--white)" stroke="var(--primary-dark)" stroke-width="2"/>
                    <circle cx="300" cy="70" r="4" fill="var(--white)" stroke="var(--primary-dark)" stroke-width="2"/>
                    <circle cx="450" cy="40" r="4" fill="var(--white)" stroke="var(--primary-dark)" stroke-width="2"/>
                    <circle cx="600" cy="30" r="4" fill="var(--white)" stroke="var(--primary-dark)" stroke-width="2"/>

                    <text x="0" y="210" fill="var(--text-gray)" font-size="12">Jan</text>
                    <text x="140" y="210" fill="var(--text-gray)" font-size="12">Feb</text>
                    <text x="290" y="210" fill="var(--text-gray)" font-size="12">Mar</text>
                    <text x="440" y="210" fill="var(--text-gray)" font-size="12">Apr</text>
                    <text x="580" y="210" fill="var(--text-gray)" font-size="12">May</text>
                </svg>
            </div>

            <div class="dashboard-panel">
                <div class="panel-header">Resource Mix</div>
                <div class="donut-chart-container">
                    <div class="donut-chart">
                        <div class="donut-inner"></div>
                    </div>
                </div>
                <div class="chart-legend">
                    <div class="legend-item"><div class="legend-color" style="background: var(--primary-dark);"></div> Documents (60%)</div>
                    <div class="legend-item"><div class="legend-color" style="background: #ef4444;"></div> Academic Media (25%)</div>
                    <div class="legend-item"><div class="legend-color" style="background: #3b82f6;"></div> Research Logs (15%)</div>
                </div>
            </div>
        </div>

        <div class="dashboard-row">
            <div class="dashboard-panel">
                <div class="panel-header">
                    High-Impact Documents
                    <a href="#" style="font-size:0.85rem; color:#ef4444; font-weight:700;">View All</a>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Source</th>
                            <th>Access Count</th>
                            <th>Weight</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="color:var(--primary-dark); font-weight:600;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2" style="vertical-align:middle; margin-right:5px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> 2024_Academic_Charter.pdf</td>
                            <td>Council Office</td>
                            <td style="font-weight:700;">1,245</td>
                            <td>2.4 MB</td>
                        </tr>
                        <tr>
                            <td style="color:var(--primary-dark); font-weight:600;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#3b82f6" stroke-width="2" style="vertical-align:middle; margin-right:5px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Q1_Enrollment_Stats.xlsx</td>
                            <td>Registrar</td>
                            <td style="font-weight:700;">892</td>
                            <td>4.1 MB</td>
                        </tr>
                        <tr>
                            <td style="color:var(--primary-dark); font-weight:600;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--primary-dark)" stroke-width="2" style="vertical-align:middle; margin-right:5px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Faculty_Handbook_V2.docx</td>
                            <td>HR Academic</td>
                            <td style="font-weight:700;">756</td>
                            <td>1.2 MB</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="dashboard-panel">
                <div class="panel-header">System Events</div>
                <ul class="event-list">
                    <li class="event-item">
                        <p><strong>Prof. Kamal</strong> uploaded <span style="color:var(--primary-dark); font-weight:600;">Course_Intro.pdf</span></p>
                        <span>10 minutes ago</span>
                    </li>
                    <li class="event-item critical">
                        <p><strong>Security Bot</strong> isolated <span style="color:#ef4444; font-weight:600;">suspicious_login.log</span></p>
                        <span>1 hour ago</span>
                    </li>
                    <li class="event-item neutral">
                        <p><strong>System</strong> finalized weekly backup</p>
                        <span>3 hours ago</span>
                    </li>
                </ul>
            </div>
        </div>
    `;

    // ==========================================
    // Onboarding Tour Logic (الجولة التعريفية المطور)
    // ==========================================
    
    function injectOnboardingTour() {
        const styleHTML = `
            <style>
                .onboarding-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(7, 34, 71, 0.85);
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(5px);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.4s ease;
                }
                .onboarding-overlay.active {
                    opacity: 1;
                    pointer-events: auto;
                }
                .onboarding-modal {
                    background: #ffffff;
                    width: 90%;
                    max-width: 500px;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
                    transform: translateY(30px) scale(0.95);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                }
                .onboarding-overlay.active .onboarding-modal {
                    transform: translateY(0) scale(1);
                }
                .onboarding-slides {
                    position: relative;
                    height: 320px;
                    overflow: hidden;
                    background: #f8fafc;
                }
                .tour-slide {
                    position: absolute;
                    inset: 0;
                    padding: 40px 30px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.4s ease;
                }
                .tour-slide.active {
                    opacity: 1;
                    transform: translateX(0);
                }
                .tour-slide.exit {
                    transform: translateX(-100%);
                }
                .tour-icon-wrapper {
                    width: 80px;
                    height: 80px;
                    background: #ffffff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
                    margin-bottom: 25px;
                    color: #2563eb;
                }
                .tour-slide h2 {
                    color: #072247;
                    font-size: 1.5rem;
                    margin-bottom: 15px;
                    font-weight: 800;
                }
                .tour-slide p {
                    color: #64748b;
                    font-size: 0.95rem;
                    line-height: 1.6;
                }
                .onboarding-footer {
                    padding: 20px 30px;
                    background: #ffffff;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid #e2e8f0;
                }
                .tour-dots {
                    display: flex;
                    gap: 8px;
                }
                .tour-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #cbd5e1;
                    transition: 0.3s;
                }
                .tour-dot.active {
                    background: #2563eb;
                    width: 24px;
                    border-radius: 4px;
                }
            </style>
        `;

        const tourHTML = styleHTML + `
            <div class="onboarding-overlay" id="onboardingOverlay">
                <div class="onboarding-modal">
                    <div class="onboarding-slides" id="tourSlides">
                        
                        <div class="tour-slide active">
                            <div class="tour-icon-wrapper" style="color: #072247;">
                                <img src="logos/aitu_logo.png" alt="AITU" width="50" onerror="this.style.display='none'">
                            </div>
                            <h2>Welcome to EduVault!</h2>
                            <p>Assiut International Technological University's central hub for managing files, courses, and administrative tasks.</p>
                        </div>

                        <div class="tour-slide">
                            <div class="tour-icon-wrapper">
                                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            </div>
                            <h2>Central Repository</h2>
                            <p>A secure file system to store and share academic resources across IT, ME, and EL departments seamlessly.</p>
                        </div>

                        <div class="tour-slide">
                            <div class="tour-icon-wrapper" style="color: #10b981;">
                                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/><circle cx="12" cy="12" r="10" stroke-width="1.5"/></svg>
                            </div>
                            <h2>AITU Learning</h2>
                            <p>Build dynamic curriculums, upload video modules, and track learning resources with our built-in Course Builder.</p>
                        </div>

                        <div class="tour-slide">
                            <div class="tour-icon-wrapper" style="color: #9333ea;">
                                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                            <h2>Role-Based Access</h2>
                            <p>Control who sees what. Manage users, monitor system logs, and ensure university data stays protected.</p>
                        </div>

                    </div>
                    
                    <div class="onboarding-footer">
                        <button class="btn-outline" id="tourSkipBtn" style="border:none; color:#64748b; padding:8px; background:none; cursor:pointer;">Skip</button>
                        <div class="tour-dots" id="tourDots">
                            <div class="tour-dot active"></div>
                            <div class="tour-dot"></div>
                            <div class="tour-dot"></div>
                            <div class="tour-dot"></div>
                        </div>
                        <button class="btn-primary" id="tourNextBtn" style="padding: 8px 25px;">Next</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', tourHTML);

        const overlay = document.getElementById('onboardingOverlay');
        const slides = document.querySelectorAll('.tour-slide');
        const dots = document.querySelectorAll('.tour-dot');
        const nextBtn = document.getElementById('tourNextBtn');
        const skipBtn = document.getElementById('tourSkipBtn');
        let currentSlide = 0;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.remove('active', 'exit');
                if (i === index) slide.classList.add('active');
                else if (i < index) slide.classList.add('exit');
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });

            if (index === slides.length - 1) {
                nextBtn.innerText = "Get Started";
                nextBtn.style.background = "#10b981";
                nextBtn.style.borderColor = "#10b981";
            } else {
                nextBtn.innerText = "Next";
                nextBtn.style.background = "#2563eb";
                nextBtn.style.borderColor = "#2563eb";
            }
        }

        nextBtn.addEventListener('click', () => {
            if (currentSlide < slides.length - 1) {
                currentSlide++;
                showSlide(currentSlide);
            } else {
                closeTour();
            }
        });

        skipBtn.addEventListener('click', closeTour);

        function closeTour() {
            overlay.classList.remove('active');
            localStorage.setItem('aituTourCompleted', 'true');
            setTimeout(() => overlay.remove(), 500);
        }

        setTimeout(() => {
            overlay.classList.add('active');
        }, 500);
    }

    if (!localStorage.getItem('aituTourCompleted')) {
        injectOnboardingTour();
    }
}); // <--- القفلة اللي كانت ناقصة اهي!