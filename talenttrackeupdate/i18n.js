import { translations } from "./translations.js";

// --- CONFIG ---
const DEFAULT_LANG = "en";
const STORAGE_KEY = "tt_app_language";

// --- STATE ---
let currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;

// --- DOM ELEMENTS ---
// (We will inject the switcher dynamically so we don't depend on HTML structure existing everywhere immediately)

/**
 * Initialize I18n
 * Call this on page load.
 */
export function initI18n() {
    injectLanguageSwitcher();
    applyLanguage(currentLang);
}

/**
 * Gets a translation for a key
 */
export function getTranslation(key) {
    const dict = translations[currentLang] || translations[DEFAULT_LANG];
    return dict[key] || key;
}

/**
 * Injects the language switcher into the Navbar.
 * It tries to find the '.max-w-7xl' container inside 'nav'.
 */
function injectLanguageSwitcher() {
    // Check if already injected
    if (document.getElementById("languageSwitcher")) return;

    const navContainer = document.querySelector("nav .max-w-7xl, nav .container, nav > div");
    if (!navContainer) {
        console.warn("I18n: Navbar container not found. Skipping switcher injection.");
        return;
    }

    // Create Select Element
    const wrapper = document.createElement("div");
    const hasMobileMenu = !!document.getElementById("mobileMenu");
    wrapper.className = `relative ${hasMobileMenu ? "hidden md:block" : "block"} order-last lg:order-none`;
    wrapper.id = "navbarLanguageSwitcherWrapper";
    wrapper.innerHTML = `
    <select id="languageSwitcher" 
            class="appearance-none bg-white/40 hover:bg-white/60 border border-[var(--primary)]/20 text-[var(--primary)] font-bold py-1.5 pl-3 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] text-xs transition-all min-w-[120px] shadow-sm">
        <option value="en">English</option>
        <option value="si">Sinhala (සිංහල)</option>
        <option value="ta">Tamil (தமிழ்)</option>
    </select>
    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--primary)]">
      <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  `;

    // Insert before the Login button container or at the end of the flex container
    // The structure is Logo -> Desktop Menu -> Mobile Button
    // We want it inside Desktop Menu preferably, or just before Mobile Button.

    // Try to find the Desktop Menu div
    const desktopMenu = navContainer.querySelector(".hidden.md\\:flex");
    if (desktopMenu) {
        // Add at the end of the menu but BEFORE the user profile dropdown area if it exists
        const userArea = document.getElementById("navUserArea");
        if (userArea) {
            desktopMenu.insertBefore(wrapper, userArea);
        } else {
            desktopMenu.appendChild(wrapper);
        }
    } else {
        // Fallback: Add before mobile button
        const mobileBtn = document.getElementById("mobileMenuButton");
        if (mobileBtn) {
            navContainer.insertBefore(wrapper, mobileBtn);
        } else {
            navContainer.appendChild(wrapper);
        }
    }

    // Mobile Switcher?
    // We might want to add a switcher in the mobile menu too.
    injectMobileSwitcher();

    // Add Event Listener
    const select = document.getElementById("languageSwitcher");
    if (select) {
        select.value = currentLang;
        select.addEventListener("change", (e) => {
            setLanguage(e.target.value);
        });
    }
}

/**
 * Mobile Switcher Injection
 */
function injectMobileSwitcher() {
    const mobileMenu = document.getElementById("mobileMenu");
    if (!mobileMenu) return;

    // Find a good place to put it. Maybe at the bottom or top of "Navigation".
    // Let's put it in the Sidebar Header for prominence, or top of nav list.
    const header = mobileMenu.querySelector(".p-6");
    if (header) {
        // Create a small row for lang buttons
        const div = document.createElement("div");
        div.className = "flex justify-center gap-4 p-4 bg-gray-50 border-b border-gray-100";
        div.innerHTML = `
        <button data-lang-btn="en" class="lang-btn-mob text-xs font-bold px-4 py-2 rounded-full border border-gray-300">English</button>
        <button data-lang-btn="si" class="lang-btn-mob text-xs font-bold px-4 py-2 rounded-full border border-gray-300">Sinhala</button>
        <button data-lang-btn="ta" class="lang-btn-mob text-xs font-bold px-4 py-2 rounded-full border border-gray-300">Tamil</button>
      `;
        // insert after header
        header.parentNode.insertBefore(div, header.nextSibling);

        // Listeners
        div.querySelectorAll(".lang-btn-mob").forEach(btn => {
            btn.addEventListener("click", () => {
                setLanguage(btn.getAttribute("data-lang-btn"));
            });
        });
        updateMobileButtons(currentLang);
    }
}

function updateMobileButtons(lang) {
    document.querySelectorAll(".lang-btn-mob").forEach(btn => {
        if (btn.getAttribute("data-lang-btn") === lang) {
            btn.classList.add("bg-[var(--primary)]", "text-white", "border-transparent");
            btn.classList.remove("text-gray-600", "border-gray-300");
        } else {
            btn.classList.remove("bg-[var(--primary)]", "text-white", "border-transparent");
            btn.classList.add("text-gray-600", "border-gray-300");
        }
    });
}

/**
 * Update Language State and UI
 */
export function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyLanguage(lang);

    // Update Select value if changed via other means
    const select = document.getElementById("languageSwitcher");
    if (select) select.value = lang;

    updateMobileButtons(lang);
}

/**
 * Update all data-i18n elements
 */
function applyLanguage(lang) {
    const dict = translations[lang] || translations["en"];

    // 1. Update textContent
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    // 2. Update placeholders if needed (use data-i18n-placeholder="key")
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });

    // 3. Update HTML Document Lang
    document.documentElement.lang = lang;

    // 4. Force specific font for Sinhala/Tamil if needed
    if (lang === 'si' || lang === 'ta') {
        document.body.classList.add('notranslate'); // Discourage auto-translation
    } else {
        document.body.classList.remove('notranslate');
    }
}

// Auto-init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initI18n);
} else {
    initI18n();
}
