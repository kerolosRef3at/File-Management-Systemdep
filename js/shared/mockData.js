// js/shared/mockData.js

export const mockUsers = [
    { id: 1, username: "admin", email: "admin@university.edu", phone: "01012345678", role: "Supervisor", joined: "2025-01-15", isProtected: true, name: "admin" },
    { id: 2, username: "j.carter", email: "j.carter@university.edu", phone: "01123456789", role: "IT Manager", joined: "2025-03-22", isProtected: false, name: "j.carter" },
    { id: 3, username: "m.silva", email: "m.silva@university.edu", phone: "01234567890", role: "EL Manager", joined: "2025-04-10", isProtected: false, name: "m.silva" },
    { id: 4, username: "r.hayes", email: "r.hayes@university.edu", phone: "01545678901", role: "Mechanical Manager", joined: "2025-05-27", isProtected: false, name: "r.hayes" },
    { id: 5, username: "k.nguyen", email: "k.nguyen@university.edu", phone: "01098765432", role: "IT Manager", joined: "2025-07-18", isProtected: false, name: "k.nguyen" },
    { id: 6, username: "aitu.localadmin", email: "admin@aitu.local", phone: "01011223344", role: "Supervisor", joined: "2026-06-27", isProtected: true, name: "aitu.localadmin" },
    { id: 7, username: "faresdiaa2005", email: "faresdiaa2005@gmail.com", phone: "01555191529", role: "Supervisor", joined: "2026-07-21", isProtected: true, name: "fares diaa" },
    { id: 8, username: "fares", email: "fares@aitu.edu.eg", phone: "01555191529", role: "Supervisor", joined: "2026-07-21", isProtected: true, name: "fares diaa" }
];

// The department list. Deliberately EMPTY at module scope.
//
// This used to be hard-coded with IT / EL / ME, and hydrateDepartments only
// ever APPENDED to it. That meant those three were pinned into the UI whether
// or not they existed on the server: delete IT from the database and it still
// showed up, and a system with different departments entirely still displayed
// them. Every page shipped the same three fictional rows.
//
// The server is the only source of departments now. Whatever
// GET /api/Folders returns with isDepartment = true is what the user sees --
// three of them, or thirty, or none.
export const mockDepartments = [];

// =====================================================================
// FOLDER SANITY + HYDRATION  (single source of truth)
// =====================================================================
// Every page used to carry its own copy of the Pass 1 / Pass 2 folder
// parsing loops, each with slightly different bugs. They all live here now.

const RESERVED_FOLDER_NAMES = ['programs', 'departments', 'uploads', 'temp', 'tmp', 'root'];

/**
 * True for anything that must never be shown as a Department or Program:
 * raw DB ids ("1", "2", "3", "6"), GUIDs, blanks, internal folder names.
 */
export function isJunkFolderName(value) {
    const s = String(value === null || value === undefined ? '' : value).trim();
    if (!s) return true;                                     // blank
    if (/^\d+$/.test(s)) return true;                        // "1", "2", "3", "6"
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)) return true;    // GUID
    if (/^[0-9a-f]{32}$/i.test(s)) return true;              // GUID, no dashes
    if (RESERVED_FOLDER_NAMES.includes(s.toLowerCase())) return true;
    return false;
}

// --- field readers: the API is inconsistent about casing ---------------
function pick(f, keys) {
    for (const k of keys) {
        if (f[k] !== undefined && f[k] !== null && f[k] !== '') return f[k];
    }
    return undefined;
}
function folderName(f) { return String(pick(f, ['name', 'Name', 'folderName', 'FolderName', 'title', 'Title']) || ''); }
function folderCode(f) { return String(pick(f, ['code', 'Code', 'shortName', 'ShortName']) || ''); }
function folderDeptRef(f) { return String(pick(f, ['deptId', 'DeptId', 'department', 'Department', 'dept', 'Dept']) || ''); }
function folderParent(f) {
    const v = pick(f, ['parentFolderId', 'ParentFolderId', 'parentId', 'ParentId']);
    return v === undefined ? null : v;
}

/**
 * One definition of "top level", used by BOTH passes.
 * Previously Pass 1 and Pass 2 disagreed, so folders were either counted
 * twice or dropped entirely.
 *
 * A folder with a null parent but a dept reference is a PROGRAM whose parent
 * link was lost (the old createFolder always sent parentFolderId: null).
 * Treating it as a program is what stops it becoming a phantom category.
 */
function isTopLevelFolder(f) {
    const parent = folderParent(f);
    if (f.isDepartment === true || f.isCategory === true) return true;
    if (parent === 0 || parent === '0') return true;
    if (parent === null || parent === undefined || parent === '') {
        return !folderDeptRef(f);   // no dept => genuinely a root folder
    }
    return false;
}

// --- one-time cleanup of the old local cache -------------------------
// Categories and programs used to be mirrored into localStorage because the
// API could not persist them (parentFolderId 0 broke the self-referencing FK,
// so every create returned a swallowed 500). The server is authoritative now,
// and keeping a second copy created ghosts: deleting a program removed it from
// the database but the localStorage copy survived and hydrateDepartments put
// it straight back on the next reload -- sometimes under the wrong department,
// because an old entry carried a stale deptId.
//
// This clears the stale keys once so the ghosts disappear for existing users.
// Nothing writes to them any more.
function purgeLegacyLocalCache() {
    try {
        localStorage.removeItem('AITU_CUSTOM_CATEGORIES');
        localStorage.removeItem('AITU_CUSTOM_PROGRAMS');
    } catch (e) {
        // Private mode or storage disabled -- nothing to purge.
    }
}

purgeLegacyLocalCache();

// dbId is the folder's real numeric primary key. Without it the delete button
// had nothing but prog.id, and prog.id falls back to the folder NAME whenever
// code is null (which it always is for programs). The delete handler tests
// /^\d+$/ on that value, got a name, and silently skipped the API call --
// removing the card from memory only. The folder stayed in the database, so
// the next reload brought it straight back.
function addProgram(dept, id, name, dbId) {
    if (!dept || isJunkFolderName(name)) return;
    if (!Array.isArray(dept.programs)) dept.programs = [];
    const existing = dept.programs.find(p =>
        String(p.id).toLowerCase() === String(id).toLowerCase() ||
        String(p.name).toLowerCase() === String(name).toLowerCase()
    );
    if (existing) {
        if (dbId !== undefined && dbId !== null && existing.dbId === undefined) {
            existing.dbId = dbId;
        }
        return;
    }
    const prog = { id: String(id), name: String(name) };
    if (dbId !== undefined && dbId !== null) prog.dbId = dbId;
    dept.programs.push(prog);
}

function findDept(ref) {
    const key = String(ref || '').toUpperCase();
    if (!key) return null;
    return mockDepartments.find(d =>
        String(d.id).toUpperCase() === key ||
        String(d.shortName).toUpperCase() === key ||
        String(d.name).toUpperCase() === key
    ) || null;
}

/**
 * Fills mockDepartments from the API folder list + the file list.
 * Call it once per page, right after fetching. Mutates and returns
 * the shared mockDepartments array.
 */
export function hydrateDepartments(apiFolders, files) {
    const folders = Array.isArray(apiFolders) ? apiFolders : [];

    // Pass 1 -- top-level folders become departments / categories.
    folders.forEach(f => {
        if (!isTopLevelFolder(f)) return;

        const name = folderName(f);
        if (isJunkFolderName(name)) return;

        // NEVER fall back to the numeric DB id for the code. That fallback is
        // exactly what produced the phantom "1 / 2 / 3 / 6" categories.
        const raw = folderCode(f);
        const code = String(isJunkFolderName(raw) ? name : raw).toUpperCase();
        if (isJunkFolderName(code)) return;

        const dup = mockDepartments.some(d =>
            String(d.id).toUpperCase() === code ||
            String(d.name).toLowerCase() === name.toLowerCase()
        );
        if (dup) return;

        const dbId = pick(f, ['id', 'Id', 'folderId', 'FolderId', 'dbId']);
        mockDepartments.push({
            id: code,
            dbId: dbId,
            name: name,
            shortName: code,
            label: name.toUpperCase(),
            icon: pick(f, ['icon', 'Icon']) || 'monitor',
            totalFiles: 0,
            categories: 0,
            programs: []
        });
    });

    // Pass 2 -- everything else becomes a program under its department.
    folders.forEach(f => {
        if (isTopLevelFolder(f)) return;

        const name = folderName(f);
        if (isJunkFolderName(name)) return;

        // Match by dept code first, then by the parent folder's own code.
        let dept = findDept(folderDeptRef(f));
        if (!dept) {
            const parent = folders.find(p => {
                const pid = pick(p, ['id', 'Id', 'folderId', 'FolderId']);
                return pid !== undefined && String(pid) === String(folderParent(f));
            });
            if (parent) dept = findDept(folderCode(parent) || folderName(parent));
        }
        // No match => drop it. It used to be dumped into mockDepartments[0],
        // which is why unrelated programs kept showing up under IT.
        if (!dept) return;

        const raw = folderCode(f);
        const dbId = pick(f, ['id', 'Id', 'folderId', 'FolderId']);
        addProgram(dept, isJunkFolderName(raw) ? name : raw, name, dbId);
    });

    // Programs implied by uploaded files.
    (Array.isArray(files) ? files : []).forEach(f => {
        if (!f || !f.program || !f.deptId) return;
        if (isJunkFolderName(f.program)) return;
        const dept = findDept(f.deptId);
        if (dept) addProgram(dept, f.program, f.program);
    });

    // Final safety net: scrub anything that slipped through any source.
    for (let i = mockDepartments.length - 1; i >= 0; i--) {
        const d = mockDepartments[i];
        if (!Array.isArray(d.programs)) d.programs = [];
        d.programs = d.programs.filter(p => p && !isJunkFolderName(p.name));
        if (isJunkFolderName(d.name) || isJunkFolderName(d.id)) {
            mockDepartments.splice(i, 1);
        }
    }

    mockDepartments.forEach(d => { d.categories = d.programs.length; });
    return mockDepartments;
}

const defaultMockFiles = [];

export const mockCourses = [];

export const mockLogs = [];

export const mockDashboardMetrics = {
    totalFiles: 0,
    qnapStorage: { usedPercentage: 0, usedValue: "0 GB", totalValue: "0 GB" },
    pendingTasks: 0,
    netActivity: "0",
    trends: { totalFiles: "0", storageCapacity: "0%", pendingTasks: "0", netActivity: "0" },
    downloadVelocity: [],
    resourceMix: { it: 0, el: 0, me: 0 },
    programDownloads: { it: 0, el: 0, me: 0 },
    highImpactDocuments: [],
    recentEvents: []
};

export const mockFiles = [];