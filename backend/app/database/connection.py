"""
MediSphere AI — Enterprise Database Connection Manager

Module: Database Gateway
Description: Manages asynchronous Motor client pools for MongoDB Atlas and initializes Beanie Object-Document Mapper (ODM).
"""
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

# Import domain document models for Beanie ODM registration
from app.models.user import User, Role, Permission
from app.models.hospital import Patient, Doctor, Department
from app.models.operations import Appointment, Bed, EmergencyCase
from app.models.resources import Medicine, MedicineInventory, Equipment
from app.models.finance import Bill, InsuranceClaim
from app.models.laboratory import LabOrder


class Database:
    """
    Singleton database container holding the active Motor AsyncIOMotorClient connection instance.
    """
    client: Optional[AsyncIOMotorClient] = None


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
    print(f"Connecting to MongoDB Atlas...")
    db.client = AsyncIOMotorClient(settings.MONGODB_URI)
    
    # Ping admin command to verify connection health
    await db.client.admin.command('ping')
    print("Successfully connected to MongoDB Atlas!")

    # Initialize Beanie ODM with all document models
    print("Initializing Beanie ODM with models...")
    await init_beanie(
        database=db.client[settings.DATABASE_NAME],
        document_models=[
            User, Role, Permission,
            Patient, Doctor, Department,
            Appointment, Bed, EmergencyCase,
            Medicine, MedicineInventory, Equipment,
            Bill, InsuranceClaim, LabOrder
        ],
    )
    print("Beanie ODM initialized successfully!")


async def close_mongo_connection() -> None:
    """
    Gracefully terminate active MongoDB connection pools on application shutdown.
    """
    if db.client:
        db.client.close()
        print("MongoDB connection pool closed.")

