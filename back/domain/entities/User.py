"""User entity """



class User:
    """User entity representing a library user."""
    def __init__(self, username: str, email: str):
        self.username = username
        self.email = email
        