import {
    auth,
    onAuthChange,
    signOut,
    getCoachProfile,
    getAthleteProfile,
    saveCoachProfile,
    uploadFile,
    BACKEND_URL
} from "./register.js";
import { updateNavbar } from "./ui-utils.js";
import { fixImageUrl, getImageErrorHandler } from "./ui-utils.js";
import { getTranslation } from "./i18n.js";

// DOM Elements
const navUserBtn = document.getElementById("navUserBtn");
const navUserDropdown = document.getElementById("navUserDropdown");
const navUserEmail = document.getElementById("navUserEmail");
const navUserPic = document.getElementById("navUserPic");
const navProfileInput = document.getElementById("navProfileInput");

const mobileUserName = document.getElementById("mobileUserName");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileMenu = document.getElementById("mobileMenu");
const mobileBackdrop = document.getElementById("mobileMenuBackdrop");
const mobileBackBtn = document.getElementById("mobileBackBtn");
const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
const mobileImg = document.getElementById("mobileUserImg");

const heroUserDisplay = document.getElementById("heroUserDisplay");
const logoutBtn = document.getElementById("logoutBtn");
const createProfileBtn = document.getElementById("createProfileBtn");
const contactSupportBtn = document.getElementById("contactSupportBtn");

// State
let currentCoachData = null;
let currentUser = null;

// Listen for language changes
window.addEventListener("languageChanged", () => {
    if (currentUser) updateCoachUI(currentUser, currentCoachData);
});

// UI Toggle
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

// Auth State
onAuthChange(async (user) => {
    if (user) {
        currentUser = user;
        // Update Navbar immediately
        updateNavbar(user, null);

        try {
            const data = await getCoachProfile(user.uid);
            if (data && data.exists) {
                currentCoachData = data;
                // Cache username
                const name = data.username || data.fullName?.split(" ")[0];
                if (name) localStorage.setItem("tt_username", name);
            }
        } catch (err) {
            console.error("Error checking profile:", err);
        }

        updateCoachUI(user, currentCoachData);

        // Profile Upload Setup
        if (navUserPic && navProfileInput) {
            setupProfileUpload(user);
        }

    } else {
        window.location.href = "index.html";
    }
});

function updateCoachUI(user, coachData) {
    const onboarding = document.getElementById("onboardingState");
    const dashboard = document.getElementById("dashboardState");

    let name = user.displayName || localStorage.getItem("tt_username") || user.email.split("@")[0];
    let isProfileComplete = false;
    let isVerified = false;

    if (coachData) {
        isProfileComplete = !!coachData.fullName;
        isVerified = coachData.status && coachData.status.toLowerCase() === "approved";
        name = coachData.username || coachData.fullName?.split(" ")[0] || name;

        const statSquads = document.getElementById("statSquads");
        const statAthletes = document.getElementById("statAthletes");
        if (statSquads) statSquads.textContent = (coachData.squads || []).length.toString().padStart(2, '0');
        if (statAthletes) statAthletes.textContent = (coachData.favorites || []).length.toString().padStart(2, '0');
    }

    // Update Navbar
    updateNavbar(user, coachData);
    if (heroUserDisplay) heroUserDisplay.textContent = name;

    // State Logic
    if (onboarding && dashboard) {
        if (!isProfileComplete) {
            onboarding.classList.remove("hidden");
            dashboard.classList.add("hidden");

            const heroTitle = onboarding.querySelector("h1");
            const heroSubtitle = onboarding.querySelector("p");
            const ctaBtn = document.getElementById("createProfileBtn");

            if (heroTitle) heroTitle.textContent = getTranslation("coach_welcome_title");
            if (heroSubtitle) heroSubtitle.textContent = getTranslation("coach_setup_profile");
            if (ctaBtn) ctaBtn.classList.remove("hidden");

        } else if (!isVerified) {
            onboarding.classList.remove("hidden");
            dashboard.classList.add("hidden");

            const heroTitle = onboarding.querySelector("h1");
            const heroSubtitle = onboarding.querySelector("p");
            const ctaBtn = document.getElementById("createProfileBtn");

            if (heroTitle) heroTitle.textContent = getTranslation("coach_profile_review");
            if (heroSubtitle) heroSubtitle.textContent = `${getTranslation("coach_status_msg")} ${coachData?.status?.toUpperCase() || "PENDING"}`;
            if (ctaBtn) ctaBtn.classList.add("hidden");

        } else {
            onboarding.classList.add("hidden");
            dashboard.classList.remove("hidden");
            if (coachData && coachData.favorites) {
                fetchWatchlist(coachData.favorites);
            }
        }
    }

    // Verification Badge
    const vBanner = document.getElementById("verificationBanner");
    const vBadge = document.getElementById("verificationBadge");
    const vText = document.getElementById("verificationStatusText");

    if (isProfileComplete && !isVerified) {
        if (vBanner) vBanner.classList.remove("hidden");
    } else {
        if (vBanner) vBanner.classList.add("hidden");
    }

    if (vBadge) {
        if (isVerified) {
            vBadge.classList.replace("bg-amber-500", "bg-green-500");
            if (vText) vText.textContent = getTranslation("status_verified_pro");
        } else {
            vBadge.classList.replace("bg-green-500", "bg-amber-500");
            if (vText) vText.textContent = getTranslation("status_pending_verify");
        }
    }
}

function setupProfileUpload(user) {
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const navBtnText = document.getElementById("navBtnText"); // Ensure this is selected if needed, or was it a variable? It was DOM usually.
        // It was selected implicitly by ID in previous code, let's select it safely.
        const btnText = document.getElementById("navBtnText");

        let originalText = "";
        if (btnText) {
            originalText = btnText.textContent;
            btnText.textContent = "Uploading...";
        }

        try {
            // Upload file first
            // Upload file first
            const uploadUrl = await uploadFile(file, user.uid, "profilePic");

            // Safety check: Fetch fresh data just in case
            const freshData = await getCoachProfile(user.uid);
            const dataToSave = (freshData && freshData.exists) ? freshData : (currentCoachData || {});

            dataToSave.profilePic = uploadUrl;

            // Update backend
            await saveCoachProfile(user.uid, dataToSave);

            // Update Local State
            currentCoachData = dataToSave;

            const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
            const displayUrl = isPdf ? "https://cdn-icons-png.flaticon.com/512/337/337946.png" : uploadUrl;

            const imgEl = document.getElementById("navUserImg");
            if (imgEl) {
                imgEl.src = fixImageUrl(displayUrl, name);
                imgEl.classList.remove("hidden");
            }
            if (mobileImg) mobileImg.src = fixImageUrl(displayUrl, name);

            if (btnText) btnText.textContent = originalText;
            alert(getTranslation("alert_pic_updated"));
        } catch (err) {
            console.error(err);
            alert("Failed to upload image.");
            if (btnText) btnText.textContent = originalText;
        }
    };
    navProfileInput.onchange = handleUpload;
}

// Dropdown and Logout are handled globally by ui-utils.js updateNavbar()
async function fetchWatchlist(favorites) {
    const summaryList = document.getElementById("watchlistSummary");
    const emptyState = document.getElementById("emptyWatchlist");
    if (!summaryList) return;

    if (!favorites || favorites.length === 0) {
        summaryList.innerHTML = "";
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (emptyState) emptyState.classList.add("hidden");
    summaryList.innerHTML = "";

    const previewIds = favorites.slice(0, 4);

    for (const athleteId of previewIds) {
        try {
            const aData = await getAthleteProfile(athleteId);
            if (aData && aData.exists) {
                const aName = aData.personal?.fullName || aData.username || "Athlete";
                let aPic = aData.documents?.profilePic;

                const aCat = aData.athletic?.category || "U20";

                const card = document.createElement("a");
                card.href = `view-athlete.html?id=${athleteId}`; // Needs `view-athlete.html` to be updated too?
                card.className = "bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all flex flex-col items-center text-center group";
                card.innerHTML = `
                    <img src="${fixImageUrl(aPic, aName, 100)}" class="w-16 h-16 rounded-2xl object-cover mb-4 border-2 border-slate-50 group-hover:scale-110 transition-transform" onerror="${getImageErrorHandler(aName, 100)}">
                    <p class="font-black text-[var(--primary)] text-sm mb-1">${aName}</p>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${aCat} Category</span>
                `;
                summaryList.appendChild(card);
            }
        } catch (e) { console.error(e); }
    }
}

// handleLogout handled globally


contactSupportBtn?.addEventListener("click", () => {
    const supportNumber = "+94xxxxxxxxx";
    const msg = encodeURIComponent("Hello Talent Tracker Support, I am a coach and I need some help.");
    window.open(`https://wa.me/${supportNumber.replace(/\D/g, '')}?text=${msg}`, '_blank');
});