const fileInput = document.getElementById('fileInput');
const audio = document.getElementById('audio');
const filenameDisplay = document.getElementById('filename');

fileInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file && file.type === "audio/mp4" || file.name.endsWith(".m4a")) {
    const url = URL.createObjectURL(file);
    audio.src = url;
    filenameDisplay.textContent = `▶️ Đang phát: ${file.name}`;
    audio.play();
  } else {
    filenameDisplay.textContent = "❌ File không hợp lệ. Hãy chọn .m4a";
  }
});
