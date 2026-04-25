from pymongo import MongoClient

MONGO_URL = "mongodb+srv://user:priyan2005@cluster0.n4n3b7f.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URL)

db = client["phishunter"]
collection = db["scans"]