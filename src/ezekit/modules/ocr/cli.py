"""CLI commands for the OCR module."""

import socket
import webbrowser

import click


def _find_free_port(start: int = 8756, max_tries: int = 20) -> int:
    """Find a free port starting from `start`."""
    for port in range(start, start + max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise RuntimeError(f"No free port found in range {start}-{start + max_tries}")


@click.group("ocr")
def ocr_cli() -> None:
    """OCR annotation tool for creating image-text datasets."""


@ocr_cli.command("start")
@click.option("--port", type=int, default=None, help="Port to listen on")
@click.option("--no-browser", is_flag=True, help="Don't open browser automatically")
def start(port: int | None, no_browser: bool) -> None:
    """Start the OCR annotation server."""
    import uvicorn

    from ezekit.core.server import create_app

    if port is None:
        port = _find_free_port()

    app = create_app()
    url = f"http://127.0.0.1:{port}"
    click.echo(f"Starting ezekit OCR at {url}")

    if not no_browser:
        # Open browser after a short delay via uvicorn startup event
        import threading

        def _open_browser():
            import time

            time.sleep(1.0)
            webbrowser.open(url)

        threading.Thread(target=_open_browser, daemon=True).start()

    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
