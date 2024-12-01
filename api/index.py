from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from api.processors.face import anonymize_all_faces


app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")


@app.get("/api/py/helloFastApi")
def hello_fast_api():
    return {"message": "Hello from FastAPI"}


@app.post("/api/py/analyze")
async def analyze(file: UploadFile = File(...)):
    file_content = await file.read()

    if (not file.content_type.endswith('png')):
        raise HTTPException(
            status_code=400, detail="File must be an image")

    isSuccess, image_byte_arr = anonymize_all_faces(file_content)

    if (not isSuccess):
        raise HTTPException(
            status_code=500, detail="File must be an image")

    return StreamingResponse(image_byte_arr, media_type="image/png")
