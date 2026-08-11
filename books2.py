from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional

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


class BookRequest(BaseModel):
    id: Optional[int] = None
    title: str = Field(min_length=3)
    author: str = Field(min_length=1)
    description: str = Field(min_length=1, max_length=100)
    rating: int = Field(gt=0, lt=6)

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


@app.get("/books/{book_id}")
async def book_id(book_id: int):
    for book in BOOKS:
        if book.id == book_id:
            return book
        

@app.get("/books/")
async def books_by_rating(book_rating: int):
    books_to_return = []
    for book in BOOKS:
        if book.rating == book_rating:
            books_to_return.append(book)

    return books_to_return


@app.post("/create-book")
async def create_book(book_request: BookRequest):
    new_book = Book(**book_request.model_dump())
    BOOKS.append(find_book_id(new_book))


def find_book_id(book: Book):
    book.id = 1 if len(BOOKS) == 0 else BOOKS[-1].id + 1

    # if len(BOOKS) > 0:
    #     book.id = BOOKS[-1].id + 1
    # else:
    #     book.id = 1
    return book


@app.put("/books/update_book")
async def update_book(book: BookRequest):
    for i in range(len(BOOKS)):
        if BOOKS[i].id == book.id:
            BOOKS[i] = book


@app.delete("/books/{book_id}")
async def delete_book(book_id: int):
    for i in range(len(BOOKS)):
        if BOOKS[i].id == book_id:
            BOOKS.pop(i)
            break

