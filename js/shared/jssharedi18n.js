// js/shared/i18n.js – Official Academic Bilingual Translation System (Arabic Egyptian Formal / English)
// Assiut International Technological University (AITU)

export const translations = {
    en: {
        // ===== Navbar =====
        nav_home: "Home",
        nav_programs: "Programs",
        nav_courses: "Courses",
        nav_repository: "Repository",
        nav_login: "Login",
        nav_join: "Join AITU",
        nav_brand_sub: "ACADEMIC REPOSITORY & FILE MANAGEMENT",
        lang_btn: "عربي",

        // ===== Index / Hero =====
        hero_title: "Academic Infrastructure Repository",
        hero_desc: "The official institutional file management system for Assiut International Technological University. A secure and organized platform to access resources for Information Technology, Electrical, and Mechanical Engineering departments.",
        hero_btn_browse: "Browse Programs",
        hero_btn_academy: "Join AITU Academy",

        // ===== Departments Section =====
        dept_section_title: "Academic Departments & Programs",
        dept_it_title: "Information Tech (IT)",
        dept_it_desc: "Code repositories, system documentation, and software/network development resources.",
        dept_el_title: "Electrical Eng (EL)",
        dept_el_desc: "Circuit diagrams, lab reports, and research on embedded systems and power.",
        dept_me_title: "Mechanical Eng (ME)",
        dept_me_desc: "3D CAD models, dynamic analysis, and materials and manufacturing specs.",
        dept_view_files: "VIEW FILES →",

        // ===== Trust Banner =====
        trust_badge: "Enterprise Security & Protection",
        trust_title: "Trusted Platform for Academic<br>Research",
        trust_desc: "AITU Drive ensures fast and secure access to thousands of academic documents, fostering collaboration across all technological departments.",
        trust_stat: "100%",
        trust_stat_label: "Secure Encryption",

        // ===== Sidebar =====
        sidebar_heading: "Academic Departments",
        sidebar_browse: "Browse files by department",
        sidebar_browse_files: "Browse files by category",
        sidebar_browse_courses: "Browse courses by category",

        // ===== Repository Controls =====
        repo_title: "Central Academic Repository",
        repo_subtitle: "The official AITU file management system for academic and administrative record keeping.",
        repo_add_category: "Add Department",
        repo_add_program: "Add Program",
        repo_upload: "Upload Resources",
        repo_filters: "Filters",
        repo_categories: "Departments",
        repo_files: "Files",
        repo_search_placeholder: "Search academic files & documents...",
        repo_filter_all: "All Files",
        repo_view_grid: "Grid View",
        repo_view_list: "List View",
        repo_selected_files: "Files Selected",
        repo_clear_selection: "Clear Selection",
        repo_download_selected: "Download Selected Bundle",
        repo_delete_selected: "Delete Selected",
        repo_modal_confirm_title: "Confirm Resource Download",
        repo_modal_desc: "You are about to download the following academic resources for offline educational use.",
        repo_modal_terms: "By proceeding, you agree to Assiut International Technological University Terms of Use and Intellectual Property regulations. Materials provided via AITU Academic Repository are for academic research and personal study only. Unauthorized commercial redistribution is strictly prohibited.",
        repo_modal_cancel: "Cancel",
        repo_modal_download_now: "Download Now",

        // ===== Courses =====
        courses_hero_title: "Explore Academic Programs & Courses",
        courses_hero_desc: "Discover professional and academic courses tailored for the next generation of technological leaders at AITU.",
        courses_search_placeholder: "Search courses by title, topic, or code...",
        courses_cta_title: "Unlock Your Potential",
        courses_cta_desc: "Access comprehensive course materials and resources designed by AITU's expert faculty.",
        courses_cta_browse: "Browse Programs",
        courses_cta_join: "Join AITU",
        courses_bulk_title: "Bulk Downloads",
        courses_bulk_desc: "Download entire semesters of technical resources in one click.",
        courses_bulk_btn: "Browse Packages",
        courses_filter_btn: "Filter & Sort",
        courses_no_results: "No courses found matching your search.",
        courses_page_title: "Academic Courses Repository",
        courses_page_subtitle: "Explore and manage accredited academic curricula across faculties.",
        courses_all_depts: "All Departments",
        courses_drafts: "Drafts",
        courses_upload_new: "Add New Course",
        courses_upload_sub: "Standardize curriculum by registering new course materials.",
        courses_showing: "Showing",
        courses_of: "of",
        courses_courses: "courses",
        courses_load_more: "Load More Resources",
        courses_lessons: "Lessons",
        courses_no_found: "No courses available in this section.",
        courses_public_title: "Academic Courses & Programs",
        courses_public_sub: "Explore standardized curriculum resources across all technological departments.",
        courses_dept_sidebar: "Academic Departments & Programs",

        // ===== Course Details =====
        cd_portal_label: "AITU ACADEMIC PORTAL",
        cd_download_confirm: "Confirm Course Download",
        cd_total_size: "TOTAL SIZE",
        cd_policy_title: "Usage Restriction Policy",
        cd_policy_desc: "Redistribution, public sharing, or commercial use of these materials is strictly prohibited under Assiut International Technological University Terms of Service and Intellectual Property regulations. Resources are for individual educational use only.",
        cd_cancel: "Cancel",
        cd_download_btn: "Download Course Archive",
        cd_loading: "Loading course details...",

        // ===== Footer =====
        footer_brand: "AITU Academic File Management System",
        footer_desc: "The unified digital repository for academic intelligence and resources.",
        footer_copy: "© 2026 Assiut International Technological University. All rights reserved.",

        // ===== Auth Pages =====
        sidebar_uni_name: "Assiut International Technological University",
        sidebar_uni_sub: "File Management System",
        auth_uni_name: "Assiut International Technological University - AITU",
        auth_system_name: "Academic File Management System",
        auth_pill: "Academic Repository",
        auth_main_title: "Academic File Management System",
        auth_main_desc: "Streamline workflows, track academic curricula, and collaborate seamlessly across all AITU faculties and departments.",
        auth_footer: "© 2026 Assiut International Technological University",

        // ===== Login =====
        login_welcome: "Welcome to AITU Portal",
        login_subtitle: "Sign in with your university account to continue.",
        login_username_label: "University Username or Email",
        login_username_placeholder: "Enter Your Username or Email",
        login_password_label: "Password",
        login_password_placeholder: "Enter Your Password",
        login_forgot: "Forgot Password?",
        login_submit: "Sign In",

        // ===== Forgot Password =====
        forgot_title: "Reset Password",
        forgot_desc: "Enter your registered university email address to receive a 6-digit OTP verification code.",
        forgot_email_label: "University Username or Email",
        forgot_email_placeholder: "Enter Your University Email",
        forgot_submit: "Send Verification Code",
        forgot_info: "We'll send a 6-digit verification code to your registered email.",
        forgot_back: "Back to Login",

        // ===== OTP =====
        otp_title: "Verify Your Email",
        otp_desc: "Enter the 6-digit verification code sent to your university email.",
        otp_submit: "Verify Code",
        otp_info: "The verification code is time-sensitive for security compliance.",

        // ===== Reset Password =====
        reset_title: "Create New Password",
        reset_desc: "Enter a secure new password for your university account adhering to institutional guidelines.",
        reset_new_label: "New Password",
        reset_new_placeholder: "Enter your new password",
        reset_confirm_label: "Confirm New Password",
        reset_confirm_placeholder: "Confirm your new password",
        reset_submit: "Save & Update Password",
        reset_req_length: "Min 8 characters",
        reset_req_upper: "1 Uppercase & 1 Lowercase",
        reset_req_number: "At least 1 number",
        reset_req_special: "1 Special character",

        // ===== Mobile Nav =====
        mobile_home: "Home",
        mobile_programs: "Programs",
        mobile_courses: "Courses",

        // ===== Loader =====
        loader_text: "Loading academic portal...",

        // ===== Sidebar / Layout =====
        sidebar_dashboard: "Dashboard",
        sidebar_repository: "Digital Repository",
        sidebar_courses: "Academic Courses",
        sidebar_users: "Users & Privileges",
        sidebar_logs: "Audit & System Logs",
        sidebar_profile: "My Profile",
        sidebar_logout: "Sign Out",
        sidebar_sub_dashboard: "Overview of tasks, metrics, and capacity",
        sidebar_sub_repository: "Academic programs and digital repository",
        sidebar_sub_courses: "Manage curricula, syllabi, and schedules",
        sidebar_sub_users: "Manage access, roles, and faculty privileges",
        sidebar_sub_logs: "Security audit trails and activity logs",
        sidebar_sub_profile: "Update personal profile and security preferences",
        sidebar_add_program: "Add Program",
        sidebar_add_course: "Add Course",
        sidebar_add_user: "Add User",

        // ===== Dashboard =====
        dash_morning: "Good morning",
        dash_afternoon: "Good afternoon",
        dash_evening: "Good evening",
        dash_overview: "Workspace Overview",
        dash_last7: "Last 7 days",
        dash_last30: "Last 30 days",
        dash_last6m: "Last 6 months",
        dash_lasty: "Last year",
        dash_total_files: "Total Academic Files",
        dash_total_courses: "Total Courses",
        dash_total_programs: "Total Programs",
        dash_qnap_storage: "Storage Capacity (QNAP)",
        dash_drive_not_connected: "Drive not connected",
        dash_storage: "Storage Capacity",
        dash_pending: "Pending Tasks",
        dash_activity: "Net Activity",
        dash_download_velocity: "Download Velocity Trends",
        dash_course_downloads_velocity: "Course Downloads",
        dash_program_downloads_velocity: "Program & Repository Downloads",
        dash_resource_mix: "Resource Mix by Department",
        dash_program_downloads: "Program Downloads",
        dash_high_impact: "High-Impact Documents",
        dash_recent_events: "Recent System Events",
        dash_last_7: "Last 7 Days",
        dash_last_30: "Last 30 Days",
        dash_last_90: "Last 90 Days",
        dash_export: "Export Report",
        dash_realtime: "Real-Time Monitoring Active",
        dash_no_data: "No data available",
        dash_files: "files",
        dash_downloads: "downloads",
        dash_view_all: "View All",
        dash_filename: "FILE NAME",
        dash_source: "DEPARTMENT / PROGRAM",
        dash_access_count: "ACCESS COUNT",
        dash_weight: "SIZE",
        dash_quick_actions: "Quick Launchpad",
        dash_action_upload: "Upload Resource",
        dash_action_upload_sub: "Add files & lecture notes",
        dash_action_course: "Create Course",
        dash_action_course_sub: "Register curriculum & syllabus",
        dash_action_repo: "Repository",
        dash_action_repo_sub: "Browse programs & folders",
        dash_action_logs: "System Logs",
        dash_action_logs_sub: "Review security audit trail",
        dash_refresh: "Refresh Data",

        // ===== Logs =====
        logs_title: "AITU System & Audit Logs",
        logs_subtitle: "events recorded — full administrator activity trail",
        logs_export_csv: "Export CSV",
        logs_all: "ALL",
        logs_login: "Login",
        logs_logout: "Logout",
        logs_add_file: "Add File",
        logs_delete_file: "Delete File",
        logs_create_folder: "Create Folder",
        logs_upload_video: "Upload Video",
        logs_add_user: "Add User",
        logs_delete_user: "Delete User",
        logs_change_pw: "Change Password",
        logs_update_profile: "Update Profile",
        logs_create_course: "Create Course",
        logs_update_course: "Update Course",
        logs_delete_course: "Delete Course",
        logs_search: "Search by admin, action, or target...",
        logs_from: "From Date",
        logs_to: "To Date",
        logs_col_admin: "Administrator",
        logs_col_role: "Role",
        logs_col_action: "Action",
        logs_col_target: "Target Resource",
        logs_col_datetime: "Date & Time",
        logs_no_match: "No logs match your current filters.",
        logs_range_today: "Today",
        logs_save_draft: "Save Draft",
        logs_download: "Download File",
        logs_download_course: "Download Course",
        logs_range_week: "Last 7 days",
        logs_range_all: "All time",
        logs_widen_hint: "Try a wider date range or clear filters.",
        logs_showing: "Showing",
        logs_of: "of",
        logs_stat_total: "Total Events",
        logs_stat_auth: "Authentication",
        logs_stat_files: "Files & Storage",
        logs_stat_admin: "Admin & Users",
        logs_cat_all: "All Activities",
        logs_cat_auth: "Authentication",
        logs_cat_files: "Files & Storage",
        logs_cat_courses: "Courses",
        logs_cat_users: "User Mgmt",
        logs_select_action: "Filter Action...",
        logs_all_actions_cat: "All Actions in Category",
        logs_refresh: "Refresh",
        logs_live_trail: "Live Trail",
        logs_details_title: "Log Event Details",
        logs_col_ip: "IP Address",
        logs_prev: "Previous",
        logs_next: "Next",
        logs_inspect: "Inspect",
        logs_close: "Close",

        // ===== Profile =====
        profile_title: "Profile & Account Settings",
        profile_subtitle: "Manage your AITU administrative credentials and security preferences.",
        profile_account_info: "Account Information",
        profile_username: "USERNAME",
        profile_email: "EMAIL ADDRESS",
        profile_phone: "PHONE NUMBER",
        profile_role: "ROLE",
        profile_since: "MEMBER SINCE",
        profile_update_info: "Update Information",
        profile_save: "Save Changes",
        profile_cancel: "Cancel",
        profile_security: "Security Settings",
        profile_change_pw: "Change Password",
        profile_current_pw: "Current Password",
        profile_new_pw: "New Password",
        profile_confirm_pw: "Confirm New Password",
        profile_update_pw: "Update Password",
        profile_change_photo: "Change Photo",
        profile_remove_photo: "Remove",
        profile_photo_help: "JPG, GIF or PNG. Max size: 4MB",
        profile_full_name: "Full Name",
        profile_full_name_ph: "e.g. Dr. Ahmed Mahmoud",
        profile_email_ph: "example@aitu.edu.eg",
        profile_new_pw_ph: "Enter new password",
        profile_confirm_pw_ph: "Confirm new password",

        // ===== Users =====
        users_title: "User Management & Privileges",
        users_subtitle: "total registered institutional users",
        users_add: "Add New User",
        users_all_roles: "All Roles",
        users_search: "Search users by name, email, or role...",
        users_stat_total: "TOTAL USERS",
        users_stat_supervisors: "SUPERVISORS",
        users_stat_managers: "DEPT. MANAGERS",
        users_stat_faculty: "FACULTY MEMBERS",
        users_col_user: "User",
        users_col_role: "Academic Role",
        users_col_dept: "Department",
        users_col_phone: "Phone",
        users_col_joined: "Date Joined",
        users_col_actions: "Actions",
        users_delete: "Delete",
        users_no_found: "No users found matching current criteria.",
        users_create_title: "Create Institutional User",
        users_username: "Username",
        users_email: "Email Address",
        users_phone: "Phone Number",
        users_dept: "Academic Department",
        users_assign_role: "Assign Role",
        users_create_btn: "Create User",
        users_cancel: "Cancel",
        users_select_dept: "Select Department...",
        users_select_role: "Select Role...",
        users_personal_info: "Personal Information",
        users_full_name: "Full Name",
        users_full_name_ph: "e.g. Dr. Ahmed Mahmoud",
        users_profile_pic: "Profile Picture",
        users_profile_pic_sub: "PNG or JPG up to 5MB",
        users_org_details: "Organizational Details",
        users_designation: "Academic Title / Designation",
        users_designation_ph: "e.g. Associate Professor / Senior Lecturer",
        users_security_settings: "Security Settings",
        users_expiry_date: "Account Expiry Date (Optional)",
        users_force_pw: "Require password change upon first login",
        users_access_permissions: "Permissions & Privileges",
        users_access_sub: "Define system access level. Permissions are cumulative based on assigned role.",
        users_role_faculty: "Faculty Member",
        users_role_faculty_desc: "Standard access to upload learning materials and browse faculty resources.",
        users_role_dept_mgr: "Department Manager",
        users_role_dept_mgr_desc: "Full administrative control over department repository and course offerings.",
        users_select_dept_first: "Select a department first",
        users_role_supervisor: "System Supervisor",
        users_role_supervisor_desc: "Universal administrative access across all faculties, user management, and system logs.",
        users_system_note: "System Notice",
        users_system_note_sub: "The user will automatically receive their login credentials via registered university email.",

        // ===== Create Course =====
        cc_title: "Create Academic Course",
        cc_preview: "Preview Mode",
        cc_header_title: "Add New Academic Course",
        cc_header_subtitle: "Structure curriculum, upload lecture materials and videos, and configure access permissions.",
        cc_btn_cancel: "Cancel",
        cc_btn_save_draft: "Save Draft",
        cc_btn_publish: "Publish Course",
        cc_course_title_label: "Course Title",
        cc_course_title_ph: "e.g. Applied Mechanics & Thermodynamics",
        cc_dept_label: "Academic Department",
        cc_dept_select: "Select Department...",
        cc_program_label: "Program / Academic Level",
        cc_program_select: "Select Level...",
        cc_desc_label: "Course Description & Objectives",
        cc_desc_ph: "Provide course summary, prerequisites, and learning outcomes...",
        cc_thumb_label: "Course Thumbnail",
        cc_thumb_drop: "Click to upload course image (PNG, JPG)",
        cc_thumb_change: "Click to replace image",
        cc_visibility_label: "Access Visibility",
        cc_vis_public: "Public (All Users)",
        cc_vis_students: "Enrolled Students Only",
        cc_vis_admin: "Instructors & Supervisors Only",
        cc_allow_guest_downloads: "Allow Guest Resource Downloads",
        cc_mode_title: "Content Upload Mode",
        cc_mode_bulk_title: "Bulk Upload Archive",
        cc_mode_bulk_desc: "Upload multiple lecture files and arrange them with drag and drop",
        cc_mode_lesson_title: "Structured Modular Lessons",
        cc_mode_lesson_desc: "Organize course content into sequential lessons with documents and videos",
        cc_bulk_drop_title: "Drag and drop course files here or click to browse",
        cc_bulk_drop_sub: "Supports: Videos, PDF, Word (DOCX/DOC), Text (TXT), and all Compressed Archives (ZIP, RAR, 7Z, TAR, GZ). Max 2GB per file.",
        cc_lesson_ph: "Enter lesson title...",
        cc_lesson_add_files: "Add files to this lesson",
        cc_lesson_title_def: "Lesson",
        cc_pkg_lessons: "Lessons",
        cc_pkg_total: "Total Size",
        cc_pkg_modules: "Modules",
        cc_course_title: "Course Title",
        cc_department: "Department",
        cc_description: "Description",
        cc_modules: "Course Modules",
        cc_add_module: "Add Module",
        cc_add_lesson: "Add Lesson",
        cc_module_title: "Module Title",
        cc_lesson_title: "Lesson Title",
        cc_course_image: "Course Cover",
        cc_upload_image: "Upload Image",
        cc_save: "Save Course",
        cc_cancel: "Cancel",
        cc_select_dept: "Select Department...",
        cc_placeholder_title: "Enter course title...",
        cc_placeholder_desc: "Enter course description...",

        // ===== Upload Resources =====
        upload_title: "Upload Academic Resources",
        upload_subtitle: "Configure and upload lecture videos and academic materials to the central repository.",
        upload_discard: "Discard Draft",
        upload_start: "Start Upload",
        upload_uploading: "Uploading resources...",
        upload_target_dept: "Target Department",
        upload_target_prog: "Target Program",
        upload_select_dept: "Select Department...",
        upload_select_prog: "Select Program...",
        upload_drag_drop: "Drag & Drop Academic Files",
        upload_drag_desc: "Supports: PDF, Word (DOCX/DOC), Text (TXT), Videos, and all Compressed Archives (ZIP, RAR, 7Z, TAR, GZ). Maximum 2GB per file.",
        upload_select_files: "Browse Local Files",
        upload_dest_required: "Target Destination Required",
        upload_dest_desc: "Please specify target department and program above before uploading.",
        upload_queue: "Upload Queue",
        upload_clear_all: "Clear All",
        upload_no_files: "Queue is empty. Drag files here or click browse.",
        upload_best_title: "AITU Institutional Guidelines",
        upload_best_desc: "Ensure lecture materials follow university intellectual property and file naming conventions.",
        upload_lesson_title: "Lesson / Lecture Title",
        upload_resource_title: "Resource Title",
        upload_failed: "Upload failed: network interruption",
        upload_waiting: "Awaiting upload...",
        upload_complete: "All files uploaded successfully!",
        upload_assets: "Processing course assets...",
        upload_processed: "Processed Files",
        upload_remaining: "Remaining",
        upload_success: "{count} resource(s) successfully cataloged in the repository!",
        upload_confirm_discard: "Are you sure you want to discard the pending uploads?",
        upload_enter_title: "Enter resource title...",
        upload_alert_dest: "Please select target department and program before proceeding.",
        upload_alert_dest2: "Target department and program must be specified.",
        upload_alert_title: "Ensure every file has a title, department, and program selected before saving.",

        // ===== 403 =====
        err_403_title: "403 Forbidden Access",
        err_403_desc: "You do not possess adequate institutional credentials to access this section.",
        err_403_back: "Return to Safe Page",

        // ===== Common =====
        common_confirm: "Confirm",
        common_cancel: "Cancel",
        common_save: "Save",
        common_delete: "Delete",
        common_edit: "Edit",
        common_close: "Close",
        common_search: "Search",
        common_done: "Done",
        common_retry: "Retry"
    },

    ar: {
        // ===== Navbar (عربي مصري رسمي أكاديمي لجامعة تكنولوجية) =====
        nav_home: "الرئيسية",
        nav_programs: "البرامج الأكاديمية",
        nav_courses: "المقررات الدراسية",
        nav_repository: "المستودع الرقمي",
        nav_login: "تسجيل الدخول",
        nav_join: "بوابة الجامعة",
        nav_brand_sub: "نظام إدارة المستودع الرقمي والملفات الأكاديمية",
        lang_btn: "English",

        // ===== Index / Hero =====
        hero_title: "المستودع الرقمي المركزي للموارد والملفات الأكاديمية",
        hero_desc: "المنظومة المؤسسية المعتمدة لجامعة أسيوط التكنولوجية الدولية لحفظ وإدارة وتداول الموارد العلمية والمقررات الدراسية لأقسام تكنولوجيا المعلومات، وتكنولوجيا الأجهزة الكهربائية والإلكترونية، وتكنولوجيا الميكاترونكس.",
        hero_btn_browse: "استعراض البرامج الأكاديمية",
        hero_btn_academy: "بوابة الجامعة التكنولوجية",

        // ===== Departments Section =====
        dept_section_title: "الأقسام العلمية والبرامج الأكاديمية المعتمدة",
        dept_it_title: "تكنولوجيا المعلومات (IT)",
        dept_it_desc: "مستودعات البرمجيات، النظم وقواعد البيانات، ومناهج الحوسبة السحابية وأمن وشبكات المعلومات.",
        dept_el_title: "تكنولوجيا الأجهزة الكهربائية والإلكترونية (EL)",
        dept_el_desc: "مخططات الدوائر الإلكترونية، تقارير المعامل التطبيقية، وأبحاث النظم المدمجة وإلكترونيات القوى.",
        dept_me_title: "تكنولوجيا الميكاترونكس والسيارات (ME)",
        dept_me_desc: "نماذج التصميم بمساعدة الحاسوب CAD، التحليل الديناميكي، ومواصفات التصنيع الميكانيكي المتقدم.",
        dept_view_files: "استعراض الملفات والمقررات ←",

        // ===== Trust Banner =====
        trust_badge: "تشفير وحماية مؤسسية معتمدة",
        trust_title: "منصة موثوقة ومعتمدة<br>للتعليم التكنولوجي والبحث الأكاديمي",
        trust_desc: "تتيح المنظومة لأعضاء هيئة التدريس والطلاب وصولاً آمناً وفورياً لآلاف الوثائق والمقررات والمراجع المعتمدة، مع تطبيق أعلى معايير الخصوصية والأمان الأكاديمي.",
        trust_stat: "١٠٠٪",
        trust_stat_label: "تشفير وأمان معتمد",

        // ===== Sidebar =====
        sidebar_heading: "الأقسام العلمية",
        sidebar_browse: "استعراض حسب القسم العلمي",
        sidebar_browse_files: "استعراض الملفات حسب القسم العلمي",
        sidebar_browse_courses: "استعراض المقررات الدراسية حسب القسم العلمي",

        // ===== Repository Controls =====
        repo_title: "المستودع الرقمي المركزي",
        repo_subtitle: "المنظومة الرقمية المعتمدة لجامعة أسيوط التكنولوجية الدولية لإدارة وتوثيق المقررات والملفات الأكاديمية.",
        repo_add_category: "إضافة قسم علمي",
        repo_add_program: "إضافة برنامج دراسي",
        repo_upload: "رفع موارد تعليمية",
        repo_filters: "تصفية النتائج",
        repo_categories: "الأقسام العلمية",
        repo_files: "الملفات والمراجع",
        repo_search_placeholder: "البحث في المستودع الأكاديمي باسم الملف أو الكود...",
        repo_filter_all: "كافة الملفات",
        repo_view_grid: "عرض شبكي",
        repo_view_list: "عرض قائمة",
        repo_selected_files: "ملفات تم تحديدها",
        repo_clear_selection: "إلغاء التحديد",
        repo_download_selected: "تحميل الملفات المحددة",
        repo_delete_selected: "حذف الملفات المحددة",
        repo_modal_confirm_title: "تأكيد تحميل الموارد الأكاديمية",
        repo_modal_desc: "أنت على وشك تنزيل الموارد والوثائق المحددة للاستخدام التعليمي والأكاديمي.",
        repo_modal_terms: "بمتابعة التحميل، فإنك تقر بالالتزام بلوائح جامعة أسيوط التكنولوجية الدولية وسياسة حقوق الملكية الفكرية. الموارد التعليمية مخصصة للبحث الأكاديمي والدراسة الشخصية، ويُمنع منعاً باتاً أي نشر تجاري أو توزيع غير مصرح به.",
        repo_modal_cancel: "إلغاء",
        repo_modal_download_now: "بدء التنزيل الآن",

        // ===== Courses =====
        courses_hero_title: "المقررات والبرامج الدراسية الأكاديمية",
        courses_hero_desc: "استكشف المقررات والمناهج الأكاديمية المعتمدة والمصممة لتأهيل كوادر تكنولوجية بمعايير عالمية.",
        courses_search_placeholder: "ابحث باسم المقرر، الكود الدراسي، أو الموضوع الأكاديمي...",
        courses_cta_title: "بوابة التعليم التكنولوجي المتطور",
        courses_cta_desc: "وصول مباشر للمقررات والمحاضرات والمراجع المعتمدة من أعضاء هيئة التدريس بجامعة أسيوط التكنولوجية الدولية.",
        courses_cta_browse: "استعراض البرامج الأكاديمية",
        courses_cta_join: "الانضمام للجامعة",
        courses_bulk_title: "تحميل الحقائب والمقررات الكاملة",
        courses_bulk_desc: "إمكانية تحميل المحاضرات والمقررات الدراسية الكاملة للفصل الدراسي بضغطة واحدة.",
        courses_bulk_btn: "استعراض الحقائب والمقررات",
        courses_filter_btn: "تصفية وترتيب",
        courses_no_results: "لا توجد مقررات دراسية مطابقة للبحث.",
        courses_page_title: "مستودع المقررات الدراسية الأكاديمية",
        courses_page_subtitle: "إدارة واستعراض المناهج والمقررات المعتمدة لكافة الفرق والأقسام العلمية.",
        courses_all_depts: "كافة الأقسام العلمية",
        courses_drafts: "المسودات غير المنشورة",
        courses_upload_new: "إضافة مقرر دراسي جديد",
        courses_upload_sub: "توثيق المناهج الأكاديمية عبر تسجيل مقررات جديدة في المنظومة.",
        courses_showing: "عرض",
        courses_of: "من إجمالي",
        courses_courses: "مقررات دراسية",
        courses_load_more: "تحميل المزيد من المقررات",
        courses_lessons: "محاضرات ومراجع",
        courses_no_found: "لا توجد مقررات دراسية متاحة في هذا القسم حالياً.",
        courses_public_title: "المقررات الدراسية والبرامج الأكاديمية",
        courses_public_sub: "تصفح المناهج والموارد التعليمية المعتمدة في كافة التخصصات التكنولوجية.",
        courses_dept_sidebar: "الأقسام العلمية والبرامج",

        // ===== Course Details =====
        cd_portal_label: "بوابة جامعة أسيوط التكنولوجية الدولية",
        cd_download_confirm: "تأكيد تحميل الحقيبة التعليمية للمقرر",
        cd_total_size: "إجمالي سعة الملفات",
        cd_policy_title: "سياسة الاستخدام الأكاديمي وحقوق الملكية الفكرية",
        cd_policy_desc: "تخضع كافة المواد التعليمية للوائح الملكية الفكرية وشروط الاستخدام الخاصة بجامعة أسيوط التكنولوجية الدولية، وهي مخصصة حصراً للدراسة الشخصية والبحث العلمي للطلاب وأعضاء هيئة التدريس، ويُحظر تماماً النشر التجاري أو إعادة التوزيع العام.",
        cd_cancel: "إلغاء",
        cd_download_btn: "تحميل الحقيبة التعليمية كاملة",
        cd_loading: "جاري تحميل بيانات وتوصيف المقرر الدراسي...",

        // ===== Footer =====
        footer_brand: "جامعة أسيوط التكنولوجية الدولية - AITU",
        footer_desc: "المنظومة الرقمية المركزية لإدارة وتوثيق الملفات والمقررات الأكاديمية.",
        footer_copy: "© ٢٠٢٦ جامعة أسيوط التكنولوجية الدولية. جميع الحقوق محفوظة.",

        // ===== Auth Pages =====
        sidebar_uni_name: "جامعة أسيوط التكنولوجية الدولية",
        sidebar_uni_sub: "نظام إدارة الملفات والمستودع الرقمي",
        auth_uni_name: "جامعة أسيوط التكنولوجية الدولية - AITU",
        auth_system_name: "نظام إدارة المستودع الرقمي والملفات الأكاديمية",
        auth_pill: "المنظومة الأكاديمية",
        auth_main_title: "نظام إدارة المستودع والملفات الأكاديمية",
        auth_main_desc: "منظومة مركزية لإدارة سير العمل الأكاديمي، متابعة المقررات والمحاضرات، والتعاون الفعال بين الأقسام العلمية وأعضاء هيئة التدريس والطلاب.",
        auth_footer: "© ٢٠٢٦ جامعة أسيوط التكنولوجية الدولية",

        // ===== Login =====
        login_welcome: "مرحباً بكم في البوابة الأكاديمية",
        login_subtitle: "يرجى تسجيل الدخول بحسابك الجامعي المعتمد للمتابعة.",
        login_username_label: "اسم المستخدم أو البريد الإلكتروني الجامعي",
        login_username_placeholder: "أدخل البريد الجامعي أو اسم المستخدم",
        login_password_label: "كلمة المرور",
        login_password_placeholder: "أدخل كلمة المرور الخاصة بحسابك",
        login_forgot: "نسيت كلمة المرور؟",
        login_submit: "تسجيل الدخول",

        // ===== Forgot Password =====
        forgot_title: "استعادة كلمة المرور",
        forgot_desc: "أدخل بريدك الإلكتروني الجامعي المسجل في المنظومة لتلقي رمز التحقق المؤقت (OTP) لإعادة تعيين كلمة المرور.",
        forgot_email_label: "البريد الإلكتروني الجامعي أو اسم المستخدم",
        forgot_email_placeholder: "أدخل البريد الجامعي المسجل",
        forgot_submit: "إرسال رمز التحقق",
        forgot_info: "سيتم إرسال رمز تحقق مؤقت مكون من 6 أرقام إلى بريدك الإلكتروني المسجل.",
        forgot_back: "العودة لصفحة تسجيل الدخول",

        // ===== OTP =====
        otp_title: "التحقق من البريد الإلكتروني",
        otp_desc: "يرجى إدخال رمز التحقق المؤقت (OTP) المكون من 6 أرقام الذي تم إرساله إلى بريدك الجامعي.",
        otp_submit: "تأكيد التحقق والمتابعة",
        otp_info: "رمز التحقق صالح لفترة محدودة طبقاً لمعايير الأمان المعتمدة في الجامعة.",

        // ===== Reset Password =====
        reset_title: "تعيين كلمة مرور جديدة",
        reset_desc: "يرجى تعيين كلمة مرور قوية وجديدة لحسابك الأكاديمي مع التأكد من مطابقتها لضوابط الأمان.",
        reset_new_label: "كلمة المرور الجديدة",
        reset_new_placeholder: "أدخل كلمة المرور الجديدة",
        reset_confirm_label: "تأكيد كلمة المرور الجديدة",
        reset_confirm_placeholder: "أعد إدخال كلمة المرور للتأكيد",
        reset_submit: "حفظ وتحديث كلمة المرور",
        reset_req_length: "٨ أحرف كحد أدنى",
        reset_req_upper: "حرف كبير وحرف صغير بالإنجليزية",
        reset_req_number: "رقم واحد على الأقل",
        reset_req_special: "رمز خاص واحد على الأقل",

        // ===== Mobile Nav =====
        mobile_home: "الرئيسية",
        mobile_programs: "البرامج الأكاديمية",
        mobile_courses: "المقررات الدراسية",

        // ===== Loader =====
        loader_text: "جاري تحميل المنظومة الأكاديمية...",

        // ===== Sidebar / Layout =====
        sidebar_dashboard: "لوحة المؤشرات الأكاديمية",
        sidebar_repository: "المستودع الرقمي",
        sidebar_courses: "المقررات الدراسية",
        sidebar_users: "إدارة المستخدمين والصلاحيات",
        sidebar_logs: "سجل العمليات والأنشطة الأكاديمية",
        sidebar_profile: "الملف الأكاديمي والحساب",
        sidebar_logout: "تسجيل الخروج",
        sidebar_sub_dashboard: "مؤشرات الأداء الأكاديمي ومعدلات النشاط وسعة التخزين",
        sidebar_sub_repository: "البرامج الأكاديمية والوثائق والمستودع الرقمي",
        sidebar_sub_courses: "إدارة المقررات الدراسية والمناهج والمحاضرات",
        sidebar_sub_users: "إدارة صلاحيات الوصول وأعضاء هيئة التدريس والمسؤولين",
        sidebar_sub_logs: "مسارات التدقيق وسجلات الأنشطة الأكاديمية والأمان",
        sidebar_sub_profile: "تحديث بيانات الحساب الأكاديمي وإعدادات الأمان",
        sidebar_add_program: "إضافة برنامج أكاديمي",
        sidebar_add_course: "إضافة مقرر دراسي",
        sidebar_add_user: "إضافة مستخدم جديد",

        // ===== Dashboard =====
        dash_morning: "صباح الخير",
        dash_afternoon: "مساء الخير",
        dash_evening: "مساء الخير",
        dash_overview: "إليك نظرة عامة على مؤشرات الأداء الأكاديمي وسير العمل",
        dash_last7: "آخر 7 أيام",
        dash_last30: "آخر 30 يوماً",
        dash_last6m: "آخر 6 أشهر",
        dash_lasty: "العام الأكاديمي المنصرم",
        dash_total_files: "إجمالي الملفات الأكاديمية",
        dash_total_courses: "إجمالي المقررات الدراسية",
        dash_total_programs: "إجمالي البرامج الأكاديمية",
        dash_qnap_storage: "سعة التخزين السحابي (QNAP)",
        dash_drive_not_connected: "القرص غير متصل",
        dash_storage: "سعة التخزين",
        dash_pending: "المهام المعلقة",
        dash_activity: "صافي النشاط الأكاديمي",
        dash_download_velocity: "معدلات التحميل والوصول الأكاديمي",
        dash_course_downloads_velocity: "تحميلات المقررات الدراسية",
        dash_program_downloads_velocity: "تحميلات البرامج والمستودع",
        dash_resource_mix: "توزيع الموارد العلمية حسب القسم العلمي",
        dash_program_downloads: "نشاط تحميل البرامج الأكاديمية",
        dash_high_impact: "الوثائق والمراجع الأكثر استخداماً",
        dash_recent_events: "أحدث العمليات وسجلات النظام",
        dash_last_7: "آخر 7 أيام",
        dash_last_30: "آخر 30 يوماً",
        dash_last_90: "آخر 90 يوماً",
        dash_export: "تصدير التقرير الأكاديمي",
        dash_realtime: "المراقبة الفورية والمباشرة نشطة",
        dash_no_data: "لا تتوفر بيانات للعرض حالياً",
        dash_files: "ملفات",
        dash_downloads: "تحميلات",
        dash_view_all: "عرض كافة الملفات",
        dash_filename: "اسم الملف الأكاديمي",
        dash_source: "القسم العلمي / البرنامج الدراسي",
        dash_access_count: "مرات الوصول",
        dash_weight: "حجم الملف",
        dash_quick_actions: "الإجراءات الأكاديمية السريعة",
        dash_action_upload: "رفع موارد تعليمية",
        dash_action_upload_sub: "إضافة ملفات ومحاضرات للمستودع",
        dash_action_course: "إضافة مقرر دراسي",
        dash_action_course_sub: "تسجيل المنهج وتعيين أستاذ المقرر",
        dash_action_repo: "المستودع الرقمي",
        dash_action_repo_sub: "تصفح الأقسام والمجلدات والبرامج",
        dash_action_logs: "سجل العمليات",
        dash_action_logs_sub: "متابعة وتدقيق نشاط مسؤولي النظام",
        dash_refresh: "تحديث المؤشرات",

        // ===== Logs =====
        logs_title: "سجل العمليات والأنشطة الأكاديمية",
        logs_subtitle: "مسار تدقيق موثق لكافة أنشطة مسؤولي النظام وأعضاء هيئة التدريس",
        logs_export_csv: "تصدير السجل كـ CSV",
        logs_all: "كافة الأنشطة",
        logs_login: "تسجيل دخول",
        logs_logout: "تسجيل خروج",
        logs_add_file: "إضافة ملف",
        logs_delete_file: "حذف ملف",
        logs_create_folder: "إنشاء مجلد",
        logs_upload_video: "رفع محاضرة فيديو",
        logs_add_user: "إضافة مستخدم",
        logs_delete_user: "حذف مستخدم",
        logs_change_pw: "تغيير كلمة المرور",
        logs_update_profile: "تحديث الملف الشخصي",
        logs_create_course: "إضافة مقرر دراسي",
        logs_update_course: "تعديل مقرر دراسي",
        logs_delete_course: "حذف مقرر دراسي",
        logs_search: "ابحث باسم المسؤول، نوع الإجراء، أو المورد المستهدف...",
        logs_from: "من تاريخ",
        logs_to: "إلى تاريخ",
        logs_col_admin: "المسؤول / عضو هيئة التدريس",
        logs_col_role: "الدور الأكاديمي",
        logs_col_action: "نوع الإجراء",
        logs_col_target: "المورد المستهدف",
        logs_col_datetime: "التاريخ والوقت",
        logs_no_match: "لا توجد سجلات مطابقة لمعايير البحث الحالية.",
        logs_range_today: "اليوم",
        logs_save_draft: "حفظ مسودة",
        logs_download: "تحميل ملف",
        logs_download_course: "تحميل مقرر دراسي",
        logs_range_week: "آخر 7 أيام",
        logs_range_all: "كافة الفترات",
        logs_widen_hint: "يرجى تجربة نطاق زمني أوسع أو مسح الفلاتر.",
        logs_showing: "عرض",
        logs_of: "من إجمالي",
        logs_stat_total: "إجمالي السجلات المسجلة",
        logs_stat_auth: "جلسات المصادقة والدخول",
        logs_stat_files: "نشاط المستودع والملفات",
        logs_stat_admin: "إدارة المستخدمين والأمان",
        logs_cat_all: "كافة الأنشطة الأكاديمية",
        logs_cat_auth: "تسجيل الدخول والمصادقة",
        logs_cat_files: "الملفات والتخزين الرقمي",
        logs_cat_courses: "المقررات الدراسية",
        logs_cat_users: "إدارة المستخدمين والأذونات",
        logs_select_action: "تصفية حسب نوع الإجراء...",
        logs_all_actions_cat: "كافة إجراءات الفئة",
        logs_refresh: "تحديث السجلات",
        logs_live_trail: "تتبع مباشر",
        logs_details_title: "تفاصيل العملية الأكاديمية",
        logs_col_ip: "عنوان IP",
        logs_prev: "الصفحة السابقة",
        logs_next: "الصفحة التالية",
        logs_inspect: "معاينة التفاصيل",
        logs_close: "إغلاق",

        // ===== Profile =====
        profile_title: "الملف الأكاديمي وإعدادات الحساب",
        profile_subtitle: "إدارة بيانات اعتمادك وصلاحياتك الأكاديمية وتفضيلات الأمان بجامعة أسيوط التكنولوجية الدولية.",
        profile_account_info: "البيانات الأساسية للحساب",
        profile_username: "اسم المستخدم",
        profile_email: "البريد الإلكتروني الجامعي",
        profile_phone: "رقم الهاتف",
        profile_role: "الدور الأكاديمي",
        profile_since: "تاريخ الانضمام للمنظومة",
        profile_update_info: "تحديث البيانات الأساسية",
        profile_save: "حفظ التعديلات",
        profile_cancel: "إلغاء",
        profile_security: "إعدادات الأمان وحماية الحساب",
        profile_change_pw: "تغيير كلمة المرور",
        profile_current_pw: "كلمة المرور الحالية",
        profile_new_pw: "كلمة المرور الجديدة",
        profile_confirm_pw: "تأكيد كلمة المرور الجديدة",
        profile_update_pw: "تحديث كلمة المرور",
        profile_change_photo: "تغيير الصورة الشخصية",
        profile_remove_photo: "حذف الصورة",
        profile_photo_help: "صيغ JPG أو GIF أو PNG. الحد الأقصى للحجم 4 ميجابايت",
        profile_full_name: "الاسم الأكاديمي الكامل",
        profile_full_name_ph: "مثال: أ.د. أحمد محمود إبراهيم",
        profile_email_ph: "example@aitu.edu.eg",
        profile_new_pw_ph: "أدخل كلمة المرور الجديدة",
        profile_confirm_pw_ph: "أعد إدخال كلمة المرور للتأكيد",

        // ===== Users =====
        users_title: "إدارة المستخدمين والصلاحيات الأكاديمية",
        users_subtitle: "إجمالي المستخدمين المسجلين في المنظومة الجامعية",
        users_add: "إضافة مستخدم جديد",
        users_all_roles: "كافة الأدوار الأكاديمية",
        users_search: "ابحث عن مستخدم بالاسم، البريد، أو القسم...",
        users_stat_total: "إجمالي المستخدمين",
        users_stat_supervisors: "المشرفون العموم",
        users_stat_managers: "رؤساء الأقسام العلمية",
        users_stat_faculty: "أعضاء هيئة التدريس",
        users_col_user: "المستخدم",
        users_col_role: "الدور الأكاديمي",
        users_col_dept: "القسم العلمي",
        users_col_phone: "رقم الهاتف",
        users_col_joined: "تاريخ الانضمام",
        users_col_actions: "الإجراءات",
        users_delete: "حذف الحساب",
        users_no_found: "لا يوجد مستخدمون مطابقون لمعايير البحث الحالية.",
        users_create_title: "إضافة حساب أكاديمي جديد",
        users_username: "اسم المستخدم الجامعي",
        users_email: "البريد الإلكتروني الجامعي",
        users_phone: "رقم الهاتف",
        users_dept: "القسم العلمي",
        users_assign_role: "تعيين الدور والمسؤولية الأكاديمية",
        users_create_btn: "تأكيد إنشاء الحساب",
        users_cancel: "إلغاء",
        users_select_dept: "اختر القسم العلمي...",
        users_select_role: "اختر الدور الأكاديمي...",
        users_personal_info: "البيانات الشخصية والأكاديمية",
        users_full_name: "الاسم الأكاديمي الكامل ثلاثي/رباعي",
        users_full_name_ph: "مثال: د. أحمد محمود إبراهيم",
        users_profile_pic: "الصورة الشخصية",
        users_profile_pic_sub: "صيغة PNG أو JPG بحجم أقصى 5 ميجابايت",
        users_org_details: "البيانات المؤسسية والوظيفة الأكاديمية",
        users_designation: "المسمى الوظيفي / التخصص الدقيق",
        users_designation_ph: "مثال: أستاذ مساعد / مدرس تكنولوجيا المعلومات",
        users_security_settings: "ضوابط الأمان والصلاحيات",
        users_expiry_date: "تاريخ انتهاء صلاحية الحساب (اختياري)",
        users_force_pw: "إلزام المستخدم بتغيير كلمة المرور عند أول تسجيل دخول",
        users_access_permissions: "الصلاحيات والأذونات الأكاديمية",
        users_access_sub: "تحديد مستوى الوصول المناسب للمستخدم طبقاً لمهامه المعتمدة في القسم العلمي أو الكلية.",
        users_role_faculty: "عضو هيئة تدريس (Faculty)",
        users_role_faculty_desc: "صلاحية رفع وإدارة المواد الدراسية وتوصيف المقررات الخاصة به والاطلاع على مستودع الكلية.",
        users_role_dept_mgr: "رئيس قسم علمي (Department Head)",
        users_role_dept_mgr_desc: "صلاحيات إدارية كاملة على مستودع ومقررات القسم العلمي التابع له واعتماد الموارد.",
        users_select_dept_first: "يرجى اختيار القسم العلمي أولاً لتفعيل الصلاحية",
        users_role_supervisor: "مشرف عام المنظومة (System Supervisor)",
        users_role_supervisor_desc: "صلاحيات شاملة وكاملة لكافة الأقسام، إدارة حسابات المستخدمين، وسجلات الأمان والتدقيق.",
        users_system_note: "إشعار المنظومة الجامعية",
        users_system_note_sub: "سيستلم المستخدم رسالة ترحيبية فورية عبر بريده الجامعي تتضمن بيانات الدخول وكلمة المرور المؤقتة.",

        // ===== Create Course =====
        cc_title: "إضافة وتوصيف مقرر دراسي جديد",
        cc_preview: "معاينة المقرر",
        cc_header_title: "إضافة مقرر دراسي جديد للمنظومة",
        cc_header_subtitle: "بناء المحتوى الأكاديمي، رفع المحاضرات والمراجع المعتمدة، وتحديد الصلاحيات.",
        cc_btn_cancel: "إلغاء",
        cc_btn_save_draft: "حفظ كمسودة",
        cc_btn_publish: "نشر المقرر الدراسي",
        cc_course_title_label: "اسم المقرر الدراسي",
        cc_course_title_ph: "مثال: هندسة البرمجيات والأنظمة الموزعة",
        cc_dept_label: "القسم العلمي",
        cc_dept_select: "اختر القسم العلمي...",
        cc_program_label: "الفرقة الدراسية / البرنامج الأكاديمي",
        cc_program_select: "اختر الفرقة أو البرنامج الأكاديمي...",
        cc_desc_label: "توصيف المقرر والأهداف التعليمية",
        cc_desc_ph: "أدخل نبذة عن المقرر الدراسي، مخرجات التعلم المستهدفة، والمراجع المعتمدة...",
        cc_thumb_label: "الغلاف التعريفي للمقرر",
        cc_thumb_drop: "اضغط لاختيار صورة الغلاف (PNG, JPG)",
        cc_thumb_change: "اضغط لتغيير صورة الغلاف",
        cc_visibility_label: "نطاق إتاحة المقرر",
        cc_vis_public: "متاح لكافة منتسبي الجامعة والزوار",
        cc_vis_students: "مقتصر على الطلاب المسجلين بالبرنامج",
        cc_vis_admin: "مقتصر على منسقي المقرر والمشرفين",
        cc_allow_guest_downloads: "السماح بتحميل الموارد للزوار بدون تسجيل",
        cc_mode_title: "طريقة رفع المحتوى التعليمي",
        cc_mode_bulk_title: "رفع المحاضرات والمواد دفعة واحدة",
        cc_mode_bulk_desc: "رفع عدة محاضرات وملفات معاً وإعادة ترتيبها بالسحب والإفلات بسهولة",
        cc_mode_lesson_title: "هيكلة المنهج محاضرة بمحاضرة",
        cc_mode_lesson_desc: "تنظيم المقرر في وحدات دراسية ومحاضرات مجدولة تتضمن الفيديوهات والمستندات",
        cc_bulk_drop_title: "اسحب وأفلت ملفات ومحاضرات المقرر هنا أو اضغط للاختيار",
        cc_bulk_drop_sub: "يدعم: مقاطع الفيديو، وملفات PDF، ومستندات Word، والملفات النصية (TXT)، وجميع الملفات المضغوطة (ZIP, RAR, 7Z). الحد الأقصى 2 جيجابايت للملف.",
        cc_lesson_ph: "أدخل عنوان المحاضرة أو الوحدة...",
        cc_lesson_add_files: "إضافة ملفات ومراجع لهذه المحاضرة",
        cc_lesson_title_def: "المحاضرة",
        cc_pkg_lessons: "محاضرة / مورد",
        cc_pkg_total: "إجمالي سعة الملفات",
        cc_pkg_modules: "وحدات دراسية",
        cc_course_title: "اسم المقرر",
        cc_department: "القسم العلمي",
        cc_description: "توصيف المقرر",
        cc_modules: "الوحدات الدراسية",
        cc_add_module: "إضافة وحدة دراسية",
        cc_add_lesson: "إضافة محاضرة جديدة",
        cc_module_title: "عنوان الوحدة الدراسية",
        cc_lesson_title: "عنوان المحاضرة",
        cc_course_image: "غلاف المقرر",
        cc_upload_image: "رفع صورة الغلاف",
        cc_save: "حفظ المقرر الدراسي",
        cc_cancel: "إلغاء",
        cc_select_dept: "اختر القسم العلمي...",
        cc_placeholder_title: "أدخل عنوان المقرر الدراسي المعتمد...",
        cc_placeholder_desc: "أدخل توصيف المقرر ومخرجات التعلم المستهدفة...",

        // ===== Upload Resources =====
        upload_title: "رفع وتوثيق الموارد التعليمية",
        upload_subtitle: "إضافة وتصنيف ملفات المحاضرات والمراجع والمستندات في المستودع الرقمي المركزي.",
        upload_discard: "إلغاء المسودة",
        upload_start: "بدء رفع الملفات",
        upload_uploading: "جاري رفع ومعالجة الموارد...",
        upload_target_dept: "القسم العلمي المستهدف",
        upload_target_prog: "البرنامج الدراسي / الفرقة",
        upload_select_dept: "اختر القسم العلمي...",
        upload_select_prog: "اختر البرنامج الدراسي...",
        upload_drag_drop: "اسحب وأفلت الملفات الأكاديمية هنا",
        upload_drag_desc: "يدعم: ملفات PDF، ومستندات Word، والملفات النصية (TXT)، ومقاطع الفيديو، وجميع صيغ الملفات المضغوطة (ZIP, RAR, 7Z, TAR, GZ). الحد الأقصى: 2 جيجابايت للملف.",
        upload_select_files: "استعراض ملفات الجهاز",
        upload_dest_required: "الوجهة الأكاديمية مطلوبة",
        upload_dest_desc: "يرجى تحديد القسم والبرنامج المستهدفين أعلاه لتفعيل وتأكيد الرفع.",
        upload_queue: "قائمة الملفات المجهزة للرفع",
        upload_clear_all: "مسح القائمة",
        upload_no_files: "القائمة فارغة حالياً. اسحب الملفات إلى هنا أو اضغط \"استعراض ملفات الجهاز\".",
        upload_best_title: "إرشادات وضوابط الجامعة الأكاديمية",
        upload_best_desc: "تأكد من مطابقة الملفات لمعايير الجودة الأكاديمية وتسميتها بوضوح لضمان سهولة فهرستها في المستودع.",
        upload_lesson_title: "عنوان المحاضرة / المورد",
        upload_resource_title: "اسم المرجع الأكاديمي",
        upload_failed: "تعذر إكمال الرفع: حدث انقطاع في الاتصال بالشبكة",
        upload_waiting: "في انتظار بدء الرفع...",
        upload_complete: "تم رفع وتوثيق كافة الموارد بنجاح!",
        upload_assets: "جاري معالجة وفهرسة الملفات الأكاديمية...",
        upload_processed: "ملفات تم اكتمالها",
        upload_remaining: "ملفات متبقية",
        upload_success: "تم حفظ وفهرسة {count} من الموارد الأكاديمية في المستودع بنجاح!",
        upload_confirm_discard: "هل أنت متأكد من إلغاء عملية الرفع الحالية؟",
        upload_enter_title: "أدخل عنوان المورد الأكاديمي...",
        upload_alert_dest: "يرجى اختيار القسم العلمي والبرنامج المستهدفين قبل المتابعة.",
        upload_alert_dest2: "يجب تحديد القسم العلمي والبرنامج الدراسي المستهدف بدقة.",
        upload_alert_title: "يرجى التأكد من كتابة عنوان واضح وتحديد القسم والبرنامج لكافة الملفات قبل الحفظ.",

        // ===== 403 =====
        err_403_title: "403 غير مصرح بالوصول",
        err_403_desc: "عفواً، لا تمتلك الصلاحيات الأكاديمية الكافية للوصول إلى هذا القسم في المنظومة.",
        err_403_back: "العودة للصفحة المعتمدة",

        // ===== Common =====
        common_confirm: "تأكيد",
        common_cancel: "إلغاء",
        common_save: "حفظ",
        common_delete: "حذف",
        common_edit: "تعديل",
        common_close: "إغلاق",
        common_search: "بحث",
        common_done: "تم بنجاح",
        common_retry: "إعادة المحاولة"
    }
};

// ============================================
// Language Engine
// ============================================

const STORAGE_KEY = 'aitu_lang';

/** Get the currently saved language (official default: 'ar' for Egyptian University) */
export function getCurrentLang() {
    return localStorage.getItem(STORAGE_KEY) || 'ar';
}

/** Apply a language to the entire page */
export function applyLanguage(lang) {
    const t = translations[lang] || translations.ar;
    if (!t) return;

    const isAr = lang === 'ar';

    // 1. Set dir and lang on <html>
    const html = document.documentElement;
    html.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    html.setAttribute('lang', lang);

    // 2. Toggle RTL class on body
    if (document.body) {
        document.body.classList.toggle('rtl', isAr);
        document.body.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    }

    // 3. Translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key] !== undefined) {
            const val = t[key];
            if (typeof val === 'string' && val.includes('<') && val.includes('>')) {
                el.innerHTML = val;
            } else {
                el.textContent = val;
            }
        }
    });

    // 4. Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key] !== undefined) {
            el.setAttribute('placeholder', t[key]);
        }
    });

    // 5. Update all language toggle buttons text and attributes
    document.querySelectorAll('.lang-btn-text').forEach(btnText => {
        btnText.textContent = t.lang_btn;
    });

    const shellLangBtn = document.getElementById('shellLangBtn');
    if (shellLangBtn) {
        shellLangBtn.innerHTML = isAr ? '🌐 English' : '🌐 عربي';
        shellLangBtn.setAttribute('title', isAr ? 'Switch to English' : 'التحويل للعربية');
    }

    const lpLangLabel = document.getElementById('lpLangLabel');
    if (lpLangLabel) {
        // In login.html, if current is Arabic, button offers to switch to English
        lpLangLabel.textContent = isAr ? 'English' : 'عربي';
    }

    // 6. Save preference
    localStorage.setItem(STORAGE_KEY, lang);
}

/** Toggle between English and Arabic */
export function toggleLanguage(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
        e.stopPropagation();
    }
    const current = getCurrentLang();
    const next = current === 'ar' ? 'en' : 'ar';
    localStorage.setItem(STORAGE_KEY, next);
    applyLanguage(next);
    window.location.reload();
}

/** Initialize language from localStorage (call on page load) */
export function initLanguage() {
    const lang = getCurrentLang();
    applyLanguage(lang);

    // Attach click handler to all language toggle buttons
    const langSelectors = [
        '#langToggleBtn',
        '.lang-toggle-btn',
        '#shellLangBtn',
        '#sidebarLangBtn',
        '#lpLangBtn'
    ];

    document.querySelectorAll(langSelectors.join(',')).forEach(btn => {
        btn.onclick = (e) => toggleLanguage(e);
    });
}

/** Returns department/specialization name as provided by API */
export function getDeptDisplayName(nameOrCode) {
    if (!nameOrCode) return '';
    return String(nameOrCode).trim();
}