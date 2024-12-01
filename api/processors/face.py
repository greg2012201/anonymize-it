import numpy as np
import face_recognition
from collections import namedtuple
import cv2
from io import BytesIO
from PIL import Image


def save_image(image: np.ndarray, file_path: str):
    try:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        cv2.imwrite(file_path, cv2.cvtColor(rgb_image, cv2.COLOR_BGR2RGB))
    except Exception as e:
        print(f"Error saving image: {e}")


def anonymize_face(image: np.ndarray, face_locations: list, blur_radius: int = 50) -> np.ndarray:

    anonymized_image = image.copy()

    for (top, right, bottom, left) in face_locations:
        face = anonymized_image[top:bottom, left:right]

        face = cv2.GaussianBlur(face, (23, 23), 0)

        anonymized_image[top:bottom, left:right] = face

    return anonymized_image


def detect_face(image_bytes: bytes):
    # TODO: add error handlin ?
    Result = namedtuple(
        "Result", ["image", "face_locations", "face_encodings"])

    image = face_recognition.load_image_file(BytesIO(image_bytes))

    return Result(image, face_recognition.face_locations(image), face_recognition.face_encodings(image))


def anonymize_all_faces(image_bytes: bytes):
    image, face_locations, face_encodings = detect_face(image_bytes)
    result_image = anonymize_face(image, face_locations)
    print(result_image)
    file_path = "./output_image.png"
    save_image(result_image, file_path)
    return cv2.imencode(".png", image)
