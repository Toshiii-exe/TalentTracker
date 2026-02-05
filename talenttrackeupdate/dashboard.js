import {
    auth,
    onAuthChange,
    signOut,
    getAthleteProfile,
    saveAthleteProfile,
    uploadFile,
    addAchievement,
    removeAchievement,
    addPerformance,
    verifyAchievement,
    BACKEND_URL
} from "./register.js";
import { showLoading, hideLoading, showMessage, updateNavbar, fixImageUrl, getImageErrorHandler } from "./ui-utils.js";
import { getTranslation } from "./i18n.js";

// Listen for language changes
window.addEventListener("languageChanged", () => {
    if (currentUID) loadAthleteProfileData();
});

// DOM Elements
const navLoginBtn = document.getElementById("navLoginBtn");
const navUserDropdown = document.getElementById("navUserDropdown");
const navUserEmail = document.getElementById("navUserEmail");
const logoutBtn = document.getElementById("logoutBtn");

const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileMenu = document.getElementById("mobileMenu");
const mobileBackdrop = document.getElementById("mobileMenuBackdrop");
const mobileBackBtn = document.getElementById("mobileBackBtn");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");
const mobileUserDropdown = document.getElementById("mobileUserDropdown");
const mobileUserEmail = document.getElementById("mobileUserEmail");
const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
const mobileUserName = document.getElementById("mobileUserName");

const dashUserName = document.getElementById("dashUserName");
const headerPBDisplay = document.getElementById("headerPBDisplay");
const profilePicEl = document.getElementById("profilePic");
const profilePicInput = document.getElementById("profilePicInput");
const editProfileBtn = document.getElementById("editProfileBtn");
const contactSupportBtn = document.getElementById("contactSupportBtn");

const fullProfileList = document.getElementById("fullProfileList");
const officialDocsGrid = document.getElementById("officialDocsGrid");
const achievementsWrapper = document.getElementById("achievementsWrapper");
const noOfficialDocsText = document.getElementById("noOfficialDocsText");

const performanceForm = document.getElementById("performanceForm");
const performanceEventSelect = document.getElementById("performanceEvent");
const performanceDateInput = document.getElementById("performanceDate");
const performanceTimeInput = document.getElementById("performanceTime");
const performanceSubmitBtn = document.getElementById("performanceSubmitBtn");

const eventSelect = document.getElementById("eventSelect");
const graphEventLabel = document.getElementById("graphEventLabel");
const performanceChartDiv = document.getElementById("performanceChart");
const noPerformanceText = document.getElementById("noPerformanceText");

const docViewModal = document.getElementById("docViewModal");
const docContentArea = document.getElementById("docContentArea");
const verifyModal = document.getElementById("verifyModal");
const verifierNameInput = document.getElementById("verifierName");
const verifierNotesInput = document.getElementById("verifierNotes");
const confirmVerifyBtn = document.getElementById("confirmVerifyBtn");
const cancelVerifyBtn = document.getElementById("cancelVerifyBtn");
let currentVerifyingDoc = null;

const eventTimeLimits = {
    "100m": { min: 9.0, max: 20.0 },
    "200m": { min: 19.0, max: 45.0 },
    "400m": { min: 43.0, max: 120.0 },
    "800m": { min: 100.0, max: 300.0 },
    "1200m": { min: 160.0, max: 500.0 },
    "1500m": { min: 200.0, max: 600.0 },
    "5000m": { min: 700.0, max: 1800.0 },
    "10000m": { min: 1500.0, max: 4000.0 },
    "Long Jump": { min: 3.0, max: 10.0 },
    "High Jump": { min: 1.0, max: 3.0 }
};

let currentUID = null;
let athleteDocData = null;

// Navbar Interaction
navLoginBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    navUserDropdown?.classList.toggle("hidden");
});

const toggleMobileMenu = (show) => {
    if (show) {
        mobileBackdrop.classList.remove("hidden");
        setTimeout(() => {
            mobileBackdrop.classList.replace("opacity-0", "opacity-100");
            mobileMenu.classList.remove("translate-x-full");
        }, 10);
    } else {
        mobileBackdrop.classList.replace("opacity-100", "opacity-0");
        mobileMenu.classList.add("translate-x-full");
        setTimeout(() => mobileBackdrop.classList.add("hidden"), 300);
    }
};

if (mobileMenuButton) mobileMenuButton.addEventListener('click', () => toggleMobileMenu(true));
if (mobileBackBtn) mobileBackBtn.addEventListener('click', () => toggleMobileMenu(false));
if (mobileBackdrop) mobileBackdrop.addEventListener('click', () => toggleMobileMenu(false));
window.addEventListener("click", () => { navUserDropdown?.classList.add("hidden"); });

// Auth Logic
// Auth Logic
onAuthChange(async (user) => {
    if (!user) {
        window.location.replace("index.html");
        return;
    }

    currentUID = user.uid || user.id;

    // OPTIMIZATION: Try to load from cache first
    const cachedData = localStorage.getItem(`tt_profile_${currentUID}`);
    if (cachedData) {
        try {
            athleteDocData = JSON.parse(cachedData);
            updateNavbar(user, athleteDocData);
            loadAthleteProfileData(); // Render immediately with stale data
            console.log("Rendered from cache");
        } catch (e) {
            console.warn("Invalid cache", e);
        }
    } else {
        // Fallback navbar update if no cache
        updateNavbar(user, null);
    }

    try {
        // Fetch fresh data in background
        // Don't show full screen loader if we already showed content
        if (!athleteDocData) showLoading();

        const docSnap = await getAthleteProfile(currentUID);

        if (!docSnap || docSnap.exists === false) {
            if (!athleteDocData) { // Only redirect if we have absolutely nothing
                alert("Please create your profile first.");
                window.location.href = "createprofile.html";
                return;
            }
        }

        if (docSnap && docSnap.exists) {
            athleteDocData = docSnap;
            // Update cache
            localStorage.setItem(`tt_profile_${currentUID}`, JSON.stringify(athleteDocData));

            updateNavbar(user, athleteDocData);
            loadAthleteProfileData(); // Re-render with fresh data
        }

    } catch (err) {
        console.error(err);
    } finally {
        hideLoading();
        startPolling(); // Start polling for squad updates
    }
});

// Polling for Real-Time Updates (e.g. Squad Assignment)
let pollingInterval = null;
function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);

    // Poll every 10 seconds
    const poll = async () => {
        // OPTIMIZATION: Stop polling if tab is not active to save resources
        if (document.hidden) return;

        if (!currentUID) return;
        try {
            // Background fetch - silent
            const freshData = await getAthleteProfile(currentUID);
            if (freshData && freshData.exists) {
                // Check if Squad Changed
                const oldSquadId = athleteDocData.squad ? athleteDocData.squad.id : null;
                const newSquadId = freshData.squad ? freshData.squad.id : null;

                const oldPlan = athleteDocData.squad ? athleteDocData.squad.workout_plan : null;
                const newPlan = freshData.squad ? freshData.squad.workout_plan : null;

                if (oldSquadId !== newSquadId || oldPlan !== newPlan) {
                    console.log(getTranslation("msg_squad_update"));
                    athleteDocData = freshData;
                    localStorage.setItem(`tt_profile_${currentUID}`, JSON.stringify(athleteDocData));

                    // Re-render relevant sections
                    renderFullProfile();

                    // Show a friendly toast notification
                    if (oldSquadId !== newSquadId) {
                        showMessage(getTranslation("msg_squad_changed"), "success");
                    } else if (oldPlan !== newPlan) {
                        showMessage(getTranslation("msg_plan_new"), "info");
                    }
                }
            }
        } catch (err) {
            // silent fail on polling errors
            console.warn("Polling error", err);
        }
    };

    pollingInterval = setInterval(poll, 10000);
}

// handleLogout handled globally


editProfileBtn?.addEventListener("click", () => { if (currentUID) window.location.href = `createprofile.html?edit=true`; });

contactSupportBtn?.addEventListener("click", () => {
    const supportNumber = "+94xxxxxxxxx";
    const msg = encodeURIComponent("Hello Talent Tracker Support, I need some help with my profile.");
    window.open(`https://wa.me/${supportNumber.replace(/\D/g, '')}?text=${msg}`, '_blank');
});

// Load Data
function loadAthleteProfileData() {
    if (!athleteDocData) return;

    const p = athleteDocData.personal || {};

    if (dashUserName) dashUserName.textContent = p.fullName || "Athlete";

    if (athleteDocData.documents?.profilePic) {
        let imgUrl = athleteDocData.documents.profilePic;
        const isPdf = imgUrl.toLowerCase().includes('.pdf') || imgUrl.toLowerCase().includes('pdf');

        if (imgUrl.startsWith('/')) imgUrl = BACKEND_URL + imgUrl;

        if (profilePicEl) {
            if (isPdf) {
                profilePicEl.src = fixImageUrl(imgUrl, athleteDocData.personal?.fullName || "Athlete");
            }
        }
    }

    updateHeaderPBs();
    renderFullProfile();
    renderDocuments();
    renderAchievements();
    populateEventDropdowns();

    const initialEvent = eventSelect.value || "100m";
    renderPerformanceGraph(initialEvent);
}

// Profile Pic Upload
profilePicInput?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        showLoading();
        const isPdf = (file.type && file.type.toLowerCase().includes("pdf")) || /\.pdf$/i.test(file.name);
        const downloadUrl = await uploadFile(file, currentUID, "profilePic");

        // Fetch FRESH data to prevent overwriting
        const freshSnap = await getAthleteProfile(currentUID);
        let dataToSave = {};

        if (freshSnap && freshSnap.exists) {
            dataToSave = freshSnap;
        } else if (athleteDocData) {
            // Fallback to local if fetch fails (unlikely if exists)
            dataToSave = athleteDocData;
        }

        if (!dataToSave.documents) dataToSave.documents = {};
        dataToSave.documents.profilePic = downloadUrl;

        // Save
        await saveAthleteProfile(currentUID, dataToSave);

        // Update Local
        athleteDocData = dataToSave;
        localStorage.setItem(`tt_profile_${currentUID}`, JSON.stringify(athleteDocData));

        let displayUrl = downloadUrl;
        if (displayUrl.startsWith('/')) displayUrl = BACKEND_URL + displayUrl;

        if (profilePicEl) {
            if (isPdf) {
                profilePicEl.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png"; // PDF Icon
            } else {
                // Bust cache if it's the same URL
                profilePicEl.src = displayUrl.startsWith('http') ? displayUrl + "?t=" + new Date().getTime() : displayUrl;
            }
        }
        showMessage(getTranslation("lbl_profile_photo_updated"), "success");
    } catch (err) {
        console.error("Upload error", err);
        showMessage(getTranslation("msg_failed_upload") + err.message, "error");
    } finally {
        hideLoading();
    }
});

// Render Functions
function updateHeaderPBs() {
    const athletic = athleteDocData.athletic || {};
    const events = athletic.events || [];
    if (headerPBDisplay) {
        headerPBDisplay.innerHTML = "";
        if (events.length > 0) {
            events.forEach(evt => {
                const pill = document.createElement("div");
                pill.className = "bg-blue-50 border-l-4 border-[var(--highlight)] px-3 py-2 rounded shadow-sm flex flex-col min-w-[80px]";
                pill.innerHTML = `<span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">${evt.event}</span><span class="text-lg font-bold text-[var(--primary)]">${evt.pb}s</span>`;
                headerPBDisplay.appendChild(pill);
            });
        } else {
            headerPBDisplay.innerHTML = `<p class="text-sm text-gray-400 italic">${getTranslation("lbl_no_data")}</p>`;
        }
    }
}

function renderFullProfile() {
    if (!fullProfileList) return;
    const p = athleteDocData.personal || {};
    const m = athleteDocData.medicalPhysical || {};
    const a = athleteDocData.athletic || {};
    const l = athleteDocData.playingLevel || {};

    const createRow = (label, val) => `<div class="flex flex-col pb-2 border-b border-gray-50 mb-2"><span class="text-xs text-gray-400 font-bold uppercase">${label}</span><span class="text-sm font-medium text-gray-800 break-words">${val || "-"}</span></div>`;

    let html = "";
    html += createRow(getTranslation("lbl_name"), p.fullName);
    html += createRow(getTranslation("lbl_dob"), p.dob ? new Date(p.dob).toLocaleDateString() : "-");
    html += createRow(getTranslation("lbl_gender"), p.gender);
    html += createRow(getTranslation("lbl_phone"), p.phone);
    html += createRow(getTranslation("lbl_email"), p.email);
    html += createRow(getTranslation("lbl_address"), p.address ? `${p.address.street}, ${p.address.city}` : "-");
    html += createRow(getTranslation("lbl_height"), `${m.height || "-"} cm`);
    html += createRow(getTranslation("lbl_weight"), `${m.weight || "-"} kg`);
    html += createRow(getTranslation("lbl_blood"), m.blood);
    html += createRow(getTranslation("lbl_medical"), m.medical);

    // Add Squad Display
    const squadName = athleteDocData.squad ? athleteDocData.squad.name : getTranslation("lbl_unassigned");
    html += createRow(getTranslation("lbl_squad"), squadName);

    html += createRow(getTranslation("lbl_category"), a.category);
    html += createRow(getTranslation("lbl_coach"), a.coach);
    html += createRow(getTranslation("lbl_training"), a.trainingDays);
    html += createRow(getTranslation("lbl_school"), l.school);
    html += createRow(getTranslation("lbl_club"), l.club);
    fullProfileList.innerHTML = html;
}

function renderDocuments() {
    if (officialDocsGrid) officialDocsGrid.innerHTML = "";
    const docs = athleteDocData.documents || {};
    let hasOfficial = false;

    const addCard = (container, label, url) => {
        if (url && url.length > 5) {
            createDocCard(container, label, url);
            hasOfficial = true;
        }
    };

    addCard(officialDocsGrid, getTranslation("lbl_id_doc"), docs.idDoc);
    addCard(officialDocsGrid, getTranslation("lbl_club_letter"), docs.clubIDDoc);
    addCard(officialDocsGrid, getTranslation("lbl_consent_form"), docs.consentDoc);

    if (noOfficialDocsText) noOfficialDocsText.classList.toggle("hidden", hasOfficial);
}

function createDocCard(container, label, url) {
    const div = document.createElement("div");
    div.className = "bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-2";
    div.innerHTML = `
        <div class="flex items-center justify-between"><span class="text-sm font-semibold text-gray-700 truncate pr-2">${label}</span><div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">📄</div></div>
        <div class="flex justify-between items-center mt-2"><button onclick="viewDocument('${url}')" class="text-xs text-white bg-[var(--secondary)] px-3 py-1 rounded-full font-bold hover:bg-[var(--primary)] transition">View</button><span class="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-medium">Official</span></div>
    `;
    container.appendChild(div);
}

function renderAchievements() {
    if (!achievementsWrapper) return;
    achievementsWrapper.innerHTML = "";

    const verifications = athleteDocData.verifications || {};
    const achList = athleteDocData.achievementsList || []; // Array of objects

    // Generate Dropdowns
    const athletic = athleteDocData.athletic || {};
    const events = athletic.events || [];
    const eventNames = events.map(e => e.event);
    const historyEvents = Object.keys(athleteDocData.performanceResults || {});
    let allEvents = [...new Set([...eventNames, ...historyEvents])];

    // Fallback events if none found
    if (allEvents.length === 0) {
        allEvents = ["100m", "200m", "400m", "800m", "1500m", "Long Jump", "High Jump", "Shot Put", "Javelin", "Discus"];
    }

    const eventOptions = allEvents.map(e => `<option value="${e}">${e}</option>`).join("");
    const ageOptions = ["U12", "U14", "U16", "U18", "U20", "Open"].map(a => `<option value="${a}">${a}</option>`).join("");

    for (let i = 0; i < 3; i++) {
        const ach = achList[i]; // Access by index 0,1,2
        const slotDiv = document.createElement("div");
        slotDiv.className = "border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 relative";

        if (ach) {
            // View Mode
            // ach has { id, ... }
            const isVerified = verifications[ach.id] && verifications[ach.id].verified;
            let badge = "";

            if (isVerified) {
                const vData = verifications[ach.id];
                badge = `<div class="group relative inline-block"><span class="verified-badge bg-green-100 text-green-700 border border-green-200 cursor-help">✓ ${getTranslation("tag_verified")}</span><div class="hidden group-hover:block absolute bottom-full right-0 mb-2 w-56 bg-gray-800 text-white text-xs rounded p-2 shadow-lg z-50"><p class="font-bold">${getTranslation("lbl_coach")}: ${vData.by}</p><p class="text-[10px]">ID: ${vData.coachId}</p></div></div>`;
            } else {
                badge = `<button onclick="openVerifyModal('${ach.id}')" class="text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded transition font-bold">${getTranslation("btn_verify")}</button>`;
            }

            slotDiv.classList.remove("border-dashed");
            slotDiv.classList.add("border-gray-200", "bg-white", "shadow-sm");
            slotDiv.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h4 class="text-xs font-bold text-[var(--primary)] uppercase">${getTranslation("lbl_achievement")} ${i + 1}</h4>
                    <button onclick="removeSlot(${ach.id})" class="text-red-500 hover:text-red-700 text-xs font-bold bg-white px-2 py-1 rounded border border-red-100 shadow-sm">${getTranslation("btn_remove")}</button>
                </div>
                <div class="mb-3 space-y-1">
                    <p class="text-xs text-gray-700"><b>${getTranslation("lbl_event")}:</b> ${ach.event}</p>
                    <p class="text-xs text-gray-700"><b>${getTranslation("lbl_meet")}:</b> ${ach.meet}</p>
                    <p class="text-xs text-gray-700"><b>${getTranslation("lbl_place")}:</b> ${ach.place}</p>
                    <p class="text-xs text-gray-700"><b>${getTranslation("lbl_category")}:</b> ${ach.age}</p>
                </div>
                <div class="flex justify-between items-center border-t border-gray-100 pt-2">
                    <button onclick="viewDocument('${ach.url}')" class="text-xs text-white bg-[var(--secondary)] px-3 py-1 rounded-full font-bold hover:bg-[var(--primary)] transition">View</button>
                    ${badge}
                </div>
            `;
        } else {
            // Edit Mode
            slotDiv.innerHTML = `
                <h4 class="text-xs font-bold text-gray-400 uppercase mb-3">${getTranslation("lbl_achievement")} ${i + 1}</h4>
                <p class="text-[10px] text-gray-500 mb-3 italic">${getTranslation("lbl_upload_achievement_hint")}</p>
                <div class="space-y-2">
                    <select id="slot_${i}_event" class="w-full text-xs p-2 rounded border border-gray-300 outline-none text-gray-500"><option value="" disabled selected>${getTranslation("lbl_select_event")}</option>${eventOptions}</select>
                    <select id="slot_${i}_age" class="w-full text-xs p-2 rounded border border-gray-300 outline-none text-gray-500"><option value="" disabled selected>${getTranslation("lbl_select_age")}</option>${ageOptions}</select>
                    
                    <input type="text" id="slot_${i}_meet" placeholder="${getTranslation("placeholder_meet")}" class="w-full text-xs p-2 rounded border border-gray-300 outline-none">
                    <input type="text" id="slot_${i}_place" placeholder="${getTranslation("placeholder_place")}" class="w-full text-xs p-2 rounded border border-gray-300 outline-none">
                    
                    <div class="flex gap-2 items-center pt-1">
                        <input type="file" id="slot_${i}_file" accept=".jpg, .jpeg, .png, .pdf, application/pdf, image/png, image/jpeg, image/jpg" class="hidden" onchange="document.getElementById('slot_${i}_btn').textContent = this.files[0].name">
                        <button onclick="document.getElementById('slot_${i}_file').click()" id="slot_${i}_btn" class="text-[10px] bg-white text-gray-600 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100 flex-1 text-left truncate">${getTranslation("btn_select_file")}</button>
                        <button onclick="uploadSlot(${i}, this)" class="px-3 py-1 bg-[var(--highlight)] text-[var(--primary)] font-bold rounded-lg hover:bg-yellow-400 shadow-md transition text-xs">${getTranslation("btn_add")}</button>
                    </div>
                </div>
            `;
        }
        achievementsWrapper.appendChild(slotDiv);
    }
}

// Upload Logic
window.uploadSlot = async (index, btnElement) => {
    const event = document.getElementById(`slot_${index}_event`).value.trim();
    const age = document.getElementById(`slot_${index}_age`).value.trim();
    const meet = document.getElementById(`slot_${index}_meet`).value.trim();
    const place = document.getElementById(`slot_${index}_place`).value.trim();
    const fileInput = document.getElementById(`slot_${index}_file`);

    if (!event || !age || !meet || !place || !fileInput.files[0]) {
        console.warn("Validation failed:", { event, age, meet, place, file: fileInput.files[0] });
        return showMessage(getTranslation("msg_fill_all_upload"), "error");
    }

    const file = fileInput.files[0];
    if (file.size > 2 * 1024 * 1024) return showMessage(getTranslation("msg_file_too_large"), "error");

    if (btnElement) {
        btnElement.textContent = "...";
        btnElement.disabled = true;
    }

    try {
        const downloadUrl = await uploadFile(file, currentUID, "achievement");
        const date = new Date().toISOString().split('T')[0];

        const data = { event, meet, place, age, url: downloadUrl, date };
        const res = await addAchievement(currentUID, data);

        // Update Local
        const newAch = { ...data, id: res.id };
        if (!athleteDocData.achievementsList) athleteDocData.achievementsList = [];
        // Insert at first empty slot (although layout assumes order 0,1,2, database result doesn't guarantee this if we just push)
        // Actually, backend returns list naturally.
        // But here we want immediate update.
        // We know we are at `index`.
        athleteDocData.achievementsList[index] = newAch;
        athleteDocData.achievementsList = athleteDocData.achievementsList.filter(n => n); // Compact

        renderAchievements();
        showMessage(getTranslation("msg_ach_added"), "success");

    } catch (err) {
        console.error("Achievement Upload Error:", err);
        showMessage(getTranslation("msg_upload_failed") + (err.message || "Unknown error"), "error");
        if (btnElement) {
            btnElement.textContent = getTranslation("btn_add");
            btnElement.disabled = false;
        }
    }
};

window.removeSlot = async (achId) => {
    if (!confirm(getTranslation("msg_confirm_remove_ach"))) return;
    try {
        await removeAchievement(currentUID, achId);

        // Local Update
        athleteDocData.achievementsList = athleteDocData.achievementsList.filter(a => a.id !== achId);
        renderAchievements();
        showMessage(getTranslation("msg_removed"), "info");
    } catch (err) {
        console.error(err);
        showMessage(getTranslation("msg_remove_failed"), "error");
    }
};

// Document Viewer
// Document Viewer
window.viewDocument = (url) => {
    console.log("Viewing document:", url);
    if (!url) return;

    let displayUrl = url;
    // Fix relative URLs (prepend backend URL if it's not a full absolute URL)
    if (!displayUrl.startsWith('http') && !displayUrl.startsWith('blob:') && !displayUrl.startsWith('data:')) {
        const cleanPath = displayUrl.startsWith('/') ? displayUrl : '/' + displayUrl;
        displayUrl = BACKEND_URL + cleanPath;
    }

    console.log("Resolved Display URL:", displayUrl);

    if (docContentArea) {
        docContentArea.innerHTML = `<p class="text-gray-500">${getTranslation("txt_loading")}</p>`;
    }
    if (docViewModal) {
        docViewModal.classList.remove('hidden');
    }

    const isPdf = displayUrl.toLowerCase().includes('.pdf') || displayUrl.includes('application/pdf');
    if (isPdf) {
        if (docContentArea) docContentArea.innerHTML = `<iframe src="${displayUrl}" class="w-full h-full border-none rounded"></iframe>`;
    } else {
        if (docContentArea) docContentArea.innerHTML = `<img src="${displayUrl}" class="max-w-full max-h-full object-contain shadow-lg" alt="Document" onerror="this.style.display='none'; this.parentElement.innerHTML='<p class=\'text-red-500\'>Failed to load image</p>';">`;
    }
};

window.closeDocViewer = () => {
    if (docViewModal) docViewModal.classList.add('hidden');
    if (docContentArea) docContentArea.innerHTML = '';
};

// Verification Logic (Placeholder Functionality in Dashboard)
window.openVerifyModal = (docKey) => {
    currentVerifyingDoc = docKey;
    verifierNameInput.value = ""; verifierNotesInput.value = ""; document.getElementById("verifierID").value = "";
    verifyModal.classList.remove("hidden");
};
cancelVerifyBtn.addEventListener("click", () => verifyModal.classList.add("hidden"));

confirmVerifyBtn.addEventListener("click", async () => {
    const name = verifierNameInput.value.trim();
    const coachId = document.getElementById("verifierID").value.trim();
    const notes = verifierNotesInput.value.trim();

    if (!name || !coachId) return alert(getTranslation("msg_verify_req"));

    confirmVerifyBtn.disabled = true;
    try {
        const vData = { by: name, coachId: coachId, notes: notes, at: new Date().toISOString() };

        await verifyAchievement(currentUID, currentVerifyingDoc, vData);

        // Local Update
        if (!athleteDocData.verifications) athleteDocData.verifications = {};
        athleteDocData.verifications[currentVerifyingDoc] = { verified: true, ...vData };

        renderAchievements();
        verifyModal.classList.add("hidden");
        showMessage(getTranslation("msg_verified"), "success");
    } catch (err) { console.error(err); showMessage(getTranslation("msg_failed"), "error"); }
    finally { confirmVerifyBtn.disabled = false; }
});

// Graph Logic
function populateEventDropdowns() {
    const athletic = athleteDocData.athletic || {};
    const events = athletic.events || [];
    const eventNames = events.map(e => e.event);
    const historyEvents = Object.keys(athleteDocData.performanceResults || {});
    let allEvents = [...new Set([...eventNames, ...historyEvents])];
    if (allEvents.length === 0) allEvents = ["100m", "200m", "400m", "800m", "1500m"];

    const opts = allEvents.map(e => `<option value="${e}">${e}</option>`).join("");
    eventSelect.innerHTML = opts;
    performanceEventSelect.innerHTML = opts;
}

function renderPerformanceGraph(eventName) {
    if (graphEventLabel) graphEventLabel.textContent = eventName;
    const allResults = athleteDocData.performanceResults || {};
    let dataPoints = allResults[eventName] || [];

    dataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter duplicates per day? No.

    if (dataPoints.length === 0) {
        if (noPerformanceText) noPerformanceText.classList.remove("hidden");
        Plotly.newPlot(performanceChartDiv, [], { title: getTranslation("lbl_no_data"), xaxis: { showgrid: false }, yaxis: { showgrid: false } });
        return;
    }
    if (noPerformanceText) noPerformanceText.classList.add("hidden");

    const trace = {
        x: dataPoints.map(d => d.date),
        y: dataPoints.map(d => d.time),
        type: 'scatter', mode: 'lines+markers',
        line: { color: '#012A61', width: 3 },
        marker: { color: '#FDC787', size: 10 }
    };
    const layout = {
        title: { text: `${eventName} ${getTranslation("lbl_progression_suffix")}`, font: { size: 16, color: '#012A61', family: "Montserrat" } },
        xaxis: { title: "Date" }, yaxis: { title: "Time (s)" },
        margin: { t: 40, b: 40, l: 50, r: 20 }, font: { family: "Montserrat" }
    };
    Plotly.newPlot(performanceChartDiv, [trace], layout, { responsive: true, displayModeBar: false });
}

eventSelect?.addEventListener("change", () => renderPerformanceGraph(eventSelect.value));

performanceForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUID) return;
    const evt = performanceEventSelect.value;
    const date = performanceDateInput.value;
    const time = parseFloat(performanceTimeInput.value);

    if (eventTimeLimits[evt]) {
        if (time < eventTimeLimits[evt].min || time > eventTimeLimits[evt].max) {
            showMessage(getTranslation("msg_time_unrealistic").replace("{event}", evt), "error");
            return;
        }
    }

    try {
        showLoading();
        performanceSubmitBtn.disabled = true;
        performanceSubmitBtn.textContent = getTranslation("btn_saving");

        await addPerformance(currentUID, { event: evt, date, time });

        const newEntry = { date, time, createdAt: new Date().toISOString() };
        if (!athleteDocData.performanceResults) athleteDocData.performanceResults = {};
        if (!athleteDocData.performanceResults[evt]) athleteDocData.performanceResults[evt] = [];
        athleteDocData.performanceResults[evt].push(newEntry);

        showMessage(getTranslation("msg_result_added"), "success");
        if (eventSelect.value === evt) renderPerformanceGraph(evt);
        performanceForm.reset();
    } catch (err) {
        console.error(err);
        showMessage(getTranslation("msg_error_save_result"), "error");
    } finally {
        hideLoading();
        performanceSubmitBtn.disabled = false;
        performanceSubmitBtn.textContent = getTranslation("btn_save_result");
    }
});