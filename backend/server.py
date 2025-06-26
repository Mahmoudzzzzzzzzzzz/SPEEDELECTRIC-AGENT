from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import json
import pandas as pd
from docx import Document
import io
import re


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Bid Tracker API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enhanced Models for Bid Tracker System
class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    company: str = ""
    phone: str = ""
    address: str = ""
    status: str = "active"  # active, inactive, prospect
    tags: List[str] = []
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_contact: Optional[datetime] = None

class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    company: str = ""
    phone: str = ""
    address: str = ""
    tags: List[str] = []
    notes: str = ""

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

class EmailTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    subject: str
    body: str
    template_type: str = "proposal"  # proposal, follow_up, general
    variables: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class EmailTemplateCreate(BaseModel):
    name: str
    subject: str
    body: str
    template_type: str = "proposal"
    variables: List[str] = []

class Campaign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    template_id: str
    customer_ids: List[str]
    status: str = "draft"  # draft, sending, sent, failed
    sent_count: int = 0
    opened_count: int = 0
    replied_count: int = 0
    scheduled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class CampaignCreate(BaseModel):
    name: str
    template_id: str
    customer_ids: List[str]
    scheduled_at: Optional[datetime] = None

class EmailTracking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    customer_id: str
    email: EmailStr
    status: str = "sent"  # sent, delivered, opened, clicked, replied, failed
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    opened_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    tracking_pixel_id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class FollowUp(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    template_id: str
    due_date: datetime
    status: str = "pending"  # pending, sent, completed, cancelled
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class FollowUpCreate(BaseModel):
    customer_id: str
    template_id: str
    due_date: datetime
    notes: str = ""

# File Processing Functions
def extract_customers_from_docx(file_content: bytes) -> List[Dict[str, Any]]:
    """Extract customer data from Word document"""
    try:
        doc = Document(io.BytesIO(file_content))
        customers = []
        
        # Extract text from document
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        # Extract emails using regex
        email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        emails = email_pattern.findall(text)
        
        # Simple extraction - look for patterns like "Name: John Doe"
        lines = text.split('\n')
        current_customer = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                if current_customer and 'email' in current_customer:
                    customers.append(current_customer)
                    current_customer = {}
                continue
            
            # Look for key-value pairs
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip().lower()
                value = value.strip()
                
                if key in ['name', 'company', 'phone', 'address', 'notes']:
                    current_customer[key] = value
                elif key == 'email' and value:
                    current_customer['email'] = value
        
        # Add last customer if exists
        if current_customer and 'email' in current_customer:
            customers.append(current_customer)
        
        # If no structured data found, create customers from emails
        if not customers and emails:
            for email in emails:
                customers.append({
                    'name': email.split('@')[0].replace('.', ' ').title(),
                    'email': email,
                    'company': email.split('@')[1].split('.')[0].title() if '@' in email else '',
                })
        
        return customers
    
    except Exception as e:
        logging.error(f"Error extracting customers from docx: {str(e)}")
        return []

def extract_customers_from_excel(file_content: bytes, filename: str) -> List[Dict[str, Any]]:
    """Extract customer data from Excel file"""
    try:
        # Read Excel file
        if filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
        else:
            df = pd.read_excel(io.BytesIO(file_content), engine='xlrd')
        
        customers = []
        
        # Try to map common column names
        column_mapping = {
            'name': ['name', 'full name', 'customer name', 'client name'],
            'email': ['email', 'email address', 'e-mail'],
            'company': ['company', 'organization', 'business'],
            'phone': ['phone', 'telephone', 'contact', 'mobile'],
            'address': ['address', 'location']
        }
        
        # Find matching columns
        mapped_columns = {}
        for standard_name, possible_names in column_mapping.items():
            for col in df.columns:
                if col.lower().strip() in possible_names:
                    mapped_columns[standard_name] = col
                    break
        
        # Extract customer data
        for _, row in df.iterrows():
            customer_data = {}
            
            for standard_name, excel_col in mapped_columns.items():
                if pd.notna(row[excel_col]):
                    customer_data[standard_name] = str(row[excel_col]).strip()
            
            if 'email' in customer_data and customer_data['email']:
                customers.append(customer_data)
        
        return customers
    
    except Exception as e:
        logging.error(f"Error extracting customers from excel: {str(e)}")
        return []


# API Routes
@api_router.get("/")
async def root():
    return {"message": "Bid Tracker API", "version": "1.0.0"}

# Customer Management Routes
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate):
    """Create a new customer"""
    customer_dict = customer.dict()
    customer_obj = Customer(**customer_dict)
    await db.customers.insert_one(customer_obj.dict())
    return customer_obj

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(skip: int = 0, limit: int = 100, status: Optional[str] = None):
    """Get all customers with optional filtering"""
    query = {}
    if status:
        query["status"] = status
    
    customers = await db.customers.find(query).skip(skip).limit(limit).to_list(limit)
    return [Customer(**customer) for customer in customers]

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    """Get a specific customer"""
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_update: CustomerUpdate):
    """Update a customer"""
    update_data = {k: v for k, v in customer_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.customers.update_one(
        {"id": customer_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    updated_customer = await db.customers.find_one({"id": customer_id})
    return Customer(**updated_customer)

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    """Delete a customer"""
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

# File Upload Route
@api_router.post("/customers/import")
async def import_customers(file: UploadFile = File(...)):
    """Import customers from uploaded file (Word or Excel)"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = file.filename.lower().split('.')[-1]
    
    if file_extension not in ['docx', 'xlsx', 'xls']:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file format. Please upload .docx, .xlsx, or .xls files"
        )
    
    try:
        file_content = await file.read()
        
        if file_extension == 'docx':
            extracted_customers = extract_customers_from_docx(file_content)
        else:
            extracted_customers = extract_customers_from_excel(file_content, file.filename)
        
        if not extracted_customers:
            raise HTTPException(
                status_code=400, 
                detail="No customer data found in the file"
            )
        
        # Create customer objects and save to database
        created_customers = []
        for customer_data in extracted_customers:
            try:
                # Ensure required fields
                if 'name' not in customer_data:
                    customer_data['name'] = customer_data.get('email', '').split('@')[0]
                
                customer_obj = Customer(**customer_data)
                await db.customers.insert_one(customer_obj.dict())
                created_customers.append(customer_obj)
                
            except Exception as e:
                logging.warning(f"Failed to create customer from data {customer_data}: {str(e)}")
                continue
        
        return {
            "message": f"Successfully imported {len(created_customers)} customers",
            "imported_count": len(created_customers),
            "customers": created_customers
        }
    
    except Exception as e:
        logging.error(f"Error importing customers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to import customers")

# Email Template Routes
@api_router.post("/templates", response_model=EmailTemplate)
async def create_template(template: EmailTemplateCreate):
    """Create a new email template"""
    template_dict = template.dict()
    template_obj = EmailTemplate(**template_dict)
    await db.templates.insert_one(template_obj.dict())
    return template_obj

@api_router.get("/templates", response_model=List[EmailTemplate])
async def get_templates(template_type: Optional[str] = None):
    """Get all email templates"""
    query = {}
    if template_type:
        query["template_type"] = template_type
    
    templates = await db.templates.find(query).to_list(100)
    return [EmailTemplate(**template) for template in templates]

@api_router.get("/templates/{template_id}", response_model=EmailTemplate)
async def get_template(template_id: str):
    """Get a specific email template"""
    template = await db.templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return EmailTemplate(**template)

@api_router.put("/templates/{template_id}", response_model=EmailTemplate)
async def update_template(template_id: str, template_update: EmailTemplateCreate):
    """Update an email template"""
    update_data = template_update.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.templates.update_one(
        {"id": template_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    updated_template = await db.templates.find_one({"id": template_id})
    return EmailTemplate(**updated_template)

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """Delete an email template"""
    result = await db.templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"}

# Campaign Routes
@api_router.post("/campaigns", response_model=Campaign)
async def create_campaign(campaign: CampaignCreate):
    """Create a new email campaign"""
    campaign_dict = campaign.dict()
    campaign_obj = Campaign(**campaign_dict)
    await db.campaigns.insert_one(campaign_obj.dict())
    return campaign_obj

@api_router.get("/campaigns", response_model=List[Campaign])
async def get_campaigns():
    """Get all campaigns"""
    campaigns = await db.campaigns.find().to_list(100)
    return [Campaign(**campaign) for campaign in campaigns]

@api_router.get("/campaigns/{campaign_id}", response_model=Campaign)
async def get_campaign(campaign_id: str):
    """Get a specific campaign"""
    campaign = await db.campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return Campaign(**campaign)

# Follow-up Routes
@api_router.post("/followups", response_model=FollowUp)
async def create_followup(followup: FollowUpCreate):
    """Create a new follow-up"""
    followup_dict = followup.dict()
    followup_obj = FollowUp(**followup_dict)
    await db.followups.insert_one(followup_obj.dict())
    return followup_obj

@api_router.get("/followups", response_model=List[FollowUp])
async def get_followups(status: Optional[str] = None, due_soon: bool = False):
    """Get follow-ups with optional filtering"""
    query = {}
    if status:
        query["status"] = status
    
    if due_soon:
        # Get follow-ups due in next 7 days
        next_week = datetime.utcnow() + timedelta(days=7)
        query["due_date"] = {"$lte": next_week}
        query["status"] = "pending"
    
    followups = await db.followups.find(query).to_list(100)
    return [FollowUp(**followup) for followup in followups]

# Analytics and Dashboard Routes
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    # Count customers
    total_customers = await db.customers.count_documents({})
    active_customers = await db.customers.count_documents({"status": "active"})
    
    # Count campaigns
    total_campaigns = await db.campaigns.count_documents({})
    active_campaigns = await db.campaigns.count_documents({"status": {"$in": ["draft", "sending"]}})
    
    # Count follow-ups
    pending_followups = await db.followups.count_documents({"status": "pending"})
    overdue_followups = await db.followups.count_documents({
        "status": "pending",
        "due_date": {"$lt": datetime.utcnow()}
    })
    
    # Count templates
    total_templates = await db.templates.count_documents({})
    
    return {
        "customers": {
            "total": total_customers,
            "active": active_customers
        },
        "campaigns": {
            "total": total_campaigns,
            "active": active_campaigns
        },
        "followups": {
            "pending": pending_followups,
            "overdue": overdue_followups
        },
        "templates": {
            "total": total_templates
        }
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
