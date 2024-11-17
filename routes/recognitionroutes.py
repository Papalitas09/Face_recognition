from flask import Blueprint, render_template, request, jsonify
import face_recognition
import numpy as np
import cv2
import base64
import os

recognition_bp = Blueprint('recognition', __name__)

known_faces_dir = 'facedata'
known_faces_encodings = []
known_faces_names = []


# Load known faces
if not os.path.exists(known_faces_dir):
    os.makedirs(known_faces_dir)

for filename in os.listdir(known_faces_dir):
    image = face_recognition.load_image_file(os.path.join(known_faces_dir, filename))
    face_encodings = face_recognition.face_encodings(image)
    if face_encodings:
        known_faces_encodings.append(face_encodings[0])
        known_faces_names.append(os.path.splitext(filename)[0])

@recognition_bp.route('/')
def index():
    return render_template('detection.html')


@recognition_bp.route('/detection', methods=['POST'])  # Endpoint untuk deteksi wajah
def face_detection():
    # Decode base64 string menjadi gambar
    data = request.json.get("image")
    if data is None:
        return jsonify({"error": "No image provided"}), 400
    
    # Decode base64 menjadi numpy array
    image_data = base64.b64decode(data.split(",")[1])  # Mengabaikan header base64
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Konversi ke grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Muat model Haar Cascade
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    # Kirim posisi wajah yang terdeteksi
    face_positions = [{"x": int(x), "y": int(y), "w": int(w), "h": int(h)} for (x, y, w, h) in faces]

    return jsonify({"faces": face_positions})

#####################################################################################################################################

@recognition_bp.route('/save_image', methods=['POST'])
def save_image():
    try:
        # Ambil data dari request
        data = request.json
        image_data = data.get("image")
        username = data.get("name")

        if not image_data or not username:
            return jsonify({"success": False, "error": "Missing image or name"}), 400

        # Decode base64 menjadi array numpy
        image_data = base64.b64decode(image_data.split(",")[1])
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"success": False, "error": "Failed to decode image"}), 400

        # Buat nama file unik
        filename = generate_unique_filename(known_faces_dir, username, ".jpg")
        filepath = os.path.join(known_faces_dir, filename)

        # Simpan gambar
        cv2.imwrite(filepath, img)

        return jsonify({"success": True, "message": f"Image saved as {filename}"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


######################################################################################################################################

def generate_unique_filename(directory, base_name, extension):
    counter = 0
    filename = f"{base_name}{extension}"
    while os.path.exists(os.path.join(directory, filename)):
        counter += 1
        filename = f"{base_name}_{counter}{extension}"
    return filename

@recognition_bp.route('/recognition')
def recognition():
    anjay = True
    return render_template('recognition.html')

@recognition_bp.route('/recognition/process_image', methods=['POST'])
def process_image():
    try:
        # Get the base64 image data from the request
        data = request.json.get('image')
        if not data:
            return jsonify({'error': 'No image data provided'}), 400

        # Decode the base64 image
        image_data = base64.b64decode(data)
        np_img = np.frombuffer(image_data, np.uint8)

        if np_img.size == 0:
            return jsonify({'error': 'Image data is empty'}), 400

        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({'error': 'Failed to decode image'}), 400

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        face_locations = face_recognition.face_locations(rgb_frame, model="hog")
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        results = []
        for face_location, face_encoding in zip(face_locations, face_encodings):
            distances = face_recognition.face_distance(known_faces_encodings, face_encoding)
            best_match_index = np.argmin(distances) if distances.size > 0 else None
            name = "Unknown"
            if best_match_index is not None and distances[best_match_index] < 0.55:
                name = known_faces_names[best_match_index]

            # Append name and location of the detected face
            top, right, bottom, left = face_location
            results.append({
                "name": name,
                "location": {"top": top, "right": right, "bottom": bottom, "left": left}
            })

        return jsonify({"results": results})

    except Exception as e:
        return jsonify({'error': str(e)}), 500



#Notes :
#1. optimize

# @recognition_bp.route('/upload_data', methods=['POST'])
# def upload_data():
#     if 'image' not in request.files or 'username' not in request.form:
#         return jsonify({'error': 'No image or username provided'}), 400

#     image = request.files['image']
#     username = request.form['username']
#     base_name = username
#     extension = ".png"

#     # Generate unique filename
#     filename = generate_unique_filename(known_faces_dir, base_name, extension)
#     filepath = os.path.join(known_faces_dir, filename)

#     image.save(filepath)
#     print(f"Image saved at: {filepath}")
#     return jsonify({'message': 'Image saved', 'filename': filename}), 200

#2 Atur uniqe name