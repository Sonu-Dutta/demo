/*
https://azure.microsoft.com/en-in/free/search/?&ef_id=Cj0KCQjwiZqhBhCJARIsACHHEH-wBVSsLLkGiMfqMhQgftL000YMqN8dTjYOTgwxyQMtoCeN4YZMcAoaAoUdEALw_wcB:G:s&OCID=AIDcmmf1elj9v5_SEM_Cj0KCQjwiZqhBhCJARIsACHHEH-wBVSsLLkGiMfqMhQgftL000YMqN8dTjYOTgwxyQMtoCeN4YZMcAoaAoUdEALw_wcB:G:s&gclid=Cj0KCQjwiZqhBhCJARIsACHHEH-wBVSsLLkGiMfqMhQgftL000YMqN8dTjYOTgwxyQMtoCeN4YZMcAoaAoUdEALw_wcB


*/


const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(
  cors({
    origin: "http://127.0.0.1:5500",
  })
);

let list = [
  { empId: "12", name: "Sonu", place: "Pune", phone: "9665593338" },
  { empId: "22", name: "Vaishakhi", place: "Mumbai", phone: "9125593338" },
];

app.use(express.json());

app.get("/list", (req, res) => {
  res.send(list);
});

app.post("/list", (req, res) => {
  lst = req.body;
  list.push(lst);
  res.send("List updated");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
