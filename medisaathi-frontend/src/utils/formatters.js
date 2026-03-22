
export const formatWaitTime = (minutes) => {
    if (!minutes || minutes <= 0) return 'Less than a minute';
    if (minutes < 60) return `~${Math.round(minutes)} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `~${hrs}h ${mins}m` : `~${hrs}h`;
  };
  
  export const formatTokenNumber = (seq) => {
    if (!seq) return '--';
    return `#${String(seq).padStart(3, '0')}`;
  };
  
  export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
    });
  };
  
  export const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour:   '2-digit',
      minute: '2-digit',
    });
  };
  
  export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  