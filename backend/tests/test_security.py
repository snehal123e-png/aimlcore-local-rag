from app.core.security import validate_extension,validate_file_size,sanitize_filename

def test_valid_extension(): assert validate_extension("policy.pdf")
def test_invalid_extension(): assert not validate_extension("malware.exe")
def test_file_size(): assert validate_file_size(1024) and not validate_file_size(0)
def test_sanitize(): assert sanitize_filename("../../secret.txt")=="secret.txt"
