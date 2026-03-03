"""
REAL FACE MATCHING USING MEDIAPIPE (Geometric Approximation)

HOW TO USE IN REAL TIME:
1. Ensure 'known_faces' directory exists.
2. Add student photos named exactly as their Face ID in DB (e.g., 'face_101.jpg', 'face_102.jpg').
3. Run this script. It uses your webcam.
4. When a face matches, it sends a POST request to the backend.
"""

import cv2
import requests
import time
import mediapipe as mp
import numpy as np
import os
import math

# Configuration
API_URL = "http://localhost:8080/api/attendance/mark"
SESSION_ID = 1
KNOWN_FACES_DIR = "known_faces"

# --- MediaPipe Setup ---
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def calculate_ear(landmarks, width, height):
    """
    Eye Aspect Ratio (EAR) for Drowsiness Detection.
    Uses generic mesh points for Left/Right eyes.
    Left Eye: 33, 160, 158, 133, 153, 144
    Right Eye: 362, 385, 387, 263, 373, 380
    """
    def get_eye_ear(indices):
        # Vertical 1
        v1 = np.linalg.norm((np.array([landmarks[indices[1]].x * width, landmarks[indices[1]].y * height]) - 
                             np.array([landmarks[indices[5]].x * width, landmarks[indices[5]].y * height])))
        # Vertical 2
        v2 = np.linalg.norm((np.array([landmarks[indices[2]].x * width, landmarks[indices[2]].y * height]) - 
                             np.array([landmarks[indices[4]].x * width, landmarks[indices[4]].y * height])))
        # Horizontal
        h = np.linalg.norm((np.array([landmarks[indices[0]].x * width, landmarks[indices[0]].y * height]) - 
                            np.array([landmarks[indices[3]].x * width, landmarks[indices[3]].y * height])))
        return (v1 + v2) / (2.0 * h) if h > 0 else 0

    left_indices = [33, 160, 158, 133, 153, 144]
    right_indices = [362, 385, 387, 263, 373, 380]

    ear_left = get_eye_ear(left_indices)
    ear_right = get_eye_ear(right_indices)
    return (ear_left + ear_right) / 2.0

def calculate_gaze_score(landmarks, width):
    """
    Estimates if student is looking at screen (Attentive) or away.
    Uses Nose (1) relative to Screen Centre (Width/2).
    Returns score 0-100 (100 = centered).
    """
    nose_x = landmarks[1].x * width
    center_x = width / 2
    
    # Calculate offset from center (normalized by half-width logic)
    # If nose is within central 30% of screen, high score.
    # Deviation > 25% of width => Looking away.
    
    deviation = abs(nose_x - center_x)
    max_deviation = width * 0.4  # Assume edge of screen is max sensible deviation
    
    score = 100 - (deviation / max_deviation * 100)
    return max(0, min(100, score))

def get_face_embedding(landmarks):
    """
    Creates a simple 12-point unique signature (embedding) from face landmarks.
    We use relative distances so it works even if you are close/far from camera.
    """
    # Key points: 
    # 1: Nose Tip
    # 33: Left Eye Inner, 263: Right Eye Inner
    # 61: Mouth Left, 291: Mouth Right
    # 10: Top Head, 152: Chin
    
    # Simple relative distance encoding:
    # We use Eye Width (33-263) as the unit 'scale'. This handles zooming/camera distance.
    points = {}
    for idx in [1, 33, 263, 61, 291, 10, 152]:
        points[idx] = np.array([landmarks[idx].x, landmarks[idx].y])
    
    # Base scale: Distance between eyes (to normalize distance)
    scale = np.linalg.norm(points[33] - points[263])
    if scale == 0: return None

    embedding = []
    
    # 1. Nose Position relative to Eyes (Vertical & Horizontal)
    # How far is nose below eyes?
    eye_midpoint = (points[33] + points[263]) / 2
    nose_y_dist = np.linalg.norm(points[1] - eye_midpoint) / scale
    embedding.append(nose_y_dist)
    
    # 2. Nose to Mouth (Upper Lip area)
    mouth_midpoint = (points[61] + points[291]) / 2
    nose_mouth_dist = np.linalg.norm(points[1] - mouth_midpoint) / scale
    embedding.append(nose_mouth_dist)
    
    # 3. Face Aspect Ratio (Long Face vs Round Face)
    face_height = np.linalg.norm(points[10] - points[152])
    embedding.append(face_height / scale)
    
    # 4. Mouth Width
    mouth_width = np.linalg.norm(points[61] - points[291]) / scale
    embedding.append(mouth_width)
    
    # 5. Chin Length (Chin to Mouth)
    chin_length = np.linalg.norm(points[152] - mouth_midpoint) / scale
    embedding.append(chin_length)

    return np.array(embedding)

def load_known_faces():
    """Scan the 'known_faces' folder and pre-calculate embeddings for every student photo."""
    known_db = {}
    if not os.path.exists(KNOWN_FACES_DIR):
        print(f"Warning: '{KNOWN_FACES_DIR}' folder not found. No students loaded.")
        return known_db
    
    print("Loading student database...")
    with mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True) as mesh:
        for filename in os.listdir(KNOWN_FACES_DIR):
            if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                path = os.path.join(KNOWN_FACES_DIR, filename)
                image = cv2.imread(path)
                if image is None:
                    print(f"⚠️ FAILD to load image: {filename}. Check file format!")
                    continue
                
                print(f"Processing {filename}...")
                results = mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
                if results.multi_face_landmarks:
                    # Get the embedding for this student photo
                    emb = get_face_embedding(results.multi_face_landmarks[0].landmark)
                    if emb is not None:
                        # File name "face_101.jpg" -> ID "face_101"
                        face_id = os.path.splitext(filename)[0]
                        known_db[face_id] = emb
                        print(f"✅ Loaded: {face_id}")
                    else:
                        print(f"⚠️ NO FACE signature found in {filename}")
                else:
                    print(f"⚠️ NO FACE detected in {filename}. Please use a clear front-facing photo.")
    
    print(f"Total students loaded: {len(known_db)}")
    return known_db

def find_best_match(current_embedding, known_db, threshold=0.45):
    """
    Compare current face with all known students to find a match.
    Increased threshold to 0.45 to be VERY permissive for testing.
    """
    best_match = None
    min_dist = float('inf')

    # Debug: Print top matches
    matches = []
    for face_id, known_emb in known_db.items():
        # Euclidean distance between signatures
        dist = np.linalg.norm(current_embedding - known_emb)
        matches.append((face_id, dist))
        
        if dist < min_dist:
            min_dist = dist
            best_match = face_id
    
    # Sort matches to show user
    matches.sort(key=lambda x: x[1])
    if matches:
        print(f"Closest: {matches[0][0]} ({matches[0][1]:.2f}) | Threshold: {threshold}")
            
    if min_dist < threshold:
        return best_match, min_dist
    
    # Return None but also the min_dist so we can show it
    return None, min_dist

def main():
    # 1. Load known faces
    print("--------------------------------------------------")
    print("STEP 1: Checking for 'known_faces' directory...")
    if not os.path.exists(KNOWN_FACES_DIR):
        os.makedirs(KNOWN_FACES_DIR)
        print(f"Created '{KNOWN_FACES_DIR}'. Please add student photos here!")
        print("Example: Save a photo of student 101 as 'face_101.jpg'")
        return

    known_faces = load_known_faces()
    if not known_faces:
        print("⚠️ No student faces found! Please add .jpg files to 'known_faces/' folder.")
        print("Required Filename Format: face_ROLLNUMBER.jpg (e.g., face_101.jpg)")
        input("Press Enter to exit...")
        return

    # 2. Start Camera
    print("--------------------------------------------------")
    print("STEP 2: Starting Camera... (Press 'q' to quit)")
    cap = cv2.VideoCapture(0)
    
    # Track Last Sent Time PER STUDENT so multiple people can be marked
    last_sent_times = {}  
    
    with mp_face_mesh.FaceMesh(max_num_faces=5, refine_landmarks=True) as face_mesh:
        while cap.isOpened():
            success, image = cap.read()
            if not success: continue

            # Mirror the image for intuitive feel (like a mirror)
            image = cv2.flip(image, 1)
            debug_image = image.copy() # visual output
            
            # Process with MediaPipe
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(image_rgb)
            
            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    # Draw mesh (Generic Face) on debug_image
                    mp_drawing.draw_landmarks(
                        debug_image, 
                        face_landmarks, 
                        mp_face_mesh.FACEMESH_TESSELATION, 
                        None, 
                        mp_drawing_styles.get_default_face_mesh_tesselation_style()
                    )

                    h, w, _ = image.shape
                    
                    # 1. Calculate Attention Score (Head Position)
                    # Use center of face (nose tip 1) relative to screen center
                    nose_x = face_landmarks.landmark[1].x
                    # Simple heuristic: |0.5 - nose_x| tells us if they are looking left/right
                    deviation = abs(0.5 - nose_x)
                    # 0 deviation = 100 score. 0.3 deviation = 0 score.
                    # Mapping: 100 - (deviation * 333)
                    attention_score = max(0, min(100, 100 - (deviation * 400))) 
                    
                    # 2. Calculate Drowsiness (Eye Aspect Ratio - EAR)
                    # Left Eye: 33, 160, 158, 133, 153, 144 (approx)
                    # Right Eye: 362, 385, 387, 263, 373, 380 (approx)
                    # Simplified vertical openess:
                    # Top eyelid (159/386), Bottom eyelid (145/374).
                    # Eye Height / Eye Width.
                    
                    left_eye_top = face_landmarks.landmark[159].y
                    left_eye_bottom = face_landmarks.landmark[145].y
                    left_eye_h = abs(left_eye_top - left_eye_bottom)
                    
                    right_eye_top = face_landmarks.landmark[386].y
                    right_eye_bottom = face_landmarks.landmark[374].y
                    right_eye_h = abs(right_eye_top - right_eye_bottom)
                    
                    # Normal eye open is ~0.02 - 0.03 range in normalized coords. < 0.01 is closed.
                    avg_eye_open = (left_eye_h + right_eye_h) / 2.0
                    is_drowsy = avg_eye_open < 0.012 # Threshold for blink/closed eyes

                    # Identify Specific Student
                    curr_emb = get_face_embedding(face_landmarks.landmark)
                    label = "Unknown"
                    color = (0, 0, 255) # Red for Unknown

                    if curr_emb is not None:
                        match_id, dist = find_best_match(curr_emb, known_faces)
                        
                        if match_id:
                            # Found a known student!
                            label = f"{match_id} ({dist:.2f})"
                            color = (0, 255, 0) # Green for Match

                            # Visual Alert for Drowsiness
                            if is_drowsy:
                                cv2.putText(debug_image, "DROWSY!", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3)

                            # Throttle: Check if we sent data for THIS student in last 5 seconds
                            now = time.time()
                            if match_id not in last_sent_times or (now - last_sent_times[match_id] > 5.0):
                                try:
                                    print(f" >>> Marking: {match_id} | Attn: {int(attention_score)}% | Drowsy: {is_drowsy}")
                                    payload = {
                                        "faceEncodingId": match_id,
                                        "sessionId": SESSION_ID,
                                        "attentionScore": float(attention_score),
                                        "isDrowsy": bool(is_drowsy)
                                    }
                                    
                                    # Use a short timeout for the request so UI doesn't freeze
                                    response = requests.post(API_URL, json=payload, timeout=2.0)
                                    if response.status_code == 200:
                                        print(f" ✅ Marked Present!")
                                        last_sent_times[match_id] = now
                                    else:
                                        print(f" ⚠️ API Error ({response.status_code}): {response.text}")

                                except Exception as e:
                                    print(f" ❌ API Connection Error: Is backend running? {e}")
                        else:
                            # Unknown but show distance to closest match
                            label = f"Unknown ({dist:.2f})"
                    
                    # Draw Name Tag on debug_image
                    # Position text near the chin (Landmark 152) or Forehead (10)
                    cx = int(face_landmarks.landmark[10].x * w)
                    cy = int(face_landmarks.landmark[10].y * h) - 20
                    cv2.putText(debug_image, label, (cx-50, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                    
                    # Show detailed stats on screen
                    stats = f"Attn: {int(attention_score)}% | Eyes: {avg_eye_open:.3f}"
                    cv2.putText(debug_image, stats, (cx-60, cy+30), cv2.FONT_HERSHEY_PLAIN, 1.2, (255,255,255), 1)

            # Display 
            cv2.imshow('Smart Classroom Scanner', debug_image)
            
            # Key Handling
            key = cv2.waitKey(10) & 0xFF
            
            # Quit
            if key == ord('q') or key == 27:
                print("Stopping scanner...")
                break
                
            # Capture New Student (Enrollment Mode)
            if key == ord('c'):
                print("\n--- CAPTURE MODE ---")
                try:
                    # Pause video feed momentarily (simple input blocks implementation)
                    student_roll = input("Enter Student ID/Roll Number to save (e.g., 105): ").strip()
                    if student_roll:
                        filename = f"face_{student_roll}.jpg"
                        filepath = os.path.join(KNOWN_FACES_DIR, filename)
                        
                        # Save the CLEAN image (without landmarks drawn)
                        cv2.imwrite(filepath, image)
                        print(f" ✅ Saved {filename}!")
                        
                        # Reload known faces instantly
                        print("Reloading database...")
                        known_faces = load_known_faces()
                        print("------------------\n")
                    else:
                        print("Cancelled (empty input).")
                except Exception as e:
                    print(f"Error capturing: {e}")

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nScanner stopped by User (Ctrl+C).")
        cv2.destroyAllWindows()
