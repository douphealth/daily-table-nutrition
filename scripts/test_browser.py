"""Run six bounded suites against the delivered site with explicit simulated APIs."""
from pathlib import Path
import subprocess, sys
root = Path(__file__).resolve().parents[1]
for group in ('flow', 'safety', 'ai', 'layout-mobile', 'layout-desktop', 'pages'):
    subprocess.run([sys.executable, str(root/'tests/journey_qa.py'), str(root/'site'), group], cwd=root, check=True, timeout=180)
