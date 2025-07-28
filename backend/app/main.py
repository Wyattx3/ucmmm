from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import (
    UserRegistrationData, EmailVerificationRequest, EmailVerificationCode,
    PasscodeData, CitizenshipData, CityData, CompleteRegistrationRequest,
    UserResponse
)
from .database import db
import time

app = FastAPI(title="UC ERA Registration API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/users/register")
async def register_user(registration_data: UserRegistrationData):
    """Register a new user with basic information (steps 1-4)"""
    try:
        existing_user = db.get_user_by_email(registration_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        user_id = db.create_user(registration_data)
        user = db.get_user(user_id)
        
        return {
            "success": True,
            "message": "User registered successfully",
            "user_id": user_id,
            "user": user
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/send-verification")
async def send_verification_code(request: EmailVerificationRequest):
    """Send email verification code (step 5)"""
    try:
        user = db.get_user_by_email(request.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not db.can_resend_code(request.email):
            raise HTTPException(status_code=429, detail="Maximum resend attempts reached")
        
        code = db.create_verification_code(request.email)
        resend_count = db.increment_resend_count(request.email)
        
        time.sleep(0.5)
        
        return {
            "success": True,
            "message": f"Verification code sent to {request.email}",
            "resend_count": resend_count,
            "max_attempts": 3
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/verify-email")
async def verify_email(verification: EmailVerificationCode):
    """Verify email with OTP code (step 6)"""
    try:
        user = db.get_user_by_email(verification.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if db.verify_code(verification.email, verification.code):
            db.update_user(user.user_id, email_verified=True)
            return {
                "success": True,
                "message": "Email verified successfully",
                "user_id": user.user_id
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/set-passcode")
async def set_passcode(passcode_data: PasscodeData):
    """Set user passcode (steps 7-8)"""
    try:
        user = db.get_user(passcode_data.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.email_verified:
            raise HTTPException(status_code=400, detail="Email must be verified before setting passcode")
        
        if len(passcode_data.passcode) != 6 or not passcode_data.passcode.isdigit():
            raise HTTPException(status_code=400, detail="Passcode must be exactly 6 digits")
        
        db.set_user_passcode(passcode_data.user_id, passcode_data.passcode)
        
        return {
            "success": True,
            "message": "Passcode set successfully",
            "user_id": passcode_data.user_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/verify-passcode")
async def verify_passcode(passcode_data: PasscodeData):
    """Verify user passcode (step 8 confirmation)"""
    try:
        user = db.get_user(passcode_data.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if db.verify_user_passcode(passcode_data.user_id, passcode_data.passcode):
            return {
                "success": True,
                "message": "Passcode verified successfully",
                "user_id": passcode_data.user_id
            }
        else:
            raise HTTPException(status_code=400, detail="Incorrect passcode")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/set-citizenship")
async def set_citizenship(citizenship_data: CitizenshipData):
    """Set user citizenship selections (step 9)"""
    try:
        user = db.get_user(citizenship_data.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.passcode_set:
            raise HTTPException(status_code=400, detail="Passcode must be set before selecting citizenship")
        
        if len(citizenship_data.citizenships) == 0:
            raise HTTPException(status_code=400, detail="At least one citizenship must be selected")
        
        if len(citizenship_data.citizenships) > 3:
            raise HTTPException(status_code=400, detail="Maximum 3 citizenships can be selected")
        
        db.update_user(citizenship_data.user_id, citizenships=citizenship_data.citizenships)
        
        return {
            "success": True,
            "message": "Citizenship selections saved successfully",
            "user_id": citizenship_data.user_id,
            "citizenships": citizenship_data.citizenships
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/set-city")
async def set_city(city_data: CityData):
    """Set user city selection (step 10)"""
    try:
        user = db.get_user(city_data.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.citizenships:
            raise HTTPException(status_code=400, detail="Citizenship must be selected before choosing city")
        
        db.update_user(city_data.user_id, city=city_data.city)
        
        return {
            "success": True,
            "message": "City selection saved successfully",
            "user_id": city_data.user_id,
            "city": city_data.city
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/complete-registration")
async def complete_registration(request: CompleteRegistrationRequest):
    """Complete user registration (step 11)"""
    try:
        user = db.get_user(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not all([user.email_verified, user.passcode_set, user.citizenships, user.city]):
            raise HTTPException(status_code=400, detail="All registration steps must be completed")
        
        db.update_user(request.user_id, registration_complete=True)
        
        return {
            "success": True,
            "message": "Registration completed successfully! Welcome to UC ERA! 🎉",
            "user_id": request.user_id,
            "user": db.get_user(request.user_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    """Get user registration data"""
    try:
        user = db.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users")
async def list_users():
    """List all registered users (for testing purposes)"""
    try:
        users = list(db.users.values())
        return {
            "success": True,
            "count": len(users),
            "users": users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
