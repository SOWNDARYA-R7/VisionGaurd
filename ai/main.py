from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("../yolov8s-worldv2.pt")


@app.get("/")
def home():
    return {"message": "VisionGuard AI is running"}


@app.post("/detect")
async def detect(
    image: UploadFile = File(...),
    prompt: str = Form(...)
):
    image_bytes = await image.read()
    img = Image.open(io.BytesIO(image_bytes))

    classes = [item.strip() for item in prompt.split(",") if item.strip()]

    model.set_classes(classes)

    results = model(img)

    detections = []

    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            coordinates = box.xyxy[0].tolist()

            detections.append({
                "label": classes[class_id],
                "confidence": round(confidence, 2),
                "box": coordinates
            })

    return {
        "prompt": classes,
        "detections": detections
    }