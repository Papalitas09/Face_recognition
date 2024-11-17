const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const output = document.getElementById("output");
const context = canvas.getContext("2d");

let lastDetectionTime = 0; // Waktu terakhir deteksi wajah
const detectionInterval = 1000; // Interval deteksi (ms)
let isProcessing = false; // Cegah overlap proses
let cachedFaces = []; // Cache untuk menyimpan hasil deteksi wajah

// Akses kamera
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    // Jalankan loop menggambar video
    requestAnimationFrame(drawFrame);
  })
  .catch((error) => {
    console.error("Error accessing camera:", error);
  });

// Fungsi untuk menggambar frame video dan rectangle
function drawFrame() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Gambar video
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    context.clearRect(0, 0, canvas.width, canvas.height); // Bersihkan canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Gambar rectangle dari data cachedFaces
    cachedFaces.forEach((face) => {
      const { x, y, w, h } = face;
      context.strokeStyle = "red";
      context.lineWidth = 2;
      context.strokeRect(x, y, w, h);
    });
  }

  // Periksa apakah waktunya mendeteksi wajah
  const currentTime = Date.now();
  if (currentTime - lastDetectionTime > detectionInterval && !isProcessing) {
    detectFaces();
    lastDetectionTime = currentTime;
  }

  requestAnimationFrame(drawFrame); // Loop
}


function SaveData() {
  const Username = document.getElementById("Username").value;

  if (!Username.trim()) {
    alert("Please enter a valid name.");
    return;
  }

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    if (!blob) {
      alert("Failed to capture the image.");
      return;
    }

    const formData = new FormData();
    const timestamp = Date.now(); // Tambahkan timestamp
    const filename = `${Username}_${timestamp}.png`; // Nama file unik
    formData.append("image", blob, filename);
    formData.append("username", Username);

    fetch("/upload_data", {
        method: "POST",
        body: formData,
    })
    .then((response) => response.json())
    .then((data) => {
        alert("Data saved successfully: " + data.filename);
    })
    .catch((error) => {
        console.error("Error:", error);
        alert("Failed to save data.");
    });
    
  }, "image/png");
}

// Fungsi untuk mendeteksi wajah
function detectFaces() {
  isProcessing = true;

  // Ambil data gambar dari canvas sebagai base64
  const imageData = canvas.toDataURL("image/jpeg");

  // Kirim ke backend untuk deteksi wajah
  fetch("/detection", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: imageData }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Update cache dengan hasil deteksi baru
      if (data.faces && data.faces.length > 0) {
        cachedFaces = data.faces;
        output.innerText = `${data.faces.length} wajah terdeteksi.`;
      } else {
        cachedFaces = []; // Kosongkan cache jika tidak ada wajah
        output.innerText = "Tidak ada wajah terdeteksi.";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    })
    .finally(() => {
      isProcessing = false; // Proses selesai
    });
}

function nextRoutes(){
    window.location.href = '/recognition'
}
