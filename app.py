from flask import Flask, jsonify, request

# "request" is a special Flask object that holds everything
# the client sent us: body, headers, URL args, etc.

app = Flask(__name__)

# ─── In-memory "database" (just a Python list for now) ───────────────────────
# Real apps use an actual database. We'll get there.
products = [
    {"id": 1, "name": "Laptop",  "price": 999},
    {"id": 2, "name": "Phone",   "price": 499},
    {"id": 3, "name": "Monitor", "price": 299},
]


# ─── GET / → Home — just confirms the API is alive ───────────────────────────
@app.route("/")
def home():
    return jsonify({
        "message": "API is running!",
        "routes": ["GET /products", "POST /products", "POST /login"]
    })

# ─── GET /products → READ: return all products ───────────────────────────────
# HTTP method: GET  (just fetching data, not changing anything)
@app.route("/products", methods=["GET"])
def get_products():
    return jsonify(products)


# ─── POST /products → CREATE: add a new product ──────────────────────────────
# HTTP method: POST  (client is SENDING us data to create something)
@app.route("/products", methods=["POST"])
def create_product():
    # request.json reads the JSON body the client sent
    # Example body the client sends:
    # { "name": "Keyboard", "price": 149 }
    data = request.json

    print(">>> Client sent us:", data)

    # Basic validation — did they send us the required fields?
    if not data or "name" not in data or "price" not in data:
        # 400 = Bad Request (client sent wrong/missing data)
        return jsonify({"error": "name and price are required"}), 400

    # Build the new product
    new_product = {
        "id": len(products) + 1,   # auto-increment id
        "name": data["name"],
        "price": data["price"]
    }

    products.append(new_product)   # add to our "database"

    print(">>> New product created:", new_product)
    print(">>> Total products now:", len(products))

    # 201 = Created (standard status code for successful POST)
    return jsonify(new_product), 201


# ─── POST /login → authenticate a user ───────────────────────────────────────
# Another common use of POST — sending credentials
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    print(">>> Login attempt:", data)

    # Hardcoded user for now (real apps check a database)
    if data["username"] == "syam" and data["password"] == "1234":
        return jsonify({"success": True, "message": "Welcome back, Syam!"})
    else:
        # 401 = Unauthorized (wrong credentials)
        return jsonify({"success": False, "error": "Wrong username or password"}), 401


if __name__ == "__main__":
    app.run(port=4260, debug=True)

