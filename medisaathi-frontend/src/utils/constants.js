export const ROLES = {
    SUPER_ADMIN:   'super_admin',
    OVERALL_ADMIN: 'overall_admin',
    BRANCH_ADMIN:  'branch_admin',
    STAFF:         'staff',
    PATIENT:       'patient',
  };
  
  export const TOKEN_STATUS = {
    WAITING:   'waiting',
    CALLED:    'called',
    SERVING:   'serving',
    COMPLETED: 'completed',
    SKIPPED:   'skipped',
    LEFT:      'left',
  };
  
  export const PROBLEM_TYPES = [
    { value: 'eye',     label: 'Eye' },
    { value: 'ent',     label: 'Ear / ENT' },
    { value: 'general', label: 'General / Fever' },
    { value: 'ortho',   label: 'Ortho / Bone' },
    { value: 'dental',  label: 'Dental' },
    { value: 'other',   label: 'Other' },
  ];
  
  export const TOKEN_STATUS_COLORS = {
    waiting:   'bg-blue-100 text-blue-700',
    called:    'bg-yellow-100 text-yellow-700',
    serving:   'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    skipped:   'bg-red-100 text-red-700',
    left:      'bg-gray-100 text-gray-600',
  };
  
  export const TOKEN_STATUS_LABELS = {
    waiting:   'Waiting',
    called:    'Your Turn!',
    serving:   'At Counter',
    completed: 'Served',
    skipped:   'Skipped',
    left:      'Left Queue',
  };