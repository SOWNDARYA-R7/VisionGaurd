## Installation

* install python (version i used is 3.12.7)
* install virtual environment and activate it
  comments:
    * python -m venv venv
    * venv\Scripts\activate
* install YOLO & Confirmation
  comment:
    * pip install ultralytics
    * yolo checks
* import Yolo
  comments:
    * python -c "from ultralytics import YOLO;
* install YOLO-WORLD - model used(yolov*s-worldv2)
    * from ultralytics import YOLO; model=YOLO('yolov8s-worldv2.pt');
* Install FastAPI + Uvicorn
  comments:
    * pip install fastapi uvicorn python-multipart

## Testing Yolo
* images has to be uploaded in the directory
run comment:
  python -c "from ultralytics import YOLO; model=YOLO('yolov8s-worldv2.pt'); model.set_classes(['helmet']); results=model('testImage.exetension', save=True); print('Detection complete')"

  testImage.exetension example => test.jpg,image.png,etc,.

# Output of testing:
In Terminal:
  * Detection complete
In directory:
  * New folders created as \runs\detect\predict
  * it contains the output image with bounding box.

## Run Project
  * In ai folder - written with FastApi --> uvicorn main:app --reload