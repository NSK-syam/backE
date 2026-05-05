from flask import Flask, jsonify, request
import sqlite3
import bcrypt      # hashes passwords so they aren't stored as plain text
import jwt         # creates and verifies JWT tokens
import datetime    # for token expiry time

app = Flask(__name__)

# Secret key used to SIGN jwt tokens — in real apps this goes in a .env file
# If someone gets this, they can forge tokens → keep it secret always
JWT_SECRET = "my_super_secret_key_123"


# ─── Database setup ───────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect("products.db")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    # Products table — user_id links each product to its owner
    conn.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            name    TEXT    NOT NULL,
            price   INTEGER NOT NULL,
            user_id INTEGER REFERENCES users(id)
        )
    """)

    # Migration: add user_id column if it doesn't exist yet
    # (safe to run every time — ALTER TABLE fails silently if column exists)
    try:
        conn.execute("ALTER TABLE products ADD COLUMN user_id INTEGER REFERENCES users(id)")
        conn.commit()
    except Exception:
        pass  # column already exists — that's fine

    # Users table — NEW
    # password_hash: we never store plain passwords, only the hashed version
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    NOT NULL UNIQUE,
            email         TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL
        )
    """)

    # Seed products if empty
    count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    if count == 0:
        conn.execute("INSERT INTO products (name, price) VALUES ('Laptop',  999)")
        conn.execute("INSERT INTO products (name, price) VALUES ('Phone',   499)")
        conn.execute("INSERT INTO products (name, price) VALUES ('Monitor', 299)")
        conn.commit()

    conn.close()


init_db()


# ─── PART 1: VALIDATION HELPERS ───────────────────────────────────────────────
# These are plain Python functions — not routes
# They return an error message if invalid, or None if valid

def validate_register(data):
    """Check that all register fields are present and correct."""
    if not data:
        return "Request body is missing"
    if "username" not in data or len(data["username"].strip()) < 3:
        return "Username must be at least 3 characters"
    if "email" not in data or "@" not in data["email"]:
        return "Valid email is required"
    if "password" not in data or len(data["password"]) < 6:
        return "Password must be at least 6 characters"
    return None   # None = no error = everything is valid


def validate_product(data):
    """Check that product fields are present and correct."""
    if not data:
        return "Request body is missing"
    if "name" not in data or len(str(data["name"]).strip()) == 0:
        return "Product name is required"
    if "price" not in data:
        return "Price is required"
    if not isinstance(data["price"], (int, float)) or data["price"] < 0:
        return "Price must be a positive number"
    return None


# ─── PART 2: AUTH HELPER — verify JWT token from request ─────────────────────

def get_current_user():
    """
    Reads the Authorization header, verifies the JWT token,
    and returns the user's id. Returns None if invalid/missing.

    Client must send:  Authorization: Bearer <token>
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]   # get the part after "Bearer "
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        return None   # token expired
    except jwt.InvalidTokenError:
        return None   # token is fake/invalid


# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return jsonify({
        "message": "API running!",
        "routes": {
            "auth":     ["POST /register", "POST /login"],
            "products": [
                "GET /products",
                "GET /products/<id>",
                "POST /products",
                "PUT /products/<id>",
                "DELETE /products/<id>"
            ],
            "protected":["GET /profile  (needs token)"]
        }
    })


# ─── POST /register ───────────────────────────────────────────────────────────
@app.route("/register", methods=["POST"])
def register():
    data = request.json

    # PART 1: Validate first — never trust what the client sends
    error = validate_register(data)
    if error:
        return jsonify({"error": error}), 400

    # PART 2: Hash the password — NEVER store plain text passwords
    # bcrypt.hashpw turns "mypassword" → "$2b$12$aX9kL..." (unreadable hash)
    password_hash = bcrypt.hashpw(
        data["password"].encode("utf-8"),   # encode string → bytes
        bcrypt.gensalt()                    # random salt makes every hash unique
    ).decode("utf-8")                       # store as string in DB

    print(f">>> Registering user: {data['username']}")
    print(f">>> Password hash:    {password_hash}")  # see how it looks!

    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (data["username"].strip(), data["email"].strip(), password_hash)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        # UNIQUE constraint failed = username or email already exists
        conn.close()
        return jsonify({"error": "Username or email already taken"}), 409

    conn.close()
    return jsonify({"message": f"User '{data['username']}' registered successfully!"}), 201


# ─── POST /login ──────────────────────────────────────────────────────────────
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "Username and password required"}), 400

    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE username = ?", (data["username"],)
    ).fetchone()
    conn.close()

    # Check 1: does this user exist?
    if not user:
        return jsonify({"error": "Invalid username or password"}), 401

    # Check 2: does the password match the stored hash?
    # bcrypt.checkpw compares plain password with stored hash safely
    password_matches = bcrypt.checkpw(
        data["password"].encode("utf-8"),
        user["password_hash"].encode("utf-8")
    )
    if not password_matches:
        return jsonify({"error": "Invalid username or password"}), 401

    # PART 3: Create a JWT token
    token_payload = {
        "user_id": user["id"],
        "username": user["username"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        # exp = expiry — token dies after 24 hours
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm="HS256")

    print(f">>> Login success for: {user['username']}")
    print(f">>> Token issued:      {token[:30]}...")   # show first 30 chars

    return jsonify({
        "message": f"Welcome back, {user['username']}!",
        "token": token   # client saves this and sends it on every future request
    })


# ─── GET /profile → PROTECTED ROUTE (requires valid JWT) ─────────────────────
@app.route("/profile", methods=["GET"])
def profile():
    # Check the token first — if invalid, reject immediately
    user_id = get_current_user()
    if not user_id:
        # 401 = not authenticated
        return jsonify({"error": "Missing or invalid token. Please login."}), 401

    # Token is valid — fetch user from DB
    conn = get_db()
    user = conn.execute(
        "SELECT id, username, email FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()

    return jsonify({
        "id":       user["id"],
        "username": user["username"],
        "email":    user["email"],
        "message":  "This is your private profile!"
    })


# ─── Products (same as before) ────────────────────────────────────────────────

@app.route("/products", methods=["GET"])
def get_products():
    conn = get_db()
    rows = conn.execute("SELECT * FROM products").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Product not found"}), 404

    return jsonify(dict(row)), 200


@app.route("/products", methods=["POST"])
def create_product():
    # 1. Who is making this request?
    user_id = get_current_user()
    if not user_id:
        return jsonify({"error": "Login required"}), 401

    data = request.json

    # 2. Validate the product fields
    error = validate_product(data)
    if error:
        return jsonify({"error": error}), 400

    # 3. Save product WITH the owner's user_id
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO products (name, price, user_id) VALUES (?, ?, ?)",
        (data["name"], data["price"], user_id)
    )
    conn.commit()
    new_product = dict(conn.execute(
        "SELECT * FROM products WHERE id = ?", (cursor.lastrowid,)
    ).fetchone())
    conn.close()
    return jsonify(new_product), 201


@app.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    # 1. Who is making this request?
    user_id = get_current_user()
    if not user_id:
        return jsonify({"error": "Login required"}), 401

    data = request.json

    # 2. Validate fields
    error = validate_product(data)
    if error:
        return jsonify({"error": error}), 400

    conn = get_db()

    # 3. Does this product exist?
    existing = conn.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    # 4. Does this user OWN this product?
    if existing["user_id"] != user_id:
        conn.close()
        return jsonify({"error": "You can only edit your own products"}), 403

    conn.execute(
        "UPDATE products SET name = ?, price = ? WHERE id = ?",
        (data["name"], data["price"], product_id)
    )
    conn.commit()

    updated_product = dict(conn.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone())
    conn.close()

    return jsonify(updated_product), 200


@app.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    # 1. Who is making this request?
    user_id = get_current_user()
    if not user_id:
        return jsonify({"error": "Login required"}), 401

    conn = get_db()

    # 2. Does this product exist?
    existing = conn.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    # 3. Does this user OWN this product?
    if existing["user_id"] != user_id:
        conn.close()
        return jsonify({"error": "You can only delete your own products"}), 403

    conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Product {product_id} deleted successfully"}), 200


if __name__ == "__main__":
    app.run(port=4260, debug=True)
