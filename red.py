import cv2
import face_recognition
import os
import numpy as np
from datetime import datetime

def generate_unique_filename(directory, base_name, extension):
    name = base_name
    counter = 0
    filename = f"{name}{extension}"
    while os.path.exists(os.path.join(directory, filename)):
        counter += 1
        filename = f"{name}_{counter}{extension}"
    return filename

def main():
    known_faces_encodings = []
    known_faces_names = []
    known_faces_dir = 'facedata'

    if not os.path.exists(known_faces_dir):
        os.makedirs(known_faces_dir)

    def close_windows():
        cap.release()
        cv2.destroyAllWindows()
        exit()

    for filename in os.listdir(known_faces_dir):
        image = face_recognition.load_image_file(os.path.join(known_faces_dir, filename))
        face_encodings = face_recognition.face_encodings(image)
        if len(face_encodings) > 0:
            known_faces_encodings.append(face_encodings[0])
            known_faces_names.append(os.path.splitext(filename)[0])

    cap = cv2.VideoCapture(0)
    cap.set(3, 640)
    cap.set(4, 480)

    if not cap.isOpened():
        print("Tidak dapat membuka kamera")
        exit()

    img_bg = cv2.imread('bg.jpg')
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Gagal menangkap frame")
            break

        # Resize `frame` if necessary to match part of `img_bg`
        if img_bg is not None:
            img_bg_copy = img_bg.copy()
            img_bg_copy[120:120+frame.shape[0], 160:160+frame.shape[1]] = frame  # Adjust this placement

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Only detect faces every few frames to reduce lag
        if frame_count % 5 == 0:
            face_locations = face_recognition.face_locations(rgb_frame)
            face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        for face_encoding, face_location in zip(face_encodings, face_locations):
            distances = face_recognition.face_distance(known_faces_encodings, face_encoding)
            best_match_index = np.argmin(distances)
            name = known_faces_names[best_match_index] if distances[best_match_index] < 0.6 else "Unknown"

            top, right, bottom, left = face_location
            padding = 10
            cv2.rectangle(img_bg_copy, (left - padding, top - padding), (right + padding, bottom + padding), (0, 255, 0), 2)
            cv2.putText(img_bg_copy, name, (left - padding, bottom + padding + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 0), 2)

        cv2.rectangle(img_bg_copy, (200, 10), (350, 100), (0, 255, 0) if face_encodings else (0, 0, 255), -1)
        cv2.imshow("Face Recognition Prototype 0.01", img_bg_copy)

        if cv2.waitKey(1) & 0xFF == ord('s'):
            base_name = "image"
            unique_filename = generate_unique_filename(known_faces_dir, base_name, ".png")
            img_path = os.path.join(known_faces_dir, unique_filename)
            cv2.imwrite(img_path, frame)
            print(f"Image saved: {unique_filename}")
            saved_image = cv2.imread(img_path)
            if saved_image is not None:
                window_name = f"Result {datetime.now().strftime('%H-%M-%S')}"
                cv2.imshow(window_name, saved_image)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            close_windows()
            break

        frame_count += 1  # Increase frame count to control frequency of face detection

if __name__ == '__main__':
    main()
