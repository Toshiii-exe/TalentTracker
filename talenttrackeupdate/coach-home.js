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
        const onboarding = document.getElementById("onboardingState");
        const dashboard = document.getElementById("dashboardState");

        let name = user.displayName || localStorage.getItem("tt_username") || user.email.split("@")[0];
        let profilePic = null;
        let isProfileComplete = false;
        let isVerified = false;
        let coachData = null;

        // Update Navbar immediately
        updateNavbar(user, null);

        try {
            const data = await getCoachProfile(user.uid);
            if (data && data.exists) {
                coachData = data;
                isProfileComplete = !!data.fullName;
                // Check if manually verified (not just "Pending")
                // My Schema default is 'Pending'.
                // If admin sets 'Approved', isVerified = true.
                isVerified = data.status && data.status.toLowerCase() === "approved";

                name = data.username || data.fullName?.split(" ")[0] || name;
                profilePic = data.profilePic || null;

                if (name) localStorage.setItem("tt_username", name);

                const statSquads = document.getElementById("statSquads");
                const statAthletes = document.getElementById("statAthletes");
                if (statSquads) statSquads.textContent = (data.squads || []).length.toString().padStart(2, '0');
                if (statAthletes) statAthletes.textContent = (data.favorites || []).length.toString().padStart(2, '0');
            }
        } catch (err) {
            console.error("Error checking profile:", err);
        }

        // State Logic
        if (onboarding && dashboard) {
            if (!isProfileComplete) {
                onboarding.classList.remove("hidden");
                dashboard.classList.add("hidden");

                const heroTitle = onboarding.querySelector("h1");
                const heroSubtitle = onboarding.querySelector("p");
                const ctaBtn = document.getElementById("createProfileBtn");

                if (heroTitle) heroTitle.textContent = "Welcome, Coach!";
                if (heroSubtitle) heroSubtitle.textContent = "Let's set up your professional profile.";
                if (ctaBtn) ctaBtn.classList.remove("hidden");

            } else if (!isVerified) {
                onboarding.classList.remove("hidden");
                dashboard.classList.add("hidden");

                const heroTitle = onboarding.querySelector("h1");
                const heroSubtitle = onboarding.querySelector("p");
                const ctaBtn = document.getElementById("createProfileBtn");

                if (heroTitle) heroTitle.textContent = "Profile Under Review";
                if (heroSubtitle) heroSubtitle.textContent = `Your profile is complete and waiting for Federation approval.\nStatus: ${coachData?.status?.toUpperCase() || "PENDING"}`;
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
                if (vText) vText.textContent = "Verified Professional";
            } else {
                vBadge.classList.replace("bg-green-500", "bg-amber-500");
                if (vText) vText.textContent = "Pending Verification";
            }
        }

        // Update Navbar
        updateNavbar(user, coachData);
        if (heroUserDisplay) heroUserDisplay.textContent = name;

        // Profile Upload
        if (navUserPic && navProfileInput) {
            const handleUpload = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const originalText = navBtnText.textContent;
                navBtnText.textContent = "Uploading...";
                try {
                    // Upload file first
                    const url = await uploadFile(file, user.uid, "profilePic");

                    // Fetch LATEST full profile to ensure we don't overwrite other fields with stale data or nulls
                    // We can't rely just on `coachData` from the initial load if other tab updated it, but close enough.
                    // Better to re-fetch if possible, or just use `coachData` if we trust it.
                    // Given `coachData` is local state, let's use it but ensure we aren't sending a partial object associated with `saveCoachProfile`.
                    // `saveCoachProfile` expects the full object generally.

                    // Safety check: Fetch fresh data just in case
                    const freshData = await getCoachProfile(user.uid);
                    const dataToSave = (freshData && freshData.exists) ? freshData : (coachData || {});

                    dataToSave.profilePic = url;

                    // Update backend
                    await saveCoachProfile(user.uid, dataToSave);

                    // Update Local State
                    coachData = dataToSave;

                    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
                    const displayUrl = isPdf ? "https://cdn-icons-png.flaticon.com/512/337/337946.png" : url;

                    const imgEl = document.getElementById("navUserImg");
                    if (imgEl) {
                        imgEl.src = displayUrl;
                        imgEl.classList.remove("hidden");
                    }
                    if (mobileImg) mobileImg.src = displayUrl;

                    navBtnText.textContent = originalText;
                    alert("Profile picture updated!");
                } catch (err) {
                    console.error(err);
                    alert("Failed to upload image.");
                    navBtnText.textContent = originalText;
                }
            };
            navProfileInput.onchange = handleUpload;
            navUserPic.onclick = (e) => {
                e.stopPropagation();
                navProfileInput.click();
            }
        }

    } else {
        window.location.href = "index.html";
    }
});

if (navUserBtn) {
    navUserBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        // Direct Logout as requested
        if (confirm("Are you sure you want to logout?")) {
            await handleLogout();
        }
    });
}
// Dropdown hidden listener removed as we don't use dropdown anymore
// window.addEventListener('click', () => { if (navUserDropdown) navUserDropdown.classList.add('hidden'); });

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
                let aPic = aData.documents?.profilePic || "https://ui-avatars.com/api/?name=" + encodeURIComponent(aName);

                // Fix relative paths
                if (aPic && aPic.startsWith('/')) {
                    aPic = BACKEND_URL + aPic;
                }

                const aCat = aData.athletic?.category || "U20";

                const card = document.createElement("a");
                card.href = `view-athlete.html?id=${athleteId}`; // Needs `view-athlete.html` to be updated too?
                card.className = "bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all flex flex-col items-center text-center group";
                card.innerHTML = `
                    <img src="${aPic}" class="w-16 h-16 rounded-2xl object-cover mb-4 border-2 border-slate-50 group-hover:scale-110 transition-transform">
                    <p class="font-black text-[var(--primary)] text-sm mb-1">${aName}</p>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${aCat} Category</span>
                `;
                summaryList.appendChild(card);
            }
        } catch (e) { console.error(e); }
    }
}

const handleLogout = async () => {
    try {
        await signOut(auth);
        localStorage.removeItem("tt_username");
        localStorage.removeItem("tt_role");
        window.location.href = "index.html";
    } catch (error) { console.error("Logout Error", error); }
};
if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", handleLogout);

contactSupportBtn?.addEventListener("click", () => {
    const supportNumber = "+94xxxxxxxxx";
    const msg = encodeURIComponent("Hello Talent Tracker Support, I am a coach and I need some help.");
    window.open(`https://wa.me/${supportNumber.replace(/\D/g, '')}?text=${msg}`, '_blank');
});