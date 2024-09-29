from pymongo import MongoClient
from config import Config


def get_database(MONGO_URI):
    # print('srv: ', Config.MONGO_URI)
    # Create a connection using MongoClient. You can import MongoClient or use pymongo.MongoClient
    client = MongoClient(MONGO_URI)
    db = client["finance_tracker"]
    return db


# # This is added so that many files can reuse the function get_database()
# if __name__ == "__main__":

#     # Get the database
#     db = get_database()
#     collection = db['users']
#     for item in collection.find():
#         print('item: ', item)
