from pymongo import MongoClient
import uuid
import os

class DiplomaModel:
    def __init__(self):
        self.client = MongoClient("mongodb://mongodb:27017/")
        self.db = self.client.instituto
        self.collection = self.db.diplomas

    def save_diploma(self, diploma_data):
        key = str(uuid.uuid3(uuid.NAMESPACE_DNS, f"{diploma_data['nome_aluno']}{diploma_data['curso']}"))
        path = os.path.join(os.getcwd(), f"diplomas/{key}.pdf")
        diploma_data['path'] = path
        self.collection.insert_one(diploma_data)
        return path

    def get_diploma_by_path(self, path):
        return self.collection.find_one({"path": path})
