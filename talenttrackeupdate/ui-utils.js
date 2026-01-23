import { BACKEND_URL, API_URL } from "./api.js";

// =======================================================
// IMAGE URL UTILITY
// =======================================================

/**
 * Fixes image URLs to ensure they work correctly
 * - Converts relative paths to absolute URLs
 * - Adds cache busting for updated images
 * - Provides fallback for broken images
 * @param {string} imageUrl - The image URL to fix
 * @param {string} fallbackName - Name to use for avatar fallback
 * @param {number} size - Size for avatar fallback (default: 150)
 * @returns {string} Fixed image URL
 */
export function fixImageUrl(imageUrl, fallbackName = "User", size = 150) {
  if (!imageUrl || imageUrl === "null" || imageUrl === "undefined") {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=012A61&color=fff&size=${size}`;
  }

  // If it's a relative path, prepend BACKEND_URL
  if (imageUrl.startsWith('/')) {
    imageUrl = BACKEND_URL + imageUrl;
  }

  // Add cache busting for HTTP URLs (but not for external services)
  if (imageUrl.startsWith('http') && !imageUrl.includes('ui-avatars.com') && !imageUrl.includes('?t=')) {
    imageUrl += '?t=' + new Date().getTime();
  }

  return imageUrl;
}

/**
 * Creates an onerror handler string for img tags
 * @param {string} fallbackName - Name to use for avatar fallback
 * @param {number} size - Size for avatar fallback
 * @returns {string} onerror attribute value
 */
export function getImageErrorHandler(fallbackName = "User", size = 150) {
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=012A61&color=fff&size=${size}`;
  return `this.onerror=null; this.src='${avatarUrl}';`;
}

// =======================================================
// ROLE-BASED NAVIGATION
// =======================================================

/**
 * Gets the appropriate home page URL based on user role
 * @param {string} role - User role ('athlete', 'coach', 'admin')
 * @returns {string} Home page URL for the role
 */
export function getHomePageForRole(role) {
  if (!role) return 'index.html';

  const normalizedRole = role.toLowerCase().trim();
  const roleMap = {
    'athlete': 'athlete-home.html',
    'coach': 'coach-home.html',
    'admin': 'federation-home.html',
    'federation': 'federation-home.html'
  };

  return roleMap[normalizedRole] || 'index.html';
}

/**
 * Updates all home links on the page to point to the correct home based on user role
 * @param {string} role - User role
 */
export function updateHomeLinks(role) {
  const homePage = getHomePageForRole(role);
  const homeLinks = document.querySelectorAll('a[data-i18n="nav_home"], a[data-role-home="true"]');

  homeLinks.forEach(link => {
    link.href = homePage;
  });

  console.log(`Updated ${homeLinks.length} home links to: ${homePage}`);
}

// =======================================================
// UI UTILITIES
// Shared helper functions for UI elements like loading screens.
// =======================================================

// 1. INJECT styles and HTML for the loading overlay if they don't exist
function ensureLoadingUI() {
  // Add CSS
  if (!document.getElementById("loading-styles")) {
    const style = document.createElement("style");
    style.id = "loading-styles";
    style.innerHTML = `
      .loading-overlay {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.4);
        backdrop-blur: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .loading-overlay.active {
        opacity: 1;
        pointer-events: auto;
      }
      .spinner {
        width: 60px;
        height: 60px;
        border: 4px solid rgba(1, 42, 97, 0.1);
        border-top: 4px solid #012A61;
        border-radius: 50%;
        animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        box-shadow: 0 0 15px rgba(1, 42, 97, 0.1);
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Add HTML
  if (!document.getElementById("loadingOverlay")) {
    const div = document.createElement("div");
    div.id = "loadingOverlay";
    div.className = "loading-overlay";
    div.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(div);
  }
}

// 2. EXPORTED FUNCTIONS
export function showLoading() {
  ensureLoadingUI();
  // Small delay to ensure DOM is ready if called immediately
  requestAnimationFrame(() => {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("active");
  });
}

export function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.classList.remove("active");
}

// =======================================================
// TOAST NOTIFICATION UTILITIES
// =======================================================
export function showMessage(text, type = 'info') {
  const box = document.getElementById("messageBox");
  const dot = document.getElementById("messageDot");
  const txt = document.getElementById("messageText");

  if (box && dot && txt) {
    txt.textContent = text;

    // Colors
    box.classList.remove("border-red-500", "border-blue-500", "border-green-500");
    dot.classList.remove("bg-red-500", "bg-blue-500", "bg-green-500");

    if (type === 'error') {
      box.classList.add("border-red-500");
      dot.classList.add("bg-red-500");
    } else if (type === 'success') {
      box.classList.add("border-green-500");
      dot.classList.add("bg-green-500");
    } else {
      box.classList.add("border-blue-500");
      dot.classList.add("bg-blue-500");
    }

    box.classList.remove("hidden");
    box.classList.add("show");
    setTimeout(() => {
      box.classList.remove("show");
      setTimeout(() => box.classList.add("hidden"), 300); // Wait for animation to complete
    }, 3000);
  } else {
    // Fallback if elements not present (e.g. some pages might not include the HTML for toast)
    if (type === 'error') console.error(text);
    else console.log(text);
    if (type !== 'info') alert(text);
  }
}

// =======================================================
// SUCCESS MODAL UTILITIES
// =======================================================

function ensureSuccessModalUI() {
  // Add CSS for Modal
  if (!document.getElementById("modal-styles")) {
    const style = document.createElement("style");
    style.id = "modal-styles";
    style.innerHTML = `
      .custom-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.3);
        backdrop-blur: 4px;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .custom-modal-overlay.active {
        opacity: 1;
        pointer-events: auto;
      }
      .custom-modal-box {
        background: white;
        padding: 3rem 2rem;
        border-radius: 2rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        max-width: 450px;
        width: 90%;
        text-align: center;
        transform: scale(0.9) translateY(20px);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .custom-modal-overlay.active .custom-modal-box {
        transform: scale(1) translateY(0);
      }
      .custom-modal-btn {
        margin-top: 2rem;
        background: linear-gradient(135deg, #012A61 0%, #275A91 100%);
        color: white;
        padding: 1rem 3rem;
        border-radius: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 10px 15px -3px rgba(1, 42, 97, 0.3);
      }
      .custom-modal-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 25px -5px rgba(1, 42, 97, 0.4);
      }
      .custom-modal-btn:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  // Add HTML for Modal
  if (!document.getElementById("successModal")) {
    const div = document.createElement("div");
    div.id = "successModal";
    div.className = "custom-modal-overlay";
    div.innerHTML = `
            <div class="custom-modal-box">
                <div class="mb-4 text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">Success!</h3>
                <p id="successModalMessage" class="text-gray-600"></p>
                <button id="successModalBtn" class="custom-modal-btn">OK</button>
            </div>
        `;
    document.body.appendChild(div);
  }
}

export function showSuccessModal(message, onCloseCallback) {
  ensureSuccessModalUI();
  const modal = document.getElementById("successModal");
  const msgEl = document.getElementById("successModalMessage");
  const btn = document.getElementById("successModalBtn");

  if (msgEl) msgEl.textContent = message;

  // Handle Button Click
  // Clone button to remove old listeners
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener("click", () => {
    modal.classList.remove("active");
    if (onCloseCallback) onCloseCallback();
  });

  // Show Modal
  requestAnimationFrame(() => {
    modal.classList.add("active");
  });
}




// =======================================================
// UI UTILITIES
// Shared helper functions for UI elements like loading screens.
// =======================================================

/**
 * Updates the Navbar with user info (Name + Profile Pic)
 * Replaces "Login" button content.
 * Handles multiple ID conventions found in the project.
 */
export function updateNavbar(user, profileData = null) {
  if (!user) {
    // Reset to Login state if needed
    // This might require more logic depending on page
    return;
  }

  let name = user.displayName || user.username || localStorage.getItem("tt_username") || user.email.split("@")[0];
  let profilePic = null;

  if (profileData) {
    // Try to get more accurate name/pic from profile data
    // Structure varies: athleteDocData.personal.fullName, or coachData...
    const p = profileData.personal || profileData;
    // Prefer username for navbar if available, otherwise fallback to fullName
    // We already set `name` to username/email at line 290. 
    // Here we only want to update it if we didn't have a good username before, OR
    // actually, let's strictly prefer `localStorage` username or `user.username`.

    // If the requirement is "only show username in navbar", we should NOT overwrite it with fullName here.
    // However, if we only have email, maybe fullName is better? 
    // The user said: "display the username i logged in with".
    // So we should verify if we have a username.

    // Strictly enforce username from login if available
    const loginUsername = user.username || localStorage.getItem("tt_username");

    if (loginUsername) {
      name = loginUsername;
    } else if (profileData.username) {
      name = profileData.username;
    } else if (p.fullName) {
      // Only if absolutely no username is found
      name = p.fullName;
    }

    if (profileData.documents?.profilePic) profilePic = profileData.documents.profilePic;
    else if (profileData.profilePicUrl) profilePic = profileData.profilePicUrl;
    else if (profileData.profilePic) profilePic = profileData.profilePic;

    // Default for Admin specifically if they have no pic
    if (!profilePic && user.role === 'admin' || profileData.username === 'Admin') {
      // let it fall through to generateAvatar logic
      profilePic = null;
    }
  }

  // Normalize name length if needed
  if (name.includes("@")) name = name.split("@")[0];

  // IDs to check
  const textIds = ["navBtnText", "navLoginBtnText", "mobileUserName", "mobileLoginBtnText"];
  const imgIds = ["navUserImg", "mobileUserImg"];
  const picContainerIds = ["navUserPic", "mobileUserPic"];
  const loginIconIds = ["mobileLoginIcon"];

  textIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = name;
  });

  if (profilePic) {
    // Handle relative paths from backend
    if (profilePic.startsWith('/')) {
      profilePic = BACKEND_URL + profilePic;
    }

    // Ensure URL has timestamp if it's from our uploads (to bust cache)
    if (profilePic.startsWith('http') && !profilePic.includes('?t=')) {
      profilePic += "?t=" + new Date().getTime();
    }
  } else {
    // Generate Avatar
    profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=012A61&color=fff`;
  }

  picContainerIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  });

  loginIconIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  imgIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.src = profilePic;
      el.classList.remove("hidden");
    }
  });

  // Show Logout options if hidden? 
  // e.g. mobileLogoutBtn
  const mobileLogout = document.getElementById("mobileLogoutBtn");
  if (mobileLogout) mobileLogout.classList.remove("hidden");

  const mobileDash = document.getElementById("mobileDashLink");
  if (mobileDash) mobileDash.classList.remove("hidden");

  // Update Email Display in Dropdown
  const emailEl = document.getElementById("navUserEmail");
  if (emailEl) {
    if (user.role === 'admin' || profileData?.username === 'Admin') {
      emailEl.textContent = "federation@talenttracker.com";
    } else {
      emailEl.textContent = user.email || "No Email";
    }
  }

  // Init Notifications if logged in
  if (user && (user.uid || user.id)) {
    initNotifications(user.uid || user.id);
  }
}

/**
 * Notifications Logic
 */
export function initNotifications(userId) {
  if (document.getElementById("navNotificationArea")) return;

  const navContainer = document.querySelector("nav .max-w-7xl, nav .container, nav > div");
  const desktopMenu = navContainer?.querySelector(".hidden.md\\:flex");

  if (!desktopMenu) return;

  // 1. Inject Notification Bell
  const bellWrapper = document.createElement("div");
  bellWrapper.id = "navNotificationArea";
  bellWrapper.className = "relative mr-4";
  bellWrapper.innerHTML = `
    <button id="notificationBell" class="p-2 rounded-full hover:bg-white/20 text-[var(--primary)] relative transition-all">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span id="notificationBadge" class="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden border-2 border-[var(--background)]">0</span>
    </button>
    <div id="notificationDropdown" class="hidden absolute right-0 mt-3 w-80 bg-white shadow-2xl rounded-2xl text-black p-4 border border-gray-100 z-[100] animate-fade">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <h3 class="font-bold text-gray-800">Notifications</h3>
        <button id="clearNotifications" class="text-xs text-blue-600 hover:underline">Clear All</button>
      </div>
      <div id="notificationList" class="max-h-64 overflow-y-auto space-y-3">
        <p class="text-xs text-gray-400 text-center py-4">No new notifications</p>
      </div>
    </div>
  `;

  // Insert before the user dropdown area
  const userArea = document.getElementById("navUserArea") || document.getElementById("navLoginBtn");
  if (userArea) {
    desktopMenu.insertBefore(bellWrapper, userArea);
  } else {
    desktopMenu.appendChild(bellWrapper);
  }

  // 2. Event Listeners
  const bell = document.getElementById("notificationBell");
  const dropdown = document.getElementById("notificationDropdown");
  const list = document.getElementById("notificationList");
  const badge = document.getElementById("notificationBadge");

  bell?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle("hidden");
    // Mark as read when opened?
  });

  document.addEventListener("click", () => {
    dropdown?.classList.add("hidden");
  });

  // 3. Fetching Logic
  async function fetchNotifications() {
    try {
      const res = await fetch(`${API_URL}/notifications/${userId}`);
      if (!res.ok) return;
      const notifications = await res.json();

      const unreadCount = notifications.filter(n => !n.is_read).length;
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }

      if (notifications.length === 0) {
        list.innerHTML = '<p class="text-xs text-gray-400 text-center py-4">No new notifications</p>';
        return;
      }

      list.innerHTML = notifications.map(n => `
        <div class="p-3 rounded-xl ${n.is_read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'} cursor-pointer hover:bg-gray-100 transition-all" onclick="window.markReadAndGo(${n.id}, ${n.related_id})">
          <p class="text-sm font-semibold text-gray-800 leading-tight">${n.message}</p>
          <p class="text-[10px] text-gray-400 mt-1">${new Date(n.created_at).toLocaleString()}</p>
        </div>
      `).join("");
    } catch (e) {
      console.error("Fetch notifications failed", e);
    }
  }

  window.markReadAndGo = async (id, eventId) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT' });
      if (eventId) {
        window.location.href = `events.html?view=${eventId}`;
      } else {
        fetchNotifications();
      }
    } catch (e) { }
  };

  fetchNotifications();
  // Poll every 30 seconds
  setInterval(fetchNotifications, 30000);
}

/**
 * Custom Alert Modal
 * Replaces window.alert with a styled modal
 */
export function showAlert(message, title = "Alert") {
  return new Promise((resolve) => {
    // Create modal if it doesn't exist
    let modal = document.getElementById("customAlertModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "customAlertModal";
      modal.className = "fixed inset-0 bg-black/50 backdrop-blur-sm z-[11000] hidden overflow-y-auto";
      modal.innerHTML = `
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 transform transition-all scale-95 opacity-0" id="customAlertContent">
            <h3 class="text-2xl font-black text-[#012A61] mb-4" id="customAlertTitle"></h3>
            <p class="text-slate-600 mb-6 leading-relaxed" id="customAlertMessage"></p>
            <button id="customAlertBtn" class="w-full py-3 rounded-xl font-bold bg-[#012A61] text-white hover:bg-[#275A91] shadow-lg transition-all">
              OK
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const titleEl = document.getElementById("customAlertTitle");
    const messageEl = document.getElementById("customAlertMessage");
    const btn = document.getElementById("customAlertBtn");
    const content = document.getElementById("customAlertContent");

    titleEl.textContent = title;
    messageEl.innerHTML = message;


    // Show modal
    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    });

    // Handle close
    const closeModal = () => {
      content.classList.add("scale-95", "opacity-0");
      content.classList.remove("scale-100", "opacity-100");
      setTimeout(() => {
        modal.classList.add("hidden");
        resolve();
      }, 200);
    };

    btn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  });
}

/**
 * Custom Confirm Modal
 * Replaces window.confirm with a styled modal
 */
export function showConfirm(message, title = "Confirm") {
  return new Promise((resolve) => {
    // Create modal if it doesn't exist
    let modal = document.getElementById("customConfirmModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "customConfirmModal";
      modal.className = "fixed inset-0 bg-black/50 backdrop-blur-sm z-[11000] hidden overflow-y-auto";
      modal.innerHTML = `
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 transform transition-all scale-95 opacity-0" id="customConfirmContent">
            <h3 class="text-2xl font-black text-[#012A61] mb-4" id="customConfirmTitle"></h3>
            <p class="text-slate-600 mb-6 leading-relaxed whitespace-pre-line" id="customConfirmMessage"></p>
            <div class="flex gap-4">
              <button id="customConfirmCancel" class="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button id="customConfirmOk" class="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg transition-all">
                Confirm
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const titleEl = document.getElementById("customConfirmTitle");
    const messageEl = document.getElementById("customConfirmMessage");
    const cancelBtn = document.getElementById("customConfirmCancel");
    const okBtn = document.getElementById("customConfirmOk");
    const content = document.getElementById("customConfirmContent");

    titleEl.textContent = title;
    messageEl.textContent = message;

    // Show modal
    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    });

    // Handle close
    const closeModal = (result) => {
      content.classList.add("scale-95", "opacity-0");
      content.classList.remove("scale-100", "opacity-100");
      setTimeout(() => {
        modal.classList.add("hidden");
        resolve(result);
      }, 200);
    };

    cancelBtn.onclick = () => closeModal(false);
    okBtn.onclick = () => closeModal(true);
    modal.onclick = (e) => {
      if (e.target === modal) closeModal(false);
    };
  });
}
