const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const context = overlay.getContext("2d");
let isProcessing = false;

const canvas = document.createElement("canvas");

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((error) => {
    console.error("Error accessing camera:", error);
  });

  function drawResults(results) {
  context.clearRect(0, 0, overlay.width, overlay.height);

  // Rasio untuk menyesuaikan koordinat dengan ukuran tampilan video
  const videoWidth = overlay.width;
  const videoHeight = overlay.height;

  results.forEach((result) => {
    const { name, location } = result;
    const { top, right, bottom, left } = location;

    // Pastikan koordinat sesuai dengan ukuran tampilan
    const scaledTop = top * videoHeight / 480; // Sesuaikan 480 dengan tinggi video asli
    const scaledRight = right * videoWidth / 640; // Sesuaikan 640 dengan lebar video asli
    const scaledBottom = bottom * videoHeight / 480;
    const scaledLeft = left * videoWidth / 640;

    // Menggambar rectangle wajah dengan koordinat yang disesuaikan
    context.strokeStyle = "#00FF00"; // Warna kotak
    context.lineWidth = 2;           // Ketebalan garis
    context.strokeRect(scaledLeft, scaledTop, scaledRight - scaledLeft, scaledBottom - scaledTop);

    // Menggambar teks nama
    context.fillStyle = "#00FF00";    // Warna teks nama
    context.font = "16px Arial";      // Ukuran dan jenis font
    context.fillText(name, scaledLeft + 5, scaledTop - 10); // Menampilkan teks nama
  });
}


video.addEventListener("loadedmetadata", () => {
  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
});

function processFrame() {
  if (isProcessing) return;
  isProcessing = true;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = canvas
    .toDataURL("image/png")
    .replace(/data:image\/png;base64,/, "");

  fetch("/process_image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageData }),
  })
    .then((response) => response.json())
    .then((data) => {
      drawResults(data.results);
      isProcessing = false;
    })
    .catch((error) => {
      console.error("Error processing frame:", error);
      isProcessing = false;
    });
}

function SaveData() {
  const Username = document.getElementById("Username").value;

  if (!Username) {
    alert("Please enter a name.");
    return;
  }

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    const formData = new FormData();
    formData.append("image", blob, {Username}.png);
    formData.append("username", Username);

    fetch("/upload_data", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Image saved:", data);
      })
      .catch((error) => {
        console.error("Error uploading image:", error);
      });
  }, "image/png");
}

setInterval(processFrame, 200);

