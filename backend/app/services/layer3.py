import re
import torch
import joblib
import json
import numpy as np
from transformers import AutoTokenizer, AutoModel

device = torch.device("cpu")

clf = joblib.load("app/models/layer3/layer3_rf_model.pkl")

tokenizer = AutoTokenizer.from_pretrained("app/models/layer3/bert_model")
bert_model = AutoModel.from_pretrained("app/models/layer3/bert_model").to(device)
bert_model.eval()

with open("app/models/layer3/layer3_config.json") as f:
    config = json.load(f)

# unpack
uw = config["urgency_words"]
fw = config["fear_words"]
aw = config["authority_words"]
rw = config["reward_words"]
pp = config["pressure_patterns"]
up = config["urgency_patterns"]
sp = config["suggestive_patterns"]
softp = config["soft_patterns"]

def extract_features(text):
    t = text.lower()
    wc = len(t.split()) + 1

    def count(words):
        return sum(len(re.findall(r'\b'+re.escape(w)+r'\b', t)) for w in words)

    def patt(p):
        return sum(len(re.findall(x, t)) for x in p)

    return [
        count(uw)/wc,
        count(fw)/wc,
        count(aw)/wc,
        count(rw)/wc,
        patt(pp),
        patt(up),
        patt(sp),
        patt(softp),
        sum(1 for c in text if c.isupper())/(len(text)+1),
        text.count("!")/(len(text)+1)
    ]

def get_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
    
    with torch.no_grad():
        outputs = bert_model(**inputs)

    return outputs.last_hidden_state[:,0,:].numpy().flatten()

def explain(feats):
    labels = [
        "urgency","fear","authority","reward",
        "pressure","urgency_pattern","suggestive",
        "implicit_persuasion"
    ]
    return [labels[i] for i in range(len(labels)) if feats[i] > 0]

def find_matches(text, word_list):
    t = text.lower()
    found = []
    for w in word_list:
        if re.search(r'\b' + re.escape(w) + r'\b', t):
            found.append(w)
    return list(set(found))

def predict_layer3(subject, body):
    text = (subject + " " + body)[:1000]

    feats = extract_features(text)
    emb = get_embedding(text)

    X = np.concatenate([emb, feats]).reshape(1, -1)

    prob = clf.predict_proba(X)[0][1]

    # 🔥 FIX: normalize score
    manipulation = (
        0.6*(feats[0]+feats[1]+feats[2]+feats[3]) +
        0.25*(2*feats[4]+1.5*feats[5]+feats[6]) +
        0.1*feats[7] +
        0.05*(feats[8]+feats[9])
    )

    manipulation = min(manipulation, 1.0)  # ✅ clamp

    signals = explain(feats)

    # 🔥 NEW: matched words (for UI highlight)
    matched = {
        "urgency": find_matches(text, uw),
        "fear": find_matches(text, fw),
        "authority": find_matches(text, aw),
        "reward": find_matches(text, rw),
        "pressure": find_matches(text, [p for p in pp if isinstance(p, str)])
    }

    return {
        "probability": float(prob),
        "manipulation_score": float(manipulation),
        "detected_signals": signals,
        "matched": matched   # ✅ REQUIRED
    }