"""Ephemeral JSON endpoints. No files, database writes, or body/error logging."""
from threading import Lock
from urllib.parse import urlsplit
from flask import Blueprint, current_app, jsonify, request
from werkzeug.exceptions import BadRequest, RequestEntityTooLarge
from .engine import FEATURES, InputError, NOTICE, run_study, validate_request
from .provider import LocalModel, settings

decision_bp = Blueprint('decision_lab', __name__)
_model_lock = Lock()


@decision_bp.before_request
def protect_request():
    request.max_content_length = 65536
    # JSON + explicit custom header prevents cross-site simple form submissions.
    if request.method == 'POST':
        if not request.is_json or request.headers.get('X-Decision-Lab') != '1':
            return jsonify(error='Use JSON and the Decision Lab request header.'), 415
        origin = request.headers.get('Origin')
        if origin:
            try:
                parsed = urlsplit(origin)
            except ValueError:
                return jsonify(error='Invalid request origin.'), 403
            if parsed.netloc != request.host or parsed.scheme not in ('http', 'https'):
                return jsonify(error='Cross-origin studies are not accepted.'), 403


@decision_bp.after_request
def private_response(response):
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response


@decision_bp.errorhandler(RequestEntityTooLarge)
def too_large(_error):
    return jsonify(error='Study exceeds the 64 KiB request limit.'), 413


@decision_bp.errorhandler(BadRequest)
def malformed(_error):
    return jsonify(error='Send valid JSON.'), 400


@decision_bp.get('/capabilities')
def capabilities():
    return jsonify(features=FEATURES, local_llm_enabled=settings() is not None,
                   standalone=current_app.config.get('DECISION_LAB_STANDALONE', False),
                   synthetic_agents=6, notice=NOTICE, max_request_bytes=65536)


@decision_bp.post('/run')
def run():
    try:
        study = validate_request(request.get_json())
    except InputError as error:
        return jsonify(error=str(error)), 400
    if study['mode'] == 'fixture':
        return jsonify(run_study(study))
    if not settings():
        return jsonify(error='Local model is disabled. Use the rules demo.'), 403
    if not _model_lock.acquire(blocking=False):
        return jsonify(error='A local-model run is already active. Try again when it finishes.'), 429
    provider = None
    try:
        provider = LocalModel()
        return jsonify(run_study(study, provider))
    except Exception:
        # Provider exceptions can contain prompts, keys or server output. Never echo/log them.
        return jsonify(error='Local-model run failed or returned invalid data. No partial result was retained.'), 502
    finally:
        try:
            if provider is not None:
                provider.close()
        except Exception:
            pass  # Do not disclose transport details during cleanup.
        finally:
            _model_lock.release()
