import cv2
import requests
import time
import json

# Configuration
API_URL = "http://localhost:8080/api/attendance/mark"
SESSION_ID = 1

# Mock database of known face encodings (In reality, use face_recognition library)
# Mapping a dummy face ID to a student
KNOWN_FACES = {
    "face_001": "John Doe"
}

def analyze_attention(frame):
    # Placeholder for attention and drowsiness detection logic
    # e.g., using MediaPipe or Dlib to check eye aspect ratio (EAR) and head pose
    attention_score = 85.5
    is_drowsy = False
    return attention_score, is_drowsy

def recognize_faces(frame):
    # Placeholder for face recognition logic
    # e.g., using face_recognition.face_encodings(frame)
    # Returning a mock detected face ID
    return ["face_001"]

def main():
    cap = cv2.VideoCapture(0)
    print("Starting Smart Classroom Camera...")

    last_sent_time = 0
    cooldown = 5 # Send data every 5 seconds to avoid spamming the API

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # 1. Recognize Faces
        detected_face_ids = recognize_faces(frame)

        # 2. Analyze Attention
        attention_score, is_drowsy = analyze_attention(frame)

        # 3. Send to Spring Boot Backend
        current_time = time.time()
        if current_time - last_sent_time > cooldown:
            for face_id in detected_face_ids:
                payload = {
                    "faceEncodingId": face_id,
                    "sessionId": SESSION_ID,
                    "attentionScore": attention_score,
                    "isDrowsy": is_drowsy
                }
                try:
                    response = requests.post(API_URL, json=payload)
                    print(f"API Response: {response.status_code} - {response.text}")
                except Exception as e:
                    print(f"Failed to connect to backend: {e}")
            
            last_sent_time = current_time

        # Display the frame
        cv2.putText(frame, f"Monitoring... (Press 'q' to quit)", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.imshow('Smart Classroom Monitor', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
