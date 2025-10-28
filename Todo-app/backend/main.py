from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to frontend URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request validation
class TodoCreate(BaseModel):
    title: str
    completed: bool = False

class TodoUpdate(BaseModel):
    title: str
    completed: bool

# In-memory storage
todos = []
next_id = 1

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI Todo App!"}

@app.get("/todos")
def get_todos():
    return todos

@app.post("/todos")
def add_todo(todo: TodoCreate):
    global next_id
    new_todo = {
        "id": next_id,
        "title": todo.title,
        "completed": todo.completed
    }
    todos.append(new_todo)
    next_id += 1
    return new_todo

@app.put("/todos/{todo_id}")
def update_todo(todo_id: int, todo: TodoUpdate):
    for t in todos:
        if t["id"] == todo_id:
            t["title"] = todo.title
            t["completed"] = todo.completed
            return t
    raise HTTPException(status_code=404, detail="Todo not found")

@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    global todos
    for i, t in enumerate(todos):
        if t["id"] == todo_id:
            deleted = todos.pop(i)
            return {"message": "Todo deleted successfully", "deleted": deleted}
    raise HTTPException(status_code=404, detail="Todo not found")