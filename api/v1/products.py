from flask import Blueprint, jsonify, request
import sqlite3

# ─── CREATE THE BLUEPRINT ─────────────────────────────────────────────────────
# "products_v1" = internal name (used by Flask)
# url_prefix will be set when we register this in app.py → /api/v1
products_bp = Blueprint("products_v1", __name__)


# ─── HELPERS (copied from app.py so this file works independently) ────────────

def get_db():
    conn = sqlite3.connect("products.db")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def get_current_user():
    """Read JWT token from Authorization header and return user_id."""
    from flask import request
    import jwt
    JWT_SECRET = "my_super_secret_key_123"

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["user_id"]
    except Exception:
        return None


def validate_product(data):
    if not data:
        return "Request body is missing"
    if "name" not in data or len(str(data["name"]).strip()) == 0:
        return "Product name is required"
    if "price" not in data:
        return "Price is required"
    if not isinstance(data["price"], (int, float)) or data["price"] < 0:
        return "Price must be a positive number"
    return None


# ─── ROUTES ───────────────────────────────────────────────────────────────────
# Notice: @products_bp.route instead of @app.route
# The /api/v1 prefix is added automatically when registered in app.py

@products_bp.route("/products", methods=["GET"])
def get_products():
    conn = get_db()
    rows = conn.execute("SELECT * FROM products").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@products_bp.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Product not found"}), 404

    return jsonify(dict(row)), 200


@products_bp.route("/products", methods=["POST"])
def create_product():
    user_id = get_current_user()
    if not user_id:
        return jsonify({"error": "Login required"}), 401

    data = request.json
    error = validate_product(data)
    if error:
        return jsonify({"error": error}), 400

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


@products_bp.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    user_id = get_current_user()
    if not user_id:
        return jsonify({"error": "Login required"}), 401

    data = request.json
    error = validate_product(data)
    if error:
        return jsonify({"error": error}), 400

    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    if existing["user_id"] != user_id:
        conn.close()
        return jsonify({"error": "You can only edit your own products"}), 403

    conn.execute(
        "UPDATE products SET name = ?, price = ? WHERE id = ?",
        (data["name"], data["price"], product_id)
    )
    conn.commit()
    updated = dict(conn.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone())
    conn.close()
    return jsonify(updated), 200


@products_bp.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    user_id = get_current_user()
    if not user_id:
        return jsonify({"error": "Login required"}), 401

    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM products WHERE id = ?", (product_id,)
    ).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    if existing["user_id"] != user_id:
        conn.close()
        return jsonify({"error": "You can only delete your own products"}), 403

    conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": f"Product {product_id} deleted successfully"}), 200
