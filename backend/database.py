from pymongo import MongoClient
from config import Config


def get_database():
    # print('srv: ', Config.MONGO_URI)
    # Create a connection using MongoClient. You can import MongoClient or use pymongo.MongoClient
    client = MongoClient(
        "mongodb+srv://admin:j6L8T!*gkZx!39V@cluster0.0z1y8.mongodb.net/finance_tracker")
    db = client["finance_tracker"]
    return db


# # This is added so that many files can reuse the function get_database()
# if __name__ == "__main__":

#     # Get the database
#     db = get_database()
#     collection = db['users']
#     for item in collection.find():
#         print('item: ', item)
