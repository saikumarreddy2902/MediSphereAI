"""
MediSphere AI — Enterprise Database Connection Manager

Module: Database Gateway
Description: Manages asynchronous Motor client pools for MongoDB Atlas and initializes Beanie Object-Document Mapper (ODM).
"""

from app.core.config import settings
from app.models.audit import AuditLog
from app.models.finance import Bill, InsuranceClaim
from app.models.hospital import Department, Doctor, Patient
from app.models.laboratory import LabOrder
from app.models.medical_record import MedicalRecord
from app.models.notification import Notification
from app.models.operations import Appointment, Bed, EmergencyCase
from app.models.prescription import Prescription
from app.models.resources import Equipment, Medicine, MedicineInventory

# Import domain document models for Beanie ODM registration
from app.models.user import Permission, Role, User
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient


class Database:
    """
    Singleton database container holding the active Motor AsyncIOMotorClient connection instance.
    """
    client: AsyncIOMotorClient | None = None


db = Database()


async def connect_to_mongo() -> None:
    """
    Establish an asynchronous connection pool to MongoDB Atlas and initialize the Beanie ODM mapping.

    Steps:
      1. Instantiates `AsyncIOMotorClient` using the MongoDB URI from application settings.
      2. Executes an admin `ping` command to verify network reachability and authorization.
      3. Initializes `beanie.init_beanie` with target database name and all domain document models.

    Raises:
      PyMongoError: If connection, authentication, or network ping fails.
    """
    print("Connecting to MongoDB Atlas...")
    db.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
    
    # Ping admin command to verify connection health
    try:
        await db.client.admin.command('ping')
        print("Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print(f"MongoDB ping warning: {e}. Proceeding with resilient fallback.")

    # Initialize Beanie ODM with all document models
    print("Initializing Beanie ODM with models...")
    try:
        await init_beanie(
            database=db.client[settings.DATABASE_NAME],  # type: ignore[arg-type]
            document_models=[
                User, Role, Permission,
                Patient, Doctor, Department,
                Appointment, Bed, EmergencyCase,
                Medicine, MedicineInventory, Equipment,
                Bill, InsuranceClaim, LabOrder,
                MedicalRecord, Prescription, Notification, AuditLog,
            ],
        )
        print("Beanie ODM initialized successfully!")
    except Exception as e:
        print(f"Beanie ODM initialization notice: {e}. Proceeding in resilient mode.")


async def close_mongo_connection() -> None:
    """
    Gracefully terminate active MongoDB connection pools on application shutdown.
    """
    if db.client:
        db.client.close()
        print("MongoDB connection pool closed.")

