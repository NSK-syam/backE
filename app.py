from flask import Flask, jsonify, request
import sqlite3   # built into Python — no pip install needed!

app = Flask(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# WHAT IS A DATABASE?
# A database is a file that stores data permanently on disk.
# SQLite stores everything in a single file: products.db
# Think of it like an Excel spreadsheet but for code.
#
# TABLE = a spreadsheet tab
# ROW   = one record (one product)
# COLUMN = a field (id, name, price)
# ─────────────────────────────────────────────────────────────────────────────


def get_db():
    """Open a connection to the SQLite database file."""
    # sqlite3.connect() opens (or creates) the file products.db
    conn = sqlite3.connect("products.db")
    # row_factory makes rows return as dicts {id:1, name:"Laptop"}
    # instead of plain tuples (1, "Laptop")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the products table if it doesn't exist yet."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            name  TEXT    NOT NULL,
            price INTEGER NOT NULL
        )
    """)
    # Seed 3 products only if the table is empty
    count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    if count == 0:
        conn.execute("INSERT INTO products (name, price) VALUES ('Laptop',  999)")
        conn.execute("INSERT INTO products (name, price) VALUES ('Phone',   499)")
        conn.execute("INSERT INTO products (name, price) VALUES ('Monitor', 299)")
        conn.commit()
        print(">>> Database seeded with 3 products")
    conn.close()


# ─── Run init_db() once when the server starts ───────────────────────────────
init_db()


# ─── GET / → Home ────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({
        "message": "API is running with SQLite!",
        "routes": ["GET /products", "POST /products", "POST /login"]
    })


# ─── GET /products → READ all products from database ─────────────────────────
@app.route("/products", methods=["GET"])
def get_products():
    conn = get_db()
    # SQL: SELECT * FROM products means "give me all rows from products table"
    rows = conn.execute("SELECT * FROM products").fetchall()
    conn.close()

    # Convert rows to a list of plain dicts so jsonify can handle them
    products = [dict(row) for row in rows]
    print(f">>> Returning {len(products)} products from database")
    return jsonify(products)


# ─── POST /products → CREATE a new product in database ───────────────────────
@app.route("/products", methods=["POST"])
def create_product():
    data = request.json
    print(">>> Client sent us:", data)

    if not data or "name" not in data or "price" not in data:
        return jsonify({"error": "name and price are required"}), 400

    conn = get_db()
    # SQL INSERT: adds a new row to the products table
    cursor = conn.execute(
        "INSERT INTO products (name, price) VALUES (?, ?)",
        (data["name"], data["price"])   # ? prevents SQL injection attacks
    )
    conn.commit()   # save the change to disk (like Ctrl+S)

    # Get the new product back from the database
    new_product = dict(conn.execute(
        "SELECT * FROM products WHERE id = ?", (cursor.lastrowid,)
    ).fetchone())
    conn.close()

    print(">>> Created product:", new_product)
    return jsonify(new_product), 201


# ─── POST /login ──────────────────────────────────────────────────────────────
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    print(">>> Login attempt:", data)

    if data["username"] == "syam" and data["password"] == "1234":
        return jsonify({"success": True, "message": "Welcome back, Syam!"})
    else:
        return jsonify({"success": False, "error": "Wrong username or password"}), 401


if __name__ == "__main__":
    app.run(port=4260, debug=True)


