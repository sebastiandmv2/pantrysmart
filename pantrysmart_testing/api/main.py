from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

def db():
    conn = sqlite3.connect("app.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = db(); c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL
    )""")
    conn.commit(); conn.close()

init_db()

class LoginReq(BaseModel):
    username: str

class UserOut(BaseModel):
    id: int
    username: str

@app.post("/login", response_model=UserOut)
def login(body: LoginReq):
    conn = db(); c = conn.cursor()
    c.execute("SELECT id, username FROM users WHERE username=?", (body.username,))
    row = c.fetchone()
    if not row:
        c.execute("INSERT INTO users(username) VALUES(?)", (body.username,))
        conn.commit()
        uid = c.lastrowid
        conn.close()
        return {"id": uid, "username": body.username}
    conn.close()
    return {"id": row["id"], "username": row["username"]}
