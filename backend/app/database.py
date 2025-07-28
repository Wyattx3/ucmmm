from typing import Dict, Optional
from datetime import datetime, timedelta
import random
import string
from .models import UserResponse, UserRegistrationData, VerificationCodeData

class InMemoryDatabase:
    def __init__(self):
        self.users: Dict[str, UserResponse] = {}
        self.verification_codes: Dict[str, VerificationCodeData] = {}
        self.user_passcodes: Dict[str, str] = {}
    
    def generate_user_id(self) -> str:
        return ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    
    def generate_verification_code(self) -> str:
        return ''.join(random.choices(string.digits, k=6))
    
    def create_user(self, registration_data: UserRegistrationData) -> str:
        user_id = self.generate_user_id()
        user = UserResponse(
            user_id=user_id,
            registration_data=registration_data,
            created_at=datetime.now()
        )
        self.users[user_id] = user
        return user_id
    
    def get_user(self, user_id: str) -> Optional[UserResponse]:
        return self.users.get(user_id)
    
    def get_user_by_email(self, email: str) -> Optional[UserResponse]:
        for user in self.users.values():
            if user.registration_data.email == email:
                return user
        return None
    
    def update_user(self, user_id: str, **kwargs) -> bool:
        if user_id in self.users:
            user = self.users[user_id]
            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            return True
        return False
    
    def create_verification_code(self, email: str) -> str:
        code = self.generate_verification_code()
        verification_data = VerificationCodeData(
            code=code,
            email=email,
            created_at=datetime.now()
        )
        self.verification_codes[email] = verification_data
        return code
    
    def verify_code(self, email: str, code: str) -> bool:
        if email in self.verification_codes:
            stored_data = self.verification_codes[email]
            if (stored_data.code == code and 
                datetime.now() - stored_data.created_at < timedelta(minutes=10)):
                return True
        return False
    
    def increment_resend_count(self, email: str) -> int:
        if email in self.verification_codes:
            self.verification_codes[email].resend_count += 1
            return self.verification_codes[email].resend_count
        return 0
    
    def get_resend_count(self, email: str) -> int:
        if email in self.verification_codes:
            return self.verification_codes[email].resend_count
        return 0
    
    def can_resend_code(self, email: str) -> bool:
        return self.get_resend_count(email) < 3
    
    def set_user_passcode(self, user_id: str, passcode: str) -> bool:
        if user_id in self.users:
            self.user_passcodes[user_id] = passcode
            self.update_user(user_id, passcode_set=True)
            return True
        return False
    
    def verify_user_passcode(self, user_id: str, passcode: str) -> bool:
        return self.user_passcodes.get(user_id) == passcode

db = InMemoryDatabase()
