import { 
  Course, 
  Organizer, 
  Participant, 
  CourseEnrollment, 
  ScheduleDay, 
  SessionItem, 
  CourseStatus, 
  ApprovalStatus, 
  CourseModuleKey,
  Announcement,
  ResourceMaterial,
  SourceDocument 
} from '../types';

export const KIAR_PILOT_ORGANIZER: Organizer = {
  id: 'org-ppki-01',
  name: 'Pusat Pembangunan Kemahiran Insaniah',
  code: 'PPKI',
  contactEmail: 'ppki@kptm.edu.my',
  contactPhone: '+603-9283 7188',
  description: 'Penyelaras latihan dan pembangunan kurikulum MPU & kemahiran insaniah.',
  memberUserIds: ['user-org-01'],
  createdAt: '2026-08-15T09:00:00Z',
  updatedAt: '2026-08-15T09:00:00Z',
};

export const KIAR_PILOT_COURSE: Course = {
  id: 'course-kiar-2026-01',
  slug: 'kursus-transformasi-kiar-2026',
  title: 'Kursus Transformasi Pedagogi MPU2412 KIAR',
  subtitle: 'Bengkel Pemantapan Pengajaran dan Pembelajaran Kursus MPU2412',
  code: 'MPU2412',
  organizerId: 'org-ppki-01',
  assignedUserIds: ['user-org-01'],
  status: CourseStatus.UPCOMING,
  isFeaturedActive: true,
  approvalStatus: ApprovalStatus.SUBMITTED,
  reviewNotes: 'Dihantar oleh PPKI untuk semakan Master Admin sebelum hebahan umum.',
  startDate: '2026-09-09',
  endDate: '2026-09-11',
  venueName: 'Tamu Hotel & Suites Kuala Lumpur',
  venueAddress: '120 Jalan Raja Abdullah, Kampung Baru, 50300 Kuala Lumpur',
  timezone: 'Asia/Kuala_Lumpur',
  hasPendingChanges: true,
  description: 'Kursus pemantapan kaedah penyampaian pedagogi kursus MPU2412 berteraskan kemahiran insaniah dan penyelesaian masalah bersepadu bagi pensyarah kolej.',
  objectives: [
    'Menyelaraskan kaedah penilaian berasaskan CLO bagi modul MPU2412.',
    'Menerapkan pedagogi berpusatkan pelajar melalui pendekatan PBL dan aktiviti interaktif.',
    'Menghasilkan pelan tindakan transformatif peringkat cawangan kolej masing-masing.',
  ],
  instructions: 'Semua peserta diwajibkan membawa komputer riba dan dokumen kurikulum sedia ada. Pakaian hari 1-2 adalah pakaian rasmi pejabat; hari 3 adalah batik.',
  venueDetails: {
    hallName: 'Ballroom Seri Tamu',
    floor: 'Aras 2',
    wifiSsid: 'TAMU_CONFERENCE_GUEST',
    wifiPassword: 'kiar2026@tamu',
    parkingInfo: 'Parkir aras bawah tanah (B1-B3) percuma dengan mengesahkan tiket di kaunter pendaftaran urus setia.',
    directions: 'Berhampiran Stesen LRT Dang Wangi / MRT Kampung Baru, kira-kira 5 minit berjalan kaki.'
  },
  accommodationDetails: {
    providerName: 'Tamu Hotel & Suites Kuala Lumpur',
    checkInTime: '2026-09-09 14:00',
    checkOutTime: '2026-09-11 12:00',
    roomTypes: 'Twin Sharing (Bilik Berkembar 2 Katil Single)',
    notes: 'Kunci bilik akan diserahkan semasa sesi pendaftaran di Ballroom Seri Tamu. Peserta berkongsi bilik mengikut senarai yang ditetapkan.'
  },
  contacts: [
    {
      id: 'c-01',
      name: 'Puan Siti Zaleha binti Hashim',
      position: 'Penyelaras Utama Urus Setia PPKI',
      phone: '012-3456789',
      whatsapp: '60123456789',
      email: 'sitizaleha@kptm.edu.my'
    },
    {
      id: 'c-02',
      name: 'Encik Faris bin Zakaria',
      position: 'Pegawai Logistik & Penginapan',
      phone: '013-9876543',
      whatsapp: '60139876543',
      email: 'faris.zakaria@kptm.edu.my'
    }
  ],
  modules: [
    { key: CourseModuleKey.OVERVIEW, enabled: true, order: 1 },
    { key: CourseModuleKey.SCHEDULE, enabled: true, order: 2 },
    { key: CourseModuleKey.SESSIONS, enabled: true, order: 3 },
    { key: CourseModuleKey.PARTICIPANTS, enabled: true, order: 4 },
    { key: CourseModuleKey.ANNOUNCEMENTS, enabled: true, order: 5 },
    { key: CourseModuleKey.ACCOMMODATION, enabled: true, order: 6, customLabel: 'Penginapan & Bilik' },
    { key: CourseModuleKey.VENUE_LOGISTICS, enabled: true, order: 7, customLabel: 'Lokasi & Kemudahan' },
    { key: CourseModuleKey.WIFI_ACCESS, enabled: true, order: 8, customLabel: 'Akses Wi-Fi' },
    { key: CourseModuleKey.TRAVEL_MEALS, enabled: true, order: 9, customLabel: 'Tuntutan & Makanan' },
    { key: CourseModuleKey.SECRETARIAT, enabled: true, order: 10, customLabel: 'Urus Setia' },
    { key: CourseModuleKey.RESOURCES, enabled: true, order: 11, customLabel: 'Bahan Kursus' },
  ],
  createdAt: '2026-08-20T10:00:00Z',
  updatedAt: '2026-09-02T14:30:00Z',
};

export const KIAR_PILOT_SCHEDULE_DAYS: ScheduleDay[] = [
  {
    id: 'day-01',
    courseId: 'course-kiar-2026-01',
    dayNumber: 1,
    date: '2026-09-09',
    theme: 'Pendaftaran, Pengenalan & Asas Pedagogi MPU2412',
  },
  {
    id: 'day-02',
    courseId: 'course-kiar-2026-01',
    dayNumber: 2,
    date: '2026-09-10',
    theme: 'Bengkel Amali, Inovasi Pembelajaran & Penilaian',
  },
  {
    id: 'day-03',
    courseId: 'course-kiar-2026-01',
    dayNumber: 3,
    date: '2026-09-11',
    theme: 'Pembentangan Kumpulan & Majlis Penutup',
  },
];

export const KIAR_PILOT_SESSIONS: SessionItem[] = [
  {
    id: 'sess-01',
    courseId: 'course-kiar-2026-01',
    dayNumber: 1,
    sessionNumber: 1,
    startTime: '14:00',
    endTime: '15:30',
    title: 'Sesi 1: Taklimat Kursus & Hala Tuju Transformasi Pedagogi',
    facilitatorName: 'Dr. Norazman bin Ahmad',
    location: 'Ballroom Seri Tamu, Aras 2',
    description: 'Pengenalan kepada objektif penstrukturan semula MPU2412.',
  },
  {
    id: 'sess-02',
    courseId: 'course-kiar-2026-01',
    dayNumber: 1,
    sessionNumber: 2,
    startTime: '16:00',
    endTime: '17:30',
    title: 'Sesi 2: Kerangka Kompetensi & Pemetaan Hasil Pembelajaran',
    facilitatorName: 'Prof. Madya Dr. Salmah Mansor',
    location: 'Ballroom Seri Tamu, Aras 2',
  },
  {
    id: 'sess-03',
    courseId: 'course-kiar-2026-01',
    dayNumber: 2,
    sessionNumber: 3,
    startTime: '08:30',
    endTime: '10:30',
    title: 'Sesi 3: Pembelajaran Berasaskan Masalah (PBL) dalam MPU',
    facilitatorName: 'En. Ahmad Taufiq',
    location: 'Bilik Seminar 1 & 2',
  },
  {
    id: 'sess-04',
    courseId: 'course-kiar-2026-01',
    dayNumber: 2,
    sessionNumber: 4,
    startTime: '11:00',
    endTime: '13:00',
    title: 'Sesi 4: Reka Bentuk Aktiviti Interaktif dan Integrasi EdTech',
    facilitatorName: 'Puan Siti Hajar',
    location: 'Bilik Seminar 1 & 2',
  },
  {
    id: 'sess-05',
    courseId: 'course-kiar-2026-01',
    dayNumber: 2,
    sessionNumber: 5,
    startTime: '14:30',
    endTime: '16:30',
    title: 'Sesi 5: Rubrik Penilaian Holistik & Pentaksiran Berterusan',
    facilitatorName: 'Dr. Norazman bin Ahmad',
    location: 'Bilik Seminar 1 & 2',
  },
  {
    id: 'sess-06',
    courseId: 'course-kiar-2026-01',
    dayNumber: 2,
    sessionNumber: 6,
    startTime: '20:30',
    endTime: '22:00',
    title: 'Sesi 6: Sesi Meja Bulat & Penyediaan Pelan Tindakan Cawangan',
    facilitatorName: 'Urus Setia PPKI',
    location: 'Ballroom Seri Tamu',
  },
  {
    id: 'sess-07',
    courseId: 'course-kiar-2026-01',
    dayNumber: 3,
    sessionNumber: 7,
    startTime: '09:00',
    endTime: '11:00',
    title: 'Sesi 7: Pembentangan Pelan Tindakan Transformasi Cawangan',
    facilitatorName: 'Panel Penilai PPKI',
    location: 'Ballroom Seri Tamu',
  },
  {
    id: 'sess-08',
    courseId: 'course-kiar-2026-01',
    dayNumber: 3,
    sessionNumber: 8,
    startTime: '11:30',
    endTime: '13:00',
    title: 'Sesi 8: Rumusan Kursus & Majlis Penyerahan Sijil Penutupan',
    facilitatorName: 'Pengarah PPKI',
    location: 'Ballroom Seri Tamu',
  },
];

// 22 Participants from 7 educational institutions
export const KIAR_PILOT_PARTICIPANTS: Array<{ participant: Participant; enrollment: CourseEnrollment }> = [
  {
    participant: {
      id: 'p-01',
      name: 'Mohd Faizul bin Che Mat',
      email: 'faizul@kptm.edu.my',
      phone: '019-2345671',
      institutionOrAgency: 'KPTM Kuantan',
      designation: 'Pensyarah Kanan MPU',
      gender: 'M',
      createdAt: '2026-08-25T08:00:00Z',
    },
    enrollment: {
      id: 'enr-01',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-01',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '508',
      roommateName: 'Ustaz Ahmad Syakir',
      assignedGroup: 'Kumpulan 1 (Pahang/Terengganu)',
      createdAt: '2026-08-25T08:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    },
  },
  {
    participant: {
      id: 'p-02',
      name: 'Ustaz Ahmad Syakir bin Ismail',
      email: 'syakir@kptm.edu.my',
      phone: '012-9876543',
      institutionOrAgency: 'KPTM Kuantan',
      designation: 'Pensyarah Pengajian Islam',
      gender: 'M',
      createdAt: '2026-08-25T08:05:00Z',
    },
    enrollment: {
      id: 'enr-02',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-02',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '508',
      roommateName: 'Mohd Faizul bin Che Mat',
      assignedGroup: 'Kumpulan 1 (Pahang/Terengganu)',
      createdAt: '2026-08-25T08:05:00Z',
      updatedAt: '2026-08-25T08:05:00Z',
    },
  },
  {
    participant: {
      id: 'p-03',
      name: 'Nurul Ain binti Hashim',
      email: 'nurulain@kptm.edu.my',
      phone: '013-4567890',
      institutionOrAgency: 'KPTM Bangi',
      designation: 'Ketua Unit MPU',
      gender: 'F',
      createdAt: '2026-08-25T08:10:00Z',
    },
    enrollment: {
      id: 'enr-03',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-03',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '612',
      roommateName: 'Siti Rohani binti Yusof',
      assignedGroup: 'Kumpulan 2 (Selangor/KL)',
      createdAt: '2026-08-25T08:10:00Z',
      updatedAt: '2026-08-25T08:10:00Z',
    },
  },
  {
    participant: {
      id: 'p-04',
      name: 'Siti Rohani binti Yusof',
      email: 'sitirohani@kptm.edu.my',
      phone: '014-5678901',
      institutionOrAgency: 'KPTM Bangi',
      designation: 'Pensyarah Tamadun Islam',
      gender: 'F',
      createdAt: '2026-08-25T08:15:00Z',
    },
    enrollment: {
      id: 'enr-04',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-04',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '612',
      roommateName: 'Nurul Ain binti Hashim',
      assignedGroup: 'Kumpulan 2 (Selangor/KL)',
      createdAt: '2026-08-25T08:15:00Z',
      updatedAt: '2026-08-25T08:15:00Z',
    },
  },
  {
    participant: {
      id: 'p-05',
      name: 'Zulkifli bin Othman',
      email: 'zulkifli@kptm.edu.my',
      phone: '019-3456782',
      institutionOrAgency: 'KPTM Alor Setar',
      designation: 'Pensyarah Hubungan Etnik',
      gender: 'M',
      createdAt: '2026-08-25T08:20:00Z',
    },
    enrollment: {
      id: 'enr-05',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-05',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '510',
      roommateName: 'Wan Mohd Azhar bin Wan Daud',
      assignedGroup: 'Kumpulan 3 (Utara)',
      createdAt: '2026-08-25T08:20:00Z',
      updatedAt: '2026-08-25T08:20:00Z',
    },
  },
  {
    participant: {
      id: 'p-06',
      name: 'Wan Mohd Azhar bin Wan Daud',
      email: 'azhar@kptm.edu.my',
      phone: '012-4567891',
      institutionOrAgency: 'KPTM Alor Setar',
      designation: 'Pensyarah Bahasa Kebangsaan',
      gender: 'M',
      createdAt: '2026-08-25T08:25:00Z',
    },
    enrollment: {
      id: 'enr-06',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-06',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '510',
      roommateName: 'Zulkifli bin Othman',
      assignedGroup: 'Kumpulan 3 (Utara)',
      createdAt: '2026-08-25T08:25:00Z',
      updatedAt: '2026-08-25T08:25:00Z',
    },
  },
  {
    participant: {
      id: 'p-07',
      name: 'Khairul Anuar bin Salleh',
      email: 'khairul@kptm.edu.my',
      phone: '017-8901234',
      institutionOrAgency: 'KPTM Kota Bharu',
      designation: 'Pensyarah Kenegaraan',
      gender: 'M',
      createdAt: '2026-08-25T08:30:00Z',
    },
    enrollment: {
      id: 'enr-07',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-07',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '514',
      roommateName: 'Muhammad Ridzuan bin Halim',
      assignedGroup: 'Kumpulan 4 (Kelantan)',
      createdAt: '2026-08-25T08:30:00Z',
      updatedAt: '2026-08-25T08:30:00Z',
    },
  },
  {
    participant: {
      id: 'p-08',
      name: 'Muhammad Ridzuan bin Halim',
      email: 'ridzuan@kptm.edu.my',
      phone: '018-9012345',
      institutionOrAgency: 'KPTM Kota Bharu',
      designation: 'Pensyarah Falsafah',
      gender: 'M',
      createdAt: '2026-08-25T08:35:00Z',
    },
    enrollment: {
      id: 'enr-08',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-08',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '514',
      roommateName: 'Khairul Anuar bin Salleh',
      assignedGroup: 'Kumpulan 4 (Kelantan)',
      createdAt: '2026-08-25T08:35:00Z',
      updatedAt: '2026-08-25T08:35:00Z',
    },
  },
  {
    participant: {
      id: 'p-09',
      name: 'Haslinda binti Ibrahim',
      email: 'haslinda@kptm.edu.my',
      phone: '011-2345678',
      institutionOrAgency: 'KPTM Batu Pahat',
      designation: 'Pensyarah MPU',
      gender: 'F',
      createdAt: '2026-08-25T08:40:00Z',
    },
    enrollment: {
      id: 'enr-09',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-09',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '616',
      roommateName: 'Faridah binti Ariffin',
      assignedGroup: 'Kumpulan 5 (Selatan)',
      createdAt: '2026-08-25T08:40:00Z',
      updatedAt: '2026-08-25T08:40:00Z',
    },
  },
  {
    participant: {
      id: 'p-10',
      name: 'Faridah binti Ariffin',
      email: 'faridah@kptm.edu.my',
      phone: '012-3456780',
      institutionOrAgency: 'KPTM Batu Pahat',
      designation: 'Pensyarah Etika',
      gender: 'F',
      createdAt: '2026-08-25T08:45:00Z',
    },
    enrollment: {
      id: 'enr-10',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-10',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '616',
      roommateName: 'Haslinda binti Ibrahim',
      assignedGroup: 'Kumpulan 5 (Selatan)',
      createdAt: '2026-08-25T08:45:00Z',
      updatedAt: '2026-08-25T08:45:00Z',
    },
  },
  {
    participant: {
      id: 'p-11',
      name: 'Al-Mansur bin Kadir',
      email: 'almansur@kptm.edu.my',
      phone: '019-8765432',
      institutionOrAgency: 'KPTM Semporna',
      designation: 'Pensyarah Pengajian Malaysia',
      gender: 'M',
      createdAt: '2026-08-25T08:50:00Z',
    },
    enrollment: {
      id: 'enr-11',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-11',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '518',
      roommateName: 'Datu Azmi bin Jamal',
      assignedGroup: 'Kumpulan 6 (Sabah & Sarawak)',
      createdAt: '2026-08-25T08:50:00Z',
      updatedAt: '2026-08-25T08:50:00Z',
    },
  },
  {
    participant: {
      id: 'p-12',
      name: 'Datu Azmi bin Jamal',
      email: 'dazu@kptm.edu.my',
      phone: '013-8901234',
      institutionOrAgency: 'KPTM Semporna',
      designation: 'Pensyarah MPU',
      gender: 'M',
      createdAt: '2026-08-25T08:55:00Z',
    },
    enrollment: {
      id: 'enr-12',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-12',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '518',
      roommateName: 'Al-Mansur bin Kadir',
      assignedGroup: 'Kumpulan 6 (Sabah & Sarawak)',
      createdAt: '2026-08-25T08:55:00Z',
      updatedAt: '2026-08-25T08:55:00Z',
    },
  },
  {
    participant: {
      id: 'p-13',
      name: 'Dr. Shaharuddin bin Yahya',
      email: 'shaharuddin@unikl.edu.my',
      phone: '012-2345679',
      institutionOrAgency: 'UniKL MIIT',
      designation: 'Pensyarah Kanan MPU',
      gender: 'M',
      createdAt: '2026-08-25T09:00:00Z',
    },
    enrollment: {
      id: 'enr-13',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-13',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '520',
      roommateName: 'Ts. Mohd Nor bin Razali',
      assignedGroup: 'Kumpulan 7 (Institusi Rakan)',
      createdAt: '2026-08-25T09:00:00Z',
      updatedAt: '2026-08-25T09:00:00Z',
    },
  },
  {
    participant: {
      id: 'p-14',
      name: 'Ts. Mohd Nor bin Razali',
      email: 'mohdnor@unikl.edu.my',
      phone: '017-3456789',
      institutionOrAgency: 'UniKL BMI',
      designation: 'Penyelaras Kurikulum',
      gender: 'M',
      createdAt: '2026-08-25T09:05:00Z',
    },
    enrollment: {
      id: 'enr-14',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-14',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '520',
      roommateName: 'Dr. Shaharuddin bin Yahya',
      assignedGroup: 'Kumpulan 7 (Institusi Rakan)',
      createdAt: '2026-08-25T09:05:00Z',
      updatedAt: '2026-08-25T09:05:00Z',
    },
  },
  {
    participant: {
      id: 'p-15',
      name: 'Noraini binti Sulaiman',
      email: 'noraini@kptm.edu.my',
      phone: '016-7890123',
      institutionOrAgency: 'KPTM Kuantan',
      designation: 'Pensyarah Bahasa Kebangsaan A',
      gender: 'F',
      createdAt: '2026-08-25T09:10:00Z',
    },
    enrollment: {
      id: 'enr-15',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-15',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '618',
      roommateName: 'Sharifah Munirah binti Syed',
      assignedGroup: 'Kumpulan 1 (Pahang/Terengganu)',
      createdAt: '2026-08-25T09:10:00Z',
      updatedAt: '2026-08-25T09:10:00Z',
    },
  },
  {
    participant: {
      id: 'p-16',
      name: 'Sharifah Munirah binti Syed',
      email: 'munirah@kptm.edu.my',
      phone: '018-8901234',
      institutionOrAgency: 'KPTM Kuantan',
      designation: 'Pensyarah Pendidikan Moral',
      gender: 'F',
      createdAt: '2026-08-25T09:15:00Z',
    },
    enrollment: {
      id: 'enr-16',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-16',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '618',
      roommateName: 'Noraini binti Sulaiman',
      assignedGroup: 'Kumpulan 1 (Pahang/Terengganu)',
      createdAt: '2026-08-25T09:15:00Z',
      updatedAt: '2026-08-25T09:15:00Z',
    },
  },
  {
    participant: {
      id: 'p-17',
      name: 'Kamal Azizi bin Harun',
      email: 'kamal@kptm.edu.my',
      phone: '019-4567890',
      institutionOrAgency: 'KPTM Bangi',
      designation: 'Pensyarah Kemahiran Komunikasi',
      gender: 'M',
      createdAt: '2026-08-25T09:20:00Z',
    },
    enrollment: {
      id: 'enr-17',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-17',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '522',
      roommateName: 'Mohd Fadhil bin Zakaria',
      assignedGroup: 'Kumpulan 2 (Selangor/KL)',
      createdAt: '2026-08-25T09:20:00Z',
      updatedAt: '2026-08-25T09:20:00Z',
    },
  },
  {
    participant: {
      id: 'p-18',
      name: 'Mohd Fadhil bin Zakaria',
      email: 'fadhil@kptm.edu.my',
      phone: '013-5678901',
      institutionOrAgency: 'KPTM Bangi',
      designation: 'Pensyarah Khidmat Komuniti',
      gender: 'M',
      createdAt: '2026-08-25T09:25:00Z',
    },
    enrollment: {
      id: 'enr-18',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-18',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '522',
      roommateName: 'Kamal Azizi bin Harun',
      assignedGroup: 'Kumpulan 2 (Selangor/KL)',
      createdAt: '2026-08-25T09:25:00Z',
      updatedAt: '2026-08-25T09:25:00Z',
    },
  },
  {
    participant: {
      id: 'p-19',
      name: 'Siti Aishah binti Ramli',
      email: 'aishah@kptm.edu.my',
      phone: '017-6789012',
      institutionOrAgency: 'KPTM Alor Setar',
      designation: 'Pensyarah Integriti & Rasuah',
      gender: 'F',
      createdAt: '2026-08-25T09:30:00Z',
    },
    enrollment: {
      id: 'enr-19',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-19',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '620',
      roommateName: 'Zalina binti Abdullah',
      assignedGroup: 'Kumpulan 3 (Utara)',
      createdAt: '2026-08-25T09:30:00Z',
      updatedAt: '2026-08-25T09:30:00Z',
    },
  },
  {
    participant: {
      id: 'p-20',
      name: 'Zalina binti Abdullah',
      email: 'zalina@kptm.edu.my',
      phone: '018-7890123',
      institutionOrAgency: 'KPTM Alor Setar',
      designation: 'Pensyarah MPU',
      gender: 'F',
      createdAt: '2026-08-25T09:35:00Z',
    },
    enrollment: {
      id: 'enr-20',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-20',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '620',
      roommateName: 'Siti Aishah binti Ramli',
      assignedGroup: 'Kumpulan 3 (Utara)',
      createdAt: '2026-08-25T09:35:00Z',
      updatedAt: '2026-08-25T09:35:00Z',
    },
  },
  {
    participant: {
      id: 'p-21',
      name: 'Fauzi bin Md Zin',
      email: 'fauzi@kptm.edu.my',
      phone: '012-8901235',
      institutionOrAgency: 'KPTM Kota Bharu',
      designation: 'Pensyarah Keusahawanan',
      gender: 'M',
      createdAt: '2026-08-25T09:40:00Z',
    },
    enrollment: {
      id: 'enr-21',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-21',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '526',
      roommateName: 'Tuan Syahrul bin Tuan Mat',
      assignedGroup: 'Kumpulan 4 (Kelantan)',
      createdAt: '2026-08-25T09:40:00Z',
      updatedAt: '2026-08-25T09:40:00Z',
    },
  },
  {
    participant: {
      id: 'p-22',
      name: 'Tuan Syahrul bin Tuan Mat',
      email: 'syahrul@kptm.edu.my',
      phone: '019-9012346',
      institutionOrAgency: 'KPTM Kota Bharu',
      designation: 'Penyelaras MPU2412',
      gender: 'M',
      createdAt: '2026-08-25T09:45:00Z',
    },
    enrollment: {
      id: 'enr-22',
      courseId: 'course-kiar-2026-01',
      participantId: 'p-22',
      status: 'CONFIRMED',
      attendanceConfirmed: true,
      roomNumber: '526',
      roommateName: 'Fauzi bin Md Zin',
      assignedGroup: 'Kumpulan 4 (Kelantan)',
      createdAt: '2026-08-25T09:45:00Z',
      updatedAt: '2026-08-25T09:45:00Z',
    },
  },
];

export const KIAR_PILOT_CHANGE_REQUEST = {
  id: 'cr-kiar-01',
  courseId: 'course-kiar-2026-01',
  courseTitle: 'Kursus Transformasi Pedagogi MPU2412 KIAR',
  requestedByUserId: 'user-org-01',
  requestedByOrganizerName: 'Pusat Pembangunan Kemahiran Insaniah',
  changeCategory: 'HIGH_RISK' as const,
  targetField: 'VENUE' as const,
  currentValue: 'Tamu Hotel & Suites Kuala Lumpur',
  proposedValue: 'Tamu Hotel & Suites Kuala Lumpur (Dewan Seri Tamu & Bilik Eksekutif Aras 2)',
  reason: 'Penetapan spesifik bilik mesyuarat dan dewan perbincangan mengikut bilangan 22 peserta dan 7 kumpulan.',
  status: 'PENDING' as const,
  submittedAt: '2026-09-02T11:00:00Z',
};

export const KIAR_PILOT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-01',
    courseId: 'course-kiar-2026-01',
    title: 'Kaunter Pendaftaran Kursus & Penyerahan Kunci Bilik',
    content: 'Pendaftaran akan dibuka bermula jam 2:00 petang di hadapan Ballroom Seri Tamu Aras 2. Sila kemukakan surat panggilan kursus semasa pendaftaran.',
    priority: 'NORMAL',
    isPublic: true,
    publishedAt: '2026-09-02T08:00:00Z',
    authorUserId: 'user-org-01',
  },
  {
    id: 'ann-02',
    courseId: 'course-kiar-2026-01',
    title: 'Peringatan: Muat Turun Dokumen Rujukan CLO MPU2412',
    content: 'Peserta dipohon memuat turun slaid taklimat dan dokumen templat rubrik penilaian dari pautan bahan kursus sebelum sesi 1 bermula.',
    priority: 'URGENT',
    isPublic: true,
    publishedAt: '2026-09-02T10:30:00Z',
    authorUserId: 'user-org-01',
  }
];

export const KIAR_PILOT_RESOURCES: ResourceMaterial[] = [
  {
    id: 'res-kiar-01',
    courseId: 'course-kiar-2026-01',
    title: 'Buku Panduan & Silibus MPU2412 (Edisi 2026)',
    category: 'DOCUMENT',
    fileUrl: 'https://drive.google.com/file/d/kiar-mpu2412-syllabus-2026',
    fileSizeMb: 4.2,
    isPublic: true,
    createdAt: '2026-09-02T09:00:00Z',
  },
  {
    id: 'res-kiar-02',
    courseId: 'course-kiar-2026-01',
    title: 'Slaid Sesi 1: Halatuju & Transformasi Pedagogi MPU2412',
    category: 'SLIDES',
    fileUrl: 'https://docs.google.com/presentation/d/kiar-sesi-1-halatuju',
    sessionId: 'sess-01',
    isPublic: true,
    createdAt: '2026-09-02T09:30:00Z',
  },
  {
    id: 'res-kiar-03',
    courseId: 'course-kiar-2026-01',
    title: 'Templat Pelan Tindakan Cawangan (PBL Action Plan)',
    category: 'TEMPLATE',
    fileUrl: 'https://docs.google.com/spreadsheets/d/kiar-templat-pbl-cawangan',
    isPublic: true,
    createdAt: '2026-09-02T10:00:00Z',
  },
];

export const KIAR_PILOT_SOURCE_DOCUMENTS: SourceDocument[] = [
  {
    id: 'doc-kiar-src-01',
    courseId: 'course-kiar-2026-01',
    fileName: 'Surat_Panggilan_Rasmi_KIAR_2026.txt',
    fileType: 'TXT',
    fileSizeBytes: 4280,
    uploadedAt: '2026-09-02T08:00:00Z',
    uploadedByUserId: 'user-org-01',
    uploadedByUserName: 'Urus Setia PPKI',
    category: 'OFFICIAL_LETTER',
    customCategoryLabel: 'Surat Panggilan Rasmi',
    extractionStatus: 'EXTRACTED',
    lastExtractedAt: '2026-09-02T08:15:00Z',
    version: 1,
    rawText: `KEMENTERIAN PENDIDIKAN TINGGI
PUSAT PEMBANGUNAN KEMAHIRAN INSANIAH (PPKI)
Rujukan Kami: KPTM/PPKI/2026/MPU(04)
Tarikh: 25 Ogos 2026

Kepada:
Semua Pengarah / Ketua Jabatan Kursus MPU
Kolej Poly-Tech MARA & Rangkaian Institusi

Tuan/Puan,

SURAT PANGGILAN KURSUS: TRANSFORMASI PEDAGOGI MPU2412 KIAR 2026
Tajuk Kursus: Kursus Transformasi Pedagogi MPU2412 KIAR
Kod Kursus: MPU2412
Tarikh Kursus: 9 hingga 11 September 2026
Tempat: Tamu Hotel & Suites Kuala Lumpur
Dewan: Ballroom Seri Tamu, Aras 2
Urus Setia: Puan Siti Zaleha binti Hashim (012-3456789)

Dengan segala hormatnya dimaklumkan bahawa Pusat Pembangunan Kemahiran Insaniah (PPKI) akan menganjurkan bengkel kerja intensif seperti ketetapan di atas bagi memantapkan kaedah penyampaian kursus MPU2412 berteraskan CLO dan Project-Based Learning (PBL).

1. MAKLUMAT LOGISTIK & PENGINAPAN:
Hotel: Tamu Hotel & Suites Kuala Lumpur (120 Jalan Raja Abdullah, Kampung Baru, 50300 Kuala Lumpur)
Bilik Seminar: Ballroom Seri Tamu
Akses Wi-Fi: SSID: TAMU_CONFERENCE_GUEST, Kata Laluan: kiar2026@tamu
Parkir: Aras B1-B3 percuma dengan pengesahan tiket di kaunter pendaftaran urus setia.
Penginapan: Twin Sharing bagi semua peserta luar Kuala Lumpur. Daftar masuk bermula 2:00 petang 9 September 2026.

2. KEPERLUAN & ARAHAN PENTADBIRAN:
Arahan: Semua pensyarah diwajibkan membawa komputer riba peribadi dan silibus MPU2412 terkini.
Pakaian: Pakaian pejabat rasmi dan kemas (Hari 1 & 2), Batik Malaysia (Hari 3).

3. PEGAWAI UNTUK DIHUBUNGI:
Penyelaras: Puan Siti Zaleha binti Hashim (Telefon: 012-3456789, emel: sitizaleha@kptm.edu.my)
Pegawai Logistik: Encik Faris bin Zakaria (Telefon: 013-9876543)

Sekian, terima kasih.

"BERKHIDMAT UNTUK NEGARA"
Urus Setia Transformasi Kurikulum PPKI`,
    extractedPayload: {
      fields: [
        {
          fieldKey: 'title',
          fieldLabel: 'Tajuk Kursus',
          category: 'COURSE',
          extractedValue: 'Kursus Transformasi Pedagogi MPU2412 KIAR',
          currentValue: 'Kursus Transformasi Pedagogi MPU2412 KIAR',
          confidence: 'HIGH',
          sourceSnippet: 'Tajuk Kursus: Kursus Transformasi Pedagogi MPU2412 KIAR',
          isConflict: false,
          status: 'ACCEPTED'
        },
        {
          fieldKey: 'code',
          fieldLabel: 'Kod Kursus',
          category: 'COURSE',
          extractedValue: 'MPU2412',
          currentValue: 'MPU2412',
          confidence: 'HIGH',
          sourceSnippet: 'Kod Kursus: MPU2412',
          isConflict: false,
          status: 'ACCEPTED'
        },
        {
          fieldKey: 'dates',
          fieldLabel: 'Tarikh Kursus (Mula & Tamat)',
          category: 'COURSE',
          extractedValue: '2026-09-09 to 2026-09-11',
          currentValue: '2026-09-09 hingga 2026-09-11',
          confidence: 'HIGH',
          sourceSnippet: 'Tarikh Kursus: 9 hingga 11 September 2026',
          isConflict: false,
          isHighRiskGovernance: true,
          status: 'ACCEPTED'
        },
        {
          fieldKey: 'venueName',
          fieldLabel: 'Lokasi / Hotel Kursus',
          category: 'COURSE',
          extractedValue: 'Tamu Hotel & Suites Kuala Lumpur',
          currentValue: 'Tamu Hotel & Suites Kuala Lumpur',
          confidence: 'HIGH',
          sourceSnippet: 'Tempat: Tamu Hotel & Suites Kuala Lumpur',
          isConflict: false,
          isHighRiskGovernance: true,
          status: 'ACCEPTED'
        },
        {
          fieldKey: 'hallName',
          fieldLabel: 'Dewan / Bilik Seminar',
          category: 'LOGISTICS',
          extractedValue: 'Ballroom Seri Tamu, Aras 2',
          currentValue: 'Ballroom Seri Tamu',
          confidence: 'HIGH',
          sourceSnippet: 'Dewan: Ballroom Seri Tamu, Aras 2',
          isConflict: false,
          status: 'PENDING'
        },
        {
          fieldKey: 'wifiSsid',
          fieldLabel: 'Nama Rangkaian Wi-Fi (SSID)',
          category: 'LOGISTICS',
          extractedValue: 'TAMU_CONFERENCE_GUEST',
          currentValue: 'TAMU_CONFERENCE_GUEST',
          confidence: 'HIGH',
          sourceSnippet: 'SSID: TAMU_CONFERENCE_GUEST',
          isConflict: false,
          status: 'ACCEPTED'
        },
        {
          fieldKey: 'wifiPassword',
          fieldLabel: 'Kata Laluan Wi-Fi',
          category: 'LOGISTICS',
          extractedValue: 'kiar2026@tamu',
          currentValue: 'kiar2026@tamu',
          confidence: 'HIGH',
          sourceSnippet: 'Kata Laluan: kiar2026@tamu',
          isConflict: false,
          status: 'ACCEPTED'
        }
      ],
      sessions: [],
      participants: [],
      summary: {
        totalFieldsExtracted: 7,
        totalSessionsExtracted: 0,
        totalParticipantsExtracted: 0,
        highConfidenceCount: 7,
        conflictCount: 0,
      }
    }
  },
  {
    id: 'doc-kiar-src-02',
    courseId: 'course-kiar-2026-01',
    fileName: 'Tentatif_Program_MPU2412.txt',
    fileType: 'TXT',
    fileSizeBytes: 2150,
    uploadedAt: '2026-09-02T09:00:00Z',
    uploadedByUserId: 'user-org-01',
    uploadedByUserName: 'Urus Setia PPKI',
    category: 'SCHEDULE',
    customCategoryLabel: 'Jadual Kursus',
    extractionStatus: 'NEEDS_REVIEW',
    version: 1,
    rawText: `TENTATIF PROGRAM TRANSFORMASI PEDAGOGI MPU2412 KIAR 2026
Lokasi: Ballroom Seri Tamu, Tamu Hotel & Suites KL

Hari 1: 9 September 2026
08:30 - 10:30 | Pendaftaran & Taklimat Awal Halatuju Transformasi | Penceramah: Dr. Norazman bin Idris | Lokasi: Ballroom Seri Tamu
11:00 - 13:00 | Sesi 1: Penstrukturan Semula Rubrik & CLO MPU2412 | Penceramah: Prof. Madya Dr. Azlina | Lokasi: Ballroom Seri Tamu
14:30 - 17:00 | Sesi 2: Bengkel Interaktif: Problem-Based Learning (PBL) | Penceramah: En. Taufiq bin Rahman | Lokasi: Makmal Komputer Aras 3

Hari 2: 10 September 2026
08:30 - 10:30 | Sesi 3: Integrasi Elemen AI dan Digital Tools dalam Bilik Kuliah | Penceramah: Puan Sarah binti Roslan | Lokasi: Ballroom Seri Tamu
11:00 - 13:00 | Sesi 4: Pembinaan Modul Penilaian Berterusan (Continuous Assessment) | Penceramah: Dr. Norazman bin Idris | Lokasi: Ballroom Seri Tamu
14:30 - 17:00 | Sesi 5: Simulasi Pengajaran Mikro Berasaskan Kumpulan | Penceramah: Panel Penilai Luar | Lokasi: Bilik Seminar 1 & 2

Hari 3: 11 September 2026
08:30 - 10:30 | Sesi 6: Pembentangan Pelan Tindakan Cawangan Kolej | Penceramah: Wakil Setiap Cawangan | Lokasi: Ballroom Seri Tamu
11:00 - 12:30 | Sesi 7: Resolusi Bengkel & Majlis Penutupan Rasmi | Penceramah: Pengarah PPKI | Lokasi: Ballroom Seri Tamu`
  },
  {
    id: 'doc-kiar-src-03',
    courseId: 'course-kiar-2026-01',
    fileName: 'Senarai_Pencalonan_Peserta_KIAR_Kolej.csv',
    fileType: 'CSV',
    fileSizeBytes: 3940,
    uploadedAt: '2026-09-02T09:30:00Z',
    uploadedByUserId: 'user-org-01',
    uploadedByUserName: 'Urus Setia PPKI',
    category: 'PARTICIPANT_LIST',
    customCategoryLabel: 'Senarai Peserta & Bilik',
    extractionStatus: 'UPLOADED',
    version: 1,
    rawText: `Nama,No Telefon,No Gaji,Kolej,Jawatan,Jantina,Bilik,Teman Sebilik,Kumpulan,Keperluan Khas
Ahmad bin Abdullah,019-2345671,STF-1021,KPTM Bangi,Pensyarah Kanan,L,B-301,Mohd Hafiz bin Ramli,Kumpulan 1 (PBL Alpha),Vegetarian
Mohd Hafiz bin Ramli,012-3456782,STF-1022,KPTM Bangi,Pensyarah,L,B-301,Ahmad bin Abdullah,Kumpulan 1 (PBL Alpha),Tiada
Nurul Ain binti Razak,013-4567893,STF-1035,KPTM Alor Setar,Pensyarah,P,B-302,Siti Sarah binti Idris,Kumpulan 2 (Rubrik Beta),Alahan Kacang
Siti Sarah binti Idris,017-5678904,STF-1036,KPTM Alor Setar,Pensyarah,P,B-302,Nurul Ain binti Razak,Kumpulan 2 (Rubrik Beta),Tiada
Farid bin Zakaria,018-6789015,STF-1048,KPTM Kota Bharu,Pensyarah Kanan,L,B-303,Khairul Azman bin Harun,Kumpulan 3 (Digital Pedagogi),Bebas Gluten
Khairul Azman bin Harun,011-7890126,STF-1049,KPTM Kota Bharu,Pensyarah,L,B-303,Farid bin Zakaria,Kumpulan 3 (Digital Pedagogi),Tiada
Nor Azimah binti Kamarudin,014-8901237,STF-1051,KPTM Kuantan,Pensyarah,P,B-304,Wan Salmah binti Wan Chik,Kumpulan 4 (Inovasi CLO),Tiada
Wan Salmah binti Wan Chik,016-9012348,STF-1052,KPTM Kuantan,Ketua Unit MPU,P,B-304,Nor Azimah binti Kamarudin,Kumpulan 4 (Inovasi CLO),Tiada
Muhammad Syafiq bin Othman,012-1122334,STF-1063,KPTM Ipoh,Pensyarah,L,B-305,Muhammad Zaim bin Johari,Kumpulan 1 (PBL Alpha),Tiada
Muhammad Zaim bin Johari,019-9988776,STF-1064,KPTM Ipoh,Pensyarah,L,B-305,Muhammad Syafiq bin Othman,Kumpulan 1 (PBL Alpha),Tiada
Fatimah binti Hassan,013-3344556,STF-1075,KPTM Batu Pahat,Pensyarah Kanan,P,B-306,Nurul Huda binti Salleh,Kumpulan 2 (Rubrik Beta),Tiada
Nurul Huda binti Salleh,017-7788990,STF-1076,KPTM Batu Pahat,Pensyarah,P,B-306,Fatimah binti Hassan,Kumpulan 2 (Rubrik Beta),Tiada`
  }
];


