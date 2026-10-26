import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_ROLE_PERMISSIONS, UserRole } from "../src/lib/rbac";

const prisma = new PrismaClient();

export async function ensureSeedData() {
  let summitOrg = await prisma.organization.findUnique({
    where: { slug: "summit-build-contractors" },
  });

  const passwordHash = await bcrypt.hash("Structa@2026", 10);

  if (!summitOrg) {
    // 1. Primary Demo Organization: Summit Build Contractors Ltd. (Section 53)
    summitOrg = await prisma.organization.create({
      data: {
        name: "Summit Build Contractors Ltd.",
        slug: "summit-build-contractors",
        code: "SBC-KE",
        address: "Delta Corner Annex, 7th Floor, Ring Road Westlands",
        city: "Nairobi",
        country: "Kenya",
        phone: "+254 709 442 100",
        email: "operations@summitbuild.co.ke",
        website: "https://summitbuild.co.ke",
        taxPin: "P051489231K",
        ncaRegistration: "NCA-1 (Building, Civil & Structural Works)",
        vatRate: 16.0,
        currency: "KSh",
        timezone: "Africa/Nairobi",
        projectPrefix: "SBC-PRJ-",
        defaultProjectStatus: "PLANNING",
        progressCalcMethod: "PHASE_WEIGHTED",
        invoicePrefix: "SBC-INV-",
        poPrefix: "SBC-PO-",
        mrPrefix: "SBC-MR-",
        defaultPaymentTerms: "Net 30 Days",
        documentHeaderNote:
          "NCA Category 1 Registered Building & Civil Engineering Contractors",
        documentFooterNote:
          "All Purchase Orders, BOQ Valuations, and Site Certificates require authorized Structa digital sign-off.",
        brandingAccentColor: "#f98b07",
        plan: "ENTERPRISE",
        status: "ACTIVE",
      },
    });

    const roleEntries = Object.entries(DEFAULT_ROLE_PERMISSIONS) as [
      UserRole,
      string[],
    ][];
    for (const [role, perms] of roleEntries) {
      await prisma.rolePermission.create({
        data: {
          organizationId: summitOrg.id,
          role,
          permissionsJson: JSON.stringify(perms),
        },
      });
    }

    const usersData = [
      {
        name: "Eng. David Kamau",
        email: "david.kamau@summitbuild.co.ke",
        phone: "+254 722 310 401",
        jobTitle: "Managing Director & Principal Engineer",
        department: "Executive Management",
        employeeCode: "SBC-001",
        role: "ORGANIZATION_OWNER",
        status: "ACTIVE",
      },
      {
        name: "Grace Wanjiku",
        email: "grace.wanjiku@summitbuild.co.ke",
        phone: "+254 733 884 190",
        jobTitle: "Head of Operations & Systems Admin",
        department: "Operations & Administration",
        employeeCode: "SBC-002",
        role: "ADMINISTRATOR",
        status: "ACTIVE",
      },
      {
        name: "Eng. Brian Ochieng",
        email: "brian.ochieng@summitbuild.co.ke",
        phone: "+254 711 540 922",
        jobTitle: "Senior Project Manager (Riverside & Westlands)",
        department: "Project Management",
        employeeCode: "SBC-004",
        role: "PROJECT_MANAGER",
        status: "ACTIVE",
      },
      {
        name: "QS Mary Njoroge",
        email: "mary.njoroge@summitbuild.co.ke",
        phone: "+254 720 671 334",
        jobTitle: "Chief Quantity Surveyor",
        department: "Commercial & Cost Control",
        employeeCode: "SBC-007",
        role: "QUANTITY_SURVEYOR",
        status: "ACTIVE",
      },
      {
        name: "Peter Mwangi",
        email: "peter.mwangi@summitbuild.co.ke",
        phone: "+254 725 901 218",
        jobTitle: "Senior Site Agent — Riverside Apartments",
        department: "Site Operations",
        employeeCode: "SBC-011",
        role: "SITE_MANAGER",
        status: "ACTIVE",
      },
      {
        name: "John Mutua",
        email: "john.mutua@summitbuild.co.ke",
        phone: "+254 714 223 780",
        jobTitle: "Procurement & Supply Chain Lead",
        department: "Procurement & Logistics",
        employeeCode: "SBC-014",
        role: "PROCUREMENT_OFFICER",
        status: "ACTIVE",
      },
      {
        name: "CPA Faith Chebet",
        email: "faith.chebet@summitbuild.co.ke",
        phone: "+254 728 490 112",
        jobTitle: "Project Accountant & Finance Lead",
        department: "Finance & Accounts",
        employeeCode: "SBC-018",
        role: "ACCOUNTANT",
        status: "ACTIVE",
      },
      {
        name: "Samuel Kiprop",
        email: "samuel.kiprop@summitbuild.co.ke",
        phone: "+254 719 332 845",
        jobTitle: "General Site Foreman & Storekeeper",
        department: "Site Operations",
        employeeCode: "SBC-025",
        role: "SITE_STAFF",
        status: "ACTIVE",
      },
      {
        name: "Arch. Victoria Mutuku",
        email: "client@oaklanddevs.co.ke",
        phone: "+254 721 600 900",
        jobTitle: "Client Representative (Oakland Developers)",
        department: "External Client",
        employeeCode: "EXT-CLI-01",
        role: "CLIENT",
        status: "ACTIVE",
      },
    ];

    for (const u of usersData) {
      await prisma.user.create({
        data: {
          organizationId: summitOrg.id,
          name: u.name,
          email: u.email,
          passwordHash,
          phone: u.phone,
          jobTitle: u.jobTitle,
          department: u.department,
          employeeCode: u.employeeCode,
          role: u.role,
          status: u.status,
          lastLoginAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
        },
      });
    }

    // 2. Secondary Tenant Organization (to verify strict multi-tenant isolation)
    const secondOrg = await prisma.organization.create({
      data: {
        name: "Mombasa Marine & Civil Works Ltd.",
        slug: "mombasa-marine-civil",
        code: "MMCW-KE",
        address: "Moi Avenue, Harbour House, 4th Floor",
        city: "Mombasa",
        country: "Kenya",
        phone: "+254 710 555 800",
        email: "info@mombasacivil.co.ke",
        taxPin: "P059911223M",
        ncaRegistration: "NCA-2 Civil Engineering",
        currency: "KSh",
        timezone: "Africa/Nairobi",
        projectPrefix: "MMCW-PRJ-",
        invoicePrefix: "MMCW-INV-",
        poPrefix: "MMCW-PO-",
        mrPrefix: "MMCW-MR-",
        plan: "BUSINESS",
        status: "ACTIVE",
      },
    });

    for (const [role, perms] of roleEntries) {
      await prisma.rolePermission.create({
        data: {
          organizationId: secondOrg.id,
          role,
          permissionsJson: JSON.stringify(perms),
        },
      });
    }

    await prisma.user.create({
      data: {
        organizationId: secondOrg.id,
        name: "Eng. Hassan Bakari",
        email: "hassan.bakari@mombasacivil.co.ke",
        passwordHash,
        phone: "+254 722 999 111",
        jobTitle: "Managing Director",
        department: "Executive",
        employeeCode: "MMCW-001",
        role: "ORGANIZATION_OWNER",
        status: "ACTIVE",
      },
    });
  }

  // ==========================================================================
  // PHASE 2 SEED DATA: CLIENTS, PROJECTS, SITES, PHASES, TEAM & DOCUMENTS
  // ==========================================================================
  const existingProjectsCount = await prisma.project.count({
    where: { organizationId: summitOrg.id },
  });

  if (existingProjectsCount === 0) {
    const summitUsers = await prisma.user.findMany({
      where: { organizationId: summitOrg.id },
    });

    const findByRole = (role: string) =>
      summitUsers.find((u) => u.role === role) || summitUsers[0];

    const ownerUser = findByRole("ORGANIZATION_OWNER");
    const adminUser = findByRole("ADMINISTRATOR");
    const pmUser = findByRole("PROJECT_MANAGER");
    const qsUser = findByRole("QUANTITY_SURVEYOR");
    const siteMgrUser = findByRole("SITE_MANAGER");
    const procUser = findByRole("PROCUREMENT_OFFICER");
    const acctUser = findByRole("ACCOUNTANT");
    const foremanUser = findByRole("SITE_STAFF");

    // 1. Seed Clients (Section 26 & 53)
    const clientOakland = await prisma.client.create({
      data: {
        organizationId: summitOrg.id,
        code: "CLI-001",
        name: "Oakland Properties Development Ltd.",
        clientType: "PRIVATE_DEVELOPER",
        contactPerson: "Arch. Victoria Mutuku",
        phone: "+254 721 600 900",
        email: "v.mutuku@oaklanddevs.co.ke",
        address: "14 Riverside Drive, Cavendish Block, 5th Floor",
        city: "Nairobi",
        taxPin: "P051334901L",
        notes: "Flagship residential developer. Monthly interim valuations required on the 25th.",
        status: "ACTIVE",
      },
    });

    const clientSavannah = await prisma.client.create({
      data: {
        organizationId: summitOrg.id,
        code: "CLI-002",
        name: "Savannah Commercial REIT Kenya",
        clientType: "CORPORATE",
        contactPerson: "Mr. Kenneth Gichuru",
        phone: "+254 733 410 220",
        email: "projects@savannahreit.co.ke",
        address: "The Promenade, General Mathenge Rd, Westlands",
        city: "Nairobi",
        taxPin: "P051772019C",
        notes: "Grade-A commercial real estate trust. Strict LEED & NCA safety compliance.",
        status: "ACTIVE",
      },
    });

    const clientKaren = await prisma.client.create({
      data: {
        organizationId: summitOrg.id,
        code: "CLI-003",
        name: "Dr. Richard & Mrs. Angela Omondi",
        clientType: "INDIVIDUAL",
        contactPerson: "Dr. Richard Omondi",
        phone: "+254 722 505 880",
        email: "romondi@karenestates.co.ke",
        address: "Miotoni Ridge, Karen",
        city: "Nairobi",
        taxPin: "A002918472K",
        notes: "Private luxury residence with bespoke imported Italian finishing requirements.",
        status: "ACTIVE",
      },
    });

    const clientLogistics = await prisma.client.create({
      data: {
        organizationId: summitOrg.id,
        code: "CLI-004",
        name: "East Africa Cold-Chain & Logistics Hub Ltd.",
        clientType: "CORPORATE",
        contactPerson: "Eng. Rajesh Patel",
        phone: "+254 708 912 300",
        email: "r.patel@ealogisticshub.co.ke",
        address: "Tatu Industrial Park, Zone B, Ruiru",
        city: "Kiambu / Tatu City",
        taxPin: "P051889402M",
        notes: "Heavy structural steel portal frame & high-load post-tensioned floor slab warehouse.",
        status: "ACTIVE",
      },
    });

    const clientAfya = await prisma.client.create({
      data: {
        organizationId: summitOrg.id,
        code: "CLI-005",
        name: "AfyaCare Specialist Hospitals Group",
        clientType: "CORPORATE",
        contactPerson: "Dr. Amina Mohamed",
        phone: "+254 711 880 440",
        email: "capitalprojects@afyacare.co.ke",
        address: "Argwings Kodhek Rd, Kilimani",
        city: "Nairobi",
        taxPin: "P051600218H",
        notes: "Completed diagnostic & surgical wing fit-out under defects liability period.",
        status: "ACTIVE",
      },
    });

    // 2. Seed Projects (Section 8, 9, 53)
    const prjRiverside = await prisma.project.create({
      data: {
        organizationId: summitOrg.id,
        code: "SBC-PRJ-001",
        name: "Riverside Apartments — Twin 14-Storey Luxury Towers",
        projectType: "RESIDENTIAL",
        location: "Riverside Drive, Plot LR 209/8841, Westlands",
        county: "Nairobi",
        description:
          "Construction of two 14-storey luxury residential apartment blocks (84 units total) with 2-level basement parking, swimming pool, backup power, and borehole water treatment plant.",
        clientId: clientOakland.id,
        projectManagerId: pmUser.id,
        siteManagerId: siteMgrUser.id,
        quantitySurveyorId: qsUser.id,
        startDate: new Date("2026-01-15"),
        expectedCompletionDate: new Date("2027-06-30"),
        contractValue: 485000000,
        budget: 410000000,
        committedCost: 268500000,
        actualCost: 242800000,
        invoicedAmount: 291000000,
        paidAmount: 265000000,
        status: "ACTIVE",
        plannedProgress: 65,
        progress: 62,
      },
    });

    const prjWestlands = await prisma.project.create({
      data: {
        organizationId: summitOrg.id,
        code: "SBC-PRJ-002",
        name: "Westlands Commercial Centre — Grade-A Office Complex",
        projectType: "COMMERCIAL",
        location: "Waiyaki Way / Muthithi Rd Junction, Westlands",
        county: "Nairobi",
        description:
          "9-storey Grade-A commercial office tower with double-glazed curtain walling, triple basement parking, high-speed elevators, and ground-floor retail banking hall.",
        clientId: clientSavannah.id,
        projectManagerId: pmUser.id,
        siteManagerId: siteMgrUser.id,
        quantitySurveyorId: qsUser.id,
        startDate: new Date("2026-03-10"),
        expectedCompletionDate: new Date("2027-11-30"),
        contractValue: 720000000,
        budget: 615000000,
        committedCost: 285000000,
        actualCost: 224500000,
        invoicedAmount: 270000000,
        paidAmount: 240000000,
        status: "ACTIVE",
        plannedProgress: 40,
        progress: 38,
      },
    });

    const prjKaren = await prisma.project.create({
      data: {
        organizationId: summitOrg.id,
        code: "SBC-PRJ-003",
        name: "Karen Residence — Ambassadorial Villa & Guest Pavilion",
        projectType: "RESIDENTIAL",
        location: "Miotoni Road, Karen",
        county: "Nairobi",
        description:
          "Bespoke 6-bedroom double-storey luxury residence on 1.5 acres including DSQ, heated pool, entertainment pavilion, solar microgrid, and boundary perimeter works.",
        clientId: clientKaren.id,
        projectManagerId: pmUser.id,
        siteManagerId: siteMgrUser.id,
        quantitySurveyorId: qsUser.id,
        startDate: new Date("2025-11-01"),
        expectedCompletionDate: new Date("2026-11-15"),
        contractValue: 95000000,
        budget: 78500000,
        committedCost: 71200000,
        actualCost: 66400000,
        invoicedAmount: 76000000,
        paidAmount: 68000000,
        status: "DELAYED",
        plannedProgress: 86,
        progress: 74,
      },
    });

    const prjWarehouse = await prisma.project.create({
      data: {
        organizationId: summitOrg.id,
        code: "SBC-PRJ-004",
        name: "Industrial Warehouse — Tatu City Cold-Storage & Logistics Hub",
        projectType: "INDUSTRIAL",
        location: "Industrial Zone B, Tatu City, Ruiru",
        county: "Kiambu",
        description:
          "12,000 sqm structural steel portal-frame warehouse facility, heavy-duty laser-screeded fibre-reinforced concrete floor slabs, 14 loading bays, and civil access roads.",
        clientId: clientLogistics.id,
        projectManagerId: pmUser.id,
        siteManagerId: siteMgrUser.id,
        quantitySurveyorId: qsUser.id,
        startDate: new Date("2026-08-15"),
        expectedCompletionDate: new Date("2027-08-30"),
        contractValue: 340000000,
        budget: 285000000,
        committedCost: 64000000,
        actualCost: 34200000,
        invoicedAmount: 68000000,
        paidAmount: 68000000,
        status: "PLANNING",
        plannedProgress: 15,
        progress: 12,
      },
    });

    const prjKilimani = await prisma.project.create({
      data: {
        organizationId: summitOrg.id,
        code: "SBC-PRJ-005",
        name: "Kilimani Specialist Medical & Diagnostic Wing",
        projectType: "COMMERCIAL",
        location: "Argwings Kodhek Road, Kilimani",
        county: "Nairobi",
        description:
          "Turnkey construction and specialized MEP medical gas/HVAC fit-out for a 4-floor radiology, theatre, and outpatient wing.",
        clientId: clientAfya.id,
        projectManagerId: pmUser.id,
        siteManagerId: siteMgrUser.id,
        quantitySurveyorId: qsUser.id,
        startDate: new Date("2025-04-01"),
        expectedCompletionDate: new Date("2026-05-30"),
        actualCompletionDate: new Date("2026-05-24"),
        contractValue: 160000000,
        budget: 132000000,
        committedCost: 128400000,
        actualCost: 128400000,
        invoicedAmount: 160000000,
        paidAmount: 152000000,
        status: "COMPLETED",
        plannedProgress: 100,
        progress: 100,
      },
    });

    // 3. Seed Sites (Section 4 & 5)
    await prisma.site.createMany({
      data: [
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          code: "SITE-RIV-A",
          name: "Riverside Block A & Basement Podium Site",
          location: "14 Riverside Drive, Gate A",
          county: "Nairobi",
          gpsCoordinates: "-1.2694, 36.7908",
          siteManagerId: siteMgrUser.id,
          status: "ACTIVE",
          notes: "Tower crane TC-01 active; concrete batching & rebar yard on North wing.",
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          code: "SITE-RIV-B",
          name: "Riverside Block B & Amenities Deck Site",
          location: "14 Riverside Drive, Gate B",
          county: "Nairobi",
          gpsCoordinates: "-1.2698, 36.7912",
          siteManagerId: siteMgrUser.id,
          status: "ACTIVE",
          notes: "9th floor slab shuttering and masonry blockwork on Floors 2–6.",
        },
        {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          code: "SITE-WCC-01",
          name: "Westlands Commercial Tower Main Site",
          location: "Waiyaki Way Service Lane, Westlands",
          county: "Nairobi",
          gpsCoordinates: "-1.2647, 36.8021",
          siteManagerId: siteMgrUser.id,
          status: "ACTIVE",
          notes: "Deep basement retaining wall anchored; 4th floor RC columns in progress.",
        },
        {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          code: "SITE-KRN-01",
          name: "Miotoni Ridge Karen Plot 44",
          location: "Miotoni Road, Karen",
          county: "Nairobi",
          gpsCoordinates: "-1.3192, 36.6895",
          siteManagerId: siteMgrUser.id,
          status: "ACTIVE",
          notes: "Roofing complete; awaiting custom acoustic glazing & porcelain tiles.",
        },
        {
          organizationId: summitOrg.id,
          projectId: prjWarehouse.id,
          code: "SITE-TATU-B4",
          name: "Tatu Industrial Park Plot B4",
          location: "Tatu City Industrial Zone, Ruiru",
          county: "Kiambu",
          gpsCoordinates: "-1.1384, 36.9142",
          siteManagerId: siteMgrUser.id,
          status: "MOBILIZING",
          notes: "Bulk earthworks, black-cotton soil excavation & murram sub-base compaction.",
        },
      ],
    });

    // 4. Seed Project Phases for Riverside Apartments (Section 10 & 53)
    await prisma.projectPhase.createMany({
      data: [
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          sequenceOrder: 1,
          name: "Site Preparation & Bulk Excavation",
          description: "Site hoarding, demolition, shoring piles, and 2-level basement rock excavation.",
          startDate: new Date("2026-01-15"),
          endDate: new Date("2026-03-15"),
          budget: 28000000,
          actualCost: 27400000,
          plannedProgress: 100,
          progress: 100,
          status: "COMPLETED",
          leadUserId: siteMgrUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          sequenceOrder: 2,
          name: "Foundation & Substructure Works",
          description: "Pad foundations, raft slab, retaining walls, waterproofing, and basement columns.",
          startDate: new Date("2026-03-16"),
          endDate: new Date("2026-06-10"),
          budget: 64000000,
          actualCost: 63100000,
          plannedProgress: 100,
          progress: 100,
          status: "COMPLETED",
          leadUserId: siteMgrUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          sequenceOrder: 3,
          name: "Superstructure RC Frame & Masonry",
          description: "Reinforced concrete columns, shear walls, post-tensioned slabs (Floors 1–14) & coral/machine-cut blockwork.",
          startDate: new Date("2026-06-11"),
          endDate: new Date("2026-11-30"),
          budget: 142000000,
          actualCost: 118500000,
          plannedProgress: 88,
          progress: 82,
          status: "IN_PROGRESS",
          leadUserId: pmUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          sequenceOrder: 4,
          name: "Roofing & Waterproofing Slab",
          description: "Penthouse roof slab, APP membrane waterproofing, parapet walls, and solar pergola structure.",
          startDate: new Date("2026-11-01"),
          endDate: new Date("2027-01-15"),
          budget: 24000000,
          actualCost: 8200000,
          plannedProgress: 35,
          progress: 30,
          status: "IN_PROGRESS",
          leadUserId: siteMgrUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          sequenceOrder: 5,
          name: "Electrical & ICT First/Second Fix",
          description: "Conduiting, armoured sub-mains, distribution boards, standby generator, lifts & CCTV/Fibre.",
          startDate: new Date("2026-08-15"),
          endDate: new Date("2027-03-30"),
          budget: 42000000,
          actualCost: 14600000,
          plannedProgress: 45,
          progress: 40,
          status: "IN_PROGRESS",
          leadUserId: pmUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          sequenceOrder: 6,
          name: "Plumbing, Drainage & Fire Fighting",
          description: "PPR piping, UPVC drainage stacks, borehole booster pumps, solar water heating, and hose reels.",
          startDate: new Date("2026-08-20"),
          endDate: new Date("2027-03-30"),
          budget: 36000000,
          actualCost: 11000000,
          plannedProgress: 40,
          progress: 36,
          status: "IN_PROGRESS",
          leadUserId: siteMgrUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          sequenceOrder: 7,
          name: "Internal & External Finishing",
          description: "Plastering, porcelain floor/wall tiling, acoustic gypsum ceilings, joinery wardrobes, kitchens & painting.",
          startDate: new Date("2026-12-01"),
          endDate: new Date("2027-05-15"),
          budget: 56000000,
          actualCost: 0,
          plannedProgress: 0,
          progress: 0,
          status: "NOT_STARTED",
          leadUserId: pmUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          sequenceOrder: 8,
          name: "External Works, Testing & Handover",
          description: "Cabro driveways, boundary wall, landscaping, KPLC/NCWSC commissioning & NCA completion certificate.",
          startDate: new Date("2027-04-15"),
          endDate: new Date("2027-06-30"),
          budget: 18000000,
          actualCost: 0,
          plannedProgress: 0,
          progress: 0,
          status: "NOT_STARTED",
          leadUserId: pmUser.id,
        },
      ],
    });

    // Seed Phases for Westlands Commercial Centre
    await prisma.projectPhase.createMany({
      data: [
        {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          sequenceOrder: 1,
          name: "Site Preparation & Triple-Basement Excavation",
          description: "Contiguous piled shoring wall, rock anchoring & bulk excavation.",
          startDate: new Date("2026-03-10"),
          endDate: new Date("2026-06-15"),
          budget: 75000000,
          actualCost: 74200000,
          plannedProgress: 100,
          progress: 100,
          status: "COMPLETED",
          leadUserId: siteMgrUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          sequenceOrder: 2,
          name: "Foundation Raft & Basement Slabs (B3 to Ground)",
          description: "1.8m thick RC raft foundation, lift core walls, and basement parking decks.",
          startDate: new Date("2026-06-16"),
          endDate: new Date("2026-09-20"),
          budget: 120000000,
          actualCost: 112000000,
          plannedProgress: 95,
          progress: 92,
          status: "IN_PROGRESS",
          leadUserId: siteMgrUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          sequenceOrder: 3,
          name: "Superstructure Tower Frame (Floors 1–9)",
          description: "High-strength C40 columns, shear cores, and flat slabs.",
          startDate: new Date("2026-09-10"),
          endDate: new Date("2027-03-30"),
          budget: 195000000,
          actualCost: 38300000,
          plannedProgress: 25,
          progress: 22,
          status: "IN_PROGRESS",
          leadUserId: pmUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          sequenceOrder: 4,
          name: "Double-Glazed Curtain Wall & Facade",
          description: "Unitized solar-control aluminium curtain wall system and alucobond cladding.",
          startDate: new Date("2027-01-15"),
          endDate: new Date("2027-07-30"),
          budget: 110000000,
          actualCost: 0,
          plannedProgress: 0,
          progress: 0,
          status: "NOT_STARTED",
          leadUserId: pmUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          sequenceOrder: 5,
          name: "MEP Services, HVAC, Lifts & Finishing",
          description: "VRV air conditioning, 4 high-speed passenger lifts, fire suppression, and Grade-A lobbies.",
          startDate: new Date("2027-03-01"),
          endDate: new Date("2027-11-30"),
          budget: 115000000,
          actualCost: 0,
          plannedProgress: 0,
          progress: 0,
          status: "NOT_STARTED",
          leadUserId: pmUser.id,
        },
      ],
    });

    // Seed Phases for Karen Residence (showing Delayed Phase)
    await prisma.projectPhase.createMany({
      data: [
        {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          sequenceOrder: 1,
          name: "Foundation & Structural Frame",
          description: "Strip/pad foundations, ground slab, upper floor slab, and natural stone masonry.",
          startDate: new Date("2025-11-01"),
          endDate: new Date("2026-03-30"),
          budget: 32000000,
          actualCost: 31800000,
          plannedProgress: 100,
          progress: 100,
          status: "COMPLETED",
          leadUserId: siteMgrUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          sequenceOrder: 2,
          name: "Timber Truss Roofing & Clay Tiles",
          description: "Treated cypress trusses, waterproofing membrane, and imported clay roof tiles.",
          startDate: new Date("2026-04-01"),
          endDate: new Date("2026-06-15"),
          budget: 14500000,
          actualCost: 14900000,
          plannedProgress: 100,
          progress: 100,
          status: "COMPLETED",
          leadUserId: siteMgrUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          sequenceOrder: 3,
          name: "Bespoke Joinery, Tiling & Interior Finishes",
          description: "Hardwood mahogany doors, Italian porcelain tiles, kitchen cabinetry & sanitary ware.",
          startDate: new Date("2026-06-16"),
          endDate: new Date("2026-10-15"),
          budget: 32000000,
          actualCost: 19700000,
          plannedProgress: 75,
          progress: 48,
          status: "DELAYED",
          leadUserId: pmUser.id,
        },
      ],
    });

    // 5. Seed Project Team Assignments
    await prisma.projectMember.createMany({
      data: [
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          userId: ownerUser.id,
          projectRole: "Project Director & Principal Engineer",
          allocationPct: 35,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          userId: pmUser.id,
          projectRole: "Lead Project Manager",
          allocationPct: 100,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          userId: qsUser.id,
          projectRole: "Project Quantity Surveyor",
          allocationPct: 80,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          userId: siteMgrUser.id,
          projectRole: "Resident Site Agent",
          allocationPct: 100,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          userId: procUser.id,
          projectRole: "Procurement & Materials Coordinator",
          allocationPct: 60,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          userId: acctUser.id,
          projectRole: "Project Cost Accountant",
          allocationPct: 50,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          userId: foremanUser.id,
          projectRole: "General Site Foreman & Storekeeper",
          allocationPct: 100,
        },
        // Westlands Team
        {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          userId: pmUser.id,
          projectRole: "Lead Project Manager",
          allocationPct: 100,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          userId: qsUser.id,
          projectRole: "Commercial & Valuation Lead",
          allocationPct: 100,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          userId: siteMgrUser.id,
          projectRole: "Senior Site Manager",
          allocationPct: 80,
        },
      ],
    });

    // 6. Seed Project Documents (Section 33)
    await prisma.projectDocument.createMany({
      data: [
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          clientId: clientOakland.id,
          title: "JBCC Main Building Agreement — Riverside Twin Towers",
          documentNumber: "SBC-DOC-RIV-001",
          category: "CONTRACT",
          version: "v2.0 (Signed)",
          fileName: "JBCC_Main_Contract_Riverside_Apartments_Signed.pdf",
          fileSizeLabel: "4.8 MB",
          status: "APPROVED",
          notes: "Executed main contract agreement including performance bond & insurance schedule.",
          uploadedById: ownerUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          clientId: clientOakland.id,
          title: "Architectural General Arrangement Drawings (Blocks A & B)",
          documentNumber: "SBC-DOC-RIV-002",
          category: "ARCHITECTURAL_DRAWING",
          version: "Rev C",
          fileName: "ARCH_GA_Plans_Elevations_Sections_RevC.pdf",
          fileSizeLabel: "18.4 MB",
          status: "APPROVED",
          notes: "Approved by Nairobi City County & Project Architect.",
          uploadedById: pmUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          clientId: clientOakland.id,
          title: "Structural RC Bar Bending & Post-Tensioning Details",
          documentNumber: "SBC-DOC-RIV-003",
          category: "STRUCTURAL_DRAWING",
          version: "Rev B",
          fileName: "STR_Columns_Slabs_Rebar_Schedules_RevB.pdf",
          fileSizeLabel: "14.2 MB",
          status: "APPROVED",
          notes: "Covers C35/40 concrete mix design and T16/T20/T25 high-tensile steel reinforcement.",
          uploadedById: pmUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          clientId: clientOakland.id,
          title: "Priced Contract Bill of Quantities (BOQ) — Riverside",
          documentNumber: "SBC-DOC-RIV-004",
          category: "BOQ",
          version: "v1.0",
          fileName: "Priced_BOQ_Riverside_Apartments_KSh_485M.xlsx",
          fileSizeLabel: "3.1 MB",
          status: "APPROVED",
          notes: "Master priced BOQ across Substructure, Superstructure, Finishes, and MEP.",
          uploadedById: qsUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          clientId: clientOakland.id,
          title: "NCA Project Compliance & NEMA EIA License",
          documentNumber: "SBC-DOC-RIV-005",
          category: "PERMIT_APPROVAL",
          version: "v1.0",
          fileName: "NCA_Compliance_NEMA_EIA_Permit_Riverside.pdf",
          fileSizeLabel: "1.9 MB",
          status: "APPROVED",
          notes: "Displayed on site board at Gate A.",
          uploadedById: adminUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          clientId: clientSavannah.id,
          title: "Main Contract & Curtain Wall Specification — Westlands Commercial",
          documentNumber: "SBC-DOC-WCC-001",
          category: "CONTRACT",
          version: "v1.2",
          fileName: "Westlands_Commercial_Centre_Main_Contract.pdf",
          fileSizeLabel: "6.5 MB",
          status: "APPROVED",
          notes: "Includes acoustic & thermal double-glazing performance specifications.",
          uploadedById: ownerUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          clientId: clientSavannah.id,
          title: "Deep Basement Contiguous Pile Shoring Structural Drawings",
          documentNumber: "SBC-DOC-WCC-002",
          category: "STRUCTURAL_DRAWING",
          version: "Rev D",
          fileName: "WCC_Basement_Piling_Rock_Anchors_RevD.pdf",
          fileSizeLabel: "22.0 MB",
          status: "APPROVED",
          notes: "Geotechnical & structural engineer approved.",
          uploadedById: pmUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          clientId: clientKaren.id,
          title: "Interior Joinery & Italian Finishes Schedule — Karen Residence",
          documentNumber: "SBC-DOC-KRN-001",
          category: "ARCHITECTURAL_DRAWING",
          version: "Rev B",
          fileName: "Karen_Villa_Interior_Design_Finishes_Book.pdf",
          fileSizeLabel: "11.6 MB",
          status: "UNDER_REVIEW",
          notes: "Updated porcelain tile & sanitary fittings schedule under client review.",
          uploadedById: qsUser.id,
        },
        {
          organizationId: summitOrg.id,
          projectId: prjKilimani.id,
          clientId: clientAfya.id,
          title: "Practical Completion Certificate — Kilimani Medical Wing",
          documentNumber: "SBC-DOC-KIL-009",
          category: "CERTIFICATE",
          version: "Final",
          fileName: "Practical_Completion_Certificate_AfyaCare_Kilimani.pdf",
          fileSizeLabel: "1.4 MB",
          status: "APPROVED",
          notes: "Signed off by Lead Architect, Hospital Engineer, and Summit Build MD.",
          uploadedById: ownerUser.id,
        },
      ],
    });

    // Add Audit Log & Notification for Phase 2 initialization
    await prisma.auditLog.create({
      data: {
        organizationId: summitOrg.id,
        userId: pmUser.id,
        action: "PORTFOLIO_SEEDED",
        entity: "Project",
        entityId: prjRiverside.id,
        description:
          "Initialized 5 construction projects (KSh 1.80B total contract value), 5 clients, 5 sites, 16 phases, and 9 construction documents.",
        newValue: JSON.stringify({
          projectsCount: 5,
          totalContractValueKSh: 1800000000,
        }),
      },
    });

    await prisma.notification.create({
      data: {
        organizationId: summitOrg.id,
        userId: null,
        title: "Schedule Alert: Karen Residence Finishes Phase Delayed",
        message:
          "SBC-PRJ-003 (Karen Residence) is at 74% actual vs 86% planned progress due to custom imported finishes lead time.",
        type: "WARNING",
        category: "PROJECT",
        link: `/projects/${prjKaren.id}`,
        isRead: "FALSE",
      },
    });
  }

  // ==========================================================================
  // PHASE 3 SEED DATA: TASKS, DEPENDENCIES & MILESTONES
  // ==========================================================================
  const existingTasksCount = await prisma.projectTask.count({
    where: { organizationId: summitOrg.id },
  });

  if (existingTasksCount === 0) {
    const [summitUsers, projects] = await Promise.all([
      prisma.user.findMany({ where: { organizationId: summitOrg.id } }),
      prisma.project.findMany({
        where: { organizationId: summitOrg.id },
        include: { phases: { orderBy: { sequenceOrder: "asc" } }, sites: true },
      }),
    ]);

    const findByRole = (role: string) =>
      summitUsers.find((u) => u.role === role) || summitUsers[0];

    const pmUser = findByRole("PROJECT_MANAGER");
    const qsUser = findByRole("QUANTITY_SURVEYOR");
    const siteMgrUser = findByRole("SITE_MANAGER");
    const procUser = findByRole("PROCUREMENT_OFFICER");
    const foremanUser = findByRole("SITE_STAFF");

    const prjRiverside = projects.find((p) => p.code === "SBC-PRJ-001");
    const prjWestlands = projects.find((p) => p.code === "SBC-PRJ-002");
    const prjKaren = projects.find((p) => p.code === "SBC-PRJ-003");
    const prjWarehouse = projects.find((p) => p.code === "SBC-PRJ-004");

    if (prjRiverside) {
      const phPrep = prjRiverside.phases[0];
      const phFound = prjRiverside.phases[1];
      const phSuper = prjRiverside.phases[2];
      const phRoof = prjRiverside.phases[3];
      const phElec = prjRiverside.phases[4];
      const phPlumb = prjRiverside.phases[5];
      const siteA = prjRiverside.sites[0];
      const siteB = prjRiverside.sites[1] || prjRiverside.sites[0];

      // Task 1: Completed excavation
      const tsk1 = await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          phaseId: phPrep?.id,
          siteId: siteA?.id,
          code: "TSK-RIV-001",
          name: "Contiguous Pile Shoring & 2-Level Basement Rock Excavation",
          description:
            "Install 600mm contiguous bored piles along North/East boundary and excavate 18,500 m³ rock.",
          assignedToId: siteMgrUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-01-16"),
          dueDate: new Date("2026-03-14"),
          completedAt: new Date("2026-03-12"),
          priority: "HIGH",
          status: "COMPLETED",
          progress: 100,
          notes: "Geotechnical bearing capacity confirmed at 450 kPa.",
        },
      });

      // Task 2: Completed raft foundation (depends on Task 1)
      const tsk2 = await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          phaseId: phFound?.id,
          siteId: siteA?.id,
          code: "TSK-RIV-002",
          name: "Substructure C35 Raft Slab & Basement Retaining Walls",
          description:
            "Fix T25 high-tensile reinforcement and pour 1,400 m³ C35 waterproofed concrete raft.",
          assignedToId: siteMgrUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-03-16"),
          dueDate: new Date("2026-06-08"),
          completedAt: new Date("2026-06-05"),
          priority: "CRITICAL",
          status: "COMPLETED",
          progress: 100,
          dependsOnTaskId: tsk1.id,
          notes: "28-day cube crushing test passed at 41.2 MPa.",
        },
      });

      // Task 3: In Progress 10th Floor Post-Tensioned Slab (depends on Task 2)
      const tsk3 = await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          phaseId: phSuper?.id,
          siteId: siteA?.id,
          code: "TSK-RIV-003",
          name: "Tower A — 10th Floor Post-Tensioned Slab Formwork & Rebar",
          description:
            "Erect steel table-formwork, lay PT tendons, and fix top/bottom reinforcement mesh.",
          assignedToId: foremanUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-09-20"),
          dueDate: new Date("2026-10-12"),
          priority: "CRITICAL",
          status: "IN_PROGRESS",
          progress: 85,
          dependsOnTaskId: tsk2.id,
          notes: "Structural engineer pre-pour inspection scheduled for Friday 9:00 AM.",
        },
      });

      // Task 4: Dependent on Task 3 (Concrete Pour)
      await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          phaseId: phSuper?.id,
          siteId: siteA?.id,
          code: "TSK-RIV-004",
          name: "Tower A — 10th Floor C40 Concrete Pour & PT Stressing",
          description:
            "Pump 310 m³ C40 ready-mix concrete and stress post-tension cables at 75% strength.",
          assignedToId: siteMgrUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-10-13"),
          dueDate: new Date("2026-10-22"),
          priority: "CRITICAL",
          status: "NOT_STARTED",
          progress: 0,
          dependsOnTaskId: tsk3.id,
          notes: "Awaiting completion of TSK-RIV-003 rebar & PT duct sign-off.",
        },
      });

      // Task 5: Tower B Masonry (In Progress)
      await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          phaseId: phSuper?.id,
          siteId: siteB?.id,
          code: "TSK-RIV-005",
          name: "Tower B — Floors 4 to 7 Machine-Cut Stone Masonry Partitioning",
          description:
            "200mm external and 150mm internal machine-cut stone walling with hoop iron every alternate course.",
          assignedToId: foremanUser.id,
          createdById: siteMgrUser.id,
          startDate: new Date("2026-09-01"),
          dueDate: new Date("2026-10-25"),
          priority: "HIGH",
          status: "IN_PROGRESS",
          progress: 70,
          dependsOnTaskId: tsk2.id,
        },
      });

      // Task 6: Electrical First Fix
      await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          phaseId: phElec?.id,
          siteId: siteA?.id,
          code: "TSK-RIV-006",
          name: "MEP First-Fix Heavy Gauge PVC Conduiting & Riser Trays (Floors 1–6)",
          description:
            "Wall chasing, conduit drops, DB back-boxes, and vertical cable tray installation in riser shafts.",
          assignedToId: siteMgrUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-08-20"),
          dueDate: new Date("2026-11-10"),
          priority: "MEDIUM",
          status: "IN_PROGRESS",
          progress: 55,
        },
      });

      // Task 7: Plumbing stacks
      await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          phaseId: phPlumb?.id,
          siteId: siteB?.id,
          code: "TSK-RIV-007",
          name: "PPR Cold/Hot Water Reticulation & Pressure Testing (Floors 1–5)",
          description:
            "Install PN20 PPR pipes and pressure test at 10 Bar for 24 hours prior to wall plastering.",
          assignedToId: foremanUser.id,
          createdById: siteMgrUser.id,
          startDate: new Date("2026-09-05"),
          dueDate: new Date("2026-10-30"),
          priority: "MEDIUM",
          status: "IN_PROGRESS",
          progress: 45,
        },
      });

      // Task 8: Roof slab waterproofing
      await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          phaseId: phRoof?.id,
          siteId: siteA?.id,
          code: "TSK-RIV-008",
          name: "Podium Deck & Swimming Pool 2-Layer APP Bituminous Waterproofing",
          description:
            "Apply primer, torch-on 4mm APP membrane, flood test for 48 hours, and lay protective screed.",
          assignedToId: siteMgrUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-10-01"),
          dueDate: new Date("2026-11-15"),
          priority: "HIGH",
          status: "IN_PROGRESS",
          progress: 35,
        },
      });

      // Milestones for Riverside Apartments
      await prisma.projectMilestone.createMany({
        data: [
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            phaseId: phFound?.id,
            code: "MS-RIV-01",
            title: "Substructure & 2-Level Basement Podium Structural Sign-off",
            description: "Completion of raft foundation, retaining walls, and Ground Floor transfer slab.",
            targetDate: new Date("2026-06-10"),
            achievedDate: new Date("2026-06-06"),
            status: "ACHIEVED",
            valuationLinkedNote: "Valuation Certificate #2 — KSh 85,000,000 Certified & Paid",
            ownerId: pmUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            phaseId: phSuper?.id,
            code: "MS-RIV-02",
            title: "Tower A & B — 10th Floor Structural Frame Topping Milestone",
            description: "Completion of RC slabs up to 10th floor and masonry up to 7th floor.",
            targetDate: new Date("2026-10-25"),
            status: "IN_PROGRESS",
            valuationLinkedNote: "Triggers Interim Valuation Certificate #5 (KSh 64,000,000)",
            ownerId: pmUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            phaseId: phRoof?.id,
            code: "MS-RIV-03",
            title: "14th Floor Roof Slab Topping Out & Waterproofing Completion",
            description: "Full structural frame completion for both 14-storey towers.",
            targetDate: new Date("2026-12-20"),
            status: "UPCOMING",
            valuationLinkedNote: "Triggers Interim Valuation Certificate #6 (KSh 58,000,000)",
            ownerId: pmUser.id,
          },
        ],
      });
    }

    if (prjWestlands) {
      const phWccBasement = prjWestlands.phases[1];
      const phWccTower = prjWestlands.phases[2];
      const siteWcc = prjWestlands.sites[0];

      const tskWcc1 = await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          phaseId: phWccBasement?.id,
          siteId: siteWcc?.id,
          code: "TSK-WCC-001",
          name: "Basement B1 & Ground Floor Commercial Transfer Slab Pour",
          description: "Heavy 900mm transfer slab supporting 9-storey commercial office columns.",
          assignedToId: siteMgrUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-08-01"),
          dueDate: new Date("2026-09-25"),
          completedAt: new Date("2026-09-22"),
          priority: "CRITICAL",
          status: "COMPLETED",
          progress: 100,
        },
      });

      await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          phaseId: phWccTower?.id,
          siteId: siteWcc?.id,
          code: "TSK-WCC-002",
          name: "4th Floor Commercial Core Shear Walls & C40 Columns",
          description: "Jump-form lift core walls and perimeter circular columns.",
          assignedToId: foremanUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-09-26"),
          dueDate: new Date("2026-10-20"),
          priority: "HIGH",
          status: "IN_PROGRESS",
          progress: 60,
          dependsOnTaskId: tskWcc1.id,
        },
      });

      await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          phaseId: phWccTower?.id,
          siteId: siteWcc?.id,
          code: "TSK-WCC-003",
          name: "Curtain Wall Aluminium Mullion Mock-up & Wind-Load Approval",
          description: "Install 2-storey facade mock-up panel for Architect & QS sign-off.",
          assignedToId: procUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-10-05"),
          dueDate: new Date("2026-11-05"),
          priority: "MEDIUM",
          status: "IN_PROGRESS",
          progress: 30,
        },
      });

      await prisma.projectMilestone.createMany({
        data: [
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            phaseId: phWccBasement?.id,
            code: "MS-WCC-01",
            title: "Triple Basement & Ground Podium Slab Handover",
            description: "Completion of all substructure works up to Waiyaki Way street datum.",
            targetDate: new Date("2026-09-25"),
            achievedDate: new Date("2026-09-23"),
            status: "ACHIEVED",
            valuationLinkedNote: "Valuation Certificate #3 — KSh 115,000,000 Certified",
            ownerId: pmUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            phaseId: phWccTower?.id,
            code: "MS-WCC-02",
            title: "5th Floor Structural Frame & Lift Core Half-Way Mark",
            description: "Structural completion to Level 5 enabling curtain-wall bracket installation.",
            targetDate: new Date("2026-11-30"),
            status: "IN_PROGRESS",
            valuationLinkedNote: "Triggers Interim Valuation Certificate #4 (KSh 90,000,000)",
            ownerId: pmUser.id,
          },
        ],
      });
    }

    if (prjKaren) {
      const phKarenFinish = prjKaren.phases[2];
      const siteKaren = prjKaren.sites[0];

      // Blocked Task demonstrating blocker handling & schedule alert
      const tskKarenTiles = await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          phaseId: phKarenFinish?.id,
          siteId: siteKaren?.id,
          code: "TSK-KRN-001",
          name: "Master Wing & Double-Volume Lounge Imported Italian Porcelain Tiling",
          description: "Lay 1200x1200mm Calacatta book-matched porcelain slabs with epoxy grout.",
          assignedToId: siteMgrUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-08-15"),
          dueDate: new Date("2026-09-30"),
          priority: "CRITICAL",
          status: "BLOCKED",
          progress: 40,
          blockerReason:
            "Container #MSCU-492811 with 180 sqm Calacatta slabs awaiting Mombasa Port KRA customs clearance.",
          notes: "Procurement Officer John Mutua expediting clearing agent release.",
        },
      });

      await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          phaseId: phKarenFinish?.id,
          siteId: siteKaren?.id,
          code: "TSK-KRN-002",
          name: "Bespoke Mahogany Joinery Doors, Skirting & Kitchen Cabinetry Installation",
          description: "Fit solid seasoned mahogany doors, architraves, and island stone countertops.",
          assignedToId: foremanUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-09-20"),
          dueDate: new Date("2026-10-28"),
          priority: "HIGH",
          status: "IN_PROGRESS",
          progress: 55,
          dependsOnTaskId: tskKarenTiles.id,
          notes: "Proceeding in guest bedrooms while main lounge tiling is blocked.",
        },
      });

      await prisma.projectMilestone.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          phaseId: phKarenFinish?.id,
          code: "MS-KRN-01",
          title: "Interior Finishes, Joinery & Sanitary Ware Practical Completion",
          description: "Completion of all tiling, woodwork, and bathroom fittings.",
          targetDate: new Date("2026-10-15"),
          status: "DELAYED",
          valuationLinkedNote: "Penultimate Valuation Certificate (KSh 14,500,000)",
          ownerId: qsUser.id,
        },
      });
    }

    if (prjWarehouse) {
      const siteTatu = prjWarehouse.sites[0];
      await prisma.projectTask.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWarehouse.id,
          siteId: siteTatu?.id,
          code: "TSK-TATU-001",
          name: "Black-Cotton Soil Stripping & 600mm Hand-Packed Quarry Stone Sub-Base",
          description: "Excavate 1.4m expansive clay across 12,000 sqm footprint and compact graded quarry stone.",
          assignedToId: siteMgrUser.id,
          createdById: pmUser.id,
          startDate: new Date("2026-09-10"),
          dueDate: new Date("2026-10-30"),
          priority: "HIGH",
          status: "IN_PROGRESS",
          progress: 35,
        },
      });

      await prisma.projectMilestone.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWarehouse.id,
          code: "MS-TATU-01",
          title: "Sub-Base Compaction CBR Test & Holding-Down Bolts Sign-off",
          description: "Ready for structural steel portal frame erection.",
          targetDate: new Date("2026-11-10"),
          status: "UPCOMING",
          valuationLinkedNote: "Triggers Steel Fabrication Interim Certificate #2 (KSh 48,000,000)",
          ownerId: pmUser.id,
        },
      });
    }
  }

  // ==========================================================================
  // PHASE 4 SEED DATA: BILLS OF QUANTITIES (BOQ) & PROJECT BUDGET LINES
  // ==========================================================================
  const existingBoqCount = await prisma.boqItem.count({
    where: { organizationId: summitOrg.id },
  });

  if (existingBoqCount === 0) {
    const summitUsers = await prisma.user.findMany({
      where: { organizationId: summitOrg.id },
    });
    const qsUser =
      summitUsers.find((u) => u.role === "QUANTITY_SURVEYOR") || summitUsers[0];

    const projects = await prisma.project.findMany({
      where: { organizationId: summitOrg.id },
      include: {
        phases: { orderBy: { sequenceOrder: "asc" } },
      },
    });

    const prjRiverside = projects.find((p) => p.code === "SBC-PRJ-001");
    const prjWestlands = projects.find((p) => p.code === "SBC-PRJ-002");
    const prjKaren = projects.find((p) => p.code === "SBC-PRJ-003");
    const prjWarehouse = projects.find((p) => p.code === "SBC-PRJ-004");

    // 1. Seed BOQ Items & Budget Lines for Riverside Apartments (SBC-PRJ-001)
    if (prjRiverside) {
      const phPrep = prjRiverside.phases[0];
      const phFound = prjRiverside.phases[1];
      const phStruct = prjRiverside.phases[2];
      const phMasonry = prjRiverside.phases[3];
      const phMep = prjRiverside.phases[4];

      const riversideBoqData = [
        {
          phaseId: phPrep?.id,
          itemCode: "BOQ-RIV-A.01",
          description:
            "Site clearance, temporary hoarding, NCA/NEMA compliance signboards, site offices & water/power setup",
          category: "PRELIMINARIES",
          costCategory: "PROFESSIONAL_FEES",
          unit: "Sum",
          quantity: 1,
          executedQuantity: 1,
          unitRate: 14500000,
          notes: "100% certified under Interim Valuation Certificate #1",
        },
        {
          phaseId: phPrep?.id,
          itemCode: "BOQ-RIV-A.02",
          description:
            "Bulk excavation in red coffee soil & weathered rock for twin-basement parking (depth up to 6.5m)",
          category: "SUBSTRUCTURE",
          costCategory: "EQUIPMENT",
          unit: "m³",
          quantity: 18500,
          executedQuantity: 18500,
          unitRate: 1200,
          notes: "Completed including cart-away to approved tipping site",
        },
        {
          phaseId: phFound?.id,
          itemCode: "BOQ-RIV-B.01",
          description:
            "Mass concrete Class 15/20 (1:3:6) 50mm blinding layer under pad & raft foundations",
          category: "SUBSTRUCTURE",
          costCategory: "MATERIALS",
          unit: "m²",
          quantity: 4200,
          executedQuantity: 4200,
          unitRate: 1650,
          notes: "Fully cast and inspected by Structural Engineer",
        },
        {
          phaseId: phFound?.id,
          itemCode: "BOQ-RIV-B.02",
          description:
            "Vibrating reinforced concrete Class 30/20 in raft foundation, strip footings, lift bases & retaining walls",
          category: "SUBSTRUCTURE",
          costCategory: "MATERIALS",
          unit: "m³",
          quantity: 2800,
          executedQuantity: 2800,
          unitRate: 19500,
          notes: "28-day cube crushing strength verified > 34 N/mm²",
        },
        {
          phaseId: phStruct?.id,
          itemCode: "BOQ-RIV-C.01",
          description:
            "High-tensile deformed steel reinforcement bars (T12, T16, T20, T25) to BS 4449 cut, bent & fixed in superstructure",
          category: "STEELWORK",
          costCategory: "MATERIALS",
          unit: "kg",
          quantity: 340000,
          executedQuantity: 245000,
          unitRate: 185,
          notes: "72% fixed up to 8th Floor slab level",
        },
        {
          phaseId: phStruct?.id,
          itemCode: "BOQ-RIV-C.02",
          description:
            "Ready-mix structural concrete Class 35/20 pumped to suspended post-tensioned slabs, columns & shear walls (Floors 1–12)",
          category: "SUPERSTRUCTURE_CONCRETE",
          costCategory: "MATERIALS",
          unit: "m³",
          quantity: 5600,
          executedQuantity: 3800,
          unitRate: 21000,
          notes: "8th Floor concrete pour in progress",
        },
        {
          phaseId: phStruct?.id,
          itemCode: "BOQ-RIV-C.03",
          description:
            "Marine-grade film-faced plywood soffit formwork (18mm) and heavy-duty Acrow steel propping to suspended slabs",
          category: "SUPERSTRUCTURE_CONCRETE",
          costCategory: "LABOUR",
          unit: "m²",
          quantity: 24000,
          executedQuantity: 16200,
          unitRate: 1450,
          notes: "Includes skilled carpentry gang labour & stripping",
        },
        {
          phaseId: phMasonry?.id,
          itemCode: "BOQ-RIV-D.01",
          description:
            "200mm machine-cut Ndarugo natural quarry stone walling bedded in 1:3 cement-sand mortar with hoop iron every alternate course",
          category: "MASONRY_WALLING",
          costCategory: "MATERIALS",
          unit: "m²",
          quantity: 14500,
          executedQuantity: 6100,
          unitRate: 2400,
          notes: "Completed on Floors 1 to 4; Floor 5 ongoing",
        },
        {
          phaseId: phMep?.id,
          itemCode: "BOQ-RIV-E.01",
          description:
            "First-fix heavy-gauge PVC electrical conduits, PPR PN20 hot/cold water risers & UPVC drainage stacks",
          category: "MEP_INSTALLATIONS",
          costCategory: "SUBCONTRACTORS",
          unit: "Item",
          quantity: 1,
          executedQuantity: 0.25,
          unitRate: 52000000,
          notes: "Specialist MEP package first-fix ongoing in lower floors",
        },
      ];

      for (const item of riversideBoqData) {
        await prisma.boqItem.create({
          data: {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            phaseId: item.phaseId,
            itemCode: item.itemCode,
            description: item.description,
            category: item.category,
            costCategory: item.costCategory,
            unit: item.unit,
            quantity: item.quantity,
            executedQuantity: item.executedQuantity,
            unitRate: item.unitRate,
            totalAmount: item.quantity * item.unitRate,
            executedAmount: item.executedQuantity * item.unitRate,
            notes: item.notes,
            createdById: qsUser.id,
          },
        });
      }

      // Seed structured 9-category Budget Lines for Riverside Apartments (Total Budget = KSh 385,000,000)
      const riversideBudgets = [
        {
          code: "BDG-RIV-MAT",
          category: "MATERIALS",
          title: "Structural Concrete, Rebar Steel, Cement, Aggregates & Masonry Stone",
          description: "Primary construction materials across substructure, RC frame, and masonry.",
          allocatedBudget: 195000000,
          committedCost: 138000000,
          actualCost: 114500000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
          notes: "Bulk steel price locked with Devki Steel Mills for Floors 1-10.",
        },
        {
          code: "BDG-RIV-LAB",
          category: "LABOUR",
          title: "Direct Site Workforce, Masons, Steel Fixers, Carpenters & Casuals",
          description: "Weekly muster-roll wages, overtime, and NSSF/SHIF statutory contributions.",
          allocatedBudget: 62000000,
          committedCost: 39500000,
          actualCost: 36800000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
          notes: "Average 85 workers on site daily across Blocks A & B.",
        },
        {
          code: "BDG-RIV-SUB",
          category: "SUBCONTRACTORS",
          title: "Specialist MEP, Lifts, Borehole & Glazing Subcontracts",
          description: "Domestic and nominated subcontractors for electrical, plumbing, and 4 high-speed lifts.",
          allocatedBudget: 58000000,
          committedCost: 32000000,
          actualCost: 18200000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
          notes: "First-fix MEP certificate #1 paid.",
        },
        {
          code: "BDG-RIV-EQP",
          category: "EQUIPMENT",
          title: "Tower Crane Hire, Concrete Pumps, Excavators & Hoists",
          description: "Plant lease, fuel, operator allowances, and statutory DOSHS crane inspection.",
          allocatedBudget: 28000000,
          committedCost: 24800000,
          actualCost: 21400000,
          alertThresholdPct: 85,
          status: "OVERRUN_RISK",
          notes: "88.6% committed due to extended night-pumping crane standby hours.",
        },
        {
          code: "BDG-RIV-TRN",
          category: "TRANSPORT",
          title: "Tipper Haulage, Material Delivery Logistics & Low-Loader Mobilization",
          description: "Spoil cart-away and aggregate/stone haulage from Machakos & Ndarugo.",
          allocatedBudget: 12000000,
          committedCost: 8900000,
          actualCost: 8400000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
          notes: "Substructure soil cart-away completed.",
        },
        {
          code: "BDG-RIV-FEE",
          category: "PROFESSIONAL_FEES",
          title: "Structural Testing, Material Lab Cube Crushing & Surveying Fees",
          description: "Independent materials lab testing, topographic survey checks & QS re-measurement.",
          allocatedBudget: 11000000,
          committedCost: 6800000,
          actualCost: 5900000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
        },
        {
          code: "BDG-RIV-PRM",
          category: "PERMITS",
          title: "NCA Levy, Nairobi County Approvals, NEMA Audit & Occupation Permits",
          description: "Statutory permits, hoardings license, and environmental compliance.",
          allocatedBudget: 6500000,
          committedCost: 6100000,
          actualCost: 5800000,
          alertThresholdPct: 90,
          status: "OVERRUN_RISK",
          notes: "All primary statutory levies paid up front.",
        },
        {
          code: "BDG-RIV-UTL",
          category: "UTILITIES",
          title: "Temporary 3-Phase KPLC Power, NCWSC Water & Diesel Generator Backup",
          description: "Monthly site electricity, water bowser top-ups, and site internet.",
          allocatedBudget: 5500000,
          committedCost: 3200000,
          actualCost: 2950000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
        },
        {
          code: "BDG-RIV-MSC",
          category: "MISCELLANEOUS",
          title: "Site Safety PPE, Security Guards, First Aid & Project Contingency",
          description: "24/7 site security, helmets/boots/harnesses, and general site overheads.",
          allocatedBudget: 7000000,
          committedCost: 2700000,
          actualCost: 2250000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
        },
      ];

      for (const b of riversideBudgets) {
        await prisma.projectBudgetLine.create({
          data: {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            code: b.code,
            category: b.category,
            title: b.title,
            description: b.description,
            allocatedBudget: b.allocatedBudget,
            committedCost: b.committedCost,
            actualCost: b.actualCost,
            alertThresholdPct: b.alertThresholdPct,
            status: b.status,
            notes: b.notes,
            updatedById: qsUser.id,
          },
        });
      }
    }

    // 2. Seed BOQ Items & Budget Lines for Westlands Commercial Centre (SBC-PRJ-002)
    if (prjWestlands) {
      const phWccExcav = prjWestlands.phases[0];
      const phWccRaft = prjWestlands.phases[1];
      const phWccTower = prjWestlands.phases[2];
      const phWccFacade = prjWestlands.phases[3];

      const westlandsBoqData = [
        {
          phaseId: phWccExcav?.id,
          itemCode: "BOQ-WCC-A.01",
          description:
            "600mm diameter contiguous bored concrete secant piles (14m deep) with temporary tie-back rock anchors along Waiyaki Way",
          category: "SUBSTRUCTURE",
          costCategory: "SUBCONTRACTORS",
          unit: "m",
          quantity: 1650,
          executedQuantity: 1650,
          unitRate: 28000,
          notes: "100% completed and load-tested",
        },
        {
          phaseId: phWccRaft?.id,
          itemCode: "BOQ-WCC-B.01",
          description:
            "1800mm thick high-strength C35/20 waterproofed raft foundation with crystalline admixture & PVC waterstops",
          category: "SUBSTRUCTURE",
          costCategory: "MATERIALS",
          unit: "m³",
          quantity: 4200,
          executedQuantity: 4200,
          unitRate: 22500,
          notes: "Continuous 36-hour pour completed",
        },
        {
          phaseId: phWccTower?.id,
          itemCode: "BOQ-WCC-C.01",
          description:
            "High-yield T32 & T25 deformed structural reinforcement bars with mechanical couplers for tower columns & shear cores",
          category: "STEELWORK",
          costCategory: "MATERIALS",
          unit: "Tonnes",
          quantity: 620,
          executedQuantity: 195,
          unitRate: 192000,
          notes: "Deliveries ongoing for 3rd and 4th Floor slabs",
        },
        {
          phaseId: phWccTower?.id,
          itemCode: "BOQ-WCC-C.02",
          description:
            "Class 40/20 structural concrete in commercial tower flat slabs, drop panels, and perimeter columns (Floors 1–9)",
          category: "SUPERSTRUCTURE_CONCRETE",
          costCategory: "MATERIALS",
          unit: "m³",
          quantity: 6800,
          executedQuantity: 1750,
          unitRate: 23500,
          notes: "Pumped ready-mix concrete with superplasticizer",
        },
        {
          phaseId: phWccFacade?.id,
          itemCode: "BOQ-WCC-D.01",
          description:
            "Unitized double-glazed Low-E solar-control aluminium curtain wall system (6mm+12A+6mm) complete with spider fittings",
          category: "FINISHES",
          costCategory: "SUBCONTRACTORS",
          unit: "m²",
          quantity: 5400,
          executedQuantity: 0,
          unitRate: 18500,
          notes: "Shop drawings & wind-load mock-up under review",
        },
      ];

      for (const item of westlandsBoqData) {
        await prisma.boqItem.create({
          data: {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            phaseId: item.phaseId,
            itemCode: item.itemCode,
            description: item.description,
            category: item.category,
            costCategory: item.costCategory,
            unit: item.unit,
            quantity: item.quantity,
            executedQuantity: item.executedQuantity,
            unitRate: item.unitRate,
            totalAmount: item.quantity * item.unitRate,
            executedAmount: item.executedQuantity * item.unitRate,
            notes: item.notes,
            createdById: qsUser.id,
          },
        });
      }

      const westlandsBudgets = [
        {
          code: "BDG-WCC-MAT",
          category: "MATERIALS",
          title: "C40 Ready-Mix Concrete, High-Tensile Rebar, Couplers & Waterproofing",
          description: "Structural and architectural materials for 9-storey commercial complex.",
          allocatedBudget: 310000000,
          committedCost: 162000000,
          actualCost: 121000000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
        },
        {
          code: "BDG-WCC-SUB",
          category: "SUBCONTRACTORS",
          title: "Piling & Shoring, Curtain Wall Glazing, HVAC & High-Speed Lifts",
          description: "Specialist commercial packages.",
          allocatedBudget: 175000000,
          committedCost: 84000000,
          actualCost: 56500000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
        },
        {
          code: "BDG-WCC-LAB",
          category: "LABOUR",
          title: "Tower Formwork Crews, Steel Fixers, Concreting & Site Supervision",
          description: "Direct site labour and technical teams.",
          allocatedBudget: 72000000,
          committedCost: 28000000,
          actualCost: 24500000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
        },
        {
          code: "BDG-WCC-EQP",
          category: "EQUIPMENT",
          title: "Luffing Jib Tower Crane, Stationary Boom Pump & Dewatering Pumps",
          description: "Heavy plant and triple-basement dewatering equipment.",
          allocatedBudget: 58000000,
          committedCost: 24000000,
          actualCost: 22500000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
        },
      ];

      for (const b of westlandsBudgets) {
        await prisma.projectBudgetLine.create({
          data: {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            code: b.code,
            category: b.category,
            title: b.title,
            description: b.description,
            allocatedBudget: b.allocatedBudget,
            committedCost: b.committedCost,
            actualCost: b.actualCost,
            alertThresholdPct: b.alertThresholdPct,
            status: b.status,
            updatedById: qsUser.id,
          },
        });
      }
    }

    // 3. Seed BOQ Items & Budget Lines for Karen Luxury Residence (SBC-PRJ-003) — includes a BUDGET EXCEEDED alert!
    if (prjKaren) {
      const phKarenFound = prjKaren.phases[0];
      const phKarenRoof = prjKaren.phases[1];
      const phKarenFinish = prjKaren.phases[2];

      const karenBoqData = [
        {
          phaseId: phKarenFound?.id,
          itemCode: "BOQ-KRN-A.01",
          description:
            "Reinforced concrete strip foundations, ground beam, 150mm ground floor slab & first-floor suspended slab",
          category: "SUPERSTRUCTURE_CONCRETE",
          costCategory: "MATERIALS",
          unit: "m³",
          quantity: 920,
          executedQuantity: 920,
          unitRate: 20500,
          notes: "100% complete",
        },
        {
          phaseId: phKarenRoof?.id,
          itemCode: "BOQ-KRN-B.01",
          description:
            "Pressure-treated Kenyan cypress roof trusses (150x50mm) with breathable underlay & imported Spanish clay interlocking tiles",
          category: "ROOFING",
          costCategory: "MATERIALS",
          unit: "m²",
          quantity: 1150,
          executedQuantity: 1150,
          unitRate: 12600,
          notes: "Completed; minor timber price variation absorbed",
        },
        {
          phaseId: phKarenFinish?.id,
          itemCode: "BOQ-KRN-C.01",
          description:
            "Supply & lay 1200x1200mm imported Italian Calacatta porcelain floor & wall slabs with two-part epoxy grout",
          category: "FINISHES",
          costCategory: "MATERIALS",
          unit: "m²",
          quantity: 680,
          executedQuantity: 290,
          unitRate: 16500,
          notes: "Remaining 390 m² held at Mombasa Port awaiting KRA release",
        },
        {
          phaseId: phKarenFinish?.id,
          itemCode: "BOQ-KRN-C.02",
          description:
            "Bespoke kiln-dried seasoned mahogany solid panel doors, architraves, walk-in wardrobes & custom island kitchen",
          category: "FINISHES",
          costCategory: "SUBCONTRACTORS",
          unit: "Item",
          quantity: 1,
          executedQuantity: 0.6,
          unitRate: 14800000,
          notes: "60% installed in guest wing and upper bedrooms",
        },
      ];

      for (const item of karenBoqData) {
        await prisma.boqItem.create({
          data: {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            phaseId: item.phaseId,
            itemCode: item.itemCode,
            description: item.description,
            category: item.category,
            costCategory: item.costCategory,
            unit: item.unit,
            quantity: item.quantity,
            executedQuantity: item.executedQuantity,
            unitRate: item.unitRate,
            totalAmount: item.quantity * item.unitRate,
            executedAmount: item.executedQuantity * item.unitRate,
            notes: item.notes,
            createdById: qsUser.id,
          },
        });
      }

      const karenBudgets = [
        {
          code: "BDG-KRN-MAT",
          category: "MATERIALS",
          title: "Imported Italian Porcelain Tiles, Clay Roof Tiles, Stone & Sanitary Ware",
          description: "High-spec residential finishes and structural materials.",
          allocatedBudget: 44000000,
          committedCost: 46200000,
          actualCost: 39800000,
          alertThresholdPct: 85,
          status: "EXCEEDED",
          notes: "OVERRUN FLAG: Port demurrage & EUR/KES exchange rate pushed committed material cost +5.0% above baseline.",
        },
        {
          code: "BDG-KRN-SUB",
          category: "SUBCONTRACTORS",
          title: "Bespoke Mahogany Joinery, Heated Pool, Solar PV & Smart Home Automation",
          description: "Specialist residential craftsmanship and MEP packages.",
          allocatedBudget: 21500000,
          committedCost: 19200000,
          actualCost: 16400000,
          alertThresholdPct: 85,
          status: "OVERRUN_RISK",
          notes: "89.3% committed following client kitchen island upgrade.",
        },
        {
          code: "BDG-KRN-LAB",
          category: "LABOUR",
          title: "Master Artisans, Tilers, Stone Dressers & Site Supervision",
          description: "Direct skilled site workforce.",
          allocatedBudget: 13000000,
          committedCost: 10800000,
          actualCost: 10200000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
        },
      ];

      for (const b of karenBudgets) {
        await prisma.projectBudgetLine.create({
          data: {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            code: b.code,
            category: b.category,
            title: b.title,
            description: b.description,
            allocatedBudget: b.allocatedBudget,
            committedCost: b.committedCost,
            actualCost: b.actualCost,
            alertThresholdPct: b.alertThresholdPct,
            status: b.status,
            notes: b.notes,
            updatedById: qsUser.id,
          },
        });
      }
    }

    // 4. Seed BOQ Items & Budget Lines for Tatu City Logistics Warehouse (SBC-PRJ-004)
    if (prjWarehouse) {
      const warehouseBoqData = [
        {
          itemCode: "BOQ-TATU-A.01",
          description:
            "Excavate expansive black-cotton clay (1.4m deep) and backfill with compacted 600mm graded quarry stone sub-base",
          category: "SUBSTRUCTURE",
          costCategory: "EQUIPMENT",
          unit: "m³",
          quantity: 16800,
          executedQuantity: 6200,
          unitRate: 1850,
          notes: "Earthworks & roller compaction in progress",
        },
        {
          itemCode: "BOQ-TATU-B.01",
          description:
            "Fabricate, shot-blast, prime & erect Grade S355 structural steel portal frames (32m clear span, 12m eaves height)",
          category: "STEELWORK",
          costCategory: "MATERIALS",
          unit: "Tonnes",
          quantity: 380,
          executedQuantity: 45,
          unitRate: 245000,
          notes: "Workshop fabrication 40% complete; holding-down bolts cast",
        },
        {
          itemCode: "BOQ-TATU-C.01",
          description:
            "200mm thick laser-screeded fibre-reinforced C35/20 industrial warehouse floor slab with power-floated quartz hardener",
          category: "SUPERSTRUCTURE_CONCRETE",
          costCategory: "MATERIALS",
          unit: "m²",
          quantity: 12000,
          executedQuantity: 0,
          unitRate: 4800,
          notes: "Scheduled after portal frame roof cover",
        },
      ];

      for (const item of warehouseBoqData) {
        await prisma.boqItem.create({
          data: {
            organizationId: summitOrg.id,
            projectId: prjWarehouse.id,
            itemCode: item.itemCode,
            description: item.description,
            category: item.category,
            costCategory: item.costCategory,
            unit: item.unit,
            quantity: item.quantity,
            executedQuantity: item.executedQuantity,
            unitRate: item.unitRate,
            totalAmount: item.quantity * item.unitRate,
            executedAmount: item.executedQuantity * item.unitRate,
            notes: item.notes,
            createdById: qsUser.id,
          },
        });
      }

      const warehouseBudgets = [
        {
          code: "BDG-TATU-MAT",
          category: "MATERIALS",
          title: "Structural Steel Portal Frames, Aluzinc Cladding, Fibre Concrete & Quarry Stone",
          description: "Primary industrial materials.",
          allocatedBudget: 165000000,
          committedCost: 58000000,
          actualCost: 24000000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
        },
        {
          code: "BDG-TATU-EQP",
          category: "EQUIPMENT",
          title: "Excavators, Vibratory Rollers, Mobile Cranes & Laser Screed Machine",
          description: "Earthmoving and steel erection plant.",
          allocatedBudget: 48000000,
          committedCost: 18500000,
          actualCost: 9200000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
        },
        {
          code: "BDG-TATU-LAB",
          category: "LABOUR",
          title: "Rigging Crews, Certified Welders, Concretors & Site Engineers",
          description: "Industrial erection & civil works workforce.",
          allocatedBudget: 49000000,
          committedCost: 8500000,
          actualCost: 5200000,
          alertThresholdPct: 85,
          status: "WITHIN_BUDGET",
        },
      ];

      for (const b of warehouseBudgets) {
        await prisma.projectBudgetLine.create({
          data: {
            organizationId: summitOrg.id,
            projectId: prjWarehouse.id,
            code: b.code,
            category: b.category,
            title: b.title,
            description: b.description,
            allocatedBudget: b.allocatedBudget,
            committedCost: b.committedCost,
            actualCost: b.actualCost,
            alertThresholdPct: b.alertThresholdPct,
            status: b.status,
            updatedById: qsUser.id,
          },
        });
      }
    }
  }

  // ==========================================================================
  // PHASE 5 SEED DATA: SUPPLIERS, MATERIALS CATALOG, SITE STOCK & USAGE LOGS
  // ==========================================================================
  const existingSupplierCount = await prisma.supplier.count({
    where: { organizationId: summitOrg.id },
  });

  if (existingSupplierCount === 0) {
    const summitUsers = await prisma.user.findMany({
      where: { organizationId: summitOrg.id },
    });
    const siteMgrUser =
      summitUsers.find((u) => u.role === "SITE_MANAGER") || summitUsers[0];
    const foremanUser =
      summitUsers.find((u) => u.role === "SITE_STAFF") || summitUsers[0];

    // 1. Seed Kenyan Construction Suppliers (Section 17)
    const supBamburi = await prisma.supplier.create({
      data: {
        organizationId: summitOrg.id,
        code: "SUP-001",
        name: "Bamburi Cement PLC (Holcim Kenya)",
        category: "CEMENT_CONCRETE",
        contactPerson: "Eng. Martin Ndegwa",
        phone: "+254 722 202 111",
        email: "corporate.sales@bamburicement.com",
        address: "Kitui Road, Industrial Area",
        city: "Nairobi",
        taxPin: "P051092831B",
        paymentTerms: "Net 30 Days",
        bankName: "Stanbic Bank Kenya — Corporate Branch",
        bankAccountNumber: "0100004829101",
        mpesaPaybill: "Paybill 522522 • Acc: BAMBURI-SBC",
        suppliedMaterials:
          "Nguvu CEM IV/B 32.5N, PowerPlus 42.5N Structural Cement, Ready-Mix Concrete C30/C35/C40",
        rating: 4.9,
        totalPurchased: 68400000,
        totalPaid: 54200000,
        outstandingBalance: 14200000,
        status: "ACTIVE",
        notes: "Primary bulk cement & ready-mix concrete partner for Riverside & Westlands.",
      },
    });

    const supDevki = await prisma.supplier.create({
      data: {
        organizationId: summitOrg.id,
        code: "SUP-002",
        name: "Devki Steel Mills Ltd.",
        category: "STEEL_METALS",
        contactPerson: "Rajesh Patel",
        phone: "+254 733 610 400",
        email: "orders@devkisteel.co.ke",
        address: "Mombasa Road, Athi River Steel Complex",
        city: "Athi River / Machakos",
        taxPin: "P051144890D",
        paymentTerms: "50% Deposit, 50% on Delivery",
        bankName: "KCB Bank Kenya — Moi Avenue",
        bankAccountNumber: "1109482716",
        mpesaPaybill: "Paybill 522533 • Acc: DEVKI-SBC",
        suppliedMaterials:
          "BS 4449 Grade 500B High-Yield Deformed Rebar (T10–T32), BRC Mesh A142, S355 Structural Steel I-Beams",
        rating: 4.9,
        totalPurchased: 94500000,
        totalPaid: 76000000,
        outstandingBalance: 18500000,
        status: "ACTIVE",
        notes: "KEBS certified mill certificates supplied with every trailer batch.",
      },
    });

    const supNdarugo = await prisma.supplier.create({
      data: {
        organizationId: summitOrg.id,
        code: "SUP-003",
        name: "Ndarugo Quarry & Aggregates Ltd.",
        category: "AGGREGATES_QUARRY",
        contactPerson: "Stephen Kariuki",
        phone: "+254 712 889 340",
        email: "dispatch@ndarugoquarry.co.ke",
        address: "Thika Superhighway, Juja / Ndarugo",
        city: "Kiambu",
        taxPin: "P051399201N",
        paymentTerms: "Weekly Settlement (7 Days)",
        bankName: "Equity Bank — Thika Road Mall",
        bankAccountNumber: "0180299481200",
        mpesaPaybill: "Paybill 247247 • Acc: 0712889340",
        suppliedMaterials:
          "Machine-Cut 200mm Quarry Stone, 20mm Graded Ballast, Washed River Sand, Hand-Packed Hardcore",
        rating: 4.7,
        totalPurchased: 24800000,
        totalPaid: 21600000,
        outstandingBalance: 3200000,
        status: "ACTIVE",
        notes: "20-tonne tipper fleet with calibrated weighbridge tickets.",
      },
    });

    const supTileCarpet = await prisma.supplier.create({
      data: {
        organizationId: summitOrg.id,
        code: "SUP-004",
        name: "Tile & Carpet Centre Ltd.",
        category: "TILES_FINISHES",
        contactPerson: "Amina Mohamed",
        phone: "+254 709 778 000",
        email: "projects@tileandcarpet.co.ke",
        address: "Mombasa Road, Parkside Towers",
        city: "Nairobi",
        taxPin: "P051029384T",
        paymentTerms: "Net 30 Days",
        bankName: "I&M Bank — Parklands",
        bankAccountNumber: "001028374910",
        mpesaPaybill: "Paybill 542542 • Acc: TCC-SUMMIT",
        suppliedMaterials:
          "Imported Porcelain & Ceramic Tiles, Duravit Sanitary Ware, Grohe Mixers, Epoxy Grout & Adhesives",
        rating: 4.8,
        totalPurchased: 19600000,
        totalPaid: 14100000,
        outstandingBalance: 5500000,
        status: "ACTIVE",
      },
    });

    const supDavis = await prisma.supplier.create({
      data: {
        organizationId: summitOrg.id,
        code: "SUP-005",
        name: "Davis & Shirtliff Ltd.",
        category: "PLUMBING_WATER",
        contactPerson: "Eng. Kevin Omondi",
        phone: "+254 711 079 000",
        email: "commercial@dayliff.com",
        address: "Dundori Road, Industrial Area",
        city: "Nairobi",
        taxPin: "P051001928D",
        paymentTerms: "Net 30 Days",
        bankName: "Absa Bank Kenya — Queensway",
        bankAccountNumber: "2029384756",
        mpesaPaybill: "Paybill 900200 • Acc: DAYLIFF",
        suppliedMaterials:
          "PPR PN20 Hot/Cold Pipes, UPVC Drainage, Booster Pumps, Solar Water Heating & Borehole Equipment",
        rating: 4.9,
        totalPurchased: 16200000,
        totalPaid: 16200000,
        outstandingBalance: 0,
        status: "ACTIVE",
      },
    });

    const supCrown = await prisma.supplier.create({
      data: {
        organizationId: summitOrg.id,
        code: "SUP-006",
        name: "Crown Paints Kenya PLC",
        category: "PAINTS_CHEMICALS",
        contactPerson: "Lucy Muthoni",
        phone: "+254 709 887 000",
        email: "trade@crownpaints.co.ke",
        address: "Likoni Road, Industrial Area",
        city: "Nairobi",
        taxPin: "P051088472C",
        paymentTerms: "Net 30 Days",
        bankName: "NCBA Bank — Upper Hill",
        bankAccountNumber: "6502918273",
        mpesaPaybill: "Paybill 880100 • Acc: CROWN-SBC",
        suppliedMaterials:
          "Silk Vinyl Emulsion, WeatherGuard Exterior, Epoxy Floor Coatings, Waterproofing Admixtures",
        rating: 4.6,
        totalPurchased: 7400000,
        totalPaid: 6100000,
        outstandingBalance: 1300000,
        status: "ACTIVE",
      },
    });

    // 2. Seed Master Construction Materials Catalog (Section 14)
    const matCement32 = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-CEM-001",
        name: "Bamburi Nguvu Cement CEM IV/B 32.5N (50kg Bag)",
        category: "CEMENT_BINDERS",
        unit: "Bags",
        standardUnitCost: 780,
        minimumReorderLevel: 200,
        specification: "KEBS KS EAS 18-1 • General Masonry, Plaster & Screed",
        preferredSupplierId: supBamburi.id,
        status: "ACTIVE",
      },
    });

    const matCement42 = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-CEM-002",
        name: "Bamburi PowerPlus Structural Cement 42.5N (50kg Bag)",
        category: "CEMENT_BINDERS",
        unit: "Bags",
        standardUnitCost: 920,
        minimumReorderLevel: 150,
        specification: "High Early-Strength Structural RC Columns & Post-Tensioned Slabs",
        preferredSupplierId: supBamburi.id,
        status: "ACTIVE",
      },
    });

    const matReadyMixC35 = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-CEM-003",
        name: "Ready-Mix Structural Concrete Class 35/20 (Pumped)",
        category: "CEMENT_BINDERS",
        unit: "m³",
        standardUnitCost: 18500,
        minimumReorderLevel: 50,
        specification: "Slump 120±25mm • 28-Day Cube Strength ≥ 35 N/mm²",
        preferredSupplierId: supBamburi.id,
        status: "ACTIVE",
      },
    });

    const matSteelRebar = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-STL-001",
        name: "High-Tensile Deformed Steel Rebar T16 / T20 / T25 (BS 4449)",
        category: "STEEL_REBAR",
        unit: "Tonnes",
        standardUnitCost: 178000,
        minimumReorderLevel: 15,
        specification: "Grade 500B Ribbed Weldable Reinforcement Steel",
        preferredSupplierId: supDevki.id,
        status: "ACTIVE",
      },
    });

    const matStructuralSteel = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-STL-002",
        name: "Grade S355 Universal Steel Portal I-Beams & Stanchions",
        category: "STEEL_REBAR",
        unit: "Tonnes",
        standardUnitCost: 225000,
        minimumReorderLevel: 10,
        specification: "EN 10025 S355JR Shot-Blasted & Zinc-Phosphate Primed",
        preferredSupplierId: supDevki.id,
        status: "ACTIVE",
      },
    });

    const matRiverSand = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-AGG-001",
        name: "Washed Machakos River Sand (Fine Aggregate)",
        category: "AGGREGATES_SAND",
        unit: "Tonnes",
        standardUnitCost: 2400,
        minimumReorderLevel: 60,
        specification: "Silt content < 3% • Screened for Concrete & Plaster",
        preferredSupplierId: supNdarugo.id,
        status: "ACTIVE",
      },
    });

    const matBallast = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-AGG-002",
        name: "Crushed Graded Blue Trap-Rock Ballast (14–20mm)",
        category: "AGGREGATES_SAND",
        unit: "Tonnes",
        standardUnitCost: 2100,
        minimumReorderLevel: 80,
        specification: "Clean Crushed Coarse Aggregate for Structural Concrete",
        preferredSupplierId: supNdarugo.id,
        status: "ACTIVE",
      },
    });

    const matQuarryStone = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-MAS-001",
        name: "Machine-Cut Ndarugo Quarry Stone Blocks (200x200x400mm)",
        category: "MASONRY_BLOCKS",
        unit: "Pieces",
        standardUnitCost: 65,
        minimumReorderLevel: 2500,
        specification: "Chisel-dressed load-bearing natural stone masonry units",
        preferredSupplierId: supNdarugo.id,
        status: "ACTIVE",
      },
    });

    const matMarinePly = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-TMB-001",
        name: "18mm Film-Faced Marine Plywood Formwork Boards (8x4ft)",
        category: "TIMBER_FORMWORK",
        unit: "Pieces",
        standardUnitCost: 4200,
        minimumReorderLevel: 120,
        specification: "Phenolic WBP Glue • Fair-Faced Concrete Soffit Shutters",
        preferredSupplierId: supNdarugo.id,
        status: "ACTIVE",
      },
    });

    const matPorcelainTiles = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-FIN-001",
        name: "Imported Italian Calacatta Porcelain Slabs (1200x1200mm)",
        category: "TILES_FINISHES",
        unit: "m²",
        standardUnitCost: 11800,
        minimumReorderLevel: 80,
        specification: "Rectified Book-Matched Luxury Floor & Wall Slabs",
        preferredSupplierId: supTileCarpet.id,
        status: "ACTIVE",
      },
    });

    const matPprPipes = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-PLM-001",
        name: "PPR PN20 Hot & Cold Water Riser Pipes (32mm x 4m)",
        category: "PLUMBING_PIPES",
        unit: "Lengths",
        standardUnitCost: 1450,
        minimumReorderLevel: 100,
        specification: "DIN 8077/8078 Fusion-Welded Pressure Piping",
        preferredSupplierId: supDavis.id,
        status: "ACTIVE",
      },
    });

    const matWeatherGuard = await prisma.material.create({
      data: {
        organizationId: summitOrg.id,
        code: "MAT-PNT-001",
        name: "Crown WeatherGuard Exterior UV-Resistant Emulsion (20L)",
        category: "PAINTS_COATINGS",
        unit: "Litres",
        standardUnitCost: 680,
        minimumReorderLevel: 200,
        specification: "Anti-fungal exterior facade coating",
        preferredSupplierId: supCrown.id,
        status: "ACTIVE",
      },
    });

    // 3. Seed Project Material Requirements & Site Stock Ledger (Section 14)
    const projects = await prisma.project.findMany({
      where: { organizationId: summitOrg.id },
      include: { sites: true },
    });

    const prjRiverside = projects.find((p) => p.code === "SBC-PRJ-001");
    const prjWestlands = projects.find((p) => p.code === "SBC-PRJ-002");
    const prjKaren = projects.find((p) => p.code === "SBC-PRJ-003");
    const prjWarehouse = projects.find((p) => p.code === "SBC-PRJ-004");

    if (prjRiverside) {
      const siteRiv = prjRiverside.sites[0];

      const riversideStocks = [
        {
          material: matCement32,
          requiredQuantity: 12000,
          requestedQuantity: 7500,
          orderedQuantity: 7000,
          receivedQuantity: 6800,
          usedQuantity: 6490,
          wastageQuantity: 130,
          reorderLevel: 300,
          unitCost: 780,
          status: "LOW_STOCK", // Remaining = 180 bags (< 300 reorder level!)
          notes: "Block A & B 5th Floor masonry mortar consuming 75 bags/day. Reorder required.",
        },
        {
          material: matReadyMixC35,
          requiredQuantity: 5600,
          requestedQuantity: 4000,
          orderedQuantity: 3850,
          receivedQuantity: 3800,
          usedQuantity: 3782,
          wastageQuantity: 18,
          reorderLevel: 0,
          unitCost: 18500,
          status: "ADEQUATE",
          notes: "Direct batch-to-pump delivery on pour days; 0.47% pump line wastage.",
        },
        {
          material: matSteelRebar,
          requiredQuantity: 340,
          requestedQuantity: 280,
          orderedQuantity: 265,
          receivedQuantity: 260,
          usedQuantity: 242,
          wastageQuantity: 3.5,
          reorderLevel: 12,
          unitCost: 178000,
          status: "ADEQUATE", // Remaining = 14.5 Tonnes in steel yard
          notes: "14.5 Tonnes T16/T20 stacked in Block B bending yard.",
        },
        {
          material: matQuarryStone,
          requiredQuantity: 165000,
          requestedQuantity: 85000,
          orderedQuantity: 80000,
          receivedQuantity: 76000,
          usedQuantity: 68500,
          wastageQuantity: 1100,
          reorderLevel: 4000,
          unitCost: 65,
          status: "ADEQUATE", // Remaining = 6,400 pcs
          notes: "Ndarugo 200mm stone stacked on pallets at Gate B.",
        },
        {
          material: matMarinePly,
          requiredQuantity: 1600,
          requestedQuantity: 1400,
          orderedQuantity: 1400,
          receivedQuantity: 1400,
          usedQuantity: 1180,
          wastageQuantity: 65,
          reorderLevel: 100,
          unitCost: 4200,
          status: "ADEQUATE", // Remaining = 155 sheets
          notes: "Re-usable up to 6 slab cycles with mould release oil.",
        },
        {
          material: matPprPipes,
          requiredQuantity: 1800,
          requestedQuantity: 900,
          orderedQuantity: 800,
          receivedQuantity: 600,
          usedQuantity: 545,
          wastageQuantity: 10,
          reorderLevel: 100,
          unitCost: 1450,
          status: "LOW_STOCK", // Remaining = 45 lengths (< 100 reorder level)
          notes: "First-fix plumbing risers on 6th Floor need additional 300 lengths.",
        },
      ];

      for (const st of riversideStocks) {
        const remaining =
          Math.round(
            (st.receivedQuantity - st.usedQuantity - st.wastageQuantity) * 100
          ) / 100;
        const createdStock = await prisma.projectMaterialStock.create({
          data: {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            materialId: st.material.id,
            requiredQuantity: st.requiredQuantity,
            requestedQuantity: st.requestedQuantity,
            orderedQuantity: st.orderedQuantity,
            receivedQuantity: st.receivedQuantity,
            usedQuantity: st.usedQuantity,
            wastageQuantity: st.wastageQuantity,
            remainingQuantity: remaining,
            reorderLevel: st.reorderLevel,
            unitCost: st.unitCost,
            totalCost: st.receivedQuantity * st.unitCost,
            status: st.status,
            notes: st.notes,
            lastUpdatedById: foremanUser.id,
          },
        });

        // Create realistic MaterialUsageLog entries for Riverside
        await prisma.materialUsageLog.createMany({
          data: [
            {
              organizationId: summitOrg.id,
              projectMaterialStockId: createdStock.id,
              projectId: prjRiverside.id,
              siteId: siteRiv?.id,
              materialId: st.material.id,
              transactionType: "DELIVERY_RECEIVED",
              quantity: Math.round(st.receivedQuantity * 0.25),
              unitCost: st.unitCost,
              totalCost: Math.round(st.receivedQuantity * 0.25) * st.unitCost,
              workAreaOrPhase: "Main Site Store Yard — Gate A",
              referenceNumber: `DN-RIV-${Math.floor(1000 + Math.random() * 9000)}`,
              notes: "Verified weighbridge & delivery note at site gate.",
              recordedById: foremanUser.id,
            },
            {
              organizationId: summitOrg.id,
              projectMaterialStockId: createdStock.id,
              projectId: prjRiverside.id,
              siteId: siteRiv?.id,
              materialId: st.material.id,
              transactionType: "ISSUE_TO_WORKS",
              quantity: Math.round(st.usedQuantity * 0.15),
              unitCost: st.unitCost,
              totalCost: Math.round(st.usedQuantity * 0.15) * st.unitCost,
              workAreaOrPhase: "Block A & B — Superstructure / Masonry Works",
              referenceNumber: `SIN-RIV-${Math.floor(100 + Math.random() * 899)}`,
              notes: "Issued to site gang foreman against daily stores requisition.",
              recordedById: siteMgrUser.id,
            },
          ],
        });
      }
    }

    if (prjWestlands) {
      const siteWcc = prjWestlands.sites[0];
      const wccStocks = [
        {
          material: matCement42,
          requiredQuantity: 9500,
          requestedQuantity: 4200,
          orderedQuantity: 4000,
          receivedQuantity: 3900,
          usedQuantity: 3250,
          wastageQuantity: 40,
          reorderLevel: 250,
          unitCost: 920,
          status: "ADEQUATE", // Remaining = 610 bags
          notes: "High-strength 42.5N cement stored in dry silo bay.",
        },
        {
          material: matSteelRebar,
          requiredQuantity: 620,
          requestedQuantity: 240,
          orderedQuantity: 220,
          receivedQuantity: 205,
          usedQuantity: 192,
          wastageQuantity: 3,
          reorderLevel: 20,
          unitCost: 182000,
          status: "LOW_STOCK", // Remaining = 10 Tonnes (< 20 Tonnes reorder level)
          notes: "3rd Floor core wall steel fixing requires 45 Tonnes call-off from Devki.",
        },
        {
          material: matRiverSand,
          requiredQuantity: 1800,
          requestedQuantity: 800,
          orderedQuantity: 760,
          receivedQuantity: 740,
          usedQuantity: 640,
          wastageQuantity: 15,
          reorderLevel: 60,
          unitCost: 2400,
          status: "ADEQUATE", // Remaining = 85 Tonnes
          notes: "Stockpiled in Basement 1 aggregate bay.",
        },
      ];

      for (const st of wccStocks) {
        const remaining = st.receivedQuantity - st.usedQuantity - st.wastageQuantity;
        await prisma.projectMaterialStock.create({
          data: {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            siteId: siteWcc?.id,
            materialId: st.material.id,
            requiredQuantity: st.requiredQuantity,
            requestedQuantity: st.requestedQuantity,
            orderedQuantity: st.orderedQuantity,
            receivedQuantity: st.receivedQuantity,
            usedQuantity: st.usedQuantity,
            wastageQuantity: st.wastageQuantity,
            remainingQuantity: remaining,
            reorderLevel: st.reorderLevel,
            unitCost: st.unitCost,
            totalCost: st.receivedQuantity * st.unitCost,
            status: st.status,
            notes: st.notes,
            lastUpdatedById: siteMgrUser.id,
          },
        });
      }
    }

    if (prjKaren) {
      const siteKaren = prjKaren.sites[0];
      // Critical shortage on Imported Italian Porcelain Tiles matching the blocked task!
      await prisma.projectMaterialStock.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          siteId: siteKaren?.id,
          materialId: matPorcelainTiles.id,
          requiredQuantity: 680,
          requestedQuantity: 680,
          orderedQuantity: 680,
          receivedQuantity: 305,
          usedQuantity: 290,
          wastageQuantity: 8,
          remainingQuantity: 7, // Critical Shortage! Only 7 m² left on site
          reorderLevel: 50,
          unitCost: 11800,
          totalCost: 305 * 11800,
          status: "CRITICAL_SHORTAGE",
          notes:
            "CRITICAL: Only 7 m² remaining in site store; 375 m² balance held at Mombasa Port awaiting KRA release.",
          lastUpdatedById: siteMgrUser.id,
        },
      });

      await prisma.projectMaterialStock.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          siteId: siteKaren?.id,
          materialId: matWeatherGuard.id,
          requiredQuantity: 600,
          requestedQuantity: 400,
          orderedQuantity: 400,
          receivedQuantity: 400,
          usedQuantity: 220,
          wastageQuantity: 5,
          remainingQuantity: 175,
          reorderLevel: 80,
          unitCost: 680,
          totalCost: 400 * 680,
          status: "ADEQUATE",
          notes: "First coat exterior primer & emulsion underway on boundary wall & guesthouse.",
          lastUpdatedById: siteMgrUser.id,
        },
      });
    }

    if (prjWarehouse) {
      const siteTatu = prjWarehouse.sites[0];
      await prisma.projectMaterialStock.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWarehouse.id,
          siteId: siteTatu?.id,
          materialId: matStructuralSteel.id,
          requiredQuantity: 380,
          requestedQuantity: 160,
          orderedQuantity: 150,
          receivedQuantity: 65,
          usedQuantity: 45,
          wastageQuantity: 0.5,
          remainingQuantity: 19.5,
          reorderLevel: 15,
          unitCost: 225000,
          totalCost: 65 * 225000,
          status: "ADEQUATE",
          notes: "Portal frame stanchions Grid A–D delivered to Tatu City laydown yard.",
          lastUpdatedById: siteMgrUser.id,
        },
      });

      await prisma.projectMaterialStock.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWarehouse.id,
          siteId: siteTatu?.id,
          materialId: matBallast.id,
          requiredQuantity: 4200,
          requestedQuantity: 1800,
          orderedQuantity: 1600,
          receivedQuantity: 1550,
          usedQuantity: 1490,
          wastageQuantity: 25,
          remainingQuantity: 35,
          reorderLevel: 100,
          unitCost: 2100,
          totalCost: 1550 * 2100,
          status: "CRITICAL_SHORTAGE",
          notes: "Sub-base blinding requires urgent 400-tonne ballast delivery from Ndarugo Quarry.",
          lastUpdatedById: siteMgrUser.id,
        },
      });
    }
  }

  // ==========================================================================
  // PHASE 6 SEED DATA: MATERIAL REQUESTS, PURCHASE ORDERS & GOODS RECEIVED NOTES
  // ==========================================================================
  const existingMrCount = await prisma.materialRequest.count({
    where: { organizationId: summitOrg.id },
  });

  if (existingMrCount === 0) {
    const summitUsers = await prisma.user.findMany({
      where: { organizationId: summitOrg.id },
    });
    const pmUser =
      summitUsers.find((u) => u.role === "PROJECT_MANAGER") || summitUsers[0];
    const siteMgrUser =
      summitUsers.find((u) => u.role === "SITE_MANAGER") || summitUsers[0];
    const procUser =
      summitUsers.find((u) => u.role === "PROCUREMENT_OFFICER") || summitUsers[0];
    const foremanUser =
      summitUsers.find((u) => u.role === "SITE_STAFF") || summitUsers[0];
    const qsUser =
      summitUsers.find((u) => u.role === "QUANTITY_SURVEYOR") || summitUsers[0];

    const projects = await prisma.project.findMany({
      where: { organizationId: summitOrg.id },
      include: { sites: true, phases: true },
    });
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: summitOrg.id },
    });
    const materials = await prisma.material.findMany({
      where: { organizationId: summitOrg.id },
    });

    const prjRiverside = projects.find((p) => p.code === "SBC-PRJ-001");
    const prjWestlands = projects.find((p) => p.code === "SBC-PRJ-002");
    const prjKaren = projects.find((p) => p.code === "SBC-PRJ-003");
    const prjWarehouse = projects.find((p) => p.code === "SBC-PRJ-004");

    const supBamburi = suppliers.find((s) => s.code === "SUP-001");
    const supDevki = suppliers.find((s) => s.code === "SUP-002");
    const supNdarugo = suppliers.find((s) => s.code === "SUP-003");
    const supTileCarpet = suppliers.find((s) => s.code === "SUP-004");
    const supDavis = suppliers.find((s) => s.code === "SUP-005");

    const matCement32 = materials.find((m) => m.code === "MAT-CEM-001");
    const matReadyMixC35 = materials.find((m) => m.code === "MAT-CEM-003");
    const matSteelRebar = materials.find((m) => m.code === "MAT-STL-001");
    const matBallast = materials.find((m) => m.code === "MAT-AGG-002");
    const matQuarryStone = materials.find((m) => m.code === "MAT-MAS-001");
    const matMarinePly = materials.find((m) => m.code === "MAT-TMB-001");
    const matPorcelainTiles = materials.find((m) => m.code === "MAT-FIN-001");
    const matPprPipes = materials.find((m) => m.code === "MAT-PLM-001");

    if (
      prjRiverside &&
      prjWestlands &&
      prjKaren &&
      prjWarehouse &&
      supBamburi &&
      supDevki &&
      supNdarugo &&
      supTileCarpet &&
      supDavis &&
      matCement32 &&
      matReadyMixC35 &&
      matSteelRebar &&
      matBallast &&
      matQuarryStone &&
      matMarinePly &&
      matPorcelainTiles &&
      matPprPipes
    ) {
      const siteRiv = prjRiverside.sites[0];
      const siteWcc = prjWestlands.sites[0];
      const siteKaren = prjKaren.sites[0];
      const siteTatu = prjWarehouse.sites[0];

      const phRivStruct = prjRiverside.phases.find((ph) => ph.sequenceOrder === 3);
      const phRivMasonry = prjRiverside.phases.find((ph) => ph.sequenceOrder === 4);
      const phRivMep = prjRiverside.phases.find((ph) => ph.sequenceOrder === 5);

      // 1. Seed Material Requests (Section 15)
      const mr1 = await prisma.materialRequest.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          phaseId: phRivMasonry?.id,
          materialId: matCement32.id,
          requestNumber: "SBC-MR-2026-001",
          title: "Block A & B 5th–6th Floor Masonry Mortar & Plaster Cement",
          requestedQuantity: 800,
          approvedQuantity: 800,
          estimatedUnitCost: 780,
          estimatedTotalCost: 800 * 780,
          priority: "HIGH",
          requiredByDate: new Date("2026-03-10"),
          status: "PARTIALLY_RECEIVED",
          justification:
            "Site cement buffer fell below 200 bags; masonry gangs on Floor 5 consuming 75 bags/day.",
          approvalNotes:
            "Approved full 800 bags call-off under Bamburi framework agreement.",
          requestedById: siteMgrUser.id,
          approvedById: pmUser.id,
          approvedAt: new Date("2026-03-04"),
        },
      });

      const mr2 = await prisma.materialRequest.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          phaseId: phRivStruct?.id,
          materialId: matSteelRebar.id,
          requestNumber: "SBC-MR-2026-002",
          title: "9th Floor Post-Tensioned Slab & Core Wall High-Yield Rebar",
          requestedQuantity: 40,
          approvedQuantity: 40,
          estimatedUnitCost: 178000,
          estimatedTotalCost: 40 * 178000,
          priority: "URGENT",
          requiredByDate: new Date("2026-03-22"),
          status: "ORDERED",
          justification:
            "Required for 9th floor beam cages and shear walls ahead of concrete pour schedule.",
          approvalNotes: "Verified against structural bar bending schedule BBS-RIV-09.",
          requestedById: siteMgrUser.id,
          approvedById: pmUser.id,
          approvedAt: new Date("2026-03-12"),
        },
      });

      await prisma.materialRequest.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          phaseId: phRivMep?.id,
          materialId: matPprPipes.id,
          requestNumber: "SBC-MR-2026-003",
          title: "6th–8th Floor Hot & Cold Water PPR PN20 Riser Piping",
          requestedQuantity: 300,
          approvedQuantity: 300,
          estimatedUnitCost: 1450,
          estimatedTotalCost: 300 * 1450,
          priority: "HIGH",
          requiredByDate: new Date("2026-03-25"),
          status: "APPROVED",
          justification:
            "Only 45 lengths remaining in site store; plumbing first-fix pressure testing scheduled next week.",
          approvalNotes:
            "Approved by PM & QS. Ready for Procurement Officer to issue LPO to Davis & Shirtliff.",
          requestedById: foremanUser.id,
          approvedById: pmUser.id,
          approvedAt: new Date("2026-03-15"),
        },
      });

      await prisma.materialRequest.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          phaseId: phRivStruct?.id,
          materialId: matReadyMixC35.id,
          requestNumber: "SBC-MR-2026-004",
          title: "Block A 9th Floor Suspended Slab Ready-Mix Concrete C35/20",
          requestedQuantity: 185,
          approvedQuantity: 0,
          estimatedUnitCost: 18500,
          estimatedTotalCost: 185 * 18500,
          priority: "URGENT",
          requiredByDate: new Date("2026-03-28"),
          status: "SUBMITTED",
          justification:
            "Continuous 14-hour night pour for Block A 9th Floor slab after rebar & tendon inspection.",
          requestedById: siteMgrUser.id,
        },
      });

      const mr5 = await prisma.materialRequest.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          siteId: siteWcc?.id,
          materialId: matSteelRebar.id,
          requestNumber: "SBC-MR-2026-005",
          title: "Westlands Tower 3rd Floor Lift Core & Columns Rebar Batch",
          requestedQuantity: 45,
          approvedQuantity: 45,
          estimatedUnitCost: 180000,
          estimatedTotalCost: 45 * 180000,
          priority: "HIGH",
          requiredByDate: new Date("2026-03-14"),
          status: "RECEIVED",
          justification: "Lift core jump-form climbing shutters advancing to Level 3.",
          approvalNotes: "Approved and delivered in full via Devki trailer.",
          requestedById: siteMgrUser.id,
          approvedById: pmUser.id,
          approvedAt: new Date("2026-03-05"),
        },
      });

      const mr6 = await prisma.materialRequest.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          siteId: siteKaren?.id,
          materialId: matPorcelainTiles.id,
          requestNumber: "SBC-MR-2026-006",
          title: "Italian Calacatta Book-Matched Porcelain Floor & Wall Slabs",
          requestedQuantity: 680,
          approvedQuantity: 680,
          estimatedUnitCost: 11800,
          estimatedTotalCost: 680 * 11800,
          priority: "URGENT",
          requiredByDate: new Date("2026-03-01"),
          status: "PARTIALLY_RECEIVED",
          justification:
            "Master suite, double-volume lounge, and atrium staircase luxury tiling.",
          approvalNotes:
            "305 m² delivered to Karen site; remaining 375 m² awaiting customs release.",
          requestedById: siteMgrUser.id,
          approvedById: pmUser.id,
          approvedAt: new Date("2026-02-02"),
        },
      });

      await prisma.materialRequest.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWarehouse.id,
          siteId: siteTatu?.id,
          materialId: matBallast.id,
          requestNumber: "SBC-MR-2026-007",
          title: "Tatu City Warehouse Heavy-Duty Floor Slab Graded Ballast",
          requestedQuantity: 400,
          approvedQuantity: 400,
          estimatedUnitCost: 2100,
          estimatedTotalCost: 400 * 2100,
          priority: "HIGH",
          requiredByDate: new Date("2026-03-24"),
          status: "APPROVED",
          justification:
            "Site ballast stock at 35 tonnes (Critical Shortage); sub-base blinding in Bays 3–6.",
          approvalNotes: "Approved for immediate LPO issuance to Ndarugo Quarry.",
          requestedById: siteMgrUser.id,
          approvedById: pmUser.id,
          approvedAt: new Date("2026-03-16"),
        },
      });

      await prisma.materialRequest.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          siteId: siteWcc?.id,
          materialId: matMarinePly.id,
          requestNumber: "SBC-MR-2026-008",
          title: "Additional 250 Sheets 18mm Film-Faced Marine Plywood",
          requestedQuantity: 250,
          approvedQuantity: 0,
          estimatedUnitCost: 4200,
          estimatedTotalCost: 250 * 4200,
          priority: "LOW",
          requiredByDate: new Date("2026-04-02"),
          status: "REJECTED",
          justification: "Requested extra soffit shuttering boards for podium deck.",
          approvalNotes:
            "Rejected by QS: 155 reusable marine plywood sheets available for inter-site transfer from Riverside Block A.",
          requestedById: foremanUser.id,
          approvedById: qsUser.id,
          approvedAt: new Date("2026-03-11"),
        },
      });

      // 2. Seed Purchase Orders (LPOs) with VAT & Discount Calculations (Section 18)
      // PO 1: Bamburi Cement for Riverside (Partially Delivered: 500 / 800 bags)
      const po1Subtotal = 800 * 780 - 14000; // 610,000
      const po1Tax = Math.round(po1Subtotal * 0.16); // 97,600
      const po1Total = po1Subtotal + po1Tax; // 707,600
      const po1 = await prisma.purchaseOrder.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          supplierId: supBamburi.id,
          materialId: matCement32.id,
          materialRequestId: mr1.id,
          poNumber: "SBC-LPO-2026-001",
          quotationReference: "QTN-BAM-2026-089",
          orderedQuantity: 800,
          receivedQuantity: 500,
          unitPrice: 780,
          discountAmount: 14000,
          taxRatePct: 16.0,
          subtotalAmount: po1Subtotal,
          taxAmount: po1Tax,
          totalAmount: po1Total,
          paidAmount: 350000,
          paymentTerms: "Net 30 Days",
          expectedDeliveryDate: new Date("2026-03-12"),
          status: "PARTIALLY_DELIVERED",
          notes:
            "500 bags delivered in Batch 1; remaining 300 bags scheduled for delivery this week.",
          createdById: procUser.id,
          approvedById: pmUser.id,
          approvedAt: new Date("2026-03-05"),
        },
      });

      // PO 2: Devki Steel for Riverside (Approved & Dispatched: 0 / 40 Tonnes received yet)
      const po2Subtotal = 40 * 178000 - 120000; // 7,000,000
      const po2Tax = Math.round(po2Subtotal * 0.16); // 1,120,000
      const po2Total = po2Subtotal + po2Tax; // 8,120,000
      await prisma.purchaseOrder.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          supplierId: supDevki.id,
          materialId: matSteelRebar.id,
          materialRequestId: mr2.id,
          poNumber: "SBC-LPO-2026-002",
          quotationReference: "QTN-DVK-2026-312",
          orderedQuantity: 40,
          receivedQuantity: 0,
          unitPrice: 178000,
          discountAmount: 120000,
          taxRatePct: 16.0,
          subtotalAmount: po2Subtotal,
          taxAmount: po2Tax,
          totalAmount: po2Total,
          paidAmount: 4060000, // 50% deposit paid
          paymentTerms: "50% Deposit, 50% on Delivery",
          expectedDeliveryDate: new Date("2026-03-22"),
          status: "APPROVED",
          notes:
            "50% deposit settled via KCB RTGS. Mill test certificates required at Gate A upon arrival.",
          createdById: procUser.id,
          approvedById: pmUser.id,
          approvedAt: new Date("2026-03-13"),
        },
      });

      // PO 3: Devki Steel for Westlands Commercial Centre (Fully Delivered: 45 / 45 Tonnes)
      const po3Subtotal = 45 * 180000 - 90000; // 8,010,000
      const po3Tax = Math.round(po3Subtotal * 0.16); // 1,281,600
      const po3Total = po3Subtotal + po3Tax; // 9,291,600
      const po3 = await prisma.purchaseOrder.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          siteId: siteWcc?.id,
          supplierId: supDevki.id,
          materialId: matSteelRebar.id,
          materialRequestId: mr5.id,
          poNumber: "SBC-LPO-2026-003",
          quotationReference: "QTN-DVK-2026-275",
          orderedQuantity: 45,
          receivedQuantity: 45,
          unitPrice: 180000,
          discountAmount: 90000,
          taxRatePct: 16.0,
          subtotalAmount: po3Subtotal,
          taxAmount: po3Tax,
          totalAmount: po3Total,
          paidAmount: 5000000,
          paymentTerms: "50% Deposit, 50% on Delivery",
          expectedDeliveryDate: new Date("2026-03-14"),
          status: "DELIVERED",
          notes: "Delivered in full to Westlands Tower crane bay; GRN verified.",
          createdById: procUser.id,
          approvedById: pmUser.id,
          approvedAt: new Date("2026-03-06"),
        },
      });

      // PO 4: Tile & Carpet Centre for Karen Luxury Residence (Partially Delivered: 305 / 680 m²)
      const po4Subtotal = 680 * 11800 - 224000; // 7,800,000
      const po4Tax = Math.round(po4Subtotal * 0.16); // 1,248,000
      const po4Total = po4Subtotal + po4Tax; // 9,048,000
      const po4 = await prisma.purchaseOrder.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          siteId: siteKaren?.id,
          supplierId: supTileCarpet.id,
          materialId: matPorcelainTiles.id,
          materialRequestId: mr6.id,
          poNumber: "SBC-LPO-2026-004",
          quotationReference: "QTN-TCC-2026-041",
          orderedQuantity: 680,
          receivedQuantity: 305,
          unitPrice: 11800,
          discountAmount: 224000,
          taxRatePct: 16.0,
          subtotalAmount: po4Subtotal,
          taxAmount: po4Tax,
          totalAmount: po4Total,
          paidAmount: 4524000,
          paymentTerms: "Net 30 Days",
          expectedDeliveryDate: new Date("2026-03-19"),
          status: "PARTIALLY_DELIVERED",
          notes:
            "305 m² received in Lot 1; 375 m² balance in Container MSKU-4918220 clearing Mombasa Port.",
          createdById: procUser.id,
          approvedById: pmUser.id,
          approvedAt: new Date("2026-02-04"),
        },
      });

      // PO 5: Ndarugo Quarry for Riverside Apartments (Fully Delivered & Paid: 15,000 Stones)
      const po5Subtotal = 15000 * 65; // 975,000
      const po5Tax = Math.round(po5Subtotal * 0.16); // 156,000
      const po5Total = po5Subtotal + po5Tax; // 1,131,000
      const po5 = await prisma.purchaseOrder.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          supplierId: supNdarugo.id,
          materialId: matQuarryStone.id,
          poNumber: "SBC-LPO-2026-005",
          quotationReference: "QTN-NDQ-2026-119",
          orderedQuantity: 15000,
          receivedQuantity: 15000,
          unitPrice: 65,
          discountAmount: 0,
          taxRatePct: 16.0,
          subtotalAmount: po5Subtotal,
          taxAmount: po5Tax,
          totalAmount: po5Total,
          paidAmount: po5Total,
          paymentTerms: "Weekly Settlement (7 Days)",
          expectedDeliveryDate: new Date("2026-03-08"),
          status: "PAID",
          notes: "Delivered across 5 tipper lorries and settled in full via Equity Bank.",
          createdById: procUser.id,
          approvedById: pmUser.id,
          approvedAt: new Date("2026-03-01"),
        },
      });

      // 3. Seed Goods Received Notes (GRNs) at Site Gate (Section 16)
      await prisma.goodsReceivedNote.create({
        data: {
          organizationId: summitOrg.id,
          purchaseOrderId: po1.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          supplierId: supBamburi.id,
          materialId: matCement32.id,
          grnNumber: "SBC-GRN-2026-001",
          orderedQuantity: 800,
          receivedQuantity: 500,
          damagedQuantity: 12,
          missingQuantity: 288,
          unitCost: 780,
          acceptedValue: 500 * 780,
          deliveryNoteNumber: "DN-BAM-90412",
          vehicleRegNumber: "KDK 819M (28T Flatbed)",
          deliveryDate: new Date("2026-03-09"),
          inspectionStatus: "PARTIAL_ACCEPTANCE",
          notes:
            "500 bags accepted into dry silo store. 12 bags caked/torn on rear pallet rejected & returned on truck. 288 bags balance scheduled for Batch 2.",
          receivedById: foremanUser.id,
        },
      });

      await prisma.goodsReceivedNote.create({
        data: {
          organizationId: summitOrg.id,
          purchaseOrderId: po3.id,
          projectId: prjWestlands.id,
          siteId: siteWcc?.id,
          supplierId: supDevki.id,
          materialId: matSteelRebar.id,
          grnNumber: "SBC-GRN-2026-002",
          orderedQuantity: 45,
          receivedQuantity: 45,
          damagedQuantity: 0,
          missingQuantity: 0,
          unitCost: 180000,
          acceptedValue: 45 * 180000,
          deliveryNoteNumber: "DN-DVK-44109",
          vehicleRegNumber: "KDL 220Z (40ft Low-Loader)",
          deliveryDate: new Date("2026-03-13"),
          inspectionStatus: "ACCEPTED",
          notes:
            "Weighbridge ticket verified at 45.12 Tonnes net. KEBS BS 4449 mill certificate #MC-8821 filed.",
          receivedById: siteMgrUser.id,
        },
      });

      await prisma.goodsReceivedNote.create({
        data: {
          organizationId: summitOrg.id,
          purchaseOrderId: po4.id,
          projectId: prjKaren.id,
          siteId: siteKaren?.id,
          supplierId: supTileCarpet.id,
          materialId: matPorcelainTiles.id,
          grnNumber: "SBC-GRN-2026-003",
          orderedQuantity: 680,
          receivedQuantity: 305,
          damagedQuantity: 6,
          missingQuantity: 369,
          unitCost: 11800,
          acceptedValue: 305 * 11800,
          deliveryNoteNumber: "DN-TCC-11804",
          vehicleRegNumber: "KDJ 510A (Box Truck)",
          deliveryDate: new Date("2026-02-26"),
          inspectionStatus: "PARTIAL_ACCEPTANCE",
          notes:
            "305 m² book-matched Calacatta slabs inspected and stacked in Karen secure store. 6 m² had chipped corners on Crate #4 and were returned for replacement.",
          receivedById: siteMgrUser.id,
        },
      });

      await prisma.goodsReceivedNote.create({
        data: {
          organizationId: summitOrg.id,
          purchaseOrderId: po5.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          supplierId: supNdarugo.id,
          materialId: matQuarryStone.id,
          grnNumber: "SBC-GRN-2026-004",
          orderedQuantity: 15000,
          receivedQuantity: 15000,
          damagedQuantity: 140,
          missingQuantity: 0,
          unitCost: 65,
          acceptedValue: 15000 * 65,
          deliveryNoteNumber: "DN-NDQ-7731",
          vehicleRegNumber: "KDM 104B / KDL 908C",
          deliveryDate: new Date("2026-03-07"),
          inspectionStatus: "ACCEPTED",
          notes:
            "Supplier delivered 15,140 stones total; 15,000 sound dressed stones accepted and 140 broken stones set aside for hardcore sub-base.",
          receivedById: foremanUser.id,
        },
      });
    }
  }

  // ==========================================================================
  // PHASE 7 SEED DATA: WORKFORCE & LABOUR, SUBCONTRACTORS & EQUIPMENT FLEET
  // ==========================================================================
  const existingWorkerCount = await prisma.siteWorker.count({
    where: { organizationId: summitOrg.id },
  });

  if (existingWorkerCount === 0) {
    const summitUsers = await prisma.user.findMany({
      where: { organizationId: summitOrg.id },
    });
    const siteMgrUser =
      summitUsers.find((u) => u.role === "SITE_MANAGER") || summitUsers[0];
    const foremanUser =
      summitUsers.find((u) => u.role === "SITE_STAFF") || summitUsers[0];

    const projects = await prisma.project.findMany({
      where: { organizationId: summitOrg.id },
      include: { sites: true, phases: true },
    });

    const prjRiverside = projects.find((p) => p.code === "SBC-PRJ-001");
    const prjWestlands = projects.find((p) => p.code === "SBC-PRJ-002");
    const prjKaren = projects.find((p) => p.code === "SBC-PRJ-003");
    const prjWarehouse = projects.find((p) => p.code === "SBC-PRJ-004");

    if (prjRiverside && prjWestlands && prjKaren && prjWarehouse) {
      const siteRiv = prjRiverside.sites[0];
      const siteWcc = prjWestlands.sites[0];
      const siteKaren = prjKaren.sites[0];
      const siteTatu = prjWarehouse.sites[0];

      // 1. Seed Site Workforce & Muster Roll Workers (Section 19)
      const workersSeed = [
        {
          workerCode: "WRK-001",
          fullName: "Josephat Mutua Nzioka",
          nationalId: "24891023",
          phone: "+254 712 401 882",
          workerCategory: "FOREMAN_SUPERVISOR",
          tradeRole: "Head Steel Fixing Gang Leader",
          project: prjRiverside,
          site: siteRiv,
          dailyRate: 2800,
          overtimeHourlyRate: 400,
          daysWorked: 48,
          overtimeHours: 24,
          totalPaid: 128000,
          paymentStatus: "PARTIALLY_PAID",
          notes: "Leads 18-man reinforcement gang on Block A & B superstructure.",
        },
        {
          workerCode: "WRK-002",
          fullName: "Boniface Ochieng Otieno",
          nationalId: "27910445",
          phone: "+254 723 991 204",
          workerCategory: "SKILLED_ARTISAN",
          tradeRole: "Master Stone Mason (Grade I)",
          project: prjRiverside,
          site: siteRiv,
          dailyRate: 2200,
          overtimeHourlyRate: 320,
          daysWorked: 44,
          overtimeHours: 12,
          totalPaid: 90000,
          paymentStatus: "PARTIALLY_PAID",
          notes: "5th Floor natural stone walling & plumb alignment.",
        },
        {
          workerCode: "WRK-003",
          fullName: "Samuel Kiprop Koech",
          nationalId: "29401822",
          phone: "+254 720 554 190",
          workerCategory: "PLANT_OPERATOR",
          tradeRole: "Licensed Tower Crane Operator (DOSHS Cert)",
          project: prjRiverside,
          site: siteRiv,
          dailyRate: 3500,
          overtimeHourlyRate: 500,
          daysWorked: 52,
          overtimeHours: 38,
          totalPaid: 201000,
          paymentStatus: "PAID",
          notes: "Operates Potain MC 85B Tower Crane; night concrete pour certified.",
        },
        {
          workerCode: "WRK-004",
          fullName: "Patrick Wambua Musyoka",
          nationalId: "31029481",
          phone: "+254 715 309 871",
          workerCategory: "SKILLED_ARTISAN",
          tradeRole: "Formwork & Shuttering Carpenter",
          project: prjRiverside,
          site: siteRiv,
          dailyRate: 2100,
          overtimeHourlyRate: 300,
          daysWorked: 42,
          overtimeHours: 16,
          totalPaid: 75000,
          paymentStatus: "UNPAID_MUSTER",
          notes: "Current 2-week muster roll balance due this Friday via M-Pesa.",
        },
        {
          workerCode: "WRK-005",
          fullName: "Kelvin Barasa Wafula",
          nationalId: "34819204",
          phone: "+254 790 112 640",
          workerCategory: "CASUAL_LABOUR",
          tradeRole: "General Concrete & Material Handling Casual",
          project: prjRiverside,
          site: siteRiv,
          dailyRate: 1100,
          overtimeHourlyRate: 180,
          daysWorked: 38,
          overtimeHours: 20,
          totalPaid: 39000,
          paymentStatus: "PARTIALLY_PAID",
          notes: "Assigned to concrete poker vibration and cement offloading.",
        },
        {
          workerCode: "WRK-006",
          fullName: "Harrison Mwangi Karanja",
          nationalId: "26109482",
          phone: "+254 722 841 903",
          workerCategory: "FOREMAN_SUPERVISOR",
          tradeRole: "Jump-Form & Core Wall Chargehand",
          project: prjWestlands,
          site: siteWcc,
          dailyRate: 3000,
          overtimeHourlyRate: 450,
          daysWorked: 46,
          overtimeHours: 28,
          totalPaid: 150600,
          paymentStatus: "PAID",
          notes: "Supervises Westlands Commercial Centre lift core climbing shutters.",
        },
        {
          workerCode: "WRK-007",
          fullName: "Dennis Mutuku Muli",
          nationalId: "30192844",
          phone: "+254 718 662 310",
          workerCategory: "TECHNICIAN_MEP",
          tradeRole: "Licensed PPR Plumbing & Pressure Testing Technician",
          project: prjWestlands,
          site: siteWcc,
          dailyRate: 2500,
          overtimeHourlyRate: 350,
          daysWorked: 35,
          overtimeHours: 10,
          totalPaid: 78000,
          paymentStatus: "PARTIALLY_PAID",
          notes: "Basement & podium drainage stack testing.",
        },
        {
          workerCode: "WRK-008",
          fullName: "agrey Shivachi Mudavadi",
          nationalId: "25918273",
          phone: "+254 711 490 218",
          workerCategory: "SKILLED_ARTISAN",
          tradeRole: "Luxury Porcelain & Marble Tiler",
          project: prjKaren,
          site: siteKaren,
          dailyRate: 2800,
          overtimeHourlyRate: 400,
          daysWorked: 32,
          overtimeHours: 6,
          totalPaid: 82000,
          paymentStatus: "PARTIALLY_PAID",
          notes: "precision laser-leveled large format slab installation at Karen.",
        },
        {
          workerCode: "WRK-009",
          fullName: "Ezekiel Kimani Ndung'u",
          nationalId: "28491029",
          phone: "+254 724 771 009",
          workerCategory: "PLANT_OPERATOR",
          tradeRole: "Heavy Excavator & Compactor Operator",
          project: prjWarehouse,
          site: siteTatu,
          dailyRate: 3200,
          overtimeHourlyRate: 450,
          daysWorked: 40,
          overtimeHours: 18,
          totalPaid: 118000,
          paymentStatus: "PARTIALLY_PAID",
          notes: "Operates CAT 320D2 Excavator on Tatu City Warehouse pad bases.",
        },
      ];

      for (const w of workersSeed) {
        const totalEarned =
          w.daysWorked * w.dailyRate + w.overtimeHours * w.overtimeHourlyRate;
        const unpaidBalance = Math.max(0, totalEarned - w.totalPaid);

        const createdWorker = await prisma.siteWorker.create({
          data: {
            organizationId: summitOrg.id,
            projectId: w.project.id,
            siteId: w.site?.id,
            workerCode: w.workerCode,
            fullName: w.fullName,
            nationalId: w.nationalId,
            phone: w.phone,
            workerCategory: w.workerCategory,
            tradeRole: w.tradeRole,
            dailyRate: w.dailyRate,
            overtimeHourlyRate: w.overtimeHourlyRate,
            daysWorked: w.daysWorked,
            overtimeHours: w.overtimeHours,
            totalEarned,
            totalPaid: w.totalPaid,
            unpaidBalance,
            paymentStatus: w.paymentStatus,
            status: "ACTIVE",
            notes: w.notes,
          },
        });

        // Create sample attendance logs for each worker
        await prisma.workerAttendanceLog.createMany({
          data: [
            {
              organizationId: summitOrg.id,
              workerId: createdWorker.id,
              projectId: w.project.id,
              siteId: w.site?.id,
              attendanceDate: new Date("2026-03-16"),
              daysCredited: 1.0,
              overtimeHours: 2,
              dailyWageAmount: w.dailyRate + 2 * w.overtimeHourlyRate,
              workAreaOrActivity: `${w.tradeRole} — Daily Site Shift & Night Pour Prep`,
              recordedById: foremanUser.id,
            },
            {
              organizationId: summitOrg.id,
              workerId: createdWorker.id,
              projectId: w.project.id,
              siteId: w.site?.id,
              attendanceDate: new Date("2026-03-17"),
              daysCredited: 1.0,
              overtimeHours: 0,
              dailyWageAmount: w.dailyRate,
              workAreaOrActivity: `${w.tradeRole} — Standard 07:30–17:00 Muster Shift`,
              recordedById: siteMgrUser.id,
            },
          ],
        });
      }

      // 2. Seed Specialist Subcontractors (Section 20)
      const subcontractorsSeed = [
        {
          code: "SUB-001",
          companyName: "PowerGrid Electrical & Solar Engineers Ltd.",
          specialization: "ELECTRICAL_SOLAR",
          contactPerson: "Eng.Evans Kiptoo",
          phone: "+254 722 391 040",
          email: "projects@powergrid.co.ke",
          ncaCategory: "NCA-1 Electrical Engineering Services",
          taxPin: "P051290481P",
          project: prjRiverside,
          site: siteRiv,
          scopeOfWorks:
            "HV/LV Armored Cabling, Main Switchboards, First/Second Fix Conduits, Standby Generator ATS & Rooftop Solar PV",
          contractValue: 24500000,
          certifiedAmount: 11200000,
          paidAmount: 9500000,
          retentionPct: 10.0,
          startDate: new Date("2025-11-01"),
          endDate: new Date("2026-09-30"),
          paymentTerms: "Monthly Interim Valuation (Less 10% Retention)",
          performanceRating: 4.8,
          progressPct: 46,
          status: "ACTIVE_ON_SITE",
          notes: "First-fix conduits completed up to 7th Floor in Blocks A & B.",
        },
        {
          code: "SUB-002",
          companyName: "Schindler East Africa Elevators Ltd.",
          specialization: "LIFTS_ESCALATORS",
          contactPerson: "Eng. David Gichuru",
          phone: "+254 733 800 219",
          email: "installations.ke@schindler.com",
          ncaCategory: "NCA-1 Lifts, Hoists & Escalators",
          taxPin: "P051044912S",
          project: prjRiverside,
          site: siteRiv,
          scopeOfWorks:
            "Supply, Installation, Testing & Commissioning of 4 No. 13-Passenger High-Speed Gearless Lifts (1.75 m/s)",
          contractValue: 38000000,
          certifiedAmount: 19000000,
          paidAmount: 19000000,
          retentionPct: 10.0,
          startDate: new Date("2026-01-15"),
          endDate: new Date("2026-10-30"),
          paymentTerms: "50% Manufacturing & Shipping LC, 40% Guide Rails, 10% Commissioning",
          performanceRating: 4.9,
          progressPct: 50,
          status: "ACTIVE_ON_SITE",
          notes: "Lift shaft guide rail brackets currently being plumbed in Block A.",
        },
        {
          code: "SUB-003",
          companyName: "AquaFlow Mechanical & HVAC Contractors Ltd.",
          specialization: "PLUMBING_MECHANICAL",
          contactPerson: "Eng.Brian Oduor",
          phone: "+254 710 662 900",
          email: "contracts@aquaflow.co.ke",
          ncaCategory: "NCA-1 Mechanical, Plumbing & Fire Protection",
          taxPin: "P051388190A",
          project: prjWestlands,
          site: siteWcc,
          scopeOfWorks:
            "VRV Air Conditioning, Basement Smoke Extraction Fans, Wet Riser Fire Sprinklers & Boosted Water Supply",
          contractValue: 46000000,
          certifiedAmount: 14500000,
          paidAmount: 11800000,
          retentionPct: 10.0,
          startDate: new Date("2025-12-01"),
          endDate: new Date("2026-12-15"),
          paymentTerms: "30 Days after Architect/QS Interim Certificate",
          performanceRating: 4.7,
          progressPct: 32,
          status: "ACTIVE_ON_SITE",
          notes: "Basement fire sprinkler ring main pressure-tested at 16 Bar.",
        },
        {
          code: "SUB-004",
          companyName: "AluGlass Facades & Curtain Walling Kenya Ltd.",
          specialization: "GLAZING_ALUMINIUM",
          contactPerson: "hussein Al-Amin",
          phone: "+254 722 910 334",
          email: "technical@aluglass.co.ke",
          ncaCategory: "NCA-2 Specialist Glazing & Cladding",
          taxPin: "P051409182G",
          project: prjWestlands,
          site: siteWcc,
          scopeOfWorks:
            "Double-Glazed Solar-Control Low-E Unitized Curtain Wall & Alucobond Composite Facade Cladding",
          contractValue: 64000000,
          certifiedAmount: 18000000,
          paidAmount: 15000000,
          retentionPct: 10.0,
          startDate: new Date("2026-02-01"),
          endDate: new Date("2026-11-30"),
          paymentTerms: "Monthly Valuation Less 10% Retention",
          performanceRating: 4.6,
          progressPct: 28,
          status: "MOBILIZING",
          notes: "Aluminium transom extrusions fabricating at Mombasa Road factory; brackets on site.",
        },
        {
          code: "SUB-005",
          companyName: "Highland Timber & Decra Roofing Specialists",
          specialization: "ROOFING_WATERPROOFING",
          contactPerson: "Francis Njoroge",
          phone: "+254 714 509 811",
          email: "info@highlandroofing.co.ke",
          ncaCategory: "NCA-3 Building & Specialist Roofing",
          taxPin: "P051211904H",
          project: prjKaren,
          site: siteKaren,
          scopeOfWorks:
            "Pressure-Treated Cypress Roof Trusses, Torch-On APP Bituminous Waterproofing & Decra Heritage Stone-Coated Tiles",
          contractValue: 8400000,
          certifiedAmount: 8400000,
          paidAmount: 7980000,
          retentionPct: 5.0,
          startDate: new Date("2025-09-15"),
          endDate: new Date("2026-01-20"),
          paymentTerms: "5% Defects Liability Retention Held for 6 Months",
          performanceRating: 4.9,
          progressPct: 100,
          status: "COMPLETED",
          notes: "Package 100% complete & watertight; KSh 420,000 DLP retention held.",
        },
        {
          code: "SUB-006",
          companyName: "GeoPile Foundation & Structural Steel Erectors Ltd.",
          specialization: "EARTHWORKS_PILING",
          contactPerson: "Eng. Titus Mutemi",
          phone: "+254 721 678 440",
          email: "operations@geopile.co.ke",
          ncaCategory: "NCA-1 Civil & Structural Engineering",
          taxPin: "P051188293E",
          project: prjWarehouse,
          site: siteTatu,
          scopeOfWorks:
            "Heavy Portal Frame Stanchion Holding-Down Bolts, Rigging & Torque-Tensioned Steel Erection",
          contractValue: 29000000,
          certifiedAmount: 16500000,
          paidAmount: 13200000,
          retentionPct: 10.0,
          startDate: new Date("2026-01-10"),
          endDate: new Date("2026-07-30"),
          paymentTerms: "Monthly Valuation Less 10% Retention",
          performanceRating: 4.8,
          progressPct: 57,
          status: "ACTIVE_ON_SITE",
          notes: "Portal frames Grid 1–6 erected and plumbed.",
        },
      ];

      for (const sub of subcontractorsSeed) {
        await prisma.subcontractor.create({
          data: {
            organizationId: summitOrg.id,
            projectId: sub.project.id,
            siteId: sub.site?.id,
            code: sub.code,
            companyName: sub.companyName,
            specialization: sub.specialization,
            contactPerson: sub.contactPerson,
            phone: sub.phone,
            email: sub.email,
            ncaCategory: sub.ncaCategory,
            taxPin: sub.taxPin,
            scopeOfWorks: sub.scopeOfWorks,
            contractValue: sub.contractValue,
            certifiedAmount: sub.certifiedAmount,
            paidAmount: sub.paidAmount,
            retentionPct: sub.retentionPct,
            outstandingBalance: Math.max(0, sub.certifiedAmount - sub.paidAmount),
            startDate: sub.startDate,
            endDate: sub.endDate,
            paymentTerms: sub.paymentTerms,
            performanceRating: sub.performanceRating,
            progressPct: sub.progressPct,
            status: sub.status,
            notes: sub.notes,
          },
        });
      }

      // 3. Seed Construction Equipment Fleet & Maintenance Logs (Section 21)
      const eqpCraneRiv = await prisma.equipmentAsset.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          assetCode: "EQP-001",
          name: "Potain MC 85B Top-Slewing Tower Crane (50m Jib / 5T Tip)",
          category: "TOWER_MOBILE_CRANE",
          ownershipType: "HIRED_LEASED",
          vendorOrLessor: "Atlas Tower Cranes East Africa Ltd.",
          registrationOrSerial: "SN-PTC-85B-2023",
          operatorName: "Samuel Kiprop Koech",
          operatorPhone: "+254 720 554 190",
          availabilityStatus: "DEPLOYED_ACTIVE",
          dailyRate: 48000,
          totalHoursLogged: 1140,
          fuelLitresLogged: 0, // 3-Phase KPLC Electric
          totalOperatingCost: 6840000,
          nextServiceDueDate: new Date("2026-04-10"),
          notes: "DOSHS statutory lifting certificate #LC-2026-119 valid until Aug 2026.",
        },
      });

      const eqpConcretePump = await prisma.equipmentAsset.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          assetCode: "EQP-002",
          name: "Schwing Stetter SP 1800 High-Pressure Stationary Concrete Pump",
          category: "CONCRETE_BATCH_PUMP",
          ownershipType: "OWNED",
          vendorOrLessor: "Summit Build Plant Division",
          registrationOrSerial: "KHMA 882P",
          operatorName: "Peter Ndegwa",
          operatorPhone: "+254 714 229 810",
          availabilityStatus: "DEPLOYED_ACTIVE",
          dailyRate: 32000,
          totalHoursLogged: 680,
          fuelLitresLogged: 4950,
          totalOperatingCost: 2480000,
          nextServiceDueDate: new Date("2026-03-30"),
          notes: "Includes 120m high-pressure 125mm pipeline risers up to 9th Floor.",
        },
      });

      const eqpExcavator = await prisma.equipmentAsset.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWarehouse.id,
          siteId: siteTatu?.id,
          assetCode: "EQP-003",
          name: "Caterpillar 320D2 Hydraulic Tracked Excavator (1.2m³ Bucket)",
          category: "EXCAVATOR_EARTHMOVING",
          ownershipType: "OWNED",
          vendorOrLessor: "Summit Build Plant Division (Mantrac Serviced)",
          registrationOrSerial: "KHMA 412D",
          operatorName: "Ezekiel Kimani Ndung'u",
          operatorPhone: "+254 724 771 009",
          availabilityStatus: "DEPLOYED_ACTIVE",
          dailyRate: 38000,
          totalHoursLogged: 1850,
          fuelLitresLogged: 14200,
          totalOperatingCost: 4120000,
          nextServiceDueDate: new Date("2026-04-05"),
          notes: "Excavating portal frame pad bases and storm water culverts at Tatu City.",
        },
      });

      await prisma.equipmentAsset.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          siteId: siteWcc?.id,
          assetCode: "EQP-004",
          name: "Liebherr 130 EC-B6 Flat-Top Tower Crane (60m Jib)",
          category: "TOWER_MOBILE_CRANE",
          ownershipType: "HIRED_LEASED",
          vendorOrLessor: "panafrican Equipment Kenya",
          registrationOrSerial: "SN-LBH-130-991",
          operatorName: "Benson Mutua",
          operatorPhone: "+254 728 331 092",
          availabilityStatus: "DEPLOYED_ACTIVE",
          dailyRate: 55000,
          totalHoursLogged: 890,
          fuelLitresLogged: 0,
          totalOperatingCost: 5950000,
          nextServiceDueDate: new Date("2026-04-18"),
          notes: "Anti-collision zoning active for Westlands Commercial Centre.",
        },
      });

      await prisma.equipmentAsset.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          assetCode: "EQP-005",
          name: "Perkins 150 kVA Soundproof Prime Standby Diesel Generator",
          category: "GENERATOR_COMPRESSOR",
          ownershipType: "OWNED",
          vendorOrLessor: "Summit Build Plant Division",
          registrationOrSerial: "SN-PRK-150K-04",
          operatorName: "John Kariuki",
          operatorPhone: "+254 719 004 211",
          availabilityStatus: "DEPLOYED_ACTIVE",
          dailyRate: 14500,
          totalHoursLogged: 920,
          fuelLitresLogged: 6800,
          totalOperatingCost: 1620000,
          nextServiceDueDate: new Date("2026-04-12"),
          notes: "Powers site hoists, welding transformers, and floodlights during KPLC outages.",
        },
      });

      const eqpTipper = await prisma.equipmentAsset.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          siteId: siteWcc?.id,
          assetCode: "EQP-006",
          name: "SinoTruck Howo 371HP 6x4 25-Tonne Heavy Tipper Truck",
          category: "TIPPER_HAULAGE_TRUCK",
          ownershipType: "OWNED",
          vendorOrLessor: "Summit Build Plant Division",
          registrationOrSerial: "KDK 990T",
          operatorName: "Moses Kipchumba",
          operatorPhone: "+254 721 908 443",
          availabilityStatus: "UNDER_MAINTENANCE",
          dailyRate: 22000,
          totalHoursLogged: 2140,
          fuelLitresLogged: 19400,
          totalOperatingCost: 3580000,
          nextServiceDueDate: new Date("2026-03-20"),
          notes: "In Industrial Area workshop for hydraulic tipping ram seal replacement.",
        },
      });

      await prisma.equipmentAsset.create({
        data: {
          organizationId: summitOrg.id,
          projectId: null,
          siteId: null,
          assetCode: "EQP-007",
          name: "Bomag BW 211 D-40 Single Drum Vibratory Roller (11-Tonne)",
          category: "COMPACTOR_ROLLER",
          ownershipType: "OWNED",
          vendorOrLessor: "Summit Build Central Plant Yard",
          registrationOrSerial: "KHMA 109R",
          operatorName: "Unassigned (Central Yard)",
          availabilityStatus: "AVAILABLE_YARD",
          dailyRate: 26000,
          totalHoursLogged: 740,
          fuelLitresLogged: 4100,
          totalOperatingCost: 1290000,
          nextServiceDueDate: new Date("2026-05-01"),
          notes: "Serviced and ready for dispatch to Tatu City Warehouse sub-base compaction.",
        },
      });

      // Seed Equipment Maintenance Logs
      await prisma.equipmentMaintenanceLog.createMany({
        data: [
          {
            organizationId: summitOrg.id,
            equipmentId: eqpCraneRiv.id,
            projectId: prjRiverside.id,
            logNumber: "SBC-MNT-2026-001",
            maintenanceType: "DOSHS_STATUTORY_INSPECTION",
            title: "DOSHS 6-Monthly Statutory Hoist Rope, Slew Ring & Load Limiter Test",
            serviceDate: new Date("2026-02-15"),
            nextDueHoursOrDate: "2026-08-15",
            costAmount: 145000,
            technicianOrWorkshop: "DOSHS Approved Lifting Inspector & Atlas Crane Techs",
            status: "COMPLETED",
            notes: "Load test passed at 125% SWL; certificate displayed in crane cab.",
            recordedById: siteMgrUser.id,
          },
          {
            organizationId: summitOrg.id,
            equipmentId: eqpConcretePump.id,
            projectId: prjRiverside.id,
            logNumber: "SBC-MNT-2026-002",
            maintenanceType: "PREVENTIVE_SERVICE",
            title: "500-Hour Wear Plate, Spectacle Ring & Hydraulic Oil Filter Service",
            serviceDate: new Date("2026-03-02"),
            nextDueHoursOrDate: "1,000 Pumping Hours",
            costAmount: 185000,
            technicianOrWorkshop: "Schwing Stetter East Africa Mobile Service",
            status: "COMPLETED",
            notes: "Replaced S-valve wear ring ahead of 8th & 9th floor continuous pours.",
            recordedById: siteMgrUser.id,
          },
          {
            organizationId: summitOrg.id,
            equipmentId: eqpExcavator.id,
            projectId: prjWarehouse.id,
            logNumber: "SBC-MNT-2026-003",
            maintenanceType: "PREVENTIVE_SERVICE",
            title: "CAT 320D2 2,000-Hour Engine, Fuel Water Separator & Bucket Teeth Service",
            serviceDate: new Date("2026-03-08"),
            nextDueHoursOrDate: "2,250 Engine Hours",
            costAmount: 210000,
            technicianOrWorkshop: "Mantrac Kenya Field Service Van",
            status: "COMPLETED",
            notes: "Replaced 5 rock bucket teeth and primary hydraulic return filter.",
            recordedById: siteMgrUser.id,
          },
          {
            organizationId: summitOrg.id,
            equipmentId: eqpTipper.id,
            projectId: prjWestlands.id,
            logNumber: "SBC-MNT-2026-004",
            maintenanceType: "BREAKDOWN_REPAIR",
            title: "Telescopic Hydraulic Tipping Cylinder Seal Overhaul & Brake Relining",
            serviceDate: new Date("2026-03-16"),
            nextDueHoursOrDate: "2026-03-20 (Return to Site)",
            costAmount: 168000,
            technicianOrWorkshop: "Summit Central Workshop — Industrial Area",
            status: "IN_WORKSHOP",
            notes: "Stage-2 hydraulic ram seal blew during spoil tipping; kit fitted, pressure testing tomorrow.",
            recordedById: foremanUser.id,
          },
        ],
      });
    }
  }

  // ==========================================================================
  // PHASE 8 SEED DATA: SITE REPORTS, SITE PHOTOS, ISSUES/SNAGS & QA/SAFETY
  // ==========================================================================
  const existingSiteReportsCount = await prisma.siteReport.count({
    where: { organizationId: summitOrg.id },
  });

  if (existingSiteReportsCount === 0) {
    const summitUsers = await prisma.user.findMany({
      where: { organizationId: summitOrg.id },
    });
    const pmUser =
      summitUsers.find((u) => u.role === "PROJECT_MANAGER") || summitUsers[0];
    const siteMgrUser =
      summitUsers.find((u) => u.role === "SITE_MANAGER") || summitUsers[0];
    const qsUser =
      summitUsers.find((u) => u.role === "QUANTITY_SURVEYOR") || summitUsers[0];
    const foremanUser =
      summitUsers.find((u) => u.role === "SITE_STAFF") || summitUsers[0];

    const prjRiverside = await prisma.project.findFirst({
      where: { organizationId: summitOrg.id, code: "SBC-PRJ-001" },
      include: { sites: true, phases: true },
    });
    const prjWestlands = await prisma.project.findFirst({
      where: { organizationId: summitOrg.id, code: "SBC-PRJ-002" },
      include: { sites: true, phases: true },
    });
    const prjKaren = await prisma.project.findFirst({
      where: { organizationId: summitOrg.id, code: "SBC-PRJ-003" },
      include: { sites: true, phases: true },
    });
    const prjWarehouse = await prisma.project.findFirst({
      where: { organizationId: summitOrg.id, code: "SBC-PRJ-004" },
      include: { sites: true, phases: true },
    });

    if (prjRiverside && prjWestlands && prjKaren && prjWarehouse) {
      const siteRiv = prjRiverside.sites[0];
      const siteWcc = prjWestlands.sites[0];
      const siteKaren = prjKaren.sites[0];
      const siteTatu = prjWarehouse.sites[0];

      const phaseRivFrame =
        prjRiverside.phases.find((p) => p.sequenceOrder === 2) ||
        prjRiverside.phases[0];
      const phaseWccFrame =
        prjWestlands.phases.find((p) => p.sequenceOrder === 2) ||
        prjWestlands.phases[0];
      const phaseKarenFinishes =
        prjKaren.phases.find((p) => p.sequenceOrder === 2) ||
        prjKaren.phases[0];
      const phaseTatuEarth = prjWarehouse.phases[0];

      // 1. Seed Daily & Weekly Site Reports (Section 24)
      const dsr1 = await prisma.siteReport.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          phaseId: phaseRivFrame?.id,
          reportNumber: "DSR-2026-001",
          reportDate: new Date("2026-03-19"),
          reportType: "DAILY",
          weatherCondition: "SUNNY_CLEAR",
          temperatureCelsius: 26.5,
          groundCondition: "DRY_FIRM",
          workersPresentCount: 64,
          subcontractorWorkersCount: 18,
          workCompletedSummary:
            "Completed T16/T20 bottom and top mat reinforcement steel fixing on Block A 8th Floor slab (Grids A1–D6, 480m²). Installed PowerGrid electrical first-fix 25mm heavy-gauge PVC conduits and AquaFlow floor drain sleeves.",
          workPlannedNext:
            "Final structural consultant pre-pour inspection at 08:30 hrs tomorrow followed by 115m³ Ready-Mix Class 35/20 concrete pour using Schwing Stetter stationary pump.",
          materialsReceivedNote:
            "Received 22 Tonnes BS 4449 High-Yield T16/T20 Rebar from Devki Steel Mills (GRN-2026-002) and 300 bags Bamburi PowerPlus 42.5N cement.",
          equipmentUsedNote:
            "Potain MC 85B Tower Crane (9.5 hrs lifting rebar bundles & Doka tables), Perkins 150kVA Standby Generator (3.0 hrs).",
          issuesSummaryNote:
            "Minor congestion of MEP sleeves around lift core shear wall RW-02 resolved with structural resident engineer on site.",
          safetyToolboxTalkTopic:
            "Working at Height on 8th Floor Perimeter Edge Protection & Full-Body Harness Lanyard Anchoring",
          safetyIncidentsCount: 0,
          overallProgressDelta: 1.4,
          status: "REVIEWED",
          notes: "Signed off by Resident Engineer & Project Manager.",
          submittedById: siteMgrUser.id,
          reviewedById: pmUser.id,
        },
      });

      const dsr2 = await prisma.siteReport.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          siteId: siteRiv?.id,
          phaseId: phaseRivFrame?.id,
          reportNumber: "DSR-2026-002",
          reportDate: new Date("2026-03-20"),
          reportType: "DAILY",
          weatherCondition: "PARTLY_CLOUDY",
          temperatureCelsius: 25.0,
          groundCondition: "DRY_FIRM",
          workersPresentCount: 68,
          subcontractorWorkersCount: 14,
          workCompletedSummary:
            "Poured 115m³ of C35/20 pumped ready-mix concrete on Block A 8th Floor suspended slab. Conducted 6 slump tests (average 125mm) and cast 18 concrete test cubes for 7-day and 28-day crushing.",
          workPlannedNext:
            "Commence curing membrane application and ponding on 8th floor slab; set out 8th-to-9th floor RC column starter kickers.",
          materialsReceivedNote:
            "115m³ Bamburi Ready-Mix C35/20 delivered across 15 transit mixer loads.",
          equipmentUsedNote:
            "Schwing Stetter SP 1800 Concrete Pump (8.5 hrs), Potain MC 85B Tower Crane (7.0 hrs), 4 Poker Vibrators.",
          issuesSummaryNote:
            "25-minute transit mixer gap at 14:00 hrs due to Waiyaki Way traffic; cold joint prevented using retarding admixture.",
          safetyToolboxTalkTopic:
            "High-Pressure Concrete Pump Pipeline Whip-Check Restraints & Alkali Burns Prevention (Gumboots & Goggles)",
          safetyIncidentsCount: 0,
          overallProgressDelta: 1.8,
          status: "REVIEWED",
          submittedById: siteMgrUser.id,
          reviewedById: pmUser.id,
        },
      });

      const dsr3 = await prisma.siteReport.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          siteId: siteWcc?.id,
          phaseId: phaseWccFrame?.id,
          reportNumber: "DSR-2026-003",
          reportDate: new Date("2026-03-20"),
          reportType: "DAILY",
          weatherCondition: "PARTLY_CLOUDY",
          temperatureCelsius: 24.5,
          groundCondition: "DRY_FIRM",
          workersPresentCount: 52,
          subcontractorWorkersCount: 24,
          workCompletedSummary:
            "Erected 5th Floor post-tensioned flat slab table formwork (620m²) and installed AluGlass unitized curtain wall galvanized brackets along Waiyaki Way elevation Levels 1 to 3.",
          workPlannedNext:
            "Lay unbonded post-tensioning tendons and anchorages on 5th floor deck; continue basement B2 fire sprinkler main riser installation.",
          materialsReceivedNote:
            "40 Tonnes Ndarugo 20mm crushed trap-rock ballast and 180 sheets 18mm phenolic film-faced marine plywood.",
          equipmentUsedNote:
            "Liebherr 130 EC-B6 Tower Crane (9.0 hrs), Scissor Lift #2.",
          issuesSummaryNote:
            "SinoTruck Tipper KDK 990T still in Industrial Area workshop for hydraulic seal repair; spoil haulage rescheduled.",
          safetyToolboxTalkTopic:
            "Tower Crane Blind-Spot Radio Signalling (Banksman Protocol) & Curtain Wall Edge Fall Arrest Nets",
          safetyIncidentsCount: 0,
          overallProgressDelta: 1.1,
          status: "SUBMITTED",
          submittedById: foremanUser.id,
        },
      });

      const dsr4 = await prisma.siteReport.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          siteId: siteKaren?.id,
          phaseId: phaseKarenFinishes?.id,
          reportNumber: "DSR-2026-004",
          reportDate: new Date("2026-03-19"),
          reportType: "DAILY",
          weatherCondition: "HEAVY_RAIN",
          temperatureCelsius: 19.5,
          groundCondition: "DAMP_WORKABLE",
          workersPresentCount: 34,
          subcontractorWorkersCount: 16,
          workCompletedSummary:
            "Shifted external stone cladding gangs indoors due to afternoon downpour. Completed 145m² of 600x1200mm Spanish porcelain floor tiling in Villa 2 & Villa 3 lounges and installed Highland Decra charcoal roof tiles on Villa 4.",
          workPlannedNext:
            "Complete Master Bathroom Grohe concealed cistern pressure testing in Villas 1–3 and resume boundary wall bush-hammered Mazeras stone dressing.",
          materialsReceivedNote:
            "210 m² Porcelain Floor Tiles from Tile & Carpet Centre (5 m² transit breakage logged on GRN-2026-004).",
          equipmentUsedNote:
            "Tile laser levels, PPR fusion welding kits, 2kVA portable generators.",
          issuesSummaryNote:
            "Heavy rain halted external driveway cabro sub-base compaction for 4 hours; customs delay on Italian marble vanity tops flagged.",
          safetyToolboxTalkTopic:
            "Electrical Cord Insulation in Wet Conditions & Roof Batten Slip Prevention",
          safetyIncidentsCount: 1,
          overallProgressDelta: 0.5,
          status: "FLAGGED_DELAY",
          notes: "Minor first-aid finger cut during porcelain tile cutting; treated on site.",
          submittedById: siteMgrUser.id,
          reviewedById: pmUser.id,
        },
      });

      const dsr5 = await prisma.siteReport.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWarehouse.id,
          siteId: siteTatu?.id,
          phaseId: phaseTatuEarth?.id,
          reportNumber: "DSR-2026-005",
          reportDate: new Date("2026-03-20"),
          reportType: "WEEKLY",
          weatherCondition: "SUNNY_CLEAR",
          temperatureCelsius: 28.0,
          groundCondition: "DRY_FIRM",
          workersPresentCount: 41,
          subcontractorWorkersCount: 12,
          workCompletedSummary:
            "Excavated 1,450m³ of expansive black-cotton soil along Portal Grid Lines 5–9 and backfilled with 600mm compacted graded quarry stone sub-base. Cast 8 reinforced concrete stub columns with Grade 8.8 holding-down bolt clusters.",
          workPlannedNext:
            "Field density CBR compaction tests on Bay 2 sub-base and delivery of first 45 Tonnes of S355 steel portal rafters.",
          materialsReceivedNote:
            "680 Tonnes graded quarry stone & hardcore from Ndarugo Quarry.",
          equipmentUsedNote:
            "CAT 320D2 Hydraulic Excavator (46 hrs this week), Vibratory Roller (38 hrs).",
          issuesSummaryNote:
            "Deeper black-cotton pocket (1.85m vs 1.4m design depth) encountered at Grid H8–H10; QS preparing Variation Order VO-003.",
          safetyToolboxTalkTopic:
            "Deep Trench Excavation Battering, Reversing Tipper Banksmen & Dust Suppression",
          safetyIncidentsCount: 0,
          overallProgressDelta: 2.6,
          status: "REVIEWED",
          submittedById: siteMgrUser.id,
          reviewedById: pmUser.id,
        },
      });

      // 2. Seed Site Photos (Section 25) with crisp architectural/engineering SVG Data URLs
      const svgSlabRebar = `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
          <defs>
            <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0f172a"/>
              <stop offset="100%" stop-color="#1e293b"/>
            </linearGradient>
          </defs>
          <rect width="800" height="500" fill="url(#bg1)"/>
          <g stroke="#334155" stroke-width="2">
            <line x1="0" y1="100" x2="800" y2="100"/><line x1="0" y1="180" x2="800" y2="180"/><line x1="0" y1="260" x2="800" y2="260"/><line x1="0" y1="340" x2="800" y2="340"/><line x1="0" y1="420" x2="800" y2="420"/>
            <line x1="120" y1="0" x2="120" y2="500"/><line x1="260" y1="0" x2="260" y2="500"/><line x1="400" y1="0" x2="400" y2="500"/><line x1="540" y1="0" x2="540" y2="500"/><line x1="680" y1="0" x2="680" y2="500"/>
          </g>
          <g stroke="#f59e0b" stroke-width="4" opacity="0.85">
            <line x1="60" y1="140" x2="740" y2="140"/><line x1="60" y1="220" x2="740" y2="220"/><line x1="60" y1="300" x2="740" y2="300"/><line x1="60" y1="380" x2="740" y2="380"/>
            <line x1="190" y1="60" x2="190" y2="440"/><line x1="330" y1="60" x2="330" y2="440"/><line x1="470" y1="60" x2="470" y2="440"/><line x1="610" y1="60" x2="610" y2="440"/>
          </g>
          <g stroke="#38bdf8" stroke-width="5" stroke-dasharray="12 6">
            <path d="M 100 390 Q 400 180 700 240" fill="none"/>
          </g>
          <rect x="30" y="30" width="350" height="68" rx="8" fill="#020617" opacity="0.88" stroke="#f59e0b" stroke-width="1.5"/>
          <text x="48" y="58" fill="#f8fafc" font-family="monospace" font-size="16" font-weight="bold">SBC-PRJ-001 • BLOCK A 8TH SLAB</text>
          <text x="48" y="82" fill="#fbbf24" font-family="monospace" font-size="13">T16/T20 High-Yield Rebar &amp; MEP Conduits</text>
        </svg>`
      )}`;

      const svgTowerCranePour = `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
          <rect width="800" height="500" fill="#0c192c"/>
          <polygon points="160,480 220,90 250,90 310,480" fill="none" stroke="#fbbf24" stroke-width="5"/>
          <line x1="120" y1="95" x2="680" y2="95" stroke="#fbbf24" stroke-width="8"/>
          <line x1="235" y1="40" x2="620" y2="95" stroke="#94a3b8" stroke-width="2.5"/>
          <line x1="235" y1="40" x2="130" y2="95" stroke="#94a3b8" stroke-width="2.5"/>
          <line x1="520" y1="95" x2="520" y2="270" stroke="#e2e8f0" stroke-width="3"/>
          <rect x="490" y="270" width="60" height="55" rx="6" fill="#38bdf8"/>
          <rect x="360" y="350" width="360" height="130" fill="#334155" stroke="#64748b" stroke-width="3"/>
          <rect x="30" y="30" width="380" height="68" rx="8" fill="#020617" opacity="0.88" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="48" y="58" fill="#f8fafc" font-family="monospace" font-size="16" font-weight="bold">RIVERSIDE 115m³ C35/20 SLAB POUR</text>
          <text x="48" y="82" fill="#38bdf8" font-family="monospace" font-size="13">Potain MC 85B &amp; Schwing Stetter Pump</text>
        </svg>`
      )}`;

      const svgCurtainWall = `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
          <rect width="800" height="500" fill="#0f172a"/>
          <rect x="140" y="60" width="520" height="400" fill="#0ea5e9" fill-opacity="0.15" stroke="#38bdf8" stroke-width="3"/>
          <g stroke="#38bdf8" stroke-width="2" opacity="0.7">
            <line x1="270" y1="60" x2="270" y2="460"/><line x1="400" y1="60" x2="400" y2="460"/><line x1="530" y1="60" x2="530" y2="460"/>
            <line x1="140" y1="160" x2="660" y2="160"/><line x1="140" y1="260" x2="660" y2="260"/><line x1="140" y1="360" x2="660" y2="360"/>
          </g>
          <rect x="30" y="30" width="390" height="68" rx="8" fill="#020617" opacity="0.9" stroke="#10b981" stroke-width="1.5"/>
          <text x="48" y="58" fill="#f8fafc" font-family="monospace" font-size="16" font-weight="bold">WESTLANDS COMMERCIAL CENTRE</text>
          <text x="48" y="82" fill="#34d399" font-family="monospace" font-size="13">Double-Glazed Curtain Wall Brackets L1–L3</text>
        </svg>`
      )}`;

      const svgTileDefect = `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
          <rect width="800" height="500" fill="#1e1b4b"/>
          <rect x="180" y="110" width="440" height="310" rx="8" fill="#312e81" stroke="#f43f5e" stroke-width="3"/>
          <path d="M 240 160 L 390 270 L 340 350 L 510 390" fill="none" stroke="#fb7185" stroke-width="5"/>
          <circle cx="390" cy="270" r="45" fill="none" stroke="#f43f5e" stroke-width="3" stroke-dasharray="8 5"/>
          <rect x="30" y="30" width="400" height="68" rx="8" fill="#020617" opacity="0.9" stroke="#f43f5e" stroke-width="1.5"/>
          <text x="48" y="58" fill="#f8fafc" font-family="monospace" font-size="16" font-weight="bold">SNAG EVIDENCE • KAREN VILLA 2</text>
          <text x="48" y="82" fill="#fb7185" font-family="monospace" font-size="13">5 m² Cracked Porcelain Batch (GRN-004)</text>
        </svg>`
      )}`;

      await prisma.sitePhoto.createMany({
        data: [
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            siteReportId: dsr1.id,
            photoCode: "PHO-2026-001",
            category: "PROGRESS",
            title: "Block A 8th Floor Slab Top/Bottom Mat T16/T20 Rebar & Conduits",
            caption:
              "Verified 200mm c/c spacing, 40mm concrete cover blocks, and electrical conduit saddle ties prior to consultant hold-point sign-off.",
            locationTag: "Block A — 8th Floor Deck (Grids A1–D6)",
            imageUrl: svgSlabRebar,
            capturedAt: new Date("2026-03-19T15:20:00Z"),
            uploadedById: siteMgrUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            siteReportId: dsr2.id,
            photoCode: "PHO-2026-002",
            category: "COMPLETED_WORK",
            title: "115m³ C35/20 Ready-Mix Concrete Pumped Pour & Power Floating",
            caption:
              "Continuous pumped placement using Schwing Stetter SP 1800 stationary pump; 125mm slump verified.",
            locationTag: "Block A — 8th Floor Slab",
            imageUrl: svgTowerCranePour,
            capturedAt: new Date("2026-03-20T16:45:00Z"),
            uploadedById: siteMgrUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            siteId: siteWcc?.id,
            siteReportId: dsr3.id,
            photoCode: "PHO-2026-003",
            category: "SAFETY_COMPLIANCE",
            title: "Curtain Wall Mullion Brackets & Perimeter Fall-Arrest Netting",
            caption:
              "AluGlass Facades crew working with dual-lanyard harnesses on Levels 1–3 along Waiyaki Way elevation.",
            locationTag: "Westlands Tower — Elevation North",
            imageUrl: svgCurtainWall,
            capturedAt: new Date("2026-03-20T11:30:00Z"),
            uploadedById: foremanUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            siteId: siteKaren?.id,
            siteReportId: dsr4.id,
            photoCode: "PHO-2026-004",
            category: "DEFECT_SNAG",
            title: "Damaged Pallet Corner on 600x1200mm Porcelain Tiles Delivery",
            caption:
              "4 cartons (5.76 m²) cracked during forklift offloading; quarantined in site store for supplier credit note.",
            locationTag: "Karen Villa 2 — Site Store",
            imageUrl: svgTileDefect,
            capturedAt: new Date("2026-03-19T10:15:00Z"),
            uploadedById: siteMgrUser.id,
          },
        ],
      });

      // 3. Seed Project Issues, Snags & Risks Register (Section 30)
      await prisma.projectIssue.createMany({
        data: [
          {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            siteId: siteKaren?.id,
            phaseId: phaseKarenFinishes?.id,
            issueCode: "ISS-2026-001",
            title: "Mombasa Port Customs Clearance Delay on Italian Marble Vanity Tops",
            category: "MATERIAL_DELAY",
            severity: "HIGH",
            status: "ESCALATED",
            description:
              "Container MSKU-4928110 carrying bespoke Carrara marble vanity tops and freestanding tubs for Villas 1–5 held at Mombasa ICD for KEBS PVoC verification.",
            impactSummary:
              "14-day critical path delay on Master Ensuite completion for Villas 1 & 2; project status flagged as DELAYED.",
            resolutionPlan:
              "Clearing agent lodging KEBS lab test certificate today; air-freighting sanitary mixer valves ahead of sea cargo.",
            dueDate: new Date("2026-03-25"),
            reportedById: siteMgrUser.id,
            assignedToId: pmUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            phaseId: phaseRivFrame?.id,
            issueCode: "ISS-2026-002",
            title: "HVAC Chilled Water Riser Clash with Structural Transfer Beam TB-04",
            category: "DESIGN_DRAWING_CLASH",
            severity: "HIGH",
            status: "IN_PROGRESS",
            description:
              "AquaFlow 150mm chilled water riser sleeve on 8th Floor Grid C4 intersects main 600x900mm RC transfer beam top reinforcement.",
            impactSummary:
              "Would compromise structural shear capacity if core-drilled post-pour.",
            resolutionPlan:
              "RFI-019 issued to structural & MEP consultants; rerouting riser through adjacent service duct shaft SD-02.",
            dueDate: new Date("2026-03-22"),
            reportedById: siteMgrUser.id,
            assignedToId: pmUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWarehouse.id,
            siteId: siteTatu?.id,
            phaseId: phaseTatuEarth?.id,
            issueCode: "ISS-2026-003",
            title: "Deep Expansive Black-Cotton Soil Pocket at Portal Grid H8–H10",
            category: "BUDGET_VARIATION_RISK",
            severity: "CRITICAL",
            status: "OPEN",
            description:
              "Trial pits at Grid H8–H10 revealed expansive black-cotton clay extending to 1.85m depth instead of 1.40m BOQ design depth over a 900m² zone.",
            impactSummary:
              "Requires additional 405m³ excavation and compacted quarry stone backfill (Est. +KSh 1,480,000 variation).",
            resolutionPlan:
              "QS joint site measurement scheduled with client engineer to issue Variation Order VO-003 before sub-base rolling.",
            dueDate: new Date("2026-03-24"),
            reportedById: qsUser.id,
            assignedToId: qsUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            siteId: siteWcc?.id,
            phaseId: phaseWccFrame?.id,
            issueCode: "ISS-2026-004",
            title: "Honeycombing Snag on Basement B1 Retaining Wall Pour RW-07",
            category: "QUALITY_DEFECT_SNAG",
            severity: "MEDIUM",
            status: "RESOLVED",
            description:
              "Surface honeycombing (approx. 0.4m², 25mm deep, non-structural cover zone) observed after striking shutters on Basement B1 wall RW-07.",
            impactSummary:
              "Must be rectified prior to external Sika bituminous tanking membrane application.",
            resolutionPlan:
              "Chipped back loose aggregate, applied Sika MonoTop-610 bonding primer and high-strength non-shrink structural repair mortar. Inspected & signed off.",
            dueDate: new Date("2026-03-18"),
            resolvedAt: new Date("2026-03-18"),
            reportedById: foremanUser.id,
            assignedToId: siteMgrUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            phaseId: phaseRivFrame?.id,
            issueCode: "ISS-2026-005",
            title: "Shortage of Certified Post-Tensioning Stressing Technicians",
            category: "LABOUR_SHORTAGE",
            severity: "MEDIUM",
            status: "IN_PROGRESS",
            description:
              "Concurrent slab pours across Block A and Block B require an additional 4 certified multi-strand jacking technicians for next week.",
            impactSummary:
              "Potential 2-day delay in striking 7th floor props if tendon stressing lags.",
            resolutionPlan:
              "Mobilizing 4 specialist stressing operatives from Westlands crew for 3 days.",
            dueDate: new Date("2026-03-23"),
            reportedById: siteMgrUser.id,
            assignedToId: siteMgrUser.id,
          },
        ],
      });

      // 4. Seed Quality Inspections & Safety Management Records (Sections 31 & 32)
      await prisma.qualitySafetyInspection.createMany({
        data: [
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            phaseId: phaseRivFrame?.id,
            recordNumber: "QSI-2026-001",
            recordDomain: "QUALITY_INSPECTION",
            inspectionOrIncidentType: "REBAR_PRE_POUR_CHECK",
            title: "Block A 8th Floor Slab Pre-Pour Reinforcement & Formwork Hold-Point",
            locationArea: "Block A — 8th Floor Deck (Grids A1–D6)",
            inspectionDate: new Date("2026-03-20T08:30:00Z"),
            resultStatus: "PASSED",
            severity: "NORMAL",
            findingsOrDefects:
              "Checked T16/T20 bottom and top mats, 600mm lap lengths, 40mm spacer blocks, shear links around columns C1–C12, and Doka prop plumbness. All compliant with Structural Drawing STR-208 Rev C.",
            correctiveAction:
              "Added 6 extra U-bars along lift shaft opening edge prior to pour release. Pour Card #PC-084 signed.",
            complianceScorePct: 98,
            inspectorOrReporterId: pmUser.id,
            responsiblePersonId: siteMgrUser.id,
            closedAt: new Date("2026-03-20T09:15:00Z"),
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            phaseId: phaseRivFrame?.id,
            recordNumber: "QSI-2026-002",
            recordDomain: "QUALITY_INSPECTION",
            inspectionOrIncidentType: "CONCRETE_CUBE_SLUMP_TEST",
            title: "7th Floor Columns & Core Walls 28-Day Concrete Cube Crushing Test",
            locationArea: "Block A & B — 7th Floor Vertical Elements (Class C40/20)",
            inspectionDate: new Date("2026-03-17"),
            resultStatus: "PASSED",
            severity: "NORMAL",
            findingsOrDefects:
              "Materials testing lab crushed 6 cubes cast on Feb 17: average 28-day compressive strength achieved 44.8 N/mm² (exceeding 40.0 N/mm² design requirement by +12%).",
            correctiveAction:
              "Lab certificate #MTRD-2026-881 archived in Project Documents.",
            complianceScorePct: 100,
            inspectorOrReporterId: qsUser.id,
            responsiblePersonId: siteMgrUser.id,
            closedAt: new Date("2026-03-17"),
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            siteId: siteWcc?.id,
            phaseId: phaseWccFrame?.id,
            recordNumber: "QSI-2026-003",
            recordDomain: "QUALITY_INSPECTION",
            inspectionOrIncidentType: "MEP_PRESSURE_TEST",
            title: "Basement B1 & B2 Fire Hydrant & PPR Domestic Water Hydrostatic Test",
            locationArea: "Westlands Tower — Basements B1 & B2 Risers",
            inspectionDate: new Date("2026-03-18"),
            resultStatus: "PASSED_WITH_OBSERVATIONS",
            severity: "MINOR",
            findingsOrDefects:
              "Pressurized PPR PN20 cold/hot water mains to 10.0 Bar for 4 hours. Zero pressure drop on 95% of loop; minor weeping detected at flanged gate valve GV-03.",
            correctiveAction:
              "AquaFlow technician replaced EPDM flange gasket and re-torqued bolts; re-test held 10.0 Bar steady.",
            complianceScorePct: 94,
            inspectorOrReporterId: siteMgrUser.id,
            responsiblePersonId: foremanUser.id,
            closedAt: new Date("2026-03-19"),
          },
          {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            siteId: siteKaren?.id,
            phaseId: phaseKarenFinishes?.id,
            recordNumber: "QSI-2026-004",
            recordDomain: "QUALITY_INSPECTION",
            inspectionOrIncidentType: "WATERPROOFING_FLOOD_TEST",
            title: "Villa 3 Flat Roof Terrace 72-Hour Ponding Waterproofing Inspection",
            locationArea: "Karen Villa 3 — Upper Roof Terrace (85m²)",
            inspectionDate: new Date("2026-03-19"),
            resultStatus: "REQUIRES_CORRECTION",
            severity: "MAJOR",
            findingsOrDefects:
              "After 48 hours of 100mm water ponding, dampness trace observed around rainwater Fulbora outlet collar on soffit below.",
            correctiveAction:
              "Drained terrace, dressed torch-on APP membrane collar with SikaLastomer PU sealant and reinforced fleece fillet; re-ponding test underway.",
            complianceScorePct: 78,
            inspectorOrReporterId: siteMgrUser.id,
            responsiblePersonId: siteMgrUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            phaseId: phaseRivFrame?.id,
            recordNumber: "SAF-2026-001",
            recordDomain: "SAFETY_AUDIT",
            inspectionOrIncidentType: "SCAFFOLD_WORKING_AT_HEIGHT",
            title: "Weekly Perimeter Tubular Scaffolding, Toe-Boards & Guardrail Audit",
            locationArea: "Riverside Heights — Block A & B External Elevations (Levels 1–8)",
            inspectionDate: new Date("2026-03-18"),
            resultStatus: "PASSED",
            severity: "NORMAL",
            findingsOrDefects:
              "Inspected 140 bays of double-coupler steel scaffolding, tie-backs at 4m grid, green debris netting, and 150mm timber toe-boards. Green ScaffTag affixed.",
            correctiveAction:
              "Replaced 3 worn scaffold planks on Level 5 East bay immediately during walkthrough.",
            complianceScorePct: 96,
            inspectorOrReporterId: siteMgrUser.id,
            responsiblePersonId: foremanUser.id,
            closedAt: new Date("2026-03-18"),
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            siteId: siteWcc?.id,
            phaseId: phaseWccFrame?.id,
            recordNumber: "SAF-2026-002",
            recordDomain: "SAFETY_INCIDENT",
            inspectionOrIncidentType: "NEAR_MISS_INCIDENT",
            title: "Near-Miss: Unsecured Timber Batten Slipped During Formwork Stripping",
            locationArea: "Westlands Tower — 4th Floor Atrium Void",
            inspectionDate: new Date("2026-03-19"),
            resultStatus: "INCIDENT_CONTAINED",
            severity: "MAJOR",
            findingsOrDefects:
              "A 1.5m x 100x50mm timber runner slipped during table shutter lowering and landed inside the barricaded exclusion safety net on Level 3. Zero injuries occurred.",
            correctiveAction:
              "Mandatory tether lanyards enforced on all stripping bars; exclusion zone barrier extended by 3m with red/white hazard tape and banksman sentry.",
            complianceScorePct: 88,
            inspectorOrReporterId: foremanUser.id,
            responsiblePersonId: siteMgrUser.id,
            closedAt: new Date("2026-03-19"),
          },
          {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            siteId: siteKaren?.id,
            phaseId: phaseKarenFinishes?.id,
            recordNumber: "SAF-2026-003",
            recordDomain: "SAFETY_INCIDENT",
            inspectionOrIncidentType: "FIRST_AID_INJURY",
            title: "Minor First-Aid Cut During Wet-Saw Porcelain Tile Trimming",
            locationArea: "Karen Villa 2 — Ground Floor Lounge",
            inspectionDate: new Date("2026-03-19"),
            resultStatus: "INCIDENT_CONTAINED",
            severity: "MINOR",
            findingsOrDefects:
              "Assistant tiler sustained a superficial 1cm laceration on left index finger from a sharp porcelain off-cut while clearing the wet-saw table without cut-resistant nitrile gloves.",
            correctiveAction:
              "Cleaned & dressed using site First-Aid kit; issued EN388 Level-5 cut-resistant gloves to all 8 tiling operatives and conducted 15-min safety stand-down.",
            complianceScorePct: 90,
            inspectorOrReporterId: siteMgrUser.id,
            responsiblePersonId: foremanUser.id,
            closedAt: new Date("2026-03-19"),
          },
        ],
      });
    }
  }

  // ==========================================================================
  // PHASE 9 SEED DATA: FINANCIAL MANAGEMENT (EXPENSES, INVOICES, PAYMENTS, VARIATIONS)
  // ==========================================================================
  const existingExpenseCount = await prisma.projectExpense.count({
    where: { organizationId: summitOrg.id },
  });

  if (existingExpenseCount === 0) {
    const summitUsers = await prisma.user.findMany({
      where: { organizationId: summitOrg.id },
    });
    const adminUser =
      summitUsers.find((u) => u.role === "COMPANY_ADMIN") || summitUsers[0];
    const pmUser =
      summitUsers.find((u) => u.role === "PROJECT_MANAGER") || summitUsers[0];
    const qsUser =
      summitUsers.find((u) => u.role === "QUANTITY_SURVEYOR") || summitUsers[0];
    const acctUser =
      summitUsers.find((u) => u.role === "ACCOUNTANT") || summitUsers[0];
    const procUser =
      summitUsers.find((u) => u.role === "PROCUREMENT_OFFICER") || summitUsers[0];

    const projects = await prisma.project.findMany({
      where: { organizationId: summitOrg.id },
      include: {
        sites: true,
        phases: { orderBy: { sequenceOrder: "asc" } },
      },
    });

    const prjRiverside = projects.find((p) => p.code === "SBC-PRJ-001");
    const prjWestlands = projects.find((p) => p.code === "SBC-PRJ-002");
    const prjKaren = projects.find((p) => p.code === "SBC-PRJ-003");
    const prjWarehouse = projects.find((p) => p.code === "SBC-PRJ-004");

    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: summitOrg.id },
    });
    const subcontractors = await prisma.subcontractor.findMany({
      where: { organizationId: summitOrg.id },
    });
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { organizationId: summitOrg.id },
    });

    const supBamburi = suppliers.find((s) => s.code === "SUP-001");
    const supDevki = suppliers.find((s) => s.code === "SUP-002");
    const subPowerGrid = subcontractors.find((s) => s.code === "SUB-2026-001");
    const subGeoFound = subcontractors.find((s) => s.code === "SUB-2026-004");
    const poBamburi = purchaseOrders.find((p) => p.poNumber === "LPO-2026-001");
    const poDevki = purchaseOrders.find((p) => p.poNumber === "LPO-2026-002");

    if (prjRiverside && prjWestlands && prjKaren) {
      const siteRiv = prjRiverside.sites[0];
      const phaseRivFrame = prjRiverside.phases[2] || prjRiverside.phases[0];
      const siteWcc = prjWestlands.sites[0];
      const phaseWccFrame = prjWestlands.phases[2] || prjWestlands.phases[0];
      const siteKaren = prjKaren.sites[0];
      const phaseKarenFinishes = prjKaren.phases[2] || prjKaren.phases[0];
      const siteTatu = prjWarehouse?.sites[0];

      // 1. Seed 9 Project Expenses across all 9 Construction Cost Categories
      await prisma.projectExpense.createMany({
        data: [
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            phaseId: phaseRivFrame?.id,
            expenseNumber: "EXP-2026-001",
            category: "MATERIALS",
            title: "8th Floor Slab Ready-Mix C35 Concrete Batch & Night Pumping",
            description:
              "Supply of 145m³ Class 35/20 structural ready-mix concrete with superplasticizer and stationary boom pump hire for Block A 8th Floor slab.",
            vendorOrPayee: "Bamburi Special Products Ltd",
            amount: 2625000,
            taxAmount: 420000,
            totalAmount: 3045000,
            expenseDate: new Date("2026-03-20"),
            paymentMethod: "BANK_RTGS",
            paymentReference: "RTGS-KCB-9482011",
            receiptAttachmentLabel: "E-TIMS-INV-88412.pdf",
            status: "APPROVED_PAID",
            recordedById: acctUser.id,
            approvedById: qsUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            phaseId: phaseRivFrame?.id,
            expenseNumber: "EXP-2026-002",
            category: "LABOUR",
            title: "Week 12 Site Muster Roll Wages (85 Artisans, Steel Fixers & Casuals)",
            description:
              "Weekly Friday M-Pesa bulk disbursement for Block A & B steel fixers, shuttering carpenters, masons, and concrete gang.",
            vendorOrPayee: "Riverside Direct Site Muster Roll",
            amount: 942000,
            taxAmount: 0,
            totalAmount: 942000,
            expenseDate: new Date("2026-03-20"),
            paymentMethod: "MPESA_B2C",
            paymentReference: "SG79K2M81Q",
            receiptAttachmentLabel: "MusterRoll-Wk12-Signed.pdf",
            status: "APPROVED_PAID",
            recordedById: acctUser.id,
            approvedById: pmUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            siteId: siteWcc?.id,
            phaseId: phaseWccFrame?.id,
            expenseNumber: "EXP-2026-003",
            category: "EQUIPMENT",
            title: "Tower Crane & Standby Generator Automotive Gas Oil (2,500L Diesel)",
            description:
              "Bulk low-sulphur diesel delivery into Westlands site bunded bowser tank for Liebherr crane and 150kVA generator.",
            vendorOrPayee: "TotalEnergies Kenya PLC (Industrial Area)",
            amount: 385000,
            taxAmount: 61600,
            totalAmount: 446600,
            expenseDate: new Date("2026-03-18"),
            paymentMethod: "MPESA_PAYBILL",
            paymentReference: "SF84L9P20W",
            receiptAttachmentLabel: "E-TIMS-FUEL-3092.pdf",
            status: "APPROVED_PAID",
            recordedById: procUser.id,
            approvedById: pmUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            phaseId: phaseRivFrame?.id,
            expenseNumber: "EXP-2026-004",
            category: "SUBCONTRACTORS",
            title: "First-Fix MEP Conduits & Risers Interim Valuation Certificate #2",
            description:
              "Certified progress payment for heavy-gauge PVC electrical conduiting and PPR PN20 riser installation on Levels 4–6.",
            vendorOrPayee: "PowerGrid MEP Engineers Ltd",
            amount: 3200000,
            taxAmount: 512000,
            totalAmount: 3712000,
            expenseDate: new Date("2026-03-17"),
            paymentMethod: "BANK_EFT",
            paymentReference: "EFT-EQB-7731904",
            receiptAttachmentLabel: "IPC-MEP-002-Certified.pdf",
            status: "APPROVED_PAID",
            recordedById: acctUser.id,
            approvedById: qsUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            siteId: siteKaren?.id,
            phaseId: phaseKarenFinishes?.id,
            expenseNumber: "EXP-2026-005",
            category: "TRANSPORT",
            title: "Mombasa Port KRA Clearing, ICD Embakasi Railage & Low-Loader Haulage",
            description:
              "Container clearing charges and flatbed haulage for 40ft container of imported Spanish clay roof tiles & sanitary ware.",
            vendorOrPayee: "Siginon Global Logistics Ltd",
            amount: 480000,
            taxAmount: 76800,
            totalAmount: 556800,
            expenseDate: new Date("2026-03-19"),
            paymentMethod: "MPESA_PAYBILL",
            paymentReference: "SG12P9X44K",
            receiptAttachmentLabel: "KRA-Custom-Release-992.pdf",
            status: "APPROVED_PAID",
            recordedById: procUser.id,
            approvedById: acctUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            siteId: siteWcc?.id,
            phaseId: phaseWccFrame?.id,
            expenseNumber: "EXP-2026-006",
            category: "PERMITS",
            title: "Nairobi City County Hoarding Renewal & Crane Airspace Oversail Permit",
            description:
              "Quarterly statutory renewal for Waiyaki Way pedestrian gantry hoarding and tower crane jib oversail license.",
            vendorOrPayee: "Nairobi City County Revenue Portal",
            amount: 245000,
            taxAmount: 0,
            totalAmount: 245000,
            expenseDate: new Date("2026-03-15"),
            paymentMethod: "MPESA_PAYBILL",
            paymentReference: "SE99M4T11B",
            receiptAttachmentLabel: "NCCG-Permit-2026-Q1.pdf",
            status: "APPROVED_PAID",
            recordedById: acctUser.id,
            approvedById: adminUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            expenseNumber: "EXP-2026-007",
            category: "PROFESSIONAL_FEES",
            title: "Materials Testing Lab: 28-Day Concrete Cube Crushing & Rebar Tensile Tests",
            description:
              "Independent accredited laboratory testing for 36 concrete cubes (Floors 6–7) and T20/T25 high-yield steel bar samples.",
            vendorOrPayee: "Materials Testing & Research Dept (MTRD)",
            amount: 165000,
            taxAmount: 26400,
            totalAmount: 191400,
            expenseDate: new Date("2026-03-17"),
            paymentMethod: "MPESA_PAYBILL",
            paymentReference: "SG41R8V52N",
            receiptAttachmentLabel: "MTRD-Lab-Cert-881.pdf",
            status: "APPROVED_PAID",
            recordedById: qsUser.id,
            approvedById: pmUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            siteId: siteRiv?.id,
            expenseNumber: "EXP-2026-008",
            category: "UTILITIES",
            title: "KPLC 3-Phase Commercial Site Power & 8x 10,000L Water Bowser Top-Ups",
            description:
              "Monthly Kenya Power postpaid meter bill for tower crane/hoists plus emergency curing water bowser deliveries.",
            vendorOrPayee: "Kenya Power (KPLC) & Nairobi Water Bowsers",
            amount: 218000,
            taxAmount: 34880,
            totalAmount: 252880,
            expenseDate: new Date("2026-03-16"),
            paymentMethod: "MPESA_PAYBILL",
            paymentReference: "SF19C7K88L",
            receiptAttachmentLabel: "KPLC-Bill-Mar2026.pdf",
            status: "APPROVED_PAID",
            recordedById: acctUser.id,
            approvedById: pmUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWarehouse?.id || prjWestlands.id,
            siteId: siteTatu?.id || siteWcc?.id,
            expenseNumber: "EXP-2026-009",
            category: "EQUIPMENT",
            title: "20-Ton Vibratory Smooth Drum Roller Hire & Sub-Base CBR Field Compaction",
            description:
              "14-day plant hire of Hamm HD110 vibratory roller for 600mm hand-packed quarry stone sub-base compaction at Tatu City.",
            vendorOrPayee: " Rift Valley Heavy Plant Hire Ltd",
            amount: 640000,
            taxAmount: 102400,
            totalAmount: 742400,
            expenseDate: new Date("2026-03-21"),
            paymentMethod: "BANK_EFT",
            paymentReference: "PENDING-EFT",
            receiptAttachmentLabel: "Proforma-RVHP-409.pdf",
            status: "PENDING_APPROVAL",
            recordedById: procUser.id,
          },
        ],
      });

      // 2. Seed 6 Client Invoices (Interim Payment Certificates - IPCs)
      const invRiv1 = await prisma.clientInvoice.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          clientId: prjRiverside.clientId,
          phaseId: prjRiverside.phases[1]?.id,
          invoiceNumber: "INV-IPC-2026-001",
          valuationCertificateRef: "IPC #03 — Substructure & Podium Slabs",
          title: "Interim Valuation Certificate #03: Twin Basement & Podium RC Frame",
          description:
            "Joint QS valuation covering completed bulk excavation, raft foundation, basement retaining walls, and Floors 1–3 structural frame.",
          invoiceDate: new Date("2026-01-25"),
          dueDate: new Date("2026-02-24"),
          subtotalAmount: 65000000,
          vatRate: 16,
          taxAmount: 10400000,
          retentionDeducted: 6500000, // 10% retention
          totalAmount: 68900000, // 65M + 10.4M VAT - 6.5M retention
          paidAmount: 68900000,
          balanceAmount: 0,
          status: "PAID",
          notes: "Settled in full by Acorn-Oakridge Holdings via Stanbic RTGS.",
          createdById: qsUser.id,
        },
      });

      const invRiv2 = await prisma.clientInvoice.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          clientId: prjRiverside.clientId,
          phaseId: phaseRivFrame?.id,
          invoiceNumber: "INV-IPC-2026-002",
          valuationCertificateRef: "IPC #04 — Superstructure Floors 4 to 8",
          title: "Interim Valuation Certificate #04: Superstructure Slabs & Masonry Walling",
          description:
            "Certified progress for post-tensioned slabs Floors 4–8, Ndarugo stone masonry on Floors 1–4, and first-fix MEP risers.",
          invoiceDate: new Date("2026-03-05"),
          dueDate: new Date("2026-04-04"),
          subtotalAmount: 48000000,
          vatRate: 16,
          taxAmount: 7680000,
          retentionDeducted: 4800000,
          totalAmount: 50880000,
          paidAmount: 35000000,
          balanceAmount: 15880000,
          status: "PARTIALLY_PAID",
          notes: "KSh 35M tranche received March 16; balance KSh 15.88M due April 4.",
          createdById: qsUser.id,
        },
      });

      const invWcc1 = await prisma.clientInvoice.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          clientId: prjWestlands.clientId,
          phaseId: prjWestlands.phases[1]?.id,
          invoiceNumber: "INV-IPC-2026-003",
          valuationCertificateRef: "IPC #02 — Secant Piling & 1.8m Raft Foundation",
          title: "Interim Valuation Certificate #02: Contiguous Piling, Rock Anchors & Raft",
          description:
            "Full certification of 1,650m bored secant piles along Waiyaki Way and 4,200m³ C35 waterproofed raft foundation pour.",
          invoiceDate: new Date("2026-02-10"),
          dueDate: new Date("2026-03-12"),
          subtotalAmount: 82000000,
          vatRate: 16,
          taxAmount: 13120000,
          retentionDeducted: 8200000,
          totalAmount: 86920000,
          paidAmount: 86920000,
          balanceAmount: 0,
          status: "PAID",
          notes: "Paid via KCB Corporate RTGS.",
          createdById: qsUser.id,
        },
      });

      const invWcc2 = await prisma.clientInvoice.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          clientId: prjWestlands.clientId,
          phaseId: phaseWccFrame?.id,
          invoiceNumber: "INV-IPC-2026-004",
          valuationCertificateRef: "IPC #03 — Commercial Tower Cores & Floors 1–3",
          title: "Interim Valuation Certificate #03: Tower Structural Frame & Mechanical Couplers",
          description:
            "Valuation for C40 structural concrete columns, shear cores, and flat slabs up to 3rd Floor level.",
          invoiceDate: new Date("2026-03-18"),
          dueDate: new Date("2026-04-17"),
          subtotalAmount: 54000000,
          vatRate: 16,
          taxAmount: 8640000,
          retentionDeducted: 5400000,
          totalAmount: 57240000,
          paidAmount: 0,
          balanceAmount: 57240000,
          status: "SENT",
          notes: "Signed off by Consultant Architect & Lead QS; awaiting client disbursement.",
          createdById: qsUser.id,
        },
      });

      const invKaren1 = await prisma.clientInvoice.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          clientId: prjKaren.clientId,
          phaseId: phaseKarenFinishes?.id,
          invoiceNumber: "INV-IPC-2026-005",
          valuationCertificateRef: "IPC #05 — Spanish Clay Roofing & Interior Finishes",
          title: "Interim Valuation Certificate #05: Roof Tiling, Joinery & Porcelain Works",
          description:
            "Progress valuation for completed cypress trusses, Spanish clay tiles, and 60% mahogany joinery across 4 luxury villas.",
          invoiceDate: new Date("2026-02-05"),
          dueDate: new Date("2026-03-07"),
          subtotalAmount: 22000000,
          vatRate: 16,
          taxAmount: 3520000,
          retentionDeducted: 2200000,
          totalAmount: 23320000,
          paidAmount: 12000000,
          balanceAmount: 11320000,
          status: "OVERDUE",
          notes: "OVERDUE ALERT: Balance of KSh 11.32M past March 7 due date; follow-up scheduled with Karen Brooks Estate Board.",
          createdById: qsUser.id,
        },
      });

      if (prjWarehouse) {
        await prisma.clientInvoice.create({
          data: {
            organizationId: summitOrg.id,
            projectId: prjWarehouse.id,
            clientId: prjWarehouse.clientId,
            invoiceNumber: "INV-IPC-2026-006",
            valuationCertificateRef: "IPC #01 — Mobilization & Earthworks Sub-Base",
            title: "Advance Mobilization & Black-Cotton Excavation Certificate #01",
            description:
              "Site establishment, plant mobilization, and first 6,200m³ of compacted quarry stone sub-base at Tatu City Industrial Zone.",
            invoiceDate: new Date("2026-03-10"),
            dueDate: new Date("2026-04-09"),
            subtotalAmount: 35000000,
            vatRate: 16,
            taxAmount: 5600000,
            retentionDeducted: 3500000,
            totalAmount: 37100000,
            paidAmount: 37100000,
            balanceAmount: 0,
            status: "PAID",
            notes: "Settled promptly by East Africa ColdChain Logistics.",
            createdById: qsUser.id,
          },
        });
      }

      // 3. Seed 8 Financial Payments (Inbound Client Receipts + Outbound Supplier/Subcontractor/M-Pesa Payouts)
      await prisma.financialPayment.createMany({
        data: [
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            paymentNumber: "PAY-2026-001",
            direction: "INBOUND_CLIENT",
            clientId: prjRiverside.clientId,
            invoiceId: invRiv1.id,
            counterpartyName: "Acorn-Oakridge Property Holdings",
            amount: 68900000,
            paymentMethod: "BANK_RTGS",
            referenceCode: "RTGS-SBK-20260218-881",
            paymentDate: new Date("2026-02-18"),
            status: "CONFIRMED",
            notes: "Full settlement of Interim Valuation Certificate #03.",
            recordedById: acctUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            paymentNumber: "PAY-2026-002",
            direction: "INBOUND_CLIENT",
            clientId: prjRiverside.clientId,
            invoiceId: invRiv2.id,
            counterpartyName: "Acorn-Oakridge Property Holdings",
            amount: 35000000,
            paymentMethod: "BANK_RTGS",
            referenceCode: "RTGS-SBK-20260316-419",
            paymentDate: new Date("2026-03-16"),
            status: "CONFIRMED",
            notes: "First tranche against IPC #04 (balance KSh 15.88M scheduled for April 4).",
            recordedById: acctUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            paymentNumber: "PAY-2026-003",
            direction: "INBOUND_CLIENT",
            clientId: prjWestlands.clientId,
            invoiceId: invWcc1.id,
            counterpartyName: "Vanguard Commercial REIT",
            amount: 86920000,
            paymentMethod: "BANK_RTGS",
            referenceCode: "RTGS-KCB-20260304-902",
            paymentDate: new Date("2026-03-04"),
            status: "CONFIRMED",
            notes: "Settlement of Secant Piling & Raft Foundation IPC #02.",
            recordedById: acctUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            paymentNumber: "PAY-2026-004",
            direction: "INBOUND_CLIENT",
            clientId: prjKaren.clientId,
            invoiceId: invKaren1.id,
            counterpartyName: "Karen Brooks Luxury Estates Ltd",
            amount: 12000000,
            paymentMethod: "BANK_EFT",
            referenceCode: "EFT-NCBA-20260228-114",
            paymentDate: new Date("2026-02-28"),
            status: "CONFIRMED",
            notes: "Partial payment on IPC #05 via NCBA Corporate EFT.",
            recordedById: acctUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            paymentNumber: "PAY-2026-005",
            direction: "OUTBOUND_SUPPLIER",
            supplierId: supBamburi?.id,
            purchaseOrderId: poBamburi?.id,
            counterpartyName: "Bamburi Cement PLC",
            amount: 1624000,
            paymentMethod: "BANK_RTGS",
            referenceCode: "RTGS-EQB-20260315-552",
            paymentDate: new Date("2026-03-15"),
            status: "CONFIRMED",
            notes: "Full settlement of LPO-2026-001 (2,000 bags PowerPlus 42.5N Cement).",
            recordedById: acctUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            paymentNumber: "PAY-2026-006",
            direction: "OUTBOUND_SUPPLIER",
            supplierId: supDevki?.id,
            purchaseOrderId: poDevki?.id,
            counterpartyName: "Devki Steel Mills Ltd",
            amount: 4500000,
            paymentMethod: "BANK_RTGS",
            referenceCode: "RTGS-EQB-20260318-619",
            paymentDate: new Date("2026-03-18"),
            status: "CONFIRMED",
            notes: "50% deposit payment on LPO-2026-002 for 38 Tonnes T16 & T25 high-tensile rebar.",
            recordedById: acctUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            paymentNumber: "PAY-2026-007",
            direction: "OUTBOUND_CONTRACTOR",
            subcontractorId: subPowerGrid?.id,
            counterpartyName: "PowerGrid MEP Engineers Ltd",
            amount: 3712000,
            paymentMethod: "MPESA_PAYBILL",
            referenceCode: "SG71K8P39M",
            mpesaPhoneOrPaybill: "Paybill 522522 • Acc: 12849201",
            paymentDate: new Date("2026-03-17"),
            status: "CONFIRMED",
            notes: "M-Pesa B2B Paybill settlement of MEP Interim Certificate #02.",
            recordedById: acctUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            paymentNumber: "PAY-2026-008",
            direction: "OUTBOUND_CONTRACTOR",
            subcontractorId: subGeoFound?.id,
            counterpartyName: "GeoFoundations Piling & Anchors E.A.",
            amount: 8400000,
            paymentMethod: "BANK_RTGS",
            referenceCode: "RTGS-EQB-20260312-308",
            paymentDate: new Date("2026-03-12"),
            status: "CONFIRMED",
            notes: "Penultimate retention release & pile load-test completion payout.",
            recordedById: acctUser.id,
          },
        ],
      });

      // 4. Seed 5 Project Variations (Change Orders / Variation Orders)
      await prisma.projectVariation.createMany({
        data: [
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            phaseId: phaseRivFrame?.id,
            variationNumber: "VO-2026-001",
            title: "Addition of Rooftop Solar PV Pergola & 120kWh Lithium Battery Room",
            description:
              "Client Architect Instruction AI-014 to construct a structural steel solar pergola on Block A & B roof terraces and a fire-rated hybrid inverter battery room to power common-area lifts and borehole pumps.",
            reason: "CLIENT_SCOPE_ADDITION",
            originalContractAmount: 420000000,
            variationAmount: 14500000,
            revisedContractAmount: 434500000,
            costImpactBudget: 11800000,
            timeExtensionDays: 14,
            status: "APPROVED",
            supportingDocRef: "Arch-Instruction-AI-014-Signed.pdf",
            requestedDate: new Date("2026-02-12"),
            approvedAt: new Date("2026-02-26"),
            requestedById: qsUser.id,
            approvedById: adminUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            phaseId: prjWestlands.phases[0]?.id,
            variationNumber: "VO-2026-002",
            title: "Sub-Surface Phonolite Rock Breaking & Extra Secant Pile Toe-Socket Depth",
            description:
              "Encountered unmapped fractured phonolite rock stratum at -11.5m depth along Grid G–K requiring hydraulic rock-breaker chiseling and +2.5m deeper pile rock sockets certified by Geotechnical Engineer.",
            reason: "UNFORESEEN_GROUND_CONDITION",
            originalContractAmount: 680000000,
            variationAmount: 19200000,
            revisedContractAmount: 699200000,
            costImpactBudget: 16400000,
            timeExtensionDays: 18,
            status: "APPROVED",
            supportingDocRef: "Geotech-Site-Instruction-SI-009.pdf",
            requestedDate: new Date("2026-01-20"),
            approvedAt: new Date("2026-02-05"),
            requestedById: pmUser.id,
            approvedById: adminUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            phaseId: phaseKarenFinishes?.id,
            variationNumber: "VO-2026-003",
            title: "Upgrade of Villa Master Suites to Book-Matched Italian Calacatta Slabs & Heated Floors",
            description:
              "Client-requested upgrade from standard 600x600mm Spanish porcelain to 1200x1200mm book-matched Italian Calacatta slabs with underfloor heating mats in all 4 Master Bathrooms.",
            reason: "MATERIAL_SPEC_UPGRADE",
            originalContractAmount: 95000000,
            variationAmount: 6800000,
            revisedContractAmount: 101800000,
            costImpactBudget: 5400000,
            timeExtensionDays: 21,
            status: "APPROVED",
            supportingDocRef: "Client-VO-KRN-03-Signed.pdf",
            requestedDate: new Date("2026-02-18"),
            approvedAt: new Date("2026-03-02"),
            requestedById: qsUser.id,
            approvedById: adminUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            phaseId: phaseWccFrame?.id,
            variationNumber: "VO-2026-004",
            title: "Atrium Smoke-Extract Louvered Curtain Wall & Pressurization Duct Redesign",
            description:
              "Fire Engineer & County Fire Brigade compliance instruction to integrate motorized smoke-spill louvers into the 4th–9th floor atrium curtain wall facade.",
            reason: "STATUTORY_COMPLIANCE",
            originalContractAmount: 699200000,
            variationAmount: 8400000,
            revisedContractAmount: 707600000,
            costImpactBudget: 6900000,
            timeExtensionDays: 7,
            status: "UNDER_REVIEW",
            supportingDocRef: "MEP-RFI-042-Fire-Compliance.pdf",
            requestedDate: new Date("2026-03-16"),
            requestedById: qsUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            phaseId: phaseRivFrame?.id,
            variationNumber: "VO-2026-005",
            title: "Value Engineering: Substitution of Imported Clay Bricks with Acoustic AAC Blocks on Internal Partitions",
            description:
              "QS value-engineering proposal to use lightweight autoclaved aerated concrete (AAC) blocks on non-load-bearing internal partitions (Floors 7–12), reducing slab dead-load and saving KSh 3.8M.",
            reason: "VALUE_ENGINEERING_DEDUCTION",
            originalContractAmount: 434500000,
            variationAmount: -3800000,
            revisedContractAmount: 430700000,
            costImpactBudget: -3800000,
            timeExtensionDays: 0,
            status: "PENDING_APPROVAL",
            supportingDocRef: "QS-VE-Proposal-005.pdf",
            requestedDate: new Date("2026-03-19"),
            requestedById: qsUser.id,
          },
        ],
      });
    }
  }

  // ==========================================================================
  // PHASE 10 SEED: DOCUMENT REVISION VAULT, APPROVAL WORKFLOWS & CLIENT PORTAL
  // ==========================================================================
  const existingApprovalsCount = await prisma.approvalWorkflowItem.count({
    where: { organizationId: summitOrg.id },
  });

  if (existingApprovalsCount === 0) {
    const [adminUser, pmUser, siteMgrUser, qsUser, procUser] = await Promise.all([
      prisma.user.findFirst({
        where: { organizationId: summitOrg.id, email: "david.kimani@summitconstruct.co.ke" },
      }),
      prisma.user.findFirst({
        where: { organizationId: summitOrg.id, email: "grace.wanjiku@summitconstruct.co.ke" },
      }),
      prisma.user.findFirst({
        where: { organizationId: summitOrg.id, email: "peter.omondi@summitconstruct.co.ke" },
      }),
      prisma.user.findFirst({
        where: { organizationId: summitOrg.id, email: "faith.mutua@summitconstruct.co.ke" },
      }),
      prisma.user.findFirst({
        where: { organizationId: summitOrg.id, email: "brian.kiprop@summitconstruct.co.ke" },
      }),
    ]);

    const [prjRiverside, prjWestlands, prjKaren, prjWarehouse] = await Promise.all([
      prisma.project.findFirst({
        where: { organizationId: summitOrg.id, code: "PRJ-2026-001" },
        include: { phases: true, documents: true },
      }),
      prisma.project.findFirst({
        where: { organizationId: summitOrg.id, code: "PRJ-2026-002" },
        include: { phases: true, documents: true },
      }),
      prisma.project.findFirst({
        where: { organizationId: summitOrg.id, code: "PRJ-2026-003" },
        include: { phases: true, documents: true },
      }),
      prisma.project.findFirst({
        where: { organizationId: summitOrg.id, code: "PRJ-2026-004" },
        include: { phases: true, documents: true },
      }),
    ]);

    if (
      adminUser &&
      pmUser &&
      siteMgrUser &&
      qsUser &&
      procUser &&
      prjRiverside &&
      prjWestlands &&
      prjKaren &&
      prjWarehouse
    ) {
      // 1. Seed additional ProjectDocuments showing Revision Control & Consultant Review
      const docRivSuperseded = await prisma.projectDocument.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjRiverside.id,
          clientId: prjRiverside.clientId,
          title: "Block A & B Post-Tensioned Tendon Profile & Anchorage Layout (Superseded)",
          documentNumber: "DOC-RIV-002",
          category: "STRUCTURAL_DRAWING",
          version: "v2.0",
          fileName: "RIV-STR-PT-Floor8-12-Rev2.pdf",
          fileSizeLabel: "16.8 MB",
          status: "SUPERSEDED",
          notes: "Superseded by v3.1 after adding Rooftop Solar PV Pergola stub columns (AI-014).",
          uploadedById: pmUser.id,
        },
      });

      const docWccShopDrawing = await prisma.projectDocument.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWestlands.id,
          clientId: prjWestlands.clientId,
          title: "Atrium Smoke-Extract Louvered Double-Glazed Curtain Wall Shop Drawings",
          documentNumber: "DOC-WCC-004",
          category: "ARCHITECTURAL_DRAWING",
          version: "v1.2",
          fileName: "WCC-ARC-CW-Atrium-SmokeLouvers-v1.2.dwg",
          fileSizeLabel: "29.4 MB",
          status: "UNDER_REVIEW",
          notes: "Submitted by facade specialist for Lead Architect & Fire Engineer sign-off.",
          uploadedById: pmUser.id,
        },
      });

      const docKarenSampleSpec = await prisma.projectDocument.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjKaren.id,
          clientId: prjKaren.clientId,
          title: "Villa Master Bathroom Book-Matched Italian Calacatta Marble & Underfloor Heating Submittal",
          documentNumber: "DOC-KRN-002",
          category: "QUOTATION",
          version: "v1.0",
          fileName: "KRN-FIN-Calacatta-Submittal-Dossier.pdf",
          fileSizeLabel: "11.2 MB",
          status: "APPROVED",
          notes: "Client & Interior Designer signed off physical marble sample board #M-04.",
          uploadedById: qsUser.id,
        },
      });

      const docTatuPermit = await prisma.projectDocument.create({
        data: {
          organizationId: summitOrg.id,
          projectId: prjWarehouse.id,
          clientId: prjWarehouse.clientId,
          title: "Tatu City Development Control Committee (DCC) & NEMA EIA License",
          documentNumber: "DOC-TATU-001",
          category: "PERMIT_APPROVAL",
          version: "v1.0",
          fileName: "TATU-NEMA-EIA-88412-Approved.pdf",
          fileSizeLabel: "5.6 MB",
          status: "APPROVED",
          notes: "Full statutory clearance granted for 12,000 sqm portal-frame logistics warehouse.",
          uploadedById: adminUser.id,
        },
      });

      const phaseRivFrame =
        prjRiverside.phases.find((p) => p.sequenceOrder === 3) || prjRiverside.phases[0];
      const phaseWccFrame =
        prjWestlands.phases.find((p) => p.sequenceOrder === 2) || prjWestlands.phases[0];
      const phaseKarenFinishes =
        prjKaren.phases.find((p) => p.sequenceOrder === 3) || prjKaren.phases[0];

      // 2. Seed 7 Multi-Stage Approval Workflow Items
      await prisma.approvalWorkflowItem.createMany({
        data: [
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            phaseId: phaseRivFrame?.id,
            documentId: prjRiverside.documents[1]?.id || docRivSuperseded.id,
            clientId: prjRiverside.clientId,
            approvalCode: "APR-2026-001",
            approvalType: "DRAWING_REVISION",
            title: "AFC Sign-Off: Block A & B Post-Tensioned Slab Layout v3.1 (Floors 9–14)",
            description:
              "Structural Engineer and Project Director sign-off on revised tendon anchorages and shear wall starter bars incorporarating rooftop solar pergola loads.",
            submittedToRole: "Lead Structural Consultant & Project Director",
            priority: "CRITICAL",
            financialImpactAmount: 0,
            dueDate: new Date("2026-03-08"),
            status: "APPROVED",
            decisionNotes:
              "Verified punching shear calculations around Grid C4-D6. Stamped Approved for Construction (AFC).",
            digitalSignatureRef: "SIG-ENG-KIMANI-20260307-994A",
            requestedById: pmUser.id,
            decidedById: adminUser.id,
            decidedAt: new Date("2026-03-07"),
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            phaseId: phaseWccFrame?.id,
            documentId: docWccShopDrawing.id,
            clientId: prjWestlands.clientId,
            approvalCode: "APR-2026-002",
            approvalType: "DRAWING_REVISION",
            title: "Facade Shop Drawing Submittal: Atrium Motorized Smoke-Spill Curtain Wall v1.2",
            description:
              "Technical review of wind-load mullion deflections (1.5 kPa) and 24V actuator wiring integration with the main fire alarm panel.",
            submittedToRole: "Project Manager & Fire Engineering Consultant",
            priority: "HIGH",
            financialImpactAmount: 8400000,
            dueDate: new Date("2026-04-06"),
            status: "PENDING",
            decisionNotes:
              "Awaiting final acoustic and thermal U-value test certificate from glazing fabricator.",
            requestedById: siteMgrUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            phaseId: phaseRivFrame?.id,
            clientId: prjRiverside.clientId,
            approvalCode: "APR-2026-003",
            approvalType: "VARIATION_ORDER",
            title: "VO-2026-005 Authorization: Acoustic AAC Block Substitution on Floors 7–12",
            description:
              "Formal commercial approval to substitute standard quarry stone internal non-load-bearing partitions with 150mm AAC blocks, realizing KSh 3.8M cost saving.",
            submittedToRole: "Client Representative & Chief Quantity Surveyor",
            priority: "MEDIUM",
            financialImpactAmount: -3800000,
            dueDate: new Date("2026-04-08"),
            status: "PENDING",
            decisionNotes:
              "Acoustic STC 46dB lab test report attached. Pending client board co-signature.",
            requestedById: qsUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            phaseId: phaseWccFrame?.id,
            clientId: prjWestlands.clientId,
            approvalCode: "APR-2026-004",
            approvalType: "IPC_VALUATION",
            title: "IPC #03 Joint Measurement & Valuation Sign-Off (Tower Cores & Floors 1–3)",
            description:
              "Joint QS site re-measurement and certification of KSh 57.24M (incl. VAT, less 10% retention) for Westlands Commercial Centre RC frame works.",
            submittedToRole: "Director & Client Quantity Surveyor",
            priority: "CRITICAL",
            financialImpactAmount: 57240000,
            dueDate: new Date("2026-03-18"),
            status: "APPROVED",
            decisionNotes:
              "Cube crushing strength tests (28-day C40 > 46.5 N/mm²) verified. Certified for client disbursement.",
            digitalSignatureRef: "SIG-QS-MUTUA-20260318-441C",
            requestedById: qsUser.id,
            decidedById: adminUser.id,
            decidedAt: new Date("2026-03-18"),
          },
          {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            phaseId: phaseKarenFinishes?.id,
            documentId: docKarenSampleSpec.id,
            clientId: prjKaren.clientId,
            approvalCode: "APR-2026-005",
            approvalType: "MATERIAL_SAMPLE",
            title: "Sample Board #M-04: Book-Matched Italian Calacatta Slabs & Brushed Brass Mixers",
            description:
              "Client aesthetic and technical sign-off on physical marble veining layout and Hansgrohe concealed thermostatic shower mixers for Villas 1–4.",
            submittedToRole: "Client & Lead Interior Architect",
            priority: "HIGH",
            financialImpactAmount: 6800000,
            dueDate: new Date("2026-03-02"),
            status: "APPROVED",
            decisionNotes:
              "Approved unconditionally by Karen Hills Investment Holdings director during site walkthrough.",
            digitalSignatureRef: "SIG-CLIENT-KRN-20260302-882B",
            requestedById: pmUser.id,
            decidedById: adminUser.id,
            decidedAt: new Date("2026-03-02"),
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            phaseId: phaseWccFrame?.id,
            clientId: prjWestlands.clientId,
            approvalCode: "APR-2026-006",
            approvalType: "PURCHASE_REQUISITION",
            title: "High-Value LPO Release: 45 Tonnes BS4449 Grade B500B T25/T32 Rebar Call-Off",
            description:
              "Executive authorization for KSh 8.19M steel call-off order with Devki Steel Mills for 4th–6th floor shear core reinforcement.",
            submittedToRole: "Managing Director & Finance Controller",
            priority: "CRITICAL",
            financialImpactAmount: 8190000,
            dueDate: new Date("2026-04-05"),
            status: "PENDING",
            decisionNotes:
              "Within Phase 2 structural steel budget line. Ready for MD digital release.",
            requestedById: procUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            phaseId: phaseKarenFinishes?.id,
            clientId: prjKaren.clientId,
            approvalCode: "APR-2026-007",
            approvalType: "STAGE_HANDOVER",
            title: "Villa #1 & #2 Acoustic Glazing & Roof Weatherproofing Snag Clearance",
            description:
              "Pre-handover watertightness flood test on double-glazed aluminium casement windows and Spanish clay roof valleys.",
            submittedToRole: "Project Manager & Clerk of Works",
            priority: "MEDIUM",
            financialImpactAmount: 0,
            dueDate: new Date("2026-03-22"),
            status: "CHANGES_REQUESTED",
            decisionNotes:
              "Re-apply neutral-cure EPDM perimeter silicone seal on Villa #2 North skylight frame and re-test after 24 hours.",
            digitalSignatureRef: "SIG-PM-WANJIKU-20260322-119D",
            requestedById: siteMgrUser.id,
            decidedById: pmUser.id,
            decidedAt: new Date("2026-03-22"),
          },
        ],
      });

      // 3. Seed 5 Client Portal Dispatches & Stakeholder Sign-Off Packs
      await prisma.clientPortalUpdate.createMany({
        data: [
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            clientId: prjRiverside.clientId,
            portalCode: "CPU-2026-001",
            updateCategory: "EXECUTIVE_PROGRESS_BRIEF",
            title: "Q1 2026 Executive Progress Report: Block A & B 9th Floor Slab Pour & MEP Risers",
            summary:
              "Overall physical progress stands at 68% against 70% planned baseline. Block A & B 8th Floor post-tensioned slabs achieved 44.8 N/mm² strength; 9th Floor shuttering is 85% complete. Zero Lost-Time Injuries (LTI) across 142,000 site man-hours.",
            completionSnapshotPct: 68,
            certifiedToDateAmount: 268880000,
            attachmentRefLabel: "Riverside-Q1-2026-Executive-Dossier-RevF.pdf",
            clientSignOffStatus: "ACKNOWLEDGED",
            clientFeedbackNotes:
              "Board pleased with superstructure concrete quality and safety record. Please prioritize sample apartment mock-up on 2nd Floor by mid-April.",
            publishedById: pmUser.id,
            acknowledgedAt: new Date("2026-03-19"),
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWestlands.id,
            clientId: prjWestlands.clientId,
            portalCode: "CPU-2026-002",
            updateCategory: "FINANCIAL_VALUATION_PACK",
            title: "IPC #03 Valuation Dossier & Commercial Cashflow Forecast (KSh 57.24M)",
            summary:
              "Jointly measured Interim Payment Certificate #03 covering C40 tower cores, columns, and flat slabs up to Level 3. Includes full KEBS steel mill certificates, cube test registers, and updated S-curve cashflow projection.",
            completionSnapshotPct: 44,
            certifiedToDateAmount: 218160000,
            attachmentRefLabel: "WCC-IPC-03-Signed-Valuation-Pack.pdf",
            clientSignOffStatus: "AWAITING_CLIENT_REVIEW",
            clientFeedbackNotes:
              "Under review by Acorn Commercial Finance Committee for RTGS release.",
            publishedById: qsUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjKaren.id,
            clientId: prjKaren.clientId,
            portalCode: "CPU-2026-003",
            updateCategory: "DESIGN_SELECTION_REQUEST",
            title: "Client Selection Pack: Kitchen Quartz Countertops, Pergola Timber & Smart Home Scenes",
            summary:
              "Requesting final client selection between Caesarstone Empira White vs. Pietra Grey for Villa #1–#4 island waterfalls, plus KNX DALI lighting scene presets prior to 2nd-fix joinery manufacture.",
            completionSnapshotPct: 79,
            certifiedToDateAmount: 74908000,
            attachmentRefLabel: "Karen-Villas-Joinery-SmartHome-Options.pdf",
            clientSignOffStatus: "CLARIFICATION_REQUESTED",
            clientFeedbackNotes:
              "We prefer Caesarstone Empira White on Villas 1–3; please confirm lead time if Villa 4 uses brushed Nero Marquina.",
            publishedById: pmUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjRiverside.id,
            clientId: prjRiverside.clientId,
            portalCode: "CPU-2026-004",
            updateCategory: "MILESTONE_COMPLETION",
            title: "Milestone MS-04 Certified: 2nd Floor Show-Apartment Mockup & Acoustic Partition Test",
            summary:
              "Full completion of 3-Bedroom Show Apartment on Block A 2nd Floor including Spanish porcelain tiling, acoustic gypsum bulkheads, mahogany veneered wardrobes, and pressure-tested PPR plumbing.",
            completionSnapshotPct: 71,
            certifiedToDateAmount: 268880000,
            attachmentRefLabel: "Riverside-ShowUnit-Handover-Certificate.pdf",
            clientSignOffStatus: "AWAITING_CLIENT_REVIEW",
            publishedById: pmUser.id,
          },
          {
            organizationId: summitOrg.id,
            projectId: prjWarehouse.id,
            clientId: prjWarehouse.clientId,
            portalCode: "CPU-2026-005",
            updateCategory: "EXECUTIVE_PROGRESS_BRIEF",
            title: "Tatu City Plot B4 Mobilization, NEMA License & Bulk Earthworks Compaction Report",
            summary:
              "Site perimeter hoarding, weighbridge office, and 18,500m³ black-cotton soil stripping completed. Sub-base murram compaction achieved 98% MDD (Modified Proctor) across Bay 1–4.",
            completionSnapshotPct: 18,
            certifiedToDateAmount: 36000000,
            attachmentRefLabel: "Tatu-PlotB4-Earthworks-Lab-MDD-Report.pdf",
            clientSignOffStatus: "ACKNOWLEDGED",
            clientFeedbackNotes:
              "Acknowledged. Proceed with holding-down bolt casting for structural portal frames.",
            publishedById: adminUser.id,
            acknowledgedAt: new Date("2026-03-24"),
          },
        ],
      });
    }
  }

  // ==========================================================================
  // PHASE 12 SEED: AUTOMATED WATCHDOG RULES & OPERATIONAL NOTIFICATIONS
  // ==========================================================================
  const existingRulesCount = await prisma.automationWatchdogRule.count({
    where: { organizationId: summitOrg.id },
  });

  if (existingRulesCount === 0) {
    await prisma.automationWatchdogRule.createMany({
      data: [
        {
          organizationId: summitOrg.id,
          ruleCode: "AUTO-RULE-001",
          ruleType: "BUDGET_THRESHOLD_EXCEEDED",
          name: "Budget Line Exposure & Overrun Watchdog",
          description:
            "Automatically triggers an alert whenever a project budget category's committed or actual cost exceeds its alert threshold (default 85%).",
          thresholdCondition: "Committed or Actual Cost >= 85% of Allocated Budget",
          severity: "CRITICAL",
          channelsJson: JSON.stringify(["IN_APP", "EMAIL", "WHATSAPP"]),
          targetRoles: "Organization Owner, Quantity Surveyor, Project Manager",
          isEnabled: true,
          alertsGeneratedCount: 3,
          lastTriggeredAt: new Date("2026-03-24T08:30:00Z"),
        },
        {
          organizationId: summitOrg.id,
          ruleCode: "AUTO-RULE-002",
          ruleType: "LOW_MATERIAL_STOCK_REORDER",
          name: "Site Store Minimum Reorder Level Monitor",
          description:
            "Monitors daily site material consumption and flags any stock item whose remaining balance drops at or below the site reorder threshold.",
          thresholdCondition: "Remaining Site Stock <= Reorder Threshold",
          severity: "WARNING",
          channelsJson: JSON.stringify(["IN_APP", "SMS", "WHATSAPP"]),
          targetRoles: "Procurement Officer, Site Manager, Storekeeper",
          isEnabled: true,
          alertsGeneratedCount: 4,
          lastTriggeredAt: new Date("2026-03-24T09:15:00Z"),
        },
        {
          organizationId: summitOrg.id,
          ruleCode: "AUTO-RULE-003",
          ruleType: "OVERDUE_CLIENT_INVOICE",
          name: "Client IPC Valuation Receivables & Overdue Monitor",
          description:
            "Tracks certified Interim Payment Certificates (IPCs) and alerts Finance when client settlement passes the contractual due date or remains partially unpaid.",
          thresholdCondition: "Invoice Balance > KSh 0 near/past Due Date",
          severity: "CRITICAL",
          channelsJson: JSON.stringify(["IN_APP", "EMAIL"]),
          targetRoles: "Organization Owner, Accountant, Quantity Surveyor",
          isEnabled: true,
          alertsGeneratedCount: 2,
          lastTriggeredAt: new Date("2026-03-23T14:00:00Z"),
        },
        {
          organizationId: summitOrg.id,
          ruleCode: "AUTO-RULE-004",
          ruleType: "PROJECT_SCHEDULE_DELAY",
          name: "Project & Phase Schedule Slippage Detector",
          description:
            "Compares actual physical completion % against baseline planned progress % and escalates projects marked DELAYED or trailing baseline by > 5%.",
          thresholdCondition: "Project Status = DELAYED or Progress Variance < -5%",
          severity: "WARNING",
          channelsJson: JSON.stringify(["IN_APP", "EMAIL", "WHATSAPP"]),
          targetRoles: "Organization Owner, Project Manager, Site Manager",
          isEnabled: true,
          alertsGeneratedCount: 2,
          lastTriggeredAt: new Date("2026-03-24T07:00:00Z"),
        },
        {
          organizationId: summitOrg.id,
          ruleCode: "AUTO-RULE-005",
          ruleType: "APPROACHING_TASK_DEADLINE",
          name: "Critical Path Task & Milestone Deadline Alert",
          description:
            "Scans active critical and high-priority engineering tasks approaching their due date or blocked on site.",
          thresholdCondition: "Task Priority IN (CRITICAL, HIGH) & Status != COMPLETED",
          severity: "INFO",
          channelsJson: JSON.stringify(["IN_APP", "SMS"]),
          targetRoles: "Project Manager, Site Manager",
          isEnabled: true,
          alertsGeneratedCount: 5,
          lastTriggeredAt: new Date("2026-03-24T06:00:00Z"),
        },
        {
          organizationId: summitOrg.id,
          ruleCode: "AUTO-RULE-006",
          ruleType: "QUALITY_SAFETY_HOLD_POINT",
          name: "QA/QC Hold-Point & OSHA Incident Escalation",
          description:
            "Immediately broadcasts an urgent alert when a site inspection fails a structural hold-point or an open high-severity snag/issue is logged.",
          thresholdCondition: "Inspection = FAILED_HOLD_POINT or Issue Severity = CRITICAL",
          severity: "CRITICAL",
          channelsJson: JSON.stringify(["IN_APP", "EMAIL", "SMS", "WHATSAPP"]),
          targetRoles: "Organization Owner, Project Manager, Site Manager",
          isEnabled: true,
          alertsGeneratedCount: 2,
          lastTriggeredAt: new Date("2026-03-22T16:45:00Z"),
        },
      ],
    });

    await prisma.notification.createMany({
      data: [
        {
          organizationId: summitOrg.id,
          title: "[AUTO-RULE-002] Low Site Stock Alert: Cement 32.5N & PPR Pipes at Riverside",
          message:
            "Riverside Heights Block A & B store has 180 bags of Bamburi 32.5N Cement remaining (below 300-bag reorder level) and 45 lengths of PPR PN20 pipe. Immediate LPO call-off recommended.",
          type: "WARNING",
          category: "PROCUREMENT",
          link: "/materials/stock",
          isRead: "FALSE",
        },
        {
          organizationId: summitOrg.id,
          title: "[AUTO-RULE-004] Project Delay Escalation: Karen Luxury Villas (PRJ-2026-003)",
          message:
            "Karen Luxury Villas is flagged DELAYED (78% actual vs 86% planned progress) due to custom acoustic double-glazed window lead times. Recovery program required.",
          type: "CRITICAL",
          category: "PROJECT",
          link: "/operations/progress",
          isRead: "FALSE",
        },
        {
          organizationId: summitOrg.id,
          title: "[AUTO-RULE-003] IPC Receivables Follow-Up: KSh 73.12M Pending Across 2 Certificates",
          message:
            "INV-IPC-2026-002 (Riverside KSh 15.88M balance) and INV-IPC-2026-004 (Westlands KSh 57.24M) are awaiting client RTGS settlement.",
          type: "WARNING",
          category: "FINANCE",
          link: "/finance/invoices",
          isRead: "FALSE",
        },
        {
          organizationId: summitOrg.id,
          title: "[AUTO-RULE-006] Structural Hold-Point Inspection & Snag Alert",
          message:
            "3 Technical & Commercial submittals (including Westlands 45T Rebar Call-Off APR-2026-006 and Atrium Smoke Curtain Wall APR-2026-002) require director sign-off.",
          type: "INFO",
          category: "SITE",
          link: "/documents/approvals",
          isRead: "FALSE",
        },
      ],
    });
  }

  return summitOrg;
}

if (require.main === module) {
  ensureSeedData()
    .then((org) => {
      console.log(`Seeded organization and portfolio: ${org.name}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}



