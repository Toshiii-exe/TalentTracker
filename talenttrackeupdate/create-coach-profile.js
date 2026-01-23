import {
    auth,
    onAuthChange,
    getCoachProfile,
    saveCoachProfile,
    uploadFile
} from "./register.js";
import { showLoading, hideLoading, showSuccessModal } from "./ui-utils.js";
import { setupDropdownInput, syncDropdown, CITIES, DISTRICTS, PROVINCES } from "./locations.js";
import { getTranslation } from "./i18n.js";

let currentUID = null;
const form = document.getElementById("coachProfileForm");

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }
    currentUID = user.uid || user.id;

    const emailInput = document.getElementById("email");
    if (emailInput) {
        emailInput.value = user.email || "";
    }
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
        if (!phoneInput.value && user.phone) {
            phoneInput.value = user.phone;
        }
    }

    try {
        const data = await getCoachProfile(currentUID);
        if (data && data.exists) {

            if (data.fullName) document.getElementById("fullName").value = data.fullName;
            if (data.gender) document.getElementById("gender").value = data.gender;
            if (data.dob) document.getElementById("dob").value = data.dob ? data.dob.substring(0, 10) : "";
            if (data.nationality) document.getElementById("nationality").value = data.nationality;
            if (data.nic) document.getElementById("nic").value = data.nic;
            if (data.phone) document.getElementById("phone").value = data.phone;
            if (data.street) document.getElementById("street").value = data.street;
            if (data.city) document.getElementById("city").value = data.city;
            if (data.district) document.getElementById("district").value = data.district;
            if (data.province) document.getElementById("province").value = data.province;
            if (data.province) document.getElementById("province").value = data.province;
            if (data.sports) {
                const events = data.sports.split(',').map(s => s.trim());
                events.forEach(evt => {
                    const cb = document.querySelector(`input[name="sportEvent"][value="${evt}"]`);
                    if (cb) cb.checked = true;
                });
            }
            if (data.coachingLevel) document.getElementById("coachingLevel").value = data.coachingLevel;
            if (data.coachingRole) document.getElementById("coachingRole").value = data.coachingRole;
            if (data.experience) document.getElementById("experience").value = data.experience;
            if (data.organization) document.getElementById("organization").value = data.organization;
            if (data.highestQual) document.getElementById("highestQual").value = data.highestQual;
            if (data.issuingAuthority) document.getElementById("issuingAuthority").value = data.issuingAuthority;
            if (data.certId) document.getElementById("certId").value = data.certId;
            if (data.availDays) document.getElementById("availDays").value = data.availDays;
            if (data.timeSlots) document.getElementById("timeSlots").value = data.timeSlots;
            if (data.locationPref) document.getElementById("locationPref").value = data.locationPref;

            if (data.profilePic) {
                const previewImg = document.getElementById("previewImg");
                const previewIcon = document.querySelector("#photoPreview svg");
                if (previewImg) {
                    previewImg.src = data.profilePic;
                    previewImg.classList.remove("hidden");
                    if (previewIcon) previewIcon.classList.add("hidden");
                }
            }
        }

        // Prefill from user account
        if (document.getElementById("email")) {
            if (user.email) {
                document.getElementById("email").value = user.email;
                document.getElementById("email").readOnly = true;
            } else {
                document.getElementById("email").value = "";
                document.getElementById("email").readOnly = false;
            }
        }
        if (document.getElementById("phone") && !document.getElementById("phone").value) {
            document.getElementById("phone").value = user.phone || "";
        }

        // Sync Locations
        syncDropdown("citySelect", "city", CITIES);
        syncDropdown("districtSelect", "district", DISTRICTS);
        syncDropdown("provinceSelect", "province", PROVINCES);

        const navBtnText = document.getElementById("navBtnText");
        const navUserPic = document.getElementById("navUserPic");
        const navUserImg = document.getElementById("navUserImg");

        let username = user.displayName || user.username || localStorage.getItem("tt_username") || user.email.split("@")[0];
        let profilePic = null;

        if (data && data.exists) {
            username = data.username || data.fullName?.split(" ")[0] || username;
            profilePic = data.profilePic || null;
            if (username) localStorage.setItem("tt_username", username);
        }

        if (navBtnText) navBtnText.textContent = username;

        if (navUserPic && navUserImg) {
            navUserPic.classList.remove("hidden");
            const avatar = profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=012A61&color=fff`;
            navUserImg.src = avatar;
            navUserImg.classList.remove("hidden");
        }

    } catch (err) {
        console.error("Error checking coach profile:", err);
    }

    // Set max date for DOB to ensure coaches are at least 22 years old
    const dobInput = document.getElementById("dob");
    if (dobInput) {
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 22, today.getMonth(), today.getDate());
        const maxDateString = maxDate.toISOString().split('T')[0];
        dobInput.setAttribute('max', maxDateString);
    }

    // Navbar Dropdown Logic
    const navUserBtn = document.getElementById("navUserBtn");
    const navUserDropdown = document.getElementById("navUserDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    if (navUserBtn && navUserDropdown) {
        navUserBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navUserDropdown.classList.toggle("hidden");
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                const { signOut } = await import("./register.js");
                await signOut();
                localStorage.removeItem("tt_username");
                localStorage.removeItem("tt_role");
                window.location.href = "index.html";
            } catch (err) {
                console.error("Logout failed:", err);
            }
        });
    }

    window.addEventListener("click", () => {
        if (navUserDropdown) navUserDropdown.classList.add("hidden");
    });
});

const photoInput = document.getElementById("coachPhoto");
const previewImg = document.getElementById("previewImg");
const photoPreviewIcon = document.querySelector("#photoPreview svg");

if (photoInput) {
    photoInput.addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
            const isPdf = (file.type && file.type.toLowerCase().includes("pdf")) || /\.pdf$/i.test(file.name);
            if (isPdf) {
                if (previewImg) {
                    previewImg.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png";
                    previewImg.classList.remove("hidden");
                    if (photoPreviewIcon) photoPreviewIcon.classList.add("hidden");
                }
            } else {
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (previewImg) {
                        previewImg.src = e.target.result;
                        previewImg.classList.remove("hidden");
                        if (photoPreviewIcon) photoPreviewIcon.classList.add("hidden");
                    }
                }
                reader.readAsDataURL(file);
            }
        }
    });
}

// Helper to convert base64 (still used for preview, but real upload via API)
// Actually we can upload the file directly on submit.

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    document.querySelectorAll(".error-text").forEach(el => el.classList.remove("visible"));
    document.querySelectorAll(".input, .textarea, .checkbox-container").forEach(el => el.classList.remove("input-error"));

    let isValid = true;

    const validateField = (id) => {
        const el = document.getElementById(id);
        const err = document.getElementById(`error-${id}`);
        if (!el) return;

        // Force sync for city dropdown if not 'Other'
        if (id === "city") {
            const select = document.getElementById("citySelect");
            if (select && select.value && select.value !== "Other") {
                el.value = select.value;
            }
        }

        if (!el.value || !el.value.trim()) {
            if (err) err.classList.add("visible");
            el.classList.add("input-error");
            isValid = false;
        }
    };

    const requiredFields = [
        "fullName", "gender", "dob", "nationality", "nic",
        "phone", "street", "city", "district", "province",
        "coachingLevel", "coachingRole", "experience", "organization",
        "highestQual", "issuingAuthority", "certId"
    ];

    requiredFields.forEach(validateField);

    // Email format validation
    const emailInput = document.getElementById("email");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailInput.value || !emailInput.value.trim()) {
        // Empty email field
        document.getElementById("error-email").textContent = getTranslation("err_email_req") || "Valid email address is required.";
        document.getElementById("error-email").classList.add("visible");
        emailInput.classList.add("input-error");
        isValid = false;
    } else if (!emailPattern.test(emailInput.value.trim())) {
        // Invalid email format
        document.getElementById("error-email").textContent = getTranslation("err_email_fmt") || "Please enter a valid email address";
        document.getElementById("error-email").classList.add("visible");
        emailInput.classList.add("input-error");
        isValid = false;
    }

    const dobInput = document.getElementById("dob");
    if (dobInput.value) {
        const dob = new Date(dobInput.value);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
        if (age < 22) {
            document.getElementById("error-dob").textContent = getTranslation("err_dob_min_age_js") || "You must be at least 22 years old to register as a coach";
            document.getElementById("error-dob").classList.add("visible");
            dobInput.classList.add("input-error");
            isValid = false;
        } else if (age > 100) {
            document.getElementById("error-dob").textContent = getTranslation("err_dob_max") || "Invalid age (Max 100)";
            document.getElementById("error-dob").classList.add("visible");
            dobInput.classList.add("input-error");
            isValid = false;
        }
    }

    const expInput = document.getElementById("experience");
    if (expInput.value && parseInt(expInput.value) < 0) {
        document.getElementById("error-experience").textContent = getTranslation("err_exp_neg") || "Experience cannot be negative";
        document.getElementById("error-experience").classList.add("visible");
        isValid = false;
    }

    const phoneInput = document.getElementById("phone");
    if (phoneInput.value) {
        // Sri Lankan Phone Validation: Supports 07... , +947... , 947... , 7...
        const slPhoneRegex = /^(?:0|94|\+94)?(?:7[01245678]|11|2[134567]|3[12345678]|4[157]|5[12457]|6[3567]|81|91)\d{7}$/;
        if (!slPhoneRegex.test(phoneInput.value)) {
            document.getElementById("error-phone").textContent = getTranslation("err_phone_sl") || "Invalid Sri Lankan phone number";
            document.getElementById("error-phone").classList.add("visible");
            isValid = false;
        }
    }

    const nicInput = document.getElementById("nic");
    if (nicInput.value) {
        const nicValue = nicInput.value.trim().toUpperCase();

        // Sri Lankan NIC patterns:
        // Old format: 9 digits + V or X (e.g., 123456789V)
        // New format: 12 digits (e.g., 200012345678)
        // Passport: Alphanumeric, typically 6-9 characters (e.g., N1234567)

        const oldNicPattern = /^[0-9]{9}[VX]$/;
        const newNicPattern = /^[0-9]{12}$/;
        const passportPattern = /^[A-Z0-9]{6,9}$/;

        const isValidOldNic = oldNicPattern.test(nicValue);
        const isValidNewNic = newNicPattern.test(nicValue);
        const isValidPassport = passportPattern.test(nicValue);

        if (!isValidOldNic && !isValidNewNic && !isValidPassport) {
            document.getElementById("error-nic").textContent = getTranslation("err_nic_fmt") || "Invalid format. Use: 9 digits+V/X, 12 digits, or passport (6-9 chars)";
            document.getElementById("error-nic").classList.add("visible");
            nicInput.classList.add("input-error");
            isValid = false;
        }
    }

    const certInput = document.getElementById("certDoc");
    const certErr = document.getElementById("error-certDoc");

    // Check if we have an existing certificate
    const previewImgEl = document.getElementById("previewImg"); // This is for photo though. 
    // Wait, the coach profile doesn't show a certificate preview.
    // I should check existingData.certDoc.

    let certExists = false;
    try {
        const d = await getCoachProfile(currentUID);
        if (d && d.exists && d.certDoc) certExists = true;
    } catch (e) { }

    if (!certInput.files.length && !certExists) {
        certErr.classList.add("visible");
        certInput.classList.add("input-error");
        isValid = false;
    } else if (certInput.files.length > 0) {
        const file = certInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
            certErr.textContent = getTranslation("msg_max_5mb") || "File too large (Max 5MB)";
            certErr.classList.add("visible");
            isValid = false;
        }
    }



    // Validate Sports Checkboxes
    const selectedSports = Array.from(document.querySelectorAll('input[name="sportEvent"]:checked'));
    if (selectedSports.length === 0) {
        document.getElementById("error-sports").classList.add("visible");
        document.getElementById("sportsContainer").classList.add("input-error");
        isValid = false;
    }

    const terms = document.getElementById("termsConsent");
    const dataUsage = document.getElementById("dataConsent");
    const authC = document.getElementById("authConsent");
    const consentErr = document.getElementById("error-consents");

    if (!terms.checked || !dataUsage.checked || !authC.checked) {
        consentErr.classList.add("visible");
        if (!terms.checked) terms.closest('.checkbox-container').classList.add('input-error');
        if (!dataUsage.checked) dataUsage.closest('.checkbox-container').classList.add('input-error');
        if (!authC.checked) authC.closest('.checkbox-container').classList.add('input-error');
        isValid = false;
    }

    if (!isValid) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    try {
        showLoading();

        let photoUrl = null;
        if (photoInput.files.length > 0) {
            const file = photoInput.files[0];
            photoUrl = await uploadFile(file, currentUID, "profilePic");
        } else {
            // Keep existing?
            const previewImgEl = document.getElementById("previewImg");
            if (previewImgEl && !previewImgEl.classList.contains("hidden")) {
                photoUrl = previewImgEl.src;
            }
        }

        let certUrl = null;
        if (certInput.files.length > 0) {
            const file = certInput.files[0];
            certUrl = await uploadFile(file, currentUID, "certDoc");
        }

        // If certUrl is null (no new file), we should ideally keep the old one.
        // My backend UPDATE query overwrites everything.
        // I should fetch existing data first to merge?
        // Or update backend to IGNORE nulls?
        // My backend logic: `certDoc: certUrl`.
        // If certUrl is null, it saves NULL.
        // So I MUST fetch existing data to preserve old URLs if not uploading new ones.
        // Refetching here to be safe.
        let existingData = {};
        try {
            const d = await getCoachProfile(currentUID);
            if (d && d.exists) existingData = d;
        } catch (e) { }

        if (!photoUrl) photoUrl = existingData.profilePic;
        if (!certUrl) certUrl = existingData.certDoc;


        const profileData = {
            fullName: document.getElementById("fullName").value,
            gender: document.getElementById("gender").value,
            dob: document.getElementById("dob").value,
            nationality: document.getElementById("nationality").value,
            nic: document.getElementById("nic").value,
            profilePic: photoUrl,

            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            street: document.getElementById("street").value,
            city: document.getElementById("city").value,
            district: document.getElementById("district").value,
            province: document.getElementById("province").value,

            sports: Array.from(document.querySelectorAll('input[name="sportEvent"]:checked')).map(cb => cb.value).join(', '),
            coachingLevel: document.getElementById("coachingLevel").value,
            coachingRole: document.getElementById("coachingRole").value,
            experience: parseInt(document.getElementById("experience").value),
            organization: document.getElementById("organization").value,

            highestQual: document.getElementById("highestQual").value,
            issuingAuthority: document.getElementById("issuingAuthority").value,
            certId: document.getElementById("certId").value,
            certDoc: certUrl,

            availDays: document.getElementById("availDays").value || "",
            timeSlots: document.getElementById("timeSlots").value || "",
            locationPref: document.getElementById("locationPref").value || "",

            status: "Pending",
            role: "coach",
            updatedAt: new Date().toISOString()
        };

        await saveCoachProfile(currentUID, profileData);

        hideLoading();
        showSuccessModal(getTranslation("msg_coach_profile_submitted") || "Your coach profile has been submitted for verification!", () => {
            window.location.href = "coach-home.html";
        });

    } catch (error) {
        console.error("Error saving coach profile:", error);
        hideLoading();
        alert(getTranslation("msg_error_save_profile") + ": " + (error.message || error));
    }
});

// Init Location Dropdowns
document.addEventListener('DOMContentLoaded', () => {
    setupDropdownInput('citySelect', 'city', CITIES);
    setupDropdownInput('districtSelect', 'district', DISTRICTS);
    setupDropdownInput('provinceSelect', 'province', PROVINCES);
});
