# Database reference

Generated from `prisma/schema.prisma` by `npm run docs:db`. Do not edit by hand.

MySQL 8 / MariaDB 10.6+. Lists (skills, tags) are stored as JSON and read with `asList()`. Long text is `TEXT`; uploaded images are `LONGBLOB`. Timestamps are UTC. Cascade rules are shown per relation.

## Models (51)

| Model | Purpose / notes | Relations |
| --- | --- | --- |
| [User](#user) |  | student, mentor, employer, college, notifications, auditLogs, messages, interviewFeedback, reports, groupMemberships, posts, comments, blocksMade, blocksReceived, roleRequests |
| [StudentProfile](#studentprofile) |  | entries, user, college, projects, skills, applications, referrals, savedRoles, sessions, endorsements, shortlistedBy, submissions, assessmentAttempts, department, driveInvites |
| [PassportEntry](#passportentry) | Experience, achievements, hackathons and certificates. Self-declared unless an admin VERIFIED it after checking the evidence URL. | student |
| [Project](#project) |  | student |
| [SkillEvidence](#skillevidence) | A badge/skill is only displayable when backed by evidence or a defined assessment. | student |
| [MentorProfile](#mentorprofile) |  | user, slots, sessions, endorsementsGiven |
| [OfficeHourSlot](#officehourslot) |  | session, mentor |
| [MentorSession](#mentorsession) |  | slot, mentor, student |
| [Endorsement](#endorsement) |  | mentor, student |
| [Company](#company) |  | assessments, shortlists, invites, members, drives, opportunities, templates |
| [EmployerMember](#employermember) |  | user, company |
| [Opportunity](#opportunity) |  | company, questions, challenge, applications, saved |
| [Application](#application) |  | opportunity, student, referrer, messages, interviews, events, tags, answers, offer |
| [Challenge](#challenge) | Details of an Opportunity whose type is CHALLENGE. Rubric: [{criterion, max, description}]. Scoring is by a human reviewer. | opportunity, submissions |
| [Submission](#submission) |  | challenge, student |
| [Assessment](#assessment) | CODING: items = [{input, expected, hidden}] run in an isolated sandbox. WRITTEN: items = [{prompt, max}] scored by a human. | company, attempts |
| [AssessmentAttempt](#assessmentattempt) |  | assessment, student |
| [Group](#group) |  | members, posts |
| [GroupMember](#groupmember) |  | group, user |
| [Post](#post) | Chronological, no ranking or likes: the feed rewards usefulness, not engagement. | group, author, comments |
| [Comment](#comment) |  | post, author |
| [Block](#block) |  | blocker, blocked |
| [Department](#department) |  | college, students |
| [Drive](#drive) | A campus placement drive: a college proposes it to a verified company, the company confirms, eligible students who opted in are invited. | college, company, invites |
| [DriveInvite](#driveinvite) |  | drive, student |
| [Interview](#interview) |  | application, feedback |
| [ApplicationEvent](#applicationevent) | Stage history: one row per move, so a candidate timeline and time-in-stage / time-to-hire can be shown. | application |
| [CandidateTag](#candidatetag) | Optional questions the employer asks at apply time. Answers are for human reading only: they never score, filter or reject anyone. | application |
| [JobQuestion](#jobquestion) |  | opportunity, answers |
| [ApplicationAnswer](#applicationanswer) |  | application, question |
| [InterviewFeedback](#interviewfeedback) | Interviewer scorecard. Private to the hiring team: candidates never see it, and it never moves anyone between stages by itself. | interview, author |
| [MessageTemplate](#messagetemplate) |  | company |
| [Offer](#offer) |  | application |
| [CompanyInvite](#companyinvite) | A colleague is invited by email; they join after signing in (OTP-verified) with that email. | company |
| [SavedOpportunity](#savedopportunity) |  | student, opportunity |
| [College](#college) |  | students, admins, departments, drives |
| [CollegeAdmin](#collegeadmin) |  | user, college |
| [Notification](#notification) |  | user |
| [Report](#report) |  | reporter |
| [AuditLog](#auditlog) |  | actor |
| [OtpCode](#otpcode) | One-time passcodes (hashed). Rate-limited per identifier. |  |
| [Message](#message) |  | application, sender |
| [Shortlist](#shortlist) |  | company, student |
| [ContactMessage](#contactmessage) |  |  |
| [RateLimit](#ratelimit) | Persistent rate limiting (survives restarts, shared by all processes). |  |
| [ErrorLog](#errorlog) | Unhandled server errors (no personal data: path without query string, truncated message/stack). |  |
| [Upload](#upload) | Images are stored in the database so they survive redeploys on hosts with ephemeral disks. |  |
| [PlanConfig](#planconfig) | Employer plans, editable by a platform admin (names, prices, limits, features). Company.plan holds a key. |  |
| [SiteSetting](#sitesetting) | Platform-wide settings an admin can change (announcement banner, contact email, which roles can sign up). |  |
| [RoleChangeRequest](#rolechangerequest) | / A signed-in user asking a platform admin to change their role. An admin approves or declines; nothing changes until approved. | user |
| [UploadChunk](#uploadchunk) | / Pieces of a file being uploaded (resume or intro video), sent in small requests so hosting proxies with small body limits cannot block it. |  |

### User

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| suspendedReason | String? | @db.VarChar(300) |  |
| suspendedAt | DateTime? |  | set by an admin; suspended users are signed out everywhere and hidden |
| emailNotifications | Boolean | @default(true) |  |
| id | String | @id @default(cuid()) |  |
| email | String? | @unique |  |
| phone | String? | @unique |  |
| googleId | String? | @unique |  |
| passwordHash | String? | @db.VarChar(255) | optional scrypt hash; email codes always work too |
| passwordSetAt | DateTime? |  |  |
| name | String |  |  |
| role | Role | @default(STUDENT) |  |
| createdAt | DateTime | @default(now()) |  |
| student | StudentProfile? |  |  |
| mentor | MentorProfile? |  |  |
| employer | EmployerMember? |  |  |
| college | CollegeAdmin? |  |  |
| notifications | Notification[] |  |  |
| auditLogs | AuditLog[] |  |  |
| messages | Message[] |  |  |
| interviewFeedback | InterviewFeedback[] |  |  |
| reports | Report[] |  |  |
| groupMemberships | GroupMember[] |  |  |
| posts | Post[] |  |  |
| comments | Comment[] |  |  |
| blocksMade | Block[] | @relation("blocker") |  |
| blocksReceived | Block[] | @relation("blocked") |  |
| roleRequests | RoleChangeRequest[] |  |  |

### StudentProfile

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| avatarId | String? |  | Upload.id of the profile photo |
| username | String? | @unique @db.VarChar(30) | public Passport URL /talent/<username>; falls back to slug |
| passportVisibility | Visibility | @default(PUBLIC) |  |
| projectsVisibility | Visibility | @default(PUBLIC) |  |
| endorsementsVisibility | Visibility | @default(PUBLIC) |  |
| entriesVisibility | Visibility | @default(PUBLIC) |  |
| entries | PassportEntry[] |  |  |
| shareWithCollege | Boolean | @default(false) | consent: name + progress visible to their college admins |
| isSample | Boolean | @default(false) | seeded placeholder; UI shows a "Sample" tag |
| id | String | @id @default(cuid()) |  |
| userId | String | @unique |  |
| user | User | @relation(fields: [userId], references: [id], onDelete: Cascade) |  |
| slug | String | @unique | public Talent Card URL |
| headline | String? |  |  |
| resumeId | String? |  | Upload.id of the candidate's current resume (private) |
| resumeName | String? | @db.VarChar(160) |  |
| introVideoId | String? |  | Upload.id of the intro video (private; only shared per application, only at a 100% profile) |
| introVideoAt | DateTime? |  |  |
| bio | String? | @db.Text |  |
| city | String? |  |  |
| githubUrl | String? | @db.VarChar(400) |  |
| skillsClaimed | Json? |  |  |
| lookingFor | String? | @db.Text |  |
| graduationYear | Int? |  |  |
| collegeId | String? |  |  |
| college | College? | @relation(fields: [collegeId], references: [id]) |  |
| contactVisible | Boolean | @default(false) |  |
| completeness | Int | @default(0) | 0–100 profile completeness score |
| projects | Project[] |  |  |
| skills | SkillEvidence[] |  |  |
| applications | Application[] |  |  |
| referrals | Application[] | @relation("Referrals") |  |
| savedRoles | SavedOpportunity[] |  |  |
| sessions | MentorSession[] |  |  |
| endorsements | Endorsement[] |  |  |
| shortlistedBy | Shortlist[] |  |  |
| submissions | Submission[] |  |  |
| assessmentAttempts | AssessmentAttempt[] |  |  |
| department | Department? | @relation(fields: [departmentId], references: [id]) |  |
| departmentId | String? |  |  |
| driveInvites | DriveInvite[] |  |  |

### PassportEntry

Experience, achievements, hackathons and certificates. Self-declared unless an admin VERIFIED it after checking the evidence URL.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| studentId | String |  |  |
| student | StudentProfile | @relation(fields: [studentId], references: [id], onDelete: Cascade) |  |
| kind | EntryKind |  |  |
| title | String | @db.VarChar(120) |  |
| org | String? | @db.VarChar(120) |  |
| year | Int? |  |  |
| url | String? | @db.VarChar(400) |  |
| summary | String? | @db.Text |  |
| verifyRequested | Boolean | @default(false) |  |
| status | VerificationStatus | @default(PENDING) |  |
| verifiedAt | DateTime? |  |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@index([studentId])`, `@@index([verifyRequested, status])`

### Project

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| imageId | String? |  | Upload.id of a project screenshot |
| id | String | @id @default(cuid()) |  |
| studentId | String |  |  |
| student | StudentProfile | @relation(fields: [studentId], references: [id], onDelete: Cascade) |  |
| title | String |  |  |
| summary | String | @db.Text |  |
| githubUrl | String? | @db.VarChar(400) |  |
| demoUrl | String? | @db.VarChar(400) |  |
| fileKeys | Json? |  | storage keys (certificates, screenshots) |

### SkillEvidence

A badge/skill is only displayable when backed by evidence or a defined assessment.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| studentId | String |  |  |
| student | StudentProfile | @relation(fields: [studentId], references: [id], onDelete: Cascade) |  |
| skill | String |  |  |
| basis | String |  | "assessment:<id>" | "project:<id>" | "challenge:<id>" | "endorsement:<id>" |
| explanation | String | @db.Text | shown on badge hover |
| awardedAt | DateTime | @default(now()) |  |

### MentorProfile

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| avatarId | String? |  | Upload.id of the profile photo |
| isSample | Boolean | @default(false) | seeded placeholder; UI shows a "Sample" tag |
| id | String | @id @default(cuid()) |  |
| userId | String | @unique |  |
| user | User | @relation(fields: [userId], references: [id], onDelete: Cascade) |  |
| slug | String | @unique |  |
| roleTitle | String |  |  |
| company | String |  |  |
| country | String |  |  |
| domain | String |  |  |
| tags | Json? |  |  |
| bio | String? | @db.Text |  |
| status | VerificationStatus | @default(PENDING) |  |
| verifiedAt | DateTime? |  |  |
| slots | OfficeHourSlot[] |  |  |
| sessions | MentorSession[] |  |  |
| endorsementsGiven | Endorsement[] |  |  |

### OfficeHourSlot

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| sessionId | String? | @unique | set while a request holds/books this slot |
| session | MentorSession? | @relation(fields: [sessionId], references: [id], onDelete: SetNull) |  |
| id | String | @id @default(cuid()) |  |
| mentorId | String |  |  |
| mentor | MentorProfile | @relation(fields: [mentorId], references: [id], onDelete: Cascade) |  |
| startsAt | DateTime |  |  |
| endsAt | DateTime |  |  |

### MentorSession

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| slot | OfficeHourSlot? |  |  |
| id | String | @id @default(cuid()) |  |
| mentorId | String |  |  |
| mentor | MentorProfile | @relation(fields: [mentorId], references: [id]) |  |
| studentId | String |  |  |
| student | StudentProfile | @relation(fields: [studentId], references: [id]) |  |
| topic | String |  |  |
| message | String? | @db.Text |  |
| createdAt | DateTime | @default(now()) |  |
| status | SessionStatus | @default(REQUESTED) |  |
| startsAt | DateTime? |  |  |

### Endorsement

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| mentorId | String |  |  |
| mentor | MentorProfile | @relation(fields: [mentorId], references: [id]) |  |
| studentId | String |  |  |
| student | StudentProfile | @relation(fields: [studentId], references: [id]) |  |
| text | String | @db.Text |  |
| evidence | String | @db.VarChar(400) | required: link/reference to the work being endorsed |
| createdAt | DateTime | @default(now()) |  |

### Company

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| isSample | Boolean | @default(false) | seeded placeholder; UI shows a "Sample" tag |
| id | String | @id @default(cuid()) |  |
| name | String |  |  |
| website | String? | @db.VarChar(400) |  |
| status | VerificationStatus | @default(PENDING) | no posting/search access until VERIFIED |
| verifiedAt | DateTime? |  |  |
| about | String? | @db.Text |  |
| assessments | Assessment[] |  |  |
| shortlists | Shortlist[] |  |  |
| slug | String? | @unique @db.VarChar(40) | public career page: /careers/<slug> |
| logoId | String? |  | Upload.id of the company logo |
| plan | String | @default("STARTER") @db.VarChar(40) | PlanConfig.key; assigned by a platform admin |
| stageLabels | Json? |  | optional display names per stage, e.g. {"UNDER_REVIEW":"Screening"} |
| invites | CompanyInvite[] |  |  |
| members | EmployerMember[] |  |  |
| drives | Drive[] |  |  |
| opportunities | Opportunity[] |  |  |
| templates | MessageTemplate[] |  |  |

### EmployerMember

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| userId | String | @unique |  |
| user | User | @relation(fields: [userId], references: [id], onDelete: Cascade) |  |
| companyId | String |  |  |
| company | Company | @relation(fields: [companyId], references: [id]) |  |

### Opportunity

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| closedAt | DateTime? |  | employer closed it: no new applications, hidden from search |
| id | String | @id @default(cuid()) |  |
| companyId | String |  |  |
| company | Company | @relation(fields: [companyId], references: [id]) |  |
| questions | JobQuestion[] |  |  |
| title | String |  |  |
| type | OpportunityType |  |  |
| description | String | @db.Text |  |
| payMinINR | Int? |  | monthly (internship) or annual (job); null only when unpaid |
| payMaxINR | Int? |  |  |
| payText | String |  | human-readable, always displayed |
| monthlyINR | Int | @default(0) |  |
| unpaid | Boolean | @default(false) |  |
| workMode | WorkMode |  |  |
| location | String |  |  |
| eligibility | String |  |  |
| gradYears | Json? |  |  |
| skills | Json? |  |  |
| deadline | DateTime |  |  |
| sponsored | Boolean | @default(false) | must be labelled "Sponsored"; never implies verification |
| moderated | VerificationStatus | @default(PENDING) |  |
| shortCode | String? | @unique @db.VarChar(12) | short share link: /j/<shortCode> |
| challenge | Challenge? |  |  |
| applications | Application[] |  |  |
| saved | SavedOpportunity[] |  |  |
| createdAt | DateTime | @default(now()) |  |

### Application

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| opportunityId | String |  |  |
| opportunity | Opportunity | @relation(fields: [opportunityId], references: [id]) |  |
| studentId | String |  |  |
| student | StudentProfile | @relation(fields: [studentId], references: [id]) |  |
| stage | ApplicationStage | @default(APPLIED) |  |
| source | String? | @db.VarChar(30) | e.g. linkedin, whatsapp, careers-page |
| referrerId | String? |  |  |
| referrer | StudentProfile? | @relation("Referrals", fields: [referrerId], references: [id], onDelete: SetNull) |  |
| employerNotes | String? | @db.Text |  |
| resumeId | String? |  | Upload.id of the resume the candidate chose to attach to this application |
| introVideoId | String? |  | Upload.id of the intro video the candidate chose to share with this company |
| messages | Message[] |  |  |
| interviews | Interview[] |  |  |
| events | ApplicationEvent[] |  |  |
| tags | CandidateTag[] |  |  |
| answers | ApplicationAnswer[] |  |  |
| offer | Offer? |  |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@unique([opportunityId, studentId])`

### Challenge

Details of an Opportunity whose type is CHALLENGE. Rubric: [{criterion, max, description}]. Scoring is by a human reviewer.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| opportunityId | String | @unique |  |
| opportunity | Opportunity | @relation(fields: [opportunityId], references: [id], onDelete: Cascade) |  |
| kind | ChallengeKind |  |  |
| style | ChallengeStyle | @default(PORTFOLIO) |  |
| allowTeams | Boolean | @default(false) |  |
| brief | String | @db.Text |  |
| rubric | Json |  |  |
| skillTag | String? | @db.VarChar(60) | skill a reviewer may award as verified evidence |
| submissions | Submission[] |  |  |
| createdAt | DateTime | @default(now()) |  |

### Submission

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| challengeId | String |  |  |
| challenge | Challenge | @relation(fields: [challengeId], references: [id], onDelete: Cascade) |  |
| studentId | String |  |  |
| student | StudentProfile | @relation(fields: [studentId], references: [id], onDelete: Cascade) |  |
| title | String | @db.VarChar(120) |  |
| summary | String | @db.Text |  |
| workUrl | String | @db.VarChar(400) | repository, document or demo link |
| teamNote | String? | @db.VarChar(300) | self-declared teammates and roles |
| status | SubmissionStatus | @default(SUBMITTED) |  |
| scores | Json? |  | [{criterion, points, comment}] from the human reviewer |
| totalScore | Int? |  |  |
| maxScore | Int? |  |  |
| feedback | String? | @db.Text |  |
| reviewedAt | DateTime? |  |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@unique([challengeId, studentId])`, `@@index([challengeId, status])`

### Assessment

CODING: items = [{input, expected, hidden}] run in an isolated sandbox. WRITTEN: items = [{prompt, max}] scored by a human.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| companyId | String |  |  |
| company | Company | @relation(fields: [companyId], references: [id], onDelete: Cascade) |  |
| kind | AssessmentKind |  |  |
| title | String | @db.VarChar(120) |  |
| instructions | String | @db.Text |  |
| languages | Json? |  |  |
| items | Json |  |  |
| timeLimitMs | Int | @default(2000) |  |
| memoryMb | Int | @default(128) |  |
| closesAt | DateTime? |  |  |
| closedAt | DateTime? |  |  |
| attempts | AssessmentAttempt[] |  |  |
| createdAt | DateTime | @default(now()) |  |

### AssessmentAttempt

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| assessmentId | String |  |  |
| assessment | Assessment | @relation(fields: [assessmentId], references: [id], onDelete: Cascade) |  |
| studentId | String |  |  |
| student | StudentProfile | @relation(fields: [studentId], references: [id], onDelete: Cascade) |  |
| language | String? | @db.VarChar(20) |  |
| code | String? | @db.Text |  |
| answers | Json? |  |  |
| status | AttemptStatus |  |  |
| results | Json? |  | coding: per-test outcome (hidden tests never expose input or expected output) |
| scores | Json? |  | written: [{prompt, points, comment}] from the reviewer |
| passed | Int? |  |  |
| total | Int? |  |  |
| feedback | String? | @db.Text |  |
| reviewedAt | DateTime? |  |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@index([assessmentId, studentId, createdAt])`

### Group

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| slug | String | @unique @db.VarChar(60) |  |
| name | String | @db.VarChar(80) |  |
| description | String | @db.VarChar(500) |  |
| kind | GroupKind |  |  |
| collegeId | String? |  |  |
| createdById | String |  |  |
| archivedAt | DateTime? |  |  |
| createdAt | DateTime | @default(now()) |  |
| members | GroupMember[] |  |  |
| posts | Post[] |  |  |

Indexes and constraints: `@@index([kind, archivedAt])`

### GroupMember

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| groupId | String |  |  |
| group | Group | @relation(fields: [groupId], references: [id], onDelete: Cascade) |  |
| userId | String |  |  |
| user | User | @relation(fields: [userId], references: [id], onDelete: Cascade) |  |
| role | GroupRole | @default(MEMBER) |  |
| joinedAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@id([groupId, userId])`, `@@index([userId])`

### Post

Chronological, no ranking or likes: the feed rewards usefulness, not engagement.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| groupId | String |  |  |
| group | Group | @relation(fields: [groupId], references: [id], onDelete: Cascade) |  |
| authorId | String |  |  |
| author | User | @relation(fields: [authorId], references: [id], onDelete: Cascade) |  |
| kind | PostKind |  |  |
| title | String | @db.VarChar(140) |  |
| body | String | @db.Text |  |
| tags | Json? |  |  |
| eventAt | DateTime? |  |  |
| hiddenAt | DateTime? |  |  |
| createdAt | DateTime | @default(now()) |  |
| comments | Comment[] |  |  |

Indexes and constraints: `@@index([groupId, createdAt])`, `@@index([kind, createdAt])`

### Comment

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| postId | String |  |  |
| post | Post | @relation(fields: [postId], references: [id], onDelete: Cascade) |  |
| authorId | String |  |  |
| author | User | @relation(fields: [authorId], references: [id], onDelete: Cascade) |  |
| body | String | @db.Text |  |
| hiddenAt | DateTime? |  |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@index([postId, createdAt])`

### Block

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| blockerId | String |  |  |
| blocker | User | @relation("blocker", fields: [blockerId], references: [id], onDelete: Cascade) |  |
| blockedId | String |  |  |
| blocked | User | @relation("blocked", fields: [blockedId], references: [id], onDelete: Cascade) |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@id([blockerId, blockedId])`

### Department

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| collegeId | String |  |  |
| college | College | @relation(fields: [collegeId], references: [id], onDelete: Cascade) |  |
| name | String | @db.VarChar(80) |  |
| students | StudentProfile[] |  |  |

Indexes and constraints: `@@unique([collegeId, name])`

### Drive

A campus placement drive: a college proposes it to a verified company, the company confirms, eligible students who opted in are invited.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| collegeId | String |  |  |
| college | College | @relation(fields: [collegeId], references: [id], onDelete: Cascade) |  |
| companyId | String |  |  |
| company | Company | @relation(fields: [companyId], references: [id], onDelete: Cascade) |  |
| title | String | @db.VarChar(120) |  |
| description | String | @db.Text |  |
| driveDate | DateTime |  |  |
| gradYears | Json? |  |  |
| departmentIds | Json? |  |  |
| minCompleteness | Int | @default(0) |  |
| status | DriveStatus | @default(PROPOSED) |  |
| createdById | String |  |  |
| createdAt | DateTime | @default(now()) |  |
| invites | DriveInvite[] |  |  |

Indexes and constraints: `@@index([collegeId, createdAt])`, `@@index([companyId, status])`

### DriveInvite

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| driveId | String |  |  |
| drive | Drive | @relation(fields: [driveId], references: [id], onDelete: Cascade) |  |
| studentId | String |  |  |
| student | StudentProfile | @relation(fields: [studentId], references: [id], onDelete: Cascade) |  |
| status | InviteStatus | @default(INVITED) |  |
| outcome | DriveOutcome | @default(NONE) |  |
| invitedAt | DateTime | @default(now()) |  |
| respondedAt | DateTime? |  |  |

Indexes and constraints: `@@unique([driveId, studentId])`, `@@index([studentId, status])`

### Interview

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| applicationId | String |  |  |
| application | Application | @relation(fields: [applicationId], references: [id], onDelete: Cascade) |  |
| scheduledAt | DateTime |  |  |
| minutes | Int | @default(30) |  |
| mode | InterviewMode |  |  |
| detail | String | @db.VarChar(300) | meeting link or address |
| notes | String? | @db.Text |  |
| status | InterviewStatus | @default(SCHEDULED) |  |
| feedback | InterviewFeedback[] |  |  |
| createdById | String |  |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@index([applicationId])`, `@@index([scheduledAt])`

### ApplicationEvent

Stage history: one row per move, so a candidate timeline and time-in-stage / time-to-hire can be shown.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| applicationId | String |  |  |
| application | Application | @relation(fields: [applicationId], references: [id], onDelete: Cascade) |  |
| fromStage | ApplicationStage? |  |  |
| toStage | ApplicationStage |  |  |
| actorId | String? |  |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@index([applicationId, createdAt])`

### CandidateTag

Optional questions the employer asks at apply time. Answers are for human reading only: they never score, filter or reject anyone.
Private labels the hiring team puts on a candidate (e.g. "strong portfolio", "call back"). Never shown to candidates and never used to score or filter automatically.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| applicationId | String |  |  |
| application | Application | @relation(fields: [applicationId], references: [id], onDelete: Cascade) |  |
| label | String | @db.VarChar(30) |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@unique([applicationId, label])`

### JobQuestion

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| opportunityId | String |  |  |
| opportunity | Opportunity | @relation(fields: [opportunityId], references: [id], onDelete: Cascade) |  |
| text | String | @db.VarChar(300) |  |
| position | Int | @default(0) |  |
| answers | ApplicationAnswer[] |  |  |

Indexes and constraints: `@@index([opportunityId])`

### ApplicationAnswer

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| applicationId | String |  |  |
| application | Application | @relation(fields: [applicationId], references: [id], onDelete: Cascade) |  |
| questionId | String |  |  |
| question | JobQuestion | @relation(fields: [questionId], references: [id], onDelete: Cascade) |  |
| answer | String | @db.Text |  |

Indexes and constraints: `@@unique([applicationId, questionId])`

### InterviewFeedback

Interviewer scorecard. Private to the hiring team: candidates never see it, and it never moves anyone between stages by itself.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| interviewId | String |  |  |
| interview | Interview | @relation(fields: [interviewId], references: [id], onDelete: Cascade) |  |
| authorId | String |  |  |
| author | User | @relation(fields: [authorId], references: [id], onDelete: Cascade) |  |
| rating | Int |  |  |
| recommendation | FeedbackRecommendation |  |  |
| strengths | String? | @db.Text |  |
| concerns | String? | @db.Text |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@unique([interviewId, authorId])`

### MessageTemplate

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| companyId | String |  |  |
| company | Company | @relation(fields: [companyId], references: [id], onDelete: Cascade) |  |
| name | String | @db.VarChar(60) |  |
| body | String | @db.VarChar(1000) |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@index([companyId])`

### Offer

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| applicationId | String | @unique |  |
| application | Application | @relation(fields: [applicationId], references: [id], onDelete: Cascade) |  |
| summary | String | @db.VarChar(400) | role, pay and terms as stated to the candidate |
| joiningDate | DateTime? |  |  |
| status | OfferStatus | @default(EXTENDED) |  |
| createdAt | DateTime | @default(now()) |  |
| respondedAt | DateTime? |  |  |

### CompanyInvite

A colleague is invited by email; they join after signing in (OTP-verified) with that email.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| companyId | String |  |  |
| company | Company | @relation(fields: [companyId], references: [id], onDelete: Cascade) |  |
| email | String | @db.VarChar(254) |  |
| invitedById | String |  |  |
| createdAt | DateTime | @default(now()) |  |
| acceptedAt | DateTime? |  |  |

Indexes and constraints: `@@unique([companyId, email])`

### SavedOpportunity

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| studentId | String |  |  |
| student | StudentProfile | @relation(fields: [studentId], references: [id], onDelete: Cascade) |  |
| opportunityId | String |  |  |
| opportunity | Opportunity | @relation(fields: [opportunityId], references: [id], onDelete: Cascade) |  |

Indexes and constraints: `@@id([studentId, opportunityId])`

### College

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| status | VerificationStatus | @default(PENDING) | students can pick it only once VERIFIED |
| createdAt | DateTime | @default(now()) |  |
| id | String | @id @default(cuid()) |  |
| name | String |  |  |
| city | String? |  |  |
| students | StudentProfile[] |  |  |
| admins | CollegeAdmin[] |  |  |
| departments | Department[] |  |  |
| drives | Drive[] |  |  |

### CollegeAdmin

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| userId | String | @unique |  |
| user | User | @relation(fields: [userId], references: [id], onDelete: Cascade) |  |
| collegeId | String |  |  |
| college | College | @relation(fields: [collegeId], references: [id]) |  |

### Notification

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| userId | String |  |  |
| user | User | @relation(fields: [userId], references: [id], onDelete: Cascade) |  |
| title | String |  |  |
| body | String? | @db.Text |  |
| readAt | DateTime? |  |  |
| createdAt | DateTime | @default(now()) |  |

### Report

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| reporterId | String? |  |  |
| reporter | User? | @relation(fields: [reporterId], references: [id]) |  |
| id | String | @id @default(cuid()) |  |
| targetType | String |  |  |
| targetId | String |  |  |
| reason | String | @db.Text |  |
| createdAt | DateTime | @default(now()) |  |
| resolvedAt | DateTime? |  |  |

### AuditLog

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| actorId | String |  |  |
| actor | User | @relation(fields: [actorId], references: [id]) |  |
| action | String |  |  |
| target | String |  |  |
| createdAt | DateTime | @default(now()) |  |

### OtpCode

One-time passcodes (hashed). Rate-limited per identifier.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| identifier | String |  | normalised email or phone |
| codeHash | String |  |  |
| attempts | Int | @default(0) |  |
| expiresAt | DateTime |  |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@index([identifier, createdAt])`

### Message

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| applicationId | String |  |  |
| application | Application | @relation(fields: [applicationId], references: [id], onDelete: Cascade) |  |
| senderId | String |  |  |
| sender | User | @relation(fields: [senderId], references: [id]) |  |
| body | String | @db.Text |  |
| createdAt | DateTime | @default(now()) |  |

### Shortlist

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| companyId | String |  |  |
| company | Company | @relation(fields: [companyId], references: [id], onDelete: Cascade) |  |
| studentId | String |  |  |
| student | StudentProfile | @relation(fields: [studentId], references: [id], onDelete: Cascade) |  |
| note | String? |  |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@unique([companyId, studentId])`

### ContactMessage

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| name | String |  |  |
| email | String |  |  |
| topic | String |  |  |
| message | String | @db.Text |  |
| createdAt | DateTime | @default(now()) |  |
| handledAt | DateTime? |  |  |

### RateLimit

Persistent rate limiting (survives restarts, shared by all processes).

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| key | String | @id |  |
| count | Int |  |  |
| resetAt | DateTime |  |  |

Indexes and constraints: `@@index([resetAt])`

### ErrorLog

Unhandled server errors (no personal data: path without query string, truncated message/stack).

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| message | String | @db.VarChar(500) |  |
| digest | String? |  |  |
| path | String? | @db.VarChar(300) |  |
| stack | String? | @db.Text |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@index([createdAt])`

### Upload

Images are stored in the database so they survive redeploys on hosts with ephemeral disks.
Only validated PNG/JPEG/WebP, max 1 MB (the browser downscales before upload).

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| ownerId | String |  | User.id of the uploader |
| kind | String | @db.VarChar(20) | AVATAR | PROJECT | COMPANY_LOGO (public images) | RESUME | INTRO_VIDEO (private) |
| name | String? | @db.VarChar(160) | original file name for downloads |
| mime | String | @db.VarChar(100) |  |
| size | Int |  |  |
| data | Bytes | @db.LongBlob |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@index([ownerId])`

### PlanConfig

Employer plans, editable by a platform admin (names, prices, limits, features). Company.plan holds a key.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| key | String | @id @db.VarChar(40) |  |
| label | String | @db.VarChar(60) |  |
| priceText | String | @db.VarChar(80) | shown as typed, e.g. "₹2,999 / month", "Free", "Contact us" |
| description | String? | @db.VarChar(300) |  |
| features | Json? |  | string[] |
| listings | Int |  |  |
| challenges | Int |  |  |
| assessments | Int |  |  |
| team | Int |  |  |
| highlight | Boolean | @default(false) |  |
| active | Boolean | @default(true) |  |
| position | Int | @default(0) |  |
| updatedAt | DateTime | @default(now()) @updatedAt |  |

### SiteSetting

Platform-wide settings an admin can change (announcement banner, contact email, which roles can sign up).

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| key | String | @id @db.VarChar(60) |  |
| value | String | @db.Text |  |
| updatedAt | DateTime | @default(now()) @updatedAt |  |

### RoleChangeRequest

/ A signed-in user asking a platform admin to change their role. An admin approves or declines; nothing changes until approved.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| userId | String |  |  |
| user | User | @relation(fields: [userId], references: [id], onDelete: Cascade) |  |
| fromRole | Role |  |  |
| requestedRole | Role |  |  |
| reason | String | @db.VarChar(500) |  |
| status | String | @default("PENDING") @db.VarChar(12) | PENDING | APPROVED | DECLINED |
| decidedById | String? |  |  |
| decisionNote | String? | @db.VarChar(300) |  |
| decidedAt | DateTime? |  |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@index([status, createdAt])`, `@@index([userId])`

### UploadChunk

/ Pieces of a file being uploaded (resume or intro video), sent in small requests so hosting proxies with small body limits cannot block it.
/ Assembled into an Upload when the browser says it is finished; leftovers older than two hours are deleted.

| Field | Type | Constraints | Note |
| --- | --- | --- | --- |
| id | String | @id @default(cuid()) |  |
| token | String | @db.VarChar(40) |  |
| userId | String |  |  |
| idx | Int |  |  |
| data | Bytes | @db.LongBlob |  |
| createdAt | DateTime | @default(now()) |  |

Indexes and constraints: `@@unique([token, idx])`, `@@index([createdAt])`, `@@index([userId])`

## Enums

- **Role**: STUDENT, MENTOR, EMPLOYER, COLLEGE_ADMIN, PLATFORM_ADMIN
- **VerificationStatus**: PENDING, VERIFIED, REJECTED
- **OpportunityType**: INTERNSHIP, JOB, GRADUATE_TRAINEE, APPRENTICESHIP, CAMPUS, FREELANCE, CHALLENGE
- **WorkMode**: REMOTE, HYBRID, ONSITE
- **ApplicationStage**: APPLIED, UNDER_REVIEW, SHORTLISTED, INTERVIEW, OFFER, HIRED, REJECTED, WITHDRAWN
- **ChallengeKind**: CODING, SOFTWARE, DATA_SQL, DESIGN, BUSINESS_CASE, MARKETING, HARDWARE_IOT, RESEARCH, OTHER
- **ChallengeStyle**: COMPETITIVE, COLLABORATIVE, PORTFOLIO
- **SubmissionStatus**: SUBMITTED, REVIEWED, SHORTLISTED, NOT_SELECTED, WITHDRAWN
- **AssessmentKind**: CODING, WRITTEN
- **AttemptStatus**: PASSED, FAILED, ERROR, PENDING_REVIEW, REVIEWED
- **GroupKind**: COLLEGE, INTEREST, PROJECT
- **GroupRole**: MEMBER, MOD
- **PostKind**: DISCUSSION, QUESTION, PROJECT_CALL, EVENT
- **DriveStatus**: PROPOSED, CONFIRMED, DECLINED, CLOSED
- **InviteStatus**: INVITED, ACCEPTED, DECLINED
- **DriveOutcome**: NONE, SHORTLISTED, OFFERED, HIRED, NOT_SELECTED
- **InterviewMode**: VIDEO, PHONE, ONSITE
- **InterviewStatus**: SCHEDULED, COMPLETED, CANCELLED
- **OfferStatus**: EXTENDED, ACCEPTED, DECLINED, WITHDRAWN
- **SessionStatus**: REQUESTED, ACCEPTED, DECLINED, COMPLETED, CANCELLED
- **Visibility**: PUBLIC, RECRUITERS, PRIVATE
- **EntryKind**: EXPERIENCE, ACHIEVEMENT, HACKATHON, CERTIFICATE
- **FeedbackRecommendation**: STRONG_YES, YES, NO, STRONG_NO
