import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

device = torch.device("cpu")

tokenizer = AutoTokenizer.from_pretrained("app/models/layer2/roberta_model")
model = AutoModelForSequenceClassification.from_pretrained(
    "app/models/layer2/roberta_model"
).to(device)

model.eval()

def layer2_predict(subject, body):
    text = (subject + " " + body)[:512]

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True
    )

    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.softmax(outputs.logits, dim=1)

    return float(probs[0][1])