import hashlib, secrets
from pathlib import Path
ALLOWED_EXTENSIONS={".pdf",".docx",".txt",".md",".csv"}
MAX_FILE_SIZE=25*1024*1024

def calculate_file_hash(file_path):
    sha256=hashlib.sha256()
    with open(file_path,"rb") as f:
        while chunk:=f.read(1024*1024): sha256.update(chunk)
    return sha256.hexdigest()

def validate_extension(filename): return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS
def validate_file_size(size): return 0 < size <= MAX_FILE_SIZE
def sanitize_filename(filename): return Path(filename).name
def generate_safe_filename(filename): return f"{secrets.token_hex(16)}{Path(filename).suffix.lower()}"
def safe_join(base_directory, filename):
    base=Path(base_directory).resolve(); target=(base/filename).resolve()
    if base not in target.parents and target!=base: raise ValueError("Invalid file path")
    return target
