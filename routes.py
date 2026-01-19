import os 
import uuid
from flask import Flask, Blueprint, render_template, request, redirect, url_for, session, flash, jsonify, send_from_directory, current_app, get_flashed_messages
from flask_cors import CORS
from flask_mysqldb import MySQL
from werkzeug.utils import secure_filename
import hashlib

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 1 * 1024 * 1024

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['localhost'])

main = Blueprint("main", __name__)
api = Blueprint("api", __name__, url_prefix="/api") 
mysql = MySQL()

@main.route("/")
def index():
    if "user" in session:
        return redirect(url_for("main.dashboard"))
    return render_template("index.html")

@main.route("/register", methods=["GET", "POST"])
def register():
    if "user" in session:
        return redirect(url_for("main.dashboard"))
    if request.method == "POST":
        name = request.form.get("name")
        account_number = request.form.get("account_number")
        transaction_pin = request.form.get("transaction_pin") 
        email = request.form.get("email")
        password = request.form.get("password")             

        password_hash = hashlib.sha256(password.encode()).hexdigest()

        try:
            cursor = mysql.connection.cursor()
            cursor.execute(
                "SELECT email, account_number FROM users WHERE email = %s OR account_number = %s",
                (email, account_number)
            )
            existing_user = cursor.fetchone()

            if existing_user:
                existing_email, existing_acc = existing_user
                
                if existing_email == email:
                    flash("Registration failed: This email address is already registered.", "danger")
                elif existing_acc == account_number:
                    flash("Registration failed: An account with this Account Number already exists.", "danger")
                
                cursor.close()
                return redirect(url_for("main.register"))

            cursor.execute( """
                INSERT INTO users (name, account_number, transaction_pin, email, password_hash, balance)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (name, account_number, transaction_pin, email, password_hash, 0.00))

            mysql.connection.commit()
            cursor.close()

            session["user"] = email
            flash("Registration successful! Redirecting to dashboard...", "success")
            return redirect(url_for("main.dashboard"))

        except Exception as e:
            flash(f"An unexpected error occurred during registration: {str(e)}", "danger")
            return redirect(url_for("main.register"))

    return render_template("register.html")

@main.route("/login", methods=["GET", "POST"])
def login():
    if "user" in session:
        return redirect(url_for("main.dashboard"))
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        cursor = mysql.connection.cursor()
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        cursor.execute("SELECT * FROM users WHERE email = %s AND password_hash = %s", (email, password_hash))

        user = cursor.fetchone()
        cursor.close()

        if user:
            if '_flashes' in session:
                session.pop('_flashes', None)

            session["user"] = email  
            flash("Login successful!", "success")
            return redirect(url_for("main.dashboard"))
        else:
            flash("Invalid credentials. Please try again.", "danger")
            return render_template("login.html", error_email=email) 
            
    return render_template("login.html", error_email="")

@main.route("/dashboard")
def dashboard():
    if "user" not in session:
        flash("Please log in first!", "warning")
        return redirect(url_for("main.login"))

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT name, balance FROM users WHERE email = %s", (session["user"],))
    user_data = cursor.fetchone()
    cursor.close()

    if not user_data:
        flash("User not found!", "danger")
        return redirect(url_for("main.logout"))

    return render_template("dashboard.html", name=user_data[0], balance=user_data[1])

@main.route("/deposit", methods=["GET", "POST"])
def deposit():
    if "user" not in session:
        flash("Please log in first!", "warning")
        return redirect(url_for("main.login"))

    if request.method == "POST":
        try:
            amount = float(request.form.get("amount"))
            
            if amount <= 0:
                flash("Invalid deposit amount. Must be greater than $0.", "danger")

                return render_template("deposit.html") 
            
            MAX_DEPOSIT_LIMIT = 100000 
            if amount > MAX_DEPOSIT_LIMIT:
                flash(f"Deposit amount exceeds the maximum limit of ${MAX_DEPOSIT_LIMIT:,.0f}!", "danger")
                return render_template("deposit.html")

            cursor = mysql.connection.cursor()
            cursor.execute("UPDATE users SET balance = balance + %s WHERE email = %s", (amount, session["user"]))

            cursor.execute("SELECT account_number FROM users WHERE email = %s", (session["user"],))
            account_number = cursor.fetchone()[0]

            cursor.execute("""
                INSERT INTO transactions (account_number, amount, type)
                VALUES (%s, %s, 'deposit')
            """, (account_number, amount))

            mysql.connection.commit()
            cursor.close()

            flash(f"Successfully deposited ${amount:.2f}!", "success")

            return redirect(url_for("main.dashboard"))

        except Exception as e:
            flash(f"Error processing deposit: {str(e)}", "danger")
            return render_template("deposit.html")

    return render_template("deposit.html")

@main.route("/transactions", methods=["GET", "POST"])
def transactions():
    if "user" not in session:
        flash("Please log in first!", "warning")
        return redirect(url_for("main.login"))

    cursor = mysql.connection.cursor()
    
    cursor.execute("SELECT account_number, transaction_pin FROM users WHERE email = %s", (session["user"],))
    result = cursor.fetchone()

    transactions = []
    account_number = None

    if result:
        account_number = result[0] 
        stored_pin = result[1]      
        session['user_account_number'] = account_number
        
        if request.method == "POST":
            recipient_account = request.form.get("account_number")
            amount_str = request.form.get("amount") 
            entered_pin = request.form.get("transaction_pin")  

            def render_error(msg, category="danger"):
                flash(msg, category)
                
                cursor.execute("""
                    SELECT * FROM transactions 
                    WHERE account_number = %s OR recipient_account = %s
                    ORDER BY created_at DESC
                """, (account_number, account_number))
                transactions = cursor.fetchall()
                
                return render_template("transactions.html", transactions=transactions, user_account=account_number)

            if not recipient_account or not amount_str or not entered_pin:
                return render_error("Please fill in all fields.")

            try:
                amount = float(amount_str)
                if amount <= 0:
                    return render_error("Amount must be greater than zero.")
            except ValueError:
                return render_error("Invalid amount entered.")

            if recipient_account == account_number:
                return render_error("You cannot transfer money to your own account.")

            cursor.execute("SELECT * FROM users WHERE account_number = %s", (recipient_account,))
            recipient = cursor.fetchone()
            if not recipient:
                return render_error("Recipient account not found.")

            if entered_pin != stored_pin:
                return render_error("Invalid transaction PIN!")

            cursor.execute("SELECT balance FROM users WHERE account_number = %s", (account_number,))
            sender_balance = cursor.fetchone()[0]
            if sender_balance < amount:
                return render_error("Insufficient balance.")

            try:
                cursor.execute("UPDATE users SET balance = balance - %s WHERE account_number = %s", (amount, account_number))
                cursor.execute("UPDATE users SET balance = balance + %s WHERE account_number = %s", (amount, recipient_account))

                cursor.execute(
                    "INSERT INTO transactions (account_number, recipient_account, amount, type) VALUES (%s, %s, %s, %s)",
                    (account_number, recipient_account, amount, 'transfer'),
                )
                mysql.connection.commit()
                flash("Transaction successful!", "success")
                
                return redirect(url_for("main.transactions"))
                
            except Exception as e:
                mysql.connection.rollback() 
                return render_error(f"A database error occurred: {str(e)}")

    if account_number:
        cursor.execute("""
            SELECT id, account_number, recipient_account, amount, type, created_at, recipient_account
            FROM transactions 
            WHERE account_number = %s OR recipient_account = %s
            ORDER BY created_at DESC
        """, (account_number, account_number))
        transactions = cursor.fetchall()

    cursor.close()

    return render_template("transactions.html", transactions=transactions, user_account=account_number)


@main.route("/balance")
def balance():
    if "user" not in session:
        flash("Please log in first!", "warning")
        return redirect(url_for("main.login"))

    cursor = mysql.connection.cursor()

    cursor.execute("SELECT account_number, balance FROM users WHERE email = %s", (session["user"],))
    result = cursor.fetchone()

    if not result:
        flash("User not found!", "danger")
        return redirect(url_for("main.logout"))

    account_number, balance = result

    cursor.execute("""
        SELECT amount, created_at 
        FROM transactions 
        WHERE account_number = %s OR recipient_account = %s 
        ORDER BY created_at DESC 
        LIMIT 5
    """, (account_number, account_number))
    transactions = cursor.fetchall()

    cursor.execute("""
        SELECT 
            SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) AS total_deposit,
            SUM(CASE WHEN type = 'withdrawal' OR type = 'transfer' THEN ABS(amount) ELSE 0 END) AS total_withdrawal
        FROM transactions
        WHERE account_number = %s
    """, (account_number,))


    totals = cursor.fetchone()
    total_deposit = totals[0] or 0
    total_withdrawal = totals[1] or 0

    total_money = total_deposit + total_withdrawal
    spent_percent = round((total_withdrawal / total_money) * 100, 2) if total_money > 0 else 0
    saved_percent = 100 - spent_percent if total_money > 0 else 0

    cursor.close()

    return render_template(
        "balance.html",
        balance=balance,
        transactions=transactions,
        total_deposit=total_deposit,
        total_withdrawal=total_withdrawal,
        spent_percent=spent_percent,
        saved_percent=saved_percent
    )

@main.route("/profile")
def profile():
    if "user" not in session:
        flash("Please log in first!", "warning")
        return redirect(url_for("main.login"))

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT name, email, account_number, balance FROM users WHERE email = %s", (session["user"],))
    user_data = cursor.fetchone()   
    cursor.close()

    return render_template("profile.html", user=user_data)

@main.route("/logout")
def logout():
    session.pop("user", None)
    flash("You have been logged out.", "info")
    return redirect(url_for("main.index"))

@main.route("/delete_account", methods=["POST"])
def delete_account():
    if "user" not in session:
        flash("Please log in first!", "warning")
        return redirect(url_for("main.login"))

    cursor = mysql.connection.cursor()

    cursor.execute("SELECT account_number FROM users WHERE email = %s", (session["user"],))
    result = cursor.fetchone()

    if result:
        account_number = result[0]

        cursor.execute("""
            DELETE FROM transactions 
            WHERE account_number = %s OR recipient_account = %s
        """, (account_number, account_number))

        cursor.execute("DELETE FROM users WHERE email = %s", (session["user"],))

        mysql.connection.commit()

        cursor.close()
        session.pop("user", None)
        flash("Your account has been deleted permanently.", "info")
        return redirect(url_for("main.index"))

    cursor.close()
    flash("User not found.", "danger")
    return redirect(url_for("main.profile"))

#------------------------------------------------------------------------------
@api.route("/flash", methods=["GET"])
def api_get_flash_messages():
    """Returns a list of flashed messages and clears them from the session."""
    flashes = get_flashed_messages(with_categories=True)
    
    formatted_messages = []
    for category, message in flashes:
        formatted_messages.append({"message": message, "type": category})
        
    return jsonify({"success": True, "messages": formatted_messages}), 200


@api.route("/login", methods=["POST"])
def api_login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        flash("Email and password are required.", "danger")
        return jsonify({"success": False}), 400

    cursor = mysql.connection.cursor()
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    cursor.execute("SELECT id, name, email FROM users WHERE email = %s AND password_hash = %s",
                   (email, password_hash))
    user = cursor.fetchone()
    cursor.close()

    if user:
        session["user"] = email
        flash("Login successful!", "success")
        return jsonify({
            "success": True,
            "user": {
                "id": user[0],
                "name": user[1],
                "email": user[2]
            }
        }), 200
    else:
        flash("Invalid credentials.", "danger")
        return jsonify({"success": False}), 401


@api.route("/register", methods=["POST"])
def api_register():
    data = request.get_json()
    name = data.get("name")
    account_number = data.get("account_number")
    transaction_pin = data.get("transaction_pin")
    email = data.get("email")
    password = data.get("password")

    if not all([name, account_number, transaction_pin, email, password]):
        flash("All fields are required.", "danger")
        return jsonify({"success": False}), 400

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    try:
        cursor = mysql.connection.cursor()
        cursor.execute(
            "SELECT email, account_number FROM users WHERE email = %s OR account_number = %s",
            (email, account_number)
        )
        existing_user = cursor.fetchone()

        if existing_user:
            existing_email, existing_acc = existing_user
            if existing_email == email:
                flash("This email address is already registered.", "danger")
            elif existing_acc == account_number:
                flash("An account with this Account Number already exists.", "danger")
            
            cursor.close()
            return jsonify({"success": False}), 409

        cursor.execute( """
            INSERT INTO users (name, account_number, transaction_pin, email, password_hash, balance)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (name, account_number, transaction_pin, email, password_hash, 0.00))

        mysql.connection.commit()
        cursor.close()

        session["user"] = email
        flash("Registration successful!", "success")
        return jsonify({"success": True}), 201

    except Exception as e:
        flash(f"An unexpected error occurred during registration: {str(e)}", "danger")
        return jsonify({"success": False}), 500


@api.route("/dashboard", methods=["GET"])
def api_dashboard():
    # ... (GET method, no flash needed) ...
    if "user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT name, balance FROM users WHERE email = %s", (session["user"],))
    user_data = cursor.fetchone()
    cursor.close()

    if not user_data:
        return jsonify({"success": False, "message": "User not found"}), 404

    return jsonify({
        "success": True,
        "name": user_data[0],
        "balance": float(user_data[1]) 
    }), 200


@api.route("/deposit", methods=["POST"])
def api_deposit():
    if "user" not in session:
        flash("Unauthorized access.", "danger")
        return jsonify({"success": False}), 401

    data = request.get_json()
    amount = data.get("amount")

    if not amount:
        flash("Amount is required.", "danger")
        return jsonify({"success": False}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            flash("Amount must be greater than $0.", "danger")
            return jsonify({"success": False}), 400
        
        MAX_DEPOSIT_LIMIT = 100000
        if amount > MAX_DEPOSIT_LIMIT:
            flash(f"Limit exceeded. Max: ${MAX_DEPOSIT_LIMIT:,.0f}", "danger")
            return jsonify({"success": False}), 400

        cursor = mysql.connection.cursor()
        
        cursor.execute("UPDATE users SET balance = balance + %s WHERE email = %s", (amount, session["user"]))
        cursor.execute("SELECT account_number FROM users WHERE email = %s", (session["user"],))
        account_number = cursor.fetchone()[0]

        cursor.execute("""
            INSERT INTO transactions (account_number, amount, type)
            VALUES (%s, %s, 'deposit')
        """, (account_number, amount))

        mysql.connection.commit()
        cursor.close()

        flash(f"Successfully deposited ${amount:.2f}!", "success")
        return jsonify({"success": True}), 200

    except ValueError:
        flash("Invalid amount format.", "danger")
        return jsonify({"success": False}), 400
    except Exception as e:
        flash(f"Error processing deposit: {str(e)}", "danger")
        return jsonify({"success": False}), 500


@api.route("/transactions", methods=["GET", "POST"])
def api_transactions():
    if "user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    cursor = mysql.connection.cursor()

    cursor.execute("SELECT account_number, transaction_pin FROM users WHERE email = %s", (session["user"],))
    user_data = cursor.fetchone()
    
    if not user_data:
        flash("User not found.", "danger")
        return jsonify({"success": False}), 404

    account_number = user_data[0]
    stored_pin = user_data[1]

    # --- HANDLE TRANSFER (POST) ---
    if request.method == "POST":
        data = request.get_json()
        recipient_account = data.get("recipient_account")
        amount_str = data.get("amount")
        entered_pin = data.get("transaction_pin")

        if not all([recipient_account, amount_str, entered_pin]):
            flash("All fields are required.", "danger")
            return jsonify({"success": False}), 400

        if recipient_account == account_number:
            flash("Cannot transfer to yourself.", "danger")
            return jsonify({"success": False}), 400
        
        if entered_pin != stored_pin:
            flash("Invalid transaction PIN!", "danger")
            return jsonify({"success": False}), 403


        try:
            amount = float(amount_str)
            if amount <= 0:
                flash("Amount must be positive.", "danger")
                return jsonify({"success": False}), 400
            
            # Check Sender Balance
            cursor.execute("SELECT balance FROM users WHERE account_number = %s", (account_number,))
            sender_balance = cursor.fetchone()[0]

            if sender_balance < amount:
                flash("Insufficient balance.", "danger")
                return jsonify({"success": False}), 400

            # Check Recipient Existence
            cursor.execute("SELECT * FROM users WHERE account_number = %s", (recipient_account,))
            if not cursor.fetchone():
                flash("Recipient account not found.", "danger")
                return jsonify({"success": False}), 404
            cursor.execute("UPDATE users SET balance = balance - %s WHERE account_number = %s", (amount, account_number))
            cursor.execute("UPDATE users SET balance = balance + %s WHERE account_number = %s", (amount, recipient_account))
            
            cursor.execute("""
                INSERT INTO transactions (account_number, recipient_account, amount, type) 
                VALUES (%s, %s, %s, 'transfer')
            """, (account_number, recipient_account, amount))
            
            mysql.connection.commit()
            cursor.close()
            
            flash("Transaction successful!", "success")
            return jsonify({"success": True}), 200

        except ValueError:
            flash("Invalid amount.", "danger")
            return jsonify({"success": False}), 400
        except Exception as e:
            mysql.connection.rollback()
            flash(f"A database error occurred: {str(e)}", "danger")
            return jsonify({"success": False}), 500

    # --- HANDLE HISTORY (GET) ---
    cursor.execute("""
        SELECT account_number, recipient_account, amount, type, created_at, id
        FROM transactions 
        WHERE account_number = %s OR recipient_account = %s
        ORDER BY created_at DESC
    """, (account_number, account_number))
    
    rows = cursor.fetchall()
    cursor.close()

    history = []
    for row in rows:
        history.append({
            "account_number": row[0],
            "recipient_account": row[1],
            "amount": float(row[2]),
            "type": row[3],
            "date": str(row[4]),
            "id": row[5]
        })

    return jsonify({"success": True, "transactions": history, "my_account": account_number}), 200

@api.route("/recipient_name", methods=["GET"])
def api_recipient_name():
    if "user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    account_number = request.args.get("account_number")
    if not account_number:
        return jsonify({"success": False, "message": "Account number is required"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT name FROM users WHERE account_number = %s", (account_number,))
    result = cursor.fetchone()
    cursor.close()

    if result:
        return jsonify({"success": True, "name": result[0]}), 200
    else:
        return jsonify({"success": False, "message": "Account not found"}), 404


@api.route("/balance", methods=["GET"])
def api_balance_stats():
    if "user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT account_number, balance FROM users WHERE email = %s", (session["user"],))
    user_data = cursor.fetchone()

    if not user_data:
        return jsonify({"success": False, "message": "User not found"}), 404

    account_number = user_data[0]
    balance = float(user_data[1])

    # Calculate Totals
    cursor.execute("""
        SELECT 
            SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) AS total_deposit,
            SUM(CASE WHEN type = 'withdrawal' OR type = 'transfer' THEN ABS(amount) ELSE 0 END) AS total_withdrawal
        FROM transactions
        WHERE account_number = %s
    """, (account_number,))
    
    totals = cursor.fetchone()
    total_deposit = float(totals[0] or 0)
    total_withdrawal = float(totals[1] or 0)

    total_money = total_deposit + total_withdrawal
    spent_percent = round((total_withdrawal / total_money) * 100, 2) if total_money > 0 else 0
    saved_percent = 100 - spent_percent if total_money > 0 else 0
    
    cursor.close()

    return jsonify({
        "success": True,
        "balance": balance,
        "total_deposit": total_deposit,
        "total_withdrawal": total_withdrawal,
        "spent_percent": spent_percent,
        "saved_percent": saved_percent
    }), 200


@api.route("/profile", methods=["GET"])
def api_profile():
    if "user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    cursor = mysql.connection.cursor()
    cursor.execute(
        "SELECT name, email, account_number, balance, profile_pic_url FROM users WHERE email = %s",
        (session["user"],),
    )
    row = cursor.fetchone()
    cursor.close()

    if not row:
        return jsonify({"success": False, "message": "User not found"}), 404

    name, email, account_number, balance, profile_pic_url = row
    return (
        jsonify(
            {
                "success": True,
                "user": {
                    "name": name,
                    "email": email,
                    "account_number": account_number,
                    "balance": float(balance),
                    "profile_pic_url": profile_pic_url or "/default-profile.png",
                },
            }
        ),
        200,
    )

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@api.route("/upload_profile_picture", methods=["POST"])
def api_upload_profile_picture():
    if "user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    if "profile_picture" not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400

    file = request.files["profile_picture"]
    filename = file.filename or ""

    if filename == "":
        return jsonify({"success": False, "message": "Empty filename"}), 400

    if not allowed_file(filename):
        return jsonify(
            {"success": False, "message": "Invalid file type. Allowed: png, jpg, jpeg, gif"}
        ), 400

    # Read bytes to check size (safe: limit is small)
    file_bytes = file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({"success": False, "message": "File too large (max 1MB)"}), 400

    frontend_static = os.path.abspath(
        os.path.join(current_app.root_path, "..", "static")
    )
    upload_folder = os.path.join(frontend_static, "profile_pics")
    os.makedirs(upload_folder, exist_ok=True)

    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT profile_pic_url FROM users WHERE email = %s", (session["user"],))
        old = cursor.fetchone()
        old_url = old[0] if old else None

        if old_url and "profile_pics" in old_url:
            old_name = os.path.basename(old_url)
            old_path = os.path.join(upload_folder, old_name)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except OSError:
                    # ignore removal errors (keep it simple)
                    pass
    except Exception:
        # proceed anyway if DB read fails — will surface later on update
        old_url = None
    finally:
        # do not close cursor here if we will reuse it below; ensure it's closed if created
        try:
            cursor.close()
        except Exception:
            pass

    # Save new file with unique name
    ext = secure_filename(filename).rsplit(".", 1)[1].lower()
    user_prefix = session["user"].split("@", 1)[0]
    unique_name = f"{user_prefix}_{uuid.uuid4().hex[:8]}.{ext}"
    file_path = os.path.join(upload_folder, unique_name)

    try:
        # write bytes to disk
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        profile_pic_url = f"http://localhost:5000/static/profile_pics/{unique_name}"

        # Update DB
        cursor = mysql.connection.cursor()
        cursor.execute(
            "UPDATE users SET profile_pic_url = %s WHERE email = %s",
            (profile_pic_url, session["user"]),
        )
        mysql.connection.commit()
        cursor.close()

        return jsonify(
            {"success": True, "message": "Profile picture updated", "profile_pic_url": profile_pic_url}
        ), 200

    except Exception as e:
        # keep response minimal and simple
        current_app.logger.error("upload_profile_picture error: %s", e)
        return jsonify({"success": False, "message": "Upload failed"}), 500


@api.route("/delete_account", methods=["POST"])
def api_delete_account():
    if "user" not in session:
        flash("Unauthorized access.", "danger")
        return jsonify({"success": False}), 401

    cursor = mysql.connection.cursor()

    try:
        cursor.execute("SELECT account_number FROM users WHERE email = %s", (session["user"],))
        result = cursor.fetchone()

        if not result:
            cursor.close()
            flash("User not found.", "danger")
            return jsonify({"success": False}), 404

        account_number = result[0]

        cursor.execute("""
            DELETE FROM transactions 
            WHERE account_number = %s OR recipient_account = %s
        """, (account_number, account_number))

        cursor.execute("DELETE FROM users WHERE email = %s", (session["user"],))

        mysql.connection.commit()
        
        session.pop("user", None)
        flash("Account deleted permanently.", "info")
        
        return jsonify({"success": True}), 200

    except Exception as e:
        mysql.connection.rollback()
        print("Error deleting account:", e)
        flash("An error occurred during deletion.", "danger")
        return jsonify({"success": False}), 500

    finally:
        cursor.close()
        

@api.route("/logout", methods=["POST"])
def api_logout():
    session.pop("user", None)
    flash("You have been logged out.", "info")
    return jsonify({"success": True}), 200


@api.route("/session_status", methods=["GET"])
def api_session_status():
    if "user" in session:
        return jsonify({"logged_in": True}), 200
    else:
        return jsonify({"logged_in": False}), 401
