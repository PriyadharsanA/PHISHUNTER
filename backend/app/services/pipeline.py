from .layer1 import layer1_predict
from .layer2 import layer2_predict
from .layer3 import predict_layer3

def full_pipeline(subject, body, url=None):

    L1 = layer1_predict(url)
    L2 = layer2_predict(subject, body)
    L3 = predict_layer3(subject, body)

    final_score = 0.25 * L1 + 0.4 * L2 + 0.35 * L3["manipulation_score"]

    if final_score > 0.7:
        verdict = "PHISHING"
    elif final_score > 0.4:
        verdict = "SUSPICIOUS"
    else:
        verdict = "SAFE"

    return {
        "verdict": verdict,
        "final_score": round(final_score,3),
        "layer1": L1,
        "layer2": L2,
        "layer3": L3
    }