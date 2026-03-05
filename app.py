"""
Entry point kept for backward compatibility.

Now uses the modular app factory in `app.create_app()`.
"""

from __future__ import annotations

import threading
import time
import webbrowser

from app import create_app

flask_app = create_app()


def _open_browser():
    time.sleep(1.5)
    webbrowser.open("http://localhost:5000")


if __name__ == "__main__":
    threading.Thread(target=_open_browser, daemon=True).start()
    flask_app.run(debug=True, host="127.0.0.1", port=5000)
