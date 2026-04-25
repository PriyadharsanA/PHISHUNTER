from fastapi import APIRouter
from app.schemas.request import EmailRequest
from app.services.pipeline import full_pipeline
from app.db_mongo import collection

router = APIRouter()
@router.post("/predict")
def predict(data: EmailRequest):
    result = full_pipeline(data.subject, data.body, data.url)

    doc = {
        "subject": data.subject,
        "body": data.body,
        "url": data.url,
        "result": result
    }
    collection.insert_one(doc)
    return result

@router.get("/history")
def get_history():
    docs = list(collection.find().sort("_id", -1))

    for d in docs:
        d["_id"] = str(d["_id"])  # convert ObjectId

    return docs