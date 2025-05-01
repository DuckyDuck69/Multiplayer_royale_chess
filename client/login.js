import { COLORS } from "../common/chess.js";

async function startGame() {
    const name = document.getElementById('nickname').value.trim();
    if (!name) {
        alert("Please enter a nickname.");
        return;
    }
    // Stores nickname and redirectsvalue
    const color = COLORS[+document.getElementById("color").value];

    const { session } = await fetch("/new", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: name, color })
    }).then(async res => await res.json());

    localStorage.setItem("session", session);

    window.location.href = "/index.html";
}
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        startGame();
    }
});

async function check() {
    if (localStorage.getItem("session")) {
        const { exists } = await fetch(`/me?session=${localStorage.getItem("session")}`).then(async res => await res.json());
        if (!exists) {
            localStorage.removeItem("session");
        } else {
            window.location.href = '/index.html';
            return;
        }
    }
    document.getElementById("color").value = `${Math.floor(Math.random() * 16)}`;
}

document.getElementById("start").onclick = () => {
    startGame();
}

check();
