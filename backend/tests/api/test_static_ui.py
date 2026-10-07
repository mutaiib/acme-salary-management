"""NFR-06: the API serves the built UI."""

from fastapi.testclient import TestClient

from app.main import create_app


def ui_client(tmp_path) -> TestClient:
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app.js").write_text("console.log('ui')")
    (tmp_path / "index.html").write_text("<html>ACME UI</html>")
    return TestClient(create_app(static_dir=tmp_path))


def test_serves_the_ui_at_the_root(tmp_path):
    response = ui_client(tmp_path).get("/")

    assert response.status_code == 200
    assert "ACME UI" in response.text


def test_serves_the_ui_for_a_screen_url_so_that_a_reload_works(tmp_path):
    response = ui_client(tmp_path).get("/employees/42")

    assert response.status_code == 200
    assert "ACME UI" in response.text


def test_serves_a_built_asset(tmp_path):
    response = ui_client(tmp_path).get("/assets/app.js")

    assert response.status_code == 200
    assert "console.log" in response.text


def test_returns_404_for_an_api_path_that_does_not_exist(tmp_path):
    response = ui_client(tmp_path).get("/api/nothing")

    assert response.status_code == 404
    assert "ACME UI" not in response.text


def test_starts_without_a_built_ui(tmp_path):
    client = TestClient(create_app(static_dir=tmp_path / "missing"))

    assert client.get("/").status_code == 404


def test_does_not_serve_a_file_outside_the_ui_directory(tmp_path):
    (tmp_path / "secret.txt").write_text("secret")
    ui_dir = tmp_path / "ui"
    ui_dir.mkdir()
    (ui_dir / "assets").mkdir()
    (ui_dir / "index.html").write_text("<html>ACME UI</html>")
    client = TestClient(create_app(static_dir=ui_dir))

    response = client.get("/%2e%2e/secret.txt")

    assert "secret" not in response.text.replace("ACME UI", "")
