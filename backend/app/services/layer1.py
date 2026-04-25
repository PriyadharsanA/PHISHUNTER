import joblib
import numpy as np
import re
model = joblib.load("app/models/layer1/url_rf_model.pkl")

def extract_url_features(url):
    url = str(url)
    
    features = {}
    
    features['url_length'] = len(url)
    features['num_digits'] = sum(c.isdigit() for c in url)
    features['num_special'] = sum(not c.isalnum() for c in url)
    features['has_https'] = int('https' in url)
    features['num_dots'] = url.count('.')
    features['num_hyphens'] = url.count('-')

    suspicious_words = ['login', 'verify', 'bank', 'secure', 'account', 'update', 'free', 'bonus']
    features['has_suspicious_word'] = int(any(word in url for word in suspicious_words))

    features['has_ip'] = int(bool(re.search(r'\d+\.\d+\.\d+\.\d+', url)))
    features['is_long_url'] = int(len(url) > 75)
    features['has_at_symbol'] = int('@' in url)
    features['num_params'] = url.count('=')
    features['num_slashes'] = url.count('/')

    return list(features.values())

def layer1_predict(url):
    if not url:
        return 0.0
    
    features = extract_url_features(url)
    X = np.array(features).reshape(1, -1)
    return float(model.predict_proba(X)[0][1])