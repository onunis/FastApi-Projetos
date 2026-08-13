from fastapi import Body, FastAPI

app = FastAPI() #iniciando a aplicacao

BOOKS = [
    {'Title':'Title One', 'Author':'Author One','Category': 'Horror'},
    {'Title':'Title Two', 'Author':'Author Two','Category': 'Adventure'},
    {'Title':'Title Three', 'Author':'Author Three','Category': 'Horror'},
    {'Title':'Title Four', 'Author':'Author Four','Category': 'Science'},
    {'Title':'Title Five', 'Author':'Author Five','Category': 'History'},
    {'Title':'Title Six', 'Author':'Author Two','Category': 'Math'},
]


@app.get("/books") #caminho raiz (onde inicia)
async def read_all_books():
    return BOOKS


@app.get("/books/{book_title}")
async def read_book(book_title: str):
    for book in BOOKS:
        if book.get("Title").casefold() == book_title.casefold():
            return book
    return {"error": "book not found"}


@app.get("/books/")
async def read_category_by_query(category: str):
    books_to_return = []
    for book in BOOKS:
        if book.get('Category').casefold() == category.casefold():
            books_to_return.append(book)

    return books_to_return


@app.get("/books/{book_author}/")
async def read_author_category_by_query(book_author: str, category: str):
    books_to_return = []
    for book in BOOKS:
        if book.get('Author').casefold() == book_author.casefold() and book.get('Category').casefold() == category.casefold():
            books_to_return.append(book)

    return books_to_return


@app.post("/books/create_book")
async def create_book(new_book=Body()):
    BOOKS.append(new_book)


@app.put("/books/update_book")
async def update_book(update_book=Body()):
    for i in range(len(BOOKS)):
        if BOOKS[i].get("Title").casefold() == update_book.get("Title").casefold():
            BOOKS[i] = update_book


@app.delete("/books/delete_book/{book_title}")
async def delete_book(book_title: str):
    for i in range(len(BOOKS)):
        if BOOKS[i].get("Title").casefold() == book_title.casefold():
            BOOKS.pop(i)
            break

@app.get("/books/byauthor/{books_author}")
async def get_books_from_author(books_author:str):
    books_from_author = []
    for i in range(len(BOOKS)):
        if BOOKS[i].get("Author").casefold() == books_author.casefold():
            books_from_author.append(BOOKS[i])
            
    return books_from_author
