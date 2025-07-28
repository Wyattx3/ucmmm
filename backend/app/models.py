from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserRegistrationData(BaseModel):
    firstName: str
    middleName: Optional[str] = ""
    lastName: str
    dateOfBirth: str  # DD/MM/YYYY format
    email: EmailStr
    phoneNumber: str
    countryCode: str = "+95"
    countryName: str = "Myanmar"

class EmailVerificationRequest(BaseModel):
    email: EmailStr

class EmailVerificationCode(BaseModel):
    email: EmailStr
    code: str

class PasscodeData(BaseModel):
    user_id: str
    passcode: str

class CitizenshipData(BaseModel):
    user_id: str
    citizenships: List[str]  # Max 3 selections

class CityData(BaseModel):
    user_id: str
    city: str

class CompleteRegistrationRequest(BaseModel):
    user_id: str

class UserResponse(BaseModel):
    user_id: str
    registration_data: UserRegistrationData
    email_verified: bool = False
    passcode_set: bool = False
    citizenships: List[str] = []
    city: Optional[str] = None
    registration_complete: bool = False
    created_at: datetime

class VerificationCodeData(BaseModel):
    code: str
    email: str
    created_at: datetime
    attempts: int = 0
    resend_count: int = 0
