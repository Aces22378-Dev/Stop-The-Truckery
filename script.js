 /* ============================================
   Stop The Truckery — Site Logic
   ============================================ */

let currentRarityFilter = "all";

/* ---------- Badge Tier Data ---------- */
/* Tier numbers/names come from the "Badge Tiers" table; each tier's gradient
   is 2-3 stops used for that tier's highlight strip + glow color. */

const BADGE_TIERS = [
    { id: 1, name: "Common",    colorName: "Gray",     colors: ["#4B5563", "#6B7280", "#9CA3AF", "#D1D5DB", "#9CA3AF", "#6B7280"], description: "The starting point for every player." },
    { id: 2, name: "Bronze",    colorName: "Bronze",   colors: ["#5C3317", "#7C4A21", "#A16207", "#CD7F32", "#E6A85C", "#CD7F32"], description: "A modest step above the basics." },
    { id: 3, name: "Copper",    colorName: "Copper",   colors: ["#6E3B12", "#8B4513", "#B8652A", "#E08A3E", "#F0B77A", "#E08A3E"], description: "Steady progress toward mastery." },
    { id: 4, name: "Rare",      colorName: "Blue",     colors: ["#172554", "#1E3A8A", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"], description: "Not everyone reaches this tier." },
    { id: 5, name: "Emerald",   colorName: "Green",    colors: ["#14532D", "#166534", "#15803D", "#22C55E", "#4ADE80", "#86EFAC"], description: "A vibrant marker of dedication." },
    { id: 6, name: "Epic",      colorName: "Purple",   colors: ["#3B0764", "#581C87", "#7E22CE", "#A855F7", "#C084FC", "#D8B4FE"], description: "A badge that turns heads." },
    { id: 7, name: "Legendary", colorName: "Gold",     colors: ["#92400E", "#B45309", "#D97706", "#FACC15", "#FDE047", "#FEF08A"], description: "Reserved for standout achievements." },
    { id: 8, name: "Mythic",    colorName: "Red",      colors: ["#7F1D1D", "#991B1B", "#DC2626", "#EF4444", "#F87171", "#FCA5A5"], description: "An extremely powerful badge tier." },
    { id: 9, name: "Diamond",   colorName: "Diamond",  colors: ["#0369A1", "#0EA5E9", "#22D3EE", "#67E8F9", "#A5F3FC", "#E0F2FE"], description: "A rare and valuable badge tier." },
    { id: 10, name: "Obsidian", colorName: "Obsidian", colors: ["#000000", "#030712", "#111827", "#1F2937", "#374151", "#4B5563"], description: "Dark, heavy, and hard-earned." },
    { id: 11, name: "Prismatic", colorName: "Prismatic", colors: ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#3B82F6", "#A855F7"], description: "A dazzling badge for the elite." }
];

// Badges reference their tier by NAME (e.g. "Diamond") rather than number.
function tierByName(name) {
    return BADGE_TIERS.find(t => t.name === name);
}

// Finds an example badge icon for a tier's showcase card on the Tiers page —
// just the first badge (in category order) that happens to use that tier.
function firstBadgeIconForTier(tierName) {
    for (const cat of BADGE_CATEGORIES) {
        const match = cat.badges.find(b => b.tier === tierName);
        if (match && match.icon) return match.icon;
    }
    return null;
}

/* ---------- Reusable Tier Presentation System ----------
   Colors never change here — this only computes HOW a tier's existing
   gradient moves. Everything is derived from formulas (tier position ->
   speed/intensity) plus a small set of named special cases, so a brand
   new tier only ever needs an entry in BADGE_TIERS; no animation code
   has to be touched. */

// Shared by badge cards, tier cards, and vehicle cards — builds the CSS
// gradient string used for the --tier-gradient strip and, via its last
// stop, the --tier-highlight glow color.
function gradientCss(colors) {
    return `linear-gradient(90deg, ${colors.join(", ")})`;
}

// Samples `count` evenly-spaced colors from an array of any length. Used to
// give the border exactly 6 keyframe stops regardless of whether a tier
// defines 2 colors (vehicle rarities) or 6 (badge tiers) — same mechanism
// either way, no special-casing per array length.
function sampleColors(colors, count) {
    const last = colors.length - 1;
    return Array.from({ length: count }, (_, i) => colors[Math.round((i / (count - 1)) * last)]);
}

// Base speed/intensity curve: low tiers get a slow, barely-there sway;
// high tiers get a brisker (but still subtle) one. `progress` is 0..1.
function motionFromProgress(progress) {
    return {
        duration: 18 - progress * 12,  // seconds: 18s at the bottom -> 6s at the top
        amplitude: 6 + progress * 6    // % drift range: 6% at the bottom -> 12% at the top
    };
}

// Motion for a BADGE_TIERS entry. Special cases are matched by NAME so they
// keep their character even if tier numbers ever get reshuffled again.
function getTierMotion(tier) {
    const progress = (Math.min(Math.max(tier.id, 1), 11) - 1) / 10;
    const motion = {
        ...motionFromProgress(progress),
        direction: tier.id % 2 === 0 ? "alternate-reverse" : "alternate",
        easing: "ease-in-out",
        variant: "breathe" // gentle side-to-side drift, the default for every tier
    };

    if (tier.name === "Obsidian") {
        // Slower and barely moves — reads as heavy rather than energetic.
        motion.duration *= 1.8;
        motion.amplitude *= 0.6;
    } else if (tier.name === "Diamond") {
        // A brighter glint sweeps over the base drift for a crystal-like sparkle.
        motion.variant = "shimmer";
        motion.duration *= 0.7;
    } else if (tier.name === "Prismatic") {
        // The top-tier showpiece: colors continuously flow one direction rather
        // than drifting back and forth. Must stay linear — any easing on a
        // looping scroll like this creates a visible stutter at the wrap point.
        motion.variant = "rainbow";
        motion.duration = 5;
        motion.direction = "normal";
        motion.easing = "linear";
    }

    return motion;
}

// Applies a tier's colors + motion to a card in one place, so badges, tier
// showcase cards, and vehicle cards all render identically. The strip/
// shimmer animate via `transform` only (GPU-composited); the border is the
// one exception, animating border-color through --tier-c1..c6 (see style.css).
function applyTierPresentation(card, colors, motion) {
    card.style.setProperty("--tier-gradient", gradientCss(colors));
    card.style.setProperty("--tier-highlight", colors[colors.length - 1]);

    // Border color stops — 6 evenly sampled from the exact same hex values
    // used in the strip's gradient, so the border transitions through real
    // tier colors rather than just varying the opacity of one blended tone.
    sampleColors(colors, 6).forEach((c, i) => card.style.setProperty(`--tier-c${i + 1}`, c));

    card.style.setProperty("--tier-duration", motion.duration.toFixed(2) + "s");
    card.style.setProperty("--tier-amplitude", motion.amplitude.toFixed(1) + "%");
    card.style.setProperty("--tier-easing", motion.easing);
    card.style.setProperty("--tier-play-direction", motion.direction);
    // Small random negative delay so cards sharing a tier don't drift in lockstep.
    card.style.setProperty("--tier-delay", (-(Math.random() * motion.duration)).toFixed(2) + "s");

    const strip = card.querySelector(".tier-strip");
    if (!strip) return;
    strip.classList.toggle("tier-flow-continuous", motion.variant === "rainbow");
    strip.classList.toggle("tier-shimmer", motion.variant === "shimmer");
    if (motion.variant === "rainbow") {
        // Colors duplicated end-to-end so a 50% shift loops with zero seam.
        card.style.setProperty("--tier-gradient-x2", gradientCss([...colors, ...colors]));
    }
}

// Shorthand for the repetitive Garage/Crash/Coins progression badges:
// each entry is [tier name, icon url, description, display name].
function progressionBadges(entries) {
    return entries.map(([tier, icon, description, name]) => ({ name: name || tier, icon, tier, description }));
}

const GARAGE_ENTRIES = [
    ["Common", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Garage%201.png", "Own 1 vehicle.", "Garage I"],
    ["Bronze", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Garage%202.png", "Own 3 vehicles.", "Garage II"],
    ["Copper", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Garage%203.png", "Own 6 vehicles.", "Garage III"],
    ["Rare", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Garage%204.png", "Own 12 vehicles.", "Garage IV"],
    ["Emerald", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Garage%205.png", "Own 18 vehicles.", "Garage V"],
    ["Epic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Garage%206.png", "Own 26 vehicles.", "Garage VI"],
    ["Legendary", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Garage%207.png", "Own 34 vehicles.", "Garage VII"],
    ["Mythic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Garage%208.png", "Own 42 vehicles.", "Garage VIII"],
    ["Diamond", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Garage%209.png", "Own 52 vehicles.", "Garage IX"],
    ["Obsidian", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Garage%2010.png", "Own 62 vehicles.", "Garage X"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Garage%2011.png", "Own all 71 vehicles.", "Garage XI"]
];

const CRASH_ENTRIES = [
    ["Diamond", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Crash%201.png", "Cause 100 vehicle crashes.", "Crash I"],
    ["Diamond", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Crash%202.png", "Cause 500 vehicle crashes.", "Crash II"],
    ["Diamond", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Crash%203.png", "Cause 1,000 vehicle crashes.", "Crash III"],
    ["Obsidian", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Crash%204.png", "Cause 2,500 vehicle crashes.", "Crash IV"],
    ["Obsidian", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Crash%205.png", "Cause 5,000 vehicle crashes.", "Crash V"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Crash%206.png", "Cause 10,000 vehicle crashes.", "Crash VI"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Crash%207.png", "Cause 25,000 vehicle crashes.", "Crash VII"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Crash%208.png", "Cause 50,000 vehicle crashes.", "Crash VIII"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Crash%209.png", "Cause 100,000 vehicle crashes.", "Crash IX"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Crash%2010.png", "Cause 250,000 vehicle crashes.", "Crash X"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Crash%2011.png", "Cause 500,000 vehicle crashes.", "Crash XI"]
];

const MONEY_ENTRIES = [
    ["Emerald", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Coin%201.png", "Collect 10,000 coins.", "Coin I"],
    ["Epic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Coin%202.png", "Collect 50,000 coins.", "Coin II"],
    ["Legendary", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Coin%203.png", "Collect 100,000 coins.", "Coin III"],
    ["Mythic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Coin%204.png", "Collect 250,000 coins.", "Coin IV"],
    ["Diamond", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Coin%205.png", "Collect 500,000 coins.", "Coin V"],
    ["Obsidian", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Coin%206.png", "Collect 1,000,000 coins.", "Coin VI"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Coin%207.png", "Collect 2,500,000 coins.", "Coin VII"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Coin%208.png", "Collect 5,000,000 coins.", "Coin VIII"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Coin%209.png", "Collect 10,000,000 coins.", "Coin IX"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Coin%2010.png", "Collect 25,000,000 coins.", "Coin X"],
    ["Prismatic", "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Coin%2011.png", "Collect 50,000,000 coins.", "Coin XI"]
];

const BADGE_CATEGORIES = [
    {
        key: "staff",
        label: "Staff Badges",
        badges: [
            { name: "Owner", tier: "Prismatic", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Owner.png", description: "Become the game owner." },
            { name: "Management", tier: "Prismatic", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Management.png", description: "Become part of management." },
            { name: "Developer", tier: "Prismatic", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Dev.png", description: "Become an official developer." },
            { name: "QA Team", tier: "Legendary", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/QA%20Team.png", description: "Become a QA tester." },
            { name: "Moderator", tier: "Prismatic", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Mod.png", description: "Become a moderator." },
            { name: "Administrator", tier: "Prismatic", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Admin.png", description: "Become an administrator." }
        ]
    },
    {
        key: "community",
        label: "Community Badges",
        badges: [
            { name: "Verified", tier: "Legendary", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Verified.png", description: "Receive verified status." },
            { name: "Content Creator", tier: "Emerald", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Content%20Creator.png", description: "Become an approved content creator." },
            { name: "Early Player", tier: "Prismatic", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Ealry%20player.png", description: "Play during early access." },
            { name: "Met a Staff Member", tier: "Legendary", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Meet%20A%20Staff%20Member.png", description: "Meet an official staff member." },
            { name: "Gifter", tier: "Copper", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/Gifter.png", description: "Gift another player." }
        ]
    },
    {
        key: "leaderboard",
        label: "Leaderboard Badges",
        badges: [
            { name: "1st Place", tier: "Prismatic", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/%231.png", description: "Finish a leaderboard season in 1st place." },
            { name: "2nd Place", tier: "Obsidian", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/%232.png", description: "Finish a leaderboard season in 2nd place." },
            { name: "3rd Place", tier: "Diamond", icon: "https://raw.githubusercontent.com/Aces22378-Dev/STT-Assets/main/Badges/%233.png", description: "Finish a leaderboard season in 3rd place." }
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
    const tier = tierByName(badge.tier);
    const highlight = tier.colors[tier.colors.length - 1];

    const card = document.createElement("div");
    card.className = "badge-card glass tier-card";
    card.dataset.cat = catKey;

    card.innerHTML = `
        <div class="tier-strip"></div>
        ${badge.icon ? `<img class="badge-icon" src="${badge.icon}" alt="${badge.name} badge">` : ""}
        <h3>${badge.name}</h3>
        <span class="tier-tag" style="color:${highlight}">Tier ${tier.id} - ${tier.name}</span>
        <span class="tier-color-label">Color: ${tier.colorName}</span>
        <p>${badge.description}</p>
    `;

    applyTierPresentation(card, tier.colors, getTierMotion(tier));
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
        const highlight = tier.colors[tier.colors.length - 1];
        const previewIcon = firstBadgeIconForTier(tier.name);

        const card = document.createElement("div");
        card.className = "badge-card glass tier-card tier-showcase";
        card.innerHTML = `
            <div class="tier-strip"></div>
            ${previewIcon ? `<img class="badge-icon" src="${previewIcon}" alt="${tier.name} badge preview">` : ""}
            <span class="tier-number" style="color:${highlight}">Tier ${tier.id}</span>
            <h3>${tier.name.toUpperCase()}</h3>
            <span class="tier-color-label">Color: ${tier.colorName}</span>
            <p>&ldquo;${tier.description}&rdquo;</p>
        `;

        applyTierPresentation(card, tier.colors, getTierMotion(tier));
        grid.appendChild(card);
    });
}

/* ---------- Vehicle Rarity Colors ---------- */
/* Vehicle rarity used to be its own separate 5-color/motion table. Per the
   tier-system fix, vehicles now pull directly from BADGE_TIERS — the same
   11-tier list badges use — via the tier names their rarity already matches
   (Common/Bronze/Rare/Epic/Legendary), so there is only one tier system on
   the whole site. */

function applyVehicleTierColors() {
    document.querySelectorAll("#vehicleGrid .tier-card").forEach(card => {
        const rarity = card.dataset.rarity; // e.g. "common", "bronze", "rare"...
        if (!rarity) return;

        const tierName = rarity.charAt(0).toUpperCase() + rarity.slice(1);
        const tier = tierByName(tierName);
        if (!tier) return;

        applyTierPresentation(card, tier.colors, getTierMotion(tier));
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

    // Hide a category's header + grid together when every card inside is filtered out.
    document.querySelectorAll("#vehicleGrid .cards").forEach(grid => {
        const anyVisible = Array.from(grid.querySelectorAll(".card")).some(c => !c.classList.contains("hidden-card"));
        grid.classList.toggle("hidden-card", !anyVisible);

        const header = grid.previousElementSibling;
        if (header && header.classList.contains("badge-category")) {
            header.classList.toggle("hidden-card", !anyVisible);
        }
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
    applyVehicleTierColors();

    const activePage = document.querySelector(".page.active");
    if (activePage && activePage.id === "vehicles") {
        animateStatBars();
    }
});
