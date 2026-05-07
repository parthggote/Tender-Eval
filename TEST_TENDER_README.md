# Test_Tender - Mock Data Documentation

## Overview

A "Test_Tender" has been created for every agency in the system. This provides a complete, realistic demonstration of the tender evaluation platform with all features populated.

## What Was Created

### ✅ Successfully Seeded

- **9 agencies** now have a Test_Tender
- Each Test_Tender includes:
  - **10 evaluation criteria** (mix of mandatory and optional)
  - **4 bidders** with complete submissions
  - **40 evaluations** (10 criteria × 4 bidders)
  - **10 review cases** requiring manual review
  - Complete audit trail with timestamps

### Tender Details

**Title**: Test_Tender  
**Reference**: TEST-2026-001  
**Status**: EVALUATION_COMPLETE  
**Description**: Demonstration tender with complete mock data including criteria, bidders, and evaluations

## Mock Criteria (10 Total)

The Test_Tender includes realistic procurement criteria across different types:

### Mandatory Criteria (7)

1. **ISO 9001:2015 Certification** (CERTIFICATION)
   - Bidder must have Quality Management System certification

2. **Experience Requirement** (TECHNICAL)
   - Minimum 5 years in government procurement projects

3. **Financial Threshold** (FINANCIAL)
   - Annual revenue must exceed $1,000,000 USD

4. **Insurance Coverage** (COMPLIANCE)
   - Professional liability insurance minimum $2,000,000

5. **Project Management** (TECHNICAL)
   - At least 3 certified project managers (PMP or equivalent)

6. **Labor Compliance** (COMPLIANCE)
   - Compliance with local labor laws and regulations

7. **Financial Stability** (FINANCIAL)
   - No bankruptcy filings in past 5 years

### Optional Criteria (3)

8. **Cloud Experience** (TECHNICAL)
   - Demonstrated experience with AWS, Azure, or GCP

9. **24/7 Support** (TECHNICAL)
   - Proposed solution includes round-the-clock technical support

10. **Environmental Certification** (CERTIFICATION)
    - ISO 14001 or equivalent environmental compliance

## Mock Bidders (4 Total)

### 1. TechCorp Solutions Inc. ⭐ (Top Performer)
- **Overall**: Excellent - Passes all criteria
- **Strengths**: 
  - 8 years experience
  - $5.2M annual revenue
  - 5 PMP-certified PMs
  - Full compliance across all areas
- **Evaluations**: 10/10 PASS
- **Review Cases**: 0

### 2. Global Systems Ltd. ⚠️ (Needs Review)
- **Overall**: Good with concerns
- **Strengths**: 
  - Valid certifications
  - 6 years experience
  - $2.8M revenue
- **Issues**:
  - Insurance coverage below threshold ($1.5M vs $2M required)
  - Only 2 PMP certifications (third has PRINCE2)
  - No 24/7 support
  - Missing environmental certification
- **Evaluations**: 6 PASS, 2 FAIL, 2 NEEDS_REVIEW
- **Review Cases**: 4

### 3. Innovative Partners Co. ⚠️ (Borderline)
- **Overall**: Meets most requirements with gaps
- **Strengths**:
  - Valid ISO 9001:2015
  - $1.8M revenue
  - 4 PMP-certified PMs
- **Issues**:
  - 4.5 years experience (slightly below 5-year requirement)
  - Limited cloud experience
  - No 24/7 support offered
  - No formal environmental certification
- **Evaluations**: 6 PASS, 1 FAIL, 3 NEEDS_REVIEW
- **Review Cases**: 4

### 4. Premier Consulting Group ❌ (Critical Issue)
- **Overall**: Strong experience but certification expired
- **Strengths**:
  - 12 years extensive experience
  - $4.5M revenue
  - 6 certified PMs
  - Multi-cloud expertise
  - 24/7 support
- **Critical Issue**:
  - **ISO 9001 certificate expired 6 months ago** (mandatory requirement)
- **Minor Issue**:
  - Some labor documentation pending
- **Evaluations**: 8 PASS, 1 FAIL, 1 NEEDS_REVIEW
- **Review Cases**: 2

## Review Cases (10 Total)

The system automatically created review cases for all FAIL and NEEDS_REVIEW verdicts:

| Bidder | FAIL | NEEDS_REVIEW | Total Cases |
|--------|------|--------------|-------------|
| TechCorp Solutions | 0 | 0 | 0 |
| Global Systems | 2 | 2 | 4 |
| Innovative Partners | 1 | 3 | 4 |
| Premier Consulting | 1 | 1 | 2 |

## Evaluation Timeline

- **Day -7**: Tender created
- **Day -6**: Criteria extraction completed (10 criteria)
- **Day -5**: Bidders submitted proposals
- **Day -3**: AI evaluation completed (40 evaluations)
- **Day -2**: Review cases generated
- **Today**: Available for review and decision-making

## Use Cases

This Test_Tender demonstrates:

### 1. **Criteria Management**
- View extracted criteria
- See different criterion types (FINANCIAL, TECHNICAL, COMPLIANCE, CERTIFICATION)
- Understand mandatory vs optional requirements

### 2. **Bidder Comparison**
- Compare 4 bidders side-by-side
- See evaluation results across all criteria
- Identify top performers and concerns

### 3. **Review Queue**
- 10 cases requiring manual review
- Mix of FAIL and NEEDS_REVIEW verdicts
- Practice making review decisions

### 4. **Evaluation Details**
- View AI-generated reasons for each verdict
- See confidence scores (0.0-1.0)
- Understand evidence-based evaluation

### 5. **Audit Trail**
- Complete history of all actions
- Timestamps for each stage
- Model information (gemini-2.0-flash)

## Accessing Test_Tender

1. **Log in** to the officer portal
2. **Select your agency** from the dashboard
3. **Navigate to Tenders** section
4. **Find "Test_Tender"** (Reference: TEST-2026-001)
5. **Explore** criteria, bidders, and evaluations

## Key Features to Explore

### Dashboard View
- Tender status: EVALUATION_COMPLETE
- Quick stats: 10 criteria, 4 bidders, 10 review cases

### Criteria Tab
- All 10 extracted criteria
- Type, mandatory status, thresholds
- Source page references

### Bidders Tab
- 4 bidders with complete profiles
- Evaluation summaries
- Pass/Fail/Review counts

### Review Queue
- 10 open cases
- Bidder and criterion details
- AI reasoning and confidence

### Evaluation Details
- Criterion-by-criterion breakdown
- Evidence and reasoning
- Confidence scores

## Realistic Scenarios

The mock data includes realistic scenarios you might encounter:

1. **Perfect Bidder**: TechCorp passes everything
2. **Insurance Gap**: Global Systems has insufficient coverage
3. **Experience Shortfall**: Innovative Partners slightly below threshold
4. **Expired Certification**: Premier Consulting's critical compliance issue
5. **Alternative Certifications**: PRINCE2 vs PMP debate
6. **Partial Compliance**: Environmental policies without formal certification

## Data Integrity

All data is:
- ✅ Consistent across relationships
- ✅ Properly timestamped
- ✅ Linked with foreign keys
- ✅ Includes realistic confidence scores
- ✅ Has meaningful evaluation reasons

## Re-running the Seed Script

To create Test_Tender for new agencies:

```bash
python seed_test_tender_standalone.py
```

The script will:
- ✅ Skip existing Test_Tenders
- ✅ Create new ones for agencies without them
- ✅ Show a summary of actions taken

## Cleanup (Optional)

To remove Test_Tenders:

```sql
-- Delete all Test_Tenders and related data
DELETE FROM tender WHERE title = 'Test_Tender';
```

Note: Cascading deletes will remove all related criteria, bidders, evaluations, and review cases.

## Technical Details

### Database Tables Populated

- `tender` - 1 per agency
- `criterion_extraction_run` - 1 per tender
- `criterion` - 10 per tender
- `bidder` - 4 per tender
- `evaluation_run` - 1 per tender
- `criterion_evaluation` - 40 per tender (10 × 4)
- `review_case` - 10 per tender (varies by bidder performance)

### Total Records Created

For 9 agencies:
- 9 tenders
- 9 extraction runs
- 90 criteria
- 36 bidders
- 9 evaluation runs
- 360 evaluations
- 90 review cases

**Total: ~603 database records**

## Support

If you encounter any issues with the Test_Tender:

1. Check that your user has access to the agency
2. Verify the tender appears in the tenders list
3. Ensure evaluation_run status is "SUCCEEDED"
4. Check browser console for any errors

## Next Steps

After exploring Test_Tender:

1. **Create a real tender** with actual documents
2. **Upload bidder submissions** for evaluation
3. **Run AI evaluation** on real data
4. **Make review decisions** on flagged cases
5. **Export reports** for stakeholders

---

**Created**: May 7, 2026  
**Script**: `seed_test_tender_standalone.py`  
**Status**: ✅ Successfully seeded for all agencies
