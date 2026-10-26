

**# Structa — Construction Management System**



\## Product Overview



\*\*Product Name:\*\* Structa

\*\*Product Type:\*\* Construction Management \& Project Operations SaaS

\*\*Company:\*\* Versaly

\*\*Target Market:\*\* Construction companies, contractors, developers, project managers, quantity surveyors, and construction firms.



\*\*Vision:\*\*



> Structa is the operating system for construction companies.



Structa should provide one centralized platform for managing construction projects, sites, teams, materials, contractors, budgets, procurement, expenses, progress, documents, and project performance.



The goal is to replace fragmented workflows involving spreadsheets, WhatsApp conversations, paper records, notebooks, disconnected accounting tools, and manually maintained project reports.



\---



\# 1. The Problem



Construction businesses commonly manage projects using a mixture of:



\* Excel/Google Sheets

\* WhatsApp

\* Paper site records

\* Manual quotations

\* Separate accounting systems

\* Emails

\* Physical documents

\* Individual project files

\* Manual material tracking

\* Phone calls between site and office



This creates problems such as:



\* Poor visibility across projects

\* Material losses

\* Uncontrolled expenses

\* Budget overruns

\* Delayed procurement

\* Difficulty tracking site progress

\* Poor contractor management

\* Inaccurate project costing

\* Missing documents

\* Poor communication between office and site

\* Difficulty determining project profitability

\* Delayed progress reporting

\* Limited accountability



Structa should bring these operations into one system.



\---



\# 2. Target Customers



\### Primary



\* Construction companies

\* General contractors

\* Building contractors

\* Civil contractors

\* Property developers

\* Construction project management firms



\### Secondary



\* Quantity surveyors

\* Site managers

\* Project managers

\* Specialist contractors

\* Renovation companies

\* Engineering/construction firms



\---



\# 3. Positioning



Structa should \*\*not\*\* be positioned simply as "construction project management software."



Preferred positioning:



> \*\*The operating system for construction companies.\*\*



Alternative:



> \*\*Plan projects. Control costs. Manage sites. Build better.\*\*



Another:



> \*\*From the office to the construction site, Structa keeps everything under control.\*\*



The core operational flow:



\*\*CLIENT → PROJECT → PLANNING → BUDGET → PROCUREMENT → MATERIALS → SITE → LABOUR → PROGRESS → COSTS → REPORTING → COMPLETION\*\*



\---



\# 4. Core Modules



Structa should eventually contain:



1\. Authentication \& Organization Management

2\. Dashboard

3\. Project Management

4\. Project Planning

5\. Sites

6\. Tasks \& Activities

7\. BOQ Management

8\. Budget Management

9\. Materials Management

10\. Suppliers

11\. Procurement

12\. Purchase Orders

13\. Labour \& Workforce

14\. Contractors \& Subcontractors

15\. Equipment Management

16\. Project Expenses

17\. Progress Tracking

18\. Site Reports

19\. Documents

20\. Client Management

21\. Invoicing

22\. Payments

23\. Project Changes / Variations

24\. Issues \& Risks

25\. Quality \& Inspections

26\. Safety Management

27\. Reports \& Analytics

28\. Notifications

29\. Activity \& Audit Logs

30\. Settings



The system should be modular so additional construction functionality can be introduced without rebuilding the foundation.



\---



\# 5. Multi-Tenant Architecture



Structa is designed as a SaaS platform.



Each construction company represents an \*\*Organization/Tenant\*\*.



Every organization should have isolated:



\* Projects

\* Sites

\* Users

\* Clients

\* Contractors

\* Suppliers

\* Materials

\* Budgets

\* Expenses

\* Purchase orders

\* Documents

\* Reports

\* Invoices

\* Payments



\*\*Tenant isolation is mandatory.\*\*



A user belonging to one organization must never be able to access another organization's data.



\---



\# 6. User Roles



Initial roles:



\### Super Admin



Versaly platform administrator.



\### Organization Owner



Full access to the company's Structa account.



\### Administrator



Manages company operations and users.



\### Project Manager



Manages assigned projects.



\### Site Manager



Manages day-to-day site operations.



\### Quantity Surveyor



Manages BOQs, quantities, costs, variations and valuations.



\### Procurement Officer



Manages suppliers and purchasing.



\### Accountant / Finance



Manages invoices, expenses and payments.



\### Site Staff



Records site activities, materials and progress.



\### Client



Optional future portal access.



Permissions should eventually be configurable.



\---



\# 7. Dashboard



The dashboard should provide an immediate overview of the company's construction operations.



\### Company-level metrics



\* Active Projects

\* Completed Projects

\* Delayed Projects

\* Total Contract Value

\* Total Project Budget

\* Actual Project Costs

\* Outstanding Client Payments

\* Supplier Payables

\* Current Month Expenses

\* Overall Project Profitability



\### Project indicators



\* Project progress

\* Budget utilization

\* Schedule status

\* Outstanding tasks

\* Material requirements

\* Pending procurement

\* Unresolved issues

\* Upcoming deadlines



\### Dashboard charts



\* Project cost vs budget

\* Project progress

\* Revenue by project

\* Expenses by category

\* Material expenditure

\* Labour expenditure

\* Project profitability

\* Procurement activity



Avoid excessive charts. Prioritize information that helps management make decisions.



\---



\# 8. Project Management



Projects are the central entity in Structa.



A project should contain:



\* Project name

\* Project code

\* Client

\* Project type

\* Location

\* Start date

\* Expected completion date

\* Contract value

\* Budget

\* Project manager

\* Site manager

\* Description

\* Status

\* Progress

\* Documents

\* Project phases



\### Project statuses



\* Planning

\* Active

\* On Hold

\* Delayed

\* Completed

\* Cancelled



\---



\# 9. Project Overview



Every project should have a dedicated command center.



It should display:



\* Project progress

\* Budget

\* Actual cost

\* Remaining budget

\* Contract value

\* Expected completion

\* Tasks

\* Procurement

\* Materials

\* Labour

\* Expenses

\* Documents

\* Issues

\* Site reports

\* Variations

\* Payments



The project dashboard should answer:



> "What is happening with this project right now?"



\---



\# 10. Project Phases



Projects can be divided into phases.



Example:



\*\*Project\*\*

→ Foundation

→ Structural Works

→ Roofing

→ Electrical

→ Plumbing

→ Finishing

→ External Works

→ Completion



Each phase can have:



\* Start date

\* End date

\* Budget

\* Tasks

\* Assigned team

\* Progress

\* Materials

\* Expenses

\* Status



\---



\# 11. Tasks \& Activities



Project managers should be able to create tasks.



Fields:



\* Task name

\* Project

\* Phase

\* Description

\* Assigned user

\* Start date

\* Due date

\* Priority

\* Status

\* Progress

\* Dependencies

\* Notes



Statuses:



\* Not Started

\* In Progress

\* Blocked

\* Completed



Tasks should support basic dependency relationships.



\---



\# 12. BOQ Management



A major construction-specific module.



Structa should support \*\*Bills of Quantities (BOQ)\*\*.



BOQ fields:



\* Item code

\* Description

\* Category

\* Unit

\* Quantity

\* Unit rate

\* Total amount

\* Project

\* Phase



Example:



| Item   | Unit | Quantity |  Rate | Total |

| ------ | ---: | -------: | ----: | ----: |

| Cement | Bags |      500 | KSh X | KSh X |

| Sand   |   m³ |       30 | KSh X | KSh X |

| Steel  |   kg |    2,000 | KSh X | KSh X |



The system should calculate:



\*\*Total = Quantity × Unit Rate\*\*



BOQ should form the foundation for project budgeting and cost tracking.



\---



\# 13. Budget Management



Each project should have a structured budget.



Budget categories can include:



\* Materials

\* Labour

\* Equipment

\* Transport

\* Subcontractors

\* Professional fees

\* Permits

\* Utilities

\* Miscellaneous



Track:



\*\*Budget → Committed Cost → Actual Cost → Remaining Budget\*\*



Example:



> Materials Budget: KSh 5,000,000

> Committed: KSh 3,200,000

> Actual: KSh 2,700,000

> Remaining: KSh 2,300,000



The system should flag potential overruns.



\---



\# 14. Materials Management



Construction materials should be tracked per project/site.



Examples:



\* Cement

\* Steel

\* Sand

\* Ballast

\* Bricks

\* Blocks

\* Timber

\* Tiles

\* Paint

\* Pipes

\* Electrical materials



Track:



\* Material

\* Quantity

\* Unit

\* Project

\* Site

\* Requested quantity

\* Ordered quantity

\* Received quantity

\* Used quantity

\* Remaining quantity

\* Wastage

\* Cost



\---



\# 15. Material Requests



Site teams should be able to submit material requests.



Flow:



\*\*Site → Material Request → Approval → Procurement → Purchase Order → Delivery → Receiving → Site Inventory\*\*



Statuses:



\* Draft

\* Submitted

\* Approved

\* Rejected

\* Ordered

\* Partially Received

\* Received

\* Cancelled



\---



\# 16. Material Receiving



When materials arrive at a site, staff should record:



\* Material

\* Ordered quantity

\* Received quantity

\* Damaged quantity

\* Missing quantity

\* Supplier

\* Delivery date

\* Delivery note

\* Received by

\* Notes



Inventory should update based on actual received quantities.



\---



\# 17. Suppliers



Supplier records should contain:



\* Company name

\* Contact person

\* Phone

\* Email

\* Address

\* Tax information

\* Payment terms

\* Bank/payment information

\* Supplied materials

\* Status



Supplier profile should display:



\* Purchase history

\* Orders

\* Payments

\* Outstanding balance

\* Materials supplied



\---



\# 18. Procurement



Procurement workflow:



\*\*Material Request → Approval → Supplier → Quotation → Purchase Order → Delivery → Receiving → Invoice → Payment\*\*



Purchase Orders should contain:



\* PO number

\* Supplier

\* Project

\* Site

\* Materials

\* Quantities

\* Unit prices

\* Discounts

\* Tax

\* Total

\* Expected delivery

\* Notes

\* Status



\---



\# 19. Labour \& Workforce



Track project workforce.



Workers may include:



\* Casual labour

\* Skilled workers

\* Foremen

\* Technicians

\* Operators

\* Site staff



Track:



\* Worker

\* Role

\* Project

\* Daily attendance

\* Hours/days worked

\* Rate

\* Labour cost

\* Payment status



Future versions may include payroll integration.



\---



\# 20. Contractors \& Subcontractors



Track subcontractors separately from employees.



Examples:



\* Electrical contractor

\* Plumbing contractor

\* Roofing contractor

\* Masonry contractor

\* Painting contractor



Record:



\* Company

\* Contact

\* Specialization

\* Contract value

\* Project

\* Start/end dates

\* Payment terms

\* Performance

\* Outstanding balance



\---



\# 21. Equipment Management



Track construction equipment.



Examples:



\* Excavators

\* Concrete mixers

\* Trucks

\* Cranes

\* Generators

\* Compactors

\* Scaffolding



Record:



\* Equipment

\* Type

\* Ownership

\* Project

\* Operator

\* Availability

\* Usage

\* Maintenance

\* Cost



Future functionality can include equipment rental management and maintenance scheduling.



\---



\# 22. Project Expenses



Record expenses against projects.



Categories:



\* Materials

\* Labour

\* Transport

\* Fuel

\* Equipment

\* Subcontractors

\* Permits

\* Utilities

\* Accommodation

\* Meals

\* Miscellaneous



Each expense should include:



\* Project

\* Category

\* Amount

\* Date

\* Description

\* Payment method

\* Reference

\* User

\* Attachment



Every project expense should affect project cost calculations.



\---



\# 23. Progress Tracking



Project managers should record progress.



Track:



\* Overall project progress

\* Phase progress

\* Task progress

\* Milestones

\* Planned vs actual progress



Example:



\*\*Foundation\*\*



Planned: 80%

Actual: 65%



Structa should identify projects that are falling behind schedule.



\---



\# 24. Site Reports



Site managers should create daily/weekly site reports.



A report can contain:



\* Project

\* Site

\* Date

\* Weather

\* Workers present

\* Work completed

\* Work planned

\* Materials received

\* Equipment used

\* Issues

\* Safety incidents

\* Photos

\* Notes

\* Submitted by



Reports should become part of the project's permanent history.



\---



\# 25. Site Photos



Site reports should support photo uploads.



Photos can document:



\* Construction progress

\* Materials

\* Defects

\* Completed work

\* Site conditions

\* Deliveries

\* Issues



Photos should include:



\* Project

\* Site

\* Report

\* Date

\* Uploaded by

\* Optional description



\---



\# 26. Client Management



Clients should have profiles containing:



\* Name/company

\* Contact

\* Phone

\* Email

\* Address

\* Projects

\* Contract value

\* Payments

\* Outstanding balance

\* Documents



Future versions can provide clients with a dedicated portal.



\---



\# 27. Invoicing



Projects should support invoices.



Invoice fields:



\* Invoice number

\* Project

\* Client

\* Invoice date

\* Due date

\* Description

\* Amount

\* Tax

\* Total

\* Paid

\* Balance

\* Status



Statuses:



\* Draft

\* Issued

\* Partially Paid

\* Paid

\* Overdue

\* Cancelled



\---



\# 28. Payments



Payment records should support:



\* Cash

\* Bank

\* M-Pesa

\* Card

\* Other



Record:



\* Payment number

\* Project

\* Client/supplier

\* Invoice

\* Amount

\* Method

\* Reference

\* Date

\* Recorded by

\* Notes



M-Pesa should remain modular rather than being hardcoded into the core financial architecture.



\---



\# 29. Project Variations



Construction projects frequently change after work begins.



Structa should support:



\* Variation number

\* Project

\* Description

\* Reason

\* Original amount

\* Variation amount

\* Revised amount

\* Approval status

\* Requested by

\* Approved by

\* Date

\* Documents



Statuses:



\* Draft

\* Submitted

\* Under Review

\* Approved

\* Rejected



Approved variations should update relevant project financial information.



\---



\# 30. Issues \& Risks



Projects should maintain an issue/risk register.



Fields:



\* Issue

\* Project

\* Category

\* Description

\* Severity

\* Responsible person

\* Due date

\* Status

\* Resolution

\* Attachments



Examples:



\* Material delay

\* Labour shortage

\* Design issue

\* Budget concern

\* Weather disruption

\* Safety issue

\* Supplier problem



\---



\# 31. Quality \& Inspections



Future-ready quality module.



Support:



\* Inspection records

\* Inspection type

\* Project

\* Location

\* Inspector

\* Date

\* Result

\* Defects

\* Corrective action

\* Photos

\* Approval



Statuses:



\* Pending

\* Passed

\* Failed

\* Requires Correction



\---



\# 32. Safety Management



Support construction safety records.



Track:



\* Safety inspections

\* Safety observations

\* Incidents

\* Corrective actions

\* Site safety notes

\* Responsible staff

\* Dates

\* Attachments



Safety functionality should remain operational and record-based rather than attempting to replace specialized safety compliance systems.



\---



\# 33. Documents



Projects should have centralized document storage.



Examples:



\* Contracts

\* BOQs

\* Architectural drawings

\* Structural drawings

\* Quotations

\* Purchase orders

\* Invoices

\* Delivery notes

\* Site reports

\* Inspection documents

\* Certificates

\* Permits

\* Variation documents



Documents should be linked to relevant projects/entities.



\---



\# 34. Project Financial Overview



Each project should provide a financial summary:



\*\*Contract Value\*\*



minus



\*\*Project Costs\*\*



equals



\*\*Gross Project Profit\*\*



Also show:



\* Original budget

\* Revised budget

\* Actual costs

\* Committed costs

\* Remaining budget

\* Revenue

\* Payments received

\* Outstanding amount

\* Profit

\* Profit margin



\---



\# 35. Reporting \& Analytics



Reports should cover:



\### Projects



\* Active projects

\* Completed projects

\* Delayed projects

\* Project progress

\* Project profitability



\### Financial



\* Revenue

\* Expenses

\* Project costs

\* Budget vs actual

\* Profitability

\* Receivables

\* Payables



\### Procurement



\* Purchase orders

\* Supplier spending

\* Material purchases

\* Pending procurement



\### Materials



\* Material usage

\* Material costs

\* Wastage

\* Material requirements



\### Labour



\* Workforce

\* Attendance

\* Labour costs

\* Labour allocation



\### Site



\* Site reports

\* Progress

\* Issues

\* Inspections



Reports should support:



\* Date filtering

\* Project filtering

\* Category filtering

\* Status filtering

\* Export



\---



\# 36. Notifications



Structa should generate persistent in-app notifications for events such as:



\* New material request

\* Material request approved

\* Purchase order approved

\* Material delivery received

\* Project deadline approaching

\* Project delayed

\* Budget threshold exceeded

\* Invoice overdue

\* Payment received

\* New site report

\* New issue

\* Variation submitted

\* Variation approved

\* Inspection failed



Future integrations:



\* Email

\* SMS

\* WhatsApp



\---



\# 37. Search \& Filtering



Global/search functionality should support:



\* Projects

\* Clients

\* Suppliers

\* Materials

\* Purchase orders

\* Invoices

\* Payments

\* Workers

\* Contractors

\* Equipment

\* Site reports

\* Documents



Tables should support:



\* Search

\* Filters

\* Sorting

\* Pagination

\* Date ranges

\* Status filters



\---



\# 38. Audit Logs



Important actions should be recorded.



Each audit event should contain:



\* User

\* Action

\* Entity

\* Entity ID

\* Timestamp

\* Previous value

\* New value



Examples:



> John approved Purchase Order #PO-1042.



> Mary changed Project Alpha's budget.



> David recorded a KSh 45,000 project expense.



Historical financial and operational records should not be silently overwritten.



\---



\# 39. Settings



\### Business Settings



\* Company name

\* Logo

\* Address

\* Phone

\* Email

\* Tax information

\* Currency

\* Timezone



\### Project Settings



\* Project numbering

\* Default statuses

\* Progress settings



\### Financial Settings



\* Tax

\* Payment terms

\* Invoice numbering



\### Document Settings



\* Logo

\* Document branding

\* Numbering



\### User Settings



\* Roles

\* Permissions



\---



\# 40. UI/UX Direction



Structa should feel like a \*\*premium construction operations platform\*\*.



Design principles:



\* Professional

\* Strong information hierarchy

\* Clean dashboards

\* Fast navigation

\* Data-dense where appropriate

\* Responsive

\* Minimal unnecessary animation

\* Clear statuses

\* Strong tables

\* Useful filters

\* Excellent empty/loading/error states



Avoid:



\* Consumer-app styling

\* Excessive gradients

\* Excessive animations

\* Huge decorative dashboards

\* Unnecessary charts

\* Cluttered interfaces



The interface should feel appropriate for a construction company managing projects worth millions of shillings.



\---



\# 41. Suggested Navigation



```text

Dashboard



Projects

&#x20; All Projects

&#x20; Active Projects

&#x20; Completed Projects



Operations

&#x20; Tasks

&#x20; Site Reports

&#x20; Progress

&#x20; Issues

&#x20; Inspections



Materials

&#x20; Materials

&#x20; Material Requests

&#x20; Site Stock



Procurement

&#x20; Suppliers

&#x20; Purchase Orders

&#x20; Receiving



People

&#x20; Workforce

&#x20; Contractors



Equipment

&#x20; Equipment

&#x20; Maintenance



Finance

&#x20; Budgets

&#x20; Expenses

&#x20; Invoices

&#x20; Payments



Documents



Reports



Notifications



Settings

```



Navigation can be refined during implementation.



\---



\# 42. Mobile Strategy



Construction staff frequently operate away from the office.



The application should therefore be responsive and \*\*PWA-ready\*\*.



Mobile priorities:



\* Site reports

\* Project lookup

\* Task updates

\* Material requests

\* Material receiving

\* Progress updates

\* Photo uploads

\* Issue reporting

\* Worker attendance

\* Delivery confirmation



A native mobile application is not required initially.



\---



\# 43. Offline Readiness



Construction sites may have unreliable connectivity.



The architecture should therefore avoid making future offline functionality impossible.



Future PWA functionality may support:



\* Offline site reports

\* Offline task updates

\* Offline photos

\* Offline material records

\* Synchronization when connectivity returns



Do not over-engineer offline functionality during the MVP.



\---



\# 44. Financial \& Construction Integrity



Financial and project-cost operations should be transaction-safe.



For example:



```text

CREATE EXPENSE

&#x20;     ↓

VALIDATE PROJECT

&#x20;     ↓

CREATE EXPENSE RECORD

&#x20;     ↓

UPDATE PROJECT COST

&#x20;     ↓

UPDATE FINANCIAL SUMMARY

&#x20;     ↓

CREATE AUDIT LOG

&#x20;     ↓

COMMIT

```



If an operation fails, the entire transaction should roll back.



Critical calculations should happen server-side.



\---



\# 45. Architecture



Conceptual architecture:



```text

Frontend

&#x20;  ↓

API / Server Actions

&#x20;  ↓

Business Logic / Services

&#x20;  ↓

Database

```



Recommended service separation:



```text

ProjectService

BudgetService

InventoryService

ProcurementService

ExpenseService

InvoiceService

PaymentService

ProgressService

NotificationService

ReportingService

DocumentService

```



The exact architecture may be adapted by the coding agent after inspecting the project.



Business logic should not be scattered throughout UI components.



\---



\# 46. Technology Direction



Structa should be built as a modern web application.



Requirements:



\* Modern frontend framework

\* Type-safe development where practical

\* Relational database

\* ORM

\* Responsive UI

\* API-ready architecture

\* Cloud deployment

\* Environment-based configuration

\* Production-grade database



The system should be deployable to:



\*\*Vercel or equivalent cloud infrastructure.\*\*



SQLite may be acceptable during early local development, but production should use an appropriate cloud relational database.



\---



\# 47. SaaS Readiness



Structa should eventually support subscription plans.



Potential plans:



\### Starter



Small contractors.



\### Business



Growing construction companies.



\### Professional



Larger companies managing multiple projects.



\### Enterprise



Large construction organizations.



Potential limits:



\* Users

\* Active projects

\* Storage

\* Documents

\* Projects

\* Sites

\* Reports

\* Integrations



Billing should not complicate the MVP.



\---



\# 48. Kenya-First Considerations



Structa should be designed to work well for Kenyan construction businesses.



Important considerations:



\* KSh currency

\* M-Pesa payments

\* Local supplier management

\* Tax/VAT fields

\* Mobile-first site operations

\* WhatsApp communication workflows

\* PDF documents

\* Local date/time handling

\* Poor-connectivity considerations



Future integrations may include:



\* M-Pesa

\* WhatsApp

\* SMS

\* Email

\* Accounting software

\* Google Maps

\* Payment gateways



\---



\# 49. Future Integrations



Architecture should leave room for:



\* M-Pesa

\* WhatsApp

\* Email

\* SMS

\* Accounting platforms

\* Google Maps

\* Cloud storage

\* E-signatures

\* Payment gateways



Integrations should be modular.



\---



\# 50. Advanced Future Features



Once the core platform is stable, Structa could eventually introduce:



\### AI Construction Forecasting



Predict:



\* Cost overruns

\* Project delays

\* Material requirements

\* Procurement needs



\### Automated Procurement



System detects:



> Material requirement approaching → generate procurement recommendation.



\### Construction Timeline Intelligence



Compare:



\*\*Planned Progress vs Actual Progress\*\*



and identify projects likely to miss deadlines.



\### Client Portal



Clients could:



\* View project progress

\* View documents

\* View invoices

\* View payments

\* View project photos

\* Review variations

\* Receive updates



\### Contractor Portal



Subcontractors could:



\* Receive assignments

\* Submit progress

\* Submit invoices

\* Upload documents

\* View payments



\### Advanced Cost Control



Track:



\*\*BOQ → Purchase → Delivery → Usage → Actual Cost → Variance\*\*



\---



\# 51. MVP Scope



Do \*\*not\*\* build every module simultaneously.



The first usable MVP should focus on:



```text

Authentication

&#x20;     ↓

Organization

&#x20;     ↓

Users \& Roles

&#x20;     ↓

Projects

&#x20;     ↓

Project Phases

&#x20;     ↓

Tasks

&#x20;     ↓

BOQ

&#x20;     ↓

Budgets

&#x20;     ↓

Materials

&#x20;     ↓

Suppliers

&#x20;     ↓

Procurement

&#x20;     ↓

Expenses

&#x20;     ↓

Progress

&#x20;     ↓

Site Reports

&#x20;     ↓

Dashboard

```



The MVP should allow a real construction company to create a project and actually manage its operational lifecycle.



\---



\# 52. Recommended Development Phases



\### Phase 1 — Foundation



\* Project setup

\* Database

\* Authentication

\* Organizations

\* Users

\* Roles

\* Permissions foundation

\* Application shell

\* Navigation

\* UI system



\### Phase 2 — Projects \& Project Structure



\* Projects

\* Clients

\* Project phases

\* Project dashboard

\* Project statuses

\* Project team



\### Phase 3 — Tasks \& Planning



\* Tasks

\* Milestones

\* Assignments

\* Deadlines

\* Progress

\* Task statuses



\### Phase 4 — BOQ \& Budget Management



\* BOQs

\* BOQ items

\* Cost calculations

\* Project budgets

\* Budget categories

\* Budget vs actual foundation



\### Phase 5 — Materials \& Suppliers



\* Materials

\* Categories

\* Suppliers

\* Material requirements

\* Site stock

\* Material tracking



\### Phase 6 — Procurement



\* Material requests

\* Approvals

\* Purchase orders

\* Receiving

\* Supplier balances

\* Procurement workflow



\### Phase 7 — Workforce \& Contractors



\* Employees/workers

\* Attendance

\* Labour costs

\* Contractors

\* Subcontractors

\* Contractor assignments



\### Phase 8 — Site Operations



\* Site reports

\* Photos

\* Daily activities

\* Progress updates

\* Issues

\* Site events



\### Phase 9 — Expenses, Invoicing \& Payments



\* Expenses

\* Invoices

\* Payments

\* Project financials

\* Receivables

\* Payables



\### Phase 10 — Variations, Quality \& Safety



\* Project variations

\* Approvals

\* Inspections

\* Defects

\* Safety records

\* Corrective actions



\### Phase 11 — Reports \& Analytics



\* Project reports

\* Cost reports

\* Procurement reports

\* Material reports

\* Labour reports

\* Profitability

\* Progress analytics



\### Phase 12 — Notifications \& Automation



\* In-app notifications

\* Deadline alerts

\* Budget alerts

\* Procurement alerts

\* Overdue invoices

\* Project delay alerts



\### Phase 13 — Security \& Production Hardening



\* RBAC enforcement

\* Tenant isolation testing

\* Validation

\* Audit logging

\* Error handling

\* Performance

\* Security review

\* File security



\### Phase 14 — Deployment



\* Production database

\* Environment variables

\* Deployment

\* Domain

\* Backups

\* Monitoring

\* Error tracking

\* Production testing



\### Phase 15 — SaaS \& Commercialization



\* Subscription plans

\* Usage limits

\* Trial system

\* Billing

\* Organization onboarding

\* Subscription management



\---



\# 53. Demo / Seed Data



The system should include realistic demo data.



Example organization:



\*\*Summit Build Contractors Ltd.\*\*



Example projects:



\* Riverside Apartments

\* Westlands Commercial Centre

\* Karen Residence

\* Industrial Warehouse



Example project phases:



\* Site Preparation

\* Foundation

\* Structural Works

\* Roofing

\* Electrical

\* Plumbing

\* Finishing



Include realistic:



\* BOQs

\* Budgets

\* Suppliers

\* Materials

\* Purchase orders

\* Expenses

\* Tasks

\* Site reports

\* Progress records

\* Invoices

\* Payments



The dashboard should look meaningful immediately after installation.



\---



\# 54. End-to-End Demo Scenario



The complete system should eventually support this workflow:



```text

1\. Admin creates organization

&#x20;       ↓

2\. Admin creates project

&#x20;       ↓

3\. Client is assigned

&#x20;       ↓

4\. Project phases are created

&#x20;       ↓

5\. BOQ is entered

&#x20;       ↓

6\. Project budget is established

&#x20;       ↓

7\. Site manager creates material request

&#x20;       ↓

8\. Procurement approves request

&#x20;       ↓

9\. Purchase order is created

&#x20;       ↓

10\. Supplier delivers materials

&#x20;       ↓

11\. Site receives materials

&#x20;       ↓

12\. Material records update

&#x20;       ↓

13\. Workers perform construction activities

&#x20;       ↓

14\. Site manager submits progress report

&#x20;       ↓

15\. Expenses are recorded

&#x20;       ↓

16\. Project progress updates

&#x20;       ↓

17\. Budget vs actual updates

&#x20;       ↓

18\. Client invoice is generated

&#x20;       ↓

19\. Client payment is recorded

&#x20;       ↓

20\. Project financials update

&#x20;       ↓

21\. Management dashboard updates

&#x20;       ↓

22\. Reports reflect the activity

```



This end-to-end workflow should work before advanced features are prioritized.



\---



\# 55. Design Direction



Structa should communicate:



\*\*Strength + Precision + Control + Professionalism\*\*



Visual direction:



\* Premium

\* Industrial

\* Modern

\* Professional

\* Structured

\* Data-driven

\* Trustworthy



The interface should feel like software built for a company managing serious construction projects—not a generic task-management application.



\---



\# 56. Versaly Product Branding



Structa is a Versaly product.



Suggested presentation:



> \*\*VERSALY presents\*\*

> \*\*STRUCTA\*\*

> Construction Management System



Potential tagline:



> \*\*Plan. Build. Control.\*\*



Alternative:



> \*\*Construction management, structured.\*\*



The Structa identity should have its own visual personality while maintaining some design consistency with other Versaly products such as Operra and Melio.



\---



\# 57. Success Criteria



Structa should allow a construction company to answer, from one system:



\* What projects are active?

\* How far along is each project?

\* What is each project worth?

\* What is each project's budget?

\* How much has been spent?

\* Are we exceeding budget?

\* What materials are required?

\* What materials have been received?

\* What materials have been used?

\* Who are our suppliers?

\* What have we purchased?

\* What do we owe suppliers?

\* What do clients owe us?

\* How much labour is being used?

\* What contractors are working on each project?

\* What happened on site today?

\* What problems are delaying the project?

\* What variations have been approved?

\* Are projects profitable?

\* Which projects require management attention?



If Structa can answer these questions reliably, it is functioning as a true \*\*construction operating system\*\*, rather than merely a project-management application.



\---



\# 58. Long-Term Vision



Structa should eventually become a comprehensive platform for construction companies:



```text

STRUCTA

│

├── PROJECTS

├── PLANNING

├── BOQ

├── BUDGETS

├── MATERIALS

├── PROCUREMENT

├── SUPPLIERS

├── WORKFORCE

├── CONTRACTORS

├── EQUIPMENT

├── SITE OPERATIONS

├── PROGRESS

├── QUALITY

├── SAFETY

├── FINANCE

├── DOCUMENTS

├── REPORTING

├── CLIENT PORTAL

└── INTEGRATIONS

```



The ultimate goal is:



> \*\*STRUCTA — The operating system for construction companies.\*\*



\---



\# 59. Development Philosophy



The coding agent should follow these principles:



\* Read the entire project specification before development.

\* Work only on the assigned phase.

\* Inspect the existing codebase before making architectural decisions.

\* Preserve existing functionality.

\* Build real functionality rather than mock screens.

\* Important data must persist in the database.

\* Validate data server-side.

\* Maintain strict tenant isolation.

\* Use database transactions for critical operations.

\* Keep business logic separate from UI.

\* Avoid unnecessary dependencies.

\* Avoid over-engineering future features.

\* Build reusable components and services.

\* Provide proper loading, empty, success and error states.

\* Make interfaces responsive.

\* Use realistic demo data.

\* Test the current phase before declaring it complete.

\* Perform regression checks so previous functionality remains operational.

\* Leave sensible extension points for M-Pesa, WhatsApp, SMS, accounting and other integrations.



\---



\# 60. Final Product Goal



\*\*Structa\*\* should become a polished, commercially viable construction management platform that Versaly can demonstrate and eventually sell to construction companies, contractors and developers.



It should manage the operational flow from:



> \*\*Project → Plan → Budget → Procure → Receive → Build → Track → Spend → Report → Complete\*\*



\*\*Built by Versaly.\*\*



