export type Project = {
  id: string;
  name: string;
  org_id: string;
  created_at: string;
};

export type ApiKey = {
  id: string;
  project_id: string;
  key_prefix: string;
  status: "active" | "revoked" | string;
  created_at: string;
  last_used_at: string | null;
};

export type ApiKeyCreateResult = ApiKey & {
  raw_key: string;
};
