# 🛡️ PHISHUNTER – Context-Aware Email Phishing Detection System

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10-blue"/>
  <img src="https://img.shields.io/badge/FastAPI-Backend-green"/>
  <img src="https://img.shields.io/badge/PyTorch-RoBERTa-yellow"/>
  <img src="https://img.shields.io/badge/Scikit--Learn-RandomForest-orange"/>
  <img src="https://img.shields.io/badge/MongoDB-Database-green"/>
  <img src="https://img.shields.io/badge/Status-Active-success"/>
</p>

---

PHISHUNTER is a multi-layered phishing detection system that combines **machine learning, deep learning, and psychological analysis** to detect phishing emails and explain the manipulation strategies behind them.

---

## 🚀 Overview

Phishing attacks exploit both **technical vulnerabilities** and **human psychology**.
PHISHUNTER integrates:

* 🔗 URL Analysis (Random Forest)
* 🧠 Content Classification (RoBERTa)
* 🎯 Psychological Manipulation Detection

The system provides both **accurate predictions** and **explainable outputs**.

---

## 🧠 Architecture

```
Input (Email + URL)
        ↓
Layer 1 → URL Analysis
        ↓
Layer 2 → Content Classification
        ↓
Layer 3 → Psychological Analysis
        ↓
Final Score + Verdict + Explanation
```

---

## ⚙️ Tech Stack

* **ML**: Random Forest (Scikit-learn)
* **DL**: RoBERTa, DistilBERT (Transformers)
* **Backend**: FastAPI
* **Database**: MongoDB
* **Frontend**: React (minimal)

---

## 📁 Project Structure

```
backend/
│
├── requirements.txt
├── run.py
│
├── app/
│   ├── main.py
│   ├── db_mongo.py
│
│   ├── services/
│   │   ├── layer1.py
│   │   ├── layer2.py
│   │   ├── layer3.py
│   │   ├── pipeline.py
│
│   ├── schemas/
│   │   ├── request.py
│
│   ├── routes/
│   │   ├── predict.py
│
│   ├── models/   ← (Download separately)
│
frontend/
│   ├── App.jsx
│   ├── package.json
│   ├── package-lock.json
```

---

## 📥 Download Pre-trained Models

Models are not included due to large file sizes.

👉 Download from Google Drive:
**[https://drive.google.com/drive/folders/1zc8AuIuKSxQWuUx1CPVdQfDY6MAQahIu?usp=drive_link]**

After downloading, place them inside:

```
backend/app/models/
```

⚠️ Do not rename files — structure is already correct.

---

## ▶️ Running the Backend

### 1. Install dependencies

```
cd backend
pip install -r requirements.txt
```

### 2. Run FastAPI server

```
python run.py
```

OR

```
uvicorn app.main:app --reload
```

---

## 🌐 API Endpoint

```
POST /predict
```

---

## 🧪 Sample Request

```json
{
  "subject": "Urgent: Verify your account",
  "body": "Your account has been suspended. Act now to avoid loss.",
  "url": "http://secure-login-bank.verify-user.com"
}
```

---

## 📊 Sample Response

```json
{
  "verdict": "PHISHING",
  "final_score": 0.76,
  "layer1": 0.59,
  "layer2": 0.99,
  "layer3": {
    "probability": 0.77,
    "manipulation_score": 0.61,
    "detected_signals": ["urgency", "fear", "pressure"]
  }
}
```

---

## 🔍 Features

### 🔹 Layer 1 – URL Analysis

* URL length, digits, special characters
* Suspicious keywords
* IP detection

---

### 🔹 Layer 2 – Content Analysis

* RoBERTa-based classification
* Context-aware detection

---

### 🔹 Layer 3 – Psychological Analysis

* Detects:

  * urgency
  * fear
  * authority
  * reward
  * pressure
  * implicit persuasion

* Outputs:

  * Manipulation Score
  * Explainable Signals

---

## ⚠️ Important Notes

* Models must be downloaded manually
* Backend is fully functional
* Frontend (App.jsx and package.json is provided, just create a new react-app and copy paste them in the respective files)

---

## 🚀 Future Improvements

* Real-time email scanning
* Browser extension
* Multi-platform detection (SMS, social media)
* Adaptive learning system

---

## ⭐ Final Note

PHISHUNTER is designed as an **explainable AI system**, combining technical detection with behavioral insights to improve cybersecurity awareness.
