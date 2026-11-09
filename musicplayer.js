document.querySelectorAll(".music-player").forEach(player => {
  const audio = player.querySelector("audio");
  const button = player.querySelector(".music-toggle");
  const playIcon = player.querySelector(".play-icon");
  const pauseIcon = player.querySelector(".pause-icon");
  const progress = player.querySelector(".music-progress");

  function updateButton() {
    const playing = !audio.paused;
    playIcon.hidden = playing;
    pauseIcon.hidden = !playing;
    button.setAttribute("aria-label", playing ? "Pause music" : "Play music");
  }

  function updateProgress(value) {
    progress.value = value;
    progress.style.setProperty("--progress", value + "%");
  }

  button.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        console.warn("Unable to play audio:", error);
      }
    } else {
      audio.pause();
    }
    updateButton();
  });

  audio.addEventListener("play", updateButton);
  audio.addEventListener("pause", updateButton);

  audio.addEventListener("timeupdate", () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      updateProgress(audio.currentTime / audio.duration * 100);
    }
  });

  progress.addEventListener("input", () => {
    updateProgress(progress.value);
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = progress.value / 100 * audio.duration;
    }
  });

  audio.addEventListener("ended", () => {
    updateProgress(0);
    updateButton();
  });
});