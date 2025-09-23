// utils/gameUtils.js

// Állapot színek
export const getStatusColor = (status) => {
  switch (status) {
    case 'waiting': return 'text-yellow-400';
    case 'setup': return 'text-blue-400';
    case 'separate': return 'text-green-400';
    case 'together': return 'text-purple-400';
    case 'finished': return 'text-gray-400';
    default: return 'text-gray-400';
  }
};

// Állapot szövegek
export const getStatusText = (status) => {
  switch (status) {
    case 'waiting': return 'Várakozás játékosokra';
    case 'setup': return 'Készen áll az indításra';
    case 'separate': return 'Külön fázis';
    case 'together': return 'Közös fázis';
    case 'finished': return 'Befejezve';
    default: return status;
  }
};
