// js/shared/mockData.js

export const mockUsers = [
    { id: 1, username: "admin", email: "admin@university.edu", phone: "+1 555-0199", role: "Supervisor", joined: "2025-01-15", isProtected: true, name: "admin" },
    { id: 2, username: "j.carter", email: "j.carter@university.edu", phone: "+1 555-0288", role: "IT Manager", joined: "2025-03-22", isProtected: false, name: "j.carter" },
    { id: 3, username: "m.silva", email: "m.silva@university.edu", phone: "+1 555-0363", role: "EL Manager", joined: "2025-04-10", isProtected: false, name: "m.silva" },
    { id: 4, username: "r.hayes", email: "r.hayes@university.edu", phone: "+1 555-0441", role: "Mechanical Manager", joined: "2025-05-27", isProtected: false, name: "r.hayes" },
    { id: 5, username: "k.nguyen", email: "k.nguyen@university.edu", phone: "+1 555-0586", role: "IT Manager", joined: "2025-07-18", isProtected: false, name: "k.nguyen" },
    { id: 6, username: "aitu.localadmin", email: "admin@aitu.local", phone: "+1 555-0000", role: "Supervisor", joined: "2026-06-27", isProtected: true, password: "Admin123", name: "aitu.localadmin" }
];

// Department hierarchy for the academic sidebar tree
export const mockDepartments = [
    {
        id: 'IT',
        name: 'Information Tech',
        shortName: 'IT',
        label: 'INFORMATION TECH',
        icon: 'monitor',
        totalFiles: 12450,
        categories: 4,
        programs: [
            { id: 'it-net', name: 'Networking' },
            { id: 'it-prog', name: 'Programming' },
            { id: 'it-cyber', name: 'Cybersecurity' },
            { id: 'it-db', name: 'Database Systems' }
        ]
    },
    {
        id: 'EL',
        name: 'Electrical Eng.',
        shortName: 'EL',
        label: 'ELECTRICAL ENG',
        icon: 'zap',
        totalFiles: 8200,
        categories: 3,
        programs: [
            { id: 'el-power', name: 'Power Systems' },
            { id: 'el-embed', name: 'Embedded Systems' },
            { id: 'el-digital', name: 'Digital Electronics' }
        ]
    },
    {
        id: 'ME',
        name: 'Mechanical Eng.',
        shortName: 'ME',
        label: 'MECHANICAL ENG',
        icon: 'settings',
        totalFiles: 9100,
        categories: 5,
        programs: [
            { id: 'me-thermo', name: 'Thermodynamics' },
            { id: 'me-fluid', name: 'Fluid Mechanics' },
            { id: 'me-cad', name: 'CAD & Design' },
            { id: 'me-materials', name: 'Materials Science' },
            { id: 'me-manufacturing', name: 'Manufacturing' }
        ]
    }
];

const defaultMockFiles = [
    // IT DEPT files
    { id: 1, name: "IT_Syllabus_2024.pdf", type: "PDF", version: "v1.2", size: "2.4 MB", dept: "IT DEPT", deptId: "IT", program: "it-net", course: "", downloads: 142, uploadDate: "2026-06-20", uploadedBy: "j.carter" },
    { id: 2, name: "Network_Infrastructure_2024.pdf", type: "PDF", version: "v2.4.1", size: "14.2 MB", dept: "IT DEPT", deptId: "IT", program: "it-net", course: "CS204", downloads: 1204, uploadDate: "2026-06-18", uploadedBy: "j.carter" },
    { id: 3, name: "Cloud_Migration_Budget_Sheet.xlsx", type: "XLSX", version: "v1.0.0", size: "842 KB", dept: "IT DEPT", deptId: "IT", program: "it-net", course: "", downloads: 456, uploadDate: "2026-06-15", uploadedBy: "j.carter" },
    { id: 4, name: "Data_Center_Floor_Plan.dwg", type: "DWG", version: "v3.2.0", size: "48.7 MB", dept: "IT DEPT", deptId: "IT", program: "it-net", course: "", downloads: 238, uploadDate: "2026-06-12", uploadedBy: "k.nguyen" },
    { id: 5, name: "IT_Security_Protocol_Draft.docx", type: "DOCX", version: "v0.9.5", size: "3.1 MB", dept: "IT DEPT", deptId: "IT", program: "it-cyber", course: "", downloads: 89, uploadDate: "2026-06-10", uploadedBy: "j.carter" },
    { id: 6, name: "Network_Basics.pdf", type: "PDF", version: "v2.0", size: "5.2 MB", dept: "IT DEPT", deptId: "IT", program: "it-net", course: "CS101", downloads: 300, uploadDate: "2026-06-18", uploadedBy: "j.carter" },
    { id: 7, name: "Database_Design_Patterns.pdf", type: "PDF", version: "v1.5", size: "6.8 MB", dept: "IT DEPT", deptId: "IT", program: "it-db", course: "CS301", downloads: 567, uploadDate: "2026-05-22", uploadedBy: "k.nguyen" },
    { id: 8, name: "SQL_Optimization_Guide.docx", type: "DOCX", version: "v2.1", size: "1.4 MB", dept: "IT DEPT", deptId: "IT", program: "it-db", course: "CS301", downloads: 198, uploadDate: "2026-05-19", uploadedBy: "j.carter" },
    { id: 9, name: "Python_ML_Workshop.pdf", type: "PDF", version: "v1.0", size: "12.3 MB", dept: "IT DEPT", deptId: "IT", program: "it-prog", course: "CS405", downloads: 723, uploadDate: "2026-04-30", uploadedBy: "k.nguyen" },
    { id: 10, name: "API_Gateway_Architecture.pdf", type: "PDF", version: "v3.0", size: "4.5 MB", dept: "IT DEPT", deptId: "IT", program: "it-prog", course: "", downloads: 412, uploadDate: "2026-04-25", uploadedBy: "j.carter" },
    { id: 11, name: "Firewall_Config_Template.xlsx", type: "XLSX", version: "v1.3", size: "520 KB", dept: "IT DEPT", deptId: "IT", program: "it-cyber", course: "CS410", downloads: 156, uploadDate: "2026-04-18", uploadedBy: "k.nguyen" },
    { id: 12, name: "Penetration_Testing_Report.pdf", type: "PDF", version: "v1.0", size: "8.9 MB", dept: "IT DEPT", deptId: "IT", program: "it-cyber", course: "CS410", downloads: 334, uploadDate: "2026-04-10", uploadedBy: "j.carter" },
    { id: 13, name: "Network_Security_Labs.pdf", type: "PDF", version: "v2.0", size: "4.2 MB", dept: "IT DEPT", deptId: "IT", program: "it-net", course: "CS204", downloads: 289, uploadDate: "2026-03-28", uploadedBy: "k.nguyen" },
    { id: 14, name: "Java_Programming_Syllabus.docx", type: "DOCX", version: "v1.1", size: "1.1 MB", dept: "IT DEPT", deptId: "IT", program: "it-prog", course: "CS101", downloads: 445, uploadDate: "2026-03-15", uploadedBy: "j.carter" },
    { id: 15, name: "React_Component_Library.pdf", type: "PDF", version: "v4.2", size: "7.6 MB", dept: "IT DEPT", deptId: "IT", program: "it-prog", course: "", downloads: 612, uploadDate: "2026-03-08", uploadedBy: "k.nguyen" },
    { id: 16, name: "Cloud_Security_Whitepaper.pdf", type: "PDF", version: "v1.0", size: "3.8 MB", dept: "IT DEPT", deptId: "IT", program: "it-cyber", course: "", downloads: 178, uploadDate: "2026-02-20", uploadedBy: "j.carter" },

    // EL DEPT files
    { id: 17, name: "Lab_Equipment_Inv.xlsx", type: "XLSX", version: "v3.0", size: "1.1 MB", dept: "EL DEPT", deptId: "EL", program: "el-power", course: "", downloads: 56, uploadDate: "2026-06-22", uploadedBy: "m.silva" },
    { id: 18, name: "Embedded_Systems_Syllabus.pdf", type: "PDF", version: "v1.0", size: "1.8 MB", dept: "EL DEPT", deptId: "EL", program: "el-embed", course: "EE201", downloads: 95, uploadDate: "2026-06-15", uploadedBy: "m.silva" },
    { id: 19, name: "Circuit_Analysis_Lab_Manual.pdf", type: "PDF", version: "v2.3", size: "9.4 MB", dept: "EL DEPT", deptId: "EL", program: "el-digital", course: "EE102", downloads: 687, uploadDate: "2026-06-08", uploadedBy: "m.silva" },
    { id: 20, name: "Power_Grid_Simulation.xlsx", type: "XLSX", version: "v1.5", size: "2.3 MB", dept: "EL DEPT", deptId: "EL", program: "el-power", course: "EE305", downloads: 234, uploadDate: "2026-05-30", uploadedBy: "m.silva" },
    { id: 21, name: "Microcontroller_Programming.pdf", type: "PDF", version: "v1.8", size: "5.6 MB", dept: "EL DEPT", deptId: "EL", program: "el-embed", course: "EE201", downloads: 421, uploadDate: "2026-05-22", uploadedBy: "m.silva" },
    { id: 22, name: "FPGA_Design_Specifications.dwg", type: "DWG", version: "v2.0", size: "22.1 MB", dept: "EL DEPT", deptId: "EL", program: "el-digital", course: "", downloads: 167, uploadDate: "2026-05-15", uploadedBy: "m.silva" },
    { id: 23, name: "Transformer_Analysis_Report.pdf", type: "PDF", version: "v1.0", size: "3.2 MB", dept: "EL DEPT", deptId: "EL", program: "el-power", course: "EE305", downloads: 143, uploadDate: "2026-04-28", uploadedBy: "m.silva" },
    { id: 24, name: "Arduino_Sensor_Workshop.docx", type: "DOCX", version: "v1.2", size: "2.1 MB", dept: "EL DEPT", deptId: "EL", program: "el-embed", course: "", downloads: 298, uploadDate: "2026-04-20", uploadedBy: "m.silva" },
    { id: 25, name: "Digital_Logic_Gates_Lab.pdf", type: "PDF", version: "v3.1", size: "4.7 MB", dept: "EL DEPT", deptId: "EL", program: "el-digital", course: "EE102", downloads: 534, uploadDate: "2026-04-12", uploadedBy: "m.silva" },
    { id: 26, name: "Signal_Processing_Notes.pdf", type: "PDF", version: "v1.4", size: "6.3 MB", dept: "EL DEPT", deptId: "EL", program: "el-power", course: "", downloads: 189, uploadDate: "2026-03-25", uploadedBy: "m.silva" },

    // ME DEPT files
    { id: 27, name: "Thermo_CAD_Specs.dwg", type: "DWG", version: "v1.0", size: "15.4 MB", dept: "ME DEPT", deptId: "ME", program: "me-thermo", course: "", downloads: 8, uploadDate: "2026-06-21", uploadedBy: "r.hayes" },
    { id: 28, name: "CAD_Tutorial_Video.mp4", type: "MP4", version: "v1.0", size: "48.2 MB", dept: "ME DEPT", deptId: "ME", program: "me-cad", course: "", downloads: 120, uploadDate: "2026-06-10", uploadedBy: "r.hayes" },
    { id: 29, name: "Fluid_Dynamics_Simulation.pdf", type: "PDF", version: "v2.1", size: "11.5 MB", dept: "ME DEPT", deptId: "ME", program: "me-fluid", course: "ME301", downloads: 356, uploadDate: "2026-06-05", uploadedBy: "r.hayes" },
    { id: 30, name: "Steel_Properties_Database.xlsx", type: "XLSX", version: "v4.0", size: "3.8 MB", dept: "ME DEPT", deptId: "ME", program: "me-materials", course: "", downloads: 478, uploadDate: "2026-05-28", uploadedBy: "r.hayes" },
    { id: 31, name: "CNC_Machine_Operations.pdf", type: "PDF", version: "v1.5", size: "7.2 MB", dept: "ME DEPT", deptId: "ME", program: "me-manufacturing", course: "ME405", downloads: 267, uploadDate: "2026-05-20", uploadedBy: "r.hayes" },
    { id: 32, name: "Heat_Transfer_Analysis.dwg", type: "DWG", version: "v2.3", size: "19.8 MB", dept: "ME DEPT", deptId: "ME", program: "me-thermo", course: "ME201", downloads: 189, uploadDate: "2026-05-12", uploadedBy: "r.hayes" },
    { id: 33, name: "Pump_Selection_Guide.pdf", type: "PDF", version: "v1.0", size: "4.1 MB", dept: "ME DEPT", deptId: "ME", program: "me-fluid", course: "ME301", downloads: 145, uploadDate: "2026-05-05", uploadedBy: "r.hayes" },
    { id: 34, name: "3D_Printed_Parts_Catalog.pdf", type: "PDF", version: "v3.2", size: "25.6 MB", dept: "ME DEPT", deptId: "ME", program: "me-cad", course: "", downloads: 534, uploadDate: "2026-04-28", uploadedBy: "r.hayes" },
    { id: 35, name: "Composite_Materials_Report.docx", type: "DOCX", version: "v1.1", size: "2.9 MB", dept: "ME DEPT", deptId: "ME", program: "me-materials", course: "ME350", downloads: 98, uploadDate: "2026-04-18", uploadedBy: "r.hayes" },
    { id: 36, name: "Welding_Standards_Manual.pdf", type: "PDF", version: "v2.0", size: "5.4 MB", dept: "ME DEPT", deptId: "ME", program: "me-manufacturing", course: "ME405", downloads: 312, uploadDate: "2026-04-10", uploadedBy: "r.hayes" },
    { id: 37, name: "Turbine_Design_Blueprint.dwg", type: "DWG", version: "v1.8", size: "34.2 MB", dept: "ME DEPT", deptId: "ME", program: "me-thermo", course: "", downloads: 76, uploadDate: "2026-03-30", uploadedBy: "r.hayes" },
    { id: 38, name: "Injection_Molding_Specs.pdf", type: "PDF", version: "v1.0", size: "3.6 MB", dept: "ME DEPT", deptId: "ME", program: "me-manufacturing", course: "", downloads: 201, uploadDate: "2026-03-22", uploadedBy: "r.hayes" }
];

export const mockCourses = [
    {
        id: 1,
        title: "Advanced Cloud Architecture",
        dept: "IT",
        category: "UNDERGRAD",
        img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=500",
        lessons: 24,
        size: "1.2 GB",
        lastUpdated: "Oct 2023",
        description: "Master distributed systems and cloud-native deployment strategies using enterprise-grade paradigms. This resource bundle provides the complete mathematical foundations and practical technical assets for state-of-the-art infrastructure models.",
        author: { name: "Dr. Ahmed El-Zayat", title: "Ph.D. Computer Science", bio: "Senior Fellow at AITU AI Research Lab. These materials represent a decade of research in distributed systems and deep learning." },
        resources: [
            { name: "Course Syllabus", type: "PDF", size: "4.2 MB" },
            { name: "Lecture Slides", type: "PPTX", size: "156 MB" },
            { name: "Source Code/Labs", type: "ZIP", size: "840 MB" },
            { name: "Reference Materials", type: "MULTI", size: "220 MB" }
        ],
        modules: [
            {
                name: "Foundations of Neural Networks",
                lessons: [
                    { id: "l1", title: "History of AI (Full Text)", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "document", size: "4.2 MB" },
                    { id: "l2", title: "Reading: Perception & The Perceptron", file: "https://www.w3schools.com/html/movie.mp4", type: "document", size: "1.8 MB" },
                    { id: "l3", title: "Notebook: Linear Algebra Refresh", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "document", size: "12.5 MB" }
                ]
            },
            {
                name: "Optimization Techniques & Backpropagation",
                lessons: [
                    { id: "l4", title: "Gradient Descent Fundamentals", file: "https://www.w3schools.com/html/movie.mp4", type: "video", size: "45 MB" },
                    { id: "l5", title: "Stochastic vs Batch Processing", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", size: "38 MB" }
                ]
            },
            {
                name: "Convolutional Neural Networks (CNN)",
                lessons: [
                    { id: "l5b", title: "CNN Architecture Overview", file: "https://www.w3schools.com/html/movie.mp4", type: "video", size: "52 MB" },
                    { id: "l5c", title: "Image Classification Lab", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "document", size: "28 MB" }
                ]
            }
        ],
        relatedCourses: [2, 4]
    },
    {
        id: 2,
        title: "Smart Grid Engineering",
        dept: "EL",
        category: "PROFESSIONAL",
        img: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=500",
        lessons: 18,
        size: "850 MB",
        lastUpdated: "Jan 2024",
        description: "Integrated study of modern electrical grids, renewable energy integration, and automation controls. Covers smart meter architectures, SCADA systems, and grid stability analysis.",
        author: { name: "Prof. Layla Hassan", title: "M.Sc. Electrical Engineering", bio: "Department head of Power Systems at AITU with 15 years of industrial experience." },
        resources: [
            { name: "Course Syllabus", type: "PDF", size: "3.1 MB" },
            { name: "Lab Manuals", type: "PDF", size: "120 MB" },
            { name: "Simulation Files", type: "ZIP", size: "580 MB" },
            { name: "Reference Papers", type: "MULTI", size: "147 MB" }
        ],
        modules: [
            {
                name: "Module 1: Grid Fundamentals",
                lessons: [
                    { id: "l6", title: "1. Power System Overview", file: "https://www.w3schools.com/html/movie.mp4", type: "video", size: "35 MB" },
                    { id: "l7", title: "2. AC/DC Conversion Basics", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", size: "42 MB" },
                    { id: "l8", title: "3. Transmission Line Analysis", file: "https://www.w3schools.com/html/movie.mp4", type: "document", size: "8.5 MB" }
                ]
            },
            {
                name: "Module 2: Smart Metering & SCADA",
                lessons: [
                    { id: "l8b", title: "4. SCADA Architecture", file: "https://www.w3schools.com/html/movie.mp4", type: "video", size: "48 MB" },
                    { id: "l8c", title: "5. Smart Meter Protocols", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "document", size: "6.2 MB" }
                ]
            }
        ],
        relatedCourses: [5, 3]
    },
    {
        id: 3,
        title: "Robotics & Kinematics",
        dept: "ME",
        category: "RESEARCH",
        img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=500",
        lessons: 32,
        size: "2.4 GB",
        lastUpdated: "Mar 2024",
        description: "Deep dive into the mathematical foundations and mechanical design of multi-axis robotic systems. Includes forward/inverse kinematics, path planning algorithms, and servo control.",
        author: { name: "Dr. Omar Farid", title: "Ph.D. Mechanical Engineering", bio: "Robotics lab director specializing in industrial automation and kinematic chain optimization." },
        resources: [
            { name: "Course Syllabus", type: "PDF", size: "2.8 MB" },
            { name: "CAD Models", type: "ZIP", size: "1.6 GB" },
            { name: "MATLAB Scripts", type: "ZIP", size: "340 MB" },
            { name: "Research Papers", type: "MULTI", size: "460 MB" }
        ],
        modules: [
            {
                name: "Module 1: Forward Kinematics",
                lessons: [
                    { id: "l9", title: "1. DH Parameters Introduction", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", size: "55 MB" },
                    { id: "l10", title: "2. Transformation Matrices", file: "https://www.w3schools.com/html/movie.mp4", type: "video", size: "48 MB" }
                ]
            },
            {
                name: "Module 2: Inverse Kinematics",
                lessons: [
                    { id: "l11", title: "3. Geometric Solutions", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", size: "62 MB" },
                    { id: "l12", title: "4. Numerical Methods (Jacobian)", file: "https://www.w3schools.com/html/movie.mp4", type: "document", size: "15 MB" }
                ]
            },
            {
                name: "Module 3: Path Planning",
                lessons: [
                    { id: "l12b", title: "5. RRT & A* Algorithms", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", size: "70 MB" }
                ]
            }
        ],
        relatedCourses: [6, 2]
    },
    {
        id: 4,
        title: "Cybersecurity Fundamentals",
        dept: "IT",
        category: "UNDERGRAD",
        img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=500",
        lessons: 15,
        size: "420 MB",
        lastUpdated: "Nov 2023",
        description: "Comprehensive introduction to network security, threat detection, and ethical hacking protocols. Covers firewall configuration, IDS/IPS systems, and penetration testing methodologies.",
        author: { name: "Dr. Sarah Mitchell", title: "Ph.D. Cybersecurity", bio: "Former security consultant and AITU faculty member specializing in ethical hacking and digital forensics." },
        resources: [
            { name: "Course Syllabus", type: "PDF", size: "1.5 MB" },
            { name: "Lab Environments", type: "ZIP", size: "280 MB" },
            { name: "Cheat Sheets", type: "PDF", size: "45 MB" },
            { name: "Case Studies", type: "MULTI", size: "94 MB" }
        ],
        modules: [
            {
                name: "Module 1: Threat Landscape",
                lessons: [
                    { id: "l13", title: "1. Common Attack Vectors", file: "https://www.w3schools.com/html/movie.mp4", type: "video", size: "32 MB" },
                    { id: "l14", title: "2. Social Engineering Deep Dive", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", size: "28 MB" }
                ]
            },
            {
                name: "Module 2: Defensive Techniques",
                lessons: [
                    { id: "l15", title: "3. Firewall & IDS Configuration", file: "https://www.w3schools.com/html/movie.mp4", type: "video", size: "45 MB" },
                    { id: "l16", title: "4. Encryption Standards Overview", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "document", size: "12 MB" }
                ]
            }
        ],
        relatedCourses: [1, 5]
    },
    {
        id: 5,
        title: "Photonics & Fiber Optics",
        dept: "EL",
        category: "RESEARCH",
        img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=500",
        lessons: 21,
        size: "1.1 GB",
        lastUpdated: "Feb 2024",
        description: "Exploring light-matter interactions and advanced transmission systems for high-speed communication. Covers waveguide theory, laser fundamentals, and optical network design.",
        author: { name: "Prof. Nadia Rostom", title: "Ph.D. Photonics Engineering", bio: "Principal researcher at AITU Photonics Lab with publications in Nature Photonics." },
        resources: [
            { name: "Course Syllabus", type: "PDF", size: "2.2 MB" },
            { name: "Simulation Software", type: "ZIP", size: "650 MB" },
            { name: "Lab Procedures", type: "PDF", size: "180 MB" },
            { name: "Journal Articles", type: "MULTI", size: "268 MB" }
        ],
        modules: [
            {
                name: "Module 1: Light Fundamentals",
                lessons: [
                    { id: "l17", title: "1. Electromagnetic Wave Theory", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", size: "40 MB" },
                    { id: "l18", title: "2. Refraction & Total Internal Reflection", file: "https://www.w3schools.com/html/movie.mp4", type: "video", size: "35 MB" }
                ]
            },
            {
                name: "Module 2: Fiber Optic Systems",
                lessons: [
                    { id: "l19", title: "3. Single-Mode vs Multi-Mode Fibers", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", size: "52 MB" },
                    { id: "l20", title: "4. DWDM Technology", file: "https://www.w3schools.com/html/movie.mp4", type: "document", size: "18 MB" }
                ]
            }
        ],
        relatedCourses: [2, 6]
    },
    {
        id: 6,
        title: "Renewable Systems Design",
        dept: "ME",
        category: "PROFESSIONAL",
        img: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=500",
        lessons: 12,
        size: "560 MB",
        lastUpdated: "Dec 2023",
        description: "Practical engineering approach to wind, solar, and hydro-mechanical energy harvesting technologies. Includes system sizing, efficiency optimization, and grid integration strategies.",
        author: { name: "Eng. Kareem Abdallah", title: "M.Sc. Renewable Energy", bio: "Industrial consultant and AITU lecturer specializing in sustainable energy system design." },
        resources: [
            { name: "Course Syllabus", type: "PDF", size: "1.8 MB" },
            { name: "Design Templates", type: "ZIP", size: "320 MB" },
            { name: "Efficiency Calculators", type: "XLSX", size: "45 MB" },
            { name: "Standards Documents", type: "PDF", size: "194 MB" }
        ],
        modules: [
            {
                name: "Module 1: Solar Energy Systems",
                lessons: [
                    { id: "l21", title: "1. Photovoltaic Cell Technology", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", size: "38 MB" },
                    { id: "l22", title: "2. Panel Array Design", file: "https://www.w3schools.com/html/movie.mp4", type: "video", size: "42 MB" }
                ]
            },
            {
                name: "Module 2: Wind & Hydro Systems",
                lessons: [
                    { id: "l23", title: "3. Wind Turbine Mechanics", file: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", size: "55 MB" },
                    { id: "l24", title: "4. Micro-Hydro Power Plants", file: "https://www.w3schools.com/html/movie.mp4", type: "document", size: "22 MB" }
                ]
            }
        ],
        relatedCourses: [3, 5]
    }
];

export const mockLogs = [
    { id: 1, admin: "admin", role: "Supervisor", action: "Login", target: "System", datetime: "2026-06-27 08:14:32" },
    { id: 2, admin: "j.carter", role: "IT Manager", action: "Upload Video", target: "Advanced Software Architecture", datetime: "2026-06-27 09:02:18" },
    { id: 3, admin: "admin", role: "Supervisor", action: "Add User", target: "k.nguyen", datetime: "2026-06-27 10:35:44" },
    { id: 4, admin: "m.silva", role: "EL Manager", action: "Create Folder", target: "Power Systems Analysis", datetime: "2026-06-26 14:22:07" },
    { id: 5, admin: "r.hayes", role: "Mechanical Manager", action: "Add File", target: "GD&T Advisor 4.0", datetime: "2026-06-26 15:48:33" },
    { id: 6, admin: "admin", role: "Supervisor", action: "Change Password", target: "Own Account", datetime: "2026-06-25 11:05:19" },
    { id: 7, admin: "j.carter", role: "IT Manager", action: "Update Profile", target: "Own Account", datetime: "2026-06-25 13:17:55" }
];

export const mockDashboardMetrics = {
    totalFiles: 14208,
    qnapStorage: {
        usedPercentage: 84,
        usedValue: "8.4 TB",
        totalValue: "10 TB"
    },
    pendingTasks: 42,
    netActivity: "128.5k",
    trends: {
        totalFiles: "+ 12% vs last month",
        storageCapacity: "84% capacity reached",
        pendingTasks: "Requires admin review",
        netActivity: "+ 5.2% growth"
    },
    downloadVelocity: [
        { month: "Jan", count: 6500 },
        { month: "Feb", count: 8200 },
        { month: "Mar", count: 7800 },
        { month: "Apr", count: 12500 },
        { month: "May", count: 10500 },
        { month: "Jun", count: 14000 },
        { month: "Jul", count: 13200 },
        { month: "Aug", count: 9000 },
        { month: "Sep", count: 11000 },
        { month: "Oct", count: 14500 },
        { month: "Nov", count: 15200 },
        { month: "Dec", count: 13800 }
    ],
    resourceMix: {
        it: 12450,
        me: 9100,
        el: 8200
    },
    programDownloads: {
        it: 4500,
        me: 3200,
        el: 2500
    },
    highImpactDocuments: [
        { name: "2024_Academic_Charter.pdf", source: "Council Office", downloads: 1245, weight: "2.4 MB", type: "PDF" },
        { name: "Q1_Enrollment_Stats.xlsx", source: "Registrar", downloads: 892, weight: "4.1 MB", type: "XLSX" },
        { name: "Faculty_Handbook_V2.docx", source: "HR Academic", downloads: 756, weight: "1.2 MB", type: "DOCX" },
        { name: "Campus_Rebranding_Assets.zip", source: "Communications", downloads: 412, weight: "156 MB", type: "ZIP" }
    ],
    recentEvents: [
        { user: "Prof. Kamal", action: "uploaded", target: "Course_Intro.pdf", time: "10 minutes ago", type: "info" },
        { user: "Security Bot", action: "isolated", target: "suspicious_login.log", time: "1 hour ago", type: "critical" },
        { user: "System", action: "finalized", target: "weekly backup", time: "3 hours ago", type: "neutral" },
        { user: "Maintenance window", action: "scheduled for Saturday.", target: "", time: "Yesterday, 11:00 PM", type: "neutral" }
    ]
};

const savedFiles = localStorage.getItem('aitu_mock_files');
export const mockFiles = savedFiles ? JSON.parse(savedFiles) : defaultMockFiles;
