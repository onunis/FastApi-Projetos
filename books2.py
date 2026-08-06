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


BOOKS = [
    Book(1, "Tudo e Rio", "Carla Madeira", "Um livro muito bom", 5),
    Book(2, "jujutsu kaisen", "Mangaka random", "Um livro muito bom", 5),
    Book(3, "A Natureza da Mordida", "Carla Madeira", "Um livro bom", 4),
    Book(4, "CS Pro", "Coding with Ruby", "Um livro muito bom", 3),
    Book(5, "HP2", "Author 1", "Um livro muito bom", 2),
    Book(6, "HP1", "Author 2", "Um livro muito bom", 1)
]

@app.get("/books")
async def real_all_books():
    return BOOKS