from flask import Blueprint, render_template, request, jsonify, g
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
    return render_template('index.html')

@recognition_bp.route('/upload_data', methods=['POST'])
def upload_data():
    if 'image' not in request.files or 'username' not in request.form:
        return jsonify({'error': 'No image or username provided'}), 400
    
    # Get image and username from the request
    image = request.files['image']
    username = request.form['username']
    filename = f"{username}.png"
    filepath = os.path.join(known_faces_dir, filename)
    
    image.save(filepath)
    return jsonify({'message': 'Image saved', 'filename': filename}), 200

@recognition_bp.route('/process_image', methods=['POST'])
def process_image():
    try:
        # Get the base64 image data from the request
        data = request.json.get('image')
        if not data:
            return jsonify({'error': 'No image data provided'}), 400
# dhadoshpdiajdoasda
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
            if best_match_index is not None and distances[best_match_index] < 0.65:
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


# @recognition_bp.route('/uniqe_names')
# def generate_unique_filename(directory, extension):
#     # Pastikan g.u_name sudah di-set sebelumnya
#     if not hasattr(g, 'u_name'):
#         return jsonify({'error': 'User name not set'}), 400
    
#     # Menggunakan g.u_name yang diset sebelumnya di /submit_name
#     base_name = g.u_name
#     counter = 0
#     filename = f"{base_name}{extension}"

#     # Periksa apakah file sudah ada, dan jika ada, tambahkan angka unik ke nama file
#     while os.path.exists(os.path.join(directory, filename)):
#         counter += 1
#         filename = f"{base_name}_{counter}{extension}"

#     return jsonify({'filename': filename})


#Notes :
#1. optimize
#2 Atur uniqe name