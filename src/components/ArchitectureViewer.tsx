import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Search, 
  Database, 
  Workflow, 
  Layers 
} from 'lucide-react';

interface SectionDoc {
  id: string;
  number: string;
  title: string;
  category: 'Domain & Core' | 'Governance & Roles' | 'Modules & Data' | 'Integrity & Security' | 'Roadmap & Pilot';
  summary: string;
  details: string[];
}

const ARCHITECTURE_SECTIONS: SectionDoc[] = [
  {
    id: 'arch-overview',
    number: '01',
    title: 'Architecture Overview',
    category: 'Domain & Core',
    summary: 'Universal multi-tenant course engine separating course-level administration from platform governance.',
    details: [
      'Simple by Default: A monolithic, modular React + Node/TypeScript core designed for single-container execution without microservice sprawl.',
      'Data-Driven & Decoupled: Standardized relational entities (User, Organizer, Course, ModuleConfig, Enrollment, Session, Announcement).',
      'Universal Model: Agnostic of any single organization or pilot, serving any workshop or multi-day convention.'
    ]
  },
  {
    id: 'system-boundary',
    number: '02',
    title: 'System Boundary',
    category: 'Domain & Core',
    summary: 'Clear demarcation between MyKursus operational responsibilities and external boundaries.',
    details: [
      'Inside Boundary: Course logistics, public itinerary, session scheduling, private attendee allocations (room/group), announcements, venue/Wi-Fi info, materials sharing.',
      'Outside Boundary: Not an LMS (no quiz grading or homework submissions), not a real-time video conference tool, not a public social media network.',
      'Ecosystem Gate: Connects to document sources (PDF/Word/Excel) as inputs, and generates QR code web links as outputs.'
    ]
  },
  {
    id: 'domain-model',
    number: '03',
    title: 'Domain Model Hierarchy',
    category: 'Domain & Core',
    summary: 'The root domain object is the COURSE, governed by Master Admin and owned by Organizers.',
    details: [
      'Hierarchy: PLATFORM → Master Admin Governance → Organizers → Courses → [Modules, Schedule, Sessions, Participants, Announcements].',
      'Tenant Isolation: Organizers operate only within their assigned course boundaries.',
      'Component Modularity: Modules attach to a Course as composable sub-objects rather than rigid monolithic tables.'
    ]
  },
  {
    id: 'entity-list',
    number: '04',
    title: 'Entity List',
    category: 'Domain & Core',
    summary: 'Twelve normalized core entities covering operational and governance requirements.',
    details: [
      '1. User: Identity credentials, authentication status, and global platform role.',
      '2. Organizer: Institutional or departmental organizing body (e.g. PPKI, Training Unit).',
      '3. Course: The central event container with immutable ID and unique public slug.',
      '4. CourseModuleConfig: Dynamic activation flags and custom parameters per module.',
      '5. Participant: Canonical person profile (name, agency, phone, email, secure IC/ID).',
      '6. CourseEnrollment: Join entity binding Participant to Course with private rooming/group allocations.',
      '7. ScheduleDay: Date and day-sequence demarcation (Day 1, Day 2, Day 3).',
      '8. SessionItem: Specific chronological agenda slot with facilitator, venue, and time-bracket.',
      '9. Announcement: Broadcast board message with urgency level (Normal, Urgent, Critical).',
      '10. ResourceMaterial: Downloadable presentations, reference documents, or external URLs.',
      '11. ApprovalChangeRequest: Staged record tracking pending high-risk organizer modifications.',
      '12. SourceDocumentReference: Audit trail of ingested source files (Surat Tawaran, schedules).'
    ]
  },
  {
    id: 'entity-responsibilities',
    number: '05',
    title: 'Entity Responsibilities',
    category: 'Domain & Core',
    summary: 'Explicit functional accountability assigned to each structural entity.',
    details: [
      'Course retains identity, operational lifecycle (UPCOMING/ACTIVE/COMPLETED), and approval gate.',
      'CourseEnrollment guarantees individual privacy by isolating roomNumber and assignedGroup from public view.',
      'ApprovalChangeRequest prevents unverified overrides of sensitive course details (dates, venue) while allowing live operational announcements.'
    ]
  },
  {
    id: 'relationship-map',
    number: '06',
    title: 'Relationship Map',
    category: 'Domain & Core',
    summary: 'Strict foreign-key cardinality preserving relational integrity.',
    details: [
      'Organizer (1) ── (N) Course : One organizer owns multiple courses.',
      'Course (1) ── (N) CourseEnrollment ── (1) Participant : Many-to-many relationship via Enrollment join.',
      'Course (1) ── (N) SessionItem : Ordered by dayNumber and sessionNumber.',
      'Course (1) ── (N) Announcement : Ordered chronologically by publishedAt.'
    ]
  },
  {
    id: 'user-role-model',
    number: '07',
    title: 'User / Role Model',
    category: 'Governance & Roles',
    summary: 'Three non-overlapping actors: Master Admin, Organizer Admin, Participant.',
    details: [
      'MASTER_ADMIN: System custodian. Access to all organizers, course approvals, platform logs, and active course promotion.',
      'ORGANIZER_ADMIN: Operational manager. Create/manage assigned courses, manage attendee lists, schedules, and submit change requests.',
      'PARTICIPANT: Information consumer. Authenticated or token-based access to course details and strictly personal allocations.'
    ]
  },
  {
    id: 'permission-model',
    number: '08',
    title: 'Permission Model',
    category: 'Governance & Roles',
    summary: 'Dual evaluation: Role + Resource Ownership.',
    details: [
      'Rule: Role alone does not grant access. An Organizer Admin can ONLY modify courses where course.organizerId == user.organizerId or user.id in course.assignedUserIds.',
      'Participants cannot view other participants\' private room numbers, personal contacts, or identification numbers.',
      'Master Admin has platform-wide read/audit permissions, with explicit approval authority.'
    ]
  },
  {
    id: 'course-ownership-model',
    number: '09',
    title: 'Course Ownership Model',
    category: 'Governance & Roles',
    summary: 'Organizer owns course content; Master Admin governs platform activation.',
    details: [
      'Separation of Concerns: Master Admin never performs routine data entry or updates participant lists.',
      'Multi-Organizer Support: Different organizers operate in total data isolation from one another.',
      'Co-management: Multiple organizer users can be assigned to collaborate on a single course.'
    ]
  },
  {
    id: 'course-lifecycle',
    number: '10',
    title: 'Course Lifecycle States',
    category: 'Governance & Roles',
    summary: 'Seven sequential workflow states from inception to archival.',
    details: [
      '1. DRAFT: Organizer builds content; unpublished and invisible to participants.',
      '2. SUBMITTED: Frozen for editing pending Master Admin approval.',
      '3. APPROVED: Verified by Master Admin for compliance.',
      '4. PUBLISHED: Publicly accessible via permanent slug; participants can view details.',
      '5. ACTIVE: The course is currently ongoing; highlighted on platform portals.',
      '6. COMPLETED: Program ended; retains read-only access for reference.',
      '7. ARCHIVED: Historical cold storage; unindexed from active directories.'
    ]
  },
  {
    id: 'status-vs-approval',
    number: '11',
    title: 'Course Status vs. Approval Status',
    category: 'Governance & Roles',
    summary: 'Critical architectural decoupling between operational time and governance status.',
    details: [
      'Operational CourseStatus: UPCOMING | ACTIVE | COMPLETED | ARCHIVED (Tracks real-world time).',
      'Governance ApprovalStatus: DRAFT | CHANGES_REQUIRED | SUBMITTED | APPROVED | REJECTED.',
      'Example: A course may be Approved (Governance) but Upcoming (Operational), or Active with a pending low-risk announcement.'
    ]
  },
  {
    id: 'slug-strategy',
    number: '12',
    title: 'Unique Course Slug Strategy',
    category: 'Domain & Core',
    summary: 'Permanent human-readable identifier decoupled from internal database UUIDs.',
    details: [
      'Dual Identity: course.id = UUID (immutable internal key), course.slug = URL-safe slug.',
      'Stability Guarantee: Changing the course title does NOT alter an already published slug.',
      'Collision Protection: Automatic slug generator verifies uniqueness upon creation.'
    ]
  },
  {
    id: 'active-course-strategy',
    number: '13',
    title: 'Active Course Strategy',
    category: 'Domain & Core',
    summary: 'Spotlight mechanism for ongoing courses without masking other valid courses.',
    details: [
      'Non-Destructive: Marking a course as isFeaturedActive highlights it on home screens.',
      'Multiple Active Support: Allows concurrent courses to both hold ACTIVE operational status.',
      'Changing active course does not hide, archive, or delete other valid courses.'
    ]
  },
  {
    id: 'core-modules',
    number: '14',
    title: 'Core Modules Definition',
    category: 'Modules & Data',
    summary: 'The standard baseline modules enabled across all courses.',
    details: [
      'Overview: Course title, dates, venue summary, learning goals, organizing unit.',
      'Schedule & Sessions: Chronological timetable by day and time slot with facilitator details.',
      'Participants: Directory of registered attendees and organizational affiliations.',
      'Announcements: Priority broadcast board for urgent venue, timetable, or administrative alerts.'
    ]
  },
  {
    id: 'optional-modules',
    number: '15',
    title: 'Optional Modules Architecture',
    category: 'Modules & Data',
    summary: 'Dynamic feature flags configured on a per-course basis.',
    details: [
      'Accommodation: Hotel info, room allocations, roommate pairings.',
      'Venue Logistics: Interactive floor plans, prayer room locations, parking guides.',
      'Wi-Fi Access: Network SSID, captive portal instructions, and passcodes.',
      'Travel & Meals: Reimbursement claim notices, dietary options, dress codes.',
      'Resources: Slides, PDF notes, reference materials, evaluation links.',
      'Secretariat: Direct hotline/WhatsApp contact buttons for on-site coordinators.'
    ]
  },
  {
    id: 'participant-data-model',
    number: '16',
    title: 'Participant-Specific Data Model',
    category: 'Modules & Data',
    summary: 'Isolated personal allocations stored in CourseEnrollment.',
    details: [
      'Privacy Boundary: Room number, Roommate, and breakout Group reside in CourseEnrollment.',
      'Phone Verification: Participant queries only return enrollment records matching registered phone.',
      'No Cohort Leakage: Public course directories list names and agencies only, never room numbers.'
    ]
  },
  {
    id: 'visibility-privacy',
    number: '17',
    title: 'Visibility & Privacy Model',
    category: 'Integrity & Security',
    summary: 'Five strict data visibility tiers preventing accidental disclosure.',
    details: [
      '1. PUBLIC: Course title, dates, published schedule, general announcements.',
      '2. AUTHENTICATED: Downloadable course slides, participant roster (names and institutions only).',
      '3. PARTICIPANT_PRIVATE: Individual room number, assigned group, diet restrictions, medical notes.',
      '4. ORGANIZER_ADMIN: Full rooming allocation roster, contact numbers, participant ICs.',
      '5. MASTER_ADMIN: Platform audit logs, organizer management, approval history.'
    ]
  },
  {
    id: 'source-document-model',
    number: '18',
    title: 'Source Document Model',
    category: 'Modules & Data',
    summary: 'Ingestion pipeline reference for transforming unstructured files into structured course data.',
    details: [
      'SourceDocumentReference entity tracks original file (Surat Tawaran, participant Excel, agenda PDF).',
      'Flow: SOURCE FILE → EXTRACT TEXT/TABLES → MAP TO DOMAIN ENTITIES → ORGANIZER VERIFICATION → PUBLISH.'
    ]
  },
  {
    id: 'approval-change-model',
    number: '19',
    title: 'Approval & Change Governance Model',
    category: 'Governance & Roles',
    summary: 'Risk-differentiated change pipeline preventing operational deadlock.',
    details: [
      'HIGH_RISK CHANGES: Changes to course dates, venue location require Master Admin review.',
      'LOW_RISK CHANGES: Minor session descriptions, emergency announcements, presentation links published directly by Organizers.',
      'Preserves current published snapshot until a proposed change request is formally approved.'
    ]
  },
  {
    id: 'data-integrity',
    number: '20',
    title: 'Data Integrity Strategy (DCOREV1)',
    category: 'Integrity & Security',
    summary: 'Core DCOREV1 data rules strictly enforced across the system.',
    details: [
      'Admin Data Is Authoritative: No speculative auto-alteration of user input.',
      'Empty Means Empty: 0 participants or 0 announcements is a valid state; no automatic injection of mock records.',
      'No Data Resurrection: When an item is deleted, it remains permanently gone across DB and state.'
    ]
  },
  {
    id: 'deletion-strategy',
    number: '21',
    title: 'Deletion Strategy',
    category: 'Integrity & Security',
    summary: 'Differentiated deletion behaviors based on entity significance.',
    details: [
      'Hard Delete: Permanent cascade deletion for courses and organizers.',
      'Soft Deactivation: Archiving courses for historical record without deletion.',
      'Cascade Protection: Deleting a course permanently cascades to enrollments and sessions cleanly.'
    ]
  },
  {
    id: 'storage-consistency',
    number: '22',
    title: 'Storage Consistency Strategy',
    category: 'Integrity & Security',
    summary: 'Single-source-of-truth flow across memory, cache, and database.',
    details: [
      'Write Flow: Local storage write → verification → re-sync.',
      'Zero Resurrection: Client state cannot overwrite database with stale cached deletes.'
    ]
  },
  {
    id: 'ui-domain-separation',
    number: '23',
    title: 'UI & Domain Logic Separation',
    category: 'Domain & Core',
    summary: 'Pure domain business rules decoupled from React presentation components.',
    details: [
      'Business Rules in Domain Layer: Slug generation, status transitions reside in pure TypeScript modules.',
      'UI Role: Components only render state and trigger events.'
    ]
  },
  {
    id: 'pilot-validation-kiar',
    number: '24',
    title: 'Pilot Validation Against KIAR 2026',
    category: 'Roadmap & Pilot',
    summary: 'Direct empirical validation demonstrating complete schema compatibility with pilot data.',
    details: [
      'Course Entity: "Kursus Transformasi Pedagogi MPU2412 KIAR", 9–11 Sept 2026, Tamu Hotel & Suites KL.',
      'Participants: 22 individuals across 7 institutions mapped to Participant + CourseEnrollment.',
      'Schedule: 3 ScheduleDays, 8 SessionItems mapped directly with facilitators and locations.',
      'Optional Modules Active: Accommodation, Wi-Fi, Meals, Secretariat, Materials.'
    ]
  },
  {
    id: 'future-scalability',
    number: '25',
    title: 'Future Scalability Considerations',
    category: 'Roadmap & Pilot',
    summary: 'Architectural readiness for post-v1 extensions without refactoring core models.',
    details: [
      'QR Code Attendance Tracking: Can bind to CourseEnrollment via timestamped check-in records.',
      'Automated Certificate Generation: Uses Participant + Course completion status.'
    ]
  },
  {
    id: 'architecture-risks',
    number: '26',
    title: 'Architecture Risks & Mitigations',
    category: 'Roadmap & Pilot',
    summary: 'Identification of operational bottlenecks and mitigations.',
    details: [
      'Risk 1: Approval latency during live events. Mitigation: Emergency announcements bypass approval.',
      'Risk 2: Public URL guessing of participant private data. Mitigation: Participant-specific phone verification.',
      'Risk 3: Slug collisions. Mitigation: Strict unique constraint with validation.'
    ]
  },
  {
    id: 'implementation-sequence',
    number: '27',
    title: 'Recommended Implementation Sequence (Part 03)',
    category: 'Roadmap & Pilot',
    summary: 'Phased, low-risk execution plan for Part 03.',
    details: [
      'Phase 1: Master Admin platform governance, course oversight & status controls (CURRENT).',
      'Phase 2: Organizer Workspace & Content Authoring.',
      'Phase 3: Public Course Experience & Participant Digital Companion.'
    ]
  }
];

const DIAGRAMS = {
  system: `
+-------------------------------------------------------------------------+
|                        MYKURSUS PLATFORM ARCHITECTURE                   |
+-------------------------------------------------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+------------------------+                     +------------------------+
|   MASTER ADMIN PORTAL  |                     |  PUBLIC / PARTICIPANT  |
| - Platform Governance  |                     | - Frictionless QR Slug |
| - Organizer Onboarding |                     | - Public Schedule/Info |
| - Course Approvals     |                     | - Private Room & Group |
+------------------------+                     +------------------------+
            ^                                               ^
            |                                               |
            +-----------------------+-----------------------+
                                    |
                       +------------------------+
                       |   ORGANIZER DASHBOARD  |
                       | - Course Management    |
                       | - Modules Toggle       |
                       | - Schedule & Roster    |
                       | - Change Submissions   |
                       +------------------------+
  `,
  permissions: `
ROLE & PERMISSION HIERARCHY:
============================
[MASTER ADMIN]     -> Global scope: Governance, approvals, all courses, platform settings
       |
[ORGANIZER ADMIN]  -> Tenant scope: Assigned courses ONLY (course.organizerId == user.orgId)
       |              Can edit draft, manage sessions/roster, submit for review
       |
[PARTICIPANT]      -> Consumes published course via public slug
                      Accesses private rooming/group details strictly for own enrollment
  `,
  domain: `
COURSE DOMAIN MODEL:
====================
[ORGANIZER] (1)
    |
    +---> (N) [COURSE] (id, slug, title, dates, venue, status, approvalStatus)
                 |
                 +---> (N) [MODULE_CONFIG] (key, enabled, order)
                 |
                 +---> (N) [SCHEDULE_DAY] (dayNumber, date, theme)
                 |            |
                 |            +---> (N) [SESSION_ITEM] (1..8, time, facilitator)
                 |
                 +---> (N) [COURSE_ENROLLMENT]
                 |            |
                 |            +---> (1) [PARTICIPANT] (name, agency, phone)
                 |            |
                 |            +---> [PRIVATE DATA] (roomNumber, roommate, group)
                 |
                 +---> (N) [ANNOUNCEMENT] (priority, title, content)
                 +---> (N) [RESOURCE] (slides, docs, links)
  `,
  lifecycle: `
COURSE STATE MACHINE:
=====================
[DRAFT]  ----(Organizer submits)---->  [SUBMITTED FOR REVIEW]
   ^                                             |
   |                                    (Master Admin reviews)
   |--(Changes Requested)                        v
                                            [APPROVED]
                                                 |
                                            (Published)
                                                 v
                                            [PUBLISHED]
                                                 |
                                            (Event Start)
                                                 v
                                             [ACTIVE]
                                                 |
                                            (Event End)
                                                 v
                                           [COMPLETED]
                                                 |
                                           [ARCHIVED]
  `,
  flow: `
ORGANIZER -> APPROVAL -> PARTICIPANT FLOW:
==========================================
1. Organizer creates Course & selects modules (Accommodation, WiFi, Schedule)
2. Organizer populates Participant Roster & Agenda Sessions
3. Organizer submits Course for review -> Status: SUBMITTED
4. Master Admin inspects & Approves -> Status: APPROVED -> PUBLISHED
5. Stable Slug generated: mykursus.app/course/transformasi-pedagogi-kiar-2026
6. QR Code generated -> Participants scan -> Access unified digital companion!
7. Organizer posts live emergency announcement -> Updates instantly on participant screens!
  `
};

export const ArchitectureViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'specs' | 'diagrams'>('specs');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSectionId, setActiveSectionId] = useState<string>('arch-overview');
  const [activeDiagram, setActiveDiagram] = useState<keyof typeof DIAGRAMS>('system');

  const categories = ['All', 'Domain & Core', 'Governance & Roles', 'Modules & Data', 'Integrity & Security', 'Roadmap & Pilot'];

  const filteredSections = ARCHITECTURE_SECTIONS.filter((section) => {
    const matchesCategory = selectedCategory === 'All' || section.category === selectedCategory;
    const matchesQuery = 
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.details.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const activeSection = ARCHITECTURE_SECTIONS.find(s => s.id === activeSectionId) || ARCHITECTURE_SECTIONS[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Sub Tabs */}
      <div className="flex gap-2 border-b-2 border-zinc-900 pb-3">
        <button
          onClick={() => setActiveSubTab('specs')}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 ${
            activeSubTab === 'specs'
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-900'
          }`}
        >
          27 Spesifikasi Seni Bina (DCOREV1)
        </button>
        <button
          onClick={() => setActiveSubTab('diagrams')}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 ${
            activeSubTab === 'diagrams'
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-900'
          }`}
        >
          Rajah Sistem & Domain (ASCII)
        </button>
      </div>

      {activeSubTab === 'specs' ? (
        <section className="bg-white border-2 border-zinc-900 p-6 flex flex-col gap-6 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b-2 border-zinc-900">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-zinc-950">
                Spesifikasi Seni Bina & Model Data (Part 02)
              </h2>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-0.5">
                Piawaian Tadbir Urus DCOREV1 untuk MyKursus
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari spesifikasi..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border-2 border-zinc-900 focus:outline-none w-44 font-medium"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      selectedCategory === cat
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 grid grid-cols-1 gap-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredSections.map((section) => {
                const isSelected = section.id === activeSection.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`w-full text-left p-3.5 border-2 transition-all ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">
                        #{section.number} {section.title}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {section.category}
                      </span>
                    </div>
                    <p className={`text-xs line-clamp-1 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {section.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7 bg-zinc-50 border-2 border-zinc-900 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-300">
                  <span className="text-xs font-mono font-black px-2 py-0.5 bg-zinc-900 text-white">
                    SPEC #{activeSection.number}
                  </span>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300">
                    {activeSection.category}
                  </span>
                </div>

                <h3 className="text-xl font-black uppercase text-zinc-950 mb-3">
                  {activeSection.title}
                </h3>

                <div className="p-3 bg-white border-2 border-zinc-900 mb-4">
                  <p className="text-xs font-semibold text-zinc-900">
                    {activeSection.summary}
                  </p>
                </div>

                <div className="space-y-2">
                  {activeSection.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-white p-2.5 border border-zinc-200">
                      <span className="w-1.5 h-1.5 bg-zinc-900 mt-1.5 shrink-0"></span>
                      <p className="text-xs text-zinc-700 leading-relaxed">
                        {detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-white border-2 border-zinc-900 p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b-2 border-zinc-900">
            <h3 className="text-lg font-black uppercase text-zinc-950">Rajah Sistem ASCII</h3>
            <div className="flex gap-1">
              {(['system', 'permissions', 'domain', 'lifecycle', 'flow'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveDiagram(key)}
                  className={`px-2.5 py-1 text-xs font-bold uppercase border ${
                    activeDiagram === key ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-zinc-900 text-zinc-100 p-4 font-mono text-xs overflow-x-auto">
            <pre>{DIAGRAMS[activeDiagram]}</pre>
          </div>
        </section>
      )}
    </div>
  );
};
