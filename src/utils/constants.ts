export const STORAGE_KEYS = {
  USER_INFO: 'protohub_user_info',
  TOKEN: 'protohub_token',
};

export const FILE_TYPE_MAP: Record<string, string> = {
  html: 'HTML',
  axure: 'Axure',
  pdf: 'PDF',
  drawio: 'Draw.io',
  zip: '压缩包',
  other: '其他',
};

export const SHARE_MODE_MAP: Record<string, string> = {
  public: '公开',
  password: '密码保护',
  private: '私密',
};

export const ROLE_MAP: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
};

export const STATUS_MAP: Record<string, string> = {
  active: '启用',
  disabled: '禁用',
};

export const FILE_EXTENSIONS: Record<string, string[]> = {
  html: ['.html', '.htm'],
  axure: ['.rp', '.rplib'],
  pdf: ['.pdf'],
  drawio: ['.drawio', '.drawio.xml', '.dio'],
};

export const MAX_FILE_SIZE = 500 * 1024 * 1024;
