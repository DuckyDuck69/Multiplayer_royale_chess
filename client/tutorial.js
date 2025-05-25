document.getElementById("maingameButton").addEventListener("click", () => {
    window.location.href = "index.html";
});

// grab the shared video elements
const videoPlayer = document.getElementById('video-play');
const videoSource = document.getElementById('video-source');

// for each button…
document.querySelectorAll('.piece-button').forEach(btn => {
  btn.addEventListener('click', () => {
    const src = btn.dataset.video;
    if (!src) return;

    // swap the URL, reload & play
    videoSource.src = src;
    videoPlayer.load();
    videoPlayer.play();

    // optional: highlight the active button
    document.querySelectorAll('.piece-button')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
