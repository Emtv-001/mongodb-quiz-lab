export const DEFAULT_DATABASE_COLLECTIONS = [
  {
    id: "col_gptdata02",
    databaseType: "mongodb",
    name: "GptData02",
    label: "Students & Academic Records",
    description: "Default MongoDB student collection with nested addresses, array courses, and numeric GPAs.",
    schemaFields: [
      { name: "_id", type: "number", required: true },
      { name: "Name", type: "string", required: true },
      { name: "Age", type: "number" },
      { name: "GPA", type: "double" },
      { name: "Courses", type: "array" },
      { name: "Address.State", type: "string" }
    ],
    documents: [
      {
        _id: 1,
        Name: "Tunde Adeyemi",
        DOB: "2002-04-14",
        Phone: "+2348011223344",
        Age: 22,
        Course: "Software Engineering",
        Courses: ["JavaScript", "Python", "Database Systems"],
        Skills: ["Git", "Python", "SQL"],
        MonthOfAdmission: "September",
        Address: { Country: "Nigeria", State: "Lagos", City: "Ikeja", HouseNumber: 12 },
        GPA: 3.4,
        Marks: 78,
        Section: "A",
        Active: true,
        Misc: [15, 28, 42, 9]
      },
      {
        _id: 2,
        Name: "Chioma Okonkwo",
        DOB: "2003-08-21",
        Phone: "+2348022334455",
        Age: 21,
        Course: "Computer Science",
        Courses: ["C++", "Java", "Web Development"],
        Skills: ["Java", "Docker", "Algorithms"],
        MonthOfAdmission: "January",
        Address: { Country: "Nigeria", State: "Enugu", City: "Nsukka", HouseNumber: 45 },
        GPA: 3.85,
        Marks: 92,
        Section: "A",
        Active: true,
        Misc: [33, 19, 88, 5]
      },
      {
        _id: 3,
        Name: "Emeka Eze",
        DOB: "2001-11-03",
        Phone: "+2348033445566",
        Age: 23,
        Course: "Software Engineering",
        Courses: ["Node.js", "Express", "MongoDB"],
        Skills: ["JavaScript", "MongoDB", "Linux"],
        MonthOfAdmission: "September",
        Address: { Country: "Nigeria", State: "Abuja", City: "Garki", HouseNumber: 8 },
        GPA: 3.1,
        Marks: 70,
        Section: "B",
        Active: true,
        Misc: [7, 14, 21, 35]
      },
      {
        _id: 4,
        Name: "Amina Bello",
        DOB: "2004-01-17",
        Phone: "+2348044556677",
        Age: 20,
        Course: "Data Science",
        Courses: ["Python", "Statistics", "Machine Learning"],
        Skills: ["Pandas", "R", "SQL"],
        MonthOfAdmission: "September",
        Address: { Country: "Nigeria", State: "Kaduna", City: "Zaria", HouseNumber: 3 },
        GPA: 3.9,
        Marks: 95,
        Section: "A",
        Active: true,
        Misc: [40, 50, 60, 70]
      },
      {
        _id: 5,
        Name: "Babajide Williams",
        DOB: "2002-09-29",
        Phone: "+2348055667788",
        Age: 22,
        Course: "Information Technology",
        Courses: ["Networking", "Cybersecurity", "Cloud Computing"],
        Skills: ["AWS", "Networking", "Bash"],
        MonthOfAdmission: "January",
        Address: { Country: "Nigeria", State: "Oyo", City: "Ibadan", HouseNumber: 99 },
        GPA: 2.95,
        Marks: 65,
        Section: "C",
        Active: false,
        Misc: [10, 20, 30, 40]
      }
    ],
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z")
  },
  {
    id: "col_hospital",
    databaseType: "mongodb",
    name: "patients",
    label: "Hospital Management",
    description: "Healthcare records, clinical vitals, blood groups, and doctor assignments.",
    schemaFields: [
      { name: "_id", type: "string", required: true },
      { name: "patientName", type: "string", required: true },
      { name: "department", type: "string" },
      { name: "admitted", type: "boolean" },
      { name: "prescriptions", type: "array" }
    ],
    documents: [
      {
        _id: "HOSP-001",
        patientName: "Adeleke Benson",
        age: 45,
        bloodGroup: "O+",
        allergies: ["Penicillin", "Sulfa"],
        vitals: { heartRate: 72, bloodPressure: "120/80", temperature: 36.8 },
        department: "Cardiology",
        admitted: true,
        doctorInCharge: "Dr. Alabi",
        prescriptions: [
          { medication: "Lisinopril", dosage: "10mg", frequency: "Daily" },
          { medication: "Aspirin", dosage: "81mg", frequency: "Daily" }
        ],
        billing: { total: 45000, paid: 30000, status: "partial" }
      },
      {
        _id: "HOSP-002",
        patientName: "Miriam Kalu",
        age: 29,
        bloodGroup: "A+",
        allergies: [],
        vitals: { heartRate: 80, bloodPressure: "115/75", temperature: 37.1 },
        department: "Maternity",
        admitted: false,
        doctorInCharge: "Dr. Mrs. Briggs",
        prescriptions: [
          { medication: "Folic Acid", dosage: "5mg", frequency: "Daily" }
        ],
        billing: { total: 12000, paid: 12000, status: "paid" }
      },
      {
        _id: "HOSP-003",
        patientName: "Tariq Mansoor",
        age: 63,
        bloodGroup: "B-",
        allergies: ["Ibuprofen"],
        vitals: { heartRate: 88, bloodPressure: "145/95", temperature: 37.4 },
        department: "Oncology",
        admitted: true,
        doctorInCharge: "Dr. Okon",
        prescriptions: [
          { medication: "Cisplatin", dosage: "50mg", frequency: "Weekly" }
        ],
        billing: { total: 180000, paid: 50000, status: "unpaid" }
      }
    ],
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z")
  },
  {
    id: "col_banking",
    databaseType: "mongodb",
    name: "accounts",
    label: "Banking & Ledgers",
    description: "Financial account records, balances, KYC verification, and transaction histories.",
    schemaFields: [
      { name: "_id", type: "string", required: true },
      { name: "accountNumber", type: "string", required: true },
      { name: "balance", type: "double", required: true },
      { name: "tier", type: "number" }
    ],
    documents: [
      {
        _id: "ACC-1001",
        accountNumber: "0123456789",
        accountHolder: "Nnamdi Kanu Tech Ventures",
        tier: 3,
        balance: 1450000.50,
        currency: "NGN",
        status: "active",
        kycVerified: true,
        branches: ["Victoria Island", "Lekki Phase 1"],
        limits: { dailyTransfer: 5000000, international: true },
        recentTransfers: [
          { ref: "TX-9901", amount: 250000, type: "debit", recipient: "Amazon AWS", date: "2026-09-01" },
          { ref: "TX-9902", amount: 800000, type: "credit", sender: "Client Retainer", date: "2026-09-03" }
        ]
      },
      {
        _id: "ACC-1002",
        accountNumber: "0987654321",
        accountHolder: "Grace Opara",
        tier: 1,
        balance: 84200.00,
        currency: "NGN",
        status: "active",
        kycVerified: true,
        branches: ["Ikeja Mall"],
        limits: { dailyTransfer: 100000, international: false },
        recentTransfers: [
          { ref: "TX-9903", amount: 15000, type: "debit", recipient: "Supermarket POS", date: "2026-09-04" }
        ]
      },
      {
        _id: "ACC-1003",
        accountNumber: "0554433221",
        accountHolder: "Suleiman Minerals Ltd",
        tier: 3,
        balance: 12500000.00,
        currency: "NGN",
        status: "dormant",
        kycVerified: false,
        branches: ["Abuja Central"],
        limits: { dailyTransfer: 10000000, international: true },
        recentTransfers: []
      }
    ],
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z")
  },
  {
    id: "col_ecommerce",
    databaseType: "mongodb",
    name: "products",
    label: "E-Commerce Catalog",
    description: "Product inventory, pricing, SKU tags, and category attributes.",
    schemaFields: [
      { name: "_id", type: "string", required: true },
      { name: "sku", type: "string", required: true },
      { name: "price", type: "number", required: true },
      { name: "stock", type: "number" }
    ],
    documents: [
      {
        _id: "PROD-501",
        sku: "LAPTOP-MBP-16",
        title: "MacBook Pro 16-inch M3 Max",
        category: "Computers",
        price: 3499.00,
        stock: 14,
        tags: ["electronics", "apple", "developer", "hardware"],
        ratings: { average: 4.8, reviewCount: 124 },
        attributes: { ram: "64GB", storage: "1TB SSD", color: "Space Black" },
        discounts: [{ code: "STUDENT10", percentage: 10, validTill: "2026-12-31" }]
      },
      {
        _id: "PROD-502",
        sku: "PHONE-PX-9P",
        title: "Google Pixel 9 Pro XL",
        category: "Phones",
        price: 1099.00,
        stock: 45,
        tags: ["electronics", "mobile", "ai", "android"],
        ratings: { average: 4.6, reviewCount: 88 },
        attributes: { ram: "16GB", storage: "256GB", color: "Obsidian" },
        discounts: []
      },
      {
        _id: "PROD-503",
        sku: "MON-DELL-4K",
        title: "Dell UltraSharp 32 4K USB-C Hub Monitor",
        category: "Monitors",
        price: 899.99,
        stock: 0,
        tags: ["electronics", "displays", "productivity"],
        ratings: { average: 4.7, reviewCount: 52 },
        attributes: { size: "32 inch", resolution: "3840x2160", panel: "IPS Black" },
        discounts: []
      }
    ],
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z")
  },
  {
    id: "col_relational_sql",
    databaseType: "postgresql",
    name: "customer_invoices",
    label: "PostgreSQL Invoices Table",
    description: "Relational customer billing records with foreign key customerId and tax calculations.",
    schemaFields: [
      { name: "invoice_id", type: "serial", required: true },
      { name: "customer_id", type: "integer", required: true },
      { name: "subtotal", type: "numeric(10,2)", required: true },
      { name: "tax_rate", type: "numeric(4,2)" },
      { name: "status", type: "varchar(20)" }
    ],
    documents: [
      { invoice_id: 101, customer_id: 42, subtotal: 350.00, tax_rate: 7.50, status: "PAID", created_at: "2026-09-15" },
      { invoice_id: 102, customer_id: 88, subtotal: 1250.50, tax_rate: 7.50, status: "PENDING", created_at: "2026-09-18" },
      { invoice_id: 103, customer_id: 19, subtotal: 90.00, tax_rate: 7.50, status: "OVERDUE", created_at: "2026-08-30" }
    ],
    createdAt: new Date("2026-09-15T00:00:00.000Z"),
    updatedAt: new Date("2026-09-15T00:00:00.000Z")
  }
];
