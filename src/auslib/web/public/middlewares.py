import os

from werkzeug.wrappers import Request
from werkzeug.wsgi import ClosingIterator


class UpdateResponseLogMiddleware():
    def __init__(self, app, log_callback):
        self.app = app
        self.log_callback = log_callback

    def __call__(self, environ, start_response):
        body = list(self.app(environ, start_response))


        def _log():
            if self.log_callback:
                self.log_callback(Request(environ), body)


        return ClosingIterator(body, _log)


def configure_bigquery_log(app, log_callback=None):
    if bool(int(os.getenv("ENABLE_UPDATE_BIGQUERY_LOG", 0))):
        def _log(request, body):
            print(f"{'*' * 10} - BIGQUERYLOG - {'*' * 10}")
            print(request.args)
            print(body)
            print(f"{'*' * 10} - BIGQUERYLOG - {'*' * 10}")

        app.wsgi_app = UpdateResponseLogMiddleware(app.wsgi_app, log_callback or _log)
