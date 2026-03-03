import cv2
import requests
import time
import mediapipe as mp
import numpy as np

# Configuration
API_URL = "http://localhost:8080/api/attendance/mark"
SESSION_ID = 1

# --- MediaPipe Setup ---
mp_face_mesh = mp.solutions.face_mesh
mp_drawing_styles = mp.solutions.drawing_styles
mp_drawing = mp.solutions.drawing_utils

# --- Helper Functions ---

def calculate_mar(mesh_points):
    """
    Calculate Mouth Aspect Ratio (MAR) to detect yawning/drowsiness.
    Wait, MAR is usually for yawning. EAR (Eye Aspect Ratio) is for drowsiness.
    Let's implement a simple EAR using mesh points.
    """
    # Simply using eye height vs width for now as drowsiness indicators
    # Landmark indices for Left Eye: 33, 160, 158, 133, 153, 144
    # Landmark indices for Right Eye: 362, 385, 387, 263, 373, 380
    
    # 159 (top), 145 (bottom) for left eye vertical
    # 33 (left), 133 (right) for left eye horizontal

    # Simplified mock logic for now: Just detecting face presence and rotation
    return 0.0

def get_head_pose(face_landmarks):
    # Determine looking direction (Forward, Left, Right, Up, Down) based on nose tip vs face center
    # Nose tip: 1
    # Very rudimentary logic: just returning "Looking Forward" if valid
    return "Forward"

def main():
    # Load MediaPipe Face Mesh
    with mp_face_mesh.FaceMesh(
        max_num_faces=5,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5) as face_mesh:

        cap = cv2.VideoCapture(0)
        print("Starting Smart Classroom Camera...")

        last_sent_time = 0
        cooldown = 2 # Send data more frequently for demo
        
        while cap.isOpened():
            success, image = cap.read()
            if not success:
                print("Ignoring empty camera frame.")
                continue

            # To improve performance, mark the image as not writeable to pass by reference.
            image.flags.writeable = False
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(image_rgb)

            # Draw the face mesh annotations on the image.
            image.flags.writeable = True
            image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
            
            detected_faces = []
            attention_score = 0.0
            is_drowsy = False

            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    # Draw mesh
                    mp_drawing.draw_landmarks(
                        image=image,
                        landmark_list=face_landmarks,
                        connections=mp_face_mesh.FACEMESH_TESSELATION,
                        landmark_drawing_spec=None,
                        connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style())
                    
                    # --- SIMULATED IDENTIFICATION ---
                    # In a real app, you'd use face_recognition library here.
                    # Since installing dlib on Windows can be complex without VS Build Tools,
                    # we will simulate identification for now based on detection.
                    detected_faces.append("face_001") # Always assume it's John Doe if a face is seen

                    # --- ATTENTION MONITORING ---
                    # Simple heuristic: If face is detected, attention is high (80-100)
                    # We can vary it randomly a bit for realism or based on head movement later
                    attention_score = 95.0 
                    
                    # Check for "Drowsiness" (for now, toggled by specific key 'd' or random, 
                    # but let's keep it false for basic demo)
                    is_drowsy = False

            current_time = time.time()
            if current_time - last_sent_time > cooldown:
                # Only send if faces were detected
                if detected_faces:
                    # Remove duplicates if multiple faces detected but mapping to same ID in simulation
                    unique_faces = list(set(detected_faces))
                    
                    for face_id in unique_faces:
                        payload = {
                            "faceEncodingId": face_id,
                            "sessionId": SESSION_ID,
                            "attentionScore": attention_score,
                            "isDrowsy": is_drowsy
                        }
                        try:
                            # Use a very short timeout so video doesn't lag
                            requests.post(API_URL, json=payload, timeout=0.5)
                            print(f"Sent update for {face_id}: Attention {attention_score}%")
                        except Exception as e:
                            pass # Ignore connection errors to keep video smooth
                    
                    last_sent_time = current_time

            # Flip the image horizontally for a selfie-view display.
            cv2.imshow('Smart Classroom Monitor (MediaPipe)', cv2.flip(image, 1))
            
            # Press 'q' to quit
            if cv2.waitKey(5) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
