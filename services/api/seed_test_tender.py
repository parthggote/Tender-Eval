#!/usr/bin/env python3
"""
Seed script to create a "Test_Tender" with complete mock data for every user.
This creates a fully populated tender with criteria, bidders, and evaluations.

Usage:
    python seed_test_tender.py
"""

import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# Add the app to the path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.db.models import (
    AgencyWorkspace,
    AgencyMembership,
    Tender,
    Bidder,
    Criterion,
    CriterionType,
    CriterionExtractionRun,
    EvaluationRun,
    CriterionEvaluation,
    ReviewCase,
    ProcessingStatus,
    Verdict,
    OfficerRole,
)
from app.core.config import settings


# Mock criteria for the test tender
MOCK_CRITERIA = [
    {
        "text": "Bidder must have ISO 9001:2015 Quality Management System certification",
        "type": CriterionType.CERTIFICATION,
        "mandatory": True,
        "threshold": None,
        "source_page": 1,
    },
    {
        "text": "Minimum 5 years of experience in government procurement projects",
        "type": CriterionType.TECHNICAL,
        "mandatory": True,
        "threshold": "5 years",
        "source_page": 2,
    },
    {
        "text": "Annual revenue must exceed $1,000,000 USD",
        "type": CriterionType.FINANCIAL,
        "mandatory": True,
        "threshold": "$1,000,000",
        "source_page": 2,
    },
    {
        "text": "Must provide proof of professional liability insurance with minimum coverage of $2,000,000",
        "type": CriterionType.COMPLIANCE,
        "mandatory": True,
        "threshold": "$2,000,000",
        "source_page": 3,
    },
    {
        "text": "Technical team must include at least 3 certified project managers (PMP or equivalent)",
        "type": CriterionType.TECHNICAL,
        "mandatory": True,
        "threshold": "3 certified PMs",
        "source_page": 3,
    },
    {
        "text": "Demonstrated experience with cloud infrastructure (AWS, Azure, or GCP)",
        "type": CriterionType.TECHNICAL,
        "mandatory": False,
        "threshold": None,
        "source_page": 4,
    },
    {
        "text": "Compliance with local labor laws and regulations",
        "type": CriterionType.COMPLIANCE,
        "mandatory": True,
        "threshold": None,
        "source_page": 4,
    },
    {
        "text": "Proposed solution must include 24/7 technical support",
        "type": CriterionType.TECHNICAL,
        "mandatory": False,
        "threshold": None,
        "source_page": 5,
    },
    {
        "text": "Financial stability: No bankruptcy filings in the past 5 years",
        "type": CriterionType.FINANCIAL,
        "mandatory": True,
        "threshold": "0 bankruptcies",
        "source_page": 5,
    },
    {
        "text": "Environmental compliance certification (ISO 14001 or equivalent)",
        "type": CriterionType.CERTIFICATION,
        "mandatory": False,
        "threshold": None,
        "source_page": 6,
    },
]

# Mock bidders with varying evaluation results
MOCK_BIDDERS = [
    {
        "name": "TechCorp Solutions Inc.",
        "evaluations": {
            0: ("PASS", "Valid ISO 9001:2015 certificate provided, expires 2027", 0.95),
            1: ("PASS", "8 years of documented government project experience", 0.92),
            2: ("PASS", "Annual revenue of $5.2M as per financial statements", 0.98),
            3: ("PASS", "Professional liability insurance certificate shows $3M coverage", 0.96),
            4: ("PASS", "Team roster includes 5 PMP-certified project managers", 0.94),
            5: ("PASS", "Extensive AWS and Azure experience documented", 0.89),
            6: ("PASS", "All labor law compliance documents provided", 0.91),
            7: ("PASS", "24/7 support included in proposal with SLA", 0.88),
            8: ("PASS", "Clean financial history verified", 0.97),
            9: ("PASS", "ISO 14001:2015 certificate provided", 0.85),
        },
    },
    {
        "name": "Global Systems Ltd.",
        "evaluations": {
            0: ("PASS", "ISO 9001:2015 certification valid until 2026", 0.93),
            1: ("PASS", "6 years of relevant experience demonstrated", 0.88),
            2: ("PASS", "Annual revenue of $2.8M confirmed", 0.90),
            3: ("FAIL", "Insurance coverage only $1.5M, below required threshold", 0.85),
            4: ("NEEDS_REVIEW", "Only 2 PMP certifications provided, third PM has PRINCE2", 0.70),
            5: ("PASS", "Strong GCP and AWS experience", 0.87),
            6: ("PASS", "Labor compliance documentation complete", 0.92),
            7: ("NEEDS_REVIEW", "Support hours 8AM-8PM only, not 24/7", 0.65),
            8: ("PASS", "No bankruptcy history found", 0.95),
            9: ("FAIL", "No environmental certification provided", 0.60),
        },
    },
    {
        "name": "Innovative Partners Co.",
        "evaluations": {
            0: ("PASS", "Valid ISO 9001:2015 certificate, recently renewed", 0.94),
            1: ("NEEDS_REVIEW", "4.5 years experience, slightly below 5-year requirement", 0.72),
            2: ("PASS", "Annual revenue $1.8M, meets threshold", 0.91),
            3: ("PASS", "Insurance coverage $2.5M confirmed", 0.93),
            4: ("PASS", "4 PMP-certified project managers on team", 0.90),
            5: ("NEEDS_REVIEW", "Limited cloud experience, primarily on-premise solutions", 0.55),
            6: ("PASS", "All compliance requirements met", 0.89),
            7: ("FAIL", "No 24/7 support offered in proposal", 0.50),
            8: ("PASS", "Strong financial position, no issues", 0.96),
            9: ("NEEDS_REVIEW", "Environmental policy documented but no formal certification", 0.68),
        },
    },
    {
        "name": "Premier Consulting Group",
        "evaluations": {
            0: ("FAIL", "ISO 9001 certificate expired 6 months ago", 0.40),
            1: ("PASS", "12 years of extensive government experience", 0.97),
            2: ("PASS", "Annual revenue $4.5M, well above threshold", 0.95),
            3: ("PASS", "Professional liability insurance $3.5M", 0.94),
            4: ("PASS", "6 certified project managers available", 0.96),
            5: ("PASS", "Multi-cloud expertise across all major platforms", 0.92),
            6: ("NEEDS_REVIEW", "Some labor documentation pending verification", 0.75),
            7: ("PASS", "24/7 support with dedicated team", 0.91),
            8: ("PASS", "Excellent financial track record", 0.98),
            9: ("PASS", "ISO 14001 and additional environmental certifications", 0.88),
        },
    },
]


def create_test_tender_for_agency(db, agency: AgencyWorkspace) -> Tender:
    """Create a complete test tender with all mock data for an agency."""
    
    print(f"  Creating Test_Tender for agency: {agency.name} ({agency.slug})")
    
    # Check if Test_Tender already exists for this agency
    existing = db.execute(
        select(Tender).where(
            Tender.agency_id == agency.id,
            Tender.title == "Test_Tender"
        )
    ).scalar_one_or_none()
    
    if existing:
        print(f"    ⚠️  Test_Tender already exists (ID: {existing.id}), skipping...")
        return existing
    
    # Create the tender
    tender = Tender(
        id=uuid.uuid4(),
        agency_id=agency.id,
        title="Test_Tender",
        reference="TEST-2026-001",
        description="This is a demonstration tender with complete mock data including criteria, bidders, and evaluations. Use this to explore the platform's features.",
        status="EVALUATION_COMPLETE",
        created_at=datetime.utcnow() - timedelta(days=7),
    )
    db.add(tender)
    db.flush()
    
    print(f"    ✓ Created tender (ID: {tender.id})")
    
    # Create extraction run
    extraction_run = CriterionExtractionRun(
        id=uuid.uuid4(),
        tender_id=tender.id,
        status=ProcessingStatus.SUCCEEDED.value,
        model="gemini-2.0-flash",
        disagreements=0,
        created_at=datetime.utcnow() - timedelta(days=6),
        finished_at=datetime.utcnow() - timedelta(days=6, hours=23),
    )
    db.add(extraction_run)
    
    # Create criteria
    criteria = []
    for i, crit_data in enumerate(MOCK_CRITERIA):
        criterion = Criterion(
            id=uuid.uuid4(),
            tender_id=tender.id,
            text=crit_data["text"],
            type=crit_data["type"].value,
            threshold=crit_data["threshold"],
            mandatory=crit_data["mandatory"],
            source_page=crit_data["source_page"],
            confidence=0.92 + (i * 0.01),  # Varying confidence
            created_at=datetime.utcnow() - timedelta(days=6),
        )
        db.add(criterion)
        criteria.append(criterion)
    
    db.flush()
    print(f"    ✓ Created {len(criteria)} criteria")
    
    # Create evaluation run
    eval_run = EvaluationRun(
        id=uuid.uuid4(),
        tender_id=tender.id,
        status=ProcessingStatus.SUCCEEDED.value,
        created_at=datetime.utcnow() - timedelta(days=3),
        finished_at=datetime.utcnow() - timedelta(days=3, hours=22),
    )
    db.add(eval_run)
    db.flush()
    
    # Create bidders and evaluations
    for bidder_data in MOCK_BIDDERS:
        bidder = Bidder(
            id=uuid.uuid4(),
            tender_id=tender.id,
            name=bidder_data["name"],
            created_at=datetime.utcnow() - timedelta(days=5),
        )
        db.add(bidder)
        db.flush()
        
        # Create evaluations for each criterion
        for crit_idx, (verdict, reason, confidence) in bidder_data["evaluations"].items():
            criterion = criteria[crit_idx]
            
            evaluation = CriterionEvaluation(
                id=uuid.uuid4(),
                evaluation_run_id=eval_run.id,
                bidder_id=bidder.id,
                criterion_id=criterion.id,
                verdict=verdict,
                confidence=confidence,
                reason=reason,
                created_at=datetime.utcnow() - timedelta(days=3),
            )
            db.add(evaluation)
            
            # Create review cases for FAIL and NEEDS_REVIEW verdicts
            if verdict in ("FAIL", "NEEDS_REVIEW"):
                review_case = ReviewCase(
                    id=uuid.uuid4(),
                    tender_id=tender.id,
                    bidder_id=bidder.id,
                    criterion_id=criterion.id,
                    status="OPEN",
                    reason=reason,
                    created_at=datetime.utcnow() - timedelta(days=2),
                )
                db.add(review_case)
    
    db.flush()
    print(f"    ✓ Created {len(MOCK_BIDDERS)} bidders with evaluations")
    
    # Count review cases
    review_count = db.execute(
        select(ReviewCase).where(ReviewCase.tender_id == tender.id)
    ).scalars().all()
    print(f"    ✓ Created {len(review_count)} review cases")
    
    return tender


def main():
    """Main seeding function."""
    print("=" * 70)
    print("Test_Tender Seeding Script")
    print("=" * 70)
    print()
    
    # Create database connection
    engine = create_engine(settings.internal_database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Get all agencies
        agencies = db.execute(select(AgencyWorkspace)).scalars().all()
        
        if not agencies:
            print("❌ No agencies found in the database.")
            print("   Please create at least one agency first.")
            return 1
        
        print(f"Found {len(agencies)} agency/agencies\n")
        
        # Create test tender for each agency
        created_count = 0
        skipped_count = 0
        
        for agency in agencies:
            tender = create_test_tender_for_agency(db, agency)
            if tender:
                # Check if it was newly created or existing
                existing = db.execute(
                    select(Tender).where(
                        Tender.agency_id == agency.id,
                        Tender.title == "Test_Tender"
                    )
                ).scalar_one_or_none()
                
                if existing and existing.created_at < datetime.utcnow() - timedelta(minutes=1):
                    skipped_count += 1
                else:
                    created_count += 1
            print()
        
        # Commit all changes
        db.commit()
        
        print("=" * 70)
        print("Summary")
        print("=" * 70)
        print(f"✓ Processed {len(agencies)} agencies")
        print(f"✓ Created {created_count} new Test_Tender(s)")
        if skipped_count > 0:
            print(f"⚠️  Skipped {skipped_count} existing Test_Tender(s)")
        print()
        print("Each Test_Tender includes:")
        print(f"  • {len(MOCK_CRITERIA)} evaluation criteria")
        print(f"  • {len(MOCK_BIDDERS)} bidders with complete evaluations")
        print(f"  • Multiple review cases for manual review")
        print()
        print("✓ All users in each agency can now access their Test_Tender!")
        
        return 0
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
