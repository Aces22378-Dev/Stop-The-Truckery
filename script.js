function showPage(page, tab){

    const pages = document.querySelectorAll(".page");
    const tabs = document.querySelectorAll(".tab");
    const current = document.querySelector(".page.active");

    if(current){
        current.style.opacity = "0";
        current.style.transform = "translateY(20px)";
    }

    setTimeout(() => {

        pages.forEach(p => {
            p.classList.remove("active");
        });

        const next = document.getElementById(page);
        next.classList.add("active");

        tabs.forEach(t => {
            t.classList.remove("active");
        });

        tab.classList.add("active");

    },250);

}
