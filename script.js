/* ============================================
   Stop The Truckery — Site Logic
   ============================================ */

let currentRarityFilter = "all";

/* ---------- Badge Tier Data ---------- */
/* Tier numbers/names come from the "Badge Tiers" table; each tier's gradient
   is 2-3 stops used for that tier's highlight strip + glow color. */

const BADGE_TIERS = [
    { n: 1, name: "Common",    colors: ["#6B7280", "#9CA3AF"] },
    { n: 2, name: "Bronze",    colors: ["#7C4A21", "#CD7F32"] },
    { n: 3, name: "Copper",    colors: ["#8B4513", "#E08A3E"] },
    { n: 4, name: "Rare",      colors: ["#1E3A8A", "#3B82F6", "#93C5FD"] },
    { n: 5, name: "Emerald",   colors: ["#166534", "#22C55E", "#86EFAC"] },
    { n: 6, name: "Epic",      colors: ["#581C87", "#A855F7", "#D8B4FE"] },
    { n: 7, name: "Mythic",    colors: ["#B45309", "#FACC15", "#FEF08A"] },
    { n: 8, name: "Legendary", colors: ["#7F1D1D", "#EF4444", "#FCA5A5"] },
    { n: 9, name: "Diamond",   colors: ["#0EA5E9", "#67E8F9", "#E0F2FE"] },
    { n: 10, name: "Obsidian", colors: ["#030712", "#374151", "#111827"] },
    { n: 11, name: "Prismatic", colors: ["#EF4444", "#22C55E", "#3B82F6"] }
];

function tierByNumber(n) {
    return BADGE_TIERS.find(t => t.n === n);
}

// Shorthand for the repetitive Garage/Crash/Money progression badges:
// each entry is [tier number, icon url, requirement text].
function progressionBadges(entries) {
    return entries.map(([tier, img, desc]) => ({ name: tierByNumber(tier).name, tier, img, desc }));
}

const GARAGE_ENTRIES = [
    [1, "https://i.postimg.cc/PPvK6zcK/1.png", "Own 1 vehicle."],
    [2, "https://i.postimg.cc/4mHw8bMB/2.png", "Own 3 vehicles."],
    [3, "https://i.postimg.cc/G40K6TwD/3.png", "Own 5 vehicles."],
    [4, "https://i.postimg.cc/KR3Q9rVk/4.png", "Own 8 vehicles."],
    [5, "https://i.postimg.cc/8jfwyB3M/5.png", "Own 12 vehicles."],
    [6, "https://i.postimg.cc/vcxXPLjW/6.png", "Own 16 vehicles."],
    [7, "https://i.postimg.cc/56QpPqG8/7.png", "Own 20 vehicles."],
    [8, "https://i.postimg.cc/kBRwjFZv/8.png", "Own 24 vehicles."],
    [9, "https://i.postimg.cc/LngvyB7V/9.png", "Own 28 vehicles."],
    [10, "https://i.postimg.cc/Mvftsb4D/10.png", "Own 31 vehicles."],
    [11, "https://i.postimg.cc/SJYVZ75d/11.png", "Own every vehicle."]
];

const CRASH_ENTRIES = [
    [1, "https://i.postimg.cc/McLvrRgy/1.png", "Cause 100 crashes."],
    [2, "https://i.postimg.cc/CZ2z6D9s/2.png", "Cause 1K crashes."],
    [3, "https://i.postimg.cc/HJNVP5F0/3.png", "Cause 10K crashes."],
    [4, "https://i.postimg.cc/nsWCw7NY/4.png", "Cause 100K crashes."],
    [5, "https://i.postimg.cc/cg8rqCNg/5.png", "Cause 1M crashes."],
    [6, "https://i.postimg.cc/KkgRXjyT/6.png", "Cause 10M crashes."],
    [7, "https://i.postimg.cc/ygSkqxzS/7.png", "Cause 100M crashes."],
    [8, "https://i.postimg.cc/Q9WHLCr5/8.png", "Cause 1B crashes."],
    [9, "https://i.postimg.cc/BL1XWbGH/9.png", "Cause 10B crashes."],
    [10, "https://i.postimg.cc/ygSkqxzX/10.png", "Cause 100B crashes."],
    [11, "https://i.postimg.cc/5YF6cyM5/11.png", "Cause 1T crashes."]
];

const MONEY_ENTRIES = [
    [1, "https://i.postimg.cc/tnjRLzks/1.png", "Reach 1M coins."],
    [2, "https://i.postimg.cc/hQB4H0s7/2.png", "Reach 1B coins."],
    [3, "https://i.postimg.cc/5QV9ZmgC/3.png", "Reach 1T coins."],
    [4, "https://i.postimg.cc/30TrPZ1G/4.png", "Reach 1Qa coins."],
    [5, "https://i.postimg.cc/T562Zc0m/5.png", "Reach 1Qi coins."],
    [6, "https://i.postimg.cc/PvQfh8Vx/6.png", "Reach 1Sx coins."],
    [7, "https://i.postimg.cc/K3DcFgpR/7.png", "Reach 1Sp coins."],
    [8, "https://i.postimg.cc/gLHcd6tj/8.png", "Reach 1Oc coins."],
    [9, "https://i.postimg.cc/XBkN3y1G/9.png", "Reach 1No coins."],
    [10, "https://i.postimg.cc/jn4qKJ37/10.png", "Reach 1Dc coins."],
    [11, "https://i.postimg.cc/fSfWZ0qd/11.png", "Reach 1Cg coins."]
];

const BADGE_CATEGORIES = [
    {
        key: "staff",
        label: "Staff Badges",
        badges: [
            { name: "Developer", tier: 11, img: "https://i.postimg.cc/Czy7ZnPs/61.png", desc: "Help develop Stop The Truckery." },
            { name: "Moderator", tier: 9, img: "https://i.postimg.cc/7fv9CJsN/62.png", desc: "Become an official moderator." },
            { name: "Admin", tier: 10, img: "https://i.postimg.cc/N5hDy2J4/63.png", desc: "Become a game administrator." },
            { name: "Owner", tier: 11, img: "https://i.postimg.cc/F7tpfkWp/64.png", desc: "Awarded to the owner of Stop The Truckery." }
        ]
    },
    {
        key: "community",
        label: "Community Badges",
        badges: [
            { name: "Early Player", tier: 8, img: "https://i.postimg.cc/mtxjc1Xd/54.png", desc: "Play during Version 1.20 or earlier." },
            { name: "Content Creator", tier: 7, img: "https://i.postimg.cc/PPGyLv3N/55.png", desc: "Create content featuring the game." },
            { name: "QA Tester", tier: 8, img: "https://i.postimg.cc/kBrsVR1K/56.png", desc: "Test updates before release and report bugs." },
            { name: "Verified", tier: 6, img: "https://i.postimg.cc/Tp80y57n/57.png", desc: "Become a verified community member." },
            { name: "Played With Staff", tier: 4, img: "https://i.postimg.cc/w7K2tRf5/58.png", desc: "Join a server with a staff member." },
            { name: "Gifter", tier: 3, img: "https://i.postimg.cc/BXWp8PYT/59.png", desc: "Gift another player." }
        ]
    },
    {
        key: "leaderboard",
        label: "Leaderboard Badges",
        badges: [
            { name: "#1 Leaderboard", tier: 11, img: "https://i.postimg.cc/9rLGdxcM/41.png", desc: "Reach #1 on the global leaderboard." },
            { name: "#2 Leaderboard", tier: 10, img: "https://i.postimg.cc/7fKg3BqL/40.png", desc: "Reach #2 on the global leaderboard." },
            { name: "#3 Leaderboard", tier: 9, img: "https://i.postimg.cc/56swBPfN/39.png", desc: "Reach #3 on the global leaderboard." }
        ]
    },
    { key: "garage", label: "Garage Badges", badges: progressionBadges(GARAGE_ENTRIES) },
    { key: "crash", label: "Crash Badges", badges: progressionBadges(CRASH_ENTRIES) },
    { key: "money", label: "Money Badges", badges: progressionBadges(MONEY_ENTRIES) }
];

/* ---------- Badge + Tier Rendering ---------- */

function createChip(label, catKey, isActive, onSelect) {
    const chip = document.createElement("div");
    chip.className = "chip" + (isActive ? " active" : "");
    chip.dataset.cat = catKey;
    chip.textContent = label;
    chip.addEventListener("click", () => onSelect(catKey, chip));
    return chip;
}

function createBadgeCard(badge, catKey) {
    const tier = tierByNumber(badge.tier);
    const gradient = `linear-gradient(90deg, ${tier.colors.join(", ")})`;
    const highlight = tier.colors[tier.colors.length - 1];

    const card = document.createElement("div");
    card.className = "badge-card glass tier-card";
    card.dataset.cat = catKey;
    card.style.setProperty("--tier-gradient", gradient);
    card.style.setProperty("--tier-highlight", highlight);

    card.innerHTML = `
        <div class="tier-strip"></div>
        ${badge.img ? `<img class="badge-icon" src="${badge.img}" alt="${badge.name} badge">` : ""}
        <h3>${badge.name}</h3>
        <span class="tier-tag" style="color:${highlight}">Tier ${tier.n} &bull; ${tier.name}</span>
        <p>${badge.desc}</p>
    `;
    return card;
}

function renderBadges() {
    const chips = document.getElementById("badgeChips");
    const categories = document.getElementById("badgeCategories");
    chips.innerHTML = "";
    categories.innerHTML = "";

    chips.appendChild(createChip("All", "all", true, setBadgeFilter));

    BADGE_CATEGORIES.forEach(cat => {
        chips.appendChild(createChip(cat.label, cat.key, false, setBadgeFilter));

        const heading = document.createElement("div");
        heading.className = "badge-category";
        heading.dataset.cat = cat.key;
        heading.innerHTML = `<h3>${cat.label}</h3>`;
        categories.appendChild(heading);

        const grid = document.createElement("div");
        grid.className = "badge-grid";
        cat.badges.forEach(badge => grid.appendChild(createBadgeCard(badge, cat.key)));
        categories.appendChild(grid);
    });
}

function renderTiers() {
    const grid = document.getElementById("tiersGrid");
    grid.innerHTML = "";

    BADGE_TIERS.forEach(tier => {
        const gradient = `linear-gradient(90deg, ${tier.colors.join(", ")})`;
        const highlight = tier.colors[tier.colors.length - 1];

        const card = document.createElement("div");
        card.className = "badge-card glass tier-card tier-showcase";
        card.style.setProperty("--tier-gradient", gradient);
        card.style.setProperty("--tier-highlight", highlight);
        card.innerHTML = `
            <div class="tier-strip"></div>
            <h3>${tier.name}</h3>
            <span class="tier-tag" style="color:${highlight}">Tier ${tier.n}</span>
        `;
        grid.appendChild(card);
    });
}

/* ---------- Page Navigation ---------- */

function showPage(page, tab) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

    const next = document.getElementById(page);
    if (next) next.classList.add("active");

    tab.classList.add("active");

    if (page === "vehicles") {
        animateStatBars();
    }
}

/* ---------- Vehicle Stat Bars ---------- */

function animateStatBars() {
    const fills = document.querySelectorAll("#vehicleGrid .stat-fill");

    fills.forEach(fill => {
        // reset then animate on the next frame so the transition actually plays
        fill.style.width = "0%";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const target = parseFloat(fill.getAttribute("data-target")) || 0;
                const visibleWidth = Math.max(target, 4); // keep a visible sliver even at the floor of the range
                fill.style.width = visibleWidth + "%";
            });
        });
    });
}

/* ---------- Vehicle Search + Rarity Filter ---------- */

function filterVehicles() {
    const query = document.getElementById("vehicleSearch").value.trim().toLowerCase();
    const cards = document.querySelectorAll("#vehicleGrid .card");
    let visibleCount = 0;

    cards.forEach(card => {
        const name = card.getAttribute("data-name") || "";
        const rarity = card.getAttribute("data-rarity") || "";
        const matchesName = name.includes(query);
        const matchesRarity = currentRarityFilter === "all" || rarity === currentRarityFilter;

        card.classList.toggle("hidden-card", !(matchesName && matchesRarity));
        if (matchesName && matchesRarity) visibleCount++;
    });

    document.getElementById("noResults").style.display = visibleCount === 0 ? "block" : "none";
}

function setRarityFilter(rarity, chip) {
    currentRarityFilter = rarity;
    document.querySelectorAll("#rarityChips .chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    filterVehicles();
}

/* ---------- Badge Category Filter ---------- */

function setBadgeFilter(category, chip) {
    document.querySelectorAll("#badgeChips .chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");

    document.querySelectorAll(".badge-category").forEach(section => {
        const sectionCat = section.getAttribute("data-cat");
        section.classList.toggle("hidden-card", category !== "all" && sectionCat !== category);
    });

    document.querySelectorAll(".badge-card").forEach(card => {
        const cardCat = card.getAttribute("data-cat");
        card.classList.toggle("hidden-card", category !== "all" && cardCat !== category);
    });

    // hide the grid wrapper too when every card inside it is filtered out
    document.querySelectorAll(".badge-grid").forEach(grid => {
        const anyVisible = Array.from(grid.querySelectorAll(".badge-card"))
            .some(c => !c.classList.contains("hidden-card"));
        grid.classList.toggle("hidden-card", !anyVisible);
    });
}

/* ---------- Init ---------- */

document.addEventListener("DOMContentLoaded", () => {
    renderBadges();
    renderTiers();

    const activePage = document.querySelector(".page.active");
    if (activePage && activePage.id === "vehicles") {
        animateStatBars();
    }
});
