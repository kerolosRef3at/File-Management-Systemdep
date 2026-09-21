// Domain Enums and Bilingual Localization Dictionary for EGC Ticketing System

export const UserRole = {
  Admin: 0,
  Manager: 1,
  Member: 2,
};

export const UserStatus = {
  Active: 0,
  Blocked: 1,
  Deleted: 2,
};

export const TeamStatus = {
  Active: 0,
  Pending: 1,
  Finished: 2,
  Deleted: 3,
};

export const TicketStatus = {
  NotAssigned: 0,
  Pending: 1,
  OnProgress: 2,
  Completed: 3,
  Deleted: 4,
};

export const TicketPriority = {
  Low: 0,
  Medium: 1,
  High: 2,
  Urgent: 3,
};

export const TicketTaskStatus = {
  NotAssigned: 0,
  Pending: 1,
  OnProgress: 2,
  Completed: 3,
  Approved: 4,
  Deleted: 5,
};

// Comprehensive Bilingual (Arabic / English) Dictionary
export const translations = {
  ar: {
    // General
    loading: 'جاري التحميل...',
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    cancel: 'إلغاء',
    delete: 'حذف',
    deleting: 'جاري الحذف...',
    edit: 'تعديل',
    create: 'إنشاء',
    creating: 'جاري الإنشاء...',
    actions: 'خيارات',
    confirm: 'تأكيد',
    back: 'رجوع',
    search: 'بحث...',
    all: 'الكل',
    reset: 'إعادة ضبط',
    noData: 'لا توجد بيانات متاحة حالياً من الخادم',
    errorOccurred: 'حدث خطأ أثناء الاتصال بالخادم',
    retry: 'إعادة المحاولة',
    close: 'إغلاق',
    required: 'هذا الحقل مطلوب',
    optional: 'اختياري',
    viewDetails: 'عرض التفاصيل',
    expand: 'تكبير الشاشة',
    collapse: 'تصغير',
    change: 'تغيير',
    assignedTo: 'المسند إليه',

    // Enums - Ticket Status
    statusNotAssigned: 'غير مسندة',
    statusPending: 'قيد الانتظار',
    statusOnProgress: 'قيد التنفيذ',
    statusCompleted: 'مكتملة',
    statusDeleted: 'محذوفة',

    // Enums - Ticket Priority
    priorityLow: 'منخفضة',
    priorityMedium: 'متوسطة',
    priorityHigh: 'عالية',
    priorityUrgent: 'عاجلة جداً',

    // Enums - Team Status
    teamStatusActive: 'نشط',
    teamStatusPending: 'معلق',
    teamStatusFinished: 'منتهي',

    // Enums - Task Status
    taskStatusNotAssigned: 'غير مسندة',
    taskStatusPending: 'قيد الانتظار',
    taskStatusOnProgress: 'قيد التنفيذ',
    taskStatusCompleted: 'مكتملة',
    taskStatusApproved: 'معتمدة',

    // Page 3: Tickets
    ticketsTitle: 'إدارة التذاكر والمهام',
    ticketsSubtitle: 'تتبع ومراقبة وإسناد أوامر العمل وطلبات الدعم الفني',
    newTicket: 'إنشاء تذكرة جديدة',
    viewTable: 'قائمة جدولية',
    viewKanban: 'لوحة كانبان',
    viewGrid: 'شبكة البطاقات',
    viewList: 'قائمة سريعة',
    viewGrouped: 'مجمعة بالفرق',
    viewCalendar: 'التقويم',
    calendarToday: 'اليوم',
    calendarMonth: 'شهر',
    calendarPrevMonth: 'الشهر السابق',
    calendarNextMonth: 'الشهر التالي',
    calendarShowSubtasks: 'إظهار المهام الفرعية بالتقويم',
    calendarHideSubtasks: 'إخفاء المهام الفرعية',
    calendarItemsOnDay: 'عناصر هذا اليوم',
    calendarTotalScheduled: 'إجمالي المجدول',
    calendarTicketsCount: 'تذاكر',
    calendarSubtasksCount: 'مهام فرعية',
    calendarNoEvents: 'لا توجد تذاكر أو مهام مجدولة في هذا اليوم',
    quickFilterAll: 'جميع التذاكر',
    quickFilterMine: 'مسندة إليّ',
    quickFilterUnassigned: 'غير مسندة',
    quickFilterUrgent: 'عاجلة ومتأخرة',
    quickFilterActive: 'قيد التنفيذ',
    quickFilterCompleted: 'المكتملة',
    sortByLabel: 'الترتيب:',
    sortNewest: 'الأحدث أولاً',
    sortOldest: 'الأقدم أولاً',
    sortPriority: 'الأعلى أولوية',
    sortDeadline: 'الأقرب موعداً',
    sortTitle: 'العنوان (أبجدياً)',
    clearSearch: 'مسح',
    resultsFound: 'تذكرة مطابقة',
    ticketId: 'رقم التذكرة',
    ticketSubject: 'عنوان التذكرة',
    ticketTeam: 'فريق العمل',
    ticketAssignee: 'المسند إليه',
    ticketDeadline: 'الموعد النهائي',
    ticketPriority: 'الأولوية',
    ticketStatus: 'الحالة',
    searchTicketsPlaceholder: 'بحث برقم التذكرة أو العنوان أو الوصف أو اسم العضو...',
    allTeams: 'جميع الفرق',
    allStatuses: 'جميع الحالات',
    allPriorities: 'جميع الأولويات',
    ticketsCount: 'تذكرة',
    overdue: 'متأخرة عن الموعد',
    dueSoon: 'تقترب من الموعد',
    dueOnTime: 'ضمن الموعد',
    noTicketsFound: 'لم يتم العثور على أي تذاكر مطابقة للمعايير المحددة',
    unassignedMember: 'غير مسند',
    subtasksCompleted: 'مهام فرعية منجزة',
    advanceStatus: 'نقل إلى الحالة التالية',

    // New Ticket Modal
    createTicketTitle: 'إنشاء تذكرة جديدة',
    createTicketSubtitle: 'إسناد تذكرة جديدة لأحد فرق العمل ومتابعة إنجازها',
    selectTeamPrompt: 'اختر الفريق المعني...',
    selectMemberPrompt: 'اختر العضو المكلف (اختياري)...',
    titleLabel: 'عنوان المشكلة أو الطلب',
    titlePlaceholder: 'مثال: عطل في وحدة التحكم لمحطة الخلط 2',
    descriptionLabel: 'التفاصيل والوصف',
    descriptionPlaceholder: 'اكتب وصفاً دقيقاً للمشكلة أو المهمة المطلوبة...',
    deadlineLabel: 'الموعد الأقصى للحل (Deadline)',
    priorityLabel: 'درجة الأولوية',

    // Page 4: Ticket Details Drawer
    ticketDetails: 'تفاصيل التذكرة',
    createdAt: 'تاريخ الإنشاء',
    createdBy: 'أنشئت بواسطة',
    completedAt: 'تاريخ الإكمال',
    daysRemaining: 'متبقي',
    daysOverdue: 'متأخرة بـ',
    quickStatusTransition: 'تحديث حالة التذكرة:',
    startWork: 'بدء العمل',
    completeTicket: 'إكمال التذكرة',
    customStatusChange: 'تغيير الحالة مع مرفقات...',
    tabsOverview: 'البيانات والمهام الفرعية',
    tabsHistory: 'سجل العمليات والرقابة',
    subtasksSectionTitle: 'المهام الفرعية المرتبطة',
    addSubtask: 'إضافة مهمة فرعية',
    noSubtasks: 'لا توجد مهام فرعية مضافة لهذه التذكرة',
    changeTaskStatus: 'تحديث حالة المهمة',
    auditTimelineTitle: 'سجل التغييرات والحركات',
    noHistory: 'لا توجد حركات مسجلة حتى الآن',
    changedBy: 'تم التغيير بواسطة',
    commentLabel: 'الملاحظات والتعليق',
    attachmentFile: 'الملف المرفق',
    downloadFile: 'تحميل المرفق',
    externalLink: 'رابط خارجي',

    // Status Change Modal
    updateStatusTitle: 'تحديث حالة التذكرة',
    newStatusLabel: 'الحالة الجديدة',
    commentPlaceholder: 'أضف أي ملاحظات أو تقرير موجز عن سبب تغيير الحالة...',
    linkUrlLabel: 'رابط خارجي مرجعي (اختياري)',
    fileUploadLabel: 'مرفق (تقرير، صورة، ملف PDF - أقصى حد 5 ميجابايت)',
    fileSizeExceeded: 'حجم الملف يتجاوز الحد الأقصى المسموح به (5 ميجابايت)',
    addAnotherTaskToggle: 'إضافة مهمة فرعية متابعة؟',
    followUpTaskTitle: 'عنوان المهمة الفرعية المتابعة',
    followUpTaskDesc: 'وصف المهمة الفرعية',
    followUpTaskDeadline: 'الموعد النهائي للمهمة',
    followUpTaskMember: 'المكلف بالمهمة',
    followUpTaskPriority: 'أولوية المهمة',

    // New Subtask Modal
    createSubtaskTitle: 'إضافة مهمة فرعية جديدة',
    editSubtaskTitle: 'تعديل المهمة الفرعية وتغيير المكلف بها',
    subtaskTitleLabel: 'عنوان المهمة الفرعية',
    subtaskAssigneeLabel: 'تعيين العضو المكلف بالمهمة',
    editTicket: 'تعديل التذكرة',
    editTicketSubtitle: 'تحديث بيانات التذكرة وتغيير العضو المكلف بها',
    ticketCreatedEvent: 'تأسيس وإنشاء التذكرة',
    taskCreatedEvent: 'إنشاء مهمة فرعية',
    ticketCreatedLog: 'سجل تأسيس التذكرة والمهام المرتبطة',
    assignedToLabel: 'المكلف:',
    createdByLabel: 'المنشئ:',
    deleteTicketTitle: 'حذف التذكرة',
    deleteTicketConfirm: 'هل أنت متأكد من حذف هذه التذكرة؟ سيتم نقلها إلى سلة المحذوفات.',
    deleteTaskTitle: 'حذف المهمة الفرعية',
    deleteTaskConfirm: 'هل أنت متأكد من حذف هذه المهمة الفرعية؟',
    subtaskDeletedAction: 'حذف مهمة فرعية',
    auditNoteAction: 'ملاحظة وتحديث',
    subtaskDetailsTitle: 'تفاصيل المهمة الفرعية',
    subtaskDetailsSubtitle: 'بيانات المهمة والمسند إليه وسجل العمليات والحركات',
    subtaskHistoryTitle: 'سجل حركات المهمة الفرعية',
    noSubtaskHistory: 'لا توجد حركات أو تغييرات مسجلة لهذه المهمة حتى الآن',
    parentTicket: 'التذكرة المرتبطة',
    pageNotFound: 'الصفحة غير موجودة (404)',
    pageNotFoundDesc: 'عذراً، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.',
    backToTickets: 'العودة إلى قائمة التذاكر',
    backToDashboard: 'العودة إلى لوحة التحكم',

    // Page 5: Teams Management
    teamsTitle: 'فرق العمل والأقسام',
    teamsSubtitle: 'تنظيم وتوزيع الصلاحيات وفرق العمل وقادة المجموعات',
    newTeam: 'إنشاء فريق جديد',
    teamsCount: 'فريق',
    teamLeaderBadge: 'قائد الفريق',
    noTeamLeader: 'لم يعين قائد بعد',
    membersCount: 'أعضاء',
    activeTicketsCount: 'تذكرة نشطة',
    manageMembers: 'إدارة الأعضاء',
    editTeam: 'تعديل الفريق',
    deleteTeam: 'حذف الفريق',
    deleteTeamConfirm: 'هل أنت متأكد من حذف هذا الفريق؟ سيتم تعطيله في النظام.',
    searchTeamsPlaceholder: 'بحث باسم الفريق أو اسم القائد...',
    noTeamsFound: 'لا توجد فرق عمل مسجلة حالياً',

    // Team Members Modal
    teamMembersTitle: 'أعضاء فريق العمل',
    memberName: 'العضو',
    memberEmail: 'البريد الإلكتروني',
    memberRoleInTeam: 'الصفة في الفريق',
    roleLeader: 'قائد الفريق ⭐',
    roleMember: 'عضو',
    dateJoined: 'تاريخ الانضمام',
    setAsLeader: 'تعيين كقائد',
    removeFromTeam: 'إزالة من الفريق',
    removeConfirm: 'هل أنت متأكد من إزالة هذا العضو من الفريق؟',
    addNewMemberTitle: 'إضافة عضو جديد للفريق',
    selectUserPrompt: 'اختر مستخدماً من الدليل...',
    addMemberBtn: 'إضافة للفريق',
    noAvailableUsers: 'جميع المستخدمين الحاليين مسجلون بالفعل في هذا الفريق',

    // New Team Modal
    createTeamTitle: 'إنشاء فريق عمل جديد',
    editTeamTitle: 'تعديل بيانات الفريق',
    teamNameLabel: 'اسم الفريق / القسم',
    teamNamePlaceholder: 'مثال: فريق الدعم والتشغيل الميداني',
    teamDescLabel: 'وصف الفريق والمهام',
    teamDescPlaceholder: 'تحديد نطاق عمل ومسؤوليات هذا الفريق...',
    teamStatusLabel: 'حالة الفريق',

    // ── Ratings Page ──
    ratingsTitle: 'تقييمات الأداء والجودة',
    ratingsSubtitle: 'متابعة التقييمات الواردة والصادرة واعتماد التقييمات المعلقة',
    submitNewRating: 'إرسال تقييم جديد',
    tabMyRatings: 'تقييماتي والتقييمات الواردة',
    tabPendingApprovals: 'التقييمات المعلقة للاعتماد',
    tabAllRatings: 'جميع التقييمات',
    myAverageScore: 'متوسط تقييمك',
    ratingsReceivedCount: 'تقييم واردة',
    evaluator: 'المُقيِّم',
    evaluatedUser: 'المُقيَّم',
    evaluatedOn: 'بتاريخ',
    generalComment: 'ملاحظة عامة',
    criteriaScores: 'تفاصيل التقييم',
    approveRating: 'اعتماد التقييم',
    rejectRating: 'رفض وحذف التقييم',
    approvalCommentLabel: 'ملاحظة الاعتماد (اختياري)',
    approvalCommentPlaceholder: 'أضف ملاحظة عند اعتماد التقييم...',
    rejectConfirmTitle: 'رفض وحذف التقييم',
    rejectConfirmMessage: 'هل أنت متأكد من رفض هذا التقييم؟ سيتم حذفه نهائياً ولا يمكن التراجع عن هذا الإجراء.',
    noRatingsFound: 'لا توجد تقييمات لعرضها حالياً',
    noPendingRatings: 'لا توجد تقييمات بانتظار الاعتماد حالياً',
    submitRatingTitle: 'إرسال تقييم جديد',
    editRatingTitle: 'تعديل التقييم',
    targetUserLabel: 'المستخدم المراد تقييمه',
    targetUserPlaceholder: 'ابحث واختر مستخدماً...',
    generalCommentLabel: 'ملاحظة عامة',
    generalCommentPlaceholder: 'اكتب ملاحظتك العامة حول الأداء...',
    ratingItemsLabel: 'معايير التقييم',
    addCriteriaItem: '+ إضافة معيار مخصص',
    criteriaTitlePlaceholder: 'اسم المعيار (مثال: الالتزام بالمواعيد)',
    removeCriteriaItem: 'إزالة',
    submitRatingBtn: 'إرسال التقييم',
    submittingRating: 'جاري الإرسال...',
    ratingSubmittedAutoApproved: '✅ تم إرسال التقييم واعتماده تلقائياً',
    ratingSubmittedPending: '✅ تم إرسال التقييم، بانتظار اعتماد المدير/قائد الفريق',
    ratingApprovedSuccess: 'تم اعتماد التقييم بنجاح',
    ratingRejectedSuccess: 'تم رفض وحذف التقييم بنجاح',
    ratingUpdatedSuccess: '✅ تم حفظ التعديلات على التقييم',
    ratingDeletedSuccess: 'تم حذف التقييم بنجاح',
    deleteRatingConfirmMessage: 'هل أنت متأكد من حذف هذا التقييم نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.',
    editableOnlyWhilePending: 'يمكن التعديل أو الحذف فقط قبل اعتماد التقييم',
    from: 'من',
    to: 'إلى',
    ratingType: 'النوع',
    standardType: 'قياسي (معتمد تلقائياً)',
    reportType: 'يتطلب موافقة',
    approvedStatus: 'معتمد',
    pendingApprovalStatus: 'بانتظار الاعتماد',
    score: 'الدرجة',
    outOf: 'من',
    pendingBadgeCount: 'بانتظار الاعتماد',
    defaultCriteriaSpeed: 'سرعة الإنجاز',
    defaultCriteriaQuality: 'جودة العمل',
    defaultCriteriaCommunication: 'التعاون والتواصل',
    searchRatingsPlaceholder: 'بحث بالاسم أو الملاحظة...',
    approvedByLabel: 'اعتمدها',
    ratingComment: 'التعليق',
    attachmentLabel: 'إرفاق ملف (اختياري)',
    attachmentHint: 'يمكنك إرفاق صورة أو مستند كدليل، مفيد خصوصًا عند الإبلاغ عن سلوك غير لائق. الحد الأقصى 10 ميجابايت (jpg, png, pdf, doc, docx).',
    attachFileBtn: 'اختيار ملف',
    viewAttachment: 'عرض المرفق',

    // ── Logs Page ──
    logsTitle: 'سجل العمليات والرقابة',
    logsSubtitle: 'تتبع كل الحركات والتغييرات الأمنية وعمليات النظام',
    filterByAction: 'نوع العملية',
    filterByEntity: 'الكيان المتأثر',
    filterByUser: 'المستخدم',
    fromDateLabel: 'من تاريخ',
    toDateLabel: 'إلى تاريخ',
    actionLogin: 'تسجيل دخول',
    actionCreate: 'إنشاء',
    actionUpdate: 'تعديل',
    actionDelete: 'حذف',
    actionStatusChange: 'تغيير حالة',
    actionApprove: 'اعتماد',
    entityUser: 'مستخدم',
    entityTeam: 'فريق',
    entityTicket: 'تذكرة',
    entityTicketTask: 'مهمة فرعية',
    entityUserRate: 'تقييم',
    timestamp: 'التوقيت',
    responsibleUser: 'المستخدم المسؤول',
    affectedEntity: 'الكيان المتأثر',
    logDetailsTitle: 'تفاصيل الحركة',
    fullDetailsLabel: 'الوصف الكامل',
    noLogsFound: 'لا توجد سجلات مطابقة لعوامل التصفية المحددة',
    totalLogsCount: 'إجمالي السجلات',
    loadMore: 'تحميل المزيد',
    loadingMore: 'جاري التحميل...',
    systemUser: 'النظام',
    entityIdLabel: 'المعرّف',
    usernameLabel: 'اسم المستخدم',
    dateRangeLabel: 'الفترة الزمنية',
    entityFilterHint: '"الكيان المتأثر" يعني نوع البيانات اللي اتغيرت في العملية (مستخدم، فريق، عضوية فريق، تذكرة، مهمة فرعية، أو تقييم) — مش اسم أو رقم شخص معيّن. الرقم بعد # هو معرّف السجل في قاعدة البيانات.',
    entityTeamMember: 'عضوية فريق',
    teamMemberIdFormat: 'فريق #{team}، عضو #{member}',

    // ── Profile Page ──
    profileTitle: 'الملف الشخصي والتوقيع',
    profileSubtitle: 'إدارة بياناتك الشخصية والتوقيع الرقمي وكلمة المرور',
    personalInfoCard: 'البيانات الشخصية والتوقيع',
    securityCard: 'الأمان وتغيير كلمة المرور',
    fullNameLabel: 'الاسم الكامل',
    emailLabel: 'البريد الإلكتروني',
    phoneLabel: 'رقم الهاتف',
    jobTitleLabel: 'المسمى الوظيفي',
    signatureLabel: 'التوقيع الرقمي',
    currentSignature: 'التوقيع الحالي',
    noSignatureUploaded: 'لم يتم رفع توقيع بعد',
    uploadSignature: 'رفع توقيع',
    changeSignature: 'تغيير التوقيع',
    saveChangesBtn: 'حفظ التعديلات',
    savingChanges: 'جاري الحفظ...',
    profileUpdatedSuccess: '✅ تم تحديث البيانات بنجاح',
    currentPasswordLabel: 'كلمة المرور الحالية',
    newPasswordLabel: 'كلمة المرور الجديدة',
    confirmNewPasswordLabel: 'تأكيد كلمة المرور الجديدة',
    updatePasswordBtn: 'تحديث كلمة المرور',
    updatingPassword: 'جاري التحديث...',
    passwordUpdatedSuccess: '✅ تم تحديث كلمة المرور بنجاح',
    passwordMismatchError: 'كلمتا المرور الجديدتان غير متطابقتين',
    passwordTooShortError: 'يجب ألا تقل كلمة المرور عن 6 أحرف',
    accountCreatedOn: 'تاريخ إنشاء الحساب',
    createdByLabel: 'أُنشئ بواسطة',
    roleLabelText: 'الدور الوظيفي',
    statusLabelText: 'الحالة',
    usernameFieldLabel: 'اسم المستخدم',
    securityTipsTitle: 'نصائح لأمان حسابك',
    securityTip1: 'استخدم كلمة مرور فريدة لا تستخدمها في أي موقع آخر.',
    securityTip2: 'امزج بين حروف كبيرة وصغيرة وأرقام ورموز لزيادة قوة كلمة المرور.',
    securityTip3: 'لا تشارك بيانات الدخول الخاصة بك مع أي شخص آخر، حتى لو كان زميلاً.',
  },
  en: {
    // General
    loading: 'Loading...',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    delete: 'Delete',
    deleting: 'Deleting...',
    edit: 'Edit',
    create: 'Create',
    creating: 'Creating...',
    actions: 'Actions',
    confirm: 'Confirm',
    back: 'Back',
    search: 'Search...',
    all: 'All',
    reset: 'Reset',
    noData: 'No data currently available from server',
    errorOccurred: 'An error occurred while connecting to the server',
    retry: 'Retry',
    close: 'Close',
    required: 'This field is required',
    optional: 'Optional',
    viewDetails: 'View Details',
    expand: 'Expand Screen',
    collapse: 'Collapse',
    change: 'Change',
    assignedTo: 'Assigned To',

    // Enums - Ticket Status
    statusNotAssigned: 'Not Assigned',
    statusPending: 'Pending',
    statusOnProgress: 'In Progress',
    statusCompleted: 'Completed',
    statusDeleted: 'Deleted',

    // Enums - Ticket Priority
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',

    // Enums - Team Status
    teamStatusActive: 'Active',
    teamStatusPending: 'Pending',
    teamStatusFinished: 'Finished',

    // Enums - Task Status
    taskStatusNotAssigned: 'Not Assigned',
    taskStatusPending: 'Pending',
    taskStatusOnProgress: 'In Progress',
    taskStatusCompleted: 'Completed',
    taskStatusApproved: 'Approved',

    // Page 3: Tickets
    ticketsTitle: 'Tickets & Tasks Management',
    ticketsSubtitle: 'Track, monitor, and assign maintenance work orders and support requests',
    newTicket: 'New Ticket',
    viewTable: 'Table View',
    viewKanban: 'Kanban Board',
    viewGrid: 'Cards Grid',
    viewList: 'Compact List',
    viewGrouped: 'By Team',
    viewCalendar: 'Calendar',
    calendarToday: 'Today',
    calendarMonth: 'Month',
    calendarPrevMonth: 'Previous Month',
    calendarNextMonth: 'Next Month',
    calendarShowSubtasks: 'Show Subtasks in Calendar',
    calendarHideSubtasks: 'Hide Subtasks',
    calendarItemsOnDay: 'Items on this day',
    calendarTotalScheduled: 'Total scheduled',
    calendarTicketsCount: 'tickets',
    calendarSubtasksCount: 'subtasks',
    calendarNoEvents: 'No tickets or subtasks scheduled on this day',
    quickFilterAll: 'All Tickets',
    quickFilterMine: 'Assigned to Me',
    quickFilterUnassigned: 'Unassigned',
    quickFilterUrgent: 'Urgent & Overdue',
    quickFilterActive: 'In Progress',
    quickFilterCompleted: 'Completed',
    sortByLabel: 'Sort by:',
    sortNewest: 'Newest First',
    sortOldest: 'Oldest First',
    sortPriority: 'Highest Priority',
    sortDeadline: 'Nearest Due Date',
    sortTitle: 'Title (A-Z)',
    clearSearch: 'Clear',
    resultsFound: 'tickets found',
    ticketId: 'Ticket ID',
    ticketSubject: 'Subject',
    ticketTeam: 'Team',
    ticketAssignee: 'Assignee',
    ticketDeadline: 'Deadline',
    ticketPriority: 'Priority',
    ticketStatus: 'Status',
    searchTicketsPlaceholder: 'Search by ID, title, description, or assignee...',
    allTeams: 'All Teams',
    allStatuses: 'All Statuses',
    allPriorities: 'All Priorities',
    ticketsCount: 'Tickets',
    overdue: 'Overdue',
    dueSoon: 'Due Soon',
    dueOnTime: 'On Schedule',
    noTicketsFound: 'No tickets matched the selected criteria',
    unassignedMember: 'Unassigned',
    subtasksCompleted: 'subtasks done',
    advanceStatus: 'Move to next status',

    // New Ticket Modal
    createTicketTitle: 'Create New Ticket',
    createTicketSubtitle: 'Assign a new work ticket to a team and track its progress',
    selectTeamPrompt: 'Select designated team...',
    selectMemberPrompt: 'Select assignee (optional)...',
    titleLabel: 'Ticket Title / Subject',
    titlePlaceholder: 'e.g. Pressure sensor fault in Plant 2',
    descriptionLabel: 'Description & Details',
    descriptionPlaceholder: 'Write a comprehensive description of the issue...',
    deadlineLabel: 'Target Resolution Deadline',
    priorityLabel: 'Priority Level',

    // Page 4: Ticket Details Drawer
    ticketDetails: 'Ticket Details',
    createdAt: 'Created At',
    createdBy: 'Created By',
    completedAt: 'Completed At',
    daysRemaining: 'left',
    daysOverdue: 'overdue by',
    quickStatusTransition: 'Update Status:',
    startWork: 'Start Work',
    completeTicket: 'Complete Ticket',
    customStatusChange: 'Change Status & Attach File...',
    tabsOverview: 'Details & Subtasks',
    tabsHistory: 'Audit History & Log',
    subtasksSectionTitle: 'Associated Subtasks',
    addSubtask: 'Add Subtask',
    noSubtasks: 'No subtasks attached to this ticket',
    changeTaskStatus: 'Update Task Status',
    auditTimelineTitle: 'Audit Trail & Transitions',
    noHistory: 'No status changes recorded yet',
    changedBy: 'Changed By',
    commentLabel: 'Notes / Comments',
    attachmentFile: 'Attached File',
    downloadFile: 'Download Attachment',
    externalLink: 'External Reference Link',

    // Status Change Modal
    updateStatusTitle: 'Update Ticket Status',
    newStatusLabel: 'Target Status',
    commentPlaceholder: 'Add transition notes or a brief summary...',
    linkUrlLabel: 'External Link URL (optional)',
    fileUploadLabel: 'Attachment (report, screenshot, PDF - max 5MB)',
    fileSizeExceeded: 'File size exceeds maximum permitted limit (5MB)',
    addAnotherTaskToggle: 'Add a follow-up subtask?',
    followUpTaskTitle: 'Follow-up Subtask Title',
    followUpTaskDesc: 'Subtask Description',
    followUpTaskDeadline: 'Subtask Deadline',
    followUpTaskMember: 'Subtask Assignee',
    followUpTaskPriority: 'Subtask Priority',

    // New Subtask Modal
    createSubtaskTitle: 'Add New Subtask',
    editSubtaskTitle: 'Edit Subtask & Assignee',
    subtaskTitleLabel: 'Subtask Title',
    subtaskAssigneeLabel: 'Assign Member to Subtask',
    editTicket: 'Edit Ticket',
    editTicketSubtitle: 'Update ticket details and change assigned member',
    ticketCreatedEvent: 'Ticket Creation Origin',
    taskCreatedEvent: 'Subtask Created',
    ticketCreatedLog: 'Ticket & Associated Tasks Creation Audit',
    assignedToLabel: 'Assigned To:',
    createdByLabel: 'Created By:',
    deleteTicketTitle: 'Delete Ticket',
    deleteTicketConfirm: 'Are you sure you want to delete this ticket? It will be moved to trash.',
    deleteTaskTitle: 'Delete Subtask',
    deleteTaskConfirm: 'Are you sure you want to delete this subtask?',
    subtaskDeletedAction: 'Subtask Deleted',
    auditNoteAction: 'Note & Update',
    subtaskDetailsTitle: 'Subtask Details',
    subtaskDetailsSubtitle: 'Subtask specifications, assignee, and audit history',
    subtaskHistoryTitle: 'Subtask Audit History',
    noSubtaskHistory: 'No status transitions recorded for this subtask yet',
    parentTicket: 'Parent Ticket',
    pageNotFound: 'Page Not Found (404)',
    pageNotFoundDesc: 'Sorry, the page you are looking for does not exist or has been moved.',
    backToTickets: 'Back to Tickets',
    backToDashboard: 'Back to Dashboard',

    // Page 5: Teams Management
    teamsTitle: 'Teams & Departments',
    teamsSubtitle: 'Manage teams, assign responsibilities, and designate team leaders',
    newTeam: 'Create New Team',
    teamsCount: 'Teams',
    teamLeaderBadge: 'Team Leader',
    noTeamLeader: 'No Leader Assigned',
    membersCount: 'members',
    activeTicketsCount: 'active tickets',
    manageMembers: 'Manage Members',
    editTeam: 'Edit Team',
    deleteTeam: 'Delete Team',
    deleteTeamConfirm: 'Are you sure you want to delete this team? It will be archived.',
    searchTeamsPlaceholder: 'Search by team name or leader...',
    noTeamsFound: 'No teams currently registered in system',

    // Team Members Modal
    teamMembersTitle: 'Team Members',
    memberName: 'Member',
    memberEmail: 'Email',
    memberRoleInTeam: 'Role in Team',
    roleLeader: 'Team Leader ⭐',
    roleMember: 'Member',
    dateJoined: 'Joined Date',
    setAsLeader: 'Set as Leader',
    removeFromTeam: 'Remove from Team',
    removeConfirm: 'Are you sure you want to remove this member from the team?',
    addNewMemberTitle: 'Add New Member to Team',
    selectUserPrompt: 'Select a user from directory...',
    addMemberBtn: 'Add to Team',
    noAvailableUsers: 'All active users are already members of this team',

    // New Team Modal
    createTeamTitle: 'Create New Team',
    editTeamTitle: 'Edit Team Details',
    teamNameLabel: 'Team / Department Name',
    teamNamePlaceholder: 'e.g. Field Operations & Support',
    teamDescLabel: 'Description & Scope',
    teamDescPlaceholder: 'Define the scope and responsibilities of this team...',
    teamStatusLabel: 'Team Status',

    // ── Ratings Page ──
    ratingsTitle: 'Performance Ratings & Feedback',
    ratingsSubtitle: 'Track received/given ratings and approve pending evaluations',
    submitNewRating: 'Submit New Rating',
    tabMyRatings: 'My Ratings / Received',
    tabPendingApprovals: 'Pending Approvals',
    tabAllRatings: 'All Ratings',
    myAverageScore: 'Your Average Score',
    ratingsReceivedCount: 'ratings received',
    evaluator: 'Evaluator',
    evaluatedUser: 'Evaluated User',
    evaluatedOn: 'on',
    generalComment: 'General Comment',
    criteriaScores: 'Criteria Scores',
    approveRating: 'Approve',
    rejectRating: 'Reject & Delete',
    approvalCommentLabel: 'Approval Comment (optional)',
    approvalCommentPlaceholder: 'Add a note when approving this rating...',
    rejectConfirmTitle: 'Reject & Delete Rating',
    rejectConfirmMessage: 'Are you sure you want to reject this rating? It will be permanently deleted and this cannot be undone.',
    noRatingsFound: 'No ratings to display right now',
    noPendingRatings: 'No ratings are currently pending approval',
    submitRatingTitle: 'Submit New Rating',
    editRatingTitle: 'Edit Rating',
    targetUserLabel: 'User to Rate',
    targetUserPlaceholder: 'Search and select a user...',
    generalCommentLabel: 'General Comment',
    generalCommentPlaceholder: 'Write your general feedback on performance...',
    ratingItemsLabel: 'Rating Criteria',
    addCriteriaItem: '+ Add Custom Criteria',
    criteriaTitlePlaceholder: 'Criteria name (e.g. Punctuality)',
    removeCriteriaItem: 'Remove',
    submitRatingBtn: 'Submit Rating',
    submittingRating: 'Submitting...',
    ratingSubmittedAutoApproved: '✅ Rating submitted and auto-approved',
    ratingSubmittedPending: '✅ Rating submitted, pending manager/team leader approval',
    ratingApprovedSuccess: 'Rating approved successfully',
    ratingRejectedSuccess: 'Rating rejected and deleted successfully',
    ratingUpdatedSuccess: '✅ Rating changes saved',
    ratingDeletedSuccess: 'Rating deleted successfully',
    deleteRatingConfirmMessage: 'Are you sure you want to permanently delete this rating? This cannot be undone.',
    editableOnlyWhilePending: 'Can only be edited or deleted before it\u2019s approved',
    from: 'From',
    to: 'To',
    ratingType: 'Type',
    standardType: 'Standard (auto-approved)',
    reportType: 'Requires Approval',
    approvedStatus: 'Approved',
    pendingApprovalStatus: 'Pending Approval',
    score: 'Score',
    outOf: 'of',
    pendingBadgeCount: 'pending approval',
    defaultCriteriaSpeed: 'Speed of Completion',
    defaultCriteriaQuality: 'Quality of Work',
    defaultCriteriaCommunication: 'Teamwork & Communication',
    searchRatingsPlaceholder: 'Search by name or comment...',
    approvedByLabel: 'Approved by',
    ratingComment: 'Comment',
    attachmentLabel: 'Attach a File (optional)',
    attachmentHint: 'Attach an image or document as evidence — especially useful when reporting misconduct. Max 10 MB (jpg, png, pdf, doc, docx).',
    attachFileBtn: 'Choose File',
    viewAttachment: 'View Attachment',

    // ── Logs Page ──
    logsTitle: 'Audit Logs',
    logsSubtitle: 'Track all security-related changes and system operations',
    filterByAction: 'Action Type',
    filterByEntity: 'Affected Entity',
    filterByUser: 'User',
    fromDateLabel: 'From Date',
    toDateLabel: 'To Date',
    actionLogin: 'Login',
    actionCreate: 'Create',
    actionUpdate: 'Update',
    actionDelete: 'Delete',
    actionStatusChange: 'Status Change',
    actionApprove: 'Approve',
    entityUser: 'User',
    entityTeam: 'Team',
    entityTicket: 'Ticket',
    entityTicketTask: 'Ticket Task',
    entityUserRate: 'User Rate',
    timestamp: 'Timestamp',
    responsibleUser: 'Responsible User',
    affectedEntity: 'Affected Entity',
    logDetailsTitle: 'Log Details',
    fullDetailsLabel: 'Full Details',
    noLogsFound: 'No logs match the selected filters',
    totalLogsCount: 'Total Logs',
    loadMore: 'Load More',
    loadingMore: 'Loading...',
    systemUser: 'System',
    entityIdLabel: 'Entity ID',
    usernameLabel: 'Username',
    dateRangeLabel: 'Date Range',
    entityFilterHint: '"Affected Entity" is the type of record the action changed (User, Team, Team Membership, Ticket, Ticket Task, or Rating) — not a specific person\u2019s name or ID. The number after # is that record\u2019s ID in the database.',
    entityTeamMember: 'Team Membership',
    teamMemberIdFormat: 'Team #{team}, Member #{member}',

    // ── Profile Page ──
    profileTitle: 'My Profile & Digital Signature',
    profileSubtitle: 'Manage your personal information, digital signature, and password',
    personalInfoCard: 'Personal Info & Signature',
    securityCard: 'Security & Password',
    fullNameLabel: 'Full Name',
    emailLabel: 'Email Address',
    phoneLabel: 'Phone Number',
    jobTitleLabel: 'Job Title',
    signatureLabel: 'Digital Signature',
    currentSignature: 'Current Signature',
    noSignatureUploaded: 'No signature uploaded yet',
    uploadSignature: 'Upload Signature',
    changeSignature: 'Change Signature',
    saveChangesBtn: 'Save Changes',
    savingChanges: 'Saving...',
    profileUpdatedSuccess: '✅ Profile updated successfully',
    currentPasswordLabel: 'Current Password',
    newPasswordLabel: 'New Password',
    confirmNewPasswordLabel: 'Confirm New Password',
    updatePasswordBtn: 'Update Password',
    updatingPassword: 'Updating...',
    passwordUpdatedSuccess: '✅ Password updated successfully',
    passwordMismatchError: 'New passwords do not match',
    passwordTooShortError: 'Password must be at least 6 characters',
    accountCreatedOn: 'Account Created On',
    createdByLabel: 'Created By',
    roleLabelText: 'Role',
    statusLabelText: 'Status',
    usernameFieldLabel: 'Username',
    securityTipsTitle: 'Tips to keep your account secure',
    securityTip1: 'Use a unique password you don\u2019t reuse on any other site.',
    securityTip2: 'Mix uppercase, lowercase, numbers, and symbols for a stronger password.',
    securityTip3: 'Never share your login credentials with anyone, even a colleague.',
  },
};

// Helper to normalize status values from string or number
export function normalizeTicketStatus(status) {
  if (status === 0 || status === '0' || status === 'NotAssigned' || status === 'Unassigned' || status === 'unassigned') return 'NotAssigned';
  if (status === 1 || status === '1' || status === 'Pending') return 'Pending';
  if (status === 2 || status === '2' || status === 'OnProgress') return 'OnProgress';
  if (status === 3 || status === '3' || status === 'Completed') return 'Completed';
  if (status === 4 || status === '4' || status === 'Deleted') return 'Deleted';
  return 'NotAssigned';
}

export function normalizeTicketPriority(priority) {
  if (priority === 0 || priority === '0' || priority === 'Low' || priority === 'low') return 'Low';
  if (priority === 1 || priority === '1' || priority === 'Medium' || priority === 'medium') return 'Medium';
  if (priority === 2 || priority === '2' || priority === 'High' || priority === 'high') return 'High';
  if (priority === 3 || priority === '3' || priority === 'Urgent' || priority === 'urgent' || priority === 'critical' || priority === 'Critical') return 'Urgent';
  return 'Medium';
}

export function normalizeTeamStatus(status) {
  if (status === 0 || status === '0' || status === 'Active') return 'Active';
  if (status === 1 || status === '1' || status === 'Pending') return 'Pending';
  if (status === 2 || status === '2' || status === 'Finished') return 'Finished';
  if (status === 3 || status === '3' || status === 'Deleted') return 'Deleted';
  return 'Active';
}

export function normalizeTaskStatus(status) {
  if (status === 0 || status === '0' || status === 'NotAssigned' || status === 'Unassigned' || status === 'unassigned') return 'NotAssigned';
  if (status === 1 || status === '1' || status === 'Pending') return 'Pending';
  if (status === 2 || status === '2' || status === 'OnProgress') return 'OnProgress';
  if (status === 3 || status === '3' || status === 'Completed') return 'Completed';
  if (status === 4 || status === '4' || status === 'Approved') return 'Approved';
  if (status === 5 || status === '5' || status === 'Deleted') return 'Deleted';
  return 'NotAssigned';
}

export function formatMemberName(name, lang = 'ar') {
  const t = translations[lang] || translations.ar;
  if (!name || name === 'Unassigned' || name === 'NotAssigned' || name === 'unassigned' || name === 'notassigned' || name === 'null' || (typeof name === 'string' && name.trim() === '')) {
    return t.unassignedMember;
  }
  return name;
}

export function getStatusText(status, lang = 'ar') {
  const t = translations[lang] || translations.ar;
  const norm = normalizeTicketStatus(status);
  switch (norm) {
    case 'NotAssigned':
      return t.statusNotAssigned;
    case 'Pending':
      return t.statusPending;
    case 'OnProgress':
      return t.statusOnProgress;
    case 'Completed':
      return t.statusCompleted;
    case 'Deleted':
      return t.statusDeleted;
    default:
      return norm;
  }
}

export function getTaskStatusText(status, lang = 'ar') {
  const t = translations[lang] || translations.ar;
  const norm = normalizeTaskStatus(status);
  switch (norm) {
    case 'NotAssigned':
      return t.taskStatusNotAssigned;
    case 'Pending':
      return t.taskStatusPending;
    case 'OnProgress':
      return t.taskStatusOnProgress;
    case 'Completed':
      return t.taskStatusCompleted;
    case 'Approved':
      return t.taskStatusApproved;
    default:
      return norm;
  }
}

export function getPriorityText(priority, lang = 'ar') {
  const t = translations[lang] || translations.ar;
  const norm = normalizeTicketPriority(priority);
  switch (norm) {
    case 'Low':
      return t.priorityLow;
    case 'Medium':
      return t.priorityMedium;
    case 'High':
      return t.priorityHigh;
    case 'Urgent':
      return t.priorityUrgent;
    default:
      return norm;
  }
}

export function getPriorityColor(priority) {
  const norm = normalizeTicketPriority(priority);
  switch (norm) {
    case 'Urgent':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' };
    case 'High':
      return { bg: '#FFF7ED', text: '#EA580C', border: '#FDBA74' };
    case 'Medium':
      return { bg: '#EFF6FF', text: '#2563EB', border: '#93C5FD' };
    case 'Low':
    default:
      return { bg: '#F0FDF4', text: '#16A34A', border: '#86EFAC' };
  }
}

export function getStatusColor(status) {
  const norm = normalizeTicketStatus(status);
  switch (norm) {
    case 'Completed':
      return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
    case 'OnProgress':
      return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' };
    case 'Pending':
      return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' };
    case 'NotAssigned':
    default:
      return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
  }
}

export const getTicketStatusColor = getStatusColor;
export const getTicketStatusText = getStatusText;

export function formatAuditComment(comment, lang = 'ar') {
  if (!comment || typeof comment !== 'string') return '';
  const trimmed = comment.trim();
  if (!trimmed) return '';

  // 1. Bilingual slash strings: "Arabic / English"
  if (trimmed.includes(' / ')) {
    const parts = trimmed.split(' / ');
    if (parts.length >= 2) {
      const arPart = parts[0].trim();
      const enPart = parts.slice(1).join(' / ').trim();
      return lang === 'ar' ? arPart : (enPart || arPart);
    }
  }

  // 2. Technical status patterns: "Quick transition to status X"
  const quickMatch = trimmed.match(/^quick transition to (?:status\s*)?([a-zA-Z0-9_-]+)/i);
  if (quickMatch) {
    const statusVal = quickMatch[1];
    if (statusVal === '2' || statusVal.toLowerCase() === 'onprogress') {
      return lang === 'ar' ? 'بدء العمل على التذكرة (قيد التنفيذ)' : 'Started work on ticket (In Progress)';
    }
    if (statusVal === '3' || statusVal.toLowerCase() === 'completed') {
      return lang === 'ar' ? 'إكمال التذكرة بنجاح' : 'Completed ticket successfully';
    }
    if (statusVal === '1' || statusVal.toLowerCase() === 'pending') {
      return lang === 'ar' ? 'تعليق التذكرة (قيد الانتظار)' : 'Ticket marked as Pending';
    }
    return lang === 'ar' ? 'تحديث سريع لحالة التذكرة' : 'Quick status transition';
  }

  // 3. Subtask deletion if English only: "Subtask '#2 - Test' was deleted" -> Arabic
  const subtaskDeletedEn = trimmed.match(/^Subtask\s*['"#]?([^']+?)['"]?\s*was deleted/i);
  if (subtaskDeletedEn && lang === 'ar') {
    return `تم حذف المهمة الفرعية: '${subtaskDeletedEn[1]}'`;
  }

  // 4. Subtask deletion if Arabic only: "تم حذف المهمة الفرعية: '...'" -> English
  const subtaskDeletedAr = trimmed.match(/^تم حذف المهمة الفرعية:\s*['"]?([^'"]+)['"]?/);
  if (subtaskDeletedAr && lang === 'en') {
    return `Subtask '${subtaskDeletedAr[1]}' was deleted`;
  }

  // 5. Initial status upon creation
  if (/initial status upon ticket creation/i.test(trimmed)) {
    return lang === 'ar' ? 'الحالة الأولية عند إنشاء التذكرة' : 'Initial status upon ticket creation';
  }
  if (/initial status upon task creation/i.test(trimmed)) {
    return lang === 'ar' ? 'الحالة الأولية عند إنشاء المهمة الفرعية' : 'Initial status upon task creation';
  }

  return trimmed;
}

/**
 * Parses any date/time string from backend as UTC and returns a Date object
 * converting it accurately to the client's local timezone.
 */
export function parseUtcDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  let str = String(dateStr).trim();
  if (!str) return null;
  // If date-time string lacks timezone designator ('Z' or [+-]HH:mm),
  // append 'Z' so it is parsed as UTC rather than client local time.
  if ((str.includes('T') || str.includes(' ')) && !str.endsWith('Z') && !/[+-]\d{2}(?::?\d{2})?$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date(dateStr) : d;
}

/**
 * Formats a UTC date string to localized date & time in client's local timezone.
 */
export function formatDateTime(dateStr, lang = 'ar') {
  if (!dateStr) return '—';
  const d = parseUtcDate(dateStr);
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');
}

/**
 * Formats a UTC date string to localized date in client's local timezone.
 */
export function formatDate(dateStr, lang = 'ar') {
  if (!dateStr) return '—';
  const d = parseUtcDate(dateStr);
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
}

/**
 * Determines whether a ticket or task is overdue.
 * Crucially: IF OVERDUE, RETURNS TRUE EVEN IF COMPLETED!
 */
export function isTicketOrTaskOverdue(deadlineStr, completedAt = null) {
  if (!deadlineStr) return false;
  const due = parseUtcDate(deadlineStr);
  if (!due || isNaN(due.getTime())) return false;
  const now = new Date();

  // If completed with a recorded completion time, check if completed late
  if (completedAt) {
    const comp = parseUtcDate(completedAt);
    if (comp && !isNaN(comp.getTime()) && comp > due) return true;
  }
  // If deadline is in the past, it's overdue (even if marked completed)
  return due < now;
}

/**
 * Returns urgency styling and labels.
 * User requirement: "if the task or ticket overdue show red badge over it even if completed"
 */
export function getDeadlineUrgency(deadlineStr, completedAt = null, status = null, lang = 'ar') {
  if (!deadlineStr) return null;
  const t = translations[lang] || translations.ar;
  const due = parseUtcDate(deadlineStr);
  if (!due || isNaN(due.getTime())) return null;
  const now = new Date();

  const isCompleted = status === 'Completed' || status === 3 || status === '3' || status === 'Approved';
  const compDate = completedAt ? parseUtcDate(completedAt) : null;
  const referenceDate = (isCompleted && compDate && !isNaN(compDate.getTime())) ? compDate : now;

  const diffMs = due - referenceDate;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Overdue check: past due date! Shows RED badge EVEN IF COMPLETED!
  if (diffMs < 0 || due < now) {
    const overdueDuration = Math.abs(diffDays) > 0 ? `${Math.abs(diffDays)}d` : `${Math.abs(diffHours)}h`;
    return {
      variant: 'red',
      isOverdue: true,
      label: `${t.overdue || 'متأخرة عن الموعد'} (${overdueDuration})`,
      text: `${t.daysOverdue || 'متأخرة بـ'} ${overdueDuration}`,
    };
  }

  if (diffHours <= 24) {
    return {
      variant: 'yellow',
      isOverdue: false,
      label: `${t.dueSoon || 'تقترب من الموعد'} (${diffHours}h)`,
      text: `${diffHours}h ${t.daysRemaining || 'متبقي'}`,
    };
  }

  return {
    variant: 'gray',
    isOverdue: false,
    label: due.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }),
    text: `${diffDays}d ${t.daysRemaining || 'متبقي'}`,
  };
}
