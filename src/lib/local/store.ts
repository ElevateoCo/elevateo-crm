import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { hashPassword } from './hash';
import { defaultOnboardingChecklist } from '@/lib/people-ops';
import type {
  ActivityLogEntry,
  Approval,
  Client,
  ClientMember,
  Division,
  FileRow,
  Notification,
  Project,
  ProjectMember,
  Task,
  TaskComment,
  User,
  UserRole,
  DivisionCode,
} from '@/lib/supabase/types';

export interface LocalUser extends User {
  password_hash: string;
}

export interface Store {
  divisions: Division[];
  users: LocalUser[];
  clients: Client[];
  projects: Project[];
  client_members: ClientMember[];
  project_members: ProjectMember[];
  tasks: Task[];
  task_comments: TaskComment[];
  approvals: Approval[];
  notifications: Notification[];
  activity_log: ActivityLogEntry[];
  files: FileRow[];
  sessions: { token: string; user_id: string; created_at: string }[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'elevateoco.json');
const DEFAULT_PASSWORD = 'password123';

let cache: Store | null = null;

function tryPersist(store: Store) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Read-only runtimes such as Vercel cannot persist local state.
    // For demo mode we keep serving the in-memory seeded store.
  }
}

function emptyStore(): Store {
  return {
    divisions: [],
    users: [],
    clients: [],
    projects: [],
    client_members: [],
    project_members: [],
    tasks: [],
    task_comments: [],
    approvals: [],
    notifications: [],
    activity_log: [],
    files: [],
    sessions: [],
  };
}

interface PersonSpec {
  key: string;
  email: string;
  full_name: string;
  role: UserRole;
  /** Primary division (used for sidebar + main filtering). */
  division: DivisionCode;
  /** Additional division tags. Primary is always included automatically. */
  extraDivisions?: DivisionCode[];
  manager: string | null;
  password?: string;
}

function seed(store: Store) {
  const now = new Date().toISOString();
  const divisionSpecs: Array<{ code: DivisionCode; name: string; description: string }> = [
    { code: 'sales', name: 'Sales', description: 'Outbound, inbound, qualification, closing.' },
    { code: 'marketing', name: 'Marketing', description: 'Creative, content, paid, brand.' },
    { code: 'technology', name: 'Technology', description: 'Engineering, AI, internal tooling.' },
    { code: 'ecommerce', name: 'E-commerce', description: 'Stores, fulfilment, product ops.' },
    { code: 'admin', name: 'Admin', description: 'Operations, people, finance, coordination.' },
  ];
  store.divisions = divisionSpecs.map((d) => ({
    id: randomUUID(),
    code: d.code,
    name: d.name,
    description: d.description,
    owner_id: null,
    created_at: now,
  }));
  const divByCode = new Map(store.divisions.map((d) => [d.code, d]));

  // Seed roster in dependency order so manager_id can resolve.
  const roster: PersonSpec[] = [
    // Tier 1: founders
    {
      key: 'allan',
      email: 'allan.chan@elevateoco.com',
      full_name: 'Allan Chan',
      role: 'owner',
      division: 'admin',
      manager: null,
    },
    {
      key: 'hazem',
      email: 'hazem.dweik@elevateoco.com',
      full_name: 'Hazem Dweik',
      role: 'owner',
      division: 'admin',
      extraDivisions: ['sales', 'marketing', 'ecommerce'],
      manager: null,
      password: 'password123',
    },
    // Tier 2: division owners under Allan
    {
      key: 'lachie',
      email: 'lachie@elevateoco.com',
      full_name: 'Lachie',
      role: 'executive',
      division: 'sales',
      manager: 'allan',
    },
    {
      key: 'arnis',
      email: 'arnis@elevateoco.com',
      full_name: 'Arnis',
      role: 'executive',
      division: 'technology',
      manager: 'allan',
    },
    // Tier 3: sales managers under Lachie
    {
      key: 'thomas',
      email: 'thomas.charrier@elevateoco.com',
      full_name: 'Thomas Charrier',
      role: 'lead',
      division: 'sales',
      manager: 'lachie',
    },
    {
      key: 'zuri',
      email: 'zuri.robledo@elevateoco.com',
      full_name: 'Zuri Robledo',
      role: 'lead',
      division: 'sales',
      manager: 'lachie',
    },
    {
      key: 'lewis',
      email: 'lewis.hayward@elevateoco.com',
      full_name: 'Lewis Hayward',
      role: 'lead',
      division: 'sales',
      manager: 'lachie',
    },
    // Tier 3: marketing lead under Bailey, with Hazem as owner/final approval.
    {
      key: 'bailey',
      email: 'bailey@elevateoco.com',
      full_name: 'Bailey',
      role: 'lead',
      division: 'marketing',
      extraDivisions: ['technology', 'ecommerce'],
      manager: 'hazem',
    },
    {
      key: 'emil',
      email: 'emil.larsen@elevateoco.com',
      full_name: 'Emil Larsen',
      role: 'member',
      division: 'marketing',
      extraDivisions: ['technology', 'ecommerce'],
      manager: 'hazem',
    },
    {
      key: 'julian',
      email: 'julian@elevateoco.com',
      full_name: 'Julian',
      role: 'lead',
      division: 'ecommerce',
      extraDivisions: ['marketing'],
      manager: 'hazem',
    },
    {
      key: 'arian',
      email: 'arian.hidalgo@elevateoco.com',
      full_name: 'Arián Hidalgo',
      role: 'external',
      division: 'marketing',
      manager: 'hazem',
    },
    // Tier 3: technology members under Arnis
    {
      key: 'jeison',
      email: 'jeison@elevateoco.com',
      full_name: 'Jeison',
      role: 'member',
      division: 'technology',
      manager: 'arnis',
    },
    {
      key: 'tanzeel',
      email: 'tanzeel.ahmad@elevateoco.com',
      full_name: 'Tanzeel Ahmad',
      role: 'member',
      division: 'technology',
      manager: 'arnis',
    },
    {
      key: 'chase',
      email: 'chase.buchanan@elevateoco.com',
      full_name: 'Chase Buchanan',
      role: 'member',
      division: 'technology',
      manager: 'arnis',
    },
    {
      key: 'callum',
      email: 'callum@elevateoco.com',
      full_name: 'Callum',
      role: 'member',
      division: 'technology',
      manager: 'arnis',
    },
    // Tier 4: sales member under Thomas
    {
      key: 'nathan',
      email: 'nathan@elevateoco.com',
      full_name: 'Nathan',
      role: 'member',
      division: 'sales',
      manager: 'thomas',
    },
    {
      key: 'core',
      email: 'core@elevateoco.com',
      full_name: 'Core Member',
      role: 'lead',
      division: 'sales',
      manager: 'lachie',
      password: 'password123',
    },
    {
      key: 'james',
      email: 'james.taylor@elevateoco.com',
      full_name: 'James Taylor',
      role: 'member',
      division: 'marketing',
      manager: 'hazem',
    },
  ];

  const byKey = new Map<string, LocalUser>();
  for (const p of roster) {
    const division = divByCode.get(p.division);
    const divisions = Array.from(
      new Set<DivisionCode>([p.division, ...(p.extraDivisions ?? [])])
    );
    const user: LocalUser = {
      id: randomUUID(),
      email: p.email,
      full_name: p.full_name,
      avatar_url: null,
      skin_tone: null,
      timezone: null,
      bio: null,
      nationality: null,
      supports: null,
      last_seen_at: null,
      presence_status: null,
      cold_call_goal: 40,
      division_id: division?.id ?? null,
      divisions,
      manager_id: p.manager ? byKey.get(p.manager)?.id ?? null : null,
      role: p.role,
      onboarding_stage: 'not_contacted',
      onboarding_checklist: defaultOnboardingChecklist,
      is_active: true,
      created_at: now,
      updated_at: now,
      password_hash: hashPassword(p.password ?? DEFAULT_PASSWORD),
    };
    store.users.push(user);
    byKey.set(p.key, user);
  }

  // Division owners.
  const setOwner = (code: DivisionCode, key: string) => {
    const div = divByCode.get(code);
    const u = byKey.get(key);
    if (div && u) div.owner_id = u.id;
  };
  setOwner('admin', 'hazem');
  setOwner('sales', 'lachie');
  setOwner('marketing', 'hazem');
  setOwner('technology', 'arnis');
  setOwner('ecommerce', 'hazem');

  seedClientsAndProjects(store, byKey, divByCode, now);
}

interface ProjectSpec {
  title: string;
  description: string;
  divisionCode: DivisionCode;
  leadKey: string | null;
  status?: Project['status'];
  due_date?: string | null;
  /** Additional people working on the project (beyond the lead). */
  memberKeys?: string[];
}

interface ClientSpec {
  name: string;
  status: Client['status'];
  divisionCode: DivisionCode;
  leadKey: string | null;
  contact_name?: string | null;
  notes?: string | null;
  projects: ProjectSpec[];
}

function seedClientsAndProjects(
  store: Store,
  byKey: Map<string, LocalUser>,
  divByCode: Map<DivisionCode, Division>,
  now: string
) {
  const hazem = byKey.get('hazem')!;
  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const clientSpecs: ClientSpec[] = [
    {
      name: 'E-commerce Portfolio',
      status: 'active',
      divisionCode: 'ecommerce',
      leadKey: 'julian',
      contact_name: 'Internal',
      notes: 'Owned, in-house stores. Each store is a separate project.',
      projects: [
        { title: 'Cat Core', description: 'Cat-niche product store.', divisionCode: 'ecommerce', leadKey: 'julian', status: 'active', due_date: inDays(30) },
        { title: 'Christian Store', description: 'Faith-niche product store.', divisionCode: 'ecommerce', leadKey: 'julian', status: 'active', due_date: inDays(28) },
        { title: 'Crypto Store', description: 'Crypto-niche merchandise.', divisionCode: 'ecommerce', leadKey: 'julian', status: 'active', due_date: inDays(35) },
        { title: 'Doggy Dog', description: 'Dog-niche product store.', divisionCode: 'ecommerce', leadKey: 'julian', status: 'active', due_date: inDays(30) },
        { title: 'Jesus Better', description: 'Faith-niche store, variant.', divisionCode: 'ecommerce', leadKey: 'julian', status: 'active', due_date: inDays(40) },
        { title: 'Jesus Eternal', description: 'Faith-niche store, variant.', divisionCode: 'ecommerce', leadKey: 'julian', status: 'active', due_date: inDays(40) },
        { title: 'Kitty Klub', description: 'Cat-niche secondary store.', divisionCode: 'ecommerce', leadKey: 'julian', status: 'planning', due_date: inDays(45) },
        { title: 'Muslim Store', description: 'Faith-niche product store.', divisionCode: 'ecommerce', leadKey: 'julian', status: 'active', due_date: inDays(32) },
      ],
    },
    {
      name: 'Niels',
      status: 'active',
      divisionCode: 'marketing',
      leadKey: 'emil',
      contact_name: 'Niels',
      notes: 'Personal-brand client. Short-form content + documentary work.',
      projects: [
        {
          title: 'Shorts',
          description: 'Ongoing short-form edits from raw B-roll and scripts.',
          divisionCode: 'marketing',
          leadKey: 'emil',
          status: 'active',
          due_date: inDays(14),
        },
        {
          title: 'Document Overhaul',
          description: 'Documentary-format restructure and re-edit.',
          divisionCode: 'marketing',
          leadKey: 'emil',
          status: 'active',
          due_date: inDays(45),
        },
        {
          title: 'Documentary',
          description: "Niels' documentary production.",
          divisionCode: 'marketing',
          leadKey: 'hazem',
          memberKeys: ['emil'],
          status: 'active',
          due_date: inDays(60),
        },
      ],
    },
    {
      name: 'Marcel',
      status: 'active',
      divisionCode: 'technology',
      leadKey: 'bailey',
      contact_name: 'Marcel',
      notes: 'Raha Resort — full operational refresh: web, PMS, marketing.',
      projects: [
        {
          title: 'Website Migration',
          description: 'Move existing site to the new stack, preserve SEO, redesign UX.',
          divisionCode: 'technology',
          leadKey: 'bailey',
          status: 'active',
          due_date: inDays(21),
        },
        {
          title: 'PMS Integration',
          description: 'Connect property management system to the website + booking flow.',
          divisionCode: 'technology',
          leadKey: 'arnis',
          status: 'active',
          due_date: inDays(35),
        },
        {
          title: 'Marketing Campaigns',
          description: 'Q3 brand and paid campaigns across owned channels.',
          divisionCode: 'marketing',
          leadKey: 'bailey',
          status: 'planning',
          due_date: inDays(50),
        },
      ],
    },
    {
      name: 'Vitalscore',
      status: 'active',
      divisionCode: 'marketing',
      leadKey: 'bailey',
      contact_name: 'Vitalscore',
      notes: 'Paid media + organic social management.',
      projects: [
        {
          title: 'Meta Ads',
          description: 'Meta paid advertising management.',
          divisionCode: 'marketing',
          leadKey: 'bailey',
          status: 'active',
          due_date: inDays(30),
        },
        {
          title: 'SMM',
          description: 'Social media management and organic content.',
          divisionCode: 'marketing',
          leadKey: 'emil',
          memberKeys: ['james'],
          status: 'active',
          due_date: inDays(30),
        },
      ],
    },
    {
      name: 'Kilcock',
      status: 'active',
      divisionCode: 'technology',
      leadKey: 'bailey',
      contact_name: 'Kilcock',
      notes: 'Website build.',
      projects: [
        {
          title: 'Website',
          description: 'Website design and build.',
          divisionCode: 'technology',
          leadKey: 'bailey',
          status: 'active',
          due_date: inDays(30),
        },
      ],
    },
    {
      name: 'Jad Bouw',
      status: 'active',
      divisionCode: 'technology',
      leadKey: 'jeison',
      contact_name: 'Jad Bouw',
      notes: 'Website build plus SEO.',
      projects: [
        {
          title: 'Website + SEO',
          description: 'Website build and search engine optimisation.',
          divisionCode: 'technology',
          leadKey: 'jeison',
          status: 'active',
          due_date: inDays(40),
        },
      ],
    },
    {
      name: "Eddie's Real Estate",
      status: 'active',
      divisionCode: 'technology',
      leadKey: null,
      contact_name: 'Eddie',
      notes: 'Real estate project. Lead TBD.',
      projects: [
        {
          title: 'Real Estate',
          description: 'Real estate web/marketing project.',
          divisionCode: 'technology',
          leadKey: null,
          status: 'active',
          due_date: inDays(45),
        },
      ],
    },
    {
      name: 'KCF Homes',
      status: 'active',
      divisionCode: 'technology',
      leadKey: 'tanzeel',
      contact_name: 'KCF Homes',
      notes: 'Website build.',
      projects: [
        {
          title: 'Website',
          description: 'Website design and build.',
          divisionCode: 'technology',
          leadKey: 'tanzeel',
          status: 'active',
          due_date: inDays(30),
        },
      ],
    },
    {
      name: 'Verbiestschilderwerken NL',
      status: 'active',
      divisionCode: 'technology',
      leadKey: 'arnis',
      contact_name: 'Verbiestschilderwerken',
      notes: 'NL painting company — web/marketing.',
      projects: [
        {
          title: 'Website',
          description: 'Website build and delivery.',
          divisionCode: 'technology',
          leadKey: 'arnis',
          memberKeys: ['lachie'],
          status: 'active',
          due_date: inDays(30),
        },
      ],
    },
    {
      name: 'C3',
      status: 'active',
      divisionCode: 'technology',
      leadKey: null,
      contact_name: 'C3',
      notes: 'Website.',
      projects: [
        {
          title: 'Website',
          description: 'Website build.',
          divisionCode: 'technology',
          leadKey: null,
          status: 'active',
          due_date: inDays(14),
        },
      ],
    },
    {
      name: 'Vitality',
      status: 'active',
      divisionCode: 'technology',
      leadKey: null,
      contact_name: 'Vitality',
      notes: 'Website.',
      projects: [
        {
          title: 'Website',
          description: 'Website build.',
          divisionCode: 'technology',
          leadKey: null,
          status: 'active',
          due_date: inDays(14),
        },
      ],
    },
    {
      name: 'Sig',
      status: 'active',
      divisionCode: 'technology',
      leadKey: 'emil',
      contact_name: 'Sig',
      notes: 'Development in progress.',
      projects: [
        {
          title: 'Development',
          description: 'Development started.',
          divisionCode: 'technology',
          leadKey: 'emil',
          status: 'active',
          due_date: inDays(45),
        },
      ],
    },
    {
      name: 'Heartlands KC',
      status: 'active',
      divisionCode: 'technology',
      leadKey: 'emil',
      contact_name: 'Heartlands KC',
      notes: 'In progress.',
      projects: [
        {
          title: 'Website',
          description: 'Website build — in progress.',
          divisionCode: 'technology',
          leadKey: 'emil',
          memberKeys: ['jeison'],
          status: 'active',
          due_date: inDays(35),
        },
      ],
    },
    {
      name: "Joe's Jewellery",
      status: 'active',
      divisionCode: 'technology',
      leadKey: 'chase',
      contact_name: 'Joe',
      notes: 'Jewellery store project.',
      projects: [
        {
          title: 'Website',
          description: 'Jewellery store build.',
          divisionCode: 'technology',
          leadKey: 'chase',
          status: 'active',
          due_date: inDays(30),
        },
      ],
    },
    {
      name: 'GSM',
      status: 'active',
      divisionCode: 'marketing',
      leadKey: 'arian',
      contact_name: 'GSM',
      notes: 'Organic social posting.',
      projects: [
        {
          title: 'Organic Posting',
          description: 'Organic social content posting.',
          divisionCode: 'marketing',
          leadKey: 'arian',
          memberKeys: ['emil'],
          status: 'active',
          due_date: inDays(30),
        },
      ],
    },
    {
      name: 'SoarxTax',
      status: 'active',
      divisionCode: 'marketing',
      leadKey: 'james',
      contact_name: 'SoarxTax',
      notes: 'Organic posting plus SEO.',
      projects: [
        {
          title: 'Organic Posting',
          description: 'Organic social content posting.',
          divisionCode: 'marketing',
          leadKey: 'james',
          status: 'active',
          due_date: inDays(30),
        },
        {
          title: 'SEO',
          description: 'Search engine optimisation.',
          divisionCode: 'marketing',
          leadKey: 'chase',
          status: 'active',
          due_date: inDays(40),
        },
      ],
    },
    {
      name: 'Simon',
      status: 'active',
      divisionCode: 'marketing',
      leadKey: 'emil',
      contact_name: 'Simon',
      notes: 'Content scheduling.',
      projects: [
        {
          title: 'Content Scheduling',
          description: 'Scheduling content.',
          divisionCode: 'marketing',
          leadKey: 'emil',
          status: 'active',
          due_date: inDays(21),
        },
      ],
    },
  ];

  for (const c of clientSpecs) {
    const division = divByCode.get(c.divisionCode);
    const lead = c.leadKey ? byKey.get(c.leadKey) : null;
    const clientId = randomUUID();
    store.clients.push({
      id: clientId,
      name: c.name,
      slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      status: c.status,
      primary_division_id: division?.id ?? null,
      account_lead_id: lead?.id ?? null,
      contact_name: c.contact_name ?? null,
      contact_email: null,
      contact_phone: null,
      notes: c.notes ?? null,
      created_by: hazem.id,
      created_at: now,
      updated_at: now,
    });

    for (const p of c.projects) {
      const projDiv = divByCode.get(p.divisionCode);
      const projLead = p.leadKey ? byKey.get(p.leadKey) : null;
      const projectId = randomUUID();
      store.projects.push({
        id: projectId,
        client_id: clientId,
        division_id: projDiv?.id ?? null,
        lead_id: projLead?.id ?? null,
        title: p.title,
        description: p.description,
        status: p.status ?? 'active',
        start_date: null,
        due_date: p.due_date ?? null,
        created_by: hazem.id,
        created_at: now,
        updated_at: now,
      });

      // Lead + named members get project_members rows (deduped).
      const memberIds = new Set<string>();
      if (projLead) memberIds.add(projLead.id);
      for (const key of p.memberKeys ?? []) {
        const member = byKey.get(key);
        if (member) memberIds.add(member.id);
      }
      for (const userId of memberIds) {
        store.project_members.push({
          project_id: projectId,
          user_id: userId,
          created_at: now,
        });
      }
    }
  }
}

function load(): Store {
  if (cache) return cache;
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // Ignore mkdir failures in read-only runtimes and continue in memory.
  }

  if (!existsSync(DB_FILE)) {
    const fresh = emptyStore();
    seed(fresh);
    tryPersist(fresh);
    cache = fresh;
    return cache;
  }

  try {
    const raw = readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<Store>;
    cache = { ...emptyStore(), ...parsed };
    if (!cache.divisions?.length || !cache.users?.length) {
      cache = emptyStore();
      seed(cache);
      tryPersist(cache);
    }
    return cache;
  } catch {
    cache = emptyStore();
    seed(cache);
    tryPersist(cache);
    return cache;
  }
}

export function getStore(): Store {
  return load();
}

export function saveStore() {
  if (!cache) return;
  tryPersist(cache);
}

export function resetStore() {
  cache = emptyStore();
  seed(cache);
  saveStore();
}
