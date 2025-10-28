import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getTodos = () => API.get("/todos");
export const addTodo = (todo) => API.post("/todos", todo);
export const deleteTodo = (index) => API.delete(`/todos/${index}`);
