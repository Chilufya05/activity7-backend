const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];

function parseId(value) {
  if (!/^[1-9][0-9]*$/.test(value)) return null;
  const id = Number(value);
  return id <= 2147483647 ? id : null;
}

function validateRecord(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const { title, category, description, status } = body;

  if (typeof title !== "string") {
    return { error: "Title is required and must be text." };
  }
  if (typeof category !== "string") {
    return { error: "Category is required and must be text." };
  }
  if (typeof description !== "string") {
    return { error: "Description is required and must be text." };
  }
  if (typeof status !== "string") {
    return { error: "Status is required and must be text." };
  }

  const value = {
    title: title.trim(),
    category: category.trim(),
    description: description.trim(),
    status: status.trim()
  };

  if (value.title.length < 3 || value.title.length > 80) {
    return { error: "Title must have 3 to 80 characters." };
  }
  if (value.category.length < 2 || value.category.length > 40) {
    return { error: "Category must have 2 to 40 characters." };
  }
  if (value.description.length < 5 || value.description.length > 300) {
    return { error: "Description must have 5 to 300 characters." };
  }
  if (!STATUSES.includes(value.status)) {
    return { error: "Status must be Pending, In progress or Completed." };
  }

  return { value };
}

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, category, description, status " +
      "FROM records ORDER BY id"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "Id must be a positive whole number." });
    }

    const result = await pool.query(
      "SELECT id, title, category, description, status " +
      "FROM records WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { error, value } = validateRecord(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const result = await pool.query(
      "INSERT INTO records (title, category, description, status) " +
      "VALUES ($1, $2, $3, $4) " +
      "RETURNING id, title, category, description, status",
      [value.title, value.category, value.description, value.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "Id must be a positive whole number." });
    }

    const { error, value } = validateRecord(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const result = await pool.query(
      "UPDATE records SET title = $1, category = $2, description = $3, status = $4 " +
      "WHERE id = $5 " +
      "RETURNING id, title, category, description, status",
      [value.title, value.category, value.description, value.status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "Id must be a positive whole number." });
    }

    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;