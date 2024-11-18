const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const canvas1 = document.getElementById("canvas1");
const output = document.getElementById("output");
const context = canvas.getContext("2d");
const countdown = document.getElementById("countdown");

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

let time = 5; // Waktu countdown
let detected = false; // Awalnya belum ada wajah terdeteksi

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
      if (data.faces && data.faces.length > 0) {
        cachedFaces = data.faces;
        output.innerText = `${data.faces.length} wajah terdeteksi.`;
        detected = true; // Set detected ke true
        startCountdown(); // Mulai countdown ketika wajah terdeteksi
      } else {
        cachedFaces = []; // Kosongkan cache jika tidak ada wajah
        output.innerText = "Tidak ada wajah terdeteksi.";
        detected = false; // Tidak ada deteksi
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    })
    .finally(() => {
      isProcessing = false; // Proses selesai
    });
}

let funcRun = false
// Fungsi untuk memulai countdown
function startCountdown() {
  const timer = setInterval(() => {
    console.log(time); // Menampilkan angka di console
    countdown.textContent = time; // Menampilkan angka di halaman
    if (time-- <= 0) {
      clearInterval(timer); // Hentikan timer saat selesai
      countdown.textContent = "Time's up!";
      if (funcRun == false){
        SaveData()
        funcRun = true
      // Pindah ke halaman berikutnya
      } else {
        onlyOnce()
      }
    }
  }, 1000);
}

function onlyOnce(){
  setTimeout(() => {
    funcRun = false
  }, 5000);
}


// Fungsi untuk mengarahkan ke halaman berikutnya
function nextRoutes() {
  window.location.href = '/recognition';
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////

function SaveData() {
  const username = document.getElementById("Username").value.trim();
  let done_detection = true

  if (!username) {
      alert("Please enter your name!");
      return;
  }

  // Dapatkan konteks canvas1
  const context1 = canvas1.getContext("2d");

  // Sesuaikan ukuran canvas1 dengan video
  canvas1.width = video.videoWidth;
  canvas1.height = video.videoHeight;

  // Gambar ulang video pada canvas1 tanpa rectangle
  context1.clearRect(0, 0, canvas1.width, canvas1.height);
  context1.drawImage(video, 0, 0, canvas1.width, canvas1.height);

  // Ambil data gambar dari canvas1
  const imageData = canvas1.toDataURL("image/jpeg");

  // Kirim data gambar dan nama ke backend
  fetch("/save_image", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: imageData, name: username, kelar: done_detection }),
  })
      .then((response) => response.json())
      .then((data) => {
          if (data.success) {
              alert("Image saved successfully!");
              window.location.href = '/recognition'
              
          } else {
              alert("Failed to save image. Error: " + data.error);
          }
      })
      .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred while saving the image.");
      });
}




///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  // function SaveData() {
  //   const Username = document.getElementById("Username").value;
  
  //   if (!Username.trim()) {
  //     alert("Please enter a valid name.");
  //     return;
  //   }
  
  //   const ctx = canvas.getContext("2d");
  //   ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  //   canvas.toBlob((blob) => {
  //     if (!blob) {
  //       alert("Failed to capture the image.");
  //       return;
  //     }
  
  //     const formData = new FormData();
  //     const timestamp = Date.now(); // Tambahkan timestamp
  //     const filename = `${Username}_${timestamp}.png`; // Nama file unik
  //     formData.append("image", blob, filename);
  //     formData.append("username", Username);
  
  //     fetch("/upload_data", {
  //         method: "POST",
  //         body: formData,
  //     })
  //     .then((response) => response.json())
  //     .then((data) => {
  //         alert("Data saved successfully: " + data.filename);
  //     })
  //     .catch((error) => {
  //         console.error("Error:", error);
  //         alert("Failed to save data.");
  //     });
      
  //   }, "image/png");
  // }