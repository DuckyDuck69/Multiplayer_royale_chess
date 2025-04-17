function startGame() {
    const name = document.getElementById('nickname').value.trim();
    if (!name) {
        alert("Please enter a nickname.");
        return;
    }
    // Stores nickname and redirects
    localStorage.setItem('nickname', name);
    window.location.href = 'index.html';
}
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      startGame();
    }
  });