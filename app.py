from dotenv import load_dotenv
import os

load_dotenv()   # reads .env file and loads variables into the environment

from flask import Flask, jsonify, request
import psycopg2
from psycopg2 import errors
from psycopg2.extras import RealDictCursor
import bcrypt      # hashes passwords so they aren't stored as plain text
import jwt         # creates and verifies JWT tokens
import datetime    # for token expiry time

app = Flask(__name__)

# Secret is now loaded from .env — never hardcoded here
JWT_SECRET = os.getenv("JWT_SECRET", "fallback_only_for_dev")
# ─── Database setup ───────────────────────────────────────────────────────────

def get_db():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        conn = psycopg2.connect(database_url)
    else:
        conn = psycopg2.connect(
            dbname=os.getenv("PGDATABASE", "products_api_db"),
            user=os.getenv("PGUSER", os.getenv("USER")),
            password=os.getenv("PGPASSWORD", None),
            host=os.getenv("PGHOST", None),
            port=os.getenv("PGPORT", 5432),
        )
    return conn


def init_db():
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Users table — NEW
            # password_hash: we never store plain passwords, only the hashed version
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id            SERIAL PRIMARY KEY,
                    username      TEXT    NOT NULL UNIQUE,
                    email         TEXT    NOT NULL UNIQUE,
                    password_hash TEXT    NOT NULL
                )
            """)

            # Products table — user_id links each product to its owner
            cur.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id      SERIAL PRIMARY KEY,
                    name    TEXT    NOT NULL,
                    price   NUMERIC NOT NULL,
                    user_id INTEGER REFERENCES users(id)
                )
            """)

            # Index speeds up queries that filter products by owner.
            cur.execute("CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id)")

            # Seed products if empty
            cur.execute("SELECT COUNT(*) AS count FROM products")
            count = cur.fetchone()["count"]
            if count == 0:
                cur.execute("INSERT INTO products (name, price) VALUES (%s, %s)", ("Laptop", 999))
                cur.execute("INSERT INTO products (name, price) VALUES (%s, %s)", ("Phone", 499))
                cur.execute("INSERT INTO products (name, price) VALUES (%s, %s)", ("Monitor", 299))
        conn.commit()
    finally:
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
            "protected": ["GET /profile  (needs token)"],
            "health":    ["GET /health/live", "GET /health/ready"]
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
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
                (data["username"].strip(), data["email"].strip(), password_hash)
            )
        conn.commit()
    except errors.UniqueViolation:
        # UNIQUE constraint failed = username or email already exists
        conn.rollback()
        return jsonify({"error": "Username or email already taken"}), 409
    finally:
        conn.close()
    return jsonify({"message": f"User '{data['username']}' registered successfully!"}), 201


# ─── POST /login ──────────────────────────────────────────────────────────────
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "Username and password required"}), 400

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM users WHERE username = %s", (data["username"],))
            user = cur.fetchone()
    finally:
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
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
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
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, username, email FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
    finally:
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
    # Read optional query parameters from the URL
    name      = request.args.get("name")        # ?name=laptop
    min_price = request.args.get("min_price")   # ?min_price=100
    max_price = request.args.get("max_price")   # ?max_price=500

    # Pagination parameters (defaults: page 1, 3 items per page)
    try:
        page  = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 3))
    except ValueError:
        return jsonify({"error": "page and limit must be numbers"}), 400

    if page < 1 or limit < 1:
        return jsonify({"error": "page and limit must be greater than 0"}), 400

    offset = (page - 1) * limit   # page 1 → offset 0, page 2 → offset 3

    # Start with a base query and build filters dynamically
    query  = "SELECT * FROM products WHERE 1=1"
    params = []

    if name:
        query += " AND name ILIKE %s"
        params.append(f"%{name}%")   # LIKE %laptop% matches anywhere in the name

    if min_price:
        try:
            min_price = float(min_price)
        except ValueError:
            return jsonify({"error": "min_price must be a number"}), 400
        query += " AND price >= %s"
        params.append(min_price)

    if max_price:
        try:
            max_price = float(max_price)
        except ValueError:
            return jsonify({"error": "max_price must be a number"}), 400
        query += " AND price <= %s"
        params.append(max_price)

    # Add pagination at the end of the query
    query += " LIMIT %s OFFSET %s"
    params.extend([limit, offset])

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
    finally:
        conn.close()

    return jsonify({
        "page": page,
        "limit": limit,
        "products": [dict(r) for r in rows]
    })


@app.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            row = cur.fetchone()
    finally:
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
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO products (name, price, user_id) VALUES (%s, %s, %s) RETURNING *",
                (data["name"], data["price"], user_id)
            )
            new_product = cur.fetchone()
        conn.commit()
    finally:
        conn.close()
    return jsonify(dict(new_product)), 201


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
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 3. Does this product exist?
            cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            existing = cur.fetchone()
            if not existing:
                return jsonify({"error": "Product not found"}), 404

            # 4. Does this user OWN this product?
            if existing["user_id"] != user_id:
                return jsonify({"error": "You can only edit your own products"}), 403

            cur.execute(
                "UPDATE products SET name = %s, price = %s WHERE id = %s",
                (data["name"], data["price"], product_id)
            )
            cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            updated_product = cur.fetchone()
        conn.commit()
    finally:
        conn.close()

    return jsonify(dict(updated_product)), 200


@app.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    # 1. Who is making this request?
    user_id = get_current_user()
    if not user_id:
        return jsonify({"error": "Login required"}), 401

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 2. Does this product exist?
            cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            existing = cur.fetchone()
            if not existing:
                return jsonify({"error": "Product not found"}), 404

            # 3. Does this user OWN this product?
            if existing["user_id"] != user_id:
                return jsonify({"error": "You can only delete your own products"}), 403

            cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
        conn.commit()
    finally:
        conn.close()

    return jsonify({"message": f"Product {product_id} deleted successfully"}), 200


# ─── HEALTH CHECK ROUTES ──────────────────────────────────────────────────────

@app.route("/health/live")
def health_live():
    """
    Liveness check — is the server process alive?
    Always returns 200. If this fails, the server is completely dead.
    Used by tools like Docker/Kubernetes to decide: "should I restart this?"
    """
    return jsonify({"status": "alive"}), 200


@app.route("/health/ready")
def health_ready():
    """
    Readiness check — is the server ready to handle real traffic?
    Checks that the database is reachable with a lightweight SELECT 1.
    Returns 200 if everything is OK, 503 if the DB is down.
    Used by load balancers: "should I send traffic to this instance?"
    """
    conn = None
    try:
        conn = get_db()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")   # cheapest possible DB query — just proves connection works
        return jsonify({"status": "ready", "database": "ok"}), 200
    except Exception as e:
        # DB is down — tell the caller we're NOT ready to serve traffic
        return jsonify({"status": "not ready", "database": "unreachable", "error": str(e)}), 503
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 4260))   # Railway sets PORT automatically
    app.run(host='0.0.0.0', port=port, debug=True)


    
