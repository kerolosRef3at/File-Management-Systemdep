// js/shared/i18n.js – Full Arabic / English Translation System

export const translations = {
    en: {
        // ===== Navbar =====
        nav_home: "Home",
        nav_programs: "Programs",
        nav_courses: "Courses",
        nav_repository: "Repository",
        nav_login: "Login",
        nav_join: "Join AITU",
        nav_brand_sub: "FILE MANAGEMENT SYSTEM",
        lang_btn: "عربي",

        // ===== Index / Hero =====
        hero_title: "Academic Infrastructure Repository",
        hero_desc: "The institutional file management system for Assiut International Technological University. A secure and organized platform to access resources for IT, Electrical, and Mechanical Engineering departments.",
        hero_btn_browse: "Browse Programs",
        hero_btn_academy: "Join AITU Academy",

        // ===== Departments Section =====
        dept_section_title: "Supported Departments",
        dept_it_title: "Information Tech (IT)",
        dept_it_desc: "Code repositories, system documentation, and software/network development resources.",
        dept_el_title: "Electrical Eng (EL)",
        dept_el_desc: "Circuit diagrams, lab reports, and research on embedded systems and power.",
        dept_me_title: "Mechanical Eng (ME)",
        dept_me_desc: "3D CAD models, dynamic analysis, and materials and manufacturing specs.",
        dept_view_files: "VIEW FILES →",

        // ===== Trust Banner =====
        trust_title: "Trusted Platform for Academic Research",
        trust_desc: "AITU Drive ensures fast and secure access to thousands of academic documents, fostering collaboration across all technological departments.",
        trust_stat: "100%",
        trust_stat_label: "Secure Encryption",

        // ===== Sidebar =====
        sidebar_heading: "Academic Departments",
        sidebar_browse_files: "Browse files by category",
        sidebar_browse_courses: "Browse courses by category",

        // ===== Repository Controls =====
        repo_title: "Central Repository",
        repo_subtitle: "The official AITU file management system for academic and administrative record keeping.",
        repo_add_category: "Add Category",
        repo_add_program: "Add Program",
        repo_upload: "Upload Resources",
        repo_filters: "Filters",
        repo_categories: "Categories",
        repo_files: "Files",
        repo_search_placeholder: "Search files...",
        repo_filter_all: "All Files",
        repo_view_grid: "Grid",
        repo_view_list: "List",

        // ===== Courses =====
        courses_hero_title: "Explore Academic Programs",
        courses_hero_desc: "Discover professional and academic courses tailored for the next generation of technological leaders.",
        courses_search_placeholder: "Search courses...",
        courses_cta_title: "Unlock Your Potential",
        courses_cta_desc: "Access comprehensive course materials and resources designed by AITU's expert faculty.",
        courses_cta_browse: "Browse Programs",
        courses_cta_join: "Join AITU",
        courses_bulk_title: "Bulk Downloads",
        courses_bulk_desc: "Download entire semesters of technical resources in one click.",
        courses_bulk_btn: "Browse Packages",
        courses_filter_btn: "Filter & Sort",
        courses_no_results: "No courses found matching your search.",

        // ===== Course Details =====
        cd_download_confirm: "Confirm Course Download",
        cd_total_size: "TOTAL SIZE",
        cd_policy_title: "Usage Restriction Policy",
        cd_policy_desc: "Redistribution, public sharing, or commercial use of these materials is strictly prohibited under Assiut International Technological University Terms of Service and Intellectual Property regulations. Resources are for individual educational use only.",
        cd_cancel: "Cancel",
        cd_download_btn: "Download Course Archive",
        cd_loading: "Loading course details...",

        // ===== Footer =====
        footer_brand: "AITU File Sharing System",
        footer_desc: "Centralizing academic intelligence with precision.",
        footer_copy: "© 2026 Assiut International Technological University. All rights reserved.",

        // ===== Auth Pages =====
        sidebar_uni_name: "Assiut International Technological University",
        sidebar_uni_sub: "File Management System",
        auth_uni_name: "Assiut International Technological University - AITU",
        auth_system_name: "File Management System",
        auth_pill: "File System",
        auth_main_title: "File Management System",
        auth_main_desc: "Streamline workflows, track progress, and collaborate seamlessly across all AITU departments and teams.",
        auth_footer: "© 2026 Assiut International Technological University",

        // ===== Login =====
        login_welcome: "Welcome Back",
        login_subtitle: "Sign in to your AITU account to continue.",
        login_username_label: "Username or Email Address",
        login_username_placeholder: "Enter Your Username or Email",
        login_password_label: "Password",
        login_password_placeholder: "Enter Your Password",
        login_forgot: "Forgot Password?",
        login_submit: "Login",

        // ===== Forgot Password =====
        forgot_title: "Forgot Password",
        forgot_desc: "Enter your registered email address. You will receive a 6-digit OTP code to reset your password.",
        forgot_email_label: "Username or Email Address",
        forgot_email_placeholder: "Enter Your Email",
        forgot_submit: "Confirm",
        forgot_info: "We'll send a 6-digit verification code to your email.",
        forgot_back: "Back to Login",

        // ===== OTP =====
        otp_title: "Verify Your Email",
        otp_desc: "Enter your email address to receive a 6-digit verification code.",
        otp_submit: "Confirm",
        otp_info: "We'll send a 6-digit verification code to your email.",

        // ===== Reset Password =====
        reset_title: "Create New Password",
        reset_desc: "Enter a new password for your account. Make sure it's secure and easy to remember.",
        reset_new_label: "New Password",
        reset_new_placeholder: "Enter Your New Password",
        reset_confirm_label: "Confirm New Password",
        reset_confirm_placeholder: "Confirm Your New Password",
        reset_submit: "Confirm",
        reset_req_length: "Min 8 characters",
        reset_req_upper: "1 Uppercase & 1 Lowercase",
        reset_req_number: "At least 1 number",
        reset_req_special: "1 Special character",

        // ===== Mobile Nav =====
        mobile_home: "Home",
        mobile_programs: "Programs",
        mobile_courses: "Courses",

        // ===== Loader =====
        loader_text: "Loading...",

        // ===== Sidebar / Layout =====
        sidebar_dashboard: "Dashboard",
        sidebar_repository: "Repository",
        sidebar_courses: "Courses",
        sidebar_users: "Users",
        sidebar_logs: "System Logs",
        sidebar_profile: "Profile",
        sidebar_logout: "Logout",
        sidebar_sub_dashboard: "Overview of tasks, teams & performance",
        sidebar_sub_repository: "Academic programs and files repository",
        sidebar_sub_courses: "Manage classes, curricula, and schedules",
        sidebar_sub_users: "Manage system access, roles, and administrative privileges",
        sidebar_sub_logs: "System audit trails and event records",
        sidebar_sub_profile: "Update your personal profile and preferences",
        sidebar_add_program: "Add Program",
        sidebar_add_course: "Add Course",
        sidebar_add_user: "Add User",

        // ===== Dashboard =====
        dash_morning: "Good morning",
        dash_afternoon: "Good afternoon",
        dash_evening: "Good evening",
        dash_overview: "Here's your workspace overview",
        dash_last7: "Last 7 days",
        dash_last30: "Last 30 days",
        dash_last6m: "Last 6 months",
        dash_lasty: "Last year",
        dash_total_files: "Total Files",
        dash_total_courses: "Total Courses",
        dash_total_programs: "Total Programs",
        dash_qnap_storage: "QNAP Storage Capacity",
        dash_drive_not_connected: "Drive not connected",
        dash_storage: "Storage Capacity",
        dash_pending: "Pending Tasks",
        dash_activity: "Net Activity",
        dash_download_velocity: "Download Velocity",
        dash_resource_mix: "Resource Mix",
        dash_program_downloads: "Program Downloads",
        dash_high_impact: "High-Impact Documents",
        dash_recent_events: "Recent Events",
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
        dash_source: "SOURCE",
        dash_access_count: "ACCESS COUNT",
        dash_weight: "WEIGHT",

        // ===== Logs =====
        logs_title: "AITU System Logs",
        logs_subtitle: "events recorded — full administrator activity trail",
        logs_export_csv: "Export CSV",
        logs_all: "ALL",
        logs_login: "Login",
        logs_add_file: "Add File",
        logs_delete_file: "Delete File",
        logs_create_folder: "Create Folder",
        logs_upload_video: "Upload Video",
        logs_add_user: "Add User",
        logs_delete_user: "Delete User",
        logs_change_pw: "Change Password",
        logs_update_profile: "Update Profile",
        logs_search: "Search by admin or target...",
        logs_from: "From Date",
        logs_to: "To Date",
        logs_col_admin: "Admin",
        logs_col_role: "Role",
        logs_col_action: "Action",
        logs_col_target: "Target",
        logs_col_datetime: "Date & Time",
        logs_no_match: "No logs match your current filters.",
        logs_showing: "Showing",
        logs_of: "of",

        // ===== Profile =====
        profile_title: "Profile & Account Settings",
        profile_subtitle: "Manage your AITU administrative credentials and security preferences.",
        profile_account_info: "Account Information",
        profile_username: "USERNAME",
        profile_email: "EMAIL ADDRESS",
        profile_phone: "PHONE",
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
        profile_photo_help: "JPG, GIF or PNG. Max size of 800K",
        profile_full_name: "Full Name",
        profile_full_name_ph: "e.g. Dr. John Smith",
        profile_email_ph: "example@domain.com",
        profile_new_pw_ph: "Create new password",
        profile_confirm_pw_ph: "Confirm new password",

        // ===== Users =====
        users_title: "User Management",
        users_subtitle: "total registered users",
        users_add: "Add New User",
        users_all_roles: "All Roles",
        users_search: "Search users...",
        users_stat_total: "TOTAL USERS",
        users_stat_supervisors: "SUPERVISORS",
        users_stat_managers: "DEPT. MANAGERS",
        users_stat_faculty: "FACULTY",
        users_col_user: "User",
        users_col_role: "Role",
        users_col_dept: "Department",
        users_col_phone: "Phone",
        users_col_joined: "Joined",
        users_col_actions: "Actions",
        users_delete: "Delete",
        users_no_found: "No users found matching your criteria.",
        users_create_title: "Create New User",
        users_username: "Username",
        users_email: "Email Address",
        users_phone: "Phone Number",
        users_dept: "Department",
        users_assign_role: "Assign Role",
        users_create_btn: "Create User",
        users_cancel: "Cancel",
        users_select_dept: "Select Department...",
        users_select_role: "Select Role...",
        users_confirm_delete: "Are you sure you want to delete this user?",
        users_personal_info: "Personal Information",
        users_full_name: "Full Name",
        users_full_name_ph: "e.g. Dr. John Smith",
        users_profile_pic: "Profile Picture",
        users_profile_pic_sub: "PNG, JPG up to 5MB",
        users_org_details: "Organizational Details",
        users_designation: "Designation / Job Title",
        users_designation_ph: "e.g. Senior Researcher",
        users_security_settings: "Security Settings",
        users_expiry_date: "Account Expiry Date (Optional)",
        users_force_pw: "Force password change on first login",
        users_access_permissions: "Access & Permissions",
        users_access_sub: "Select the appropriate access level for this user. Permissions are additive based on the role.",
        users_role_faculty: "Faculty",
        users_role_faculty_desc: "Basic access to upload course materials and view the repository.",
        users_role_dept_mgr: "Department Manager",
        users_role_dept_mgr_desc: "Full access to their own department's repository and courses. The role is taken from the department selected on the left — e.g. ",
        users_select_dept_first: "select a department",
        users_role_supervisor: "Supervisor",
        users_role_supervisor_desc: "Unrestricted access to every department, user management, and audit logs.",
        users_system_note: "SYSTEM NOTE",
        users_system_note_sub: "User will receive an automated invitation email once the profile is created.",

        // ===== Courses Page =====
        courses_page_title: "Course Repository",
        courses_page_subtitle: "Explore and manage standardized academic curriculums for the Faculty of Engineering and Information Technology.",
        courses_all_depts: "All Departments",
        courses_drafts: "Drafts",
        courses_upload_new: "Upload New Course",
        courses_upload_sub: "Standardize curriculum by adding new course modules to the central repository.",
        courses_showing: "Showing",
        courses_of: "of",
        courses_courses: "Courses",
        courses_load_more: "Load More Resources",
        courses_lessons: "Lessons",
        courses_no_found: "No courses available in this section.",
        courses_public_title: "Academic Courses & Programs",
        courses_public_sub: "Explore standardized curriculum resources across all technological departments.",
        courses_search_placeholder: "Search courses by title, topic, or code...",
        courses_dept_sidebar: "Departments & Programs",
        sidebar_heading: "Academic Departments",
        sidebar_browse: "Browse files by category",
        sidebar_browse_courses: "Browse courses by category",

        // ===== Create Course =====
        cc_header_title: "Create New Course",
        cc_header_subtitle: "Build academic curriculum, upload lessons & videos, and configure access settings.",
        cc_btn_cancel: "Cancel",
        cc_btn_save_draft: "Save Draft",
        cc_btn_publish: "Publish Course",
        cc_course_title_label: "Course Title",
        cc_course_title_ph: "e.g., Applied Fluid Mechanics & Thermodynamics",
        cc_dept_label: "Academic Department",
        cc_dept_select: "Select Department...",
        cc_program_label: "Academic Level / Program",
        cc_program_select: "Select Level...",
        cc_desc_label: "Course Description",
        cc_desc_ph: "Provide an overview of course objectives, prerequisites, and learning outcomes...",
        cc_thumb_label: "Course Thumbnail",
        cc_thumb_drop: "Click to upload course image (PNG, JPG)",
        cc_thumb_change: "Click to change thumbnail",
        cc_visibility_label: "Visibility",
        cc_vis_public: "Public (Everyone)",
        cc_vis_students: "Students Only",
        cc_vis_admin: "Admin / Faculty Only",
        cc_allow_guest_downloads: "Allow Guest Downloads",
        cc_mode_title: "Upload Mode",
        cc_mode_bulk_title: "Bulk Upload Mode",
        cc_mode_bulk_desc: "Upload multiple videos at once & drag to reorder",
        cc_mode_lesson_title: "Lesson-by-Lesson Mode",
        cc_mode_lesson_desc: "Organize content into modules with multiple files per lesson",
        cc_bulk_drop_title: "Drag & drop course files here or click to browse",
        cc_bulk_drop_sub: "Supports MP4, MKV, AVI, PDF, ZIP (Max 2GB per file)",
        cc_lesson_ph: "Enter lesson name...",
        cc_lesson_add_files: "Add Files to this Lesson",
        cc_lesson_title_def: "Lesson",
        cc_pkg_lessons: "Lessons",
        cc_pkg_total: "Total Size",
        cc_pkg_modules: "Modules",
        cc_title: "Create New Course",
        cc_preview: "PREVIEW MODE",
        cc_course_title: "Course Title",
        cc_department: "Department",
        cc_description: "Description",
        cc_modules: "Course Modules",
        cc_add_module: "Add Module",
        cc_add_lesson: "Add Lesson",
        cc_module_title: "Module Title",
        cc_lesson_title: "Lesson Title",
        cc_course_image: "Course Image",
        cc_upload_image: "Upload Image",
        cc_save: "Save Course",
        cc_cancel: "Cancel",
        cc_select_dept: "Select Department...",
        cc_placeholder_title: "Enter course title...",
        cc_placeholder_desc: "Enter course description...",

        // ===== Upload Resources =====
        upload_title: "Upload Resources",
        upload_subtitle: "Select and configure multiple videos or documents for the Academic Catalog.",
        upload_discard: "Discard Draft",
        upload_start: "Start Upload",
        upload_uploading: "Uploading...",
        upload_target_dept: "Target Department",
        upload_target_prog: "Target Program",
        upload_select_dept: "Select Department...",
        upload_select_prog: "Select Program...",
        upload_drag_drop: "Drag & Drop Files",
        upload_drag_desc: "Upload .mp4, .pdf, .zip or .docx. Max file size: 2GB per asset.",
        upload_select_files: "Select Files From System",
        upload_dest_required: "Destination Required",
        upload_dest_desc: "Please select a Target Department and Program above to unlock uploading.",
        upload_queue: "File Queue",
        upload_clear_all: "Clear All",
        upload_no_files: "No files in queue. Drag files here or click \"Select Files\".",
        upload_best_title: "AITU Best Practices",
        upload_best_desc: "Ensure video files include captions for accessibility compliance. Asset names will be parsed automatically but can be overridden manually.",
        upload_lesson_title: "LESSON TITLE",
        upload_resource_title: "RESOURCE TITLE",
        upload_failed: "Upload Failed: Network Interruption",
        upload_waiting: "Waiting to upload...",
        upload_complete: "All Uploads Complete!",
        upload_assets: "Uploading Course Assets...",
        upload_processed: "files processed",
        upload_remaining: "remaining",
        upload_success: "Successfully saved {count} file(s) to the repository!",
        upload_confirm_discard: "Are you sure you want to discard all uploads?",
        upload_enter_title: "Enter title...",
        upload_alert_dest: "Please select a Target Department and Program before uploading files.",
        upload_alert_dest2: "Please ensure a Target Department and Program are selected.",
        upload_alert_title: "Please ensure all files have a Title, Department, and Program selected before saving.",

        // ===== 403 =====
        err_403_title: "403 Forbidden",
        err_403_desc: "You do not have permission to access this page.",
        err_403_back: "Go Back",

        // ===== Common =====
        common_confirm: "Confirm",
        common_cancel: "Cancel",
        common_save: "Save",
        common_delete: "Delete",
        common_edit: "Edit",
        common_close: "Close",
        common_search: "Search",
        common_done: "Done",
        common_retry: "RETRY"
    },

    ar: {
        // ===== Navbar =====
        nav_home: "الرئيسية",
        nav_programs: "التخصصات",
        nav_courses: "الكورسات",
        nav_repository: "المستودع",
        nav_login: "تسجيل الدخول",
        nav_join: "انضم لـ AITU",
        nav_brand_sub: "نظام إدارة الملفات",
        lang_btn: "English",

        // ===== Index / Hero =====
        hero_title: "مستودع البنية التحتية الأكاديمية",
        hero_desc: "نظام إدارة الملفات المؤسسي لجامعة أسيوط التكنولوجية الدولية. منصة آمنة ومنظمة للوصول إلى موارد أقسام تكنولوجيا المعلومات والهندسة الكهربائية والميكانيكية.",
        hero_btn_browse: "تصفح التخصصات",
        hero_btn_academy: "انضم لأكاديمية AITU",

        // ===== Departments Section =====
        dept_section_title: "الأقسام المدعومة",
        dept_it_title: "تكنولوجيا المعلومات (IT)",
        dept_it_desc: "مستودعات الأكواد البرمجية، وثائق الأنظمة، وموارد تطوير البرمجيات والشبكات.",
        dept_el_title: "الهندسة الكهربائية (EL)",
        dept_el_desc: "مخططات الدوائر، تقارير المعامل، وأبحاث الأنظمة المدمجة والطاقة.",
        dept_me_title: "الهندسة الميكانيكية (ME)",
        dept_me_desc: "نماذج CAD ثلاثية الأبعاد، تحليل ديناميكي، ومواصفات المواد والتصنيع.",
        dept_view_files: "← عرض الملفات",

        // ===== Trust Banner =====
        trust_title: "منصة موثوقة للبحث الأكاديمي",
        trust_desc: "يضمن AITU Drive وصولاً سريعاً وآمناً إلى آلاف الوثائق الأكاديمية، مما يعزز التعاون عبر جميع الأقسام التكنولوجية.",
        trust_stat: "١٠٠٪",
        trust_stat_label: "تشفير آمن",

        // ===== Sidebar =====
        sidebar_heading: "الأقسام الأكاديمية",
        sidebar_browse_files: "تصفح الملفات حسب القسم",
        sidebar_browse_courses: "تصفح الكورسات حسب القسم",

        // ===== Repository Controls =====
        repo_title: "المستودع المركزي",
        repo_subtitle: "النظام الرسمي لإدارة ملفات جامعة أسيوط التكنولوجية الدولية لتدوين السجلات الأكاديمية والإدارية.",
        repo_add_category: "إضافة قسم",
        repo_add_program: "إضافة تخصص",
        repo_upload: "رفع الموارد",
        repo_filters: "الفلاتر",
        repo_categories: "أقسام",
        repo_files: "ملفات",
        repo_search_placeholder: "ابحث عن ملفات...",
        repo_filter_all: "كل الملفات",
        repo_view_grid: "شبكة",
        repo_view_list: "قائمة",

        // ===== Courses =====
        courses_hero_title: "استكشف البرامج الأكاديمية",
        courses_hero_desc: "اكتشف الكورسات المهنية والأكاديمية المصممة للجيل القادم من القادة التكنولوجيين.",
        courses_search_placeholder: "ابحث عن كورسات...",
        courses_cta_title: "أطلق إمكانياتك",
        courses_cta_desc: "احصل على مواد دراسية شاملة وموارد مصممة بواسطة أعضاء هيئة التدريس في AITU.",
        courses_cta_browse: "تصفح التخصصات",
        courses_cta_join: "انضم لـ AITU",
        courses_bulk_title: "تحميل جماعي",
        courses_bulk_desc: "قم بتحميل فصول دراسية كاملة من الموارد التقنية بضغطة واحدة.",
        courses_bulk_btn: "تصفح الحزم",
        courses_filter_btn: "تصفية وترتيب",
        courses_no_results: "لا توجد كورسات مطابقة للبحث.",

        // ===== Course Details =====
        cd_download_confirm: "تأكيد تحميل الكورس",
        cd_total_size: "الحجم الكلي",
        cd_policy_title: "سياسة قيود الاستخدام",
        cd_policy_desc: "يُحظر تمامًا إعادة التوزيع أو المشاركة العامة أو الاستخدام التجاري لهذه المواد بموجب شروط خدمة جامعة أسيوط التكنولوجية الدولية ولوائح الملكية الفكرية. الموارد للاستخدام التعليمي الفردي فقط.",
        cd_cancel: "إلغاء",
        cd_download_btn: "تحميل أرشيف الكورس",
        cd_loading: "جاري تحميل تفاصيل الكورس...",

        // ===== Footer =====
        footer_brand: "نظام مشاركة ملفات AITU",
        footer_desc: "مركزية الذكاء الأكاديمي بدقة.",
        footer_copy: "© ٢٠٢٦ جامعة أسيوط التكنولوجية الدولية. جميع الحقوق محفوظة.",

        // ===== Auth Pages =====
        sidebar_uni_name: "جامعة أسيوط التكنولوجية الدولية",
        sidebar_uni_sub: "نظام إدارة الملفات",
        auth_uni_name: "جامعة أسيوط التكنولوجية الدولية - AITU",
        auth_system_name: "نظام إدارة الملفات",
        auth_pill: "نظام الملفات",
        auth_main_title: "نظام إدارة الملفات",
        auth_main_desc: "بسّط سير العمل، تابع التقدم، وتعاون بسلاسة عبر جميع أقسام وفرق AITU.",
        auth_footer: "© ٢٠٢٦ جامعة أسيوط التكنولوجية الدولية",

        // ===== Login =====
        login_welcome: "مرحباً بعودتك",
        login_subtitle: "سجل دخولك إلى حساب AITU للمتابعة.",
        login_username_label: "اسم المستخدم أو البريد الإلكتروني",
        login_username_placeholder: "أدخل بريدك الإلكتروني / اسم المستخدم",
        login_password_label: "كلمة المرور",
        login_password_placeholder: "أدخل كلمة المرور",
        login_forgot: "نسيت كلمة المرور؟",
        login_submit: "تسجيل الدخول",

        // ===== Forgot Password =====
        forgot_title: "نسيت كلمة المرور",
        forgot_desc: "أدخل بريدك الإلكتروني المسجل. ستتلقى رمز OTP مكون من 6 أرقام لإعادة تعيين كلمة المرور.",
        forgot_email_label: "اسم المستخدم أو البريد الإلكتروني",
        forgot_email_placeholder: "أدخل بريدك الإلكتروني",
        forgot_submit: "تأكيد",
        forgot_info: "سنرسل رمز تحقق مكون من 6 أرقام إلى بريدك الإلكتروني.",
        forgot_back: "العودة لتسجيل الدخول",

        // ===== OTP =====
        otp_title: "تحقق من بريدك الإلكتروني",
        otp_desc: "أدخل بريدك الإلكتروني لتلقي رمز تحقق مكون من 6 أرقام.",
        otp_submit: "تأكيد",
        otp_info: "سنرسل رمز تحقق مكون من 6 أرقام إلى بريدك الإلكتروني.",

        // ===== Reset Password =====
        reset_title: "إنشاء كلمة مرور جديدة",
        reset_desc: "أدخل كلمة مرور جديدة لحسابك. تأكد إنها آمنة وسهلة التذكر.",
        reset_new_label: "كلمة المرور الجديدة",
        reset_new_placeholder: "أدخل كلمة المرور الجديدة",
        reset_confirm_label: "تأكيد كلمة المرور الجديدة",
        reset_confirm_placeholder: "تأكيد كلمة المرور الجديدة",
        reset_submit: "تأكيد",
        reset_req_length: "٨ أحرف على الأقل",
        reset_req_upper: "حرف كبير وحرف صغير",
        reset_req_number: "رقم واحد على الأقل",
        reset_req_special: "رمز خاص واحد",

        // ===== Mobile Nav =====
        mobile_home: "الرئيسية",
        mobile_programs: "التخصصات",
        mobile_courses: "الكورسات",

        // ===== Loader =====
        loader_text: "جاري التحميل...",

        // ===== Sidebar / Layout =====
        sidebar_dashboard: "لوحة التحكم",
        sidebar_repository: "المستودع",
        sidebar_courses: "الكورسات",
        sidebar_users: "المستخدمين",
        sidebar_logs: "سجل النظام",
        sidebar_profile: "الملف الشخصي",
        sidebar_logout: "تسجيل الخروج",
        sidebar_sub_dashboard: "نظرة عامة على المهام والفرق والأداء",
        sidebar_sub_repository: "البرامج الأكاديمية ومستودع الملفات",
        sidebar_sub_courses: "إدارة الفصول والمناهج والجداول",
        sidebar_sub_users: "إدارة الوصول والأدوار والصلاحيات الإدارية",
        sidebar_sub_logs: "مسارات التدقيق وسجلات الأحداث",
        sidebar_sub_profile: "تحديث ملفك الشخصي وتفضيلاتك",
        sidebar_add_program: "إضافة تخصص",
        sidebar_add_course: "إضافة كورس",
        sidebar_add_user: "إضافة مستخدم",

        // ===== Dashboard =====
        dash_morning: "صباح الخير",
        dash_afternoon: "مساء الخير",
        dash_evening: "مساء الخير",
        dash_overview: "إليك نظرة عامة على مساحة العمل",
        dash_last7: "آخر 7 أيام",
        dash_last30: "آخر 30 يوم",
        dash_last6m: "آخر 6 أشهر",
        dash_lasty: "السنة الماضية",
        dash_total_files: "إجمالي الملفات",
        dash_total_courses: "إجمالي الكورسات",
        dash_total_programs: "إجمالي البرامج",
        dash_qnap_storage: "سعة تخزين QNAP",
        dash_drive_not_connected: "القرص غير متصل",
        dash_storage: "سعة التخزين",
        dash_pending: "المهام المعلقة",
        dash_activity: "نشاط الشبكة",
        dash_download_velocity: "سرعة التحميل",
        dash_resource_mix: "توزيع الموارد",
        dash_program_downloads: "تحميلات البرامج",
        dash_high_impact: "المستندات عالية التأثير",
        dash_recent_events: "الأحداث الأخيرة",
        dash_last_7: "آخر 7 أيام",
        dash_last_30: "آخر 30 يوم",
        dash_last_90: "آخر 90 يوم",
        dash_export: "تصدير التقرير",
        dash_realtime: "المراقبة الفورية نشطة",
        dash_no_data: "لا توجد بيانات",
        dash_files: "ملفات",
        dash_downloads: "تحميلات",
        dash_view_all: "عرض الكل",
        dash_filename: "اسم الملف",
        dash_source: "المصدر",
        dash_access_count: "عدد مرات الوصول",
        dash_weight: "الحجم",

        // ===== Logs =====
        logs_title: "سجل نظام AITU",
        logs_subtitle: "أحداث مسجلة — سجل نشاط المسؤولين الكامل",
        logs_export_csv: "تصدير CSV",
        logs_all: "الكل",
        logs_login: "تسجيل دخول",
        logs_add_file: "إضافة ملف",
        logs_delete_file: "حذف ملف",
        logs_create_folder: "إنشاء مجلد",
        logs_upload_video: "رفع فيديو",
        logs_add_user: "إضافة مستخدم",
        logs_delete_user: "حذف مستخدم",
        logs_change_pw: "تغيير كلمة المرور",
        logs_update_profile: "تحديث الملف الشخصي",
        logs_search: "ابحث باسم المسؤول أو الهدف...",
        logs_from: "من تاريخ",
        logs_to: "إلى تاريخ",
        logs_col_admin: "المسؤول",
        logs_col_role: "الدور",
        logs_col_action: "الإجراء",
        logs_col_target: "الهدف",
        logs_col_datetime: "التاريخ والوقت",
        logs_no_match: "لا توجد سجلات مطابقة للفلاتر الحالية.",
        logs_showing: "عرض",
        logs_of: "من",

        // ===== Profile =====
        profile_title: "الملف الشخصي وإعدادات الحساب",
        profile_subtitle: "إدارة بيانات اعتمادك الإدارية وتفضيلات الأمان في AITU.",
        profile_account_info: "معلومات الحساب",
        profile_username: "اسم المستخدم",
        profile_email: "البريد الإلكتروني",
        profile_phone: "الهاتف",
        profile_role: "الدور",
        profile_since: "عضو منذ",
        profile_update_info: "تحديث المعلومات",
        profile_save: "حفظ التغييرات",
        profile_cancel: "إلغاء",
        profile_security: "إعدادات الأمان",
        profile_change_pw: "تغيير كلمة المرور",
        profile_current_pw: "كلمة المرور الحالية",
        profile_new_pw: "كلمة المرور الجديدة",
        profile_confirm_pw: "تأكيد كلمة المرور الجديدة",
        profile_update_pw: "تحديث كلمة المرور",
        profile_change_photo: "تغيير الصورة",
        profile_remove_photo: "إزالة",
        profile_photo_help: "JPG أو GIF أو PNG. الحد الأقصى للحجم 800 كيلوبايت",
        profile_full_name: "الاسم الكامل",
        profile_full_name_ph: "مثال: د. أحمد محمود",
        profile_email_ph: "مثال: name@domain.com",
        profile_new_pw_ph: "أدخل كلمة المرور الجديدة",
        profile_confirm_pw_ph: "أكد كلمة المرور الجديدة",

        // ===== Users =====
        users_title: "إدارة المستخدمين",
        users_subtitle: "إجمالي المستخدمين المسجلين",
        users_add: "إضافة مستخدم جديد",
        users_all_roles: "كل الأدوار",
        users_search: "ابحث عن مستخدمين...",
        users_stat_total: "إجمالي المستخدمين",
        users_stat_supervisors: "المشرفون العموم",
        users_stat_managers: "مديرو الأقسام",
        users_stat_faculty: "أعضاء هيئة التدريس",
        users_col_user: "المستخدم",
        users_col_role: "الدور",
        users_col_dept: "القسم",
        users_col_phone: "الهاتف",
        users_col_joined: "تاريخ الانضمام",
        users_col_actions: "الإجراءات",
        users_delete: "حذف",
        users_no_found: "لا يوجد مستخدمون مطابقون للمعايير.",
        users_create_title: "إنشاء مستخدم جديد",
        users_username: "اسم المستخدم",
        users_email: "البريد الإلكتروني",
        users_phone: "رقم الهاتف",
        users_dept: "القسم",
        users_assign_role: "تعيين الدور",
        users_create_btn: "إنشاء المستخدم",
        users_cancel: "إلغاء",
        users_select_dept: "اختر القسم...",
        users_select_role: "اختر الدور...",
        users_personal_info: "المعلومات الشخصية",
        users_full_name: "الاسم الكامل",
        users_full_name_ph: "مثال: د. أحمد محمود",
        users_profile_pic: "الصورة الشخصية",
        users_profile_pic_sub: "PNG أو JPG بحجم أقصى 5 ميجابايت",
        users_org_details: "البيانات التنظيمية",
        users_designation: "المسمى الوظيفي / التخصص",
        users_designation_ph: "مثال: باحث أول / أستاذ دكتور",
        users_security_settings: "إعدادات الأمان",
        users_expiry_date: "تاريخ انتهاء الحساب (اختياري)",
        users_force_pw: "إلزام تغيير كلمة المرور عند أول تسجيل دخول",
        users_access_permissions: "الصلاحيات والأذونات",
        users_access_sub: "حدد مستوى الوصول المناسب لهذا المستخدم. الصلاحيات تراكمية بناءً على الدور المختار.",
        users_role_faculty: "عضو هيئة تدريس (Faculty)",
        users_role_faculty_desc: "وصول أساسي لرفع المواد الدراسية واستعراض مستودع الكلية.",
        users_role_dept_mgr: "مدير قسم (Department Manager)",
        users_role_dept_mgr_desc: "صلاحيات كاملة على مستودع وكورسات قسمه الخاص. يتم تحديد الدور بناءً على القسم المختار من القائمة — مثال: ",
        users_select_dept_first: "اختر قسماً أولاً",
        users_role_supervisor: "مشرف عام (Supervisor)",
        users_role_supervisor_desc: "وصول كامل وشامل لجميع الأقسام، إدارة المستخدمين، وسجلات النظام.",
        users_system_note: "ملاحظة النظام",
        users_system_note_sub: "سيستلم المستخدم بريداً إلكترونياً تلقائياً يحتوي على تفاصيل الحساب بمجرد إنشائه.",
        // ===== Courses Page =====
        courses_page_title: "مستودع الكورسات الأكاديمية",
        courses_page_subtitle: "استكشف وادر المناهج الأكاديمية المعتمدة لكلية الهندسة وتكنولوجيا المعلومات.",
        courses_all_depts: "جميع الأقسام",
        courses_drafts: "المسودات",
        courses_upload_new: "رفع كورس جديد",
        courses_upload_sub: "قم بتوحيد المناهج الأكاديمية عن طريق إضافة كورسات جديدة لمستودع النظام.",
        courses_showing: "عرض",
        courses_of: "من أصل",
        courses_courses: "كورس",
        courses_load_more: "تحميل المزيد من الموارد",
        courses_lessons: "دروس",
        courses_no_found: "لا توجد كورسات متاحة في هذا القسم.",
        courses_public_title: "الكورسات والبرامج الأكاديمية",
        courses_public_sub: "تصفح المناهج والموارد الأكاديمية في كافة التخصصات التكنولوجية.",
        courses_search_placeholder: "ابحث عن الكورسات باسم الكورس أو الموضوع...",
        courses_dept_sidebar: "الأقسام والبرامج الأكاديمية",
        sidebar_heading: "الأقسام الأكاديمية",
        sidebar_browse: "تصفح الملفات حسب القسم",
        sidebar_browse_courses: "تصفح الكورسات حسب القسم",

        // ===== Create Course =====
        cc_title: "إنشاء كورس جديد",
        cc_preview: "وضع المعاينة",
        // ===== Create Course =====
        cc_header_title: "إضافة كورس أكاديمي جديد",
        cc_header_subtitle: "بناء المنهج الأكاديمي، رفع الدروس والفيديوهات، وضبط إعدادات الوصول.",
        cc_btn_cancel: "إلغاء",
        cc_btn_save_draft: "حفظ كمسودة",
        cc_btn_publish: "نشر الكورس",
        cc_course_title_label: "عنوان الكورس",
        cc_course_title_ph: "مثال: الميكانيكا التطبيقية والديناميكا الحرارية",
        cc_dept_label: "القسم الأكاديمي",
        cc_dept_select: "اختر القسم...",
        cc_program_label: "المستوى الأكاديمي / البرنامج",
        cc_program_select: "اختر المستوى...",
        cc_desc_label: "وصف الكورس",
        cc_desc_ph: "اكتب نبذة عن أهداف الكورس، المتطلبات المسبقة، ومخرجات التعلم...",
        cc_thumb_label: "صورة الكورس (Thumbnail)",
        cc_thumb_drop: "اضغط لرفع صورة الكورس (PNG, JPG)",
        cc_thumb_change: "اضغط لتغيير الصورة",
        cc_visibility_label: "إمكانية الظهور",
        cc_vis_public: "عام (الجميع)",
        cc_vis_students: "الطلاب المسجلين فقط",
        cc_vis_admin: "المشرفين فقط",
        cc_allow_guest_downloads: "السماح بالتحميل للزوار",
        cc_mode_title: "طريقة رفع المحتوى",
        cc_mode_bulk_title: "رفع فيديوهات دفعة واحدة",
        cc_mode_bulk_desc: "رفع عدة فيديوهات مرة واحدة وإعادة ترتيبها بالسحب والإفلات",
        cc_mode_lesson_title: "إنشاء درس بدرس",
        cc_mode_lesson_desc: "تنظيم المحتوى إلى دروس منفصلة تحتوي على فيديوهات وملفات",
        cc_bulk_drop_title: "اسحب وأسقط ملفات الكورس هنا أو اضغط للاختيار",
        cc_bulk_drop_sub: "يدعم MP4, MKV, AVI, PDF, ZIP (الحد الأقصى 2GB للملف)",
        cc_lesson_ph: "أدخل اسم الدرس...",
        cc_lesson_add_files: "إضافة ملفات لهذا الدرس",
        cc_lesson_title_def: "الدرس",
        cc_pkg_lessons: "دروس",
        cc_pkg_total: "الحجم الكلي",
        cc_pkg_modules: "وحدات",
        cc_course_title: "عنوان الكورس",
        cc_department: "القسم",
        cc_description: "الوصف",
        cc_modules: "وحدات الكورس",
        cc_add_module: "إضافة وحدة",
        cc_add_lesson: "إضافة درس",
        cc_module_title: "عنوان الوحدة",
        cc_lesson_title: "عنوان الدرس",
        cc_course_image: "صورة الكورس",
        cc_upload_image: "رفع صورة",
        cc_save: "حفظ الكورس",
        cc_cancel: "إلغاء",
        cc_select_dept: "اختر القسم...",
        cc_placeholder_title: "أدخل عنوان الكورس...",
        cc_placeholder_desc: "أدخل وصف الكورس...",

        // ===== Upload Resources =====
        upload_title: "رفع الموارد",
        upload_subtitle: "اختر وقم بتهيئة ملفات فيديو أو مستندات متعددة للكتالوج الأكاديمي.",
        upload_discard: "إلغاء المسودة",
        upload_start: "بدء الرفع",
        upload_uploading: "جاري الرفع...",
        upload_target_dept: "القسم المستهدف",
        upload_target_prog: "البرنامج المستهدف",
        upload_select_dept: "اختر القسم...",
        upload_select_prog: "اختر البرنامج...",
        upload_drag_drop: "اسحب وأفلت الملفات",
        upload_drag_desc: "ارفع ملفات .mp4، .pdf، .zip أو .docx. الحد الأقصى: 2 جيجابايت لكل ملف.",
        upload_select_files: "اختر ملفات من الجهاز",
        upload_dest_required: "الوجهة مطلوبة",
        upload_dest_desc: "يرجى اختيار القسم والبرنامج المستهدفين أعلاه لتفعيل الرفع.",
        upload_queue: "قائمة الملفات",
        upload_clear_all: "مسح الكل",
        upload_no_files: "لا توجد ملفات في القائمة. اسحب الملفات هنا أو اضغط \"اختر ملفات\".",
        upload_best_title: "أفضل ممارسات AITU",
        upload_best_desc: "تأكد من أن ملفات الفيديو تتضمن ترجمات لتوافق إمكانية الوصول. سيتم تحليل أسماء الملفات تلقائياً ولكن يمكن تعديلها يدوياً.",
        upload_lesson_title: "عنوان الدرس",
        upload_resource_title: "عنوان المورد",
        upload_failed: "فشل الرفع: انقطاع الشبكة",
        upload_waiting: "في انتظار الرفع...",
        upload_complete: "اكتملت جميع عمليات الرفع!",
        upload_assets: "جاري رفع ملفات الكورس...",
        upload_processed: "ملفات تمت معالجتها",
        upload_remaining: "متبقي",
        upload_success: "تم حفظ {count} ملف(ات) في المستودع بنجاح!",
        upload_confirm_discard: "هل أنت متأكد من إلغاء جميع عمليات الرفع؟",
        upload_enter_title: "أدخل العنوان...",
        upload_alert_dest: "يرجى اختيار القسم والبرنامج المستهدفين قبل رفع الملفات.",
        upload_alert_dest2: "يرجى التأكد من اختيار القسم والبرنامج المستهدفين.",
        upload_alert_title: "يرجى التأكد من أن جميع الملفات لها عنوان وقسم وبرنامج محدد قبل الحفظ.",

        // ===== 403 =====
        err_403_title: "403 محظور",
        err_403_desc: "ليس لديك صلاحية للوصول إلى هذه الصفحة.",
        err_403_back: "رجوع",

        // ===== Common =====
        common_confirm: "تأكيد",
        common_cancel: "إلغاء",
        common_save: "حفظ",
        common_delete: "حذف",
        common_edit: "تعديل",
        common_close: "إغلاق",
        common_search: "بحث",
        common_done: "تم",
        common_retry: "إعادة المحاولة"
    }
};

// ============================================
// Language Engine
// ============================================

const STORAGE_KEY = 'aitu_lang';

/** Get the currently saved language (default: 'en') */
export function getCurrentLang() {
    return localStorage.getItem(STORAGE_KEY) || 'en';
}

/** Apply a language to the entire page */
export function applyLanguage(lang) {
    const t = translations[lang];
    if (!t) return;

    // 1. Set dir and lang on <html>
    const html = document.documentElement;
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    html.setAttribute('lang', lang);

    // 2. Toggle RTL class on body
    document.body.classList.toggle('rtl', lang === 'ar');

    // 3. Translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key] !== undefined) {
            el.textContent = t[key];
        }
    });

    // 4. Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key] !== undefined) {
            el.setAttribute('placeholder', t[key]);
        }
    });

    // 5. Update lang toggle button text
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        const btnTextEl = langBtn.querySelector('.lang-btn-text');
        if (btnTextEl) {
            btnTextEl.textContent = t.lang_btn;
        }
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

    // Attach click handler to language toggle buttons (using onclick to prevent duplicate handlers)
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        langBtn.onclick = (e) => toggleLanguage(e);
    }
    const sidebarLangBtn = document.getElementById('sidebarLangBtn');
    if (sidebarLangBtn) {
        sidebarLangBtn.onclick = (e) => toggleLanguage(e);
    }
}

/** Returns department/specialization name as provided by API */
export function getDeptDisplayName(nameOrCode) {
    if (!nameOrCode) return '';
    return String(nameOrCode).trim();
}