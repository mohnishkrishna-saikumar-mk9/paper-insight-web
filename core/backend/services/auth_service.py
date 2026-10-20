import os
import json

AUTH_FILE = "security/master_password.txt"
SECRET_PHRASE_FILE = "security/secret_phrase.txt"
PROFILE_FILE = "keys/user_profile.json"

os.makedirs("security", exist_ok=True)
os.makedirs("keys", exist_ok=True)

DEFAULT_PASSWORD = "paperinsight2024"

DEFAULT_PROFILE = {
    "name": "Principal Investigator",
    "role": "Administrator",
    "institution": "Global Research Institute",
    "department": "Advanced AI Lab",
    "apiKeys": []
}

def get_password():
    if not os.path.exists(AUTH_FILE):
        return None
    with open(AUTH_FILE, "r") as f:
        return f.read().strip()

def verify_password(password: str) -> bool:
    saved = get_password()
    if saved is None:
        return False
    return password.strip() == saved.strip()

def update_password(new_password: str) -> bool:
    try:
        with open(AUTH_FILE, "w") as f:
            f.write(new_password.strip())
        return True
    except Exception as e:
        print(f"Error saving password: {e}")
        return False

def get_secret_phrase():
    if not os.path.exists(SECRET_PHRASE_FILE):
        return None
    with open(SECRET_PHRASE_FILE, "r") as f:
        return f.read().strip()
        
def has_setup_completed() -> bool:
    return os.path.exists(AUTH_FILE) and os.path.exists(SECRET_PHRASE_FILE)

def verify_secret_phrase(phrase: str) -> bool:
    saved = get_secret_phrase()
    if saved is None:
        return False
    return phrase.strip().lower() == saved.strip().lower()

def update_secret_phrase(new_phrase: str) -> bool:
    if get_secret_phrase() is not None:
        print("Security phrase is already set and cannot be changed.")
        return False
    try:
        with open(SECRET_PHRASE_FILE, "w") as f:
            f.write(new_phrase.strip())
        return True
    except Exception as e:
        print(f"Error saving secret phrase: {e}")
        return False

def get_profile() -> dict:
    if not os.path.exists(PROFILE_FILE):
        return DEFAULT_PROFILE
    try:
        with open(PROFILE_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_PROFILE

def update_profile(profile_data: dict) -> bool:
    try:
        with open(PROFILE_FILE, "w") as f:
            json.dump(profile_data, f)
        return True
    except Exception as e:
        print(f"Error saving profile: {e}")
        return False

def get_api_keys():
    profile = get_profile()
    keys = profile.get("apiKeys", [])
    if not keys:
        raise Exception("No Groq API keys configured. Please add an API key in your Profile.")
    return keys

def get_openai_key():
    profile = get_profile()
    key = profile.get("openaiKey")
    if not key:
        raise Exception("No OpenAI API key configured. Please add an OpenAI key in your Profile.")
    return key
