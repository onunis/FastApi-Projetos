from fastapi import FastAPI

app = FastAPI()

class Book:
    id: int  #Type Hints
    title: str
    author: str
    description: str
    rating: int

    def __init__(self, id, title, author, description, rating):
        self.id = id
        self.title = title
        self.author = author
        self.description = description
        self.rating = rating


BOOKS = []

@app.get("/books")
async def real_all_books():
    return BOOKS