/* ============================================
   Stop The Truckery — Site Logic
   ============================================ */

let currentRarityFilter = "all";

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
    const activePage = document.querySelector(".page.active");
    if (activePage && activePage.id === "vehicles") {
        animateStatBars();
    }
});
