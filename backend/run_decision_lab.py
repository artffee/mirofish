"""No-key standalone prototype. Serves the existing Vue build and Decision Lab only."""
from pathlib import Path
from flask import Flask, abort, redirect, request, send_from_directory
from app.decision_lab.api import decision_bp


def create_decision_app():
    dist = Path(__file__).resolve().parents[1] / 'frontend' / 'dist-decision-lab'
    app = Flask(__name__, static_folder=None)
    app.config.update(MAX_CONTENT_LENGTH=65536, DEBUG=False, DECISION_LAB_STANDALONE=True,
                      TRUSTED_HOSTS=['127.0.0.1', 'localhost'])
    app.register_blueprint(decision_bp, url_prefix='/api/decision-lab')

    @app.before_request
    def loopback_only():
        if request.remote_addr not in ('127.0.0.1', '::1'):
            abort(403)

    @app.get('/health')
    def health():
        return {'status': 'ok', 'service': 'MiroFish Decision Lab', 'standalone': True}

    @app.get('/')
    def home():
        return redirect('/decision-lab')

    @app.get('/<path:path>')
    def frontend(path):
        if path.startswith('api/'):
            return {'error': 'This standalone server exposes Decision Lab only.'}, 404
        if path == 'decision-lab':
            if not (dist / 'decision-lab.html').exists():
                return {'error': 'Build the frontend with npm --prefix frontend ci and npm run build:decision-lab.'}, 503
            return send_from_directory(dist, 'decision-lab.html')
        return send_from_directory(dist, path)

    @app.after_request
    def private(response):
        response.headers['Cache-Control'] = 'no-store'
        response.headers['Referrer-Policy'] = 'no-referrer'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Content-Security-Policy'] = "default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
        return response

    return app


if __name__ == '__main__':
    create_decision_app().run(host='127.0.0.1', port=5002, debug=False, use_reloader=False)
